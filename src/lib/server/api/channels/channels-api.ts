import { Hono } from 'hono';
import * as v from 'valibot';
import { CreateChannelSchema, UpdateChannelSchema } from '$lib/schemas/channel';
import { getChannelsHandler } from './getChannelsHandler';
import { createChannelHandler } from './createChannelHandler';
import { updateChannelHandler } from './updateChannelHandler';
import { deleteChannelHandler } from './deleteChannelHandler';
import { HTTPException } from 'hono/http-exception';

export const channelsApi = new Hono<App.Api>()

	.get('/businesses/:businessId/channels', async (c) => {
		const user = c.get('currentUser');
		const data = await getChannelsHandler(user, c.req.param('businessId'), c.env);
		return c.json({ data });
	})

	.post('/businesses/:businessId/channels', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(CreateChannelSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await createChannelHandler(user, c.req.param('businessId'), result.output, c.env);
		return c.json({ data }, 201);
	})

	.patch('/businesses/:businessId/channels/:channelId', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(UpdateChannelSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await updateChannelHandler(
			user,
			c.req.param('businessId'),
			c.req.param('channelId'),
			result.output,
			c.env
		);
		return c.json({ data });
	})

	.delete('/businesses/:businessId/channels/:channelId', async (c) => {
		const user = c.get('currentUser');
		const data = await deleteChannelHandler(
			user,
			c.req.param('businessId'),
			c.req.param('channelId'),
			c.env
		);
		return c.json({ data });
	});
