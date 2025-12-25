import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

// Error constants
export const PERMISSION_DENIED = 'permission_denied';
export const GPS_TIMEOUT = 'timeout';
export const GPS_UNAVAILABLE = 'unavailable';
export const GEOCODING_FAILED = 'geocoding_failed';
export const NOT_NATIVE = 'not_native';

/**
 * Check if location services are available
 * @returns {boolean} True if running on native platform with geolocation
 */
export const isLocationAvailable = () => {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Geolocation');
};

/**
 * Check current location permission status
 * @returns {Promise<Object>} Permission status object: { location: 'granted' | 'denied' | 'prompt' }
 */
export const checkLocationPermission = async () => {
  try {
    if (!Capacitor.isNativePlatform()) {
      return { location: 'unavailable' };
    }
    
    const permissions = await Geolocation.checkPermissions();
    return permissions;
  } catch (error) {
    console.error('Error checking location permission:', error);
    return { location: 'unavailable' };
  }
};

/**
 * Request location permission from user
 * @returns {Promise<Object>} Permission result object
 */
export const requestLocationPermission = async () => {
  try {
    console.log('📍 Requesting location permission...');
    const permissions = await Geolocation.requestPermissions();
    console.log('📍 Permission result:', permissions);
    return permissions;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return { location: 'denied' };
  }
};

/**
 * Get current GPS location with high accuracy
 * @returns {Promise<Object>} Location result: { success, latitude, longitude, accuracy, timestamp, error }
 */
export const getCurrentGPSLocation = async () => {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 0 // No cached location
    });
    
    return {
      success: true,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };
  } catch (error) {
    console.error('GPS location error:', error);
    
    // Handle specific error types
    if (error.message && error.message.includes('timeout')) {
      return {
        success: false,
        error: GPS_TIMEOUT,
        message: 'GPS timeout - location took too long to determine'
      };
    }
    
    if (error.message && error.message.includes('permission')) {
      return {
        success: false,
        error: PERMISSION_DENIED,
        message: 'Location permission denied'
      };
    }
    
    if (error.message && error.message.includes('unavailable')) {
      return {
        success: false,
        error: GPS_UNAVAILABLE,
        message: 'GPS position unavailable - please check if location services are enabled'
      };
    }
    
    return {
      success: false,
      error: 'unknown',
      message: error.message || 'Failed to get GPS location'
    };
  }
};

/**
 * Reverse geocode coordinates to address using OpenStreetMap Nominatim API
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object>} Geocoding result with address details
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SINDH-Jobs-App'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.address) {
      throw new Error('No address data in response');
    }
    
    // Extract address components
    const address = data.address;
    const pincode = address.postcode || '';
    const district = address.state_district || address.county || address.city_district || '';
    const state = address.state || '';
    const village = address.village || address.town || address.city || address.suburb || '';
    const fullAddress = data.display_name || '';
    
    return {
      success: true,
      pincode,
      district,
      state,
      village,
      address: fullAddress,
      coordinates: [longitude, latitude] // GeoJSON format: [lng, lat]
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    
    return {
      success: false,
      error: GEOCODING_FAILED,
      message: error.message || 'Failed to convert GPS coordinates to address'
    };
  }
};

/**
 * Main orchestrator function to get location with permission handling
 * Call this first - it will check permissions and return requiresRationale if needed
 * @returns {Promise<Object>} Location result with all details or permission status
 */
export const getLocationWithPermission = async () => {
  // Check if running on native platform
  if (!Capacitor.isNativePlatform()) {
    return {
      success: false,
      error: NOT_NATIVE,
      message: 'Location services only available on mobile devices'
    };
  }
  
  // Check current permission status
  const permissionStatus = await checkLocationPermission();
  
  if (permissionStatus.location === 'prompt') {
    // User hasn't been asked yet - show rationale first
    return {
      success: false,
      error: 'needs_permission',
      requiresRationale: true,
      message: 'Location permission needs to be requested'
    };
  }
  
  if (permissionStatus.location === 'denied') {
    return {
      success: false,
      error: PERMISSION_DENIED,
      message: 'Location permission denied. Please enable location in device settings.'
    };
  }
  
  // Permission is granted, proceed to get location
  return await requestAndGetLocation();
};

/**
 * Request permission and get location
 * Call this after user accepts the rationale dialog
 * @returns {Promise<Object>} Complete location data with GPS and address
 */
export const requestAndGetLocation = async () => {
  // Check permission status
  const permissionStatus = await checkLocationPermission();
  
  // If not granted, request permission
  if (permissionStatus.location !== 'granted') {
    const permissionResult = await requestLocationPermission();
    
    if (permissionResult.location !== 'granted') {
      return {
        success: false,
        error: PERMISSION_DENIED,
        message: 'Location permission was denied'
      };
    }
  }
  
  // Get GPS location
  const gpsResult = await getCurrentGPSLocation();
  
  if (!gpsResult.success) {
    return gpsResult; // Return GPS error
  }
  
  // Reverse geocode to get address
  const geocodeResult = await reverseGeocode(gpsResult.latitude, gpsResult.longitude);
  
  if (!geocodeResult.success) {
    // Return GPS coordinates even if geocoding failed
    return {
      success: true,
      latitude: gpsResult.latitude,
      longitude: gpsResult.longitude,
      accuracy: gpsResult.accuracy,
      coordinates: [gpsResult.longitude, gpsResult.latitude],
      geocodingFailed: true,
      message: 'Got GPS location but could not determine address'
    };
  }
  
  // Return combined result
  return {
    success: true,
    latitude: gpsResult.latitude,
    longitude: gpsResult.longitude,
    accuracy: gpsResult.accuracy,
    timestamp: gpsResult.timestamp,
    pincode: geocodeResult.pincode,
    district: geocodeResult.district,
    state: geocodeResult.state,
    village: geocodeResult.village,
    address: geocodeResult.address,
    coordinates: geocodeResult.coordinates
  };
};

/**
 * Lookup location details from pincode using India Post API
 * @param {string} pincode - 6-digit Indian pincode
 * @returns {Promise<Object>} Location data: { success, pincode, district, state, error }
 */
export const lookupPincode = async (pincode) => {
  try {
    // Validate pincode format
    if (!/^\d{6}$/.test(pincode)) {
      return {
        success: false,
        error: 'invalid_pincode',
        message: 'कृपया 6 अंकों का पिनकोड दर्ज करें'
      };
    }

    // Use India Post API or fallback to a pincode database
    const url = `https://api.postalpincode.in/pincode/${pincode}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Pincode API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data[0] || data[0].Status !== 'Success' || !data[0].PostOffice) {
      return {
        success: false,
        error: 'pincode_not_found',
        message: 'यह पिनकोड मान्य नहीं है'
      };
    }
    
    const postOffice = data[0].PostOffice[0];
    
    return {
      success: true,
      pincode: pincode,
      district: postOffice.District || '',
      state: postOffice.State || '',
      village: postOffice.Name || '',
      region: postOffice.Region || ''
    };
  } catch (error) {
    console.error('Pincode lookup error:', error);
    
    return {
      success: false,
      error: 'lookup_failed',
      message: 'पिनकोड जांच में त्रुटि। कृपया फिर से प्रयास करें।'
    };
  }
};
