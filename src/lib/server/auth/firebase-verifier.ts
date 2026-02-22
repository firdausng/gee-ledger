import { jwtVerify, createRemoteJWKSet } from 'jose';

const GOOGLE_JWKS_URL =
	'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

export interface FirebaseTokenPayload {
	uid: string;
	email: string | null;
	name: string | null;
	picture: string | null;
}

export async function verifyFirebaseToken(
	token: string,
	projectId: string
): Promise<FirebaseTokenPayload | null> {
	try {
		const { payload } = await jwtVerify(token, jwks, {
			issuer: `https://securetoken.google.com/${projectId}`,
			audience: projectId
		});

		return {
			uid: payload.sub as string,
			email: (payload.email as string) ?? null,
			name: (payload.name as string) ?? null,
			picture: (payload.picture as string) ?? null
		};
	} catch {
		return null;
	}
}
