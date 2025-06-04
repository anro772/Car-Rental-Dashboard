import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CarTechnicalSheet, CarTechnicalHistory } from './carsService';

// Helper function to remove Romanian diacritics for PDF compatibility
const removeDiacritics = (text: string): string => {
    if (!text) return text;
    return text
        .replace(/[ăĂ]/g, 'a')
        .replace(/[âÂ]/g, 'a')
        .replace(/[îÎ]/g, 'i')
        .replace(/[șŞ]/g, 's')
        .replace(/[țŢ]/g, 't');
};

// Format date helper
const formatDateRo = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch {
        return 'N/A';
    }
};

// Calculate days until expiry
const calculateDaysUntilExpiry = (expiryDate: string | undefined): string => {
    if (!expiryDate) return 'N/A';
    try {
        const expiry = new Date(expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return removeDiacritics(`Expirat cu ${Math.abs(diffDays)} zile`);
        if (diffDays === 0) return removeDiacritics('Expira azi');
        if (diffDays <= 30) return removeDiacritics(`${diffDays} zile`);

        return removeDiacritics(`${diffDays} zile`);
    } catch {
        return 'Eroare calcul';
    }
};

// Translations (without diacritics for PDF)
const FUEL_TYPE_TRANSLATIONS: Record<string, string> = {
    'benzina': 'Benzina',
    'motorina': 'Motorina',
    'electric': 'Electric',
    'hybrid': 'Hibrid',
    'gpl': 'GPL'
};

const TRANSMISSION_TRANSLATIONS: Record<string, string> = {
    'manual': 'Manuala',
    'automat': 'Automata',
    'semi-automat': 'Semi-automata'
};

export const generateTechnicalSheetPDF = async (
    technicalData: CarTechnicalSheet,
    history: CarTechnicalHistory[]
): Promise<Blob> => {
    try {
        // Initialize jsPDF with default font
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        // Use default helvetica font which has good Romanian character support
        doc.setFont('helvetica');

        // Page setup
        const pageMargin = 14;
        const pageWidth = doc.internal.pageSize.getWidth();
        let currentY = 20;

        // Header
        doc.setFontSize(20);
        doc.text(removeDiacritics('FISA TEHNICA VEHICUL'), pageWidth / 2, currentY, { align: 'center' });
        currentY += 10;

        // Vehicle identification
        doc.setFontSize(14);
        doc.text(`${technicalData.brand} ${technicalData.model} (${technicalData.year})`, pageWidth / 2, currentY, { align: 'center' });
        currentY += 8;

        doc.setFontSize(12);
        doc.text(removeDiacritics(`Nr. Inmatriculare: ${technicalData.license_plate}`), pageWidth / 2, currentY, { align: 'center' });
        currentY += 15;

        // Current status section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(removeDiacritics('1. STARE CURENTA'), pageMargin, currentY);
        doc.setFont('helvetica', 'normal');
        currentY += 8;

        const currentStatusData = [
            ['Kilometraj', `${technicalData.kilometers || 0} km`],
            ['Nivel Combustibil', `${technicalData.fuel_level || 0}%`],
            ['Capacitate Rezervor', `${technicalData.tank_capacity || 0} L`],
            ['Combustibil Estimat', `${Math.round((technicalData.fuel_level || 0) * (technicalData.tank_capacity || 0) / 100)} L`],
        ];

        autoTable(doc, {
            startY: currentY,
            head: [],
            body: currentStatusData,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 2
            },
            columnStyles: {
                0: { cellWidth: 60, fontStyle: 'bold' },
                1: { cellWidth: 'auto' }
            },
            margin: { left: pageMargin, right: pageMargin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;

        // Technical specifications
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(removeDiacritics('2. SPECIFICATII TEHNICE'), pageMargin, currentY);
        doc.setFont('helvetica', 'normal');
        currentY += 8;

        const technicalSpecsData = [
            ['Tip Combustibil', FUEL_TYPE_TRANSLATIONS[technicalData.fuel_type || ''] || technicalData.fuel_type || 'N/A'],
            ['Motor', technicalData.engine_size || 'N/A'],
            ['Transmisie', TRANSMISSION_TRANSLATIONS[technicalData.transmission_type || ''] || technicalData.transmission_type || 'N/A'],
            [removeDiacritics('Numar Locuri'), `${technicalData.seats_count || 0}`],
            [removeDiacritics('Numar Usi'), `${technicalData.doors_count || 0}`],
            ['VIN', technicalData.vin_number || 'N/A'],
            [removeDiacritics('Data Inmatricularii'), formatDateRo(technicalData.registration_date)],
        ];

        autoTable(doc, {
            startY: currentY,
            head: [],
            body: technicalSpecsData,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 2
            },
            columnStyles: {
                0: { cellWidth: 60, fontStyle: 'bold' },
                1: { cellWidth: 'auto' }
            },
            margin: { left: pageMargin, right: pageMargin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;

        // Service information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(removeDiacritics('3. INFORMATII SERVICE'), pageMargin, currentY);
        doc.setFont('helvetica', 'normal');
        currentY += 8;

        const serviceData = [
            ['Ultim Service', formatDateRo(technicalData.last_service_date)],
            ['Km la Ultim Service', technicalData.last_service_km ? `${technicalData.last_service_km} km` : 'N/A'],
            [removeDiacritics('Urmatorul Service la'), technicalData.next_service_km ? `${technicalData.next_service_km} km` : 'N/A'],
            [removeDiacritics('Km pana la Service'), technicalData.next_service_km && technicalData.kilometers
                ? `${Math.max(0, technicalData.next_service_km - technicalData.kilometers)} km`
                : 'N/A'],
        ];

        autoTable(doc, {
            startY: currentY,
            head: [],
            body: serviceData,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 2
            },
            columnStyles: {
                0: { cellWidth: 60, fontStyle: 'bold' },
                1: { cellWidth: 'auto' }
            },
            margin: { left: pageMargin, right: pageMargin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;

        // Documents validity
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(removeDiacritics('4. VALABILITATE DOCUMENTE'), pageMargin, currentY);
        doc.setFont('helvetica', 'normal');
        currentY += 8;

        const documentsData = [
            ['Asigurare', formatDateRo(technicalData.insurance_expiry), calculateDaysUntilExpiry(technicalData.insurance_expiry)],
            ['ITP', formatDateRo(technicalData.itp_expiry), calculateDaysUntilExpiry(technicalData.itp_expiry)],
        ];

        autoTable(doc, {
            startY: currentY,
            head: [['Document', removeDiacritics('Expira la'), removeDiacritics('Timp ramas')]],
            body: documentsData,
            theme: 'grid',
            headStyles: {
                fillColor: [66, 66, 66],
                fontSize: 10,
                fontStyle: 'bold',
                textColor: [255, 255, 255]
            },
            styles: {
                fontSize: 10,
                cellPadding: 2
            },
            margin: { left: pageMargin, right: pageMargin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;

        // Recent history (last 5 entries)
        if (history.length > 0 && currentY < 220) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('5. ISTORIC RECENT', pageMargin, currentY);
            doc.setFont('helvetica', 'normal');
            currentY += 8;

            const historyData = history.slice(0, 5).map(entry => [
                formatDateRo(entry.created_at),
                `${entry.kilometers} km`,
                `${entry.fuel_level}%`,
                removeDiacritics(entry.notes || '-')
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Data', 'Kilometraj', 'Combustibil', 'Note']],
                body: historyData,
                theme: 'grid',
                headStyles: {
                    fillColor: [66, 133, 244],
                    fontSize: 9,
                    fontStyle: 'bold',
                    textColor: [255, 255, 255]
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 1.5
                },
                margin: { left: pageMargin, right: pageMargin }
            });

            currentY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Footer
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
            removeDiacritics(`Generat la: ${new Date().toLocaleString('ro-RO')}`),
            pageMargin,
            footerY
        );

        if (technicalData.total_rentals !== undefined) {
            doc.text(
                removeDiacritics(`Total inchirieri: ${technicalData.total_rentals}`),
                pageWidth - pageMargin,
                footerY,
                { align: 'right' }
            );
        }

        return doc.output('blob');

    } catch (error) {
        console.error('Error generating technical sheet PDF:', error);
        throw new Error('Failed to generate technical sheet PDF');
    }
};