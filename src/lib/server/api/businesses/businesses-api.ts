import { Hono } from 'hono';
import * as v from 'valibot';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { CreateBusinessSchema, UpdateBusinessSchema } from '$lib/schemas/business';
import { getBusinessesHandler } from './getBusinessesHandler';
import { getBusinessHandler } from './getBusinessHandler';
import { createBusinessHandler } from './createBusinessHandler';
import { updateBusinessHandler } from './updateBusinessHandler';
import { deleteBusinessHandler } from './deleteBusinessHandler';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { businesses } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { HTTPException } from 'hono/http-exception';

const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const LOGO_ALLOWED_TYPES = new Set(['image/jpeg', 'image/png']);

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
	})

	// Upload business logo
	.post('/businesses/:businessId/logo', async (c) => {
		const user = c.get('currentUser');
		const businessId = c.req.param('businessId');
		await requireBusinessPermission(user, businessId, 'business:manage', c.env);

		const formData = await c.req.parseBody();
		const file = formData['file'];
		if (!(file instanceof File)) throw new HTTPException(400, { message: 'No file provided.' });
		if (!LOGO_ALLOWED_TYPES.has(file.type)) throw new HTTPException(400, { message: 'Only JPEG and PNG logos are allowed.' });
		if (file.size > LOGO_MAX_BYTES) throw new HTTPException(400, { message: 'Logo must be under 2 MB.' });

		const r2Key = `businesses/${businessId}/logo`;
		await c.env.BUCKET.put(r2Key, await file.arrayBuffer(), {
			httpMetadata: { contentType: file.type }
		});

		const db = drizzle(c.env.DB, { schema });
		const now = new Date().toISOString();
		await db.update(businesses)
			.set({ logoR2Key: r2Key, updatedAt: now, updatedBy: user.id })
			.where(and(eq(businesses.id, businessId), isNull(businesses.deletedAt)));

		return c.json({ data: { logoR2Key: r2Key } });
	})

	// Serve business logo
	.get('/businesses/:businessId/logo', async (c) => {
		const user = c.get('currentUser');
		const businessId = c.req.param('businessId');
		await requireBusinessPermission(user, businessId, 'transaction:view', c.env);

		const db = drizzle(c.env.DB, { schema });
		const [biz] = await db.select({ logoR2Key: businesses.logoR2Key })
			.from(businesses)
			.where(and(eq(businesses.id, businessId), isNull(businesses.deletedAt)))
			.limit(1);

		if (!biz?.logoR2Key) throw new HTTPException(404, { message: 'No logo uploaded.' });

		const object = await c.env.BUCKET.get(biz.logoR2Key);
		if (!object) throw new HTTPException(404, { message: 'Logo not found in storage.' });

		const headers = new Headers();
		headers.set('Content-Type', object.httpMetadata?.contentType ?? 'image/jpeg');
		headers.set('Cache-Control', 'public, max-age=86400');
		return new Response(object.body, { headers });
	});
