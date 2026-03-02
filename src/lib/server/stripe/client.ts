const STRIPE_API = 'https://api.stripe.com/v1';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Encode an object into Stripe's x-www-form-urlencoded format (supports nested keys). */
function formEncode(data: Record<string, unknown>, prefix = ''): string {
	const parts: string[] = [];

	for (const [key, value] of Object.entries(data)) {
		if (value === undefined || value === null) continue;
		const fullKey = prefix ? `${prefix}[${key}]` : key;

		if (typeof value === 'object' && !Array.isArray(value)) {
			parts.push(formEncode(value as Record<string, unknown>, fullKey));
		} else if (Array.isArray(value)) {
			value.forEach((item, i) => {
				if (typeof item === 'object') {
					parts.push(formEncode(item as Record<string, unknown>, `${fullKey}[${i}]`));
				} else {
					parts.push(`${encodeURIComponent(`${fullKey}[${i}]`)}=${encodeURIComponent(String(item))}`);
				}
			});
		} else {
			parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`);
		}
	}

	return parts.filter(Boolean).join('&');
}

async function stripeRequest<T>(secretKey: string, method: string, path: string, body?: Record<string, unknown>, idempotencyKey?: string): Promise<T> {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${secretKey}`,
		'Content-Type': 'application/x-www-form-urlencoded',
	};
	if (idempotencyKey) {
		headers['Idempotency-Key'] = idempotencyKey;
	}

	const res = await fetch(`${STRIPE_API}${path}`, {
		method,
		headers,
		body: body ? formEncode(body) : undefined,
	});

	const json = await res.json() as T & { error?: { message: string } };

	if (!res.ok) {
		const msg = (json as { error?: { message: string } }).error?.message ?? `Stripe API error ${res.status}`;
		throw new Error(msg);
	}

	return json;
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface CheckoutSessionParams {
	priceId: string;
	customerEmail: string;
	clientReferenceId: string;
	successUrl: string;
	cancelUrl: string;
	metadata?: Record<string, string>;
	idempotencyKey?: string;
}

export interface CheckoutSession {
	id: string;
	url: string;
}

export async function createCheckoutSession(
	env: Cloudflare.Env,
	params: CheckoutSessionParams,
): Promise<CheckoutSession> {
	return stripeRequest<CheckoutSession>(env.STRIPE_SECRET_KEY, 'POST', '/checkout/sessions', {
		mode: 'subscription',
		'line_items': [{ price: params.priceId, quantity: '1' }],
		customer_email: params.customerEmail,
		client_reference_id: params.clientReferenceId,
		success_url: params.successUrl,
		cancel_url: params.cancelUrl,
		metadata: params.metadata,
	}, params.idempotencyKey);
}

export interface PortalSession {
	id: string;
	url: string;
}

export async function createPortalSession(
	env: Cloudflare.Env,
	params: { customerId: string; returnUrl: string },
): Promise<PortalSession> {
	return stripeRequest<PortalSession>(env.STRIPE_SECRET_KEY, 'POST', '/billing_portal/sessions', {
		customer: params.customerId,
		return_url: params.returnUrl,
	});
}
