/**
 * Request device geolocation with timeout
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise<{latitude, longitude}>} - Coordinates or null
 */
export const getDeviceLocation = (timeout = 10000) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error('Geolocation request timed out'));
    }, timeout);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        clearTimeout(timeoutId);
        let errorMessage = 'Unable to retrieve your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable geolocation in browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out.';
            break;
          default:
            errorMessage = `Error: ${error.message}`;
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 0
      }
    );
  });
};

/**
 * Get location with high accuracy (GPS)
 * @returns {Promise<{latitude, longitude}>}
 */
export const getHighAccuracyLocation = () => {
  return getDeviceLocation(15000); // 15 second timeout for GPS
};

/**
 * Get location with lower accuracy but faster (Cell/WiFi)
 * @returns {Promise<{latitude, longitude}>}
 */
export const getFastLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Format coordinates for display
 * @param {number} latitude
 * @param {number} longitude
 * @returns {string}
 */
export const formatCoordinates = (latitude, longitude) => {
  if (latitude === null || longitude === null) {
    return 'Location unavailable';
  }
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
};

/**
 * Check if geolocation is available
 * @returns {boolean}
 */
export const isGeolocationAvailable = () => {
  return !!navigator.geolocation;
};

/**
 * Watch user location and call callback on updates
 * @param {Function} onSuccess - Called with {latitude, longitude}
 * @param {Function} onError - Called with error message
 * @returns {number} - Watch ID (save to stop watching later)
 */
export const watchLocation = (onSuccess, onError) => {
  if (!navigator.geolocation) {
    onError('Geolocation not supported');
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    },
    (error) => {
      onError(`Watch error: ${error.message}`);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  );
};

/**
 * Stop watching location
 * @param {number} watchId - Returned from watchLocation
 */
export const stopWatchingLocation = (watchId) => {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
  }
};
