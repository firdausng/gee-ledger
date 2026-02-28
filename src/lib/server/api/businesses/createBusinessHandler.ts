import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { businesses, userBusinessRoles, organizations, organizationMembers, subscriptions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { PLANS, PLAN_KEY, SUBSCRIPTION_STATUS, ORG_ROLE, type PlanKey } from '$lib/configurations/plans';
import { HTTPException } from 'hono/http-exception';
import type { CreateBusinessInput } from '$lib/schemas/business';

export async function createBusinessHandler(
	user: App.User,
	data: CreateBusinessInput,
	env: Cloudflare.Env
) {
	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	// Resolve or auto-create organization
	let organizationId: string;

	const [existingMembership] = await db
		.select({ organizationId: organizationMembers.organizationId })
		.from(organizationMembers)
		.where(eq(organizationMembers.userId, user.id))
		.limit(1);

	if (existingMembership) {
		organizationId = existingMembership.organizationId;
	} else {
		// Auto-create personal organization
		organizationId = crypto.randomUUID();
		await db.batch([
			db.insert(organizations).values({
				id: organizationId,
				name: user.displayName ?? 'My Organization',
				createdAt: now,
				createdBy: user.id,
				updatedAt: now,
				updatedBy: user.id,
			}),
			db.insert(organizationMembers).values({
				id: crypto.randomUUID(),
				organizationId,
				userId: user.id,
				role: ORG_ROLE.OWNER,
				createdAt: now,
				createdBy: user.id,
			}),
		]);
	}

	// Check plan limit: maxBusinesses
	const [sub] = await db
		.select({ planKey: subscriptions.planKey })
		.from(subscriptions)
		.where(and(eq(subscriptions.organizationId, organizationId), eq(subscriptions.status, SUBSCRIPTION_STATUS.ACTIVE)))
		.limit(1);

	const planKey = (sub?.planKey as PlanKey) ?? PLAN_KEY.FREE;
	const plan = PLANS[planKey];

	if (plan.limits.maxBusinesses !== -1) {
		const existing = await db
			.select({ id: businesses.id })
			.from(businesses)
			.where(and(eq(businesses.organizationId, organizationId), isNull(businesses.deletedAt)));

		if (existing.length >= plan.limits.maxBusinesses) {
			throw new HTTPException(403, { message: 'Business limit reached. Upgrade your plan.' });
		}
	}

	// Create business + owner role
	const businessId = crypto.randomUUID();
	const roleId = crypto.randomUUID();

	await db.batch([
		db.insert(businesses).values({
			id: businessId,
			organizationId,
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

	return { id: businessId, ...data, organizationId, policyKey: 'owner', createdAt: now, updatedAt: now };
}
