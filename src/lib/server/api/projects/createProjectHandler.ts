import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, inArray, count } from 'drizzle-orm';
import { projects } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { getBusinessPlanKey } from '$lib/server/utils/businessPermissions';
import { PLANS } from '$lib/configurations/plans';
import { HTTPException } from 'hono/http-exception';
import type { CreateProjectInput } from '$lib/schemas/project';

export async function createProjectHandler(
	user: App.User,
	businessId: string,
	data: CreateProjectInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'project:create', env);

	const db = drizzle(env.DB, { schema });

	// Enforce active project limit
	const activeStatuses = ['draft', 'active', 'on-hold'];
	const [countResult] = await db
		.select({ total: count() })
		.from(projects)
		.where(
			and(
				eq(projects.businessId, businessId),
				isNull(projects.deletedAt),
				inArray(projects.status, activeStatuses)
			)
		);

	const planKey = await getBusinessPlanKey(businessId, env);
	const limit = PLANS[planKey].limits.maxActiveProjects;
	if (limit !== -1 && (countResult?.total ?? 0) >= limit) {
		throw new HTTPException(403, {
			message: `Active project limit reached (${limit}). Upgrade your plan or complete/cancel existing projects.`
		});
	}

	const now = new Date().toISOString();

	const [project] = await db
		.insert(projects)
		.values({
			id: crypto.randomUUID(),
			businessId,
			name: data.name,
			description: data.description ?? null,
			contactId: data.contactId ?? null,
			status: data.status ?? 'draft',
			estimatedAmount: 0,
			createdAt: now,
			createdBy: user.id,
			updatedAt: now,
			updatedBy: user.id,
		})
		.returning();

	return project;
}
