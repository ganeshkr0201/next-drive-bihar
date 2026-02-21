import { Link } from 'react-router-dom';
import OffersCarousel from '../components/OffersCarousel/OffersCarousel';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Carousel */}
      <section className="relative h-screen min-h-[600px]">
        {/* Carousel Background */}
        <div className="absolute inset-0 z-0">
          <OffersCarousel />
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60 z-10"></div>
        
        {/* Content */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight drop-shadow-2xl">
            Next Drive Bihar
          </h1>
          <p className="text-xl md:text-2xl text-white/95 mb-12 max-w-3xl drop-shadow-lg">
            Your trusted partner for car rentals and tour experiences across Bihar
          </p>
          <div className="flex flex-col sm:flex-row gap-6">
            <Link
              to="/car-rental"
              className="group px-10 py-4 bg-white text-gray-900 text-lg font-semibold rounded-md hover:bg-gray-100 transition-all flex items-center justify-center shadow-2xl"
            >
              Book a Car
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to="/tour-packages"
              className="group px-10 py-4 bg-transparent border-2 border-white text-white text-lg font-semibold rounded-md hover:bg-white hover:text-gray-900 transition-all flex items-center justify-center backdrop-blur-sm"
            >
              Explore Tours
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
          <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Car Rental */}
            <div className="order-2 lg:order-1">
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full mb-6">
                CAR RENTAL
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Premium Vehicles for Every Journey
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                From business meetings to family celebrations, our fleet of well-maintained vehicles ensures you travel in comfort and style. Professional drivers, transparent pricing, and 24/7 support.
              </p>
              
              <div className="space-y-4 mb-10">
                {[
                  { title: 'One Way & Round Trip', desc: 'Flexible booking for your convenience' },
                  { title: 'Outstation Travel', desc: 'Long-distance journeys made comfortable' },
                  { title: 'Wedding & Events', desc: 'Multiple vehicles for special occasions' },
                  { title: 'Monthly Rentals', desc: 'Cost-effective long-term solutions' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/car-rental"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700 transition-colors"
              >
                Book Now
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-64 h-64 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tour Packages Section */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-64 h-64 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <div className="inline-block px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-full mb-6">
                TOUR PACKAGES
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Discover Bihar's Rich Heritage
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Experience the spiritual and cultural treasures of Bihar with our expertly curated tour packages. From ancient Buddhist sites to historical landmarks, explore the land where Buddha attained enlightenment.
              </p>
              
              <div className="space-y-4 mb-10">
                {[
                  { title: 'Bodh Gaya Pilgrimage', desc: 'Visit the sacred Mahabodhi Temple' },
                  { title: 'Nalanda University', desc: 'Explore ancient ruins of learning' },
                  { title: 'Rajgir Hot Springs', desc: 'Natural beauty and spirituality' },
                  { title: 'Custom Itineraries', desc: 'Personalized tours for your group' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/tour-packages"
                className="inline-flex items-center px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-md hover:bg-green-700 transition-colors"
              >
                Explore Tours
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Next Drive Bihar
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're committed to making your journey safe, comfortable, and memorable
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              {
                icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                title: 'Safe & Secure',
                desc: 'All drivers are verified and vehicles are GPS-tracked for your safety'
              },
              {
                icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                title: '24/7 Support',
                desc: 'Our customer service team is always available to assist you'
              },
              {
                icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                title: 'Best Prices',
                desc: 'Transparent pricing with no hidden charges or surprise fees'
              },
              {
                icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
                title: 'Premium Quality',
                desc: 'Well-maintained vehicles with modern amenities and comfort'
              }
            ].map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '5000+', label: 'Happy Customers' },
              { number: '500+', label: 'Vehicles' },
              { number: '50+', label: 'Tour Packages' },
              { number: '24/7', label: 'Support Available' }
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-5xl md:text-6xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-blue-100 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Book your car or tour package today and experience the best of Bihar with Next Drive
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/car-rental"
              className="px-10 py-4 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700 transition-colors"
            >
              Book a Car Now
            </Link>
            <Link
              to="/contact"
              className="px-10 py-4 bg-white text-gray-900 text-lg font-semibold rounded-md hover:bg-gray-100 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
