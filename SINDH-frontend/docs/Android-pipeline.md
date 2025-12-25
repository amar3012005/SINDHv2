<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# i want you to help me bulid the android app for my currnet react webapplication , i have setup the capacitor and connected backend to  the android studio. now we need to decide specifications for both employer and worker. for employer we need to make the workflow as simple as possible form the new user, for rural and semi-urban India, from clicking the POST JOB then asking to login, then if new user ask for registration , ask minimum details for first job posting like (Full name, phonenumber, email, location(ask for pincode or access location ) preffered works (farming, plumbing, carpentry,....) then register  (phase-1 (give minimum shaktiscore)) then the user pots job with and for every job ask minimum requirements (work kind, location (right here or somewhere else, min salary, max salary,min salary then post . when a worker applies and to view the applicants at that time ask for other details for phase-2 (like payyment and all )...we also need specifications regarding sounds, notifications, vibrations and permisions and other integrations like google maps , user verifications, reminder notifications , etc, I want you to provide me with detailed Employer side workflow

Now I'll create a comprehensive Android app specification document for the employer-side workflow based on all the research and documentation.

# **SINDH Platform - Android App Specifications: Employer Side (Detailed Workflow)**

## **Executive Summary**

This document provides comprehensive specifications for building the Android application for the SINDH platform's employer side, specifically designed for rural and semi-urban India. The focus is on progressive onboarding with minimal friction, ensuring that first-time users can post jobs with minimal information upfront while gradually collecting additional data as needed.

***

## **1. Technical Foundation \& Setup**

### **1.1 Capacitor Configuration**

Based on your existing React web application with Capacitor setup:

**Required Capacitor Plugins:**[^1][^2]

```bash
npm install @capacitor/android
npm install @capacitor/app
npm install @capacitor/haptics
npm install @capacitor/geolocation
npm install @capacitor/push-notifications
npm install @capacitor/camera
npm install @capacitor/local-notifications
npm install @capacitor/network
npm install @capacitor/device
npm install @capacitor-community/google-maps
```

**Capacitor Configuration (capacitor.config.ts):**[^3][^1]

```typescript
const config: CapacitorConfig = {
  appId: 'in.sindh.employer',
  appName: 'SINDH Employer',
  webDir: 'build',
  android: {
    minVersion: 23,
    targetSDKVersion: 34,
    compileSdkVersion: 34,
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
}
```

**Android variables.gradle:**[^3]

```gradle
ext {
    minSdkVersion = 23
    compileSdkVersion = 34
    targetSdkVersion = 34
    androidxActivityVersion = '1.8.0'
    androidxAppCompatVersion = '1.6.1'
    androidxCoreVersion = '1.12.0'
}
```


***

## **2. Progressive Onboarding Workflow (Phase-1: Minimal Registration)**

### **2.1 First-Time Employer Journey**

**Design Philosophy for Rural India:**[^4][^5][^6]

- **Simplicity First:** Maximum 4 fields per screen
- **Visual-Heavy:** Use icons and illustrations over text
- **Localization:** Support Hindi and regional languages[^5]
- **Low Bandwidth:** Optimize for 2G/3G networks
- **Progressive Disclosure:** Show features when relevant[^4]


### **2.2 Detailed Registration Flow**

#### **Step 0: Welcome Screen (Optional Skip)**

```
Components:
- App logo with simple tagline
- 3 benefit points (visual icons + minimal text):
  • "मज़दूर ढूंढें" (Find Workers) 
  • "सुरक्षित भुगतान" (Safe Payment)
  • "विश्वसनीय कार्यकर्ता" (Trusted Workers)
- CTA: "शुरू करें" (Start Now)
- Skip Tour option
```


#### **Step 1: Click "POST JOB" Button**

```
Action Trigger: User taps prominent "नौकरी पोस्ट करें" button
Screen State: Checks authentication
- If logged in → Direct to job posting form
- If not logged in → Navigate to Step 2
```


#### **Step 2: Authentication Gate**

```
Screen Layout:
┌─────────────────────────────┐
│   [Icon: Lock/User]         │
│                             │
│  "नौकरी पोस्ट करने के लिए"  │
│   "लॉगिन करें"              │
│                             │
│  [Phone Number Input]       │
│  [+91] [__________]         │
│                             │
│  [OTP भेजें Button]         │
│                             │
│  "नया यूजर? रजिस्टर करें"   │
└─────────────────────────────┘

OTP Verification Flow:
- SMS OTP sent to mobile[^40][^54]
- Auto-read OTP (if permission granted)
- 6-digit OTP input with timer (60 seconds)
- Resend OTP option
```

**Android Implementation:**[^7]

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.RECEIVE_SMS"/>
<uses-permission android:name="android.permission.READ_SMS" 
                 android:maxSdkVersion="22"/>
```


#### **Step 3: New User Registration (Minimal Data Collection)**

**Philosophy:** Collect ONLY what's absolutely necessary to post the first job[^8][^9][^10]

```
Registration Form (Single Screen):
┌─────────────────────────────────┐
│ "पहली बार? बस 4 चीज़ें चाहिए"  │
│                                 │
│ 1. पूरा नाम *                   │
│    [_________________]          │
│                                 │
│ 2. मोबाइल नंबर * (pre-filled)  │
│    [+91-9876543210]             │
│                                 │
│ 3. ईमेल (वैकल्पिक)             │
│    [_________________]          │
│                                 │
│ 4. आपका स्थान *                │
│    [📍 Current Location]        │
│    OR                           │
│    [पिनकोड: ______]            │
│                                 │
│ [✓] मैं नियम स्वीकार करता हूँ   │
│                                 │
│ [रजिस्टर करें →]                │
└─────────────────────────────────┘

* = Required fields
```

**Data Collected (Phase-1):**

- Full Name (Text input, validation: 3-50 chars)
- Phone Number (Auto-filled from OTP verification)
- Email (Optional, validation if provided)
- Location (GPS or Pincode - see section 3)
- Terms acceptance checkbox

**Database Schema (Phase-1):**[^11][^12]

```javascript
{
  _id: "employer_id",
  fullName: "Rajesh Kumar",
  phoneNumber: "+919876543210",
  email: "rajesh@example.com", // Optional
  location: {
    type: "Point",
    coordinates: [77.5946, 12.9716],
    address: "Bangalore, Karnataka",
    pincode: "560001"
  },
  shaktiScore: 10, // Initial minimal score
  phase: 1,
  registrationDate: ISODate("2025-11-03T14:30:00Z"),
  accountStatus: "active",
  termsAccepted: true,
  preferredWorkTypes: [] // Empty initially
}
```


#### **Step 4: Minimal ShaktiScore Assignment**

**Initial ShaktiScore: 10 points**[^13]

```
ShaktiScore Phase-1 Breakdown:
┌──────────────────────────────────┐
│ ✓ Phone Verified     : +5 points │
│ ✓ Profile Created    : +5 points │
│                                  │
│ Total ShaktiScore: 10/100        │
│                                  │
│ "अधिक स्कोर के लिए प्रोफाइल    │
│  पूरा करें"                      │
└──────────────────────────────────┘

