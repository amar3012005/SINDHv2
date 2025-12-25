# Legacy Launcher Icons - Manual Generation Required

## ⚠️ Action Required

Legacy launcher icons for Android API < 26 are missing. These must be generated manually using one of the methods below.

## 📋 Required Icon Densities

Create the following folders and add icons:

```
android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png (48×48 px)
│   ├── ic_launcher_round.png (48×48 px)
│   └── ic_launcher_foreground.png (108×108 px)
├── mipmap-hdpi/
│   ├── ic_launcher.png (72×72 px)
│   ├── ic_launcher_round.png (72×72 px)
│   └── ic_launcher_foreground.png (162×162 px)
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96×96 px)
│   ├── ic_launcher_round.png (96×96 px)
│   └── ic_launcher_foreground.png (216×216 px)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144×144 px)
│   ├── ic_launcher_round.png (144×144 px)
│   └── ic_launcher_foreground.png (324×324 px)
└── mipmap-xxxhdpi/
    ├── ic_launcher.png (192×192 px)
    ├── ic_launcher_round.png (192×192 px)
    └── ic_launcher_foreground.png (432×432 px)
```

## 🎨 Design Specifications

- **Background Color**: `#ff6b35` (brand orange)
- **Foreground**: Use existing `ic_launcher_foreground.xml` vector drawable as reference
- **Safe Zone**: Keep important content within 66dp diameter circle (center)
- **Format**: PNG with transparency for foreground layers

## 🛠️ Generation Methods

### Method 1: Android Studio Image Asset Tool (Recommended)

1. Open Android Studio
2. Right-click `android/app/src/main/res`
3. Select `New > Image Asset`
4. Choose **Launcher Icons (Adaptive and Legacy)**
5. Configure:
   - **Foreground Layer**: Choose your logo/icon
   - **Background Layer**: Set color to `#ff6b35`
   - **Shape**: Ensure "Circle", "Rounded Square", etc. are checked
   - **Name**: `ic_launcher`
6. Click **Next** → **Finish**
7. Android Studio will generate all densities automatically

### Method 2: Online Icon Generator

Use one of these tools:
- **Android Asset Studio**: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
- **App Icon Generator**: https://www.appicon.co/
- **Icon Kitchen**: https://icon.kitchen/

Steps:
1. Upload your 512×512 px source icon
2. Set background color to `#ff6b35`
3. Generate and download the icon pack
4. Extract and copy the `mipmap-*` folders to `android/app/src/main/res/`

### Method 3: Manual Creation with Image Editor

If using Photoshop/GIMP/Figma:

1. Create artboards for each density (48, 72, 96, 144, 192 px)
2. Design with these layers:
   - Background: Solid `#ff6b35` fill
   - Foreground: Your logo/icon (centered, within safe zone)
3. Export each size as PNG
4. Name files correctly: `ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png`
5. Place in respective `mipmap-*` folders

## ✅ Verification Checklist

After generating icons:

- [ ] All 5 density folders exist (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- [ ] Each folder contains 3 PNGs: `ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png`
- [ ] Background color is `#ff6b35` (brand orange)
- [ ] Foreground logo is centered and within safe zone
- [ ] PNG files have correct dimensions per density
- [ ] Icons look sharp on test devices (no pixelation)

## 🧪 Testing

1. Build and install app on Android device:
   ```powershell
   cd android
   ./gradlew assembleDebug
   ```

2. Test on devices with Android 7.x or lower (API < 26) to verify legacy icons

3. Test on Android 8.0+ (API 26+) to verify adaptive icons still work

## 🔗 Resources

- [Android Icon Design Guidelines](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [Material Design Icons](https://material.io/design/iconography/product-icons.html)
- APP_ICON_GUIDE.md (detailed icon guide in root directory)

## 📝 Notes

- **Current State**: Only adaptive icons (API 26+) exist via `ic_launcher_foreground.xml` vector drawable
- **Impact**: App will crash or show default icons on Android 7.x and below
- **Priority**: High - generate before production release if targeting API < 26
- **Capacitor**: Handles icon references automatically once files are in place

---

**Next Steps**: Choose a generation method above and create the legacy icons, then run `npx cap sync android` to sync changes.
