import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { projects, projectTasks, projectTimeEntries } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { CreateTimeEntryInput } from '$lib/schemas/project';

export async function createTimeEntryHandler(
	user: App.User,
	businessId: string,
	projectId: string,
	taskId: string,
	data: CreateTimeEntryInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'project:edit', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

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

	// Manual entry: compute startedAt/stoppedAt from duration
	const stoppedAt = now;
	const startedAt = new Date(new Date(now).getTime() - data.durationMinutes * 60000).toISOString();

	const [entry] = await db
		.insert(projectTimeEntries)
		.values({
			id: crypto.randomUUID(),
			taskId,
			projectId,
			userId: user.id,
			startedAt,
			stoppedAt,
			durationMinutes: data.durationMinutes,
			note: data.note ?? null,
		})
		.returning();

	return entry;
}
