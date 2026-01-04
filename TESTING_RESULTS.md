# SINDH Production Build & Testing Guide

## 🏗️ Build Artifacts
- **Release APK**: `SINDH-frontend/android/app/build/outputs/apk/release/app-release.apk`
- **Release AAB**: `SINDH-frontend/android/app/build/outputs/bundle/release/app-release.aab`

## 🔐 Signing Configuration
- **Keystore**: `SINDH-frontend/android/app/my-release-key.keystore`
- **Alias**: `my-key-alias`
- **Password**: Configured in `keystore.properties`

## 🛠️ Offline Capabilities
1. **IndexedDB Cache**: User profiles, jobs, and notifications are now cached locally.
2. **Service Worker**: Enhanced with stale-while-revalidate for API responses.
3. **Offline Banner**: Subtle banner appears at the top when connection is lost.

## 🔔 Push Notifications (FCM)
1. **Triggers**:
   - Worker applies to job → Employer push.
   - Employer releases payment → Worker push.
2. **In-App Notification Center**: Accessible via the bell icon in the Navbar.

## 🧪 Testing Checklist (Manual)
1. [ ] **Splash Screen**: Open app → Verify navy background with logo appears.
2. [ ] **Offline Mode**: 
   - Login successfully.
   - Enable Airplane Mode.
   - Navigate to Jobs or Profile → Verify "Offline" banner shows and data still loads.
3. [ ] **Push Notifications**:
   - Login on one device.
   - Trigger a job application from another account.
   - Verify push notification arrives.
4. [ ] **In-App Notifications**:
   - Open Notification Center (Bell icon).
   - Verify new notifications appear in real-time.
   - Click a notification → Verify redirection works.

## ⚠️ Post-Implementation Steps
1. **VAPID Key**: Ensure the VAPID key from Firebase Console is added to `SINDH-frontend/.env`.
2. **Keystore Backup**: Keep `my-release-key.keystore` in a secure location.


