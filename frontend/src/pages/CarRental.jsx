import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthRequiredMessage from '../components/AuthRequiredMessage/AuthRequiredMessage';

const CarRental = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');

  // Sample car data - in a real app, this would come from an API
  const carCategories = ['Economy', 'Luxury', 'SUV', 'Tempo Traveller'];
  
  const cars = [
    {
      id: 1,
      name: 'Maruti Swift',
      category: 'Economy',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      price: '₹12',
      originalPrice: '₹15',
      priceUnit: 'per km',
      features: ['AC', '4 Seater', 'Manual', 'Petrol'],
      rating: '4.5',
      reviews: '120',
      description: 'Perfect for city rides and short trips. Fuel-efficient and comfortable for small groups.',
      specifications: {
        seating: '4+1',
        fuel: 'Petrol',
        transmission: 'Manual',
        ac: 'Yes'
      }
    },
    {
      id: 2,
      name: 'Hyundai i20',
      category: 'Economy',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      price: '₹14',
      originalPrice: '₹17',
      priceUnit: 'per km',
      features: ['AC', '5 Seater', 'Automatic', 'Petrol'],
      rating: '4.6',
      reviews: '95',
      description: 'Modern hatchback with premium features and excellent comfort for city and highway drives.',
      specifications: {
        seating: '5',
        fuel: 'Petrol',
        transmission: 'Automatic',
        ac: 'Yes'
      }
    },
    {
      id: 3,
      name: 'Toyota Innova',
      category: 'SUV',
      image: 'https://images.unsplash.com/photo-1494976688153-c91c18894e15?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      price: '₹18',
      originalPrice: '₹22',
      priceUnit: 'per km',
      features: ['AC', '7 Seater', 'Manual', 'Diesel'],
      rating: '4.7',
      reviews: '200',
      description: 'Spacious and reliable SUV perfect for family trips and group travel with ample luggage space.',
      specifications: {
        seating: '7+1',
        fuel: 'Diesel',
        transmission: 'Manual',
        ac: 'Yes'
      }
    },
    {
      id: 4,
      name: 'Mahindra Scorpio',
      category: 'SUV',
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      price: '₹20',
      originalPrice: '₹25',
      priceUnit: 'per km',
      features: ['AC', '8 Seater', 'Manual', 'Diesel'],
      rating: '4.4',
      reviews: '150',
      description: 'Rugged SUV ideal for adventure trips and rough terrain with powerful performance.',
      specifications: {
        seating: '8+1',
        fuel: 'Diesel',
        transmission: 'Manual',
        ac: 'Yes'
      }
    },
    {
      id: 5,
      name: 'BMW 3 Series',
      category: 'Luxury',
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      price: '₹25',
      originalPrice: '₹30',
      priceUnit: 'per km',
      features: ['AC', '5 Seater', 'Automatic', 'Petrol'],
      rating: '4.8',
      reviews: '75',
      description: 'Premium luxury sedan with top-notch comfort and advanced features for special occasions.',
      specifications: {
        seating: '5',
        fuel: 'Petrol',
        transmission: 'Automatic',
        ac: 'Yes'
      }
    },
    {
      id: 6,
      name: 'Mercedes E-Class',
      category: 'Luxury',
      image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      price: '₹30',
      originalPrice: '₹35',
      priceUnit: 'per km',
      features: ['AC', '5 Seater', 'Automatic', 'Petrol'],
      rating: '4.9',
      reviews: '60',
      description: 'Ultimate luxury experience with premium interiors and cutting-edge technology.',
      specifications: {
        seating: '5',
        fuel: 'Petrol',
        transmission: 'Automatic',
        ac: 'Yes'
      }
    },
    {
      id: 7,
      name: 'Tempo Traveller 12',
      category: 'Tempo Traveller',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      price: '₹22',
      originalPrice: '₹27',
      priceUnit: 'per km',
      features: ['AC', '12 Seater', 'Manual', 'Diesel'],
      rating: '4.3',
      reviews: '180',
      description: 'Perfect for group travel and family outings with comfortable seating and ample space.',
      specifications: {
        seating: '12+1',
        fuel: 'Diesel',
        transmission: 'Manual',
        ac: 'Yes'
      }
    },
    {
      id: 8,
      name: 'Tempo Traveller 17',
      category: 'Tempo Traveller',
      image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      price: '₹26',
      originalPrice: '₹32',
      priceUnit: 'per km',
      features: ['AC', '17 Seater', 'Manual', 'Diesel'],
      rating: '4.2',
      reviews: '140',
      description: 'Large capacity vehicle ideal for big groups, corporate trips, and wedding parties.',
      specifications: {
        seating: '17+1',
        fuel: 'Diesel',
        transmission: 'Manual',
        ac: 'Yes'
      }
    }
  ];

  const filteredCars = selectedCategory 
    ? cars.filter(car => car.category === selectedCategory)
    : cars;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Car{' '}
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600"
              style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Rental
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Choose from our premium fleet of well-maintained vehicles. Professional drivers, 24/7 support, and competitive rates for all your travel needs.
          </p>
        </div>

        {/* Authentication Notice */}
        {!isAuthenticated && (
          <div className="mb-8">
            <AuthRequiredMessage 
              title="Login Required for Booking"
              message="Please login to book cars and track your reservations. You can browse our fleet without logging in."
              className="max-w-2xl mx-auto"
            />
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === '' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'
              }`}
            >
              All Categories
            </button>
            {carCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === category 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Cars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCars.map((car) => (
            <div
              key={car.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group"
            >
              {/* Car Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={car.image}
                  alt={car.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Discount Badge */}
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Save ₹{parseInt(car.originalPrice.replace('₹', '')) - parseInt(car.price.replace('₹', ''))}
                </div>
                
                {/* Rating Badge */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center">
                  <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">{car.rating}</span>
                </div>

                {/* Category Badge */}
                <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {car.category}
                </div>
              </div>

              {/* Car Content */}
              <div className="p-6">
                {/* Title and Specifications */}
                <div className="mb-3">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{car.name}</h3>
                  <div className="flex items-center text-gray-500 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {car.specifications.seating} • {car.specifications.fuel} • {car.specifications.transmission}
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {car.description}
                </p>

                {/* Features */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {car.features.map((feature, index) => (
                      <span
                        key={index}
                        className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Reviews */}
                <div className="flex items-center mb-4 text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                  </svg>
                  {car.reviews} reviews
                </div>

                {/* Price and CTA - Mobile Optimized Single Line */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-gray-800">{car.price}</span>
                    <span className="text-sm text-gray-500 line-through">{car.originalPrice}</span>
                    <span className="text-xs text-gray-500">{car.priceUnit}</span>
                  </div>
                  
                  {/* Book Now Button */}
                  {!isAuthenticated ? (
                    <button
                      onClick={() => navigate('/login')}
                      className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-105 text-sm"
                    >
                      Login to Book
                    </button>
                  ) : (
                    <button
                      className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-105 text-sm"
                    >
                      Book Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Cars Found */}
        {filteredCars.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4">
              <img src="/car_logo.svg" alt="Car Rental" className="w-16 h-16 mx-auto opacity-40" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Cars Found</h3>
            <p className="text-gray-500">
              {selectedCategory 
                ? `No cars found in "${selectedCategory}" category.` 
                : 'No cars are currently available.'}
            </p>
          </div>
        )}

        {/* Additional Information */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Why Choose Our Car Rental Service?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Safe & Reliable</h3>
              <p className="text-gray-600">Well-maintained vehicles with professional drivers and comprehensive insurance coverage.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock customer support and roadside assistance for your peace of mind.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Best Prices</h3>
              <p className="text-gray-600">Competitive rates with transparent pricing and no hidden charges.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarRental;