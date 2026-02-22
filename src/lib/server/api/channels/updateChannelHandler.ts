import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { salesChannels } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { UpdateChannelInput } from '$lib/schemas/channel';

export async function updateChannelHandler(
	user: App.User,
	businessId: string,
	channelId: string,
	data: UpdateChannelInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'business:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [updated] = await db
		.update(salesChannels)
		.set({
			...(data.name !== undefined && { name: data.name }),
			...(data.type !== undefined && { type: data.type }),
			...(data.isActive !== undefined && { isActive: data.isActive }),
			updatedAt: now,
			updatedBy: user.id
		})
		.where(
			and(
				eq(salesChannels.id, channelId),
				eq(salesChannels.businessId, businessId),
				isNull(salesChannels.deletedAt)
			)
		)
		.returning();

	if (!updated) throw new HTTPException(404, { message: 'Sales channel not found' });

	return updated;
}
