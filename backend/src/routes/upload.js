// src/routes/upload.js - Corrected filename format for car images
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
        console.log('Upload query params:', req.query);

        // Generate filename based on upload type
        if (req.query.type === 'license') {
            // Handle license file naming
            const firstName = req.query.first_name || 'unknown';
            const lastName = req.query.last_name || 'customer';
            const licenseCode = req.query.license_code || 'nolicense';
            const ext = path.extname(file.originalname);

            const safeFirstName = firstName.replace(/\s+/g, '-').toLowerCase();
            const safeLastName = lastName.replace(/\s+/g, '-').toLowerCase();
            const safeLicenseCode = licenseCode.replace(/\s+/g, '').toUpperCase();

            const filename = `license-${safeFirstName}-${safeLastName}-${safeLicenseCode}${ext}`;
            console.log('Generated license filename:', filename);

            cb(null, filename);
        } else if (req.query.type === 'car') {
            // Handle car file naming with brand-model-year-color.ext format
            const brand = req.query.brand || 'unknown';
            const model = req.query.model || 'model';
            const year = req.query.year || new Date().getFullYear();
            const color = req.query.color || '';
            const ext = path.extname(file.originalname);

            const safeBrand = brand.replace(/\s+/g, '-').toLowerCase();
            const safeModel = model.replace(/\s+/g, '-').toLowerCase();
            const safeColor = color.replace(/\s+/g, '-').toLowerCase();

            // Create filename with optional color
            let filename;
            if (safeColor) {
                filename = `${safeBrand}-${safeModel}-${year}-${safeColor}${ext}`;
            } else {
                filename = `${safeBrand}-${safeModel}-${year}${ext}`;
            }

            console.log('Generated car filename:', filename);
            cb(null, filename);
        } else {
            // Handle other file uploads with timestamp
            const timestamp = Date.now();
            const ext = path.extname(file.originalname);
            cb(null, `upload-${timestamp}${ext}`);
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

        console.log('Upload successful, returning path:', relativePath);

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