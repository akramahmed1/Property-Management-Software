import { PrismaClient, File } from '@prisma/client';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { logger } from '../utils/logger';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const prisma = new PrismaClient();

// AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'property-management-files';

export interface FileUploadOptions {
  folder: string;
  propertyId?: string;
  bookingId?: string;
  leadId?: string;
  customerId?: string;
  generateThumbnail?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
}

export interface FileMetadata {
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  folder: string;
  metadata?: Record<string, any>;
}

export class FileService {
  private static instance: FileService;
  private readonly UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  private constructor() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  public static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  /**
   * Configure multer for file uploads
   */
  getMulterConfig() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const folder = req.body.folder || 'general';
        const uploadPath = path.join(this.UPLOAD_DIR, folder);
        
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
      }
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (this.ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed`));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.MAX_FILE_SIZE
      }
    });
  }

  /**
   * Upload file to S3
   */
  async uploadToS3(file: Express.Multer.File, options: FileUploadOptions): Promise<FileMetadata> {
    try {
      const fileName = `${uuidv4()}-${file.originalname}`;
      const key = `${options.folder}/${fileName}`;

      // Upload original file
      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          folder: options.folder
        }
      });

      await s3Client.send(uploadCommand);

      const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

      let thumbnailUrl: string | undefined;

      // Generate thumbnail for images
      if (options.generateThumbnail && this.isImage(file.mimetype)) {
        try {
          const thumbnailKey = `${options.folder}/thumbnails/${fileName}`;
          const thumbnailBuffer = await this.generateThumbnail(file.buffer);

          const thumbnailCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: thumbnailKey,
            Body: thumbnailBuffer,
            ContentType: 'image/jpeg'
          });

          await s3Client.send(thumbnailCommand);
          thumbnailUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${thumbnailKey}`;
        } catch (error) {
          logger.warn('Failed to generate thumbnail:', error);
        }
      }

      return {
        originalName: file.originalname,
        fileName,
        fileSize: file.size,
        mimeType: file.mimetype,
        url: fileUrl,
        thumbnailUrl,
        folder: options.folder,
        metadata: {
          uploadedAt: new Date().toISOString(),
          propertyId: options.propertyId,
          bookingId: options.bookingId,
          leadId: options.leadId,
          customerId: options.customerId
        }
      };
    } catch (error) {
      logger.error('Error uploading file to S3:', error);
      throw error;
    }
  }

  /**
   * Upload file locally
   */
  async uploadLocally(file: Express.Multer.File, options: FileUploadOptions): Promise<FileMetadata> {
    try {
      const fileName = `${uuidv4()}-${file.originalname}`;
      const folderPath = path.join(this.UPLOAD_DIR, options.folder);
      const filePath = path.join(folderPath, fileName);

      // Ensure folder exists
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Write file
      fs.writeFileSync(filePath, file.buffer);

      const fileUrl = `/uploads/${options.folder}/${fileName}`;

      let thumbnailUrl: string | undefined;

      // Generate thumbnail for images
      if (options.generateThumbnail && this.isImage(file.mimetype)) {
        try {
          const thumbnailPath = path.join(folderPath, 'thumbnails', fileName);
          const thumbnailDir = path.dirname(thumbnailPath);

          if (!fs.existsSync(thumbnailDir)) {
            fs.mkdirSync(thumbnailDir, { recursive: true });
          }

          const thumbnailBuffer = await this.generateThumbnail(file.buffer);
          fs.writeFileSync(thumbnailPath, thumbnailBuffer);
          thumbnailUrl = `/uploads/${options.folder}/thumbnails/${fileName}`;
        } catch (error) {
          logger.warn('Failed to generate thumbnail:', error);
        }
      }

      return {
        originalName: file.originalname,
        fileName,
        fileSize: file.size,
        mimeType: file.mimetype,
        url: fileUrl,
        thumbnailUrl,
        folder: options.folder,
        metadata: {
          uploadedAt: new Date().toISOString(),
          propertyId: options.propertyId,
          bookingId: options.bookingId,
          leadId: options.leadId,
          customerId: options.customerId
        }
      };
    } catch (error) {
      logger.error('Error uploading file locally:', error);
      throw error;
    }
  }

  /**
   * Save file metadata to database
   */
  async saveFileMetadata(fileData: FileMetadata, userId: string): Promise<File> {
    try {
      const file = await prisma.file.create({
        data: {
          originalName: fileData.originalName,
          fileName: fileData.fileName,
          fileSize: fileData.fileSize,
          mimeType: fileData.mimeType,
          url: fileData.url,
          thumbnailUrl: fileData.thumbnailUrl,
          folder: fileData.folder,
          metadata: fileData.metadata,
          propertyId: fileData.metadata?.propertyId,
          bookingId: fileData.metadata?.bookingId,
          leadId: fileData.metadata?.leadId,
          customerId: fileData.metadata?.customerId
        }
      });

      logger.info(`File metadata saved: ${file.id}`);

      return file;
    } catch (error) {
      logger.error('Error saving file metadata:', error);
      throw error;
    }
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string): Promise<File | null> {
    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId }
      });

      return file;
    } catch (error) {
      logger.error('Error fetching file:', error);
      throw error;
    }
  }

  /**
   * Get files with filtering
   */
  async getFiles(filters: any = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        folder,
        propertyId,
        bookingId,
        leadId,
        customerId,
        mimeType
      } = filters;

      const where: any = {};

      if (folder) where.folder = folder;
      if (propertyId) where.propertyId = propertyId;
      if (bookingId) where.bookingId = bookingId;
      if (leadId) where.leadId = leadId;
      if (customerId) where.customerId = customerId;
      if (mimeType) where.mimeType = { contains: mimeType };

      const [files, total] = await Promise.all([
        prisma.file.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.file.count({ where })
      ]);

      return {
        files,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching files:', error);
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        throw new Error('File not found');
      }

      // Delete from S3 if URL contains S3
      if (file.url.includes('s3.amazonaws.com')) {
        try {
          const key = file.url.split('.com/')[1];
          const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
          });

          await s3Client.send(deleteCommand);

          // Delete thumbnail if exists
          if (file.thumbnailUrl && file.thumbnailUrl.includes('s3.amazonaws.com')) {
            const thumbnailKey = file.thumbnailUrl.split('.com/')[1];
            const deleteThumbnailCommand = new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: thumbnailKey
            });

            await s3Client.send(deleteThumbnailCommand);
          }
        } catch (error) {
          logger.warn('Failed to delete file from S3:', error);
        }
      } else {
        // Delete local file
        try {
          const filePath = path.join(this.UPLOAD_DIR, file.folder, file.fileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          // Delete thumbnail if exists
          if (file.thumbnailUrl) {
            const thumbnailPath = path.join(this.UPLOAD_DIR, file.folder, 'thumbnails', file.fileName);
            if (fs.existsSync(thumbnailPath)) {
              fs.unlinkSync(thumbnailPath);
            }
          }
        } catch (error) {
          logger.warn('Failed to delete local file:', error);
        }
      }

      // Delete from database
      await prisma.file.delete({
        where: { id: fileId }
      });

      logger.info(`File deleted: ${fileId} by user ${userId}`);

      return true;
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Generate signed URL for file access
   */
  async getSignedUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    try {
      const file = await this.getFileById(fileId);

      if (!file) {
        throw new Error('File not found');
      }

      // If it's an S3 file, generate signed URL
      if (file.url.includes('s3.amazonaws.com')) {
        const key = file.url.split('.com/')[1];
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key
        });

        return await getSignedUrl(s3Client, command, { expiresIn });
      }

      // For local files, return the URL as is
      return file.url;
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw error;
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats() {
    try {
      const [
        totalFiles,
        totalSize,
        filesByType,
        filesByFolder
      ] = await Promise.all([
        prisma.file.count(),
        prisma.file.aggregate({
          _sum: { fileSize: true }
        }),
        prisma.file.groupBy({
          by: ['mimeType'],
          _count: { mimeType: true },
          _sum: { fileSize: true }
        }),
        prisma.file.groupBy({
          by: ['folder'],
          _count: { folder: true },
          _sum: { fileSize: true }
        })
      ]);

      return {
        totalFiles,
        totalSize: totalSize._sum.fileSize || 0,
        filesByType: filesByType.reduce((acc, item) => {
          acc[item.mimeType] = {
            count: item._count.mimeType,
            size: item._sum.fileSize || 0
          };
          return acc;
        }, {} as Record<string, { count: number; size: number }>),
        filesByFolder: filesByFolder.reduce((acc, item) => {
          acc[item.folder] = {
            count: item._count.folder,
            size: item._sum.fileSize || 0
          };
          return acc;
        }, {} as Record<string, { count: number; size: number }>)
      };
    } catch (error) {
      logger.error('Error fetching file stats:', error);
      throw error;
    }
  }

  /**
   * Clean up orphaned files
   */
  async cleanupOrphanedFiles() {
    try {
      const orphanedFiles = await prisma.file.findMany({
        where: {
          AND: [
            { propertyId: null },
            { bookingId: null },
            { leadId: null },
            { customerId: null },
            { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // 30 days old
          ]
        }
      });

      let deletedCount = 0;

      for (const file of orphanedFiles) {
        try {
          await this.deleteFile(file.id, 'system');
          deletedCount++;
        } catch (error) {
          logger.warn(`Failed to delete orphaned file ${file.id}:`, error);
        }
      }

      logger.info(`Cleaned up ${deletedCount} orphaned files`);

      return { deletedCount };
    } catch (error) {
      logger.error('Error cleaning up orphaned files:', error);
      throw error;
    }
  }

  // Private helper methods

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
}

export default FileService;