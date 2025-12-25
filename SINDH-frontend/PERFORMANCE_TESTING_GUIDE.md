# SINDH Jobs Performance Testing Guide

## Target Device Specifications

**Low-End Device Profile:**
- **CPU:** Quad-core 1.4 GHz or lower
- **RAM:** 2GB or less
- **GPU:** Adreno 306 or Mali-T720 or lower
- **Android Version:** 7.0 (API 24) to 9.0 (API 28)
- **Screen:** 720x1280 (HD) or lower
- **Storage:** 16GB or less

**Example Low-End Devices:**
- Samsung Galaxy J2 (2018)
- Nokia 2.2
- Xiaomi Redmi 6A
- Moto E5 Play
- Alcatel 1X

**Mid-Range Device Profile (Baseline):**
- **CPU:** Octa-core 2.0 GHz
- **RAM:** 4GB
- **GPU:** Adreno 506 or Mali-G71
- **Android Version:** 10.0 (API 29) or higher
- **Screen:** 1080x1920 (Full HD)
- **Storage:** 64GB

**High-End Device Profile (Reference):**
- **CPU:** Octa-core 2.8+ GHz
- **RAM:** 8GB+
- **GPU:** Adreno 650+ or Mali-G77+
- **Android Version:** 12.0 (API 31) or higher
- **Screen:** 1440x3200 (QHD+)
- **Storage:** 128GB+

---

## Performance Metrics

**Target Metrics:**

| Metric | Low-End | Mid-Range | High-End |
|--------|---------|-----------|----------|
| App Launch Time | <3s | <2s | <1.5s |
| Screen Transition | <500ms | <300ms | <200ms |
| List Scroll (60fps) | 30-45fps | 50-60fps | 60fps |
| API Response Handling | <1s | <500ms | <300ms |
| Image Load Time | <2s | <1s | <500ms |
| Memory Usage | <150MB | <200MB | <300MB |
| Battery Drain (1hr) | <10% | <8% | <5% |

**Acceptable Thresholds:**
- **App Launch:** <5s on low-end (anything longer = poor UX)
- **Scroll FPS:** >30fps minimum (below = janky)
- **Memory:** <200MB on low-end (above = risk of crashes)
- **Battery:** <15% per hour (above = excessive drain)

---

## Testing Setup

### Option 1: Physical Low-End Device (Recommended)

**Acquisition:**
- Purchase used low-end device (~$50-100)
- Borrow from team member or friend
- Use old device from 2016-2018 era

**Setup:**
1. Factory reset device
2. Update to latest available Android version
3. Enable Developer Options
4. Enable USB Debugging
5. Connect to computer
6. Install app via Android Studio

### Option 2: Android Emulator with Limited Resources

**Create Low-End Emulator:**

1. **Open AVD Manager in Android Studio**
2. **Create New Virtual Device:**
   - Device: Nexus 5 or similar (720x1280)
   - System Image: Android 7.0 (API 24) or 8.0 (API 26)
   - Download if not installed

3. **Configure Performance:**
   - Click "Show Advanced Settings"
   - RAM: 1024 MB (1GB)
   - VM Heap: 256 MB
   - Internal Storage: 2048 MB (2GB)
   - SD Card: 512 MB
   - Graphics: Software (not Hardware)
   - Boot option: Cold boot

4. **Emulator Settings:**
   - Disable "Use Host GPU"
   - Enable "Multi-Core CPU" but limit to 2 cores
   - Set CPU speed to "Slow"

**Limitations:**
- Emulator can't perfectly simulate real device performance
- Battery testing not possible
- Some hardware features unavailable
- Still useful for initial testing

### Option 3: Firebase Test Lab (Cloud Testing)

**Setup:**
1. Create Firebase project
2. Upload APK to Test Lab
3. Select low-end devices:
   - Samsung Galaxy J7 (2017)
   - Motorola Moto G (4)
   - LG K8 (2018)
4. Run automated tests
5. Review performance reports

**Benefits:**
- Test on real devices
- Automated testing
- Performance metrics included
- No need to own devices

**Costs:**
- Free tier: 10 tests/day
- Paid: $5 per device-hour

---

## Performance Testing Procedures

### Test 1: App Launch Performance

**Objective:** Measure time from tap to interactive UI

**Steps:**

