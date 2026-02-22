import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { invitations, userBusinessRoles } from '$lib/server/db/schema';
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

	return { success: true, businessId: invitation.businessId };
}
