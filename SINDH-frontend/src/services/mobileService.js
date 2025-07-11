// Mobile service for handling Capacitor plugins and native functionality
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Network } from '@capacitor/network';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

class MobileService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.platform = Capacitor.getPlatform();
    this.init();
  }

  // Initialize mobile-specific features
  async init() {
    if (this.isNative) {
      await this.setupStatusBar();
      await this.hideSplashScreen();
      this.setupKeyboard();
      this.setupNetworkListener();
    }
  }

  // Status bar configuration
  async setupStatusBar() {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#ff6b35' });
    } catch (error) {
      console.warn('StatusBar setup failed:', error);
    }
  }

  // Hide splash screen
  async hideSplashScreen() {
    try {
      await SplashScreen.hide();
    } catch (error) {
      console.warn('SplashScreen hide failed:', error);
    }
  }

  // Keyboard configuration
  setupKeyboard() {
    try {
      Keyboard.addListener('keyboardWillShow', () => {
        document.body.classList.add('keyboard-open');
      });

      Keyboard.addListener('keyboardWillHide', () => {
        document.body.classList.remove('keyboard-open');
      });
    } catch (error) {
      console.warn('Keyboard setup failed:', error);
    }
  }

  // Network status monitoring
  setupNetworkListener() {
    try {
      Network.addListener('networkStatusChange', status => {
        console.log('Network status changed:', status);
        
        // Dispatch custom event for components to listen to
        const networkEvent = new CustomEvent('networkStatusChange', {
          detail: status
        });
        window.dispatchEvent(networkEvent);
      });
    } catch (error) {
      console.warn('Network listener setup failed:', error);
    }
  }

  // Camera functionality
  async takePicture(options = {}) {
    try {
      const defaultOptions = {
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      };

      const image = await Camera.getPhoto({
        ...defaultOptions,
        ...options
      });

      return {
        success: true,
        webPath: image.webPath,
        path: image.path,
        format: image.format
      };
    } catch (error) {
      console.error('Camera error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Gallery selection
  async selectFromGallery(options = {}) {
    try {
      const defaultOptions = {
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      };

      const image = await Camera.getPhoto({
        ...defaultOptions,
        ...options
      });

      return {
        success: true,
        webPath: image.webPath,
        path: image.path,
        format: image.format
      };
    } catch (error) {
      console.error('Gallery selection error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get current location
  async getCurrentLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      return {
        success: true,
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
        timestamp: coordinates.timestamp
      };
    } catch (error) {
      console.error('Geolocation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Watch location changes
  async watchPosition(callback) {
    try {
      const watchId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000
      }, callback);

      return watchId;
    } catch (error) {
      console.error('Watch position error:', error);
      return null;
    }
  }

  // Clear location watch
  async clearWatch(watchId) {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (error) {
      console.error('Clear watch error:', error);
    }
  }

  // Get network status
  async getNetworkStatus() {
    try {
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType
      };
    } catch (error) {
      console.error('Network status error:', error);
      return {
        connected: true, // Assume connected if can't check
        connectionType: 'unknown'
      };
    }
  }

  // Check if app is running on mobile
  isMobile() {
    return this.isNative;
  }

  // Get platform info
  getPlatform() {
    return this.platform;
  }

  // Show/hide keyboard
  async showKeyboard() {
    if (this.isNative) {
      try {
        await Keyboard.show();
      } catch (error) {
        console.warn('Show keyboard failed:', error);
      }
    }
  }

  async hideKeyboard() {
    if (this.isNative) {
      try {
        await Keyboard.hide();
      } catch (error) {
        console.warn('Hide keyboard failed:', error);
      }
    }
  }

  // Haptic feedback (if available)
  async hapticFeedback(type = 'light') {
    if (this.isNative) {
      try {
        // Note: Need to install @capacitor/haptics for this to work
        // For now, just vibrate if available
        if (navigator.vibrate) {
          const patterns = {
            light: 50,
            medium: 100,
            heavy: 200
          };
          navigator.vibrate(patterns[type] || 50);
        }
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }
  }

  // Handle deep links (for future use)
  setupDeepLinks(callback) {
    if (this.isNative) {
      // This would be implemented with App plugin
      console.log('Deep link setup - implement with @capacitor/app plugin');
    }
  }
}

// Create singleton instance
const mobileService = new MobileService();

export default mobileService; 