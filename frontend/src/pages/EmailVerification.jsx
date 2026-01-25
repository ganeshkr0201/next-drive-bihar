import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../config/axios.js';
import envConfig from '../config/env';

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showInfo } = useToast();
  const { setUser } = useAuth();
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Get email and context flags from location state
  const email = location.state?.email;
  const fromLogin = location.state?.fromLogin;
  const fromRegistration = location.state?.fromRegistration;

  useEffect(() => {
    // Redirect to register if no email provided
    if (!email) {
      navigate('/register', { replace: true });
      return;
    }

    // Start countdown for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [email, navigate, countdown]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      showError('Please enter a valid 6-digit verification code');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp,
        autoLogin: fromLogin || fromRegistration // Auto-login for both login and registration
      });

      if (response.data.autoLogin && response.data.user) {
        // User was automatically logged in
        if (fromRegistration) {
          showSuccess('Welcome to NextDrive Bihar! Your account has been verified and you are now logged in.');
        } else {
          showSuccess('Email verified and logged in successfully!');
        }
        
        // Update auth context with user data
        setUser(response.data.user);
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/user-dashboard', { replace: true });
        }, 2000);
      } else {
        // Just verified, redirect to login
        showSuccess('Email verified successfully! You can now login.');
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }

    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed. Please try again.';
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setIsResending(true);

    try {
      const response = await api.post('/auth/resend-otp', { email });
      
      showSuccess('Verification code sent successfully!');
      setCountdown(envConfig.otpResendCooldown); // Configurable countdown
      setOtp(''); // Clear current OTP

    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend verification code.';
      showError(message);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {fromLogin ? 'Complete Your Login' : 
             fromRegistration ? 'Welcome to NextDrive Bihar!' : 
             'Verify Your Email'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {fromLogin 
              ? 'Please verify your email to complete the login process'
              : fromRegistration
              ? 'Please verify your email to complete your registration'
              : 'We\'ve sent a verification code to'
            }
          </p>
          {!fromLogin && !fromRegistration && <p className="font-medium text-blue-600">{email}</p>}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="mt-1">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="Enter 6-digit code"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-lg font-mono tracking-widest"
                  maxLength="6"
                  required
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {fromLogin 
                  ? `Enter the 6-digit code sent to ${email} to complete your login`
                  : fromRegistration
                  ? `Enter the 6-digit code sent to ${email} to activate your account`
                  : 'Enter the 6-digit code sent to your email'
                }
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  fromLogin ? 'Verify & Login' : 
                  fromRegistration ? 'Verify & Get Started' : 
                  'Verify Email'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Didn't receive the code?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleResendOtp}
                disabled={isResending || countdown > 0}
                className="text-blue-600 hover:text-blue-500 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Sending...
                  </span>
                ) : countdown > 0 ? (
                  `Resend code in ${countdown}s`
                ) : (
                  'Resend verification code'
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate(fromLogin ? '/login' : '/register')}
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              ← Back to {fromLogin ? 'login' : 'registration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;