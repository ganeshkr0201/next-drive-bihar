import { useState, useEffect } from 'react';

const Toast = ({ message, type = 'success', duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Start animation
    setTimeout(() => setIsAnimating(true), 50);
    
    // Progress bar animation
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 100);

    // Auto close after duration
    const closeTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(closeTimer);
      clearInterval(progressTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = "relative max-w-sm w-full bg-white rounded-xl shadow-2xl border-0 p-0 transition-all duration-300 transform overflow-hidden";
    
    const typeStyles = {
      success: "ring-2 ring-green-100",
      error: "ring-2 ring-red-100",
      warning: "ring-2 ring-yellow-100",
      info: "ring-2 ring-blue-100"
    };

    const animationStyles = isAnimating 
      ? "translate-x-0 opacity-100 scale-100" 
      : "translate-x-full opacity-0 scale-95";

    return `${baseStyles} ${typeStyles[type]} ${animationStyles}`;
  };

  const getGradientBackground = () => {
    const gradients = {
      success: "bg-gradient-to-r from-green-50 to-emerald-50",
      error: "bg-gradient-to-r from-red-50 to-rose-50",
      warning: "bg-gradient-to-r from-yellow-50 to-amber-50",
      info: "bg-gradient-to-r from-blue-50 to-indigo-50"
    };
    return gradients[type];
  };

  const getAccentColor = () => {
    const colors = {
      success: "bg-green-500",
      error: "bg-red-500",
      warning: "bg-yellow-500",
      info: "bg-blue-500"
    };
    return colors[type];
  };

  const getIcon = () => {
    const iconStyles = "h-6 w-6 flex-shrink-0";
    
    switch (type) {
      case 'success':
        return (
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
            <svg className={`${iconStyles} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
            <svg className={`${iconStyles} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full">
            <svg className={`${iconStyles} text-yellow-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
            <svg className={`${iconStyles} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getTextColor = () => {
    const colors = {
      success: "text-green-900",
      error: "text-red-900", 
      warning: "text-yellow-900",
      info: "text-blue-900"
    };
    return colors[type];
  };

  const getProgressColor = () => {
    const colors = {
      success: "bg-green-500",
      error: "bg-red-500",
      warning: "bg-yellow-500",
      info: "bg-blue-500"
    };
    return colors[type];
  };

  return (
    <div className={getToastStyles()}>
      {/* Accent bar on left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getAccentColor()}`} />
      
      {/* Main content */}
      <div className={`${getGradientBackground()} p-4`}>
        <div className="flex items-start space-x-3">
          {getIcon()}
          
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold leading-5 ${getTextColor()}`}>
              {message}
            </p>
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-4 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200 rounded-full p-1 hover:bg-white/50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
        <div 
          className={`h-full transition-all duration-100 ease-linear ${getProgressColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default Toast;