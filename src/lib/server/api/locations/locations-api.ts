import { Hono } from 'hono';
import * as v from 'valibot';
import { CreateLocationSchema, UpdateLocationSchema } from '$lib/schemas/location';
import { getLocationsHandler } from './getLocationsHandler';
import { createLocationHandler } from './createLocationHandler';
import { updateLocationHandler } from './updateLocationHandler';
import { deleteLocationHandler } from './deleteLocationHandler';
import { HTTPException } from 'hono/http-exception';

export const locationsApi = new Hono<App.Api>()

	.get('/businesses/:businessId/locations', async (c) => {
		const user = c.get('currentUser');
		const data = await getLocationsHandler(user, c.req.param('businessId'), c.env);
		return c.json({ data });
	})

	.post('/businesses/:businessId/locations', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(CreateLocationSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await createLocationHandler(user, c.req.param('businessId'), result.output, c.env);
		return c.json({ data }, 201);
	})

	.patch('/businesses/:businessId/locations/:locationId', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(UpdateLocationSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await updateLocationHandler(
			user,
			c.req.param('businessId'),
			c.req.param('locationId'),
			result.output,
			c.env
		);
		return c.json({ data });
	})

	.delete('/businesses/:businessId/locations/:locationId', async (c) => {
		const user = c.get('currentUser');
		const data = await deleteLocationHandler(
			user,
			c.req.param('businessId'),
			c.req.param('locationId'),
			c.env
		);
		return c.json({ data });
	});
