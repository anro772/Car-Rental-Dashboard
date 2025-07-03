// src/routes/cars.js - MINIMAL changes - only technical sheet endpoints
const express = require('express');
const router = express.Router();

// Helper function to format dates consistently (YYYY-MM-DD) - ONLY for technical sheet
const formatDateForDB = (dateString) => {
    if (!dateString) return null;
    try {
        // Ensure we get a consistent YYYY-MM-DD format
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;

        // Get the date parts in local timezone to avoid offset issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    } catch {
        return null;
    }
};

// GET technical sheet for a specific car - MODIFIED for date fix
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

        // Format dates properly for frontend - ONLY for technical sheet
        const carData = car[0];
        if (carData.insurance_expiry) {
            carData.insurance_expiry = formatDateForDB(carData.insurance_expiry);
        }
        if (carData.itp_expiry) {
            carData.itp_expiry = formatDateForDB(carData.itp_expiry);
        }
        if (carData.last_service_date) {
            carData.last_service_date = formatDateForDB(carData.last_service_date);
        }
        if (carData.registration_date) {
            carData.registration_date = formatDateForDB(carData.registration_date);
        }

        res.json(carData);
    } catch (error) {
        console.error('Error fetching technical sheet:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update technical data for a car - MODIFIED for date fix
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
            registration_date: formatDateForDB(registration_date), // Fixed date handling
            last_service_date: formatDateForDB(last_service_date),   // Fixed date handling
            last_service_km: last_service_km,
            next_service_km: next_service_km,
            insurance_expiry: formatDateForDB(insurance_expiry),     // Fixed date handling
            itp_expiry: formatDateForDB(itp_expiry)                  // Fixed date handling
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

            // Try to log the technical update in history with detailed changes
            try {
                // Build a detailed change log
                const changes = [];
                const oldCar = existing[0];

                // Track all changed fields with old and new values
                if (kilometers !== undefined && kilometers !== oldCar.kilometers) {
                    changes.push(`Kilometraj: ${oldCar.kilometers || 'N/A'} → ${kilometers} km`);
                }
                if (fuel_level !== undefined && fuel_level !== oldCar.fuel_level) {
                    changes.push(`Combustibil: ${oldCar.fuel_level || 'N/A'}% → ${fuel_level}%`);
                }
                if (last_service_date !== undefined && formatDateForDB(last_service_date) !== formatDateForDB(oldCar.last_service_date)) {
                    changes.push(`Data service: ${formatDateForDB(oldCar.last_service_date) || 'N/A'} → ${formatDateForDB(last_service_date) || 'N/A'}`);
                }
                if (last_service_km !== undefined && last_service_km !== oldCar.last_service_km) {
                    changes.push(`KM service: ${oldCar.last_service_km || 'N/A'} → ${last_service_km} km`);
                }
                if (next_service_km !== undefined && next_service_km !== oldCar.next_service_km) {
                    changes.push(`Următorul service: ${oldCar.next_service_km || 'N/A'} → ${next_service_km} km`);
                }
                if (insurance_expiry !== undefined && formatDateForDB(insurance_expiry) !== formatDateForDB(oldCar.insurance_expiry)) {
                    changes.push(`Asigurare: ${formatDateForDB(oldCar.insurance_expiry) || 'N/A'} → ${formatDateForDB(insurance_expiry) || 'N/A'}`);
                }
                if (itp_expiry !== undefined && formatDateForDB(itp_expiry) !== formatDateForDB(oldCar.itp_expiry)) {
                    changes.push(`ITP: ${formatDateForDB(oldCar.itp_expiry) || 'N/A'} → ${formatDateForDB(itp_expiry) || 'N/A'}`);
                }

                // Only log if there are actual changes
                if (changes.length > 0) {
                    const changeLog = changes.join('; ');
                    const fullNotes = notes ? `${notes} | Modificări: ${changeLog}` : `Modificări: ${changeLog}`;

                    await req.app.locals.db.query(
                        `INSERT INTO car_technical_history 
                        (car_id, kilometers, fuel_level, notes, updated_by, created_at) 
                        VALUES (?, ?, ?, ?, ?, NOW())`,
                        [
                            req.params.id,
                            kilometers !== undefined ? kilometers : oldCar.kilometers,
                            fuel_level !== undefined ? fuel_level : oldCar.fuel_level,
                            fullNotes,
                            admin_id || null
                        ]
                    );
                }
            } catch (historyError) {
                console.warn('Could not log to technical history (table might not exist):', historyError.message);
                // Continue without failing - history logging is optional
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

// Get technical history for a car - UNCHANGED
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

// *** ALL OTHER ROUTES REMAIN COMPLETELY UNCHANGED ***
// *** IMPORTANT: Route order matters in Express! ***
// Make sure specific routes come before parameterized routes

// GET available cars - UNCHANGED
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

// GET pending cars - UNCHANGED
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

// GET rented cars - UNCHANGED
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

// GET maintenance cars - UNCHANGED
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

// GET cars by category - UNCHANGED
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

// Direct endpoint to update car status - UNCHANGED
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

// GET all cars - UNCHANGED
router.get('/', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query('SELECT * FROM cars');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET a single car by ID - UNCHANGED
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

// POST new car with technical specifications - UNCHANGED
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

// Update similar car images - UNCHANGED
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

// PUT/UPDATE car with technical specifications - UNCHANGED
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

// PATCH car (update only provided fields including technical specs) - UNCHANGED
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

// DELETE car - UNCHANGED
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