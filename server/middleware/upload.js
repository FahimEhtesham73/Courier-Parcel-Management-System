const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (base64 conversion)
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, GIF, and WebP image files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for better image support
  },
  fileFilter: fileFilter,
});

// Middleware to convert uploaded files to base64
const convertToBase64 = (req, res, next) => {
  if (req.files) {
    const documents = {};
    
    Object.keys(req.files).forEach(fieldName => {
      const file = req.files[fieldName][0];
      if (file) {
        documents[fieldName] = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }
    });
    
    req.body.documents = documents;
  }
  next();
};

module.exports = { upload, convertToBase64 };