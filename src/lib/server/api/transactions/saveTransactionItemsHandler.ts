import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { transactionItems, transactions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { TransactionItem } from '$lib/schemas/transaction';

export async function saveTransactionItemsHandler(
	user: App.User,
	businessId: string,
	transactionId: string,
	items: TransactionItem[],
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	// Verify transaction exists and belongs to business
	const [tx] = await db
		.select()
		.from(transactions)
		.where(
			and(
				eq(transactions.id, transactionId),
				eq(transactions.businessId, businessId),
				isNull(transactions.deletedAt)
			)
		)
		.limit(1);

	if (!tx) throw new HTTPException(404, { message: 'Transaction not found' });

	// Delete all existing items
	await db.delete(transactionItems).where(eq(transactionItems.transactionId, transactionId));

	// Insert new items
	let savedItems: typeof transactionItems.$inferSelect[] = [];
	if (items.length > 0) {
		savedItems = await db
			.insert(transactionItems)
			.values(
				items.map((item, idx) => ({
					id:            crypto.randomUUID(),
					transactionId,
					description:   item.description,
					quantity:      item.quantity,
					unitPrice:     item.unitPrice,
					sortOrder:     item.sortOrder ?? idx,
				}))
			)
			.returning();
	}

	// Calculate total
	const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

	// Update transaction amount
	await db
		.update(transactions)
		.set({ amount: total > 0 ? total : tx.amount, updatedAt: now, updatedBy: user.id })
		.where(eq(transactions.id, transactionId));

	return { items: savedItems, total: total > 0 ? total : tx.amount };
}
