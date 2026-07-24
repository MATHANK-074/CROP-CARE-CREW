/**
 * File Utilities
 * Common file handling operations for the application
 */

const fs = require('fs');
const path = require('path');

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath - Directory path to create
 * @returns {boolean} True if directory was created or already exists
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dirPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to create directory ${dirPath}:`, error.message);
      return false;
    }
  }
  return true;
}

/**
 * Safely delete a file
 * @param {string} filePath - File path to delete
 * @returns {boolean} True if file was deleted successfully
 */
function safeDeleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete file ${filePath}:`, error.message);
      return false;
    }
  }
  return true; // File doesn't exist, consider it "successfully deleted"
}

/**
 * Get file extension from filename
 * @param {string} filename - Filename or path
 * @returns {string} File extension (including dot)
 */
function getFileExtension(filename) {
  return path.extname(filename).toLowerCase();
}

/**
 * Check if file is a valid image
 * @param {string} filePath - Path to the file
 * @param {string} mimeType - MIME type of the file
 * @returns {boolean} True if file is a valid image
 */
function isValidImage(filePath, mimeType) {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const validMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  const extension = getFileExtension(filePath);
  return validExtensions.includes(extension) && validMimeTypes.includes(mimeType);
}

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @param {string} prefix - Prefix for the filename
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalName, prefix = 'file') {
  const extension = getFileExtension(originalName);
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  return `${prefix}-${timestamp}-${random}${extension}`;
}

/**
 * Get file size in a human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Human-readable file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Read file as Buffer
 * @param {string} filePath - Path to the file
 * @returns {Buffer} File buffer
 */
function readFileBuffer(filePath) {
  try {
    return fs.readFileSync(filePath);
  } catch (error) {
    console.error(`❌ Failed to read file ${filePath}:`, error.message);
    throw new Error(`Unable to read file: ${error.message}`);
  }
}

/**
 * Setup upload directories for the application
 * @param {string} baseUploadDir - Base upload directory path
 * @returns {Object} Created directories
 */
function setupUploadDirectories(baseUploadDir) {
  const directories = {
    base: baseUploadDir,
    diseaseImages: path.join(baseUploadDir, 'disease-images'),
    profiles: path.join(baseUploadDir, 'profiles'),
    crops: path.join(baseUploadDir, 'crops'),
    temp: path.join(baseUploadDir, 'temp')
  };

  Object.values(directories).forEach(dir => {
    ensureDirectoryExists(dir);
  });

  console.log('📁 Upload directories setup completed');
  return directories;
}

/**
 * Clean up temporary files older than specified age
 * @param {string} tempDir - Temporary directory path
 * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
 */
function cleanupTempFiles(tempDir, maxAge = 60 * 60 * 1000) {
  if (!fs.existsSync(tempDir)) return;

  try {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    let cleanedCount = 0;

    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtime.getTime() > maxAge) {
        safeDeleteFile(filePath);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} temporary files`);
    }
  } catch (error) {
    console.error('❌ Failed to cleanup temp files:', error.message);
  }
}

module.exports = {
  ensureDirectoryExists,
  safeDeleteFile,
  getFileExtension,
  isValidImage,
  generateUniqueFilename,
  formatFileSize,
  readFileBuffer,
  setupUploadDirectories,
  cleanupTempFiles
};