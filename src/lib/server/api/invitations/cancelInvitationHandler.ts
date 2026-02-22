import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { invitations } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function cancelInvitationHandler(
	user: App.User,
	businessId: string,
	invitationId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'user:invite', env);

	const db = drizzle(env.DB, { schema });

	const [inv] = await db
		.select()
		.from(invitations)
		.where(
			and(
				eq(invitations.id, invitationId),
				eq(invitations.businessId, businessId),
				eq(invitations.status, 'pending')
			)
		)
		.limit(1);

	if (!inv) throw new HTTPException(404, { message: 'Invitation not found' });

	await db
		.update(invitations)
		.set({ status: 'cancelled', updatedAt: new Date().toISOString() })
		.where(eq(invitations.id, invitationId));

	return { id: invitationId };
}