1. **Cold Start (App Not in Memory):**
   - Force stop app: Settings → Apps → SINDH Jobs → Force Stop
   - Clear app from recent apps
   - Start timer
   - Tap app icon
   - Stop timer when UI is interactive (can tap buttons)
   - Record time
   - Repeat 5 times, calculate average

2. **Warm Start (App in Background):**
   - Open app
   - Press Home button
   - Wait 10 seconds
   - Start timer
   - Tap app icon in recent apps
   - Stop timer when UI appears
   - Record time
   - Repeat 5 times, calculate average

3. **Hot Start (App in Foreground):**
   - Open app
   - Navigate to different screen
   - Press Back to return
   - Measure transition time

**Metrics to Record:**
- Cold start time (target: <3s on low-end)
- Warm start time (target: <1s on low-end)
- Hot start time (target: <500ms on low-end)

**Using ADB:**
```bash
# Measure cold start time
adb shell am start -W -n com.sindh.jobs/.MainActivity
# Output shows:
# TotalTime: 2847 (milliseconds)
```

**Using Android Studio Profiler:**
1. View → Tool Windows → Profiler
2. Select device and app
3. Click "CPU" profiler
4. Launch app
5. View "Activity" timeline
6. Measure from launch to first frame

### Test 2: Scroll Performance

**Objective:** Ensure smooth scrolling at 30+ fps on low-end devices

**Steps:**

1. **Navigate to Jobs List:**
   - Open app
   - Go to Jobs screen
   - Ensure at least 20 jobs loaded

2. **Enable FPS Overlay:**
   - Settings → Developer Options → Profile GPU Rendering
   - Select "On screen as bars"
   - Green line = 16ms (60fps)
   - Yellow line = 33ms (30fps)

3. **Scroll Test:**
   - Scroll slowly (1 screen per second)
   - Observe FPS bars
   - Record if bars exceed yellow line (dropped frames)
   - Scroll quickly (fling gesture)
   - Observe FPS during deceleration

4. **Measure Frame Rate:**
   ```bash
   # Using ADB
   adb shell dumpsys gfxinfo com.sindh.jobs
   # Look for "Janky frames" percentage
   # Target: <5% janky frames
   ```

**Metrics to Record:**
- Average FPS during scroll
- Janky frames percentage
- Worst frame time (ms)

**Using Chrome DevTools:**
1. chrome://inspect → Select device
2. Performance tab
3. Start recording
4. Scroll in app
5. Stop recording
6. Analyze frame rate graph
7. Look for dropped frames (red bars)

### Test 3: Memory Usage

**Objective:** Ensure app uses <150MB RAM on low-end devices

**Steps:**

1. **Monitor Memory in Android Studio:**
   - View → Tool Windows → Profiler
   - Select device and app
   - Click "Memory" profiler
   - Launch app
   - Observe memory usage over time

2. **Stress Test:**
   - Navigate through all screens
   - Load jobs list (scroll to bottom)
   - Open job details
   - Go back to list
   - Repeat 10 times
   - Observe memory growth

3. **Check for Memory Leaks:**
   - Force garbage collection (GC button in Profiler)
   - Memory should drop after GC
   - If memory keeps growing = memory leak

4. **Using ADB:**
   ```bash
   # Check current memory usage
   adb shell dumpsys meminfo com.sindh.jobs
   # Look for "TOTAL" under "App Summary"
   ```

**Metrics to Record:**
- Initial memory (after launch): Target <80MB
- Peak memory (after navigation): Target <150MB
- Memory after GC: Should return close to initial
- Memory growth rate: <5MB per minute

**Red Flags:**
- Memory continuously growing (leak)
- Memory >200MB on low-end device
- App crashes with OutOfMemoryError

### Test 4: Network Performance

**Objective:** Ensure app handles slow networks gracefully

**Steps:**

1. **Simulate Slow Network:**
   - Android Studio → More Tools → Network Profiler
   - Or use Chrome DevTools → Network tab
   - Throttle to "Slow 3G" (400ms latency, 400kbps down, 400kbps up)

2. **Test Scenarios:**
   - Login with slow network
   - Load jobs list with slow network
   - Submit job application with slow network
   - Upload profile image with slow network

3. **Observe:**
   - Loading indicators appear
   - Timeout handling (15s timeout in api.js)
   - Error messages are clear
   - App doesn't freeze
   - User can cancel operations

**Metrics to Record:**
- Time to load jobs list on slow 3G: Target <10s
- Timeout errors handled gracefully: Yes/No
- Loading indicators visible: Yes/No
- App remains responsive: Yes/No

