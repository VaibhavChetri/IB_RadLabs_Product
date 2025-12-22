import jsPDF from 'jspdf';

// -----------------------------
// Types
// -----------------------------
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
	clientType?: 'piramal' | 'concentric' | 'default';
	adhoc?: number;
	driverName?: string;
	driverPhone?: string;
}

export interface DCApiResponse {
	status: string;
	status_code: number;
	message: string;
	result: Array<{
		id: number;
		clientId: number;
		facilityId: number;
		clientName: string;
		sku: string;
		count: number;
		facilityName: string;
		dispatch_date_time: string;
		adhoc?: number;
		driver_name?: string;
		driver_phone?: string;
		vehicle_number?: string;
	}>;
}

// -----------------------------
// Class: DeliveryChallanGenerator
// -----------------------------
export class DeliveryChallanGenerator {
	private doc: jsPDF;
	private layoutType: 'piramal' | 'concentric' | 'default';
	private pageWidth: number;
	private pageHeight: number;
	private margin = 25;

	constructor(layoutType: 'piramal' | 'concentric' | 'default' = 'default') {
		const { width, height } = DeliveryChallanGenerator.getPageSize(layoutType);
		this.doc = new jsPDF({ unit: 'pt', format: [width, height] });
		this.layoutType = layoutType;
		this.pageWidth = width;
		this.pageHeight = height;
	}

	static getPageSize(type: 'piramal' | 'concentric' | 'default') {
		switch (type) {
			case 'piramal':
				return { width: 595.28, height: 981.89 }; // Tall custom
			case 'concentric':
				return { width: 595.28, height: 841.89 }; // A4 standard
			default:
				return { width: 400, height: 500 }; // Compact receipt-style
		}
	}

	public generate(data: DeliveryChallanData): void {
		switch (this.layoutType) {
			case 'piramal':
				this.renderPiramalLayout(data);
				break;
			case 'concentric':
				this.renderConcentricLayout(data);
				break;
			default:
				this.renderCompactLayout(data);
				break;
		}
		this.doc.save(`DC-${data.dcNumber}.pdf`);
	}

	// -----------------------------
	// 1️⃣ Compact Layout (Default)
	// -----------------------------
	private renderCompactLayout(data: DeliveryChallanData): void {
		let y = this.drawHeader(data, 35, 8); // Spacious header
		y = this.drawClientAndDetails(data, y + 10, 7);
		const yAfterTable = this.drawTable(data, y + 10, 8);
		this.drawFooter(data, yAfterTable, 8);
	}

	// -----------------------------
	// 2️⃣ Concentric Layout (A4 Standard)
	// -----------------------------
	private renderConcentricLayout(data: DeliveryChallanData): void {
		let y = this.drawHeader(data, 35, 10); // Spacious header
		y = this.drawClientAndDetails(data, y + 10, 9);
		const yAfterTable = this.drawTable(data, y + 10, 10);
		this.drawFooter(data, yAfterTable, 9);
	}

	// -----------------------------
	// 3️⃣ Piramal Layout (Tall Custom)
	// -----------------------------
	private renderPiramalLayout(data: DeliveryChallanData): void {
		let y = this.drawHeader(data, 35, 14); // Larger header font
		y = this.drawClientAndDetails(data, y + 15, 12); // More spacing, larger font
		const yAfterTable = this.drawTable(data, y + 15, 14); // Larger table rows
		this.drawFooter(data, yAfterTable, 12); // Larger footer
	}

