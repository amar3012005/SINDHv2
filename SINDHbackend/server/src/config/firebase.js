
const admin = require('firebase-admin');
const path = require('path');

// Initialize with service account
// Ensure you have downloaded the serviceAccountKey.json from Firebase Console
// and placed it in this directory.
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
  console.warn('⚠️ Firebase serviceAccountKey.json not found! Firebase Admin features will not work.');
  // In production, you might want to throw an error or use environment variables
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK initialized successfully');
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  admin.initializeApp();
  console.log('✅ Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS');
}

const db = admin.apps.length > 0 ? admin.firestore() : null;

module.exports = { admin, db };

