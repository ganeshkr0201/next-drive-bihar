import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import tourService from '../services/tourService';

const TourPackages = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tourPackages, setTourPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const packages = await tourService.getTourPackages();
      setTourPackages(packages.map(pkg => tourService.formatTourPackage(pkg)));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort packages
  const filteredPackages = tourPackages
    .filter(pkg => {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = pkg.title.toLowerCase().includes(searchLower);
      const descriptionMatch = pkg.description.toLowerCase().includes(searchLower);
      const highlightsMatch = Array.isArray(pkg.highlights) && 
        pkg.highlights.some(highlight => 
          highlight.toLowerCase().includes(searchLower)
        );
      
      return titleMatch || descriptionMatch || highlightsMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return parseInt(a.price.replace(/[₹,]/g, '')) - parseInt(b.price.replace(/[₹,]/g, ''));
        case 'price-high':
          return parseInt(b.price.replace(/[₹,]/g, '')) - parseInt(a.price.replace(/[₹,]/g, ''));
        case 'duration':
          return parseInt(a.duration) - parseInt(b.duration);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Discover Bihar's
              <span className="block text-blue-600">
                Amazing Tours
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Explore Bihar's rich heritage, spiritual destinations, and natural beauty with our expertly curated tour packages
            </p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="w-full lg:flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search tour packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="w-full lg:w-auto relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="duration">Duration</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading amazing tours...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Results Header */}
            {searchTerm && (
              <div className="mb-6">
                <p className="text-gray-600">
                  Found <span className="font-semibold text-gray-900">{filteredPackages.length}</span> results for "{searchTerm}"
                </p>
              </div>
            )}

            {/* Tour Packages Grid */}
            {filteredPackages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredPackages.map((pkg) => (
                  <TourPackageCard 
                    key={pkg.id} 
                    pkg={pkg} 
                    isAuthenticated={isAuthenticated}
                    navigate={navigate}
                  />
                ))}
              </div>
            ) : (
              <EmptyState 
                searchTerm={searchTerm}
                onClearFilters={() => {
                  setSearchTerm('');
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Tour Package Card Component
const TourPackageCard = ({ pkg, isAuthenticated, navigate }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const calculateDiscount = () => {
    const original = parseInt(pkg.originalPrice.replace(/[₹,]/g, ''));
    const current = parseInt(pkg.price.replace(/[₹,]/g, ''));
    return Math.round(((original - current) / original) * 100);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
      {/* Package Image */}
      <div className="relative h-56 overflow-hidden">
        <div className={`absolute inset-0 bg-gray-200 animate-pulse ${imageLoaded ? 'hidden' : 'block'}`} />
        <img
          src={pkg.image}
          alt={pkg.title}
          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* Discount Badge */}
        {calculateDiscount() > 0 && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            {calculateDiscount()}% OFF
          </div>
        )}

        {/* Duration Badge */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center shadow-lg">
          <svg className="w-4 h-4 text-blue-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-gray-700">{pkg.duration}</span>
        </div>
      </div>

      {/* Package Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
          {pkg.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {pkg.description}
        </p>

        {/* Highlights */}
        {(Array.isArray(pkg.highlights) ? pkg.highlights : []).length > 0 && (
          <div className="mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-gray-800">Tour Highlights</h4>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed italic pl-7">
              {(Array.isArray(pkg.highlights) ? pkg.highlights : []).join(', ')}
            </p>
          </div>
        )}

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900">{pkg.price}</span>
              {pkg.originalPrice !== pkg.price && (
                <span className="text-sm text-gray-500 line-through">{pkg.originalPrice}</span>
              )}
            </div>
            <span className="text-xs text-gray-500">per person</span>
          </div>
          
          {/* Book Now Button */}
          {!isAuthenticated ? (
            <button
              onClick={() => navigate('/login', { state: { from: location } })}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Login to Book
            </button>
          ) : (
            <Link
              to={`/tour-packages/${pkg.id}`}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Book Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ searchTerm, onClearFilters }) => (
  <div className="text-center py-16">
    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
      <img src="/tour_logo.svg" alt="Tour Package" className="w-12 h-12 opacity-40" />
    </div>
    <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Tours Found</h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">
      {searchTerm 
        ? `No tour packages match "${searchTerm}". Try different keywords or clear filters.`
        : 'No tour packages are currently available.'}
    </p>
    {searchTerm && (
      <button
        onClick={onClearFilters}
        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Clear All Filters
      </button>
    )}
  </div>
);

export default TourPackages;