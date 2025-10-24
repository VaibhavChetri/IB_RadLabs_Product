import jsPDF from 'jspdf';
import { getCityAddress } from '../config/cityConfig';

export interface DeliveryChallanData {
	dcNumber: string;
	date: string;
	time: string;
	clientName: string;
	clientAddress?: string;
	facilityId: number;
	cityId: number;
	items: Array<{
		id: number;
		name: string;
		quantity: number;
		rate?: number;
		amount?: number;
	}>;
	signatureName?: string;
	vehicleNumber?: string;
	clientType?: 'piramal' | 'concentric' | 'default'; // Client type flag from backend
}

// API Response structure from getSentCount
export interface DCApiResponse {
	status: string;
	status_code: number;
	message: string;
	result: Array<{
		id: number;
		clientId: number;
		facilityId: number;
		clientName: string;
		containerTypeId: number;
		sku: string;
		count: number;
		DC: number;
		facilityName: string;
		created_at: string;
		dispatch_date_time: string;
		adhoc: number;
		water: number;
		chemical: number;
		disposable: number;
		co2: number;
		electricity: number;
		weightInGms: number;
	}>;
	total: number[];
	totalCount: number;
	days: Array<{
		date: string;
		day: string;
	}>;
}

export class DeliveryChallanGenerator {
	private doc: jsPDF;
	private pageWidth: number;
	private pageHeight: number;
	private margin: number;
	private clientType: 'piramal' | 'concentric' | 'default';

	constructor() {
		this.doc = new jsPDF();
		this.pageWidth = this.doc.internal.pageSize.getWidth();
		this.pageHeight = this.doc.internal.pageSize.getHeight();
		this.margin = 20;
		this.clientType = 'default';
	}

	generateDeliveryChallan(data: DeliveryChallanData): void {
		// Determine page size based on client type
		const pageSize = this.getPageSize(data.clientType || 'default');

		// Create PDF with custom page size
		this.doc = new jsPDF({
			orientation: 'portrait',
			unit: 'pt',
			format: [pageSize.width, pageSize.height],
		});

		this.pageWidth = this.doc.internal.pageSize.getWidth();
		this.pageHeight = this.doc.internal.pageSize.getHeight();
		this.clientType = data.clientType || 'default';

		// Set font
		this.doc.setFont('helvetica');

		// Compact Header Section with Logo
		this.drawCompactHeader(data);

		// Compact Company & Client Info
		this.drawCompactCompanyInfo(data);

		// Compact Document Details
		this.drawCompactDocumentDetails(data);

		// Compact Items Table
		this.drawCompactItemsTable(data);

		// Compact Footer
		this.drawCompactFooter(data);

		// Download the PDF
		this.doc.save(`DC-${data.dcNumber}.pdf`);
	}

	private getPageSize(clientType: 'piramal' | 'concentric' | 'default'): {
		width: number;
		height: number;
	} {
		switch (clientType) {
			case 'piramal':
				// Piramal: Custom size (similar to A4 but taller)
				return { width: 595.28, height: 981.89 };
			case 'concentric':
				// Concentric: A4 size
				return { width: 595.28, height: 841.89 };
			case 'default':
			default:
				// Default: Compact size
				return { width: 595.28, height: 681.89 };
		}
	}

	private drawCompactHeader(_data: DeliveryChallanData): void {
		// Add logo from public folder
		try {
			this.doc.addImage('/IBlogo.jpeg', 'JPEG', this.margin, 5, 25, 15);
		} catch (error) {
			// Fallback if logo fails to load
			this.doc.setFontSize(12);
			this.doc.setFont('helvetica', 'bold');
			this.doc.text('INFINITYBOX', this.margin, 15);
		}

		// Company name next to logo
		this.doc.setFontSize(14);
		this.doc.setFont('helvetica', 'bold');
		this.doc.text('INFINITYBOX PRIVATE LIMITED', this.margin + 30, 12);

		// Delivery Challan - simple text, no black background
		this.doc.setFontSize(12);
		this.doc.setFont('helvetica', 'bold');
		this.doc.text('DELIVERY CHALLAN', this.pageWidth - 50, 15);
	}

