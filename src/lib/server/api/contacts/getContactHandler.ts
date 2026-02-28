import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { contacts, clients, suppliers } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function getContactHandler(
	user: App.User,
	businessId: string,
	contactId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });

	const [contact] = await db
		.select()
		.from(contacts)
		.where(and(eq(contacts.id, contactId), eq(contacts.businessId, businessId), isNull(contacts.deletedAt)))
		.limit(1);

	if (!contact) throw new HTTPException(404, { message: 'Contact not found' });

	const [clientRow, supplierRow] = await Promise.all([
		db.select({ contactId: clients.contactId })
			.from(clients)
			.where(and(eq(clients.businessId, businessId), eq(clients.contactId, contactId)))
			.limit(1),
		db.select({ contactId: suppliers.contactId })
			.from(suppliers)
			.where(and(eq(suppliers.businessId, businessId), eq(suppliers.contactId, contactId)))
			.limit(1),
	]);

	return {
		...contact,
		isClient:   clientRow.length > 0,
		isSupplier: supplierRow.length > 0,
	};
}
