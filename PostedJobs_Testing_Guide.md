# PostedJobs.jsx - Testing Guide

## 🧪 Comprehensive Testing Protocol

### Pre-Testing Setup

#### 1. Build Frontend
```powershell
cd SINDH-frontend
npm run build
npx cap sync android  # If testing on Android emulator
```

#### 2. Start Backend
```powershell
cd SINDHbackend/server
npm run dev  # Should be running on localhost:10000
```

#### 3. Prepare Test Data
- **Phase-1 Employer Account**: Has `phase: 1` in employer document
- **Phase-2 Employer Account**: Has `phase: 2` in employer document
- **Jobs**: At least 2-3 posted jobs with applications
- **Applications**: Mix of statuses (pending, accepted, in-progress, completed)

---

## 🎨 Visual Testing (Light Theme)

### Test Case 1: Background & Blur Circles
**Expected:**
- ✅ White background at top
- ✅ Beige (#E8DFD5) gradient at bottom
- ✅ Three blur circles visible:
  - Top-right: Large beige circle (~300px)
  - Bottom-left: Medium tan circle (~200px)
  - Center-right: Small tan circle (~150px)
- ✅ No aurora animations
- ✅ No noise texture

**How to Test:**
1. Navigate to `/employer/posted-jobs`
2. Visually inspect background
3. Scroll page to see gradient transition
4. Verify circles don't move (static)

---

### Test Case 2: Navigation Controls (Top-Right)
**Expected:**
- ✅ Language toggle: White button with blue border, orange on hover
- ✅ Menu button: White button with blue border, orange on hover
- ✅ Subtle shadow visible
- ✅ Text is dark (#202124), not white

**How to Test:**
1. Look at top-right corner
2. Hover over buttons (border should turn orange #FF7124)
3. Click language toggle (HI ↔ EN should work)
4. Verify menu button opens menu

---

### Test Case 3: Stats Card
**Expected:**
- ✅ White/translucent background with subtle shadow
- ✅ Orange glow effect (very subtle)
- ✅ "ACTIVE" badge: Orange background (#FF7124/10), orange text
- ✅ Active/Completed badges: Blue background (#3B4883/10), blue text
- ✅ Numbers are bold and dark (#202124)

**How to Test:**
1. Scroll to stats card (above job grid)
2. Verify glassmorphic appearance
3. Check badge colors match spec
4. Verify numbers update after refresh

---

### Test Case 4: JobCard Appearance
**Expected:**
- ✅ White/translucent card background
- ✅ **Salary in orange gradient** (from #FF7124 to #e66420) - NOT GREEN
- ✅ Progress bar: Blue track, orange fill
- ✅ "Manage Applications" button: Orange gradient
- ✅ "View" (eye icon) button: White with blue border
- ✅ All text readable (dark on light)

**How to Test:**
1. Scroll to job carousel
2. Verify salary color is orange (CRITICAL - this changed from green)
3. Check progress bar fill is orange
4. Hover over buttons (orange gradient should darken)
5. Swipe/click to see multiple cards

---

### Test Case 5: Empty State
**Expected:**
- ✅ Briefcase icon: Blue (#3B4883)
- ✅ Title: Dark text (#202124)
- ✅ Subtitle: Gray text (#202124/60)
- ✅ "Post Your First Job" button: Orange gradient

**How to Test:**
1. Login with employer who has 0 jobs
2. Navigate to `/employer/posted-jobs`
3. Verify empty state styling
4. Click button (should redirect to `/employer/post-job`)

---

### Test Case 6: Loading State
**Expected:**
- ✅ White background with beige gradient
- ✅ Two blur circles visible
- ✅ Spinner icon: Orange (#FF7124)
- ✅ "Loading your posted jobs..." text: Dark gray

**How to Test:**
1. Clear browser cache
2. Navigate to `/employer/posted-jobs` with slow 3G throttling
3. Observe loading state before jobs appear
4. Verify colors match spec

---

### Test Case 7: Success/Error Messages
**Success Expected:**
- ✅ Light green background (bg-green-50)
- ✅ Green border (border-green-200)
- ✅ Dark green text (text-green-700)
- ✅ CheckCircle icon visible

**Error Expected:**
- ✅ Light red background (bg-red-50)
- ✅ Red border (border-red-200)
- ✅ Dark red text (text-red-700)
- ✅ AlertCircle icon visible

**How to Test:**
1. Success: Post a new job, return to posted jobs (should show success banner)
2. Error: Simulate network failure, trigger error state
3. Verify colors and icons

---

## 🔧 Functional Testing (Phase-2 Interstitial)

### Test Case 8: Phase-1 Employer - First Click
**Setup:**
- Login as Phase-1 employer (phase: 1)
- Has NOT clicked "Manage Applications" before
- Clear localStorage: `localStorage.removeItem('phase2InterstitialShown_<userId>')`

**Expected Flow:**
1. ✅ Click "Manage Applications" on any job
2. ✅ Phase-2 interstitial modal opens (NOT applications modal)
3. ✅ Modal shows:
   - Orange gradient icon circle with Building icon
   - Hindi title: "अपनी कंपनी की जानकारी दें"
   - Hindi body text about trust
   - "जानकारी भरें" button (orange gradient)
   - "बाद में" button (white with blue border)
4. ✅ Applications modal is NOT visible

**How to Test:**
```javascript
// In browser console (before clicking):
localStorage.removeItem(`phase2InterstitialShown_${user.id}`);

// Click "Manage Applications" button
// Verify interstitial appears
```

---

### Test Case 9: Phase-2 Interstitial - "जानकारी भरें" Action
**Expected:**
1. ✅ Click "जानकारी भरें" button
2. ✅ Modal closes
3. ✅ localStorage flag set: `phase2InterstitialShown_<userId> = 'true'`
4. ✅ Page navigates to `/employer/phase-2`

**How to Test:**
```javascript
// After clicking "जानकारी भरें":
console.log(localStorage.getItem(`phase2InterstitialShown_${user.id}`));
// Should log: "true"

console.log(window.location.pathname);
// Should log: "/employer/phase-2"
```

---

### Test Case 10: Phase-2 Interstitial - "बाद में" Action
**Expected:**
1. ✅ Click "बाद में" button
2. ✅ Interstitial modal closes
3. ✅ localStorage flag set: `phase2InterstitialShown_<userId> = 'true'`
4. ✅ Applications modal opens immediately
5. ✅ Applications for selected job visible

**How to Test:**
1. Reset localStorage flag
2. Click "Manage Applications"
3. Click "बाद में"
4. Verify applications modal shows
5. Check localStorage flag is set

---

### Test Case 11: Phase-1 Employer - Subsequent Clicks
**Setup:**
- localStorage flag already set from previous test

**Expected:**
1. ✅ Click "Manage Applications" on any job
2. ✅ Applications modal opens DIRECTLY (bypasses interstitial)
3. ✅ Interstitial does NOT appear

**How to Test:**
```javascript
// Verify flag exists:
console.log(localStorage.getItem(`phase2InterstitialShown_${user.id}`));
// Should log: "true"

// Click "Manage Applications"
// Should go straight to applications modal
```

---

### Test Case 12: Phase-2 Employer - Never Shows Interstitial
**Setup:**
- Login as Phase-2 employer (phase: 2)
- Clear localStorage (to ensure it's not flag-based)

**Expected:**
1. ✅ Click "Manage Applications" on any job
2. ✅ Applications modal opens DIRECTLY
3. ✅ Interstitial NEVER appears (even on first click)
4. ✅ isPhase1Employer() returns false

**How to Test:**
```javascript
// In browser console:
console.log(user.phase);
// Should log: 2

// Click "Manage Applications" multiple times
// Interstitial should never appear
```

---

### Test Case 13: User Without ID - No Crash
**Setup:**
- Simulate missing user.id (edge case)

**Expected:**
1. ✅ Click "Manage Applications"
2. ✅ Page does NOT crash
3. ✅ Applications modal opens (bypasses interstitial)
4. ✅ No localStorage errors

**How to Test:**
```javascript
// Temporarily remove user.id (in React DevTools or mock)
// Click "Manage Applications"
// Verify no console errors
```

---

## 🎯 Applications Modal Testing

### Test Case 14: Modal Appearance (Light Theme)
**Expected:**
- ✅ Lighter backdrop: `bg-black/60` (not /80)
- ✅ White modal background
- ✅ Blue border (#3B4883/20)
- ✅ Drop shadow visible
- ✅ Dark text (#202124)
- ✅ Close (X) button: Gray, turns blue on hover

**How to Test:**
1. Open applications modal
2. Verify backdrop is slightly transparent (can see PostedJobs behind)
3. Check modal colors match spec
4. Hover over X button

---

### Test Case 15: Applications Display
**Expected:**
- ✅ Job title shown at top
- ✅ Empty state: Blue Users icon, dark text
- ✅ Application cards: Light blue background (#3B4883/5)
- ✅ Worker names: Bold dark text
- ✅ Status badges: Colored (green/blue/yellow/gray)
- ✅ Message text: Gray (#202124/70)
- ✅ Date text: Lighter gray (#202124/60)

**How to Test:**
1. Click "Manage Applications" on job with 0 applications → Verify empty state
2. Click on job with applications → Verify cards render correctly
3. Check status badge colors match application status
4. Scroll within modal if many applications

---

### Test Case 16: Modal Close Actions
**Expected:**
1. ✅ Click X button → Modal closes
2. ✅ Click backdrop (outside modal) → Modal closes
3. ✅ ESC key → Modal closes (Framer Motion default)

**How to Test:**
1. Open modal
2. Click X → Verify closes
3. Reopen, click dark area outside → Verify closes
4. Reopen, press ESC → Verify closes

---

## 🔄 Existing Functionality Testing

### Test Case 17: Refresh Button
**Expected:**
1. ✅ Click refresh button
2. ✅ Button shows orange gradient + spinner
3. ✅ API call to fetch jobs + applications
4. ✅ Jobs update in carousel
5. ✅ Stats card updates
6. ✅ Spinner stops, button returns to white/blue

**How to Test:**
```javascript
// Monitor network tab
// Click refresh button
// Verify API calls:
// GET /api/jobs/employer/:id
// GET /api/job-applications/employer/:id
```

---

### Test Case 18: Language Toggle
**Expected:**
1. ✅ Click language button (HI/EN)
2. ✅ Text toggles between Hindi and English
3. ✅ localStorage updated: `homeLang = 'HI'` or `'EN'`
4. ✅ i18next language changes

**How to Test:**
```javascript
// Click toggle
console.log(localStorage.getItem('homeLang'));
// Should log: 'HI' or 'EN'

console.log(i18n.language);
// Should match toggle state
```

---

### Test Case 19: Post New Job Button
**Expected:**
1. ✅ Click "Post New Job" (header or empty state)
2. ✅ Redirects to `/employer/post-job`
3. ✅ No console errors

**How to Test:**
```javascript
// Click button
console.log(window.location.pathname);
// Should log: "/employer/post-job"
```

---

### Test Case 20: View Job Details Button (Eye Icon)
**Expected:**
1. ✅ Click eye icon on JobCard
2. ✅ Redirects to `/job/:id`
3. ✅ Job details page loads

**How to Test:**
1. Click eye icon
2. Verify URL changes to `/job/<jobId>`
3. Verify job details page renders

---

## 📊 Performance Testing

### Test Case 21: Memoization Verification
**Expected:**
- ✅ JobCard re-renders only when props change
- ✅ jobStatsWithApplications recalculates only when jobs/applications change
- ✅ handleViewApplications doesn't recreate on every render

**How to Test:**
```javascript
// Install React DevTools Profiler
// Enable "Highlight updates when components render"
// Interact with page:
// - Language toggle should NOT re-render JobCards
// - Refresh should re-render JobCards
// - Opening modal should NOT re-render JobCards
```

---

### Test Case 22: Swiper Performance
**Expected:**
- ✅ Smooth swiping on mobile
- ✅ No lag when dragging cards
- ✅ Breakpoints work (1.2, 1.5, 2.2, 2.5, 3 slides)

**How to Test:**
1. Resize browser window
2. Verify slide count changes at breakpoints:
   - < 640px: 1.2 slides visible
   - 640-768px: 1.5 slides
   - 768-1024px: 2.2 slides
   - 1024-1280px: 2.5 slides
   - > 1280px: 3 slides
3. Swipe left/right (should be smooth)

---

## 🌐 Cross-Browser Testing

### Test Case 23: Chrome/Edge (Chromium)
- [ ] Background gradient renders
- [ ] Blur circles visible
- [ ] Backdrop blur works
- [ ] Orange gradients render smoothly
- [ ] Animations smooth (60fps)

### Test Case 24: Firefox
- [ ] Blur circles visible
- [ ] Backdrop blur fallback (if unsupported)
- [ ] Orange gradients render
- [ ] No console errors

### Test Case 25: Safari (Desktop)
- [ ] Background gradient renders
- [ ] Backdrop blur works
- [ ] Orange gradients render
- [ ] No webkit-specific issues

### Test Case 26: Safari (iOS - Capacitor)
- [ ] Light theme renders correctly
- [ ] Touch interactions work
- [ ] Swiper gestures smooth
- [ ] Modals open/close properly
- [ ] No iOS-specific styling issues

### Test Case 27: Chrome (Android - Capacitor)
- [ ] Light theme renders correctly
- [ ] API URL detection uses 10.0.2.2 (emulator)
- [ ] Touch interactions work
- [ ] No Android-specific issues

---

## 📱 Responsive Testing

### Desktop (1920x1080)
- [ ] 3 JobCards visible in Swiper
- [ ] Stats card width appropriate
- [ ] Blur circles positioned correctly
- [ ] Modals centered

### Laptop (1366x768)
- [ ] 2.5-3 JobCards visible
- [ ] Header elements don't overlap
- [ ] Text readable

### Tablet (768px)
- [ ] 2.2 JobCards visible
- [ ] Header stacks properly
- [ ] Modals fit screen
- [ ] Touch targets appropriate size

### Mobile (375px)
- [ ] 1.2 JobCards visible
- [ ] Header stacks vertically
- [ ] Buttons full-width where needed
- [ ] Text doesn't overflow
- [ ] Modals scroll within viewport

---

## 🔍 Edge Cases

### Test Case 28: No Jobs Posted
- [ ] Empty state displays correctly
- [ ] Icon/text/button styled properly
- [ ] "Post Your First Job" redirects correctly

### Test Case 29: No Applications on Job
- [ ] "Manage Applications" button shows (0)
- [ ] Modal shows empty state
- [ ] Users icon and text styled correctly

### Test Case 30: Many Applications (Scroll)
- [ ] Modal scrolls properly
- [ ] Application cards render correctly
- [ ] No performance issues

### Test Case 31: Long Job Titles
- [ ] Title truncates with `line-clamp-2`
- [ ] No layout breaks
- [ ] Tooltip shows full title on hover (if implemented)

### Test Case 32: Network Errors
- [ ] Error state displays correctly (red banner)
- [ ] Error message readable
- [ ] Page doesn't crash

---

## ✅ Acceptance Criteria

### Visual
- ✅ Matches Homepage light theme exactly
- ✅ All orange gradients use #FF7124 → #e66420
- ✅ All blue accents use #3B4883
- ✅ Blur circles visible and positioned correctly
- ✅ Text readable on all backgrounds

### Functional
- ✅ Phase-2 interstitial shows for Phase-1 employers (first click only)
- ✅ "जानकारी भरें" navigates to `/employer/phase-2`
- ✅ "बाद में" opens applications modal
- ✅ localStorage flag prevents repeated interstitials
- ✅ Phase-2 employers bypass interstitial completely
- ✅ All existing features work (refresh, language toggle, job posting, etc.)

### Technical
- ✅ 0 compilation errors
- ✅ 0 console errors in browser
- ✅ No performance regressions
- ✅ All memoization preserved
- ✅ UserContext integration working

### Cross-Browser
- ✅ Works in Chrome, Firefox, Safari (desktop + mobile)
- ✅ Works in Capacitor (iOS + Android)
- ✅ Responsive on all screen sizes (375px - 1920px)

---

## 🐛 Bug Reporting Template

If issues found, report using this format:

```markdown
**Test Case**: [Number and Name]
**Browser/Device**: [e.g., Chrome 120, iPhone 14 Pro]
**User Type**: [Phase-1/Phase-2 Employer]
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: 
**Actual**: 
**Screenshots**: [Attach if visual issue]
**Console Errors**: [Copy if any]
**Priority**: [High/Medium/Low]
```

---

## 📈 Testing Progress Tracker

### Visual Testing: 0/7 ⬜
- [ ] Test Case 1: Background & Blur Circles
- [ ] Test Case 2: Navigation Controls
- [ ] Test Case 3: Stats Card
- [ ] Test Case 4: JobCard Appearance
- [ ] Test Case 5: Empty State
- [ ] Test Case 6: Loading State
- [ ] Test Case 7: Success/Error Messages

### Functional Testing: 0/13 ⬜
- [ ] Test Case 8: Phase-1 First Click
- [ ] Test Case 9: "जानकारी भरें" Action
- [ ] Test Case 10: "बाद में" Action
- [ ] Test Case 11: Subsequent Clicks
- [ ] Test Case 12: Phase-2 Employer
- [ ] Test Case 13: User Without ID
- [ ] Test Case 14: Modal Appearance
- [ ] Test Case 15: Applications Display
- [ ] Test Case 16: Modal Close Actions
- [ ] Test Case 17: Refresh Button
- [ ] Test Case 18: Language Toggle
- [ ] Test Case 19: Post New Job Button
- [ ] Test Case 20: View Job Details

### Performance Testing: 0/2 ⬜
- [ ] Test Case 21: Memoization
- [ ] Test Case 22: Swiper Performance

### Cross-Browser: 0/5 ⬜
- [ ] Test Case 23: Chrome/Edge
- [ ] Test Case 24: Firefox
- [ ] Test Case 25: Safari Desktop
- [ ] Test Case 26: Safari iOS
- [ ] Test Case 27: Chrome Android

### Responsive: 0/4 ⬜
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

### Edge Cases: 0/5 ⬜
- [ ] Test Case 28: No Jobs
- [ ] Test Case 29: No Applications
- [ ] Test Case 30: Many Applications
- [ ] Test Case 31: Long Job Titles
- [ ] Test Case 32: Network Errors

**Total Progress**: 0/36 (0%)

---

**Testing Status**: ⏳ **READY TO BEGIN**
**Estimated Testing Time**: 2-3 hours for comprehensive coverage
