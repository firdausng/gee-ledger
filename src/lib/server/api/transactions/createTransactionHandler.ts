import { drizzle } from 'drizzle-orm/d1';
import { transactions, transactionAttachments, attachments, userBusinessRoles, businesses } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { CreateTransactionInput } from '$lib/schemas/transaction';
import { eq, and, ne, isNull, inArray } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { dispatchNotification } from '$lib/server/push/dispatcher';
import { NOTIFICATION_TYPE } from '$lib/configurations/notifications';
import { computeBaseAmount, SAME_CURRENCY_RATE } from '$lib/server/utils/currency';

export async function createTransactionHandler(
	user: App.User,
	businessId: string,
	data: CreateTransactionInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:create', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	// Validate attachment IDs belong to this business and are not deleted
	const attachmentIds = data.attachmentIds ?? [];
	if (attachmentIds.length > 0) {
		const found = await db
			.select({ id: attachments.id })
			.from(attachments)
			.where(
				and(
					inArray(attachments.id, attachmentIds),
					eq(attachments.businessId, businessId),
					isNull(attachments.deletedAt)
				)
			);

		if (found.length !== attachmentIds.length) {
			throw new HTTPException(400, { message: 'One or more attachment IDs are invalid.' });
		}
	}

	// Resolve business base currency to determine if same-currency
	const [biz] = await db
		.select({ currency: businesses.currency })
		.from(businesses)
		.where(eq(businesses.id, businessId))
		.limit(1);
	const baseCurrency = biz?.currency ?? 'USD';
	const isSameCurrency = data.originalCurrency === baseCurrency;
	const effectiveRate = isSameCurrency ? SAME_CURRENCY_RATE : (data.exchangeRate ?? null);
	const baseAmount = computeBaseAmount(data.amount, effectiveRate);

	const [transaction] = await db
		.insert(transactions)
		.values({
			id: crypto.randomUUID(),
			businessId,
			locationId: data.locationId,
			salesChannelId: data.salesChannelId ?? null,
			categoryId: data.categoryId ?? null,
			contactId: data.contactId ?? null,
			type: data.type,
			lineItemMode: data.lineItemMode ?? 'items',
			originalAmount: data.amount,
			originalCurrency: data.originalCurrency,
			exchangeRate: effectiveRate,
			amount: baseAmount,
			note: data.note ?? null,
			referenceNo: data.referenceNo ?? null,
			transactionDate: data.transactionDate,
			dueDate: data.dueDate ?? null,
			createdAt: now,
			createdBy: user.id,
			updatedAt: now,
			updatedBy: user.id
		})
		.returning();

	if (attachmentIds.length > 0) {
		await db.insert(transactionAttachments).values(
			attachmentIds.map((attachmentId) => ({ transactionId: transaction.id, attachmentId }))
		);
	}

	// Notify other business members (fire-and-forget)
	const otherMembers = await db
		.select({ userId: userBusinessRoles.userId })
		.from(userBusinessRoles)
		.where(
			and(
				eq(userBusinessRoles.businessId, businessId),
				ne(userBusinessRoles.userId, user.id)
			)
		);

	if (otherMembers.length > 0) {
		const amountStr = `${data.originalCurrency} ${(Math.abs(data.amount) / 100).toFixed(2)}`;
		await dispatchNotification({
			recipientUserIds: otherMembers.map((m) => m.userId),
			type: NOTIFICATION_TYPE.TRANSACTION_CREATED,
			title: `New ${data.type}`,
			body: `${user.displayName ?? 'Someone'} recorded a ${data.type} of ${amountStr}`,
			actionUrl: `/businesses/${businessId}/transactions/${transaction.id}`,
			env,
		}).catch((err) => console.error('Failed to dispatch notification:', err));
	}

	return transaction;
}
