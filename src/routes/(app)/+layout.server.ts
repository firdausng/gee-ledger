import { redirect } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { businesses, userBusinessRoles, subscriptions, organizationMembers } from '$lib/server/db/schema';
import { PLAN_KEY, SUBSCRIPTION_STATUS } from '$lib/configurations/plans';
import * as schema from '$lib/server/db/schema';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	if (!locals.user) throw redirect(307, '/login');

	const db = drizzle(platform!.env.DB, { schema });

	const roles = await db
		.select({ businessId: userBusinessRoles.businessId })
		.from(userBusinessRoles)
		.where(eq(userBusinessRoles.userId, locals.user.id));

	let navBusinesses: { id: string; name: string; currency: string; planKey: string }[] = [];

	if (roles.length > 0) {
		const ids = roles.map((r) => r.businessId);
		const bizRows = await db
			.select({
				id: businesses.id,
				name: businesses.name,
				currency: businesses.currency,
				organizationId: businesses.organizationId,
			})
			.from(businesses)
			.where(and(inArray(businesses.id, ids), isNull(businesses.deletedAt)));

		// Collect unique org IDs to look up subscriptions
		const orgIds = [...new Set(bizRows.map((b) => b.organizationId).filter(Boolean))] as string[];
		const planMap = new Map<string, string>();

		if (orgIds.length > 0) {
			const subs = await db
				.select({
					organizationId: subscriptions.organizationId,
					planKey: subscriptions.planKey,
				})
				.from(subscriptions)
				.where(
					and(
						inArray(subscriptions.organizationId, orgIds),
						eq(subscriptions.status, SUBSCRIPTION_STATUS.ACTIVE)
					)
				);
			for (const sub of subs) {
				planMap.set(sub.organizationId, sub.planKey);
			}
		}

		navBusinesses = bizRows.map((b) => ({
			id: b.id,
			name: b.name,
			currency: b.currency,
			planKey: b.organizationId ? (planMap.get(b.organizationId) ?? PLAN_KEY.FREE) : PLAN_KEY.FREE,
		}));
	}

	// Find user's orgs on Free plan (for upgrade banner)
	const userOrgs = await db
		.select({
			organizationId: organizationMembers.organizationId,
			role: organizationMembers.role,
		})
		.from(organizationMembers)
		.where(eq(organizationMembers.userId, locals.user.id));

	let upgradeOrgId: string | null = null;
	if (userOrgs.length > 0) {
		const ownerOrgIds = userOrgs
			.filter((o) => o.role === 'owner')
			.map((o) => o.organizationId);

		if (ownerOrgIds.length > 0) {
			// Check which of these orgs are on Pro
			const proOrgIds = new Set(
				(await db
					.select({ organizationId: subscriptions.organizationId })
					.from(subscriptions)
					.where(
						and(
							inArray(subscriptions.organizationId, ownerOrgIds),
							eq(subscriptions.planKey, PLAN_KEY.PRO),
							eq(subscriptions.status, SUBSCRIPTION_STATUS.ACTIVE),
						),
					)
				).map((s) => s.organizationId),
			);

			// First owner org that's NOT on Pro
			upgradeOrgId = ownerOrgIds.find((id) => !proOrgIds.has(id)) ?? null;
		}
	}

	return { user: locals.user, navBusinesses, upgradeOrgId };
};
