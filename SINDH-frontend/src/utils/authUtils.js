import { buildApiUrl } from './apiUtils.js';
import { GoogleAuthProvider, signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../config/firebase'; // Correct path to firebase config

/**
 * Authentication utility functions for managing user sessions
 * STRICT FLOW: Firebase Auth -> Backend Validation -> Local Session
 */

const USER_KEY = 'user';
const TOKEN_KEY = 'token';
const LAST_LOGIN_KEY = 'lastLogin';

// --- Session Management ---

export const saveSession = (user, token) => {
  if (!user || !token) return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(LAST_LOGIN_KEY, new Date().toISOString());
    // Also set for legacy/safety if used elsewhere
    sessionStorage.setItem(TOKEN_KEY, token);
    console.log(`✅ Session saved for: ${user.name} (${user.type})`);
  } catch (error) {
    console.error('Failed to save session:', error);
  }
};

export const clearSession = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LAST_LOGIN_KEY);
  sessionStorage.clear();
};

export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const isLoggedIn = () => !!getToken();

export const logout = () => {
  const user = getCurrentUser();
  if (user) console.log(`👋 Logging out user: ${user.name}`);
  auth.signOut().catch(console.error); // Sign out from Firebase too
  clearSession();
  window.location.href = '/'; // Hard redirect to clear any in-memory state
};

// --- Firebase & Backend Auth Flow ---

/**
 * Step 1: Initialize ReCaptcha (Required for Phone Auth)
 */
export const initRecaptcha = (elementId) => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved
      }
    });
  }
  return window.recaptchaVerifier;
};

/**
 * Step 2: Send OTP via Firebase
 */
export const sendOtpFirebase = async (phoneNumber, appVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return confirmationResult; // Contains .confirm(otp) method
  } catch (error) {
    console.error('Firebase OTP Error:', error);
    throw error;
  }
};

/**
 * Step 3: Verify OTP & Exchange Token with Backend
 * @param {Object} confirmationResult - Result from sendOtpFirebase
 * @param {string} otp - User entered code
 * @param {string} userType - 'worker' | 'employer'
 */
export const verifyOtpAndLogin = async (confirmationResult, otp, userType) => {
  try {
    // 1. Verify with Firebase
    const firebaseCredential = await confirmationResult.confirm(otp);
    const firebaseUser = firebaseCredential.user;
    const idToken = await firebaseUser.getIdToken();

    console.log('🔥 Firebase Auth Success. Token obtained.');

    // 2. Send to Backend
    const response = await fetch(buildApiUrl('/auth/firebase-login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: idToken,
        userType: userType
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Backend authentication failed');
    }

    // 3. Handle Result
    if (data.requiresRegistration) {
      console.log('📝 User needs registration.');
      return {
        requiresRegistration: true,
        phoneNumber: firebaseUser.phoneNumber, // e.g., +919000000000
        userType: userType
      };
    } else {
      console.log('🎉 Login successful.');
      saveSession(data.data, data.token);
      return {
        success: true,
        user: data.data
      };
    }
  } catch (error) {
    console.error('Login Flow Error:', error);
    throw error;
  }
};
