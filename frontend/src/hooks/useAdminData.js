import { useState, useEffect, useCallback, useRef } from 'react';
import adminService from '../services/adminService';

// Custom hook for admin data with smart caching and minimal API calls
export const useAdminData = (activeTab) => {
  const [data, setData] = useState({
    queries: [],
    tourBookings: [],
    carBookings: [],
    tourPackages: [],
    users: [],
    stats: {}
  });

  const [loading, setLoading] = useState({
    queries: false,
    tourBookings: false,
    carBookings: false,
    tourPackages: false,
    users: false,
    stats: false
  });

  const [errors, setErrors] = useState({});
  const [lastFetched, setLastFetched] = useState({});
  const isActiveRef = useRef(true);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  // Check if data needs refresh
  const needsRefresh = useCallback((dataType) => {
    const lastFetch = lastFetched[dataType];
    if (!lastFetch) return true;
    
    const now = Date.now();
    return (now - lastFetch) > CACHE_DURATION;
  }, [lastFetched]);

  // Generic fetch function
  const fetchData = useCallback(async (dataType, fetchFunction, force = false) => {
    if (!isActiveRef.current) return;

    // Skip if already loading or data is fresh
    if (loading[dataType] || (!force && !needsRefresh(dataType) && data[dataType]?.length > 0)) {
      return;
    }

    setLoading(prev => ({ ...prev, [dataType]: true }));
    setErrors(prev => ({ ...prev, [dataType]: null }));

    try {
      console.log(`📡 Fetching ${dataType}...`);
      const result = await fetchFunction();
      
      if (isActiveRef.current) {
        setData(prev => ({ ...prev, [dataType]: result }));
        setLastFetched(prev => ({ ...prev, [dataType]: Date.now() }));
        console.log(`✅ ${dataType} fetched successfully:`, result?.length || 'N/A', 'items');
      }
    } catch (error) {
      console.error(`❌ Failed to fetch ${dataType}:`, error);
      if (isActiveRef.current) {
        setErrors(prev => ({ ...prev, [dataType]: error }));
      }
    } finally {
      if (isActiveRef.current) {
        setLoading(prev => ({ ...prev, [dataType]: false }));
      }
    }
  }, [loading, needsRefresh, data]);

  // Specific fetch functions
  const fetchQueries = useCallback((force = false) => 
    fetchData('queries', adminService.getQueries, force), [fetchData]);
  
  const fetchTourBookings = useCallback((force = false) => 
    fetchData('tourBookings', adminService.getTourBookings, force), [fetchData]);
  
  const fetchCarBookings = useCallback((force = false) => 
    fetchData('carBookings', adminService.getCarBookings, force), [fetchData]);
  
  const fetchTourPackages = useCallback((force = false) => 
    fetchData('tourPackages', adminService.getTourPackages, force), [fetchData]);
  
  const fetchUsers = useCallback((force = false) => 
    fetchData('users', adminService.getUsers, force), [fetchData]);
  
  const fetchStats = useCallback((force = false) => 
    fetchData('stats', adminService.getStats, force), [fetchData]);

  // Fetch data based on active tab
  useEffect(() => {
    if (!activeTab) return;

    switch (activeTab) {
      case 'overview':
        fetchStats();
        break;
      case 'users':
        fetchUsers();
        break;
      case 'queries':
        fetchQueries();
        break;
      case 'tour-bookings':
        fetchTourBookings();
        break;
      case 'car-bookings':
        fetchCarBookings();
        break;
      case 'tour-packages':
        fetchTourPackages();
        break;
      default:
        break;
    }
  }, [activeTab, fetchStats, fetchUsers, fetchQueries, fetchTourBookings, fetchCarBookings, fetchTourPackages]);

  // Refresh functions
  const refreshData = useCallback((dataType) => {
    switch (dataType) {
      case 'queries':
        fetchQueries(true);
        break;
      case 'tourBookings':
        fetchTourBookings(true);
        break;
      case 'carBookings':
        fetchCarBookings(true);
        break;
      case 'tourPackages':
        fetchTourPackages(true);
        break;
      case 'users':
        fetchUsers(true);
        break;
      case 'stats':
        fetchStats(true);
        break;
      default:
        break;
    }
  }, [fetchQueries, fetchTourBookings, fetchCarBookings, fetchTourPackages, fetchUsers, fetchStats]);

  // Update item in data
  const updateItem = useCallback((dataType, itemId, updatedItem) => {
    setData(prev => ({
      ...prev,
      [dataType]: prev[dataType].map(item => 
        item._id === itemId ? { ...item, ...updatedItem } : item
      )
    }));
  }, []);

  // Remove item from data
  const removeItem = useCallback((dataType, itemId) => {
    setData(prev => ({
      ...prev,
      [dataType]: prev[dataType].filter(item => item._id !== itemId)
    }));
  }, []);

  // Add item to data
  const addItem = useCallback((dataType, item) => {
    setData(prev => ({
      ...prev,
      [dataType]: [...prev[dataType], item]
    }));
  }, []);

  return {
    data,
    loading,
    errors,
    refreshData,
    updateItem,
    removeItem,
    addItem,
    lastFetched
  };
};