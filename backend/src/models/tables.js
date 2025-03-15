// src/models/tables.js
async function createTables(pool) {
    try {
        // Create cars table if it doesn't exist (with all fields)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cars (
                id INT AUTO_INCREMENT PRIMARY KEY,
                brand VARCHAR(50) NOT NULL,
                model VARCHAR(50) NOT NULL,
                year INT NOT NULL,
                license_plate VARCHAR(20) UNIQUE,
                color VARCHAR(30),
                category VARCHAR(30),
                daily_rate DECIMAL(10,2) DEFAULT 0,
                status ENUM('available', 'rented', 'maintenance') DEFAULT 'available',
                image_url VARCHAR(255),
                features TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create customers table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                driver_license VARCHAR(50),
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create rentals table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rentals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                car_id INT NOT NULL,
                customer_id INT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'pending',
                total_cost DECIMAL(10,2) NOT NULL,
                payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        `);

        // Check if tables have data
        const [carCount] = await pool.query('SELECT COUNT(*) as count FROM cars');

        // Only insert sample data if cars table is empty
        if (carCount[0].count === 0) {
            console.log('No cars found. Inserting sample data...');

            // Insert sample car data with image URLs pointing to src/assets/cars/
            await pool.query(`
                INSERT INTO cars (brand, model, year, license_plate, color, category, daily_rate, status, image_url, features) VALUES
                ('Toyota', 'Camry', 2022, 'ABC123', 'Silver', 'Sedan', 49.99, 'available', 'src/assets/cars/toyota-camry.jpeg', 'Bluetooth, Backup Camera, Cruise Control'),
                ('Honda', 'CR-V', 2021, 'XYZ789', 'Blue', 'SUV', 59.99, 'available', 'src/assets/cars/honda-crv.jpeg', 'Leather seats, Panoramic sunroof, Navigation system'),
                ('Ford', 'Mustang', 2023, 'MUS001', 'Red', 'Sports', 89.99, 'available', 'src/assets/cars/ford-mustang.jpeg', 'Premium sound system, Performance package, Convertible top'),
                ('Chevrolet', 'Equinox', 2022, 'EQX234', 'Black', 'SUV', 54.99, 'available', 'src/assets/cars/chevrolet-equinox.jpeg', 'Android Auto, Apple CarPlay, Heated seats'),
                ('BMW', 'X5', 2023, 'BMW101', 'White', 'Luxury', 99.99, 'available', 'src/assets/cars/bmw-x5.jpeg', 'Leather interior, 360 camera, Heads-up display'),
                ('Audi', 'A4', 2022, 'AUD404', 'Gray', 'Sedan', 79.99, 'rented', 'src/assets/cars/audi-a4.jpeg', 'Premium audio, Heated steering wheel, Lane assist'),
                ('Mercedes', 'C-Class', 2023, 'MRC555', 'Black', 'Luxury', 89.99, 'available', 'src/assets/cars/mercedes-cclass.jpeg', 'Massage seats, Ambient lighting, Driver assistance package'),
                ('Tesla', 'Model 3', 2023, 'TSL789', 'Blue', 'Sedan', 94.99, 'maintenance', 'src/assets/cars/tesla-model3.jpeg', 'Autopilot, All-glass roof, Minimalist interior')
            `);

            // Insert sample customer data
            await pool.query(`
                INSERT INTO customers (first_name, last_name, email, phone, driver_license, address) VALUES
                ('John', 'Doe', 'john@example.com', '555-1234', 'DL12345678', '123 Main St, Anytown, CA 90210'),
                ('Jane', 'Smith', 'jane@example.com', '555-5678', 'DL87654321', '456 Oak Ave, Somewhere, NY 10001'),
                ('Michael', 'Johnson', 'michael@example.com', '555-9012', 'DL11223344', '789 Pine Rd, Nowhere, TX 75001'),
                ('Emily', 'Williams', 'emily@example.com', '555-3456', 'DL44332211', '321 Elm Blvd, Anywhere, FL 33101')
            `);

            // Get the first few car and customer IDs
            const [cars] = await pool.query('SELECT id FROM cars LIMIT 4');
            const [customers] = await pool.query('SELECT id FROM customers LIMIT 4');

            if (cars.length >= 4 && customers.length >= 4) {
                const today = new Date().toISOString().split('T')[0];
                const tomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                await pool.query(`
                    INSERT INTO rentals (car_id, customer_id, start_date, end_date, status, total_cost, payment_status, notes) VALUES
                    (?, ?, '${twoWeeksAgo}', '${oneWeekAgo}', 'completed', 349.93, 'paid', 'Customer returned car in excellent condition'),
                    (?, ?, '${today}', '${threeDaysLater}', 'active', 179.97, 'paid', 'Customer requested child seat'),
                    (?, ?, '${tomorrow}', '${oneWeekLater}', 'pending', 629.93, 'unpaid', 'First-time customer, premium insurance added'),
                    (?, ?, '${today}', '${threeDaysLater}', 'active', 269.97, 'partial', 'Extended rental possible')
                `, [
                    cars[0].id, customers[0].id,
                    cars[1].id, customers[1].id,
                    cars[2].id, customers[2].id,
                    cars[3].id, customers[3].id
                ]);
            }

            console.log('Sample data inserted successfully');
        } else {
            console.log(`Database already contains ${carCount[0].count} cars. Skipping sample data.`);
        }

        console.log('Database tables check completed');
    } catch (error) {
        console.error('Error with database tables:', error);
        throw error;
    }
}

module.exports = { createTables };