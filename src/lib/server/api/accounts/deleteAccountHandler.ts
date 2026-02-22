import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { accounts } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function deleteAccountHandler(
	user: App.User,
	businessId: string,
	accountId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'account:manage', env);

	const db = drizzle(env.DB, { schema });

	// Prevent deletion of system accounts
	const [existing] = await db
		.select({ isSystem: accounts.isSystem })
		.from(accounts)
		.where(
			and(
				eq(accounts.id, accountId),
				eq(accounts.businessId, businessId),
				isNull(accounts.deletedAt)
			)
		)
		.limit(1);

	if (!existing) throw new HTTPException(404, { message: 'Account not found' });
	if (existing.isSystem) throw new HTTPException(403, { message: 'System accounts cannot be deleted' });

	const now = new Date().toISOString();

	await db
		.update(accounts)
		.set({ deletedAt: now, deletedBy: user.id })
		.where(eq(accounts.id, accountId));

	return { success: true };
}
