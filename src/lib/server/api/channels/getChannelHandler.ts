import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { salesChannels } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function getChannelHandler(
	user: App.User,
	businessId: string,
	channelId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });

	const [channel] = await db
		.select()
		.from(salesChannels)
		.where(and(eq(salesChannels.id, channelId), eq(salesChannels.businessId, businessId), isNull(salesChannels.deletedAt)))
		.limit(1);

	if (!channel) throw new HTTPException(404, { message: 'Channel not found' });

	return channel;
}
