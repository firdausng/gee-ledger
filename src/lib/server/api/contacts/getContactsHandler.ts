import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, desc, like, or, sql } from 'drizzle-orm';
import { contacts, clients, suppliers } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';

export async function getContactsHandler(
	user: App.User,
	businessId: string,
	role: 'client' | 'supplier' | undefined,
	env: Cloudflare.Env,
	search?: string
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });

	const conditions = [eq(contacts.businessId, businessId), isNull(contacts.deletedAt)];

	if (search) {
		const pattern = `%${search}%`;
		conditions.push(
			or(
				sql`lower(${contacts.name}) like lower(${pattern})`,
				sql`lower(${contacts.email}) like lower(${pattern})`
			)!
		);
	}

	// Fetch non-deleted contacts for this business
	let rows = await db
		.select()
		.from(contacts)
		.where(and(...conditions))
		.orderBy(desc(contacts.createdAt));

	if (rows.length === 0) return [];

	const contactIds = rows.map((c) => c.id);

	// Fetch role rows within the contacts domain
	const [clientRows, supplierRows] = await Promise.all([
		db.select({ contactId: clients.contactId })
			.from(clients)
			.where(eq(clients.businessId, businessId)),
		db.select({ contactId: suppliers.contactId })
			.from(suppliers)
			.where(eq(suppliers.businessId, businessId)),
	]);

	const clientSet   = new Set(clientRows.map((r) => r.contactId));
	const supplierSet = new Set(supplierRows.map((r) => r.contactId));

	const result = rows.map((c) => ({
		...c,
		isClient:   clientSet.has(c.id),
		isSupplier: supplierSet.has(c.id),
	}));

	if (role === 'client')   return result.filter((c) => c.isClient);
	if (role === 'supplier') return result.filter((c) => c.isSupplier);
	return result;
}
