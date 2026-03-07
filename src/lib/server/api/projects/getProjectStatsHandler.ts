import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, count } from 'drizzle-orm';
import { transactions, quotes, contacts } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';

export async function getProjectStatsHandler(
	user: App.User,
	businessId: string,
	projectId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });

	const [txCount, quoteCount] = await Promise.all([
		db
			.select({ total: count() })
			.from(transactions)
			.where(and(
				eq(transactions.businessId, businessId),
				eq(transactions.projectId, projectId),
				isNull(transactions.deletedAt)
			)),
		db
			.select({ total: count() })
			.from(quotes)
			.where(and(
				eq(quotes.businessId, businessId),
				eq(quotes.projectId, projectId),
				isNull(quotes.deletedAt)
			)),
	]);

	return {
		transactionCount: txCount[0]?.total ?? 0,
		quoteCount: quoteCount[0]?.total ?? 0,
	};
}
