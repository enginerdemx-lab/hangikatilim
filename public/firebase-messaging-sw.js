/**
 * Firebase Messaging Service Worker
 * 
 * Handles background push notifications when the app is not in focus.
 * This file MUST be in the public folder and served from the root path.
 */

// Import Firebase scripts (using compat version for service workers)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration - these will be injected at runtime
// For now, we initialize with minimal config (messaging only needs these)
firebase.initializeApp({
    apiKey: 'AIzaSyBI126g0cctH88ZQ8tF0NNXr5ckL1NJYYQ',
    projectId: 'hangikatilim',
    messagingSenderId: '149962691238',
    appId: '1:149962691238:web:1e79df3c1dbf8bf93a9a67',
});

const messaging = firebase.messaging();

/**
 * Handle background messages
 * This is called when the app is in the background or closed
 */
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    // If payload has a 'notification' property, the browser naturally handles it.
    // We only need to show a notification manually if it's a data-only message.
    if (payload.notification) {
        // Let the browser handle the display to avoid duplicates.
        return;
    }

    const notificationTitle = payload.data?.title || 'Yeni Bildirim';
    const notificationOptions = {
        body: payload.data?.body || '',
        icon: '/notification-icon-v2.png',
        badge: '/notification-icon-v2.png',
        tag: payload.data?.tag || 'default',
        data: {
            url: payload.data?.url || payload.fcmOptions?.link || '/',
        },
        image: payload.data?.image || null, // Show image if present
        vibrate: [100, 50, 100],
        actions: [
            {
                action: 'open',
                title: 'Aç',
            },
        ],
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Handle notification click
 * Opens the URL specified in the notification data
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    // Focus existing window or open new one
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    // Navigate to the URL
                    client.navigate(urlToOpen);
                    return;
                }
            }
            // No window open, open new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

/**
 * Handle push event (fallback for data-only messages)
 */
self.addEventListener('push', (event) => {
    console.log('[SW] Push event received:', event);

    if (event.data) {
        try {
            const data = event.data.json();
            console.log('[SW] Push data:', data);
        } catch (e) {
            console.log('[SW] Push text:', event.data.text());
        }
    }
});

console.log('[SW] Firebase Messaging Service Worker loaded');
