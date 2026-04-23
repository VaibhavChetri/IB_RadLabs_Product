import * as XLSX from 'xlsx';

/**
 * Export data to Excel file
 * @param data - Array of data objects to export
 * @param columns - Array of column definitions with key and title
 * @param filename - Name of the Excel file (without extension)
 */
export function exportToExcel<T extends Record<string, unknown>>(
	data: T[],
	columns: Array<{ key: string; title: string }>,
	filename: string = 'export'
): void {
	// Create worksheet data with headers
	const worksheetData = [
		// Header row
		columns.map(col => col.title),
		// Data rows
		...data.map(row =>
			columns.map(col => {
				const value = row[col.key];
				// Handle null/undefined values
				if (value === null || value === undefined) {
					return '';
				}
				// Return the value as-is (xlsx will handle formatting)
				return value;
			})
		),
	];

	// Create workbook and worksheet
	const workbook = XLSX.utils.book_new();
	const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

	// Set column widths (auto-width based on content)
	const colWidths = columns.map(col => {
		const maxLength = Math.max(
			col.title.length,
			...data.map(row => {
				const value = row[col.key];
				return value ? String(value).length : 0;
			})
		);
		return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
	});
	worksheet['!cols'] = colWidths;

	// Add worksheet to workbook
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

	// Generate filename with timestamp
	const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
	const fullFilename = `${filename}_${timestamp}.xlsx`;

	// Write file and trigger download
	XLSX.writeFile(workbook, fullFilename);
}




