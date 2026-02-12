import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import our_story from '../assets/our_story.jpeg';
import avinash from "../assets/avinash.jpeg";
import sonu from "../assets/sonu.jpeg";
import amit from "../assets/amit.jpeg";
import no_img from '../assets/no_img.png';



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
      role: 'Founder',
      image: avinash,
      bio: 'Passionate about Bihar\'s heritage with 3+ years in tourism industry.',
      color: 'blue',
      contact: '9835193378',
      email: "avinash@nextdrivebihar.com"
    },
    {
      name: 'Sonu Kumar',
      role: 'Operation Manager',
      image: sonu,
      bio: 'Maintains our premium fleet and ensures vehicle safety standards.',
      color: 'green',
      contact: '8271896816',
      email: "sonu@nextdrivebihar.in"
    },
    {
      name: 'Amit Kumar',
      role: 'Tour Guide Coordinator',
      image: amit,
      bio: 'Coordinates with local guides to provide authentic cultural experiences.',
      color: 'orange',
      contact: '6200294846',
      email: "amit@nextdrivebihar.in"
    }
  ];

const achievements = [
  { number: 5000, suffix: "+", label: "Happy Customers", icon: "😊" },
  { number: 15, suffix: "+", label: "Tour Packages", icon: "🎒" },
  { number: 50, suffix: "+", label: "Destinations", icon: "📍" },
  { number: 2, suffix: "+", label: "Years Experience", icon: "⭐" },
  { number: 15, suffix: "+", label: "Premium Vehicles", icon: "🚗" },
  { number: 24, suffix: "/7", label: "Customer Support", icon: "📞" }
];


