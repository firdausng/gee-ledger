/**
 * Verify a Stripe webhook signature using Web Crypto API (CF Workers compatible).
 *
 * Stripe sends a `stripe-signature` header in the format:
 *   t=<timestamp>,v1=<signature>[,v1=<signature>...]
 *
 * Signature is HMAC-SHA256(timestamp + "." + rawBody) using the webhook secret.
 */

const TOLERANCE_SECONDS = 300; // 5 minutes

/** Convert an ArrayBuffer to a hex string. */
function bufferToHex(buffer: ArrayBuffer): string {
	return [...new Uint8Array(buffer)]
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

/** Timing-safe comparison of two hex strings. */
function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	const encoder = new TextEncoder();
	const ab = encoder.encode(a);
	const bb = encoder.encode(b);
	let result = 0;
	for (let i = 0; i < ab.length; i++) {
		result |= ab[i] ^ bb[i];
	}
	return result === 0;
}

/** Parse the stripe-signature header. */
function parseSignatureHeader(header: string): { timestamp: number; signatures: string[] } {
	let timestamp = 0;
	const signatures: string[] = [];

	for (const part of header.split(',')) {
		const [key, value] = part.split('=', 2);
		if (key === 't') {
			timestamp = parseInt(value, 10);
		} else if (key === 'v1') {
			signatures.push(value);
		}
	}

	return { timestamp, signatures };
}

export async function verifyStripeWebhook(
	secret: string,
	signatureHeader: string,
	rawBody: string,
): Promise<boolean> {
	const { timestamp, signatures } = parseSignatureHeader(signatureHeader);

	if (!timestamp || signatures.length === 0) {
		return false;
	}

	// Replay protection
	const now = Math.floor(Date.now() / 1000);
	if (Math.abs(now - timestamp) > TOLERANCE_SECONDS) {
		return false;
	}

	// Compute expected signature
	const payload = `${timestamp}.${rawBody}`;
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	const key = await crypto.subtle.importKey(
		'raw',
		keyData.buffer as ArrayBuffer,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const payloadBytes = encoder.encode(payload);
	const signatureBuffer = await crypto.subtle.sign('HMAC', key, payloadBytes.buffer as ArrayBuffer);
	const expected = bufferToHex(signatureBuffer);

	// Check if any v1 signature matches
	return signatures.some((sig) => timingSafeEqual(sig, expected));
}
