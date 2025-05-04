// src/routes/customers.js - Update to handle license image and verification

const express = require('express');
const router = express.Router();

// GET all customers
router.get('/', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query('SELECT * FROM customers');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET a single customer by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query(
            'SELECT * FROM customers WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET active customers
router.get('/status/active', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query(
            "SELECT * FROM customers WHERE status = 'active'"
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET inactive customers
router.get('/status/inactive', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query(
            "SELECT * FROM customers WHERE status = 'inactive'"
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET customers with verified licenses
router.get('/license/verified', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query(
            "SELECT * FROM customers WHERE license_verified = TRUE"
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET customers with unverified licenses
router.get('/license/unverified', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query(
            "SELECT * FROM customers WHERE license_image_url IS NOT NULL AND license_verified = FALSE"
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET customers with current rentals
router.get('/with-rentals/current', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query(`
            SELECT DISTINCT c.* 
            FROM customers c
            JOIN rentals r ON c.id = r.customer_id
            WHERE r.status = 'active'
            ORDER BY c.last_name, c.first_name
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create a new customer
router.post('/', async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            address,
            driver_license,
            license_image_url,
            license_verified,
            status
        } = req.body;

        if (!first_name || !last_name || !email) {
            return res.status(400).json({ error: 'First name, last name, and email are required' });
        }

        const [result] = await req.app.locals.db.query(
            `INSERT INTO customers 
            (first_name, last_name, email, phone, address, driver_license, license_image_url, license_verified, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                first_name,
                last_name,
                email,
                phone,
                address,
                driver_license,
                license_image_url || null,
                license_verified || false,
                status || 'active'
            ]
        );

        res.status(201).json({
            id: result.insertId,
            first_name,
            last_name,
            email,
            phone,
            address,
            driver_license,
            license_image_url,
            license_verified: license_verified || false,
            status: status || 'active'
        });
    } catch (error) {
        // Handle duplicate email error specifically
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email address already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// PUT update an existing customer
router.put('/:id', async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            address,
            driver_license,
            license_image_url,
            license_verified,
            status
        } = req.body;

        // Check if customer exists
        const [existingCustomer] = await req.app.locals.db.query(
            'SELECT * FROM customers WHERE id = ?',
            [req.params.id]
        );

        if (existingCustomer.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        await req.app.locals.db.query(
            `UPDATE customers 
            SET first_name = ?, last_name = ?, email = ?, phone = ?, 
                address = ?, driver_license = ?, license_image_url = ?, license_verified = ?, status = ? 
            WHERE id = ?`,
            [
                first_name || existingCustomer[0].first_name,
                last_name || existingCustomer[0].last_name,
                email || existingCustomer[0].email,
                phone !== undefined ? phone : existingCustomer[0].phone,
                address !== undefined ? address : existingCustomer[0].address,
                driver_license !== undefined ? driver_license : existingCustomer[0].driver_license,
                license_image_url !== undefined ? license_image_url : existingCustomer[0].license_image_url,
                license_verified !== undefined ? license_verified : existingCustomer[0].license_verified,
                status || existingCustomer[0].status,
                req.params.id
            ]
        );

        // Get and return the updated customer
        const [updatedCustomer] = await req.app.locals.db.query(
            'SELECT * FROM customers WHERE id = ?',
            [req.params.id]
        );

        res.json(updatedCustomer[0]);
    } catch (error) {
        // Handle duplicate email error
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email address already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// PATCH update license verification status
router.patch('/:id/verify-license', async (req, res) => {
    try {
        const { license_verified } = req.body;

        if (license_verified === undefined) {
            return res.status(400).json({ error: 'License verification status is required' });
        }

        // Check if customer exists
        const [existingCustomer] = await req.app.locals.db.query(
            'SELECT * FROM customers WHERE id = ?',
            [req.params.id]
        );

        if (existingCustomer.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        await req.app.locals.db.query(
            `UPDATE customers SET license_verified = ? WHERE id = ?`,
            [license_verified, req.params.id]
        );

        // Get and return the updated customer
        const [updatedCustomer] = await req.app.locals.db.query(
            'SELECT * FROM customers WHERE id = ?',
            [req.params.id]
        );

        res.json(updatedCustomer[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE a customer
router.delete('/:id', async (req, res) => {
    try {
        // Check if customer has active rentals
        const [activeRentals] = await req.app.locals.db.query(
            `SELECT COUNT(*) as count FROM rentals 
            WHERE customer_id = ? AND status IN ('active', 'pending')`,
            [req.params.id]
        );

        if (activeRentals[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete customer with active or pending rentals'
            });
        }

        // Check if customer exists
        const [existingCustomer] = await req.app.locals.db.query(
            'SELECT * FROM customers WHERE id = ?',
            [req.params.id]
        );

        if (existingCustomer.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        await req.app.locals.db.query(
            'DELETE FROM customers WHERE id = ?',
            [req.params.id]
        );

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// SEARCH customers by name or email
router.get('/search/:query', async (req, res) => {
    try {
        const searchQuery = `%${req.params.query}%`;

        const [rows] = await req.app.locals.db.query(
            `SELECT * FROM customers 
            WHERE first_name LIKE ? 
            OR last_name LIKE ? 
            OR email LIKE ?
            ORDER BY last_name, first_name`,
            [searchQuery, searchQuery, searchQuery]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;