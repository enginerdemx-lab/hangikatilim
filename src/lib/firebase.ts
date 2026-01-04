/**
 * Firebase Configuration and Messaging Setup
 * 
 * Environment variables required:
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_APP_ID
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_VAPID_KEY
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Initialize Firebase
let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase app and messaging
 */
export const initializeFirebase = (): { app: FirebaseApp; messaging: Messaging } | null => {
    // Check if all required config values are present
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.warn('[Firebase] Missing configuration. Push notifications disabled.');
        return null;
    }

    try {
        if (!app) {
            app = initializeApp(firebaseConfig);
            console.log('[Firebase] App initialized');
        }

        if (!messaging && typeof window !== 'undefined' && 'Notification' in window) {
            messaging = getMessaging(app);
            console.log('[Firebase] Messaging initialized');
        }

        return app && messaging ? { app, messaging } : null;
    } catch (error) {
        console.error('[Firebase] Initialization error:', error);
        return null;
    }
};

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
    try {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.warn('[Firebase] Notifications not supported');
            return null;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        console.log('[Firebase] Permission status:', permission);

        if (permission !== 'granted') {
            console.warn('[Firebase] Permission denied');
            return null;
        }

        // Initialize Firebase if not already done
        const firebase = initializeFirebase();
        if (!firebase || !firebase.messaging) {
            console.error('[Firebase] Messaging not available');
            return null;
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('[Firebase] Service Worker registered:', registration.scope);

        // Get FCM token
        const token = await getToken(firebase.messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (token) {
            console.log('[Firebase] FCM Token obtained:', token.substring(0, 20) + '...');
            return token;
        } else {
            console.warn('[Firebase] No token available');
            return null;
        }
    } catch (error) {
        console.error('[Firebase] Error getting token:', error);
        return null;
    }
};

/**
 * Listen for foreground messages
 */
export const onForegroundMessage = (callback: (payload: any) => void): (() => void) | null => {
    const firebase = initializeFirebase();
    if (!firebase || !firebase.messaging) {
        return null;
    }

    const unsubscribe = onMessage(firebase.messaging, (payload) => {
        console.log('[Firebase] Foreground message received:', payload);
        callback(payload);
    });

    return unsubscribe;
};

/**
 * Check if notifications are supported and permission status
 */
export const getNotificationStatus = (): 'supported' | 'denied' | 'granted' | 'default' | 'unsupported' => {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission as 'denied' | 'granted' | 'default';
};

export { app, messaging };
