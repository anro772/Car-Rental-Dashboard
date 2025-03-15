// src/routes/cars.js
const express = require('express');
const router = express.Router();

// GET all cars
router.get('/', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query('SELECT * FROM cars');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET a single car by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query(
            'SELECT * FROM cars WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET available cars
router.get('/status/available', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query(
            "SELECT * FROM cars WHERE status = 'available'"
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST new car
router.post('/', async (req, res) => {
    try {
        const {
            brand,
            model,
            year,
            license_plate,
            color,
            category,
            daily_rate,
            status,
            image_url,
            features
        } = req.body;

        const [result] = await req.app.locals.db.query(
            `INSERT INTO cars (
                brand, model, year, license_plate, color, 
                category, daily_rate, status, image_url, features
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                brand, model, year, license_plate, color,
                category, daily_rate, status || 'available', image_url, features
            ]
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Car created successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT/UPDATE car
router.put('/:id', async (req, res) => {
    try {
        const {
            brand,
            model,
            year,
            license_plate,
            color,
            category,
            daily_rate,
            status,
            image_url,
            features
        } = req.body;

        // Check if car exists
        const [existing] = await req.app.locals.db.query(
            'SELECT * FROM cars WHERE id = ?',
            [req.params.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }

        const [result] = await req.app.locals.db.query(
            `UPDATE cars SET 
                brand = ?, 
                model = ?, 
                year = ?, 
                license_plate = ?, 
                color = ?, 
                category = ?, 
                daily_rate = ?, 
                status = ?, 
                image_url = ?, 
                features = ?
            WHERE id = ?`,
            [
                brand, model, year, license_plate, color,
                category, daily_rate, status, image_url, features,
                req.params.id
            ]
        );

        res.json({
            message: 'Car updated successfully',
            affected: result.affectedRows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH car (update only provided fields)
router.patch('/:id', async (req, res) => {
    try {
        // Check if car exists
        const [existing] = await req.app.locals.db.query(
            'SELECT * FROM cars WHERE id = ?',
            [req.params.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }

        // Build dynamic update query
        const allowedFields = [
            'brand', 'model', 'year', 'license_plate', 'color',
            'category', 'daily_rate', 'status', 'image_url', 'features'
        ];

        const updates = [];
        const values = [];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        });

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        // Add id at the end for WHERE clause
        values.push(req.params.id);

        const [result] = await req.app.locals.db.query(
            `UPDATE cars SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({
            message: 'Car updated successfully',
            affected: result.affectedRows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE car
router.delete('/:id', async (req, res) => {
    try {
        // Check if car exists
        const [existing] = await req.app.locals.db.query(
            'SELECT * FROM cars WHERE id = ?',
            [req.params.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }

        // Check if car is currently in a rental
        const [activeRentals] = await req.app.locals.db.query(
            "SELECT * FROM rentals WHERE car_id = ? AND status IN ('pending', 'active')",
            [req.params.id]
        );

        if (activeRentals.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete car with active rentals',
                rentals: activeRentals
            });
        }

        const [result] = await req.app.locals.db.query(
            'DELETE FROM cars WHERE id = ?',
            [req.params.id]
        );

        res.json({
            message: 'Car deleted successfully',
            affected: result.affectedRows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET cars by category
router.get('/category/:category', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query(
            'SELECT * FROM cars WHERE category = ?',
            [req.params.category]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;