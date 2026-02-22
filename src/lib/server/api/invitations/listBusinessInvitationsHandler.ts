import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { invitations } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';

export async function listBusinessInvitationsHandler(
	user: App.User,
	businessId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'user:invite', env);

	const db = drizzle(env.DB, { schema });

	return db
		.select()
		.from(invitations)
		.where(and(eq(invitations.businessId, businessId), eq(invitations.status, 'pending')));
}
