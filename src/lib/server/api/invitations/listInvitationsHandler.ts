import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { invitations } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';

export async function listInvitationsHandler(user: App.User, env: Cloudflare.Env) {
	const db = drizzle(env.DB, { schema });

	return db
		.select()
		.from(invitations)
		.where(and(eq(invitations.email, user.email ?? ''), eq(invitations.status, 'pending')));
}
