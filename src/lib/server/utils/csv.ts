/**
 * Escapes a value for CSV output.
 * Wraps in double quotes if it contains comma, newline, or double-quote.
 * Doubles internal double-quotes per RFC 4180.
 */
export function escapeCsv(value: unknown): string {
	if (value === null || value === undefined) return '';
	const str = String(value);
	if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

/**
 * Builds a CSV string from headers and rows.
 * Each row is an array of values in the same order as headers.
 */
export function buildCsv(headers: string[], rows: unknown[][]): string {
	const headerLine = headers.map(escapeCsv).join(',');
	const dataLines = rows.map((row) => row.map(escapeCsv).join(','));
	return [headerLine, ...dataLines].join('\r\n') + '\r\n';
}

/**
 * Creates a Response with CSV content and download headers.
 * Includes UTF-8 BOM for Excel compatibility.
 */
export function csvResponse(csv: string, filename: string): Response {
	const bom = '\uFEFF';
	return new Response(bom + csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'no-store',
		},
	});
}
