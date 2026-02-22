import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

const PUBLIC_PATHS = ['/', '/login'];

export const checkSessionHandler: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// API routes are authenticated independently inside the Hono router
	if (path.startsWith('/api/')) {
		return resolve(event);
	}

	// Public paths pass through without auth check
	if (PUBLIC_PATHS.includes(path)) {
		return resolve(event);
	}

	if (!event.locals.user) {
		throw redirect(307, '/login');
	}

	return resolve(event);
};
