// src/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./utils/database');

const carsRouter = require('./routes/cars');
const uploadRouter = require('./routes/upload');
const customersRouter = require('./routes/customers');
const rentalsRouter = require('./routes/rentals');
const authRouter = require('./routes/auth');

dotenv.config();

console.log('Environment check:', {
    PORT: process.env.PORT,
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/cars', carsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/customers', customersRouter);
app.use('/api/rentals', rentalsRouter);
app.use('/api/auth', authRouter);

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Backend server is running!' });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
async function startServer() {
    try {
        const pool = await initializeDatabase();
        app.locals.db = pool;

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();