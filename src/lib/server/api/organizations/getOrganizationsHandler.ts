import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { organizations, organizationMembers, subscriptions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { PLAN_KEY, SUBSCRIPTION_STATUS } from '$lib/configurations/plans';

export async function getOrganizationsHandler(user: App.User, env: Cloudflare.Env) {
	const db = drizzle(env.DB, { schema });

	// Find all orgs where the user is a member
	const memberships = await db
		.select({
			organizationId: organizationMembers.organizationId,
			role: organizationMembers.role,
		})
		.from(organizationMembers)
		.where(eq(organizationMembers.userId, user.id));

	if (memberships.length === 0) return [];

	const orgIds = memberships.map((m) => m.organizationId);
	const roleMap = new Map(memberships.map((m) => [m.organizationId, m.role]));

	const orgs = await db
		.select()
		.from(organizations)
		.where(and(inArray(organizations.id, orgIds), isNull(organizations.deletedAt)));

	// Get subscriptions for these orgs
	const subs = await db
		.select({
			organizationId: subscriptions.organizationId,
			planKey: subscriptions.planKey,
			status: subscriptions.status,
		})
		.from(subscriptions)
		.where(inArray(subscriptions.organizationId, orgIds));

	const subMap = new Map(subs.map((s) => [s.organizationId, s]));

	return orgs.map((o) => {
		const sub = subMap.get(o.id);
		return {
			...o,
			role: roleMap.get(o.id),
			planKey: sub?.status === SUBSCRIPTION_STATUS.ACTIVE ? sub.planKey : PLAN_KEY.FREE,
		};
	});
}
