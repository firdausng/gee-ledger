import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, gte, lte, inArray, count, desc, asc } from 'drizzle-orm';
import { transactions, transactionAttachments, attachments, contacts, transactionItems } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { TransactionFilters } from '$lib/schemas/transaction';

export async function getTransactionsHandler(
	user: App.User,
	businessId: string,
	filters: TransactionFilters,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });
	const page = filters.page ?? 1;
	const perPage = filters.perPage ?? 10;
	const offset = (page - 1) * perPage;

	const conditions = [eq(transactions.businessId, businessId), isNull(transactions.deletedAt)];

	if (filters.locationId) conditions.push(eq(transactions.locationId, filters.locationId));
	if (filters.salesChannelId) conditions.push(eq(transactions.salesChannelId, filters.salesChannelId));
	if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
	if (filters.type) conditions.push(eq(transactions.type, filters.type));
	if (filters.from) conditions.push(gte(transactions.transactionDate, filters.from));
	if (filters.to) conditions.push(lte(transactions.transactionDate, `${filters.to}T23:59:59`));

	// Get total count and rows in parallel
	const [totalResult, rows] = await Promise.all([
		db
			.select({ total: count() })
			.from(transactions)
			.where(and(...conditions)),
		db
			.select()
			.from(transactions)
			.where(and(...conditions))
			.orderBy(desc(transactions.transactionDate))
			.limit(perPage)
			.offset(offset)
	]);

	const total = totalResult[0]?.total ?? 0;

	// Fetch attachment counts for the returned transactions
	const attachmentCounts: Record<string, number> = {};
	if (rows.length > 0) {
		const txIds = rows.map((t) => t.id);
		const counts = await db
			.select({
				transactionId: transactionAttachments.transactionId,
				total: count()
			})
			.from(transactionAttachments)
			.innerJoin(attachments, eq(attachments.id, transactionAttachments.attachmentId))
			.where(and(inArray(transactionAttachments.transactionId, txIds), isNull(attachments.deletedAt)))
			.groupBy(transactionAttachments.transactionId);

		for (const row of counts) {
			attachmentCounts[row.transactionId] = row.total;
		}
	}

	// Resolve contact names — separate query, no JOIN (service-extraction boundary)
	const contactNames: Record<string, string> = {};
	const contactIds = [...new Set(rows.map((t) => t.contactId).filter(Boolean) as string[])];
	if (contactIds.length > 0) {
		const contactRows = await db
			.select({ id: contacts.id, name: contacts.name })
			.from(contacts)
			.where(and(inArray(contacts.id, contactIds), isNull(contacts.deletedAt)));
		for (const row of contactRows) {
			contactNames[row.id] = row.name;
		}
	}

	// Resolve first line item description for rows without a note
	const firstItemDesc: Record<string, string> = {};
	const noNoteIds = rows.filter((t) => !t.note).map((t) => t.id);
	if (noNoteIds.length > 0) {
		const itemRows = await db
			.select({
				transactionId: transactionItems.transactionId,
				description: transactionItems.description,
				sortOrder: transactionItems.sortOrder,
			})
			.from(transactionItems)
			.where(inArray(transactionItems.transactionId, noNoteIds))
			.orderBy(asc(transactionItems.sortOrder));
		for (const row of itemRows) {
			if (!(row.transactionId in firstItemDesc)) {
				firstItemDesc[row.transactionId] = row.description;
			}
		}
	}

	const data = rows.map((t) => ({
		...t,
		attachmentCount: attachmentCounts[t.id] ?? 0,
		contactName: t.contactId ? (contactNames[t.contactId] ?? null) : null,
		firstItemDescription: firstItemDesc[t.id] ?? null
	}));

	return { data, total, page, perPage };
}
