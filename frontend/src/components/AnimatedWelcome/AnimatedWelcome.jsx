import { useState, useEffect } from 'react';

const AnimatedWelcome = () => {
  const [typedText, setTypedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const fullText = 'NextDrive Bihar';
  
  useEffect(() => {
    let currentIndex = 0;
    let typingTimeout;
    let restartTimeout;
    let fadeTimeout;
    
    const typeNextCharacter = () => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex));
        currentIndex++;
        
        // More consistent typing speed for smoother effect
        const delay = currentIndex === fullText.length ? 300 : 
                     fullText[currentIndex - 1] === ' ' ? 150 : 
                     120; // More consistent timing
        
        typingTimeout = setTimeout(typeNextCharacter, delay);
      } else {
        setIsTypingComplete(true);
        
        // Wait 4 seconds, then fade out and restart
        restartTimeout = setTimeout(() => {
          // Fade out effect
          setIsVisible(false);
          
          fadeTimeout = setTimeout(() => {
            // Reset everything
            setTypedText('');
            setIsTypingComplete(false);
            currentIndex = 0;
            
            // Fade back in and start typing
            setIsVisible(true);
            setTimeout(typeNextCharacter, 500);
          }, 300); // Fade duration
        }, 4000);
      }
    };
    
    // Start typing after initial delay
    const startDelay = setTimeout(typeNextCharacter, 800);
    
    return () => {
      clearTimeout(startDelay);
      clearTimeout(typingTimeout);
      clearTimeout(restartTimeout);
      clearTimeout(fadeTimeout);
    };
  }, []);

  return (
    <div className="w-full text-center pt-6 pb-4">
      {/* Welcome to NextDrive Bihar - mixed styling */}
      <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-4 min-h-[60px] md:min-h-[80px] lg:min-h-[100px] xl:min-h-[120px] flex items-center justify-center flex-wrap gap-2 md:gap-4">
        {/* Static "Welcome to" text */}
        <span className="text-gray-800">
          Welcome to
        </span>
        
        {/* Animated "NextDrive Bihar" with gradient and smooth transitions */}
        <span className="flex items-center">
          <span 
            className={`text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 transition-all duration-300 ease-in-out ${
              isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
            }`}
            style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {typedText}
          </span>
          {!isTypingComplete && isVisible && (
            <span className="animate-typing-cursor text-blue-600 ml-2 text-3xl md:text-5xl lg:text-6xl xl:text-7xl transition-opacity duration-200">|</span>
          )}
        </span>
      </h1>
      
      {/* Subtitle */}
      <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-4 max-w-4xl mx-auto leading-relaxed">
        Your trusted partner for{' '}
        <span 
          className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 font-semibold"
          style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          tours and travels
        </span>{' '}
        in Bihar
      </p>
      
      {/* Decorative underline */}
      <div className="w-2/5 md:w-1/3 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-full mx-auto" />
    </div>
  );
};

export default AnimatedWelcome;