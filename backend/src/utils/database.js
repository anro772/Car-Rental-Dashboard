// src/utils/database.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { createTables } = require('../models/tables')

dotenv.config();

async function initializeDatabase() {
    // First connect as root to create database
    const rootConnection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: 'root',
        password: '1234'
    });

    try {
        // Create database if it doesn't exist
        await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);

        // Grant privileges to appuser - now as separate queries
        await rootConnection.query(
            `GRANT ALL PRIVILEGES ON \`${process.env.DB_NAME}\`.* TO '${process.env.DB_USER}'@'localhost'`
        );
        await rootConnection.query('FLUSH PRIVILEGES');

        console.log(`Database ${process.env.DB_NAME} initialized successfully`);

        // Create connection pool with appuser
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10
        });

        await createTables(pool);


        return pool;
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        await rootConnection.end();
    }
}

module.exports = { initializeDatabase };