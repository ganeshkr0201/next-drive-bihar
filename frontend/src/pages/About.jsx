import { useState } from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  const [activeTab, setActiveTab] = useState('story');

  const tabs = [
    { id: 'story', label: 'Our Story', icon: '📖' },
    { id: 'mission', label: 'Mission & Vision', icon: '🎯' },
    { id: 'team', label: 'Our Team', icon: '👥' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' }
  ];

  const teamMembers = [
    {
      name: 'Avinash Kumar',
      role: 'Founder & CEO',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: 'Passionate about Bihar\'s heritage with 10+ years in tourism industry.',
      color: 'blue'
    },
    {
      name: 'Priya Singh',
      role: 'Operations Manager',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      bio: 'Ensures smooth operations and exceptional customer service experiences.',
      color: 'purple'
    },
    {
      name: 'Amit Sharma',
      role: 'Tour Guide Coordinator',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Coordinates with local guides to provide authentic cultural experiences.',
      color: 'green'
    },
    {
      name: 'Ravi Gupta',
      role: 'Fleet Manager',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
      bio: 'Maintains our premium fleet and ensures vehicle safety standards.',
      color: 'orange'
    }
  ];

  const achievements = [
    { number: '15K+', label: 'Happy Customers', icon: '😊' },
    { number: '75+', label: 'Tour Packages', icon: '🎒' },
    { number: '150+', label: 'Destinations', icon: '📍' },
    { number: '8+', label: 'Years Experience', icon: '⭐' },
    { number: '50+', label: 'Premium Vehicles', icon: '🚗' },
    { number: '24/7', label: 'Customer Support', icon: '📞' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Parallax Effect */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 pt-20 pb-32 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-500 rounded-full opacity-5 animate-spin" style={{ animationDuration: '20s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8 animate-fade-in-up">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl transform hover:scale-110 transition-transform duration-300">
                <img 
                  src="/favicon.png" 
                  alt="NextDrive Bihar" 
                  className="w-32 h-32 object-contain"
                />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                About NextDrive Bihar
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
                Your trusted partner for exploring Bihar's rich heritage through premium car rentals and curated tour experiences
              </p>
            </div>
            
            {/* Floating Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {achievements.slice(0, 4).map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.number}</div>
                  <div className="text-blue-200 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Tabs Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center mb-16">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 mx-2 mb-4 rounded-full font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
            {activeTab === 'story' && (
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
                  <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                    <p>
                      Founded with a passion for showcasing Bihar's rich cultural heritage, NextDrive Bihar began as a vision to help travelers discover the hidden gems of this historically significant state.
                    </p>
                    <p>
                      From the ancient ruins of Nalanda University to the spiritual serenity of Bodh Gaya, we've been creating unforgettable journeys that connect people with Bihar's incredible history and culture.
                    </p>
                    <p>
                      What started as a local initiative has evolved into Bihar's trusted travel partner, serving thousands of satisfied customers while maintaining our commitment to quality, authenticity, and exceptional service.
                    </p>
                  </div>
                  <div className="flex space-x-4 pt-6">
                    <Link to="/tour-packages" className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-300">
                      Explore Tours
                    </Link>
                    <Link to="/car-rental" className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300">
                      Rent a Car
                    </Link>
                  </div>
                </div>
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    alt="Bihar Heritage"
                    className="rounded-3xl shadow-2xl w-full h-[500px] object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
                </div>
              </div>
            )}

            {activeTab === 'mission' && (
              <div className="text-center max-w-4xl mx-auto">
                <h2 className="text-4xl font-bold text-gray-900 mb-12">Mission & Vision</h2>
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                    <p className="text-gray-600 leading-relaxed">
                      To provide exceptional travel experiences that showcase Bihar's rich cultural heritage while ensuring comfort, safety, and authenticity for every traveler.
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-8">
                    <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <span className="text-2xl">🔮</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                    <p className="text-gray-600 leading-relaxed">
                      To become Bihar's leading travel platform, promoting sustainable tourism that benefits local communities while preserving our cultural heritage for future generations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div>
                <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Meet Our Team</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="text-center group">
                      <div className="relative mb-6">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-32 h-32 rounded-full mx-auto object-cover shadow-lg group-hover:shadow-2xl transition-all duration-300"
                        />
                        <div className={`absolute inset-0 w-32 h-32 rounded-full mx-auto bg-${member.color}-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                      <p className={`text-${member.color}-600 font-medium mb-4`}>{member.role}</p>
                      <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div>
                <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Our Achievements</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
                      <div className="text-4xl mb-4">{achievement.icon}</div>
                      <div className="text-3xl font-bold text-gray-900 mb-2">{achievement.number}</div>
                      <div className="text-gray-600">{achievement.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What We Offer</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive travel solutions designed to make your Bihar experience exceptional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium Car Rentals</h3>
              <p className="text-gray-600 mb-6">
                Well-maintained vehicles with professional drivers for comfortable journeys across Bihar.
              </p>
              <ul className="space-y-3">
                {['Professional Drivers', '24/7 Support', 'Flexible Booking'].map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="group bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Curated Tour Packages</h3>
              <p className="text-gray-600 mb-6">
                Expertly designed tours covering Bihar's rich heritage, culture, and natural beauty.
              </p>
              <ul className="space-y-3">
                {['Expert Local Guides', 'Cultural Experiences', 'All-Inclusive Packages'].map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Custom Itineraries</h3>
              <p className="text-gray-600 mb-6">
                Personalized travel plans tailored to your interests, budget, and schedule.
              </p>
              <ul className="space-y-3">
                {['Personalized Plans', 'Budget Friendly', 'Local Insights'].map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section with Icons */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Reliability', icon: '🛡️', description: 'We ensure punctual service and maintain our commitments to every customer.' },
              { title: 'Authenticity', icon: '❤️', description: 'Experience the real Bihar through genuine local interactions and cultural immersion.' },
              { title: 'Safety', icon: '🔒', description: 'Your safety is our priority with well-maintained vehicles and trained drivers.' },
              { title: 'Sustainability', icon: '🌱', description: 'We promote responsible tourism that benefits local communities and preserves heritage.' }
            ].map((value, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110">
                  <span className="text-3xl">{value.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Explore Bihar?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of satisfied customers who have discovered Bihar's wonders with NextDrive Bihar
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/tour-packages"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105"
            >
              <span>View Tour Packages</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link 
              to="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;