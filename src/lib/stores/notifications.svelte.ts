import { api } from '$lib/client/api.svelte';

export interface AppNotification {
	id: string;
	type: string;
	title: string;
	body: string;
	data: string | null;
	actionUrl: string | null;
	isRead: boolean;
	createdAt: string;
}

export const notificationState = $state<{
	notifications: AppNotification[];
	unreadCount: number;
	loading: boolean;
	open: boolean;
}>({
	notifications: [],
	unreadCount: 0,
	loading: false,
	open: false
});

export const notificationActions = {
	async fetchNotifications(): Promise<void> {
		notificationState.loading = true;
		try {
			const res = await api.get<{ items: AppNotification[]; unreadCount: number }>(
				'/notifications?limit=20'
			);
			notificationState.notifications = res.items;
			notificationState.unreadCount = res.unreadCount;
		} catch {
			// Silently fail
		} finally {
			notificationState.loading = false;
		}
	},

	async markAsRead(notificationId: string): Promise<void> {
		try {
			await api.patch(`/notifications/${notificationId}/read`, {});
			const n = notificationState.notifications.find((n) => n.id === notificationId);
			if (n && !n.isRead) {
				n.isRead = true;
				notificationState.unreadCount = Math.max(0, notificationState.unreadCount - 1);
			}
		} catch {
			// Silently fail
		}
	},

	async markAllAsRead(): Promise<void> {
		try {
			await api.patch('/notifications/read-all', {});
			for (const n of notificationState.notifications) {
				n.isRead = true;
			}
			notificationState.unreadCount = 0;
		} catch {
			// Silently fail
		}
	},

	addFromPush(payload: {
		title?: string;
		body?: string;
		data?: Record<string, string>;
	}): void {
		const item: AppNotification = {
			id: payload.data?.notificationId ?? crypto.randomUUID(),
			type: payload.data?.type ?? 'unknown',
			title: payload.title ?? '',
			body: payload.body ?? '',
			data: payload.data ? JSON.stringify(payload.data) : null,
			actionUrl: payload.data?.actionUrl ?? null,
			isRead: false,
			createdAt: new Date().toISOString()
		};
		notificationState.notifications.unshift(item);
		notificationState.unreadCount += 1;
	}
};
