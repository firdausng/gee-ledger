/**
 * Compute the base currency amount from original amount and exchange rate.
 * Exchange rate is stored as rate × 1,000,000.
 * Returns null if exchangeRate is null/undefined (rate not yet set).
 */
export function computeBaseAmount(
	originalAmount: number,
	exchangeRate: number | null | undefined
): number | null {
	if (exchangeRate == null) return null;
	return Math.round((originalAmount * exchangeRate) / 1_000_000);
}

/**
 * For same-currency transactions, the exchange rate is always 1.0 (stored as 1,000,000).
 */
export const SAME_CURRENCY_RATE = 1_000_000;
