# SINDH Jobs Splash Screen Guide

## Current Splash Screen Status

**Existing Configuration:**
- ✅ Capacitor config: `capacitor.config.json` lines 13-19
- ✅ Background color: #ff6b35 (brand orange)
- ✅ Duration: 2000ms (2 seconds)
- ✅ Spinner: Disabled (showSpinner: false)
- ✅ Resource name: "splash"
- ✅ Scale type: CENTER_CROP
- ✅ Assets exist: All densities and orientations

**Existing Splash Assets:**
- `drawable/splash.png` (default)
- `drawable-port-mdpi/splash.png` (portrait, 320x480)
- `drawable-port-hdpi/splash.png` (portrait, 480x800)
- `drawable-port-xhdpi/splash.png` (portrait, 720x1280)
- `drawable-port-xxhdpi/splash.png` (portrait, 1080x1920)
- `drawable-port-xxxhdpi/splash.png` (portrait, 1440x2560)
- `drawable-land-mdpi/splash.png` (landscape, 480x320)
- `drawable-land-hdpi/splash.png` (landscape, 800x480)
- `drawable-land-xhdpi/splash.png` (landscape, 1280x720)
- `drawable-land-xxhdpi/splash.png` (landscape, 1920x1080)
- `drawable-land-xxxhdpi/splash.png` (landscape, 2560x1440)

---

## Splash Screen Design Guidelines

**Brand Requirements:**
- Background: #ff6b35 (orange)
- Logo: SINDH Jobs logo (white or black)
- Text: "SINDH Jobs" or tagline (optional)
- Style: Clean, minimal, professional

**Design Principles:**
1. **Fast Loading:** Keep file size small (<100KB per image)
2. **Centered Content:** Logo in center, safe from notches/cutouts
3. **Consistent Branding:** Match app icon and theme colors
4. **Readable:** Logo visible on orange background
5. **Safe Zones:** Account for status bar, navigation bar, notches

**Safe Zones:**
- Top: 48dp (status bar)
- Bottom: 48dp (navigation bar)
- Sides: 16dp (screen edges)
- Notch: Additional 24-48dp depending on device

---

## Splash Screen Sizes

**Portrait Orientation:**

| Density | Resolution | Aspect Ratio | Common Devices |
|---------|------------|--------------|----------------|
| mdpi    | 320x480    | 2:3          | Old devices |
| hdpi    | 480x800    | 3:5          | Budget devices |
| xhdpi   | 720x1280   | 9:16         | Standard phones |
| xxhdpi  | 1080x1920  | 9:16         | Most modern phones |
| xxxhdpi | 1440x2560  | 9:16         | High-end phones |

**Landscape Orientation:**

| Density | Resolution | Aspect Ratio | Common Devices |
|---------|------------|--------------|----------------|
| mdpi    | 480x320    | 3:2          | Old devices |
| hdpi    | 800x480    | 5:3          | Budget devices |
| xhdpi   | 1280x720   | 16:9         | Standard phones |
| xxhdpi  | 1920x1080  | 16:9         | Most modern phones |
| xxxhdpi | 2560x1440  | 16:9         | High-end phones |

**Modern Aspect Ratios:**
- 18:9 (2:1) - Samsung Galaxy S8+
- 19:9 - Pixel 3
- 19.5:9 - iPhone X/11/12
- 20:9 - Samsung Galaxy S20+

---

## Creating Splash Screens

### Method 1: Using Figma/Sketch/Photoshop (Recommended)

**Step 1: Create Master Design (1080x1920px - xxhdpi portrait)**

1. **Canvas Setup:**
   - Size: 1080x1920px (xxhdpi portrait)
   - Background: #ff6b35 (solid color)
   - Color mode: RGB
   - Resolution: 72 DPI (for screens)

