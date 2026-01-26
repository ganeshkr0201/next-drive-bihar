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

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">My Queries</h2>
        <a
          href="/contact"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Submit New Query
        </a>
      </div>

      {queries.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No queries yet</h3>
          <p className="text-gray-600 mb-4">Submit your first query to get help from our support team</p>
          <a
            href="/contact"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Query
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {queries.map((query) => (
            <QueryCard key={query._id} query={query} onRate={handleRateQuery} />
          ))}
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
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{query.subject}</h3>
          <p className="text-gray-600">Query ID: #{query._id.slice(-8)}</p>
          <div className="flex items-center space-x-2 mt-2">
            {getCategoryIcon(query.category)}
            <span className="text-sm text-gray-600 capitalize">{query.category.replace('-', ' ')}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(query.status)}`}>
            {getStatusIcon(query.status)}
            <span className="capitalize">{query.status}</span>
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Submitted</p>
          <p className="font-medium">{formatDate(query.createdAt)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Category</p>
          <p className="font-medium capitalize">{query.category.replace('-', ' ')}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Priority</p>
          <p className="font-medium">{query.priority || 'Medium'}</p>
        </div>
      </div>

      {/* Status-specific information */}
      {query.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-yellow-800">Your query is being reviewed. We'll respond soon!</p>
          </div>
        </div>
      )}

      {query.status === 'resolved' && query.response && !query.rating && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-800">Query resolved! Please rate our response.</p>
            </div>
            <button
              onClick={() => setShowRatingForm(true)}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              Rate Response
            </button>
          </div>
        </div>
      )}

      {query.status === 'closed' && query.rating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm text-blue-800">Query closed. Thank you for your feedback!</p>
                <p className="text-xs text-blue-600 mt-1">
                  Rating: {query.rating === 'satisfied' ? '😊 Satisfied' : '😞 Unsatisfied'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">Submitted on {formatDate(query.createdAt)}</p>
        <div className="space-x-2">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">My Message:</p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">{query.message}</p>
            </div>
          </div>

          {query.response && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">NextDrive Team Response:</p>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg">
                <p className="text-sm text-gray-700">{query.response}</p>
                {query.respondedBy && (
                  <p className="text-xs text-gray-500 mt-2">
                    Responded by {query.respondedBy.name} on {formatDate(query.respondedAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {query.rating && query.feedback && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Your Feedback:</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">{query.feedback}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rating Form Modal */}
      {showRatingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Rate Our Response</h3>
              <button
                onClick={() => setShowRatingForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">How satisfied are you with our response?</p>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="rating"
                      value="satisfied"
                      checked={ratingData.rating === 'satisfied'}
                      onChange={(e) => setRatingData(prev => ({ ...prev, rating: e.target.value }))}
                      className="mr-3"
                    />
                    <span className="text-sm">😊 Satisfied</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="rating"
                      value="unsatisfied"
                      checked={ratingData.rating === 'unsatisfied'}
                      onChange={(e) => setRatingData(prev => ({ ...prev, rating: e.target.value }))}
                      className="mr-3"
                    />
                    <span className="text-sm">😞 Unsatisfied</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={ratingData.feedback}
                  onChange={(e) => setRatingData(prev => ({ ...prev, feedback: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us more about your experience..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowRatingForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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