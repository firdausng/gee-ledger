import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { invitations, businesses } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';

export async function listInvitationsHandler(user: App.User, env: Cloudflare.Env) {
	const db = drizzle(env.DB, { schema });

	const rows = await db
		.select({
			id: invitations.id,
			businessId: invitations.businessId,
			businessName: businesses.name,
			email: invitations.email,
			policyKey: invitations.policyKey,
			status: invitations.status,
			expiresAt: invitations.expiresAt,
			createdAt: invitations.createdAt
		})
		.from(invitations)
		.leftJoin(businesses, eq(invitations.businessId, businesses.id))
		.where(and(eq(invitations.email, user.email ?? ''), eq(invitations.status, 'pending')));

	return rows.map((r) => ({
		...r,
		businessName: r.businessName ?? r.businessId
	}));
}
