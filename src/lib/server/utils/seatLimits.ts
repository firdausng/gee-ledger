import { drizzle } from 'drizzle-orm/d1';
import { eq, and, inArray, isNull, gt, notInArray } from 'drizzle-orm';
import { organizationMembers, subscriptions, businesses, invitations, users } from '$lib/server/db/schema';
import { PLANS, PLAN_KEY, SUBSCRIPTION_STATUS, type PlanKey } from '$lib/configurations/plans';
import * as schema from '$lib/server/db/schema';

export interface SeatInfo {
	currentMembers: number;
	pendingInvites: number;
	usedSeats: number;
	allowedSeats: number;
	extraSeats: number;
	includedSeats: number;
}

export async function getOrgIdForBusiness(businessId: string, env: Cloudflare.Env): Promise<string | null> {
	const db = drizzle(env.DB, { schema });
	const [biz] = await db
		.select({ organizationId: businesses.organizationId })
		.from(businesses)
		.where(eq(businesses.id, businessId))
		.limit(1);
	return biz?.organizationId ?? null;
}

export async function getOrgSeatInfo(organizationId: string, env: Cloudflare.Env): Promise<SeatInfo> {
	const db = drizzle(env.DB, { schema });

	// 1. Count org members
	const orgMembers = await db
		.select({ userId: organizationMembers.userId })
		.from(organizationMembers)
		.where(eq(organizationMembers.organizationId, organizationId));
	const currentMembers = orgMembers.length;

	// 2. Get org's business IDs
	const orgBizzes = await db
		.select({ id: businesses.id })
		.from(businesses)
		.where(and(eq(businesses.organizationId, organizationId), isNull(businesses.deletedAt)));
	const bizIds = orgBizzes.map((b) => b.id);

	// 3. Count distinct pending non-expired invite emails not already org members
	let pendingInvites = 0;
	if (bizIds.length > 0) {
		const now = new Date().toISOString();

		// Get existing member user IDs → emails
		const memberUserIds = orgMembers.map((m) => m.userId);
		let memberEmails: string[] = [];
		if (memberUserIds.length > 0) {
			const memberUsers = await db
				.select({ email: users.email })
				.from(users)
				.where(inArray(users.id, memberUserIds));
			memberEmails = memberUsers.map((u) => u.email).filter(Boolean) as string[];
		}

		// Get distinct pending invite emails for org businesses
		const pendingInvs = await db
			.select({ email: invitations.email })
			.from(invitations)
			.where(
				and(
					inArray(invitations.businessId, bizIds),
					eq(invitations.status, 'pending'),
					gt(invitations.expiresAt, now),
				),
			);

		const uniqueEmails = new Set(pendingInvs.map((i) => i.email));
		// Subtract emails already in org
		for (const email of memberEmails) {
			uniqueEmails.delete(email);
		}
		pendingInvites = uniqueEmails.size;
	}

	// 4. Look up subscription
	const [sub] = await db
		.select({
			planKey: subscriptions.planKey,
			extraSeats: subscriptions.extraSeats,
		})
		.from(subscriptions)
		.where(
			and(
				eq(subscriptions.organizationId, organizationId),
				eq(subscriptions.status, SUBSCRIPTION_STATUS.ACTIVE),
			),
		)
		.limit(1);

	const planKey = (sub?.planKey ?? PLAN_KEY.FREE) as PlanKey;
	const plan = PLANS[planKey] ?? PLANS[PLAN_KEY.FREE];
	const extraSeats = sub?.extraSeats ?? 0;

	const usedSeats = currentMembers + pendingInvites;
	const allowedSeats = plan.limits.includedSeats + extraSeats;

	return {
		currentMembers,
		pendingInvites,
		usedSeats,
		allowedSeats,
		extraSeats,
		includedSeats: plan.limits.includedSeats,
	};
}

export async function checkSeatAvailability(
	organizationId: string,
	env: Cloudflare.Env,
): Promise<{ allowed: boolean; seatInfo: SeatInfo }> {
	const seatInfo = await getOrgSeatInfo(organizationId, env);
	return { allowed: seatInfo.usedSeats < seatInfo.allowedSeats, seatInfo };
}
