import { redirect } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { businesses, locations } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { checkBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, platform }) => {
	if (!locals.user) throw redirect(307, '/login');

	const { businessId } = params;
	const env = platform!.env;

	const allowed = await checkBusinessPermission(locals.user.id, businessId, 'transaction:view', env);
	if (!allowed) throw redirect(307, `/businesses/${businessId}`);

	const db = drizzle(env.DB, { schema });

	const [[biz], locs] = await Promise.all([
		db.select().from(businesses)
			.where(and(eq(businesses.id, businessId), isNull(businesses.deletedAt)))
			.limit(1),
		db.select({ id: locations.id, name: locations.name })
			.from(locations)
			.where(and(eq(locations.businessId, businessId), isNull(locations.deletedAt))),
	]);

	if (!biz) throw redirect(307, '/businesses');

	return { business: biz, locations: locs };
};
