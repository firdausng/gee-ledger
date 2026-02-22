import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { invitations, users, userBusinessRoles } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
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

	return { status: 'invited', invitation };
}
