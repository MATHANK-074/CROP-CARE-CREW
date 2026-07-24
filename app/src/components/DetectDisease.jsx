import React, { use, useRef, useState } from 'react'
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next'

// Get API keys and URLs from environment variables
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + import.meta.env.VITE_GEMINI_API_KEY;
const DISEASE_API_URL = import.meta.env.VITE_DISEASE_API_URL || "http://127.0.0.1:8000";

function DetectDisease() {
  const { t } = useTranslation();
  const [image, setImage] = useState("");
  const [analysis, setAnalysis] = useState({
    detected: "",
    description: "",
    treatment: "",
    advice: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSpreadable, setIsSpreadable] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [analysisData, setAnalysisData] = useState(null); // Store bilingual data
  const [locationType, setLocationType] = useState('current'); // 'current' or 'field'
  const [crops, setCrops] = useState([]); // Store user's crops
  const [selectedCropId, setSelectedCropId] = useState(''); // Selected crop for disease reporting
  const [cropsLoading, setCropsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch user's crops for disease reporting
  const fetchUserCrops = async () => {
    setCropsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userCrops = await response.json();
        // Filter to only growing crops where disease can be reported
        const activeCrops = userCrops.filter(crop =>
          crop.status === 'Growing' || crop.status === 'Planning'
        );
        setCrops(activeCrops);
      }
    } catch (error) {
      console.error('Error fetching crops:', error);
    } finally {
      setCropsLoading(false);
    }
  };

  // Function to store disease in crop's pest/disease history
  const storeDiseaseInCrop = async (cropId, diseaseData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops/${cropId}/pest-disease`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(diseaseData)
      });

      return response.ok;
    } catch (error) {
      console.error('Error storing disease in crop:', error);
      return false;
    }
  };

  const handleRetake = () => {
    setImage("")
    setAnalysis(null)
    setAnalysisData(null)
    setIsSpreadable(false)
    setReportSubmitted(false)
    setError("")
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Function to update display when language changes
  const updateDisplayLanguage = () => {
    if (analysisData) {
      const langCode = (localStorage.getItem('i18nextLng') || 'en');
      const currentLang = langCode === 'ta' ? 'tamil' : 'english';
      const displayData = analysisData[currentLang];

      setAnalysis({
        detected: displayData.disease,
        description: displayData.description || "",
        treatment: displayData.treatment || "",
        advice: displayData.advice || ""
      });
    }
  }

  // Update display when component mounts or language changes
  React.useEffect(() => {
    updateDisplayLanguage();
    fetchUserCrops(); // Fetch crops when component mounts
    // Using localStorage directly in the dependency array is incorrect
    // Instead, we should set up an event listener for storage changes
    const handleStorageChange = () => {
      updateDisplayLanguage();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [analysisData]);

  const handleReportIssue = async () => {
    if (!analysis || !isSpreadable) return;

    setReportLoading(true);
    try {
      let userLocation = null;

      if (locationType === 'field') {
        // Get user's field location from localStorage
        try {
          const userLocationStr = localStorage.getItem('userLocation');

          if (userLocationStr) {
            const storedLocation = JSON.parse(userLocationStr);

            if (storedLocation && storedLocation.type === 'Point' && Array.isArray(storedLocation.coordinates)) {
              userLocation = storedLocation;
            } else {
              toast.error(t('field_location_not_set') || 'Field location not set in your profile. Please update your profile first.');
              setReportLoading(false);
              return;
            }
          } else {
            toast.error(t('field_location_not_set') || 'Field location not set in your profile. Please update your profile first.');
            setReportLoading(false);
            return;
          }
        } catch (parseError) {
          console.error('Error parsing user location:', parseError);
          toast.error(t('error_fetching_field_location') || 'Error fetching field location. Please try current location instead.');
          setReportLoading(false);
          return;
        }
      } else {
        // Use current GPS location
        if (navigator.geolocation) {
          await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                userLocation = {
                  type: 'Point',
                  coordinates: [pos.coords.longitude, pos.coords.latitude]
                };
                resolve();
              },
              () => resolve()
            );
          });
        }
      }

      if (userLocation) {
        // Store disease in selected crop's history if a crop is selected
        if (selectedCropId) {
          const diseaseData = {
            date: new Date().toISOString(),
            type: 'disease',
            name: analysis.englishName || analysis.detected,
            severity: 5, // Default severity, could be made configurable
            affectedArea: 'Detected via AI analysis',
            treatment: analysis.treatment ? {
              product: '',
              applicationDate: null,
              amount: 0,
              method: analysis.treatment
            } : null,
            effectiveness: null,
            notes: `AI-detected disease: ${analysis.description}. Treatment: ${analysis.treatment}. Advice: ${analysis.advice}`
          };

          const cropStoreSuccess = await storeDiseaseInCrop(selectedCropId, diseaseData);
          if (cropStoreSuccess) {
            console.log('Disease successfully stored in crop history');
          } else {
            console.error('Failed to store disease in crop history');
          }
        }

        console.log('Reporting disease to:', `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/disease/report`);
        console.log('Report data:', {
          disease: analysis.detected,
          description: analysis.description,
          location: userLocation,
          locationType: locationType,
          selectedCropId: selectedCropId
        });

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/disease/report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            disease: analysis.englishName || analysis.detected, // Always use English name for storage
            description: analysis.description,
            location: userLocation,
            locationType: locationType,
            selectedCropId: selectedCropId,
            // Include bilingual data if available
            bilingualData: analysisData ? {
              english: analysisData.english,
              tamil: analysisData.tamil
            } : null
          })
        });

        console.log('Report response status:', response.status);
        const responseText = await response.text();
        console.log('Report response:', responseText);

        if (response.ok) {
          const successMessage = selectedCropId
            ? t('disease_recorded_and_reported') || 'Disease recorded in your crop history and nearby farmers notified!'
            : t('disease_reported_successfully') || 'Disease reported successfully! Nearby farmers will be notified.';
          toast.success(successMessage);
          setReportSubmitted(true); // Mark report as submitted
        } else {
          console.error('Report failed:', responseText);
          toast.error(t('report_failed') || `Failed to report disease: ${responseText}`);
        }
      } else {
        toast.error(t('location_required') || 'Location access required to report disease outbreak.');
      }
    } catch (error) {
      console.error('Report error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast.error(t('report_error') || `Error reporting disease: ${error.message}. Please check console for details.`);
    } finally {
      console.log('Setting report loading to false');
      setReportLoading(false);
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const imageDataUrl = ev.target.result
        setImage(imageDataUrl)
        setLoading(true);
        setError("");

        // get prediction from our new disease prediction endpoint
        const formData = new FormData();
        formData.append("file", file); // FastAPI expects 'file' as the field name

        try {
          // Call your FastAPI disease classification model
          const res = await fetch(`${DISEASE_API_URL}/predict`, {
            method: "POST",
            body: formData, // Use FormData for file uploads
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            setError(errorData.detail || "Unknown error from prediction API");
            setLoading(false);
            return;
          }

          const pred = await res.json();
          // The prediction result from your FastAPI model

          // Extract the prediction results from your model
          const predictedClass = pred.class_name || "Unknown";
          const confidence = pred.confidence || 0;

          // show immediate minimal prediction
          setAnalysis({
            detected: predictedClass,
            description: `Confidence: ${(confidence * 100).toFixed(2)}%`,
            treatment: "",
            advice: ""
          });

          // Prepare language and prompt for Gemini — get response in both languages
          const langCode = (localStorage.getItem('i18nextLng') || 'en');

          const prompt = `Given the plant disease prediction "${predictedClass}", provide detailed information about this disease in BOTH English and Tamil languages.

IMPORTANT: Also determine if this disease is SPREADABLE/CONTAGIOUS to other plants (can spread from plant to plant through air, water, insects, contact, etc.).

Return ONLY a JSON object with this structure:
{
  "english": {
    "disease": "disease name in English",
    "description": "description in English", 
    "treatment": "treatment in English",
    "advice": "advice in English"
  },
  "tamil": {
    "disease": "disease name in Tamil",
    "description": "description in Tamil",
    "treatment": "treatment in Tamil", 
    "advice": "advice in Tamil"
  },
  "spreadable": true/false
}

Ensure all Tamil text is properly written in Tamil script. No extra text, just valid JSON.`;

          // Call Gemini with prompt
          try {
            const gRes = await fetch(GEMINI_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
              })
            });

            if (!gRes.ok) {
              const text = await gRes.text().catch(() => '');
              throw new Error(`Gemini API error ${gRes.status}: ${text}`);
            }

            const gData = await gRes.json();
            const geminiText = gData.candidates?.[0]?.content?.parts?.[0]?.text || "";

            let result = null;
            try {
              result = JSON.parse(geminiText);
            } catch {
              const match = geminiText.match(/\{[\s\S]*\}/);
              if (match) {
                try { result = JSON.parse(match[0]); } catch { result = null }
              }
            }

            if (result && result.english && result.tamil) {
              // Store bilingual data
              setAnalysisData(result);

              // Set current language display
              const currentLang = langCode === 'ta' ? 'tamil' : 'english';
              const displayData = result[currentLang];

              setAnalysis({
                detected: displayData.disease,
                description: displayData.description || "",
                treatment: displayData.treatment || "",
                advice: displayData.advice || ""
              });

              // Set spreadable status
              setIsSpreadable(result.spreadable === true);

            } else {
              setError("Invalid response from Gemini.");
              toast.error("Invalid response from Gemini.");
            }
          } catch (gemErr) {
            console.error(gemErr);
            setError("Failed to get analysis from Gemini.");
            toast.error("Failed to get analysis from Gemini.");
          }

        } catch (err) {
          console.error(err);
          setError("Failed to communicate with disease API");
        } finally {
          setLoading(false);
        }
      }
      reader.readAsDataURL(file)
    }
  }


  const card = "bg-white sm:p-1  rounded-md sm:px-1 md:px-3 xl:px-6 shadow shadow-sm shadow-gray-200 p-4  m-0";
  const sectionTitle = "text-xl font-bold text-gray-800 mb-2 tracking-tight";
  const subTitle = "text-md font-semibold text-gray-600 mb-2";
  const buttonPrimary = "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition";
  const buttonSecondary = "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow transition";
  const iconBox = "flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-50 to-green-100 shadow text-green-600 text-2xl";

  return (
    <div className="min-h-screen bg-gray-50   sm:px-0 md:px-3 xl:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Disease Detection Section */}
        <div className={`${card} w-full`}>
          <div className="flex items-center gap-4 sm:gap-0 mb-4">
            <div className={iconBox}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className='pl-4'>
              <h2 className={`${sectionTitle}   `}>{t('disease_detection')}</h2>
              <p className="text-gray-500 text-sm">{t('upload_plant_images')}</p>
            </div>
          </div>

          {/* Image Upload Container - Full Width */}
          <div className="w-full mb-6 overflow-visible">
            <div className="overflow-visible">
              {image ? (
                <div className=" rounded-lg overflow-hidden shadow-lg border border-gray-200 h-80 w-full max-w-3xl mx-auto">
                  <img
                    src={image}
                    alt="Uploaded plant leaf"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      className="bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition"
                      onClick={handleRetake}
                      title={t('retake_photo')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-80 w-full max-w-3xl mx-auto hover:border-green-500 transition duration-300 cursor-pointer overflow-visible" onClick={handleUploadClick}>
                  <div className="text-center p-6">
                    <div className="mb-4 bg-green-50 p-4 rounded-full inline-flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">{t('upload_plant_images')}</h3>
                    <p className="text-sm text-gray-500 mb-4">{t('drag_and_drop') || 'Drag and drop your image here or click to browse'}</p>
                    <button className={buttonPrimary + " inline-flex items-center"}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {t('upload_new_image')}
                    </button>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* AI Analysis Results - Full Width */}
          <div className="w-full clear-both">
            <div className="mb-4 flex justify-between items-center">
              <h3 className={`${sectionTitle} `}>{t('ai_analysis_results')}</h3>

              {/* Language Toggle Button */}
              {analysisData && !loading && (
                <button
                  onClick={() => {
                    const currentLang = localStorage.getItem('i18nextLng') || 'en';
                    const newLang = currentLang === 'ta' ? 'en' : 'ta';
                    localStorage.setItem('i18nextLng', newLang);
                    updateDisplayLanguage();
                  }}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm px-3 py-1 rounded-lg transition-colors shadow-sm"
                >
                  {(localStorage.getItem('i18nextLng') || 'en') === 'ta' ? 'English' : 'தமிழ்'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-6 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">{t('analyzing')}</p>
              </div>
            ) : analysis ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow transition">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <h4 className=" font-semibold text-gray-800">{t('disease_detected')}</h4>
                  </div>
                  <p className="text-gray-700">{analysis.detected}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow transition">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <h4 className="font-semibold text-gray-800">{t('description')}</h4>
                  </div>
                  <p className="text-gray-700">{analysis.description}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow transition">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <h4 className="font-semibold text-gray-800">{t('treatment')}</h4>
                  </div>
                  <p className="text-gray-700">{analysis.treatment}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-100 shadow-sm hover:shadow transition">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="font-semibold text-green-800">{t('advice')}</h4>
                  </div>
                  <p className="text-green-700">{analysis.advice}</p>
                </div>
              </div>
            ) : null}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 shadow-sm">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Spreadable Disease Warning and Report Button */}
            {analysis && !loading && isSpreadable && (
              <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-orange-800 font-medium">
                    {t('spreadable_disease_warning') || 'Warning: This disease can spread to other plants'}
                  </span>
                </div>
                <p className="text-orange-700 mb-4">
                  {t('report_help_farmers') || 'Report this issue to help alert nearby farmers and prevent further spread.'}
                </p>

                {/* Location Selection */}
                <div className="space-y-3 mt-2">
                  <p className="text-orange-800 font-medium">
                    {t('select_detection_location') || 'Where was this disease detected?'}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-orange-100 p-2 rounded-lg transition">
                      <input
                        type="radio"
                        value="current"
                        checked={locationType === 'current'}
                        onChange={(e) => setLocationType(e.target.value)}
                        className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-orange-700">
                        {t('current_location') || 'Current Location (GPS)'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-orange-100 p-2 rounded-lg transition">
                      <input
                        type="radio"
                        value="field"
                        checked={locationType === 'field'}
                        onChange={(e) => setLocationType(e.target.value)}
                        className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-orange-700">
                        {t('my_field') || 'My Field/Farm'}
                      </span>
                    </label>
                  </div>
                  {locationType === 'field' && (
                    <p className="text-orange-600 bg-orange-100 p-3 rounded-lg">
                      {t('field_location_note') || 'This will use your saved field location from your profile.'}
                    </p>
                  )}
                </div>

                {/* Crop Selection */}
                <div className="space-y-3 mt-4">
                  <p className="text-orange-800 font-medium">
                    {t('select_affected_crop') || 'Which crop is affected? (Optional)'}
                  </p>
                  {cropsLoading ? (
                    <div className="flex items-center gap-2 p-3 bg-orange-100 rounded-lg">
                      <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-orange-700">{t('loading_crops') || 'Loading your crops...'}</span>
                    </div>
                  ) : crops.length > 0 ? (
                    <select
                      value={selectedCropId}
                      onChange={(e) => setSelectedCropId(e.target.value)}
                      className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    >
                      <option value="">{t('no_specific_crop') || 'No specific crop (general area)'}</option>
                      {crops.map(crop => (
                        <option key={crop._id} value={crop._id}>
                          {crop.name} {crop.variety ? `(${crop.variety})` : ''} - {crop.status}
                          {crop.location && ` • ${crop.location}`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <p className="text-gray-600">
                        {t('no_active_crops') || 'No active crops found. The disease will be reported as a general area issue.'}
                      </p>
                    </div>
                  )}
                  {selectedCropId && (
                    <p className="text-orange-600 bg-orange-100 p-3 rounded-lg text-sm">
                      <strong>{t('note') || 'Note'}:</strong> {t('crop_disease_record_note') || 'This disease will be recorded in your crop history for tracking and management purposes.'}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleReportIssue}
                  disabled={reportLoading || reportSubmitted}
                  className={`w-full mt-4 font-medium py-2 px-4 rounded-lg shadow transition-colors ${reportSubmitted
                    ? 'bg-green-600 text-white cursor-not-allowed'
                    : reportLoading
                      ? 'bg-orange-400 text-white cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                >
                  {reportSubmitted ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      {t('report_submitted') || 'Report Submitted Successfully'}
                    </span>
                  ) : reportLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('reporting') || 'Reporting...'}
                    </span>
                  ) : (
                    t('report_disease_outbreak') || 'Report Disease Outbreak'
                  )}
                </button>
              </div>
            )}

            {/* Non-spreadable Disease Info */}
            {analysis && !loading && !isSpreadable && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-800 font-medium">
                    {t('non_spreadable_disease') || 'This disease is not contagious to other plants'}
                  </span>
                </div>
                <p className="text-green-700">
                  {t('isolated_treatment') || 'You can treat this plant individually without concern for spreading.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetectDisease;
