import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { verifyFirebaseToken } from '$lib/server/auth/firebase-verifier';
import { upsertUser } from '$lib/server/auth/user-manager';
import { PUBLIC_FIREBASE_PROJECT_ID } from '$env/static/public';
import { businessesApi } from './businesses/businesses-api';
import { locationsApi } from './locations/locations-api';
import { channelsApi } from './channels/channels-api';
import { accountsApi } from './accounts/accounts-api';
import { categoriesApi } from './categories/categories-api';
import { productsApi } from './products/products-api';
import { contactsApi } from './contacts/contacts-api';
import { transactionsApi } from './transactions/transactions-api';
import { invitationsApi } from './invitations/invitations-api';
import { attachmentsApi } from './attachments/attachments-api';
import { organizationsApi } from './organizations/organizations-api';

const router = new Hono<App.Api>()
	// Verify Firebase token and resolve user on every request
	.use('*', async (c, next) => {
		const authHeader = c.req.header('Authorization');

		let token: string | null = null;
		if (authHeader?.startsWith('Bearer ')) {
			token = authHeader.slice(7);
		} else {
			// Fallback: browser-initiated requests (img src, anchor) send cookies but no Bearer header
			token = getCookie(c, '__session') ?? null;
		}

		if (!token) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		const payload = await verifyFirebaseToken(token, PUBLIC_FIREBASE_PROJECT_ID);

		if (!payload) {
			return c.json(
				{ error: 'Invalid or expired token' },
				401,
				{ 'WWW-Authenticate': 'Bearer error="invalid_token"' }
			);
		}

		const user = await upsertUser(payload, c.env);
		c.set('currentUser', {
			id: user.id,
			email: user.email,
			displayName: user.displayName,
			photoURL: user.photoURL
		});

		return next();
	})

	// Feature routers
	.route('/', businessesApi)
	.route('/', locationsApi)
	.route('/', channelsApi)
	.route('/', accountsApi)
	.route('/', categoriesApi)
	.route('/', productsApi)
	.route('/', contactsApi)
	.route('/', transactionsApi)
	.route('/', invitationsApi)
	.route('/', attachmentsApi)
	.route('/', organizationsApi)

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

