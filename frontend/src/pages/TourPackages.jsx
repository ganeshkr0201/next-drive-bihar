import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import tourService from '../services/tourService';

const TourPackages = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
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
        case 'rating':
          return parseFloat(b.rating) - parseFloat(a.rating);
        case 'duration':
          return parseInt(a.duration) - parseInt(b.duration);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in-up">
            Explore Bihar's Wonders
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Discover curated tour packages showcasing Bihar's rich heritage and natural beauty
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="mb-12 flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search tours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-500 shadow-lg transition-all text-base"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-6 py-4 bg-white border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-500 shadow-lg transition-all text-base font-medium"
          >
            <option value="featured">✨ Featured</option>
            <option value="price-low">💰 Price: Low to High</option>
            <option value="price-high">💎 Price: High to Low</option>
            <option value="duration">⏱️ Duration</option>
          </select>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Results Count */}
            {searchTerm && (
              <div className="mb-8">
                <p className="text-lg text-gray-700 font-medium">
                  {filteredPackages.length} {filteredPackages.length === 1 ? 'result' : 'results'} found
                </p>
              </div>
            )}

            {/* Tour Packages Grid */}
            {filteredPackages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                onClearFilters={() => setSearchTerm('')}
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
    <div className="group bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
      {/* Package Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
        <img
          src={pkg.image}
          alt={pkg.title}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Discount Badge */}
        {calculateDiscount() > 0 && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            {calculateDiscount()}% OFF
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>

      {/* Package Content */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {pkg.title}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-gray-700">{pkg.duration}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 line-clamp-2 leading-relaxed">
          {pkg.description}
        </p>

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-600">{pkg.price}</span>
              {pkg.originalPrice !== pkg.price && (
                <span className="text-sm text-gray-400 line-through">{pkg.originalPrice}</span>
              )}
            </div>
            <span className="text-xs text-gray-500">per person</span>
          </div>
          
          {/* Book Now Button */}
          {!isAuthenticated ? (
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Login
            </button>
          ) : (
            <Link
              to={`/tour-packages/${pkg.id}`}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
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
  <div className="text-center py-20 bg-white rounded-3xl shadow-xl">
    <div className="text-6xl mb-6">🔍</div>
    <h3 className="text-3xl font-bold text-gray-900 mb-4">No tours found</h3>
    <p className="text-gray-600 text-lg mb-8">
      {searchTerm 
        ? `No results for "${searchTerm}"`
        : 'No tour packages available at the moment'}
    </p>
    {searchTerm && (
      <button
        onClick={onClearFilters}
        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
      >
        Clear Search
      </button>
    )}
  </div>
);

export default TourPackages;
