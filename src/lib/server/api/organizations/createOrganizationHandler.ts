import { drizzle } from 'drizzle-orm/d1';
import { organizations, organizationMembers } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { ORG_ROLE } from '$lib/configurations/plans';
import type { CreateOrganizationInput } from '$lib/schemas/organization';

export async function createOrganizationHandler(
	user: App.User,
	data: CreateOrganizationInput,
	env: Cloudflare.Env
) {
	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();
	const organizationId = crypto.randomUUID();
	const memberId = crypto.randomUUID();

	await db.batch([
		db.insert(organizations).values({
			id: organizationId,
			name: data.name,
			createdAt: now,
			createdBy: user.id,
			updatedAt: now,
			updatedBy: user.id,
		}),
		db.insert(organizationMembers).values({
			id: memberId,
			organizationId,
			userId: user.id,
			role: ORG_ROLE.OWNER,
			createdAt: now,
			createdBy: user.id,
		}),
	]);

	return { id: organizationId, name: data.name, role: ORG_ROLE.OWNER, createdAt: now, updatedAt: now };
}
