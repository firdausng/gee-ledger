import type { RequestHandler } from './$types';
import { verifyStripeWebhook } from '$lib/server/stripe/webhook';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { subscriptions, organizationMembers } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { PLAN_KEY, SUBSCRIPTION_STATUS } from '$lib/configurations/plans';
import { dispatchNotification } from '$lib/server/push/dispatcher';
import { NOTIFICATION_TYPE } from '$lib/configurations/notifications';

// ── Stripe event types ───────────────────────────────────────────────────────

interface StripeSubscription {
	id: string;
	customer: string;
	status: string;
	cancel_at_period_end: boolean;
	current_period_start: number;
	current_period_end: number;
	metadata?: Record<string, string>;
	items?: { data: Array<{ id: string; price: { id: string }; quantity: number }> };
}

interface StripeCheckoutSession {
	id: string;
	subscription: string;
	customer: string;
	client_reference_id: string | null;
	metadata?: Record<string, string>;
}

interface StripeInvoice {
	id: string;
	subscription: string;
	customer: string;
	period_start: number;
	period_end: number;
}

interface StripeEvent {
	id: string;
	type: string;
	data: {
		object: StripeCheckoutSession | StripeSubscription | StripeInvoice;
	};
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toISOString(epoch: number): string {
	return new Date(epoch * 1000).toISOString();
}

function now(): string {
	return new Date().toISOString();
}

async function notifyOrgMembers(
	orgId: string,
	title: string,
	body: string,
	env: Cloudflare.Env
) {
	const db = drizzle(env.DB, { schema });
	const members = await db
		.select({ userId: organizationMembers.userId })
		.from(organizationMembers)
		.where(eq(organizationMembers.organizationId, orgId));

	if (members.length > 0) {
		dispatchNotification({
			recipientUserIds: members.map((m) => m.userId),
			type: NOTIFICATION_TYPE.SUBSCRIPTION_CHANGED,
			title,
			body,
			actionUrl: `/organizations/${orgId}`,
			env,
		}).catch((err) => console.error('Failed to dispatch subscription notification:', err));
	}
}

// ── Handler ──────────────────────────────────────────────────────────────────

export const POST: RequestHandler = async ({ request, platform }) => {
	const env = platform?.env;
	if (!env) {
		return new Response('Server configuration error', { status: 500 });
	}

	const signature = request.headers.get('stripe-signature');
	if (!signature) {
		return new Response('Missing stripe-signature header', { status: 400 });
	}

	const rawBody = await request.text();
	const valid = await verifyStripeWebhook(env.STRIPE_WEBHOOK_SECRET, signature, rawBody);
	if (!valid) {
		return new Response('Invalid signature', { status: 400 });
	}

	const event = JSON.parse(rawBody) as StripeEvent;
	const db = drizzle(env.DB, { schema });

	try {
		switch (event.type) {
			case 'customer.created':
				console.log('Customer created:', event);
				break;
			case 'checkout.session.completed': {
				console.log({
					event,
					message: '[webhook:stripe]Checkout session completed',
				});
				const session = event.data.object as StripeCheckoutSession;
				const organizationId = session.client_reference_id ?? session.metadata?.organizationId;

				if (!organizationId || !session.subscription) break;

				// Upsert: prefer matching by stripeSubscriptionId, then by organizationId
				const [byStripe] = await db
					.select({ id: subscriptions.id })
					.from(subscriptions)
					.where(eq(subscriptions.stripeSubscriptionId, session.subscription))
					.limit(1);

				const [byOrg] = byStripe
					? [byStripe]
					: await db
						.select({ id: subscriptions.id })
						.from(subscriptions)
						.where(eq(subscriptions.organizationId, organizationId))
						.limit(1);

				if (byOrg) {
					await db.update(subscriptions).set({
						planKey:              PLAN_KEY.PRO,
						status:               SUBSCRIPTION_STATUS.ACTIVE,
						stripeSubscriptionId: session.subscription,
						stripeCustomerId:     session.customer,
						cancelAtPeriodEnd:    false,
						updatedAt:            now(),
					}).where(eq(subscriptions.id, byOrg.id));
				} else {
					await db.insert(subscriptions).values({
						id:                   crypto.randomUUID(),
						organizationId,
						planKey:              PLAN_KEY.PRO,
						status:               SUBSCRIPTION_STATUS.ACTIVE,
						stripeSubscriptionId: session.subscription,
						stripeCustomerId:     session.customer,
						cancelAtPeriodEnd:    false,
						createdAt:            now(),
						updatedAt:            now(),
					});
				}

				notifyOrgMembers(organizationId, 'Upgraded to Pro', 'Your organization has been upgraded to the Pro plan', env);
				break;
			}

			case 'customer.subscription.updated': {
				console.log({
					event,
					message: '[webhook:stripe]Checkout customer.subscription.updated event',
				});
				const sub = event.data.object as StripeSubscription;

				const [existing] = await db
					.select({ id: subscriptions.id })
					.from(subscriptions)
					.where(eq(subscriptions.stripeSubscriptionId, sub.id))
					.limit(1);

				if (!existing) break;

				// Map Stripe status to our status
				let status: string = SUBSCRIPTION_STATUS.ACTIVE;
				if (sub.status === 'past_due') status = SUBSCRIPTION_STATUS.PAST_DUE;
				if (sub.status === 'canceled' || sub.status === 'unpaid') status = SUBSCRIPTION_STATUS.CANCELLED;

				const updateData: Record<string, unknown> = {
					status,
					cancelAtPeriodEnd:  sub.cancel_at_period_end,
					currentPeriodStart: toISOString(sub.current_period_start),
					currentPeriodEnd:   toISOString(sub.current_period_end),
					updatedAt:          now(),
				};

				// Sync seat quantity from subscription items
				if (sub.items?.data) {
					const seatItem = sub.items.data.find(
						(i) => i.price.id === env.STRIPE_PRICE_ID_SEAT,
					);
					if (seatItem) {
						updateData.extraSeats = seatItem.quantity;
						updateData.seatSubscriptionItemId = seatItem.id;
					}
				}

				await db.update(subscriptions).set(updateData).where(eq(subscriptions.id, existing.id));
				break;
			}

			case 'customer.subscription.deleted': {
				console.log({
					event,
					message: '[webhook:stripe]Checkout customer.subscription.deleted event',
				});
				const sub = event.data.object as StripeSubscription;

				// Look up org for notification before updating
				const [cancelledSub] = await db
					.select({ organizationId: subscriptions.organizationId })
					.from(subscriptions)
					.where(eq(subscriptions.stripeSubscriptionId, sub.id))
					.limit(1);

				await db.update(subscriptions).set({
					status:                 SUBSCRIPTION_STATUS.CANCELLED,
					planKey:                PLAN_KEY.FREE,
					cancelAtPeriodEnd:      false,
					extraSeats:             0,
					seatSubscriptionItemId: null,
					updatedAt:              now(),
				}).where(eq(subscriptions.stripeSubscriptionId, sub.id));

				if (cancelledSub) {
					notifyOrgMembers(cancelledSub.organizationId, 'Subscription cancelled', 'Your organization subscription has been cancelled', env);
				}
				break;
			}

			case 'invoice.paid': {
				console.log({
					event,
					message: '[webhook:stripe]Checkout invoice.paid event',
				});
				const invoice = event.data.object as StripeInvoice;
				if (!invoice.subscription) break;

				await db.update(subscriptions).set({
					status:             SUBSCRIPTION_STATUS.ACTIVE,
					currentPeriodStart: toISOString(invoice.period_start),
					currentPeriodEnd:   toISOString(invoice.period_end),
					updatedAt:          now(),
				}).where(eq(subscriptions.stripeSubscriptionId, invoice.subscription));
				break;
			}
		}
	} catch (err) {
		console.error('Stripe webhook processing error:', err);
		return new Response('Webhook processing error', { status: 500 });
	}

	return new Response('ok', { status: 200 });
};
