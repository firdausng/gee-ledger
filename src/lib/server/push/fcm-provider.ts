import type { PushMessage, PushProvider, PushSendResult } from './types';
import { getAccessToken } from './fcm-auth';

export class FCMPushProvider implements PushProvider {
	constructor(
		private serviceAccountJson: string,
		private projectId: string
	) {}

	async sendToTokens(tokens: string[], message: PushMessage): Promise<PushSendResult[]> {
		const accessToken = await getAccessToken(this.serviceAccountJson);

		const results = await Promise.allSettled(
			tokens.map((token) => this.sendSingle(accessToken, token, message))
		);

		return results.map((r, i) =>
			r.status === 'fulfilled'
				? r.value
				: { token: tokens[i], success: false, error: String(r.reason) }
		);
	}

	private async sendSingle(
		accessToken: string,
		token: string,
		message: PushMessage
	): Promise<PushSendResult> {
		// Use data-only messages for full control over display in both
		// foreground (onMessage) and background (onBackgroundMessage).
		// Including a `notification` field can cause the service worker to
		// auto-display and bypass our client-side handlers.
		const fcmMessage: Record<string, unknown> = {
			token,
			data: {
				...(message.data ?? {}),
				title: message.title,
				body: message.body
			}
		};

		const res = await fetch(
			`https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ message: fcmMessage })
			}
		);

		if (!res.ok) {
			const body = await res.text();
			// Only treat as invalid token for clear "not registered" / "not found" errors.
			// 400 can mean many things (malformed payload, quota, etc.) — don't delete tokens for those.
			const invalidToken =
				res.status === 404 ||
				body.includes('UNREGISTERED') ||
				body.includes('INVALID_ARGUMENT') && body.includes('not a valid FCM registration token');
			return { token, success: false, error: body, invalidToken };
		}

		return { token, success: true };
	}
}
