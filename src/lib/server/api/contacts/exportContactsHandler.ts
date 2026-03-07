import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { contacts, clients, suppliers } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { buildCsv } from '$lib/server/utils/csv';
import { formatAddress } from '$lib/utils/address';

export async function exportContactsHandler(
	user: App.User,
	businessId: string,
	env: Cloudflare.Env
): Promise<string> {
	await requireBusinessPermission(user, businessId, 'transaction:export', env);

	const db = drizzle(env.DB, { schema });

	const rows = await db
		.select()
		.from(contacts)
		.where(and(eq(contacts.businessId, businessId), isNull(contacts.deletedAt)));

	const headers = ['Name', 'Email', 'Phone', 'Address Line 1', 'Address Line 2', 'City', 'State', 'Postal Code', 'Country', 'Tax ID', 'Is Client', 'Is Supplier'];

	if (rows.length === 0) {
		return buildCsv(headers, []);
	}

	const [clientRows, supplierRows] = await Promise.all([
		db.select({ contactId: clients.contactId }).from(clients).where(eq(clients.businessId, businessId)),
		db.select({ contactId: suppliers.contactId }).from(suppliers).where(eq(suppliers.businessId, businessId)),
	]);

	const clientSet = new Set(clientRows.map((r) => r.contactId));
	const supplierSet = new Set(supplierRows.map((r) => r.contactId));

	const csvRows = rows.map((c) => [
		c.name,
		c.email ?? '',
		c.phone ?? '',
		c.addressLine1 ?? '',
		c.addressLine2 ?? '',
		c.addressCity ?? '',
		c.addressState ?? '',
		c.addressPostalCode ?? '',
		c.addressCountry ?? '',
		c.taxId ?? '',
		clientSet.has(c.id) ? 'Yes' : 'No',
		supplierSet.has(c.id) ? 'Yes' : 'No',
	]);

	return buildCsv(headers, csvRows);
}
