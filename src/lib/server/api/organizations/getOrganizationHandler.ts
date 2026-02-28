import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { organizations, organizationMembers, subscriptions, businesses } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { HTTPException } from 'hono/http-exception';
import { PLAN_KEY, SUBSCRIPTION_STATUS } from '$lib/configurations/plans';

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

	// Get members
	const members = await db
		.select({
			id: organizationMembers.id,
			userId: organizationMembers.userId,
			role: organizationMembers.role,
			createdAt: organizationMembers.createdAt,
		})
		.from(organizationMembers)
		.where(eq(organizationMembers.organizationId, organizationId));

	// Get business count
	const bizCount = await db
		.select({ id: businesses.id })
		.from(businesses)
		.where(
			and(
				eq(businesses.organizationId, organizationId),
				isNull(businesses.deletedAt)
			)
		);

	return {
		...org,
		role: membership.role,
		planKey: sub ? sub.planKey : PLAN_KEY.FREE,
		subscription: sub ?? null,
		members,
		businessCount: bizCount.length,
	};
}
