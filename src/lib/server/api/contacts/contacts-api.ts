import { Hono } from 'hono';
import * as v from 'valibot';
import { CreateContactSchema, UpdateContactSchema } from '$lib/schemas/contact';
import { getContactsHandler } from './getContactsHandler';
import { getContactHandler } from './getContactHandler';
import { createContactHandler } from './createContactHandler';
import { updateContactHandler } from './updateContactHandler';
import { deleteContactHandler } from './deleteContactHandler';
import { HTTPException } from 'hono/http-exception';

export const contactsApi = new Hono<App.Api>()

	.get('/businesses/:businessId/contacts', async (c) => {
		const user = c.get('currentUser');
		const role = c.req.query('role') as 'client' | 'supplier' | undefined;
		const data = await getContactsHandler(user, c.req.param('businessId'), role, c.env);
		return c.json({ data });
	})

	.get('/businesses/:businessId/contacts/:contactId', async (c) => {
		const user = c.get('currentUser');
		const data = await getContactHandler(
			user,
			c.req.param('businessId'),
			c.req.param('contactId'),
			c.env
		);
		return c.json({ data });
	})

	.post('/businesses/:businessId/contacts', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(CreateContactSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await createContactHandler(user, c.req.param('businessId'), result.output, c.env);
		return c.json({ data }, 201);
	})

	.patch('/businesses/:businessId/contacts/:contactId', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(UpdateContactSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await updateContactHandler(
			user,
			c.req.param('businessId'),
			c.req.param('contactId'),
			result.output,
			c.env
		);
		return c.json({ data });
	})

	.delete('/businesses/:businessId/contacts/:contactId', async (c) => {
		const user = c.get('currentUser');
		const data = await deleteContactHandler(
			user,
			c.req.param('businessId'),
			c.req.param('contactId'),
			c.env
		);
		return c.json({ data });
	});
