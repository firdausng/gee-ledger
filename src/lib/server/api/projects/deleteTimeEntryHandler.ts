import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { projects, projectTimeEntries } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function deleteTimeEntryHandler(
	user: App.User,
	businessId: string,
	projectId: string,
	entryId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'project:edit', env);

	const db = drizzle(env.DB, { schema });

	// Verify project
	const [project] = await db
		.select({ id: projects.id })
		.from(projects)
		.where(and(eq(projects.id, projectId), eq(projects.businessId, businessId), isNull(projects.deletedAt)))
		.limit(1);
	if (!project) throw new HTTPException(404, { message: 'Project not found' });

	const deleted = await db
		.delete(projectTimeEntries)
		.where(and(eq(projectTimeEntries.id, entryId), eq(projectTimeEntries.projectId, projectId)))
		.returning();

	if (deleted.length === 0) throw new HTTPException(404, { message: 'Time entry not found' });

	return { success: true };
}
