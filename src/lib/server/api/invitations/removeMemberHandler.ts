import { drizzle } from 'drizzle-orm/d1';
import { eq, and, count, inArray, isNull } from 'drizzle-orm';
import { userBusinessRoles, businesses, organizationMembers, subscriptions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import { dispatchNotification } from '$lib/server/push/dispatcher';
import { NOTIFICATION_TYPE } from '$lib/configurations/notifications';
import { SUBSCRIPTION_STATUS } from '$lib/configurations/plans';
import { updateSubscriptionItem } from '$lib/server/stripe/client';

export async function removeMemberHandler(
	user: App.User,
	businessId: string,
	targetUserId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'user:invite', env);

	const db = drizzle(env.DB, { schema });

	const [targetRole] = await db
		.select({ policyKey: userBusinessRoles.policyKey })
		.from(userBusinessRoles)
		.where(
			and(
				eq(userBusinessRoles.userId, targetUserId),
				eq(userBusinessRoles.businessId, businessId)
			)
		)
		.limit(1);

	if (!targetRole) throw new HTTPException(404, { message: 'Member not found' });

	// Prevent removing the last owner
	if (targetRole.policyKey === 'owner') {
		const [{ value: ownerCount }] = await db
			.select({ value: count() })
			.from(userBusinessRoles)
			.where(
				and(
					eq(userBusinessRoles.businessId, businessId),
					eq(userBusinessRoles.policyKey, 'owner')
				)
			);

		if (ownerCount <= 1) throw new HTTPException(400, { message: 'Cannot remove the last owner' });
	}

	// Look up business name + org for notification and seat cleanup
	const [biz] = await db
		.select({ name: businesses.name, organizationId: businesses.organizationId })
		.from(businesses)
		.where(eq(businesses.id, businessId))
		.limit(1);

	await db
		.delete(userBusinessRoles)
		.where(
			and(
				eq(userBusinessRoles.userId, targetUserId),
				eq(userBusinessRoles.businessId, businessId)
			)
		);

	// Free up org seat if user no longer belongs to any business in this org
	if (biz?.organizationId) {
		const orgId = biz.organizationId;

		// Get all business IDs in this organization
		const orgBusinesses = await db
			.select({ id: businesses.id })
			.from(businesses)
			.where(and(eq(businesses.organizationId, orgId), isNull(businesses.deletedAt)));
		const orgBizIds = orgBusinesses.map((b) => b.id);

		// Check if user still has a role in any of those businesses
		const remaining = await db
			.select({ id: userBusinessRoles.id })
			.from(userBusinessRoles)
			.where(
				and(
					eq(userBusinessRoles.userId, targetUserId),
					inArray(userBusinessRoles.businessId, orgBizIds)
				)
			)
			.limit(1);

		if (remaining.length === 0) {
			await db
				.delete(organizationMembers)
				.where(
					and(
						eq(organizationMembers.organizationId, orgId),
						eq(organizationMembers.userId, targetUserId)
					)
				);

			// Reduce extra seats in Stripe if there are paid extra seats
			const [sub] = await db
				.select()
				.from(subscriptions)
				.where(
					and(
						eq(subscriptions.organizationId, orgId),
						eq(subscriptions.status, SUBSCRIPTION_STATUS.ACTIVE),
					),
				)
				.limit(1);

			if (sub && sub.extraSeats > 0 && sub.seatSubscriptionItemId) {
				const newExtraSeats = sub.extraSeats - 1;

				await updateSubscriptionItem(env, {
					subscriptionItemId: sub.seatSubscriptionItemId,
					quantity: newExtraSeats,
				});

				await db.update(subscriptions).set({
					extraSeats: newExtraSeats,
					updatedAt: new Date().toISOString(),
				}).where(eq(subscriptions.id, sub.id));
			}
		}
	}

	// Notify the removed user (fire-and-forget)
	dispatchNotification({
		recipientUserIds: [targetUserId],
		type: NOTIFICATION_TYPE.MEMBER_LEFT,
		title: 'Removed from business',
		body: `You were removed from ${biz?.name ?? 'a business'}`,
		actionUrl: '/businesses',
		env,
	}).catch((err) => console.error('Failed to dispatch notification:', err));

	return { success: true };
}
