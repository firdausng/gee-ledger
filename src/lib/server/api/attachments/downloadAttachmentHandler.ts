import { drizzle } from 'drizzle-orm/d1';
import { attachments } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import { eq, and, isNull } from 'drizzle-orm';

export async function downloadAttachmentHandler(
	user: App.User,
	businessId: string,
	attachmentId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'attachment:view', env);

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

	const object = await env.BUCKET.get(attachment.r2Key);

	if (!object) {
		throw new HTTPException(404, { message: 'File not found in storage.' });
	}

	return { object, attachment };
}
