// src/services/reportService.ts
import carsService from './carsService';
import rentalsService from './rentalsService';
import customersService from './customersService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // Ensure this import is correct
import { Car } from './carsService';
import { RentalExtended } from './rentalsService';
import { Customer } from './customersService';

// --- Font Loading Helper ---
// Helper to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

// Cache for the loaded font to avoid fetching repeatedly
let robotoBase64: string | null = null;

const loadRobotoFont = async (): Promise<string> => {
    if (robotoBase64) {
        return robotoBase64;
    }
    try {
        // Adjust the path if you place the font elsewhere in /public
        const response = await fetch('/fonts/Roboto-Regular.ttf');
        if (!response.ok) {
            throw new Error(`Failed to fetch font: ${response.statusText}`);
        }
        const fontBuffer = await response.arrayBuffer();
        robotoBase64 = arrayBufferToBase64(fontBuffer);
        return robotoBase64;
    } catch (error) {
        console.error("Error loading font:", error);
        // Fallback or re-throw, depending on how critical the font is
        throw new Error("Could not load required font for PDF generation.");
    }
};


// --- Date Helpers ---
const isDateInRange = (dateToCheck: Date, startDate: Date, endDate: Date): boolean => {
    const dateTime = dateToCheck.getTime();
    // Ensure the check includes the boundaries
    return dateTime >= startDate.getTime() && dateTime <= endDate.getTime();
};

const getMonthStartEnd = (date: Date): { start: Date, end: Date } => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 1, 0, 0, 0, 0); // Start of the first day
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999); // End of the last day
    return { start, end };
};

const formatDateRo = (date: Date): string => {
    // Ensure date is valid before formatting
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return 'N/A';
    }
    return date.toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

const calculateOverdueDays = (endDateStr: string): string => {
    try {
        const endDate = new Date(endDateStr);
        const today = new Date();
        // Set time to end of day for comparison to avoid partial day issues
        endDate.setHours(23, 59, 59, 999);
        today.setHours(0, 0, 0, 0); // Compare against start of today

        if (endDate.getTime() >= today.getTime()) {
            return '0 zile'; // Not overdue yet or due today
        }
        const diffTime = today.getTime() - endDate.getTime();
        // Use floor for *completed* days overdue
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? `${diffDays} zile` : '0 zile'; // Should be > 0 if condition above passed
    } catch (e) {
        console.error("Error calculating overdue days for:", endDateStr, e);
        return 'Eroare calcul';
    }
};


// --- Main Report Generation Function ---

// Define FONT_NAME outside the try block so it's accessible in catch
const FONT_NAME = 'Roboto'; // The name used when adding the font

