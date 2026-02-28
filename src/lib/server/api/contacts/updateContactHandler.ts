import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { contacts, clients, suppliers } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { UpdateContactInput } from '$lib/schemas/contact';

export async function updateContactHandler(
	user: App.User,
	businessId: string,
	contactId: string,
	data: UpdateContactInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'contact:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [updated] = await db
		.update(contacts)
		.set({
			...(data.name     !== undefined && { name:    data.name }),
			...(data.email    !== undefined && { email:   data.email }),
			...(data.phone    !== undefined && { phone:   data.phone }),
			...(data.address  !== undefined && { address: data.address }),
			...(data.taxId    !== undefined && { taxId:   data.taxId }),
			updatedAt: now,
			updatedBy: user.id,
		})
		.where(and(eq(contacts.id, contactId), eq(contacts.businessId, businessId), isNull(contacts.deletedAt)))
		.returning();

	if (!updated) throw new HTTPException(404, { message: 'Contact not found' });

	// Sync client role
	if (data.isClient !== undefined) {
		const [existing] = await db
			.select()
			.from(clients)
			.where(and(eq(clients.businessId, businessId), eq(clients.contactId, contactId)))
			.limit(1);

		if (data.isClient && !existing) {
			await db.insert(clients).values({
				id:         crypto.randomUUID(),
				businessId,
				contactId,
				createdAt:  now,
				createdBy:  user.id,
			});
		} else if (!data.isClient && existing) {
			await db.delete(clients)
				.where(and(eq(clients.businessId, businessId), eq(clients.contactId, contactId)));
		}
	}

	// Sync supplier role
	if (data.isSupplier !== undefined) {
		const [existing] = await db
			.select()
			.from(suppliers)
			.where(and(eq(suppliers.businessId, businessId), eq(suppliers.contactId, contactId)))
			.limit(1);

		if (data.isSupplier && !existing) {
			await db.insert(suppliers).values({
				id:         crypto.randomUUID(),
				businessId,
				contactId,
				createdAt:  now,
				createdBy:  user.id,
			});
		} else if (!data.isSupplier && existing) {
			await db.delete(suppliers)
				.where(and(eq(suppliers.businessId, businessId), eq(suppliers.contactId, contactId)));
		}
	}

	// Re-check roles for the response
	const [clientRow, supplierRow] = await Promise.all([
		db.select().from(clients)
			.where(and(eq(clients.businessId, businessId), eq(clients.contactId, contactId)))
			.limit(1),
		db.select().from(suppliers)
			.where(and(eq(suppliers.businessId, businessId), eq(suppliers.contactId, contactId)))
			.limit(1),
	]);

	return {
		...updated,
		isClient:   clientRow.length > 0,
		isSupplier: supplierRow.length > 0,
	};
}
