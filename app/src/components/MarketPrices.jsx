import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { FaSearch, FaFilter, FaSyncAlt, FaLeaf, FaMapMarkerAlt, FaRupeeSign } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { API_BASE_URL, buildApiUrl } from '../config/api';
import { formatMarketDate } from '../utils/dateUtils';

// Get API key from environment variables
const GOV_API_KEY = import.meta.env.VITE_GOV_API_KEY;
const GOV_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

const DATA_ID = "9ef84268-d588-465a-a308-a864a43d0070";

// Common crops in India
const commonCrops = [
  "Rice", "Wheat", "Maize", "Jowar", "Bajra", "Ragi",
  "Pulses", "Gram", "Moong", "Urad", "Lentil",
  "Groundnut", "Soybean", "Sunflower", "Mustard",
  "Cotton", "Jute", "Sugarcane", "Potato", "Onion", "Tomato",
  "Apple", "Banana", "Mango", "Orange", "Grapes"
];

const cropImages = {
  Rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop&auto=format",
  Paddy: "https://i0.wp.com/asombarta.com/wp-content/uploads/2025/03/paddy-1-scaled.jpg?fit=2560%2C1707&ssl=1",
  Wheat: "https://upload.wikimedia.org/wikipedia/commons/a/a3/Vehn%C3%A4pelto_6.jpg",
  Maize: "https://vajiramandravi.com/current-affairs/wp-content/uploads/2025/04/green_revolution_in_maize.webp",
  Soybean: "https://images.unsplash.com/photo-1571836132102-efeeacdf1e38?w=400&h=300&fit=crop&auto=format",
  Sunflower: "https://images.unsplash.com/photo-1470509037663-253afd7f0f51?w=400&h=300&fit=crop&auto=format",
  Mustard: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&auto=format",
  Cotton: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAq5Yrk5FmP78lUWRjQ7IVhMm0b_1BtPV07Q&s',
  Tomato: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDAGJTHC_zTRWAO4-Wlon3MPQvkGqQbLPRfA&s",
  Jute: "https://images.unsplash.com/photo-1571833043137-5a3b1d7beb66?w=400&h=300&fit=crop&auto=format",
  Sugarcane: "https://www.mahagro.com/cdn/shop/articles/iStock_000063947343_Medium_4e1c882b-faf0-4487-b45b-c2b557d32442.jpg?v=1541408129",
  Potato: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop&auto=format",
  Onion: "https://images.unsplash.com/photo-1508747703725-719777637510?w=400&h=300&fit=crop&auto=format",
  Apple: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop&auto=format",
  Banana: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop&auto=format",
  Mango: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=300&fit=crop&auto=format",
  Orange: "https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=300&fit=crop&auto=format",
  Groundnut: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRs744vDNmS69tcUn-0IwYdbjoyml2oPo_p9Q&s",
  Grapes: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&h=300&fit=crop&auto=format",
  Vegetables: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop&auto=format",
  Fruits: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=300&fit=crop&auto=format",
  // Inline SVG placeholders to avoid external network requests (data URIs)
  Default: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%2322c55e'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23ffffff'>Crop Image</text></svg>",

};

// Alternative image sources for fallback
const alternativeImages = {
  Agricultural: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%2316a34a'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23ffffff'>Agricultural Crop</text></svg>",
  Vegetables: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23059669'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23ffffff'>Vegetables</text></svg>",
  Fruits: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23dc2626'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23ffffff'>Fruits</text></svg>",
  Grains: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23d97706'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23ffffff'>Grains</text></svg>"
};

