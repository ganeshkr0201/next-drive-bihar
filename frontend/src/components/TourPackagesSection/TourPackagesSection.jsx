import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import tourService from '../../services/tourService';

const TourPackagesSection = () => {
  const [tourPackages, setTourPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback static packages in case no dynamic packages are available
  const fallbackPackages = [
    {
      id: 'static-1',
      title: "Buddhist Circuit Tour",
      duration: "5 Days / 4 Nights",
      price: "₹15,999",
      originalPrice: "₹19,999",
      image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      highlights: ["Bodh Gaya", "Nalanda", "Rajgir", "Vaishali"],
      rating: 4.8,
      reviews: 124,
      description: "Explore the sacred Buddhist sites where Lord Buddha attained enlightenment and preached his teachings."
    },
    {
      id: 'static-2',
      title: "Heritage & Culture Tour",
      duration: "4 Days / 3 Nights",
      price: "₹12,999",
      originalPrice: "₹16,999",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      highlights: ["Patna Museum", "Golghar", "Kumhrar", "Agam Kuan"],
      rating: 4.6,
      reviews: 89,
      description: "Discover Bihar's rich cultural heritage through ancient monuments and historical landmarks."
    },
    {
      id: 'static-3',
      title: "Spiritual Journey",
      duration: "3 Days / 2 Nights",
      price: "₹9,999",
      originalPrice: "₹12,999",
      image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      highlights: ["Patna Sahib", "Har Mandir", "Takht Sri Patna Sahib"],
      rating: 4.9,
      reviews: 156,
      description: "A spiritual journey through sacred Sikh and Hindu temples across Bihar."
    },
    {
      id: 'static-4',
      title: "Nature & Wildlife",
      duration: "6 Days / 5 Nights",
      price: "₹18,999",
      originalPrice: "₹23,999",
      image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      highlights: ["Valmiki National Park", "Kanwar Lake", "Rajgir Hills"],
      rating: 4.7,
      reviews: 78,
      description: "Experience Bihar's natural beauty with wildlife safaris and scenic landscapes."
    },
    {
      id: 'static-5',
      title: "Educational Tour",
      duration: "4 Days / 3 Nights",
      price: "₹11,999",
      originalPrice: "₹15,999",
      image: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      highlights: ["Nalanda University", "Vikramshila", "Odantapuri"],
      rating: 4.5,
      reviews: 92,
      description: "Visit ancient universities and centers of learning that shaped world education."
    },
    {
      id: 'static-6',
      title: "Complete Bihar Experience",
      duration: "8 Days / 7 Nights",
      price: "₹24,999",
      originalPrice: "₹32,999",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      highlights: ["All Major Sites", "Local Cuisine", "Cultural Shows"],
      rating: 4.9,
      reviews: 203,
      description: "The ultimate Bihar experience covering all major attractions, culture, and cuisine."
    }
  ];

  useEffect(() => {
    loadTourPackages();
  }, []);

  const loadTourPackages = async () => {
    setIsLoading(true);
    try {
      // Try to get dynamic packages first
      const dynamicPackages = await tourService.getTourPackages({ limit: 6 });
      
      if (dynamicPackages.length > 0) {
        // Format dynamic packages
        const formattedPackages = dynamicPackages.map(pkg => tourService.formatTourPackage(pkg));
        setTourPackages(formattedPackages);
      } else {
        // Use fallback packages if no dynamic packages
        setTourPackages(fallbackPackages);
      }
    } catch (error) {
      console.error('Error loading tour packages:', error);
      // Use fallback packages on error
      setTourPackages(fallbackPackages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full py-12">
      {/* Section Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Our{' '}
          <span 
            className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600"
            style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Tour Packages
          </span>
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Carefully curated tour packages to help you explore Bihar's rich heritage, spiritual sites, and natural beauty
        </p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Tour Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
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
            <div className="p-5">
              {/* Title and Duration */}
              <div className="mb-2">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{pkg.title}</h3>
                <div className="flex items-center text-gray-500 text-sm">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {pkg.duration}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {pkg.description}
              </p>

              {/* Highlights */}
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Highlights:</h4>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(pkg.highlights) ? pkg.highlights : []).slice(0, 3).map((highlight, index) => (
                    <span
                      key={index}
                      className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {highlight}
                    </span>
                  ))}
                  {(Array.isArray(pkg.highlights) ? pkg.highlights : []).length > 3 && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                      +{(Array.isArray(pkg.highlights) ? pkg.highlights : []).length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Reviews */}
              <div className="flex items-center mb-3 text-sm text-gray-500">
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
                
                <Link
                  to={`/tour-packages/${pkg.id}`}
                  className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-105 text-sm"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-8">
            <Link
              to="/tour-packages"
              className="inline-flex items-center bg-white border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition-all transform hover:scale-105"
            >
              View All Tour Packages
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default TourPackagesSection;