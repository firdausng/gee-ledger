import type { Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	if (!event.platform) {
		throw new Error('Platform not found');
	}

	// Extract session cookie
	const sessionToken = event.cookies.get('session');

	if (sessionToken) {
		const sessionData = await validateSession(sessionToken, event.platform.env);

		if (sessionData) {
			// Populate event.locals with user data
			event.locals.user = {
				id: sessionData.user.id,
				email: sessionData.user.email,
				displayName: sessionData.user.displayName,
				photoURL: sessionData.user.photoURL,
				isAnonymous: sessionData.user.isAnonymous,
				provider: sessionData.user.provider
			};
		} else {
			// Invalid or expired session - clear cookie
			event.cookies.delete('session', { path: '/' });
		}
	}

	return resolve(event);
};