const MarketPrices = () => {
  const [userCrops, setUserCrops] = useState([]);
  const [products, setProducts] = useState([]);
  const [allCrops, setAllCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Erode');
  const [isSearching, setIsSearching] = useState(false);
  const [districts, setDistricts] = useState([
    'All',
    // Tamil Nadu
    'Erode', 'Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Thanjavur', 'Trichy', 'Tirunelveli', 'Karur', 'Vellore',

  ]);
  const [showUserCrops, setShowUserCrops] = useState(true);

  // Fetch user crops once on component mount
  useEffect(() => {
    const fetchUserCrops = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUserCrops([]);
          return;
        }

        const res = await fetch(buildApiUrl('/crops'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            toast.error('Your session has expired. Please log in again.');
            return;
          }
          throw new Error('Failed to fetch crops');
        }

        const crops = await res.json();
        setUserCrops(crops);

        // Fetch prices for user crops
        await fetchPricesForCrops(crops);
      } catch (error) {
        console.error('Error fetching user crops:', error);
        setUserCrops([]);
        setLoading(false);
      }
    };

    fetchUserCrops();
  }, []);

  // Effect to refetch data when district changes
  useEffect(() => {
    if (userCrops.length > 0 && showUserCrops) {
      fetchPricesForCrops(userCrops);
    }
  }, [selectedDistrict]); // Re-run when selectedDistrict changes

  // Function to fetch prices for a set of crops
  const fetchPricesForCrops = async (crops, districtFilter = null) => {
    setLoading(true);
    try {
      // Extract crop names from the crops objects
      const cropNames = crops.map(crop => crop.name);

      // Use provided district filter or current state
      const district = districtFilter !== null ? districtFilter : selectedDistrict;
      const districtParam = district !== 'All' ? district : '';

      // Call our server-side aggregated endpoint to avoid exposing API key and to centralize timeouts
      try {
        const query = `commodities=${encodeURIComponent(cropNames.join(','))}${districtParam ? `&district=${encodeURIComponent(districtParam)}` : ''}`;
        const resp = await fetch(buildApiUrl(`/market/prices?${query}`));
        if (!resp.ok) throw new Error(`Status ${resp.status}`);
        const body = await resp.json();
        const mapped = cropNames.map(name => {
          const found = (body.results || []).find(r => r.commodity && r.commodity.toLowerCase() === name.toLowerCase());
          if (found) {
            return {
              name,
              price: found.price || 'N/A',
              marketLocation: found.marketLocation || 'Unknown',
              img: cropImages[name] || cropImages.Default,
              alt: name,
              date: found.lastUpdated || new Date().toLocaleDateString(),
              trend: found.trend || 'stable',
              change: found.change || 0,
              isOldData: found.isOldData || false,
              daysAgo: found.daysAgo || 0,
              note: found.note || found.error || null
            };
          }
          return {
            name,
            price: 'N/A',
            marketLocation: 'Data unavailable',
            img: cropImages[name] || cropImages.Default,
            alt: name,
            date: new Date().toLocaleDateString(),
            trend: 'stable',
            change: 0,
            isOldData: false,
            daysAgo: 0
          };
        });

        setProducts(mapped);
      } catch (error) {
        console.error('Error fetching market prices from server:', error);
        // Fall back to placeholders
        const fallback = cropNames.map(name => ({
          name,
          price: 'N/A',
          marketLocation: 'Data unavailable',
          img: cropImages[name] || cropImages.Default,
          alt: name,
          date: formatMarketDate(),
          trend: 'stable',
          change: 0,
          isOldData: false,
          daysAgo: 0
        }));
        setProducts(fallback);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to search for a crop that isn't in user's crops
  const searchForCrop = async () => {
    if (!searchTerm.trim()) {
      toast.warning('Please enter a crop name to search');
      return;
    }

    setIsSearching(true);
    try {
      const cropName = searchTerm.trim();

      // Fetch price for the searched crop via our server proxy (avoids exposing API key)
      let district = selectedDistrict !== 'All' ? selectedDistrict : '';
      const query = `commodities=${encodeURIComponent(cropName)}${district ? `&district=${encodeURIComponent(district)}` : ''}&limit=1`;
      try {
        const resp = await fetch(buildApiUrl(`/market/prices?${query}`));
        if (!resp.ok) throw new Error(`Status ${resp.status}`);
        const body = await resp.json();
        if (body.results && body.results.length > 0) {
          const found = body.results[0];
          const newProduct = {
            name: cropName,
            price: found.price || 'N/A',
            marketLocation: found.marketLocation || 'Unknown',
            img: cropImages[cropName] || cropImages.Default,
            alt: cropName,
            date: formatMarketDate(found.lastUpdated),
            isSearchResult: true,
            trend: found.trend || 'stable',
            change: found.change || 0,
            isOldData: found.isOldData || false,
            daysAgo: found.daysAgo || 0,
            note: found.note || found.error || null
          };

          setProducts(prev => {
            const exists = prev.some(p => p.name.toLowerCase() === cropName.toLowerCase());
            if (exists) {
              return prev.map(p => p.name.toLowerCase() === cropName.toLowerCase() ? newProduct : p);
            }
            return [...prev, newProduct];
          });

          setShowUserCrops(false);
          toast.success(`Found price data for ${cropName}`);
        } else {
          // If no data from API, add a placeholder
          const newProduct = {
            name: cropName,
            price: "Price data unavailable",
            marketLocation: "No market data found",
            img: cropImages.Default,
            alt: cropName,
            date: formatMarketDate(),
            isSearchResult: true,
            trend: 'stable',
            change: 0,
            isOldData: false,
            daysAgo: 0
          };

          setProducts(prev => {
            const exists = prev.some(p => p.name.toLowerCase() === cropName.toLowerCase());
            if (exists) return prev;
            return [...prev, newProduct];
          });

          setShowUserCrops(false);
          toast.info(`No price data found for ${cropName}`);
        }
      } catch (err) {
        console.error('Error fetching search result from server proxy:', err);
        // fallthrough to outer catch which handles UI feedback
      }

    } catch (error) {
      console.error('Error searching for crop:', error);
      toast.error('Failed to search for crop prices');
    } finally {
      setIsSearching(false);
      setSearchTerm('');
    }
  };

  // Function to handle district selection change
  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    setSelectedDistrict(newDistrict);

    // Show loading feedback
    setLoading(true);

    // Refetch data with the new district filter
    if (userCrops.length > 0 && showUserCrops) {
      fetchPricesForCrops(userCrops, newDistrict);
    } else if (!showUserCrops && products.length > 0) {
      // If viewing search results, re-fetch the search results with new district
      const searchResults = products.filter(p => p.isSearchResult);
      if (searchResults.length > 0) {
        // Re-search with new district filter
        const searchCrops = searchResults.map(p => ({ name: p.name }));
        fetchPricesForCrops(searchCrops, newDistrict);
      }
    }

    // Show user feedback
    toast.info(`Filtering prices for ${newDistrict === 'All' ? 'all districts' : newDistrict}`);
  };

  // Function to toggle between user crops and searched crops
  const toggleCropView = () => {
    setShowUserCrops(!showUserCrops);
    if (!showUserCrops && userCrops.length > 0) {
      fetchPricesForCrops(userCrops);
    }
  };

  const { t } = useTranslation();

  // Filter displayed products based on current view mode
  const displayedProducts = showUserCrops
    ? products
    : products.filter(p => p.isSearchResult);

  // Get suggestions for search
  const getSuggestions = () => {
    const userCropNames = userCrops.map(c => c.name.toLowerCase());
    return commonCrops.filter(crop =>
      !userCropNames.includes(crop.toLowerCase()) &&
      crop.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  };

  const suggestions = searchTerm ? getSuggestions() : [];

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-0 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Market Prices Header */}
        <div className="bg-white p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-50 to-green-100 text-green-600 text-2xl">
              <FaRupeeSign />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1 tracking-tight">{t('market_prices')}</h2>
              <p className="text-gray-500 text-sm">{t('stay_updated_with_latest_prices') || 'Check current prices for your crops and others'}</p>
            </div>
          </div>

          {/* Search and Filters Section */}
          <div className="mt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for any crop price..."
                    className="w-full border-b-2 border-green-300 pl-10 pr-4 py-3 text-gray-700 focus:outline-none focus:border-green-500 bg-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaSearch />
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={searchForCrop}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 flex items-center justify-center gap-2 min-w-[120px]"
                >
                  {isSearching ? (
                    <>
                      <FaSyncAlt className="animate-spin" />
                      <span>{t('searching') || 'Searching...'}</span>
                    </>
                  ) : (
                    <>
                      <FaSearch />
                      <span>{t('search') || 'Search'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              {/* District Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">District:</label>
                <select
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  className="bg-white border border-gray-200 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-sm min-w-[160px]"
                >
                  {districts.map(district => (
                    <option key={district} value={district}>
                      {district === 'All' ? 'All Districts' : district}
                    </option>
                  ))}
                </select>
                {selectedDistrict !== 'All' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Filtered
                  </span>
                )}
              </div>

              {/* View Toggle */}
              <div className="ml-auto">
                <button
                  onClick={toggleCropView}
                  className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2
                    ${showUserCrops
                      ? 'border-blue-500 text-blue-700'
                      : 'border-green-500 text-green-700'}`}
                >
                  {showUserCrops ? t('viewing_my_crops') || 'Viewing: My Crops' : t('viewing_search_results') || 'Viewing: Search Results'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="bg-white p-4 sm:p-6">
          <h3 className="text-xl mb-6 flex items-center gap-2 pl-3 py-1" >
            {showUserCrops ? (
              <>
                <FaLeaf className="text-green-500" />
                <span className="font-medium text-gray-800">{t('your_crops_prices') || 'Your Crops Prices'}</span>
              </>
            ) : (
              <>
                <FaSearch className="text-blue-500" />
                <span className="font-medium text-gray-800">{t('search_results') || 'Search Results'}</span>
              </>
            )}
          </h3>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-gray-500">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
                <p>{t('loading_crop_prices') || 'Loading crop prices...'}</p>
              </div>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              {showUserCrops ? (
                <>
                  <p className="mb-4 text-lg">{t('no_crop_prices_found') || 'No crop prices found'}</p>
                  <p className="text-sm">Add crops in your profile to see their market prices here</p>
                </>
              ) : (
                <>
                  <p className="mb-4 text-lg">No search results found</p>
                  <p className="text-sm">Try searching for different crops using the search box above</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedProducts.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className={`bg-gradient-to-r ${index % 3 === 0 ? 'from-green-50 to-blue-50' :
                    index % 3 === 1 ? 'from-blue-50 to-green-50' :
                      'from-green-50 to-yellow-50'} mb-4`}
                >
                  <div className="relative h-48 overflow-hidden border-l-4 border-green-500 bg-gray-100 flex items-center justify-center">
                    {/* Placeholder block instead of external image to avoid loading from API */}
                    <div className="w-full h-full bg-gray-100 overflow-hidden">
                      <img
                        src={item.img}
                        alt={item.alt || item.name}
                        width={400}
                        height={300}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = cropImages.Default; }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent flex items-end p-4">
                      <h4 className="text-white font-semibold text-lg drop-shadow-md">{item.name}</h4>
                    </div>
                  </div>

                  <div className="p-2 sm:p-4 space-y-2">
                    {/* Only show old data indicator for actually old data */}
                    {item.isOldData && item.daysAgo > 1 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-md p-2 mb-2">
                        <div className="flex items-center gap-2 text-orange-700 text-xs">
                          <span className="font-medium">⚠️ {item.daysAgo} days old data</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-600 text-lg">
                          {item.price}
                        </span>
                        {/* Price trend indicator */}
                        {item.trend && item.trend !== 'stable' && (
                          <span className={`text-sm font-bold ${item.trend === 'up' ? 'text-green-500' : 'text-red-500'
                            }`}>
                            {item.trend === 'up' ? '↗' : '↘'}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">
                          {formatMarketDate(item.date)}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 mt-2">
                      <FaMapMarkerAlt className="inline mr-1" />
                      {item.marketLocation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketPrices;
