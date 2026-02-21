import { Link } from 'react-router-dom';

const Home = () => {
  const bookingTypes = [
    {
      title: 'One Way Trip',
      description: 'Travel from point A to B with ease',
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      color: 'blue',
      features: ['No return charges', 'Flexible timing', 'Direct route'],
      type: 'oneway'
    },
    {
      title: 'Round Trip',
      description: 'Complete journey with return included',
      icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      color: 'green',
      features: ['Return included', 'Cost effective', 'Same day service'],
      type: 'roundtrip'
    },
    {
      title: 'Outstation',
      description: 'Long distance travel across Bihar',
      icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
      color: 'purple',
      features: ['Multi-city travel', 'Experienced drivers', 'Comfortable rides'],
      type: 'outstation'
    },
    {
      title: 'Marriage Booking',
      description: 'Multiple cars for your special day',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      color: 'pink',
      features: ['Multiple vehicles', 'Decorated cars', 'Professional service'],
      type: 'marriage'
    },
    {
      title: 'Monthly Rental',
      description: 'Long-term car rental solutions',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'orange',
      features: ['Best rates', 'Flexible plans', 'Dedicated vehicle'],
      type: 'monthly'
    }
  ];

  const tourDestinations = [
    {
      title: 'Bodh Gaya',
      description: 'Sacred site of Buddha\'s enlightenment',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
    },
    {
      title: 'Nalanda',
      description: 'Ancient center of learning and wisdom',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
    },
    {
      title: 'Rajgir',
      description: 'Hot springs and ancient capital',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[80vh] sm:h-[70vh] min-h-[600px] max-h-[700px]">
        {/* Desktop Background */}
        <div 
          className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1618863099278-75222d755814?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
          }}
        ></div>
        
        {/* Mobile Background */}
        <div 
          className="md:hidden absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1667498362187-cf6b3f6b964d?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
          }}
        ></div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
        
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4 z-10">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-3 sm:mb-4 drop-shadow-2xl leading-tight">
            Next Drive Bihar
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-12 max-w-2xl drop-shadow-lg px-4">
            Premium Car Rentals & Tour Packages Across Bihar
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-md sm:max-w-none px-4 sm:px-0">
            <Link
              to="/car-rental"
              className="group relative px-8 sm:px-10 py-4 sm:py-5 bg-white text-gray-900 text-base sm:text-lg font-bold rounded-full hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 flex items-center justify-center overflow-hidden w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center group-hover:text-white transition-colors duration-300">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                </svg>
                <span>Book a Car</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
            
            <Link
              to="/tour-packages"
              className="group relative px-8 sm:px-10 py-4 sm:py-5 bg-transparent border-2 sm:border-3 border-white text-white text-base sm:text-lg font-bold rounded-full hover:bg-white hover:text-gray-900 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 flex items-center justify-center backdrop-blur-sm w-full sm:w-auto"
            >
              <div className="relative flex items-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Explore Tours</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Car Booking Types */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Car Rental Services
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Choose the perfect service for your journey
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {bookingTypes.map((type, idx) => (
              <Link
                key={idx}
                to={`/car-rental?type=${type.type}`}
                className="group bg-white border-2 border-gray-100 rounded-2xl p-6 sm:p-8 hover:border-blue-300 hover:shadow-xl transition-all"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-${type.color}-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}>
                  <svg className={`w-7 h-7 sm:w-8 sm:h-8 text-${type.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={type.icon} />
                  </svg>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{type.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{type.description}</p>
                
                <ul className="space-y-2 mb-4 sm:mb-6">
                  {type.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center text-xs sm:text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center text-blue-600 font-semibold text-sm sm:text-base group-hover:translate-x-2 transition-transform">
                  Book Now
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Tour Packages */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explore Bihar's Heritage
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover spiritual and cultural treasures
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {tourDestinations.map((dest, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={dest.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{dest.title}</h3>
                <p className="text-gray-600">{dest.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/tour-packages"
              className="inline-flex items-center px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              View All Tours
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Why Choose Us
            </h2>
            <p className="text-base sm:text-lg text-gray-600 px-4">
              Your trusted travel partner in Bihar
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                title: 'Safe & Secure',
                desc: 'Verified drivers and GPS tracking'
              },
              {
                icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                title: '24/7 Support',
                desc: 'Always here to help you'
              },
              {
                icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                title: 'Best Prices',
                desc: 'Transparent, no hidden fees'
              },
              {
                icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
                title: 'Premium Quality',
                desc: 'Well-maintained vehicles'
              }
            ].map((feature, idx) => (
              <div key={idx} className="text-center p-4 sm:p-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '5000+', label: 'Happy Customers' },
              { number: '500+', label: 'Vehicles' },
              { number: '50+', label: 'Tour Packages' },
              { number: '24/7', label: 'Support' }
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Book your car or tour package today and experience the best of Bihar
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/car-rental"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book a Car
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors"
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
