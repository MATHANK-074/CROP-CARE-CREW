/**
 * Validation Middleware
 * Centralized request validation for API endpoints
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Validate user ID from request
 * @param {string} source - Source of user ID ('body', 'query', 'params')
 * @returns {Function} Validation middleware
 */
function validateUserId(source = 'body') {
  return (req, res, next) => {
    const userId = req[source]?.userId || req[source]?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Store validated user ID for use in route handlers
    req.validatedUserId = userId;
    next();
  };
}

/**
 * Validate email address
 * @param {Function} req - Express request object
 * @param {Function} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateEmail(req, res, next) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email address is required'
    });
  }

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email address format'
    });
  }

  next();
}

/**
 * Validate location data
 * @param {Function} req - Express request object
 * @param {Function} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateLocation(req, res, next) {
  const { location } = req.body;

  if (!location || !location.coordinates) {
    return res.status(400).json({
      success: false,
      message: 'Location coordinates are required'
    });
  }

  const { coordinates } = location;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return res.status(400).json({
      success: false,
      message: 'Location coordinates must be an array of [longitude, latitude]'
    });
  }

  const [longitude, latitude] = coordinates;
  if (typeof longitude !== 'number' || typeof latitude !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'Location coordinates must be valid numbers'
    });
  }

  // Validate coordinate ranges
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    return res.status(400).json({
      success: false,
      message: 'Invalid coordinate ranges. Longitude: -180 to 180, Latitude: -90 to 90'
    });
  }

  next();
}

/**
 * Validate disease report data
 * @param {Function} req - Express request object
 * @param {Function} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateDiseaseReport(req, res, next) {
  const { disease, description } = req.body;

  if (!disease || disease.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Disease name is required'
    });
  }

  if (!description || description.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Disease description is required'
    });
  }

  // Validate disease name length
  if (disease.trim().length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Disease name must not exceed 100 characters'
    });
  }

  // Validate description length
  if (description.trim().length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Disease description must not exceed 500 characters'
    });
  }

  next();
}

/**
 * Validate alert ID
 * @param {Function} req - Express request object
 * @param {Function} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateAlertId(req, res, next) {
  const alertId = req.params.alertId || req.body.alertId;

  if (!alertId) {
    return res.status(400).json({
      success: false,
      message: 'Alert ID is required'
    });
  }

  // Basic MongoDB ObjectId validation
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(alertId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid alert ID format'
    });
  }

  req.validatedAlertId = alertId;
  next();
}

/**
 * Validate uploaded image
 * @param {Function} req - Express request object
 * @param {Function} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateImageUpload(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Image file is required'
    });
  }

  // Validate file type
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed'
    });
  }

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 5MB'
    });
  }

  next();
}

/**
 * Create multer middleware for image uploads
 * @returns {Object} Multer upload middleware
 */
function createImageUploadMiddleware() {
  // Ensure upload directory exists
  const uploadDir = path.join(__dirname, '..', 'uploads', 'disease-images');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `disease-${uniqueSuffix}${ext}`);
    }
  });

  return multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
      files: 1 // Only one file at a time
    },
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed'), false);
      }
    }
  });
}

/**
 * Handle multer upload errors
 * @param {Error} error - Multer error
 * @param {Function} req - Express request object
 * @param {Function} res - Express response object
 * @param {Function} next - Next middleware function
 */
function handleUploadError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file is allowed'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "image" as the field name'
      });
    }
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload error'
    });
  }

  next();
}

/**
 * Clean up uploaded file on error
 * @param {string} filePath - Path to the uploaded file
 */
function cleanupUploadedFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Cleaned up temporary file: ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to clean up file ${filePath}:`, error.message);
    }
  }
}

module.exports = {
  validateUserId,
  validateEmail,
  validateLocation,
  validateDiseaseReport,
  validateAlertId,
  validateImageUpload,
  createImageUploadMiddleware,
  handleUploadError,
  cleanupUploadedFile
};
