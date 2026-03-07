import { Hono } from 'hono';
import * as v from 'valibot';
import {
	CreateQuoteSchema,
	UpdateQuoteSchema,
	QuoteFiltersSchema,
	SaveQuoteItemsSchema,
	SaveQuoteServiceItemsSchema
} from '$lib/schemas/quote';
import { getQuotesHandler } from './getQuotesHandler';
import { getQuoteHandler } from './getQuoteHandler';
import { createQuoteHandler } from './createQuoteHandler';
import { updateQuoteHandler } from './updateQuoteHandler';
import { deleteQuoteHandler } from './deleteQuoteHandler';
import { assignQuoteNoHandler } from './assignQuoteNoHandler';
import { convertQuoteHandler } from './convertQuoteHandler';
import { getQuoteItemsHandler } from './getQuoteItemsHandler';
import { saveQuoteItemsHandler } from './saveQuoteItemsHandler';
import { getQuoteServiceItemsHandler } from './getQuoteServiceItemsHandler';
import { saveQuoteServiceItemsHandler } from './saveQuoteServiceItemsHandler';
import { getQuoteConversionsHandler } from './getQuoteConversionsHandler';
import { HTTPException } from 'hono/http-exception';

export const quotesApi = new Hono<App.Api>()

	.get('/businesses/:businessId/quotes', async (c) => {
		const user = c.get('currentUser');
		const query = c.req.query();
		const filtersResult = v.safeParse(QuoteFiltersSchema, {
			...query,
			page: query.page ? Number(query.page) : undefined,
			perPage: query.perPage ? Number(query.perPage) : undefined
		});
		if (!filtersResult.success) throw new HTTPException(400, { message: 'Invalid query parameters' });
		const result = await getQuotesHandler(user, c.req.param('businessId'), filtersResult.output, c.env);
		return c.json({ data: result });
	})

	.post('/businesses/:businessId/quotes', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(CreateQuoteSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await createQuoteHandler(user, c.req.param('businessId'), result.output, c.env);
		return c.json({ data }, 201);
	})

	.get('/businesses/:businessId/quotes/:quoteId', async (c) => {
		const user = c.get('currentUser');
		const data = await getQuoteHandler(
			user,
			c.req.param('businessId'),
			c.req.param('quoteId'),
			c.env
		);
		return c.json({ data });
	})

	.patch('/businesses/:businessId/quotes/:quoteId', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(UpdateQuoteSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await updateQuoteHandler(
			user,
			c.req.param('businessId'),
			c.req.param('quoteId'),
			result.output,
			c.env
		);
		return c.json({ data });
	})

	.delete('/businesses/:businessId/quotes/:quoteId', async (c) => {
		const user = c.get('currentUser');
		const data = await deleteQuoteHandler(
			user,
			c.req.param('businessId'),
			c.req.param('quoteId'),
			c.env
		);
		return c.json({ data });
	})

	.get('/businesses/:businessId/quotes/:quoteId/items', async (c) => {
		const user = c.get('currentUser');
		const data = await getQuoteItemsHandler(
			user,
			c.req.param('businessId'),
			c.req.param('quoteId'),
			c.env
		);
		return c.json({ data });
	})

	.put('/businesses/:businessId/quotes/:quoteId/items', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(SaveQuoteItemsSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid items data' });
		const data = await saveQuoteItemsHandler(
			user,
			c.req.param('businessId'),
			c.req.param('quoteId'),
			result.output,
			c.env
		);
		return c.json({ data });
	})

	.get('/businesses/:businessId/quotes/:quoteId/service-items', async (c) => {
		const user = c.get('currentUser');
		const data = await getQuoteServiceItemsHandler(
			user,
			c.req.param('businessId'),
			c.req.param('quoteId'),
			c.env
		);
		return c.json({ data });
	})

	.put('/businesses/:businessId/quotes/:quoteId/service-items', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(SaveQuoteServiceItemsSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid service items data' });
		const data = await saveQuoteServiceItemsHandler(
			user,
			c.req.param('businessId'),
			c.req.param('quoteId'),
			result.output,
			c.env
		);
		return c.json({ data });
	})

	.post('/businesses/:businessId/quotes/:quoteId/assign-quote-no', async (c) => {
		const user = c.get('currentUser');
		const data = await assignQuoteNoHandler(
			user,
			c.req.param('businessId'),
			c.req.param('quoteId'),
			c.env
		);
		return c.json({ data });
	})

	.get('/businesses/:businessId/quotes/:quoteId/conversions', async (c) => {
		const user = c.get('currentUser');
		const data = await getQuoteConversionsHandler(
			user,
			c.req.param('businessId'),
			c.req.param('quoteId'),
			c.env
		);
		return c.json({ data });
	})

	.post('/businesses/:businessId/quotes/:quoteId/convert', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json().catch(() => ({}));
		const data = await convertQuoteHandler(
			user,
			c.req.param('businessId'),
			c.req.param('quoteId'),
			body as { note?: string },
			c.env
		);
		return c.json({ data }, 201);
	});
