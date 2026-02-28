import { Hono } from 'hono';
import * as v from 'valibot';
import {
	CreateTransactionSchema,
	UpdateTransactionSchema,
	TransactionFiltersSchema,
	SaveTransactionItemsSchema,
	SaveServiceItemsSchema
} from '$lib/schemas/transaction';
import { getTransactionsHandler } from './getTransactionsHandler';
import { getTransactionHandler } from './getTransactionHandler';
import { createTransactionHandler } from './createTransactionHandler';
import { updateTransactionHandler } from './updateTransactionHandler';
import { deleteTransactionHandler } from './deleteTransactionHandler';
import { shareTransactionHandler } from './shareTransactionHandler';
import { getTransactionItemsHandler } from './getTransactionItemsHandler';
import { saveTransactionItemsHandler } from './saveTransactionItemsHandler';
import { getServiceItemsHandler } from './getServiceItemsHandler';
import { saveServiceItemsHandler } from './saveServiceItemsHandler';
import { assignInvoiceNoHandler } from './assignInvoiceNoHandler';
import { assignReceiptNoHandler } from './assignReceiptNoHandler';
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
	})

	.get('/businesses/:businessId/transactions/:transactionId/items', async (c) => {
		const user = c.get('currentUser');
		const data = await getTransactionItemsHandler(
			user,
			c.req.param('businessId'),
			c.req.param('transactionId'),
			c.env
		);
		return c.json({ data });
	})

	.put('/businesses/:businessId/transactions/:transactionId/items', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(SaveTransactionItemsSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid items data' });
		const data = await saveTransactionItemsHandler(
			user,
			c.req.param('businessId'),
			c.req.param('transactionId'),
			result.output,
			c.env
		);
		return c.json({ data });
	})

	.get('/businesses/:businessId/transactions/:transactionId/service-items', async (c) => {
		const user = c.get('currentUser');
		const data = await getServiceItemsHandler(
			user,
			c.req.param('businessId'),
			c.req.param('transactionId'),
			c.env
		);
		return c.json({ data });
	})

	.put('/businesses/:businessId/transactions/:transactionId/service-items', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(SaveServiceItemsSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid service items data' });
		const data = await saveServiceItemsHandler(
			user,
			c.req.param('businessId'),
			c.req.param('transactionId'),
			result.output,
			c.env
		);
		return c.json({ data });
	})

	.post('/businesses/:businessId/transactions/:transactionId/assign-invoice-no', async (c) => {
		const user = c.get('currentUser');
		const data = await assignInvoiceNoHandler(
			user,
			c.req.param('businessId'),
			c.req.param('transactionId'),
			c.env
		);
		return c.json({ data });
	})

	.post('/businesses/:businessId/transactions/:transactionId/assign-receipt-no', async (c) => {
		const user = c.get('currentUser');
		const data = await assignReceiptNoHandler(
			user,
			c.req.param('businessId'),
			c.req.param('transactionId'),
			c.env
		);
		return c.json({ data });
	})

	.post('/businesses/:businessId/transactions/:transactionId/share', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json<{ email?: string; billTo?: { name?: string; address?: string; email?: string }; invoiceNo?: string | null }>();
		const shareSchema = v.object({
			email:  v.pipe(v.string(), v.email()),
			billTo: v.optional(v.object({
				name:    v.optional(v.pipe(v.string(), v.maxLength(200))),
				address: v.optional(v.pipe(v.string(), v.maxLength(500))),
				email:   v.optional(v.pipe(v.string(), v.maxLength(200))),
			})),
			invoiceNo:    v.optional(v.nullable(v.pipe(v.string(), v.maxLength(50)))),
			receiptNo:    v.optional(v.nullable(v.pipe(v.string(), v.maxLength(50)))),
			documentType: v.optional(v.nullable(v.picklist(['invoice', 'receipt']))),
		});
		const result = v.safeParse(shareSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'A valid recipient email is required.' });
		const data = await shareTransactionHandler(
			user,
			c.req.param('businessId'),
			c.req.param('transactionId'),
			result.output.email,
			c.env,
			result.output.billTo ?? null,
			result.output.invoiceNo ?? null,
			result.output.documentType ?? null,
			result.output.receiptNo ?? null
		);
		return c.json({ data });
	});
