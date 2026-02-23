import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { transactions, businesses, locations, categories, salesChannels, transactionItems } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import { sendTransactionEmail } from '$lib/server/email/sendTransactionEmail';

type BillTo = { name?: string | null; address?: string | null; email?: string | null };

export async function shareTransactionHandler(
	user: App.User,
	businessId: string,
	transactionId: string,
	recipientEmail: string,
	env: Cloudflare.Env,
	billTo: BillTo | null = null,
	invoiceNoOverride: string | null = null,
	documentTypeOverride: 'invoice' | 'receipt' | null = null,
	receiptNoOverride: string | null = null
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });

	const [tx] = await db
		.select()
		.from(transactions)
		.where(and(eq(transactions.id, transactionId), eq(transactions.businessId, businessId), isNull(transactions.deletedAt)))
		.limit(1);

	if (!tx) throw new HTTPException(404, { message: 'Transaction not found' });

	const [biz] = await db
		.select()
		.from(businesses)
		.where(and(eq(businesses.id, businessId), isNull(businesses.deletedAt)))
		.limit(1);

	if (!biz) throw new HTTPException(404, { message: 'Business not found' });

	const [loc] = tx.locationId
		? await db.select().from(locations).where(eq(locations.id, tx.locationId)).limit(1)
		: [null];

	const [cat] = tx.categoryId
		? await db.select().from(categories).where(eq(categories.id, tx.categoryId)).limit(1)
		: [null];

	const [chan] = tx.salesChannelId
		? await db.select().from(salesChannels).where(eq(salesChannels.id, tx.salesChannelId)).limit(1)
		: [null];

	const items = await db
		.select()
		.from(transactionItems)
		.where(eq(transactionItems.transactionId, transactionId))
		.orderBy(asc(transactionItems.sortOrder));

	if (!env.RESEND_API_KEY) throw new HTTPException(503, { message: 'Email service not configured.' });

	await sendTransactionEmail({
		to:          recipientEmail,
		business:    biz,
		transaction: {
			...tx,
			invoiceNo:    invoiceNoOverride !== null ? invoiceNoOverride : (tx.invoiceNo ?? null),
			receiptNo:    receiptNoOverride !== null ? receiptNoOverride : (tx.receiptNo ?? null),
			documentType: documentTypeOverride ?? (tx.documentType as 'invoice' | 'receipt' | null) ?? null,
		},
		location:    loc ?? null,
		category:    cat ?? null,
		channel:     chan ?? null,
		billTo:      billTo,
		resendApiKey: env.RESEND_API_KEY,
		fromDomain:   env.FROM_DOMAIN ?? 'ledger.nurzerani.com',
		items,
	});

	return { sent: true };
}
