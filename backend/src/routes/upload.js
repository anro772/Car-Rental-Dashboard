// src/routes/upload.js - Updates to handle license images
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine the upload directory based on query parameter
        let uploadDir;

        if (req.query.type === 'license') {
            // License images go to licenses folder
            uploadDir = path.join(__dirname, '../../../frontend/src/assets/licenses');
        } else {
            // Car images go to cars folder (default)
            uploadDir = path.join(__dirname, '../../../frontend/src/assets/cars');
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate filename based on upload type
        if (req.query.type === 'license') {
            const firstName = req.body.first_name || 'unknown';
            const lastName = req.body.last_name || 'customer';
            const timestamp = Date.now();
            const ext = path.extname(file.originalname);

            const safeFirstName = firstName.replace(/\s+/g, '-').toLowerCase();
            const safeLastName = lastName.replace(/\s+/g, '-').toLowerCase();

            cb(null, `license-${safeFirstName}-${safeLastName}-${timestamp}${ext}`);
        } else {
            // Handle car images as before
            if (file.originalname.includes('-')) {
                // Use the original filename
                cb(null, file.originalname);
            } else {
                // Generate filename for car
                const brand = req.body.brand || 'car';
                const model = req.body.model || 'model';
                const ext = path.extname(file.originalname);

                const safeBrand = brand.replace(/\s+/g, '-').toLowerCase();
                const safeModel = model.replace(/\s+/g, '-').toLowerCase();

                cb(null, `${safeBrand}-${safeModel}${ext}`);
            }
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

// POST endpoint for file upload (handles both car and license images)
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Determine the relative path based on upload type
        let relativePath;
        if (req.query.type === 'license') {
            relativePath = `src/assets/licenses/${req.file.filename}`;
        } else {
            relativePath = `src/assets/cars/${req.file.filename}`;
        }

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