import { drizzle } from 'drizzle-orm/d1';
import { businesses, userBusinessRoles } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import type { CreateBusinessInput } from '$lib/schemas/business';

export async function createBusinessHandler(
	user: App.User,
	data: CreateBusinessInput,
	env: Cloudflare.Env
) {
	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();
	const businessId = crypto.randomUUID();
	const roleId = crypto.randomUUID();

	await db.batch([
		db.insert(businesses).values({
			id: businessId,
			name: data.name,
			description: data.description ?? null,
			currency: data.currency ?? 'USD',
			createdAt: now,
			createdBy: user.id,
			updatedAt: now,
			updatedBy: user.id
		}),
		db.insert(userBusinessRoles).values({
			id: roleId,
			userId: user.id,
			businessId,
			policyKey: 'owner',
			createdAt: now,
			createdBy: user.id
		})
	]);

	return { id: businessId, ...data, policyKey: 'owner', createdAt: now, updatedAt: now };
}
