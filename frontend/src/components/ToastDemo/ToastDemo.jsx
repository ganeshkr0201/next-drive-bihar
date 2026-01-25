import { useToast } from '../../context/ToastContext';

const ToastDemo = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const demoMessages = {
    success: [
      "Welcome back, John! Login successful.",
      "Registration completed successfully!",
      "Profile updated successfully!",
      "Booking confirmed! Check your email.",
      "Payment processed successfully!"
    ],
    error: [
      "Invalid email or password. Please try again.",
      "User already exists with this email address.",
      "Cannot connect to server. Please check your connection.",
      "Registration failed. Please try again later.",
      "Payment failed. Please check your card details."
    ],
    warning: [
      "Please verify your email address to continue.",
      "Your session will expire in 5 minutes.",
      "Some features may not work without location access.",
      "Please complete your profile to unlock all features.",
      "Your password will expire in 3 days."
    ],
    info: [
      "New tour packages are now available!",
      "Check out our latest car rental deals.",
      "Your booking is being processed...",
      "Welcome to NextDrive Bihar! Explore amazing destinations.",
      "Don't forget to rate your recent trip experience."
    ]
  };

  const getRandomMessage = (type) => {
    const messages = demoMessages[type];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        🎨 Toast Notification Demo
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Click the buttons below to see the improved toast notifications in action:
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => showSuccess(getRandomMessage('success'))}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Success</span>
        </button>
        
        <button
          onClick={() => showError(getRandomMessage('error'))}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Error</span>
        </button>
        
        <button
          onClick={() => showWarning(getRandomMessage('warning'))}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>Warning</span>
        </button>
        
        <button
          onClick={() => showInfo(getRandomMessage('info'))}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Info</span>
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>✨ Features: Auto-dismiss, progress bar, smooth animations, and beautiful design!</p>
      </div>
    </div>
  );
};

export default ToastDemo;