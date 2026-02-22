import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { transactions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function getTransactionHandler(
	user: App.User,
	businessId: string,
	transactionId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });

	const [transaction] = await db
		.select()
		.from(transactions)
		.where(
			and(
				eq(transactions.id, transactionId),
				eq(transactions.businessId, businessId),
				isNull(transactions.deletedAt)
			)
		)
		.limit(1);

	if (!transaction) throw new HTTPException(404, { message: 'Transaction not found' });

	return transaction;
}
