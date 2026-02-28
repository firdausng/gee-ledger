import { drizzle } from 'drizzle-orm/d1';
import { eq, asc, inArray } from 'drizzle-orm';
import { transactionItems, transactionItemAttachments, attachments } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';

export async function getTransactionItemsHandler(
	user: App.User,
	businessId: string,
	transactionId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });

	const items = await db
		.select()
		.from(transactionItems)
		.where(eq(transactionItems.transactionId, transactionId))
		.orderBy(asc(transactionItems.sortOrder));

	const attachmentsByItemId: Record<string, { id: string; fileName: string; mimeType: string }[]> = {};
	if (items.length > 0) {
		const itemIds = items.map((i) => i.id);
		const rows = await db
			.select({
				itemId:       transactionItemAttachments.itemId,
				attachmentId: attachments.id,
				fileName:     attachments.fileName,
				mimeType:     attachments.mimeType,
			})
			.from(transactionItemAttachments)
			.innerJoin(attachments, eq(transactionItemAttachments.attachmentId, attachments.id))
			.where(inArray(transactionItemAttachments.itemId, itemIds));

		for (const row of rows) {
			(attachmentsByItemId[row.itemId] ??= []).push({ id: row.attachmentId, fileName: row.fileName, mimeType: row.mimeType });
		}
	}

	return items.map((item) => ({
		...item,
		attachments: attachmentsByItemId[item.id] ?? [],
	}));
}
