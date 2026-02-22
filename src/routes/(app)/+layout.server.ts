import { redirect } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { businesses, userBusinessRoles } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	if (!locals.user) throw redirect(307, '/login');

	const db = drizzle(platform!.env.DB, { schema });

	const roles = await db
		.select({ businessId: userBusinessRoles.businessId })
		.from(userBusinessRoles)
		.where(eq(userBusinessRoles.userId, locals.user.id));

	let navBusinesses: { id: string; name: string; currency: string }[] = [];

	if (roles.length > 0) {
		const ids = roles.map((r) => r.businessId);
		navBusinesses = await db
			.select({ id: businesses.id, name: businesses.name, currency: businesses.currency })
			.from(businesses)
			.where(and(inArray(businesses.id, ids), isNull(businesses.deletedAt)));
	}

	return { user: locals.user, navBusinesses };
};
