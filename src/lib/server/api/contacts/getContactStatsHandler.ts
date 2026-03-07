import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, count, sum, desc, countDistinct } from 'drizzle-orm';
import {
	contacts, transactions, transactionItems, quotes, projects, projectTimeEntries
} from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function getContactStatsHandler(
	user: App.User,
	businessId: string,
	contactId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });

	// Verify contact exists
	const [contact] = await db
		.select({ id: contacts.id })
		.from(contacts)
		.where(and(eq(contacts.id, contactId), eq(contacts.businessId, businessId), isNull(contacts.deletedAt)))
		.limit(1);
	if (!contact) throw new HTTPException(404, { message: 'Contact not found' });

	// Transaction stats by type
	const txConditions = and(
		eq(transactions.contactId, contactId),
		eq(transactions.businessId, businessId),
		isNull(transactions.deletedAt)
	);

	const [txStats, productStats, quoteStats, projectStats, trackedTimeStats, recentTx] = await Promise.all([
		// Transaction counts and sums
		db.select({
			type: transactions.type,
			total: count(),
			totalAmount: sum(transactions.amount),
		})
			.from(transactions)
			.where(txConditions)
			.groupBy(transactions.type),

		// Product stats from transaction items
		db.select({
			uniqueProducts: countDistinct(transactionItems.productId),
			totalQuantity: sum(transactionItems.quantity),
		})
			.from(transactionItems)
			.innerJoin(transactions, eq(transactions.id, transactionItems.transactionId))
			.where(and(txConditions, isNull(transactions.deletedAt))),

		// Quote stats
		db.select({
			total: count(),
			totalAmount: sum(quotes.amount),
		})
			.from(quotes)
			.where(and(
				eq(quotes.contactId, contactId),
				eq(quotes.businessId, businessId),
				isNull(quotes.deletedAt)
			)),

		// Project stats
		db.select({
			total: count(),
		})
			.from(projects)
			.where(and(
				eq(projects.contactId, contactId),
				eq(projects.businessId, businessId),
				isNull(projects.deletedAt)
			)),

		// Total tracked time across projects for this contact
		db.select({
			totalMinutes: sum(projectTimeEntries.durationMinutes),
		})
			.from(projectTimeEntries)
			.innerJoin(projects, eq(projects.id, projectTimeEntries.projectId))
			.where(and(
				eq(projects.contactId, contactId),
				eq(projects.businessId, businessId),
				isNull(projects.deletedAt)
			)),

		// Recent transactions (last 5)
		db.select({
			id: transactions.id,
			type: transactions.type,
			originalAmount: transactions.originalAmount,
			originalCurrency: transactions.originalCurrency,
			amount: transactions.amount,
			note: transactions.note,
			transactionDate: transactions.transactionDate,
			invoiceNo: transactions.invoiceNo,
			receiptNo: transactions.receiptNo,
		})
			.from(transactions)
			.where(txConditions)
			.orderBy(desc(transactions.transactionDate))
			.limit(5),
	]);

	// Parse transaction stats
	let incomeCount = 0, expenseCount = 0, totalIncome = 0, totalExpense = 0;
	for (const row of txStats) {
		if (row.type === 'income') {
			incomeCount = row.total;
			totalIncome = Number(row.totalAmount ?? 0);
		} else {
			expenseCount = row.total;
			totalExpense = Number(row.totalAmount ?? 0);
		}
	}

	// Last transaction date
	const lastTransactionDate = recentTx.length > 0 ? recentTx[0].transactionDate : null;

	return {
		transactions: {
			total: incomeCount + expenseCount,
			incomeCount,
			expenseCount,
			totalIncome,
			totalExpense,
			lastTransactionDate,
		},
		products: {
			uniqueCount: Number(productStats[0]?.uniqueProducts ?? 0),
			totalQuantity: Number(productStats[0]?.totalQuantity ?? 0),
		},
		quotes: {
			total: quoteStats[0]?.total ?? 0,
			totalAmount: Number(quoteStats[0]?.totalAmount ?? 0),
		},
		projects: {
			total: projectStats[0]?.total ?? 0,
			totalTrackedMinutes: Number(trackedTimeStats[0]?.totalMinutes ?? 0),
		},
		recentTransactions: recentTx,
	};
}
