import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { quoteItems, quoteItemAttachments, quotes } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { TransactionItem } from '$lib/schemas/transaction';

export async function saveQuoteItemsHandler(
	user: App.User,
	businessId: string,
	quoteId: string,
	items: TransactionItem[],
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'quote:edit', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	// Verify quote exists and belongs to business
	const [quote] = await db
		.select()
		.from(quotes)
		.where(
			and(
				eq(quotes.id, quoteId),
				eq(quotes.businessId, businessId),
				isNull(quotes.deletedAt)
			)
		)
		.limit(1);

	if (!quote) throw new HTTPException(404, { message: 'Quote not found' });

	// Get old item IDs
	const oldItems = await db
		.select({ id: quoteItems.id })
		.from(quoteItems)
		.where(eq(quoteItems.quoteId, quoteId));
	const oldIds = oldItems.map((i) => i.id);

	// Delete old junction records
	if (oldIds.length > 0) {
		await db.delete(quoteItemAttachments)
			.where(inArray(quoteItemAttachments.itemId, oldIds));
	}

	// Delete old items
	await db.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));

	// Insert new items
	let savedItems: typeof quoteItems.$inferSelect[] = [];
	if (items.length > 0) {
		savedItems = await db
			.insert(quoteItems)
			.values(
				items.map((item, idx) => ({
					id:          crypto.randomUUID(),
					quoteId,
					productId:   item.productId,
					description: item.description,
					quantity:    item.quantity,
					unitPrice:   item.unitPrice,
					sortOrder:   item.sortOrder ?? idx,
				}))
			)
			.returning();
	}

	// Insert junction records
	const junctionRows = savedItems.flatMap((newItem, idx) =>
		(items[idx].attachmentIds ?? []).map((attachmentId) => ({
			itemId: newItem.id,
			attachmentId,
		}))
	);
	if (junctionRows.length > 0) {
		await db.insert(quoteItemAttachments).values(junctionRows);
	}

	// Calculate total
	const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

	// Update quote amount
	await db
		.update(quotes)
		.set({ amount: total > 0 ? total : quote.amount, updatedAt: now, updatedBy: user.id })
		.where(eq(quotes.id, quoteId));

	return { items: savedItems, total: total > 0 ? total : quote.amount };
}
