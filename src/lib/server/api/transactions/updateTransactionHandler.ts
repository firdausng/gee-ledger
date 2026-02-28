import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { transactions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { UpdateTransactionInput } from '$lib/schemas/transaction';

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

	const [updated] = await db
		.update(transactions)
		.set({
			...(data.locationId !== undefined && { locationId: data.locationId }),
			...(data.salesChannelId !== undefined && { salesChannelId: data.salesChannelId }),
			...(data.categoryId !== undefined && { categoryId: data.categoryId }),
			...(data.contactId  !== undefined && { contactId:  data.contactId  }),
			...(data.type !== undefined && { type: data.type }),
			...(data.lineItemMode !== undefined && { lineItemMode: data.lineItemMode }),
			...(data.amount !== undefined && { amount: data.amount }),
			...(data.note !== undefined && { note: data.note }),
			...(data.referenceNo !== undefined && { referenceNo: data.referenceNo }),
			...(data.transactionDate !== undefined && { transactionDate: data.transactionDate }),
			...(data.featuredImageId !== undefined && { featuredImageId: data.featuredImageId }),
			...(data.invoiceNo !== undefined && { invoiceNo: data.invoiceNo }),
			...(data.receiptNo !== undefined && { receiptNo: data.receiptNo }),
			...(data.documentType !== undefined && { documentType: data.documentType }),
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