Visual: Simple progress bar showing 10%
Color: Yellow/Orange (indicating "new user")
```

**ShaktiScore Enhancement Opportunities (Shown Later):**

- Add email: +5 points
- Verify Aadhaar: +15 points
- Add payment method: +10 points
- Complete first job: +20 points
- Get worker rating: +10 points

***

## **3. Location Services Integration**

### **3.1 Location Capture Strategy**[^14][^15][^16]

**Two-Pronged Approach:**

**Option A: GPS Location (Recommended)**

```typescript
import { Geolocation } from '@capacitor/geolocation';

async function getCurrentLocation() {
  try {
    // Request permission first
    const permission = await Geolocation.requestPermissions();
    
    if (permission.location === 'granted') {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    }
  } catch (error) {
    // Fallback to pincode
    showPincodeInput();
  }
}
```

**AndroidManifest.xml:**[^15][^14]

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>

<!-- For Android 10+ background location (optional) -->
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION"/>
```

**Location Permission Dialog (Contextual Explanation):**[^17][^18]

```
Before requesting permission, show explanation:
┌─────────────────────────────────┐
│ [Icon: Map Pin]                 │
│                                 │
│ "हमें आपका स्थान चाहिए क्योंकि" │
│                                 │
│ ✓ नज़दीकी मज़दूर ढूंढने के लिए  │
│ ✓ सही दूरी दिखाने के लिए        │
│ ✓ स्थानीय कीमत देने के लिए     │
│                                 │
│ [Location Allow करें]           │
│ [पिनकोड डालें →]               │
└─────────────────────────────────┘
```

**Option B: Pincode Entry (Fallback)**

```
Input Form:
┌─────────────────────────────────┐
│ "अपना पिनकोड डालें"            │
│                                 │
│ [______] (6 digits)             │
│                                 │
│ Auto-complete suggestions:      │
│ • 560001 - Bangalore Central    │
│ • 560002 - Bangalore East       │
│                                 │
│ [आगे बढ़ें →]                   │
└─────────────────────────────────┘
```

**Backend Geocoding:**

- Use Pincode to fetch approximate coordinates
- Store both pincode and coordinates
- Use Google Geocoding API for reverse lookup[^16]

***

## **4. Job Posting Flow (First Job - Minimal Requirements)**

### **4.1 Simplified Job Creation Form**

**Screen 1: Basic Job Details**

```
┌─────────────────────────────────┐
│ "नौकरी की जानकारी दें"          │
│                                 │
│ काम का प्रकार *                 │
│ [Dropdown: खेती, प्लंबिंग,      │
│  सफाई, बढ़ई, बिजली...]         │
│                                 │
│ कितने मज़दूर चाहिए? *           │
│ [- 1 +]                         │
│                                 │
│ काम कहाँ है? *                  │
│ ○ यहीं (Current Location)       │
│ ○ कहीं और                      │
│   [📍 Location Search]          │
│                                 │
│ [आगे बढ़ें →]                   │
└─────────────────────────────────┘
```

**Screen 2: Payment Details**

```
┌─────────────────────────────────┐
│ "वेतन की जानकारी"              │
│                                 │
│ न्यूनतम वेतन (प्रति दिन) *     │
│ ₹ [_____]                       │
│                                 │
│ अधिकतम वेतन (प्रति दिन) *      │
│ ₹ [_____]                       │
│                                 │
│ सुझाव: इस क्षेत्र में औसत      │
│ ₹300-500/दिन                    │
│                                 │
│ [नौकरी पोस्ट करें ✓]            │
└─────────────────────────────────┘
```

**Job Data Structure (Minimal):**[^12][^11]

```javascript
{
  _id: "job_id",
  employer: "employer_id",
  workType: "plumbing",
  workersNeeded: 2,
  location: {
    type: "Point",
    coordinates: [77.5946, 12.9716],
    address: "Bangalore, Karnataka"
  },
  salary: {
    min: 400,
    max: 600,
    currency: "INR",
    type: "per_day"
  },
  status: "active",
  createdAt: ISODate(),
  phase: 1 // Minimal job posting
}
```


***

## **5. Phase-2: Progressive Data Collection (When Workers Apply)**

### **5.1 Trigger Point: Viewing Applicants**

**Scenario:** Employer receives worker applications and clicks "View Applications"

**Interstitial Screen (Before showing applicants):**

```
┌─────────────────────────────────┐
│ [Icon: 3 workers applied]       │
│                                 │
│ "बढ़िया! 3 मज़दूरों ने अप्लाई  │
│  किया है"                       │
│                                 │
│ "उन्हें देखने से पहले, कृपया   │
│  ये जानकारी दें:"               │
│                                 │
│ • भुगतान विधि                   │
│ • पसंदीदा काम (वैकल्पिक)       │
│                                 │
│ [जानकारी दें →]                 │
│ [बाद में]                       │
└─────────────────────────────────┘
```


### **5.2 Phase-2 Data Collection Form**

**Payment Method Selection:**[^19][^20][^21]

```
┌─────────────────────────────────┐
│ "भुगतान कैसे करेंगे?"           │
│                                 │
│ ○ UPI                           │
│   [UPI ID: _________@paytm]    │
│                                 │
│ ○ Bank Account                  │
│   [Account No: __________]      │
│   [IFSC: __________]            │
│                                 │
│ ○ PhonePe/Paytm Wallet         │
│   [Mobile: +91-_________]       │
│                                 │
│ ○ Cash (स्थानीय काम के लिए)   │
│                                 │
│ [Save करें →]                   │
└─────────────────────────────────┘
```

**Preferred Work Types (Optional but Recommended):**

```
┌─────────────────────────────────┐
│ "आपको कौन से काम चाहिए?"       │
│ (Multiple selection)            │
│                                 │
│ [✓] खेती (Farming)              │
│ [ ] प्लंबिंग (Plumbing)         │
│ [✓] बढ़ई (Carpentry)            │
│ [ ] इलेक्ट्रिकल                 │
│ [✓] सफाई (Cleaning)             │
│ [ ] बागवानी (Gardening)         │
│                                 │
│ "यह मदद करेगा सही नौकरी        │
│  सुझाव देने में"                │
│                                 │
│ [Save करें →]                   │
│ [Skip करें]                     │
└─────────────────────────────────┘
```

**Aadhaar Verification (Optional but Incentivized):**[^22][^23][^24]

```
┌─────────────────────────────────┐
│ [Shield Icon]                   │
│                                 │
│ "Aadhaar से Verify करें"        │
│                                 │
│ Benefits:                       │
│ • +15 ShaktiScore points        │
│ • Verified badge                │
│ • Priority job posting          │
│ • Worker trust बढ़ेगा          │
│                                 │
│ Aadhaar Number:                 │
│ [____][____][____]              │
│                                 │
│ [OTP भेजें]                     │
│                                 │
│ [बाद में]                       │
└─────────────────────────────────┘

OTP Verification:
- OTP sent to Aadhaar-registered mobile
- 6-digit verification
- Secure API integration with UIDAI
```

**Updated Database Schema (Phase-2):**

