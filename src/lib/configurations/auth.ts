/** Allowed email domains for invitations. Extend this list when adding new auth providers. */
export const ALLOWED_EMAIL_DOMAINS = ['gmail.com'];

export function isAllowedEmailDomain(email: string): boolean {
	const domain = email.split('@')[1]?.toLowerCase();
	return !!domain && ALLOWED_EMAIL_DOMAINS.includes(domain);
}
