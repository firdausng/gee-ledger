import { drizzle } from 'drizzle-orm/d1';
import { eq, and, gte, sql } from 'drizzle-orm';
import { emailSends } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission, getBusinessPlanKey } from '$lib/server/utils/businessPermissions';
import { PLANS } from '$lib/configurations/plans';

export async function getEmailUsageHandler(
	user: App.User,
	businessId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:email', env);

	const db = drizzle(env.DB, { schema });
	const planKey = await getBusinessPlanKey(businessId, env);
	const plan = PLANS[planKey];
	const limit = plan.limits.maxEmailsPerMonth;

	const now = new Date();
	const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00:00.000Z`;

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(emailSends)
		.where(and(eq(emailSends.businessId, businessId), gte(emailSends.createdAt, monthStart)));

	return {
		used: count,
		limit: limit === -1 ? null : limit,
	};
}
