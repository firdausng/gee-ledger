import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { transactions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function deleteTransactionHandler(
	user: App.User,
	businessId: string,
	transactionId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:delete', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [deleted] = await db
		.update(transactions)
		.set({ deletedAt: now, deletedBy: user.id })
		.where(
			and(
				eq(transactions.id, transactionId),
				eq(transactions.businessId, businessId),
				isNull(transactions.deletedAt)
			)
		)
		.returning();

	if (!deleted) throw new HTTPException(404, { message: 'Transaction not found' });

	return { success: true };
}
