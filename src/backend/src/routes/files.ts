import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { Request, Response } from 'express';
import multer from 'multer';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File management operations
 */

// Upload property images
router.post('/property/:propertyId/images', authenticate, authorize('SUPER_ADMIN', 'MANAGER', 'AGENT'), async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const fileService = req.app.get('fileService');

    // Configure multer for property images
    const upload = fileService.getMulterConfig({
      bucket: process.env.AWS_S3_BUCKET || 'property-management-files',
      folder: `properties/${propertyId}`,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSize: 10 * 1024 * 1024, // 10MB
      generateThumbnail: true,
      watermark: true,
    });

    upload.array('images', 10)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message,
        });
      }

      try {
        const files = req.files as Express.Multer.File[];
        const uploadedFiles = await fileService.uploadPropertyImages(propertyId, files);

        res.json({
          success: true,
          data: uploadedFiles,
          message: `${uploadedFiles.length} images uploaded successfully`,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to upload property images',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload property images',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Upload document
router.post('/:entityType/:entityId/document', authenticate, async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { documentType } = req.body;

    if (!['property', 'booking', 'lead', 'customer'].includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity type',
      });
    }

    const fileService = req.app.get('fileService');

    // Configure multer for documents
    const upload = fileService.getMulterConfig({
      bucket: process.env.AWS_S3_BUCKET || 'property-management-files',
      folder: `${entityType}s/${entityId}/documents`,
      allowedTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      maxSize: 20 * 1024 * 1024, // 20MB
      generateThumbnail: false,
      watermark: false,
    });

    upload.single('document')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message,
        });
      }

      try {
        const file = req.file;
        if (!file) {
          return res.status(400).json({
            success: false,
            message: 'No file provided',
          });
        }

        const uploadedFile = await fileService.uploadDocument(
          entityType as 'property' | 'booking' | 'lead' | 'customer',
          entityId,
          file,
          documentType
        );

        res.json({
          success: true,
          data: uploadedFile,
          message: 'Document uploaded successfully',
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to upload document',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get file by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const fileService = req.app.get('fileService');
    const file = await fileService.getFile(id);

    res.json({
      success: true,
      data: file,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get file',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get files by folder
router.get('/folder/:folder', authenticate, async (req: Request, res: Response) => {
  try {
    const { folder } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const fileService = req.app.get('fileService');
    const result = await fileService.getFilesByFolder(
      folder,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get files by folder',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Generate signed URL for private files
router.get('/:id/signed-url', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { expiresIn = 3600 } = req.query;

    const fileService = req.app.get('fileService');
    const signedUrl = await fileService.generateSignedUrl(
      id,
      parseInt(expiresIn as string)
    );

    res.json({
      success: true,
      data: { signedUrl },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate signed URL',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete file
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const fileService = req.app.get('fileService');
    await fileService.deleteFile(id);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get file statistics
router.get('/stats/overview', authenticate, authorize('SUPER_ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const fileService = req.app.get('fileService');
    const stats = await fileService.getFileStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get file statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Cleanup old files
router.post('/cleanup', authenticate, authorize('SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { daysOld = 30 } = req.body;

    const fileService = req.app.get('fileService');
    const deletedCount = await fileService.cleanupOldFiles(daysOld);

    res.json({
      success: true,
      data: { deletedCount },
      message: `${deletedCount} old files cleaned up`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old files',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
