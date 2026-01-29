import { createContext, useContext, useState, useCallback } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  // Global state for different data types
  const [data, setData] = useState({
    users: [],
    queries: [],
    tourBookings: [],
    carBookings: [],
    tourPackages: [],
    notifications: [],
    stats: {}
  });

  const [lastUpdated, setLastUpdated] = useState({
    users: null,
    queries: null,
    tourBookings: null,
    carBookings: null,
    tourPackages: null,
    notifications: null,
    stats: null
  });

  // Generic update function
  const updateData = useCallback((type, newData) => {
    console.log(`📊 Updating ${type} data:`, newData?.length || 'N/A', 'items');
    setData(prev => ({
      ...prev,
      [type]: newData
    }));
    setLastUpdated(prev => ({
      ...prev,
      [type]: Date.now()
    }));
  }, []);

  // Add item to array
  const addItem = useCallback((type, item) => {
    console.log(`➕ Adding item to ${type}:`, item._id || item.id || 'unknown');
    setData(prev => ({
      ...prev,
      [type]: [...prev[type], item]
    }));
    setLastUpdated(prev => ({
      ...prev,
      [type]: Date.now()
    }));
  }, []);

  // Update item in array
  const updateItem = useCallback((type, itemId, updatedItem) => {
    console.log(`✏️ Updating ${type} item:`, itemId);
    setData(prev => ({
      ...prev,
      [type]: prev[type].map(item => 
        item._id === itemId ? { ...item, ...updatedItem } : item
      )
    }));
    setLastUpdated(prev => ({
      ...prev,
      [type]: Date.now()
    }));
  }, []);

  // Remove item from array
  const removeItem = useCallback((type, itemId) => {
    console.log(`🗑️ Removing ${type} item:`, itemId);
    setData(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item._id !== itemId)
    }));
    setLastUpdated(prev => ({
      ...prev,
      [type]: Date.now()
    }));
  }, []);

  // Invalidate data (force refetch)
  const invalidateData = useCallback((type) => {
    console.log(`🔄 Invalidating ${type} data`);
    setLastUpdated(prev => ({
      ...prev,
      [type]: null
    }));
  }, []);

  // Invalidate all data
  const invalidateAllData = useCallback(() => {
    console.log('🔄 Invalidating all data');
    setLastUpdated({
      users: null,
      queries: null,
      tourBookings: null,
      carBookings: null,
      tourPackages: null,
      notifications: null,
      stats: null
    });
  }, []);

  // Clear all data (for logout)
  const clearAllData = useCallback(() => {
    console.log('🧹 Clearing all data');
    setData({
      users: [],
      queries: [],
      tourBookings: [],
      carBookings: [],
      tourPackages: [],
      notifications: [],
      stats: {}
    });
    setLastUpdated({
      users: null,
      queries: null,
      tourBookings: null,
      carBookings: null,
      tourPackages: null,
      notifications: null,
      stats: null
    });
  }, []);

  const value = {
    data,
    lastUpdated,
    updateData,
    addItem,
    updateItem,
    removeItem,
    invalidateData,
    invalidateAllData,
    clearAllData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};