# SINDH Mobile Integration Testing Guide

> **Last Updated:** October 19, 2025  
> **Version:** 1.0.0  
> **Purpose:** Comprehensive testing procedures for mobile environment detection, backend integration, and Capacitor plugins

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Mobile Environment Detection Testing](#mobile-environment-detection-testing)
4. [Backend Integration Testing](#backend-integration-testing)
5. [Capacitor Plugin Testing](#capacitor-plugin-testing)
6. [Network Monitoring Testing](#network-monitoring-testing)
7. [Service File Integration Testing](#service-file-integration-testing)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Testing Checklist](#testing-checklist)

---

## 🎯 Overview

The SINDH mobile app uses **Capacitor 7** to provide native mobile functionality while sharing code with the web application. This guide covers testing all aspects of the mobile integration to ensure proper functionality.

> NOTE: During Phase 5 testing we add a temporary route `/test-mobile` to the app for convenience. This route renders `MobileConnectionTest` and should be removed before publishing the release build. See Step 3 in the guide for usage.

### Architecture Summary

- **Frontend**: React 18 with Capacitor 7.4.2
- **Mobile Detection**: `window.Capacitor || window.cordova` check
- **Backend Routing**: Automatic production backend for mobile apps
- **Plugins**: Camera, Geolocation, Network, StatusBar, SplashScreen, Keyboard

---

## 🛠️ Prerequisites

### Required Software

- ✅ **Android Studio** (latest version)
- ✅ **Android SDK** (API 23-35)
- ✅ **Node.js** (v16+) and npm
- ✅ **Java 17** (not Java 21)

### Build Steps

```powershell
# 1. Build React app
cd SINDH-frontend
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. Run app on device/emulator
# Use Android Studio's Run button
```

---

## 📱 Mobile Environment Detection Testing

### Test 1: Verify Capacitor Detection

**Objective:** Confirm that the app correctly identifies itself as a mobile app

**Steps:**
1. Run app on Android device/emulator
2. Open Chrome DevTools: `chrome://inspect`
3. Select your device
4. Open Console tab

**Expected Results:**
```javascript
// In console, check:
window.Capacitor !== undefined  // true
window.Capacitor.isNativePlatform()  // true
window.Capacitor.getPlatform()  // "android"
```

**Automated Test:**
```javascript
// In DevTools console:
import { testMobileDetection } from './src/config/api';
testMobileDetection();

// Should show:
// ✅ isMobileApp: true
// ✅ platform: "android"
// ✅ isNativePlatform: true
// ✅ selectedApiUrl: "http://localhost:10000/api"
```

### Test 2: Verify Production Backend Selection

**Objective:** Ensure mobile app uses production backend, not localhost

**Steps:**
1. Navigate to `/test-mobile` route in the app
2. Click "Run All Tests" button
3. Check "Mobile Detection" section

**Expected Results:**
- Environment: `production`
- Is Mobile: `Yes` (green)
- Platform: `android`
- Backend: `Production` (green)
- API URL: `http://localhost:10000/api`

**CRITICAL:** If it shows localhost URL, the refactoring failed!

---

## 🌐 Backend Integration Testing

### Test 1: Worker Service Integration

**Objective:** Verify worker registration uses production backend

**Steps:**
1. Navigate to worker registration screen
2. Fill in worker details
3. Submit registration
4. Open DevTools Network tab

**Expected Results:**
- Request URL contains: `http://localhost:10000/api/workers/register`
- **NO localhost URLs** in Network tab
- Response status: `200` or `201`
- Worker created successfully

**Debug If Failed:**
```javascript
// Check service configuration:
import workerService from './src/services/workerService';
console.log(workerService.api.defaults.baseURL);
// Should be: "http://localhost:10000/api"
```

### Test 2: Employer Service Integration

**Objective:** Verify employer flows use production backend

**Steps:**
1. Navigate to employer registration
2. Fill in employer details
3. Submit registration
4. Post a new job

**Expected Results:**
- All requests go to `http://localhost:10000/api`
- Employer registration successful
- Job posting successful
- **NO localhost calls** in Network tab

### Test 3: Job Service Integration

**Objective:** Verify job browsing uses production backend

**Steps:**
1. Navigate to jobs list
2. Browse available jobs
3. Apply for a job

**Expected Results:**
- Jobs load correctly from production backend
- Application submission successful
- Response times < 3 seconds

---

## 🔌 Capacitor Plugin Testing

### Test 1: StatusBar Plugin

**Objective:** Verify status bar customization

**Steps:**
1. Launch app
2. Observe status bar at top of screen

**Expected Results:**
- Status bar background color: `#ff6b35` (orange)
- Status bar style: Dark (white icons)
- Status bar visible on all screens

**Debug:**
```javascript
// In DevTools console:
import { StatusBar } from '@capacitor/status-bar';
await StatusBar.getInfo();
// Should show: style: 'DARK', color: '#ff6b35'
```

### Test 2: SplashScreen Plugin

**Objective:** Verify splash screen shows and hides correctly

**Steps:**
1. Close app completely
2. Relaunch app
3. Observe startup sequence

**Expected Results:**
- Splash screen appears immediately
- Splash screen hides after ~2 seconds
- Smooth transition to main screen

### Test 3: Network Plugin

**Objective:** Verify network status detection

**Steps:**
1. Enable WiFi, launch app
2. Navigate to `/test-mobile`
3. Check Network Status section
4. Disable WiFi
5. Re-check Network Status

**Expected Results:**
- Initial status: `Connected: Yes`, `Type: wifi`
- After disabling WiFi: `Connected: No`, `Type: none`
- Network change events dispatched

**Automated Test:**
```javascript
// In DevTools console:
import mobileService from './src/services/mobileService';
await mobileService.testNetworkMonitoring();
// Shows current connection status
```

### Test 4: Camera Plugin

**Objective:** Verify camera access and photo capture

**Steps:**
1. Navigate to profile image upload screen
2. Tap "Take Photo" button
3. Grant camera permission when prompted
4. Take a photo
5. Verify photo appears in preview

**Expected Results:**
- Permission dialog appears (first time only)
- Camera opens successfully
- Photo captured and returned to app
- Photo displays correctly

**Permissions Required:** `android.permission.CAMERA` (already in AndroidManifest.xml)

### Test 5: Geolocation Plugin

**Objective:** Verify location access

**Steps:**
1. Navigate to location-based feature (if implemented)
2. Request location
3. Grant permission when prompted

**Expected Results:**
- Permission dialog appears (first time only)
- Location obtained successfully
- Latitude/longitude values returned

**Permissions Required:** `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` (already in AndroidManifest.xml)

### Test 6: Keyboard Plugin

**Objective:** Verify keyboard events

**Steps:**
1. Tap any text input field
2. Observe keyboard behavior
3. Tap outside input to dismiss keyboard

**Expected Results:**
- Keyboard shows when input focused
- `keyboard-open` class added to `<body>`
- Keyboard hides when input loses focus
- Class removed from `<body>`

---

## 📡 Network Monitoring Testing

### Test 1: Online/Offline Detection

**Objective:** Verify network status changes are detected

**Steps:**
1. Launch app with WiFi enabled
2. Navigate to `/test-mobile`
3. Check network status: should show "Connected"
4. Disable WiFi in Android settings
5. Return to app
6. Check network status: should show "Disconnected"

**Expected Results:**
- Network status updates automatically
- Custom events dispatched on change
- UI reflects current status

### Test 2: Connection Type Detection

**Objective:** Verify different connection types are identified

**Steps:**
1. Connect via WiFi → Check status
2. Disconnect WiFi, enable mobile data → Check status
3. Enable airplane mode → Check status

**Expected Results:**
- WiFi: `connectionType: "wifi"`
- Mobile data: `connectionType: "cellular"`
- Airplane mode: `connectionType: "none"`, `connected: false`

---

## 🔄 Service File Integration Testing

### Test 1: No Localhost Calls

**CRITICAL TEST:** Ensure mobile app never tries to contact localhost

**Steps:**
1. Open DevTools Network tab
2. Clear all requests
3. Perform multiple actions:
   - Register worker
   - Register employer
   - Browse jobs
   - Apply for job
   - Upload photo
4. Filter Network tab by "localhost"

**Expected Results:**
- **ZERO requests to localhost**
- All requests go to `https://sindh-backend.onrender.com`

**If localhost requests appear:**
```powershell
# Service files not properly refactored!
# Check these files:
# - src/services/workerService.js
# - src/services/employerService.js
# - src/components/employer/EmployerProfile.jsx
```

### Test 2: Service Methods Functionality

**Objective:** Verify all service methods work with production backend

**Test Matrix:**

| Service | Method | Expected Result |
|---------|--------|----------------|
| workerService | `registerWorker()` | ✅ Worker created |
| workerService | `login()` | ✅ Token returned |
| workerService | `uploadProfileImage()` | ✅ Image URL returned |
| employerService | `register()` | ✅ Employer created |
| employerService | `postJob()` | ✅ Job created |
| jobService | `getAllJobs()` | ✅ Jobs array returned |
| jobService | `applyForJob()` | ✅ Application submitted |

---

## 🐛 Troubleshooting Guide

### Issue: App shows "localhost" in API calls

**Symptoms:**
- Network tab shows `http://localhost:10000/api`
- API calls fail with "ERR_CONNECTION_REFUSED"

**Solution:**
```powershell
# 1. Verify service files use buildApiUrl:
# Check src/services/workerService.js line 2-3:
import { buildApiUrl } from '../utils/apiUtils';
const api = axios.create({ baseURL: buildApiUrl('') });

# 2. Rebuild app:
npm run build
npx cap sync android

# 3. Clean Android build:
# In Android Studio: Build → Clean Project
# Then: Build → Rebuild Project

# 4. Uninstall old app from device
# 5. Install fresh build
```

### Issue: Capacitor not detected

**Symptoms:**
- `window.Capacitor` is undefined
- Test shows `isMobileApp: false`

**Solution:**
```powershell
# 1. Verify running on Android device, NOT web browser
# 2. Check Capacitor installation:
npx cap doctor

# 3. Verify package.json contains:
# "@capacitor/core": "^7.4.2"
# "@capacitor/android": "^7.4.2"

# 4. Reinstall Capacitor:
npm install @capacitor/core @capacitor/android
npx cap sync android
```

### Issue: Plugins not working

**Symptoms:**
- Camera doesn't open
- Location not detected
- Network status not updating

**Solution:**
```xml
<!-- 1. Verify AndroidManifest.xml contains permissions: -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- 2. Check network_security_config.xml allows localhost for development: -->
<!-- (Located in android/app/src/main/res/xml/) -->

<!-- 3. Verify plugin versions in package.json: -->
"@capacitor/camera": "^6.0.0"
"@capacitor/geolocation": "^6.0.0"
"@capacitor/network": "^6.0.0"
```

```powershell
# 4. Sync plugins:
npx cap sync android

# 5. Rebuild in Android Studio
```

### Issue: Network monitoring not working

**Symptoms:**
- Network status doesn't update
- No events dispatched on WiFi toggle

**Solution:**
```javascript
// 1. Verify mobileService is imported in App.js:
import mobileService from './services/mobileService';

// 2. Verify network listener is set up:
// In mobileService.js, setupNetworkListener() should be called in init()

// 3. Test manually:
import mobileService from './services/mobileService';
await mobileService.getNetworkStatus();
// Should return current status

// 4. Listen to events in component:
useEffect(() => {
  const handler = (e) => console.log('Network changed:', e.detail);
  window.addEventListener('networkStatusChange', handler);
  return () => window.removeEventListener('networkStatusChange', handler);
}, []);
```

---

## ✅ Testing Checklist

### Pre-Testing
- [ ] Run `npm run build`
- [ ] Run `npx cap sync android`
- [ ] Open in Android Studio
- [ ] Device/emulator running Android 7.0+

### Mobile Detection
- [ ] `window.Capacitor` is defined
- [ ] `isMobileApp` returns `true`
- [ ] Platform is "android"
- [ ] Production backend URL selected

### Backend Integration
- [ ] Worker registration works
- [ ] Employer registration works
- [ ] Job browsing works
- [ ] Job application works
- [ ] **NO localhost calls in Network tab**

### Capacitor Plugins
- [ ] StatusBar configured (orange, dark style)
- [ ] SplashScreen shows and hides
- [ ] Network status detected
- [ ] Camera works (with permission)
- [ ] Geolocation works (with permission)
- [ ] Keyboard events work

### Network Monitoring
- [ ] Online status detected
- [ ] Offline status detected
- [ ] Connection type detected (wifi/cellular/none)
- [ ] Network events dispatched

### Error Handling
- [ ] Timeout errors handled gracefully
- [ ] Network errors show user message
- [ ] Permission errors handled
- [ ] API errors don't crash app

---

## 📊 Performance Benchmarks

| Metric | Target | Acceptable |
|--------|--------|-----------|
| API Response Time | < 1s | < 3s |
| App Launch Time | < 2s | < 5s |
| Plugin Initialization | < 500ms | < 1s |
| Network Detection | < 100ms | < 500ms |

---

## 🔐 Security Checklist

- [ ] HTTPS used for all API calls
- [ ] Cleartext traffic disabled (except localhost in dev)
- [ ] Permissions requested appropriately
- [ ] No sensitive data logged in production
- [ ] Keystore protected (not committed)

---

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Development Guide](https://developer.android.com/guide)
- [SINDH Platform Architecture](./PLATFORM_LOGIC_DOCUMENTATION.md)
- [API Configuration](./API_URL_CONSISTENCY_SUMMARY.md)

---

## 🎓 Quick Reference Commands

```powershell
# Build and sync
npm run build && npx cap sync android

# Open Android Studio
npx cap open android

# Check Capacitor status
npx cap doctor

# Clean build (Android Studio)
Build → Clean Project → Rebuild Project

# Test mobile detection (in DevTools console)
testMobileDetection()

# Test all plugins (in DevTools console)
import mobileService from './src/services/mobileService';
await mobileService.testAllPlugins();

# Check API configuration (in DevTools console)
import { testApiConfiguration } from './src/utils/apiUtils';
await testApiConfiguration();
```

---

**Happy Testing! 🚀**

For issues or questions, refer to the troubleshooting section or check the console logs with the debug flag enabled.
