import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { quotes } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function deleteQuoteHandler(
	user: App.User,
	businessId: string,
	quoteId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'quote:delete', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [deleted] = await db
		.update(quotes)
		.set({ deletedAt: now, deletedBy: user.id })
		.where(
			and(
				eq(quotes.id, quoteId),
				eq(quotes.businessId, businessId),
				isNull(quotes.deletedAt)
			)
		)
		.returning();

	if (!deleted) throw new HTTPException(404, { message: 'Quote not found' });

	return { success: true };
}
