import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import * as v from 'valibot';
import { registerDeviceTokenHandler } from './registerDeviceTokenHandler';
import { removeDeviceTokenHandler } from './removeDeviceTokenHandler';
import { listNotificationsHandler } from './listNotificationsHandler';
import { markNotificationReadHandler } from './markNotificationReadHandler';
import { markAllReadHandler } from './markAllReadHandler';
import { getPreferencesHandler } from './getPreferencesHandler';
import { updatePreferencesHandler } from './updatePreferencesHandler';

const DeviceTokenSchema = v.object({
	token: v.pipe(v.string(), v.minLength(1)),
	platform: v.optional(v.picklist(['web', 'android', 'ios']), 'web')
});

const UpdatePreferenceSchema = v.object({
	type: v.pipe(v.string(), v.minLength(1)),
	pushEnabled: v.optional(v.boolean()),
	inAppEnabled: v.optional(v.boolean())
});

export const notificationsApi = new Hono<App.Api>()

	// Device tokens
	.post('/notifications/device-token', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(DeviceTokenSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		await registerDeviceTokenHandler(user, result.output, c.env);
		return c.json({ success: true }, 201);
	})

	.delete('/notifications/device-token', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		await removeDeviceTokenHandler(user, body.token, c.env);
		return c.json({ success: true });
	})

	// Notifications list
	.get('/notifications', async (c) => {
		const user = c.get('currentUser');
		const limit = parseInt(c.req.query('limit') ?? '20', 10);
		const offset = parseInt(c.req.query('offset') ?? '0', 10);
		const result = await listNotificationsHandler(user, limit, offset, c.env);
		return c.json({ data: { items: result.data, unreadCount: result.unreadCount } });
	})

	// Mark as read
	.patch('/notifications/:notificationId/read', async (c) => {
		const user = c.get('currentUser');
		await markNotificationReadHandler(user, c.req.param('notificationId'), c.env);
		return c.json({ success: true });
	})

	.patch('/notifications/read-all', async (c) => {
		const user = c.get('currentUser');
		await markAllReadHandler(user, c.env);
		return c.json({ success: true });
	})

	// Preferences
	.get('/notifications/preferences', async (c) => {
		const user = c.get('currentUser');
		const data = await getPreferencesHandler(user, c.env);
		return c.json({ data });
	})

	.put('/notifications/preferences', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(UpdatePreferenceSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		await updatePreferencesHandler(user, result.output, c.env);
		return c.json({ success: true });
	});
