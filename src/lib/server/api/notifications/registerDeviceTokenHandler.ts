import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { deviceTokens } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';

export async function registerDeviceTokenHandler(
	user: App.User,
	data: { token: string; platform?: string },
	env: Cloudflare.Env
): Promise<void> {
	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	// Check if token already exists
	const existing = await db
		.select({ id: deviceTokens.id })
		.from(deviceTokens)
		.where(eq(deviceTokens.token, data.token))
		.limit(1);

	if (existing.length > 0) {
		// Update userId + timestamp (token might have been assigned to a different user)
		await db
			.update(deviceTokens)
			.set({ userId: user.id, updatedAt: now })
			.where(eq(deviceTokens.token, data.token));
	} else {
		await db.insert(deviceTokens).values({
			id: crypto.randomUUID(),
			userId: user.id,
			token: data.token,
			platform: data.platform ?? 'web',
			createdAt: now,
			updatedAt: now
		});
	}
}
