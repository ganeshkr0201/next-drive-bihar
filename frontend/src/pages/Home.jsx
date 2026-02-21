import { Link } from 'react-router-dom';
import OffersCarousel from '../components/OffersCarousel/OffersCarousel';
import TourPackagesSection from '../components/TourPackagesSection/TourPackagesSection';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero with Carousel */}
      <section className="relative h-[70vh] min-h-[500px] max-h-[700px]">
        <div className="absolute inset-0">
          <OffersCarousel />
        </div>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white mb-6 tracking-wide">
              Discover Bihar
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 font-light max-w-2xl mx-auto">
              Experience the land of Buddha, ancient universities, and timeless heritage
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/car-rental" className="px-8 py-3 bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors">
                Rent a Car
              </Link>
              <Link to="/tour-packages" className="px-8 py-3 border-2 border-white text-white font-medium hover:bg-white hover:text-gray-900 transition-colors">
                Explore Tours
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">What We Offer</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 md:gap-16 max-w-5xl mx-auto">
            {/* Car Rental */}
            <div className="text-center md:text-left">
              <div className="mb-6">
                <svg className="w-16 h-16 mx-auto md:mx-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-4">Car Rental Services</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Premium vehicles for every journey. From business trips to wedding celebrations, we provide reliable transportation across Bihar.
              </p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li>• One Way & Round Trip</li>
                <li>• Outstation Travel</li>
                <li>• Wedding & Events</li>
                <li>• Monthly Rentals</li>
              </ul>
              <Link to="/car-rental" className="inline-block text-blue-600 font-medium hover:text-blue-700">
                Book Now →
              </Link>
            </div>

            {/* Tour Packages */}
            <div className="text-center md:text-left">
              <div className="mb-6">
                <svg className="w-16 h-16 mx-auto md:mx-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-4">Curated Tour Packages</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Explore Bihar's spiritual and cultural heritage with expertly designed tours. Experience history, spirituality, and natural beauty.
              </p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li>• Bodh Gaya Pilgrimage</li>
                <li>• Nalanda University Ruins</li>
                <li>• Rajgir Hot Springs</li>
                <li>• Custom Itineraries</li>
              </ul>
              <Link to="/tour-packages" className="inline-block text-green-600 font-medium hover:text-green-700">
                Explore Tours →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bihar Heritage Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">Explore Bihar's Heritage</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From the enlightenment of Buddha to the ancient seat of learning, Bihar is a treasure trove of history and spirituality
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                title: 'Bodh Gaya',
                desc: 'Where Buddha attained enlightenment under the Bodhi tree',
                icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
              },
              {
                title: 'Nalanda',
                desc: 'Ancient university that attracted scholars from across Asia',
                icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
              },
              {
                title: 'Rajgir',
                desc: 'Ancient capital surrounded by hills and hot springs',
                icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
              }
            ].map((place, idx) => (
              <div key={idx} className="bg-white p-8 text-center hover:shadow-lg transition-shadow">
                <svg className="w-12 h-12 mx-auto mb-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={place.icon} />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-3">{place.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{place.desc}</p>
              </div>
            ))}
          </div>

          <TourPackagesSection />

          <div className="text-center mt-12">
            <Link to="/tour-packages" className="inline-block px-8 py-3 border-2 border-blue-600 text-blue-600 font-medium hover:bg-blue-600 hover:text-white transition-colors">
              View All Destinations
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Minimalist */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">Why Travel With Us</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Safe & Secure', desc: 'Verified drivers, GPS tracking' },
              { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: '24/7 Support', desc: 'Always here to help' },
              { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Best Prices', desc: 'Transparent, no hidden fees' },
              { icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', title: 'Premium Quality', desc: 'Well-maintained vehicles' }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats - Minimalist */}
      <section className="py-16 md:py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '5000+', label: 'Happy Travelers' },
              { number: '500+', label: 'Vehicles' },
              { number: '50+', label: 'Destinations' },
              { number: '24/7', label: 'Support' }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-5xl font-light text-white mb-2">{stat.number}</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Clean */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">Traveler Stories</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                text: 'Professional service from start to finish. The car was immaculate and the driver knew all the best routes. Perfect for business travel.',
                name: 'Rajesh Kumar',
                role: 'Business Traveler'
              },
              {
                text: 'Our Bodh Gaya tour was life-changing. The guide was knowledgeable and passionate about Bihar\'s history. Highly recommended!',
                name: 'Priya Singh',
                role: 'Spiritual Tourist'
              },
              {
                text: 'Booked cars for our wedding. Everything was perfect - timing, presentation, and service. Made our special day even better.',
                name: 'Amit Sharma',
                role: 'Wedding Customer'
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="border-l-4 border-blue-600 pl-6 py-4">
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <div className="font-medium text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Minimalist */}
      <section className="py-20 md:py-28 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            Begin Your Bihar Journey
          </h2>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto font-light">
            Whether you need a car for the day or a complete tour experience, we're here to make your journey memorable
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/car-rental" className="px-8 py-3 bg-white text-blue-600 font-medium hover:bg-gray-100 transition-colors">
              Book a Car
            </Link>
            <Link to="/contact" className="px-8 py-3 border-2 border-white text-white font-medium hover:bg-white hover:text-blue-600 transition-colors">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