export const generateReport = async (date: Date, type: 'daily' | 'monthly'): Promise<Blob> => {
    try {
        // 1. Load Font Data
        const fontBase64 = await loadRobotoFont();

        // 2. Initialize jsPDF and Add Font
        const doc = new jsPDF({
            orientation: 'p', // portrait
            unit: 'mm', // millimeters
            format: 'a4' // standard A4 size
        });

        // Add the font to jsPDF's virtual file system
        doc.addFileToVFS(`${FONT_NAME}-Regular.ttf`, fontBase64);
        // Add the font providing the VFS filename and style
        doc.addFont(`${FONT_NAME}-Regular.ttf`, FONT_NAME, 'normal');
        // Set the font for the entire document
        doc.setFont(FONT_NAME, 'normal');

        // 3. Determine Date Range and Title
        let startDate: Date;
        let endDate: Date;
        let reportTitle: string;
        const monthNamesRo = [
            'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
            'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
        ];

        if (type === 'daily') {
            startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            reportTitle = `Raport Zilnic - ${formatDateRo(date)}`;
        } else { // monthly
            const monthRange = getMonthStartEnd(date);
            startDate = monthRange.start;
            endDate = monthRange.end;
            reportTitle = `Raport Lunar - ${monthNamesRo[date.getMonth()]} ${date.getFullYear()}`;
        }

        // 4. Fetch Data
        const [cars, allRentals, customers] = await Promise.all([
            carsService.getAllCars(),
            rentalsService.getAllRentals(), // Fetch all and filter locally
            customersService.getAllCustomers()
        ]);

        // 5. Filter Rentals for the Period
        const filteredRentals = allRentals.filter(rental => {
            try {
                const rentalStart = new Date(rental.start_date);
                const rentalEnd = new Date(rental.end_date);

                // Basic validation
                if (isNaN(rentalStart.getTime()) || isNaN(rentalEnd.getTime())) {
                    console.warn(`Skipping rental with invalid date: ID ${rental.id}`);
                    return false;
                }

                // Normalize dates to avoid time zone issues if comparing only dates
                const checkStart = new Date(rentalStart.getFullYear(), rentalStart.getMonth(), rentalStart.getDate());
                const checkEnd = new Date(rentalEnd.getFullYear(), rentalEnd.getMonth(), rentalEnd.getDate());
                const periodStartNorm = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                const periodEndNorm = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());


                // Logic: Rental overlaps with the period if:
                // (Rental Start <= Period End) AND (Rental End >= Period Start)
                return checkStart.getTime() <= periodEndNorm.getTime() && checkEnd.getTime() >= periodStartNorm.getTime();

            } catch (e) {
                console.error(`Error processing rental ID ${rental.id} for filtering:`, e);
                return false; // Exclude rentals that cause errors during filtering
            }
        });

        // 6. Process Data for Report Sections
        const now = new Date(); // Use a consistent 'now' for status checks

        const activeRentals = filteredRentals.filter(rental => {
            try {
                const rentalEnd = new Date(rental.end_date);
                // Active means not completed AND end date is today or in the future relative to 'now'
                return rental.status !== 'completed' && rentalEnd.getTime() >= now.getTime();
            } catch { return false; }
        });

        const completedRentalsInPeriod = filteredRentals.filter(rental => {
            try {
                const rentalEnd = new Date(rental.end_date);
                // Completed means status is 'completed' AND it ended within the report period
                return rental.status === 'completed' && isDateInRange(rentalEnd, startDate, endDate);
            } catch { return false; }
        });

        // Overdue: Not completed, and end_date has passed relative to 'now'
        const overdueRentals = filteredRentals.filter(rental => {
            try {
                const rentalEnd = new Date(rental.end_date);
                return rental.status !== 'completed' && rentalEnd.getTime() < now.getTime();
            } catch { return false; }
        });


        // Calculate fleet snapshot (using current status from DB)
        const availableCarsCount = cars.filter(car => car.status === 'available').length;
        const rentedCarsCount = cars.filter(car => car.status === 'rented').length;
        const maintenanceCarsCount = cars.filter(car => car.status === 'maintenance').length;

        // Calculate revenue from rentals completed *within the period*
        const periodRevenue = completedRentalsInPeriod.reduce((sum, rental) =>
            sum + (rental.total_cost ? Number(rental.total_cost) : 0), 0
        );


        // --- 7. Build PDF Document ---
        const pageMargin = 14; // Left/right margin in mm
        const pageStartY = 15; // Initial top margin in mm
        const sectionSpacing = 5; // Space between section title and table/text in mm
        const interSectionSpacing = 10; // Space between sections (after table/text) in mm
        let currentY = pageStartY;
        const pageWidth = doc.internal.pageSize.getWidth();
        const usableWidth = pageWidth - 2 * pageMargin;

        // Helper to add text and update Y, handling page breaks roughly
        const addText = (text: string | string[], x: number, y: number, options?: any): number => {
            const textHeight = Array.isArray(text) ? (text.length * (doc.getFontSize() * 0.35)) : (doc.getFontSize() * 0.35); // Approximate height
            if (y + textHeight > doc.internal.pageSize.getHeight() - 15) { // Check if near bottom margin
                doc.addPage();
                y = pageStartY; // Reset Y to top margin on new page
            }
            doc.text(text, x, y, options);
            return y + textHeight + 2; // Return new Y position below text
        };

        // --- Header ---
        doc.setFontSize(18);
        currentY = addText(reportTitle, pageWidth / 2, currentY, { align: 'center' });
        doc.setFontSize(10);
        const periodText = type === 'monthly'
            ? `Perioada: ${formatDateRo(startDate)} - ${formatDateRo(endDate)}`
            : `Data: ${formatDateRo(date)}`;
        currentY = addText(periodText, pageWidth / 2, currentY, { align: 'center' });
        currentY += 5; // Extra space after header


        // --- Section 1: Fleet Status Summary ---
        doc.setFontSize(14);
        currentY = addText('1. Sumar Flotă', pageMargin, currentY);
        currentY += sectionSpacing;

        const fleetData = [
            ['Total Vehicule', cars.length.toString()],
            ['Vehicule Disponibile (status curent)', availableCarsCount.toString()],
            ['Vehicule Închiriate (status curent)', rentedCarsCount.toString()],
            ['Vehicule în Mentenanță (status curent)', maintenanceCarsCount.toString()],
            ['-', '-'], // Separator
            ['Închirieri în Perioadă (intersectate)', filteredRentals.length.toString()],
            ['Închirieri Active (la data generării)', activeRentals.length.toString()],
            ['Închirieri Finalizate în Perioadă', completedRentalsInPeriod.length.toString()],
            ['Închirieri Expirate (la data generării)', overdueRentals.length.toString()],
            ['Venit (închirieri finalizate în perioadă)', `${periodRevenue.toFixed(2)} RON`],
        ];

        autoTable(doc, {
            startY: currentY,
            head: [['Categorie', 'Numar / Valoare']],
            body: fleetData,
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66], font: FONT_NAME, fontSize: 10 },
            styles: { font: FONT_NAME, fontSize: 9, cellPadding: 1.5 },
            margin: { left: pageMargin, right: pageMargin },
            didDrawPage: (data) => { // Reset font on new page if needed
                doc.setFont(FONT_NAME, 'normal');
                currentY = data.cursor?.y ?? pageStartY; // Update Y if new page
            }
        });
        currentY = (doc as any).lastAutoTable.finalY + interSectionSpacing;


        // --- Section 2: Rentals in Period ---
        if (currentY > doc.internal.pageSize.getHeight() - 30) { doc.addPage(); currentY = pageStartY; } // Check page break before section
        doc.setFontSize(14);
        currentY = addText(`2. Detaliu Închirieri în ${type === 'daily' ? 'Zi' : 'Lună'}`, pageMargin, currentY);
        currentY += sectionSpacing;

        if (filteredRentals.length > 0) {
            const rentalsData = filteredRentals.map(rental => {
                const customer = customers.find(c => c.id === rental.customer_id);
                const car = cars.find(c => c.id === rental.car_id);
                return [
                    `${car?.brand || ''} ${car?.model || ''}`,
                    car?.license_plate || 'N/A',
                    customer ? `${customer.first_name} ${customer.last_name}` : 'N/A',
                    formatDateRo(new Date(rental.start_date)),
                    formatDateRo(new Date(rental.end_date)),
                    rental.status || 'N/A',
                    `${Number(rental.total_cost || 0).toFixed(2)} RON`,
                    rental.payment_status || 'N/A'
                ];
            });

            autoTable(doc, {
                startY: currentY,
                head: [['Vehicul', 'Nr. Înmatr.', 'Client', 'Start', 'Final', 'Status', 'Cost', 'Plată']],
                body: rentalsData,
                theme: 'grid',
                headStyles: { fillColor: [66, 133, 244], font: FONT_NAME, fontSize: 9 },
                styles: { font: FONT_NAME, fontSize: 7, cellPadding: 1 }, // Smaller font for details
                margin: { left: pageMargin, right: pageMargin },
                columnStyles: { // Example: Adjust widths (total should be <= usableWidth)
                    0: { cellWidth: 35 }, // Vehicul
                    1: { cellWidth: 20 }, // Nr. Inmatr.
                    2: { cellWidth: 30 }, // Client
                    3: { cellWidth: 18 }, // Start
                    4: { cellWidth: 18 }, // Final
                    5: { cellWidth: 15 }, // Status
                    6: { cellWidth: 20 }, // Cost
                    7: { cellWidth: 20 }  // Plata
                },
                didDrawPage: (data) => {
                    doc.setFont(FONT_NAME, 'normal');
                    currentY = data.cursor?.y ?? pageStartY;
                }
            });
            currentY = (doc as any).lastAutoTable.finalY + interSectionSpacing;
        } else {
            doc.setFontSize(10);
            currentY = addText(`Nu există închirieri în această ${type === 'daily' ? 'zi' : 'lună'}.`, pageMargin, currentY);
            currentY += interSectionSpacing; // Add space even if no table
        }


        // --- Section 3: Overdue Rentals ---
        if (currentY > doc.internal.pageSize.getHeight() - 30) { doc.addPage(); currentY = pageStartY; }
        doc.setFontSize(14);
        currentY = addText('3. Închirieri Expirate (la data generării)', pageMargin, currentY);
        currentY += sectionSpacing;

        if (overdueRentals.length > 0) {
            const overdueRentalsData = overdueRentals.map(rental => {
                const customer = customers.find(c => c.id === rental.customer_id);
                const car = cars.find(c => c.id === rental.car_id);
                return [
                    `${car?.brand || ''} ${car?.model || ''}`,
                    car?.license_plate || 'N/A',
                    customer ? `${customer.first_name} ${customer.last_name}` : 'N/A',
                    customer?.phone || 'N/A',
                    formatDateRo(new Date(rental.end_date)),
                    calculateOverdueDays(rental.end_date),
                    `${Number(rental.total_cost || 0).toFixed(2)} RON`,
                    rental.payment_status || 'N/A'
                ];
            });

            autoTable(doc, {
                startY: currentY,
                head: [['Vehicul', 'Nr. Înmatr.', 'Client', 'Telefon', 'Dată Finală', 'Întârziere', 'Cost', 'Plată']],
                body: overdueRentalsData,
                theme: 'grid',
                headStyles: { fillColor: [234, 67, 53], font: FONT_NAME, fontSize: 9, textColor: 255 },
                styles: { font: FONT_NAME, fontSize: 7, cellPadding: 1 },
                margin: { left: pageMargin, right: pageMargin },
                columnStyles: { // Adjust widths
                    0: { cellWidth: 35 }, // Vehicul
                    1: { cellWidth: 20 }, // Nr. Inmatr.
                    2: { cellWidth: 30 }, // Client
                    3: { cellWidth: 20 }, // Telefon
                    4: { cellWidth: 18 }, // Data Finala
                    5: { cellWidth: 15 }, // Intarziere
                    6: { cellWidth: 20 }, // Cost
                    7: { cellWidth: 18 }  // Plata
                },
                didDrawPage: (data) => {
                    doc.setFont(FONT_NAME, 'normal');
                    currentY = data.cursor?.y ?? pageStartY;
                }
            });
            currentY = (doc as any).lastAutoTable.finalY + interSectionSpacing;
        } else {
            doc.setFontSize(10);
            currentY = addText('Nu există închirieri expirate la data generării raportului.', pageMargin, currentY);
            currentY += interSectionSpacing;
        }


        // --- Section 4: Car Category Breakdown ---
        if (currentY > doc.internal.pageSize.getHeight() - 30) { doc.addPage(); currentY = pageStartY; }
        doc.setFontSize(14);
        currentY = addText('4. Sumar Vehicule pe Categorii', pageMargin, currentY);
        currentY += sectionSpacing;

        const carsByCategory: Record<string, Car[]> = {};
        cars.forEach(car => {
            const category = car.category || 'Necategorizat';
            if (!carsByCategory[category]) {
                carsByCategory[category] = [];
            }
            carsByCategory[category].push(car);
        });

        const categoryData = Object.entries(carsByCategory).map(([category, categoryCars]) => {
            const categoryCarIds = categoryCars.map(c => c.id);
            // Filter rentals *within the period* for cars in this category
            const categoryRentalsInPeriod = filteredRentals.filter(rental => categoryCarIds.includes(rental.car_id));
            // Calculate revenue from rentals *completed within the period* for this category
            const categoryCompletedRentals = categoryRentalsInPeriod.filter(r => {
                try {
                    return r.status === 'completed' && isDateInRange(new Date(r.end_date), startDate, endDate);
                } catch { return false; }
            });
            const categoryRevenue = categoryCompletedRentals.reduce((sum, rental) => sum + Number(rental.total_cost || 0), 0);

            return [
                category,
                categoryCars.length.toString(), // Total cars in category
                categoryCars.filter(car => car.status === 'available').length.toString(), // Available now
                categoryCars.filter(car => car.status === 'rented').length.toString(), // Rented now
                categoryRentalsInPeriod.length.toString(), // Rentals intersecting period
                `${categoryRevenue.toFixed(2)} RON` // Revenue from completed in period
            ];
        });

        autoTable(doc, {
            startY: currentY,
            head: [['Categorie', 'Total', 'Disp.', 'Închir.', 'Închir. Per.', 'Venit Per.']],
            body: categoryData,
            theme: 'grid',
            headStyles: { fillColor: [66, 133, 244], font: FONT_NAME, fontSize: 9 },
            styles: { font: FONT_NAME, fontSize: 8, cellPadding: 1.5 },
            margin: { left: pageMargin, right: pageMargin },
            didDrawPage: (data) => {
                doc.setFont(FONT_NAME, 'normal');
                currentY = data.cursor?.y ?? pageStartY;
            }
        });
        currentY = (doc as any).lastAutoTable.finalY + interSectionSpacing;


        // --- Monthly Only Sections ---
        if (type === 'monthly') {
            // --- Section 5: Top Rented Cars ---
            if (currentY > doc.internal.pageSize.getHeight() - 30) { doc.addPage(); currentY = pageStartY; }
            doc.setFontSize(14);
            currentY = addText('5. Top Vehicule Închiriate (după nr. închirieri în lună)', pageMargin, currentY);
            currentY += sectionSpacing;

            const carRentalStats: Record<number, { count: number; revenue: number; car?: Car; lastRentalDate?: Date }> = {};
            // Use filteredRentals (rentals intersecting the month) for stats
            filteredRentals.forEach(rental => {
                if (!carRentalStats[rental.car_id]) {
                    carRentalStats[rental.car_id] = { count: 0, revenue: 0, car: cars.find(c => c.id === rental.car_id) };
                }
                carRentalStats[rental.car_id].count += 1;
                carRentalStats[rental.car_id].revenue += Number(rental.total_cost || 0);
                try {
                    const rentalStartDate = new Date(rental.start_date);
                    if (!carRentalStats[rental.car_id].lastRentalDate || rentalStartDate > carRentalStats[rental.car_id].lastRentalDate!) {
                        carRentalStats[rental.car_id].lastRentalDate = rentalStartDate;
                    }
                } catch { }
            });

            const topCars = Object.values(carRentalStats)
                .sort((a, b) => b.count - a.count) // Sort by count
                .slice(0, 10); // Top 10

            if (topCars.length > 0) {
                const topCarsData = topCars.map(data => {
                    const car = data.car;
                    return [
                        `${car?.brand || ''} ${car?.model || ''} (${car?.year || 'N/A'})`,
                        car?.license_plate || 'N/A',
                        car?.category || 'N/A',
                        data.count.toString(),
                        `${data.revenue.toFixed(2)} RON`,
                        data.lastRentalDate ? formatDateRo(data.lastRentalDate) : 'N/A'
                    ];
                });

                autoTable(doc, {
                    startY: currentY,
                    head: [['Vehicul', 'Nr. Înmatr.', 'Categ.', 'Nr. Închir.', 'Venit Total', 'Ultimul Start']],
                    body: topCarsData,
                    theme: 'grid',
                    headStyles: { fillColor: [76, 175, 80], font: FONT_NAME, fontSize: 9 },
                    styles: { font: FONT_NAME, fontSize: 7, cellPadding: 1 },
                    margin: { left: pageMargin, right: pageMargin },
                    didDrawPage: (data) => {
                        doc.setFont(FONT_NAME, 'normal');
                        currentY = data.cursor?.y ?? pageStartY;
                    }
                });
                currentY = (doc as any).lastAutoTable.finalY + interSectionSpacing;
            } else {
                doc.setFontSize(10);
                currentY = addText('Nu există date de închirieri în această lună pentru top vehicule.', pageMargin, currentY);
                currentY += interSectionSpacing;
            }


            // --- Section 6: Top Customers ---
            if (currentY > doc.internal.pageSize.getHeight() - 30) { doc.addPage(); currentY = pageStartY; }
            doc.setFontSize(14);
            currentY = addText('6. Top Clienți (după valoare totală în lună)', pageMargin, currentY);
            currentY += sectionSpacing;

            const customerRentalStats: Record<number, { count: number; revenue: number; customer?: Customer }> = {};
            // Use filteredRentals for stats
            filteredRentals.forEach(rental => {
                if (!customerRentalStats[rental.customer_id]) {
                    customerRentalStats[rental.customer_id] = { count: 0, revenue: 0, customer: customers.find(c => c.id === rental.customer_id) };
                }
                customerRentalStats[rental.customer_id].count += 1;
                customerRentalStats[rental.customer_id].revenue += Number(rental.total_cost || 0);
            });

            const topCustomers = Object.values(customerRentalStats)
                .sort((a, b) => b.revenue - a.revenue) // Sort by revenue
                .slice(0, 10); // Top 10

            if (topCustomers.length > 0) {
                const topCustomersData = topCustomers.map(data => {
                    const customer = data.customer;
                    return [
                        customer ? `${customer.first_name} ${customer.last_name}` : 'N/A',
                        customer?.email || 'N/A',
                        customer?.phone || 'N/A',
                        data.count.toString(),
                        `${data.revenue.toFixed(2)} RON`
                    ];
                });

                autoTable(doc, {
                    startY: currentY,
                    head: [['Client', 'Email', 'Telefon', 'Nr. Închir.', 'Valoare Totală']],
                    body: topCustomersData,
                    theme: 'grid',
                    headStyles: { fillColor: [156, 39, 176], font: FONT_NAME, fontSize: 9, textColor: 255 },
                    styles: { font: FONT_NAME, fontSize: 7, cellPadding: 1 },
                    margin: { left: pageMargin, right: pageMargin },
                    didDrawPage: (data) => {
                        doc.setFont(FONT_NAME, 'normal');
                        currentY = data.cursor?.y ?? pageStartY;
                    }
                });
                currentY = (doc as any).lastAutoTable.finalY + interSectionSpacing;
            } else {
                doc.setFontSize(10);
                currentY = addText('Nu există date de închirieri în această lună pentru top clienți.', pageMargin, currentY);
                currentY += interSectionSpacing;
            }
        } // End if (type === 'monthly')


        // --- Footer ---
        const pageCount = (doc.internal as any).getNumberOfPages(); // Use type assertion
        const footerY = doc.internal.pageSize.getHeight() - 10; // Position 10mm from bottom
        doc.setFontSize(8); // Smaller font for footer
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFont(FONT_NAME, 'normal'); // Ensure font is set on each page for footer

            // Page number centered
            doc.text(
                `Pagina ${i} din ${pageCount}`,
                pageWidth / 2,
                footerY,
                { align: 'center' }
            );

            // Optional: Add generated date/time or company name aligned left/right
            doc.text(
                'Raport Generat Automat',
                pageMargin, // Align left
                footerY
            );
            doc.text(
                `Generat la: ${new Date().toLocaleString('ro-RO')}`,
                pageWidth - pageMargin, // Align right
                footerY,
                { align: 'right' }
            );
        }

        // 8. Return Blob
        return doc.output('blob');

    } catch (error) {
        console.error('CRITICAL Error generating PDF report:', error);

        // Create a simple error PDF
        const errorDoc = new jsPDF();
        // Attempt to use the font. If font loading failed earlier,
        // jsPDF should gracefully fall back to a default font.
        try {
            // Check if font was added before trying to set it
            if (errorDoc.getFontList()[FONT_NAME]) {
                errorDoc.setFont(FONT_NAME, 'normal'); // FONT_NAME is accessible here
            } else {
                console.warn("Custom font not available for error PDF, using default.");
            }
        } catch (fontError) {
            console.warn("Could not set custom font for error PDF:", fontError);
        }

        errorDoc.setFontSize(12);
        errorDoc.text("Eroare Critică la Generarea Raportului PDF", 10, 15);
        if (error instanceof Error) {
            // Split long messages if necessary
            const errorMessageLines = errorDoc.splitTextToSize(`Detalii: ${error.message}. Verificați consola browserului pentru mai multe informații.`, 190); // Adjust width as needed
            errorDoc.text(errorMessageLines, 10, 25);
        } else {
            errorDoc.text("A apărut o eroare necunoscută în timpul generării raportului.", 10, 25);
        }
        // Optionally return an error PDF blob instead of throwing,
        // but throwing is usually better to signal failure clearly.
        // return errorDoc.output('blob');

        // Re-throw the error so the calling code (UI) knows generation failed
        // and can display an appropriate message (like the snackbar).
        throw new Error('Failed to generate PDF report. See browser console for details.');
    }
};

// Backward compatibility (optional, can be removed if not used)
export const generateDailyReport = async (): Promise<Blob> => {
    console.warn("generateDailyReport is deprecated. Use generateReport(new Date(), 'daily') instead.");
    return generateReport(new Date(), 'daily');
};