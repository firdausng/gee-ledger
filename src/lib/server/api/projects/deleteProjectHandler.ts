import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { projects } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function deleteProjectHandler(
	user: App.User,
	businessId: string,
	projectId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'project:delete', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [deleted] = await db
		.update(projects)
		.set({ deletedAt: now, deletedBy: user.id })
		.where(
			and(
				eq(projects.id, projectId),
				eq(projects.businessId, businessId),
				isNull(projects.deletedAt)
			)
		)
		.returning();

	if (!deleted) throw new HTTPException(404, { message: 'Project not found' });

	return { success: true };
}
