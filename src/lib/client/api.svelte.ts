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

async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
	const res = await apiFetch(path, options);
	const body = await res.json();
	if (!res.ok) throw new Error(body?.error ?? `Request failed: ${res.status}`);
	return body.data as T;
}

export const api = {
	get: <T>(path: string) => apiJson<T>(path),
	post: <T>(path: string, body: unknown) =>
		apiJson<T>(path, { method: 'POST', body: JSON.stringify(body) }),
	patch: <T>(path: string, body: unknown) =>
		apiJson<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
	delete: <T>(path: string) => apiJson<T>(path, { method: 'DELETE' })
};

export function formatAmount(cents: number, currency = 'MYR'): string {
	return new Intl.NumberFormat('en-MY', { style: 'currency', currency }).format(cents / 100);
}

export function parseToCents(value: string): number {
	return Math.round(parseFloat(value) * 100);
}
