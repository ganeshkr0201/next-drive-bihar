import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../config/axios';
import envConfig from '../../config/env';

const UserQueries = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [queries, setQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewQueryForm, setShowNewQueryForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New query form state
  const [queryForm, setQueryForm] = useState({
    subject: '',
    customSubject: '',
    category: '',
    message: '',
    preferredContactDate: '',
    preferredContactTime: '10:00',
    urgency: 'medium',
    phone: '',
    whatsapp: ''
  });

  const subjectOptions = [
    { value: '', label: 'Select a subject' },
    { value: 'car-booking', label: 'Car Booking Issue' },
    { value: 'tour-package', label: 'Tour Package Inquiry' },
    { value: 'payment', label: 'Payment Related' },
    { value: 'cancellation', label: 'Booking Cancellation' },
    { value: 'modification', label: 'Booking Modification' },
    { value: 'refund', label: 'Refund Request' },
    { value: 'complaint', label: 'Service Complaint' },
    { value: 'feedback', label: 'Feedback & Suggestions' },
    { value: 'others', label: 'Others' }
  ];

  const urgencyOptions = [
    { value: 'low', label: 'Low Priority', color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { value: 'high', label: 'High Priority', color: 'text-orange-600', bg: 'bg-orange-50' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600', bg: 'bg-red-50' }
  ];

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/queries/my-queries');

      if (response.data.success) {
        setQueries(response.data.queries || []);
      } else {
        showError(response.data.message || 'Failed to load queries');
      }
    } catch (error) {
      console.error('Load queries error:', error);
      showError('Failed to load queries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateQuery = async (queryId, rating, feedback = '') => {
    try {
      const response = await api.patch(`/api/queries/${queryId}/rate`, {
        rating,
        feedback
      });

      if (response.data.success) {
        showSuccess('Thank you for your feedback!');
        loadQueries(); // Reload to show updated rating
      } else {
        showError(response.data.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Rate query error:', error);
      showError('Failed to submit rating');
    }
  };

  const handleNewQuerySubmit = async (e) => {
    e.preventDefault();

    if (!queryForm.subject || !queryForm.message.trim()) {
      showError('Please fill in all required fields');
      return;
    }

    if (queryForm.subject === 'others' && !queryForm.customSubject.trim()) {
      showError('Please enter a custom subject');
      return;
    }

    // Phone validation (10 digits, optional)
    if (queryForm.phone && !/^\d{10}$/.test(queryForm.phone)) {
      showError('Phone number must be exactly 10 digits');
      return;
    }

    // WhatsApp validation (10 digits, optional)
    if (queryForm.whatsapp && !/^\d{10}$/.test(queryForm.whatsapp)) {
      showError('WhatsApp number must be exactly 10 digits');
      return;
    }

    // Validate preferred contact date is in the future (if provided)
    if (queryForm.preferredContactDate) {
      const contactDateTime = new Date(`${queryForm.preferredContactDate}T${queryForm.preferredContactTime}`);
      const now = new Date();
      if (contactDateTime <= now) {
        showError('Preferred contact date and time must be in the future');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const finalSubject = queryForm.subject === 'others' 
        ? queryForm.customSubject.trim()
        : subjectOptions.find(opt => opt.value === queryForm.subject)?.label;

      const queryData = {
        name: user.name,
        email: user.email,
        phone: queryForm.phone || user.phone || '',
        whatsapp: queryForm.whatsapp || '',
        subject: finalSubject,
        message: queryForm.message.trim(),
        category: queryForm.subject,
        urgency: queryForm.urgency,
        preferredContactDate: queryForm.preferredContactDate || null,
        preferredContactTime: queryForm.preferredContactTime || null
      };

      const response = await api.post('/api/queries', queryData);

      if (response.data.success) {
        showSuccess('Your query has been submitted successfully! We will get back to you soon.');
        setShowNewQueryForm(false);
        setQueryForm({
          subject: '',
          customSubject: '',
          category: '',
          message: '',
          preferredContactDate: '',
          preferredContactTime: '10:00',
          urgency: 'medium',
          phone: '',
          whatsapp: ''
        });
        loadQueries(); // Reload queries to show the new one
      } else {
        showError(response.data.message || 'Failed to submit query. Please try again.');
      }
    } catch (error) {
      console.error('Submit query error:', error);
      showError('Failed to submit query. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Support Queries</h3>
          <p className="text-sm text-gray-600">Get help from our support team</p>
        </div>
        <button
          onClick={() => setShowNewQueryForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Query
        </button>
      </div>

      {queries.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No queries yet</h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Submit your first query to get help from our support team
          </p>
          <button
            onClick={() => setShowNewQueryForm(true)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Submit Your First Query
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {queries.map((query) => (
            <QueryCard key={query._id} query={query} onRate={handleRateQuery} />
          ))}
        </div>
      )}

      {/* New Query Modal */}
      {showNewQueryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2 flex items-center">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    Submit New Query
                  </h3>
                  <p className="text-blue-100 text-sm">Get help from our support team</p>
                </div>
                <button
                  onClick={() => setShowNewQueryForm(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleNewQuerySubmit} className="p-6 space-y-6">
              {/* Query Details Section */}
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Query Information</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject Category *
                    </label>
                    <div className="relative">
                      <select
                        value={queryForm.subject}
                        onChange={(e) => setQueryForm(prev => ({ 
                          ...prev, 
                          subject: e.target.value,
                          customSubject: e.target.value !== 'others' ? '' : prev.customSubject
                        }))}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900 font-medium appearance-none"
                        required
                      >
                        {subjectOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority Level *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {urgencyOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setQueryForm(prev => ({ ...prev, urgency: option.value }))}
                          className={`p-3 rounded-xl border-2 transition-all text-center text-sm font-medium ${
                            queryForm.urgency === option.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {queryForm.subject === 'others' && (
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Custom Subject *
                    </label>
                    <input
                      type="text"
                      value={queryForm.customSubject}
                      onChange={(e) => setQueryForm(prev => ({ ...prev, customSubject: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900 font-medium"
                      placeholder="Enter your custom subject"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    rows={4}
                    value={queryForm.message}
                    onChange={(e) => setQueryForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all resize-none text-gray-900"
                    placeholder="Describe your issue or question in detail..."
                    required
                  />
                </div>
              </div>

              {/* Contact Preferences Section */}
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Contact Preferences</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={queryForm.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 10) {
                            setQueryForm(prev => ({ ...prev, phone: value }));
                          }
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900 font-medium"
                        placeholder="Enter 10-digit phone number"
                        maxLength="10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      WhatsApp Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={queryForm.whatsapp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 10) {
                            setQueryForm(prev => ({ ...prev, whatsapp: value }));
                          }
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900 font-medium"
                        placeholder="Enter WhatsApp number"
                        maxLength="10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Preferred Contact Date
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={queryForm.preferredContactDate}
                      onChange={(e) => setQueryForm(prev => ({ ...prev, preferredContactDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Preferred Contact Time
                    </label>
                    <input
                      type="time"
                      value={queryForm.preferredContactTime}
                      onChange={(e) => setQueryForm(prev => ({ ...prev, preferredContactTime: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowNewQueryForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-900 transition-all font-bold shadow-xl hover:shadow-2xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Submit Query
                    </div>
                  )}
                </button>
              </div>

              {/* Terms */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  By submitting this query, you agree to our{' '}
                  <a href="/terms" className="text-blue-600 hover:text-blue-800 underline font-medium">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline font-medium">Privacy Policy</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// QueryCard Component
const QueryCard = ({ query, onRate }) => {
  const { showToast } = useToast();
  const [showDetails, setShowDetails] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingData, setRatingData] = useState({ rating: '', feedback: '' });

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'in-progress':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'resolved':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'closed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'car-booking':
        return <img src="/car_logo.svg" alt="Car" className="w-5 h-5" />;
      case 'tour-package':
        return <img src="/tour_logo.svg" alt="Tour" className="w-5 h-5" />;
      case 'payment':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'complaint':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'feedback':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSubmitRating = async () => {
    if (!ratingData.rating) {
      showToast('Please select a rating', 'error');
      return;
    }

    await onRate(query._id, ratingData.rating, ratingData.feedback);
    setShowRatingForm(false);
    setRatingData({ rating: '', feedback: '' });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 mt-1">
              {getCategoryIcon(query.category)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{query.subject}</h3>
              <p className="text-sm text-gray-600">Query ID: #{query._id.slice(-8)}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 ${getStatusColor(query.status)}`}>
              {getStatusIcon(query.status)}
              <span className="capitalize">{query.status.replace('-', ' ')}</span>
            </span>
            
            {query.urgency && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getUrgencyColor(query.urgency)}`}>
                {query.urgency.charAt(0).toUpperCase() + query.urgency.slice(1)} Priority
              </span>
            )}
            
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              {query.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
        </div>
        
        <div className="text-right text-sm text-gray-500">
          <p>Submitted</p>
          <p className="font-medium text-gray-900">{formatDate(query.createdAt)}</p>
        </div>
      </div>

      {/* Status-specific information */}
      {query.status === 'pending' && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">Your query is being reviewed</p>
              <p className="text-xs text-yellow-700">Our support team will respond within 24 hours</p>
            </div>
          </div>
        </div>
      )}

      {query.status === 'in-progress' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">Your query is being processed</p>
              <p className="text-xs text-blue-700">Our team is actively working on your request</p>
            </div>
          </div>
        </div>
      )}

      {query.status === 'resolved' && query.response && !query.rating && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">Query resolved!</p>
                <p className="text-xs text-green-700">Please rate our response to help us improve</p>
              </div>
            </div>
            <button
              onClick={() => setShowRatingForm(true)}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Rate Response
            </button>
          </div>
        </div>
      )}

      {query.status === 'closed' && query.rating && (
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-800">Query closed - Thank you for your feedback!</p>
              <p className="text-xs text-gray-600 mt-1">
                Rating: {query.rating === 'satisfied' ? '😊 Satisfied' : '😞 Unsatisfied'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preferred Contact Info */}
      {(query.preferredContactDate || query.preferredContactTime) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">Preferred Contact Time</p>
              <p className="text-xs text-blue-700">
                {query.preferredContactDate && new Date(query.preferredContactDate).toLocaleString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
                {query.preferredContactTime && ` at ${query.preferredContactTime}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <span>Category: </span>
          <span className="font-medium text-gray-700 capitalize">
            {query.category.replace('-', ' ')}
          </span>
        </div>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg text-sm font-medium transition-all"
        >
          {showDetails ? 'Hide Details' : 'View Details'}
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Your Message:
            </p>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
              <p className="text-sm text-gray-700 leading-relaxed">{query.message}</p>
            </div>
          </div>

          {query.response && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                </svg>
                NextDrive Team Response:
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-4 rounded-xl">
                <p className="text-sm text-gray-700 leading-relaxed">{query.response}</p>
                {query.respondedBy && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-blue-600">
                      Responded by <span className="font-medium">{query.respondedBy.name}</span> on{' '}
                      {formatDate(query.respondedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {query.rating && query.feedback && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Your Feedback:
              </p>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">
                    {query.rating === 'satisfied' ? '😊' : '😞'}
                  </span>
                  <span className="text-sm font-medium text-yellow-800">
                    {query.rating === 'satisfied' ? 'Satisfied' : 'Unsatisfied'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{query.feedback}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rating Form Modal */}
      {showRatingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Rate Our Response</h3>
              <button
                onClick={() => setShowRatingForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-4">How satisfied are you with our response?</p>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl hover:border-green-300 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="rating"
                      value="satisfied"
                      checked={ratingData.rating === 'satisfied'}
                      onChange={(e) => setRatingData(prev => ({ ...prev, rating: e.target.value }))}
                      className="mr-3 text-green-600"
                    />
                    <span className="text-2xl mr-3">😊</span>
                    <span className="text-sm font-medium">Satisfied - Great response!</span>
                  </label>
                  <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl hover:border-red-300 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="rating"
                      value="unsatisfied"
                      checked={ratingData.rating === 'unsatisfied'}
                      onChange={(e) => setRatingData(prev => ({ ...prev, rating: e.target.value }))}
                      className="mr-3 text-red-600"
                    />
                    <span className="text-2xl mr-3">😞</span>
                    <span className="text-sm font-medium">Unsatisfied - Needs improvement</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={ratingData.feedback}
                  onChange={(e) => setRatingData(prev => ({ ...prev, feedback: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all resize-none"
                  placeholder="Tell us more about your experience..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRatingForm(false)}
                  className="flex-1 px-4 py-3 text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium transition-all"
                >
                  Submit Rating
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserQueries;