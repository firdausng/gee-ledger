import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, sum } from 'drizzle-orm';
import { projects, projectTasks } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { UpdateProjectTaskInput } from '$lib/schemas/project';

export async function updateProjectTaskHandler(
	user: App.User,
	businessId: string,
	projectId: string,
	taskId: string,
	data: UpdateProjectTaskInput,
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

	const updates: Record<string, unknown> = { updatedAt: now };
	if (data.title !== undefined) updates.title = data.title;
	if (data.description !== undefined) updates.description = data.description;
	if (data.status !== undefined) updates.status = data.status;
	if (data.billingMode !== undefined) updates.billingMode = data.billingMode;
	if (data.estimatedCost !== undefined) updates.estimatedCost = data.estimatedCost;
	if (data.hourlyRate !== undefined) updates.hourlyRate = data.hourlyRate;
	if (data.actualCost !== undefined) updates.actualCost = data.actualCost;
	if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

	const [updated] = await db
		.update(projectTasks)
		.set(updates)
		.where(and(eq(projectTasks.id, taskId), eq(projectTasks.projectId, projectId)))
		.returning();

	if (!updated) throw new HTTPException(404, { message: 'Task not found' });

	// Recalc estimatedAmount if cost changed
	if (data.estimatedCost !== undefined) {
		const [sumResult] = await db
			.select({ total: sum(projectTasks.estimatedCost) })
			.from(projectTasks)
			.where(eq(projectTasks.projectId, projectId));
		await db
			.update(projects)
			.set({ estimatedAmount: Number(sumResult?.total ?? 0), updatedAt: now, updatedBy: user.id })
			.where(eq(projects.id, projectId));
	}

	return updated;
}
