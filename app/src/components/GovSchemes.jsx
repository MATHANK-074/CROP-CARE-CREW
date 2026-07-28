import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { FaSeedling, FaShieldAlt, FaWarehouse, FaRupeeSign, FaInfoCircle, FaCheckCircle, FaTimes, FaQuestionCircle, FaArrowRight, FaFilter, FaClipboardCheck } from "react-icons/fa";
import { schemeApi } from "../services/schemeApi";

const fallbackSchemes = [
  {
    _id: "fb1",
    category: "Farming",
    title: "Scheme for Organic Farming (Offline)",
    description: "Support for farmers transitioning to organic farming, including subsidies for organic certifications.",
    icon: "FaSeedling",
  }
];

const categories = ["All", "Most Popular Schemes", "Agriculture Loan", "Subsidy Scheme", "Goat Farming", "Cow Farming", "Equipment Subsidy", "Banking Loans"];

const getIconForCategory = (category) => {
  if (category.toLowerCase().includes('insurance')) return <FaShieldAlt className="text-blue-600 text-2xl" />;
  if (category.toLowerCase().includes('pump') || category.toLowerCase().includes('solar')) return <FaWarehouse className="text-yellow-600 text-2xl" />;
  if (category.toLowerCase().includes('kisan') || category.toLowerCase().includes('loan') || category.toLowerCase().includes('subsidy')) return <FaRupeeSign className="text-green-600 text-2xl" />;
  return <FaSeedling className="text-green-600 text-2xl" />;
};

const initialAnswers = {
  activity: '', need: '',
  category: '', education: '', age: '', priorBenefits: '',
  location: '', land: '', acres: '', lease: '',
  experience: '', marginMoney: '', collateral: '',
  documents: '', dpr: ''
};

