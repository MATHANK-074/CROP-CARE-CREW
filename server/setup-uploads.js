const fs = require('fs');
const path = require('path');

// Define paths for upload directories
const uploadsDir = path.join(__dirname, 'uploads');
const diseaseImagesDir = path.join(uploadsDir, 'disease-images');

// Create directories if they don't exist
function createDirIfNotExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Directory created: ${dirPath}`);
  } else {
    console.log(`Directory already exists: ${dirPath}`);
  }
}

// Create the directories
try {
  createDirIfNotExists(uploadsDir);
  createDirIfNotExists(diseaseImagesDir);
  console.log('Upload directories setup completed successfully.');
} catch (error) {
  console.error('Error setting up upload directories:', error);
}