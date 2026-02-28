import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { userBusinessRoles, businesses, subscriptions } from '$lib/server/db/schema';
import { POLICIES, type Permission, type PolicyKey } from '$lib/configurations/policies';
import { PLANS, PLAN_GATED_PERMISSIONS, PLAN_KEY, SUBSCRIPTION_STATUS, type PlanKey } from '$lib/configurations/plans';
import * as schema from '$lib/server/db/schema';
import { HTTPException } from 'hono/http-exception';

export async function getUserBusinessRole(
	userId: string,
	businessId: string,
	env: Cloudflare.Env
): Promise<PolicyKey | null> {
	const db = drizzle(env.DB, { schema });

	const [role] = await db
		.select({ policyKey: userBusinessRoles.policyKey })
		.from(userBusinessRoles)
		.where(
			and(
				eq(userBusinessRoles.userId, userId),
				eq(userBusinessRoles.businessId, businessId)
			)
		)
		.limit(1);

	return (role?.policyKey as PolicyKey) ?? null;
}

export function getBusinessPermissions(policyKey: PolicyKey): Permission[] {
	return POLICIES[policyKey] ?? [];
}

export async function checkBusinessPermission(
	userId: string,
	businessId: string,
	permission: Permission,
	env: Cloudflare.Env
): Promise<boolean> {
	const role = await getUserBusinessRole(userId, businessId, env);
	if (!role) return false;
	return getBusinessPermissions(role).includes(permission);
}

export async function getBusinessPlanKey(
	businessId: string,
	env: Cloudflare.Env
): Promise<PlanKey> {
	const db = drizzle(env.DB, { schema });

	const [biz] = await db
		.select({ organizationId: businesses.organizationId })
		.from(businesses)
		.where(eq(businesses.id, businessId))
		.limit(1);

	if (!biz?.organizationId) return PLAN_KEY.FREE;

	const [sub] = await db
		.select({ planKey: subscriptions.planKey })
		.from(subscriptions)
		.where(
			and(
				eq(subscriptions.organizationId, biz.organizationId),
				eq(subscriptions.status, SUBSCRIPTION_STATUS.ACTIVE)
			)
		)
		.limit(1);

	return (sub?.planKey as PlanKey) ?? PLAN_KEY.FREE;
}

export async function requireBusinessPermission(
	user: App.User,
	businessId: string,
	permission: Permission,
	env: Cloudflare.Env
): Promise<void> {
	const allowed = await checkBusinessPermission(user.id, businessId, permission, env);
	if (!allowed) {
		throw new HTTPException(403, { message: 'Forbidden' });
	}

	// Plan feature check for gated permissions
	if (PLAN_GATED_PERMISSIONS.has(permission)) {
		const planKey = await getBusinessPlanKey(businessId, env);
		const plan = PLANS[planKey];
		if (!plan.features.includes(permission)) {
			throw new HTTPException(403, { message: 'Plan upgrade required' });
		}
	}
}

export async function requireOwnerRole(
	user: App.User,
	businessId: string,
	env: Cloudflare.Env
): Promise<void> {
	const role = await getUserBusinessRole(user.id, businessId, env);
	if (role !== 'owner') {
		throw new HTTPException(403, { message: 'Forbidden: owner role required' });
	}
}
