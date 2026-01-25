// Environment configuration utility
// Centralizes access to environment variables with defaults and validation

class EnvConfig {
  constructor() {
    this.validateRequiredEnvVars();
  }

  // API Configuration
  get apiUrl() {
    return import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  get apiTimeout() {
    return parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000;
  }

  // Application Configuration
  get appName() {
    return import.meta.env.VITE_APP_NAME || 'NextDrive Bihar';
  }

  get appDescription() {
    return import.meta.env.VITE_APP_DESCRIPTION || 'Tour & Travel Services in Bihar';
  }

  get appVersion() {
    return import.meta.env.VITE_APP_VERSION || '1.0.0';
  }

  // Feature Flags
  get enableGoogleAuth() {
    return import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true';
  }

  get enableNotifications() {
    return import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false';
  }

  get enableFeedbackSystem() {
    return import.meta.env.VITE_ENABLE_FEEDBACK_SYSTEM !== 'false';
  }

  // UI Configuration
  get defaultAvatarUrl() {
    return import.meta.env.VITE_DEFAULT_AVATAR_URL || '/default-avatar.png';
  }

  get itemsPerPage() {
    return parseInt(import.meta.env.VITE_ITEMS_PER_PAGE) || 10;
  }

  get maxFileSize() {
    return parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 5242880; // 5MB
  }

  get supportedImageFormats() {
    const formats = import.meta.env.VITE_SUPPORTED_IMAGE_FORMATS || 'image/jpeg,image/png,image/webp';
    return formats.split(',').map(format => format.trim());
  }

  // Carousel Configuration
  get carouselAutoPlayInterval() {
    return parseInt(import.meta.env.VITE_CAROUSEL_AUTO_PLAY_INTERVAL) || 5000;
  }

  get carouselPauseOnHover() {
    return import.meta.env.VITE_CAROUSEL_PAUSE_ON_HOVER !== 'false';
  }

  // Notification Configuration
  get notificationLimit() {
    return parseInt(import.meta.env.VITE_NOTIFICATION_LIMIT) || 20;
  }

  get notificationAutoRefresh() {
    return parseInt(import.meta.env.VITE_NOTIFICATION_AUTO_REFRESH) || 30000;
  }

  // Form Configuration
  get otpResendCooldown() {
    return parseInt(import.meta.env.VITE_OTP_RESEND_COOLDOWN) || 30;
  }

  get phoneNumberLength() {
    return parseInt(import.meta.env.VITE_PHONE_NUMBER_LENGTH) || 10;
  }

  // Development Configuration
  get enableDebugLogs() {
    return import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';
  }

  get mockApiResponses() {
    return import.meta.env.VITE_MOCK_API_RESPONSES === 'true';
  }

  // External Services
  get googleMapsApiKey() {
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  }

  get analyticsId() {
    return import.meta.env.VITE_ANALYTICS_ID || '';
  }

  // Security Configuration
  get sessionTimeout() {
    return parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 3600000; // 1 hour
  }

  get csrfProtection() {
    return import.meta.env.VITE_CSRF_PROTECTION !== 'false';
  }

  // Image Configuration
  get imageQuality() {
    return parseInt(import.meta.env.VITE_IMAGE_QUALITY) || 80;
  }

  get thumbnailSize() {
    return parseInt(import.meta.env.VITE_THUMBNAIL_SIZE) || 300;
  }

  get maxImagesPerPackage() {
    return parseInt(import.meta.env.VITE_MAX_IMAGES_PER_PACKAGE) || 10;
  }

  // Cloudinary Configuration
  get cloudinaryCloudName() {
    return import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  }

  get cloudinaryBaseUrl() {
    return import.meta.env.VITE_CLOUDINARY_BASE_URL || 'https://res.cloudinary.com';
  }

  // Utility Methods
  isDevelopment() {
    return import.meta.env.DEV;
  }

  isProduction() {
    return import.meta.env.PROD;
  }

  getMode() {
    return import.meta.env.MODE;
  }

  // Helper method to get full asset URL
  getAssetUrl(path) {
    if (!path) return this.defaultAvatarUrl;
    if (path.startsWith('http') || path.startsWith('data:')) {
      return path;
    }
    return `${this.apiUrl}/${path.replace(/^\//, '')}`;
  }

  // Helper method to validate file size
  isValidFileSize(fileSize) {
    return fileSize <= this.maxFileSize;
  }

  // Helper method to validate image format
  isValidImageFormat(mimeType) {
    return this.supportedImageFormats.includes(mimeType);
  }

  // Validate required environment variables
  validateRequiredEnvVars() {
    const required = ['VITE_API_URL'];
    const missing = required.filter(key => !import.meta.env[key]);
    
    if (missing.length > 0 && this.isProduction()) {
      console.warn('Missing required environment variables:', missing);
    }
  }

  // Get all environment variables for debugging
  getAllEnvVars() {
    if (!this.enableDebugLogs) return {};
    
    return Object.keys(import.meta.env)
      .filter(key => key.startsWith('VITE_'))
      .reduce((acc, key) => {
        acc[key] = import.meta.env[key];
        return acc;
      }, {});
  }
}

// Export singleton instance
export default new EnvConfig();