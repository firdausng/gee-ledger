import { authState } from '$lib/stores/auth.svelte';

async function getToken(): Promise<string | null> {
	if (!authState.user) return null;
	return authState.user.getIdToken();
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
	const token = await getToken();
	return fetch(`/api${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...(options.headers as Record<string, string> | undefined)
		}
	});
}

async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
	const token = await getToken();
	const res = await fetch(`/api${path}`, {
		method: 'POST',
		body: formData,
		// Do NOT set Content-Type — browser sets it with the correct multipart boundary
		headers: token ? { Authorization: `Bearer ${token}` } : {}
	});
	const body = (await res.json()) as { data?: T; error?: string };
	if (!res.ok) throw new Error(body?.error ?? `Upload failed: ${res.status}`);
	return body.data as T;
}

async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
	const res = await apiFetch(path, options);
	const body = (await res.json()) as { data?: T; error?: string };
	if (!res.ok) throw new Error(body?.error ?? `Request failed: ${res.status}`);
	return body.data as T;
}

export const api = {
	get: <T>(path: string) => apiJson<T>(path),
	post: <T>(path: string, body: unknown) =>
		apiJson<T>(path, { method: 'POST', body: JSON.stringify(body) }),
	put: <T>(path: string, body: unknown) =>
		apiJson<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
	patch: <T>(path: string, body: unknown) =>
		apiJson<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
	delete: <T>(path: string) => apiJson<T>(path, { method: 'DELETE' }),
	upload: <T>(path: string, formData: FormData) => apiUpload<T>(path, formData)
};

export function formatAmount(cents: number, currency = 'USD'): string {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export function parseToCents(value: string): number {
	return Math.round(parseFloat(value) * 100);
}
