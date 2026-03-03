import { SignJWT, importPKCS8 } from 'jose';

interface ServiceAccountKey {
	client_email: string;
	private_key: string;
	token_uri: string;
}

interface CachedToken {
	access_token: string;
	expires_at: number;
}

let cachedToken: CachedToken | null = null;

export async function getAccessToken(serviceAccountJson: string): Promise<string> {
	if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) {
		return cachedToken.access_token;
	}

	const sa: ServiceAccountKey = JSON.parse(serviceAccountJson);
	const privateKey = await importPKCS8(sa.private_key, 'RS256');

	const now = Math.floor(Date.now() / 1000);
	const jwt = await new SignJWT({
		iss: sa.client_email,
		sub: sa.client_email,
		aud: sa.token_uri,
		scope: 'https://www.googleapis.com/auth/firebase.messaging',
		iat: now,
		exp: now + 3600
	})
		.setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
		.sign(privateKey);

	const res = await fetch(sa.token_uri, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion: jwt
		})
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Failed to get Google access token: ${res.status} ${text}`);
	}

	const data = (await res.json()) as { access_token: string; expires_in: number };
	cachedToken = {
		access_token: data.access_token,
		expires_at: Date.now() + data.expires_in * 1000
	};

	return data.access_token;
}
