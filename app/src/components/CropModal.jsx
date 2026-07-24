import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faCheck,
  faCalendarAlt,
  faMapMarkerAlt,
  faSeedling,
  faWater,
  faLeaf,
  faRupeeSign,
  faDollarSign,
  faChartLine,
  faArrowRight,
  faArrowLeft,
  faEdit,
  faSave,
  faSpinner,
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
  faMagic
} from '@fortawesome/free-solid-svg-icons';
import Button from './ui/Button';
import Input from './ui/Input';

const CropModal = ({ isOpen, onClose, onAddCrop, loading, preloadedCropDetails, error }) => {
  const { t } = useTranslation();

  // State to track the current step
  const [currentStep, setCurrentStep] = useState(1);

  // State for AI generation
  const [generatingData, setGeneratingData] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    status: 'Growing',
    plantingDate: '',
    harvestDate: '',
    growthDays: '',
    seedSource: '',
    irrigationType: 'Drip',
    location: '',
    soilType: 'Loamy',
    previousCrop: '',
    notes: '',
    // New expense fields
    initialCost: {
      amount: '',
      category: 'seeds',
      description: '',
    },
  });

  // For simplified first step
  const [cropName, setCropName] = useState('');

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // Check if we have preloaded crop details
      if (preloadedCropDetails) {
        // Set crop name for first step
        setCropName(preloadedCropDetails.name || '');

        // Set form data with preloaded details
        const currentDate = new Date();
        const plantingDate = currentDate.toISOString().split('T')[0];

        let harvestDate = '';
        if (preloadedCropDetails.growthDays) {
          const harvestDateObj = new Date(currentDate);
          harvestDateObj.setDate(currentDate.getDate() + parseInt(preloadedCropDetails.growthDays, 10));
          harvestDate = harvestDateObj.toISOString().split('T')[0];
        }

        setFormData({
          name: preloadedCropDetails.name || '',
          variety: preloadedCropDetails.variety || '',
          status: preloadedCropDetails.status || 'Growing',
          plantingDate: plantingDate,
          harvestDate: harvestDate,
          growthDays: preloadedCropDetails.growthDays?.toString() || '',
          seedSource: preloadedCropDetails.seedSource || '',
          irrigationType: preloadedCropDetails.irrigationType || 'Drip',
          location: preloadedCropDetails.location || '',
          soilType: preloadedCropDetails.soilType || 'Loamy',
          previousCrop: preloadedCropDetails.previousCropRecommendation || '',
          notes: preloadedCropDetails.notes || '',
          initialCost: {
            amount: preloadedCropDetails.initialCost?.amount?.toString() || '',
            category: preloadedCropDetails.initialCost?.category || 'seeds',
            description: preloadedCropDetails.initialCost?.description || '',
          },
        });

        // Move directly to step 2 if we have preloaded details
        setCurrentStep(2);
      } else {
        // No preloaded data, reset the form
        setCropName('');
        setCurrentStep(1);
        setFormData({
          name: '',
          variety: '',
          status: 'Growing',
          plantingDate: '',
          harvestDate: '',
          growthDays: '',
          seedSource: '',
          irrigationType: 'Drip',
          location: '',
          soilType: 'Loamy',
          previousCrop: '',
          notes: '',
          initialCost: {
            amount: '',
            category: 'seeds',
            description: '',
          },
        });
      }

      // Get user location from localStorage when modal opens
      const userLocation = localStorage.getItem('userLocation') || '';
      if (userLocation) {
        setFormData(prev => ({
          ...prev,
          location: userLocation
        }));
      }
    }
  }, [isOpen, preloadedCropDetails]);

  const [errors, setErrors] = useState({});

  // Set external errors when provided
  useEffect(() => {
    if (error) {
      setErrors(prev => ({ ...prev, external: error }));
    }
  }, [error]);

  // API endpoint for Gemini
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + import.meta.env.VITE_GEMINI_API_KEY;

  // Function to generate crop data using Gemini AI
  const generateCropData = async (cropName) => {
    setGeneratingData(true);
    setErrors({});

    try {
      // Enhanced prompt for more detailed crop information with specific agricultural details
      const prompt = `Generate detailed agricultural information for "${cropName}" crop for a farming application. 
      Return a detailed JSON object with the following fields:
      {
        "name": "${cropName}",
        "variety": "most common or recommended variety name for this crop",
        "status": "Growing",
        "growthDays": precise number of days from planting to harvest based on typical growing conditions,
        "seedSource": "common reliable seed source or supplier",
        "irrigationType": one of ["Drip", "Sprinkler", "Flood", "Manual", "Rainwater"] based on optimal watering method for this crop,
        "soilType": one of ["Loamy", "Sandy", "Clayey", "Black Cotton", "Red", "Alluvial"] based on ideal soil conditions,
        "previousCropRecommendation": "recommended previous crop for optimal crop rotation with scientific reasoning",
        "fieldLocation": {
          "latitude": null,
          "longitude": null
        },
        "notes": "provide 2-3 sentences with essential growing tips, disease prevention, and best practices specific to this crop",
        "initialCost": {
          "amount": realistic estimated initial cost per acre in dollars (number only) based on current agricultural data,
          "category": most appropriate category from ["seeds", "fertilizer", "pesticide", "labor", "equipment"],
          "description": "brief detailed description of what initial expenses typically cover for this crop"
        }
      }
      
      Return ONLY valid JSON with no formatting issues, no extra text, markdown or code blocks.`;
      // Add timeout for API request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

      // Variable to store the crop data from AI
      let cropData;

      try {
        const response = await fetch(GEMINI_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2, // Lower temperature for more focused/precise responses
              topP: 0.8,
              topK: 40
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error("API error response:", response.status, response.statusText);
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (!geminiText) {
          throw new Error("Empty response from AI service");
        }
        try {
          // First try direct JSON parsing
          cropData = JSON.parse(geminiText);
        } catch (err) {
          // Try to extract JSON from response if it contains additional text
          const match = geminiText.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              cropData = JSON.parse(match[0]);
            } catch (innerErr) {
              console.error("JSON extraction failed:", innerErr);
              throw new Error("Failed to parse AI response");
            }
          } else {
            console.error("No JSON pattern found in response");
            throw new Error("Invalid response format from AI service");
          }
        }
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          throw new Error("Request timed out. Please try again.");
        }
        throw fetchError;
      }

      // Generate planting and harvest dates
      const currentDate = new Date();
      const plantingDate = currentDate.toISOString().split('T')[0];

      const harvestDate = new Date(currentDate);
      harvestDate.setDate(currentDate.getDate() + (cropData.growthDays || 90)); // Default to 90 days if not specified

      // Set the form data with the generated information
      setFormData({
        name: cropData.name || cropName,
        variety: cropData.variety || '',
        status: cropData.status || 'Growing',
        plantingDate: plantingDate,
        harvestDate: harvestDate.toISOString().split('T')[0],
        growthDays: cropData.growthDays?.toString() || '',
        seedSource: cropData.seedSource || '',
        irrigationType: cropData.irrigationType || 'Drip',
        location: formData.location || '',  // Keep existing location if available
        soilType: cropData.soilType || 'Loamy',
        previousCrop: cropData.previousCropRecommendation || '',
        notes: cropData.notes || '',
        initialCost: {
          amount: cropData.initialCost?.amount?.toString() || '',
          category: cropData.initialCost?.category || 'seeds',
          description: cropData.initialCost?.description || '',
        }
      });

      return cropData;
    } catch (error) {
      console.error("Error generating crop data:", error);

      // Provide more specific error messages based on error type
      let errorMessage = "Failed to generate crop data. Please enter details manually.";

      if (error.message.includes("timed out")) {
        errorMessage = "Request timed out. The AI service is taking too long to respond. Please try again later.";
      } else if (error.message.includes("API error")) {
        errorMessage = "AI service unavailable. Please try again later or enter details manually.";
      } else if (error.message.includes("parse")) {
        errorMessage = "Could not process AI response. Please try again with a different crop name.";
      }

      setErrors({ ai: errorMessage });

      // Set some default values to allow user to continue manually
      setFormData(prev => ({
        ...prev,
        name: cropName,
        status: 'Growing',
        plantingDate: new Date().toISOString().split('T')[0],
        irrigationType: 'Drip',
        soilType: 'Loamy'
      }));

      // Despite error, let user proceed to manual editing
      return false;
    } finally {
      setGeneratingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'plantingDate' || name === 'growthDays') {
      // Calculate harvest date if both planting date and growth days are available
      const updatedFormData = { ...formData, [name]: value };

      if (name === 'plantingDate' && updatedFormData.growthDays) {
        // Calculate harvest date when planting date changes
        const plantingDate = new Date(value);
        if (!isNaN(plantingDate.getTime())) {
          const harvestDate = new Date(plantingDate);
          harvestDate.setDate(plantingDate.getDate() + parseInt(updatedFormData.growthDays, 10));
          updatedFormData.harvestDate = harvestDate.toISOString().split('T')[0];
        }
      } else if (name === 'growthDays' && updatedFormData.plantingDate) {
        // Calculate harvest date when growth days change
        const plantingDate = new Date(updatedFormData.plantingDate);
        if (!isNaN(plantingDate.getTime()) && value) {
          const harvestDate = new Date(plantingDate);
          harvestDate.setDate(plantingDate.getDate() + parseInt(value, 10));
          updatedFormData.harvestDate = harvestDate.toISOString().split('T')[0];
        }
      }

      setFormData(updatedFormData);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear the error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  // Validate the current step
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      // Step 1: Only validate crop name
      if (!cropName.trim()) {
        newErrors.cropName = t('crop_name_required');
      }
    } else if (step === 2 || step === 3) {
      // Step 2 & 3: Validate full form

      // Name is required
      if (!formData.name.trim()) {
        newErrors.name = t('crop_name_required');
      }

      // Growth days should be a positive number if provided
      if (formData.growthDays) {
        const growthDays = parseInt(formData.growthDays, 10);
        if (isNaN(growthDays) || growthDays <= 0) {
          newErrors.growthDays = t('growth_days_positive');
        }
      }

      // Planting date is required if growth days are provided
      if (formData.growthDays && !formData.plantingDate) {
        newErrors.plantingDate = t('planting_date_required_for_growth');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle step navigation
  const handleNextStep = async () => {
    if (validateStep(currentStep)) {
      if (currentStep === 1) {
        setFormData(prevData => ({
          ...prevData,
          name: cropName // Ensure crop name is set in the form data
        }));

        try {
          // Generate crop data using AI
          const cropDataResult = await generateCropData(cropName);
          if (cropDataResult && Object.keys(cropDataResult).length > 0) {
            setCurrentStep(2);
          } else {
            throw new Error("No valid crop data returned");
          }
        } catch (error) {
          console.error("Error in crop data generation:", error);
          // If generation failed but user wants to continue manually
          const errorMessage = t('ai_error_continue_manually', "AI generation couldn't complete. Would you like to continue by entering details manually?");
          const proceedManually = window.confirm(errorMessage);

          if (proceedManually) {
            setCurrentStep(2);
          }
        }
      } else if (currentStep === 2) {
        // Move to final confirmation step
        setCurrentStep(3);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);

      // If going back to step 1, update crop name
      if (currentStep === 2) {
        setCropName(formData.name);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      // Process form data
      let cropData = { ...formData };
      // Make sure harvest date is calculated if needed
      if (formData.plantingDate && formData.growthDays && !formData.harvestDate) {
        const plantingDate = new Date(formData.plantingDate);
        const harvestDate = new Date(plantingDate);
        harvestDate.setDate(plantingDate.getDate() + parseInt(formData.growthDays, 10));
        cropData.harvestDate = harvestDate.toISOString().split('T')[0];
      }

      // Handle initial cost - remove from form data and add it to costs array if amount is provided
      const { initialCost, ...cropDataWithoutInitialCost } = cropData;

      // Prepare final data object
      const finalCropData = { ...cropDataWithoutInitialCost };

      // Add initial cost if provided
      if (initialCost && initialCost.amount && initialCost.amount > 0) {
        finalCropData.initialCost = {
          ...initialCost,
          date: new Date().toISOString().split('T')[0], // Today's date
          amount: parseFloat(initialCost.amount)
        };
      }
      try {
        // Check if onAddCrop exists
        if (typeof onAddCrop !== 'function') {
          console.error("onAddCrop is not a function:", onAddCrop);
          setErrors({ submit: "Configuration error: Add crop function is not available." });
          return;
        }

        // Call the onAddCrop function from props
        onAddCrop(finalCropData);
      } catch (error) {
        console.error("Error in onAddCrop:", error);
        setErrors({ submit: "Failed to add crop. Error: " + (error.message || 'Unknown error') });
      }
    } else {
    }
  };

  // Third step - Confirmation Screen
  const renderStep3 = () => (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
          <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xl" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">{t('confirm_crop_details') || 'Confirm Crop Details'}</h3>
        <p className="mt-2 text-sm text-gray-500">{t('review_before_saving') || 'Please review these details before saving'}</p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200 mb-6">
        <div className="flex items-center mb-3 pb-2 border-b border-green-100">
          <FontAwesomeIcon icon={faMagic} className="text-green-600 mr-2" />
          <span className="font-medium text-gray-800">{t('ai_optimized_crop_details') || 'AI-Optimized Crop Details'}</span>
        </div>
        <div className="grid grid-cols-2 gap-y-4">
          <div>
            <span className="text-sm font-medium text-gray-500">{t('crop_name')}:</span>
            <p className="text-base font-medium">{formData.name}</p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-500">{t('crop_variety')}:</span>
            <p className="text-base">{formData.variety || '-'}</p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-500">{t('crop_status')}:</span>
            <p className="text-base">{formData.status}</p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-500">{t('irrigation_type')}:</span>
            <p className="text-base">{formData.irrigationType}</p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-500">{t('planting_date')}:</span>
            <p className="text-base">{formData.plantingDate || '-'}</p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-500">{t('harvest_date')}:</span>
            <p className="text-base">{formData.harvestDate || '-'}</p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-500">{t('growth_days')}:</span>
            <p className="text-base">{formData.growthDays || '-'}</p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-500">{t('crop_soil_type')}:</span>
            <p className="text-base">{formData.soilType}</p>
          </div>

          <div className="col-span-2">
            <span className="text-sm font-medium text-gray-500">{t('location')}:</span>
            <p className="text-base">{formData.location || '-'}</p>
          </div>

          {formData.initialCost.amount && (
            <>
              <div className="col-span-2 mt-2">
                <span className="text-sm font-medium text-gray-500">{t('initial_cost')}:</span>
                <p className="text-base">₹{formData.initialCost.amount} ({formData.initialCost.category})</p>
                <p className="text-sm text-gray-500">{formData.initialCost.description}</p>
              </div>
            </>
          )}

          <div className="col-span-2 mt-2">
            <span className="text-sm font-medium text-gray-500">{t('notes')}:</span>
            <p className="text-base">{formData.notes || '-'}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-between mb-3">
          <Button
            type="button"
            onClick={handlePrevStep}
            className="bg-gray-500 hover:bg-gray-600 text-white flex items-center"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            {t('edit_details') || 'Edit Details'}
          </Button>

          <Button
            type="button"
            onClick={(e) => {
              if (typeof onAddCrop !== 'function') {
                console.error('onAddCrop is not a function:', onAddCrop);
                setErrors({ submit: 'Configuration error: Add crop function is not available' });
                return;
              }
              handleSubmit(e);
            }}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center"
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                {t('saving') || 'Saving...'}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                {t('save_crop') || 'Save Crop'}
              </>
            )}
          </Button>
        </div>

        {/* Display any submit errors */}
        {errors.submit && (
          <div className="w-full mt-2 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg">
            <div className="flex">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mr-2" />
              <span>{errors.submit}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // First step - Crop Name Input with AI Assistant
  const renderStep1 = () => (
    <div className="p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">{t('enter_crop_name', { defaultValue: 'Enter Crop Name' })}</h3>
        <p className="mt-2 text-sm text-gray-500">{t('ai_will_generate_details', { defaultValue: 'Our AI will generate the crop details for you' })}</p>
      </div>

      <div className="p-4 mb-6 bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
            <FontAwesomeIcon icon={faMagic} className="text-white" />
          </div>
          <div className="ml-3">
            <h4 className="font-medium text-gray-800">{t('ai_powered_farming_assistant', { defaultValue: 'AI-Powered Farming Assistant' })}</h4>
            <p className="text-sm text-gray-600">{t('auto_crop_assistant_description', { defaultValue: 'Get optimal growing conditions, costs, and timelines' })}</p>
          </div>
        </div>

        <div className="relative mb-4">
          <Input
            type="text"
            value={cropName}
            onChange={(e) => {
              setCropName(e.target.value);
              if (errors.cropName) {
                setErrors({ ...errors, cropName: '' });
              }
            }}
            placeholder={t('enter_crop_name', { defaultValue: 'Enter crop name (e.g., Tomato, Rice, Wheat)' })}
            className={`pr-12 ${errors.cropName ? 'border-red-500' : 'border-green-300 focus:border-green-500 focus:ring-green-500'}`}
          />
          {cropName && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <FontAwesomeIcon icon={faSeedling} className="text-green-600" />
            </span>
          )}
        </div>

        {errors.cropName && (
          <p className="text-red-500 text-xs mb-4">{errors.cropName}</p>
        )}

        {/* Display external errors */}
        {errors.external && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mt-0.5 mr-2" />
              <div>
                <p className="text-red-700 font-medium text-sm">{t('ai_error', { defaultValue: 'AI Error' })}</p>
                <p className="text-red-600 text-sm">{errors.external}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-3 rounded-lg border border-green-100 mb-4">
          <div className="flex items-start">
            <FontAwesomeIcon icon={faInfoCircle} className="text-green-600 mt-0.5 mr-2" />
            <div className="text-sm text-gray-700">
              <p className="mb-1">{t('ai_suggestion_prompt', { defaultValue: 'Our AI will analyze and suggest:' })}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t('optimal_growing_conditions', { defaultValue: 'Optimal growing conditions' })}</li>
                <li>{t('estimated_costs_and_timeline', { defaultValue: 'Estimated costs and timeline' })}</li>
                <li>{t('appropriate_soil_and_irrigation', { defaultValue: 'Appropriate soil and irrigation types' })}</li>
                <li>{t('crop_rotation_recommendations', { defaultValue: 'Crop rotation recommendations' })}</li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={handleNextStep}
          disabled={generatingData || !cropName.trim()}
          className="w-full flex items-center justify-center bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
        >
          {generatingData ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              <span className="font-medium">{t('analyzing_crop_data', { defaultValue: 'Analyzing Crop Data...' })}</span>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faMagic} className="mr-2" />
              <span className="font-medium">{t('generate_farming_details', { defaultValue: 'Generate Farming Details' })}</span>
            </>
          )}
        </Button>
      </div>

      {errors.ai && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg">
          <div className="flex">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mr-2" />
            <span>{errors.ai}</span>
          </div>
        </div>
      )}
    </div>
  );

  // Second step - Preview and Edit Generated Data
  const renderStep2 = () => (
    <div className="p-4">
      {/* AI Generated Banner */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3 mb-5 flex items-center">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
          <FontAwesomeIcon icon={faMagic} className="text-green-600" />
        </div>
        <div>
          <div className="font-medium text-gray-800">{t('ai_generated_details') || 'AI-Generated Details'}</div>
          <p className="text-sm text-gray-600">{t('ai_generation_success_message') || `We've analyzed "${formData.name}" and prepared optimal farming details. Feel free to adjust as needed.`}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Information Section */}
        <div className="md:col-span-2">
          <h3 className="font-medium text-gray-700 mb-2 flex items-center">
            <FontAwesomeIcon icon={faSeedling} className="mr-2 text-green-600" />
            {t('crop_basic_information') || 'Basic Information'}
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
              {t('ai_verified') || 'AI Verified'}
            </span>
          </h3>
        </div>

        {/* Crop Name */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('crop_name') || 'Crop Name'} *
          </label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('enter_crop_name') || 'Enter crop name'}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        {/* Crop Variety */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('crop_variety')}
          </label>
          <Input
            type="text"
            name="variety"
            value={formData.variety}
            onChange={handleChange}
            placeholder={t('enter_crop_variety')}
          />
        </div>

        {/* Status */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('crop_status')}
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="Planning">{t('planning')}</option>
            <option value="Growing">{t('growing')}</option>
            <option value="Harvested">{t('harvested')}</option>
            <option value="Failed">{t('failed')}</option>
          </select>
        </div>

        {/* Irrigation Type */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FontAwesomeIcon icon={faWater} className="mr-1 text-blue-500" />
            {t('irrigation_type')}
          </label>
          <select
            name="irrigationType"
            value={formData.irrigationType}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="Drip">{t('drip_irrigation')}</option>
            <option value="Sprinkler">{t('sprinkler_irrigation')}</option>
            <option value="Flood">{t('flood_irrigation')}</option>
            <option value="Manual">{t('manual_watering')}</option>
            <option value="Rainwater">{t('rainwater_only')}</option>
          </select>
        </div>

        {/* Dates Section */}
        <div className="md:col-span-2 mt-4">
          <h3 className="font-medium text-gray-700 mb-2">
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
            {t('important_dates')}
          </h3>
        </div>

        {/* Planting Date */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('planting_date')}
          </label>
          <Input
            type="date"
            name="plantingDate"
            value={formData.plantingDate}
            onChange={handleChange}
          />
        </div>

        {/* Growth Days */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('growth_days')}
          </label>
          <Input
            type="number"
            name="growthDays"
            value={formData.growthDays}
            onChange={handleChange}
            placeholder={t('enter_growth_days')}
            min="1"
            className={errors.growthDays ? 'border-red-500' : ''}
          />
          {errors.growthDays && (
            <p className="text-red-500 text-xs mt-1">{errors.growthDays}</p>
          )}
          {formData.plantingDate && formData.growthDays && formData.harvestDate && (
            <p className="text-xs text-green-600 mt-1">
              {t('estimated_harvest')}: {formData.harvestDate}
            </p>
          )}
        </div>

        {/* Location */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 text-red-500" />
            {t('location')}
          </label>
          <Input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder={t('enter_location')}
          />
        </div>

        {/* Soil Type */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FontAwesomeIcon icon={faLeaf} className="mr-1 text-green-500" />
            {t('crop_soil_type')}
          </label>
          <select
            name="soilType"
            value={formData.soilType}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="Loamy">{t('loamy_soil')}</option>
            <option value="Sandy">{t('sandy_soil')}</option>
            <option value="Clayey">{t('clayey_soil')}</option>
            <option value="Black Cotton">{t('black_cotton_soil')}</option>
            <option value="Red">{t('red_soil')}</option>
            <option value="Alluvial">{t('alluvial_soil')}</option>
          </select>
        </div>

        {/* Initial Expenses Section */}
        <div className="md:col-span-2 mt-4">
          <h3 className="font-medium text-gray-700 mb-2">
            <FontAwesomeIcon icon={faDollarSign} className="mr-2" />
            {t('initial_expenses')}
          </h3>
        </div>

        {/* Initial Cost Amount */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('expense_amount') || 'Expense Amount'} (₹)
          </label>
          <Input
            type="number"
            name="initialCost.amount"
            value={formData.initialCost.amount}
            onChange={(e) => setFormData({
              ...formData,
              initialCost: {
                ...formData.initialCost,
                amount: e.target.value
              }
            })}
            placeholder={t('enter_amount') || 'Enter amount'}
            min="0"
            step="0.01"
          />
        </div>

        {/* Initial Cost Type */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('expense_type') || 'Expense Type'}
          </label>
          <select
            name="initialCost.category"
            value={formData.initialCost.category}
            onChange={(e) => setFormData({
              ...formData,
              initialCost: {
                ...formData.initialCost,
                category: e.target.value
              }
            })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="seeds">{t('seeds') || 'Seeds'}</option>
            <option value="fertilizer">{t('fertilizer') || 'Fertilizer'}</option>
            <option value="pesticide">{t('pesticide') || 'Pesticide'}</option>
            <option value="labor">{t('labor') || 'Labor'}</option>
            <option value="equipment">{t('equipment') || 'Equipment'}</option>
            <option value="other">{t('other') || 'Other'}</option>
          </select>
        </div>

        {/* Cost Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('expense_description') || 'Expense Description'}
          </label>
          <Input
            type="text"
            name="initialCost.description"
            value={formData.initialCost.description}
            onChange={(e) => setFormData({
              ...formData,
              initialCost: {
                ...formData.initialCost,
                description: e.target.value
              }
            })}
            placeholder={t('describe_expense') || 'Describe the expense'}
          />
        </div>

        {/* Additional Information Section */}
        <div className="md:col-span-2 mt-4">
          <h3 className="font-medium text-gray-700 mb-2">
            <FontAwesomeIcon icon={faSeedling} className="mr-2" />
            {t('additional_information')}
          </h3>
        </div>

        {/* Seed Source */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('seed_source')}
          </label>
          <Input
            type="text"
            name="seedSource"
            value={formData.seedSource}
            onChange={handleChange}
            placeholder={t('enter_seed_source')}
          />
        </div>

        {/* Previous Crop (moved up) */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('crop_previous')}
          </label>
          <Input
            type="text"
            name="previousCrop"
            value={formData.previousCrop}
            onChange={handleChange}
            placeholder={t('enter_previous_crop')}
          />
        </div>

        {/* Notes */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('crop_notes')}
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder={t('enter_notes')}
            rows="3"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="flex justify-between mt-6 space-x-3">
        <Button
          type="button"
          onClick={handlePrevStep}
          className="bg-gray-500 hover:bg-gray-600 text-white flex items-center"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          {t('go_back') || 'Go Back'}
        </Button>

        <div className="flex space-x-3">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
          >
            {t('cancel') || 'Cancel'}
          </Button>
          <Button
            type="button"
            onClick={handleNextStep}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {t('continue') || 'Continue'}
            <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 1 ? 'bg-green-500 text-white' : 'bg-gray-200'
        }`}>
        1
      </div>
      <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 2 ? 'bg-green-500 text-white' : currentStep > 2 ? 'bg-green-500' : 'bg-gray-200'
        }`}>
        2
      </div>
      <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 3 ? 'bg-green-500 text-white' : 'bg-gray-200'
        }`}>
        3
      </div>
    </div>
  );

  // Main render function
  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {currentStep === 1 && (t('add_new_crop') || 'Add New Crop')}
            {currentStep === 2 && (t('edit_crop_details') || 'Edit Crop Details')}
            {currentStep === 3 && (t('confirm_crop_details') || 'Confirm Crop Details')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        {/* Step indicator */}
        <StepIndicator />

        {/* Step content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default CropModal;