import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { organizationMembers, subscriptions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { ORG_ROLE, PLAN_KEY, SUBSCRIPTION_STATUS } from '$lib/configurations/plans';
import { HTTPException } from 'hono/http-exception';
import { addSubscriptionItem, updateSubscriptionItem } from '$lib/server/stripe/client';
import { getOrgSeatInfo } from '$lib/server/utils/seatLimits';

export async function purchaseSeatsHandler(
	user: App.User,
	organizationId: string,
	data: { quantity: number },
	env: Cloudflare.Env,
) {
	if (!data.quantity || data.quantity < 1 || data.quantity > 50) {
		throw new HTTPException(400, { message: 'Quantity must be between 1 and 50' });
	}

	const db = drizzle(env.DB, { schema });

	// 1. Verify user is org owner
	const [member] = await db
		.select({ role: organizationMembers.role })
		.from(organizationMembers)
		.where(
			and(
				eq(organizationMembers.organizationId, organizationId),
				eq(organizationMembers.userId, user.id),
			),
		)
		.limit(1);

	if (!member || member.role !== ORG_ROLE.OWNER) {
		throw new HTTPException(403, { message: 'Only the organization owner can purchase seats' });
	}

	// 2. Get active Pro subscription
	const [sub] = await db
		.select()
		.from(subscriptions)
		.where(
			and(
				eq(subscriptions.organizationId, organizationId),
				eq(subscriptions.status, SUBSCRIPTION_STATUS.ACTIVE),
			),
		)
		.limit(1);

	if (!sub || sub.planKey !== PLAN_KEY.PRO) {
		throw new HTTPException(400, { message: 'An active Pro subscription is required to purchase seats' });
	}

	if (!sub.stripeSubscriptionId) {
		throw new HTTPException(400, { message: 'No Stripe subscription found' });
	}

	const newExtraSeats = sub.extraSeats + data.quantity;

	// 3. Add or update Stripe subscription item
	let seatSubscriptionItemId = sub.seatSubscriptionItemId;

	if (seatSubscriptionItemId) {
		// Update existing seat item
		await updateSubscriptionItem(env, {
			subscriptionItemId: seatSubscriptionItemId,
			quantity: newExtraSeats,
		});
	} else {
		// Add new seat item to subscription
		const item = await addSubscriptionItem(env, {
			subscriptionId: sub.stripeSubscriptionId,
			priceId: env.STRIPE_PRICE_ID_SEAT,
			quantity: data.quantity,
		});
		seatSubscriptionItemId = item.id;
	}

	// 4. Update DB
	await db.update(subscriptions).set({
		extraSeats: newExtraSeats,
		seatSubscriptionItemId,
		updatedAt: new Date().toISOString(),
	}).where(eq(subscriptions.id, sub.id));

	// 5. Return updated seat info
	const seatInfo = await getOrgSeatInfo(organizationId, env);
	return { seatInfo };
}
