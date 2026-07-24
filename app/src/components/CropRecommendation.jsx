import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Get API key from environment variables
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + import.meta.env.VITE_GEMINI_API_KEY;

const cropImages = {
  Wheat: "https://storage.googleapis.com/a1aa/image/18887521-1e5e-44ed-dfda-46e29786e047.jpg",
  Sunflower: "https://storage.googleapis.com/a1aa/image/5d18369a-7b6e-4396-fc31-2e2802e56bbf.jpg",
  Corn: "https://storage.googleapis.com/a1aa/image/bed40549-75b4-4747-23ad-ca7adbbfcec9.jpg",
  Rice: "https://storage.googleapis.com/a1aa/image/dfacf51c-4439-49db-e185-fc674bf808d5.jpg",
  Tomato: "https://storage.googleapis.com/a1aa/image/66694345-5244-4928-8654-e7bf1554898a.jpg",
  Maize: "https://storage.googleapis.com/a1aa/image/bed40549-75b4-4747-23ad-ca7adbbfcec9.jpg",
  Cotton: "https://storage.googleapis.com/a1aa/image/cotton-field.jpg",
  Sugarcane: "https://storage.googleapis.com/a1aa/image/sugarcane-field.jpg",
  Potato: "https://storage.googleapis.com/a1aa/image/potato-field.jpg",
  Onion: "https://storage.googleapis.com/a1aa/image/onion-field.jpg"
};

