import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import envConfig from '../config/env';

const GoogleAuthSuccessSimple = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [status, setStatus] = useState('checking'); // 'checking', 'success', 'error'
  const hasProcessed = useRef(false); // Prevent duplicate processing
  const hasShownToast = useRef(false); // Prevent duplicate toasts

  useEffect(() => {
    // Prevent multiple executions in StrictMode
    if (hasProcessed.current) return;
    
    const checkAuth = async () => {
      // Mark as processed immediately to prevent race conditions
      hasProcessed.current = true;
      
      try {
        // Simple delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch(`${envConfig.apiUrl}/auth/me`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.user) {
            // Store user data
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('isAuthenticated', 'true');
            setUser(data.user);
            
            // Show success and redirect - only once
            setStatus('success');
            if (!hasShownToast.current) {
              hasShownToast.current = true;
              showSuccess(`Welcome, ${data.user.name}!`);
            }
            
            setTimeout(() => {
              // Redirect based on user role
              if (data.user.role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
              } else {
                navigate('/user-dashboard', { replace: true });
              }
            }, 1000);
            
            return;
          }
        }
        
        throw new Error('Authentication failed');
        
      } catch (error) {
        setStatus('error');
        if (!hasShownToast.current) {
          hasShownToast.current = true;
          showError('Authentication failed. Redirecting to login...');
        }
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    };

    checkAuth();
  }, []); // Empty dependency array

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completing Google Sign In...
          </h2>
          <p className="text-gray-600">Please wait while we verify your account.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Sign In Successful!
          </h2>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Authentication Failed
        </h2>
        <p className="text-gray-600">Redirecting to login page...</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccessSimple;