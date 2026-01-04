import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';

/**
 * Request permission for notifications and store token in Firestore
 */
export async function requestNotificationPermission(userId, userType) {
  if (!userId || !userType) return null;

  try {
    // 1. Request Permission
    if (Capacitor.getPlatform() === 'web' && typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('FCM: Notification permission denied');
        return null;
      }
    } else {
      console.log(`FCM: Skipping web Notification API check on ${Capacitor.getPlatform()}`);
      // On native platform, permissions should ideally be requested via @capacitor/push-notifications
    }

    // 2. Get FCM Token
    const messaging = getMessaging();

    // VAPID key is required for Web Push
    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
    if (!vapidKey || vapidKey.includes('REPLACE_WITH_YOUR_VAPID_KEY')) {
      console.error('FCM: VAPID key is missing or not configured in .env');
      return null;
    }

    const currentToken = await getToken(messaging, { vapidKey });

    if (currentToken) {
      console.log('FCM: Token received:', currentToken.substring(0, 10) + '...');

      // 3. Save to Firestore
      const collectionName = userType === 'worker' ? 'workers' : 'employers';
      const userRef = doc(db, collectionName, userId);

      await updateDoc(userRef, {
        fcmToken: currentToken,
        fcmTokenUpdatedAt: serverTimestamp()
      });

      console.log('FCM: Token saved to Firestore');
      return currentToken;
    } else {
      console.warn('FCM: No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (error) {
    console.error('FCM: An error occurred while retrieving token:', error);
    return null;
  }
}

/**
 * Setup foreground message listener
 */
export function setupForegroundListener() {
  try {
    const messaging = getMessaging();

    return onMessage(messaging, (payload) => {
      console.log('FCM: Foreground message received:', payload);

      // Show custom toast for in-app experience
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
          border: '2px border-[#3B4883]/10',
          padding: '1rem',
          boxShadow: '0 10px 25px -5px rgba(59, 72, 131, 0.1), 0 8px 10px -6px rgba(59, 72, 131, 0.1)',
        }
      });
    });
  } catch (error) {
    console.error('FCM: Error setting up foreground listener:', error);
    return () => { };
  }
}


