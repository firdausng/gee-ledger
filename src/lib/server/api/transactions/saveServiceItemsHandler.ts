import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { transactionServiceItems, transactionServiceItemAttachments, transactions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { ServiceItem } from '$lib/schemas/transaction';

export async function saveServiceItemsHandler(
	user: App.User,
	businessId: string,
	transactionId: string,
	items: ServiceItem[],
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

	// Get old service item IDs
	const oldItems = await db
		.select({ id: transactionServiceItems.id })
		.from(transactionServiceItems)
		.where(eq(transactionServiceItems.transactionId, transactionId));
	const oldIds = oldItems.map((i) => i.id);

	// Delete old junction records
	if (oldIds.length > 0) {
		await db.delete(transactionServiceItemAttachments)
			.where(inArray(transactionServiceItemAttachments.serviceItemId, oldIds));
	}

	// Delete old service items
	await db
		.delete(transactionServiceItems)
		.where(eq(transactionServiceItems.transactionId, transactionId));

	// Insert new service items
	let savedItems: typeof transactionServiceItems.$inferSelect[] = [];
	if (items.length > 0) {
		savedItems = await db
			.insert(transactionServiceItems)
			.values(
				items.map((item, idx) => ({
					id:            crypto.randomUUID(),
					transactionId,
					description:   item.description,
					hours:         item.hours,
					rate:          item.rate,
					sortOrder:     item.sortOrder ?? idx,
				}))
			)
			.returning();
	}

	// Insert junction records
	const junctionRows = savedItems.flatMap((newItem, idx) =>
		(items[idx].attachmentIds ?? []).map((attachmentId) => ({
			serviceItemId: newItem.id,
			attachmentId,
		}))
	);
	if (junctionRows.length > 0) {
		await db.insert(transactionServiceItemAttachments).values(junctionRows);
	}

	// Total = sum of round(hours × rate) per line
	const total = items.reduce((s, i) => s + Math.round(i.hours * i.rate), 0);

	// Update transaction amount
	await db
		.update(transactions)
		.set({ amount: total > 0 ? total : tx.amount, updatedAt: now, updatedBy: user.id })
		.where(eq(transactions.id, transactionId));

	return { items: savedItems, total: total > 0 ? total : tx.amount };
}
