import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, gte, lte, count, desc, inArray, asc } from 'drizzle-orm';
import { quotes, contacts, quoteItems } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { QuoteFilters } from '$lib/schemas/quote';

export async function getQuotesHandler(
	user: App.User,
	businessId: string,
	filters: QuoteFilters,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'quote:view', env);

	const db = drizzle(env.DB, { schema });
	const page = filters.page ?? 1;
	const perPage = filters.perPage ?? 10;
	const offset = (page - 1) * perPage;

	const conditions = [eq(quotes.businessId, businessId), isNull(quotes.deletedAt)];

	if (filters.status) conditions.push(eq(quotes.status, filters.status));
	if (filters.contactId) conditions.push(eq(quotes.contactId, filters.contactId));
	if (filters.from) conditions.push(gte(quotes.quoteDate, filters.from));
	if (filters.to) conditions.push(lte(quotes.quoteDate, `${filters.to}T23:59:59`));

	const [totalResult, rows] = await Promise.all([
		db.select({ total: count() }).from(quotes).where(and(...conditions)),
		db.select().from(quotes).where(and(...conditions))
			.orderBy(desc(quotes.quoteDate), desc(quotes.createdAt))
			.limit(perPage)
			.offset(offset)
	]);

	const total = totalResult[0]?.total ?? 0;

	// Resolve contact names
	const contactNames: Record<string, string> = {};
	const contactIds = [...new Set(rows.map((q) => q.contactId).filter(Boolean) as string[])];
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
	const noNoteIds = rows.filter((q) => !q.note).map((q) => q.id);
	if (noNoteIds.length > 0) {
		const itemRows = await db
			.select({
				quoteId: quoteItems.quoteId,
				description: quoteItems.description,
				sortOrder: quoteItems.sortOrder,
			})
			.from(quoteItems)
			.where(inArray(quoteItems.quoteId, noNoteIds))
			.orderBy(asc(quoteItems.sortOrder));
		for (const row of itemRows) {
			if (!(row.quoteId in firstItemDesc)) {
				firstItemDesc[row.quoteId] = row.description;
			}
		}
	}

	const data = rows.map((q) => ({
		...q,
		contactName: q.contactId ? (contactNames[q.contactId] ?? null) : null,
		firstItemDescription: firstItemDesc[q.id] ?? null
	}));

	return { data, total, page, perPage };
}
