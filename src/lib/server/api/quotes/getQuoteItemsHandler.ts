import { drizzle } from 'drizzle-orm/d1';
import { eq, asc, inArray } from 'drizzle-orm';
import { quoteItems, quoteItemAttachments, attachments } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';

export async function getQuoteItemsHandler(
	user: App.User,
	businessId: string,
	quoteId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'quote:view', env);

	const db = drizzle(env.DB, { schema });

	const items = await db
		.select()
		.from(quoteItems)
		.where(eq(quoteItems.quoteId, quoteId))
		.orderBy(asc(quoteItems.sortOrder));

	const attachmentsByItemId: Record<string, { id: string; fileName: string; mimeType: string }[]> = {};
	if (items.length > 0) {
		const itemIds = items.map((i) => i.id);
		const rows = await db
			.select({
				itemId:       quoteItemAttachments.itemId,
				attachmentId: attachments.id,
				fileName:     attachments.fileName,
				mimeType:     attachments.mimeType,
			})
			.from(quoteItemAttachments)
			.innerJoin(attachments, eq(quoteItemAttachments.attachmentId, attachments.id))
			.where(inArray(quoteItemAttachments.itemId, itemIds));

		for (const row of rows) {
			(attachmentsByItemId[row.itemId] ??= []).push({ id: row.attachmentId, fileName: row.fileName, mimeType: row.mimeType });
		}
	}

	return items.map((item) => ({
		...item,
		attachments: attachmentsByItemId[item.id] ?? [],
	}));
}