```javascript
{
  _id: "employer_id",
  // Phase-1 data remains...
  
  // Phase-2 additions:
  paymentMethods: [
    {
      type: "upi",
      upiId: "rajesh@paytm",
      verified: true,
      primary: true
    },
    {
      type: "bank",
      accountNumber: "1234567890",
      ifsc: "SBIN0001234",
      verified: false
    }
  ],
  preferredWorkTypes: ["farming", "carpentry", "cleaning"],
  aadhaarVerified: true,
  aadhaarNumber: "XXXX-XXXX-1234", // Last 4 digits only
  shaktiScore: 50, // Updated after Phase-2
  phase: 2,
  profileCompleteness: 50
}
```


***

## **6. Android Permissions \& Best Practices**

### **6.1 Permission Strategy**[^25][^18][^17]

**Core Principle:** Request permissions **contextually** and **just-in-time**[^17][^8]

**Required Permissions:**

```xml
<!-- AndroidManifest.xml -->
<manifest>
  <!-- Phase-1 Permissions (Essential) -->
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
  
  <!-- Location (Requested during registration) -->
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
  
  <!-- SMS (For OTP auto-read) -->
  <uses-permission android:name="android.permission.RECEIVE_SMS"/>
  <uses-permission android:name="android.permission.READ_SMS" 
                   android:maxSdkVersion="22"/>
  
  <!-- Notifications -->
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
  
  <!-- Camera (For profile photo - Phase 2+) -->
  <uses-permission android:name="android.permission.CAMERA"/>
  
  <!-- Storage (For profile photo upload) -->
  <uses-permission android:name="android.permission.READ_MEDIA_IMAGES"
                   android:minSdkVersion="33"/>
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
                   android:maxSdkVersion="32"/>
  
  <!-- Vibration for haptic feedback -->
  <uses-permission android:name="android.permission.VIBRATE"/>
</manifest>
```


### **6.2 Permission Request Flow**[^17]

**1. Location Permission (During Registration):**

```typescript
import { Geolocation } from '@capacitor/geolocation';

async function requestLocationPermission() {
  // Show rationale first
  showLocationRationale();
  
  const permission = await Geolocation.requestPermissions();
  
  if (permission.location === 'granted') {
    getCurrentLocation();
  } else if (permission.location === 'denied') {
    // Fallback to pincode
    showPincodeInput();
  }
}
```

**2. Camera Permission (When adding profile photo - Phase 2+):**[^18][^26]

```typescript
import { Camera } from '@capacitor/camera';

async function takeProfilePhoto() {
  // Show rationale
  showDialog({
    title: "Camera Access",
    message: "हमें आपकी फोटो चाहिए प्रोफाइल के लिए। यह मज़दूरों को विश्वास दिलाता है।",
    buttons: [
      { text: "Allow", onClick: requestCamera },
      { text: "Skip", onClick: skipPhoto }
    ]
  });
}

async function requestCamera() {
  const permission = await Camera.requestPermissions();
  if (permission.camera === 'granted') {
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: true,
      resultType: CameraResultType.Base64
    });
    uploadPhoto(photo);
  }
}
```

**3. Notification Permission (After first job posted):**[^27][^28][^29]

```typescript
import { PushNotifications } from '@capacitor/push-notifications';

async function requestNotificationPermission() {
  showDialog({
    title: "Notifications चालू करें",
    message: "जब मज़दूर apply करें तब तुरंत जानने के लिए",
    buttons: [
      { text: "चालू करें", onClick: enableNotifications },
      { text: "बाद में", onClick: skip }
    ]
  });
}

async function enableNotifications() {
  const permission = await PushNotifications.requestPermissions();
  
  if (permission.receive === 'granted') {
    await PushNotifications.register();
    
    PushNotifications.addListener('registration', (token) => {
      // Send token to backend
      sendTokenToServer(token.value);
    });
  }
}
```


***

## **7. Push Notifications System (Firebase Cloud Messaging)**

### **7.1 FCM Integration**[^28][^30][^29][^27]

**Setup Firebase:**

1. Create Firebase project in Firebase Console
2. Download `google-services.json` and place in `android/app/`
3. Add Firebase SDK to `build.gradle`

**android/app/build.gradle:**

```gradle
dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.5.0')
    implementation 'com.google.firebase:firebase-messaging'
}

apply plugin: 'com.google.gms.google-services'
```

**Configure Push Notifications:**[^27]

```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Initialize on app start
async function initPushNotifications() {
  // Request permission
  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive === 'granted') {
    await PushNotifications.register();
  }

  // Handle registration
  PushNotifications.addListener('registration', (token) => {
    console.log('FCM Token:', token.value);
    // Send to backend
    saveFCMToken(token.value);
  });

  // Handle notification received (app in foreground)
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    showInAppNotification(notification);
  });

  // Handle notification click
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    handleNotificationClick(notification);
  });
}
```


### **7.2 Notification Types**[^28]

**1. Worker Application Notification:**

```json
{
  "notification": {
    "title": "नया Application!",
    "body": "रामू ने आपकी प्लंबिंग job के लिए apply किया है"
  },
  "data": {
    "type": "new_application",
    "jobId": "job_123",
    "workerId": "worker_456",
    "screen": "ApplicationDetails"
  },
  "android": {
    "priority": "high",
    "notification": {
      "sound": "application_received.mp3",
      "channel_id": "job_applications"
    }
  }
}
```

**2. Job Status Update Notification:**

```json
{
  "notification": {
    "title": "Job Status Update",
    "body": "आपकी job पूरी हो गई है। Payment करें।"
  },
  "data": {
    "type": "job_completed",
    "jobId": "job_123",
    "screen": "JobDetails"
  }
}
```

**3. Reminder Notification:**

```json
{
  "notification": {
    "title": "Reminder: Payment Pending",
    "body": "कृपया रामू को payment करें (₹500)"
  },
  "data": {
    "type": "payment_reminder",
    "jobId": "job_123",
    "amount": "500"
  }
}
```


### **7.3 Notification Channels (Android 8+)**[^27]

```java
// Create in MainActivity.java
public void createNotificationChannels() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        // High priority channel for applications
        NotificationChannel applicationChannel = new NotificationChannel(
            "job_applications",
            "Job Applications",
            NotificationManager.IMPORTANCE_HIGH
        );
        applicationChannel.setDescription("Notifications for new job applications");
        applicationChannel.enableVibration(true);
        applicationChannel.setVibrationPattern(new long[]{0, 500, 200, 500});
        
        // Medium priority for reminders
        NotificationChannel reminderChannel = new NotificationChannel(
            "reminders",
            "Reminders",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(applicationChannel);
        manager.createNotificationChannel(reminderChannel);
    }
}
```


***

## **8. Haptic Feedback \& Vibration Patterns**

### **8.1 Haptic Feedback Strategy**[^31][^32][^33][^34]

**Philosophy:** Use haptics to enhance UX, not annoy users[^33]

**Implementation with Capacitor:**

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Light haptic for button taps
async function lightHaptic() {
  await Haptics.impact({ style: ImpactStyle.Light });
}

// Medium haptic for confirmations
async function mediumHaptic() {
  await Haptics.impact({ style: ImpactStyle.Medium });
}

// Heavy haptic for success/error
async function heavyHaptic() {
  await Haptics.impact({ style: ImpactStyle.Heavy });
}

// Notification haptic
async function notificationHaptic() {
  await Haptics.notification({ type: NotificationType.Success });
}
```


### **8.2 Haptic Use Cases**

**1. Registration Flow:**

```typescript
// On successful OTP verification
await Haptics.notification({ type: NotificationType.Success });

