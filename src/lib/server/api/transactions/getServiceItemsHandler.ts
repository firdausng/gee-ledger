import { drizzle } from 'drizzle-orm/d1';
import { eq, asc } from 'drizzle-orm';
import { transactionServiceItems } from '$lib/server/db/schema';
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

	return items;
}
