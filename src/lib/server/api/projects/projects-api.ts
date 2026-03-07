import { Hono } from 'hono';
import * as v from 'valibot';
import {
	CreateProjectSchema,
	UpdateProjectSchema,
	ProjectFiltersSchema,
	CreateProjectTaskSchema,
	UpdateProjectTaskSchema,
	ConvertProjectSchema,
	CreateTimeEntrySchema,
} from '$lib/schemas/project';
import { createProjectHandler } from './createProjectHandler';
import { getProjectsHandler } from './getProjectsHandler';
import { getProjectHandler } from './getProjectHandler';
import { updateProjectHandler } from './updateProjectHandler';
import { deleteProjectHandler } from './deleteProjectHandler';
import { addProjectTaskHandler } from './addProjectTaskHandler';
import { getProjectTasksHandler } from './getProjectTasksHandler';
import { updateProjectTaskHandler } from './updateProjectTaskHandler';
import { deleteProjectTaskHandler } from './deleteProjectTaskHandler';
import { convertProjectHandler } from './convertProjectHandler';
import { getProjectConversionsHandler } from './getProjectConversionsHandler';
import { getTimeEntriesHandler } from './getTimeEntriesHandler';
import { createTimeEntryHandler } from './createTimeEntryHandler';
import { deleteTimeEntryHandler } from './deleteTimeEntryHandler';
import { getProjectStatsHandler } from './getProjectStatsHandler';
import { HTTPException } from 'hono/http-exception';

export const projectsApi = new Hono<App.Api>()

	.get('/businesses/:businessId/projects', async (c) => {
		const user = c.get('currentUser');
		const query = c.req.query();
		const filtersResult = v.safeParse(ProjectFiltersSchema, {
			...query,
			page: query.page ? Number(query.page) : undefined,
			perPage: query.perPage ? Number(query.perPage) : undefined,
		});
		if (!filtersResult.success) throw new HTTPException(400, { message: 'Invalid query parameters' });
		const result = await getProjectsHandler(user, c.req.param('businessId'), filtersResult.output, c.env);
		return c.json({ data: result });
	})

	.post('/businesses/:businessId/projects', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(CreateProjectSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await createProjectHandler(user, c.req.param('businessId'), result.output, c.env);
		return c.json({ data }, 201);
	})

	.get('/businesses/:businessId/projects/:projectId', async (c) => {
		const user = c.get('currentUser');
		const data = await getProjectHandler(user, c.req.param('businessId'), c.req.param('projectId'), c.env);
		return c.json({ data });
	})

	.get('/businesses/:businessId/projects/:projectId/stats', async (c) => {
		const user = c.get('currentUser');
		const data = await getProjectStatsHandler(user, c.req.param('businessId'), c.req.param('projectId'), c.env);
		return c.json({ data });
	})

	.patch('/businesses/:businessId/projects/:projectId', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(UpdateProjectSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await updateProjectHandler(user, c.req.param('businessId'), c.req.param('projectId'), result.output, c.env);
		return c.json({ data });
	})

	.delete('/businesses/:businessId/projects/:projectId', async (c) => {
		const user = c.get('currentUser');
		const data = await deleteProjectHandler(user, c.req.param('businessId'), c.req.param('projectId'), c.env);
		return c.json({ data });
	})

	// Tasks — individual CRUD
	.get('/businesses/:businessId/projects/:projectId/tasks', async (c) => {
		const user = c.get('currentUser');
		const data = await getProjectTasksHandler(user, c.req.param('businessId'), c.req.param('projectId'), c.env);
		return c.json({ data });
	})

	.post('/businesses/:businessId/projects/:projectId/tasks', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(CreateProjectTaskSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await addProjectTaskHandler(user, c.req.param('businessId'), c.req.param('projectId'), result.output, c.env);
		return c.json({ data }, 201);
	})

	.patch('/businesses/:businessId/projects/:projectId/tasks/:taskId', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(UpdateProjectTaskSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await updateProjectTaskHandler(
			user, c.req.param('businessId'), c.req.param('projectId'), c.req.param('taskId'), result.output, c.env
		);
		return c.json({ data });
	})

	.delete('/businesses/:businessId/projects/:projectId/tasks/:taskId', async (c) => {
		const user = c.get('currentUser');
		const data = await deleteProjectTaskHandler(
			user, c.req.param('businessId'), c.req.param('projectId'), c.req.param('taskId'), c.env
		);
		return c.json({ data });
	})

	// Conversions
	.get('/businesses/:businessId/projects/:projectId/conversions', async (c) => {
		const user = c.get('currentUser');
		const data = await getProjectConversionsHandler(user, c.req.param('businessId'), c.req.param('projectId'), c.env);
		return c.json({ data });
	})

	.post('/businesses/:businessId/projects/:projectId/convert', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(ConvertProjectSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await convertProjectHandler(user, c.req.param('businessId'), c.req.param('projectId'), result.output, c.env);
		return c.json({ data }, 201);
	})

	// Time entries
	.get('/businesses/:businessId/projects/:projectId/tasks/:taskId/time-entries', async (c) => {
		const user = c.get('currentUser');
		const data = await getTimeEntriesHandler(
			user, c.req.param('businessId'), c.req.param('projectId'), c.req.param('taskId'), c.env
		);
		return c.json({ data });
	})

	.post('/businesses/:businessId/projects/:projectId/tasks/:taskId/time-entries', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(CreateTimeEntrySchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await createTimeEntryHandler(
			user, c.req.param('businessId'), c.req.param('projectId'), c.req.param('taskId'), result.output, c.env
		);
		return c.json({ data }, 201);
	})

	.delete('/businesses/:businessId/projects/:projectId/time-entries/:entryId', async (c) => {
		const user = c.get('currentUser');
		const data = await deleteTimeEntryHandler(
			user, c.req.param('businessId'), c.req.param('projectId'), c.req.param('entryId'), c.env
		);
		return c.json({ data });
	});
