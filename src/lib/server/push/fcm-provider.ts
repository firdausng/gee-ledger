import type { PushMessage, PushProvider, PushSendResult } from './types';
import { getAccessToken } from './fcm-auth';

export class FCMPushProvider implements PushProvider {
	constructor(
		private serviceAccountJson: string,
		private projectId: string,
		private appDomain: string
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
		const fcmMessage: Record<string, unknown> = {
			token,
			notification: {
				title: message.title,
				body: message.body
			}
		};

		if (message.data) {
			fcmMessage.data = message.data;
		}

		if (message.actionUrl) {
			fcmMessage.webpush = {
				fcm_options: {
					link: `https://${this.appDomain}${message.actionUrl}`
				}
			};
		}

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
			const invalidToken = res.status === 404 || res.status === 400;
			return { token, success: false, error: body, invalidToken };
		}

		return { token, success: true };
	}
}
