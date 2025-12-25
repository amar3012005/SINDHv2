/**
 * Location Utility Functions
 * 
 * Centralized location logic for consistent city/state handling across components.
 * Handles Worker model's location structure where city is stored in 'village' field.
 */

/**
 * Extract city name from user object
 * @param {Object} user - User object from UserContext
 * @returns {String} City name or empty string
 */
export const extractCityFromUser = (user) => {
  if (!user || !user.location) return '';
  
  // Worker model stores city in 'village' field
  const city = user.location.village || 
               user.location.district || 
               user.location.city || 
               '';
  
  return city.trim().toLowerCase();
};

/**
 * Extract city name from job object
 * @param {Object} job - Job object from API
 * @returns {String} City name or 'Not specified'
 */
export const extractCityFromJob = (job) => {
  if (!job || !job.location) return 'Not specified';
  
  const city = job.location.city || 
               job.location.village || 
               '';
  
  return city.trim() || 'Not specified';
};

/**
 * Group jobs by city with user's city prioritized
 * @param {Array} jobs - Array of job objects
 * @param {String} userCity - User's city for prioritization (optional)
 * @returns {Object} { cityJobs: [], otherJobs: [], cityCounts: {} }
 */
export const groupJobsByCity = (jobs, userCity = null) => {
  if (!Array.isArray(jobs)) {
    return { cityJobs: [], otherJobs: [], cityCounts: {} };
  }

  const cityCounts = {};
  let cityJobs = [];
  let otherJobs = [];

  if (userCity) {
    // Filter jobs matching user's city
    jobs.forEach(job => {
      const jobCity = extractCityFromJob(job).toLowerCase();
      
      // Count jobs per city
      if (jobCity !== 'not specified') {
        cityCounts[jobCity] = (cityCounts[jobCity] || 0) + 1;
      }
      
      // Group by user's city
      if (jobCity === userCity.toLowerCase()) {
        cityJobs.push(job);
      } else {
        otherJobs.push(job);
      }
    });
  } else {
    // Group all jobs by city
    jobs.forEach(job => {
      const jobCity = extractCityFromJob(job);
      if (jobCity !== 'Not specified') {
        cityCounts[jobCity] = (cityCounts[jobCity] || 0) + 1;
      }
    });
    otherJobs = jobs;
  }

  return { cityJobs, otherJobs, cityCounts };
};

/**
 * Extract unique city names from jobs array
 * @param {Array} jobs - Array of job objects
 * @returns {Array} Unique city names, sorted alphabetically
 */
export const getUniqueCities = (jobs) => {
  if (!Array.isArray(jobs)) return [];
  
  const cities = jobs
    .map(job => extractCityFromJob(job))
    .filter(city => city !== 'Not specified' && city !== '')
    .filter((city, index, self) => self.indexOf(city) === index); // Unique values
  
  return cities.sort();
};

/**
 * Format location object to readable string
 * @param {Object} location - Location object { city, state, street, pincode }
 * @returns {String} Formatted location string
 */
export const formatLocation = (location) => {
  if (!location) return 'Location not specified';
  
  const { city, state, street, pincode } = location;
  
  if (city && state) {
    return `${city}, ${state}`;
  }
  
  if (city) {
    return city;
  }
  
  if (state) {
    return state;
  }
  
  if (street) {
    return street;
  }
  
  return 'Location not specified';
};

/**
 * Check if job matches location filter (city or state)
 * @param {Object} job - Job object
 * @param {String} filterValue - Filter value from dropdown
 * @returns {Boolean} True if job matches filter
 */
export const matchesLocationFilter = (job, filterValue) => {
  if (!filterValue || filterValue === '') return true;
  if (!job || !job.location) return false;
  
  const filter = filterValue.toLowerCase().trim();
  const jobCity = (job.location.city || '').toLowerCase();
  const jobState = (job.location.state || '').toLowerCase();
  const jobStreet = (job.location.street || '').toLowerCase();
  
  return jobCity.includes(filter) || 
         jobState.includes(filter) || 
         jobStreet.includes(filter);
};

// ============================================
// GPS Coordinate Utilities (Phase-1 GPS Integration)
// ============================================

/**
 * Validate GPS coordinates
 * @param {number} lng - Longitude (-180 to 180)
 * @param {number} lat - Latitude (-90 to 90)
 * @returns {boolean} True if coordinates are valid
 */
