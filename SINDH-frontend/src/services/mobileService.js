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
    this.initializationStatus = {};
    this.initErrors = [];
    this.initialized = false;
    // Listener handles for cleanup
    this.networkListener = null;
    this.keyboardListeners = [];
    this.visualViewportListener = null;
  }

  // Initialize mobile-specific features
  async init() {
    // Guard against duplicate initialization
    if (this.initialized) {
      console.warn('mobileService already initialized, skipping');
      return;
    }
    
    this.initialized = true;
    
    if (this.isNative) {
      // StatusBar setup
      try {
        await this.setupStatusBar();
        this.initializationStatus.statusBar = 'success';
      } catch (error) {
        this.initializationStatus.statusBar = 'failed';
        this.initErrors.push({ plugin: 'StatusBar', error: error.message });
      }
      
      // SplashScreen setup
      try {
        await this.hideSplashScreen();
        this.initializationStatus.splashScreen = 'success';
      } catch (error) {
        this.initializationStatus.splashScreen = 'failed';
        this.initErrors.push({ plugin: 'SplashScreen', error: error.message });
      }
      
      // Keyboard setup
      try {
        this.setupKeyboard();
        this.initializationStatus.keyboard = 'success';
      } catch (error) {
        this.initializationStatus.keyboard = 'failed';
        this.initErrors.push({ plugin: 'Keyboard', error: error.message });
      }
      
      // Network listener setup
      try {
        this.setupNetworkListener();
        this.initializationStatus.network = 'success';
      } catch (error) {
        this.initializationStatus.network = 'failed';
        this.initErrors.push({ plugin: 'Network', error: error.message });
      }
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
    // Guard against duplicate listener registration
    if (this.keyboardListeners.length > 0) {
      console.warn('Keyboard listeners already registered');
      return;
    }
    
    try {
      // iOS events (keyboardWillShow/Hide)
      const willShowListener = Keyboard.addListener('keyboardWillShow', () => {
        document.body.classList.add('keyboard-open');
      });
      this.keyboardListeners.push(willShowListener);

      const willHideListener = Keyboard.addListener('keyboardWillHide', () => {
        document.body.classList.remove('keyboard-open');
      });
      this.keyboardListeners.push(willHideListener);
      
      // Android events (keyboardDidShow/Hide)
      const didShowListener = Keyboard.addListener('keyboardDidShow', () => {
        document.body.classList.add('keyboard-open');
      });
      this.keyboardListeners.push(didShowListener);

      const didHideListener = Keyboard.addListener('keyboardDidHide', () => {
        document.body.classList.remove('keyboard-open');
      });
      this.keyboardListeners.push(didHideListener);
      
      // Fallback for Android using visualViewport or window.onresize
      if (this.platform === 'android' && window.visualViewport) {
        const viewportHandler = () => {
          // Detect keyboard by viewport height change
          const viewportHeight = window.visualViewport.height;
          const windowHeight = window.innerHeight;
          const isKeyboardOpen = viewportHeight < windowHeight * 0.75;
          
          if (isKeyboardOpen) {
            document.body.classList.add('keyboard-open');
          } else {
            document.body.classList.remove('keyboard-open');
          }
        };
        
        window.visualViewport.addEventListener('resize', viewportHandler);
        this.visualViewportListener = viewportHandler;
      }
    } catch (error) {
      console.warn('Keyboard setup failed:', error);
    }
  }

  // Network status monitoring
  setupNetworkListener() {
    // Guard against duplicate listener registration
    if (this.networkListener) {
      console.warn('Network listener already registered');
      return;
    }
    
    try {
      let previousStatus = null;
      
      this.networkListener = Network.addListener('networkStatusChange', status => {
        const changedAt = new Date().toISOString();
        
        console.groupCollapsed(`📡 Network status changed at ${changedAt}`);
        console.log('Previous status:', previousStatus);
        console.log('New status:', status);
        console.log('Changed at:', changedAt);
        console.groupEnd();
        
        // Dispatch custom event for components to listen to
        const networkEvent = new CustomEvent('networkStatusChange', {
          detail: {
            previousStatus,
            newStatus: status,
            changedAt
          }
        });
        window.dispatchEvent(networkEvent);
        
        // Update previous status for next change
        previousStatus = status;
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

  /**
   * Check location permission status
   * Note: For comprehensive permission handling with rationale UI, use locationService.js
   * @returns {Promise<Object>} Permission status: { location: 'granted' | 'denied' | 'prompt' }
   */
  async checkLocationPermission() {
    try {
      const permissions = await Geolocation.checkPermissions();
      return permissions;
    } catch (error) {
      console.error('Check location permission error:', error);
      return { location: 'unavailable' };
    }
  }

  /**
   * Request location permission from user
   * Note: For full permission flow with rationale dialog, use locationService.js
   * @returns {Promise<Object>} Permission result
   */
  async requestLocationPermission() {
    try {
      console.log('📍 Requesting location permission...');
      const permissions = await Geolocation.requestPermissions();
      console.log('📍 Permission result:', permissions);
      return permissions;
    } catch (error) {
      console.error('Request location permission error:', error);
      return { location: 'denied' };
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

  /**
   * Test all Capacitor plugins
   * @returns {Promise<Object>} Test results for all plugins
   */
  async testAllPlugins() {
    const results = {
      platform: this.getPlatform(),
      isNative: this.isMobile(),
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test StatusBar
    try {
      results.tests.statusBar = {
        available: !!window.StatusBar || this.isNative,
        status: 'working'
      };
    } catch (error) {
      results.tests.statusBar = { available: false, error: error.message };
    }

    // Test Network
    try {
      const status = await this.getNetworkStatus();
      results.tests.network = {
        available: true,
        status: 'working',
        connectionType: status.connectionType,
        connected: status.connected
      };
    } catch (error) {
      results.tests.network = { available: false, error: error.message };
    }

    // Test Camera (permission check only)
    try {
      results.tests.camera = {
        available: !!window.Camera || this.isNative,
        status: 'available (permissions not tested)'
      };
    } catch (error) {
      results.tests.camera = { available: false, error: error.message };
    }

    // Test Geolocation (with permission check)
    try {
      const permissionStatus = await this.checkLocationPermission();
      results.tests.geolocation = {
        available: !!window.Geolocation || this.isNative,
        status: 'working',
        permission: permissionStatus.location || 'unknown'
      };
    } catch (error) {
      results.tests.geolocation = { available: false, error: error.message };
    }

    // Test Keyboard
    try {
      results.tests.keyboard = {
        available: !!window.Keyboard || this.isNative,
        status: 'working'
      };
    } catch (error) {
      results.tests.keyboard = { available: false, error: error.message };
    }

    console.log('🧪 Plugin Test Results:', results);
    console.table(results.tests);
    return results;
  }

  /**
   * Get current plugin status
   * Note: This is synchronous, for permission status use checkLocationPermission() separately
   * @returns {Object} Status of all plugins
   */
  getPluginStatus() {
    return {
      platform: this.platform,
      isNative: this.isNative,
      availablePlugins: {
        StatusBar: !!window.StatusBar,
        SplashScreen: !!window.SplashScreen,
        Keyboard: !!window.Keyboard,
        Network: !!window.Network,
        Camera: !!window.Camera,
        Geolocation: !!window.Geolocation
      },
      capacitorVersion: window.Capacitor?.version || 'unknown',
      timestamp: new Date().toISOString(),
      note: 'For location permission status, use checkLocationPermission()'
    };
  }

  /**
   * Test network monitoring
   * @returns {Promise<Object>} Current network status
   */
  async testNetworkMonitoring() {
    console.log('🔍 Testing network monitoring...');
    const status = await this.getNetworkStatus();
    console.log('📡 Current network status:', status);
    return status;
  }

  /**
   * Get initialization status for all plugins
   * @returns {Object} Initialization status of each plugin
   */
  getInitializationStatus() {
    return {
      ...this.initializationStatus,
      timestamp: new Date().toISOString(),
      isNative: this.isNative,
      platform: this.platform
    };
  }

  /**
   * Get initialization errors
   * @returns {Array} Array of initialization errors
   */
  getInitErrors() {
    return this.initErrors;
  }

  /**
   * Dispose of all listeners and clean up resources
   * Call this before app shutdown or when re-initializing
   */
  dispose() {
    console.log('🧹 Disposing mobileService listeners...');
    
    // Remove network listener
    if (this.networkListener) {
      this.networkListener.remove();
      this.networkListener = null;
    }
    
    // Remove keyboard listeners
    this.keyboardListeners.forEach(listener => {
      if (listener && listener.remove) {
        listener.remove();
      }
    });
    this.keyboardListeners = [];
    
    // Remove visualViewport listener
    if (this.visualViewportListener && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.visualViewportListener);
      this.visualViewportListener = null;
    }
    
    // Reset initialization flag
    this.initialized = false;
    
    console.log('✅ mobileService disposed');
  }
}

// Create singleton instance
const mobileService = new MobileService();

export default mobileService; 