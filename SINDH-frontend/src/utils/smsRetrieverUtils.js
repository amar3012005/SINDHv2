import { Capacitor } from '@capacitor/core';
import { CapacitorSmsRetriever } from '@shaher/capacitor-sms-retriever';

/**
 * Start listening for incoming SMS messages
 * Uses Google's SMS Retriever API on Android (no READ_SMS permission needed)
 * Returns SMS body when received or null on timeout/error
 * 
 * @returns {Promise<string|null>} SMS message body or null
 */
export const startSmsListener = async () => {
  try {
    // Check if running on Android native platform
    if (Capacitor.getPlatform() !== 'android') {
      console.log('⚠️ SMS auto-read only available on Android');
      return null;
    }

    console.log('📱 SMS auto-read not yet implemented - manual OTP entry required');

    const result = await CapacitorSmsRetriever.startListening();
    if (result && result.sms) {
      console.log('✅ SMS received:', result.sms);
      return result.sms;
    }

    return null;
  } catch (error) {
    console.error('❌ Error starting SMS listener:', error);
    return null;
  }
};

/**
 * Extract 6-digit OTP from SMS message body
 * Looks for the first 6-digit number in the message
 * 
 * @param {string} smsBody - The SMS message text
 * @returns {string|null} 6-digit OTP code or null if not found
 */
export const extractOtpFromSms = (smsBody) => {
  if (!smsBody || typeof smsBody !== 'string') {
    return null;
  }

  // Regex to find 6-digit numbers
  const otpRegex = /\b\d{6}\b/;
  const match = smsBody.match(otpRegex);

  if (match && match[0]) {
    console.log('✅ OTP extracted from SMS:', match[0]);
    return match[0];
  }

  console.log('⚠️ No 6-digit OTP found in SMS');
  return null;
};

/**
 * Get app signature hash for SMS format verification
 * This hash should be included in the SMS sent by backend
 * Format: <#> Your SINDH OTP is: 123456\n{APP_HASH}
 * 
 * @returns {Promise<string|null>} App signature hash or null
 */
export const getAppSignature = async () => {
  try {
    // Check if running on Android native platform
    if (Capacitor.getPlatform() !== 'android') {
      console.log('⚠️ App signature only available on Android');
      return null;
    }

    const result = await CapacitorSmsRetriever.getAppSignature();
    if (result && result.signature) {
      console.log('📱 App signature:', result.signature);
      return result.signature;
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting app signature:', error);
    return null;
  }
};

/**
 * Stop SMS listener and clean up
 * Call this when component unmounts or OTP is verified
 */
export const stopSmsListener = async () => {
  try {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    await CapacitorSmsRetriever.stopListening();
    console.log('🛑 SMS listener cleanup (not yet implemented)');
  } catch (error) {
    console.error('❌ Error stopping SMS listener:', error);
  }
};

/**
 * Complete SMS auto-read flow
 * Starts listener, waits for SMS, extracts OTP, stops listener
 * 
 * @returns {Promise<string|null>} Extracted OTP code or null
 */
export const autoReadOtp = async () => {
  try {
    const smsBody = await startSmsListener();

    if (smsBody) {
      const otp = extractOtpFromSms(smsBody);
      await stopSmsListener();
      return otp;
    }

    await stopSmsListener();
    return null;
  } catch (error) {
    console.error('❌ Error in auto-read OTP flow:', error);
    await stopSmsListener();
    return null;
  }
};
