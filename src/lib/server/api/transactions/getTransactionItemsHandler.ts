import { drizzle } from 'drizzle-orm/d1';
import { eq, asc } from 'drizzle-orm';
import { transactionItems } from '$lib/server/db/schema';
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

	return items;
}
