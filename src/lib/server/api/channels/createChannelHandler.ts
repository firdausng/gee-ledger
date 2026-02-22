import { drizzle } from 'drizzle-orm/d1';
import { salesChannels } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { CreateChannelInput } from '$lib/schemas/channel';

export async function createChannelHandler(
	user: App.User,
	businessId: string,
	data: CreateChannelInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'business:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [channel] = await db
		.insert(salesChannels)
		.values({
			id: crypto.randomUUID(),
			businessId,
			name: data.name,
			type: data.type,
			createdAt: now,
			createdBy: user.id,
			updatedAt: now,
			updatedBy: user.id
		})
		.returning();

	return channel;
}
