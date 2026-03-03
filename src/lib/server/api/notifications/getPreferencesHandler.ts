import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { notificationPreferences } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { ALL_NOTIFICATION_TYPES, type NotificationType } from '$lib/configurations/notifications';

interface PreferenceRow {
	type: string;
	pushEnabled: boolean;
	inAppEnabled: boolean;
}

export async function getPreferencesHandler(
	user: App.User,
	env: Cloudflare.Env
): Promise<PreferenceRow[]> {
	const db = drizzle(env.DB, { schema });

	const rows = await db
		.select({
			type: notificationPreferences.type,
			pushEnabled: notificationPreferences.pushEnabled,
			inAppEnabled: notificationPreferences.inAppEnabled
		})
		.from(notificationPreferences)
		.where(eq(notificationPreferences.userId, user.id));

	const prefsMap = new Map(rows.map((r) => [r.type, r]));

	// Return all types with defaults for missing ones
	return ALL_NOTIFICATION_TYPES.map((type: NotificationType) => {
		const pref = prefsMap.get(type);
		return {
			type,
			pushEnabled: pref?.pushEnabled ?? true,
			inAppEnabled: pref?.inAppEnabled ?? true
		};
	});
}
