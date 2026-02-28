import { drizzle } from 'drizzle-orm/d1';
import { attachments, transactionAttachments, productAttachments } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import { eq, and, isNull } from 'drizzle-orm';

export async function deleteAttachmentHandler(
	user: App.User,
	businessId: string,
	attachmentId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'attachment:delete', env);

	const db = drizzle(env.DB, { schema });

	const [attachment] = await db
		.select()
		.from(attachments)
		.where(
			and(
				eq(attachments.id, attachmentId),
				eq(attachments.businessId, businessId),
				isNull(attachments.deletedAt)
			)
		)
		.limit(1);

	if (!attachment) {
		throw new HTTPException(404, { message: 'Attachment not found.' });
	}

	const now = new Date().toISOString();

	// Soft-delete the attachment record
	await db
		.update(attachments)
		.set({ deletedAt: now, deletedBy: user.id })
		.where(eq(attachments.id, attachmentId));

	// Remove junction rows
	await db
		.delete(transactionAttachments)
		.where(eq(transactionAttachments.attachmentId, attachmentId));
	await db
		.delete(productAttachments)
		.where(eq(productAttachments.attachmentId, attachmentId));

	// Hard-delete from R2
	await env.BUCKET.delete(attachment.r2Key);

	return { success: true };
}
