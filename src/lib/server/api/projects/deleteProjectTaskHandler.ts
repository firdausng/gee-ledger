import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, sum } from 'drizzle-orm';
import { projects, projectTasks, projectConversionItems } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function deleteProjectTaskHandler(
	user: App.User,
	businessId: string,
	projectId: string,
	taskId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'project:edit', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	// Verify project exists
	const [project] = await db
		.select({ id: projects.id })
		.from(projects)
		.where(and(eq(projects.id, projectId), eq(projects.businessId, businessId), isNull(projects.deletedAt)))
		.limit(1);
	if (!project) throw new HTTPException(404, { message: 'Project not found' });

	// Check if task is already billed
	const [billedCheck] = await db
		.select({ conversionId: projectConversionItems.conversionId })
		.from(projectConversionItems)
		.where(eq(projectConversionItems.taskId, taskId))
		.limit(1);
	if (billedCheck) {
		throw new HTTPException(400, { message: 'Cannot delete a task that has been billed' });
	}

	const deleted = await db
		.delete(projectTasks)
		.where(and(eq(projectTasks.id, taskId), eq(projectTasks.projectId, projectId)))
		.returning();

	if (deleted.length === 0) throw new HTTPException(404, { message: 'Task not found' });

	// Recalc estimatedAmount
	const [sumResult] = await db
		.select({ total: sum(projectTasks.estimatedCost) })
		.from(projectTasks)
		.where(eq(projectTasks.projectId, projectId));
	await db
		.update(projects)
		.set({ estimatedAmount: Number(sumResult?.total ?? 0), updatedAt: now, updatedBy: user.id })
		.where(eq(projects.id, projectId));

	return { success: true };
}
