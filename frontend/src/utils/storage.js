// Storage utility for managing localStorage operations
// Provides consistent interface and error handling for localStorage

import envConfig from '../config/env';

class StorageManager {
  constructor() {
    this.prefix = 'nextdrive_';
  }

  // Get prefixed key
  getKey(key) {
    return `${this.prefix}${key}`;
  }

  // Set item in localStorage with error handling
  setItem(key, value) {
    try {
      const prefixedKey = this.getKey(key);
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(prefixedKey, serializedValue);
      
      if (envConfig.enableDebugLogs) {
        console.log(`Storage: Set ${key}`, value);
      }
      
      return true;
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error(`Storage: Failed to set ${key}`, error);
      }
      return false;
    }
  }

  // Get item from localStorage with error handling
  getItem(key, defaultValue = null) {
    try {
      const prefixedKey = this.getKey(key);
      const item = localStorage.getItem(prefixedKey);
      
      if (item === null) {
        return defaultValue;
      }

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error(`Storage: Failed to get ${key}`, error);
      }
      return defaultValue;
    }
  }

  // Remove item from localStorage
  removeItem(key) {
    try {
      const prefixedKey = this.getKey(key);
      localStorage.removeItem(prefixedKey);
      
      if (envConfig.enableDebugLogs) {
        console.log(`Storage: Removed ${key}`);
      }
      
      return true;
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error(`Storage: Failed to remove ${key}`, error);
      }
      return false;
    }
  }

  // Clear all items with prefix
  clear() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
      keys.forEach(key => localStorage.removeItem(key));
      
      if (envConfig.enableDebugLogs) {
        console.log('Storage: Cleared all items');
      }
      
      return true;
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Storage: Failed to clear', error);
      }
      return false;
    }
  }

  // Check if localStorage is available
  isAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  // Get all keys with prefix
  getKeys() {
    try {
      return Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''));
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Storage: Failed to get keys', error);
      }
      return [];
    }
  }

  // Get storage size (approximate)
  getSize() {
    try {
      let size = 0;
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          size += localStorage.getItem(key).length;
        }
      });
      return size;
    } catch (error) {
      if (envConfig.enableDebugLogs) {
        console.error('Storage: Failed to calculate size', error);
      }
      return 0;
    }
  }
}

// Auth-specific storage methods
class AuthStorage extends StorageManager {
  // Set user data
  setUser(user) {
    return this.setItem('user', user);
  }

  // Get user data
  getUser() {
    return this.getItem('user');
  }

  // Set authentication status
  setAuthenticated(status) {
    return this.setItem('isAuthenticated', status);
  }

  // Check if authenticated
  isAuthenticated() {
    return this.getItem('isAuthenticated') === 'true' || this.getItem('isAuthenticated') === true;
  }

  // Login user (set both user and auth status)
  login(user) {
    const userSet = this.setUser(user);
    const authSet = this.setAuthenticated(true);
    return userSet && authSet;
  }

  // Logout user (clear both user and auth status)
  logout() {
    const userRemoved = this.removeItem('user');
    const authRemoved = this.removeItem('isAuthenticated');
    return userRemoved && authRemoved;
  }

  // Update user data
  updateUser(userData) {
    const currentUser = this.getUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      return this.setUser(updatedUser);
    }
    return false;
  }
}

// Export instances
export const storage = new StorageManager();
export const authStorage = new AuthStorage();
export default storage;