import { drizzle } from 'drizzle-orm/d1';
import { eq, and, inArray } from 'drizzle-orm';
import { notifications, deviceTokens, notificationPreferences } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import type { PushProvider } from './types';
import { FCMPushProvider } from './fcm-provider';
import type { NotificationType } from '$lib/configurations/notifications';


export function createPushProvider(env: Cloudflare.Env): PushProvider | null {
	if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
		return new FCMPushProvider(
			env.FIREBASE_SERVICE_ACCOUNT_JSON,
			env.PUBLIC_FIREBASE_PROJECT_ID
		);
	}
	return null;
}

interface DispatchParams {
	recipientUserIds: string[];
	type: NotificationType;
	title: string;
	body: string;
	data?: Record<string, string>;
	actionUrl?: string;
	env: Cloudflare.Env;
}

export async function dispatchNotification(params: DispatchParams): Promise<void> {
	const { recipientUserIds, type, title, body, data, actionUrl, env } = params;
	if (recipientUserIds.length === 0) return;

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	// Check user preferences
	const prefs = await db
		.select({
			userId: notificationPreferences.userId,
			pushEnabled: notificationPreferences.pushEnabled,
			inAppEnabled: notificationPreferences.inAppEnabled
		})
		.from(notificationPreferences)
		.where(
			and(
				inArray(notificationPreferences.userId, recipientUserIds),
				eq(notificationPreferences.type, type)
			)
		);

	const prefsMap = new Map(prefs.map((p) => [p.userId, p]));

	// Default: both enabled if no preference row exists
	const inAppUserIds = recipientUserIds.filter((uid) => {
		const pref = prefsMap.get(uid);
		return !pref || pref.inAppEnabled;
	});

	const pushUserIds = recipientUserIds.filter((uid) => {
		const pref = prefsMap.get(uid);
		return !pref || pref.pushEnabled;
	});

	// 1. Insert in-app notifications
	if (inAppUserIds.length > 0) {
		await db.insert(notifications).values(
			inAppUserIds.map((userId) => ({
				id: crypto.randomUUID(),
				userId,
				type,
				title,
				body,
				data: data ? JSON.stringify(data) : null,
				actionUrl: actionUrl ?? null,
				isRead: false,
				createdAt: now
			}))
		);
	}

	// 2. Send push notifications
	if (pushUserIds.length > 0) {
		const provider = createPushProvider(env);
		if (!provider) return;

		const tokens = await db
			.select({ token: deviceTokens.token })
			.from(deviceTokens)
			.where(inArray(deviceTokens.userId, pushUserIds));

		if (tokens.length > 0) {
			try {
				const results = await provider.sendToTokens(
					tokens.map((t) => t.token),
					{ title, body, data: { ...data, type, actionUrl: actionUrl ?? '' }, actionUrl }
				);
				const failed = results.filter((r) => !r.success);
				if (failed.length > 0) {
					console.error('[push] Failed sends:', JSON.stringify(failed));
				}
				const invalidTokens = results
					.filter((r) => r.invalidToken)
					.map((r) => r.token);
				if (invalidTokens.length > 0) {
					await db.delete(deviceTokens)
						.where(inArray(deviceTokens.token, invalidTokens))
						.catch((err) => console.error('Failed to clean up invalid tokens:', err));
				}
			} catch (err) {
				console.error('[push] Send failed:', err);
			}
		}
	}
}
