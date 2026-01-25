import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import tourService from '../services/tourService';
import AuthRequiredMessage from '../components/AuthRequiredMessage/AuthRequiredMessage';

const TourPackages = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tourPackages, setTourPackages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTourPackages();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      const [packages, cats] = await Promise.all([
        tourService.getTourPackages(),
        tourService.getTourCategories()
      ]);
      
      setTourPackages(packages.map(pkg => tourService.formatTourPackage(pkg)));
      setCategories(cats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTourPackages = async () => {
    if (!selectedCategory) return;
    
    setIsLoading(true);
    try {
      const packages = await tourService.getTourPackages({ 
        category: selectedCategory 
      });
      setTourPackages(packages.map(pkg => tourService.formatTourPackage(pkg)));
    } catch (error) {
      console.error('Error loading filtered packages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Tour{' '}
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600"
              style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Packages
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover amazing tour packages designed to give you the best travel experience across Bihar's magnificent destinations.
          </p>
        </div>

        {/* Authentication Notice */}
        {!isAuthenticated && (
          <div className="mb-8">
            <AuthRequiredMessage 
              title="Login Required for Booking"
              message="Please login to book tour packages and track your bookings. You can browse packages without logging in."
              className="max-w-2xl mx-auto"
            />
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
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
              {categories.map((category) => (
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
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Tour Packages Grid */}
            {tourPackages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tourPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group"
                  >
                    {/* Package Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={pkg.image}
                        alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      
                      {/* Discount Badge */}
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Save ₹{parseInt(pkg.originalPrice.replace('₹', '').replace(',', '')) - parseInt(pkg.price.replace('₹', '').replace(',', ''))}
                      </div>
                      
                      {/* Rating Badge */}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center">
                        <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">{pkg.rating}</span>
                      </div>
                    </div>

                    {/* Package Content */}
                    <div className="p-6">
                      {/* Title and Duration */}
                      <div className="mb-3">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{pkg.title}</h3>
                        <div className="flex items-center text-gray-500 text-sm">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {pkg.duration}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {pkg.description}
                      </p>

                      {/* Highlights */}
                      {(Array.isArray(pkg.highlights) ? pkg.highlights : []).length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Highlights:</h4>
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(pkg.highlights) ? pkg.highlights : []).slice(0, 4).map((highlight, index) => (
                              <span
                                key={index}
                                className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-medium"
                              >
                                {highlight}
                              </span>
                            ))}
                            {(Array.isArray(pkg.highlights) ? pkg.highlights : []).length > 4 && (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                                +{(Array.isArray(pkg.highlights) ? pkg.highlights : []).length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Reviews */}
                      <div className="flex items-center mb-4 text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                        </svg>
                        {pkg.reviews} reviews
                      </div>

                      {/* Price and CTA */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-gray-800">{pkg.price}</span>
                            <span className="text-sm text-gray-500 line-through">{pkg.originalPrice}</span>
                          </div>
                          <span className="text-xs text-gray-500">per person</span>
                        </div>
                        
                        {/* Book Now Button */}
                        {!isAuthenticated ? (
                          <button
                            onClick={() => navigate('/login')}
                            className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-105"
                          >
                            Login to Book
                          </button>
                        ) : (
                          <Link
                            to={`/tour-packages/${pkg.id}`}
                            className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-105"
                          >
                            Book Now
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mb-4">
                  <img src="/tour_logo.svg" alt="Tour Package" className="w-16 h-16 mx-auto opacity-40" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Tour Packages Found</h3>
                <p className="text-gray-500">
                  {selectedCategory 
                    ? `No packages found in "${selectedCategory}" category.` 
                    : 'No tour packages are currently available.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TourPackages;