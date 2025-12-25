# Verify Backend Connection from Android App

## Overview

This guide helps you verify that the Android app successfully connects to the backend - either local development backend or production backend on Render.

## Prerequisites

- Backend running (local or Render)
- Android app rebuilt and installed
- Device/emulator with internet connection
- Chrome browser for DevTools

---

## Phase 0: Development Mode Configuration

**⚠️ Critical: Complete this phase FIRST if using local backend for development**

If you're connecting to a **local backend** (not Render), you must configure development mode before testing. Otherwise, the app will try to connect to production (which may not be deployed) and all tests will fail.

### Test 0: Verify Development Mode Configuration

#### For Local Backend Development:

1. **Check Environment File Exists:**

   Verify `.env.development.local` exists in `SINDH-frontend/` directory:

   ```bash
   cd SINDH-frontend
   cat .env.development.local
   ```

   **Expected Content:**
   ```bash
   REACT_APP_FORCE_LOCAL_BACKEND=true
   REACT_APP_LOCAL_BACKEND_URL=http://10.0.2.2:10000/api
   ```

   **If File Missing:**
   - Create it with the content above
   - For physical device, use your computer's IP instead of `10.0.2.2`
   - Rebuild app: `npm run build && npx cap sync android`

2. **Verify Backend URL in App:**

   - Open Chrome DevTools (chrome://inspect)
   - In the console, run:
     ```javascript
     testMobileDetection()
     ```

   **Expected Output (Development Mode):**
   ```javascript
   {
     forceLocalBackend: "true",
     localBackendUrl: "http://10.0.2.2:10000/api",
     selectedApiUrl: "http://10.0.2.2:10000/api",
     isMobileApp: true,
     isLocalDevelopment: true,
     isProduction: false
   }
   ```

   **Wrong Output (Production Mode - when you want development):**
   ```javascript
   {
     forceLocalBackend: undefined,
     selectedApiUrl: "http://localhost:10000/api",
     isProduction: true
   }
   ```

   **If Wrong:**
   - Environment file not loaded → Check filename is exactly `.env.development.local`
   - App not rebuilt → Run `npm run build && npx cap sync android`
   - Check for typos in environment variable names

3. **Check Logcat for Backend URL:**

   In Android Studio, filter Logcat:

   **Filter:** `Mobile dev mode` or `API Configuration`

   **Expected (Development Mode):**
   ```
   📱 Mobile dev mode: using Android emulator localhost at http://10.0.2.2:10000/api
   ```

   **Wrong (Production Mode):**
   ```
   🚀 Using production backend: http://localhost:10000/api
   ```

4. **Verify Backend CORS Configuration:**

   Check backend `SINDHbackend/server/src/index.js` in `getCorsOrigins()`:

   **Must Include:**
   ```javascript
   'http://10.0.2.2:10000',
   'http://10.0.2.2:3000',
   'http://10.0.2.2:8080'
   ```

   **Verify in Backend Logs:**
   ```
   🔗 Allowed CORS origins: [
     ...
     'http://10.0.2.2:10000',
     ...
   ]
   ```

5. **Test Backend Receives Requests:**

   Make any request from the app (e.g., tap "Browse Jobs").

   **Backend Terminal Should Show:**
   ```
   📱 [timestamp] GET /api/jobs
      Origin: http://10.0.2.2:10000
      🤖 Mobile app detected
   ✅ CORS: Allowing localhost origin: http://10.0.2.2:10000
   ```

   **If Backend Shows Nothing:**
   - App not connecting to local backend
   - Check development mode configuration above
   - Verify backend is running on port 10000

#### Summary: Configuration Verification

✅ **Development Mode (Local Backend):**
- `.env.development.local` exists with `REACT_APP_FORCE_LOCAL_BACKEND=true`
- `testMobileDetection()` shows `selectedApiUrl: "http://10.0.2.2:10000/api"`
- Logcat shows "Mobile dev mode"
- Backend CORS includes `10.0.2.2` origins
- Backend receives requests from `10.0.2.2`

✅ **Production Mode (Render Backend):**
- `.env.development.local` does NOT exist (or `REACT_APP_FORCE_LOCAL_BACKEND=false`)
- `testMobileDetection()` shows `selectedApiUrl: "http://localhost:10000/api"`
- Logcat shows "Using production backend"
- Requests go to `sindh-backend.onrender.com`

**⚠️ If Configuration is Wrong:**
- App will try to connect to the wrong backend
- All subsequent tests will fail
- Fix configuration before proceeding to Phase 1

---

## Phase 1: Backend Verification

### Test 1: Health Endpoint (Browser)

**Action:**
1. Open browser
2. Navigate to: http://localhost:10000/api/health

**Expected Result:**
```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    "server": "running"
  },
  "environment": "production"
}
```

**If Failed:**
- Backend not deployed → See DEPLOY_BACKEND_TO_RENDER.md
- Backend crashed → Check Render logs
- Backend sleeping → Wait 30 seconds and retry

### Test 2: Health Endpoint (Command Line)

**Action:**
```bash
curl -v http://localhost:10000/api/health
```

**Expected Output:**
```
< HTTP/2 200
< content-type: application/json
< access-control-allow-origin: *
...
{"status":"ok",...}
```

**Check For:**
- Status code: 200 ✅
- Content-Type: application/json ✅
- CORS headers present ✅
- Response body contains "status":"ok" ✅

### Test 3: Worker Registration Endpoint

**Action:**
```bash
curl -X POST http://localhost:10000/api/workers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Worker",
    "phone": "9999999999",
    "age": 25,
    "aadharNumber": "999999999999",
    "skills": ["Testing"],
    "location": {
      "village": "Test",
      "district": "Test",
      "state": "Test"
    },
    "language": "English",
    "experience_years": 1
  }'
```

**Expected Result:**
- Status: 201 Created
- Response contains worker ID
- Or error message if validation fails (still means backend is working)

**If CORS Error:**
- Backend CORS not configured → Update index.js CORS settings
- Redeploy backend

## Phase 2: Mobile App Detection

### Test 4: Mobile Detection in App

**Action:**
1. Open app on Android device/emulator
2. Open Chrome DevTools:
   - Chrome → chrome://inspect
   - Select device
   - Click "inspect"
3. In Console, run:
   ```javascript
   testMobileDetection()
   ```

**Expected Output:**
```javascript
{
  environment: "production",
  hasCapacitor: true,
  capacitorIsNativePlatform: true,
  isMobileApp: true,
  platform: "android",
  selectedApiUrl: "http://localhost:10000/api",
  isProduction: true
}
```

**Critical Checks:**
- `isMobileApp: true` ✅
- `selectedApiUrl` contains "sindh-backend.onrender.com" ✅
- `isProduction: true` ✅

**If Failed:**
- `isMobileApp: false` → Capacitor not detected, check if running in browser instead of Android
- `selectedApiUrl` contains "localhost" → Old build, rebuild app
- `isProduction: false` → Environment detection issue

### Test 5: API Configuration Logging

**Action:**
1. Open app
2. Check Android Studio Logcat
3. Filter by: "API Configuration"

**Expected Output:**
```
🌐 API Configuration: {
  environment: "production",
  apiUrl: "http://localhost:10000/api",
  mode: "PRODUCTION (Render)",
  isMobileApp: true,
  platform: "android"
}
```

**If Failed:**
- No logs → Debug mode disabled, check api.js line 22
- Shows localhost → Old build, rebuild app

## Phase 3: Network Requests

### Test 6: Health Check from App

**Action:**
1. Open app
2. App should automatically check backend health on launch
3. Check Logcat for:
   ```
   📤 Making request to: http://localhost:10000/api/health
   📥 Response received: {"status":"ok"}
   ```

**Expected:**
- Request URL contains "sindh-backend.onrender.com" ✅
- Response status: 200 ✅
- Response contains "status":"ok" ✅

**If Failed:**
- Request to localhost → Old build
- Connection refused → Backend not running
- Timeout → Network issue or backend sleeping

### Test 7: Jobs List Request

**Action:**
1. In app, navigate to Jobs screen
2. Check Chrome DevTools Network tab
3. Look for request to `/api/jobs`

**Expected:**
- Request URL: `http://localhost:10000/api/jobs` ✅
- Method: GET ✅
- Status: 200 ✅
- Response: Array of jobs or empty array ✅

**Check Request Headers:**
```
Origin: (none) or capacitor://localhost
User-Agent: ... Capacitor ...
```

**Check Response Headers:**
```
access-control-allow-origin: *
content-type: application/json
```

**If Failed:**
- 404 Not Found → Backend route issue
- 500 Internal Server Error → Backend crash, check Render logs
- CORS error → Backend CORS not configured

### Test 8: Worker Registration from App

**Action:**
1. In app, go to Worker Registration
2. Fill form with test data
3. Submit
4. Check Logcat and DevTools Network tab

**Expected Logcat:**
```
📤 Making request to: http://localhost:10000/api/workers/register
API Request: {url: "/workers/register", method: "post", ...}
📥 Response received: {status: 201, ...}
API Response: {status: 201, data: {...}}
```

**Expected Network Tab:**
- Request URL: `http://localhost:10000/api/workers/register`
- Method: POST
- Status: 201 Created
- Response: Worker object with ID

**If Failed:**
- Connection refused → Backend not running
- CORS error → Backend CORS issue
- 400 Bad Request → Validation error (check request body)
- 500 Internal Server Error → Backend error (check Render logs)

## Phase 4: Error Handling

### Test 9: Offline Behavior

**Action:**
1. Open app
2. Disable WiFi and mobile data
3. Try to load jobs

**Expected:**
- Network indicator shows "Offline" (red) ✅
- App shows error message: "No internet connection" ✅
- No crash ✅

**Re-enable Network:**
- Network indicator shows "Online" (green) ✅
- App retries request ✅
- Data loads successfully ✅

### Test 10: Backend Timeout

**Action:**
1. Simulate slow network (Chrome DevTools → Network → Throttling → Slow 3G)
2. Try to load jobs

**Expected:**
- Loading indicator shows ✅
- Request times out after 15 seconds (api.js line 202) ✅
- Error message: "Request timeout" ✅
- App remains responsive ✅

## Phase 5: CORS Verification

### Test 11: CORS Headers

**Action:**
1. In Chrome DevTools Network tab
2. Select any API request
3. Check Response Headers

**Expected Headers:**
```
access-control-allow-origin: * (or specific origin)
access-control-allow-methods: GET, POST, PUT, DELETE, PATCH
access-control-allow-headers: Content-Type, Authorization, User-Type, User-ID
```

**If Missing:**
- Backend CORS not configured
- Update index.js CORS settings
- Redeploy backend

### Test 12: Preflight Requests

**Action:**
1. In Network tab, filter by "OPTIONS"
2. Look for preflight requests

**Expected:**
- OPTIONS requests succeed (200 or 204) ✅
- Followed by actual request (GET/POST) ✅

**If Failed:**
- OPTIONS returns 403/404 → Backend CORS issue
- Actual request blocked → CORS headers missing

## Phase 6: Performance

### Test 13: Response Time

**Action:**
1. In Network tab, check request timing
2. Look at "Time" column

**Expected:**
- Health check: <1 second ✅
- Jobs list: <3 seconds ✅
- Registration: <5 seconds ✅

**If Slow:**
- First request after sleep: 30-60 seconds (Render free tier)
- Subsequent requests: <3 seconds
- If always slow: Backend performance issue or network issue

### Test 14: Memory Usage

**Action:**
1. Android Studio → Profiler → Memory
2. Use app for 5 minutes
3. Check memory graph

**Expected:**
- Memory usage: <150MB ✅
- No continuous growth ✅
- Memory drops after GC ✅

**If High:**
- Memory leak in app
- Too many cached requests
- Large images not optimized

## Comprehensive Checklist

### Backend Status
- [ ] Health endpoint returns 200 OK
- [ ] Health endpoint shows "database":"connected"
- [ ] Worker registration endpoint works
- [ ] Jobs endpoint returns data
- [ ] CORS headers present in responses

### Mobile Detection
- [ ] `testMobileDetection()` shows `isMobileApp: true`
- [ ] Selected API URL is production backend
- [ ] Platform detected as "android"
- [ ] Logcat shows production backend URL

### Network Requests
- [ ] All requests go to correct backend (local `10.0.2.2:10000` OR production `sindh-backend.onrender.com`)
- [ ] Development: NO requests go to `sindh-backend.onrender.com` if using local backend
- [ ] Production: NO requests go to `localhost` or `10.0.2.2`
- [ ] Requests succeed (200/201 status)
- [ ] Responses contain expected data
- [ ] **No CORS errors in console**

### Error Handling
- [ ] Offline mode detected and handled
- [ ] Timeout errors handled gracefully
- [ ] Backend errors show user-friendly messages
- [ ] App doesn't crash on network errors

### Performance
- [ ] Requests complete in <3 seconds
- [ ] Memory usage stable
- [ ] No memory leaks
- [ ] UI remains responsive

## Troubleshooting Quick Reference

## Issue: App Connects to Production Backend Instead of Local

**Symptoms:**

Logcat shows:
```
Access to fetch at 'http://localhost:10000/api/health' from origin 'https://localhost' has been blocked by CORS policy
```

**Root Cause:**

Environment variables in `.env.development.local` are NOT loaded during `npm run build`.

**Why This Happens:**

Create React App build modes:
- `npm start` → Loads `.env.development.local` ✅
- `npm run build` → Loads `.env.production.local` ❌ (missing)

Android builds require `npm run build`, so you need `.env.production.local`.

**Solution:**

### Step 1: Create .env.production.local

```bash
cd c:/Users/AMAR/SINDHv2/SINDH-frontend

# Create file with same content as .env.development.local
echo "REACT_APP_FORCE_LOCAL_BACKEND=true" > .env.production.local
echo "REACT_APP_LOCAL_BACKEND_URL=http://10.0.2.2:10000/api" >> .env.production.local
```

### Step 2: Rebuild App

```bash
npm run build
npx cap sync android
```

### Step 3: Reinstall in Android Studio

1. Uninstall old app from device/emulator
2. Click Run ▶️ in Android Studio
3. Wait for installation

### Step 4: Verify Fix

**Check Logcat:**

Should now see:
```
✅ 📱 Mobile dev mode: using Android emulator localhost
✅ 📤 Making request to: http://10.0.2.2:10000/api/health
```

Should NOT see:
```
❌ Access to fetch at 'http://localhost:10000/api'
```

**Run testMobileDetection():**

```javascript
{
  forceLocalBackend: 'true',  // ✅ Now present
  localBackendUrl: 'http://10.0.2.2:10000/api',  // ✅ Now present
  selectedApiUrl: 'http://10.0.2.2:10000/api'  // ✅ Now correct
}
```

**Before fix:**
```javascript
{
  forceLocalBackend: undefined,  // ❌ Missing
  localBackendUrl: undefined,  // ❌ Missing
  selectedApiUrl: 'http://localhost:10000/api'  // ❌ Wrong
}
```

---

## Issue: Environment Variables Show as undefined

**Symptoms:**

`testMobileDetection()` shows:
```javascript
{
  forceLocalBackend: undefined,
  localBackendUrl: undefined
}
```

**Possible Causes:**

### Cause 1: Wrong Environment File

**Check which file exists:**
```bash
ls .env.development.local  # For npm start
ls .env.production.local   # For npm run build
```

**Solution:**
- For Android development, you need `.env.production.local`
- Create it with the same content as `.env.development.local`

### Cause 2: File Not Loaded

**Verify file content:**
```bash
cat .env.production.local

# Should show:
# REACT_APP_FORCE_LOCAL_BACKEND=true
# REACT_APP_LOCAL_BACKEND_URL=http://10.0.2.2:10000/api
```

**Solution:**
- Ensure variables start with `REACT_APP_`
- No spaces around `=`
- No quotes around values

### Cause 3: Build Not Updated

**Solution:**
```bash
# Clean old build
rm -rf build/
rm -rf android/app/src/main/assets/public/

# Rebuild
npm run build
npx cap sync android

# Reinstall
# In Android Studio: Run ▶️
```

### Cause 4: Typo in Variable Name

**Check exact spelling:**
- ✅ `REACT_APP_FORCE_LOCAL_BACKEND` (correct)
- ❌ `REACT_APP_FORCE_LOCAL_BACKEND_` (extra underscore)
- ❌ `REACT_APP_FORCELOCAL_BACKEND` (missing underscore)

**Check in api.js:**
```javascript
// Must match exactly
process.env.REACT_APP_FORCE_LOCAL_BACKEND === 'true'
process.env.REACT_APP_LOCAL_BACKEND_URL
```

---

## Quick Diagnostic: Environment Variables

**Run this checklist:**

1. **Does `.env.production.local` exist?**
   ```bash
   ls .env.production.local
   ```
   - ❌ No such file → Create it
   - ✅ File exists → Continue

2. **Does it have correct content?**
   ```bash
   cat .env.production.local
   ```
   - ❌ Empty or wrong → Fix content
   - ✅ Correct → Continue

3. **Did you rebuild after creating it?**
   - ❌ No → Run `npm run build && npx cap sync android`
   - ✅ Yes → Continue

4. **Does `testMobileDetection()` show variables?**
   ```javascript
   testMobileDetection()
   // Check: forceLocalBackend, localBackendUrl
   ```
   - ❌ undefined → Rebuild again
   - ✅ Present → Variables loaded correctly

5. **Does Logcat show correct URL?**
   ```
   📤 Making request to: http://10.0.2.2:10000/api
   ```
   - ❌ Shows sindh-backend.onrender.com → Rebuild
   - ✅ Shows 10.0.2.2 → Correct!

---

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Connection refused (dev) | Backend not running | Start backend: `npm start` |
| Connection refused (prod) | Backend not deployed | Deploy to Render |
| Requests to localhost (prod) | Old build cached | Rebuild app with `npm run build` |
| CORS error (dev) | Missing `10.0.2.2` in CORS | Add Android IPs to backend CORS |
| CORS error (prod) | Backend CORS misconfigured | Update `index.js` CORS settings |
| Still using prod in dev | `.env.development.local` missing | Create file and rebuild app |
| 404 Not Found | Route mismatch | Check backend routes |
| 500 Internal Server Error | Backend crash | Check backend logs (Render or terminal) |
| Timeout (prod) | Backend sleeping (Render free tier) | Wait 30s or upgrade plan |
| White screen | JavaScript error | Check DevTools console |
| App crash | Missing permissions | Check AndroidManifest.xml |

## Success Criteria

Connection is verified when:

1. ✅ **Development mode configured correctly** (if using local backend)
2. ✅ **Backend URL is correct** (`10.0.2.2:10000` in dev OR `sindh-backend.onrender.com` in prod)
3. ✅ Backend health endpoint returns 200 OK
4. ✅ Mobile detection shows `isMobileApp: true`
5. ✅ All requests go to intended backend
6. ✅ **Backend CORS allows appropriate origins** (`10.0.2.2` for dev, mobile User-Agent for prod)
7. ✅ **Backend receives requests** (check logs for incoming requests)
8. ✅ Jobs load successfully
9. ✅ Worker registration works
10. ✅ **No CORS errors**
11. ✅ Error handling works
12. ✅ Performance is acceptable
13. ✅ App is stable (no crashes)

## Next Steps

After verification:

1. ✅ Backend connected
2. ✅ App works in production
3. ⏭️ Test all features thoroughly
4. ⏭️ Test on multiple devices
5. ⏭️ Prepare for Play Store release
6. ⏭️ Set up monitoring and analytics
