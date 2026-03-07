export type Address = {
	line1?: string | null;
	line2?: string | null;
	city?: string | null;
	state?: string | null;
	postalCode?: string | null;
	country?: string | null;
};

/**
 * Format a structured address into a multi-line display string.
 *
 * Output example:
 *   123 Jalan Ampang, Suite 4B
 *   Kuala Lumpur, Wilayah Persekutuan 50450
 *   Malaysia
 */
export function formatAddress(addr: Address | null | undefined): string {
	if (!addr) return '';

	const lines: string[] = [];

	// Line 1 + Line 2
	const street = [addr.line1, addr.line2].filter(Boolean).join(', ');
	if (street) lines.push(street);

	// City, State PostalCode
	const cityState = [addr.city, addr.state].filter(Boolean).join(', ');
	const cityLine = [cityState, addr.postalCode].filter(Boolean).join(' ');
	if (cityLine) lines.push(cityLine);

	// Country
	if (addr.country) lines.push(addr.country);

	return lines.join('\n');
}

/** Check if an address has any non-empty field */
export function hasAddress(addr: Address | null | undefined): boolean {
	if (!addr) return false;
	return !!(addr.line1 || addr.line2 || addr.city || addr.state || addr.postalCode || addr.country);
}

/** Address field keys used in DB schemas */
export const ADDRESS_FIELDS = ['addressLine1', 'addressLine2', 'addressCity', 'addressState', 'addressPostalCode', 'addressCountry'] as const;
