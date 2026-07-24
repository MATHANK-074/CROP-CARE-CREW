/**
 * Response Utilities
 * Standardized response helpers for API endpoints
 */

/**
 * Send successful response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {*} error - Additional error details
 */
function sendError(res, message = 'Internal server error', statusCode = 500, error = null) {
  const response = {
    success: false,
    message
  };

  // Include error details in development environment
  if (error && process.env.NODE_ENV === 'development') {
    response.error = error;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {string|Array} errors - Validation errors
 */
function sendValidationError(res, errors) {
  const message = Array.isArray(errors) ? errors.join(', ') : errors;
  return sendError(res, `Validation error: ${message}`, 400);
}

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name that was not found
 */
function sendNotFound(res, resource = 'Resource') {
  return sendError(res, `${resource} not found`, 404);
}

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Custom unauthorized message
 */
function sendUnauthorized(res, message = 'Unauthorized access') {
  return sendError(res, message, 401);
}

/**
 * Send forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Custom forbidden message
 */
function sendForbidden(res, message = 'Access forbidden') {
  return sendError(res, message, 403);
}

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Paginated data
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 */
function sendPaginated(res, data, pagination, message = 'Success') {
  return sendSuccess(res, {
    items: data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || 0,
      pages: Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
      hasNext: pagination.hasNext || false,
      hasPrev: pagination.hasPrev || false
    }
  }, message);
}

/**
 * Handle async route errors
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped route handler with error handling
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create standardized error handler middleware
 * @returns {Function} Error handling middleware
 */
function createErrorHandler() {
  return (error, req, res, next) => {
    console.error('API Error:', error);

    // Handle specific error types
    if (error.name === 'ValidationError') {
      return sendValidationError(res, Object.values(error.errors).map(e => e.message));
    }

    if (error.name === 'CastError') {
      return sendError(res, 'Invalid ID format', 400);
    }

    if (error.code === 11000) {
      return sendError(res, 'Duplicate field value', 400);
    }

    if (error.name === 'JsonWebTokenError') {
      return sendUnauthorized(res, 'Invalid token');
    }

    if (error.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Token expired');
    }

    // Default server error
    return sendError(res, 'Internal server error', 500, error.message);
  };
}

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendPaginated,
  asyncHandler,
  createErrorHandler
};