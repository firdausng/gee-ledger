import { drizzle } from 'drizzle-orm/d1';
import { and, eq } from 'drizzle-orm';
import { notifications } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';

export async function markAllReadHandler(user: App.User, env: Cloudflare.Env): Promise<void> {
	const db = drizzle(env.DB, { schema });

	await db
		.update(notifications)
		.set({ isRead: true })
		.where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));
}
