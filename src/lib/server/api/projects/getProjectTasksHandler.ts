import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, desc, inArray, sum } from 'drizzle-orm';
import { projects, projectTasks, projectConversionItems, projectConversions, projectTimeEntries } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function getProjectTasksHandler(
	user: App.User,
	businessId: string,
	projectId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'project:view', env);

	const db = drizzle(env.DB, { schema });

	// Verify project exists
	const [project] = await db
		.select({ id: projects.id })
		.from(projects)
		.where(and(eq(projects.id, projectId), eq(projects.businessId, businessId), isNull(projects.deletedAt)))
		.limit(1);
	if (!project) throw new HTTPException(404, { message: 'Project not found' });

	const tasks = await db
		.select()
		.from(projectTasks)
		.where(eq(projectTasks.projectId, projectId))
		.orderBy(desc(projectTasks.sortOrder));

	// Resolve billing status: which tasks have been converted
	const billedTaskIds = new Set<string>();
	const taskConversionMap: Record<string, { conversionId: string; quoteId: string | null; transactionId: string | null }[]> = {};

	if (tasks.length > 0) {
		const taskIds = tasks.map((t) => t.id);
		const convItems = await db
			.select({
				taskId: projectConversionItems.taskId,
				conversionId: projectConversionItems.conversionId,
				quoteId: projectConversions.quoteId,
				transactionId: projectConversions.transactionId,
			})
			.from(projectConversionItems)
			.innerJoin(projectConversions, eq(projectConversions.id, projectConversionItems.conversionId))
			.where(inArray(projectConversionItems.taskId, taskIds));

		for (const row of convItems) {
			billedTaskIds.add(row.taskId);
			if (!taskConversionMap[row.taskId]) taskConversionMap[row.taskId] = [];
			taskConversionMap[row.taskId].push({
				conversionId: row.conversionId,
				quoteId: row.quoteId,
				transactionId: row.transactionId,
			});
		}
	}

	// Resolve tracked time per task
	const trackedMinutes: Record<string, number> = {};
	if (tasks.length > 0) {
		const taskIds = tasks.map((t) => t.id);
		const timeRows = await db
			.select({
				taskId: projectTimeEntries.taskId,
				total: sum(projectTimeEntries.durationMinutes),
			})
			.from(projectTimeEntries)
			.where(inArray(projectTimeEntries.taskId, taskIds))
			.groupBy(projectTimeEntries.taskId);
		for (const row of timeRows) {
			trackedMinutes[row.taskId] = Number(row.total ?? 0);
		}
	}

	return tasks.map((t) => ({
		...t,
		billed: billedTaskIds.has(t.id),
		conversions: taskConversionMap[t.id] ?? [],
		totalTrackedMinutes: trackedMinutes[t.id] ?? 0,
	}));
}
