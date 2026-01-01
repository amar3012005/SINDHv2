import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';

// Cache the device info to avoid calling native plugins on every request
let cachedDeviceId = null;
let cachedAppInfo = null;

/**
 * Get the unique device identifier.
 * @returns {Promise<string>} The unique device identifier.
 */
export const getDeviceId = async () => {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const id = await Device.getId();
    cachedDeviceId = id.identifier;
    return cachedDeviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return null;
  }
};

/**
 * Get application information.
 * @returns {Promise<Object>} Application info (version, build, etc.)
 */
export const getAppInfo = async () => {
  if (cachedAppInfo) return cachedAppInfo;

  try {
    const info = await App.getInfo();
    cachedAppInfo = info;
    return cachedAppInfo;
  } catch (error) {
    console.error('Error getting app info:', error);
    return null;
  }
};

/**
 * Get device platform and OS info.
 * @returns {Promise<Object>} Device info.
 */
export const getDeviceInfo = async () => {
  try {
    const info = await Device.getInfo();
    return info;
  } catch (error) {
    console.error('Error getting device info:', error);
    return null;
  }
};

