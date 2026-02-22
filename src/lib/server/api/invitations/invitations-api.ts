import { Hono } from 'hono';
import * as v from 'valibot';
import { InviteUserSchema, UpdateMemberRoleSchema } from '$lib/schemas/invitation';
import { listMembersHandler } from './listMembersHandler';
import { inviteUserHandler } from './inviteUserHandler';
import { updateMemberRoleHandler } from './updateMemberRoleHandler';
import { removeMemberHandler } from './removeMemberHandler';
import { listInvitationsHandler } from './listInvitationsHandler';
import { acceptInvitationHandler } from './acceptInvitationHandler';
import { declineInvitationHandler } from './declineInvitationHandler';
import { HTTPException } from 'hono/http-exception';

export const invitationsApi = new Hono<App.Api>()

	// Members
	.get('/businesses/:businessId/members', async (c) => {
		const user = c.get('currentUser');
		const data = await listMembersHandler(user, c.req.param('businessId'), c.env);
		return c.json({ data });
	})

	.post('/businesses/:businessId/invitations', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(InviteUserSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await inviteUserHandler(user, c.req.param('businessId'), result.output, c.env);
		return c.json({ data }, 201);
	})

	.patch('/businesses/:businessId/members/:userId/role', async (c) => {
		const user = c.get('currentUser');
		const body = await c.req.json();
		const result = v.safeParse(UpdateMemberRoleSchema, body);
		if (!result.success) throw new HTTPException(400, { message: 'Invalid request body' });
		const data = await updateMemberRoleHandler(
			user,
			c.req.param('businessId'),
			c.req.param('userId'),
			result.output,
			c.env
		);
		return c.json({ data });
	})

	.delete('/businesses/:businessId/members/:userId', async (c) => {
		const user = c.get('currentUser');
		const data = await removeMemberHandler(user, c.req.param('businessId'), c.req.param('userId'), c.env);
		return c.json({ data });
	})

	// Invitations (current user's inbox)
	.get('/invitations', async (c) => {
		const user = c.get('currentUser');
		const data = await listInvitationsHandler(user, c.env);
		return c.json({ data });
	})

	.post('/invitations/:invitationId/accept', async (c) => {
		const user = c.get('currentUser');
		const data = await acceptInvitationHandler(user, c.req.param('invitationId'), c.env);
		return c.json({ data });
	})

	.post('/invitations/:invitationId/decline', async (c) => {
		const user = c.get('currentUser');
		const data = await declineInvitationHandler(user, c.req.param('invitationId'), c.env);
		return c.json({ data });
	});
