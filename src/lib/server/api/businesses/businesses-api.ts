import { Hono } from 'hono';
import * as v from 'valibot';
import { CreateBusinessSchema, UpdateBusinessSchema } from '$lib/schemas/business';
import { getBusinessesHandler } from './getBusinessesHandler';
import { getBusinessHandler } from './getBusinessHandler';
import { createBusinessHandler } from './createBusinessHandler';
import { updateBusinessHandler } from './updateBusinessHandler';
import { deleteBusinessHandler } from './deleteBusinessHandler';
import { HTTPException } from 'hono/http-exception';

export const businessesApi = new Hono<App.Api>()

	.get('/businesses', async (c) => {
		const user = c.get('currentUser');
		const data = await getBusinessesHandler(user, c.env);
		return c.json({ data });
	})

	.post('/businesses', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(CreateBusinessSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await createBusinessHandler(user, result.output, c.env);
		return c.json({ data }, 201);
	})

	.get('/businesses/:businessId', async (c) => {
		const user = c.get('currentUser');
		const data = await getBusinessHandler(user, c.req.param('businessId'), c.env);
		return c.json({ data });
	})

	.patch('/businesses/:businessId', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(UpdateBusinessSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await updateBusinessHandler(user, c.req.param('businessId'), result.output, c.env);
		return c.json({ data });
	})

	.delete('/businesses/:businessId', async (c) => {
		const user = c.get('currentUser');
		const data = await deleteBusinessHandler(user, c.req.param('businessId'), c.env);
		return c.json({ data });
	});
