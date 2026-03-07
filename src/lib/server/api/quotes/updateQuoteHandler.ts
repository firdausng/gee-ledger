import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { quotes } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { UpdateQuoteInput } from '$lib/schemas/quote';

export async function updateQuoteHandler(
	user: App.User,
	businessId: string,
	quoteId: string,
	data: UpdateQuoteInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'quote:edit', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [updated] = await db
		.update(quotes)
		.set({
			...(data.locationId !== undefined && { locationId: data.locationId }),
			...(data.salesChannelId !== undefined && { salesChannelId: data.salesChannelId }),
			...(data.categoryId !== undefined && { categoryId: data.categoryId }),
			...(data.contactId !== undefined && { contactId: data.contactId }),
			...(data.lineItemMode !== undefined && { lineItemMode: data.lineItemMode }),
			...(data.amount !== undefined && { amount: data.amount }),
			...(data.note !== undefined && { note: data.note }),
			...(data.referenceNo !== undefined && { referenceNo: data.referenceNo }),
			...(data.quoteDate !== undefined && { quoteDate: data.quoteDate }),
			...(data.expiryDate !== undefined && { expiryDate: data.expiryDate }),
			...(data.dueDate !== undefined && { dueDate: data.dueDate }),
			...(data.status !== undefined && { status: data.status }),
			...(data.featuredImageId !== undefined && { featuredImageId: data.featuredImageId }),
			...(data.quoteNo !== undefined && { quoteNo: data.quoteNo }),
			updatedAt: now,
			updatedBy: user.id
		})
		.where(
			and(
				eq(quotes.id, quoteId),
				eq(quotes.businessId, businessId),
				isNull(quotes.deletedAt)
			)
		)
		.returning();

	if (!updated) throw new HTTPException(404, { message: 'Quote not found' });

	return updated;
}
