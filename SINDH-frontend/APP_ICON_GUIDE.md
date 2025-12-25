# SINDH Jobs App Icon Guide

## Current Icon Status

**Existing Icons:**
- ✅ All densities present: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi
- ✅ Three variants: `ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png`
- ✅ Adaptive icon configuration: `mipmap-anydpi-v26/ic_launcher.xml`
- ❌ Background color: Currently teal (#26A69A), needs to be orange (#ff6b35)

**Required Icon Sizes:**

| Density | Size (px) | DPI | Usage |
|---------|-----------|-----|-------|
| mdpi    | 48x48     | 160 | Low-res devices |
| hdpi    | 72x72     | 240 | Medium-res devices |
| xhdpi   | 96x96     | 320 | High-res devices |
| xxhdpi  | 144x144   | 480 | Extra high-res devices |
| xxxhdpi | 192x192   | 640 | Extra extra high-res devices |

**Adaptive Icon Sizes (Android 8.0+):**
- Foreground: 108x108dp (with 72x72dp safe zone)
- Background: 108x108dp
- Final display: 66% of 108dp = ~72dp visible

---

## Design Guidelines

**Brand Colors:**
- Primary: #ff6b35 (Orange)
- Primary Dark: #e55a2b (Darker Orange)
- Background: #FFFFFF (White) or #ff6b35 (Orange)
- Text: #FFFFFF (White on orange) or #000000 (Black on white)

**Logo Assets Available:**
- `public/logo.svg` - Main SINDH Jobs logo
- `public/sindh.svg` - Alternative logo
- `public/sindh1.svg` - Alternative logo variant

**Design Principles:**
1. **Simple:** Icon should be recognizable at small sizes (48x48px)
2. **Distinctive:** Should stand out on launcher
3. **Consistent:** Match brand identity (#ff6b35 orange)
4. **Scalable:** Work at all densities without pixelation
5. **Safe Zone:** Keep important elements in center 72x72dp for adaptive icons

---

## Icon Generation Methods

### Method 1: Using Android Studio Image Asset Studio (Recommended)

**Steps:**

1. **Open Android Studio:**
   - Open project: `SINDH-frontend/android/`
   - Right-click `app/src/main/res`
   - Select: New → Image Asset

2. **Configure Foreground Layer:**
   - Icon Type: Launcher Icons (Adaptive and Legacy)
   - Name: `ic_launcher`
   - Foreground Layer:
     - Source Asset: Image (select `public/logo.svg` or create PNG)
     - Scaling: Resize to fit safe zone (72x72dp)
     - Trim: Yes (remove transparent padding)

3. **Configure Background Layer:**
   - Background Layer:
     - Source Asset: Color
     - Color: `#ff6b35` (brand orange)
   - Alternative: Use Image with solid orange background

4. **Preview and Generate:**
   - Preview all densities and shapes (circle, rounded square, square)
   - Verify icon looks good at all sizes
   - Click "Next" → "Finish"
   - Android Studio generates all required files

5. **Verify Generated Files:**
   - `mipmap-mdpi/ic_launcher.png` (48x48)
   - `mipmap-hdpi/ic_launcher.png` (72x72)
   - `mipmap-xhdpi/ic_launcher.png` (96x96)
   - `mipmap-xxhdpi/ic_launcher.png` (144x144)
   - `mipmap-xxxhdpi/ic_launcher.png` (192x192)
   - Same for `ic_launcher_round.png` and `ic_launcher_foreground.png`

### Method 2: Using Online Icon Generator

**Recommended Tools:**
- **Android Asset Studio:** https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
- **App Icon Generator:** https://appicon.co/
- **Icon Kitchen:** https://icon.kitchen/

**Steps:**

1. **Prepare Source Image:**
   - Export logo from `public/logo.svg` as PNG
   - Size: 512x512px or 1024x1024px
   - Format: PNG with transparent background
   - Content: Logo centered in safe zone

2. **Upload to Generator:**
   - Upload 512x512px PNG
   - Set background color: #ff6b35
   - Choose adaptive icon style
   - Preview all sizes

3. **Download and Extract:**
   - Download ZIP file
   - Extract to temporary folder
   - Contains all densities and variants

4. **Copy to Project:**
   - Copy `mipmap-*/` folders to `android/app/src/main/res/`
   - Overwrite existing files
   - Verify all files copied correctly

### Method 3: Manual Creation with Design Tool

**Using Figma/Sketch/Photoshop:**

1. **Create Master Icon (1024x1024px):**
   - Canvas: 1024x1024px
   - Background: #ff6b35 (orange)
   - Logo: Centered, white or black
   - Safe zone: 768x768px (75% of canvas)
   - Export as PNG

2. **Generate Densities:**
   - mdpi: Resize to 48x48px
   - hdpi: Resize to 72x72px
   - xhdpi: Resize to 96x96px
   - xxhdpi: Resize to 144x144px
   - xxxhdpi: Resize to 192x192px

3. **Create Foreground Layer (108x108dp):**
   - Canvas: 432x432px (108dp × 4 for xxxhdpi)
   - Logo only, transparent background
   - Safe zone: 288x288px (72dp × 4)
   - Scale down for other densities:
     - mdpi: 108x108px
     - hdpi: 162x162px
     - xhdpi: 216x216px
     - xxhdpi: 324x324px
     - xxxhdpi: 432x432px

4. **Save Files:**
   - Name: `ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png`
   - Place in respective `mipmap-*/` folders

---

## Testing Icons

**Visual Testing:**

1. **Build and Install:**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

2. **Check Launcher:**
   - Open app drawer
   - Verify icon appears with orange background
   - Long-press icon to see adaptive icon animation
   - Check icon on different launcher backgrounds (light/dark)

3. **Test Different Shapes:**
   - Circle (Pixel devices)
   - Rounded square (Samsung devices)
   - Square (some custom launchers)
   - Squircle (iOS-style, some launchers)

4. **Test Different Densities:**
   - Test on low-res device (mdpi)
   - Test on high-res device (xxhdpi/xxxhdpi)
   - Verify icon is sharp, not pixelated

**Automated Testing:**

```bash
# Check if all icon files exist
for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  for variant in ic_launcher ic_launcher_round ic_launcher_foreground; do
    file="android/app/src/main/res/mipmap-$density/$variant.png"
    if [ -f "$file" ]; then
      echo "✅ $file exists"
    else
      echo "❌ $file missing"
    fi
  done
done
```

---

## Troubleshooting

**Issue: Icon appears pixelated**
- Solution: Regenerate from higher resolution source (1024x1024px)
- Ensure using PNG, not JPEG
- Verify correct density files are present

**Issue: Icon background is white instead of orange**
- Solution: Update `values/colors.xml` with `ic_launcher_background` = #ff6b35
- Update `drawable/ic_launcher_background.xml` line 8 to #ff6b35
- Rebuild app

**Issue: Icon doesn't appear after update**
- Solution: Uninstall app completely
- Clear launcher cache: Settings → Apps → Launcher → Clear Cache
- Reinstall app
- Restart device if needed

**Issue: Adaptive icon shows wrong shape**
- Solution: This is launcher-dependent
- Test on different launchers (Pixel Launcher, Nova Launcher, etc.)
- Ensure foreground layer respects safe zone (72x72dp)

---

## Best Practices

**Do:**
- ✅ Use vector graphics (SVG) as source for scalability
- ✅ Test on multiple devices and launchers
- ✅ Keep important elements in safe zone (72x72dp)
- ✅ Use brand colors consistently (#ff6b35)
- ✅ Export at highest quality (PNG-24 with transparency)
- ✅ Version control icon source files (SVG, PSD, Figma)

**Don't:**
- ❌ Use photos or complex gradients (hard to see at small sizes)
- ❌ Include text in icon (unreadable at 48x48px)
- ❌ Use too many colors (keep it simple)
- ❌ Forget to test on real devices
- ❌ Use JPEG format (no transparency support)
- ❌ Place important elements near edges (will be cropped)

---

## Resources

**Official Documentation:**
- [Android Icon Design Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_launcher)
- [Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [Material Design Icons](https://material.io/design/iconography/product-icons.html)

**Tools:**
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)
- [Icon Kitchen](https://icon.kitchen/)
- [App Icon Generator](https://appicon.co/)
- [Figma](https://www.figma.com/)
- [GIMP](https://www.gimp.org/) (free Photoshop alternative)

**Icon Templates:**
- [Android Icon Templates (Figma)](https://www.figma.com/community/file/1014241558898418245)
- [Material Design Icon Templates](https://material.io/resources/icons/)

---

## Checklist

Before releasing app:

- [ ] All icon densities generated (mdpi through xxxhdpi)
- [ ] All icon variants present (launcher, launcher_round, launcher_foreground)
- [ ] Background color is brand orange (#ff6b35)
- [ ] Icon tested on multiple devices
- [ ] Icon tested on multiple launchers
- [ ] Icon looks good in light and dark themes
- [ ] Icon respects safe zone for adaptive icons
- [ ] Icon is sharp and clear at all sizes
- [ ] Icon matches brand identity
- [ ] Source files backed up and version controlled
