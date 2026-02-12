import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../config/axios';

const Contact = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    whatsapp: '',
    subject: '',
    customSubject: '',
    message: ''
  });

  const subjectOptions = [
    { value: '', label: 'Select a subject' },
    { value: 'car-booking', label: 'Car Booking' },
    { value: 'tour-package', label: 'Tour Package' },
    { value: 'others', label: 'Others' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone number
    if (name === 'phone') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        // If checkbox is checked, also update WhatsApp number
        ...(sameAsPhone ? { whatsapp: value } : {})
      }));
      return;
    }
    
    // Special handling for WhatsApp number
    if (name === 'whatsapp') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      // Uncheck the checkbox if user manually edits WhatsApp number
      if (sameAsPhone && value !== formData.phone) {
        setSameAsPhone(false);
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Clear custom subject if not "others"
      ...(name === 'subject' && value !== 'others' ? { customSubject: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.message.trim()) {
      showError('Please fill in all required fields');
      return;
    }

    if (!formData.subject) {
      showError('Please select a subject');
      return;
    }

    if (formData.subject === 'others' && !formData.customSubject.trim()) {
      showError('Please enter a custom subject');
      return;
    }

    // Phone validation (10 digits)
    if (!/^\d{10}$/.test(formData.phone)) {
      showError('Phone number must be exactly 10 digits');
      return;
    }

    // WhatsApp validation (10 digits, optional)
    if (formData.whatsapp && !/^\d{10}$/.test(formData.whatsapp)) {
      showError('WhatsApp number must be exactly 10 digits');
      return;
    }

    setIsLoading(true);
    try {
      const finalSubject = formData.subject === 'others' 
        ? formData.customSubject.trim()
        : subjectOptions.find(opt => opt.value === formData.subject)?.label;

      const queryData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim() || null,
        subject: finalSubject,
        message: formData.message.trim(),
        category: formData.subject
      };

      const response = await api.post('/api/queries', queryData);

      if (response.data.success) {
        showSuccess('Your query has been submitted successfully! You can track its status in your dashboard.');
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          phone: '',
          whatsapp: '',
          subject: '',
          customSubject: '',
          message: ''
        });
      } else {
        showError(response.data.message || 'Failed to send query. Please try again.');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      showError('Failed to send query. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-16 md:pt-20 pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 md:mb-6">
              Get in <span className="text-blue-600">Touch</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Have questions about our services? Need assistance with booking? 
              We're here to help you plan your perfect journey across Bihar.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 md:py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Let's Start a Conversation
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Our team is ready to assist you with any questions about car rentals, 
                  tour packages, or custom travel arrangements.
                </p>
              </div>

              {/* Contact Cards */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Visit Our Office</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Bihar Sharif<br />
                        Nalanda, Bihar 803101<br />
                        India
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-8 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Call Us</h3>
                      <p className="text-gray-700 leading-relaxed">
                        <a href="tel:+918709083341" className="hover:text-green-600 transition-colors">
                          +91 87090 83341
                        </a><br />
                        Available 24/7 for emergencies
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-8 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h3>
                      <p className="text-gray-700 leading-relaxed">
                        <a href="mailto:nextdrivebihar@gmail.com" className="hover:text-purple-600 transition-colors">
                          nextdrivebihar@gmail.com
                        </a><br />
                        We'll respond within 24 hours
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-gray-50 rounded-3xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Connect With Us</h3>
                <div className="flex space-x-4">
                  <a
                    href="https://facebook.com/nextdrivebihar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  
                  <a
                    href="https://instagram.com/nextdrivebihar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  
                  <a
                    href="https://wa.me/918709083341"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 p-5 md:p-6 lg:p-8">
              <div className="mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">Send us a Message</h2>
                {user ? (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl md:rounded-2xl p-3 md:p-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center mr-2 md:mr-3 flex-shrink-0">
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm md:text-base text-gray-700">
                          Welcome back, <span className="font-semibold text-gray-900">{user.name}</span>!
                        </p>
                        <p className="text-xs md:text-sm text-gray-600">Your information has been pre-filled below.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm md:text-base text-gray-600">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2 md:mb-3">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 md:py-4 bg-gray-50 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-base"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2 md:mb-3">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 md:py-4 bg-gray-50 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-base"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                {/* Checkbox to use same number - Above inputs */}
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <input
                    type="checkbox"
                    id="sameAsPhoneContact"
                    checked={sameAsPhone}
                    onChange={(e) => {
                      setSameAsPhone(e.target.checked);
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, whatsapp: prev.phone }));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="sameAsPhoneContact" className="text-xs sm:text-sm text-gray-700 cursor-pointer select-none font-medium">
                    WhatsApp number is same as phone number
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2 md:mb-3">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 md:py-4 bg-gray-50 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-base"
                      placeholder="10-digit phone number"
                      pattern="[0-9]{10}"
                      maxLength="10"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="whatsapp" className="block text-sm font-semibold text-gray-900 mb-2 md:mb-3">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      id="whatsapp"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      disabled={sameAsPhone}
                      className="w-full px-4 py-3 md:py-4 bg-gray-50 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-base disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="10-digit WhatsApp number"
                      pattern="[0-9]{10}"
                      maxLength="10"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-900 mb-2 md:mb-3">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 md:py-4 bg-gray-50 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-base"
                    required
                  >
                    {subjectOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.subject === 'others' && (
                  <div className="animate-fadeIn">
                    <label htmlFor="customSubject" className="block text-sm font-semibold text-gray-900 mb-2 md:mb-3">
                      Custom Subject *
                    </label>
                    <input
                      type="text"
                      id="customSubject"
                      name="customSubject"
                      value={formData.customSubject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 md:py-4 bg-gray-50 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-base"
                      placeholder="Enter your custom subject"
                      required
                    />
                  </div>
                )}
                
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2 md:mb-3">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 md:py-4 bg-gray-50 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 resize-none text-base"
                    placeholder="Tell us about your requirements, preferred dates, or any specific questions..."
                    required
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 md:py-4 px-6 md:px-8 rounded-xl md:rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 md:space-x-3 group text-base"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact CTA */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4">
            Need Immediate Assistance?
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-blue-100 mb-6 md:mb-8">
            For urgent bookings or travel emergencies, call us directly or chat with us on WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <a
              href="tel:+918709083341"
              className="bg-white text-blue-600 px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center space-x-2 text-base"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Call Now</span>
            </a>
            <a
              href="https://wa.me/918709083341"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-semibold hover:bg-green-600 transition-all duration-300 flex items-center justify-center space-x-2 text-base"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
              </svg>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;