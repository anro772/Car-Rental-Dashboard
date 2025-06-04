// src/routes/cars.js - Updated with technical specifications and better error handling
const express = require('express');
const router = express.Router();

// GET technical sheet for a specific car
router.get('/:id/technical-sheet', async (req, res) => {
    try {
        const [car] = await req.app.locals.db.query(
            `SELECT 
                c.*,
                COUNT(DISTINCT r.id) as total_rentals,
                MAX(r.end_km) as last_recorded_km
            FROM cars c
            LEFT JOIN rentals r ON c.id = r.car_id
            WHERE c.id = ?
            GROUP BY c.id`,
            [req.params.id]
        );

        if (car.length === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }

        res.json(car[0]);
    } catch (error) {
        console.error('Error fetching technical sheet:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update technical data for a car
router.patch('/:id/technical', async (req, res) => {
    try {
        const {
            kilometers,
            fuel_level,
            fuel_type,
            engine_size,
            transmission_type,
            seats_count,
            doors_count,
            tank_capacity,
            vin_number,
            registration_date,
            last_service_date,
            last_service_km,
            next_service_km,
            insurance_expiry,
            itp_expiry,
            notes,
            admin_id
        } = req.body;

        console.log('Received technical update request for car:', req.params.id);
        console.log('Update data:', req.body);

        // Check if car exists
        const [existing] = await req.app.locals.db.query(
            'SELECT * FROM cars WHERE id = ?',
            [req.params.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }

        // Build update query dynamically for cars table
        const updates = [];
        const values = [];

        const allowedFields = {
            kilometers: kilometers,
            fuel_level: fuel_level,
            fuel_type: fuel_type,
            engine_size: engine_size,
            transmission_type: transmission_type,
            seats_count: seats_count,
            doors_count: doors_count,
            tank_capacity: tank_capacity,
            vin_number: vin_number,
            registration_date: registration_date,
            last_service_date: last_service_date,
            last_service_km: last_service_km,
            next_service_km: next_service_km,
            insurance_expiry: insurance_expiry,
            itp_expiry: itp_expiry
        };

        Object.entries(allowedFields).forEach(([field, value]) => {
            if (value !== undefined && value !== null) {
                updates.push(`${field} = ?`);
                values.push(value);
            }
        });

        if (updates.length > 0) {
            // Update the car
            values.push(req.params.id);
            const updateQuery = `UPDATE cars SET ${updates.join(', ')} WHERE id = ?`;
            console.log('Executing update query:', updateQuery);
            console.log('With values:', values);

            await req.app.locals.db.query(updateQuery, values);

            // Try to log the technical update in history (optional - won't fail if table doesn't exist)
            if (kilometers !== undefined || fuel_level !== undefined) {
                try {
                    await req.app.locals.db.query(
                        `INSERT INTO car_technical_history 
                        (car_id, kilometers, fuel_level, notes, updated_by, created_at) 
                        VALUES (?, ?, ?, ?, ?, NOW())`,
                        [
                            req.params.id,
                            kilometers !== undefined ? kilometers : existing[0].kilometers,
                            fuel_level !== undefined ? fuel_level : existing[0].fuel_level,
                            notes || null,
                            admin_id || null
                        ]
                    );
                } catch (historyError) {
                    console.warn('Could not log to technical history (table might not exist):', historyError.message);
                    // Continue without failing - history logging is optional
                }
            }
        }

        res.json({
            message: 'Technical data updated successfully',
            updatedFields: Object.keys(allowedFields).filter(key => allowedFields[key] !== undefined)
        });
    } catch (error) {
        console.error('Error updating technical data:', error);
        res.status(500).json({
            error: error.message,
            details: 'Check server logs for more information'
        });
    }
});

// Get technical history for a car
router.get('/:id/technical-history', async (req, res) => {
    try {
        // First check if the table exists
        const [history] = await req.app.locals.db.query(
            `SELECT 
                cth.*,
                a.name as updated_by_name
            FROM car_technical_history cth
            LEFT JOIN admins a ON cth.updated_by = a.id
            WHERE cth.car_id = ?
            ORDER BY cth.created_at DESC
            LIMIT 50`,
            [req.params.id]
        );

        res.json(history);
    } catch (error) {
        console.error('Error fetching technical history:', error);
        // If table doesn't exist, return empty array
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.json([]);
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

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

// GET pending cars
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

// GET rented cars
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

// GET maintenance cars
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

// Direct endpoint to update car status
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

// POST new car with technical specifications
router.post('/', async (req, res) => {
    try {
        const {
            brand, model, year, license_plate, color, category, daily_rate,
            status, image_url, features,
            // Technical specifications
            kilometers, fuel_type, fuel_level, engine_size, transmission_type,
            seats_count, doors_count, tank_capacity, vin_number,
            registration_date, insurance_expiry, itp_expiry
        } = req.body;

        const [result] = await req.app.locals.db.query(
            `INSERT INTO cars (
                brand, model, year, license_plate, color, category, daily_rate, 
                status, image_url, features, kilometers, fuel_type, fuel_level,
                engine_size, transmission_type, seats_count, doors_count, 
                tank_capacity, vin_number, registration_date, insurance_expiry, itp_expiry
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                brand, model, year, license_plate, color, category, daily_rate,
                status || 'available', image_url, features,
                kilometers || 0, fuel_type || 'benzina', fuel_level || 100,
                engine_size, transmission_type || 'manual', seats_count || 5,
                doors_count || 4, tank_capacity || 50, vin_number,
                registration_date, insurance_expiry, itp_expiry
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

// Update similar car images
router.post('/update-similar-images', async (req, res) => {
    const { brand, model, year, image_url } = req.body;

    if (!brand || !model || !year || !image_url) {
        return res.status(400).json({ error: 'Brand, model, year, and image_url are required' });
    }

    try {
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

// PUT/UPDATE car with technical specifications
router.put('/:id', async (req, res) => {
    try {
        const {
            brand, model, year, license_plate, color, category, daily_rate,
            status, image_url, features,
            // Technical specifications
            kilometers, fuel_type, fuel_level, engine_size, transmission_type,
            seats_count, doors_count, tank_capacity, vin_number,
            registration_date, insurance_expiry, itp_expiry
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
                brand = ?, model = ?, year = ?, license_plate = ?, color = ?, 
                category = ?, daily_rate = ?, status = ?, image_url = ?, features = ?,
                kilometers = ?, fuel_type = ?, fuel_level = ?, engine_size = ?,
                transmission_type = ?, seats_count = ?, doors_count = ?, tank_capacity = ?,
                vin_number = ?, registration_date = ?, insurance_expiry = ?, itp_expiry = ?
            WHERE id = ?`,
            [
                brand, model, year, license_plate, color, category, daily_rate,
                status, image_url, features, kilometers, fuel_type, fuel_level,
                engine_size, transmission_type, seats_count, doors_count,
                tank_capacity, vin_number, registration_date, insurance_expiry,
                itp_expiry, req.params.id
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

// PATCH car (update only provided fields including technical specs)
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
            'category', 'daily_rate', 'status', 'image_url', 'features',
            // Technical fields
            'kilometers', 'fuel_type', 'fuel_level', 'engine_size',
            'transmission_type', 'seats_count', 'doors_count', 'tank_capacity',
            'vin_number', 'registration_date', 'insurance_expiry', 'itp_expiry',
            'last_service_date', 'last_service_km', 'next_service_km'
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