import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Customer } from './customersService';
import { RentalExtended } from './rentalsService';

const LOGO_SVG_PATH = '/assets/icons/navbar/ic-car.svg';

// Function to get month name in Romanian (without diacritics)
const getMonthNameRo = (month: number): string => {
    const months = [
        'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
        'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'
    ];
    return months[month];
};

// Format date as DD Month YYYY in Romanian
const formatDateRo = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = getMonthNameRo(date.getMonth());
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
};

// Function to replace Romanian diacritics with standard ASCII characters
const removeDiacritics = (text: string): string => {
    if (!text) return '';

    return text
        .replace(/ă/g, 'a')
        .replace(/â/g, 'a')
        .replace(/î/g, 'i')
        .replace(/ș/g, 's')
        .replace(/ş/g, 's')
        .replace(/ț/g, 't')
        .replace(/ţ/g, 't')
        .replace(/Ă/g, 'A')
        .replace(/Â/g, 'A')
        .replace(/Î/g, 'I')
        .replace(/Ș/g, 'S')
        .replace(/Ş/g, 'S')
        .replace(/Ț/g, 'T')
        .replace(/Ţ/g, 'T');
};

// Function to convert SVG to PNG with blue color
const convertSvgToPng = async (svgPath: string, width: number, height: number): Promise<Uint8Array> => {
    try {
        const response = await fetch(svgPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch SVG: ${response.statusText}`);
        }
        let svgText = await response.text();

        // Change color to blue
        svgText = svgText
            .replace(/fill="#000000"/g, 'fill="#1976d2"')
            .replace(/fill="#000"/g, 'fill="#1976d2"')
            .replace(/fill="black"/g, 'fill="#1976d2"')
            .replace(/fill="currentColor"/g, 'fill="#1976d2"')
            .replace(/stroke="#000000"/g, 'stroke="#1976d2"')
            .replace(/stroke="#000"/g, 'stroke="#1976d2"')
            .replace(/stroke="black"/g, 'stroke="#1976d2"')
            .replace(/stroke="currentColor"/g, 'stroke="#1976d2"');

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const img = new Image();
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        return new Promise((resolve, reject) => {
            img.onload = () => {
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Failed to convert canvas to blob'));
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = () => {
                        const arrayBuffer = reader.result as ArrayBuffer;
                        resolve(new Uint8Array(arrayBuffer));
                    };
                    reader.onerror = () => reject(new Error('Failed to read blob'));
                    reader.readAsArrayBuffer(blob);
                }, 'image/png');

                URL.revokeObjectURL(url);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load SVG image'));
            };

            img.src = url;
        });
    } catch (error) {
        console.error('Error converting SVG to PNG:', error);
        throw error;
    }
};

// Calculate number of days between two dates
const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive count
};

// Generate complete invoice PDF from scratch
export const generateInvoice = async (customer: Customer, rental: RentalExtended): Promise<Uint8Array> => {
    try {
        // Create new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

        // Load fonts
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Page dimensions and margins
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        const margin = 50;
        const contentWidth = pageWidth - (margin * 2);

        // Current Y position (starting from top)
        let currentY = pageHeight - 60;

        // Helper function to add text and update Y position
        const addText = (text: string, x: number, fontSize: number, fontType = regularFont, color = rgb(0, 0, 0)): void => {
            page.drawText(text, {
                x,
                y: currentY,
                size: fontSize,
                font: fontType,
                color,
                maxWidth: contentWidth - (x - margin)
            });
        };

        // Helper function to add text with underline
        const addTextWithUnderline = (text: string, x: number, fontSize: number, fontType = regularFont, color = rgb(0, 0, 0)): void => {
            page.drawText(text, {
                x,
                y: currentY,
                size: fontSize,
                font: fontType,
                color,
                maxWidth: contentWidth - (x - margin)
            });

            // Draw underline
            const textWidth = fontType.widthOfTextAtSize(text, fontSize);
            page.drawLine({
                start: { x, y: currentY - 2 },
                end: { x: x + textWidth, y: currentY - 2 },
                thickness: 0.5,
                color: rgb(0, 0, 0),
            });
        };

        // Helper function to add centered text
        const addCenteredText = (text: string, fontSize: number, fontType = regularFont, color = rgb(0, 0, 0)): void => {
            const textWidth = fontType.widthOfTextAtSize(text, fontSize);
            const x = (pageWidth - textWidth) / 2;
            addText(text, x, fontSize, fontType, color);
        };

        // Helper function to move to next line
        const nextLine = (spacing = 20): void => {
            currentY -= spacing;
        };

        // Add logo at top right
        try {
            const logoImageBytes = await convertSvgToPng(LOGO_SVG_PATH, 100, 60);
            const logoImage = await pdfDoc.embedPng(logoImageBytes);

            page.drawImage(logoImage, {
                x: pageWidth - margin - 70, // Position at top right
                y: pageHeight - 90,
                width: 60,
                height: 50,
            });
        } catch (logoError) {
            console.warn('Could not add logo to invoice:', logoError);
            // Fallback text logo at top right
            page.drawText('🚗 AUTO RENT', {
                x: pageWidth - margin - 80,
                y: pageHeight - 60,
                size: 12,
                font: boldFont,
                color: rgb(0.098, 0.463, 0.824)
            });
        }

        // Prepare data
        const emissionDate = removeDiacritics(formatDateRo(rental.end_date));
        const customerFirstName = removeDiacritics(customer.first_name || '');
        const customerLastName = removeDiacritics(customer.last_name || '');
        const customerName = `${customerFirstName} ${customerLastName}`;

        // Handle car details with removeDiacritics 
        const carBrand = removeDiacritics(rental.brand || '');
        const carModel = removeDiacritics(rental.model || '');
        const licensePlate = removeDiacritics(rental.license_plate || '');
        const carName = `${carBrand} ${carModel} (${licensePlate})`;

        const rentalDays = calculateDays(rental.start_date, rental.end_date);
        const totalCost = parseFloat(rental.total_cost as any) || 0;
        const dailyRate = rentalDays > 0 ? totalCost / rentalDays : 0;

        // Format currency values
        const formattedDailyRate = dailyRate.toFixed(2);
        const formattedTotalCost = totalCost.toFixed(2);

        // Main title
        addCenteredText('FACTURA', 18, boldFont, rgb(0, 0, 0));
        nextLine(50);

        // Add company details underneath the title on the right
        const companyX = pageWidth - margin - 130; // X position for company details
        const companyStartY = currentY; // Current Y position after title

        page.drawText('SC AUTO RENT M SRL', {
            x: companyX,
            y: companyStartY,
            size: 12,
            font: boldFont,
            color: rgb(0.098, 0.463, 0.824)
        });

        page.drawText('CIF: RO12345678', {
            x: companyX,
            y: companyStartY - 15,
            size: 9,
            font: regularFont
        });

        page.drawText('Splaiul Independentei Nr. 240', {
            x: companyX,
            y: companyStartY - 30,
            size: 9,
            font: regularFont
        });

        page.drawText('Bucuresti', {
            x: companyX,
            y: companyStartY - 45,
            size: 9,
            font: regularFont
        });

        page.drawText('Tel: +40 123 456 789', {
            x: companyX,
            y: companyStartY - 60,
            size: 9,
            font: regularFont
        });

        nextLine(10); // Extra spacing after company details

        // Invoice details
        addText('Data emiterii: ', margin, 12);
        addTextWithUnderline(emissionDate, margin + regularFont.widthOfTextAtSize('Data emiterii: ', 12), 12, boldFont);
        nextLine(20);

        addText('Numar factura: ', margin, 12);
        addTextWithUnderline(`F${Date.now().toString().slice(-6)}`, margin + regularFont.widthOfTextAtSize('Numar factura: ', 12), 12, boldFont);
        nextLine(30);

        // Customer section
        addText('Client:', margin, 12, boldFont);
        nextLine(20);
        addTextWithUnderline(customerName, margin + 20, 14, boldFont);
        nextLine(25);

        if (customer.address) {
            addText('Adresa: ', margin + 20, 10);
            addTextWithUnderline(removeDiacritics(customer.address), margin + 20 + regularFont.widthOfTextAtSize('Adresa: ', 10), 10);
            nextLine(15);
        }

        if (customer.phone) {
            addText('Telefon: ', margin + 20, 10);
            addTextWithUnderline(customer.phone, margin + 20 + regularFont.widthOfTextAtSize('Telefon: ', 10), 10);
            nextLine(25);
        } else {
            nextLine(25);
        }

        // Services table header
        addText('Servicii prestate:', margin, 12, boldFont);
        nextLine(30);

        // Table header background
        page.drawRectangle({
            x: margin,
            y: currentY - 5,
            width: contentWidth,
            height: 25,
            color: rgb(0.9, 0.9, 0.9),
        });

        // Table headers
        addText('Descriere', margin + 10, 11, boldFont);
        addText('Zile', margin + 250, 11, boldFont);
        addText('Pret/zi (RON)', margin + 320, 11, boldFont);
        addText('Total (RON)', margin + 420, 11, boldFont);
        nextLine(30);

        // Service row
        addText('Inchiriere vehicul:', margin + 10, 11);
        addTextWithUnderline(carName, margin + 10 + regularFont.widthOfTextAtSize('Inchiriere vehicul: ', 11), 11, boldFont);
        nextLine(15);

        addText(rentalDays.toString(), margin + 250, 11);
        addText(formattedDailyRate, margin + 320, 11);
        addText(formattedTotalCost, margin + 420, 11, boldFont);
        nextLine(30);

        // Total section
        page.drawLine({
            start: { x: margin + 300, y: currentY + 10 },
            end: { x: margin + contentWidth, y: currentY + 10 },
            thickness: 1,
            color: rgb(0, 0, 0),
        });
        nextLine(20);

        addText('TOTAL DE PLATA:', margin + 320, 14, boldFont);
        nextLine(20);
        addText(`${formattedTotalCost} RON`, margin + 320, 14, boldFont, rgb(0.098, 0.463, 0.824));
        nextLine(50);

        // Payment information
        addText('Informatii de plata:', margin, 12, boldFont);
        nextLine(20);
        addText('Cont bancar: RO49 AAAA 1B31 0075 9384 0000', margin + 20, 10);
        nextLine(15);
        addText('Banca: Banca Comerciala Romana', margin + 20, 10);
        nextLine(30);

        // Rental period
        addText('Perioada inchiriere:', margin, 12, boldFont);
        nextLine(20);
        addText('De la: ', margin + 20, 11);
        addTextWithUnderline(removeDiacritics(formatDateRo(rental.start_date)), margin + 20 + regularFont.widthOfTextAtSize('De la: ', 11), 11, boldFont);
        nextLine(15);
        addText('Pana la: ', margin + 20, 11);
        addTextWithUnderline(removeDiacritics(formatDateRo(rental.end_date)), margin + 20 + regularFont.widthOfTextAtSize('Pana la: ', 11), 11, boldFont);
        nextLine(50);

        // Signature section
        addText(`Am predat serviciul,`, margin, 12);
        addText(`Am primit serviciul,`, margin + 300, 12);
        nextLine(25);

        addText(`PROPRIETAR`, margin, 12, boldFont);
        addText(`CLIENT`, margin + 300, 12, boldFont);
        nextLine(15);

        // Signature names with underlines
        addTextWithUnderline(`Nicula Mihai`, margin, 14, boldFont);
        addTextWithUnderline(customerName, margin + 300, 14, boldFont);
        nextLine(40);

        // Signature lines
        page.drawLine({
            start: { x: margin, y: currentY },
            end: { x: margin + 200, y: currentY },
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        page.drawLine({
            start: { x: margin + 300, y: currentY },
            end: { x: margin + 500, y: currentY },
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        // Footer with date and contact info
        currentY = 60;
        addCenteredText(`Document generat la: ${new Date().toLocaleString('ro-RO')}`, 8, regularFont, rgb(0.5, 0.5, 0.5));
        nextLine(15);
        addCenteredText(`SC AUTO RENT M SRL - Email: office@autorent.ro | Tel: +40 123 456 789`, 8, regularFont, rgb(0.5, 0.5, 0.5));

        // Add decorative border
        page.drawRectangle({
            x: margin - 10,
            y: 40,
            width: contentWidth + 20,
            height: pageHeight - 80,
            borderColor: rgb(0.098, 0.463, 0.824),
            borderWidth: 2,
        });

        // Save and return PDF
        const pdfBytes = await pdfDoc.save();
        return pdfBytes;

    } catch (error) {
        console.error('Error generating invoice:', error);
        throw new Error('Failed to generate invoice: ' + (error as Error).message);
    }
};

// Download the invoice PDF
export const downloadInvoice = async (customer: Customer, rental: RentalExtended): Promise<void> => {
    try {
        const pdfBytes = await generateInvoice(customer, rental);

        // Create a blob from the PDF bytes
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);

        // Create a link element
        const link = document.createElement('a');
        link.href = url;

        // Use removeDiacritics for the filename as well
        const safeFirstName = removeDiacritics(customer.first_name || '');
        const safeLastName = removeDiacritics(customer.last_name || '');
        link.download = `factura_${safeLastName}_${safeFirstName}_${new Date().toISOString().slice(0, 10)}.pdf`;

        // Append the link to the document, click it, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the URL
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading invoice:', error);
        throw error;
    }
};

export default {
    generateInvoice,
    downloadInvoice
};