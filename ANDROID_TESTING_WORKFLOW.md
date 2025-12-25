# Android Testing Workflow for SINDH Platform

## Overview

This document provides a step-by-step workflow for testing the SINDH mobile app in Android Studio with a local backend connection.

---

## Step 1: Prerequisites

Ensure you have:
- ✅ Android Studio installed
- ✅ Android emulator or physical device
- ✅ Node.js and npm installed
- ✅ Backend server running locally

---

## Step 2: Ensure Backend is Running

```powershell
cd C:\Users\AMAR\SINDHv2\SINDHbackend\server
npm start
```

**Verify backend is running:**
```
✅ MongoDB Connected Successfully
✅ Server running on port 10000
📡 API available at http://localhost:10000/api
```

---

## Step 2.5: Configure Environment Variables for Android Builds

**CRITICAL:** Android builds use production mode, which requires `.env.production.local`

### Understanding Create React App Build Modes

| Command | Mode | Environment Files Loaded |
|---------|------|-------------------------|
| `npm start` | Development | `.env.development` + `.env.development.local` |
| `npm run build` | Production | `.env.production` + `.env.production.local` |
| `npm test` | Test | `.env.test` + `.env.test.local` |

**The Issue:**

Android development requires `npm run build` (production mode), but you want to connect to your LOCAL backend (development configuration).

**The Solution:**

Create `.env.production.local` with local backend configuration.

### Create .env.production.local

**Location:** `SINDH-frontend/.env.production.local`

**Content:**
```
# Local Development Configuration for Android
REACT_APP_FORCE_LOCAL_BACKEND=true
REACT_APP_LOCAL_BACKEND_URL=http://10.0.2.2:10000/api

# For physical device:
# REACT_APP_LOCAL_BACKEND_URL=http://192.168.1.XXX:10000/api
```

**Why Two Environment Files?**

- `.env.development.local` → For web development (`npm start`)
- `.env.production.local` → For Android development (`npm run build`)
- Both have same content but loaded in different build modes

### Verification

**Check file exists:**
```bash
ls .env.production.local
# Should show the file
```

**Check git ignores it:**
```bash
git status
# Should NOT show .env.production.local in untracked files
```

**If it shows up in git status:**
```bash
# Add to .gitignore
echo ".env.production.local" >> .gitignore
```

### Important Notes

**⚠️ WARNING: Production Deployment**

Before building for Play Store release:

1. **Delete or rename `.env.production.local`:**
   ```bash
   mv .env.production.local .env.production.local.backup
   ```

2. **Verify production backend is used:**
   ```bash
   npm run build
   # Check build output
   # Should use http://localhost:10000/api
   ```

3. **Build release APK:**
   ```bash
   npx cap sync android
   cd android
   ./gradlew assembleRelease
   ```

**Why This Matters:**

If you forget to remove `.env.production.local` before releasing:
- ❌ Production APK will try to connect to `10.0.2.2:10000`
- ❌ Users' devices can't reach your local backend
- ❌ App will be completely broken for all users

**Safe Workflow:**

```bash
# For local development
cp .env.production.local.backup .env.production.local
npm run build
npx cap sync android
# Test in Android Studio

# For production release
mv .env.production.local .env.production.local.backup
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

---

## Step 3: Build Production Bundle

**Before building, ensure `.env.production.local` exists (see Step 2.5)**

```powershell
cd C:\Users\AMAR\SINDHv2\SINDH-frontend
npm run build
```

**Expected output:**
```
Creating an optimized production build...
Compiled successfully.
File sizes after gzip:
  289.XX kB  build\static\js\main.XXXXXX.js
