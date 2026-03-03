import { drizzle } from 'drizzle-orm/d1';
import { and, eq } from 'drizzle-orm';
import { notificationPreferences } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';

export async function updatePreferencesHandler(
	user: App.User,
	data: { type: string; pushEnabled?: boolean; inAppEnabled?: boolean },
	env: Cloudflare.Env
): Promise<void> {
	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const existing = await db
		.select({ id: notificationPreferences.id })
		.from(notificationPreferences)
		.where(
			and(
				eq(notificationPreferences.userId, user.id),
				eq(notificationPreferences.type, data.type)
			)
		)
		.limit(1);

	if (existing.length > 0) {
		const updates: Record<string, unknown> = { updatedAt: now };
		if (data.pushEnabled !== undefined) updates.pushEnabled = data.pushEnabled;
		if (data.inAppEnabled !== undefined) updates.inAppEnabled = data.inAppEnabled;

		await db
			.update(notificationPreferences)
			.set(updates)
			.where(eq(notificationPreferences.id, existing[0].id));
	} else {
		await db.insert(notificationPreferences).values({
			id: crypto.randomUUID(),
			userId: user.id,
			type: data.type,
			pushEnabled: data.pushEnabled ?? true,
			inAppEnabled: data.inAppEnabled ?? true,
			updatedAt: now
		});
	}
}
