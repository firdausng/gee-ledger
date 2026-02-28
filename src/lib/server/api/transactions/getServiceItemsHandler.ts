import { drizzle } from 'drizzle-orm/d1';
import { eq, asc, inArray } from 'drizzle-orm';
import { transactionServiceItems, transactionServiceItemAttachments, attachments } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';

export async function getServiceItemsHandler(
	user: App.User,
	businessId: string,
	transactionId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });

	const items = await db
		.select()
		.from(transactionServiceItems)
		.where(eq(transactionServiceItems.transactionId, transactionId))
		.orderBy(asc(transactionServiceItems.sortOrder));

	const attachmentsByItemId: Record<string, { id: string; fileName: string; mimeType: string }[]> = {};
	if (items.length > 0) {
		const serviceItemIds = items.map((i) => i.id);
		const rows = await db
			.select({
				serviceItemId: transactionServiceItemAttachments.serviceItemId,
				attachmentId:  attachments.id,
				fileName:      attachments.fileName,
				mimeType:      attachments.mimeType,
			})
			.from(transactionServiceItemAttachments)
			.innerJoin(attachments, eq(transactionServiceItemAttachments.attachmentId, attachments.id))
			.where(inArray(transactionServiceItemAttachments.serviceItemId, serviceItemIds));

		for (const row of rows) {
			(attachmentsByItemId[row.serviceItemId] ??= []).push({ id: row.attachmentId, fileName: row.fileName, mimeType: row.mimeType });
		}
	}

	return items.map((item) => ({
		...item,
		attachments: attachmentsByItemId[item.id] ?? [],
	}));
}
