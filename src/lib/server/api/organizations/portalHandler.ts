import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { organizationMembers, subscriptions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { ORG_ROLE, SUBSCRIPTION_STATUS } from '$lib/configurations/plans';
import { HTTPException } from 'hono/http-exception';
import { createPortalSession } from '$lib/server/stripe/client';

export async function portalHandler(
	user: App.User,
	organizationId: string,
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

	// 2. Get Stripe customer ID from subscription
	const [sub] = await db
		.select({ stripeCustomerId: subscriptions.stripeCustomerId })
		.from(subscriptions)
		.where(
			and(
				eq(subscriptions.organizationId, organizationId),
				eq(subscriptions.status, SUBSCRIPTION_STATUS.ACTIVE),
			),
		)
		.limit(1);

	if (!sub?.stripeCustomerId) {
		throw new HTTPException(400, { message: 'No active subscription found' });
	}

	// 3. Create Stripe Billing Portal session
	const session = await createPortalSession(env, {
		customerId: sub.stripeCustomerId,
		returnUrl: `${origin}/organizations/${organizationId}`,
	});

	return { portalUrl: session.url };
}
