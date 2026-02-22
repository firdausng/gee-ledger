import { drizzle } from 'drizzle-orm/d1';
import { users } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import type { FirebaseTokenPayload } from './firebase-verifier';

export async function upsertUser(payload: FirebaseTokenPayload, env: Cloudflare.Env) {
	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [user] = await db
		.insert(users)
		.values({
			id: payload.uid,
			email: payload.email,
			displayName: payload.name,
			photoURL: payload.picture,
			createdAt: now,
			updatedAt: now
		})
		.onConflictDoUpdate({
			target: users.id,
			set: {
				email: payload.email,
				displayName: payload.name,
				photoURL: payload.picture,
				updatedAt: now
			}
		})
		.returning();

	return user;
}
