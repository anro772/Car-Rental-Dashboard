// src/routes/rentals.js
const express = require('express');
const router = express.Router();

// GET all rentals
router.get('/', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query(`
            SELECT r.*, 
                c.brand, c.model, c.license_plate, 
                CONCAT(cu.first_name, ' ', cu.last_name) as customer_name, cu.email as customer_email
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN customers cu ON r.customer_id = cu.id
            ORDER BY r.start_date DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET a single rental by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await req.app.locals.db.query(`
            SELECT r.*, 
                c.brand, c.model, c.license_plate, c.image_url,
                CONCAT(cu.first_name, ' ', cu.last_name) as customer_name, 
                cu.email as customer_email, cu.phone as customer_phone
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN customers cu ON r.customer_id = cu.id
            WHERE r.id = ?
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Rental not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET rentals by status
router.get('/status/:status', async (req, res) => {
    const validStatuses = ['pending', 'active', 'completed', 'cancelled'];
    const status = req.params.status;

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const [rows] = await req.app.locals.db.query(`
            SELECT r.*, 
                c.brand, c.model, c.license_plate, 
                CONCAT(cu.first_name, ' ', cu.last_name) as customer_name, cu.email as customer_email
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN customers cu ON r.customer_id = cu.id
            WHERE r.status = ?
            ORDER BY r.start_date
        `, [status]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET rentals for a specific customer
router.get('/customer/:customerId', async (req, res) => {
    try {
        // First check if customer exists
        const [customer] = await req.app.locals.db.query(
            'SELECT * FROM customers WHERE id = ?',
            [req.params.customerId]
        );

        if (customer.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const [rows] = await req.app.locals.db.query(`
            SELECT r.*, 
                c.brand, c.model, c.license_plate, c.image_url, c.daily_rate
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            WHERE r.customer_id = ?
            ORDER BY r.start_date DESC
        `, [req.params.customerId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET rentals for a specific car
router.get('/car/:carId', async (req, res) => {
    try {
        // First check if car exists
        const [car] = await req.app.locals.db.query(
            'SELECT * FROM cars WHERE id = ?',
            [req.params.carId]
        );

        if (car.length === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }

        const [rows] = await req.app.locals.db.query(`
            SELECT r.*, 
                CONCAT(cu.first_name, ' ', cu.last_name) as customer_name, 
                cu.email as customer_email, cu.phone as customer_phone
            FROM rentals r
            JOIN customers cu ON r.customer_id = cu.id
            WHERE r.car_id = ?
            ORDER BY r.start_date DESC
        `, [req.params.carId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET current active rentals (today falls between start and end date)
router.get('/current/active', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const [rows] = await req.app.locals.db.query(`
            SELECT r.*, 
                c.brand, c.model, c.license_plate, c.image_url,
                CONCAT(cu.first_name, ' ', cu.last_name) as customer_name, 
                cu.email as customer_email, cu.phone as customer_phone
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN customers cu ON r.customer_id = cu.id
            WHERE r.status = 'active' 
            AND ? BETWEEN r.start_date AND r.end_date
            ORDER BY r.end_date
        `, [today]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create a new rental
router.post('/', async (req, res) => {
    try {
        const { car_id, customer_id, start_date, end_date, total_cost, payment_status, notes } = req.body;

        if (!car_id || !customer_id || !start_date || !end_date || !total_cost) {
            return res.status(400).json({
                error: 'Car ID, Customer ID, Start date, End date and Total cost are required'
            });
        }

        // Check if car exists and is available
        const [car] = await req.app.locals.db.query(
            'SELECT * FROM cars WHERE id = ?',
            [car_id]
        );

        if (car.length === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }

        if (car[0].status !== 'available') {
            return res.status(400).json({ error: 'Car is not available for rent' });
        }

        // Check if customer exists and is active
        const [customer] = await req.app.locals.db.query(
            'SELECT * FROM customers WHERE id = ?',
            [customer_id]
        );

        if (customer.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        if (customer[0].status !== 'active') {
            return res.status(400).json({ error: 'Customer is not active' });
        }

        // Check for date conflicts with existing rentals
        const [conflicts] = await req.app.locals.db.query(`
            SELECT * FROM rentals 
            WHERE car_id = ? 
            AND status IN ('pending', 'active') 
            AND (
                (start_date <= ? AND end_date >= ?) OR
                (start_date <= ? AND end_date >= ?) OR
                (start_date >= ? AND end_date <= ?)
            )
        `, [
            car_id,
            start_date, start_date,
            end_date, end_date,
            start_date, end_date
        ]);

        if (conflicts.length > 0) {
            return res.status(409).json({
                error: 'Car is already booked during this period',
                conflictingRentals: conflicts
            });
        }

        // Create the rental
        const [result] = await req.app.locals.db.query(`
            INSERT INTO rentals 
            (car_id, customer_id, start_date, end_date, status, total_cost, payment_status, notes) 
            VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
        `, [car_id, customer_id, start_date, end_date, total_cost, payment_status || 'unpaid', notes]);

        // Update car status to 'rented' if start date is today
        const today = new Date().toISOString().split('T')[0];
        if (start_date === today) {
            await req.app.locals.db.query(
                "UPDATE cars SET status = 'rented' WHERE id = ?",
                [car_id]
            );
        }

        // Get the created rental with related information
        const [newRental] = await req.app.locals.db.query(`
            SELECT r.*, 
                c.brand, c.model, c.license_plate, 
                CONCAT(cu.first_name, ' ', cu.last_name) as customer_name, cu.email as customer_email
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN customers cu ON r.customer_id = cu.id
            WHERE r.id = ?
        `, [result.insertId]);

        res.status(201).json(newRental[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update rental status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const rentalId = req.params.id;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const validStatuses = ['pending', 'active', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Get the current rental
        const [rental] = await req.app.locals.db.query(
            'SELECT * FROM rentals WHERE id = ?',
            [rentalId]
        );

        if (rental.length === 0) {
            return res.status(404).json({ error: 'Rental not found' });
        }

        // Update the rental status
        await req.app.locals.db.query(
            'UPDATE rentals SET status = ? WHERE id = ?',
            [status, rentalId]
        );

        // Update car status based on rental status
        if (status === 'active') {
            await req.app.locals.db.query(
                "UPDATE cars SET status = 'rented' WHERE id = ?",
                [rental[0].car_id]
            );
        } else if (status === 'completed' || status === 'cancelled') {
            await req.app.locals.db.query(
                "UPDATE cars SET status = 'available' WHERE id = ?",
                [rental[0].car_id]
            );
        }

        // Get the updated rental
        const [updatedRental] = await req.app.locals.db.query(`
            SELECT r.*, 
                c.brand, c.model, c.license_plate, 
                CONCAT(cu.first_name, ' ', cu.last_name) as customer_name, cu.email as customer_email
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN customers cu ON r.customer_id = cu.id
            WHERE r.id = ?
        `, [rentalId]);

        res.json(updatedRental[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update payment status
router.put('/:id/payment', async (req, res) => {
    try {
        const { payment_status } = req.body;
        const rentalId = req.params.id;

        if (!payment_status) {
            return res.status(400).json({ error: 'Payment status is required' });
        }

        const validPaymentStatuses = ['unpaid', 'partial', 'paid'];
        if (!validPaymentStatuses.includes(payment_status)) {
            return res.status(400).json({ error: 'Invalid payment status' });
        }

        // Check if rental exists
        const [rental] = await req.app.locals.db.query(
            'SELECT * FROM rentals WHERE id = ?',
            [rentalId]
        );

        if (rental.length === 0) {
            return res.status(404).json({ error: 'Rental not found' });
        }

        // Update the payment status
        await req.app.locals.db.query(
            'UPDATE rentals SET payment_status = ? WHERE id = ?',
            [payment_status, rentalId]
        );

        // Get the updated rental
        const [updatedRental] = await req.app.locals.db.query(`
            SELECT r.*, 
                c.brand, c.model, c.license_plate, 
                CONCAT(cu.first_name, ' ', cu.last_name) as customer_name, cu.email as customer_email
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN customers cu ON r.customer_id = cu.id
            WHERE r.id = ?
        `, [rentalId]);

        res.json(updatedRental[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update rental details
router.put('/:id', async (req, res) => {
    try {
        const { car_id, customer_id, start_date, end_date, total_cost, notes } = req.body;
        const rentalId = req.params.id;

        // Check if rental exists
        const [rental] = await req.app.locals.db.query(
            'SELECT * FROM rentals WHERE id = ?',
            [rentalId]
        );

        if (rental.length === 0) {
            return res.status(404).json({ error: 'Rental not found' });
        }

        // For completed rentals, only allow updating notes
        if (rental[0].status === 'completed') {
            await req.app.locals.db.query(
                'UPDATE rentals SET notes = ? WHERE id = ?',
                [notes !== undefined ? notes : rental[0].notes, rentalId]
            );
        } else {
            // For other rentals, allow updating more fields
            await req.app.locals.db.query(`
                UPDATE rentals SET 
                    start_date = ?, 
                    end_date = ?, 
                    total_cost = ?,
                    notes = ?
                WHERE id = ?
            `, [
                start_date || rental[0].start_date,
                end_date || rental[0].end_date,
                total_cost !== undefined ? total_cost : rental[0].total_cost,
                notes !== undefined ? notes : rental[0].notes,
                rentalId
            ]);
        }

        // Get the updated rental
        const [updatedRental] = await req.app.locals.db.query(`
            SELECT r.*, 
                c.brand, c.model, c.license_plate, 
                CONCAT(cu.first_name, ' ', cu.last_name) as customer_name, cu.email as customer_email
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN customers cu ON r.customer_id = cu.id
            WHERE r.id = ?
        `, [rentalId]);

        res.json(updatedRental[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE a rental
router.delete('/:id', async (req, res) => {
    try {
        // Check if rental exists
        const [rental] = await req.app.locals.db.query(
            'SELECT * FROM rentals WHERE id = ?',
            [req.params.id]
        );

        if (rental.length === 0) {
            return res.status(404).json({ error: 'Rental not found' });
        }

        // Don't allow deleting active rentals
        if (rental[0].status === 'active') {
            return res.status(400).json({
                error: 'Cannot delete an active rental. Cancel it first.'
            });
        }

        // If the rental is pending and we're deleting it, make sure the car is available
        if (rental[0].status === 'pending') {
            await req.app.locals.db.query(
                "UPDATE cars SET status = 'available' WHERE id = ?",
                [rental[0].car_id]
            );
        }

        // Delete the rental
        await req.app.locals.db.query(
            'DELETE FROM rentals WHERE id = ?',
            [req.params.id]
        );

        res.json({ message: 'Rental deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET upcoming rentals (starting in the next 7 days)
router.get('/upcoming/week', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekDate = nextWeek.toISOString().split('T')[0];

        const [rows] = await req.app.locals.db.query(`
            SELECT r.*, 
                c.brand, c.model, c.license_plate, c.image_url,
                CONCAT(cu.first_name, ' ', cu.last_name) as customer_name, 
                cu.email as customer_email, cu.phone as customer_phone
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN customers cu ON r.customer_id = cu.id
            WHERE r.status IN ('pending', 'active') 
            AND r.start_date BETWEEN ? AND ?
            ORDER BY r.start_date
        `, [today, nextWeekDate]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET overdue rentals (end date has passed but still active)
router.get('/overdue', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const [rows] = await req.app.locals.db.query(`
            SELECT r.*, 
                c.brand, c.model, c.license_plate, c.image_url,
                CONCAT(cu.first_name, ' ', cu.last_name) as customer_name, 
                cu.email as customer_email, cu.phone as customer_phone,
                DATEDIFF(?, r.end_date) as days_overdue
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN customers cu ON r.customer_id = cu.id
            WHERE r.status = 'active' 
            AND r.end_date < ?
            ORDER BY r.end_date
        `, [today, today]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;