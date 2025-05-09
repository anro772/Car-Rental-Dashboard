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
                license_image_url VARCHAR(255),
                license_verified BOOLEAN DEFAULT FALSE,
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

            // Insert sample car data with image URLs pointing to the cars folder
            // Including multiple variants of the same car model with different colors
            await pool.query(`
                INSERT INTO cars (brand, model, year, license_plate, color, category, daily_rate, status, image_url, features) VALUES
                -- Audi A4 variants
                ('Audi', 'A4', 2022, 'B101AUD', 'Gray', 'Sedan', 70.00, 'available', '/src/assets/cars/audi-a4.jpeg', 'Navigație, Scaune încălzite, Bluetooth, Climatizare automată'),
                ('Audi', 'A4', 2023, 'B102AUD', 'Black', 'Sedan', 72.00, 'available', '/src/assets/cars/audi-a4.jpeg', 'Navigație, Scaune încălzite, Bluetooth, Climatizare automată, Pilot automat adaptiv (notă: culoarea reală este neagră)'),
                ('Audi', 'A4', 2022, 'B103AUD', 'White', 'Sedan', 70.00, 'rented', '/src/assets/cars/audi-a4.jpeg', 'Navigație, Scaune încălzite, Bluetooth, Climatizare automată, Cameră marșarier (notă: culoarea reală este albă)'),
                
                -- BMW X5 variants
                ('BMW', 'X5', 2023, 'B201BMW', 'White', 'SUV', 95.00, 'available', '/src/assets/cars/bmw-x5.jpeg', 'Pachet M Sport, Cameră 360, Head-up display, Sistem audio premium'),
                ('BMW', 'X5', 2022, 'B202BMW', 'Black', 'SUV', 90.00, 'available', '/src/assets/cars/bmw-x5.jpeg', 'Cameră 360, Head-up display, Sistem audio premium (notă: culoarea reală este neagră)'),
                ('BMW', 'X5', 2023, 'B203BMW', 'Blue', 'SUV', 95.00, 'maintenance', '/src/assets/cars/bmw-x5.jpeg', 'Pachet M Sport, Cameră 360, Head-up display, Sistem audio premium, Plafon panoramic (notă: culoarea reală este albastră)'),
                
                -- Chevrolet Equinox
                ('Chevrolet', 'Equinox', 2022, 'B301CHV', 'Black', 'SUV', 55.00, 'available', '/src/assets/cars/chevrolet-equinox.jpeg', 'Android Auto, Apple CarPlay, Scaune încălzite'),
                ('Chevrolet', 'Equinox', 2022, 'B302CHV', 'Silver', 'SUV', 55.00, 'available', '/src/assets/cars/chevrolet-equinox.jpeg', 'Android Auto, Apple CarPlay, Scaune încălzite, Cameră marșarier (notă: culoarea reală este argintie)'),
                
                -- Dacia Logan
                ('Dacia', 'Logan', 2022, 'B401DCL', 'Silver', 'Sedan', 30.00, 'available', '/src/assets/cars/dacia-logan.jpeg', 'Bluetooth, Aer condiționat, Sistem navigație MediaNav'),
                ('Dacia', 'Logan', 2023, 'B402DCL', 'White', 'Sedan', 32.00, 'available', '/src/assets/cars/dacia-logan.jpeg', 'Bluetooth, Aer condiționat, Sistem navigație MediaNav, Senzori parcare (notă: culoarea reală este albă)'),
                ('Dacia', 'Logan', 2022, 'B403DCL', 'Blue', 'Sedan', 30.00, 'rented', '/src/assets/cars/dacia-logan.jpeg', 'Bluetooth, Aer condiționat, Sistem navigație MediaNav (notă: culoarea reală este albastră)'),
                
                -- Ford models
                ('Ford', 'Escape', 2022, 'B501FRD', 'Blue', 'SUV', 60.00, 'available', '/src/assets/cars/ford-escape.jpeg', 'Sistem SYNC 3, Hayon acționat electric, Scaune încălzite'),
                ('Ford', 'Escape', 2022, 'B502FRD', 'Silver', 'SUV', 60.00, 'available', '/src/assets/cars/ford-escape.jpeg', 'Sistem SYNC 3, Hayon acționat electric, Scaune încălzite, Plafon panoramic (notă: culoarea reală este argintie)'),
                ('Ford', 'Mustang', 2023, 'B601FRD', 'Red', 'Sports', 90.00, 'rented', '/src/assets/cars/ford-mustang.jpeg', 'Sistem audio premium, Pachet performanță, Decapotabilă'),
                ('Ford', 'Mustang', 2023, 'B602FRD', 'Black', 'Sports', 90.00, 'available', '/src/assets/cars/ford-mustang.jpeg', 'Sistem audio premium, Pachet performanță, Decapotabilă (notă: culoarea reală este neagră)'),
                
                -- Honda CR-V
                ('Honda', 'CR-V', 2022, 'B701HND', 'Blue', 'SUV', 65.00, 'available', '/src/assets/cars/honda-crv.jpeg', 'Scaune din piele, Plafon panoramic, Sistem de navigație'),
                ('Honda', 'CR-V', 2022, 'B702HND', 'White', 'SUV', 65.00, 'available', '/src/assets/cars/honda-crv.jpeg', 'Scaune din piele, Plafon panoramic, Sistem de navigație, Încărcare wireless (notă: culoarea reală este albă)'),
                ('Honda', 'CR-V', 2022, 'B703HND', 'Silver', 'SUV', 65.00, 'maintenance', '/src/assets/cars/honda-crv.jpeg', 'Scaune din piele, Plafon panoramic, Sistem de navigație (notă: culoarea reală este argintie)'),
                
                -- Other models
                ('Hyundai', 'Tucson', 2022, 'B801HYD', 'Green', 'SUV', 55.00, 'available', '/src/assets/cars/hyundai-tucson.jpeg', 'Asistență la conducere, Apple CarPlay, Cameră 360'),
                ('Hyundai', 'Tucson', 2022, 'B802HYD', 'White', 'SUV', 55.00, 'available', '/src/assets/cars/hyundai-tucson.jpeg', 'Asistență la conducere, Apple CarPlay, Cameră 360 (notă: culoarea reală este albă)'),
                
                ('Jeep', 'Wrangler', 2022, 'B901JPW', 'Black', 'SUV', 80.00, 'maintenance', '/src/assets/cars/jeep-wrangler.jpeg', '4x4, Decapotabilă, Sistem multimedia Uconnect'),
                ('Jeep', 'Wrangler', 2022, 'B902JPW', 'Green', 'SUV', 80.00, 'available', '/src/assets/cars/jeep-wrangler.jpeg', '4x4, Decapotabilă, Sistem multimedia Uconnect (notă: culoarea reală este verde)'),
                
                ('Kia', 'Sportage', 2022, 'B110KIA', 'Silver', 'SUV', 55.00, 'available', '/src/assets/cars/kia-sportage.jpeg', 'Navigație, Cameră marșarier, Scaune încălzite'),
                ('Kia', 'Sportage', 2022, 'B111KIA', 'Black', 'SUV', 55.00, 'rented', '/src/assets/cars/kia-sportage.jpeg', 'Navigație, Cameră marșarier, Scaune încălzite, Plafon panoramic (notă: culoarea reală este neagră)'),
                
                ('Lexus', 'ES', 2023, 'B121LXS', 'Black', 'Luxury', 85.00, 'available', '/src/assets/cars/lexus-es.jpeg', 'Interior din piele, Sistem audio Mark Levinson, Asistență la conducere'),
                ('Lexus', 'ES', 2023, 'B122LXS', 'White', 'Luxury', 85.00, 'available', '/src/assets/cars/lexus-es.jpeg', 'Interior din piele, Sistem audio Mark Levinson, Asistență la conducere (notă: culoarea reală este albă)'),
                
                ('Mazda', 'CX5', 2022, 'B131MZD', 'Red', 'SUV', 60.00, 'rented', '/src/assets/cars/mazda-cx5.jpeg', 'Sistem Bose, Scaune încălzite, Apple CarPlay'),
                ('Mazda', 'CX5', 2022, 'B132MZD', 'Blue', 'SUV', 60.00, 'available', '/src/assets/cars/mazda-cx5.jpeg', 'Sistem Bose, Scaune încălzite, Apple CarPlay, Cameră 360 (notă: culoarea reală este albastră)'),
                
                ('Mercedes', 'C-Class', 2023, 'B141MRC', 'Silver', 'Luxury', 90.00, 'available', '/src/assets/cars/mercedes-cclass.jpeg', 'Scaune cu masaj, Iluminare ambientală, Pachet asistență șofer'),
                ('Mercedes', 'C-Class', 2023, 'B142MRC', 'Black', 'Luxury', 90.00, 'available', '/src/assets/cars/mercedes-cclass.jpeg', 'Scaune cu masaj, Iluminare ambientală, Pachet asistență șofer, Plafon panoramic (notă: culoarea reală este neagră)'),
                ('Mercedes', 'C-Class', 2022, 'B143MRC', 'White', 'Luxury', 85.00, 'rented', '/src/assets/cars/mercedes-cclass.jpeg', 'Scaune cu masaj, Iluminare ambientală, Pachet asistență șofer (notă: culoarea reală este albă)'),
                
                ('Nissan', 'Altima', 2022, 'B151NSN', 'White', 'Sedan', 50.00, 'available', '/src/assets/cars/nissan-altima.jpeg', 'ProPilot Assist, Încărcare wireless, Android Auto'),
                ('Nissan', 'Altima', 2022, 'B152NSN', 'Blue', 'Sedan', 50.00, 'available', '/src/assets/cars/nissan-altima.jpeg', 'ProPilot Assist, Încărcare wireless, Android Auto (notă: culoarea reală este albastră)'),
                
                ('Porsche', '911', 2023, 'B161PRS', 'Yellow', 'Sports', 150.00, 'available', '/src/assets/cars/porsche-911.jpeg', 'Pachet Sport Chrono, Suspensie sport, Sistem audio Burmester'),
                ('Porsche', '911', 2023, 'B162PRS', 'Red', 'Sports', 150.00, 'available', '/src/assets/cars/porsche-911.jpeg', 'Pachet Sport Chrono, Suspensie sport, Sistem audio Burmester (notă: culoarea reală este roșie)'),
                
                ('Porsche', 'Cayenne', 2023, 'B171PRS', 'Black', 'SUV', 120.00, 'available', '/src/assets/cars/porsche-cayenne.jpeg', 'Plafon panoramic, Sistem BOSE, Suspensie pneumatică'),
                ('Porsche', 'Cayenne', 2023, 'B172PRS', 'White', 'SUV', 120.00, 'available', '/src/assets/cars/porsche-cayenne.jpeg', 'Plafon panoramic, Sistem BOSE, Suspensie pneumatică, Scaune cu masaj (notă: culoarea reală este albă)'),
                
                ('Subaru', 'Outback', 2022, 'B181SBR', 'Green', 'Wagon', 65.00, 'available', '/src/assets/cars/subaru-outback.jpeg', 'Sistem EyeSight, X-Mode, Apple CarPlay'),
                ('Subaru', 'Outback', 2022, 'B182SBR', 'Blue', 'Wagon', 65.00, 'available', '/src/assets/cars/subaru-outback.jpeg', 'Sistem EyeSight, X-Mode, Apple CarPlay, Sistem audio Harman Kardon (notă: culoarea reală este albastră)'),
                
                ('Tesla', 'Model 3', 2023, 'B191TSL', 'Blue', 'Sedan', 95.00, 'available', '/src/assets/cars/tesla-model3.jpeg', 'Autopilot, Acoperiș din sticlă, Interior minimalist'),
                ('Tesla', 'Model 3', 2023, 'B192TSL', 'White', 'Sedan', 95.00, 'rented', '/src/assets/cars/tesla-model3.jpeg', 'Autopilot, Acoperiș din sticlă, Interior minimalist, Autonomie extinsă (notă: culoarea reală este albă)'),
                ('Tesla', 'Model 3', 2023, 'B193TSL', 'Black', 'Sedan', 95.00, 'available', '/src/assets/cars/tesla-model3.jpeg', 'Autopilot, Acoperiș din sticlă, Interior minimalist, Performanță (notă: culoarea reală este neagră)'),
                
                ('Toyota', 'Camry', 2022, 'B201TYT', 'Silver', 'Sedan', 55.00, 'available', '/src/assets/cars/toyota-camry.jpeg', 'Toyota Safety Sense, Cameră marșarier, Android Auto'),
                ('Toyota', 'Camry', 2022, 'B202TYT', 'White', 'Sedan', 55.00, 'available', '/src/assets/cars/toyota-camry.jpeg', 'Toyota Safety Sense, Cameră marșarier, Android Auto (notă: culoarea reală este albă)'),
                ('Toyota', 'Camry', 2022, 'B203TYT', 'Black', 'Sedan', 55.00, 'rented', '/src/assets/cars/toyota-camry.jpeg', 'Toyota Safety Sense, Cameră marșarier, Android Auto, Plafon panoramic (notă: culoarea reală este neagră)'),
                
                ('Toyota', 'Corolla', 2022, 'B211TYT', 'White', 'Sedan', 45.00, 'available', '/src/assets/cars/toyota-corolla.jpeg', 'Toyota Safety Sense, Bluetooth, Cameră marșarier'),
                ('Toyota', 'Corolla', 2022, 'B212TYT', 'Blue', 'Sedan', 45.00, 'available', '/src/assets/cars/toyota-corolla.jpeg', 'Toyota Safety Sense, Bluetooth, Cameră marșarier (notă: culoarea reală este albastră)'),
                
                ('Volkswagen', 'Golf', 2022, 'B221VWG', 'Blue', 'Hatchback', 50.00, 'maintenance', '/src/assets/cars/volkswagen-golf.jpeg', 'Digital Cockpit, Sistem Discover Media, Climatizare automată'),
                ('Volkswagen', 'Golf', 2022, 'B222VWG', 'Black', 'Hatchback', 50.00, 'available', '/src/assets/cars/volkswagen-golf.jpeg', 'Digital Cockpit, Sistem Discover Media, Climatizare automată (notă: culoarea reală este neagră)'),
                ('Volkswagen', 'Golf', 2022, 'B223VWG', 'Red', 'Hatchback', 50.00, 'available', '/src/assets/cars/volkswagen-golf.jpeg', 'Digital Cockpit, Sistem Discover Media, Climatizare automată, Faruri LED (notă: culoarea reală este roșie)')
            `);

            // Insert sample customer data with Romanian names and information - adding more customers
            await pool.query(`
                INSERT INTO customers (first_name, last_name, email, phone, driver_license, address, license_verified) VALUES
                -- Original customers
                ('Andrei', 'Popescu', 'andrei.popescu@gmail.com', '0722123456', 'B 123456', 'Strada Victoriei 10, București, România', 1),
                ('Maria', 'Ionescu', 'maria.ionescu@yahoo.com', '0733234567', 'CT 234567', 'Bulevardul Mamaia 25, Constanța, România', 0),
                ('Alexandru', 'Dumitrescu', 'alex.dumitrescu@gmail.com', '0744345678', 'IS 345678', 'Strada Ștefan cel Mare 5, Iași, România', 1),
                ('Elena', 'Popa', 'elena.popa@gmail.com', '0755456789', 'CJ 456789', 'Bulevardul Eroilor 15, Cluj-Napoca, România', 0),
                ('Mihai', 'Constantin', 'mihai.constantin@yahoo.com', '0766567890', 'TM 567890', 'Strada Alba Iulia 7, Timișoara, România', 1),
                ('Ana', 'Georgescu', 'ana.georgescu@gmail.com', '0777678901', 'B 678901', 'Calea Dorobanți 30, București, România', 0),
                ('Bogdan', 'Marin', 'bogdan.marin@yahoo.com', '0788789012', 'BV 789012', 'Strada Lungă 20, Brașov, România', 1),
                ('Cristina', 'Stancu', 'cristina.stancu@gmail.com', '0799890123', 'PH 890123', 'Bulevardul Republicii 12, Ploiești, România', 0),
                
                -- Additional customers from various Romanian cities
                ('Gabriel', 'Vasilescu', 'gabriel.vasilescu@gmail.com', '0711234567', 'B 112233', 'Bulevardul Unirii 45, București, România', 1),
                ('Ioana', 'Diaconu', 'ioana.diaconu@yahoo.com', '0722345678', 'SB 223344', 'Strada Nicolae Bălcescu 8, Sibiu, România', 0),
                ('Adrian', 'Stoica', 'adrian.stoica@gmail.com', '0733456789', 'CT 334455', 'Strada Mircea cel Bătrân 15, Constanța, România', 1),
                ('Daniela', 'Nistor', 'daniela.nistor@yahoo.com', '0744567890', 'AR 445566', 'Bulevardul Revoluției 23, Arad, România', 0),
                ('Florin', 'Ciobanu', 'florin.ciobanu@gmail.com', '0755678901', 'BT 556677', 'Calea Națională 10, Botoșani, România', 1),
                ('Laura', 'Preda', 'laura.preda@yahoo.com', '0766789012', 'GL 667788', 'Strada Domnească 18, Galați, România', 0),
                ('Răzvan', 'Dragomir', 'razvan.dragomir@gmail.com', '0777890123', 'VL 778899', 'Strada Regina Maria 7, Râmnicu Vâlcea, România', 1),
                ('Simona', 'Bălan', 'simona.balan@yahoo.com', '0788901234', 'OT 889900', 'Bulevardul Alexandru Ioan Cuza 22, Slatina, România', 0),
                ('Tudor', 'Mihai', 'tudor.mihai@gmail.com', '0799012345', 'HD 990011', 'Bulevardul Decebal 31, Deva, România', 1),
                ('Carmen', 'Neacșu', 'carmen.neacsu@yahoo.com', '0710123456', 'DB 001122', 'Strada Gării 9, Târgoviște, România', 0),
                ('Sorin', 'Bucur', 'sorin.bucur@gmail.com', '0721234567', 'MM 110022', 'Bulevardul Republicii 17, Baia Mare, România', 1),
                ('Andreea', 'Niculescu', 'andreea.niculescu@yahoo.com', '0732345678', 'DJ 223300', 'Strada Unirii 25, Craiova, România', 0),
                ('Octavian', 'Rusu', 'octavian.rusu@gmail.com', '0743456789', 'MS 334400', 'Piața Trandafirilor 14, Târgu Mureș, România', 1),
                ('Raluca', 'Tomescu', 'raluca.tomescu@yahoo.com', '0754567890', 'VS 445500', 'Strada Ștefan cel Mare 29, Vaslui, România', 0),
                
                -- Additional customers for overdue rentals
                ('Victor', 'Radu', 'victor.radu@gmail.com', '0765432109', 'B 112233', 'Strada Primăverii 15, București, România', 1),
                ('Lucia', 'Moraru', 'lucia.moraru@yahoo.com', '0776543210', 'CJ 223344', 'Calea Turzii 27, Cluj-Napoca, România', 0),
                ('Denis', 'Popovici', 'denis.popovici@gmail.com', '0787654321', 'IS 334455', 'Bulevardul Independenței 9, Iași, România', 1)
            `);

            // Get car and customer IDs
            const [cars] = await pool.query('SELECT id, daily_rate FROM cars');
            const [customers] = await pool.query('SELECT id FROM customers');

            if (cars.length > 0 && customers.length > 0) {
                const today = new Date().toISOString().split('T')[0];

                // Calculate dates for various rental scenarios
                const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const tomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const fiveDaysLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const twoDaysLater = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const fourDaysLater = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                // Function to create dynamic rental queries with accurate price calculations
                const createRentalQuery = (carId, customerId, startDate, endDate, status, paymentStatus, notes) => {
                    // Find the car's daily rate
                    const car = cars.find(c => c.id === carId);
                    if (!car) return null;

                    // Calculate rental duration in days
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive count

                    // Calculate total cost
                    const totalCost = car.daily_rate * days;

                    return [
                        carId,
                        customerId,
                        startDate,
                        endDate,
                        status,
                        totalCost.toFixed(2),
                        paymentStatus,
                        notes
                    ];
                };

                // Create a collection of rentals with various statuses and dates
                let rentalValues = [];

                // Completed rentals
                rentalValues.push(createRentalQuery(1, 1, twoWeeksAgo, oneWeekAgo, 'completed', 'paid', 'Client mulțumit, mașină returnată în stare excelentă'));
                rentalValues.push(createRentalQuery(14, 2, oneWeekAgo, threeDaysAgo, 'completed', 'paid', 'Închiriere fără probleme, client fidel'));
                rentalValues.push(createRentalQuery(3, 3, threeDaysAgo, yesterday, 'completed', 'paid', 'Client nou, foarte mulțumit de servicii'));
                rentalValues.push(createRentalQuery(17, 4, twoWeeksAgo, oneWeekAgo, 'completed', 'paid', 'Închiriere corporativă, contract extins'));
                rentalValues.push(createRentalQuery(30, 5, threeDaysAgo, yesterday, 'completed', 'paid', 'Scaun pentru copil solicitat, totul bine'));
                rentalValues.push(createRentalQuery(4, 6, tenDaysAgo, fiveDaysAgo, 'completed', 'paid', 'Client fidel, a închiriat pentru o escapadă de weekend'));
                rentalValues.push(createRentalQuery(19, 7, sixDaysAgo, threeDaysAgo, 'completed', 'paid', 'Prima închiriere, client foarte mulțumit'));
                rentalValues.push(createRentalQuery(24, 8, fiveDaysAgo, yesterday, 'completed', 'paid', 'Scaun pentru copil solicitat, totul bine'));
                rentalValues.push(createRentalQuery(33, 9, tenDaysAgo, fiveDaysAgo, 'completed', 'paid', 'Închiriere fără probleme, client a lăsat feedback foarte bun'));
                rentalValues.push(createRentalQuery(37, 10, sixDaysAgo, threeDaysAgo, 'completed', 'paid', 'Client fidel, a închiriat pentru un drum de afaceri'));

                // Active rentals
                rentalValues.push(createRentalQuery(12, 11, yesterday, fiveDaysLater, 'active', 'paid', 'Asigurare premium inclusă, client VIP'));
                rentalValues.push(createRentalQuery(22, 12, today, threeDaysLater, 'active', 'partial', 'Plată parțială efectuată, rest la returnare'));
                rentalValues.push(createRentalQuery(26, 13, yesterday, fourDaysLater, 'active', 'paid', 'Închiriere pentru un eveniment special, client fidel'));
                rentalValues.push(createRentalQuery(32, 14, today, twoDaysLater, 'active', 'partial', 'Solicitare loc parcare acoperit, cliente mulțumit'));
                rentalValues.push(createRentalQuery(38, 15, yesterday, threeDaysLater, 'active', 'paid', 'Client fidel, a închiriat pentru o călătorie de afaceri'));

                // Overdue rentals (still active but end_date has passed)
                rentalValues.push(createRentalQuery(8, 21, sixDaysAgo, yesterday, 'active', 'paid', 'Client nu a returnat mașina la timp, contact telefonic necesar'));
                rentalValues.push(createRentalQuery(16, 22, fiveDaysAgo, twoDaysAgo, 'active', 'paid', 'Întârziere returnare, client a solicitat prelungire dar nu a confirmat'));
                rentalValues.push(createRentalQuery(25, 23, fourDaysAgo, yesterday, 'active', 'partial', 'Client nu răspunde la apeluri, se impune verificare locație GPS'));

                // Pending rentals
                rentalValues.push(createRentalQuery(10, 16, tomorrow, fiveDaysLater, 'pending', 'unpaid', 'Rezervare confirmată, așteptare plată'));
                rentalValues.push(createRentalQuery(20, 17, tomorrow, threeDaysLater, 'pending', 'unpaid', 'Client nou, va achita la ridicare'));
                rentalValues.push(createRentalQuery(28, 18, twoDaysLater, fourDaysLater, 'pending', 'unpaid', 'Prima închiriere, a solicitat asistență la ridicare'));
                rentalValues.push(createRentalQuery(34, 19, tomorrow, oneWeekLater, 'pending', 'unpaid', 'Închiriere de lungă durată, verificare suplimentară solicitată'));
                rentalValues.push(createRentalQuery(40, 20, twoDaysLater, fiveDaysLater, 'pending', 'unpaid', 'Client nou, a solicitat GPS suplimentar'));

                // Filter out any null values (in case car IDs don't match)
                rentalValues = rentalValues.filter(val => val !== null);

                // Build the placeholders for the SQL query
                const placeholders = rentalValues.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');

                // Flatten the array of arrays into a single array for the query
                const flatValues = rentalValues.flat();

                // Insert the rental data
                await pool.query(
                    `INSERT INTO rentals (car_id, customer_id, start_date, end_date, status, total_cost, payment_status, notes) VALUES ${placeholders}`,
                    flatValues
                );
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

    // Check if admins table has data
    const [adminCount] = await pool.query('SELECT COUNT(*) as count FROM admins');

    // Only insert sample admin data if admins table is empty
    if (adminCount[0].count === 0) {
        console.log('No admins found. Inserting sample admin data...');

        // In a real app, you would hash these passwords
        // For simplicity in this demo, we're using plain text
        await pool.query(`
            INSERT INTO admins (email, password, name, role) VALUES
            ('admin@carrentaldashboard.ro', 'admin123', 'Nicula Mihai', 'admin'),
            ('manager@carrentaldashboard.ro', 'manager123', 'Gheorghe Ionuț', 'admin')
        `);

        console.log('Sample admin data inserted successfully');
    }
}

module.exports = { createTables };