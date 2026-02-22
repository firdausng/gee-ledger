import { jwtVerify, createRemoteJWKSet } from 'jose';

const GOOGLE_JWKS_URL =
	'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

export class FirebaseTokenVerifier {
	private jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

	async verifyIdToken(token: string, projectId: string) {
		try {
			console.log('Verifying Firebase ID token with project ID:', projectId, token);
			const { payload } = await jwtVerify(token, this.jwks, {
				issuer: `https://securetoken.google.com/${projectId}`,
				audience: projectId
			});

			return {
				uid: payload.sub as string,
				email: payload.email as string | undefined,
				name: payload.name as string | undefined,
				picture: payload.picture as string | undefined,
				firebase: {
					sign_in_provider: (payload.firebase as any)?.sign_in_provider as string
				}
			};
		} catch (error) {
			console.error('Token verification failed:', error);
			return null;
		}
	}
}
