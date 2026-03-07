import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, sum } from 'drizzle-orm';
import {
	quotes, transactions, quoteConversions,
	quoteItems, transactionItems,
	quoteServiceItems, transactionServiceItems,
	quoteItemAttachments, transactionItemAttachments,
	quoteServiceItemAttachments, transactionServiceItemAttachments
} from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function convertQuoteHandler(
	user: App.User,
	businessId: string,
	quoteId: string,
	data: { note?: string; amount?: number } | undefined,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'quote:edit', env);
	await requireBusinessPermission(user, businessId, 'transaction:create', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	// Fetch quote
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

	// Calculate already-converted total
	const [convertedResult] = await db
		.select({ total: sum(transactions.amount) })
		.from(quoteConversions)
		.innerJoin(transactions, eq(quoteConversions.transactionId, transactions.id))
		.where(eq(quoteConversions.quoteId, quoteId));
	const convertedTotal = Number(convertedResult?.total ?? 0);
	const remaining = quote.amount - convertedTotal;

	const convertAmount = data?.amount ?? remaining;

	if (convertAmount <= 0) {
		throw new HTTPException(400, { message: 'This quote has already been fully converted' });
	}
	if (convertAmount > remaining) {
		throw new HTTPException(400, { message: `Amount exceeds remaining balance. Remaining: ${remaining}` });
	}

	// Create transaction from quote
	const transactionId = crypto.randomUUID();
	await db.insert(transactions).values({
		id: transactionId,
		businessId,
		locationId: quote.locationId,
		salesChannelId: quote.salesChannelId,
		categoryId: quote.categoryId,
		contactId: quote.contactId,
		type: 'income',
		amount: convertAmount,
		note: [quote.note, data?.note].filter(Boolean).join(' - ') || null,
		referenceNo: quote.referenceNo,
		featuredImageId: quote.featuredImageId,
		lineItemMode: quote.lineItemMode,
		transactionDate: quote.quoteDate,
		dueDate: quote.dueDate,
		createdAt: now,
		createdBy: user.id,
		updatedAt: now,
		updatedBy: user.id
	});

	// Copy line items
	const oldLineItems = await db
		.select()
		.from(quoteItems)
		.where(eq(quoteItems.quoteId, quoteId));

	if (oldLineItems.length > 0) {
		const newLineItems = await db
			.insert(transactionItems)
			.values(
				oldLineItems.map((item) => ({
					id: crypto.randomUUID(),
					transactionId,
					productId: item.productId,
					description: item.description,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					sortOrder: item.sortOrder,
				}))
			)
			.returning();

		// Copy item attachments
		for (let i = 0; i < oldLineItems.length; i++) {
			const oldAttachments = await db
				.select()
				.from(quoteItemAttachments)
				.where(eq(quoteItemAttachments.itemId, oldLineItems[i].id));

			if (oldAttachments.length > 0) {
				await db.insert(transactionItemAttachments).values(
					oldAttachments.map((a) => ({
						itemId: newLineItems[i].id,
						attachmentId: a.attachmentId,
					}))
				);
			}
		}
	}

	// Copy service items
	const oldServiceItems = await db
		.select()
		.from(quoteServiceItems)
		.where(eq(quoteServiceItems.quoteId, quoteId));

	if (oldServiceItems.length > 0) {
		const newServiceItems = await db
			.insert(transactionServiceItems)
			.values(
				oldServiceItems.map((item) => ({
					id: crypto.randomUUID(),
					transactionId,
					description: item.description,
					hours: item.hours,
					rate: item.rate,
					sortOrder: item.sortOrder,
				}))
			)
			.returning();

		// Copy service item attachments
		for (let i = 0; i < oldServiceItems.length; i++) {
			const oldAttachments = await db
				.select()
				.from(quoteServiceItemAttachments)
				.where(eq(quoteServiceItemAttachments.serviceItemId, oldServiceItems[i].id));

			if (oldAttachments.length > 0) {
				await db.insert(transactionServiceItemAttachments).values(
					oldAttachments.map((a) => ({
						serviceItemId: newServiceItems[i].id,
						attachmentId: a.attachmentId,
					}))
				);
			}
		}
	}

	// Record conversion in junction table
	await db.insert(quoteConversions).values({
		id: crypto.randomUUID(),
		quoteId,
		transactionId,
		note: data?.note ?? null,
		createdAt: now,
		createdBy: user.id,
	});

	// Mark quote as accepted (if not already)
	if (quote.status !== 'accepted') {
		await db
			.update(quotes)
			.set({
				status: 'accepted',
				updatedAt: now,
				updatedBy: user.id
			})
			.where(eq(quotes.id, quoteId));
	}

	return { transactionId };
}
