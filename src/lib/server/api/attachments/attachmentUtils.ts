import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { attachments, transactionAttachments } from '$lib/server/db/schema';
import type * as schema from '$lib/server/db/schema';
import { HTTPException } from 'hono/http-exception';

export const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_ATTACHMENTS_PER_TRANSACTION = 10;

export function validateFile(file: File) {
	if (!ALLOWED_MIME_TYPES.has(file.type)) {
		throw new HTTPException(400, { message: 'File type not allowed. Use JPEG, PNG, or PDF.' });
	}
	if (file.size > MAX_FILE_SIZE) {
		throw new HTTPException(400, { message: 'File size exceeds the 10 MB limit.' });
	}
}

/**
 * Uploads a file to R2 and inserts the attachment + junction records.
 * Caller is responsible for permission checks and transaction existence.
 */
export async function storeAttachment(
	db: DrizzleD1Database<typeof schema>,
	env: Cloudflare.Env,
	{
		businessId,
		transactionId,
		file,
		userId,
		now
	}: {
		businessId: string;
		transactionId: string;
		file: File;
		userId: string;
		now: string;
	}
) {
	const attachmentId = crypto.randomUUID();
	const r2Key = `${businessId}/${attachmentId}/${file.name}`;

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
			createdBy: userId
		})
		.returning();

	await db.insert(transactionAttachments).values({ transactionId, attachmentId });

	return attachment;
}
