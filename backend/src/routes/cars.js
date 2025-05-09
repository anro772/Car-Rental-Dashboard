// src/routes/cars.js
const express = require('express');
const router = express.Router();

// *** IMPORTANT: Route order matters in Express! ***
// Make sure specific routes come before parameterized routes

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

// GET pending cars (new route)
router.get('/status/pending', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query(
            "SELECT * FROM cars WHERE status = 'pending'"
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET rented cars (new route)
router.get('/status/rented', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query(
            "SELECT * FROM cars WHERE status = 'rented'"
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET maintenance cars (new route)
router.get('/status/maintenance', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query(
            "SELECT * FROM cars WHERE status = 'maintenance'"
        );
        res.json(rows);
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

// NEW: Direct endpoint to update car status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        // Validate status
        const validStatuses = ['available', 'rented', 'maintenance', 'pending'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Check if car exists
        const [existing] = await req.app.locals.db.query(
            'SELECT * FROM cars WHERE id = ?',
            [req.params.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }

        // Update the status
        const [result] = await req.app.locals.db.query(
            'UPDATE cars SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        res.json({
            message: `Car status updated to "${status}" successfully`,
            affected: result.affectedRows,
            car_id: req.params.id,
            new_status: status
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

router.post('/update-similar-images', async (req, res) => {
    const { brand, model, year, image_url } = req.body;

    // Validate required fields
    if (!brand || !model || !year || !image_url) {
        return res.status(400).json({ error: 'Brand, model, year, and image_url are required' });
    }

    try {
        // Update all cars with the same brand, model, and year
        const [result] = await req.app.locals.db.query(
            'UPDATE cars SET image_url = ? WHERE brand = ? AND model = ? AND year = ?',
            [image_url, brand, model, year]
        );

        res.json({
            message: `Successfully updated image for ${result.affectedRows} cars`,
            affected: result.affectedRows
        });
    } catch (error) {
        console.error('Error updating similar cars:', error);
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

module.exports = router;