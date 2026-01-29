import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';

// Hook to refresh data when navigating to admin routes
export const useRouteRefresh = () => {
  const location = useLocation();
  const { invalidateAllData } = useData();

  useEffect(() => {
    // Only invalidate data when navigating to admin dashboard
    if (location.pathname === '/admin' || location.pathname.startsWith('/admin/')) {
      console.log('🔄 Route changed to admin, invalidating data for fresh load');
      invalidateAllData();
    }
  }, [location.pathname, invalidateAllData]);
};

// Hook to force refresh data on specific routes
export const useForceRefresh = (routes = []) => {
  const location = useLocation();
  const { invalidateAllData } = useData();

  useEffect(() => {
    if (routes.includes(location.pathname)) {
      console.log(`🔄 Route changed to ${location.pathname}, forcing data refresh`);
      invalidateAllData();
    }
  }, [location.pathname, invalidateAllData, routes]);
};