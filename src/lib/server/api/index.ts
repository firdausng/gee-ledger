import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { verifyFirebaseToken } from '$lib/server/auth/firebase-verifier';
import { upsertUser } from '$lib/server/auth/user-manager';
import { PUBLIC_FIREBASE_PROJECT_ID } from '$env/static/public';
import { businessesApi } from './businesses/businesses-api';
import { locationsApi } from './locations/locations-api';
import { channelsApi } from './channels/channels-api';
import { accountsApi } from './accounts/accounts-api';
import { categoriesApi } from './categories/categories-api';
import { transactionsApi } from './transactions/transactions-api';
import { invitationsApi } from './invitations/invitations-api';
import {
	type VerifyFirebaseAuthConfig ,
	verifyFirebaseAuth
} from '@hono/firebase-auth'
import { createMiddleware } from "hono/factory";

const config: VerifyFirebaseAuthConfig  = {
	projectId: 'gee-ledger',
}

const authMiddleware = createMiddleware(async (c, next) => {
	const verifyAuth = verifyFirebaseAuth(config);
	return verifyAuth(c, next);
});

const router = new Hono<App.Api>()
	.use('*', authMiddleware)
	// .use('*', async (c, next) => {
	// 	return verifyFirebaseAuth(config)
	// })
	// Verify Firebase token and resolve user on every request
	// .use('*', async (c, next) => {
	// 	const authHeader = c.req.header('Authorization');
	//
	// 	if (!authHeader?.startsWith('Bearer ')) {
	// 		return c.json({ error: 'Unauthorized' }, 401);
	// 	}
	//
	// 	const token = authHeader.slice(7);
	// 	const payload = await verifyFirebaseToken(token, PUBLIC_FIREBASE_PROJECT_ID);
	//
	// 	if (!payload) {
	// 		return c.json(
	// 			{ error: 'Invalid or expired token' },
	// 			401,
	// 			{ 'WWW-Authenticate': 'Bearer error="invalid_token"' }
	// 		);
	// 	}
	//
	// 	const user = await upsertUser(payload, c.env);
	// 	c.set('currentUser', {
	// 		id: user.id,
	// 		email: user.email,
	// 		displayName: user.displayName,
	// 		photoURL: user.photoURL
	// 	});
	//
	// 	return next();
	// })

	// Feature routers
	.route('/', businessesApi)
	.route('/', locationsApi)
	.route('/', channelsApi)
	.route('/', accountsApi)
	.route('/', categoriesApi)
	.route('/', transactionsApi)
	.route('/', invitationsApi)

	// Global error handler
	.onError((err, c) => {
		if (err instanceof HTTPException) {
			return c.json({ error: err.message }, err.status);
		}
		console.error('Unhandled API error:', err);
		return c.json({ error: 'Internal server error' }, 500);
	});

export const api = new Hono<App.Api>()
	.route('/api', router);

