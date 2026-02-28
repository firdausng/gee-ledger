import { redirect } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { businesses, userBusinessRoles, subscriptions } from '$lib/server/db/schema';
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

	return { user: locals.user, navBusinesses };
};
