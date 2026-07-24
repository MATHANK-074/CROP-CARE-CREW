import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaUser,
  FaSave,
  FaArrowLeft,
  FaUserEdit,
  FaBell,
  FaClipboardList,
  FaCog,
  FaQuestionCircle,
  FaSignOutAlt,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaSeedling,
  FaLock,
  FaCamera,
  FaChevronRight,
  FaHistory,
  FaLeaf,
  FaGlobe
} from 'react-icons/fa';

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    phone: '',
    farmSize: '',
    primaryCrops: '',
    soilType: '',
    farmingExperience: '',
    preferredLanguage: '',
    notificationsEnabled: true
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Try to get profile image from localStorage
    const savedProfileImage = localStorage.getItem('profileImage');
    if (savedProfileImage) {
      setProfileImage(savedProfileImage);
    }

    // Fetch user data
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem('userId');
        // Check if backend server is available
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        try {
          // Using the correct endpoint from auth.js: /api/auth/user/:id
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/user/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }

          const data = await response.json();

          // Check if the user object exists in the response
          if (!data.user) {
            throw new Error('Invalid server response: user data missing');
          }

          const userData = data.user; // Extract user data from the response

          setFormData({
            name: userData.name || localStorage.getItem('userName') || '',
            email: userData.email || localStorage.getItem('userEmail') || '',
            // Format location if it's stored as GeoJSON
            location: userData.location?.coordinates ?
              `${userData.location.coordinates[1]}, ${userData.location.coordinates[0]}` : '',
            phone: userData.phone || '',
            farmSize: userData.farm_size || '',
            primaryCrops: userData.primaryCrop || '',
            soilType: userData.soilType || '',
            farmingExperience: userData.farmingExperience || '',
            preferredLanguage: userData.preferred_language || localStorage.getItem('i18nextLng') || 'en',
            notificationsEnabled: userData.notifications_enabled ||
              localStorage.getItem('notificationsEnabled') !== 'false'
          });

          // Set profile image if available
          if (userData.profile_img) {
            setProfileImage(userData.profile_img);
          }

          // If we get here, server is working properly
          setError('');
        } catch (fetchError) {
          // Handle timeout or network error by loading from localStorage
          console.warn('Server connection failed. Loading from local data:', fetchError);
          throw new Error('Server connection failed. Loading from local data.');
        }

      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data. Please try again later.');

        // If API fails, try to fill in with localStorage data
        setFormData({
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || '',
          location: '',
          phone: '',
          farmSize: '',
          primaryCrops: '',
          soilType: '',
          farmingExperience: '',
          preferredLanguage: localStorage.getItem('i18nextLng') || 'en',
          notificationsEnabled: localStorage.getItem('notificationsEnabled') !== 'false'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.match('image.*')) {
        setError('Only image files are allowed');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const imageData = reader.result;

          // Create a new Image object to verify the image can be loaded
          const img = new Image();
          img.onload = () => {
            // Image loads successfully, use it
            setProfileImage(imageData);
            localStorage.setItem('profileImage', imageData);
            setError(''); // Clear any previous errors
          };
          img.onerror = () => {
            console.error('Selected image cannot be loaded properly');
            setError('Selected image cannot be processed. Please try another image.');
          };
          img.src = imageData;
        } catch (err) {
          console.error('Error processing image:', err);
          setError('Error processing the selected image.');
        }
      };
      reader.onerror = () => {
        setError('Failed to read the selected file.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsEditing(false);
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const handleNotificationToggle = () => {
    const newValue = !formData.notificationsEnabled;
    setFormData({
      ...formData,
      notificationsEnabled: newValue
    });
    localStorage.setItem('notificationsEnabled', newValue.toString());
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const handleLanguageChange = (lang) => {
    setFormData({
      ...formData,
      preferredLanguage: lang
    });
    localStorage.setItem('i18nextLng', lang);
    window.location.reload();
  };

  // Separate function to upload profile image
  const uploadProfileImage = async (userId, token) => {
    if (!profileImage || profileImage.startsWith('http')) {
      return null; // No new image to upload or it's already a URL
    }

    try {
      // Convert base64 to blob for upload
      const base64Response = await fetch(profileImage);
      const blob = await base64Response.blob();

      // Create form data for image upload
      const imageFormData = new FormData();
      imageFormData.append('profileImage', blob, 'profile-image.jpg');

      // Upload the image to the server
      const uploadResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/user/${userId}/profile-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: imageFormData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload profile image');
      }

      const uploadData = await uploadResponse.json();
      return uploadData.imageUrl; // Return the URL of the uploaded image
    } catch (error) {
      console.error('Error uploading profile image:', error);
      // We'll continue with profile update even if image upload fails
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      // Transform form data to match backend expected format
      const updatedUserData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        // Map the fields to match your backend schema
        farm_size: formData.farmSize,
        primaryCrop: formData.primaryCrops,
        soilType: formData.soilType,
        farmingExperience: formData.farmingExperience,
        preferred_language: formData.preferredLanguage,
        notifications_enabled: formData.notificationsEnabled
      };

      // First update local storage regardless of server status
      localStorage.setItem('userName', formData.name);
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('notificationsEnabled', formData.notificationsEnabled.toString());
      localStorage.setItem('i18nextLng', formData.preferredLanguage);

      // Save profile image to localStorage if it's a data URL
      if (profileImage && profileImage.startsWith('data:')) {
        localStorage.setItem('profileImage', profileImage);
      }

      // Set a timeout for the server request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        // Upload profile image first if there's a new one
        let imageUrl = null;
        if (profileImage && !profileImage.startsWith('http')) {
          imageUrl = await uploadProfileImage(userId, token);
        }

        // Add profile image URL if available
        if (imageUrl) {
          updatedUserData.profile_img = imageUrl;
        } else if (profileImage && profileImage.startsWith('http')) {
          updatedUserData.profile_img = profileImage;
        }

        // Use the correct endpoint from your auth.js file
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/user/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updatedUserData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update profile');
        }

        const data = await response.json();
        setMessage('Profile updated successfully!');
      } catch (serverError) {
        // Handle offline mode or server error
        console.error('Server error:', serverError);
        setMessage('Profile saved locally. Changes will sync when connection is restored.');
      }

      setIsEditing(false);

      // Simulate message disappearing after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const renderProfileTab = () => (
    <div>
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Only handle error once
                      if (e.target.hasAttribute('data-error-handled')) {
                        return;
                      }
                      e.target.setAttribute('data-error-handled', 'true');
                      e.target.style.display = 'none';

                      // Clear the problematic image from state and localStorage if it's a URL
                      if (typeof profileImage === 'string' && profileImage.startsWith('http')) {
                        setProfileImage(null);
                        localStorage.removeItem('profileImage');
                      }

                      // Create a fallback div with icon
                      const parent = e.target.parentNode;
                      if (!parent.querySelector('.fallback-icon')) {
                        const fallbackDiv = document.createElement('div');
                        fallbackDiv.className = 'w-full h-full bg-gray-200 flex items-center justify-center fallback-icon';
                        const iconEl = document.createElement('span');
                        iconEl.className = 'text-gray-400 text-4xl';
                        iconEl.innerHTML = '👤'; // Simple user emoji as fallback
                        fallbackDiv.appendChild(iconEl);
                        parent.appendChild(fallbackDiv);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <FaUser className="text-gray-400 text-4xl" />
                  </div>
                )}
              </div>
              <label htmlFor="profile-image" className="absolute bottom-0 right-0 bg-green-600 rounded-full p-2 cursor-pointer shadow-md">
                <FaCamera className="text-white text-sm" />
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageChange}
                />
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('name') || 'Name'}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('email') || 'Email'}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t('phone') || 'Phone Number'}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                {t('location') || 'Location'}
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <h3 className="text-lg font-medium text-gray-800 mt-6 mb-4 border-b pb-2">
            {t('farming_details') || 'Farming Details'}
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="farmSize" className="block text-sm font-medium text-gray-700 mb-1">
                {t('farm_size') || 'Farm Size (acres)'}
              </label>
              <input
                type="text"
                id="farmSize"
                name="farmSize"
                value={formData.farmSize}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="soilType" className="block text-sm font-medium text-gray-700 mb-1">
                {t('soil_type') || 'Soil Type'}
              </label>
              <select
                id="soilType"
                name="soilType"
                value={formData.soilType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- {t('select_option') || 'Select Option'} --</option>
                <option value="clay">Clay</option>
                <option value="sandy">Sandy</option>
                <option value="loamy">Loamy</option>
                <option value="silty">Silty</option>
                <option value="peaty">Peaty</option>
              </select>
            </div>

            <div>
              <label htmlFor="primaryCrops" className="block text-sm font-medium text-gray-700 mb-1">
                {t('primary_crops') || 'Primary Crops'}
              </label>
              <input
                type="text"
                id="primaryCrops"
                name="primaryCrops"
                value={formData.primaryCrops}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Rice, Wheat, Cotton"
              />
            </div>

            <div>
              <label htmlFor="farmingExperience" className="block text-sm font-medium text-gray-700 mb-1">
                {t('farming_experience') || 'Farming Experience (years)'}
              </label>
              <input
                type="number"
                id="farmingExperience"
                name="farmingExperience"
                value={formData.farmingExperience}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium flex items-center justify-center"
            >
              {loading ? (t('saving') || 'Saving...') : (t('save_profile') || 'Save Profile')}
            </button>
          </div>
        </form>
      ) : (
        <div>
          {/* Profile Overview */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Only handle error once
                    if (e.target.hasAttribute('data-error-handled')) {
                      return;
                    }
                    e.target.setAttribute('data-error-handled', 'true');
                    e.target.style.display = 'none';

                    // Clear the problematic image from state and localStorage if it's a URL
                    if (typeof profileImage === 'string' && profileImage.startsWith('http')) {
                      setProfileImage(null);
                      localStorage.removeItem('profileImage');
                    }

                    // Create a fallback div with icon
                    const parent = e.target.parentNode;
                    if (!parent.querySelector('.fallback-icon')) {
                      const fallbackDiv = document.createElement('div');
                      fallbackDiv.className = 'w-full h-full bg-gray-200 flex items-center justify-center fallback-icon';
                      const iconEl = document.createElement('span');
                      iconEl.className = 'text-gray-400 text-4xl';
                      iconEl.innerHTML = '👤'; // Simple user emoji as fallback
                      fallbackDiv.appendChild(iconEl);
                      parent.appendChild(fallbackDiv);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <FaUser className="text-gray-400 text-4xl" />
                </div>
              )}
            </div>
            <h2 className="mt-4 text-xl font-bold">{formData.name}</h2>
            <p className="text-gray-600">{formData.email}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">
                {t('personal_information') || 'Personal Information'}
              </h3>
              <button
                type="button"
                onClick={toggleEditMode}
                className="text-green-600 hover:text-green-800 flex items-center text-sm font-medium"
              >
                <FaUserEdit className="mr-1" />
                {t('edit') || 'Edit'}
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center">
                <FaEnvelope className="text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">{t('email') || 'Email'}</p>
                  <p className="text-gray-800">{formData.email}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FaPhoneAlt className="text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">{t('phone') || 'Phone'}</p>
                  <p className="text-gray-800">{formData.phone || t('not_provided') || 'Not Provided'}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FaMapMarkerAlt className="text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">{t('location') || 'Location'}</p>
                  <p className="text-gray-800">{formData.location || t('not_provided') || 'Not Provided'}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-b p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                {t('farming_details') || 'Farming Details'}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center">
                  <FaSeedling className="text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">{t('primary_crops') || 'Primary Crops'}</p>
                    <p className="text-gray-800">{formData.primaryCrops || t('not_provided') || 'Not Provided'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaLeaf className="text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">{t('soil_type') || 'Soil Type'}</p>
                    <p className="text-gray-800">{formData.soilType || t('not_provided') || 'Not Provided'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaHistory className="text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">{t('farming_experience') || 'Farming Experience'}</p>
                    <p className="text-gray-800">
                      {formData.farmingExperience
                        ? `${formData.farmingExperience} ${t('years') || 'years'}`
                        : t('not_provided') || 'Not Provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium text-gray-800">
          {t('account_settings') || 'Account Settings'}
        </h3>
      </div>

      <div className="divide-y">
        {/* Notification Settings */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <FaBell className="text-gray-500 mr-3" />
            <div>
              <p className="text-gray-800">{t('notifications') || 'Notifications'}</p>
              <p className="text-sm text-gray-500">{t('notifications_desc') || 'Receive alerts and updates about your crops'}</p>
            </div>
          </div>
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="hidden"
                checked={formData.notificationsEnabled}
                onChange={handleNotificationToggle}
              />
              <div className={`w-10 h-6 rounded-full ${formData.notificationsEnabled ? 'bg-green-600' : 'bg-gray-300'} transition-colors`}></div>
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.notificationsEnabled ? 'transform translate-x-4' : ''}`}></div>
            </div>
          </label>
        </div>

        {/* Language Preference */}
        <div className="p-4">
          <div className="flex items-center mb-4">
            <FaGlobe className="text-gray-500 mr-3" />
            <div>
              <p className="text-gray-800">{t('language') || 'Language'}</p>
              <p className="text-sm text-gray-500">{t('language_desc') || 'Choose your preferred language'}</p>
            </div>
          </div>

          <div className="flex space-x-2 ml-8">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-4 py-2 rounded-md ${formData.preferredLanguage === 'en'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageChange('ta')}
              className={`px-4 py-2 rounded-md ${formData.preferredLanguage === 'ta'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* Password Change */}
        <div className="p-4">
          <button className="flex items-center text-gray-800 hover:text-green-600 w-full">
            <FaLock className="mr-3" />
            <span>{t('change_password') || 'Change Password'}</span>
            <FaChevronRight className="ml-auto text-gray-400" />
          </button>
        </div>

        {/* Logout */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center text-red-600 hover:text-red-800 w-full"
          >
            <FaSignOutAlt className="mr-3" />
            <span>{t('logout') || 'Logout'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium text-gray-800">
          {t('recent_activity') || 'Recent Activity'}
        </h3>
      </div>

      <div className="p-4">
        <div className="text-center py-8 text-gray-500">
          <FaHistory className="mx-auto text-4xl mb-3 text-gray-300" />
          <p>{t('no_recent_activity') || 'No recent activity to show'}</p>
          <p className="text-sm mt-2">
            {t('activity_desc') || 'Your recent interactions with crops and disease detection will appear here'}
          </p>
        </div>
      </div>
    </div>
  );

  const renderHelpTab = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium text-gray-800">
          {t('help_support') || 'Help & Support'}
        </h3>
      </div>

      <div className="p-4 space-y-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800">{t('faq_title') || 'Frequently Asked Questions'}</h4>
          <p className="text-sm text-gray-600 mt-1">{t('faq_desc') || 'Find answers to common questions'}</p>
          <button className="mt-2 text-green-600 text-sm font-medium">{t('view_all_faqs') || 'View All FAQs'}</button>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800">{t('contact_support') || 'Contact Support'}</h4>
          <p className="text-sm text-gray-600 mt-1">{t('support_desc') || 'Reach out to our support team'}</p>
          <button className="mt-2 text-green-600 text-sm font-medium">{t('contact_us') || 'Contact Us'}</button>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800">{t('feedback') || 'Provide Feedback'}</h4>
          <p className="text-sm text-gray-600 mt-1">{t('feedback_desc') || 'Help us improve your experience'}</p>
          <button className="mt-2 text-green-600 text-sm font-medium">{t('send_feedback') || 'Send Feedback'}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
          aria-label="Go back"
        >
          <FaArrowLeft className="text-gray-700" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaUser className="mr-3 text-green-600" />
          {t('profile') || 'Profile'}
        </h1>
      </div>

      {loading && <div className="text-center py-4">Loading profile information...</div>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      <div className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide">
          <button
            onClick={() => handleTabChange('profile')}
            className={`px-4 py-3 whitespace-nowrap font-medium border-b-2 ${activeTab === 'profile' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-600'
              }`}
          >
            <FaUser className="inline mr-2" />
            {t('profile') || 'Profile'}
          </button>
          <button
            onClick={() => handleTabChange('settings')}
            className={`px-4 py-3 whitespace-nowrap font-medium border-b-2 ${activeTab === 'settings' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-600'
              }`}
          >
            <FaCog className="inline mr-2" />
            {t('settings') || 'Settings'}
          </button>
          <button
            onClick={() => handleTabChange('activity')}
            className={`px-4 py-3 whitespace-nowrap font-medium border-b-2 ${activeTab === 'activity' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-600'
              }`}
          >
            <FaClipboardList className="inline mr-2" />
            {t('activity') || 'Activity'}
          </button>
          <button
            onClick={() => handleTabChange('help')}
            className={`px-4 py-3 whitespace-nowrap font-medium border-b-2 ${activeTab === 'help' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-600'
              }`}
          >
            <FaQuestionCircle className="inline mr-2" />
            {t('help') || 'Help'}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'settings' && renderSettingsTab()}
        {activeTab === 'activity' && renderActivityTab()}
        {activeTab === 'help' && renderHelpTab()}
      </div>
    </div>
  );
};

export default Profile;
