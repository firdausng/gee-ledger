import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { projects } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function getProjectHandler(
	user: App.User,
	businessId: string,
	projectId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'project:view', env);

	const db = drizzle(env.DB, { schema });

	const [project] = await db
		.select()
		.from(projects)
		.where(
			and(
				eq(projects.id, projectId),
				eq(projects.businessId, businessId),
				isNull(projects.deletedAt)
			)
		)
		.limit(1);

	if (!project) throw new HTTPException(404, { message: 'Project not found' });

	return project;
}
