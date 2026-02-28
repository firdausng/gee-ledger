import { drizzle } from 'drizzle-orm/d1';
import { contacts, clients, suppliers } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { CreateContactInput } from '$lib/schemas/contact';

export async function createContactHandler(
	user: App.User,
	businessId: string,
	data: CreateContactInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'contact:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();
	const contactId = crypto.randomUUID();

	const inserts: Parameters<typeof db.batch>[0][number][] = [
		db.insert(contacts).values({
			id:         contactId,
			businessId,
			name:       data.name,
			email:      data.email ?? null,
			phone:      data.phone ?? null,
			address:    data.address ?? null,
			taxId:      data.taxId ?? null,
			createdAt:  now,
			createdBy:  user.id,
			updatedAt:  now,
			updatedBy:  user.id,
		}),
	];

	if (data.isClient) {
		inserts.push(
			db.insert(clients).values({
				id:         crypto.randomUUID(),
				businessId,
				contactId,
				createdAt:  now,
				createdBy:  user.id,
			})
		);
	}

	if (data.isSupplier) {
		inserts.push(
			db.insert(suppliers).values({
				id:         crypto.randomUUID(),
				businessId,
				contactId,
				createdAt:  now,
				createdBy:  user.id,
			})
		);
	}

	await db.batch(inserts as [typeof inserts[0], ...typeof inserts]);

	return {
		id:         contactId,
		businessId,
		name:       data.name,
		email:      data.email ?? null,
		phone:      data.phone ?? null,
		address:    data.address ?? null,
		taxId:      data.taxId ?? null,
		isClient:   data.isClient ?? false,
		isSupplier: data.isSupplier ?? false,
		createdAt:  now,
		updatedAt:  now,
	};
}
