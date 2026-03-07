import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, count, desc, inArray, sum } from 'drizzle-orm';
import { projects, projectTasks, projectTimeEntries, contacts } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { ProjectFilters } from '$lib/schemas/project';

export async function getProjectsHandler(
	user: App.User,
	businessId: string,
	filters: ProjectFilters,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'project:view', env);

	const db = drizzle(env.DB, { schema });
	const page = filters.page ?? 1;
	const perPage = filters.perPage ?? 10;
	const offset = (page - 1) * perPage;

	const conditions = [eq(projects.businessId, businessId), isNull(projects.deletedAt)];

	if (filters.status) conditions.push(eq(projects.status, filters.status));
	if (filters.contactId) conditions.push(eq(projects.contactId, filters.contactId));

	const [totalResult, rows] = await Promise.all([
		db.select({ total: count() }).from(projects).where(and(...conditions)),
		db.select().from(projects).where(and(...conditions))
			.orderBy(desc(projects.createdAt))
			.limit(perPage)
			.offset(offset)
	]);

	const total = totalResult[0]?.total ?? 0;

	// Resolve task counts
	const taskCounts: Record<string, number> = {};
	if (rows.length > 0) {
		const projectIds = rows.map((p) => p.id);
		const counts = await db
			.select({
				projectId: projectTasks.projectId,
				total: count(),
			})
			.from(projectTasks)
			.where(inArray(projectTasks.projectId, projectIds))
			.groupBy(projectTasks.projectId);
		for (const row of counts) {
			taskCounts[row.projectId] = row.total;
		}
	}

	// Resolve tracked minutes per project
	const trackedMinutes: Record<string, number> = {};
	if (rows.length > 0) {
		const projectIds = rows.map((p) => p.id);
		const timeRows = await db
			.select({
				projectId: projectTimeEntries.projectId,
				total: sum(projectTimeEntries.durationMinutes),
			})
			.from(projectTimeEntries)
			.where(inArray(projectTimeEntries.projectId, projectIds))
			.groupBy(projectTimeEntries.projectId);
		for (const row of timeRows) {
			trackedMinutes[row.projectId] = Number(row.total ?? 0);
		}
	}

	// Resolve contact names
	const contactNames: Record<string, string> = {};
	const contactIds = [...new Set(rows.map((p) => p.contactId).filter(Boolean) as string[])];
	if (contactIds.length > 0) {
		const contactRows = await db
			.select({ id: contacts.id, name: contacts.name })
			.from(contacts)
			.where(and(inArray(contacts.id, contactIds), isNull(contacts.deletedAt)));
		for (const row of contactRows) {
			contactNames[row.id] = row.name;
		}
	}

	const data = rows.map((p) => ({
		...p,
		taskCount: taskCounts[p.id] ?? 0,
		totalTrackedMinutes: trackedMinutes[p.id] ?? 0,
		contactName: p.contactId ? (contactNames[p.contactId] ?? null) : null,
	}));

	return { data, total, page, perPage };
}
