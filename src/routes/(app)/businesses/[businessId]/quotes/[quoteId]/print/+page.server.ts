import { redirect } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { quotes, businesses, locations, categories, salesChannels, quoteItems, contacts } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { checkBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, platform }) => {
	if (!locals.user) throw redirect(307, '/login');

	const { businessId, quoteId } = params;
	const env = platform!.env;

	const allowed = await checkBusinessPermission(locals.user.id, businessId, 'quote:view', env);
	if (!allowed) throw redirect(307, `/businesses/${businessId}`);

	const db = drizzle(env.DB, { schema });

	const [[q], [biz], locs, cats, chans, items] = await Promise.all([
		db.select().from(quotes)
			.where(and(eq(quotes.id, quoteId), eq(quotes.businessId, businessId), isNull(quotes.deletedAt)))
			.limit(1),
		db.select().from(businesses)
			.where(and(eq(businesses.id, businessId), isNull(businesses.deletedAt)))
			.limit(1),
		db.select().from(locations).where(and(eq(locations.businessId, businessId), isNull(locations.deletedAt))),
		db.select().from(categories).where(and(eq(categories.businessId, businessId), isNull(categories.deletedAt))),
		db.select().from(salesChannels).where(and(eq(salesChannels.businessId, businessId), isNull(salesChannels.deletedAt))),
		db.select().from(quoteItems)
			.where(eq(quoteItems.quoteId, quoteId))
			.orderBy(asc(quoteItems.sortOrder)),
	]);

	if (!q || !biz) throw redirect(307, `/businesses/${businessId}/quotes`);

	const location = locs.find((l) => l.id === q.locationId) ?? null;
	const category = cats.find((c) => c.id === q.categoryId) ?? null;

	const contact = q.contactId
		? await db.select().from(contacts)
			.where(and(eq(contacts.id, q.contactId), isNull(contacts.deletedAt)))
			.limit(1).then((r) => r[0] ?? null)
		: null;

	return { quote: q, business: biz, location, category, items, contact };
};
