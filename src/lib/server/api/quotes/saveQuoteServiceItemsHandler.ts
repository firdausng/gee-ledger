import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { quoteServiceItems, quoteServiceItemAttachments, quotes } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { ServiceItem } from '$lib/schemas/transaction';

export async function saveQuoteServiceItemsHandler(
	user: App.User,
	businessId: string,
	quoteId: string,
	items: ServiceItem[],
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

	// Get old service item IDs
	const oldItems = await db
		.select({ id: quoteServiceItems.id })
		.from(quoteServiceItems)
		.where(eq(quoteServiceItems.quoteId, quoteId));
	const oldIds = oldItems.map((i) => i.id);

	// Delete old junction records
	if (oldIds.length > 0) {
		await db.delete(quoteServiceItemAttachments)
			.where(inArray(quoteServiceItemAttachments.serviceItemId, oldIds));
	}

	// Delete old service items
	await db
		.delete(quoteServiceItems)
		.where(eq(quoteServiceItems.quoteId, quoteId));

	// Insert new service items
	let savedItems: typeof quoteServiceItems.$inferSelect[] = [];
	if (items.length > 0) {
		savedItems = await db
			.insert(quoteServiceItems)
			.values(
				items.map((item, idx) => ({
					id:          crypto.randomUUID(),
					quoteId,
					description: item.description,
					hours:       item.hours,
					rate:        item.rate,
					sortOrder:   item.sortOrder ?? idx,
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
		await db.insert(quoteServiceItemAttachments).values(junctionRows);
	}

	// Total = sum of round(hours * rate) per line
	const total = items.reduce((s, i) => s + Math.round(i.hours * i.rate), 0);

	// Update quote amount
	await db
		.update(quotes)
		.set({ amount: total > 0 ? total : quote.amount, updatedAt: now, updatedBy: user.id })
		.where(eq(quotes.id, quoteId));

	return { items: savedItems, total: total > 0 ? total : quote.amount };
}
