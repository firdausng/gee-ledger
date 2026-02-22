import {drizzle} from "drizzle-orm/d1";
import * as schema from "$lib/server/db/schema";
import { session, user } from '$lib/server/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';

export async function createSession(userId: string, env: Cloudflare.Env, expiresInDays = 14) {
	const db = drizzle(env.DB, { schema });
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + expiresInDays);

	const token = crypto.randomUUID();

	await db.insert(session).values({
		userId,
		token,
		expiresAt
	});

	return token;
}

export async function validateSession(token: string, env: Cloudflare.Env) {
	const db = drizzle(env.DB, { schema });
	const [sessionData] = await db
		.select({
			session,
			user
		})
		.from(session)
		.innerJoin(user, eq(user.id, session.userId))
		.where(and(eq(session.token, token), gt(session.expiresAt, new Date())))
		.limit(1);

	return sessionData;
}

export async function deleteSession(token: string, env: Cloudflare.Env) {
	const db = drizzle(env.DB, { schema });
	await db.delete(session).where(eq(session.token, token));
}

export async function cleanExpiredSessions(env: Cloudflare.Env) {
	const db = drizzle(env.DB, { schema });
	await db.delete(session).where(lt(session.expiresAt, new Date()));
}
