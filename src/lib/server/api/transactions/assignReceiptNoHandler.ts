import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { transactions, businesses } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function assignReceiptNoHandler(
	user: App.User,
	businessId: string,
	transactionId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [tx] = await db
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

	if (!tx) throw new HTTPException(404, { message: 'Transaction not found' });

	// If already assigned, return existing
	if (tx.receiptNo) return { receiptNo: tx.receiptNo };

	const [biz] = await db
		.select()
		.from(businesses)
		.where(and(eq(businesses.id, businessId), isNull(businesses.deletedAt)))
		.limit(1);

	if (!biz) throw new HTTPException(404, { message: 'Business not found' });

	const n = biz.nextReceiptNo;
	const receiptNo = `REC-${String(n).padStart(4, '0')}`;

	await db
		.update(transactions)
		.set({ receiptNo, updatedAt: now, updatedBy: user.id })
		.where(eq(transactions.id, transactionId));

	await db
		.update(businesses)
		.set({ nextReceiptNo: n + 1, updatedAt: now, updatedBy: user.id })
		.where(eq(businesses.id, businessId));

	return { receiptNo };
}
