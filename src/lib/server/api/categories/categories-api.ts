import { Hono } from 'hono';
import * as v from 'valibot';
import { CreateCategorySchema, UpdateCategorySchema } from '$lib/schemas/category';
import { getCategoriesHandler } from './getCategoriesHandler';
import { createCategoryHandler } from './createCategoryHandler';
import { updateCategoryHandler } from './updateCategoryHandler';
import { deleteCategoryHandler } from './deleteCategoryHandler';
import { HTTPException } from 'hono/http-exception';

export const categoriesApi = new Hono<App.Api>()

	.get('/businesses/:businessId/categories', async (c) => {
		const user = c.get('currentUser');
		const data = await getCategoriesHandler(user, c.req.param('businessId'), c.env);
		return c.json({ data });
	})

	.post('/businesses/:businessId/categories', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(CreateCategorySchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await createCategoryHandler(user, c.req.param('businessId'), result.output, c.env);
		return c.json({ data }, 201);
	})

	.patch('/businesses/:businessId/categories/:categoryId', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(UpdateCategorySchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await updateCategoryHandler(
			user,
			c.req.param('businessId'),
			c.req.param('categoryId'),
			result.output,
			c.env
		);
		return c.json({ data });
	})

	.delete('/businesses/:businessId/categories/:categoryId', async (c) => {
		const user = c.get('currentUser');
		const data = await deleteCategoryHandler(
			user,
			c.req.param('businessId'),
			c.req.param('categoryId'),
			c.env
		);
		return c.json({ data });
	});
