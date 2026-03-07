import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { projects, projectTasks, projectTimeEntries } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function getTimeEntriesHandler(
	user: App.User,
	businessId: string,
	projectId: string,
	taskId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'project:view', env);

	const db = drizzle(env.DB, { schema });

	// Verify project + task
	const [project] = await db
		.select({ id: projects.id })
		.from(projects)
		.where(and(eq(projects.id, projectId), eq(projects.businessId, businessId), isNull(projects.deletedAt)))
		.limit(1);
	if (!project) throw new HTTPException(404, { message: 'Project not found' });

	const [task] = await db
		.select({ id: projectTasks.id })
		.from(projectTasks)
		.where(and(eq(projectTasks.id, taskId), eq(projectTasks.projectId, projectId)))
		.limit(1);
	if (!task) throw new HTTPException(404, { message: 'Task not found' });

	return db
		.select()
		.from(projectTimeEntries)
		.where(eq(projectTimeEntries.taskId, taskId))
		.orderBy(desc(projectTimeEntries.startedAt));
}
