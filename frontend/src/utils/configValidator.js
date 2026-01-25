// Configuration validation utility
// Validates environment variables and provides helpful error messages

import envConfig from '../config/env';

class ConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  // Validate all configuration
  validateAll() {
    this.validateRequired();
    this.validateTypes();
    this.validateRanges();
    this.validateUrls();
    this.validateFeatureFlags();
    
    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  // Validate required environment variables
  validateRequired() {
    const required = [
      { key: 'VITE_API_URL', value: envConfig.apiUrl, name: 'API URL' }
    ];

    required.forEach(({ key, value, name }) => {
      if (!value || value === 'undefined') {
        this.errors.push(`${name} (${key}) is required but not set`);
      }
    });
  }

  // Validate data types
  validateTypes() {
    const numericFields = [
      { key: 'VITE_API_TIMEOUT', value: envConfig.apiTimeout, name: 'API Timeout' },
      { key: 'VITE_ITEMS_PER_PAGE', value: envConfig.itemsPerPage, name: 'Items Per Page' },
      { key: 'VITE_MAX_FILE_SIZE', value: envConfig.maxFileSize, name: 'Max File Size' },
      { key: 'VITE_PHONE_NUMBER_LENGTH', value: envConfig.phoneNumberLength, name: 'Phone Number Length' }
    ];

    numericFields.forEach(({ key, value, name }) => {
      if (isNaN(value) || value <= 0) {
        this.errors.push(`${name} (${key}) must be a positive number, got: ${value}`);
      }
    });
  }

  // Validate value ranges
  validateRanges() {
    // API timeout should be reasonable (1-60 seconds)
    if (envConfig.apiTimeout < 1000 || envConfig.apiTimeout > 60000) {
      this.warnings.push(`API timeout (${envConfig.apiTimeout}ms) is outside recommended range (1000-60000ms)`);
    }

    // Items per page should be reasonable (1-100)
    if (envConfig.itemsPerPage < 1 || envConfig.itemsPerPage > 100) {
      this.warnings.push(`Items per page (${envConfig.itemsPerPage}) is outside recommended range (1-100)`);
    }

    // Phone number length should be reasonable (8-15 digits)
    if (envConfig.phoneNumberLength < 8 || envConfig.phoneNumberLength > 15) {
      this.warnings.push(`Phone number length (${envConfig.phoneNumberLength}) is outside typical range (8-15)`);
    }

    // Max file size should be reasonable (1MB-50MB)
    if (envConfig.maxFileSize < 1048576 || envConfig.maxFileSize > 52428800) {
      this.warnings.push(`Max file size (${envConfig.maxFileSize} bytes) is outside recommended range (1MB-50MB)`);
    }
  }

  // Validate URLs
  validateUrls() {
    try {
      const apiUrl = new URL(envConfig.apiUrl);
      
      // Check protocol
      if (!['http:', 'https:'].includes(apiUrl.protocol)) {
        this.errors.push(`API URL must use HTTP or HTTPS protocol, got: ${apiUrl.protocol}`);
      }

      // Warn about HTTP in production
      if (apiUrl.protocol === 'http:' && envConfig.isProduction()) {
        this.warnings.push('Using HTTP in production is not recommended. Consider using HTTPS.');
      }

      // Check for localhost in production
      if (apiUrl.hostname === 'localhost' && envConfig.isProduction()) {
        this.warnings.push('Using localhost in production will not work for deployed applications.');
      }
    } catch (error) {
      this.errors.push(`Invalid API URL format: ${envConfig.apiUrl}`);
    }
  }

  // Validate feature flags
  validateFeatureFlags() {
    const booleanFields = [
      { key: 'VITE_ENABLE_GOOGLE_AUTH', value: envConfig.enableGoogleAuth, name: 'Google Auth' },
      { key: 'VITE_ENABLE_NOTIFICATIONS', value: envConfig.enableNotifications, name: 'Notifications' },
      { key: 'VITE_ENABLE_FEEDBACK_SYSTEM', value: envConfig.enableFeedbackSystem, name: 'Feedback System' }
    ];

    booleanFields.forEach(({ key, value, name }) => {
      if (typeof value !== 'boolean') {
        this.warnings.push(`${name} (${key}) should be 'true' or 'false', got: ${value}`);
      }
    });

    // Check for Google Auth without API key
    if (envConfig.enableGoogleAuth && !envConfig.googleMapsApiKey) {
      this.warnings.push('Google Auth is enabled but no Google Maps API key is configured');
    }
  }

  // Get configuration summary
  getConfigSummary() {
    return {
      environment: envConfig.getMode(),
      apiUrl: envConfig.apiUrl,
      features: {
        googleAuth: envConfig.enableGoogleAuth,
        notifications: envConfig.enableNotifications,
        feedbackSystem: envConfig.enableFeedbackSystem,
        debugLogs: envConfig.enableDebugLogs
      },
      limits: {
        apiTimeout: envConfig.apiTimeout,
        itemsPerPage: envConfig.itemsPerPage,
        maxFileSize: envConfig.maxFileSize,
        phoneNumberLength: envConfig.phoneNumberLength
      }
    };
  }

  // Log validation results
  logResults() {
    const results = this.validateAll();
    
    if (envConfig.enableDebugLogs) {
      console.group('🔧 Configuration Validation');
      
      if (results.errors.length > 0) {
        console.error('❌ Configuration Errors:');
        results.errors.forEach(error => console.error(`  • ${error}`));
      }
      
      if (results.warnings.length > 0) {
        console.warn('⚠️ Configuration Warnings:');
        results.warnings.forEach(warning => console.warn(`  • ${warning}`));
      }
      
      if (results.isValid && results.warnings.length === 0) {
        console.log('✅ Configuration is valid');
      }
      
      console.log('📋 Configuration Summary:', this.getConfigSummary());
      console.groupEnd();
    }
    
    return results;
  }
}

// Export singleton instance
export default new ConfigValidator();