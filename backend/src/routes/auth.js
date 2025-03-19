// src/routes/auth.js
const express = require('express');
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find admin by email
        const [admins] = await req.app.locals.db.query(
            'SELECT * FROM admins WHERE email = ?',
            [email]
        );

        // Check if admin exists
        if (admins.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const admin = admins[0];

        // In a real app, you would hash and compare passwords
        // For simplicity, we're doing a direct comparison
        if (password !== admin.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create a simple auth token (in a real app, use JWT)
        const token = Buffer.from(`${admin.id}:${admin.email}:${Date.now()}`).toString('base64');

        // Send back the admin info and token
        res.json({
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current admin info
router.get('/me', async (req, res) => {
    try {
        // In a real app, verify the token
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];

        // Decode the token (simple implementation)
        const decoded = Buffer.from(token, 'base64').toString().split(':');
        const adminId = decoded[0];

        // Get admin data
        const [admins] = await req.app.locals.db.query(
            'SELECT id, email, name, role FROM admins WHERE id = ?',
            [adminId]
        );

        if (admins.length === 0) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        res.json({
            admin: admins[0]
        });
    } catch (error) {
        console.error('Error getting admin info:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;