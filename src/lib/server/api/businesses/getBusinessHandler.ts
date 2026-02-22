import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { businesses } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { getUserBusinessRole } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function getBusinessHandler(
	user: App.User,
	businessId: string,
	env: Cloudflare.Env
) {
	const db = drizzle(env.DB, { schema });

	const role = await getUserBusinessRole(user.id, businessId, env);
	if (!role) throw new HTTPException(404, { message: 'Business not found' });

	const [business] = await db
		.select()
		.from(businesses)
		.where(and(eq(businesses.id, businessId), isNull(businesses.deletedAt)))
		.limit(1);

	if (!business) throw new HTTPException(404, { message: 'Business not found' });

	return { ...business, policyKey: role };
}