### Test 5: Battery Drain

**Objective:** Ensure app doesn't drain battery excessively

**Steps:**

1. **Preparation:**
   - Charge device to 100%
   - Disconnect charger
   - Close all other apps
   - Set screen brightness to 50%
   - Disable auto-brightness

2. **Usage Simulation (1 hour):**
   - 0-10 min: Browse jobs (scroll, view details)
   - 10-20 min: Apply for jobs
   - 20-30 min: Update profile
   - 30-40 min: Browse jobs again
   - 40-50 min: Check applications
   - 50-60 min: Idle (app in background)

3. **Measure Battery:**
   - Settings → Battery → Battery Usage
   - Find SINDH Jobs app
   - Record battery percentage used

4. **Using ADB:**
   ```bash
   # Check battery stats
   adb shell dumpsys batterystats com.sindh.jobs
   # Look for "Estimated power use (mAh)"
   ```

**Metrics to Record:**
- Battery drain per hour: Target <10%
- Battery drain while idle: Target <1% per hour
- Wake locks: Should be minimal

**Red Flags:**
- Battery drain >15% per hour
- App prevents device from sleeping
- Excessive wake locks

### Test 6: Image Loading Performance

**Objective:** Ensure images load quickly and don't cause jank

**Steps:**

1. **Test Profile Images:**
   - Navigate to profile page
   - Measure time to load profile image
   - Observe if UI freezes during load

2. **Test Job Images:**
   - Navigate to jobs list
   - Scroll through jobs with images
   - Observe if scrolling is smooth
   - Check if images load progressively

3. **Test Image Upload:**
   - Take photo with camera
   - Upload as profile image
   - Measure upload time
   - Check if app remains responsive

**Metrics to Record:**
- Image load time: Target <2s on slow network
- Scroll performance with images: Target >30fps
- Upload time (1MB image): Target <10s on slow network

**Optimization Checks:**
- Images are compressed (JPEG quality 80-90%)
- Images are resized (not loading 4K images)
- Lazy loading implemented (images load as scrolled)
- Placeholder shown while loading

### Test 7: UI Responsiveness

**Objective:** Ensure UI responds to touch within 100ms

**Steps:**

1. **Button Tap Response:**
   - Tap various buttons
   - Observe visual feedback (scale animation from mobile.css)
   - Measure time from tap to action

2. **Form Input Response:**
   - Tap text input
   - Measure time to show keyboard
   - Type text
   - Observe if input lags

3. **Navigation Response:**
   - Tap navigation items
   - Measure time to transition
   - Observe if transition is smooth

**Metrics to Record:**
- Touch response time: Target <100ms
- Keyboard show time: Target <300ms
- Screen transition time: Target <500ms

**Using Chrome DevTools:**
1. Performance tab
2. Record interaction
3. Look for "Input Latency" in timeline
4. Should be <100ms

---

## Performance Optimization Checklist

**Already Implemented:**
- ✅ Code splitting (React lazy loading)
- ✅ Image optimization (compression, resizing)
- ✅ API request caching
- ✅ Lazy loading of components
- ✅ Debouncing of search inputs
- ✅ Virtualized lists (if using react-window)

**To Verify:**
- [ ] Bundle size optimized (remove backend dependencies)
- [ ] Images compressed and resized
- [ ] API responses cached
- [ ] Unnecessary re-renders prevented
- [ ] Heavy computations moved to Web Workers
- [ ] Animations use CSS transforms (GPU-accelerated)

**Potential Optimizations:**

1. **Reduce Bundle Size:**
   - Remove unused dependencies (express, mysql2, etc.)
   - Tree-shake unused code
   - Use dynamic imports for large libraries

2. **Optimize Images:**
   - Compress images (JPEG quality 80%)
   - Resize images (max 1080px width)
   - Use WebP format (smaller than JPEG)
   - Lazy load images

3. **Optimize Rendering:**
   - Use React.memo for expensive components
   - Use useMemo/useCallback to prevent re-renders
   - Virtualize long lists (react-window)
   - Debounce search inputs

4. **Optimize API Calls:**
   - Cache responses (localStorage or IndexedDB)
   - Implement pagination (load 20 jobs at a time)
   - Use compression (gzip)
   - Reduce payload size (only send needed fields)

