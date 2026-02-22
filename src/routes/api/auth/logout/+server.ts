import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteSession } from '$lib/server/auth/session';

export const POST: RequestHandler = async ({ cookies, platform }) => {
	if(!platform){
		throw new Error('Platform not found');
	}
	const sessionToken = cookies.get('session');

	if (sessionToken) {
		await deleteSession(sessionToken, platform.env);
	}

	cookies.delete('session', { path: '/' });

	return json({ success: true });
};
