import { drizzle } from 'drizzle-orm/d1';
import { transactions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { CreateTransactionInput } from '$lib/schemas/transaction';

export async function createTransactionHandler(
	user: App.User,
	businessId: string,
	data: CreateTransactionInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:create', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [transaction] = await db
		.insert(transactions)
		.values({
			id: crypto.randomUUID(),
			businessId,
			locationId: data.locationId,
			salesChannelId: data.salesChannelId ?? null,
			categoryId: data.categoryId ?? null,
			type: data.type,
			amount: data.amount,
			note: data.note ?? null,
			referenceNo: data.referenceNo ?? null,
			transactionDate: data.transactionDate,
			createdAt: now,
			createdBy: user.id,
			updatedAt: now,
			updatedBy: user.id
		})
		.returning();

	return transaction;
}
