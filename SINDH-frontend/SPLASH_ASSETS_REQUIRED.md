# Splash Screen Assets - Manual Creation Required

## ⚠️ Action Required

Splash screen PNG assets are missing. The app references `@drawable/splash` but no `splash.png` files exist.

## 📋 Required Splash Screen Assets

Create `splash.png` files in these folders:

```
android/app/src/main/res/
├── drawable/
│   └── splash.png (default, 1080×1920 px recommended)
├── drawable-port-mdpi/
│   └── splash.png (480×800 px)
├── drawable-port-hdpi/
│   └── splash.png (720×1280 px)
├── drawable-port-xhdpi/
│   └── splash.png (1080×1920 px)
├── drawable-port-xxhdpi/
│   └── splash.png (1440×2560 px)
├── drawable-port-xxxhdpi/
│   └── splash.png (1920×3200 px)
├── drawable-land-mdpi/
│   └── splash.png (800×480 px)
├── drawable-land-hdpi/
│   └── splash.png (1280×720 px)
├── drawable-land-xhdpi/
│   └── splash.png (1920×1080 px)
├── drawable-land-xxhdpi/
│   └── splash.png (2560×1440 px)
└── drawable-land-xxxhdpi/
    └── splash.png (3200×1920 px)
```

## 🎨 Design Specifications

- **Background Color**: `#ff6b35` (brand orange) - solid fill
- **Logo/Text**: Centered on orange background
- **Safe Zone**: Keep content within center 60% of screen (avoid edges)
- **Format**: PNG (24-bit with transparency if needed)
- **Scale Type**: `CENTER_CROP` (configured in capacitor.config.json)

## 🎭 Design Guidelines

### Portrait Orientation
- **Aspect Ratio**: 9:16 typical (adjust for different densities)
- **Logo Placement**: Center vertically and horizontally
- **Text**: Optional "SINDH Jobs" or tagline below logo
- **Margins**: Minimum 80dp from screen edges

### Landscape Orientation
- **Aspect Ratio**: 16:9 typical
- **Logo Placement**: Center or slightly above center
- **Text**: Consider horizontal layout

## 🛠️ Generation Methods

### Method 1: Figma/Photoshop/GIMP Template

1. Create artboards for each density (see sizes above)
2. Design layers:
   - Background: Solid `#ff6b35` rectangle
   - Logo: Your app logo/icon (centered)
   - Text: "SINDH Jobs" or tagline (optional)
3. Export as PNG for each density
4. Name all files exactly `splash.png`
5. Place in respective drawable folders

### Method 2: Android Studio (Quick Placeholder)

1. Open Android Studio
2. Right-click `android/app/src/main/res`
3. Select `New > Image Asset`
4. Choose **Splash Screen**
5. Configure:
   - Background color: `#ff6b35`
   - Foreground: Your logo
   - Trim: No
6. Generate for all densities

### Method 3: Capacitor Splash Generator (CLI Tool)

```powershell
# Install globally
npm install -g @capacitor/assets

# Generate splash screens from source image
npx capacitor-assets generate --splash source-splash.png
```

**Note**: Requires a 2732×2732 px source PNG with centered content

### Method 4: Online Generator

Use tools like:
- **Ape Tools**: https://apetools.webprofusion.com/tools/imagegorilla
- **App Icon Generator**: https://www.appicon.co/

Upload 2048×2048 px source and download generated assets.

## ✅ Verification Checklist

After creating splash screens:

- [ ] `drawable/splash.png` exists (default fallback)
- [ ] All portrait densities created (mdpi → xxxhdpi)
- [ ] All landscape densities created (mdpi → xxxhdpi)
- [ ] Background color is `#ff6b35` throughout
- [ ] Logo/text is centered and within safe zone
- [ ] File names are exactly `splash.png` (case-sensitive)
- [ ] Images look sharp on test devices

## 🧪 Testing

1. Build and sync Android project:
   ```powershell
   npm run build
   npx cap sync android
   npx cap open android
   ```

2. Run on device/emulator and verify:
   - Splash shows immediately on launch
   - Orange background displays correctly
   - Logo is centered and not cut off
   - Smooth fade-out after 2 seconds (configured)
   - Works in portrait and landscape

3. Test on multiple screen sizes:
   - Phone (5-7 inches)
   - Tablet (10+ inches)
   - Different aspect ratios (18:9, 19:9, 20:9)

## 🔧 Capacitor Configuration

Current configuration in `capacitor.config.json`:

```json
"SplashScreen": {
  "launchShowDuration": 2000,
  "launchFadeOutDuration": 300,
  "backgroundColor": "#ff6b35",
  "showSpinner": false,
  "androidSplashResourceName": "splash",
  "androidScaleType": "CENTER_CROP"
}
```

- **Duration**: 2 seconds display + 300ms fade
- **Scale**: CENTER_CROP (fills screen, may crop edges)
- **Resource**: References `@drawable/splash`

## 🚨 Current Error

**Build Error**: `@drawable/splash` referenced in `styles.xml` but no splash.png exists.

**Solution**: Create splash.png assets per instructions above.

## 📝 Quick Start (Minimal Viable Splash)

If you need a basic splash ASAP:

1. Create a 1080×1920 px PNG in any image editor
2. Fill with `#ff6b35` solid color
3. Add centered logo/text
4. Save as `splash.png`
5. Copy to `android/app/src/main/res/drawable/splash.png`
6. Run `npx cap sync android`

**Note**: This will work but may look pixelated on some devices. For production, generate all densities.

## 🔗 Resources

- [Capacitor Splash Screen Docs](https://capacitorjs.com/docs/apis/splash-screen)
- [Android Splash Screen Guidelines](https://developer.android.com/develop/ui/views/launch/splash-screen)
- SPLASH_SCREEN_GUIDE.md (comprehensive guide in root directory)

---

**Next Steps**: Choose a generation method and create the splash screen assets, then sync with `npx cap sync android`.
