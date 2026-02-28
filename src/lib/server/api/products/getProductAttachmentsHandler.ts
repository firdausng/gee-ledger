import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { productAttachments, attachments } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';

export async function getProductAttachmentsHandler(
	user: App.User,
	businessId: string,
	productId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

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
		.from(productAttachments)
		.innerJoin(attachments, eq(attachments.id, productAttachments.attachmentId))
		.where(
			and(
				eq(productAttachments.productId, productId),
				eq(attachments.businessId, businessId),
				isNull(attachments.deletedAt)
			)
		)
		.orderBy(attachments.createdAt);

	return rows;
}
