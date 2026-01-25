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
    setLastUpdated(prev => ({
      ...prev,
      [type]: null
    }));
  }, []);

  // Invalidate all data
  const invalidateAllData = useCallback(() => {
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
    invalidateAllData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};