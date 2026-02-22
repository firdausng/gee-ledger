import { Hono } from 'hono';
import * as v from 'valibot';
import { CreateAccountSchema, UpdateAccountSchema } from '$lib/schemas/account';
import { getAccountsHandler } from './getAccountsHandler';
import { createAccountHandler } from './createAccountHandler';
import { updateAccountHandler } from './updateAccountHandler';
import { deleteAccountHandler } from './deleteAccountHandler';
import { HTTPException } from 'hono/http-exception';

export const accountsApi = new Hono<App.Api>()

	.get('/businesses/:businessId/accounts', async (c) => {
		const user = c.get('currentUser');
		const data = await getAccountsHandler(user, c.req.param('businessId'), c.env);
		return c.json({ data });
	})

	.post('/businesses/:businessId/accounts', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(CreateAccountSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await createAccountHandler(user, c.req.param('businessId'), result.output, c.env);
		return c.json({ data }, 201);
	})

	.patch('/businesses/:businessId/accounts/:accountId', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(UpdateAccountSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await updateAccountHandler(
			user,
			c.req.param('businessId'),
			c.req.param('accountId'),
			result.output,
			c.env
		);
		return c.json({ data });
	})

	.delete('/businesses/:businessId/accounts/:accountId', async (c) => {
		const user = c.get('currentUser');
		const data = await deleteAccountHandler(
			user,
			c.req.param('businessId'),
			c.req.param('accountId'),
			c.env
		);
		return c.json({ data });
	});