// On error
await Haptics.notification({ type: NotificationType.Error });

// On button press
await Haptics.impact({ style: ImpactStyle.Light });
```

**2. Job Posting:**

```typescript
// On "Post Job" button press
await Haptics.impact({ style: ImpactStyle.Medium });

// On successful job creation
await Haptics.notification({ type: NotificationType.Success });
// Combine with visual feedback and sound

// On form validation error
await Haptics.notification({ type: NotificationType.Warning });
```

**3. Worker Application:**

```typescript
// When new application arrives (background notification)
vibrationPattern: [0, 500, 200, 500] // Short, pause, short

// When employer accepts/rejects
await Haptics.impact({ style: ImpactStyle.Heavy });
```


### **8.3 Custom Vibration Patterns**[^31]

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.VIBRATE"/>
```

```typescript
// Custom pattern for important notifications
const importantPattern = [0, 300, 100, 300, 100, 300];

// For Android native implementation
if (Capacitor.getPlatform() === 'android') {
  Capacitor.Plugins.Haptics.vibrate({ duration: 500 });
}
```


***

## **9. Google Maps Integration**

### **9.1 Maps Setup**[^35][^36][^37][^38][^16]

**Install Capacitor Google Maps:**

```bash
npm install @capacitor-community/google-maps
```

**Get API Keys:**

- Enable "Maps SDK for Android" in Google Cloud Console
- Enable "Places API" for location search
- Create API key with restrictions

**Configure API Key:**

**android/app/src/main/AndroidManifest.xml:**

```xml
<application>
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_ANDROID_MAPS_API_KEY"/>
</application>
```


### **9.2 Map Implementation**[^16][^35]

**Job Location Selector:**

```typescript
import { GoogleMap } from '@capacitor-community/google-maps';

async function createMap() {
  const mapRef = document.getElementById('map');
  
  const newMap = await GoogleMap.create({
    id: 'job-location-map',
    element: mapRef,
    apiKey: 'YOUR_API_KEY',
    config: {
      center: {
        lat: 12.9716, // Bangalore
        lng: 77.5946
      },
      zoom: 12
    }
  });

  // Add marker on location selection
  await newMap.addMarker({
    coordinate: {
      lat: 12.9716,
      lng: 77.5946
    },
    title: "Job Location",
    snippet: "Plumbing work"
  });
  
  // Listen for map clicks
  await newMap.setOnMapClickListener((event) => {
    updateJobLocation(event.latitude, event.longitude);
  });
  
  return newMap;
}
```

**Location Search with Places API:**

```typescript
async function searchLocation(query: string) {
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=${API_KEY}&components=country:in`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return data.predictions.map(place => ({
    placeId: place.place_id,
    description: place.description
  }));
}

// Get place details
async function getPlaceDetails(placeId: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return {
    lat: data.result.geometry.location.lat,
    lng: data.result.geometry.location.lng,
    address: data.result.formatted_address
  };
}
```

**UI Component:**

```typescript
<div className="location-selector">
  {/* Search input */}
  <input 
    type="text"
    placeholder="खोजें स्थान..."
    onChange={(e) => handleLocationSearch(e.target.value)}
  />
  
  {/* Suggestions dropdown */}
  <ul className="suggestions">
    {suggestions.map(place => (
      <li onClick={() => selectPlace(place)}>
        {place.description}
      </li>
    ))}
  </ul>
  
  {/* Map container */}
  <div id="map" style={{ width: '100%', height: '300px' }}></div>
  
  {/* Current location button */}
  <button onClick={useCurrentLocation}>
    📍 मेरा स्थान उपयोग करें
  </button>
</div>
```


***

## **10. User Verification \& Trust System**

### **10.1 ShaktiScore System**[^13]

**Scoring Breakdown:**

```javascript
const shaktiScoreRules = {
  phase1: {
    phoneVerified: 5,
    profileCreated: 5,
    total: 10
  },
  phase2: {
    emailVerified: 5,
    paymentMethodAdded: 10,
    aadhaarVerified: 15,
    total: 30
  },
  ongoing: {
    firstJobPosted: 10,
    firstJobCompleted: 20,
    workerRating_avg: (rating) => rating * 2, // 0-10 points
    jobsCompleted: (count) => Math.min(count * 2, 20),
    paymentOnTime: 5, // per job
    profilePhoto: 5,
    responseTime_fast: 5
  }
};

// Calculate total score
function calculateShaktiScore(employer) {
  let score = 0;
  
  // Phase 1
  if (employer.phoneVerified) score += 5;
  if (employer.profileCreated) score += 5;
  
  // Phase 2
  if (employer.emailVerified) score += 5;
  if (employer.paymentMethods.length > 0) score += 10;
  if (employer.aadhaarVerified) score += 15;
  
  // Ongoing
  if (employer.jobsPosted > 0) score += 10;
  if (employer.jobsCompleted > 0) score += 20;
  score += employer.jobsCompleted * 2; // Up to 20 more
  
  // Cap at 100
  return Math.min(score, 100);
}
```

**Visual Display:**

```
┌─────────────────────────────────┐
│ ShaktiScore: 50/100             │
│ [████████████░░░░░░░░░░] 50%   │
│                                 │
│ Status: ⭐ Verified Employer    │
│                                 │
│ Boost Your Score:               │
│ • Add Aadhaar (+15) →           │
│ • Complete first job (+20) →    │
│ • Add profile photo (+5) →      │
└─────────────────────────────────┘
```


### **10.2 Aadhaar Verification Integration**[^23][^24][^39][^22]

**API Integration:**

```typescript
async function verifyAadhaar(aadhaarNumber: string) {
  // Step 1: Send OTP to Aadhaar-registered mobile
  const otpResponse = await fetch('/api/aadhaar/send-otp', {
    method: 'POST',
    body: JSON.stringify({ aadhaarNumber }),
    headers: { 'Content-Type': 'application/json' }
  });
  
  const { requestId } = await otpResponse.json();
  
  // Step 2: User enters OTP
  const otp = await promptUserForOTP();
  
  // Step 3: Verify OTP and get Aadhaar details
  const verifyResponse = await fetch('/api/aadhaar/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ requestId, otp }),
    headers: { 'Content-Type': 'application/json' }
  });
  
  const result = await verifyResponse.json();
  
  if (result.success) {
    // Store verification status
    updateEmployerProfile({
      aadhaarVerified: true,
      aadhaarNumber: maskAadhaar(aadhaarNumber),
      fullName: result.name, // Verify name matches
      shaktiScore: calculateNewScore()
    });
    
    showSuccessDialog("Aadhaar Verified! +15 ShaktiScore");
  }
}

