import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import { transactions, categories } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';

type TrendRow = { period: string; income: number; expense: number };
type CategoryRow = { categoryName: string; type: string; total: number };

export async function getDashboardStatsHandler(
	user: App.User,
	businessId: string,
	params: { from: string; to: string; groupBy: 'day' | 'month' },
	env: Cloudflare.Env
): Promise<{
	trend: TrendRow[];
	categoryBreakdown: CategoryRow[];
}> {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });
	const fmt = params.groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

	// Query 1: Trend — income vs expense grouped by period
	const trendRaw = await db.all<{ period: string; type: string; total: number }>(
		sql`SELECT
			strftime(${fmt}, ${transactions.transactionDate}) AS period,
			${transactions.type} AS type,
			COALESCE(SUM(${transactions.amount}), 0) AS total
		FROM ${transactions}
		WHERE ${transactions.businessId} = ${businessId}
			AND ${transactions.deletedAt} IS NULL
			AND ${transactions.transactionDate} >= ${params.from}
			AND ${transactions.transactionDate} <= ${params.to}
		GROUP BY period, type
		ORDER BY period`
	);

	// Pivot rows into { period, income, expense }
	const trendMap = new Map<string, TrendRow>();
	for (const row of trendRaw) {
		if (!trendMap.has(row.period)) {
			trendMap.set(row.period, { period: row.period, income: 0, expense: 0 });
		}
		const entry = trendMap.get(row.period)!;
		if (row.type === 'income') entry.income = row.total;
		else if (row.type === 'expense') entry.expense = row.total;
	}
	const trend = Array.from(trendMap.values());

	// Query 2: Category breakdown — top 8 per type (income + expense)
	const categoryBreakdown = await db.all<CategoryRow>(
		sql`SELECT
			COALESCE(${categories.name}, 'Uncategorized') AS categoryName,
			${transactions.type} AS type,
			COALESCE(SUM(${transactions.amount}), 0) AS total
		FROM ${transactions}
		LEFT JOIN ${categories} ON ${categories.id} = ${transactions.categoryId}
		WHERE ${transactions.businessId} = ${businessId}
			AND ${transactions.deletedAt} IS NULL
			AND ${transactions.transactionDate} >= ${params.from}
			AND ${transactions.transactionDate} <= ${params.to}
		GROUP BY ${transactions.categoryId}, ${transactions.type}
		ORDER BY total DESC
		LIMIT 16`
	);

	return { trend, categoryBreakdown };
}