const Counter = ({ end, suffix = "", duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
};

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Parallax Effect */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 pt-16 sm:pt-20 pb-20 sm:pb-32 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-500 rounded-full opacity-5 animate-spin" style={{ animationDuration: '20s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 sm:mb-8 animate-fade-in-up">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl transform hover:scale-110 transition-transform duration-300">
                <img 
                  src="/favicon.png" 
                  alt="NextDrive Bihar" 
                  className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
                />
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
                About NextDrive Bihar
              </h1>
              <p className="text-base sm:text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed px-4">
                    Your trusted travel partner for exploring Bihar’s rich heritage through premium car rentals and thoughtfully curated tour experiences. Travel in comfort and safety — arrive with confidence
              </p>
            </div>
            
            {/* Floating Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mt-10 sm:mt-16">
              {achievements.slice(0, 4).map((stat, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/20 transition-all duration-300"
                >
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{stat.icon}</div>

                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    <Counter end={stat.number} suffix={stat.suffix} />
                  </div>

                  <div className="text-blue-200 text-xs sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Tabs Section */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center mb-10 sm:mb-16 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <span className="text-lg sm:text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8 md:p-12">
            {activeTab === 'story' && (
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
                  <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                    <p>
  <b>Driving Bihar Forward - ( बिहार को आगे बढ़ाते हुए )</b>
</p>
<p>
Next Drive Bihar was founded with a simple vision — to make travel in Bihar safe, affordable, and comfortable for everyone. What started as a small local car rental service has grown into a trusted travel partner for families, tourists, students, and business professionals.
<br></br>
Based in Bihar Sharif, we proudly serve customers across Bihar including Patna, Rajgir, Gaya, Nalanda, and nearby regions. Our goal has always been clear:
</p>
✔ Reliable and on-time service
<br></br>
✔ Well-maintained and clean vehicles
<br></br>
✔ Professional and polite drivers
<br></br>
✔ Transparent pricing with no hidden charges
<p></p>
<p>
We understand that every journey is important — whether it’s a family trip, a business meeting, an airport transfer, or a weekend getaway. That’s why we focus on comfort, safety, and customer satisfaction in every ride.
</p><p>
At Next Drive Bihar, we don’t just provide cars — we provide peace of mind. Our team works 24/7 to ensure smooth bookings, quick responses on WhatsApp, and hassle-free travel experiences.
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
                    src={our_story}
                    alt="Bihar Heritage"
                    className="rounded-3xl shadow-2xl w-full h-[500px] object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
                </div>
              </div>
            )}

            {activeTab === 'mission' && (
              <div className="text-center max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold text-gray-900 mb-12">Mission, Vision & Commitment</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                    <p className="text-gray-600 leading-relaxed">
Our mission is to redefine road travel in Bihar by delivering safe, affordable, and dependable transportation services. Safety is our highest priority — from professionally trained drivers and regularly sanitized, well-maintained vehicles to strict safety standards and 24/7 customer support.
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-8">
                    <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <span className="text-2xl">🔮</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                    <p className="text-gray-600 leading-relaxed">
Our vision is to become Bihar’s most trusted and customer-focused car rental company, setting the benchmark for safety, reliability, and service excellence. We aim to connect cities, communities, and people through seamless travel experiences powered by innovation, integrity, and care.
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-8">
                    <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <span className="text-2xl">🔮</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment</h3>
                    <p className="text-gray-600 leading-relaxed">
At Next Drive Bihar, safety is not just a priority — it is our promise. We ensure experienced and verified drivers, clean and regularly sanitized vehicles, transparent billing with no hidden charges, 24/7 customer assistance, and punctual, professional service — so every journey is secure, comfortable, and worry-free.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div>
                <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Meet Our Team</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {teamMembers.map((member, index) => (
                    <div 
                      key={index} 
                      className="text-center group bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative mb-6 flex justify-center">
                        <div className="relative w-32 h-32">
                          <img
                            src={member.image}
                            alt={member.name}
                            className="w-full h-full aspect-square rounded-full object-cover shadow-lg group-hover:shadow-2xl transition-all duration-300 border-4 border-white"
                          />
                          <div className={`absolute inset-0 rounded-full bg-${member.color}-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                      <p className={`text-${member.color}-600 font-medium mb-4`}>{member.role}</p>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">{member.bio}</p>
                      
                      <div className="flex flex-col items-center justify-center text-center text-gray-700 text-sm leading-relaxed space-y-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-gray-200 shadow-sm">
                        {/* Email */}
                        {member?.email && (
                          <div className="flex items-center justify-center gap-2 w-full">
                            <svg
                              className="w-4 h-4 text-purple-600 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            <a
                              href={`mailto:${member.email}`}
                              className="text-sm font-medium text-purple-600 hover:text-purple-800 transition duration-200 break-all"
                            >
                              {member.email}
                            </a>
                          </div>
                        )}

                        {/* WhatsApp Contact */}
                        {member?.contact && (
                          <div className="flex items-center justify-center gap-2 w-full">
                            <svg
                              className="w-4 h-4 text-green-600 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                            <a
                              href={`https://wa.me/${member.contact.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-green-600 hover:text-green-800 transition duration-200"
                            >
                              {member.contact}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div>
                <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 text-center mb-8 sm:mb-12">Our Achievements</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
                      <div className="text-2xl sm:text-4xl mb-2 sm:mb-4">{achievement.icon}</div>
                      <div className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{achievement.number}{achievement.suffix}</div>
                      <div className="text-xs sm:text-base text-gray-600">{achievement.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">What We Offer</h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Comprehensive travel solutions designed to make your Bihar experience exceptional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl sm:rounded-3xl p-5 sm:p-8 hover:shadow-2xl transition-all duration-500">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Premium Car Rentals</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Well-maintained vehicles with professional drivers for comfortable journeys across Bihar.
              </p>
              <ul className="space-y-2 sm:space-y-3">
                {['Professional Drivers', '24/7 Support', 'Flexible Booking'].map((feature, index) => (
                  <li key={index} className="flex items-center text-sm sm:text-base text-gray-700">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="group bg-gradient-to-br from-green-50 to-green-100 rounded-2xl sm:rounded-3xl p-5 sm:p-8 hover:shadow-2xl transition-all duration-500">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Curated Tour Packages</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Expertly designed tours covering Bihar's rich heritage, culture, and natural beauty.
              </p>
              <ul className="space-y-2 sm:space-y-3">
                {['Expert Local Guides', 'Cultural Experiences', 'All-Inclusive Packages'].map((feature, index) => (
                  <li key={index} className="flex items-center text-sm sm:text-base text-gray-700">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl sm:rounded-3xl p-5 sm:p-8 hover:shadow-2xl transition-all duration-500">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Custom Itineraries</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Personalized travel plans tailored to your interests, budget, and schedule.
              </p>
              <ul className="space-y-2 sm:space-y-3">
                {['Personalized Plans', 'Budget Friendly', 'Local Insights'].map((feature, index) => (
                  <li key={index} className="flex items-center text-sm sm:text-base text-gray-700">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
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
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Our Core Values</h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { title: 'Reliability', icon: '🛡️', description: 'We ensure punctual service and maintain our commitments to every customer.' },
              { title: 'Authenticity', icon: '❤️', description: 'Experience the real Bihar through genuine local interactions and cultural immersion.' },
              { title: 'Safety', icon: '🔒', description: 'Your safety is our priority with well-maintained vehicles and trained drivers.' },
              { title: 'Sustainability', icon: '🌱', description: 'We promote responsible tourism that benefits local communities and preserves heritage.' }
            ].map((value, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110">
                  <span className="text-2xl sm:text-3xl">{value.icon}</span>
                </div>
                <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-2 sm:mb-4">{value.title}</h3>
                <p className="text-xs sm:text-base text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
            Ready to Explore Bihar?
          </h2>
          <p className="text-base sm:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of satisfied customers who have discovered Bihar's wonders with NextDrive Bihar
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link 
              to="/tour-packages"
              className="bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>View Tour Packages</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link 
              to="/contact"
              className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300"
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