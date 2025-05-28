// src/models/tables.js - Complete version with technical specifications and Romanian mock data
async function createTables(pool) {
    try {
        // Create cars table with technical specifications
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
                status ENUM('available', 'rented', 'maintenance', 'pending') DEFAULT 'available',
                image_url VARCHAR(255),
                features TEXT,
                -- Technical specifications fields
                kilometers INT DEFAULT 0,
                fuel_type ENUM('benzina', 'motorina', 'electric', 'hybrid', 'gpl') DEFAULT 'benzina',
                fuel_level INT DEFAULT 100, -- percentage 0-100
                engine_size VARCHAR(20), -- e.g., "1.6L", "2.0 TDI"
                transmission_type ENUM('manual', 'automat', 'semi-automat') DEFAULT 'manual',
                seats_count INT DEFAULT 5,
                doors_count INT DEFAULT 4,
                tank_capacity INT DEFAULT 50, -- in liters
                last_service_date DATE,
                last_service_km INT,
                next_service_km INT,
                vin_number VARCHAR(50), -- Vehicle Identification Number
                registration_date DATE,
                insurance_expiry DATE,
                itp_expiry DATE, -- Technical inspection expiry
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create admins table before car_technical_history (needed for foreign key)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create technical history table to track changes
        await pool.query(`
            CREATE TABLE IF NOT EXISTS car_technical_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                car_id INT NOT NULL,
                kilometers INT,
                fuel_level INT,
                notes TEXT,
                updated_by INT, -- admin id who made the update
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
                FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE SET NULL
            )
        `);

        // Create customers table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                driver_license VARCHAR(50),
                license_image_url VARCHAR(255),
                license_verified BOOLEAN DEFAULT FALSE,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create rentals table with additional fields for tracking
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
                -- Technical tracking fields
                start_km INT,
                end_km INT,
                start_fuel_level INT,
                end_fuel_level INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        `);

        // Check if we need to add the new columns to existing tables
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'cars' 
            AND COLUMN_NAME = 'kilometers'
        `);

        if (columns.length === 0) {
            console.log('Adding new technical specification columns to cars table...');

            // Add new columns to existing cars table
            await pool.query(`
                ALTER TABLE cars 
                ADD COLUMN kilometers INT DEFAULT 0,
                ADD COLUMN fuel_type ENUM('benzina', 'motorina', 'electric', 'hybrid', 'gpl') DEFAULT 'benzina',
                ADD COLUMN fuel_level INT DEFAULT 100,
                ADD COLUMN engine_size VARCHAR(20),
                ADD COLUMN transmission_type ENUM('manual', 'automat', 'semi-automat') DEFAULT 'manual',
                ADD COLUMN seats_count INT DEFAULT 5,
                ADD COLUMN doors_count INT DEFAULT 4,
                ADD COLUMN tank_capacity INT DEFAULT 50,
                ADD COLUMN last_service_date DATE,
                ADD COLUMN last_service_km INT,
                ADD COLUMN next_service_km INT,
                ADD COLUMN vin_number VARCHAR(50),
                ADD COLUMN registration_date DATE,
                ADD COLUMN insurance_expiry DATE,
                ADD COLUMN itp_expiry DATE,
                ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            `);

            // Add columns to rentals table if they don't exist
            await pool.query(`
                ALTER TABLE rentals 
                ADD COLUMN start_km INT,
                ADD COLUMN end_km INT,
                ADD COLUMN start_fuel_level INT,
                ADD COLUMN end_fuel_level INT
            `);
        }

        // Check if tables have data
        const [carCount] = await pool.query('SELECT COUNT(*) as count FROM cars');
        const [adminCount] = await pool.query('SELECT COUNT(*) as count FROM admins');

        // Insert sample admin data first (needed for technical history)
        if (adminCount[0].count === 0) {
            console.log('No admins found. Inserting sample admin data...');
            await pool.query(`
                INSERT INTO admins (email, password, name, role) VALUES
                ('admin@carrentaldashboard.ro', 'admin123', 'Nicula Mihai', 'admin'),
                ('manager@carrentaldashboard.ro', 'manager123', 'Gheorghe Ionuț', 'manager'),
                ('service@carrentaldashboard.ro', 'service123', 'Popescu Daniel', 'service'),
                ('operator@carrentaldashboard.ro', 'operator123', 'Stoica Ana', 'operator')
            `);
        }

        // Only insert sample data if cars table is empty
        if (carCount[0].count === 0) {
            console.log('No cars found. Inserting sample data with complete technical specs...');

            // Insert sample car data with complete technical specifications
            await pool.query(`
                INSERT INTO cars (brand, model, year, license_plate, color, category, daily_rate, status, image_url, features,
                    kilometers, fuel_type, fuel_level, engine_size, transmission_type, seats_count, doors_count, tank_capacity,
                    last_service_date, last_service_km, next_service_km, vin_number, registration_date, insurance_expiry, itp_expiry) VALUES
                
                -- Audi A4 variants
                ('Audi', 'A4', 2022, 'B101AUD', 'Gray', 'Sedan', 70.00, 'available', '/src/assets/cars/audi-a4.jpeg', 
                 'Navigație, Scaune încălzite, Bluetooth, Climatizare automată', 
                 15420, 'benzina', 85, '2.0 TFSI', 'automat', 5, 4, 54,
                 '2024-11-15', 15000, 25000, 'WAUEF48H55A123456', '2022-03-15', '2025-03-15', '2025-03-20'),
                
                ('Audi', 'A4', 2023, 'B102AUD', 'Black', 'Sedan', 72.00, 'available', '/src/assets/cars/audi-a4.jpeg', 
                 'Navigație, Scaune încălzite, Bluetooth, Climatizare automată, Pilot automat adaptiv', 
                 8200, 'motorina', 90, '2.0 TDI', 'automat', 5, 4, 54,
                 '2024-10-20', 8000, 18000, 'WAUEF48H56A789012', '2023-01-10', '2026-01-10', '2026-01-15'),
                
                ('Audi', 'A4', 2022, 'B103AUD', 'White', 'Sedan', 70.00, 'rented', '/src/assets/cars/audi-a4.jpeg', 
                 'Navigație, Scaune încălzite, Bluetooth, Climatizare automată, Cameră marșarier', 
                 22000, 'benzina', 45, '2.0 TFSI', 'automat', 5, 4, 54,
                 '2024-09-10', 21500, 31500, 'WAUEF48H55A345678', '2022-05-20', '2025-05-20', '2025-05-25'),
                
                -- BMW X5 variants
                ('BMW', 'X5', 2023, 'B201BMW', 'White', 'SUV', 95.00, 'available', '/src/assets/cars/bmw-x5.jpeg', 
                 'Pachet M Sport, Cameră 360, Head-up display, Sistem audio premium', 
                 5600, 'hybrid', 75, '3.0 xDrive45e', 'automat', 5, 5, 69,
                 '2024-12-01', 5000, 15000, 'WBAHC01090B123456', '2023-02-28', '2026-02-28', '2026-03-05'),
                
                ('BMW', 'X5', 2022, 'B202BMW', 'Black', 'SUV', 90.00, 'available', '/src/assets/cars/bmw-x5.jpeg', 
                 'Cameră 360, Head-up display, Sistem audio premium', 
                 22300, 'motorina', 60, '3.0d xDrive', 'automat', 5, 5, 83,
                 '2024-11-05', 22000, 32000, 'WBAHC01090B789012', '2022-06-15', '2025-06-15', '2025-06-20'),
                
                ('BMW', 'X5', 2023, 'B203BMW', 'Blue', 'SUV', 95.00, 'maintenance', '/src/assets/cars/bmw-x5.jpeg', 
                 'Pachet M Sport, Cameră 360, Head-up display, Sistem audio premium, Plafon panoramic', 
                 12800, 'benzina', 30, '3.0i xDrive', 'automat', 5, 5, 83,
                 '2024-08-20', 12000, 22000, 'WBAHC01091B345678', '2023-04-10', '2026-04-10', '2026-04-15'),
                
                -- Chevrolet Equinox
                ('Chevrolet', 'Equinox', 2022, 'B301CHV', 'Black', 'SUV', 55.00, 'available', '/src/assets/cars/chevrolet-equinox.jpeg', 
                 'Android Auto, Apple CarPlay, Scaune încălzite', 
                 28500, 'benzina', 70, '1.5 Turbo', 'automat', 5, 5, 63,
                 '2024-10-15', 28000, 38000, '3GNAXKEX5NL123456', '2022-08-12', '2025-08-12', '2025-08-17'),
                
                ('Chevrolet', 'Equinox', 2022, 'B302CHV', 'Silver', 'SUV', 55.00, 'available', '/src/assets/cars/chevrolet-equinox.jpeg', 
                 'Android Auto, Apple CarPlay, Scaune încălzite, Cameră marșarier', 
                 31200, 'benzina', 85, '1.5 Turbo', 'automat', 5, 5, 63,
                 '2024-09-25', 30500, 40500, '3GNAXKEX5NL789012', '2022-07-05', '2025-07-05', '2025-07-10'),
                
                -- Dacia Logan
                ('Dacia', 'Logan', 2022, 'B401DCL', 'Silver', 'Sedan', 30.00, 'available', '/src/assets/cars/dacia-logan.jpeg', 
                 'Bluetooth, Aer condiționat, Sistem navigație MediaNav', 
                 45600, 'benzina', 40, '1.0 SCe', 'manual', 5, 4, 50,
                 '2024-11-20', 45000, 55000, 'UU1LSRFB0PL123456', '2022-09-10', '2025-09-10', '2025-09-15'),
                
                ('Dacia', 'Logan', 2023, 'B402DCL', 'White', 'Sedan', 32.00, 'available', '/src/assets/cars/dacia-logan.jpeg', 
                 'Bluetooth, Aer condiționat, Sistem navigație MediaNav, Senzori parcare', 
                 12000, 'gpl', 70, '1.0 TCe', 'manual', 5, 4, 50,
                 '2024-12-05', 11500, 21500, 'UU1LSRFB1PL789012', '2023-03-20', '2026-03-20', '2026-03-25'),
                
                ('Dacia', 'Logan', 2022, 'B403DCL', 'Blue', 'Sedan', 30.00, 'rented', '/src/assets/cars/dacia-logan.jpeg', 
                 'Bluetooth, Aer condiționat, Sistem navigația MediaNav', 
                 38900, 'benzina', 55, '1.0 SCe', 'manual', 5, 4, 50,
                 '2024-10-30', 38500, 48500, 'UU1LSRFB0PL345678', '2022-11-25', '2025-11-25', '2025-11-30'),
                
                -- Ford models
                ('Ford', 'Escape', 2022, 'B501FRD', 'Blue', 'SUV', 60.00, 'available', '/src/assets/cars/ford-escape.jpeg', 
                 'Sistem SYNC 3, Hayon acționat electric, Scaune încălzite', 
                 18700, 'benzina', 65, '1.5 EcoBoost', 'automat', 5, 5, 57,
                 '2024-11-10', 18000, 28000, '1FMCU9HD6NUA12345', '2022-04-18', '2025-04-18', '2025-04-23'),
                
                ('Ford', 'Escape', 2022, 'B502FRD', 'Silver', 'SUV', 60.00, 'rented', '/src/assets/cars/ford-escape.jpeg', 
                 'Sistem SYNC 3, Hayon acționat electric, Scaune încălzite, Plafon panoramic', 
                 25400, 'benzina', 80, '1.5 EcoBoost', 'automat', 5, 5, 57,
                 '2024-09-15', 25000, 35000, '1FMCU9HD6NUA67890', '2022-06-22', '2025-06-22', '2025-06-27'),
                
                ('Ford', 'Mustang', 2023, 'B601FRD', 'Red', 'Sports', 90.00, 'rented', '/src/assets/cars/ford-mustang.jpeg', 
                 'Sistem audio premium, Pachet performanță, Decapotabilă', 
                 8900, 'benzina', 75, '5.0 V8', 'automat', 4, 2, 61,
                 '2024-11-25', 8500, 18500, '1FA6P8CF5P5123456', '2023-05-15', '2026-05-15', '2026-05-20'),
                
                ('Ford', 'Mustang', 2023, 'B602FRD', 'Black', 'Sports', 90.00, 'available', '/src/assets/cars/ford-mustang.jpeg', 
                 'Sistem audio premium, Pachet performanță, Decapotabilă', 
                 6200, 'benzina', 90, '5.0 V8', 'automat', 4, 2, 61,
                 '2024-12-10', 6000, 16000, '1FA6P8CF5P5789012', '2023-07-08', '2026-07-08', '2026-07-13'),
                
                -- Tesla Model 3
                ('Tesla', 'Model 3', 2023, 'B191TSL', 'Blue', 'Sedan', 95.00, 'available', '/src/assets/cars/tesla-model3.jpeg', 
                 'Autopilot, Acoperiș din sticlă, Interior minimalist', 
                 8900, 'electric', 85, 'Dual Motor', 'automat', 5, 4, 0,
                 '2024-10-05', 8000, 18000, '5YJ3E1EA5PF123456', '2023-08-20', '2026-08-20', '2026-08-25'),
                
                ('Tesla', 'Model 3', 2023, 'B192TSL', 'White', 'Sedan', 95.00, 'rented', '/src/assets/cars/tesla-model3.jpeg', 
                 'Autopilot, Acoperiș din sticlă, Interior minimalist, Autonomie extinsă', 
                 15600, 'electric', 65, 'Long Range', 'automat', 5, 4, 0,
                 '2024-09-20', 15000, 25000, '5YJ3E1EA5PF789012', '2023-06-12', '2026-06-12', '2026-06-17'),
                
                ('Tesla', 'Model 3', 2023, 'B193TSL', 'Black', 'Sedan', 95.00, 'available', '/src/assets/cars/tesla-model3.jpeg', 
                 'Autopilot, Acoperiș din sticlă, Interior minimalist, Performanță', 
                 11400, 'electric', 95, 'Performance', 'automat', 5, 4, 0,
                 '2024-11-30', 11000, 21000, '5YJ3E1EA5PF345678', '2023-09-05', '2026-09-05', '2026-09-10'),
                
                -- Add more cars with complete technical specifications...
                ('Mercedes', 'C-Class', 2023, 'B141MRC', 'Silver', 'Luxury', 90.00, 'available', '/src/assets/cars/mercedes-cclass.jpeg', 
                 'Scaune cu masaj, Iluminare ambientală, Pachet asistență șofer', 
                 7800, 'benzina', 95, '2.0 Turbo', 'automat', 5, 4, 66,
                 '2024-12-01', 7500, 17500, 'WDD2050321F123456', '2023-10-15', '2026-10-15', '2026-10-20'),
                
                ('Porsche', '911', 2023, 'B161PRS', 'Yellow', 'Sports', 150.00, 'available', '/src/assets/cars/porsche-911.jpeg', 
                 'Pachet Sport Chrono, Suspensie sport, Sistem audio Burmester', 
                 4200, 'benzina', 88, '3.0 Turbo', 'automat', 2, 2, 64,
                 '2024-11-20', 4000, 14000, 'WP0AA2A95PS123456', '2023-12-01', '2026-12-01', '2026-12-06')
            `);

            // Insert sample customer data
            await pool.query(`
                INSERT INTO customers (first_name, last_name, email, phone, driver_license, address, license_verified, license_image_url) VALUES
                ('Andrei', 'Popescu', 'andrei.popescu@gmail.com', '0722123456', 'B 123456', 'Strada Victoriei 10, București, România', 1, 'src/assets/licenses/license-andrei-popescu-B123456.png'),
                ('Maria', 'Ionescu', 'maria.ionescu@yahoo.com', '0733234567', 'CT 234567', 'Bulevardul Mamaia 25, Constanța, România', 1, 'src/assets/licenses/license-maria-ionescu-CT234567.png'),
                ('Alexandru', 'Dumitrescu', 'alex.dumitrescu@gmail.com', '0744345678', 'IS 345678', 'Strada Ștefan cel Mare 5, Iași, România', 1, 'src/assets/licenses/license-alexandru-dumitrescu-IS345678.png'),
                ('Elena', 'Popa', 'elena.popa@gmail.com', '0755456789', 'CJ 456789', 'Bulevardul Eroilor 15, Cluj-Napoca, România', 0, NULL),
                ('Mihai', 'Constantin', 'mihai.constantin@yahoo.com', '0766567890', 'TM 567890', 'Strada Alba Iulia 7, Timișoara, România', 1, 'src/assets/licenses/license-mihai-constantin-TM567890.png'),
                ('Ana', 'Georgescu', 'ana.georgescu@gmail.com', '0777678901', 'B 678901', 'Calea Dorobanți 30, București, România', 0, NULL),
                ('Bogdan', 'Marin', 'bogdan.marin@yahoo.com', '0788789012', 'BV 789012', 'Strada Lungă 20, Brașov, România', 1, 'src/assets/licenses/license-bogdan-marin-BV789012.png'),
                ('Cristina', 'Stancu', 'cristina.stancu@gmail.com', '0799890123', 'PH 890123', 'Bulevardul Republicii 12, Ploiești, România', 0, NULL)
            `);

            console.log('Sample data with complete technical specifications inserted successfully');

            // Insert sample technical history data in Romanian
            console.log('Inserting Romanian technical history data...');

            // Get some car and admin IDs for the history
            const [cars] = await pool.query('SELECT id FROM cars LIMIT 20');
            const [admins] = await pool.query('SELECT id FROM admins');

            if (cars.length > 0 && admins.length > 0) {
                // Calculate various dates for history entries
                const today = new Date();
                const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
                const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
                const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
                const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);

                await pool.query(`
                    INSERT INTO car_technical_history (car_id, kilometers, fuel_level, notes, updated_by, created_at) VALUES
                    -- Audi A4 Gray - istoric tehnic complet
                    (1, 10500, 100, 'Preluare mașină după service complet la 10.000 km. Schimbat ulei motor, filtru aer, verificat frâne.', 1, '${twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (1, 12800, 45, 'Mașină returnată de client după închiriere de 7 zile. Necesită alimentare completă cu combustibil.', 2, '${oneMonthAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (1, 13200, 95, 'Alimentare completă efectuată, verificare anvelope și presiune. Totul în regulă pentru următoarea închiriere.', 3, '${oneMonthAgo.toISOString().slice(0, -5)}'),
                    (1, 15420, 85, 'Returnare client Popescu Andrei. Mașină în stare foarte bună, km parcurși: 2220. Client mulțumit.', 1, '${fiveDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    
                    -- BMW X5 White - istoric pentru mașină hibrid
                    (4, 3200, 90, 'Preluare mașină nouă din reprezentanță. Prima verificare tehnică completă efectuată.', 1, '${twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (4, 4800, 60, 'Închiriere corporativă finalizată. Bateria hibrid funcționează optim, consum mixt 6.8L/100km.', 2, '${oneMonthAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (4, 5600, 75, 'Verificare periodică sistem hibrid. Regenerare baterie efectuată cu succes, autonomie electrică 45km.', 4, '${oneWeekAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    
                    -- Dacia Logan Silver - mașină economică cu mileaj mare
                    (9, 42000, 30, 'Service major la 40.000 km: schimb ulei, filtru combustibil, verificare amortizoare. Totul în regulă.', 3, '${twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (9, 43500, 85, 'Returnare după închiriere lungă (14 zile). Client foarte mulțumit de consum redus (5.2L/100km).', 1, '${oneMonthAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (9, 45600, 40, 'Ultima returnare client. Necesită alimentare urgentă înainte de următoarea rezervare.', 2, '${threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    
                    -- Tesla Model 3 Blue - mașină electrică
                    (17, 6800, 95, 'Preluare Tesla din showroom. Prima încărcare completă la stația Supercharger, autonomie 450km.', 1, '${twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (17, 7200, 25, 'Client întârziat cu returnarea cu 2 ore. Baterie descărcată, necesară încărcare urgentă.', 4, '${oneMonthAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (17, 7800, 100, 'Încărcare completă efectuată la stația rapidă din centru. Update software versiunea 2023.44.30.', 2, '${oneMonthAgo.toISOString().slice(0, -5)}'),
                    (17, 8900, 85, 'Client foarte mulțumit de performanțele mașinii. Consum mediu 16kWh/100km în oraș.', 1, '${fiveDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    
                    -- Ford Mustang Red - mașină sport
                    (15, 7200, 40, 'Prima închiriere finalizată. Client pasionat de mașini sport, a condus responsabil.', 1, '${oneMonthAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (15, 8100, 90, 'Alimentare completă, verificare anvelope sport. Uzura normală pentru stilul de conducere sportiv.', 3, '${twoWeeksAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (15, 8900, 75, 'Client actual foarte atent cu mașina. Consum înregistrat: 12L/100km (moderat pentru V8).', 2, '${oneWeekAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    
                    -- Porsche 911 Yellow - mașină premium
                    (20, 2500, 95, 'Preluare Porsche din service autorizat. Verificare completă, toate sistemele funcționează perfect.', 1, '${twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (20, 3200, 60, 'Prima închiriere premium finalizată. Client VIP foarte mulțumit de performanțe și handling.', 4, '${oneMonthAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (20, 4200, 88, 'Verificare tehnică după 2000km. Frâne ceramice în stare excelentă, suspensie sport calibrată optim.', 2, '${oneWeekAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    
                    -- Mercedes C-Class Silver - mașină de lux
                    (19, 5800, 100, 'Service complet la Mercedes autorizat. Schimbat filtru particule, verificat sistemul MBUX.', 1, '${twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (19, 6900, 45, 'Returnare după închiriere business de 5 zile. Scaune cu masaj foarte apreciate de client.', 3, '${oneMonthAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (19, 7800, 95, 'Ultimi clienți foarte mulțumiți de sistemele de asistență și confortul interior premium.', 2, '${fiveDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    
                    -- Actualizări recente pentru diverse mașini
                    (2, 8200, 90, 'Audi A4 TDI Black - returnare fără probleme. Consum excelent motorină: 4.8L/100km pe autostradă.', 1, '${threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (5, 22300, 60, 'BMW X5 Diesel - service preventiv la 22.000km. Schimbat uleiul diferenței, filtru habitaclu.', 3, '${fiveDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (7, 28500, 70, 'Chevrolet Equinox - verificare sistem Android Auto după reclamație client. Problemă rezolvată.', 4, '${threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (10, 12000, 70, 'Dacia Logan GPL - prima verificare sistem GPL după 10.000km. Totul funcționează în parametri normali.', 2, '${oneWeekAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (13, 6200, 90, 'Ford Mustang Black - client pasionat de fotografie auto. Mașină folosită pentru shooting foto.', 1, '${fiveDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}')
                `);

                console.log('Romanian technical history data inserted successfully');
            }

            // Create some sample rentals with technical data
            const [customers] = await pool.query('SELECT id FROM customers');
            if (cars.length > 0 && customers.length > 0) {
                console.log('Creating sample rentals with technical tracking...');

                const today = new Date().toISOString().split('T')[0];
                const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const fiveDaysLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                await pool.query(`
                    INSERT INTO rentals (car_id, customer_id, start_date, end_date, status, total_cost, payment_status, notes, start_km, end_km, start_fuel_level, end_fuel_level) VALUES
                    (3, 1, '${twoDaysAgo}', '${yesterday}', 'completed', 140.00, 'paid', 'Închiriere fără probleme, client foarte mulțumit', 21800, 22000, 95, 45),
                    (15, 2, '${yesterday}', '${fiveDaysLater}', 'active', 450.00, 'paid', 'Client pasionat de mașini sport, asigurare premium inclusă', 8100, NULL, 90, NULL),
                    (18, 3, '${today}', '${fiveDaysLater}', 'active', 475.00, 'partial', 'Prima închiriere Tesla, client foarte entuziasmat', 15000, NULL, 80, NULL)
                `);

                console.log('Sample rentals with technical tracking created successfully');
            }
        } else {
            console.log(`Database already contains ${carCount[0].count} cars. Skipping sample data.`);
        }

        console.log('Database tables with complete technical specifications and Romanian data created successfully');
    } catch (error) {
        console.error('Error with database tables:', error);
        throw error;
    }
}

module.exports = { createTables };