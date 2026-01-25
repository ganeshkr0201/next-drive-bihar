import { Link } from 'react-router-dom';
import AnimatedWelcome from '../components/AnimatedWelcome/AnimatedWelcome';
import BiharCarousel from '../components/BiharCarousel/BiharCarousel';
import TourPackagesSection from '../components/TourPackagesSection/TourPackagesSection';

const Home = () => {
  return (
    <div className="pt-4 pb-16">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <AnimatedWelcome />
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Link 
              to="/car-rental"
              className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Rent Your Car Now
            </Link>
            <Link 
              to="/tour-packages"
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-600 hover:text-white transition-all"
            >
              Explore Tour Packages
            </Link>
          </div>
        </div>

        {/* Bihar Tourism Carousel */}
        <div className="mt-16">
          <BiharCarousel />
        </div>

        {/* Tour Packages Section */}
        <div className="mt-12">
          <TourPackagesSection />
        </div>

        {/* Why Choose Bihar Tourism Section */}
        <div className="mt-16 bg-gradient-to-br from-blue-50 via-white to-green-50 py-16 rounded-3xl">
          <div className="max-w-6xl mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Why Choose{' '}
                <span 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600"
                  style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  Bihar Tourism
                </span>
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Discover the land where history, spirituality, and culture converge to create unforgettable experiences
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {/* Spiritual Heritage */}
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">Spiritual Heritage</h3>
                <p className="text-gray-600 text-center">
                  Home to Bodh Gaya where Buddha attained enlightenment, and sacred sites of multiple religions
                </p>
              </div>

              {/* Ancient Learning */}
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">Ancient Learning</h3>
                <p className="text-gray-600 text-center">
                  Visit Nalanda and Vikramshila, the world's first universities that shaped global education
                </p>
              </div>

              {/* Rich Culture */}
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">Rich Culture</h3>
                <p className="text-gray-600 text-center">
                  Experience vibrant festivals, traditional arts, authentic cuisine, and warm hospitality
                </p>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">2500+</div>
                <div className="text-gray-600 text-sm">Years of History</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">50+</div>
                <div className="text-gray-600 text-sm">Tourist Destinations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">10+</div>
                <div className="text-gray-600 text-sm">UNESCO Sites</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">100K+</div>
                <div className="text-gray-600 text-sm">Happy Travelers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Explore Bihar?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of travelers who have discovered the magic of Bihar with NextDrive Bihar
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/tour-packages"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              Book Your Journey
            </Link>
            <Link 
              to="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-white hover:text-blue-600 transition-all"
            >
              Plan Custom Trip
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;