function maskAadhaar(number: string) {
  return 'XXXX-XXXX-' + number.slice(-4);
}
```

**Third-Party Services for Aadhaar Verification:**[^24]

- Cashfree Verification Suite
- AuthBridge
- IDfy
- Signzy

***

## **11. Sounds \& Audio Feedback**

### **11.1 Sound Strategy**

**Audio Files Required:**

```
assets/sounds/
├── notification_received.mp3    (Worker applied)
├── success.mp3                  (Job posted successfully)
├── error.mp3                    (Validation error)
├── button_tap.mp3               (Subtle button feedback)
├── message_received.mp3         (Chat message)
└── payment_success.mp3          (Payment completed)
```

**Implementation:**

```typescript
class SoundManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  
  constructor() {
    this.loadSounds();
  }
  
  loadSounds() {
    const soundFiles = [
      'notification_received',
      'success',
      'error',
      'button_tap',
      'payment_success'
    ];
    
    soundFiles.forEach(name => {
      const audio = new Audio(`/assets/sounds/${name}.mp3`);
      audio.preload = 'auto';
      this.sounds[name] = audio;
    });
  }
  
  play(soundName: string, volume: number = 0.5) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.volume = volume;
      sound.currentTime = 0;
      sound.play().catch(e => console.log('Sound play failed:', e));
    }
  }
}

// Usage
const soundManager = new SoundManager();

// On worker application
soundManager.play('notification_received');
await Haptics.notification({ type: NotificationType.Success });

// On job posted
soundManager.play('success');
await Haptics.impact({ style: ImpactStyle.Heavy });
```

**Sound Permission (Not required on Android, but respect user settings):**

```typescript
// Check if device is in silent mode (optional)
function respectSilentMode() {
  const audioContext = new AudioContext();
  return audioContext.state !== 'suspended';
}

// Play sound only if not in silent mode
if (respectSilentMode()) {
  soundManager.play('notification_received');
}
```


***

## **12. Network \& Offline Handling**

### **12.1 Network Detection**[^1]

```typescript
import { Network } from '@capacitor/network';

// Check current network status
const status = await Network.getStatus();
console.log('Network status:', status.connected);

// Listen for network changes
Network.addListener('networkStatusChange', status => {
  if (!status.connected) {
    showOfflineMessage();
  } else {
    hideOfflineMessage();
    syncPendingData();
  }
});

// Offline UI
function showOfflineMessage() {
  showToast({
    message: "⚠️ Internet नहीं है। कृपया reconnect करें।",
    duration: 'infinite',
    position: 'top'
  });
}
```


### **12.2 Offline Data Persistence**

```typescript
// Save job draft locally
function saveJobDraft(jobData) {
  localStorage.setItem('job_draft', JSON.stringify(jobData));
}

// Restore draft when online
function restoreJobDraft() {
  const draft = localStorage.getItem('job_draft');
  if (draft) {
    const jobData = JSON.parse(draft);
    showDialog({
      title: "Draft मिला!",
      message: "पिछली incomplete job post को continue करें?",
      buttons: [
        { text: "हाँ", onClick: () => loadDraft(jobData) },
        { text: "नहीं", onClick: () => clearDraft() }
      ]
    });
  }
}

// Queue actions for later sync
class OfflineQueue {
  private queue: any[] = [];
  
  addAction(action: any) {
    this.queue.push(action);
    localStorage.setItem('offline_queue', JSON.stringify(this.queue));
  }
  
  async syncAll() {
    for (const action of this.queue) {
      try {
        await this.processAction(action);
      } catch (error) {
        console.error('Failed to sync action:', error);
      }
    }
    this.clearQueue();
  }
  
  clearQueue() {
    this.queue = [];
    localStorage.removeItem('offline_queue');
  }
}
```


***

## **13. Payment Gateway Integration**

### **13.1 Supported Payment Methods**[^20][^21][^19]

**1. UPI Integration:**[^19]

```typescript
import { Browser } from '@capacitor/browser';

async function initiateUPIPayment(amount: number, workerId: string) {
  const paymentRequest = {
    amount: amount,
    currency: 'INR',
    purpose: 'worker_payment',
    workerId: workerId,
    employerId: getCurrentEmployerId()
  };
  
  // Create payment session on backend
  const response = await fetch('/api/payments/create', {
    method: 'POST',
    body: JSON.stringify(paymentRequest),
    headers: { 'Content-Type': 'application/json' }
  });
  
  const { paymentUrl, orderId } = await response.json();
  
  // Open payment page in browser
  await Browser.open({ url: paymentUrl });
  
  // Listen for payment completion
  Browser.addListener('browserFinished', () => {
    verifyPaymentStatus(orderId);
  });
}

async function verifyPaymentStatus(orderId: string) {
  const response = await fetch(`/api/payments/verify/${orderId}`);
  const { status } = await response.json();
  
  if (status === 'success') {
    showSuccessDialog("Payment Successful!");
    soundManager.play('payment_success');
    await Haptics.notification({ type: NotificationType.Success });
  }
}
```

**2. PhonePe/Paytm Integration:**[^20]

```typescript
// PhonePe Android SDK integration
async function payViaPhonePe(amount: number, workerId: string) {
  const paymentData = {
    merchantId: 'YOUR_MERCHANT_ID',
    merchantTransactionId: generateTxnId(),
    amount: amount * 100, // Convert to paise
    callbackUrl: 'sindh://payment/callback'
  };
  
  // Android Intent for PhonePe
  if (Capacitor.getPlatform() === 'android') {
    // Requires custom plugin or native code
    const result = await PhonePePlugin.initiatePayment(paymentData);
    handlePaymentResult(result);
  }
}
```

**3. Razorpay Integration (Recommended for India):**

```typescript
declare var Razorpay: any;

async function initiateRazorpayPayment(amount: number, workerId: string) {
  // Create order on backend
  const order = await createRazorpayOrder(amount, workerId);
  
  const options = {
    key: 'YOUR_RAZORPAY_KEY',
    amount: order.amount,
    currency: 'INR',
    name: 'SINDH Platform',
    description: 'Worker Payment',
    order_id: order.id,
    prefill: {
      name: employerName,
      contact: employerPhone,
      email: employerEmail
    },
    theme: {
      color: '#FF6B00' // SINDH brand color
    },
    handler: function(response: any) {
      verifyRazorpayPayment(response);
    },
    modal: {
      ondismiss: function() {
        showToast("Payment cancelled");
      }
    }
  };
  
  const rzp = new Razorpay(options);
  rzp.open();
}
```


### **13.2 Escrow System (Future Enhancement)**

```javascript
// Backend implementation
async function createEscrowPayment(jobId, amount) {
  // Hold payment in escrow until job completion
  const escrow = await Escrow.create({
    job: jobId,
    employer: employerId,
    worker: workerId,
    amount: amount,
    status: 'held',
    releaseCondition: 'job_completion'
  });
  
  return escrow;
}

async function releaseEscrowPayment(jobId) {
  // Release payment to worker after job marked complete
  const escrow = await Escrow.findOne({ job: jobId });
  
  if (escrow.status === 'held') {
    await transferToWorker(escrow.worker, escrow.amount);
    escrow.status = 'released';
    await escrow.save();
    
    // Notify both parties
    sendNotification(escrow.worker, 'Payment released!');
    sendNotification(escrow.employer, 'Payment sent to worker');
  }
}
```


***

## **14. Reminder Notifications System**

### **14.1 Local Notifications**[^27]

```typescript
import { LocalNotifications } from '@capacitor/local-notifications';

// Request permission
await LocalNotifications.requestPermissions();

