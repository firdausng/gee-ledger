import type { Handle } from '@sveltejs/kit';
import { verifyFirebaseToken } from '$lib/server/auth/firebase-verifier';
import { upsertUser } from '$lib/server/auth/user-manager';
import { PUBLIC_FIREBASE_PROJECT_ID } from '$env/static/public';

export const setupServicesHandler: Handle = async ({ event, resolve }) => {
	if (!event.platform?.env?.DB) {
		throw new Error('Database binding (DB) not found on platform');
	}

	event.locals.user = null;

	const token = event.cookies.get('__session');

	if (token) {
		const payload = await verifyFirebaseToken(token, PUBLIC_FIREBASE_PROJECT_ID);

		if (payload) {
			const user = await upsertUser(payload, event.platform.env);
			event.locals.user = {
				id: user.id,
				email: user.email,
				displayName: user.displayName,
				photoURL: user.photoURL
			};
		}
	}

	return resolve(event);
};
