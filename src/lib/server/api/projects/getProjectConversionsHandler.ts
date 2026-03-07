import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { projects, projectConversions, quotes, transactions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function getProjectConversionsHandler(
	user: App.User,
	businessId: string,
	projectId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'project:view', env);

	const db = drizzle(env.DB, { schema });

	// Verify project
	const [project] = await db
		.select({ id: projects.id })
		.from(projects)
		.where(and(eq(projects.id, projectId), eq(projects.businessId, businessId), isNull(projects.deletedAt)))
		.limit(1);
	if (!project) throw new HTTPException(404, { message: 'Project not found' });

	const conversionRows = await db
		.select()
		.from(projectConversions)
		.where(eq(projectConversions.projectId, projectId));

	const result = [];
	for (const conv of conversionRows) {
		let docInfo: { amount: number; date: string; docNo: string | null } | null = null;

		if (conv.quoteId) {
			const [q] = await db
				.select({ amount: quotes.amount, quoteDate: quotes.quoteDate, quoteNo: quotes.quoteNo })
				.from(quotes)
				.where(eq(quotes.id, conv.quoteId))
				.limit(1);
			if (q) docInfo = { amount: q.amount, date: q.quoteDate, docNo: q.quoteNo };
		} else if (conv.transactionId) {
			const [t] = await db
				.select({ amount: transactions.amount, transactionDate: transactions.transactionDate, invoiceNo: transactions.invoiceNo })
				.from(transactions)
				.where(eq(transactions.id, conv.transactionId))
				.limit(1);
			if (t) docInfo = { amount: t.amount, date: t.transactionDate, docNo: t.invoiceNo };
		}

		result.push({
			...conv,
			type: conv.quoteId ? 'quote' : 'transaction',
			docId: conv.quoteId ?? conv.transactionId,
			...(docInfo ?? { amount: 0, date: '', docNo: null }),
		});
	}

	return result;
}
