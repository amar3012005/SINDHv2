# Rebuild Android App for Backend Connection

## Why Rebuild is Necessary

Even though the frontend code is correctly configured, the Android app needs to be rebuilt because:

1. **Service files were updated** to use `buildApiUrl` instead of hardcoded localhost
2. **Old build is cached** in `android/app/src/main/assets/public/`
3. **Capacitor needs to sync** the new web assets to Android project
4. **Android needs to recompile** with the new assets

## Prerequisites

- Node.js and npm installed
- Android Studio installed
- Android SDK configured
- Device or emulator ready
- Backend deployed and running on Render

## Step 1: Clean Previous Build

```bash
# Navigate to frontend directory
cd c:/Users/AMAR/SINDHv2/SINDH-frontend

# Remove old build artifacts
rm -rf build/
rm -rf android/app/src/main/assets/public/

# On Windows PowerShell:
Remove-Item -Recurse -Force build
Remove-Item -Recurse -Force android/app/src/main/assets/public
```

**Why:** Ensures no old code is cached

## Step 2: Verify Dependencies

```bash
# Check if node_modules is up to date
npm install

# Verify Capacitor is installed
npx cap --version
# Should show: 7.4.2 or similar
```

**If Capacitor is missing:**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

---

## Connecting to Local Backend During Development

### Understanding the Network Configuration