5. **Optimize Animations:**
   - Use CSS transforms (not top/left)
   - Use will-change CSS property
   - Limit animations on low-end devices
   - Use requestAnimationFrame

---

## Troubleshooting Performance Issues

**Issue: Slow App Launch**

**Possible Causes:**
- Large bundle size
- Too many dependencies
- Heavy initialization code
- Synchronous API calls on launch

**Solutions:**
- Remove unused dependencies (see package.json optimization)
- Lazy load non-critical components
- Move initialization to background
- Use splash screen to hide loading time

**Issue: Janky Scrolling**

**Possible Causes:**
- Too many items rendered at once
- Heavy components in list
- Images loading during scroll
- Animations running during scroll

**Solutions:**
- Implement virtualization (react-window)
- Simplify list item components
- Lazy load images
- Pause animations during scroll

**Issue: High Memory Usage**

**Possible Causes:**
- Memory leaks (event listeners not removed)
- Large images in memory
- Too many cached items
- Circular references

**Solutions:**
- Remove event listeners in useEffect cleanup
- Compress and resize images
- Limit cache size
- Use Chrome DevTools Memory Profiler to find leaks

**Issue: Excessive Battery Drain**

**Possible Causes:**
- Polling API too frequently
- Location tracking always on
- Wake locks not released
- Animations running in background

**Solutions:**
- Increase polling interval (or use WebSockets)
- Only track location when needed
- Release wake locks properly
- Pause animations when app in background

---

## Performance Testing Report Template

```markdown
# SINDH Jobs Performance Test Report

**Date:** [Date]
**Tester:** [Name]
**Device:** [Device Model]
**Android Version:** [Version]
**App Version:** [Version]

## Device Specifications
- CPU: [CPU Model]
- RAM: [RAM Size]
- GPU: [GPU Model]
- Screen: [Resolution]

## Test Results

### App Launch Performance
- Cold Start: [X]s (Target: <3s) ✅/❌
- Warm Start: [X]s (Target: <1s) ✅/❌
- Hot Start: [X]ms (Target: <500ms) ✅/❌

### Scroll Performance
- Average FPS: [X]fps (Target: >30fps) ✅/❌
- Janky Frames: [X]% (Target: <5%) ✅/❌

### Memory Usage
- Initial: [X]MB (Target: <80MB) ✅/❌
- Peak: [X]MB (Target: <150MB) ✅/❌
- After GC: [X]MB ✅/❌

### Network Performance
- Jobs Load (Slow 3G): [X]s (Target: <10s) ✅/❌
- Timeout Handling: ✅/❌
- Loading Indicators: ✅/❌

### Battery Drain
- 1 Hour Usage: [X]% (Target: <10%) ✅/❌
- Idle Drain: [X]% per hour (Target: <1%) ✅/❌

### Image Loading
- Profile Image: [X]s (Target: <2s) ✅/❌
- Scroll with Images: [X]fps (Target: >30fps) ✅/❌

### UI Responsiveness
- Touch Response: [X]ms (Target: <100ms) ✅/❌
- Keyboard Show: [X]ms (Target: <300ms) ✅/❌
- Screen Transition: [X]ms (Target: <500ms) ✅/❌

## Issues Found
1. [Issue description]
2. [Issue description]

## Recommendations
1. [Recommendation]
2. [Recommendation]

## Overall Assessment
- [ ] Pass - Ready for release
- [ ] Pass with minor issues - Can release with known issues
- [ ] Fail - Requires optimization before release
```

---

## Resources

**Official Documentation:**
- [Android Performance Best Practices](https://developer.android.com/topic/performance)
- [React Performance Optimization](https://react.dev/learn/render-and-commit#optimizing-performance)
- [Capacitor Performance](https://capacitorjs.com/docs/guides/performance)

**Tools:**
- [Android Studio Profiler](https://developer.android.com/studio/profile)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

**Benchmarking:**
- [WebPageTest](https://www.webpagetest.org/)
- [GTmetrix](https://gtmetrix.com/)

---

## Checklist

Before releasing app:

- [ ] Tested on at least one low-end device
- [ ] App launches in <3s on low-end device
- [ ] Scrolling is smooth (>30fps) on low-end device
- [ ] Memory usage <150MB on low-end device
- [ ] Battery drain <10% per hour
- [ ] Network errors handled gracefully
- [ ] Images load without blocking UI
- [ ] UI responds to touch within 100ms
- [ ] No memory leaks detected
- [ ] Performance report documented
