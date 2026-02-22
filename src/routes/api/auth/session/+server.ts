import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { FirebaseTokenVerifier } from '$lib/server/auth/jwt-verifier';
import { syncFirebaseUser } from '$lib/server/auth/user-manager';
import { createSession } from '$lib/server/auth/session';
import { env } from '$env/dynamic/private';

const tokenVerifier = new FirebaseTokenVerifier();

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
	if(!platform){
		throw new Error('Platform not found');
	}
	const { idToken } = await request.json() as {idToken: string};

	if (!idToken) {
		return json({ error: 'No token provided' }, { status: 400 });
	}

	// Verify the Firebase ID token
	console.log('Verifying Firebase ID token...', idToken);
	const firebaseUser = await tokenVerifier.verifyIdToken(idToken, platform.env.PUBLIC_FIREBASE_PROJECT_ID);
	console.log('firebaseUser...', firebaseUser);
	if (!firebaseUser) {
		return json({ error: 'Invalid token' }, { status: 401 });
	}

	// Sync user to database
	const user = await syncFirebaseUser(firebaseUser, platform.env);

	// Create session
	const sessionToken = await createSession(user.id, platform.env);

	// Set HTTP-only cookie
	cookies.set('session', sessionToken, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 14 // 14 days
	});

	return json({ success: true });
};
