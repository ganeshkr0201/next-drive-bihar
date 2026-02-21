import { Link } from 'react-router-dom';
import OffersCarousel from '../components/OffersCarousel/OffersCarousel';
import TourPackagesSection from '../components/TourPackagesSection/TourPackagesSection';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Offers Carousel - Full Width */}
      <section className="w-full">
        <OffersCarousel />
      </section>

      {/* Quick Booking Section */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Book Your Perfect Ride
            </h2>
            <p className="text-xl text-gray-600">
              Choose from our wide range of services
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Car Rental Card */}
            <Link
              to="/car-rental"
              className="group relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 opacity-0 group-hover:opacity-95 transition-opacity duration-500"></div>
              <div className="relative p-12">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <svg className="w-10 h-10 text-blue-600 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
                    </svg>
                  </div>
                  <svg className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 group-hover:text-white mb-4 transition-colors">
                  Car Rental
                </h3>
                <p className="text-gray-600 group-hover:text-white/90 text-lg mb-6 transition-colors">
                  Premium vehicles for every journey - from quick city trips to extended tours
                </p>
                <div className="space-y-3">
                  {['One Way Trip', 'Round Trip', 'Outstation', 'Marriage Booking', 'Monthly Rental'].map((item, idx) => (
                    <div key={idx} className="flex items-center text-gray-700 group-hover:text-white/90 transition-colors">
                      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>

            {/* Tour Packages Card */}
            <Link
              to="/tour-packages"
              className="group relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-800 opacity-0 group-hover:opacity-95 transition-opacity duration-500"></div>
              <div className="relative p-12">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <svg className="w-10 h-10 text-green-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <svg className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 group-hover:text-white mb-4 transition-colors">
                  Tour Packages
                </h3>
                <p className="text-gray-600 group-hover:text-white/90 text-lg mb-6 transition-colors">
                  Curated experiences across Bihar's rich heritage and spiritual sites
                </p>
                <div className="space-y-3">
                  {['Bodh Gaya Tours', 'Nalanda Heritage', 'Rajgir Exploration', 'Patna City Tours', 'Custom Packages'].map((item, idx) => (
                    <div key={idx} className="flex items-center text-gray-700 group-hover:text-white/90 transition-colors">
                      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Next Drive Bihar
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your trusted partner for safe, comfortable, and memorable journeys
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Safe & Secure',
                description: 'Verified drivers and well-maintained vehicles for your safety'
              },
              {
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: '24/7 Support',
                description: 'Round-the-clock customer service for your convenience'
              },
              {
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Best Prices',
                description: 'Competitive rates with transparent pricing, no hidden fees'
              },
              {
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                ),
                title: 'Premium Quality',
                description: 'Comfortable rides and memorable experiences guaranteed'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl mb-6 group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300 group-hover:scale-110">
                  <div className="text-blue-600 group-hover:text-white transition-colors">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tours */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Explore Bihar's Heritage
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover ancient wisdom and spiritual serenity with our curated tour packages
            </p>
          </div>
          <TourPackagesSection />
          <div className="text-center mt-12">
            <Link
              to="/tour-packages"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-semibold rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              View All Packages
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: '5000+', label: 'Happy Customers' },
              { number: '500+', label: 'Vehicles' },
              { number: '50+', label: 'Tour Packages' },
              { number: '24/7', label: 'Support' }
            ].map((stat, index) => (
              <div key={index} className="text-white">
                <div className="text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-100 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Real experiences from real travelers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Rajesh Kumar',
                role: 'Business Traveler',
                rating: 5,
                text: 'Excellent service! The car was spotless, driver was professional, and booking was incredibly easy. Highly recommend for business trips.'
              },
              {
                name: 'Priya Singh',
                role: 'Tourist',
                rating: 5,
                text: 'The Bodh Gaya tour package was amazing! Everything was perfectly organized and our guide was extremely knowledgeable about the history.'
              },
              {
                name: 'Amit Sharma',
                role: 'Wedding Customer',
                rating: 5,
                text: 'Booked multiple cars for our wedding. All vehicles arrived on time, were beautifully maintained, and drivers were very courteous.'
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-shadow">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Book your car or tour package today and experience the best of Bihar with Next Drive
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/car-rental"
              className="px-10 py-5 bg-white text-gray-900 rounded-full font-bold hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:scale-105 text-lg"
            >
              Book a Car Now
            </Link>
            <Link
              to="/contact"
              className="px-10 py-5 bg-transparent text-white rounded-full font-bold hover:bg-white/10 transition-all duration-300 border-2 border-white hover:scale-105 text-lg"
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