	private drawCompactCompanyInfo(data: DeliveryChallanData): void {
		const yStart = 18; // Reduced gap - closer to company name

		// Company Address - formatted in 3 lines exactly below company name
		this.doc.setFontSize(8);
		this.doc.setFont('helvetica', 'normal');
		const companyAddress = getCityAddress(data.cityId);

		// Format address in 3 lines with restricted width
		const addressLines = this.formatAddressInThreeLines(companyAddress);
		addressLines.forEach((line, index) => {
			this.doc.text(line, this.margin + 30, yStart + index * 3);
		});

		// To Section - compact with styling
		this.doc.setFontSize(9);
		this.doc.setFont('helvetica', 'bold');
		this.doc.text('To:', this.margin, yStart + 12);
		this.doc.setFont('helvetica', 'normal');
		this.doc.text(data.clientName, this.margin + 12, yStart + 12);

		// Add a subtle line separator
		this.doc.setDrawColor(200, 200, 200);
		this.doc.line(this.margin, yStart + 16, this.pageWidth - this.margin, yStart + 16);
	}

	private formatAddressInThreeLines(address: string): string[] {
		// Split address into components
		const parts = address.split(',').map(part => part.trim());

		// Extract city and pincode (usually at the end)
		const lastPart = parts[parts.length - 1];
		const cityPincodeMatch = lastPart.match(/(.+?)\s*-\s*(\d+)$/);

		let cityPincode = lastPart;
		let middleParts = parts.slice(1, -1); // Start from index 1, not 0

		if (cityPincodeMatch) {
			cityPincode = `${cityPincodeMatch[1].trim()} - ${cityPincodeMatch[2]}`;
		}

		// First line: Numbers/Unit (first part only)
		const firstLine = parts[0];

		// Second line: Address (middle parts only, excluding first and last)
		const secondLine = middleParts.join(', ');

		// Third line: City and Pincode
		const thirdLine = cityPincode;

		return [firstLine, secondLine, thirdLine];
	}

	private drawCompactDocumentDetails(data: DeliveryChallanData): void {
		const yStart = 40;

		// Document details in a compact grid
		this.doc.setFontSize(8);
		this.doc.setFont('helvetica', 'bold');

		// Create a compact info box
		this.doc.setFillColor(245, 245, 245);
		this.doc.rect(this.margin, yStart, this.pageWidth - 2 * this.margin, 12, 'F');

		// DC Number
		this.doc.text('DC No:', this.margin + 2, yStart + 4);
		this.doc.setFont('helvetica', 'normal');
		this.doc.text(data.dcNumber, this.margin + 20, yStart + 4);

		// Date
		this.doc.setFont('helvetica', 'bold');
		this.doc.text('Date:', this.margin + 2, yStart + 8);
		this.doc.setFont('helvetica', 'normal');
		this.doc.text(data.date, this.margin + 20, yStart + 8);

		// Time
		this.doc.setFont('helvetica', 'bold');
		this.doc.text('Time:', this.margin + 80, yStart + 4);
		this.doc.setFont('helvetica', 'normal');
		this.doc.text(data.time, this.margin + 95, yStart + 4);

		// Vehicle Number (if available)
		if (data.vehicleNumber) {
			this.doc.setFont('helvetica', 'bold');
			this.doc.text('Vehicle:', this.margin + 80, yStart + 8);
			this.doc.setFont('helvetica', 'normal');
			this.doc.text(data.vehicleNumber, this.margin + 95, yStart + 8);
		}
	}

