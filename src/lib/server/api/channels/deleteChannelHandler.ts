import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { salesChannels } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function deleteChannelHandler(
	user: App.User,
	businessId: string,
	channelId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'business:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [deleted] = await db
		.update(salesChannels)
		.set({ deletedAt: now, deletedBy: user.id })
		.where(
			and(
				eq(salesChannels.id, channelId),
				eq(salesChannels.businessId, businessId),
				isNull(salesChannels.deletedAt)
			)
		)
		.returning();

	if (!deleted) throw new HTTPException(404, { message: 'Sales channel not found' });

	return { success: true };
}
