import { drizzle } from 'drizzle-orm/d1';
import { attachments, transactionAttachments } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { eq, and, isNull } from 'drizzle-orm';

export async function listAttachmentsHandler(
	user: App.User,
	businessId: string,
	transactionId: string,
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
			createdBy: attachments.createdBy
		})
		.from(transactionAttachments)
		.innerJoin(attachments, eq(attachments.id, transactionAttachments.attachmentId))
		.where(
			and(
				eq(transactionAttachments.transactionId, transactionId),
				eq(attachments.businessId, businessId),
				isNull(attachments.deletedAt)
			)
		)
		.orderBy(attachments.createdAt);

	return rows;
}
