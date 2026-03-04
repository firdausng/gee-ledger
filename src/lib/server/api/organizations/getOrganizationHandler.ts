import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { organizations, organizationMembers, subscriptions, businesses, users, userBusinessRoles } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { HTTPException } from 'hono/http-exception';
import { PLAN_KEY, SUBSCRIPTION_STATUS } from '$lib/configurations/plans';
import { getOrgSeatInfo } from '$lib/server/utils/seatLimits';

export async function getOrganizationHandler(
	user: App.User,
	organizationId: string,
	env: Cloudflare.Env
) {
	const db = drizzle(env.DB, { schema });

	// Verify membership
	const [membership] = await db
		.select({ role: organizationMembers.role })
		.from(organizationMembers)
		.where(
			and(
				eq(organizationMembers.organizationId, organizationId),
				eq(organizationMembers.userId, user.id)
			)
		)
		.limit(1);

	if (!membership) {
		throw new HTTPException(403, { message: 'Not a member of this organization' });
	}

	// Get org
	const [org] = await db
		.select()
		.from(organizations)
		.where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
		.limit(1);

	if (!org) {
		throw new HTTPException(404, { message: 'Organization not found' });
	}

	// Get subscription
	const [sub] = await db
		.select()
		.from(subscriptions)
		.where(
			and(
				eq(subscriptions.organizationId, organizationId),
				eq(subscriptions.status, SUBSCRIPTION_STATUS.ACTIVE)
			)
		)
		.limit(1);

	// Get members with user details
	const members = await db
		.select({
			id: organizationMembers.id,
			userId: organizationMembers.userId,
			role: organizationMembers.role,
			createdAt: organizationMembers.createdAt,
			displayName: users.displayName,
			email: users.email,
			photoURL: users.photoURL,
		})
		.from(organizationMembers)
		.leftJoin(users, eq(organizationMembers.userId, users.id))
		.where(eq(organizationMembers.organizationId, organizationId));

	// Get businesses with per-business member summaries
	const orgBusinesses = await db
		.select({ id: businesses.id, name: businesses.name })
		.from(businesses)
		.where(
			and(
				eq(businesses.organizationId, organizationId),
				isNull(businesses.deletedAt)
			)
		);

	const bizIds = orgBusinesses.map((b) => b.id);

	let businessMemberships: Array<{ userId: string; businessId: string; policyKey: string }> = [];
	if (bizIds.length > 0) {
		businessMemberships = await db
			.select({
				userId: userBusinessRoles.userId,
				businessId: userBusinessRoles.businessId,
				policyKey: userBusinessRoles.policyKey,
			})
			.from(userBusinessRoles)
			.where(inArray(userBusinessRoles.businessId, bizIds));
	}

	const membersByBiz = new Map<string, Array<{ userId: string; policyKey: string }>>();
	for (const m of businessMemberships) {
		const arr = membersByBiz.get(m.businessId) ?? [];
		arr.push({ userId: m.userId, policyKey: m.policyKey });
		membersByBiz.set(m.businessId, arr);
	}

	const businessesWithMembers = orgBusinesses.map((b) => ({
		id: b.id,
		name: b.name,
		memberSummary: membersByBiz.get(b.id) ?? [],
	}));

	const seatInfo = await getOrgSeatInfo(organizationId, env);

	return {
		...org,
		role: membership.role,
		planKey: sub ? sub.planKey : PLAN_KEY.FREE,
		subscription: sub ?? null,
		members,
		businesses: businessesWithMembers,
		businessCount: orgBusinesses.length,
		seatInfo,
	};
}
