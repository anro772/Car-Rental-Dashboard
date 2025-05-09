import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Customer } from './customersService';
import { RentalExtended } from './rentalsService';

const CONTRACT_TEMPLATE_PATH = '/src/assets/templates/contract.pdf';

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
        .replace(/ş/g, 's') // handle both forms of ș
        .replace(/ț/g, 't')
        .replace(/ţ/g, 't') // handle both forms of ț
        .replace(/Ă/g, 'A')
        .replace(/Â/g, 'A')
        .replace(/Î/g, 'I')
        .replace(/Ș/g, 'S')
        .replace(/Ş/g, 'S')
        .replace(/Ț/g, 'T')
        .replace(/Ţ/g, 'T');
};

// Generate a filled contract for a customer and rental
export const generateContract = async (customer: Customer, rental?: RentalExtended): Promise<Uint8Array> => {
    try {
        // Fetch the PDF template
        const templateResponse = await fetch(CONTRACT_TEMPLATE_PATH);
        const templateBytes = await templateResponse.arrayBuffer();

        // Load the PDF document
        const pdfDoc = await PDFDocument.load(templateBytes);

        // Get the first page
        const page = pdfDoc.getPages()[0];

        // Get a font to use
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Get current date or rental start date with safe characters
        const rentalDate = rental?.start_date
            ? removeDiacritics(formatDateRo(rental.start_date))
            : removeDiacritics(formatDateRo(new Date().toISOString()));

        // Customer full name - apply removeDiacritics to avoid encoding issues
        const customerFirstName = removeDiacritics(customer.first_name || '');
        const customerLastName = removeDiacritics(customer.last_name || '');
        const customerName = `${customerFirstName} ${customerLastName}`;

        // FINAL COORDINATE ADJUSTMENTS based on feedback

        // Top date field (Incheiat azi, data _______)
        page.drawText(rentalDate, {
            x: 150,
            y: 720,
            size: 11,
            font,
            color: rgb(0, 0, 0)
        });

        // Customer name (Dl./Dna.)
        page.drawText(customerName, {
            x: 150,
            y: 700,
            size: 11,
            font,
            color: rgb(0, 0, 0)
        });

        // Company name (SC/PFA/II/IF)
        page.drawText('SC AUTO RENT M SRL', {
            x: 150,
            y: 685,
            size: 11,
            font,
            color: rgb(0, 0, 0)
        });

        // Date after "Subsemnatul Locator declar că predau astăzi"
        page.drawText(rentalDate, {
            x: 300,
            y: 660,
            size: 11,
            font,
            color: rgb(0, 0, 0)
        });

        // Date after "Subsemnatul Locatar, declar că preiau azi"
        page.drawText(rentalDate, {
            x: 280,
            y: 565,
            size: 11,
            font,
            color: rgb(0, 0, 0)
        });

        // Number of copies (numeric)
        page.drawText('2', {
            x: 280,
            y: 525,
            size: 11,
            font,
            color: rgb(0, 0, 0)
        });

        // Number of copies (written) - using ASCII "doua" instead of "două"
        page.drawText('doua', {
            x: 360,
            y: 525,
            size: 11,
            font,
            color: rgb(0, 0, 0)
        });

        // Proprietor name
        page.drawText('Nicula Mihai', {
            x: 150,
            y: 465,
            size: 11,
            font,
            color: rgb(0, 0, 0)
        });

        // Customer name at bottom (chiriaș)
        page.drawText(customerName, {
            x: 145,
            y: 423,
            size: 11,
            font,
            color: rgb(0, 0, 0)
        });

        // Save the PDF
        const pdfBytes = await pdfDoc.save();

        return pdfBytes;
    } catch (error) {
        console.error('Error generating contract:', error);
        throw new Error('Failed to generate contract: ' + (error as Error).message);
    }
};

// Download the contract PDF
export const downloadContract = async (customer: Customer, rental?: RentalExtended): Promise<void> => {
    try {
        const pdfBytes = await generateContract(customer, rental);

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
        link.download = `contract_${safeLastName}_${safeFirstName}_${new Date().toISOString().slice(0, 10)}.pdf`;

        // Append the link to the document, click it, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the URL
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading contract:', error);
        throw error;
    }
};

export default {
    generateContract,
    downloadContract
};