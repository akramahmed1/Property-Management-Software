import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { logger } from '../utils/logger';

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Common validation rules
export const commonValidations = {
  id: param('id').isUUID().withMessage('Invalid ID format'),
  email: body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  phone: body('phone').isMobilePhone('any').withMessage('Invalid phone number'),
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  name: body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  price: body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  area: body('area').isFloat({ min: 0 }).withMessage('Area must be a positive number'),
  page: query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  limit: query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  region: query('region').optional().isIn(['INDIA', 'UAE', 'SAUDI', 'QATAR']).withMessage('Invalid region')
};

// Property validation
export const validateProperty = [
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Property name must be 2-255 characters'),
  body('type').isIn(['APARTMENT', 'VILLA', 'HOUSE', 'PLOT', 'COMMERCIAL', 'OFFICE', 'SHOP', 'WAREHOUSE'])
    .withMessage('Invalid property type'),
  body('status').optional().isIn(['AVAILABLE', 'SOLD', 'RENTED', 'MAINTENANCE', 'DRAFT'])
    .withMessage('Invalid property status'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('area').isFloat({ min: 0 }).withMessage('Area must be a positive number'),
  body('bedrooms').optional().isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
  body('bathrooms').optional().isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative integer'),
  body('city').trim().isLength({ min: 2, max: 100 }).withMessage('City must be 2-100 characters'),
  body('state').trim().isLength({ min: 2, max: 100 }).withMessage('State must be 2-100 characters'),
  body('country').trim().isLength({ min: 2, max: 100 }).withMessage('Country must be 2-100 characters'),
  handleValidationErrors
];

// Lead validation
export const validateLead = [
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Lead name must be 2-255 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('phone').isMobilePhone('any').withMessage('Invalid phone number'),
  body('source').isIn(['WEBSITE', 'WHATSAPP', 'PHONE', 'EMAIL', 'REFERRAL', 'WALK_IN', 'SOCIAL_MEDIA', 'ADVERTISEMENT', 'OTHER'])
    .withMessage('Invalid lead source'),
  body('stage').optional().isIn(['ENQUIRY_RECEIVED', 'SITE_VISIT', 'PROPOSAL_SENT', 'NEGOTIATION', 'BOOKING', 'SOLD', 'LOST'])
    .withMessage('Invalid lead stage'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  handleValidationErrors
];

// Booking validation
export const validateBooking = [
  body('propertyId').isUUID().withMessage('Invalid property ID'),
  body('customerId').isUUID().withMessage('Invalid customer ID'),
  body('agentId').isUUID().withMessage('Invalid agent ID'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('advanceAmount').optional().isFloat({ min: 0 }).withMessage('Advance amount must be a positive number'),
  body('stage').optional().isIn(['SOLD', 'TENTATIVELY_BOOKED', 'CONFIRMED', 'CANCELLED'])
    .withMessage('Invalid booking stage'),
  body('paymentMethod').optional().isIn(['UPI', 'CARD', 'NET_BANKING', 'WALLET', 'CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE'])
    .withMessage('Invalid payment method'),
  handleValidationErrors
];

// Company validation
export const validateCompany = [
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Company name must be 2-255 characters'),
  body('region').isIn(['INDIA', 'UAE', 'SAUDI', 'QATAR']).withMessage('Invalid region'),
  body('currency').isIn(['INR', 'AED', 'SAR', 'QAR']).withMessage('Invalid currency'),
  body('taxRate').isFloat({ min: 0, max: 1 }).withMessage('Tax rate must be between 0 and 1'),
  handleValidationErrors
];

// Project validation
export const validateProject = [
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Project name must be 2-255 characters'),
  body('status').optional().isIn(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'])
    .withMessage('Invalid project status'),
  body('totalUnits').isInt({ min: 0 }).withMessage('Total units must be a non-negative integer'),
  body('city').trim().isLength({ min: 2, max: 100 }).withMessage('City must be 2-100 characters'),
  body('state').trim().isLength({ min: 2, max: 100 }).withMessage('State must be 2-100 characters'),
  body('country').trim().isLength({ min: 2, max: 100 }).withMessage('Country must be 2-100 characters'),
  handleValidationErrors
];

// Tax calculation validation
export const validateTaxCalculation = [
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('region').isIn(['INDIA', 'UAE', 'SAUDI', 'QATAR']).withMessage('Invalid region'),
  handleValidationErrors
];

// Pagination validation
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('sort').optional().isString().withMessage('Sort must be a string'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  handleValidationErrors
];

// Search validation
export const validateSearch = [
  query('search').optional().isString().isLength({ min: 1, max: 100 }).withMessage('Search must be 1-100 characters'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid date'),
  handleValidationErrors
];

// File upload validation
export const validateFileUpload = (allowedTypes: string[], maxSize: number) => [
  body('file').custom((value, { req }) => {
    if (!req.file) {
      throw new Error('File is required');
    }
    
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new Error(`File type must be one of: ${allowedTypes.join(', ')}`);
    }
    
    if (req.file.size > maxSize) {
      throw new Error(`File size must be less than ${maxSize} bytes`);
    }
    
    return true;
  }),
  handleValidationErrors
];

// Sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize string inputs
  const sanitizeString = (str: string) => {
    return str.trim().replace(/[<>]/g, '');
  };

  // Recursively sanitize object
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Rate limiting validation
export const validateRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const rateLimitInfo = (req as any).rateLimit;
  if (rateLimitInfo && rateLimitInfo.remaining === 0) {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil(rateLimitInfo.resetTime / 1000)
    });
  }
  next();
};

// Security headers validation
export const validateSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious headers
  const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-cluster-client-ip'];
  const hasSuspiciousHeaders = suspiciousHeaders.some(header => req.headers[header]);
  
  if (hasSuspiciousHeaders) {
    logger.warn(`Suspicious headers detected for IP: ${req.ip}`);
  }

  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type must be application/json'
      });
    }
  }

  next();
};
