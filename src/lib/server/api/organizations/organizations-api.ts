import { Hono } from 'hono';
import * as v from 'valibot';
import { CreateOrganizationSchema, UpdateOrganizationSchema } from '$lib/schemas/organization';
import { createOrganizationHandler } from './createOrganizationHandler';
import { getOrganizationsHandler } from './getOrganizationsHandler';
import { getOrganizationHandler } from './getOrganizationHandler';
import { HTTPException } from 'hono/http-exception';

export const organizationsApi = new Hono<App.Api>()

	.get('/organizations', async (c) => {
		const user = c.get('currentUser');
		const data = await getOrganizationsHandler(user, c.env);
		return c.json({ data });
	})

	.post('/organizations', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(CreateOrganizationSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await createOrganizationHandler(user, result.output, c.env);
		return c.json({ data }, 201);
	})

	.get('/organizations/:organizationId', async (c) => {
		const user = c.get('currentUser');
		const data = await getOrganizationHandler(user, c.req.param('organizationId'), c.env);
		return c.json({ data });
	});
