import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { organizationMembers, subscriptions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { ORG_ROLE, PLAN_KEY, SUBSCRIPTION_STATUS } from '$lib/configurations/plans';
import { HTTPException } from 'hono/http-exception';
import { createCheckoutSession } from '$lib/server/stripe/client';

export async function checkoutHandler(
	user: App.User,
	organizationId: string,
	data: { interval: 'month' | 'year' },
	env: Cloudflare.Env,
	origin: string,
) {
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
		throw new HTTPException(403, { message: 'Only the organization owner can manage subscriptions' });
	}

	// 2. Check org doesn't already have active Pro subscription
	const [existing] = await db
		.select({ planKey: subscriptions.planKey, status: subscriptions.status })
		.from(subscriptions)
		.where(
			and(
				eq(subscriptions.organizationId, organizationId),
				eq(subscriptions.status, SUBSCRIPTION_STATUS.ACTIVE),
			),
		)
		.limit(1);

	if (existing?.planKey === PLAN_KEY.PRO) {
		throw new HTTPException(400, { message: 'Organization already has an active Pro subscription' });
	}

	// 3. Pick price ID based on interval
	const priceId = data.interval === 'year'
		? env.STRIPE_PRICE_ID_PRO_YEARLY
		: env.STRIPE_PRICE_ID_PRO_MONTHLY;

	// 4. Create Stripe Checkout Session (idempotency key prevents duplicate sessions from rapid clicks)
	const session = await createCheckoutSession(env, {
		priceId,
		customerEmail: user.email ?? '',
		clientReferenceId: organizationId,
		successUrl: `${origin}/organizations/${organizationId}?checkout=success`,
		cancelUrl: `${origin}/organizations/${organizationId}`,
		metadata: { organizationId, userId: user.id },
		idempotencyKey: `checkout_${organizationId}_${data.interval}`,
	});

	return { checkoutUrl: session.url };
}
