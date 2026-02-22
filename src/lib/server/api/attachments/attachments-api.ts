import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { uploadAttachmentHandler } from './uploadAttachmentHandler';
import { uploadOrphanAttachmentHandler } from './uploadOrphanAttachmentHandler';
import { listAttachmentsHandler } from './listAttachmentsHandler';
import { listBusinessAttachmentsHandler } from './listBusinessAttachmentsHandler';
import { downloadAttachmentHandler } from './downloadAttachmentHandler';
import { deleteAttachmentHandler } from './deleteAttachmentHandler';

export const attachmentsApi = new Hono<App.Api>()

	// List all attachments for a business (linked + orphaned)
	.get('/businesses/:businessId/attachments', async (c) => {
		const user = c.get('currentUser');
		const data = await listBusinessAttachmentsHandler(user, c.req.param('businessId'), c.env);
		return c.json({ data });
	})

	// Upload a file without linking it to any entity yet — returns attachment ID
	// Used by the new transaction form: upload files first, then link on save
	.post('/businesses/:businessId/attachments', async (c) => {
		const user = c.get('currentUser');
		const formData = await c.req.parseBody();
		const file = formData['file'];

		if (!(file instanceof File)) {
			throw new HTTPException(400, { message: 'No file provided.' });
		}

		const data = await uploadOrphanAttachmentHandler(user, c.req.param('businessId'), file, c.env);
		return c.json({ data }, 201);
	})

	.post('/businesses/:businessId/transactions/:transactionId/attachments', async (c) => {
		const user = c.get('currentUser');
		const formData = await c.req.parseBody();
		const file = formData['file'];

		if (!(file instanceof File)) {
			throw new HTTPException(400, { message: 'No file provided.' });
		}

		const data = await uploadAttachmentHandler(
			user,
			c.req.param('businessId'),
			c.req.param('transactionId'),
			file,
			c.env
		);
		return c.json({ data }, 201);
	})

	.get('/businesses/:businessId/transactions/:transactionId/attachments', async (c) => {
		const user = c.get('currentUser');
		const data = await listAttachmentsHandler(
			user,
			c.req.param('businessId'),
			c.req.param('transactionId'),
			c.env
		);
		return c.json({ data });
	})

	.get('/businesses/:businessId/attachments/:attachmentId/download', async (c) => {
		const user = c.get('currentUser');
		const { object, attachment } = await downloadAttachmentHandler(
			user,
			c.req.param('businessId'),
			c.req.param('attachmentId'),
			c.env
		);

		const headers = new Headers();
		headers.set('Content-Type', attachment.mimeType);
		headers.set('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
		headers.set('Content-Length', String(attachment.fileSize));
		headers.set('Cache-Control', 'private, max-age=3600');

		return new Response(object.body, { headers });
	})

	.delete('/businesses/:businessId/attachments/:attachmentId', async (c) => {
		const user = c.get('currentUser');
		const data = await deleteAttachmentHandler(
			user,
			c.req.param('businessId'),
			c.req.param('attachmentId'),
			c.env
		);
		return c.json({ data });
	});
