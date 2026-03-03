/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

let messagingInitialized = false;

self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'FIREBASE_CONFIG' && !messagingInitialized) {
		firebase.initializeApp(event.data.config);
		const messaging = firebase.messaging();

		messaging.onBackgroundMessage((payload) => {
			const notification = payload.notification || {};
			const data = payload.data || {};

			self.registration.showNotification(notification.title || 'Gee Ledger', {
				body: notification.body || '',
				icon: '/favicon.svg',
				badge: '/favicon.svg',
				data: data,
				tag: data.notificationId || 'default'
			});
		});

		messagingInitialized = true;
	}
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const actionUrl = event.notification.data?.actionUrl || '/businesses';

	event.waitUntil(
		clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
			for (const client of windowClients) {
				if (client.url.includes(self.location.origin) && 'focus' in client) {
					client.focus();
					client.navigate(actionUrl);
					return;
				}
			}
			return clients.openWindow(actionUrl);
		})
	);
});
