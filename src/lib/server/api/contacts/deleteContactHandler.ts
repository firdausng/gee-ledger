import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { contacts } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function deleteContactHandler(
	user: App.User,
	businessId: string,
	contactId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'contact:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [deleted] = await db
		.update(contacts)
		.set({ deletedAt: now, deletedBy: user.id })
		.where(and(eq(contacts.id, contactId), eq(contacts.businessId, businessId), isNull(contacts.deletedAt)))
		.returning();

	if (!deleted) throw new HTTPException(404, { message: 'Contact not found' });

	return { id: contactId };
}
