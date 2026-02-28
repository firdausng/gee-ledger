import { drizzle } from 'drizzle-orm/d1';
import { transactions, transactionAttachments, attachments } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { CreateTransactionInput } from '$lib/schemas/transaction';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

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
			amount: data.amount,
			note: data.note ?? null,
			referenceNo: data.referenceNo ?? null,
			transactionDate: data.transactionDate,
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

	return transaction;
}
