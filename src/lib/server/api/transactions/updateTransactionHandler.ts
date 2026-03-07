import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { transactions, businesses } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { UpdateTransactionInput } from '$lib/schemas/transaction';
import { computeBaseAmount, SAME_CURRENCY_RATE } from '$lib/server/utils/currency';

export async function updateTransactionHandler(
	user: App.User,
	businessId: string,
	transactionId: string,
	data: UpdateTransactionInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:edit', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	// If amount or currency or exchangeRate changed, recompute base amount
	let currencyFields: Record<string, unknown> = {};
	if (data.amount !== undefined || data.originalCurrency !== undefined || data.exchangeRate !== undefined) {
		// Fetch current transaction + business base currency
		const [[existing], [biz]] = await Promise.all([
			db.select().from(transactions)
				.where(and(eq(transactions.id, transactionId), eq(transactions.businessId, businessId), isNull(transactions.deletedAt)))
				.limit(1),
			db.select({ currency: businesses.currency }).from(businesses).where(eq(businesses.id, businessId)).limit(1),
		]);
		if (!existing) throw new HTTPException(404, { message: 'Transaction not found' });

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
		.update(transactions)
		.set({
			...(data.locationId !== undefined && { locationId: data.locationId }),
			...(data.salesChannelId !== undefined && { salesChannelId: data.salesChannelId }),
			...(data.categoryId !== undefined && { categoryId: data.categoryId }),
			...(data.contactId  !== undefined && { contactId:  data.contactId  }),
			...(data.type !== undefined && { type: data.type }),
			...(data.lineItemMode !== undefined && { lineItemMode: data.lineItemMode }),
			...(data.note !== undefined && { note: data.note }),
			...(data.referenceNo !== undefined && { referenceNo: data.referenceNo }),
			...(data.transactionDate !== undefined && { transactionDate: data.transactionDate }),
			...(data.dueDate !== undefined && { dueDate: data.dueDate }),
			...(data.featuredImageId !== undefined && { featuredImageId: data.featuredImageId }),
			...(data.invoiceNo !== undefined && { invoiceNo: data.invoiceNo }),
			...(data.receiptNo !== undefined && { receiptNo: data.receiptNo }),
			...(data.documentType !== undefined && { documentType: data.documentType }),
			...currencyFields,
			updatedAt: now,
			updatedBy: user.id
		})
		.where(
			and(
				eq(transactions.id, transactionId),
				eq(transactions.businessId, businessId),
				isNull(transactions.deletedAt)
			)
		)
		.returning();

	if (!updated) throw new HTTPException(404, { message: 'Transaction not found' });

	return updated;
}
