/**
 * Excel Export Utility
 * Provides functions to export data to Excel format
 */

import * as XLSX from 'xlsx';

/**
 * Export data to Excel file
 * @param data - Array of objects to export
 * @param filename - Name of the file (without extension)
 * @param sheetName - Name of the Excel sheet (default: 'Sheet1')
 */
export const exportToExcel = (
	data: Record<string, unknown>[],
	filename: string,
	sheetName: string = 'Sheet1'
): void => {
	if (!data || data.length === 0) {
		console.warn('No data to export');
		return;
	}

	// Create a new workbook
	const workbook = XLSX.utils.book_new();

	// Convert data to worksheet
	const worksheet = XLSX.utils.json_to_sheet(data);

	// Add worksheet to workbook
	XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

	// Generate Excel file and download
	XLSX.writeFile(workbook, `${filename}.xlsx`);
};
