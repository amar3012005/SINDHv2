# I N D U S Frontend

A modern React-based web application for connecting daily wage workers with employers, built with a focus on user experience and accessibility.

## 🚀 Features

- Modern UI with Tailwind CSS and Framer Motion animations
- Responsive design for all device sizes
- Multi-language support (English and Hindi)
- Real-time job matching and notifications
- Worker profile management
- Job posting and search functionality
- Secure authentication system

## 🛠️ Tech Stack

- **Frontend Framework**: React 18
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React Context API
- **API Communication**: Axios
- **Authentication**: Firebase
- **Notifications**: Twilio, MessageBird
- **Email Services**: EmailJS, Nodemailer
- **Data Processing**: PapaParse

## 📦 Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd I N D U S-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add necessary environment variables:
```env
REACT_APP_API_URL=your_backend_url
REACT_APP_FIREBASE_CONFIG=your_firebase_config
```

4. Start the development server:
```bash
npm start
```

## 📱 Android Development with Local Backend

### Understanding the Challenge

When developing Android apps with Capacitor, the mobile environment cannot access `localhost` directly like a web browser can. This is because:

- **Android Emulator Network Isolation**: The emulator's `localhost` refers to the emulator itself, not your host machine
- **Production-First Logic**: By default, mobile apps are configured to use the production backend (Render) to avoid connection issues
- **Special IP Required**: Android emulator provides `10.0.2.2` as a special IP that routes to the host machine's `localhost`

### Setup for Development

#### For Android Emulator

1. **Create Environment Configuration File**

   Create a file named `.env.development.local` in the `SINDH-frontend/` directory:

   ```bash
   # Local Development Configuration for Android
   REACT_APP_FORCE_LOCAL_BACKEND=true
   REACT_APP_LOCAL_BACKEND_URL=http://10.0.2.2:10000/api
   ```

2. **Update Backend CORS Configuration**

   Ensure your backend (`SINDHbackend/server/src/index.js`) includes Android emulator IPs in the CORS origins:

   ```javascript
   'http://10.0.2.2:10000',
   'http://10.0.2.2:3000',
   'http://10.0.2.2:8080'
   ```

3. **Restart Backend Server**

   ```bash
   cd SINDHbackend/server
   npm start
   ```

4. **Rebuild and Sync the Android App**

   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

5. **Verify Configuration**

   In Android Studio, open Chrome DevTools (chrome://inspect) and run:

   ```javascript
   testMobileDetection()
   ```

   You should see:
   - `forceLocalBackend: "true"`
   - `selectedApiUrl: "http://10.0.2.2:10000/api"`

#### For Physical Android Device

1. **Find Your Computer's IP Address**

   **Windows:**
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., `192.168.1.100`)

   **Mac/Linux:**
   ```bash
   ifconfig
   ```
   Look for `inet` address on your network interface

2. **Update Environment File**

   Edit `.env.development.local`:

   ```bash
   REACT_APP_FORCE_LOCAL_BACKEND=true
   REACT_APP_LOCAL_BACKEND_URL=http://192.168.1.XXX:10000/api  # Use your actual IP
   ```

3. **Update Backend CORS**

   Add your IP to backend CORS or use environment variable:

   ```bash
   # In SINDHbackend/server/.env
   ALLOWED_ORIGINS=http://192.168.1.XXX:10000
   ```

4. **Ensure Same Network**

   Make sure your phone and computer are on the same Wi-Fi network.

5. **Rebuild App**

   ```bash
   npm run build
   npx cap sync android
   ```

### Verification Steps

1. **Check Logcat for Backend URL**

   In Android Studio, filter Logcat by "Mobile dev mode":
   
   ```
   📱 Mobile dev mode: using Android emulator localhost at http://10.0.2.2:10000/api
   ```

2. **Verify Backend Receives Requests**

   Your backend terminal should show:
   
   ```
   📱 [timestamp] GET /api/health
      Origin: http://10.0.2.2:10000
      🤖 Mobile app detected
   ✅ CORS: Allowing localhost origin: http://10.0.2.2:10000
   ```

3. **Test API Calls**

   Try registering a worker or browsing jobs. Check that:
   - No CORS errors in console
   - Requests go to `10.0.2.2` not `sindh-backend.onrender.com`
   - Backend logs show incoming requests

### Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection refused | Backend not running | Start backend: `npm start` in `SINDHbackend/server` |
| CORS errors | Missing `10.0.2.2` in CORS | Add Android emulator IPs to `getCorsOrigins()` |
| Still using production backend | App not rebuilt after `.env` change | Run `npm run build && npx cap sync android` |
| Physical device can't connect | Wrong IP or different network | Verify IP with `ipconfig`, check Wi-Fi network |
| "localhost" in requests | Using browser instead of app | Test in Android app, not Chrome browser |

### Switching Back to Production

To revert to production backend:

1. **Delete or Disable Environment File**

   ```bash
   # Option 1: Delete the file
   rm .env.development.local
   
   # Option 2: Set to false
   REACT_APP_FORCE_LOCAL_BACKEND=false
   ```

2. **Rebuild App**

   ```bash
   npm run build
   npx cap sync android
   ```

3. **Verify Production Mode**

   Run `testMobileDetection()` in DevTools:
   - `selectedApiUrl: "http://localhost:10000/api"`
   - `isProduction: true`

### Important Notes

- `.env.development.local` is git-ignored and NOT committed to the repository
- Each developer can have their own local configuration
- Production builds automatically ignore this file and use the Render backend
- The `10.0.2.2` IP only works in Android emulator, not in physical devices
- Always rebuild the app after changing environment variables

## 🏗️ Project Structure

```
I N D U S-frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── context/       # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── assets/        # Static assets
│   └── App.js         # Main application component
├── public/            # Public assets
├── config/            # Configuration files
└── package.json       # Project dependencies
```

## 🚀 Available Scripts

- `npm start`: Runs the app in development mode
- `npm build`: Builds the app for production
- `npm test`: Runs the test suite
- `npm eject`: Ejects from Create React App

## 🔒 Environment Variables

The following environment variables are required:

- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_FIREBASE_CONFIG`: Firebase configuration
- `REACT_APP_TWILIO_ACCOUNT_SID`: Twilio Account SID
- `REACT_APP_TWILIO_AUTH_TOKEN`: Twilio Auth Token
- `REACT_APP_MESSAGEBIRD_API_KEY`: MessageBird API Key

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
