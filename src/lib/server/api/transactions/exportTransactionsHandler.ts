import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, gte, lte, inArray } from 'drizzle-orm';
import { transactions, contacts, categories, locations, salesChannels } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { buildCsv } from '$lib/server/utils/csv';
import type { TransactionFilters } from '$lib/schemas/transaction';

const MAX_EXPORT_ROWS = 5000;

export async function exportTransactionsHandler(
	user: App.User,
	businessId: string,
	filters: TransactionFilters,
	currency: string,
	env: Cloudflare.Env
): Promise<string> {
	await requireBusinessPermission(user, businessId, 'transaction:export', env);

	const db = drizzle(env.DB, { schema });

	const conditions = [eq(transactions.businessId, businessId), isNull(transactions.deletedAt)];

	if (filters.locationId) conditions.push(eq(transactions.locationId, filters.locationId));
	if (filters.salesChannelId) conditions.push(eq(transactions.salesChannelId, filters.salesChannelId));
	if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
	if (filters.type) conditions.push(eq(transactions.type, filters.type));
	if (filters.from) conditions.push(gte(transactions.transactionDate, filters.from));
	if (filters.to) conditions.push(lte(transactions.transactionDate, filters.to));

	const rows = await db
		.select()
		.from(transactions)
		.where(and(...conditions))
		.orderBy(transactions.transactionDate)
		.limit(MAX_EXPORT_ROWS);

	if (rows.length === 0) {
		return buildCsv(
			['Date', 'Type', 'Amount', 'Currency', 'Note', 'Reference No', 'Invoice No', 'Receipt No', 'Contact', 'Category', 'Location', 'Sales Channel'],
			[]
		);
	}

	// Batch-resolve related names
	const contactIds = [...new Set(rows.map((t) => t.contactId).filter(Boolean) as string[])];
	const categoryIds = [...new Set(rows.map((t) => t.categoryId).filter(Boolean) as string[])];
	const locationIds = [...new Set(rows.map((t) => t.locationId).filter(Boolean) as string[])];
	const channelIds = [...new Set(rows.map((t) => t.salesChannelId).filter(Boolean) as string[])];

	const [contactMap, categoryMap, locationMap, channelMap] = await Promise.all([
		resolveNames(db, contacts, contactIds),
		resolveNames(db, categories, categoryIds),
		resolveNames(db, locations, locationIds),
		resolveNames(db, salesChannels, channelIds),
	]);

	const headers = [
		'Date', 'Type', 'Amount', 'Currency', 'Note',
		'Reference No', 'Invoice No', 'Receipt No',
		'Contact', 'Category', 'Location', 'Sales Channel',
	];

	const csvRows = rows.map((t) => [
		t.transactionDate,
		t.type,
		(t.amount / 100).toFixed(2),
		currency,
		t.note ?? '',
		t.referenceNo ?? '',
		t.invoiceNo ?? '',
		t.receiptNo ?? '',
		t.contactId ? (contactMap.get(t.contactId) ?? '') : '',
		t.categoryId ? (categoryMap.get(t.categoryId) ?? '') : '',
		t.locationId ? (locationMap.get(t.locationId) ?? '') : '',
		t.salesChannelId ? (channelMap.get(t.salesChannelId) ?? '') : '',
	]);

	return buildCsv(headers, csvRows);
}

async function resolveNames(
	db: ReturnType<typeof drizzle>,
	table: { id: any; name: any },
	ids: string[]
): Promise<Map<string, string>> {
	const map = new Map<string, string>();
	if (ids.length === 0) return map;
	const rows = await db
		.select({ id: table.id, name: table.name })
		.from(table as any)
		.where(inArray(table.id, ids));
	for (const row of rows) map.set(row.id, row.name);
	return map;
}
