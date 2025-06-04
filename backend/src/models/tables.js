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

            await pool.query(`
                ALTER TABLE rentals 
                ADD COLUMN start_km INT,
                ADD COLUMN end_km INT,
                ADD COLUMN start_fuel_level INT,
                ADD COLUMN end_fuel_level INT
            `);
        }

        const [carCount] = await pool.query('SELECT COUNT(*) as count FROM cars');
        const [adminCount] = await pool.query('SELECT COUNT(*) as count FROM admins');

        if (adminCount[0].count === 0) {
            console.log('No admins found. Inserting sample admin data...');
            await pool.query(`
                INSERT INTO admins (email, password, name, role) VALUES
                ('admin@carrentaldashboard.ro', 'admin123', 'Nicula Mihai', 'admin'),
                ('manager@carrentaldashboard.ro', 'manager123', 'Gheorghe Ionuț', 'manager')
            `); // Note: Passwords should be hashed in a real app. These are placeholders.
        }

        if (carCount[0].count === 0) {
            console.log('No cars found. Inserting sample data with complete technical specs and accurate rental statuses for 2025-05-29...');
            // Car statuses are set based on their rental schedule around 2025-05-29
            // 'rented': Actively rented on 2025-05-29
            // 'pending': Next rental starts shortly after 2025-05-29
            // 'available': Not rented on 2025-05-29 and no immediate pending rental
            // 'maintenance': Undergoing maintenance

            await pool.query(`
                INSERT INTO cars (brand, model, year, license_plate, color, category, daily_rate, status, image_url, features,
                    kilometers, fuel_type, fuel_level, engine_size, transmission_type, seats_count, doors_count, tank_capacity,
                    last_service_date, last_service_km, next_service_km, vin_number, registration_date, insurance_expiry, itp_expiry) VALUES
                
                -- Car ID 1: Audi A4 Gray - Status: rented on 2025-05-29
                ('Audi', 'A4', 2022, 'B101AUD', 'Gray', 'Sedan', 70.00, 'rented', '/src/assets/cars/audi-a4.jpeg', 
                 'Navigație, Scaune încălzite, Bluetooth, Climatizare automată', 
                 15420, 'benzina', 70, '2.0 TFSI', 'automat', 5, 4, 54,
                 '2024-11-15', 15000, 25000, 'WAUEF48H55A123456', '2022-03-15', '2025-03-15', '2025-03-20'),
                
                -- Car ID 2: Audi A4 Black - Status: available on 2025-05-29
                ('Audi', 'A4', 2023, 'B102AUD', 'Black', 'Sedan', 72.00, 'available', '/src/assets/cars/audi-a4.jpeg', 
                 'Navigație, Scaune încălzite, Bluetooth, Climatizare automată, Pilot automat adaptiv', 
                 8200, 'motorina', 90, '2.0 TDI', 'automat', 5, 4, 54,
                 '2024-10-20', 8000, 18000, 'WAUEF48H56A789012', '2023-01-10', '2026-01-10', '2026-01-15'),
                
                -- Car ID 3: Audi A4 White - Status: pending on 2025-05-29
                ('Audi', 'A4', 2022, 'B103AUD', 'White', 'Sedan', 70.00, 'pending', '/src/assets/cars/audi-a4.jpeg', 
                 'Navigație, Scaune încălzite, Bluetooth, Climatizare automată, Cameră marșarier', 
                 22000, 'benzina', 80, '2.0 TFSI', 'automat', 5, 4, 54,
                 '2024-09-10', 21500, 31500, 'WAUEF48H55A345678', '2022-05-20', '2025-05-20', '2025-05-25'),
                
                -- Car ID 4: BMW X5 White - Status: available on 2025-05-29
                ('BMW', 'X5', 2023, 'B201BMW', 'White', 'SUV', 95.00, 'available', '/src/assets/cars/bmw-x5.jpeg', 
                 'Pachet M Sport, Cameră 360, Head-up display, Sistem audio premium', 
                 5600, 'hybrid', 75, '3.0 xDrive45e', 'automat', 5, 5, 69,
                 '2024-12-01', 5000, 15000, 'WBAHC01090B123456', '2023-02-28', '2026-02-28', '2026-03-05'),
                
                -- Car ID 5: BMW X5 Black - Status: rented on 2025-05-29
                ('BMW', 'X5', 2022, 'B202BMW', 'Black', 'SUV', 90.00, 'rented', '/src/assets/cars/bmw-x5.jpeg', 
                 'Cameră 360, Head-up display, Sistem audio premium', 
                 22300, 'motorina', 60, '3.0d xDrive', 'automat', 5, 5, 83,
                 '2024-11-05', 22000, 32000, 'WBAHC01090B789012', '2022-06-15', '2025-06-15', '2025-06-20'),
                
                -- Car ID 6: BMW X5 Blue - Status: maintenance
                ('BMW', 'X5', 2023, 'B203BMW', 'Blue', 'SUV', 95.00, 'maintenance', '/src/assets/cars/bmw-x5.jpeg', 
                 'Pachet M Sport, Cameră 360, Head-up display, Sistem audio premium, Plafon panoramic', 
                 12800, 'benzina', 30, '3.0i xDrive', 'automat', 5, 5, 83,
                 '2025-05-15', 12000, 22000, 'WBAHC01091B345678', '2023-04-10', '2026-04-10', '2026-04-15'),
                
                -- Car ID 7: Chevrolet Equinox Black - Status: available
                ('Chevrolet', 'Equinox', 2022, 'B301CHV', 'Black', 'SUV', 55.00, 'available', '/src/assets/cars/chevrolet-equinox.jpeg', 
                 'Android Auto, Apple CarPlay, Scaune încălzite', 
                 28500, 'benzina', 70, '1.5 Turbo', 'automat', 5, 5, 63,
                 '2024-10-15', 28000, 38000, '3GNAXKEX5NL123456', '2022-08-12', '2025-08-12', '2025-08-17'),
                
                -- Car ID 8: Chevrolet Equinox Silver - Status: pending
                ('Chevrolet', 'Equinox', 2022, 'B302CHV', 'Silver', 'SUV', 55.00, 'pending', '/src/assets/cars/chevrolet-equinox.jpeg', 
                 'Android Auto, Apple CarPlay, Scaune încălzite, Cameră marșarier', 
                 31200, 'benzina', 85, '1.5 Turbo', 'automat', 5, 5, 63,
                 '2024-09-25', 30500, 40500, '3GNAXKEX5NL789012', '2022-07-05', '2025-07-05', '2025-07-10'),

                -- Car ID 9: Dacia Logan Silver - Status: available
                ('Dacia', 'Logan', 2022, 'B401DCL', 'Silver', 'Sedan', 30.00, 'available', '/src/assets/cars/dacia-logan.jpeg', 
                 'Bluetooth, Aer condiționat, Sistem navigație MediaNav', 
                 45600, 'benzina', 40, '1.0 SCe', 'manual', 5, 4, 50,
                 '2024-11-20', 45000, 55000, 'UU1LSRFB0PL123456', '2022-09-10', '2025-09-10', '2025-09-15'),
                
                -- Car ID 10: Dacia Logan White - Status: rented
                ('Dacia', 'Logan', 2023, 'B402DCL', 'White', 'Sedan', 32.00, 'rented', '/src/assets/cars/dacia-logan.jpeg', 
                 'Bluetooth, Aer condiționat, Sistem navigație MediaNav, Senzori parcare', 
                 12000, 'gpl', 70, '1.0 TCe', 'manual', 5, 4, 50,
                 '2024-12-05', 11500, 21500, 'UU1LSRFB1PL789012', '2023-03-20', '2026-03-20', '2026-03-25'),
                
                -- Car ID 11: Dacia Logan Blue - Status: pending
                ('Dacia', 'Logan', 2022, 'B403DCL', 'Blue', 'Sedan', 30.00, 'pending', '/src/assets/cars/dacia-logan.jpeg', 
                 'Bluetooth, Aer condiționat, Sistem navigația MediaNav', 
                 38900, 'benzina', 55, '1.0 SCe', 'manual', 5, 4, 50,
                 '2024-10-30', 38500, 48500, 'UU1LSRFB0PL345678', '2022-11-25', '2025-11-25', '2025-11-30'),
                
                -- Car ID 12: Ford Escape Blue - Status: available
                ('Ford', 'Escape', 2022, 'B501FRD', 'Blue', 'SUV', 60.00, 'available', '/src/assets/cars/ford-escape.jpeg', 
                 'Sistem SYNC 3, Hayon acționat electric, Scaune încălzite', 
                 18700, 'benzina', 65, '1.5 EcoBoost', 'automat', 5, 5, 57,
                 '2024-11-10', 18000, 28000, '1FMCU9HD6NUA12345', '2022-04-18', '2025-04-18', '2025-04-23'),
                
                -- Car ID 13: Ford Escape Silver - Status: rented
                ('Ford', 'Escape', 2022, 'B502FRD', 'Silver', 'SUV', 60.00, 'rented', '/src/assets/cars/ford-escape.jpeg', 
                 'Sistem SYNC 3, Hayon acționat electric, Scaune încălzite, Plafon panoramic', 
                 25400, 'benzina', 80, '1.5 EcoBoost', 'automat', 5, 5, 57,
                 '2024-09-15', 25000, 35000, '1FMCU9HD6NUA67890', '2022-06-22', '2025-06-22', '2025-06-27'),
                
                -- Car ID 14: Ford Mustang Red - Status: pending
                ('Ford', 'Mustang', 2023, 'B601FRD', 'Red', 'Sports', 90.00, 'pending', '/src/assets/cars/ford-mustang.jpeg', 
                 'Sistem audio premium, Pachet performanță, Decapotabilă', 
                 8900, 'benzina', 75, '5.0 V8', 'automat', 4, 2, 61,
                 '2024-11-25', 8500, 18500, '1FA6P8CF5P5123456', '2023-05-15', '2026-05-15', '2026-05-20'),
                
                -- Car ID 15: Ford Mustang Black - Status: available
                ('Ford', 'Mustang', 2023, 'B602FRD', 'Black', 'Sports', 90.00, 'available', '/src/assets/cars/ford-mustang.jpeg', 
                 'Sistem audio premium, Pachet performanță', 
                 6200, 'benzina', 90, '5.0 V8', 'automat', 4, 2, 61,
                 '2024-12-10', 6000, 16000, '1FA6P8CF5P5789012', '2023-07-08', '2026-07-08', '2026-07-13'),
                
                -- Car ID 16: Tesla Model 3 Blue - Status: rented
                ('Tesla', 'Model 3', 2023, 'B191TSL', 'Blue', 'Sedan', 95.00, 'rented', '/src/assets/cars/tesla-model3.jpeg', 
                 'Autopilot, Acoperiș din sticlă, Interior minimalist', 
                 8900, 'electric', 85, 'Dual Motor', 'automat', 5, 4, 0, -- Tank capacity 0 for electric
                 '2024-10-05', 8000, 18000, '5YJ3E1EA5PF123456', '2023-08-20', '2026-08-20', '2026-08-25'),
                
                -- Car ID 17: Tesla Model 3 White - Status: pending
                ('Tesla', 'Model 3', 2023, 'B192TSL', 'White', 'Sedan', 95.00, 'pending', '/src/assets/cars/tesla-model3.jpeg', 
                 'Autopilot, Acoperiș din sticlă, Interior minimalist, Autonomie extinsă', 
                 15600, 'electric', 65, 'Long Range', 'automat', 5, 4, 0,
                 '2024-09-20', 15000, 25000, '5YJ3E1EA5PF789012', '2023-06-12', '2026-06-12', '2026-06-17'),
                
                -- Car ID 18: Tesla Model 3 Black - Status: available
                ('Tesla', 'Model 3', 2023, 'B193TSL', 'Black', 'Sedan', 95.00, 'available', '/src/assets/cars/tesla-model3.jpeg', 
                 'Autopilot, Acoperiș din sticlă, Interior minimalist, Performanță', 
                 11400, 'electric', 95, 'Performance', 'automat', 5, 4, 0,
                 '2024-11-30', 11000, 21000, '5YJ3E1EA5PF345678', '2023-09-05', '2026-09-05', '2026-09-10'),
                
                -- Car ID 19: Mercedes C-Class Silver - Status: rented
                ('Mercedes', 'C-Class', 2023, 'B141MRC', 'Silver', 'Luxury', 90.00, 'rented', '/src/assets/cars/mercedes-cclass.jpeg', 
                 'Scaune cu masaj, Iluminare ambientală, Pachet asistență șofer', 
                 7800, 'benzina', 95, '2.0 Turbo', 'automat', 5, 4, 66,
                 '2024-12-01', 7500, 17500, 'WDD2050321F123456', '2023-10-15', '2026-10-15', '2026-10-20'),
                
                -- Car ID 20: Porsche 911 Yellow - Status: available
                ('Porsche', '911', 2023, 'B161PRS', 'Yellow', 'Sports', 150.00, 'available', '/src/assets/cars/porsche-911.jpeg', 
                 'Pachet Sport Chrono, Suspensie sport, Sistem audio Burmester', 
                 4200, 'benzina', 88, '3.0 Turbo', 'automat', 2, 2, 64,
                 '2024-11-20', 4000, 14000, 'WP0AA2A95PS123456', '2023-12-01', '2026-12-01', '2026-12-06'),

                -- NEW CARS START HERE (IDs 21-33)
                -- Car ID 21: Honda CR-V - Status: pending
                ('Honda', 'CR-V', 2023, 'B701HND', 'Red', 'SUV', 65.00, 'pending', '/src/assets/cars/honda-crv.jpeg',
                 'Honda Sensing, Apple CarPlay, Android Auto, Scaune încălzite',
                 9500, 'hybrid', 80, '2.0 i-MMD', 'automat', 5, 5, 57,
                 '2024-10-01', 9000, 19000, 'SHH RW1H7KJ012345', '2023-03-10', '2026-03-10', '2026-03-15'),

                -- Car ID 22: Hyundai Tucson - Status: available
                ('Hyundai', 'Tucson', 2023, 'B801HYN', 'Dark Knight', 'SUV', 60.00, 'available', '/src/assets/cars/hyundai-tucson.jpeg',
                 'Display digital 10.25 inch, Asistență la parcare, Cameră 360',
                 11200, 'benzina', 70, '1.6 T-GDI', 'automat', 5, 5, 54,
                 '2024-11-10', 10000, 20000, 'KMH TU31FPKU123456', '2023-04-05', '2026-04-05', '2026-04-10'),

                -- Car ID 23: Jeep Wrangler - Status: rented
                ('Jeep', 'Wrangler', 2022, 'B901JEP', 'Green', 'Off-road', 80.00, 'rented', '/src/assets/cars/jeep-wrangler.jpeg',
                 'Sistem 4x4 Command-Trac, Uconnect, Acoperiș detașabil',
                 15300, 'benzina', 50, '2.0 Turbo', 'automat', 4, 4, 70, 
                 '2024-09-15', 15000, 25000, '1J4 GA5GM2PW123456', '2022-07-20', '2025-07-20', '2025-07-25'),

                -- Car ID 24: Kia Sportage - Status: available
                ('Kia', 'Sportage', 2023, 'B1001KIA', 'Blue Flame', 'SUV', 58.00, 'available', '/src/assets/cars/kia-sportage.jpeg',
                 'Ecran curbat panoramic, DriveWise, Încărcare wireless telefon',
                 7600, 'hybrid', 85, '1.6 T-GDI Hybrid', 'automat', 5, 5, 52,
                 '2024-12-01', 7000, 17000, 'KNA PC52R8P6123456', '2023-05-15', '2026-05-15', '2026-05-20'),

                -- Car ID 25: Lexus ES - Status: pending
                ('Lexus', 'ES', 2023, 'B1101LEX', 'Sonic Quartz', 'Luxury Sedan', 85.00, 'pending', '/src/assets/cars/lexus-es.jpeg',
                 'Sistem audio Mark Levinson, Lexus Safety System+, Scaune ventilate',
                 6500, 'hybrid', 90, '2.5 Hybrid', 'automat', 5, 4, 50,
                 '2025-01-10', 6000, 16000, 'JTH BF1D20P5123456', '2023-06-20', '2026-06-20', '2026-06-25'),

                -- Car ID 26: Mazda CX-5 - Status: available
                ('Mazda', 'CX-5', 2023, 'B1201MZD', 'Soul Red Crystal', 'SUV', 62.00, 'available', '/src/assets/cars/mazda-cx5.jpeg',
                 'Sistem i-Activsense, Head-up display color, Tapițerie piele Nappa',
                 8800, 'benzina', 70, '2.5 Skyactiv-G', 'automat', 5, 5, 58,
                 '2024-11-20', 8000, 18000, 'JMZ KF2W7AP0123456', '2023-07-01', '2026-07-01', '2026-07-06'),

                -- Car ID 27: Nissan Altima - Status: rented
                ('Nissan', 'Altima', 2022, 'B1301NIS', 'Gun Metallic', 'Sedan', 55.00, 'rented', '/src/assets/cars/nissan-altima.jpeg',
                 'ProPILOT Assist, Zero Gravity Seats, NissanConnect',
                 19500, 'benzina', 60, '2.5 DIG', 'automat', 5, 4, 61,
                 '2024-08-10', 19000, 29000, '1N4 AL4APXNC123456', '2022-09-01', '2025-09-01', '2025-09-06'),
                
                -- Car ID 28: Porsche Cayenne - Status: pending
                ('Porsche', 'Cayenne', 2023, 'B1701PRS', 'Black', 'Luxury SUV', 130.00, 'pending', '/src/assets/cars/porsche-cayenne.jpeg',
                 'Porsche Communication Management (PCM), Suspensie pneumatică adaptivă, Pachet Sport Chrono',
                 5500, 'hybrid', 75, 'E-Hybrid', 'automat', 5, 5, 75,
                 '2025-01-15', 5000, 15000, 'WP1 ZZZ9YZPDA12345', '2023-08-10', '2026-08-10', '2026-08-15'),

                -- Car ID 29: Subaru Outback - Status: available
                ('Subaru', 'Outback', 2023, 'B1801SBR', 'Autumn Green', 'Station Wagon', 70.00, 'available', '/src/assets/cars/subaru-outback.jpeg',
                 'Symmetrical AWD, EyeSight Driver Assist, X-MODE',
                 10200, 'benzina', 80, '2.5 Boxer', 'automat', 5, 5, 63,
                 '2024-10-25', 10000, 20000, 'JF1 BS9KJ8PG123456', '2023-02-15', '2026-02-15', '2026-02-20'),
                
                -- Car ID 30: Toyota Camry - Status: rented
                ('Toyota', 'Camry', 2023, 'B2001TYT', 'Supersonic Red', 'Sedan', 68.00, 'rented', '/src/assets/cars/toyota-camry.jpeg',
                 'Toyota Safety Sense 2.5+, Display multimedia 9 inch, Scaune față ventilate',
                 12300, 'hybrid', 70, '2.5 Hybrid', 'automat', 5, 4, 50,
                 '2024-11-01', 12000, 22000, '4T1 B11HK5PU123456', '2023-03-25', '2026-03-25', '2026-03-30'),

                -- Car ID 31: Toyota Corolla - Status: available
                ('Toyota', 'Corolla', 2023, 'B2101TYT', 'Celestite Gray', 'Sedan', 50.00, 'available', '/src/assets/cars/toyota-corolla.jpeg',
                 'Toyota Safety Sense, Apple CarPlay, Android Auto, Ecran tactil 8 inch',
                 14500, 'hybrid', 90, '1.8 Hybrid', 'automat', 5, 4, 43,
                 '2024-09-01', 14000, 24000, 'NMT BZ3HE9PX123456', '2023-01-20', '2026-01-20', '2026-01-25'),

                -- Car ID 32: Volkswagen Golf - Status: pending
                ('Volkswagen', 'Golf', 2023, 'B2201VW', 'Moonstone Grey', 'Hatchback', 55.00, 'pending', '/src/assets/cars/volkswagen-golf.jpeg',
                 'Digital Cockpit Pro, IQ.DRIVE, We Connect',
                 9800, 'benzina', 65, '1.5 TSI', 'manual', 5, 5, 50,
                 '2024-12-10', 9500, 19500, 'WVW ZZZAUZPW123456', '2023-04-12', '2026-04-12', '2026-04-17')
            `);

            const [customers] = await pool.query('SELECT id FROM customers'); // Ensure customers are loaded if not already
            if (customers.length === 0) { // Minimal customer insert if none exist, should be handled by original logic
                await pool.query(`
                    INSERT INTO customers (first_name, last_name, email, phone, driver_license, address, license_verified, license_image_url) VALUES
                    ('Andrei', 'Popescu', 'andrei.popescu@gmail.com', '0722123456', 'B 123456', 'Strada Victoriei 10, București, România', 1, 'src/assets/licenses/license-andrei-popescu-B123456.png'),
                    ('Maria', 'Ionescu', 'maria.ionescu@yahoo.com', '0733234567', 'CT 234567', 'Bulevardul Mamaia 25, Constanța, România', 1, 'src/assets/licenses/license-maria-ionescu-CT234567.png'),
                    ('Alexandru', 'Dumitrescu', 'alex.dumitrescu@gmail.com', '0744345678', 'IS 345678', 'Strada Ștefan cel Mare 5, Iași, România', 1, 'src/assets/licenses/license-alexandru-dumitrescu-IS345678.png'),
                    ('Elena', 'Popa', 'elena.popa@gmail.com', '0755456789', 'CJ 456789', 'Bulevardul Eroilor 15, Cluj-Napoca, România', 0, NULL),
                    ('Mihai', 'Constantin', 'mihai.constantin@yahoo.com', '0766567890', 'TM 567890', 'Strada Alba Iulia 7, Timișoara, România', 1, 'src/assets/licenses/license-mihai-constantin-TM567890.png'),
                    ('Ana', 'Georgescu', 'ana.georgescu@gmail.com', '0777678901', 'B 678901', 'Calea Dorobanți 30, București, România', 0, NULL),
                    ('Bogdan', 'Marin', 'bogdan.marin@yahoo.com', '0788789012', 'BV 789012', 'Strada Lungă 20, Brașov, România', 1, 'src/assets/licenses/license-bogdan-marin-BV789012.png'),
                    ('Cristina', 'Stancu', 'cristina.stancu@gmail.com', '0799890123', 'PH 890123', 'Bulevardul Republicii 12, Ploiești, România', 0, NULL),
                    ('Adrian', 'Stoica', 'adrian.stoica@gmail.com', '0712334455', 'CT 334455', 'Strada Portului 8, Constanța, România', 1, 'src/assets/licenses/license-adrian-stoica-CT334455.png'),
                    ('Denis', 'Popovici', 'denis.popovici@yahoo.com', '0723334455', 'IS 334455', 'Bulevardul Independenței 12, Iași, România', 1, 'src/assets/licenses/license-denis-popovici-IS334455.png'),
                    ('Florin', 'Ciobanu', 'florin.ciobanu@gmail.com', '0734556677', 'BT 556677', 'Strada Republicii 45, Botoșani, România', 1, 'src/assets/licenses/license-florin-ciobanu-BT556677.png'),
                    ('Gabriel', 'Vasilescu', 'gabriel.vasilescu@yahoo.com', '0745112233', 'B 112233', 'Calea Floreasca 22, București, România', 1, 'src/assets/licenses/license-gabriel-vasilescu-B112233.png'),
                    ('Octavian', 'Rusu', 'octavian.rusu@gmail.com', '0756334400', 'MS 334400', 'Strada Cuza Vodă 18, Târgu Mureș, România', 1, 'src/assets/licenses/license-octavian-rusu-MS334400.png'),
                    ('Răzvan', 'Dragomir', 'razvan.dragomir@yahoo.com', '0767778899', 'VL 778899', 'Bulevardul Tudor Vladimirescu 33, Râmnicu Vâlcea, România', 1, 'src/assets/licenses/license-razvan-dragomir-VL778899.png'),
                    ('Sorin', 'Bucur', 'sorin.bucur@gmail.com', '0778110022', 'MM 110022', 'Strada Libertății 7, Baia Mare, România', 1, 'src/assets/licenses/license-sorin-bucur-MM110022.png'),
                    ('Tudor', 'Mihai', 'tudor.mihai@yahoo.com', '0789990011', 'HD 990011', 'Strada Mihai Eminescu 15, Deva, România', 1, 'src/assets/licenses/license-tudor-mihai-HD990011.png'),
                    ('Victor', 'Radu', 'victor.radu@gmail.com', '0791112233', 'B 112233', 'Strada Amzei 28, București, România', 1, 'src/assets/licenses/license-victor-radu-B112233.png')
                `);
            }

            console.log('Sample data with complete technical specifications inserted successfully');

            const [carsForHistory] = await pool.query('SELECT id FROM cars LIMIT 20');
            const [adminsForHistory] = await pool.query('SELECT id FROM admins');

            if (carsForHistory.length > 0 && adminsForHistory.length > 0) {
                const today = new Date();
                const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
                const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
                const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
                const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);

                await pool.query(`
                    INSERT INTO car_technical_history (car_id, kilometers, fuel_level, notes, updated_by, created_at) VALUES
                    (1, 10500, 100, 'Preluare mașină după service complet la 10.000 km. Schimbat ulei motor, filtru aer, verificat frâne.', 1, '${twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (1, 12800, 45, 'Mașină returnată de client după închiriere de 7 zile. Necesită alimentare completă cu combustibil.', 2, '${oneMonthAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (1, 15420, 70, 'Returnare client Popescu Andrei. Mașină în stare foarte bună, km parcurși: 2220. Client mulțumit.', 1, '${fiveDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (4, 3200, 90, 'Preluare mașină nouă din reprezentanță. Prima verificare tehnică completă efectuată.', 1, '${twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (4, 5600, 75, 'Verificare periodică sistem hibrid. Regenerare baterie efectuată cu succes, autonomie electrică 45km.', 1, '${oneWeekAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (9, 42000, 30, 'Service major la 40.000 km: schimb ulei, filtru combustibil, verificare amortizoare. Totul în regulă.', 1, '${twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (9, 45600, 40, 'Ultima returnare client. Necesită alimentare urgentă înainte de următoarea rezervare.', 2, '${threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (16, 6800, 95, 'Preluare Tesla din showroom. Prima încărcare completă la stația Supercharger, autonomie 450km.', 1, '${twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (16, 8900, 85, 'Client foarte mulțumit de performanțele mașinii. Consum mediu 16kWh/100km în oraș.', 1, '${fiveDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (14, 7200, 40, 'Prima închiriere finalizată (Mustang Red). Client pasionat de mașini sport, a condus responsabil.', 1, '${oneMonthAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (14, 8900, 75, 'Client actual foarte atent cu mașina (Mustang Red). Consum înregistrat: 12L/100km.', 1, '${oneWeekAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (20, 2500, 95, 'Preluare Porsche din service autorizat. Verificare completă, toate sistemele funcționează perfect.', 1, '${twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (20, 4200, 88, 'Verificare tehnică după 2000km. Frâne ceramice în stare excelentă.', 2, '${oneWeekAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (19, 5800, 100, 'Service complet la Mercedes autorizat. Schimbat filtru particule, verificat sistemul MBUX.', 1, '${twoMonthsAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (19, 7800, 95, 'Ultimi clienți foarte mulțumiți de sistemele de asistență și confortul interior premium.', 1, '${fiveDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (2, 8200, 90, 'Audi A4 TDI Black - returnare fără probleme. Consum excelent motorină: 4.8L/100km pe autostradă.', 1, '${threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (5, 22300, 60, 'BMW X5 Diesel - service preventiv la 22.000km. Schimbat uleiul diferenței, filtru habitaclu.', 1, '${fiveDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (7, 28500, 70, 'Chevrolet Equinox - verificare sistem Android Auto după reclamație client. Problemă rezolvată.', 1, '${threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (10, 12000, 70, 'Dacia Logan GPL - prima verificare sistem GPL după 10.000km. Totul funcționează în parametri normali.', 1, '${oneWeekAgo.toISOString().slice(0, 19).replace('T', ' ')}'),
                    (15, 6200, 90, 'Ford Mustang Black - client pasionat de fotografie auto. Mașină folosită pentru shooting foto.', 1, '${fiveDaysAgo.toISOString().slice(0, 19).replace('T', ' ')}')
                `);
                console.log('Romanian technical history data inserted/updated successfully');
            }

            // Insert ACCURATE rental data around May 29, 2025. No overlaps per car.
            // KM and Fuel levels are illustrative. Active/Pending rentals have NULL for end_km/end_fuel.
            console.log('Creating accurate rental data around May 29, 2025...');
            await pool.query(`
                INSERT INTO rentals (car_id, customer_id, start_date, end_date, status, total_cost, payment_status, notes, start_km, end_km, start_fuel_level, end_fuel_level) VALUES
                -- CAR ID 1: Audi A4 Gray (Status: rented on 2025-05-29)
                (1, 1, '2025-05-15', '2025-05-20', 'completed', 350.00, 'paid', 'Client mulțumit, călătorie business.', 15000, 15420, 100, 70),
                (1, 2, '2025-05-27', '2025-06-01', 'active', 350.00, 'paid', 'Închiriere de weekend prelungit.', 15450, NULL, 100, NULL),
                (1, 3, '2025-06-05', '2025-06-10', 'pending', 350.00, 'unpaid', 'Rezervare pentru vacanță.', NULL, NULL, NULL, NULL),

                -- CAR ID 2: Audi A4 Black (Status: available on 2025-05-29)
                (2, 4, '2025-05-10', '2025-05-14', 'completed', 288.00, 'paid', 'Delegație corporativă.', 7800, 8200, 100, 90),
                (2, 5, '2025-06-03', '2025-06-07', 'pending', 288.00, 'unpaid', 'Rezervare pentru conferință.', NULL, NULL, NULL, NULL),

                -- CAR ID 3: Audi A4 White (Status: pending on 2025-05-29)
                (3, 6, '2025-05-20', '2025-05-24', 'completed', 280.00, 'paid', 'Călătorie personală.', 21500, 22000, 100, 80),
                (3, 7, '2025-05-30', '2025-06-03', 'pending', 280.00, 'partial', 'Eveniment special.', NULL, NULL, NULL, NULL),

                -- CAR ID 4: BMW X5 White (Status: available on 2025-05-29)
                (4, 8, '2025-05-01', '2025-05-05', 'completed', 380.00, 'paid', 'Test drive extins.', 5200, 5600, 100, 75),
                (4, 9, '2025-06-10', '2025-06-15', 'pending', 475.00, 'unpaid', 'Vacanță la munte.', NULL, NULL, NULL, NULL),
                
                -- CAR ID 5: BMW X5 Black (Status: rented on 2025-05-29)
                (5, 10, '2025-05-18', '2025-05-22', 'completed', 360.00, 'paid', 'Necesități de transport urgente.', 21800, 22300, 100, 60),
                (5, 11, '2025-05-28', '2025-06-02', 'active', 450.00, 'paid', 'Proiect pe termen scurt.', 22350, NULL, 100, NULL),

                -- CAR ID 6: BMW X5 Blue (Status: maintenance) - No rentals planned during maintenance
                
                -- CAR ID 7: Chevrolet Equinox Black (Status: available)
                (7, 12, '2025-05-05', '2025-05-09', 'completed', 220.00, 'paid', 'Familie în vizită.', 28000, 28500, 100, 70),
                (7, 13, '2025-06-08', '2025-06-12', 'pending', 220.00, 'unpaid', 'Excursie de weekend.', NULL, NULL, NULL, NULL),

                -- CAR ID 8: Chevrolet Equinox Silver (Status: pending)
                (8, 14, '2025-05-15', '2025-05-19', 'completed', 220.00, 'paid', 'Călătorie în afara orașului.', 30700, 31200, 100, 85),
                (8, 15, '2025-06-01', '2025-06-05', 'pending', 220.00, 'unpaid', 'Rezervare client fidel.', NULL, NULL, NULL, NULL),

                -- CAR ID 10: Dacia Logan White (Status: rented)
                (10, 1, '2025-05-25', '2025-06-01', 'active', 192.00, 'paid', 'Închiriere economică.', 11800, NULL, 90, NULL),

                -- CAR ID 11: Dacia Logan Blue (Status: pending)
                (11, 2, '2025-05-31', '2025-06-04', 'pending', 120.00, 'unpaid', 'Pentru treburi administrative.', NULL, NULL, NULL, NULL),

                -- CAR ID 13: Ford Escape Silver (Status: rented)
                (13, 3, '2025-05-26', '2025-05-30', 'active', 300.00, 'paid', 'SUV confortabil pentru drum lung.', 25000, NULL, 90, NULL),

                -- CAR ID 14: Ford Mustang Red (Status: pending)
                (14, 4, '2025-06-02', '2025-06-05', 'pending', 270.00, 'partial', 'Experiență Mustang.', NULL, NULL, NULL, NULL),
                
                -- CAR ID 16: Tesla Model 3 Blue (Status: rented)
                (16, 5, '2025-05-29', '2025-06-03', 'active', 475.00, 'paid', 'Testare mașină electrică.', 8500, NULL, 95, NULL),

                -- CAR ID 17: Tesla Model 3 White (Status: pending)
                (17, 6, '2025-05-12', '2025-05-16', 'completed', 380.00, 'paid', 'Client interesat de EV.', 15000, 15600, 100, 65),
                (17, 7, '2025-06-01', '2025-06-04', 'pending', 285.00, 'unpaid', 'Rezervare pentru evaluare.', NULL, NULL, NULL, NULL),

                -- CAR ID 19: Mercedes C-Class Silver (Status: rented)
                (19, 8, '2025-05-27', '2025-05-31', 'active', 360.00, 'paid', 'Eleganță pentru eveniment.', 7500, NULL, 100, NULL),

                -- CAR ID 21: Honda CR-V (Status: pending)
                (21, 9, '2025-05-10', '2025-05-14', 'completed', 260.00, 'paid', 'Familie, spațiu necesar.', 9100, 9500, 100, 80),
                (21, 10, '2025-06-03', '2025-06-07', 'pending', 260.00, 'unpaid', 'Călătorie de vară.', NULL, NULL, NULL, NULL),

                -- CAR ID 23: Jeep Wrangler (Status: rented)
                (23, 11, '2025-05-28', '2025-06-02', 'active', 400.00, 'paid', 'Aventură off-road.', 15000, NULL, 80, NULL),

                -- CAR ID 25: Lexus ES (Status: pending)
                (25, 12, '2025-06-05', '2025-06-09', 'pending', 340.00, 'partial', 'Confort și lux.', NULL, NULL, NULL, NULL),
                
                -- CAR ID 27: Nissan Altima (Status: rented)
                (27, 13, '2025-05-25', '2025-05-30', 'active', 275.00, 'paid', 'Sedan fiabil pentru oraș.', 19200, NULL, 70, NULL),

                -- CAR ID 28: Porsche Cayenne (Status: pending)
                (28, 14, '2025-06-07', '2025-06-11', 'pending', 520.00, 'unpaid', 'Ocazie specială.', NULL, NULL, NULL, NULL),
                
                -- CAR ID 30: Toyota Camry (Status: rented)
                (30, 15, '2025-05-26', '2025-05-31', 'active', 340.00, 'paid', 'Hybrid eficient pentru business.', 12000, NULL, 85, NULL),

                -- CAR ID 32: Volkswagen Golf (Status: pending)
                (32, 16, '2025-05-19', '2025-05-23', 'completed', 220.00, 'paid', 'Mașină agilă pentru oraș.', 9600, 9800, 100, 65),
                (32, 17, '2025-06-02', '2025-06-06', 'pending', 220.00, 'unpaid', 'Închiriere standard.', NULL, NULL, NULL, NULL)
            `);
            console.log('Accurate rental data around May 29, 2025 created successfully');
        } else {
            console.log(`Database already contains ${carCount[0].count} cars. Skipping sample data.`);
        }

        console.log('Database tables with complete technical specifications and Romanian data created/verified successfully');
    } catch (error) {
        console.error('Error with database tables:', error);
        throw error;
    }
}

module.exports = { createTables };