```

---

## Step 4: Sync with Capacitor

```powershell
npx cap sync android
```

**Expected output:**
```
√ Copying web assets from build to android\app\src\main\assets\public
√ copy android
√ Updating Android plugins
[info] Sync finished
```

---

## Step 5: Open in Android Studio

```powershell
npx cap open android
```

Or manually:
1. Open Android Studio
2. File → Open → `SINDH-frontend/android`

---

## Step 6: Wait for Gradle Sync

- Android Studio will automatically sync Gradle (1-2 minutes)
- Wait for "Gradle sync finished" notification

---

## Step 7: Run the App

1. Select device/emulator from dropdown
2. Click **Run ▶️** (or press Shift+F10)
3. Wait for app installation and launch

---

## Step 8: Test Mobile Detection

**Open Chrome DevTools:**
1. Chrome browser → `chrome://inspect`
2. Find your device in the list
3. Click **"inspect"**

**In Chrome DevTools Console:**

```javascript
testMobileDetection()

// Verify these values:
{
  forceLocalBackend: 'true',  // ✅ Must be 'true'
  localBackendUrl: 'http://10.0.2.2:10000/api',  // ✅ Must be correct
  selectedApiUrl: 'http://10.0.2.2:10000/api'  // ✅ Must match localBackendUrl
}

// If forceLocalBackend is undefined:
// → .env.production.local is missing or not loaded
// → Rebuild after creating the file
```

**Expected Output:**
```javascript
{
  environment: 'production',
  forceLocalBackend: 'true',
  localBackendUrl: 'http://10.0.2.2:10000/api',
  hasCapacitor: true,
  capacitorIsNativePlatform: true,
  isMobileApp: true,
  platform: 'android',
  selectedApiUrl: 'http://10.0.2.2:10000/api',
  isProduction: false,
  isLocalDevelopment: true
}
```

---

## Step 9: Verify Backend Connection

**Check Logcat in Android Studio:**

```
📱 [timestamp] GET /api/health
   Origin: http://10.0.2.2:10000
   🤖 Mobile app detected
✅ CORS: Allowing origin
```

**If Logcat shows requests to `sindh-backend.onrender.com`:**

```
❌ Access to fetch at 'http://localhost:10000/api/health'
```

**This means:**
- `.env.production.local` is missing or not loaded
- Environment variables not embedded in build
- App using default production backend

**Solution:**
1. Create `.env.production.local` (see Step 2.5)
2. Rebuild: `npm run build`
3. Sync: `npx cap sync android`
4. Reinstall in Android Studio
5. Test again

**Expected after fix:**
```
✅ 📤 Making request to: http://10.0.2.2:10000/api/health
```

---

## Step 10: Test App Functionality

Test key features:
- ✅ Login with phone number
- ✅ Register new worker
- ✅ Browse available jobs
- ✅ Apply for a job
- ✅ View application status

---

## Troubleshooting

### Issue: CORS Errors

**Symptom:** Console shows CORS policy errors

**Solution:**
1. Verify backend CORS includes `10.0.2.2` origins
2. Check backend is running on port 10000
3. Restart backend server

### Issue: Connection Refused

**Symptom:** Network errors, can't reach backend

**Solution:**
1. Check backend is running: `curl http://localhost:10000/api/health`
2. Check Windows Firewall isn't blocking port 10000
3. For physical device, use computer's IP instead of `10.0.2.2`

### Issue: App Crashes on Launch

**Symptom:** App closes immediately after opening

**Solution:**
1. Check Logcat for error messages
2. Clear app data: Settings → Apps → SINDH → Clear Data
3. Uninstall and reinstall app

---

## Quick Reference

**Full rebuild workflow:**
```powershell
# 1. Ensure .env.production.local exists
cd C:\Users\AMAR\SINDHv2\SINDH-frontend
cat .env.production.local

# 2. Start backend
cd C:\Users\AMAR\SINDHv2\SINDHbackend\server
npm start

# 3. Rebuild frontend
cd C:\Users\AMAR\SINDHv2\SINDH-frontend
npm run build
npx cap sync android

# 4. Open Android Studio
npx cap open android

# 5. Run app (in Android Studio)
# Click Run ▶️ button
```

**Quick rebuild (code changes only):**
```powershell
cd C:\Users\AMAR\SINDHv2\SINDH-frontend
npm run build && npx cap sync android
# Then reload app in emulator
```
