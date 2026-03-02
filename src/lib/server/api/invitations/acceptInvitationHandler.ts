import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { invitations, userBusinessRoles, businesses, organizationMembers } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { HTTPException } from 'hono/http-exception';

export async function acceptInvitationHandler(
	user: App.User,
	invitationId: string,
	env: Cloudflare.Env
) {
	const db = drizzle(env.DB, { schema });

	const [invitation] = await db
		.select()
		.from(invitations)
		.where(
			and(
				eq(invitations.id, invitationId),
				eq(invitations.email, user.email ?? ''),
				eq(invitations.status, 'pending')
			)
		)
		.limit(1);

	if (!invitation) throw new HTTPException(404, { message: 'Invitation not found' });

	if (new Date(invitation.expiresAt) < new Date()) {
		throw new HTTPException(410, { message: 'Invitation has expired' });
	}

	const now = new Date().toISOString();

	await db.batch([
		db.update(invitations)
			.set({ status: 'accepted', updatedAt: now })
			.where(eq(invitations.id, invitationId)),
		db.insert(userBusinessRoles).values({
			id: crypto.randomUUID(),
			userId: user.id,
			businessId: invitation.businessId,
			policyKey: invitation.policyKey,
			createdAt: now,
			createdBy: user.id
		})
	]);

	// Ensure user is also an org member
	const [biz] = await db
		.select({ organizationId: businesses.organizationId })
		.from(businesses)
		.where(eq(businesses.id, invitation.businessId))
		.limit(1);

	if (biz?.organizationId) {
		const [existingOrgMember] = await db
			.select({ id: organizationMembers.id })
			.from(organizationMembers)
			.where(and(
				eq(organizationMembers.organizationId, biz.organizationId),
				eq(organizationMembers.userId, user.id),
			))
			.limit(1);

		if (!existingOrgMember) {
			await db.insert(organizationMembers).values({
				id: crypto.randomUUID(),
				organizationId: biz.organizationId,
				userId: user.id,
				role: 'member',
				createdAt: now,
				createdBy: user.id,
			});
		}
	}

	return { success: true, businessId: invitation.businessId };
}
