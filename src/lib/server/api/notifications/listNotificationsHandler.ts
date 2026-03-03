import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, sql } from 'drizzle-orm';
import { notifications } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';

export async function listNotificationsHandler(
	user: App.User,
	limit: number,
	offset: number,
	env: Cloudflare.Env
): Promise<{ data: typeof notifications.$inferSelect[]; unreadCount: number }> {
	const db = drizzle(env.DB, { schema });

	const [items, countResult] = await Promise.all([
		db
			.select()
			.from(notifications)
			.where(eq(notifications.userId, user.id))
			.orderBy(desc(notifications.createdAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)` })
			.from(notifications)
			.where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)))
	]);

	return {
		data: items,
		unreadCount: countResult[0]?.count ?? 0
	};
}
