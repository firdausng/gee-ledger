import { drizzle } from 'drizzle-orm/d1';
import { attachments } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { validateFile } from './attachmentUtils';

export async function uploadOrphanAttachmentHandler(
	user: App.User,
	businessId: string,
	file: File,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'attachment:upload', env);
	validateFile(file);

	const db = drizzle(env.DB, { schema });
	const attachmentId = crypto.randomUUID();
	const r2Key = `${businessId}/${attachmentId}/${file.name}`;
	const now = new Date().toISOString();

	await env.BUCKET.put(r2Key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type }
	});

	const [attachment] = await db
		.insert(attachments)
		.values({
			id: attachmentId,
			businessId,
			fileName: file.name,
			mimeType: file.type,
			fileSize: file.size,
			r2Key,
			createdAt: now,
			createdBy: user.id
		})
		.returning();

	return attachment;
}
