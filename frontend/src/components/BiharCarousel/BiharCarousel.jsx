import { useState, useEffect } from 'react';
import envConfig from '../../config/env';

// Import local images
import mahabodhiImage from '../../assets/mahabodhi-banner2.webp';
import nalandaImage from '../../assets/nalanda_university.webp';
import patnaSahibImage from '../../assets/patna sahib.jpeg';
import rajgirImage from '../../assets/Rajgir_safari.jpg';
import glassBridgeImage from '../../assets/glass bridge.png';

const BiharCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Bihar tourism images with descriptions
  const slides = [
    {
      id: 1,
      image: mahabodhiImage,
      title: "Mahabodhi Temple",
      location: "Bodh Gaya",
      description: "Where Buddha attained enlightenment"
    },
    {
      id: 2,
      image: nalandaImage,
      title: "Nalanda University",
      location: "Nalanda",
      description: "Ancient center of learning"
    },
    {
      id: 3,
      image: patnaSahibImage,
      title: "Patna Sahib Gurudwara",
      location: "Patna",
      description: "Sacred Sikh pilgrimage site"
    },
    {
      id: 4,
      image: rajgirImage,
      title: "Rajgir Jungal Safari",
      location: "Rajgir",
      description: "Jungal Safari"
    },
    {
      id: 5,
      image: glassBridgeImage,
      title: "Glass Bridge",
      location: "Rajgir",
      description: "Glass Bridge"
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, envConfig.carouselAutoPlayInterval);

    return () => clearInterval(timer);
  }, [slides.length, isAutoPlaying]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), envConfig.carouselAutoPlayInterval * 2); // Resume after 2x interval
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), envConfig.carouselAutoPlayInterval * 2);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), envConfig.carouselAutoPlayInterval * 2);
  };

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Explore{' '}
          <span 
            className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600"
            style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Beautiful Bihar
          </span>
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover ancient temples, historic universities, and breathtaking landscapes that tell the story of India's rich heritage
        </p>
      </div>

      {/* Main Carousel Container */}
      <div className="relative w-full max-w-7xl mx-auto">
        {/* Carousel Wrapper */}
        <div className="group relative h-[300px] md:h-[400px] lg:h-[450px] rounded-3xl overflow-hidden shadow-2xl">
          {/* Slides */}
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ease-out ${
                index === currentSlide
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105'
              }`}
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transform transition-transform duration-1000 ease-out"
                style={{ 
                  backgroundImage: `url(${slide.image})`,
                  transform: index === currentSlide ? 'scale(1)' : 'scale(1.1)'
                }}
              />
              
              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 flex items-end">
                <div className="p-8 md:p-12 lg:p-16 text-white max-w-2xl">
                  <div className={`transform transition-all duration-1000 delay-300 ${
                    index === currentSlide 
                      ? 'translate-y-0 opacity-100' 
                      : 'translate-y-8 opacity-0'
                  }`}>
                    <div className="flex items-center mb-4">
                      <svg className="w-5 h-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-blue-200 text-sm font-medium">{slide.location}</span>
                    </div>
                    
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                      {slide.title}
                    </h3>
                    
                    <p className="text-lg md:text-xl text-gray-200 mb-6 leading-relaxed">
                      {slide.description}
                    </p>
                    
                    <button className="group bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full font-medium hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                      <span className="flex items-center">
                        Explore More
                        <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-6 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full hover:bg-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100 z-10"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full hover:bg-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100 z-10"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-8 space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-500 rounded-full ${
                index === currentSlide
                  ? 'w-12 h-3 bg-gradient-to-r from-blue-600 to-green-600'
                  : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-6 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-green-600 rounded-full transition-all duration-300 ease-out"
            style={{ 
              width: `${((currentSlide + 1) / slides.length) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BiharCarousel;