	private drawCompactItemsTable(data: DeliveryChallanData): void {
		const yStart = 55;
		const tableWidth = this.pageWidth - 2 * this.margin;
		const colWidths = [15, 140, 25]; // #, Items & Description, Qty
		const rowHeight = 6;

		// Table header - simple, no background color (environmentally friendly)
		this.doc.setFontSize(8);
		this.doc.setFont('helvetica', 'bold');

		let xPos = this.margin;
		const headers = ['#', 'Items & Description', 'Qty'];

		headers.forEach((header, index) => {
			this.doc.text(header, xPos + 2, yStart + 4);
			xPos += colWidths[index];
		});

		// Add underline for header
		this.doc.setDrawColor(0, 0, 0);
		this.doc.line(this.margin, yStart + 6, this.pageWidth - this.margin, yStart + 6);

		// Table rows with compact styling
		this.doc.setFont('helvetica', 'normal');

		data.items.forEach((item, index) => {
			const rowY = yStart + (index + 1) * rowHeight + 2;

			// Alternate row colors for better readability (light gray)
			if (index % 2 === 0) {
				this.doc.setFillColor(250, 250, 250);
				this.doc.rect(this.margin, rowY - 2, tableWidth, rowHeight, 'F');
			}

			xPos = this.margin;

			// Row data
			this.doc.text(item.id.toString(), xPos + 2, rowY + 2);
			xPos += colWidths[0];

			// Wrap long descriptions
			const description = this.doc.splitTextToSize(item.name, colWidths[1] - 4);
			this.doc.text(description, xPos + 2, rowY + 2);
			xPos += colWidths[1];

			// Quantity
			this.doc.text(item.quantity.toString(), xPos + 2, rowY + 2);
		});

		// Table border
		this.doc.setDrawColor(0, 0, 0);
		this.doc.rect(this.margin, yStart, tableWidth, (data.items.length + 1) * rowHeight + 2);
	}

	private drawCompactFooter(data: DeliveryChallanData): void {
		const tableEndY = 55 + (data.items.length + 1) * 6;
		const yStart = tableEndY + 8;

		// Compact signature section
		this.doc.setFontSize(8);
		this.doc.setFont('helvetica', 'bold');

		// Receiver's signature
		this.doc.text("RECEIVER'S SIGN:", this.margin, yStart);
		this.doc.line(this.margin + 35, yStart - 1, this.margin + 80, yStart - 1);

		// Time
		this.doc.text('Time:', this.margin + 90, yStart);
		this.doc.line(this.margin + 105, yStart - 1, this.margin + 140, yStart - 1);

		// Company signature
		this.doc.text('For INFINITY BOX:', this.margin, yStart + 8);
		this.doc.line(this.margin + 35, yStart + 7, this.margin + 80, yStart + 7);

		if (data.signatureName) {
			this.doc.setFont('helvetica', 'normal');
			this.doc.text(data.signatureName, this.margin + 35, yStart + 12);
		}

		// Add a subtle border around the entire document
		this.doc.setDrawColor(200, 200, 200);
		this.doc.rect(5, 5, this.pageWidth - 10, this.pageHeight - 10);
	}
}

// Helper function to convert API response to PDF data
export const convertApiResponseToDCData = (
	apiResponse: DCApiResponse,
	rowData: {
		id: number;
		facilityId: number;
		city_id: number;
		restaurantName: string;
		transitDate: string;
		transit_time: string;
		signature_name?: string;
		vehicle_number?: string;
	}
): DeliveryChallanData => {
	// Client type will come from backend flags, not hardcoded detection
	return {
		dcNumber: `IB-${rowData.facilityId}-${rowData.id}`,
		date: rowData.transitDate || new Date().toISOString().split('T')[0],
		time: rowData.transit_time || '15:00:00',
		clientName: rowData.restaurantName || 'Unknown Client',
		facilityId: rowData.facilityId || 115,
		cityId: rowData.city_id || 3,
		clientType: 'default', // Will be overridden by backend flag
		items: apiResponse.result.map((item, index) => ({
			id: index + 1,
			name: item.sku, // Use 'sku' field from API
			quantity: item.count, // Use 'count' field from API
			rate: undefined, // Not available in API
			amount: undefined, // Not available in API
		})),
		signatureName: rowData.signature_name,
		vehicleNumber: rowData.vehicle_number,
	};
};

// Client type will be provided by backend flags
// No hardcoded detection needed

// Export a simple function to generate DC
export const generateDeliveryChallanPDF = (data: DeliveryChallanData): void => {
	const generator = new DeliveryChallanGenerator();
	generator.generateDeliveryChallan(data);
};
