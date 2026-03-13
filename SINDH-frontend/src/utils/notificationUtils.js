import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Initialize Push Notifications for Native Platforms
 */
export async function initializePushNotifications(userId, userType) {
  if (!Capacitor.isNativePlatform() || !userId) return;

  console.log('FCM: Initializing Native Push Notifications');

  // Add listeners
  await PushNotifications.addListener('registration', async (token) => {
    console.log('FCM: Native registration successful, token:', token.value.substring(0, 10) + '...');

    // Save to Firestore
    try {
      const collectionName = userType === 'worker' ? 'workers' : 'employers';
      const userRef = doc(db, collectionName, userId);

      await updateDoc(userRef, {
        fcmToken: token.value,
        fcmTokenUpdatedAt: serverTimestamp(),
        lastPlatform: Capacitor.getPlatform()
      });
      console.log('FCM: Native token saved to Firestore');
    } catch (err) {
      console.error('FCM: Error saving native token:', err);
    }
  });

  await PushNotifications.addListener('registrationError', (err) => {
    console.error('FCM: Native registration error:', err.error);
  });

  await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('FCM: Push notification received:', notification);
    // In-app alert if app is open
    toast(`${notification.title}: ${notification.body}`, {
      icon: '🔔',
      duration: 4000
    });
  });

  await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('FCM: Push notification action performed:', notification);
    // Handle deep linking or navigation here if needed
  });

  // Register with FCM
  await PushNotifications.register();
}

/**
 * Request permission for notifications and store token in Firestore
 */
export async function requestNotificationPermission(userId, userType) {
  if (!userId || !userType) return null;

  try {
    // 1. Request Permission
    if (!Capacitor.isNativePlatform()) {
      // WEB LOGIC
      if (typeof Notification !== 'undefined') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('FCM: Web notification permission denied');
          return null;
        }
      }

      // 2. Get FCM Token (Web)
      const messaging = getMessaging();
      const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

      if (!vapidKey || vapidKey.includes('REPLACE_WITH_YOUR_VAPID_KEY')) {
        console.error('FCM: VAPID key is missing or not configured in .env');
        return null;
      }

      const currentToken = await getToken(messaging, { vapidKey });

      if (currentToken) {
        console.log('FCM: Web token received');
        const collectionName = userType === 'worker' ? 'workers' : 'employers';
        const userRef = doc(db, collectionName, userId);

        await updateDoc(userRef, {
          fcmToken: currentToken,
          fcmTokenUpdatedAt: serverTimestamp(),
          lastPlatform: 'web'
        });

        console.log('FCM: Web token saved to Firestore');
        return currentToken;
      }
    } else {
      // NATIVE LOGIC
      console.log('FCM: Requesting native permissions');
      const result = await PushNotifications.requestPermissions();
      if (result.receive === 'granted') {
        // Registration is usually handled by initializePushNotifications which calls .register()
        // but we can call it here too if we want immediate trigger
        await initializePushNotifications(userId, userType);
        return 'granted';
      } else {
        console.warn('FCM: Native permission denied');
        return null;
      }
    }
  } catch (error) {
    console.error('FCM: An error occurred while retrieving token:', error);
    return null;
  }
}

/**
 * Setup foreground message listener (Web Only)
 */
export function setupForegroundListener() {
  if (Capacitor.isNativePlatform()) return () => { };

  try {
    const messaging = getMessaging();

    return onMessage(messaging, (payload) => {
      console.log('FCM: Foreground message received (Web):', payload);

      const { title, body } = payload.notification;

      toast((t) => (
        <div className="flex flex-col gap-1 cursor-pointer" onClick={() => toast.dismiss(t.id)}>
          <div className="flex items-center justify-between">
            <span className="font-black text-[10px] uppercase text-[#FF7124] tracking-widest">
              Notification
            </span>
            <button className="text-[#3B4883]/40 hover:text-[#3B4883]">✕</button>
          </div>
          <p className="font-bold text-sm text-[#3B4883]">{title}</p>
          <p className="text-xs text-[#272D4E]/70 line-clamp-2">{body}</p>
        </div>
      ), {
        duration: 5000,
        position: 'top-right',
        style: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1.25rem',
          border: '2px solid rgba(59, 72, 131, 0.1)',
          padding: '1rem',
          boxShadow: '0 10px 25px -5px rgba(59, 72, 131, 0.1)',
        }
      });
    });
  } catch (error) {
    console.error('FCM: Error setting up foreground listener:', error);
    return () => { };
  }
}



