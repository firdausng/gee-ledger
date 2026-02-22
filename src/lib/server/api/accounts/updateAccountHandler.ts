import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { accounts } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { UpdateAccountInput } from '$lib/schemas/account';

export async function updateAccountHandler(
	user: App.User,
	businessId: string,
	accountId: string,
	data: UpdateAccountInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'account:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [updated] = await db
		.update(accounts)
		.set({
			...(data.name !== undefined && { name: data.name }),
			...(data.code !== undefined && { code: data.code }),
			...(data.parentId !== undefined && { parentId: data.parentId }),
			updatedAt: now,
			updatedBy: user.id
		})
		.where(
			and(
				eq(accounts.id, accountId),
				eq(accounts.businessId, businessId),
				isNull(accounts.deletedAt)
			)
		)
		.returning();

	if (!updated) throw new HTTPException(404, { message: 'Account not found' });

	return updated;
}
