import { Hono } from 'hono';
import * as v from 'valibot';
import { CreateProductSchema, UpdateProductSchema } from '$lib/schemas/product';
import { getProductsHandler } from './getProductsHandler';
import { createProductHandler } from './createProductHandler';
import { updateProductHandler } from './updateProductHandler';
import { deleteProductHandler } from './deleteProductHandler';
import { getProductAttachmentsHandler } from './getProductAttachmentsHandler';
import { HTTPException } from 'hono/http-exception';

export const productsApi = new Hono<App.Api>()

	.get('/businesses/:businessId/products/:productId/attachments', async (c) => {
		const user = c.get('currentUser');
		const data = await getProductAttachmentsHandler(
			user,
			c.req.param('businessId'),
			c.req.param('productId'),
			c.env
		);
		return c.json({ data });
	})

	.get('/businesses/:businessId/products', async (c) => {
		const user = c.get('currentUser');
		const data = await getProductsHandler(user, c.req.param('businessId'), c.env);
		return c.json({ data });
	})

	.post('/businesses/:businessId/products', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(CreateProductSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await createProductHandler(user, c.req.param('businessId'), result.output, c.env);
		return c.json({ data }, 201);
	})

	.patch('/businesses/:businessId/products/:productId', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(UpdateProductSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await updateProductHandler(
			user,
			c.req.param('businessId'),
			c.req.param('productId'),
			result.output,
			c.env
		);
		return c.json({ data });
	})

	.delete('/businesses/:businessId/products/:productId', async (c) => {
		const user = c.get('currentUser');
		const data = await deleteProductHandler(
			user,
			c.req.param('businessId'),
			c.req.param('productId'),
			c.env
		);
		return c.json({ data });
	});
