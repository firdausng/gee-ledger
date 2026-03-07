import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { quotes } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function getQuoteHandler(
	user: App.User,
	businessId: string,
	quoteId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'quote:view', env);

	const db = drizzle(env.DB, { schema });

	const [quote] = await db
		.select()
		.from(quotes)
		.where(
			and(
				eq(quotes.id, quoteId),
				eq(quotes.businessId, businessId),
				isNull(quotes.deletedAt)
			)
		)
		.limit(1);

	if (!quote) throw new HTTPException(404, { message: 'Quote not found' });

	return quote;
}
