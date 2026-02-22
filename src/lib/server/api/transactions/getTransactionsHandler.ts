import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, gte, lte, gt } from 'drizzle-orm';
import { transactions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { TransactionFilters } from '$lib/schemas/transaction';

export async function getTransactionsHandler(
	user: App.User,
	businessId: string,
	filters: TransactionFilters,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });
	const limit = filters.limit ?? 50;

	const conditions = [eq(transactions.businessId, businessId), isNull(transactions.deletedAt)];

	if (filters.locationId) conditions.push(eq(transactions.locationId, filters.locationId));
	if (filters.salesChannelId) conditions.push(eq(transactions.salesChannelId, filters.salesChannelId));
	if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
	if (filters.type) conditions.push(eq(transactions.type, filters.type));
	if (filters.from) conditions.push(gte(transactions.transactionDate, filters.from));
	if (filters.to) conditions.push(lte(transactions.transactionDate, filters.to));
	if (filters.cursor) conditions.push(gt(transactions.transactionDate, filters.cursor));

	const rows = await db
		.select()
		.from(transactions)
		.where(and(...conditions))
		.orderBy(transactions.transactionDate)
		.limit(limit + 1);

	const hasMore = rows.length > limit;
	const data = hasMore ? rows.slice(0, limit) : rows;
	const nextCursor = hasMore ? data[data.length - 1].transactionDate : null;

	return { data, nextCursor, hasMore };
}