2. **Add Logo:**
   - Import: `public/logo.svg` or `public/sindh.svg`
   - Position: Center (540px from left, 960px from top)
   - Size: 300x300px (adjust to fit)
   - Color: White (#FFFFFF) for contrast on orange

3. **Add Text (Optional):**
   - Text: "SINDH Jobs" or tagline
   - Position: Below logo (center aligned)
   - Font: Sans-serif, bold, 48px
   - Color: White (#FFFFFF)

4. **Safe Zone Check:**
   - Draw guides:
     - Top: 144px (status bar + notch)
     - Bottom: 144px (navigation bar)
     - Sides: 48px (screen edges)
   - Ensure logo and text within safe zone

**Step 2: Export for All Densities**

**Portrait:**
- mdpi: Resize to 320x480px → Export as `splash.png`
- hdpi: Resize to 480x800px → Export as `splash.png`
- xhdpi: Resize to 720x1280px → Export as `splash.png`
- xxhdpi: Keep at 1080x1920px → Export as `splash.png`
- xxxhdpi: Resize to 1440x2560px → Export as `splash.png`

**Landscape:**
- Rotate master design 90° (or create new 1920x1080px canvas)
- Repeat export process for landscape sizes

**Export Settings:**
- Format: PNG-24
- Compression: Medium (balance quality and file size)
- Color profile: sRGB
- Target: <100KB per file

**Step 3: Place Files in Project**

```
android/app/src/main/res/
├── drawable/
│   └── splash.png (default, 1080x1920)
├── drawable-port-mdpi/
│   └── splash.png (320x480)
├── drawable-port-hdpi/
│   └── splash.png (480x800)
├── drawable-port-xhdpi/
│   └── splash.png (720x1280)
├── drawable-port-xxhdpi/
│   └── splash.png (1080x1920)
├── drawable-port-xxxhdpi/
│   └── splash.png (1440x2560)
├── drawable-land-mdpi/
│   └── splash.png (480x320)
├── drawable-land-hdpi/
│   └── splash.png (800x480)
├── drawable-land-xhdpi/
│   └── splash.png (1280x720)
├── drawable-land-xxhdpi/
│   └── splash.png (1920x1080)
└── drawable-land-xxxhdpi/
    └── splash.png (2560x1440)
```

### Method 2: Using Capacitor Splash Screen Generator

**Online Tool:**
- https://capacitorjs.com/docs/guides/splash-screens-and-icons

**Steps:**
1. Create 2732x2732px PNG with logo centered
2. Background: #ff6b35
3. Upload to Capacitor generator
4. Download generated assets
5. Copy to project res/ folders

### Method 3: Using Android Studio

**Steps:**
1. Right-click `res/` → New → Image Asset
2. Asset Type: Image
3. Path: Select your splash screen image
4. Resource name: `splash`
5. Generate for all densities

---

## Capacitor Configuration

**Current Config (`capacitor.config.json` lines 13-19):**

```json
"SplashScreen": {
  "launchShowDuration": 2000,
  "backgroundColor": "#ff6b35",
  "showSpinner": false,
  "androidSplashResourceName": "splash",
  "androidScaleType": "CENTER_CROP"
}
```

**Configuration Options:**

**launchShowDuration:**
- Current: 2000 (2 seconds)
- Range: 0-10000ms
- Recommendation: 2000-3000ms (long enough to see, not annoying)
- Set to 0 to hide immediately after app loads

**backgroundColor:**
- Current: #ff6b35 (brand orange)
- Must match splash image background
- Visible before image loads

**showSpinner:**
- Current: false (no loading spinner)
- Set to true to show loading indicator
- Spinner color: white (on orange background)

**androidSplashResourceName:**
- Current: "splash"
- Must match filename in drawable folders
- Don't include .png extension

**androidScaleType:**
- Current: CENTER_CROP
- Options:
  - `CENTER_CROP`: Scale to fill, crop edges (recommended)
  - `CENTER_INSIDE`: Scale to fit, show full image
  - `FIT_XY`: Stretch to fill (not recommended)
  - `CENTER`: No scaling, center image

**Additional Options:**

```json
"SplashScreen": {
  "launchShowDuration": 2000,
  "launchAutoHide": true,
  "launchFadeOutDuration": 300,
  "backgroundColor": "#ff6b35",
  "androidSplashResourceName": "splash",
  "androidScaleType": "CENTER_CROP",
  "showSpinner": false,
  "androidSpinnerStyle": "large",
  "spinnerColor": "#ffffff"
}
```

**launchAutoHide:**
- Default: true
- Auto-hide after duration
- Set to false to manually hide with `SplashScreen.hide()`

**launchFadeOutDuration:**
- Default: 300ms
- Fade animation duration
- Range: 0-1000ms

**androidSpinnerStyle:**
- Options: "small", "large", "inverse"
- Only if showSpinner: true

**spinnerColor:**
- Hex color for spinner
- Default: white (#ffffff)

---

## Testing Splash Screen

**Visual Testing:**

1. **Build and Install:**
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   # In Android Studio: Run app
   ```

2. **Test Scenarios:**
   - Cold start (app not in memory)
   - Warm start (app in background)
   - Different screen sizes (small, medium, large)
   - Different orientations (portrait, landscape)
   - Different Android versions (7.0, 8.0, 10, 11, 12, 13)

3. **Check:**
   - Splash appears immediately on launch
   - Background color is orange (#ff6b35)
   - Logo is centered and visible
   - No white flash before splash
   - Smooth transition to main app
   - Duration is appropriate (2 seconds)

**Automated Testing:**

```bash
# Check if all splash files exist
for orientation in port land; do
  for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
    file="android/app/src/main/res/drawable-$orientation-$density/splash.png"
    if [ -f "$file" ]; then
      size=$(wc -c < "$file")
      echo "✅ $file exists ($size bytes)"
    else
      echo "❌ $file missing"
    fi
  done
done
```

---

## Troubleshooting

**Issue: White flash before splash screen**
- Solution: Set `android:background` in `styles.xml` AppTheme.NoActionBarLaunch
- Ensure background color matches splash background (#ff6b35)

**Issue: Splash screen doesn't appear**
- Solution: Check `androidSplashResourceName` matches filename
- Verify splash.png files exist in all drawable folders
- Check `styles.xml` references `@drawable/splash`

**Issue: Splash screen is stretched/distorted**
- Solution: Change `androidScaleType` to `CENTER_CROP` or `CENTER_INSIDE`
- Ensure splash images have correct aspect ratios

**Issue: Splash screen shows too long**
- Solution: Reduce `launchShowDuration` in capacitor.config.json
- Or call `SplashScreen.hide()` manually in `mobileService.js`

**Issue: Logo is cut off by notch**
- Solution: Increase safe zone margins in design
- Keep logo within center 60% of screen
- Test on devices with notches (Pixel 3, iPhone X)

---

## Best Practices

**Do:**
- ✅ Use solid background color (#ff6b35)
- ✅ Keep logo centered and within safe zone
- ✅ Optimize file sizes (<100KB per image)
- ✅ Test on multiple devices and orientations
- ✅ Match splash background to app theme
- ✅ Use PNG format with transparency (if needed)
- ✅ Provide all densities and orientations

**Don't:**
- ❌ Use complex animations (not supported)
- ❌ Include too much text (hard to read quickly)
- ❌ Use photos or gradients (large file sizes)
- ❌ Show splash for too long (>3 seconds)
- ❌ Use different branding than app icon
- ❌ Forget to test on real devices

---

## Advanced: Custom Splash Screen with Animation

For more complex splash screens with animations, consider:

1. **Lottie Animations:**
   - Use `lottie-react-native` for JSON animations
   - Show animated logo during app initialization
   - Requires custom implementation

2. **Custom Splash Activity:**
   - Create custom Android Activity
   - Show animated splash
   - Transition to Capacitor MainActivity
   - Requires native Android development

3. **React-Based Splash:**
   - Hide Capacitor splash immediately
   - Show React component as splash
   - More control, but slower initial load

---

## Resources

**Official Documentation:**
- [Capacitor Splash Screen Plugin](https://capacitorjs.com/docs/apis/splash-screen)
- [Android Splash Screens](https://developer.android.com/guide/topics/ui/splash-screen)
- [Material Design Launch Screens](https://material.io/design/communication/launch-screen.html)

**Tools:**
- [Figma](https://www.figma.com/)
- [Capacitor Asset Generator](https://capacitorjs.com/docs/guides/splash-screens-and-icons)
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)

---

## Checklist

Before releasing app:

- [ ] All splash densities generated (mdpi through xxxhdpi)
- [ ] Both orientations provided (portrait and landscape)
- [ ] Background color matches brand (#ff6b35)
- [ ] Logo centered and within safe zone
- [ ] File sizes optimized (<100KB each)
- [ ] Tested on multiple devices
- [ ] Tested in both orientations
- [ ] Duration is appropriate (2-3 seconds)
- [ ] No white flash before splash
- [ ] Smooth transition to main app
- [ ] Matches app icon branding
