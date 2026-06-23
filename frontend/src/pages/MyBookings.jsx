// MyBookings is now part of the unified UserDashboard.
// This redirect ensures existing links to /my-bookings still work.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MyBookings = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/user-dashboard', { replace: true });
  }, [navigate]);
  return null;
};

export default MyBookings;
