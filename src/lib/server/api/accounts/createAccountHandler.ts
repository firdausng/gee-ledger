import { drizzle } from 'drizzle-orm/d1';
import { accounts } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { CreateAccountInput } from '$lib/schemas/account';

export async function createAccountHandler(
	user: App.User,
	businessId: string,
	data: CreateAccountInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'account:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [account] = await db
		.insert(accounts)
		.values({
			id: crypto.randomUUID(),
			businessId,
			name: data.name,
			type: data.type,
			code: data.code ?? null,
			parentId: data.parentId ?? null,
			createdAt: now,
			createdBy: user.id,
			updatedAt: now,
			updatedBy: user.id
		})
		.returning();

	return account;
}
