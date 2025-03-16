// src/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Path to your frontend assets folder
        const uploadDir = path.join(__dirname, '../../../frontend/src/assets/cars');

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    // src/routes/upload.js (update only the filename function)
    filename: function (req, file, cb) {
        // Check if the originalname is already in the format we want
        if (file.originalname.includes('-')) {
            // Use the original filename if it appears to be in the format we want
            cb(null, file.originalname);
        } else {
            // Generate filename based on brand and model without timestamp
            const brand = req.body.brand || 'car';
            const model = req.body.model || 'model';
            const ext = path.extname(file.originalname);

            const safeBrand = brand.replace(/\s+/g, '-').toLowerCase();
            const safeModel = model.replace(/\s+/g, '-').toLowerCase();

            cb(null, `${safeBrand}-${safeModel}${ext}`);
        }
    }
});

// Set up file filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Initialize upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST endpoint for file upload
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Return the relative path that can be used in the image_url field
        const relativePath = `src/assets/cars/${req.file.filename}`;

        res.json({
            success: true,
            filePath: relativePath
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;