export default function GovSchemes() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null); 
  const [checkedCriteria, setCheckedCriteria] = useState({});

  const handleOpenSchemeModal = (scheme) => {
    setSelectedScheme(scheme);
    setCheckedCriteria({});
  };

  const handleCriteriaCheck = (index) => {
    setCheckedCriteria(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // WIZARD STATE
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [answers, setAnswers] = useState(initialAnswers);
  const [eligibleSchemes, setEligibleSchemes] = useState(null);

  useEffect(() => {
    const fetchSchemes = async () => {
      setLoading(true);
      setError(false);
      try {
        const result = await schemeApi.getAllSchemes({});
        setSchemes(result.data);
      } catch (err) {
        console.error("Failed to fetch schemes, using offline fallback", err);
        setError(true);
        setSchemes(fallbackSchemes); 
      } finally {
        setLoading(false);
      }
    };

    if (schemes.length === 0) {
      fetchSchemes();
    }
  }, []);

  const handleWizardSubmit = () => {
    setShowWizard(false);
    
    const filtered = schemes.filter(scheme => {
      const tags = (scheme.tags || []).map(t => t.toLowerCase());
      const cat = (scheme.category || '').toLowerCase();
      const title = scheme.title.toLowerCase();
      const desc = scheme.description.toLowerCase();
      const searchStr = `${cat} ${tags.join(' ')} ${title} ${desc}`.toLowerCase();
      const eligStr = (scheme.eligibility || []).join(' ').toLowerCase();
      const allText = `${searchStr} ${eligStr}`;
      
      // Step 1: Activity & Need
      let activityMatch = false;
      if (answers.activity === 'Crop Farming') activityMatch = allText.includes('farm') || allText.includes('crop') || allText.includes('seed');
      else if (answers.activity === 'Dairy/Cattle') activityMatch = allText.includes('dairy') || allText.includes('cow') || allText.includes('milk');
      else if (answers.activity === 'Poultry/Goat/Sheep') activityMatch = allText.includes('poultry') || allText.includes('goat') || allText.includes('sheep') || allText.includes('animal');
      else if (answers.activity === 'Fisheries') activityMatch = allText.includes('fish') || allText.includes('aquaculture') || allText.includes('marine');
      else if (answers.activity === 'Horticulture') activityMatch = allText.includes('horticulture') || allText.includes('vegetable') || allText.includes('fruit');
      else activityMatch = true; 
      
      let needMatch = false;
      if (answers.need === 'Subsidy/Loan') needMatch = allText.includes('subsidy') || allText.includes('loan') || allText.includes('credit');
      else if (answers.need === 'Insurance') needMatch = allText.includes('insurance');
      else if (answers.need === 'Machinery/Equipment') needMatch = allText.includes('machinery') || allText.includes('tractor') || allText.includes('equipment');
      else if (answers.need === 'Solar/Water') needMatch = allText.includes('solar') || allText.includes('pump') || allText.includes('water') || allText.includes('irrigation');
      else needMatch = true;
      
      // Step 2: Personal Profile
      let ageMatch = true;
      if (answers.age === 'No') {
        ageMatch = false; // Minors generally don't qualify for major schemes
      }
      
      let priorMatch = true;
      if (answers.priorBenefits === 'Yes') {
        if (allText.includes('pmegp') || allText.includes('mudra')) priorMatch = false; // One-time schemes
      }

      let educationMatch = true;
      if (answers.education === 'Below 8th') {
        if (eligStr.includes('8th pass') || eligStr.includes('10th pass') || eligStr.includes('graduate') || eligStr.includes('diploma')) educationMatch = false;
      }

      // Step 3: Land & Location
      let locationMatch = true;
      if (answers.location === 'Urban') {
        if (eligStr.includes('rural only') || eligStr.includes('gram panchayat')) locationMatch = false;
      }

      let landMatch = true;
      if (answers.land === 'No') {
         if (eligStr.includes('landholding') || allText.includes('pm-kisan') || eligStr.includes('land owner') || eligStr.includes('title deed')) {
             landMatch = false;
         }
      }

      // Step 4: Viability
      let viabilityMatch = true;
      if (answers.marginMoney === 'No') {
        if (allText.includes('margin money') || allText.includes('own contribution')) viabilityMatch = false;
      }
      if (answers.collateral === 'None') {
        if (eligStr.includes('collateral') || eligStr.includes('security')) viabilityMatch = false;
      }

      // Step 5: Docs
      let docsMatch = true;
      if (answers.documents === 'No') {
        if (allText.includes('udyam') || allText.includes('gst')) docsMatch = false;
      }
      
      return activityMatch && needMatch && ageMatch && priorMatch && educationMatch && locationMatch && landMatch && viabilityMatch && docsMatch;
    });
    
    setEligibleSchemes(filtered);
    setWizardStep(1);
    setActiveFilter("All");
    setSearchQuery("");
  };

  const handleResetWizard = () => {
    setEligibleSchemes(null);
    setAnswers(initialAnswers);
  };

  const updateAnswer = (key, value) => {
    setAnswers({ ...answers, [key]: value });
  };

  const displaySchemes = (() => {
    if (eligibleSchemes) return eligibleSchemes;
    
    let filtered = schemes;
    
    if (activeFilter !== "All") {
      filtered = filtered.filter(scheme => {
        const str = `${scheme.title} ${scheme.description} ${scheme.category} ${(scheme.tags || []).join(' ')}`.toLowerCase();
        switch (activeFilter) {
          case "Most Popular Schemes": return str.includes("pm-kisan") || str.includes("pmfby") || str.includes("yojana") || str.includes("mission") || str.includes("pradhan mantri");
          case "Agriculture Loan": return str.includes("loan") || str.includes("credit") || str.includes("finance");
          case "Subsidy Scheme": return str.includes("subsidy") || str.includes("subvention") || str.includes("grant");
          case "Goat Farming": return str.includes("goat") || str.includes("sheep") || str.includes("poultry") || str.includes("livestock");
          case "Cow Farming": return str.includes("cow") || str.includes("dairy") || str.includes("cattle") || str.includes("milk");
          case "Equipment Subsidy": return str.includes("equipment") || str.includes("machinery") || str.includes("tractor") || str.includes("implement");
          case "Banking Loans": return str.includes("bank") || str.includes("finance") || str.includes("mudra");
          default: return scheme.category === activeFilter;
        }
      });
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(scheme => {
        return scheme.title.toLowerCase().includes(q) || scheme.description.toLowerCase().includes(q) || (scheme.tags && scheme.tags.some(t => t.toLowerCase().includes(q)));
      });
    }
    
    return filtered;
  })();

  return (
    <div className="bg-white min-h-screen px-6 py-8 font-sans text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">{t('government_schemes') || 'Government Schemes'}</h1>
        {error && (
          <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center">
             <FaInfoCircle className="mr-1"/> Offline Mode
          </span>
        )}
      </div>

      {/* WIZARD BANNER */}
      {!eligibleSchemes ? (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 mb-8 text-white shadow-lg flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-2xl font-bold mb-2 flex items-center"><FaClipboardCheck className="mr-2"/> {t('wizard_banner_title') || 'Detailed Appraisal Assessment'}</h2>
            <p className="text-blue-100">{t('wizard_banner_desc') || 'Take our 5-step professional eligibility assessment to find strictly matching schemes.'}</p>
          </div>
          <button 
            onClick={() => { setAnswers(initialAnswers); setShowWizard(true); setWizardStep(1); }}
            className="bg-white text-blue-700 hover:bg-gray-100 px-6 py-3 rounded-lg font-bold shadow transition flex items-center whitespace-nowrap"
          >
            {t('take_test_btn') || 'Start Assessment'} <FaArrowRight className="ml-2"/>
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-green-800 flex items-center"><FaCheckCircle className="mr-2"/> {t('wizard_results_title') || 'Your Personalized Results'}</h2>
            <p className="text-green-700 text-sm mt-1">
              {t('wizard_results_desc') || `Showing schemes strictly matching your verified profile.`}
            </p>
          </div>
          <button 
            onClick={handleResetWizard}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            {t('clear_results_btn') || 'Clear Filter'}
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      {!eligibleSchemes && (
        <div className="flex space-x-2 mb-6 text-sm overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-1 rounded-full border whitespace-nowrap ${activeFilter === cat
                  ? "bg-blue-600 text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
            >
              {t(cat.toLowerCase().replace(/ /g, '_')) || cat}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      {!eligibleSchemes && (
        <input
          type="text"
          placeholder={t('search_placeholder') || 'Search schemes (e.g., subsidy, loan)...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md mb-6 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
        />
      )}

      {/* Loading State */}
      {loading && !eligibleSchemes ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        /* Scheme Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displaySchemes.length === 0 ? (
            <div className="col-span-full bg-gray-50 border border-gray-200 rounded-lg p-10 text-center">
              <FaFilter className="mx-auto text-gray-400 text-4xl mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">{t('no_exact_match_title') || 'No exact matches found'}</h3>
              <p className="text-gray-500 mb-4">{t('no_exact_match_desc') || 'Based on your detailed profile, no schemes strictly match your eligibility criteria.'}</p>
              {eligibleSchemes && (
                <button 
                  onClick={handleResetWizard}
                  className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
                >
                  {t('view_all_schemes') || 'View All Schemes'}
                </button>
              )}
            </div>
          ) : (
            displaySchemes.map((scheme) => (
              <div
                key={scheme._id}
                className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      {getIconForCategory(scheme.category)}
                    </div>
                    <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                      {scheme.category}
                    </span>
                  </div>
                  <h2 className="font-semibold text-lg text-gray-900 leading-tight mb-2">
                    {t(scheme.title)}
                  </h2>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {t(scheme.description)}
                  </p>
                </div>
                
                <div className="mt-auto">
                  <button 
                    onClick={() => handleOpenSchemeModal(scheme)}
                    className="inline-block mt-4 text-sm font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors w-full text-center flex flex-col items-center justify-center"
                  >
                    <span>{t('check_eligibility')}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* WIZARD MODAL */}
      {showWizard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-60 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50 shrink-0">
              <h3 className="text-lg font-bold text-gray-800">{t('wizard_title') || 'Appraisal Assessment'} - {t('step')} {wizardStep} / 5</h3>
              <button 
                onClick={() => setShowWizard(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              
              {/* STEP 1: Basic Profile */}
              {wizardStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">{t('wiz_q_activity') || '1. What is your primary agricultural activity?'} <span className="text-red-500">*</span></h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['Crop Farming', 'Dairy/Cattle', 'Poultry/Goat/Sheep', 'Fisheries', 'Horticulture', 'Other'].map(opt => (
                        <button key={opt} onClick={() => updateAnswer('activity', opt)}
                          className={`px-4 py-3 border rounded-lg text-left font-medium transition ${answers.activity === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}>
                          {t(`wiz_opt_${opt.toLowerCase().replace(/[^a-z0-9]/g, '')}`) || opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">{t('wiz_q_need') || '2. What kind of support are you looking for?'} <span className="text-red-500">*</span></h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['Subsidy/Loan', 'Insurance', 'Machinery/Equipment', 'Solar/Water', 'Storage/Infrastructure', 'Other'].map(opt => (
                        <button key={opt} onClick={() => updateAnswer('need', opt)}
                          className={`px-4 py-3 border rounded-lg text-left font-medium transition ${answers.need === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}>
                          {t(`wiz_opt_${opt.toLowerCase().replace(/[^a-z0-9]/g, '')}`) || opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Personal Profile */}
              {wizardStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">{t('wiz_q_category') || '1. What is your social category?'} <span className="text-red-500">*</span></h4>
                    <div className="flex flex-wrap gap-3">
                      {['SC/ST', 'OBC', 'General', 'EWS'].map(opt => (
                        <button key={opt} onClick={() => updateAnswer('category', opt)}
                          className={`px-4 py-2 border rounded-lg font-medium transition ${answers.category === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">{t('wiz_q_edu') || '2. Highest educational qualification?'}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {['Below 8th', '8th Pass', '10th Pass', 'Degree/Diploma'].map(opt => (
                        <button key={opt} onClick={() => updateAnswer('education', opt)}
                          className={`px-4 py-2 border rounded-lg font-medium transition ${answers.education === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}>
                          {t(`wiz_opt_${opt.toLowerCase().replace(/[^a-z0-9]/g, '')}`) || opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-3">{t('wiz_q_age') || '3. Are you over 18?'} <span className="text-red-500">*</span></h4>
                      <div className="flex gap-3">
                        {['Yes', 'No'].map(opt => (
                          <button key={opt} onClick={() => updateAnswer('age', opt)}
                            className={`flex-1 px-4 py-2 border rounded-lg font-medium transition ${answers.age === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}>{t(`wiz_opt_${opt.toLowerCase()}`) || opt}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-3">{t('wiz_q_prior') || '4. Availed govt scheme before?'}</h4>
                      <div className="flex gap-3">
                        {['Yes', 'No'].map(opt => (
                          <button key={opt} onClick={() => updateAnswer('priorBenefits', opt)}
                            className={`flex-1 px-4 py-2 border rounded-lg font-medium transition ${answers.priorBenefits === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}>{t(`wiz_opt_${opt.toLowerCase()}`) || opt}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Land & Location */}
              {wizardStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">{t('wiz_q_loc') || '1. Is your unit located in a Rural or Urban area?'} <span className="text-red-500">*</span></h4>
                    <div className="flex gap-3">
                      {['Rural', 'Urban'].map(opt => (
                        <button key={opt} onClick={() => updateAnswer('location', opt)}
                          className={`flex-1 px-4 py-3 border rounded-lg font-medium transition ${answers.location === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}>
                          {t(`wiz_opt_${opt.toLowerCase()}`) || opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">{t('wiz_q_land') || '2. Do you own agricultural land?'} <span className="text-red-500">*</span></h4>
                    <div className="flex gap-3">
                      {['Yes', 'No'].map(opt => (
                        <button key={opt} onClick={() => { updateAnswer('land', opt); if(opt==='Yes') updateAnswer('lease',''); else updateAnswer('acres',''); }}
                          className={`flex-1 px-4 py-3 border rounded-lg font-medium transition ${answers.land === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}>
                          {t(`wiz_opt_${opt.toLowerCase()}`) || opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {answers.land === 'Yes' && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 animate-fade-in-up">
                      <h4 className="font-bold text-gray-800 mb-3">{t('wiz_q_acres') || 'How many acres of land do you own?'} <span className="text-red-500">*</span></h4>
                      <div className="flex gap-3">
                        {['< 2.5 Acres (Marginal)', '2.5 - 5 Acres (Small)', '> 5 Acres (Large)'].map(opt => (
                          <button key={opt} onClick={() => updateAnswer('acres', opt)}
                            className={`flex-1 px-2 py-2 border rounded text-sm font-medium transition ${answers.acres === opt ? 'border-blue-500 bg-blue-100 text-blue-700' : 'border-gray-300 bg-white hover:border-blue-300'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {answers.land === 'No' && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 animate-fade-in-up">
                      <h4 className="font-bold text-gray-800 mb-3">{t('wiz_q_lease') || 'Do you have a registered lease agreement (>5 years)?'}</h4>
                      <div className="flex gap-3">
                        {['Yes', 'No'].map(opt => (
                          <button key={opt} onClick={() => updateAnswer('lease', opt)}
                            className={`flex-1 px-4 py-2 border rounded font-medium transition ${answers.lease === opt ? 'border-blue-500 bg-blue-100 text-blue-700' : 'border-gray-300 bg-white hover:border-blue-300'}`}>
                            {t(`wiz_opt_${opt.toLowerCase()}`) || opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Viability */}
              {wizardStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">{t('wiz_q_exp') || '1. Do you have prior experience or EDP Training?'}</h4>
                    <div className="flex gap-3">
                      {['Yes', 'No'].map(opt => (
                        <button key={opt} onClick={() => updateAnswer('experience', opt)}
                          className={`flex-1 px-4 py-2 border rounded-lg font-medium transition ${answers.experience === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}>{t(`wiz_opt_${opt.toLowerCase()}`) || opt}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">{t('wiz_q_margin') || '2. Are you ready to deposit the margin money (5-10%)?'}</h4>
                    <div className="flex gap-3">
                      {['Yes', 'No'].map(opt => (
                        <button key={opt} onClick={() => updateAnswer('marginMoney', opt)}
                          className={`flex-1 px-4 py-2 border rounded-lg font-medium transition ${answers.marginMoney === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}>{t(`wiz_opt_${opt.toLowerCase()}`) || opt}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">{t('wiz_q_col') || '3. What collateral security can you offer?'}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {['None (CGTMSE)', 'Land & Building', 'Gold/FD'].map(opt => (
                        <button key={opt} onClick={() => updateAnswer('collateral', opt)}
                          className={`px-4 py-3 border rounded-lg font-medium transition ${answers.collateral === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}>
                          {t(`wiz_opt_${opt.toLowerCase().replace(/[^a-z0-9]/g, '')}`) || opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Documents */}
              {wizardStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">{t('wiz_q_docs') || '1. Do you have statutory registrations (Udyam, GST)?'} <span className="text-red-500">*</span></h4>
                    <div className="flex gap-3">
                      {['Yes', 'No'].map(opt => (
                        <button key={opt} onClick={() => updateAnswer('documents', opt)}
                          className={`flex-1 px-4 py-3 border rounded-lg font-medium transition ${answers.documents === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}>{t(`wiz_opt_${opt.toLowerCase()}`) || opt}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">{t('wiz_q_dpr') || '2. Is your Detailed Project Report (DPR) ready?'}</h4>
                    <div className="flex gap-3">
                      {['Yes', 'No'].map(opt => (
                        <button key={opt} onClick={() => updateAnswer('dpr', opt)}
                          className={`flex-1 px-4 py-3 border rounded-lg font-medium transition ${answers.dpr === opt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}>{t(`wiz_opt_${opt.toLowerCase()}`) || opt}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
            
            {/* WIZARD FOOTER */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-between shrink-0">
              <button 
                onClick={() => setWizardStep(Math.max(1, wizardStep - 1))} 
                className={`px-4 py-2 font-medium rounded ${wizardStep === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                disabled={wizardStep === 1}
              >
                {t('wizard_back') || 'Back'}
              </button>
              
              {wizardStep < 5 ? (
                <button 
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700"
                >
                  {t('wizard_next') || 'Next'}
                </button>
              ) : (
                <button 
                  onClick={handleWizardSubmit} 
                  className="px-6 py-2 bg-green-600 text-white font-bold rounded shadow hover:bg-green-700 flex items-center"
                >
                  <FaCheckCircle className="mr-2"/> {t('wizard_show_results') || 'Submit Assessment'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Eligibility Check Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">{t('eligibility_check') || 'Eligibility Check'}</h3>
              <button onClick={() => setSelectedScheme(null)} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <h4 className="font-semibold text-blue-800 text-lg mb-4 text-center">{t(selectedScheme.title)}</h4>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-5 text-sm text-blue-900 rounded-r">
                <strong>{t('about_scheme') || 'About this scheme'}:</strong> {t(selectedScheme.description)}
              </div>
              <p className="text-sm text-gray-700 font-medium mb-2 px-1">{t('verify_requirements') || 'Please confirm you meet the following requirements:'}</p>
              <ul className="space-y-3 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                {selectedScheme.eligibility && selectedScheme.eligibility.length > 0 ? (
                  selectedScheme.eligibility.map((req, index) => (
                    <li key={index} className="flex items-start bg-white p-3 rounded shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
                      <input 
                        type="checkbox" 
                        id={`crit-${index}`}
                        checked={!!checkedCriteria[index]}
                        onChange={() => handleCriteriaCheck(index)}
                        className="mt-1 mr-3 h-5 w-5 text-blue-600 rounded cursor-pointer flex-shrink-0" 
                      />
                      <label htmlFor={`crit-${index}`} className="text-sm text-gray-800 font-medium cursor-pointer flex-1 select-none">
                        <span className="text-gray-500 mr-1">{t('confirm_prefix') || 'I confirm my eligibility as:'}</span> 
                        <span className="font-semibold">{t(req)}</span>
                      </label>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500 italic text-center py-2">{t('no_criteria')}</li>
                )}
              </ul>
              
              <div className="flex space-x-3">
                <button onClick={() => setSelectedScheme(null)} className="flex-1 py-3 border-2 border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                  {t('not_eligible') || 'I am not eligible'}
                </button>
                {(() => {
                  const allChecked = selectedScheme.eligibility ? selectedScheme.eligibility.every((_, i) => checkedCriteria[i]) : true;
                  return (
                    <a 
                      href={allChecked ? (selectedScheme.officialWebsite || '#') : '#'} 
                      target={allChecked ? "_blank" : "_self"}
                      rel={allChecked ? "noopener noreferrer" : ""}
                      className={`flex-1 py-3 rounded-lg text-sm font-bold text-white text-center shadow-md transition-colors ${allChecked ? 'bg-green-600 hover:bg-green-700 cursor-pointer' : 'bg-gray-400 cursor-not-allowed opacity-80'}`}
                      onClick={(e) => !allChecked && e.preventDefault()}
                    >
                      {t('proceed_to_apply') || 'Proceed to Apply'}
                    </a>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
