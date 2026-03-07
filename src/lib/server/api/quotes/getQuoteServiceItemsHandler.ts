import { drizzle } from 'drizzle-orm/d1';
import { eq, asc, inArray } from 'drizzle-orm';
import { quoteServiceItems, quoteServiceItemAttachments, attachments } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';

export async function getQuoteServiceItemsHandler(
	user: App.User,
	businessId: string,
	quoteId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'quote:view', env);

	const db = drizzle(env.DB, { schema });

	const items = await db
		.select()
		.from(quoteServiceItems)
		.where(eq(quoteServiceItems.quoteId, quoteId))
		.orderBy(asc(quoteServiceItems.sortOrder));

	const attachmentsByItemId: Record<string, { id: string; fileName: string; mimeType: string }[]> = {};
	if (items.length > 0) {
		const serviceItemIds = items.map((i) => i.id);
		const rows = await db
			.select({
				serviceItemId: quoteServiceItemAttachments.serviceItemId,
				attachmentId:  attachments.id,
				fileName:      attachments.fileName,
				mimeType:      attachments.mimeType,
			})
			.from(quoteServiceItemAttachments)
			.innerJoin(attachments, eq(quoteServiceItemAttachments.attachmentId, attachments.id))
			.where(inArray(quoteServiceItemAttachments.serviceItemId, serviceItemIds));

		for (const row of rows) {
			(attachmentsByItemId[row.serviceItemId] ??= []).push({ id: row.attachmentId, fileName: row.fileName, mimeType: row.mimeType });
		}
	}

	return items.map((item) => ({
		...item,
		attachments: attachmentsByItemId[item.id] ?? [],
	}));
}
