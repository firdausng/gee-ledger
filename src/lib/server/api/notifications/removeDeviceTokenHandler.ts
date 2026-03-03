import { drizzle } from 'drizzle-orm/d1';
import { and, eq } from 'drizzle-orm';
import { deviceTokens } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';

export async function removeDeviceTokenHandler(
	user: App.User,
	token: string,
	env: Cloudflare.Env
): Promise<void> {
	const db = drizzle(env.DB, { schema });

	await db
		.delete(deviceTokens)
		.where(and(eq(deviceTokens.token, token), eq(deviceTokens.userId, user.id)));
}
