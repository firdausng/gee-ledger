import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { invitations } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { HTTPException } from 'hono/http-exception';

export async function declineInvitationHandler(
	user: App.User,
	invitationId: string,
	env: Cloudflare.Env
) {
	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [updated] = await db
		.update(invitations)
		.set({ status: 'declined', updatedAt: now })
		.where(
			and(
				eq(invitations.id, invitationId),
				eq(invitations.email, user.email ?? ''),
				eq(invitations.status, 'pending')
			)
		)
		.returning();

	if (!updated) throw new HTTPException(404, { message: 'Invitation not found' });

	return { success: true };
}
