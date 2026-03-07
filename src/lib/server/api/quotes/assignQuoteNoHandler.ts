import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { quotes, businesses } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function assignQuoteNoHandler(
	user: App.User,
	businessId: string,
	quoteId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'quote:view', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

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

	if (quote.quoteNo) return { quoteNo: quote.quoteNo };

	const [biz] = await db
		.select()
		.from(businesses)
		.where(and(eq(businesses.id, businessId), isNull(businesses.deletedAt)))
		.limit(1);

	if (!biz) throw new HTTPException(404, { message: 'Business not found' });

	const n = biz.nextQuoteNo;
	const quoteNo = `QUOTE-${String(n).padStart(4, '0')}`;

	await db
		.update(quotes)
		.set({ quoteNo, updatedAt: now, updatedBy: user.id })
		.where(eq(quotes.id, quoteId));

	await db
		.update(businesses)
		.set({ nextQuoteNo: n + 1, updatedAt: now, updatedBy: user.id })
		.where(eq(businesses.id, businessId));

	return { quoteNo };
}