// Schedule reminder for pending actions
async function schedulePaymentReminder(jobId: string, workerName: string, amount: number) {
  await LocalNotifications.schedule({
    notifications: [
      {
        title: "Payment Reminder",
        body: `कृपया ${workerName} को ₹${amount} payment करें`,
        id: parseInt(jobId),
        schedule: {
          at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours later
          allowWhileIdle: true
        },
        sound: 'notification_received.mp3',
        attachments: null,
        actionTypeId: 'PAYMENT_REMINDER',
        extra: {
          jobId: jobId,
          action: 'pay_worker'
        }
      }
    ]
  });
}

// Schedule reminder to check applications
async function scheduleApplicationCheckReminder(jobId: string, applicationCount: number) {
  await LocalNotifications.schedule({
    notifications: [
      {
        title: `${applicationCount} Applications Pending!`,
        body: "कृपया applications देखें और select करें",
        id: parseInt(jobId) + 1000,
        schedule: {
          at: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours later
        },
        extra: {
          jobId: jobId,
          action: 'view_applications'
        }
      }
    ]
  });
}

// Handle notification tap
LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
  const { jobId, action } = notification.notification.extra;
  
  if (action === 'pay_worker') {
    navigateToPaymentScreen(jobId);
  } else if (action === 'view_applications') {
    navigateToApplicationsScreen(jobId);
  }
});
```


### **14.2 Smart Reminder Logic**

```typescript
class ReminderManager {
  // Schedule intelligent reminders based on user behavior
  
  async scheduleSmartReminders(employer: any) {
    // Reminder 1: If job posted but no workers applied (24 hrs)
    if (employer.activeJobs.some(job => job.applications === 0)) {
      this.scheduleNoApplicationReminder(employer);
    }
    
    // Reminder 2: If workers applied but employer hasn't viewed (6 hrs)
    const pendingJobs = employer.activeJobs.filter(
      job => job.applications > 0 && !job.applicationsViewed
    );
    if (pendingJobs.length > 0) {
      this.scheduleViewApplicationsReminder(pendingJobs);
    }
    
    // Reminder 3: If job completed but payment pending (12 hrs)
    const paymentPendingJobs = employer.jobs.filter(
      job => job.status === 'completed' && job.paymentStatus === 'pending'
    );
    if (paymentPendingJobs.length > 0) {
      this.schedulePaymentReminders(paymentPendingJobs);
    }
    
    // Reminder 4: If inactive for 7 days
    if (employer.lastActive < Date.now() - 7 * 24 * 60 * 60 * 1000) {
      this.scheduleReengagementReminder(employer);
    }
  }
  
  async scheduleNoApplicationReminder(employer: any) {
    await LocalNotifications.schedule({
      notifications: [{
        title: "अभी तक कोई application नहीं?",
        body: "Job details update करें या salary बढ़ाएं",
        id: generateId(),
        schedule: { at: new Date(Date.now() + 24 * 60 * 60 * 1000) }
      }]
    });
  }
}
```


***

## **15. Complete Employer Workflow Summary**

### **15.1 User Flow Diagram**

```
┌─────────────────────────────────────────────────┐
│ PHASE 1: MINIMAL REGISTRATION                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ 1. App Launch                                   │
│    ↓                                            │
│ 2. Click "POST JOB" Button                      │
│    ↓                                            │
│ 3. Authentication Check                         │
│    ├─ Logged In? → Go to Step 8                │
│    └─ Not Logged In? → Continue                │
│    ↓                                            │
│ 4. Login/Register Screen                        │
│    ├─ Enter Phone Number                       │
│    ├─ Receive OTP (SMS)                        │
│    └─ Verify OTP                               │
│    ↓                                            │
│ 5. New User Registration (Minimal Data)        │
│    ├─ Full Name *                              │
│    ├─ Phone (pre-filled) *                     │
│    ├─ Email (optional)                         │
│    ├─ Location (GPS or Pincode) *              │
│    └─ Terms Acceptance *                       │
│    ↓                                            │
│ 6. Initial ShaktiScore Assigned (10 points)    │
│    ↓                                            │
│ 7. Registration Complete ✓                      │
│                                                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ PHASE 1: MINIMAL JOB POSTING                    │
├─────────────────────────────────────────────────┤
│                                                 │
│ 8. Job Posting Form (Simple)                   │
│    ├─ Work Type (Dropdown) *                   │
│    ├─ Workers Needed (Number) *                │
│    ├─ Location (Current or Search) *           │
│    ├─ Min Salary (₹) *                         │
│    └─ Max Salary (₹) *                         │
│    ↓                                            │
│ 9. Post Job (Validation)                       │
│    ↓                                            │
│ 10. Job Posted Successfully! ✓                  │
│     ├─ Show success message                    │
│     ├─ Play success sound                      │
│     ├─ Haptic feedback                         │
│     └─ Notify nearby workers                   │
│                                                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ WAITING PHASE: WORKERS APPLY                    │
├─────────────────────────────────────────────────┤
│                                                 │
│ 11. Workers Browse and Apply                    │
│     ↓                                           │
│ 12. Employer Receives Notifications             │
│     ├─ Push Notification                       │
│     ├─ SMS (optional)                          │
│     ├─ In-app notification                     │
│     └─ Sound + Vibration                       │
│     ↓                                           │
│ 13. Dashboard Shows "3 Applications Received"  │
│     ↓                                           │
│ 14. Employer Clicks "View Applications"        │
│                                                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ PHASE 2: PROGRESSIVE DATA COLLECTION            │
├─────────────────────────────────────────────────┤
│                                                 │
│ 15. Interstitial Screen                         │
│     "उन्हें देखने से पहले, payment method       │
│      add करें"                                  │
│     ↓                                           │
│ 16. Phase-2 Data Collection                     │
│     ├─ Payment Method * (UPI/Bank/Cash)        │
│     ├─ Preferred Work Types (Optional)         │
│     └─ Aadhaar Verification (Optional)         │
│     ↓                                           │
│ 17. Data Saved → ShaktiScore Updated (50+)     │
│     ↓                                           │
│ 18. View Worker Applications                    │
│     ├─ Worker profiles                         │
│     ├─ Ratings & reviews                       │
│     ├─ Skills & experience                     │
│     └─ Contact details                         │
│     ↓                                           │
│ 19. Accept/Reject Workers                       │
│     ├─ Accept: Send notification to worker     │
│     ├─ Reject: Notify politely                 │
│     └─ Job status → "In Progress"              │
│                                                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ JOB EXECUTION & PAYMENT PHASE                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ 20. Work Begins                                 │
│     ├─ Track progress                          │
│     ├─ In-app communication                    │
│     └─ Location tracking (optional)            │
│     ↓                                           │
│ 21. Work Completed                              │
│     ├─ Worker marks job complete               │
│     ├─ Employer confirms                       │
│     └─ Rating & review                         │
│     ↓                                           │
│ 22. Payment Processing                          │
│     ├─ Review payment details                  │
│     ├─ Choose payment method                   │
│     ├─ Process payment (UPI/Bank/Cash)         │
│     └─ Payment confirmation                    │
│     ↓                                           │
│ 23. Job Closed ✓                                │
│     ├─ Update ShaktiScore (+20)                │
│     ├─ Receive worker rating                   │
│     └─ Suggest next job posting                │
│                                                 │
└─────────────────────────────────────────────────┘
```


***

## **16. Android-Specific Specifications**

### **16.1 Build Configuration**

**android/app/build.gradle:**

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "in.sindh.employer"
        minSdkVersion 23
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        
        // MultiDex for large apps
        multiDexEnabled true
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            // App signing
            signingConfig signingConfigs.release
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }
}

dependencies {
    // Firebase
    implementation platform('com.google.firebase:firebase-bom:32.5.0')
    implementation 'com.google.firebase:firebase-messaging'
    implementation 'com.google.firebase:firebase-analytics'
    
    // Google Maps
    implementation 'com.google.android.gms:play-services-maps:18.2.0'
    implementation 'com.google.android.gms:play-services-location:21.0.1'
    
    // Razorpay (if using)
    implementation 'com.razorpay:checkout:1.6.26'
    
    // MultiDex
    implementation 'androidx.multidex:multidex:2.0.1'
}
```