	// -----------------------------
	// Shared Drawing Helpers
	// -----------------------------
	private drawHeader(_data: DeliveryChallanData, yStart: number, font: number): number {
		const margin = this.margin;
		const challanLabel = 'DELIVERY CHALLAN';
		const companyName = 'INFINITYBOX PRIVATE LIMITED';

		// --- Logo (Large, centered-left, airy spacing) ---
		try {
			// Adjust the logo size here for brand prominence
			const logoWidth = 60;
			const logoHeight = 30;
			const logoY = yStart - 10;
			this.doc.addImage('/IBlogo.jpeg', 'JPEG', margin, logoY, logoWidth, logoHeight);
		} catch {
			this.doc.setFont('helvetica', 'bold');
			this.doc.setFontSize(font + 4);
			this.doc.text('INFINITYBOX', margin, yStart);
		}

		// --- Company Name and Delivery Challan ---
		const nameY = yStart + 35; // push below logo
		this.doc.setFont('helvetica', 'bold');
		this.doc.setFontSize(font + 2);
		this.doc.text(companyName, margin, nameY);

		const challanWidth = this.doc.getTextWidth(challanLabel);
		this.doc.text(challanLabel, this.pageWidth - margin - challanWidth, nameY);

		// --- Address below company name (based on city_id) ---
		this.doc.setFont('helvetica', 'normal');
		this.doc.setFontSize(font);

		// Get address based on city_id
		const addressLines = this.getAddressByCity(_data.cityId);

		let y = nameY + font + 5;
		addressLines.forEach(line => {
			this.doc.text(line, margin, y);
			y += font + 2;
		});

		// add some breathing room after address
		return y + 10;
	}

	private drawClientAndDetails(data: DeliveryChallanData, y: number, font: number): number {
		// --- To section ---
		this.doc.setFont('helvetica', 'bold');
		this.doc.setFontSize(font);
		this.doc.text(`To: ${data.clientName}`, this.margin, y);

		y += font + 8;

		// --- DC Info ---
		this.doc.setFont('helvetica', 'normal');
		const col1X = this.margin;
		const col2X = this.pageWidth / 2;

		this.doc.text(`DC No: ${data.dcNumber}`, col1X, y);
		this.doc.text(`Date: ${data.date}`, col2X, y);

		y += font + 5;
		this.doc.text(`Time: ${data.time}`, col1X, y);

		// --- Adhoc Transportation Details (if adhoc = 1) ---
		if (data.adhoc === 1 && data.driverName && data.driverPhone && data.vehicleNumber) {
			y += font + 8;
			this.doc.setFont('helvetica', 'bold');
			this.doc.text('Adhoc Transportation Details:', col1X, y);

			y += font + 5;
			this.doc.setFont('helvetica', 'normal');
			this.doc.text(`Driver Name: ${data.driverName}`, col1X, y);
			this.doc.text(`Vehicle Number: ${data.vehicleNumber}`, col2X, y);

			y += font + 5;
			this.doc.text(`Driver Phone: ${data.driverPhone}`, col1X, y);
		}

		// Add a light divider line
		this.doc.setDrawColor(220);
		this.doc.line(this.margin, y + 10, this.pageWidth - this.margin, y + 10);

		return y + 20; // return next Y for table
	}

	private drawTable(data: DeliveryChallanData, yStart: number, rowHeight: number): number {
		const colWidths = this.getColumnWidths();
		const headers = ['#', 'Items & Description', 'Qty'];
		const tableWidth = colWidths.reduce((a, b) => a + b, 0);

		// Table header
		this.doc.setFont('helvetica', 'bold');
		this.doc.setFontSize(rowHeight);
		let x = this.margin;
		headers.forEach((header, i) => {
			this.doc.text(header, x + 2, yStart);
			x += colWidths[i];
		});

		// Header line
		this.doc.setDrawColor(0, 0, 0);
		this.doc.line(this.margin, yStart + 5, this.margin + tableWidth, yStart + 5);

		// Table rows
		this.doc.setFont('helvetica', 'normal');
		let y = yStart + rowHeight + 5;

		data.items.forEach((item, idx) => {
			let xPos = this.margin;

			// Row number
			this.doc.text(String(idx + 1), xPos + 2, y);
			xPos += colWidths[0];

			// Item name with text wrapping
			const wrapped = this.doc.splitTextToSize(item.name, colWidths[1] - 10);
			this.doc.text(wrapped, xPos + 2, y);
			xPos += colWidths[1];

			// Quantity
			this.doc.text(String(item.quantity), xPos + 2, y);

			y += rowHeight + 2;
		});

		return y; // return final vertical position
	}

