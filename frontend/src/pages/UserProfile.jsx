import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';
import envConfig from '../config/env';

const UserProfile = () => {
  const { user, updateUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    bio: ''
  });

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [sessionValid, setSessionValid] = useState(true);

  useEffect(() => {
    // Check session validity when component mounts
    const checkSession = async () => {
      try {
        const sessionUser = await authService.checkSession();
        if (sessionUser) {
          updateUser(sessionUser);
          setSessionValid(true);
        } else {
          // Only set session invalid if user is not authenticated locally
          if (!isAuthenticated) {
            setSessionValid(false);
          } else {
            // User is authenticated locally, assume session is valid
            // This prevents false session expired messages
            setSessionValid(true);
          }
        }
      } catch (error) {
        // Don't immediately invalidate session on network errors
        // Only invalidate if it's a clear authentication error
        if (error.response?.status === 401) {
          setSessionValid(false);
        } else {
          // For network errors, keep session valid if user is authenticated locally
          setSessionValid(isAuthenticated);
        }
      }
    };
    
    if (user && isAuthenticated) {
      checkSession();
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
        bio: user.bio || ''
      });
      setImagePreview(user.avatar || null);
    } else if (!isAuthenticated) {
      setSessionValid(false);
    }
  }, [user, isAuthenticated]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Phone number validation - only allow numbers and limit to 10 digits
    if (name === 'phone') {
      const phoneRegex = /^[0-9]*$/; // Only numbers
      if (!phoneRegex.test(value)) {
        return; // Don't update if invalid characters
      }
      if (value.length > 10) {
        return; // Don't update if more than 10 digits
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
      }

      setIsImageLoading(true);
      setProfileImage(file);
      
      // Create preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setIsImageLoading(false);
      };
      reader.onerror = () => {
        showToast('Failed to load image preview', 'error');
        setIsImageLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check session validity first
    if (!sessionValid) {
      showToast('Session expired. Please log in again.', 'error');
      return;
    }
    
    // Validate phone number if provided
    if (formData.phone && formData.phone.length !== 10) {
      showToast('Phone number must be exactly 10 digits', 'error');
      return;
    }
    
    setIsLoading(true);

    try {
      // Only do a session check if we're not confident about the current session
      // If user is authenticated locally, proceed with the update
      if (!isAuthenticated) {
        setSessionValid(false);
        showToast('Please log in to update your profile.', 'error');
        return;
      }

      const formDataToSend = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add profile image if selected
      if (profileImage) {
        formDataToSend.append('avatar', profileImage);
      }

      const response = await authService.updateProfile(formDataToSend);
      
      if (response.success) {
        // Update user context with new data
        updateUser(response.user);
        
        // Reset all editing states
        setIsEditing(false);
        setProfileImage(null);
        setIsImageLoading(false);
        
        // Update image preview to show the new saved image
        if (response.user.avatar) {
          setImagePreview(response.user.avatar);
        }
        
        // Update form data with the saved data
        setFormData({
          name: response.user.name || '',
          email: response.user.email || '',
          phone: response.user.phone || '',
          address: response.user.address || '',
          dateOfBirth: response.user.dateOfBirth || '',
          bio: response.user.bio || ''
        });
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        showToast('Profile updated successfully!', 'success');
      } else {
        showToast('Profile update failed', 'error');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.message.includes('Authentication required')) {
        setSessionValid(false);
        showToast('Session expired. Please log in again.', 'error');
      } else if (error.response?.status === 403) {
        showToast('You do not have permission to perform this action.', 'error');
      } else {
        showToast(error.message || 'Failed to update profile', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setProfileImage(null);
    // Reset to original user avatar or null
    const originalAvatar = user?.avatar;
    setImagePreview(originalAvatar || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Profile</h1>
          <p className="text-lg text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Session Warning */}
          {!sessionValid && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Your session has expired. Please <a href="/login" className="font-medium underline hover:text-yellow-800">log in again</a> to save changes to your profile.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 px-8 py-12 text-white relative">
            <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Image */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white relative">
                  {isImageLoading ? (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : imagePreview ? (
                    <img
                      src={envConfig.getAssetUrl(imagePreview)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {isEditing && (
                  <div className="absolute -bottom-2 -right-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      disabled={isImageLoading}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Change photo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    
                    {profileImage && (
                      <button
                        type="button"
                        onClick={removeImage}
                        disabled={isImageLoading}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove photo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold mb-2">{user?.name || 'User'}</h2>
                <p className="text-blue-100 text-lg mb-2">{user?.email}</p>
                <div className="flex items-center justify-center md:justify-start space-x-4 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    {user?.role === 'admin' ? 'Administrator' : 'Member'}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    {user?.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className="absolute top-6 right-6">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setProfileImage(null);
                      setImagePreview(user?.avatar || null);
                      setIsImageLoading(false);
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                        address: user?.address || '',
                        dateOfBirth: user?.dateOfBirth || '',
                        bio: user?.bio || ''
                      });
                      // Clear file input
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={true} // Email should not be editable
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter 10-digit phone number (e.g., 9876543210)"
                      pattern="[0-9]{10}"
                      maxLength="10"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                        formData.phone && formData.phone.length === 10 
                          ? 'border-green-300 bg-green-50' 
                          : formData.phone && formData.phone.length > 0 
                          ? 'border-orange-300 bg-orange-50' 
                          : 'border-gray-300'
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      Only 10 digits allowed (no spaces or special characters)
                      {formData.phone && (
                        <span className={`ml-2 flex items-center ${formData.phone.length === 10 ? 'text-green-600' : 'text-orange-600'}`}>
                          {formData.phone.length === 10 && (
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {formData.phone.length}/10 digits
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Address</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Enter your full address"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">About Me</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              {isEditing && (
                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={isLoading || !sessionValid}
                    className={`bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                      !sessionValid ? 'from-gray-400 to-gray-500 hover:from-gray-400 hover:to-gray-500' : ''
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Updating...</span>
                      </>
                    ) : !sessionValid ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Session Expired</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;