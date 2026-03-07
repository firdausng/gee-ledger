import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { projects } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { UpdateProjectInput } from '$lib/schemas/project';

export async function updateProjectHandler(
	user: App.User,
	businessId: string,
	projectId: string,
	data: UpdateProjectInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'project:edit', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const updates: Record<string, unknown> = { updatedAt: now, updatedBy: user.id };
	if (data.name !== undefined) updates.name = data.name;
	if (data.description !== undefined) updates.description = data.description;
	if (data.contactId !== undefined) updates.contactId = data.contactId;
	if (data.status !== undefined) updates.status = data.status;

	const [updated] = await db
		.update(projects)
		.set(updates)
		.where(
			and(
				eq(projects.id, projectId),
				eq(projects.businessId, businessId),
				isNull(projects.deletedAt)
			)
		)
		.returning();

	if (!updated) throw new HTTPException(404, { message: 'Project not found' });

	return updated;
}
