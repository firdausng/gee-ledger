import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { invitations, users, userBusinessRoles, businesses, organizationMembers } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { getOrgIdForBusiness, checkSeatAvailability } from '$lib/server/utils/seatLimits';
import { sendInvitationEmail } from '$lib/server/email/sendInvitationEmail';
import { dispatchNotification } from '$lib/server/push/dispatcher';
import { NOTIFICATION_TYPE } from '$lib/configurations/notifications';
import { HTTPException } from 'hono/http-exception';
import type { InviteUserInput } from '$lib/schemas/invitation';

export async function inviteUserHandler(
	user: App.User,
	businessId: string,
	data: InviteUserInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'user:invite', env);

	const db = drizzle(env.DB, { schema });

	// Seat limit check
	const orgId = await getOrgIdForBusiness(businessId, env);
	if (orgId) {
		const { allowed, seatInfo } = await checkSeatAvailability(orgId, env);
		if (!allowed) {
			throw new HTTPException(403, {
				message: `Seat limit reached (${seatInfo.usedSeats}/${seatInfo.allowedSeats}). Purchase additional seats to invite more members.`,
			});
		}
	}

	// Look up business name for email
	const [biz] = await db
		.select({ name: businesses.name })
		.from(businesses)
		.where(eq(businesses.id, businessId))
		.limit(1);
	const businessName = biz?.name ?? 'a business';

	// Check if there is already a pending invitation for this email
	const [existing] = await db
		.select({ id: invitations.id })
		.from(invitations)
		.where(
			and(
				eq(invitations.businessId, businessId),
				eq(invitations.email, data.email),
				eq(invitations.status, 'pending')
			)
		)
		.limit(1);

	if (existing) throw new HTTPException(409, { message: 'A pending invitation already exists for this email' });

	// If the user already exists in the system, add them directly
	const [existingUser] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, data.email))
		.limit(1);

	if (existingUser) {
		// Check if already a member
		const [existingRole] = await db
			.select({ id: userBusinessRoles.id })
			.from(userBusinessRoles)
			.where(
				and(
					eq(userBusinessRoles.userId, existingUser.id),
					eq(userBusinessRoles.businessId, businessId)
				)
			)
			.limit(1);

		if (existingRole) throw new HTTPException(409, { message: 'User is already a member of this business' });

		const now = new Date().toISOString();
		await db.insert(userBusinessRoles).values({
			id: crypto.randomUUID(),
			userId: existingUser.id,
			businessId,
			policyKey: data.policyKey,
			createdAt: now,
			createdBy: user.id
		});

		// Ensure user is also an org member
		if (orgId) {
			const [existingOrgMember] = await db
				.select({ id: organizationMembers.id })
				.from(organizationMembers)
				.where(and(
					eq(organizationMembers.organizationId, orgId),
					eq(organizationMembers.userId, existingUser.id),
				))
				.limit(1);

			if (!existingOrgMember) {
				await db.insert(organizationMembers).values({
					id: crypto.randomUUID(),
					organizationId: orgId,
					userId: existingUser.id,
					role: 'member',
					createdAt: now,
					createdBy: user.id,
				});
			}
		}

		// Send notification email (fire-and-forget)
		sendInvitationEmail({
			to: data.email,
			businessName: businessName,
			inviterName: user.displayName ?? user.email ?? 'Someone',
			roleName: data.policyKey,
			signInUrl: `https://${env.APP_DOMAIN}/invitations`,
			resendApiKey: env.RESEND_API_KEY,
			fromDomain: env.RESEND_FROM_DOMAIN,
			appDomain: env.APP_DOMAIN,
			type: 'added',
		}).catch((err) => console.error('Failed to send invitation email:', err));

		// Push notification (fire-and-forget)
		dispatchNotification({
			recipientUserIds: [existingUser.id],
			type: NOTIFICATION_TYPE.INVITATION_RECEIVED,
			title: 'Added to business',
			body: `${user.displayName ?? 'Someone'} added you to ${businessName}`,
			actionUrl: `/businesses/${businessId}`,
			env,
		}).catch((err) => console.error('Failed to dispatch notification:', err));

		return { status: 'added', userId: existingUser.id };
	}

	// Otherwise create a pending invitation
	const now = new Date().toISOString();
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

	const [invitation] = await db
		.insert(invitations)
		.values({
			id: crypto.randomUUID(),
			businessId,
			email: data.email,
			policyKey: data.policyKey,
			invitedBy: user.id,
			expiresAt,
			createdAt: now,
			updatedAt: now
		})
		.returning();

	// Send invitation email (fire-and-forget)
	sendInvitationEmail({
		to: data.email,
		businessName: businessName,
		inviterName: user.displayName ?? user.email ?? 'Someone',
		roleName: data.policyKey,
		signInUrl: `https://${env.APP_DOMAIN}/invitations`,
		resendApiKey: env.RESEND_API_KEY,
		fromDomain: env.RESEND_FROM_DOMAIN,
		appDomain: env.APP_DOMAIN,
		type: 'invited',
	}).catch((err) => console.error('Failed to send invitation email:', err));

	return { status: 'invited', invitation };
}