By default, mobile apps are configured to connect to the **production backend** (http://localhost:10000/api). This is intentional to avoid connection issues. However, during development, you may want to connect to your local backend for faster iteration.

**The Challenge:**
- Android emulator's `localhost` refers to the emulator itself, not your computer
- Mobile apps detect the Capacitor environment and switch to production backend automatically
- Physical devices cannot access `localhost` at all

**The Solution:**
- Use **environment variables** to override the backend URL during development
- Use `10.0.2.2` special IP for Android emulator (routes to host machine)
- Use your computer's actual IP address for physical devices

### Configuration Options

#### **Option 1: Environment Variable (Recommended)**

**Pros:**
- Clean separation of development and production configuration
- No code changes needed
- Easy to toggle on/off
- Each developer can use different IPs
- Production builds unaffected

**Cons:**
- Requires creating `.env` file
- Must rebuild app after changes
- Team coordination needed for setup

#### **Option 2: Code Modification (Quick Fix)**

**Pros:**
- Fast to implement
- No additional files

**Cons:**
- Hardcodes development logic in source code
- Must remember to remove before production
- Risk of accidentally committing dev code
- Less flexible for team collaboration

### Setup Steps (Environment Variable Approach)

#### Step A: Create Development Environment File

1. **Create `.env.development.local` in `SINDH-frontend/` directory:**

   ```bash
   # Local Development Configuration for Android
   REACT_APP_FORCE_LOCAL_BACKEND=true
   REACT_APP_LOCAL_BACKEND_URL=http://10.0.2.2:10000/api
   
   # For physical device, use your computer's IP:
   # REACT_APP_LOCAL_BACKEND_URL=http://192.168.1.XXX:10000/api
   ```

2. **Verify the file is git-ignored:**

   Check that `.gitignore` contains:
   ```
   .env.development.local
   ```

   This file should **NOT** be committed to Git.

#### Step B: Update Backend CORS Configuration

1. **Open `SINDHbackend/server/src/index.js`**

2. **Verify `getCorsOrigins()` includes Android emulator IPs:**

   ```javascript
   const origins = [
     'http://localhost:3000',
     'http://localhost:8080',
     // Android Emulator IPs
     'http://10.0.2.2:10000',
     'http://10.0.2.2:3000',
     'http://10.0.2.2:8080',
     // ... other origins
   ];
   ```

3. **Restart backend server:**

   ```bash
   cd SINDHbackend/server
   npm start
   ```

4. **Verify backend is running:**

   ```bash
   # Should show:
   ✅ Server running on port 10000
   📡 API available at http://localhost:10000/api
   ```

#### Step C: Rebuild and Deploy to Android

After creating/modifying `.env.development.local`, you **MUST** rebuild:

```bash
# 1. Clean old build
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Open in Android Studio
npx cap open android
```

#### Step D: Verify Configuration

1. **Check Logcat for Backend URL**

   In Android Studio, filter Logcat by "Mobile dev mode":

   ```
   📱 Mobile dev mode: using Android emulator localhost at http://10.0.2.2:10000/api
   ```

2. **Check Backend Logs**

   Your backend terminal should show:

   ```
   📱 [timestamp] GET /api/health
      Origin: http://10.0.2.2:10000
      🤖 Mobile app detected
   ✅ CORS: Allowing localhost origin: http://10.0.2.2:10000
   ```

3. **Test Mobile Detection**

   Open Chrome DevTools (chrome://inspect) and run:

   ```javascript
   testMobileDetection()
   ```

   Expected output:
   ```javascript
   {
     forceLocalBackend: "true",
     localBackendUrl: "http://10.0.2.2:10000/api",
     selectedApiUrl: "http://10.0.2.2:10000/api",
     isMobileApp: true,
     isLocalDevelopment: true
   }
   ```

### Physical Device Setup

If testing on a real Android device (not emulator):

1. **Find Your Computer's IP Address:**

   **Windows:**
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., `192.168.1.100`)

   **Mac/Linux:**
   ```bash
   ifconfig
   ```

2. **Update `.env.development.local`:**

   ```bash
   REACT_APP_FORCE_LOCAL_BACKEND=true
   REACT_APP_LOCAL_BACKEND_URL=http://192.168.1.100:10000/api  # Your actual IP
   ```

3. **Ensure Both Devices on Same Network:**

   Your phone and computer must be on the same Wi-Fi network.

4. **Update Backend CORS (Optional):**

   Add your IP to `ALLOWED_ORIGINS` environment variable:

   ```bash
   # In SINDHbackend/server/.env
   ALLOWED_ORIGINS=http://192.168.1.100:10000
   ```

5. **Rebuild App:**

   ```bash
   npm run build
   npx cap sync android
   ```

### Switching Back to Production Backend

When you're done with local development:

1. **Delete or Disable Environment File:**

   ```bash
   # Option 1: Delete the file
   rm .env.development.local
   
   # Option 2: Set flag to false
   REACT_APP_FORCE_LOCAL_BACKEND=false
   ```

2. **Rebuild App:**

   ```bash
   npm run build
   npx cap sync android
   ```

3. **Verify Production Mode:**

   Run `testMobileDetection()`:
   ```javascript
   {
     forceLocalBackend: undefined,
     selectedApiUrl: "http://localhost:10000/api",
     isProduction: true
   }
   ```

### Troubleshooting Local Backend Connection

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Connection refused | Backend not running on host | Start backend: `npm start` in `SINDHbackend/server` |
| CORS errors | Missing `10.0.2.2` in CORS origins | Add Android emulator IPs to backend CORS |
| Still using production URL | App not rebuilt after `.env` change | Run `npm run build && npx cap sync android` |
| Physical device timeout | Wrong IP or different network | Verify IP with `ipconfig`, check Wi-Fi |
| Environment variable not working | Typo in variable name | Must be `REACT_APP_FORCE_LOCAL_BACKEND` (exact) |

---

## Step 3: Build Production Bundle

```bash
# Create optimized production build
npm run build

# This runs: react-scripts build
# Output: build/ directory with optimized assets
```

**Expected Output:**
```
Creating an optimized production build...
Compiled successfully.

File sizes after gzip:

  XX.XX kB  build/static/js/main.xxxxxxxx.js
  XX.XX kB  build/static/css/main.xxxxxxxx.css

The build folder is ready to be deployed.
```

**Verify Build:**
```bash
# Check if build directory exists
ls build/

# Should contain:
# - index.html
# - static/
# - asset-manifest.json
# - favicon.ico
```

## Step 4: Sync with Capacitor

```bash
# Sync web assets to Android project
npx cap sync android

# This does:
# 1. Copies build/ to android/app/src/main/assets/public/
# 2. Updates Capacitor plugins
# 3. Updates capacitor.config.json in Android
```

**Expected Output:**
```
✔ Copying web assets from build to android/app/src/main/assets/public in XXms
✔ Creating capacitor.config.json in android/app/src/main/assets in XXms
✔ copy android in XXms
✔ Updating Android plugins in XXms
✔ update android in XXms
```

**Verify Sync:**
```bash
# Check if assets were copied
ls android/app/src/main/assets/public/

# Should contain:
# - index.html
# - static/
# - All files from build/
```

## Step 5: Open in Android Studio

```bash
# Open Android project in Android Studio
npx cap open android

# Or manually:
# Android Studio → File → Open → Select: c:/Users/AMAR/SINDHv2/SINDH-frontend/android
```

**Wait for Gradle Sync:**
- Android Studio will automatically sync Gradle
- Check bottom status bar: "Gradle sync in progress..."
- Wait for: "Gradle sync finished"
- This may take 2-5 minutes

## Step 6: Clean Android Project

**In Android Studio:**

1. **Clean Project:**
   - Menu: Build → Clean Project
   - Wait for completion (30-60 seconds)

2. **Rebuild Project:**
   - Menu: Build → Rebuild Project
   - Wait for completion (1-2 minutes)
   - Check Build output for errors

**Or via Command Line:**
```bash
cd android
./gradlew clean
./gradlew build
```

## Step 7: Uninstall Old App

**Why:** Old app may have cached data and old code

**On Device/Emulator:**
1. Long-press app icon
2. Tap "App info" or drag to "Uninstall"
3. Confirm uninstall

**Or via ADB:**
```bash
adb uninstall com.sindh.jobs

# Verify uninstalled:
adb shell pm list packages | grep sindh
# Should return nothing
```

## Step 8: Install Fresh Build

**In Android Studio:**

1. **Select Device:**
   - Top toolbar: Select emulator or connected device

2. **Run App:**
   - Click ▶ (Run) button
   - Or press Shift+F10

3. **Wait for Installation:**
   - Gradle builds APK (1-2 minutes)
   - APK installs to device
   - App launches automatically

**Or via Command Line:**
```bash
cd android
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Step 9: Verify Backend Connection

### Check Logcat

**In Android Studio:**
1. View → Tool Windows → Logcat
2. Filter by: "API" or "sindh-backend"
3. Look for:
   ```
   📤 Making request to: http://localhost:10000/api/health
   📥 Response received: {"status":"ok"}
   ```

**Should NOT see:**
```
❌ Failed to connect to localhost:10000
❌ Connection refused
```

### Check Chrome DevTools

1. **Open Chrome on computer**
2. **Navigate to:** chrome://inspect
3. **Select device** under "Remote Target"
4. **Click "inspect"**
5. **Console tab:**
   - Run: `testMobileDetection()`
   - Should show:
     ```javascript
     {
       isMobileApp: true,
       selectedApiUrl: "http://localhost:10000/api",
       isProduction: true,
       platform: "android"
     }
     ```

6. **Network tab:**
   - Perform action (e.g., view jobs)
   - Check request URL
   - Should be: `http://localhost:10000/api/jobs`
   - Should NOT be: `http://localhost:10000/api/jobs`

### Test App Features

1. **Browse Jobs:**
   - Navigate to Jobs screen
   - Should load jobs from backend
   - Check Logcat for API requests

2. **Register Worker:**
   - Fill registration form
   - Submit
   - Should succeed (or show backend error, not connection error)

3. **Check Network Indicator:**
   - Should show "Online" (green)
   - Disable WiFi → Should show "Offline" (red)
   - Re-enable WiFi → Should show "Online" again

## Step 10: Verify No Localhost Calls

**Critical Check:**

```bash
# In Logcat, filter by "localhost"
adb logcat | grep -i "localhost"

# Should return NOTHING
# If you see localhost URLs, rebuild was not successful
```

**In Chrome DevTools Network Tab:**
- Clear all requests
- Perform various actions in app
- Filter by "localhost"
- Should show 0 requests

## Troubleshooting

### Issue: "Connection refused" errors

**Symptoms:**
- Logcat shows: `Failed to connect to localhost:10000`
- App shows: "No response from server"

**Cause:** Old build still cached

**Solution:**
1. Repeat Step 1 (Clean)
2. Repeat Step 3 (Build)
3. Repeat Step 4 (Sync)
4. Repeat Step 7 (Uninstall)
5. Repeat Step 8 (Install)

### Issue: "Gradle sync failed"

**Symptoms:**
- Android Studio shows red errors
- Build fails

**Cause:** Gradle cache corrupted or dependencies missing

**Solution:**
```bash
cd android
./gradlew clean
rm -rf .gradle/
./gradlew build
```

### Issue: "App crashes on launch"

**Symptoms:**
- App opens then immediately closes
- Logcat shows: `java.lang.RuntimeException`

**Cause:** Missing permissions or plugin issues

**Solution:**
1. Check AndroidManifest.xml has all permissions
2. Run: `npx cap sync android` again
3. Verify all Capacitor plugins are installed:
   ```bash
   npm list @capacitor/camera
   npm list @capacitor/geolocation
   npm list @capacitor/network
   ```

### Issue: "White screen after splash"

**Symptoms:**
- Splash screen shows
- Then white screen
- No content loads

**Cause:** JavaScript errors or missing assets

**Solution:**
1. Open Chrome DevTools (chrome://inspect)
2. Check Console for errors
3. Check if `index.html` exists in assets:
   ```bash
   ls android/app/src/main/assets/public/index.html
   ```
4. If missing, repeat Step 3 and 4

### Issue: "Backend returns 404"

**Symptoms:**
- Connection succeeds
- But API returns 404 Not Found

**Cause:** Backend routes not matching frontend requests

**Solution:**
1. Check backend is deployed correctly
2. Test health endpoint: `curl http://localhost:10000/api/health`
3. Verify route paths match between frontend and backend
4. Check backend logs on Render

## Verification Checklist

Before considering rebuild complete:

- [ ] `npm run build` completed successfully
- [ ] `npx cap sync android` completed successfully
- [ ] Android Studio Gradle sync completed
- [ ] Old app uninstalled from device
- [ ] Fresh app installed and launches
- [ ] **Backend URL is correct for current mode:**
  - [ ] **Development:** Logcat shows `http://10.0.2.2:10000/api` (if `.env.development.local` exists)
  - [ ] **Production:** Logcat shows `http://localhost:10000/api` (if no `.env.development.local`)
- [ ] **Backend receives requests from Android app:**
  - [ ] Development: Backend logs show `Origin: http://10.0.2.2:10000`
  - [ ] Production: Backend logs show requests with mobile User-Agent
- [ ] Chrome DevTools shows `isMobileApp: true`
- [ ] `testMobileDetection()` shows correct `selectedApiUrl`
- [ ] Network tab shows requests to correct backend
- [ ] App features work (browse jobs, register, etc.)
- [ ] **No CORS errors in console**
- [ ] No connection refused errors

## Performance Notes

**First Request After Rebuild:**
- May take 30-60 seconds if backend is sleeping (Render free tier)
- Subsequent requests will be fast
- Consider upgrading to paid tier for always-on backend

**Build Time:**
- `npm run build`: 30-60 seconds
- `npx cap sync`: 5-10 seconds
- Gradle build: 1-2 minutes
- Total: 2-4 minutes

## Next Steps

After successful rebuild:

1. ✅ App connects to production backend
2. ✅ All features work
3. ⏭️ Test on multiple devices
4. ⏭️ Test on different Android versions
5. ⏭️ Prepare for Play Store release
6. ⏭️ Generate signed APK (see Phase 3 documentation)

## Quick Reference Commands

```bash
# Full rebuild sequence
cd c:/Users/AMAR/SINDHv2/SINDH-frontend
rm -rf build/ android/app/src/main/assets/public/
npm install
npm run build
npx cap sync android
npx cap open android

# In Android Studio:
# Build → Clean Project
# Build → Rebuild Project
# Uninstall old app
# Run ▶

# Verify
adb logcat | grep -i "sindh-backend"
# Should see production backend URLs
```
