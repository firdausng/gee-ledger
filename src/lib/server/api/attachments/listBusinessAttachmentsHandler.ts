import { drizzle } from 'drizzle-orm/d1';
import { attachments, transactionAttachments, transactions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { eq, and, isNull, desc } from 'drizzle-orm';

export async function listBusinessAttachmentsHandler(
	user: App.User,
	businessId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'attachment:view', env);

	const db = drizzle(env.DB, { schema });

	const rows = await db
		.select({
			id: attachments.id,
			fileName: attachments.fileName,
			mimeType: attachments.mimeType,
			fileSize: attachments.fileSize,
			createdAt: attachments.createdAt,
			createdBy: attachments.createdBy,
			transactionId: transactionAttachments.transactionId,
			transactionDate: transactions.transactionDate,
			transactionType: transactions.type,
			transactionAmount: transactions.amount,
			transactionNote: transactions.note
		})
		.from(attachments)
		.leftJoin(transactionAttachments, eq(transactionAttachments.attachmentId, attachments.id))
		.leftJoin(transactions, eq(transactions.id, transactionAttachments.transactionId))
		.where(and(eq(attachments.businessId, businessId), isNull(attachments.deletedAt)))
		.orderBy(desc(attachments.createdAt));

	return rows;
}
