import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, inArray } from 'drizzle-orm';
import { quoteConversions, transactions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';

export async function getQuoteConversionsHandler(
	user: App.User,
	businessId: string,
	quoteId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'quote:view', env);

	const db = drizzle(env.DB, { schema });

	const conversions = await db
		.select()
		.from(quoteConversions)
		.where(eq(quoteConversions.quoteId, quoteId))
		.orderBy(desc(quoteConversions.createdAt));

	if (conversions.length === 0) return [];

	const txIds = conversions.map((c) => c.transactionId);
	const txRows = await db
		.select({
			id: transactions.id,
			amount: transactions.amount,
			transactionDate: transactions.transactionDate,
			invoiceNo: transactions.invoiceNo,
			note: transactions.note,
		})
		.from(transactions)
		.where(inArray(transactions.id, txIds));

	const txMap = new Map(txRows.map((t) => [t.id, t]));

	return conversions.map((c) => ({
		id: c.id,
		transactionId: c.transactionId,
		note: c.note,
		createdAt: c.createdAt,
		transaction: txMap.get(c.transactionId) ?? null,
	}));
}
