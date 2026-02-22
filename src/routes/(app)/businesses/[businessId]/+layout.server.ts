import { redirect } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { businesses, userBusinessRoles } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform, params }) => {
	if (!locals.user) throw redirect(307, '/login');

	const db = drizzle(platform!.env.DB, { schema });
	const { businessId } = params;

	const [role] = await db
		.select({ policyKey: userBusinessRoles.policyKey })
		.from(userBusinessRoles)
		.where(
			and(
				eq(userBusinessRoles.userId, locals.user.id),
				eq(userBusinessRoles.businessId, businessId)
			)
		)
		.limit(1);

	if (!role) throw redirect(307, '/businesses');

	const [business] = await db
		.select()
		.from(businesses)
		.where(and(eq(businesses.id, businessId), isNull(businesses.deletedAt)))
		.limit(1);

	if (!business) throw redirect(307, '/businesses');

	return { business, policyKey: role.policyKey };
};