	private drawFooter(_data: DeliveryChallanData, yStart: number, font: number): void {
		// Give the footer some breathing space below the table
		const topGap = 25;
		const y = yStart + topGap;

		this.doc.setFont('helvetica', 'bold');
		this.doc.setFontSize(font);

		// Receiver's signature area - left side
		this.doc.text("Receiver's Signature:", this.margin, y);
		this.doc.line(this.margin + 90, y - 2, this.margin + 180, y - 2);

		// Time field for receiver - middle
		this.doc.text('Time:', this.margin + 200, y);
		this.doc.line(this.margin + 230, y - 2, this.margin + 300, y - 2);

		// Optional soft divider line to mark page bottom
		this.doc.setDrawColor(220);
		this.doc.line(
			this.margin,
			this.pageHeight - 40,
			this.pageWidth - this.margin,
			this.pageHeight - 40
		);
	}

	// -----------------------------
	// Helper Methods
	/**
	 * Get address lines based on city_id
	 * @param cityId - City ID to determine which address to use
	 * @returns Array of address lines
	 */
	private getAddressByCity(cityId: number): string[] {
		// City ID 4 = Gurgaon
		if (cityId === 4) {
			return [
				'Shri Sikanderpur Road, Opposite Cafe Gathering,',
				'Kherki Daula Sector 84, Gurgaon - 122004',
			];
		}

		// City ID 3 = Mumbai (default)
		// Default to Mumbai address for city_id 3 or any other city
		return [
			'Gala No 2 AK Containe, Patkar Compound,',
			'Tulshet Pada, Bhandup (West), Mumbai - 400078',
		];
	}

	// -----------------------------
	private getColumnWidths(): number[] {
		switch (this.layoutType) {
			case 'piramal':
				return [40, 400, 60]; // Wider columns for tall layout
			case 'concentric':
				return [35, 350, 50]; // Standard A4 columns
			default:
				return [25, 250, 40]; // Compact columns
		}
	}
}

// -----------------------------
// Conversion Helper
// -----------------------------
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
	// Get adhoc details from first item (they should be same for all items in a dispatch)
	const firstItem =
		apiResponse.result && apiResponse.result.length > 0 ? apiResponse.result[0] : null;

	return {
		dcNumber: `IB-${rowData.facilityId}-${rowData.id}`,
		date: rowData.transitDate || new Date().toISOString().split('T')[0],
		time: rowData.transit_time || '15:00:00',
		clientName: rowData.restaurantName || 'Unknown Client',
		facilityId: rowData.facilityId,
		cityId: rowData.city_id,
		clientType: 'default', // TODO: Integrate backend flag for clientType
		items: apiResponse.result
			.filter(item => item.count > 0) // Remove items with zero quantity
			.map((item, i) => ({
				id: i + 1,
				name: item.sku,
				quantity: item.count,
			})),
		signatureName: rowData.signature_name,
		// Use vehicle_number from API response if adhoc = 1, otherwise use rowData
		vehicleNumber:
			firstItem?.adhoc === 1
				? firstItem?.vehicle_number
				: rowData.vehicle_number || firstItem?.vehicle_number,
		adhoc: firstItem?.adhoc,
		driverName: firstItem?.driver_name,
		driverPhone: firstItem?.driver_phone,
	};
};

// -----------------------------
// Public API
// -----------------------------
export const generateDeliveryChallanPDF = (data: DeliveryChallanData) => {
	const generator = new DeliveryChallanGenerator(data.clientType || 'default');
	generator.generate(data);
};