### **16.2 App Icons \& Splash Screen**[^40]

```bash
# Generate app icons and splash screens
npm install @capacitor/assets --save-dev

# Add assets to project root
mkdir assets
# Add icon.png (1024x1024)
# Add splash.png (2732x2732)

# Generate
npx capacitor-assets generate
```


### **16.3 ProGuard Rules (for Release Build)**

**android/app/proguard-rules.pro:**

```proguard
# Keep Capacitor
-keep class com.getcapacitor.** { *; }

# Keep Firebase
-keep class com.google.firebase.** { *; }

# Keep Google Maps
-keep class com.google.android.gms.maps.** { *; }

# Keep Razorpay
-keep class com.razorpay.** { *; }
```


***

## **17. Testing \& Quality Assurance**

### **17.1 Testing Checklist**

**Phase-1 Testing:**

```
✓ Registration Flow
  [ ] OTP sent successfully
  [ ] OTP auto-read working
  [ ] Name validation (3-50 chars)
  [ ] Email validation (optional)
  [ ] Location permission handling
  [ ] Pincode fallback working
  [ ] Terms acceptance required
  [ ] ShaktiScore assigned (10 points)

✓ Job Posting (Minimal)
  [ ] Work type dropdown populated
  [ ] Workers needed counter (1-10)
  [ ] Location selector working
  [ ] GPS location capture
  [ ] Map display and marker
  [ ] Salary validation (min < max)
  [ ] Form validation messages
  [ ] Job posted successfully
  [ ] Success notification shown

✓ Notifications
  [ ] FCM token registered
  [ ] Push notifications received
  [ ] Notification sound playing
  [ ] Vibration working
  [ ] Notification tap navigation
```

**Phase-2 Testing:**

```
✓ Progressive Data Collection
  [ ] Interstitial screen shown
  [ ] Payment method options displayed
  [ ] UPI validation
  [ ] Bank account validation
  [ ] Aadhaar OTP sent
  [ ] Aadhaar verification success
  [ ] ShaktiScore updated
  [ ] Profile completeness calculated

✓ Application Viewing
  [ ] Worker list displayed
  [ ] Worker profiles accessible
  [ ] Accept/Reject buttons working
  [ ] Notifications sent to workers
  [ ] Job status updated
```

**Integration Testing:**

```
✓ Maps Integration
  [ ] Map loads successfully
  [ ] Current location displayed
  [ ] Location search working
  [ ] Marker placement accurate
  [ ] Address retrieval correct

✓ Payment Integration
  [ ] Payment gateway opens
  [ ] UPI apps detected
  [ ] Payment success handling
  [ ] Payment failure handling
  [ ] Receipt generation

✓ Offline Handling
  [ ] Network status detection
  [ ] Offline message shown
  [ ] Draft saved locally
  [ ] Sync on reconnect
  [ ] Queue processing
```


### **17.2 Performance Testing**

```
Target Metrics:
• App size: < 50 MB (APK)
• Cold start time: < 3 seconds
• Screen load time: < 1 second
• Image load time: < 2 seconds
• Network request timeout: 30 seconds
• Battery drain: < 5% per hour (active use)
```


***

## **18. Deployment \& Release**

### **18.1 Build Release APK**[^2][^40]

```bash
# Build React app
npm run build

# Sync with Capacitor
npx cap sync android

# Open Android Studio
npx cap open android

# In Android Studio:
# Build > Generate Signed Bundle / APK
# Select APK
# Create keystore (first time)
# Sign and build
```


### **18.2 Google Play Store Submission**[^40]

**Requirements:**

- App icon (512x512)
- Feature graphic (1024x500)
- Screenshots (min 2, for different screen sizes)
- Privacy policy URL
- App description (Hindi + English)
- Target age group: 18+
- Content rating questionnaire
- Target SDK: 34 (Android 14)

**App Listing:**

```
Title: SINDH Employer - मजदूर ढूंढें

Short Description:
भारत का #1 प्लेटफॉर्म मजदूर ढूंढने के लिए। आसान, सुरक्षित, विश्वसनीय।

Full Description:
SINDH Employer app से आप आसानी से मजदूर ढूंढ सकते हैं अपने काम के लिए।

✓ 2 मिनट में job post करें
✓ हज़ारों verified मजदूर
✓ सुरक्षित payment
✓ 24/7 support

काम के प्रकार:
• खेती (Farming)
• प्लंबिंग (Plumbing)
• बढ़ई (Carpentry)
• बिजली का काम
• सफाई (Cleaning)
• और बहुत कुछ...

Download करें और आज ही अपनी पहली job post करें!
```


***

## **19. Analytics \& Monitoring**

### **19.1 Firebase Analytics Events**[^27]

```typescript
import { FirebaseAnalytics } from '@capacitor-community/firebase-analytics';

// Track registration
await FirebaseAnalytics.logEvent({
  name: 'employer_registration',
  params: {
    method: 'otp',
    location: 'bangalore',
    phase: 1
  }
});

// Track job posting
await FirebaseAnalytics.logEvent({
  name: 'job_posted',
  params: {
    work_type: 'plumbing',
    workers_needed: 2,
    salary_min: 400,
    salary_max: 600,
    location: 'bangalore'
  }
});

// Track application viewed
await FirebaseAnalytics.logEvent({
  name: 'applications_viewed',
  params: {
    job_id: 'job_123',
    application_count: 5
  }
});

// Track worker accepted
await FirebaseAnalytics.logEvent({
  name: 'worker_accepted',
  params: {
    job_id: 'job_123',
    worker_id: 'worker_456',
    shakti_score: 75
  }
});

// Track payment
await FirebaseAnalytics.logEvent({
  name: 'payment_completed',
  params: {
    method: 'upi',
    amount: 500,
    currency: 'INR'
  }
});
```


### **19.2 Crashlytics**[^27]

```typescript
import { FirebaseCrashlytics } from '@capacitor-community/firebase-crashlytics';

// Track non-fatal errors
try {
  await postJobToBackend(jobData);
} catch (error) {
  await FirebaseCrashlytics.recordException({
    message: error.message,
    stacktrace: error.stack
  });
  showErrorToUser("Failed to post job");
}

// Set custom keys for debugging
await FirebaseCrashlytics.setCustomKey({
  key: 'employer_id',
  value: employerId
});

await FirebaseCrashlytics.setCustomKey({
  key: 'shakti_score',
  value: String(shaktiScore)
});
```


***

## **20. Future Enhancements**

### **20.1 Planned Features**

**Voice Interface (Phase 3):**

