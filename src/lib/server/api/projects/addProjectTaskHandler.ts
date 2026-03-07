import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, sum } from 'drizzle-orm';
import { projects, projectTasks } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { CreateProjectTaskInput } from '$lib/schemas/project';

export async function addProjectTaskHandler(
	user: App.User,
	businessId: string,
	projectId: string,
	data: CreateProjectTaskInput,
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

	const [task] = await db
		.insert(projectTasks)
		.values({
			id: crypto.randomUUID(),
			projectId,
			title: data.title,
			description: data.description ?? null,
			status: data.status ?? 'todo',
			billingMode: data.billingMode ?? 'fixed',
			estimatedCost: data.estimatedCost ?? 0,
			hourlyRate: data.hourlyRate ?? null,
			sortOrder: data.sortOrder ?? 0,
			createdAt: now,
			updatedAt: now,
		})
		.returning();

	// Recalc estimatedAmount
	const [sumResult] = await db
		.select({ total: sum(projectTasks.estimatedCost) })
		.from(projectTasks)
		.where(eq(projectTasks.projectId, projectId));
	await db
		.update(projects)
		.set({ estimatedAmount: Number(sumResult?.total ?? 0), updatedAt: now, updatedBy: user.id })
		.where(eq(projects.id, projectId));

	return task;
}
