import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { quotes, businesses } from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { CreateQuoteInput } from '$lib/schemas/quote';
import { computeBaseAmount, SAME_CURRENCY_RATE } from '$lib/server/utils/currency';

export async function createQuoteHandler(
	user: App.User,
	businessId: string,
	data: CreateQuoteInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'quote:create', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	// Resolve business base currency
	const [biz] = await db
		.select({ currency: businesses.currency })
		.from(businesses)
		.where(eq(businesses.id, businessId))
		.limit(1);
	const baseCurrency = biz?.currency ?? 'USD';
	const isSameCurrency = data.originalCurrency === baseCurrency;
	const effectiveRate = isSameCurrency ? SAME_CURRENCY_RATE : (data.exchangeRate ?? null);
	const baseAmount = computeBaseAmount(data.amount, effectiveRate);

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
			originalAmount: data.amount,
			originalCurrency: data.originalCurrency,
			exchangeRate: effectiveRate,
			amount: baseAmount,
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
