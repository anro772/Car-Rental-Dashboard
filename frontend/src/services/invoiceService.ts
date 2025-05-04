import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Customer } from './customersService';
import { RentalExtended } from './rentalsService';

const INVOICE_TEMPLATE_PATH = '/src/assets/templates/factura.pdf';

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
    return text
        .replace(/ă/g, 'a')
        .replace(/â/g, 'a')
        .replace(/î/g, 'i')
        .replace(/ș/g, 's')
        .replace(/ț/g, 't')
        .replace(/Ă/g, 'A')
        .replace(/Â/g, 'A')
        .replace(/Î/g, 'I')
        .replace(/Ș/g, 'S')
        .replace(/Ț/g, 'T');
};

// Calculate number of days between two dates
const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive count
};

// Generate a filled invoice for a rental
export const generateInvoice = async (customer: Customer, rental: RentalExtended): Promise<Uint8Array> => {
    try {
        // Fetch the PDF template
        const templateResponse = await fetch(INVOICE_TEMPLATE_PATH);
        const templateBytes = await templateResponse.arrayBuffer();

        // Load the PDF document
        const pdfDoc = await PDFDocument.load(templateBytes);

        // Get the first page
        const page = pdfDoc.getPages()[0];

        // Get fonts to use
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Calculate rental details
        const emissionDate = removeDiacritics(formatDateRo(rental.end_date));
        const customerName = `${customer.first_name} ${customer.last_name}`;
        const carName = `${rental.brand} ${rental.model} (${rental.license_plate})`;
        const rentalDays = calculateDays(rental.start_date, rental.end_date);

        // Ensure total_cost is a number
        const totalCost = parseFloat(rental.total_cost as any) || 0;
        const dailyRate = rentalDays > 0 ? totalCost / rentalDays : 0;

        // Format currency values
        const formattedDailyRate = dailyRate.toFixed(2);
        const formattedTotalCost = totalCost.toFixed(2);

        // Draw on the PDF using coordinates from the template

        // Emission date
        page.drawText(emissionDate, {
            x: 110,
            y: 730,
            size: 11,
            font: regularFont,
            color: rgb(0, 0, 0)
        });

        // Customer name
        page.drawText(customerName, {
            x: 110,
            y: 530,
            size: 11,
            font: regularFont,
            color: rgb(0, 0, 0)
        });

        // Car rental description
        page.drawText(carName, {
            x: 170,
            y: 435,
            size: 10,
            font: regularFont,
            color: rgb(0, 0, 0)
        });

        // Number of days
        page.drawText(rentalDays.toString(), {
            x: 350,
            y: 435,
            size: 11,
            font: regularFont,
            color: rgb(0, 0, 0)
        });

        // Daily rate
        page.drawText(formattedDailyRate, {
            x: 415,
            y: 435,
            size: 11,
            font: regularFont,
            color: rgb(0, 0, 0)
        });

        // Total value
        page.drawText(formattedTotalCost, {
            x: 510,
            y: 435,
            size: 11,
            font: regularFont,
            color: rgb(0, 0, 0)
        });

        // Total (bold)
        page.drawText(formattedTotalCost, {
            x: 485,
            y: 400,
            size: 11,
            font: boldFont,
            color: rgb(0, 0, 0)
        });

        // Proprietor name (Nicula Mihai)
        page.drawText("Nicula Mihai", {
            x: 145,
            y: 330,
            size: 11,
            font: regularFont,
            color: rgb(0, 0, 0)
        });

        // Customer name (Chirias)
        page.drawText(customerName, {
            x: 360,
            y: 330,
            size: 11,
            font: regularFont,
            color: rgb(0, 0, 0)
        });

        // Save the PDF
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
        link.download = `factura_${customer.last_name}_${customer.first_name}_${new Date().toISOString().slice(0, 10)}.pdf`;

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