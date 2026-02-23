import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { businesses } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { UpdateBusinessInput } from '$lib/schemas/business';

export async function updateBusinessHandler(
	user: App.User,
	businessId: string,
	data: UpdateBusinessInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'business:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [updated] = await db
		.update(businesses)
		.set({
			...(data.name        !== undefined && { name:        data.name        }),
			...(data.description !== undefined && { description: data.description }),
			...(data.currency    !== undefined && { currency:    data.currency    }),
			...(data.address     !== undefined && { address:     data.address     }),
			...(data.phone       !== undefined && { phone:       data.phone       }),
			...(data.taxId       !== undefined && { taxId:       data.taxId       }),
			updatedAt: now,
			updatedBy: user.id
		})
		.where(and(eq(businesses.id, businessId), isNull(businesses.deletedAt)))
		.returning();

	if (!updated) throw new HTTPException(404, { message: 'Business not found' });

	return updated;
}
