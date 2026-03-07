import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { getApp } from 'firebase/app';
import { PUBLIC_FIREBASE_VAPID_KEY } from '$env/static/public';
import { firebaseConfig } from '$lib/config/firebase.client';

let messaging: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
	if (messaging) return messaging;
	if (typeof window === 'undefined') return null;
	try {
		messaging = getMessaging(getApp());
		return messaging;
	} catch {
		console.warn('Firebase Messaging not supported in this browser');
		return null;
	}
}

export async function requestNotificationPermission(): Promise<
	'granted' | 'denied' | 'default'
> {
	if (typeof window === 'undefined') return 'default';
	return Notification.requestPermission();
}

export async function getFCMToken(): Promise<string | null> {
	const msg = getMessagingInstance();
	if (!msg) return null;

	try {
		const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
		registration.active?.postMessage({
			type: 'FIREBASE_CONFIG',
			config: firebaseConfig
		});

		const token = await getToken(msg, {
			vapidKey: PUBLIC_FIREBASE_VAPID_KEY,
			serviceWorkerRegistration: registration
		});
		return token;
	} catch (err) {
		console.error('Failed to get FCM token:', err);
		return null;
	}
}

export async function registerDeviceToken(idToken: string): Promise<void> {
	const permission = await requestNotificationPermission();
	if (permission !== 'granted') return;

	const fcmToken = await getFCMToken();
	if (!fcmToken) return;

	localStorage.setItem('fcm_token', fcmToken);

	await fetch('/api/notifications/device-token', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${idToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ token: fcmToken, platform: 'web' })
	});
}

export async function removeDeviceToken(idToken: string): Promise<void> {
	const fcmToken = localStorage.getItem('fcm_token');
	if (!fcmToken) return;

	await fetch('/api/notifications/device-token', {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${idToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ token: fcmToken })
	});

	localStorage.removeItem('fcm_token');
}

export function onForegroundMessage(
	callback: (payload: {
		title?: string;
		body?: string;
		data?: Record<string, string>;
	}) => void
): (() => void) | null {
	const msg = getMessagingInstance();
	if (!msg) return null;

	return onMessage(msg, (payload) => {
		const data = payload.data as Record<string, string> | undefined;
		callback({
			title: payload.notification?.title ?? data?.title,
			body: payload.notification?.body ?? data?.body,
			data
		});
	});
}
