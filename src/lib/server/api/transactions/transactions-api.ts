import { Hono } from 'hono';
import * as v from 'valibot';
import {
	CreateTransactionSchema,
	UpdateTransactionSchema,
	TransactionFiltersSchema
} from '$lib/schemas/transaction';
import { getTransactionsHandler } from './getTransactionsHandler';
import { getTransactionHandler } from './getTransactionHandler';
import { createTransactionHandler } from './createTransactionHandler';
import { updateTransactionHandler } from './updateTransactionHandler';
import { deleteTransactionHandler } from './deleteTransactionHandler';
import { HTTPException } from 'hono/http-exception';

export const transactionsApi = new Hono<App.Api>()

	.get('/businesses/:businessId/transactions', async (c) => {
		const user = c.get('currentUser');
		const query = c.req.query();
		const filtersResult = v.safeParse(TransactionFiltersSchema, {
			...query,
			limit: query.limit ? Number(query.limit) : undefined
		});
		if (!filtersResult.success) throw new HTTPException(400, { message: 'Invalid query parameters' });
		const data = await getTransactionsHandler(user, c.req.param('businessId'), filtersResult.output, c.env);
		return c.json({ data });
	})

	.post('/businesses/:businessId/transactions', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(CreateTransactionSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await createTransactionHandler(user, c.req.param('businessId'), result.output, c.env);
		return c.json({ data }, 201);
	})

	.get('/businesses/:businessId/transactions/:transactionId', async (c) => {
		const user = c.get('currentUser');
		const data = await getTransactionHandler(
			user,
			c.req.param('businessId'),
			c.req.param('transactionId'),
			c.env
		);
		return c.json({ data });
	})

	.patch('/businesses/:businessId/transactions/:transactionId', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(UpdateTransactionSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await updateTransactionHandler(
			user,
			c.req.param('businessId'),
			c.req.param('transactionId'),
			result.output,
			c.env
		);
		return c.json({ data });
	})

	.delete('/businesses/:businessId/transactions/:transactionId', async (c) => {
		const user = c.get('currentUser');
		const data = await deleteTransactionHandler(
			user,
			c.req.param('businessId'),
			c.req.param('transactionId'),
			c.env
		);
		return c.json({ data });
	});
