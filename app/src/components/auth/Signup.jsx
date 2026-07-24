import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSeedling, FaUserPlus, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import GoogleLoginButton from './GoogleLoginButton';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', latitude: '', longitude: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthSuggested, setOauthSuggested] = useState(null); // { name, email, profile_img }
  const [oauthForm, setOauthForm] = useState({ phone: '', name: '', email: '', latitude: '', longitude: '' });
  const [oauthLoading, setOauthLoading] = useState(false);
  const [locationPermissionRequested, setLocationPermissionRequested] = useState(false);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGetLocation = (isOAuth = false) => {
    const updateLocation = (lat, lng) => {
      if (isOAuth) {
        setOauthForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
      } else {
        setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
      }
    };

    if (navigator.geolocation) {
      setLocationPermissionRequested(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateLocation(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.error('Geolocation error:', err);
          let errorMsg = 'Failed to get location: ';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg += 'Permission denied. Please enable location access and try again.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg += 'Location information unavailable.';
              break;
            case err.TIMEOUT:
              errorMsg += 'Location request timed out.';
              break;
            default:
              errorMsg += err.message;
          }
          setError(errorMsg);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { ...form };
      if (form.latitude && form.longitude) {
        payload.location = {
          type: 'Point',
          coordinates: [parseFloat(form.longitude), parseFloat(form.latitude)]
        };
        delete payload.latitude;
        delete payload.longitude;
      }

      // Log the payload for debugging
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Log the response status
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Signup failed');
      }

      // Store user info in addition to token
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.id || data.user._id);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);

      // Notify other components about auth state change
      window.dispatchEvent(new Event('storage'));
      navigate('/');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle successful Google login
  const handleGoogleSuccess = (userData) => {
    try {
      // Store user data and redirect
      localStorage.setItem('token', userData.token);
      localStorage.setItem('userId', userData.user.id || userData.user._id);
      localStorage.setItem('userName', userData.user.name);
      localStorage.setItem('userEmail', userData.user.email);

      // Notify other components about auth state change
      window.dispatchEvent(new Event('storage'));
      navigate('/');
    } catch (err) {
      console.error('Error handling Google success:', err);
      setError('Failed to complete Google sign-in');
    }
  };

  // Handle when user needs to complete registration
  const handleNeedsRegistration = (userInfo) => {
    setOauthSuggested(userInfo);
    setOauthForm({
      phone: '',
      name: userInfo.name || '',
      email: userInfo.email || '',
      latitude: '',
      longitude: ''
    });
    setError('');

    // Auto-request location for new users
    if (!locationPermissionRequested) {
      handleGetLocation(true);
    }
  };

  // Handle Google login errors
  const handleGoogleError = (error) => {
    console.error('Google login error:', error);
    setError('Google sign-in failed. Please try again.');
  };

  // Handle OAuth registration completion
  const handleOauthRegister = async (e) => {
    e.preventDefault();
    setOauthLoading(true);
    setError('');

    try {
      const payload = { ...oauthForm };
      if (oauthForm.latitude && oauthForm.longitude) {
        payload.location = {
          type: 'Point',
          coordinates: [parseFloat(oauthForm.longitude), parseFloat(oauthForm.latitude)]
        };
        delete payload.latitude;
        delete payload.longitude;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/oauth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Registration failed');
      }

      // Store user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.id || data.user._id);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);

      // Notify other components about auth state change
      window.dispatchEvent(new Event('storage'));
      navigate('/');
    } catch (err) {
      console.error('OAuth registration error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setOauthLoading(false);
    }
  };

  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Header for signup page */}
      <header className="bg-white py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/">
            <div className="flex items-center">
              <div>
                <span className="font-bold text-2xl text-green-600">Agri</span>
                <span className="font-bold text-2xl text-yellow-500">Tech</span>
              </div>
            </div>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-center gap-8 h-full">
        {/* Left Column with Text */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start order-2 md:order-1">
          <div className="mb-4 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2">
              Join the <span className="text-green-600">AgriTech</span> Community
            </h1>
            <p className="text-md text-gray-600 max-w-md mb-4">
              Sign up to access AI-powered tools for plant disease detection, personalized crop recommendations, and real-time market data.
            </p>
          </div>
          <img
            src="https://media.istockphoto.com/id/503646746/photo/farmer-spreading-fertilizer-in-the-field-wheat.jpg?s=612x612&w=0&k=20&c=Lgxsjbz0jaYyQrvfzhyAsW2zELtshRP4AtLzkpmcLiE="
            alt="Smart Farming"
            className="w-full max-w-md rounded-lg shadow-xl hidden md:block"
          />
        </div>

        {/* Right Column with Signup Form */}
        <div className="w-full md:w-1/2 max-w-md order-1 md:order-2">
          {/* Google OAuth registration fallback modal-like block */}
          {oauthSuggested && (
            <div className="bg-white border border-green-300 rounded-xl p-6 mb-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <FaUserPlus className="text-green-600" /> Complete Your Registration
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                We need a few more details to create your AgriTech account.
              </p>
              <form onSubmit={handleOauthRegister} className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={oauthForm.name}
                    onChange={(e) => setOauthForm({ ...oauthForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={oauthForm.email}
                    disabled
                    className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    <FaPhone className="inline mr-1" />Phone Number
                  </label>
                  <input
                    type="tel"
                    value={oauthForm.phone}
                    onChange={(e) => setOauthForm({ ...oauthForm, phone: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    <FaMapMarkerAlt className="inline mr-1" />Farm Location (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="number"
                      value={oauthForm.latitude}
                      onChange={(e) => setOauthForm({ ...oauthForm, latitude: e.target.value })}
                      step="any"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      placeholder="Latitude"
                    />
                    <input
                      type="number"
                      value={oauthForm.longitude}
                      onChange={(e) => setOauthForm({ ...oauthForm, longitude: e.target.value })}
                      step="any"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      placeholder="Longitude"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGetLocation(true)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1"
                  >
                    <FaMapMarkerAlt /> Get My Location
                  </button>
                </div>
                {error && <div className="bg-red-50 text-red-600 p-2 rounded text-sm">{error}</div>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setOauthSuggested(null); setError(''); }}
                    className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={oauthLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 font-semibold transition disabled:opacity-50"
                  >
                    {oauthLoading ? 'Creating Account...' : 'Complete Signup'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Regular Signup Form - Only show when NOT in OAuth completion mode */}
          {!oauthSuggested && (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl p-6 "
            >
              <div className="flex flex-col items-center mb-3">

                <h2 className="text-xl font-bold text-gray-800 mb-1">
                  {t('sign_up')}
                </h2>
                <p className="text-sm text-gray-600">{t('signup_welcome')}</p>
              </div>

              <div className="mb-2">
                <label className="block text-gray-700 text-sm font-medium mb-1">{t('name')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                    placeholder="Your Name"
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-gray-700 text-sm font-medium mb-1">{t('email')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-gray-700 text-sm font-medium mb-1">{t('phone_number')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-gray-700 text-sm font-medium mb-1">{t('farm_location')}</label>
                <div className="grid grid-cols-2 gap-2 mb-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="latitude"
                      value={form.latitude}
                      onChange={handleChange}
                      step="any"
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                      placeholder="Latitude"
                    />
                  </div>
                  <input
                    type="number"
                    name="longitude"
                    value={form.longitude}
                    onChange={handleChange}
                    step="any"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                    placeholder="Longitude"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1"
                >
                  <FaMapMarkerAlt /> {t('use_my_location')}
                </button>
              </div>

              <div className="mb-3">
                <label className="block text-gray-700 text-sm font-medium mb-1">{t('password')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                    placeholder="Create a password (min. 6 characters)"
                  />
                </div>
              </div>

              {error && <div className="bg-red-50 text-red-600 p-2 text-sm rounded-lg mb-3">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? t('signing_up') : <>{t('sign_up')} <FaUserPlus /></>}
              </button>

              <div className="my-4 flex items-center gap-2">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="text-xs text-gray-500">OR</span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>

              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onNeedsRegistration={handleNeedsRegistration}
                onError={handleGoogleError}
                isSignup={true}
              />

              <div className="text-center mt-3 text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-green-600 font-semibold hover:underline">
                  {t('login_title')}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