function Croprecommation() {
  const { t } = useTranslation()

  // Toggle between basic and detailed forms
  const [formType, setFormType] = useState('basic');

  // Basic form state
  const [basicForm, setBasicForm] = useState({
    soil: "Loamy",
    season: "summer",
    water: false,
    landSize: "",
    previousCrop: "",
    location: ""
  });

  // Detailed form state
  const [detailedForm, setDetailedForm] = useState({
    soil: "Loamy",
    season: "summer",
    location: "",
    landSize: "",

    // Soil composition
    phLevel: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    organicMatter: "",
    soilMoisture: "",
    soilDepth: "",
    drainage: "good",

    // Climate data
    rainfall: "",
    minTemp: "",
    maxTemp: "",

    // Irrigation and farming history
    irrigationType: "drip",
    cropHistory: {
      year1: "",
      year2: "",
      year3: ""
    },
    fertilizerUsed: "organic"
  });

  const [loading, setLoading] = useState(false);
  const [recommendedCrops, setRecommendedCrops] = useState([]);
  const [error, setError] = useState("");

  const handleBasicChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBasicForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleDetailedChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('cropHistory.')) {
      const year = name.split('.')[1];
      setDetailedForm(prev => ({
        ...prev,
        cropHistory: {
          ...prev.cropHistory,
          [year]: value
        }
      }));
    } else {
      setDetailedForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const getDetailedPrompt = () => {
    const langCode = (localStorage.getItem('i18nextLng') || 'en');
    const userLang = langCode === 'ta' ? 'Tamil' : langCode === 'en' ? 'English' : langCode;

    return `You must respond entirely in ${userLang} language. Based on the comprehensive soil and environmental analysis below, recommend the top 5 most suitable crops with detailed scientific reasoning. You must respond entirely in ${userLang} language.

SOIL ANALYSIS DATA:
- Soil Type: ${detailedForm.soil}
- pH Level: ${detailedForm.phLevel}
- NPK Content: N-${detailedForm.nitrogen}%, P-${detailedForm.phosphorus}%, K-${detailedForm.potassium}%
- Organic Matter: ${detailedForm.organicMatter}%
- Soil Moisture: ${detailedForm.soilMoisture}%
- Soil Depth: ${detailedForm.soilDepth}cm
- Drainage: ${detailedForm.drainage}
- Location: ${detailedForm.location}
- Land Size: ${detailedForm.landSize} acres

CLIMATE DATA:
- Season: ${detailedForm.season}
- Annual Rainfall: ${detailedForm.rainfall}mm
- Temperature Range: ${detailedForm.minTemp}°C to ${detailedForm.maxTemp}°C

FARMING INFRASTRUCTURE:
- Irrigation Type: ${detailedForm.irrigationType}
- Previous Fertilizer: ${detailedForm.fertilizerUsed}

CROP ROTATION HISTORY:
- Year 1: ${detailedForm.cropHistory.year1}
- Year 2: ${detailedForm.cropHistory.year2}
- Year 3: ${detailedForm.cropHistory.year3}

Return ONLY a JSON array of 5 crop recommendations in ${userLang}, each with:
- "crop": crop name in ${userLang}
- "reason": detailed scientific explanation in ${userLang} covering soil compatibility, nutrient requirements, climate suitability, and expected yield
- "soilMatch": percentage match with current soil conditions
- "expectedYield": estimated yield per acre
- "season": best planting season
- "waterNeeds": water requirement level (High/Medium/Low)

Example format:
[
  {
    "crop": "crop name in ${userLang}",
    "reason": "detailed scientific explanation in ${userLang}",
    "soilMatch": "85%",
    "expectedYield": "2-3 tons/acre",
    "season": "Kharif/Rabi",
    "waterNeeds": "Medium"
  }
]

You must respond entirely in ${userLang} language. No English text should appear in the response.`;
  };

  const getBasicPrompt = () => {
    const langCode = (localStorage.getItem('i18nextLng') || 'en');
    const userLang = langCode === 'ta' ? 'Tamil' : langCode === 'en' ? 'English' : langCode;

    return `You must respond entirely in ${userLang} language. Given the following farm conditions, recommend the best four crops to grow. 
Return ONLY a JSON array of objects, each with "crop" and "reason" fields in ${userLang}. 
You must respond entirely in ${userLang} language. No English text should appear in the response.

Farm conditions:
Soil type: ${basicForm.soil}
Season: ${basicForm.season}
Water availability: ${basicForm.water ? "High" : "Low"}
Land size: ${basicForm.landSize}
Previous crop: ${basicForm.previousCrop}
Location: ${basicForm.location}

Example format:
[
  {"crop": "crop name in ${userLang}", "reason": "explanation in ${userLang}"},
  {"crop": "crop name in ${userLang}", "reason": "explanation in ${userLang}"}
]`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRecommendedCrops([]);

    try {
      const prompt = formType === 'detailed' ? getDetailedPrompt() : getBasicPrompt();

      const res = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await res.json();
      const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      let crops = [];
      try {
        crops = JSON.parse(geminiText);
      } catch {
        // fallback: try to extract JSON from the response
        const match = geminiText.match(/\[.*\]/s);
        if (match) {
          try {
            crops = JSON.parse(match[0]);
          } catch {
            setError("Failed to parse recommendation data");
            return;
          }
        } else {
          setError("Failed to get valid recommendation format");
          return;
        }
      }

      setRecommendedCrops(crops);
    } catch (err) {
      setError("Failed to get recommendation from AI service.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCrop = async (cropName) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: cropName, price: 0 })
      });
      if (!res.ok) throw new Error('Failed to add crop');
      toast.success(t('add_crop_success'));
    } catch {
      toast.error(t('add_crop_failed'));
    }
  };

  const renderBasicForm = () => (
    <form onSubmit={handleSubmit}>
      <div className="px-1 py-3 mb-4">
        <h3 className="font-semibold text-lg text-gray-800">{t('basic_information')}</h3>
      </div>

      <div className="mb-4">
        <label htmlFor="soil" className="block text-xs mb-1 font-medium text-gray-700">{t('soil_type')}</label>
        <div className="relative h-10">
          <select
            id="soil"
            name="soil"
            className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none"
            value={basicForm.soil}
            onChange={handleBasicChange}
          >
            <option>{t('loamy')}</option>
            <option>{t('sandy')}</option>
            <option>{t('clay')}</option>
            <option>{t('black_cotton')}</option>
            <option>{t('red_soil')}</option>
            <option>{t('aluvi')}</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <fieldset className="mb-4 bg-white p-4 rounded-xl shadow-sm">
        <legend className="text-xs font-medium text-gray-700 px-1">{t('growing_conditions')}</legend>
        <div className="space-y-3">
          <div>
            <p className="text-xs mb-2 font-medium text-gray-700">{t('season')}</p>
            <div className="flex items-center space-x-4 text-xs">
              <label className="flex items-center space-x-2 bg-white px-3 py-2 border rounded-xl">
                <input
                  type="radio"
                  name="season"
                  value="summer"
                  checked={basicForm.season === "summer"}
                  onChange={handleBasicChange}
                  className="text-green-500 focus:ring-green-400"
                />
                <span>{t('summer')}</span>
              </label>
              <label className="flex items-center space-x-2 bg-white px-3 py-2 border rounded-xl">
                <input
                  type="radio"
                  name="season"
                  value="winter"
                  checked={basicForm.season === "winter"}
                  onChange={handleBasicChange}
                  className="text-green-500 focus:ring-green-400"
                />
                <span>{t('winter')}</span>
              </label>
            </div>
          </div>

          <div>
            <p className="text-xs mb-2 font-medium text-gray-700">{t('water_availability')}</p>
            <label className="flex items-center space-x-2 text-xs bg-white px-3 py-2 border rounded-xl">
              <input
                type="checkbox"
                name="water"
                checked={basicForm.water}
                onChange={handleBasicChange}
                className="text-green-500 focus:ring-green-400"
              />
              <span>{t('high')}</span>
            </label>
          </div>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="landSize" className="block text-xs mb-1 font-medium text-gray-700">{t('land_size')}</label>
          <div className="h-10">
            <input
              type="number"
              id="landSize"
              name="landSize"
              value={basicForm.landSize}
              onChange={handleBasicChange}
              className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
              min="0"
              placeholder="e.g. 2"
            />
          </div>
        </div>

        <div>
          <label htmlFor="previousCrop" className="block text-xs mb-1 font-medium text-gray-700">{t('previous_crop')}</label>
          <div className="h-10">
            <input
              type="text"
              id="previousCrop"
              name="previousCrop"
              value={basicForm.previousCrop}
              onChange={handleBasicChange}
              className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g. Rice"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="location" className="block text-xs mb-1 font-medium text-gray-700">{t('location_label')}</label>
        <div className="h-10">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input
            type="text"
            id="location"
            name="location"
            value={basicForm.location}
            onChange={handleBasicChange}
            className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 pl-10 focus:ring-1 focus:ring-green-500 focus:border-green-500"
            placeholder="e.g. Karnataka"
          />
        </div>
      </div>

      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 w-auto mx-auto rounded-xl shadow-sm hover:bg-green-600 font-medium text-sm flex items-center justify-center gap-1 transition-colors"
        disabled={loading}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('submit')}
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            {t('submit')}
          </>
        )}
      </button>
    </form>
  );

  const renderDetailedForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Information */}
      <div className="px-1 py-3 mb-4">
        <h3 className="font-semibold text-gray-800 text-lg">{t('basic_information')}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label htmlFor="soil" className="block text-xs mb-1">{t('soil_type')}</label>
          <div className="relative h-10">
            <select
              id="soil"
              name="soil"
              className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none"
              value={detailedForm.soil}
              onChange={handleDetailedChange}
            >
              <option>Loamy</option>
              <option>Sandy</option>
              <option>Clayey</option>
              <option>Black Cotton</option>
              <option>Red</option>
              <option>Alluvial</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="season" className="block text-xs mb-1">{t('season')}</label>
          <div className="relative h-10">
            <select
              id="season"
              name="season"
              className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none"
              value={detailedForm.season}
              onChange={handleDetailedChange}
            >
              <option value="summer">{t('summer')}</option>
              <option value="winter">{t('winter')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="landSize" className="block text-xs mb-1">{t('land_size')}</label>
            <div className="">
              <input
                type="number"
                id="landSize"
                name="landSize"
                value={detailedForm.landSize}
                onChange={handleDetailedChange}
                className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                min="0"
                placeholder="e.g. 2"
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-xs mb-1">{t('location_label')}</label>
            <div className="">
              <input
                type="text"
                id="location"
                name="location"
                value={detailedForm.location}
                onChange={handleDetailedChange}
                className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g. Karnataka"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Soil Composition */}
      <div className="px-1 py-3 mb-4">
        <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
          </svg>
          {t('soil_composition')}
        </h3>
      </div>
      <div className="p-4 bg-white rounded-xl shadow-sm mb-5">

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label htmlFor="phLevel" className="block text-xs mb-1">{t('ph_level')}</label>
            <div className="">
              <input
                type="number"
                id="phLevel"
                name="phLevel"
                value={detailedForm.phLevel}
                onChange={handleDetailedChange}
                className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                min="0"
                max="14"
                step="0.1"
                placeholder={t('soil_ph_placeholder')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="organicMatter" className="block text-xs mb-1">{t('organic_matter')}</label>
            <div className="">
              <input
                type="number"
                id="organicMatter"
                name="organicMatter"
                value={detailedForm.organicMatter}
                onChange={handleDetailedChange}
                className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                min="0"
                max="100"
                step="0.1"
                placeholder={t('organic_matter_placeholder')}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label htmlFor="nitrogen" className="block text-xs mb-1">{t('nitrogen_content')}</label>
            <div className="">
              <input
                type="number"
                id="nitrogen"
                name="nitrogen"
                value={detailedForm.nitrogen}
                onChange={handleDetailedChange}
                className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                min="0"
                max="100"
                step="0.1"
                placeholder={t('nitrogen_placeholder')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="phosphorus" className="block text-xs mb-1">{t('phosphorus_content')}</label>
            <div className="">
              <input
                type="number"
                id="phosphorus"
                name="phosphorus"
                value={detailedForm.phosphorus}
                onChange={handleDetailedChange}
                className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                min="0"
                max="100"
                step="0.1"
                placeholder={t('phosphorus_placeholder')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="potassium" className="block text-xs mb-1">{t('potassium_content')}</label>
            <div className="">
              <input
                type="number"
                id="potassium"
                name="potassium"
                value={detailedForm.potassium}
                onChange={handleDetailedChange}
                className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                min="0"
                max="100"
                step="0.1"
                placeholder={t('potassium_placeholder')}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor="soilMoisture" className="block text-xs mb-1">{t('soil_moisture')}</label>
            <div className="">
              <input
                type="number"
                id="soilMoisture"
                name="soilMoisture"
                value={detailedForm.soilMoisture}
                onChange={handleDetailedChange}
                className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                min="0"
                max="100"
                step="0.1"
                placeholder={t('moisture_placeholder')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="soilDepth" className="block text-xs mb-1">{t('soil_depth')}</label>
            <div className="">
              <input
                type="number"
                id="soilDepth"
                name="soilDepth"
                value={detailedForm.soilDepth}
                onChange={handleDetailedChange}
                className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                min="0"
                placeholder={t('depth_placeholder')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="drainage" className="block text-xs mb-1">{t('drainage')}</label>
            <div className="">
              <select
                id="drainage"
                name="drainage"
                className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                value={detailedForm.drainage}
                onChange={handleDetailedChange}
              >
                <option value="good">{t('good_drainage')}</option>
                <option value="moderate">{t('moderate_drainage')}</option>
                <option value="poor">{t('poor_drainage')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Climate Data */}
      <div className="px-1 py-3 mb-4">
        <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
          </svg>
          {t('temperature_range')}
        </h3>
      </div>
      <div className="p-4 bg-white rounded-xl shadow-sm mb-5">

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="rainfall" className="block text-xs mb-1">{t('rainfall_annual')}</label>
            <div className="">
              <input
                type="number"
                id="rainfall"
                name="rainfall"
                value={detailedForm.rainfall}
                onChange={handleDetailedChange}
                className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                min="0"
                placeholder={t('rainfall_placeholder')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="minTemp" className="block text-xs mb-1">{t('min_temperature')}</label>
            <div className="">
              <input
                type="number"
                id="minTemp"
                name="minTemp"
                value={detailedForm.minTemp}
                onChange={handleDetailedChange}
                className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g. 15"
              />
            </div>
          </div>

          <div>
            <label htmlFor="maxTemp" className="block text-xs mb-1">{t('max_temperature')}</label>
            <div className="">
              <input
                type="number"
                id="maxTemp"
                name="maxTemp"
                value={detailedForm.maxTemp}
                onChange={handleDetailedChange}
                className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g. 35"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Irrigation & Farming History */}
      <div className="px-1 py-3 mb-4">
        <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7z" clipRule="evenodd" />
          </svg>
          {t('farming_infrastructure')}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label htmlFor="irrigationType" className="block text-xs mb-1">{t('irrigation_type')}</label>
          <div className="">
            <select
              id="irrigationType"
              name="irrigationType"
              className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
              value={detailedForm.irrigationType}
              onChange={handleDetailedChange}
            >
              <option value="drip">{t('drip_irrigation')}</option>
              <option value="sprinkler">{t('sprinkler_irrigation')}</option>
              <option value="flood">{t('flood_irrigation')}</option>
              <option value="rainfed">{t('rainfed')}</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="fertilizerUsed" className="block text-xs mb-1">{t('fertilizer_used')}</label>
          <div className="">
            <select
              id="fertilizerUsed"
              name="fertilizerUsed"
              className="w-full h-full text-xs rounded-xl border border-gray-200 px-4 py-2 focus:ring-1 focus:ring-green-500 focus:border-green-500"
              value={detailedForm.fertilizerUsed}
              onChange={handleDetailedChange}
            >
              <option value="organic">{t('organic_fertilizer')}</option>
              <option value="chemical">{t('chemical_fertilizer')}</option>
              <option value="mixed">{t('mixed_fertilizer')}</option>
              <option value="none">{t('no_fertilizer')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs mb-2">{t('crop_history')}</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              name="cropHistory.year1"
              value={detailedForm.cropHistory.year1}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              placeholder={t('year_1')}
            />
            <input
              type="text"
              name="cropHistory.year2"
              value={detailedForm.cropHistory.year2}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              placeholder={t('year_2')}
            />
            <input
              type="text"
              name="cropHistory.year3"
              value={detailedForm.cropHistory.year3}
              onChange={handleDetailedChange}
              className="w-full text-xs rounded border border-gray-300 px-2 py-1"
              placeholder={t('year_3')}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 w-auto mx-auto rounded-xl shadow-sm hover:bg-green-600 font-medium text-sm flex items-center justify-center gap-1 transition-colors"
        disabled={loading}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('submit')}
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            {t('submit')}
          </>
        )}
      </button>
    </form>
  );

  const renderCropCard = (crop, idx) => {
    const isDetailed = formType === 'detailed';
    const borderColors = [
      'border-green-200',
      'border-blue-200',
      'border-amber-200'
    ];
    const borderColor = borderColors[idx % 3];

    return (
      <article key={crop.crop + idx} className={`bg-white ${borderColor} p-5 rounded-2xl shadow-sm flex flex-col h-full border`}>
        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm flex-shrink-0 bg-white p-0.5">
            <img
              src={cropImages[crop.crop] || cropImages.Tomato}
              alt={`Image of ${crop.crop}`}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <h3 className="font-bold text-sm text-gray-800">{crop.crop}</h3>
        </div>

        <div className="flex-grow flex flex-col mb-3">
          <p className="text-xs text-gray-700 mb-3 line-clamp-3">{crop.reason}</p>

          {isDetailed && (
            <div className="grid grid-cols-2 gap-2 mt-auto text-xs bg-white rounded p-3 shadow-sm">
              {crop.soilMatch && <div className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span><strong>Soil Match:</strong> {crop.soilMatch}</div>}
              {crop.expectedYield && <div className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span><strong>Expected Yield:</strong> {crop.expectedYield}</div>}
              {crop.season && <div className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-full"></span><strong>Season:</strong> {crop.season}</div>}
              {crop.waterNeeds && <div className="flex items-center gap-1"><span className="w-2 h-2 bg-cyan-500 rounded-full"></span><strong>Water Needs:</strong> {crop.waterNeeds}</div>}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-gray-200 mt-auto">
          <button
            onClick={() => handleAddCrop(crop.crop)}
            className="bg-green-500 hover:bg-green-600 transition-colors text-white px-2 py-1.5 w-auto mx-auto rounded-lg shadow-sm font-medium text-xs flex items-center justify-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('add')}
          </button>
        </div>
      </article>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 py-6 md:px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="bg-white p-5 sm:p-6 mb-6 ">
          <div className="flex items-center gap-5">

            <div>
              <h1 className="text-xl font-bold text-gray-800 mb-1 tracking-tight">{t('crop_recommendation')}</h1>
              <p className="text-gray-500 text-sm">{t('get_personalized_crop_recommendations') || 'Get personalized crop recommendations based on your soil and climate conditions'}</p>
            </div>
          </div>
        </div>

        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          toastClassName="!bg-green-600 !text-white"
          bodyClassName="!text-white"
        />

        {/* Input Section */}
        <div className="flex flex-col md:flex-row gap-6 min-h-[600px]">
          <section
            aria-labelledby="input-data-title"
            className="bg-white px-3 md:px-4 xl:px-6 w-full max-w-md py-3 rounded-2xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-50 to-green-100 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 id="input-data-title" className="font-bold text-lg text-gray-800">
                  {t('input_your_data')}
                </h2>
              </div>

              {/* Form Type Toggle */}
              <div className="flex mb-6 gap-1 bg-gray-100  max-h-14 p-1 rounded-xl shadow-inner">
                <button
                  type="button"
                  onClick={() => setFormType('basic')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${formType === 'basic'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1">

                    {t('basic_form')}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('detailed')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${formType === 'detailed'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1">

                    {t('detailed_form')}
                  </div>
                </button>
              </div>
            </div>

            {formType === 'basic' ? renderBasicForm() : renderDetailedForm()}

            {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
          </section>

          {/* Suggested Crops */}
          <section className="flex-1 bg-white p-6 shadow-sm rounded-2xl flex flex-col md:sticky md:top-6 self-start">
            <div className="mb-5">
              <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                {formType === 'detailed' ? t('soil_recommendations') : t('suggested_crops')}
              </h2>
            </div>

            {loading && (
              <div className="flex-grow flex items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-gray-100 border-t-green-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500">{formType === 'detailed' ? t('analyzing_soil') : t('getting_recommendation')}</p>
                </div>
              </div>
            )}

            <div className={`${loading ? 'hidden' : 'flex-grow'} min-h-[300px] grid ${formType === 'detailed' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-1 lg:grid-cols-2'} gap-4 auto-rows-fr`}>
              {recommendedCrops.length === 0 && !loading ? (
                <div className="flex-grow flex flex-col items-center justify-center p-8 rounded-2xl border border-gray-200 bg-white">
                  <div className="bg-gray-100 rounded-full p-4 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700 mb-1 font-medium">{t('no_recommendations_yet')}</p>
                  <p className="text-xs text-gray-500 text-center max-w-xs">{t('fill_form_prompt')}</p>
                  <div className="mt-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    <span className="text-xs text-green-500">{t('fill_form')}</span>
                  </div>
                </div>
              ) : (
                recommendedCrops.map((crop, idx) => renderCropCard(crop, idx))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Croprecommation;