export const validateCoordinates = (lng, lat) => {
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    return false;
  }
  if (isNaN(lng) || isNaN(lat)) {
    return false;
  }
  if (lng < -180 || lng > 180) {
    return false;
  }
  if (lat < -90 || lat > 90) {
    return false;
  }
  return true;
};

/**
 * Format coordinates to fixed precision
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @param {number} precision - Number of decimal places (default: 6)
 * @returns {Object|null} { lng, lat } or null if invalid
 */
export const formatCoordinates = (lng, lat, precision = 6) => {
  if (!validateCoordinates(lng, lat)) {
    return null;
  }
  return {
    lng: parseFloat(lng.toFixed(precision)),
    lat: parseFloat(lat.toFixed(precision))
  };
};

/**
 * Convert coordinates to GeoJSON Point format (MongoDB compatible)
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @returns {Object|null} GeoJSON Point or null if invalid
 */
export const coordinatesToGeoJSON = (lng, lat) => {
  if (!validateCoordinates(lng, lat)) {
    return null;
  }
  return {
    type: 'Point',
    coordinates: [lng, lat] // MongoDB GeoJSON format: [longitude, latitude]
  };
};

/**
 * Convert GeoJSON Point to coordinate object
 * @param {Object} geoJSON - GeoJSON Point object
 * @returns {Object|null} { lng, lat } or null if invalid
 */
export const geoJSONToCoordinates = (geoJSON) => {
  if (!geoJSON || geoJSON.type !== 'Point') {
    return null;
  }
  if (!Array.isArray(geoJSON.coordinates) || geoJSON.coordinates.length !== 2) {
    return null;
  }
  const [lng, lat] = geoJSON.coordinates;
  if (!validateCoordinates(lng, lat)) {
    return null;
  }
  return { lng, lat };
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng2 - Longitude of point 2
 * @param {number} lat2 - Latitude of point 2
 * @returns {number|null} Distance in kilometers, or null if invalid
 */
export const calculateDistance = (lng1, lat1, lng2, lat2) => {
  if (!validateCoordinates(lng1, lat1) || !validateCoordinates(lng2, lat2)) {
    return null;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return parseFloat(distance.toFixed(2));
};

/**
 * Convert degrees to radians (internal helper)
 * @param {number} degrees
 * @returns {number}
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Check if location has GPS coordinates
 * @param {Object} location - Location object
 * @returns {boolean} True if GPS coordinates are present and valid
 */
export const hasGPSCoordinates = (location) => {
  if (!location || !location.coordinates) {
    return false;
  }
  
  // Check GeoJSON format
  if (location.coordinates.type === 'Point' && 
      Array.isArray(location.coordinates.coordinates) &&
      location.coordinates.coordinates.length === 2) {
    const [lng, lat] = location.coordinates.coordinates;
    return validateCoordinates(lng, lat);
  }
  
  return false;
};

/**
 * Extract coordinates from location object (handles multiple formats)
 * @param {Object} location - Location object
 * @returns {Object|null} { lng, lat } or null if not found
 */
export const extractCoordinates = (location) => {
  if (!location) return null;
  
  // Check GeoJSON format
  if (location.coordinates) {
    const result = geoJSONToCoordinates(location.coordinates);
    if (result) return result;
  }
  
  // Check direct lng/lat properties
  if (location.lng !== undefined && location.lat !== undefined) {
    if (validateCoordinates(location.lng, location.lat)) {
      return { lng: location.lng, lat: location.lat };
    }
  }
  
  // Check longitude/latitude properties
  if (location.longitude !== undefined && location.latitude !== undefined) {
    if (validateCoordinates(location.longitude, location.latitude)) {
      return { lng: location.longitude, lat: location.latitude };
    }
  }
  
  return null;
};

/**
 * Get Google Maps URL for coordinates
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @returns {string|null} Google Maps URL or null if invalid
 */
export const getGoogleMapsURL = (lng, lat) => {
  if (!validateCoordinates(lng, lat)) {
    return null;
  }
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

/**
 * Get OpenStreetMap URL for coordinates
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @param {number} zoom - Map zoom level (default: 15)
 * @returns {string|null} OpenStreetMap URL or null if invalid
 */
export const getOpenStreetMapURL = (lng, lat, zoom = 15) => {
  if (!validateCoordinates(lng, lat)) {
    return null;
  }
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=${zoom}`;
};
