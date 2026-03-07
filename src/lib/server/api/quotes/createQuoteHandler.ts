import { drizzle } from 'drizzle-orm/d1';
import * as schema from '$lib/server/db/schema';
import { quotes } from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { CreateQuoteInput } from '$lib/schemas/quote';

export async function createQuoteHandler(
	user: App.User,
	businessId: string,
	data: CreateQuoteInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'quote:create', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [quote] = await db
		.insert(quotes)
		.values({
			id: crypto.randomUUID(),
			businessId,
			locationId: data.locationId,
			salesChannelId: data.salesChannelId ?? null,
			categoryId: data.categoryId ?? null,
			contactId: data.contactId ?? null,
			lineItemMode: data.lineItemMode ?? 'items',
			amount: data.amount,
			note: data.note ?? null,
			referenceNo: data.referenceNo ?? null,
			quoteDate: data.quoteDate,
			expiryDate: data.expiryDate ?? null,
			dueDate: data.dueDate ?? null,
			status: 'draft',
			createdAt: now,
			createdBy: user.id,
			updatedAt: now,
			updatedBy: user.id
		})
		.returning();

	return quote;
}
