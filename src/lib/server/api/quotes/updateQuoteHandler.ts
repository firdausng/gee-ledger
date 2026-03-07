import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { quotes, businesses } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { UpdateQuoteInput } from '$lib/schemas/quote';
import { computeBaseAmount, SAME_CURRENCY_RATE } from '$lib/server/utils/currency';

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

	// If amount or currency or exchangeRate changed, recompute base amount
	let currencyFields: Record<string, unknown> = {};
	if (data.amount !== undefined || data.originalCurrency !== undefined || data.exchangeRate !== undefined) {
		const [[existing], [biz]] = await Promise.all([
			db.select().from(quotes)
				.where(and(eq(quotes.id, quoteId), eq(quotes.businessId, businessId), isNull(quotes.deletedAt)))
				.limit(1),
			db.select({ currency: businesses.currency }).from(businesses).where(eq(businesses.id, businessId)).limit(1),
		]);
		if (!existing) throw new HTTPException(404, { message: 'Quote not found' });

		const baseCurrency = biz?.currency ?? 'USD';
		const newAmount = data.amount ?? existing.originalAmount;
		const newCurrency = data.originalCurrency ?? existing.originalCurrency;
		const isSameCurrency = newCurrency === baseCurrency;
		const newRate = isSameCurrency ? SAME_CURRENCY_RATE : (data.exchangeRate !== undefined ? data.exchangeRate : existing.exchangeRate);
		const baseAmount = computeBaseAmount(newAmount, newRate);

		currencyFields = {
			originalAmount: newAmount,
			originalCurrency: newCurrency,
			exchangeRate: newRate,
			amount: baseAmount,
		};
	}

	const [updated] = await db
		.update(quotes)
		.set({
			...(data.locationId !== undefined && { locationId: data.locationId }),
			...(data.salesChannelId !== undefined && { salesChannelId: data.salesChannelId }),
			...(data.categoryId !== undefined && { categoryId: data.categoryId }),
			...(data.contactId !== undefined && { contactId: data.contactId }),
			...(data.lineItemMode !== undefined && { lineItemMode: data.lineItemMode }),
			...(data.note !== undefined && { note: data.note }),
			...(data.referenceNo !== undefined && { referenceNo: data.referenceNo }),
			...(data.quoteDate !== undefined && { quoteDate: data.quoteDate }),
			...(data.expiryDate !== undefined && { expiryDate: data.expiryDate }),
			...(data.dueDate !== undefined && { dueDate: data.dueDate }),
			...(data.status !== undefined && { status: data.status }),
			...(data.featuredImageId !== undefined && { featuredImageId: data.featuredImageId }),
			...(data.quoteNo !== undefined && { quoteNo: data.quoteNo }),
			...currencyFields,
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