```
• Voice-based job posting (Hindi/Regional languages)
• Voice search for workers
• Voice commands for app navigation
• Integration with TARA voice assistant
```

**Advanced Features:**

```
• AI-powered worker recommendations
• Smart pricing suggestions based on location & demand
• Automated job scheduling
• Bulk worker hiring
• Team management
• Analytics dashboard
• Expense tracking
• Invoice generation
```

**Gamification:**

```
• Badges for milestones
  - First Job Posted
  - 10 Jobs Completed
  - 5-Star Employer
  - Top Payer
• Leaderboard for employers
• Referral rewards
• Seasonal challenges
```


***

## **Conclusion**

This comprehensive specification document provides a complete blueprint for building the Android app for SINDH platform's employer side. The progressive onboarding approach ensures minimal friction for first-time users in rural and semi-urban India, while the phased data collection strategy balances user experience with platform requirements.

**Key Takeaways:**

1. **Phase-1:** Collect only 4 essential fields (Name, Phone, Email optional, Location)
2. **Phase-2:** Request payment \& additional info when viewing worker applications
3. **User-Centric:** Contextual permissions, localized content, offline support
4. **Trust System:** ShaktiScore builds credibility progressively
5. **Multi-Channel:** Push notifications, SMS, sounds, haptics for engagement
6. **Scalable:** Built on React + Capacitor for easy cross-platform expansion

**Next Steps:**

1. Set up development environment with Capacitor
2. Implement Phase-1 registration \& job posting
3. Integrate Firebase for notifications \& analytics
4. Test thoroughly with target users in rural India
5. Launch MVP and iterate based on feedback

For implementation support, refer to the attached documentation files and source code in your existing React web application.
<span style="display:none">[^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^52][^53][^55][^56][^57][^58][^59][^60][^61][^62][^63][^64]</span>

<div align="center">⁂</div>

[^1]: https://capacitorjs.com/docs/android

[^2]: https://dev.to/narottam04/convert-your-website-into-an-android-app-using-capacitor--5bh2

[^3]: https://stackoverflow.com/questions/78117069/how-to-get-capacitor-to-use-a-different-targetsdkverion

[^4]: https://buildfire.com/improve-user-onboarding-mobile-app/

[^5]: https://www.expertappdevs.com/blog/app-onboarding-ux-examples-that-boost-retention

[^6]: https://userx.pro/blog/tpost/jfkxfoky11-mobile-app-onboarding-creating-lasting-i

[^7]: https://www.phone.email/blog/phone-number-verification-otp-in-android

[^8]: https://uxcam.com/blog/10-apps-with-great-user-onboarding/

[^9]: https://developersappindia.com/blog/user-onboarding-done-right-creating-a-seamless-first-time-app-experience

[^10]: https://www.indianic.com/blog/mobile/basics-tips-on-mobile-app-onboarding-process.html

[^11]: COMPLETE_FLOW_DOCUMENTATION.md

[^12]: JOB-FLOW-DOCUMENTATION.md

[^13]: https://iasscore.in/current-affairs/gamify-indias-skilling-initiatives

[^14]: https://source.android.com/docs/core/permissions/background-location-access

[^15]: https://developers.google.com/maps/documentation/navigation/android-sdk/background-location-usage

[^16]: https://www.joshmorony.com/using-google-maps-and-geolocation-in-ionic-with-capacitor/

[^17]: https://moldstud.com/articles/p-best-practices-for-requesting-permissions-in-android-applications

[^18]: https://www.freecodecamp.org/news/how-to-handle-permissions-in-flutter-for-beginners/

[^19]: https://www.cashfree.com/blog/upi-integration/

[^20]: https://www.phonepe.com/business-solutions/payment-gateway/

[^21]: https://www.enkash.com/resources/blog/top-upi-apps-in-india

[^22]: https://authbridge.com/blog/tag/aadhaar-otp-verification/

[^23]: https://play.google.com/store/apps/details?id=in.gov.uidai.mAadhaarPlus\&hl=en

[^24]: https://www.cashfree.com/aadhaar-verification/

[^25]: https://www.creolestudios.com/android-15-app-permission-changes/

[^26]: https://developer.android.com/about/versions/14/changes/partial-photo-video-access

[^27]: https://www.zignuts.com/blog/implement-push-notifications-in-android

[^28]: https://tapptitude.com/blog/blog-post-3

[^29]: https://firebase.blog/posts/2025/04/fcm-on-android/

[^30]: https://vinova.sg/analysis-of-firebase-push-notifications-in-react-native-for-android/

[^31]: https://developer.android.com/develop/ui/views/haptics/custom-haptic-effects

[^32]: https://developer.android.com/develop/ui/views/haptics/haptics-principles

[^33]: https://medium.muz.li/haptic-ux-the-design-guide-for-building-touch-experiences-84639aa4a1b8

[^34]: https://pie.design/patterns/haptic-feedback/

[^35]: https://ionic.io/blog/all-the-layers-of-capacitor-google-maps

[^36]: https://stackoverflow.com/questions/62617991/ionic-google-maps-capacitor

[^37]: https://github.com/capacitor-community/google-maps

[^38]: https://forum.ionicframework.com/t/capacitor-google-map-not-showing-on-android/228390

[^39]: https://idspay.in/otp_based_esign

[^40]: https://www.ntspl.co.in/blog/building-and-releasing-your-capacitor-android-app/

[^41]: image.jpg

[^42]: image.jpg

[^43]: Screenshot-2025-11-03-194310.jpg

[^44]: https://developer.android.com/studio/run

[^45]: https://forum.ionicframework.com/t/no-backend-connection-in-android-app-ionic-react-but-its-working-in-web-app-with-same-basic-code/211237

[^46]: https://stackoverflow.com/questions/69481399/android-studio-required-for-building-and-installing-your-app-on-android

[^47]: https://www.youtube.com/watch?v=Ro_GAFbZHpI

[^48]: https://www.youtube.com/watch?v=gRh4bSgg0fg

[^49]: https://capgo.app/blog/create-react-mobile-apps-with-capacitor/

[^50]: https://www.reddit.com/r/sveltejs/comments/1eqb4zu/using_capacitor_how_to_build_an_apk_for_android/

[^51]: https://developer.android.com/studio

[^52]: https://uxcam.com/blog/customer-centric-onboarding/

[^53]: https://trak.in/stories/verification-of-all-online-gamers-in-india-govt-proposes-these-self-regulatory-steps-for-online-gaming-firms/

[^54]: https://firebase.google.com/docs/cloud-messaging/get-started

[^55]: https://en.wikipedia.org/wiki/Unified_Payments_Interface

[^56]: https://play.google.com/store/apps/details?id=com.techotp\&hl=en

[^57]: https://stackoverflow.com/questions/59641748/android-studio-automatically-allow-permissions-to-use-camera-to-take-photo-and

[^58]: https://play.google.com/store/apps/details?id=com.receivesmsonline.virtualnumber\&hl=en

[^59]: https://help.auraframes.com/hc/en-us/articles/218848137-Photo-Video-Access-and-Privacy

[^60]: https://2factor.in

[^61]: https://clevertap.com/blog/app-onboarding/

[^62]: sindh_platform_guide.md

[^63]: platform_policies.md

[^64]: customer_queries_responses.md

