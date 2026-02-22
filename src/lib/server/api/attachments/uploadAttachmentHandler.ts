import { drizzle } from 'drizzle-orm/d1';
import { attachments, transactionAttachments, transactions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import { eq, and, isNull } from 'drizzle-orm';
import {
	validateFile,
	storeAttachment,
	MAX_ATTACHMENTS_PER_TRANSACTION
} from './attachmentUtils';

export async function uploadAttachmentHandler(
	user: App.User,
	businessId: string,
	transactionId: string,
	file: File,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'attachment:upload', env);
	validateFile(file);

	const db = drizzle(env.DB, { schema });

	const [tx] = await db
		.select({ id: transactions.id })
		.from(transactions)
		.where(and(eq(transactions.id, transactionId), eq(transactions.businessId, businessId), isNull(transactions.deletedAt)))
		.limit(1);

	if (!tx) throw new HTTPException(404, { message: 'Transaction not found.' });

	const existing = await db
		.select({ attachmentId: transactionAttachments.attachmentId })
		.from(transactionAttachments)
		.innerJoin(attachments, eq(attachments.id, transactionAttachments.attachmentId))
		.where(and(eq(transactionAttachments.transactionId, transactionId), isNull(attachments.deletedAt)));

	if (existing.length >= MAX_ATTACHMENTS_PER_TRANSACTION) {
		throw new HTTPException(400, { message: `Maximum of ${MAX_ATTACHMENTS_PER_TRANSACTION} attachments per transaction.` });
	}

	return storeAttachment(db, env, {
		businessId,
		transactionId,
		file,
		userId: user.id,
		now: new Date().toISOString()
	});
}
