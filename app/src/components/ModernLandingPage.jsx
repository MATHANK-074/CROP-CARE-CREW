import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ModernLandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();

  // Update loggedIn state on mount and when token changes
  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('token'));

    // Listen for login/logout changes from other tabs
    const syncAuth = () => setLoggedIn(!!localStorage.getItem('token'));
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setLoggedIn(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Modern Light Navbar with Gradient Highlight */}
      <nav className="bg-white py-4 px-6 fixed w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/">
            <div className="flex items-center">
              <div>
                <span className="font-bold text-2xl text-green-600">Agri</span>
                <span className="font-bold text-2xl text-yellow-500">Tech</span>
              </div>
            </div>
          </Link>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/home" className="font-medium hover:text-green-600 transition-colors">Home</Link>
            <Link to="/disease-detection" className="font-medium hover:text-green-600 transition-colors">Plant Detection</Link>
            <Link to="/crop-recommendation" className="font-medium hover:text-green-600 transition-colors">Crop Advisor</Link>
            <Link to="/market-prices" className="font-medium hover:text-green-600 transition-colors">Market</Link>
            <Link to="/alerts" className="font-medium hover:text-green-600 transition-colors">Alerts</Link>
            {!loggedIn ? (
              <Link to="/login" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-medium transition-colors">
                Sign In
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="border border-red-600 text-red-600 px-6 py-2 rounded-full font-medium transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 bg-white pb-4">
            <div className="flex flex-col space-y-2 px-4">
              <Link to="/" className="py-2 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link to="/disease-detection" className="py-2 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>Plant Detection</Link>
              <Link to="/crop-recommendation" className="py-2 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>Crop Advisor</Link>
              <Link to="/market-prices" className="py-2 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>Market</Link>
              <Link to="/alerts" className="py-2 hover:text-green-600" onClick={() => setIsMenuOpen(false)}>Alerts</Link>

              {!loggedIn ? (
                <Link
                  to="/login"
                  className="bg-green-600 text-white py-2 px-4 rounded-full text-center mt-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              ) : (
                <button
                  className="border border-red-600 text-white py-2 px-4 rounded-full text-center mt-2"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with Farming Background */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 h-screen justify-center align-middle">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content Column */}
          <div className="space-y-6">
            <span className="inline-block bg-green-100 text-green-800 font-medium px-4 py-1 rounded-full text-sm">
              Revolutionizing Agriculture
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Smart Farming Solutions for <span className="text-green-600">Modern Agriculture</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600">
              AgriTech HUB empowers farmers with AI-powered tools for plant disease detection,
              personalized crop recommendations, and real-time alerts to maximize yield and sustainability.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/disease-detection" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all text-center">
                Try Plant Detection
              </Link>
              <Link to="/crop-recommendation" className="bg-white border-2 border-green-600 hover:bg-green-50 text-green-600 px-8 py-3 rounded-lg font-semibold transition-all text-center">
                Crop Recommendations
              </Link>
            </div>
          </div>

          {/* Hero Image - Centered Below Text on Mobile & Desktop */}
          <div className="mt-16">
            <img
              src="/src/assets/farmer-at-sunset-stockcake.jpg"
              alt="Farmers working in agricultural field with crops"
              className="rounded-lg shadow-xl max-w-2xl mx-auto"
            />
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block bg-green-100 text-green-800 font-medium px-4 py-1 rounded-full text-sm mb-4">
              Core Features
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Empowering Farmers with Technology</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              AgriTech provides smart tools that help farmers make data-driven decisions,
              identify plant diseases early, and optimize crop production.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Disease Detection</h3>
              <p className="text-gray-600 mb-6">Upload plant images and instantly identify diseases with our AI-powered analysis system.</p>
              <Link to="/disease-detection" className="mt-auto text-green-600 font-medium hover:text-green-700 inline-flex items-center">
                Learn more
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Crop Recommendations</h3>
              <p className="text-gray-600 mb-6">Get personalized crop suggestions based on your soil composition, climate, and local conditions.</p>
              <Link to="/crop-recommendation" className="mt-auto text-green-600 font-medium hover:text-green-700 inline-flex items-center">
                Learn more
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Real-time Alerts</h3>
              <p className="text-gray-600 mb-6">Receive notifications about disease outbreaks, weather changes, and market price fluctuations.</p>
              <Link to="/alerts" className="mt-auto text-green-600 font-medium hover:text-green-700 inline-flex items-center">
                Learn more
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block bg-green-100 text-green-800 font-medium px-4 py-1 rounded-full text-sm mb-4">
              How It Works
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Simple Process, Powerful Results</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our intelligent platform makes it easy to get actionable insights for your farm
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Upload & Analyze</h3>
              <p className="text-gray-600">
                Take a photo of your crops or input soil data and our AI analyzes it instantly
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Get Smart Insights</h3>
              <p className="text-gray-600">
                Receive accurate disease identification or personalized crop recommendations
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Take Action</h3>
              <p className="text-gray-600">
                Apply recommended treatments or follow crop suggestions for better yields
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Detailed Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block bg-green-100 text-green-800 font-medium px-4 py-1 rounded-full text-sm mb-4">
              Feature Suite
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Everything You Need For Modern Farming</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              AgriTech provides a comprehensive set of tools designed to make farming more efficient,
              profitable, and sustainable
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <img
                src="/src/assets/download.jpg"
                alt="Plant Disease Detection"
                className="rounded-xl shadow-xl w-full"
              />
            </div>
            <div className="space-y-6">
              <span className="inline-block bg-green-100 text-green-800 font-medium px-4 py-1 rounded-full text-sm">
                Plant Disease Detection
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Early Detection Saves Crops</h2>
              <p className="text-lg text-gray-600">
                Our advanced AI technology can identify over 50 different plant diseases with 95% accuracy.
                Early detection means you can take action before diseases spread and damage your entire crop.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Upload images directly from your smartphone
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Get instant identification and treatment recommendations
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Works with low connectivity in remote farming areas
                </li>
              </ul>
              <Link to="/disease-detection" className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all">
                Try Disease Detection
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6 order-2 md:order-1">
              <span className="inline-block bg-green-100 text-green-800 font-medium px-4 py-1 rounded-full text-sm">
                Crop Recommendations
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Smarter Planting Decisions</h2>
              <p className="text-lg text-gray-600">
                Input your soil parameters, local climate conditions, and available resources to receive
                personalized recommendations for crops with the highest probability of success.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Soil-type and pH-based recommendations
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Climate and rainfall pattern analysis
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Market demand forecasting for better returns
                </li>
              </ul>
              <Link to="/crop-recommendation" className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all">
                Get Crop Recommendations
              </Link>
            </div>
            <div className="order-1 md:order-2">
              <img
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="Crop Planning"
                className="rounded-xl shadow-xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6">


          {/* Market Data Feature */}
          <div className="grid md:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <img
                src="https://source.unsplash.com/f-UM_CX_fhI"
                alt="Agricultural Market Data"
                className="rounded-xl shadow-xl w-full"
              />
            </div>
            <div className="space-y-6">
              <span className="inline-block bg-green-100 text-green-800 font-medium px-4 py-1 rounded-full text-sm">
                Market Insights
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Make Informed Selling Decisions</h2>
              <p className="text-lg text-gray-600">
                Get real-time market prices, demand forecasts, and regional trends to help you decide when and where to sell your produce for maximum profit.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Live commodity price tracking across major markets
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Price prediction algorithms based on historical data
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Direct connection to potential buyers in your region
                </li>
              </ul>
              <Link to="/market-prices" className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all">
                Explore Market Data
              </Link>
            </div>
          </div>

          {/* Weather Alerts Feature */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6 order-2 md:order-1">
              <span className="inline-block bg-green-100 text-green-800 font-medium px-4 py-1 rounded-full text-sm">
                Smart Alerts
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Never Miss Critical Information</h2>
              <p className="text-lg text-gray-600">
                Receive timely notifications about weather events, disease outbreaks in your area, optimal planting and harvesting times, and more.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Severe weather warnings specific to your location
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Disease outbreak alerts in your region
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Customizable notification preferences via SMS or app
                </li>
              </ul>
              <Link to="/alerts" className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all">
                Set Up Alerts
              </Link>
            </div>
            <div className="order-1 md:order-2">
              <img
                src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="Weather and Farm Alerts"
                className="rounded-xl shadow-xl w-full"
              />
            </div>
          </div>

          {/* Community Feature */}
          <div className="grid md:grid-cols-2 gap-16 items-center mt-20">
            <div>
              <img
                src="https://source.unsplash.com/IZ01rjX0XQA"
                alt="Farmer Community"
                className="rounded-xl shadow-xl w-full"
              />
            </div>
            <div className="space-y-6">
              <span className="inline-block bg-green-100 text-green-800 font-medium px-4 py-1 rounded-full text-sm">
                Farming Community
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Connect With Other Farmers</h2>
              <p className="text-lg text-gray-600">
                Join a growing network of forward-thinking farmers to share knowledge, experiences, and get support from peers facing similar challenges.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Discussion forums organized by crop types and regions
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Knowledge sharing on best farming practices
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Local farming events and workshops notifications
                </li>
              </ul>
              <Link to="/community" className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all">
                Join The Community
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block bg-green-100 text-green-800 font-medium px-4 py-1 rounded-full text-sm mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">What Farmers Are Saying</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover how AgriTech is transforming farms across the country
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xl mr-4">
                  R
                </div>
                <div>
                  <h4 className="font-bold">Rajesh Kumar</h4>
                  <p className="text-gray-600 text-sm">Wheat Farmer, Punjab</p>
                </div>
              </div>
              <p className="text-gray-700">
                "The disease detection feature saved my entire wheat crop from yellow rust. I was able to identify it early and apply the right treatment."
              </p>
              <div className="flex mt-4 text-yellow-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xl mr-4">
                  S
                </div>
                <div>
                  <h4 className="font-bold">Sunita Patel</h4>
                  <p className="text-gray-600 text-sm">Vegetable Farmer, Gujarat</p>
                </div>
              </div>
              <p className="text-gray-700">
                "The crop recommendation system helped me choose the right vegetables for my soil type. My yield has increased by 30% this season!"
              </p>
              <div className="flex mt-4 text-yellow-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xl mr-4">
                  M
                </div>
                <div>
                  <h4 className="font-bold">Mohammed Ali</h4>
                  <p className="text-gray-600 text-sm">Rice Farmer, Tamil Nadu</p>
                </div>
              </div>
              <p className="text-gray-700">
                "The market price alerts have been game-changing. I know exactly when to sell my crops for the best profit margin now."
              </p>
              <div className="flex mt-4 text-yellow-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Farming?</h2>
          <p className="text-lg text-green-100 max-w-2xl mx-auto mb-10">
            Join thousands of farmers already using AgriTech HUB to increase yields,
            reduce losses, and make smarter agricultural decisions.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/disease-detection" className="bg-white text-green-600 hover:bg-green-100 px-8 py-4 rounded-lg font-semibold transition-all">
              Try Disease Detection
            </Link>
            {!loggedIn ? (
              <Link to="/login" className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-lg font-semibold transition-all">
                Create Free Account
              </Link>
            ) : (
              <Link to="/alerts" className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-lg font-semibold transition-all">
                View My Alerts
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <div>
                  <span className="font-bold text-2xl text-green-600">Agri</span>
                  <span className="font-bold text-2xl text-yellow-500">Tech</span>
                </div>
              </div>
              <p className="text-gray-600 mb-6 max-w-xs">
                Empowering farmers with smart technology for better crop management, disease prevention, and yield optimization.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-green-100 hover:text-green-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-green-100 hover:text-green-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-green-100 hover:text-green-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-gray-900 font-bold mb-5">Product</h4>
              <ul className="space-y-3">
                <li><Link to="/disease-detection" className="text-gray-600 hover:text-green-600 transition-colors">Disease Detection</Link></li>
                <li><Link to="/crop-recommendation" className="text-gray-600 hover:text-green-600 transition-colors">Crop Recommendations</Link></li>
                <li><Link to="/market-prices" className="text-gray-600 hover:text-green-600 transition-colors">Market Prices</Link></li>
                <li><Link to="/alerts" className="text-gray-600 hover:text-green-600 transition-colors">Smart Alerts</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-900 font-bold mb-5">Company</h4>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-gray-600 hover:text-green-600 transition-colors">About Us</Link></li>
                <li><Link to="/modern-landing#features" className="text-gray-600 hover:text-green-600 transition-colors">Features</Link></li>
                <li><a href="#" className="text-gray-600 hover:text-green-600 transition-colors">Blog</a></li>
                <li><Link to="/contact" className="text-gray-600 hover:text-green-600 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-900 font-bold mb-5">Resources</h4>
              <ul className="space-y-3">
                <li><Link to="/government-schemes" className="text-gray-600 hover:text-green-600 transition-colors">Govt Schemes</Link></li>
                <li><a href="#" className="text-gray-600 hover:text-green-600 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-600 hover:text-green-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-green-600 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} AgriTech. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Terms</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
