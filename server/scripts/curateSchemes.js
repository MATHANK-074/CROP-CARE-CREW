const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const Scheme = require('../models/Scheme');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in your .env file!');
  process.exit(1);
}

const schemesData = [
  {
    title: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    title_ta: "பிரதான் மந்திரி கிசான் சம்மான் நிதி (பிஎம்-கிசான்)",
    category: "PM-KISAN",
    state: "Central",
    description: "Income support of Rs. 6000 per year in three equal installments to all landholding farmer families.",
    description_ta: "அனைத்து நிலம் வைத்திருக்கும் விவசாய குடும்பங்களுக்கும் மூன்று சம தவணைகளில் ஆண்டுக்கு ரூ. 6000 வருமான ஆதரவு.",
    eligibility: ["All landholding farmers' families"],
    eligibility_ta: ["அனைத்து நிலம் வைத்திருக்கும் விவசாயிகளின் குடும்பங்கள்"],
    benefits: ["Financial benefit of Rs 6,000/- per year"],
    requiredDocuments: ["Aadhaar Card", "Land ownership documents"],
    applicationProcess: "Apply online through the official PM-KISAN portal.",
    officialWebsite: "https://pmkisan.gov.in/",
    tags: ["income support", "cash transfer", "central"]
  },
  {
    title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    title_ta: "பிரதான் மந்திரி ஃபசல் பீமா யோஜனா (PMFBY)",
    category: "Insurance",
    state: "Central",
    description: "A comprehensive crop insurance scheme against unforeseen crop loss.",
    description_ta: "எதிர்பாராத பயிர் இழப்புக்கு எதிரான விரிவான பயிர் காப்பீட்டுத் திட்டம்.",
    eligibility: ["All farmers growing notified crops"],
    eligibility_ta: ["அறிவிக்கப்பட்ட பயிர்களை வளர்க்கும் அனைத்து விவசாயிகளும்"],
    benefits: ["Insurance cover against crop failure"],
    requiredDocuments: ["Aadhaar Card", "Land Records"],
    applicationProcess: "Apply via banks or official portal.",
    officialWebsite: "https://pmfby.gov.in/",
    tags: ["insurance", "crop loss", "subsidy"]
  },
  {
    title: "Kisan Credit Card (KCC)",
    title_ta: "கிசான் கிரெடிட் கார்டு (KCC)",
    category: "Farming",
    state: "Central",
    description: "Provides adequate and timely credit support from the banking system to farmers.",
    description_ta: "விவசாயிகளுக்கு வங்கி அமைப்பிலிருந்து போதுமான மற்றும் சரியான நேரத்தில் கடன் ஆதரவை வழங்குகிறது.",
    eligibility: ["Individual farmers/Joint borrowers who are owner cultivators"],
    eligibility_ta: ["தனிப்பட்ட விவசாயிகள் / சொந்தமாக விவசாயம் செய்யும் கூட்டு கடனாளிகள்"],
    benefits: ["Short term credit for crops with interest subvention"],
    requiredDocuments: ["Aadhaar/Voter ID", "Land ownership documents"],
    applicationProcess: "Apply directly at any commercial bank.",
    officialWebsite: "https://sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card",
    tags: ["loan", "credit", "finance"]
  },
  {
    title: "Agriculture Infrastructure Fund (AIF)",
    title_ta: "வேளாண் உள்கட்டமைப்பு நிதி (AIF)",
    category: "Farming",
    state: "Central",
    description: "Medium - long term debt financing facility for investment in viable projects for post-harvest management infrastructure.",
    description_ta: "அறுவடைக்கு பிந்தைய மேலாண்மை உள்கட்டமைப்பிற்கான திட்டங்களில் முதலீடு செய்வதற்கான நடுத்தர - நீண்ட கால கடன் நிதி வசதி.",
    eligibility: ["FPOs, SHGs, Farmers, Joint Liability Groups"],
    eligibility_ta: ["உழவர் உற்பத்தியாளர் அமைப்புகள், சுயஉதவி குழுக்கள், விவசாயிகள்"],
    benefits: ["Interest subvention of 3% per annum up to Rs. 2 crore"],
    requiredDocuments: ["DPR (Detailed Project Report)", "Bank Loan Application"],
    applicationProcess: "Submit application via the official AIF portal.",
    officialWebsite: "https://agriinfra.dac.gov.in/",
    tags: ["infrastructure", "loan", "post-harvest"]
  },
  {
    title: "National Agriculture Market (e-NAM)",
    title_ta: "தேசிய வேளாண் சந்தை (e-NAM)",
    category: "Farming",
    state: "Central",
    description: "A pan-India electronic trading portal which networks the existing APMC mandis to create a unified national market for agricultural commodities.",
    description_ta: "விவசாய பொருட்களுக்கான ஒருங்கிணைந்த தேசிய சந்தையை உருவாக்க APMC சந்தைகளை இணைக்கும் அகில இந்திய மின்னணு வர்த்தக தளம்.",
    eligibility: ["Farmers, Traders, FPOs"],
    eligibility_ta: ["விவசாயிகள், வியாபாரிகள், உழவர் உற்பத்தியாளர் அமைப்புகள்"],
    benefits: ["Better price discovery", "Transparent auction process"],
    requiredDocuments: ["Aadhaar Card", "Bank Details"],
    applicationProcess: "Register on the e-NAM portal or mobile app.",
    officialWebsite: "https://enam.gov.in/web/",
    tags: ["market", "trading", "apmc"]
  },
  {
    title: "Soil Health Card Scheme",
    title_ta: "மண் சுகாதார அட்டை திட்டம்",
    category: "Farming",
    state: "Central",
    description: "Provides information to farmers on the nutrient status of their soil along with recommendations on appropriate dosage of nutrients.",
    description_ta: "விவசாயிகளுக்கு அவர்களின் மண்ணின் ஊட்டச்சத்து நிலை பற்றிய தகவல்களையும், தகுந்த உர அளவு குறித்த பரிந்துரைகளையும் வழங்குகிறது.",
    eligibility: ["All farmers in India"],
    eligibility_ta: ["இந்தியாவில் உள்ள அனைத்து விவசாயிகளும்"],
    benefits: ["Information on 12 soil parameters", "Fertilizer recommendations"],
    requiredDocuments: ["Land details"],
    applicationProcess: "Contact local agriculture department.",
    officialWebsite: "https://soilhealth.dac.gov.in/",
    tags: ["soil", "fertilizer", "testing"]
  },
  {
    title: "PM KUSUM (Solar Pump Subsidy)",
    title_ta: "பிஎம் குசும் (சூரிய பம்ப் மானியம்)",
    category: "Solar Pump Subsidy",
    state: "Central",
    description: "Aims to provide energy security along with financial and water security to farmers through solar pumps.",
    description_ta: "சூரிய சக்தி பம்புகள் மூலம் விவசாயிகளுக்கு ஆற்றல், நிதி மற்றும் நீர் பாதுகாப்பை வழங்குவதை நோக்கமாகக் கொண்டுள்ளது.",
    eligibility: ["Individual farmers, FPOs, Cooperatives"],
    eligibility_ta: ["தனிப்பட்ட விவசாயிகள், உழவர் உற்பத்தியாளர் அமைப்புகள், கூட்டுறவு சங்கங்கள்"],
    benefits: ["Government subsidy up to 60% of the pump cost"],
    requiredDocuments: ["Aadhaar", "Land documents", "Bank Details"],
    applicationProcess: "Apply through State Nodal Agencies.",
    officialWebsite: "https://pmkusum.mnre.gov.in/",
    tags: ["solar", "pump", "irrigation"]
  },
  {
    title: "Per Drop More Crop (Drip Irrigation Subsidy)",
    title_ta: "ஒரு துளிக்கு அதிக பயிர் (சொட்டு நீர் பாசன மானியம்)",
    category: "Drip Irrigation Subsidy",
    state: "Central",
    description: "Focusing on enhancing water use efficiency at farm level through Micro Irrigation.",
    description_ta: "நுண்ணீர் பாசனம் மூலம் பண்ணை அளவில் நீர் பயன்பாட்டு திறனை மேம்படுத்துவதில் கவனம் செலுத்துகிறது.",
    eligibility: ["All farmers having cultivable land and water source"],
    eligibility_ta: ["சாகுபடி நிலம் மற்றும் நீர் ஆதாரம் உள்ள அனைத்து விவசாயிகளும்"],
    benefits: ["Subsidy of 55% for small/marginal farmers"],
    requiredDocuments: ["Aadhaar", "Quotation from vendor"],
    applicationProcess: "Apply through the State Agriculture portal.",
    officialWebsite: "https://pmksy.gov.in/",
    tags: ["water", "irrigation", "drip"]
  },
  {
    title: "Paramparagat Krishi Vikas Yojana (PKVY)",
    title_ta: "பரம்ப்பரகத் கிருஷி விகாஸ் யோஜனா (PKVY)",
    category: "Farming",
    state: "Central",
    description: "Promotes organic farming through the adoption of organic village by cluster approach and PGS certification.",
    description_ta: "க்ளஸ்டர் அணுகுமுறை மற்றும் PGS சான்றிதழ் மூலம் இயற்கை விவசாயத்தை மேம்படுத்துகிறது.",
    eligibility: ["Farmers forming clusters of 50 or more having 50 acre land"],
    eligibility_ta: ["50 ஏக்கர் நிலம் கொண்ட 50 அல்லது அதற்கு மேற்பட்ட விவசாயிகளின் குழுக்கள்"],
    benefits: ["Rs. 50,000 per hectare for 3 years"],
    requiredDocuments: ["Aadhaar", "Cluster registration details"],
    applicationProcess: "Contact District Agriculture Officer.",
    officialWebsite: "https://pgsindia-ncof.gov.in/pkvy/index.aspx",
    tags: ["organic", "farming", "subsidy"]
  },
  {
    title: "Sub-Mission on Agricultural Mechanization (SMAM)",
    title_ta: "வேளாண் இயந்திரமயமாக்கல் திட்டம் (SMAM)",
    category: "Farming",
    state: "Central",
    description: "Promotes agricultural mechanization among small and marginal farmers and in areas where farm power availability is low.",
    description_ta: "சிறு மற்றும் குறு விவசாயிகளிடையே விவசாய இயந்திரமயமாக்கலை மேம்படுத்துகிறது.",
    eligibility: ["All farmers, SHGs, FPOs"],
    eligibility_ta: ["அனைத்து விவசாயிகள், சுயஉதவி குழுக்கள், உழவர் உற்பத்தியாளர் அமைப்புகள்"],
    benefits: ["Subsidy on purchase of tractors and farm machinery (up to 50-80%)"],
    requiredDocuments: ["Aadhaar", "Land Records", "Bank Account"],
    applicationProcess: "Apply online at agrimachinery.nic.in.",
    officialWebsite: "https://agrimachinery.nic.in/",
    tags: ["tractor", "machinery", "subsidy"]
  },
  {
    title: "National Bamboo Mission",
    title_ta: "தேசிய மூங்கில் மிஷன்",
    category: "Farming",
    state: "Central",
    description: "Increases the area under bamboo plantation in non-forest Government and private lands to supplement farm income.",
    description_ta: "பண்ணை வருமானத்தை அதிகரிக்க மூங்கில் தோட்டத்தின் பரப்பளவை அதிகரிக்கிறது.",
    eligibility: ["Farmers, Artisans, Entrepreneurs"],
    eligibility_ta: ["விவசாயிகள், கைவினைஞர்கள், தொழில்முனைவோர்"],
    benefits: ["Subsidy for bamboo plantation and processing units (up to 50%)"],
    requiredDocuments: ["Land Proof", "Project Proposal (for units)"],
    applicationProcess: "Contact State Bamboo Mission Director.",
    officialWebsite: "https://nbm.nic.in/",
    tags: ["bamboo", "plantation", "subsidy"]
  },
  {
    title: "Pradhan Mantri Matsya Sampada Yojana (PMMSY)",
    title_ta: "பிரதான் மந்திரி மத்சய சம்பதா யோஜனா (PMMSY)",
    category: "Farming",
    state: "Central",
    description: "A scheme to bring about Blue Revolution through sustainable and responsible development of fisheries sector.",
    description_ta: "மீன்வளத்துறையின் நிலையான மற்றும் பொறுப்பான மேம்பாட்டின் மூலம் நீலப் புரட்சியைக் கொண்டுவரும் திட்டம்.",
    eligibility: ["Fishers, Fish farmers, FPOs, Entrepreneurs"],
    eligibility_ta: ["மீனவர்கள், மீன் வளர்ப்போர், தொழில்முனைவோர்"],
    benefits: ["Financial assistance up to 40% (60% for SC/ST/Women) for fisheries projects"],
    requiredDocuments: ["Aadhaar", "Land/Pond Lease Document", "DPR"],
    applicationProcess: "Apply via State Fisheries Department.",
    officialWebsite: "https://pmmsy.dof.gov.in/",
    tags: ["fisheries", "fish", "aquaculture"]
  },
  {
    title: "National Livestock Mission",
    title_ta: "தேசிய கால்நடை மிஷன்",
    category: "Goat Farming Schemes",
    state: "Central",
    description: "Ensures quantitative and qualitative improvement in livestock production systems and capacity building.",
    description_ta: "கால்நடை உற்பத்தி அமைப்புகளில் அளவு மற்றும் தர மேம்பாட்டை உறுதி செய்கிறது.",
    eligibility: ["Farmers interested in goat, sheep, poultry farming"],
    eligibility_ta: ["ஆடு, செம்மறி ஆடு, கோழி வளர்ப்பில் ஆர்வமுள்ள விவசாயிகள்"],
    benefits: ["50% capital subsidy (up to Rs. 50 Lakhs) for breeding units"],
    requiredDocuments: ["DPR", "Land Proof", "Bank Guarantee"],
    applicationProcess: "Apply via NLM Udyamimitra portal.",
    officialWebsite: "https://nlm.udyamimitra.in/",
    tags: ["goat", "poultry", "livestock"]
  },
  {
    title: "Dairy Entrepreneurship Development Scheme (DEDS)",
    title_ta: "பால் பண்ணை தொழில்முனைவோர் மேம்பாட்டுத் திட்டம் (DEDS)",
    category: "Dairy Farming Schemes",
    state: "Central",
    description: "Promotes setting up of modern dairy farms for production of clean milk.",
    description_ta: "சுத்தமான பால் உற்பத்திக்காக நவீன பால் பண்ணைகளை அமைப்பதை ஊக்குவிக்கிறது.",
    eligibility: ["Farmers, individual entrepreneurs, NGOs"],
    eligibility_ta: ["விவசாயிகள், தனிப்பட்ட தொழில்முனைவோர், தன்னார்வ தொண்டு நிறுவனங்கள்"],
    benefits: ["25% back-ended capital subsidy (33.33% for SC/ST)"],
    requiredDocuments: ["Bank loan application", "DPR"],
    applicationProcess: "Submit project report to NABARD approved banks.",
    officialWebsite: "https://www.nabard.org/",
    tags: ["dairy", "cows", "milk"]
  },
  {
    title: "PM Formalisation of Micro Food Processing Enterprises (PMFME)",
    title_ta: "நுண் உணவு பதப்படுத்தும் நிறுவனங்கள் திட்டம் (PMFME)",
    category: "Farming",
    state: "Central",
    description: "Enhances the competitiveness of existing individual micro-enterprises in the unorganized segment of the food processing industry.",
    description_ta: "உணவு பதப்படுத்தும் துறையின் அமைப்புசாரா பிரிவில் உள்ள தற்போதைய தனிநபர் நுண் நிறுவனங்களின் போட்டித்தன்மையை மேம்படுத்துகிறது.",
    eligibility: ["Existing micro food processing units, FPOs, SHGs"],
    eligibility_ta: ["தற்போதைய நுண் உணவு பதப்படுத்தும் அலகுகள், FPOக்கள், SHGக்கள்"],
    benefits: ["Credit-linked capital subsidy at 35% of the eligible project cost, up to Rs 10 lakh"],
    requiredDocuments: ["Aadhaar", "Business Registration", "Bank Details"],
    applicationProcess: "Apply online via PMFME portal.",
    officialWebsite: "https://pmfme.mofpi.gov.in/",
    tags: ["food processing", "business", "subsidy"]
  },
  {
    title: "National Beekeeping & Honey Mission (NBHM)",
    title_ta: "தேசிய தேனீ வளர்ப்பு மற்றும் தேன் மிஷன் (NBHM)",
    category: "Farming",
    state: "Central",
    description: "Promotes scientific beekeeping and entrepreneurship in the sector to increase crop productivity and honey production.",
    description_ta: "பயிர் உற்பத்தி மற்றும் தேன் உற்பத்தியை அதிகரிக்க அறிவியல் ரீதியான தேனீ வளர்ப்பை ஊக்குவிக்கிறது.",
    eligibility: ["Beekeepers, Farmers, FPOs, Entrepreneurs"],
    eligibility_ta: ["தேனீ வளர்ப்போர், விவசாயிகள், தொழில்முனைவோர்"],
    benefits: ["Subsidy for bee boxes, honey extraction units, and training"],
    requiredDocuments: ["Aadhaar", "Registration with Madhukranti portal"],
    applicationProcess: "Apply through State Horticulture Department.",
    officialWebsite: "https://nbhm.gov.in/",
    tags: ["honey", "beekeeping", "subsidy"]
  },
  {
    title: "Mission for Integrated Development of Horticulture (MIDH)",
    title_ta: "ஒருங்கிணைந்த தோட்டக்கலை மேம்பாட்டு இயக்கம் (MIDH)",
    category: "Farming",
    state: "Central",
    description: "Promotes holistic growth of the horticulture sector encompassing fruits, vegetables, root & tuber crops, mushrooms, spices, flowers, aromatic plants, coconut, cashew, cocoa and bamboo.",
    description_ta: "பழங்கள், காய்கறிகள், பூக்கள் மற்றும் மசாலாப் பொருட்கள் உள்ளிட்ட தோட்டக்கலைத் துறையின் முழுமையான வளர்ச்சியை ஊக்குவிக்கிறது.",
    eligibility: ["All farmers growing horticultural crops"],
    eligibility_ta: ["தோட்டக்கலை பயிர்களை வளர்க்கும் அனைத்து விவசாயிகளும்"],
    benefits: ["Assistance for greenhouses, shade net houses, anti-bird nets, plastic mulching (up to 50%)"],
    requiredDocuments: ["Land Documents", "Quotation for setup"],
    applicationProcess: "Apply through District Horticulture Officer.",
    officialWebsite: "https://midh.gov.in/",
    tags: ["horticulture", "greenhouse", "vegetables"]
  },
  {
    title: "Rashtriya Gokul Mission",
    title_ta: "ராஷ்டிரிய கோகுல் மிஷன்",
    category: "Dairy Farming Schemes",
    state: "Central",
    description: "Development and conservation of indigenous bovine breeds and improvement in milk production and productivity.",
    description_ta: "உள்நாட்டு மாடு இனங்களை மேம்படுத்துதல் மற்றும் பாதுகாத்தல் மற்றும் பால் உற்பத்தி திறனை மேம்படுத்துதல்.",
    eligibility: ["Dairy farmers, Breeders, Cooperatives"],
    eligibility_ta: ["பால் பண்ணையாளர்கள், வளர்ப்பாளர்கள், கூட்டுறவு சங்கங்கள்"],
    benefits: ["Support for establishment of integrated indigenous cattle centres (Gokul Grams)"],
    requiredDocuments: ["Proposal through State Implementing Agency"],
    applicationProcess: "Implemented via State Animal Husbandry Departments.",
    officialWebsite: "https://dahd.nic.in/rashtriya-gokul-mission",
    tags: ["cows", "dairy", "breeding"]
  },
  {
    title: "Gramin Bhandaran Yojana / Rural Godown Scheme",
    title_ta: "கிராமின் பண்டாரன் யோஜனா / ஊரக கிடங்கு திட்டம்",
    category: "Farming",
    state: "Central",
    description: "Creation of scientific storage capacity with allied facilities in rural areas to meet the requirements of farmers for storing farm produce, processed farm produce and agricultural inputs.",
    description_ta: "விவசாயிகள் தங்கள் விளைபொருட்களை சேமித்து வைக்க ஊரக பகுதிகளில் அறிவியல் பூர்வமான சேமிப்பு கிடங்குகளை உருவாக்குதல்.",
    eligibility: ["Farmers, Group of farmers, NGOs, Cooperatives, Companies"],
    eligibility_ta: ["விவசாயிகள், விவசாயிகளின் குழுக்கள், தன்னார்வ தொண்டு நிறுவனங்கள், நிறுவனங்கள்"],
    benefits: ["Capital investment subsidy @ 15% to 33.33% for construction of rural godowns"],
    requiredDocuments: ["DPR", "Land Title Deeds", "Bank Loan Sanction"],
    applicationProcess: "Submit project to NABARD/NCDC via commercial banks.",
    officialWebsite: "https://www.nabard.org/",
    tags: ["storage", "warehouse", "post-harvest"]
  },
  {
    title: "National Food Security Mission (NFSM)",
    title_ta: "தேசிய உணவு பாதுகாப்பு மிஷன் (NFSM)",
    category: "Farming",
    state: "Central",
    description: "Aims to increase the production of rice, wheat, pulses, coarse cereals and commercial crops through area expansion and productivity enhancement.",
    description_ta: "நெல், கோதுமை, பருப்பு வகைகள் மற்றும் வணிகப் பயிர்களின் உற்பத்தியை அதிகரிப்பதை நோக்கமாகக் கொண்டுள்ளது.",
    eligibility: ["All farmers growing targeted crops"],
    eligibility_ta: ["இலக்கு பயிர்களை வளர்க்கும் அனைத்து விவசாயிகளும்"],
    benefits: ["Assistance for seeds, machinery, micro-irrigation, and capacity building"],
    requiredDocuments: ["Aadhaar", "Land Documents"],
    applicationProcess: "Available through District Agriculture Office.",
    officialWebsite: "https://nfsm.gov.in/",
    tags: ["seeds", "productivity", "cereals"]
  },
  {
    title: "Animal Husbandry Infrastructure Development Fund (AHIDF)",
    title_ta: "கால்நடை உள்கட்டமைப்பு மேம்பாட்டு நிதி",
    category: "Dairy Farming Schemes",
    state: "Central",
    description: "Provides financial support for dairy processing, value addition and animal feed infrastructure.",
    description_ta: "பால் பதப்படுத்துதல், மதிப்பூட்டல் மற்றும் கால்நடை தீவன உள்கட்டமைப்புக்கு நிதி உதவி வழங்குகிறது.",
    eligibility: ["Individual Entrepreneurs", "Private Companies", "MSMEs", "Farmer Producer Organizations"],
    eligibility_ta: ["தனிநபர் தொழில்முனைவோர்", "தனியார் நிறுவனங்கள்", "MSMEக்கள்", "உழவர் உற்பத்தியாளர் அமைப்புகள்"],
    benefits: ["Interest subvention", "Credit guarantee support"],
    requiredDocuments: ["Aadhaar Card", "Project Report", "Bank Details"],
    applicationProcess: "Apply through participating banks or the official portal.",
    officialWebsite: "https://ahidf.udyamimitra.in/",
    tags: ["dairy", "milk", "infrastructure"]
},
{
    title: "Livestock Insurance Scheme",
    title_ta: "கால்நடை காப்பீட்டு திட்டம்",
    category: "Dairy Farming Schemes",
    state: "Central",
    description: "Insurance coverage for cattle and buffalo against death due to disease or accident.",
    description_ta: "நோய் அல்லது விபத்தால் உயிரிழக்கும் மாடுகளுக்கு காப்பீடு வழங்குகிறது.",
    eligibility: ["Livestock owners", "Dairy farmers"],
    eligibility_ta: ["கால்நடை உரிமையாளர்கள்", "பால் பண்ணையாளர்கள்"],
    benefits: ["Insurance coverage", "Premium subsidy"],
    requiredDocuments: ["Aadhaar", "Animal Identification", "Bank Account"],
    applicationProcess: "Apply through the Animal Husbandry Department.",
    officialWebsite: "https://dahd.nic.in/",
    tags: ["insurance", "cow", "buffalo"]
},
{
    title: "Integrated Beekeeping Development Centre Scheme",
    title_ta: "ஒருங்கிணைந்த தேனீ வளர்ப்பு மேம்பாட்டு மைய திட்டம்",
    category: "Farming",
    state: "Central",
    description: "Supports establishment of beekeeping centers and honey production.",
    description_ta: "தேனீ வளர்ப்பு மையங்கள் மற்றும் தேன் உற்பத்தியை ஊக்குவிக்கிறது.",
    eligibility: ["Farmers", "Entrepreneurs"],
    eligibility_ta: ["விவசாயிகள்", "தொழில்முனைவோர்"],
    benefits: ["Training", "Equipment subsidy"],
    requiredDocuments: ["Aadhaar", "Bank Account"],
    applicationProcess: "Apply through State Horticulture Department.",
    officialWebsite: "https://nbhm.gov.in/",
    tags: ["honey", "bee", "subsidy"]
},
{
    title: "Farm Machinery Custom Hiring Centre Scheme",
    title_ta: "விவசாய இயந்திர வாடகை மைய திட்டம்",
    category: "Farming",
    state: "Central",
    description: "Supports establishment of Custom Hiring Centres for agricultural machinery.",
    description_ta: "விவசாய இயந்திர வாடகை மையங்களை அமைக்க உதவுகிறது.",
    eligibility: ["FPOs", "Cooperative Societies", "Entrepreneurs"],
    eligibility_ta: ["உழவர் உற்பத்தியாளர் அமைப்புகள்", "கூட்டுறவு சங்கங்கள்", "தொழில்முனைவோர்"],
    benefits: ["Capital subsidy up to eligible limits"],
    requiredDocuments: ["Project Report", "Land Documents"],
    applicationProcess: "Apply through the Agriculture Department.",
    officialWebsite: "https://agrimachinery.nic.in/",
    tags: ["machinery", "tractor", "equipment"]
},
{
    title: "Seed Village Programme",
    title_ta: "விதை கிராம திட்டம்",
    category: "Farming",
    state: "Central",
    description: "Promotes production and distribution of quality seeds at village level.",
    description_ta: "கிராம மட்டத்தில் தரமான விதைகள் உற்பத்தி மற்றும் விநியோகத்தை ஊக்குவிக்கிறது.",
    eligibility: ["Registered farmers"],
    eligibility_ta: ["பதிவு செய்யப்பட்ட விவசாயிகள்"],
    benefits: ["Certified seeds", "Training"],
    requiredDocuments: ["Aadhaar", "Land Record"],
    applicationProcess: "Contact District Agriculture Office.",
    officialWebsite: "https://seednet.gov.in/",
    tags: ["seed", "quality", "training"]
},
{
    title: "Biofertilizer Promotion Scheme",
    title_ta: "உயிர் உர ஊக்குவிப்பு திட்டம்",
    category: "Farming",
    state: "Central",
    description: "Encourages use of biofertilizers for sustainable agriculture.",
    description_ta: "நிலையான விவசாயத்திற்கு உயிர் உரங்களை பயன்படுத்த ஊக்குவிக்கிறது.",
    eligibility: ["All farmers"],
    eligibility_ta: ["அனைத்து விவசாயிகளும்"],
    benefits: ["Subsidy on biofertilizers"],
    requiredDocuments: ["Aadhaar"],
    applicationProcess: "Apply through Agriculture Extension Office.",
    officialWebsite: "https://agriwelfare.gov.in/",
    tags: ["fertilizer", "organic", "biofertilizer"]
},
{
    title: "Vermicompost Unit Assistance Scheme",
    title_ta: "மண்புழு உர உற்பத்தி உதவி திட்டம்",
    category: "Farming",
    state: "Central",
    description: "Financial assistance for setting up vermicompost production units.",
    description_ta: "மண்புழு உர உற்பத்தி அலகுகளை அமைக்க நிதி உதவி வழங்குகிறது.",
    eligibility: ["Farmers", "SHGs"],
    eligibility_ta: ["விவசாயிகள்", "சுய உதவி குழுக்கள்"],
    benefits: ["Subsidy for unit establishment"],
    requiredDocuments: ["Aadhaar", "Land Proof"],
    applicationProcess: "Apply through Agriculture Department.",
    officialWebsite: "https://agriwelfare.gov.in/",
    tags: ["vermicompost", "organic", "compost"]
},
{
    title: "Agricultural Drone Assistance Scheme",
    title_ta: "விவசாய ட்ரோன் உதவி திட்டம்",
    category: "Farming",
    state: "Central",
    description: "Provides financial assistance for purchasing agricultural drones.",
    description_ta: "விவசாய ட்ரோன்கள் வாங்க நிதி உதவி வழங்குகிறது.",
    eligibility: ["FPOs", "Farmers", "Custom Hiring Centres"],
    eligibility_ta: ["உழவர் உற்பத்தியாளர் அமைப்புகள்", "விவசாயிகள்", "வாடகை மையங்கள்"],
    benefits: ["Subsidy on agricultural drones"],
    requiredDocuments: ["Aadhaar", "Quotation", "Bank Details"],
    applicationProcess: "Apply through Agriculture Department.",
    officialWebsite: "https://agrimachinery.nic.in/",
    tags: ["drone", "precision farming", "technology"]
},
{
    title: "Poultry Venture Capital Fund",
    title_ta: "கோழி வளர்ப்பு முதலீட்டு உதவி திட்டம்",
    category: "Poultry Farming Schemes",
    state: "Central",
    description: "Supports establishment and expansion of poultry farms.",
    description_ta: "கோழி பண்ணைகள் அமைப்பதற்கும் விரிவுபடுத்துவதற்கும் உதவுகிறது.",
    eligibility: ["Farmers", "Entrepreneurs"],
    eligibility_ta: ["விவசாயிகள்", "தொழில்முனைவோர்"],
    benefits: ["Capital subsidy", "Bank loan assistance"],
    requiredDocuments: ["Project Report", "Aadhaar", "Bank Account"],
    applicationProcess: "Apply through NABARD supported banks.",
    officialWebsite: "https://www.nabard.org/",
    tags: ["poultry", "chicken", "loan"]
},
{
    title: "Micro Irrigation Fund",
    title_ta: "நுண்ணீர் பாசன நிதி",
    category: "Drip Irrigation Subsidy",
    state: "Central",
    description: "Promotes drip and sprinkler irrigation systems for efficient water use.",
    description_ta: "சொட்டு மற்றும் தெளிப்பு நீர்ப்பாசன முறைகளை ஊக்குவிக்கிறது.",
    eligibility: ["All farmers"],
    eligibility_ta: ["அனைத்து விவசாயிகளும்"],
    benefits: ["Financial assistance for micro irrigation"],
    requiredDocuments: ["Aadhaar", "Land Record", "Bank Account"],
    applicationProcess: "Apply through State Agriculture Department.",
    officialWebsite: "https://pmksy.gov.in/",
    tags: ["drip", "sprinkler", "water"]
},
{
    title: "National Livestock Mission",
    title_ta: "தேசிய கால்நடை இயக்கம்",
    category: "Goat Farming Schemes",
    state: "Central",
    description: "Supports goat, sheep, pig and poultry farming through financial assistance and breed improvement.",
    description_ta: "ஆடு, செம்மறியாடு, பன்றி மற்றும் கோழி வளர்ப்புக்கு நிதி உதவி மற்றும் இன மேம்பாட்டை வழங்குகிறது.",
    eligibility: [
        "Farmers",
        "Entrepreneurs",
        "Farmer Producer Organizations",
        "Self Help Groups"
    ],
    eligibility_ta: [
        "விவசாயிகள்",
        "தொழில்முனைவோர்",
        "உழவர் உற்பத்தியாளர் அமைப்புகள்",
        "சுய உதவி குழுக்கள்"
    ],
    benefits: [
        "Capital subsidy",
        "Breed improvement assistance",
        "Training support"
    ],
    requiredDocuments: [
        "Aadhaar Card",
        "Bank Passbook",
        "Project Report"
    ],
    applicationProcess: "Apply through the Department of Animal Husbandry.",
    officialWebsite: "https://dahd.nic.in/",
    tags: ["goat", "sheep", "livestock", "subsidy"]
},
{
    title: "Rashtriya Gokul Mission",
    title_ta: "ராஷ்ட்ரிய கோகுல் மிஷன்",
    category: "Cow Farming Schemes",
    state: "Central",
    description: "Promotes conservation and development of indigenous cattle breeds.",
    description_ta: "நாட்டு மாட்டு இனங்களை பாதுகாத்து மேம்படுத்தும் திட்டம்.",
    eligibility: [
        "Dairy Farmers",
        "Cow Breeders",
        "Gaushalas"
    ],
    eligibility_ta: [
        "பால் பண்ணையாளர்கள்",
        "மாட்டு வளர்ப்போர்",
        "கோசாலைகள்"
    ],
    benefits: [
        "Breed improvement",
        "Artificial insemination support",
        "Infrastructure assistance"
    ],
    requiredDocuments: [
        "Aadhaar Card",
        "Animal Details",
        "Bank Account"
    ],
    applicationProcess: "Apply through the State Animal Husbandry Department.",
    officialWebsite: "https://dahd.nic.in/",
    tags: ["cow", "gokul", "dairy", "livestock"]
},
{
    title: "National Bamboo Mission",
    title_ta: "தேசிய மூங்கில் இயக்கம்",
    category: "Horticulture Schemes",
    state: "Central",
    description: "Promotes bamboo cultivation, nurseries and value addition.",
    description_ta: "மூங்கில் சாகுபடி மற்றும் மதிப்பூட்டலை ஊக்குவிக்கிறது.",
    eligibility: [
        "Farmers",
        "FPOs",
        "Entrepreneurs"
    ],
    eligibility_ta: [
        "விவசாயிகள்",
        "உழவர் உற்பத்தியாளர் அமைப்புகள்",
        "தொழில்முனைவோர்"
    ],
    benefits: [
        "Planting material subsidy",
        "Training",
        "Processing support"
    ],
    requiredDocuments: [
        "Aadhaar",
        "Land Record"
    ],
    applicationProcess: "Apply through the Horticulture Department.",
    officialWebsite: "https://nbm.nic.in/",
    tags: ["bamboo", "horticulture", "plantation"]
},
{
    title: "Mission for Integrated Development of Horticulture",
    title_ta: "ஒருங்கிணைந்த தோட்டக்கலை மேம்பாட்டு இயக்கம்",
    category: "Horticulture Schemes",
    state: "Central",
    description: "Supports cultivation of fruits, vegetables, flowers and spices.",
    description_ta: "பழங்கள், காய்கறிகள், மலர்கள் மற்றும் மசாலா பயிர்களுக்கு ஆதரவு வழங்குகிறது.",
    eligibility: [
        "Farmers",
        "Farmer Groups"
    ],
    eligibility_ta: [
        "விவசாயிகள்",
        "விவசாய குழுக்கள்"
    ],
    benefits: [
        "Planting subsidy",
        "Infrastructure support",
        "Protected cultivation assistance"
    ],
    requiredDocuments: [
        "Aadhaar",
        "Land Documents",
        "Bank Account"
    ],
    applicationProcess: "Apply through the State Horticulture Department.",
    officialWebsite: "https://midh.gov.in/",
    tags: ["horticulture", "fruits", "vegetables"]
},
{
    title: "PM-KUSUM Scheme",
    title_ta: "பிரதம மந்திரி குசும் திட்டம்",
    category: "Solar Agriculture",
    state: "Central",
    description: "Supports installation of solar pumps and solar power plants for agriculture.",
    description_ta: "விவசாயத்திற்கான சோலார் பம்புகள் மற்றும் சோலார் மின் நிலையங்களுக்கு உதவி வழங்குகிறது.",
    eligibility: [
        "Farmers",
        "Farmer Cooperatives",
        "Panchayats"
    ],
    eligibility_ta: [
        "விவசாயிகள்",
        "விவசாய கூட்டுறவுகள்",
        "ஊராட்சிகள்"
    ],
    benefits: [
        "Solar pump subsidy",
        "Reduced electricity costs"
    ],
    requiredDocuments: [
        "Aadhaar",
        "Land Record",
        "Electricity Connection Details"
    ],
    applicationProcess: "Apply through the State Renewable Energy Agency.",
    officialWebsite: "https://pmkusum.mnre.gov.in/",
    tags: ["solar", "pump", "renewable", "energy"]
},
{
    title: "Agriculture Infrastructure Fund",
    title_ta: "வேளாண் உள்கட்டமைப்பு நிதி",
    category: "Agriculture Infrastructure",
    state: "Central",
    description: "Provides financing for post-harvest infrastructure and community farming assets.",
    description_ta: "அறுவடைக்குப் பிந்தைய உள்கட்டமைப்பு மற்றும் சமூக விவசாய சொத்துகளுக்கான நிதி உதவி.",
    eligibility: [
        "Farmers",
        "FPOs",
        "Cooperatives",
        "Agri Entrepreneurs"
    ],
    eligibility_ta: [
        "விவசாயிகள்",
        "உழவர் உற்பத்தியாளர் அமைப்புகள்",
        "கூட்டுறவுகள்",
        "வேளாண் தொழில்முனைவோர்"
    ],
    benefits: [
        "Interest subvention",
        "Credit guarantee"
    ],
    requiredDocuments: [
        "Project Report",
        "Bank Details",
        "Identity Proof"
    ],
    applicationProcess: "Apply through scheduled banks using the Agriculture Infrastructure Fund portal.",
    officialWebsite: "https://agriinfra.dac.gov.in/",
    tags: ["warehouse", "cold storage", "loan", "infrastructure"]
},
{
    title: "Paramparagat Krishi Vikas Yojana",
    title_ta: "பாரம்பரிய விவசாய மேம்பாட்டு திட்டம்",
    category: "Organic Farming",
    state: "Central",
    description: "Promotes cluster-based organic farming and certification.",
    description_ta: "குழு அடிப்படையிலான இயற்கை விவசாயம் மற்றும் சான்றிதழ் வழங்கலை ஊக்குவிக்கிறது.",
    eligibility: [
        "Farmers",
        "Farmer Groups"
    ],
    eligibility_ta: [
        "விவசாயிகள்",
        "விவசாய குழுக்கள்"
    ],
    benefits: [
        "Organic farming assistance",
        "Certification support",
        "Training"
    ],
    requiredDocuments: [
        "Aadhaar",
        "Land Record"
    ],
    applicationProcess: "Apply through the Agriculture Department.",
    officialWebsite: "https://pgsindia-ncof.gov.in/",
    tags: ["organic", "natural farming", "certification"]
},
{
    title: "National Food Security Mission",
    title_ta: "தேசிய உணவு பாதுகாப்பு இயக்கம்",
    category: "Crop Development",
    state: "Central",
    description: "Increases production of rice, wheat, pulses and coarse cereals.",
    description_ta: "நெல், கோதுமை, பருப்பு மற்றும் சிறுதானிய உற்பத்தியை அதிகரிக்க உதவுகிறது.",
    eligibility: [
        "Farmers cultivating notified crops"
    ],
    eligibility_ta: [
        "அறிவிக்கப்பட்ட பயிர்களை பயிரிடும் விவசாயிகள்"
    ],
    benefits: [
        "Seed subsidy",
        "Farm equipment assistance",
        "Demonstration support"
    ],
    requiredDocuments: [
        "Aadhaar",
        "Land Record"
    ],
    applicationProcess: "Apply through the District Agriculture Office.",
    officialWebsite: "https://nfsm.gov.in/",
    tags: ["rice", "wheat", "pulses", "millets"]
},
{
    title: "Blue Revolution Scheme",
    title_ta: "நீலப் புரட்சி திட்டம்",
    category: "Fisheries",
    state: "Central",
    description: "Supports fisheries development, fish farming and infrastructure.",
    description_ta: "மீன் வளர்ப்பு மற்றும் மீன்வள உள்கட்டமைப்புக்கு உதவி வழங்குகிறது.",
    eligibility: [
        "Fish Farmers",
        "Fishermen",
        "Cooperative Societies"
    ],
    eligibility_ta: [
        "மீன் வளர்ப்போர்",
        "மீனவர்கள்",
        "கூட்டுறவு சங்கங்கள்"
    ],
    benefits: [
        "Infrastructure support",
        "Fish seed assistance",
        "Training"
    ],
    requiredDocuments: [
        "Aadhaar",
        "Bank Account"
    ],
    applicationProcess: "Apply through the Fisheries Department.",
    officialWebsite: "https://dof.gov.in/",
    tags: ["fish", "aquaculture", "fisheries"]
},
{
    title: "Gramin Bhandaran Yojana",
    title_ta: "கிராமின் பண்டாரன் திட்டம்",
    category: "Storage & Warehouse",
    state: "Central",
    description: "Provides assistance for construction of rural warehouses.",
    description_ta: "கிராமப்புற கிடங்குகள் அமைக்க நிதி உதவி வழங்குகிறது.",
    eligibility: [
        "Farmers",
        "FPOs",
        "Entrepreneurs"
    ],
    eligibility_ta: [
        "விவசாயிகள்",
        "உழவர் உற்பத்தியாளர் அமைப்புகள்",
        "தொழில்முனைவோர்"
    ],
    benefits: [
        "Warehouse construction subsidy",
        "Scientific storage support"
    ],
    requiredDocuments: [
        "Project Report",
        "Land Ownership Proof",
        "Bank Details"
    ],
    applicationProcess: "Apply through NABARD-supported financial institutions.",
    officialWebsite: "https://www.nabard.org/",
    tags: ["warehouse", "storage", "godown"]
},{
    title: "Sub-Mission on Agricultural Mechanization (SMAM)",
    title_ta: "வேளாண் இயந்திரமயமாக்கல் துணைத் திட்டம்",
    category: "Farm Machinery Subsidy",
    state: "Central",
    description: "Provides financial assistance for purchasing modern agricultural machinery and implements.",
    description_ta: "நவீன வேளாண் இயந்திரங்கள் மற்றும் கருவிகள் வாங்க நிதி உதவி வழங்குகிறது.",
    eligibility: [
        "Individual Farmers",
        "Farmer Producer Organizations",
        "Self Help Groups",
        "Custom Hiring Centres"
    ],
    eligibility_ta: [
        "தனிநபர் விவசாயிகள்",
        "உழவர் உற்பத்தியாளர் அமைப்புகள்",
        "சுய உதவி குழுக்கள்",
        "வாடகை இயந்திர மையங்கள்"
    ],
    benefits: [
        "Subsidy on farm machinery",
        "Support for Custom Hiring Centres"
    ],
    requiredDocuments: [
        "Aadhaar Card",
        "Land Record",
        "Bank Passbook"
    ],
    applicationProcess: "Apply through the State Agriculture Department.",
    officialWebsite: "https://agrimachinery.nic.in/",
    tags: ["tractor", "equipment", "machinery", "subsidy"]
},
{
    title: "Custom Hiring Centre Scheme",
    title_ta: "வேளாண் இயந்திர வாடகை மையத் திட்டம்",
    category: "Farm Machinery Subsidy",
    state: "Central",
    description: "Supports establishment of centres where farmers can rent agricultural machinery.",
    description_ta: "விவசாய இயந்திரங்களை வாடகைக்கு வழங்கும் மையங்களை அமைக்க உதவுகிறது.",
    eligibility: [
        "FPOs",
        "Entrepreneurs",
        "Cooperative Societies"
    ],
    eligibility_ta: [
        "உழவர் உற்பத்தியாளர் அமைப்புகள்",
        "தொழில்முனைவோர்",
        "கூட்டுறவு சங்கங்கள்"
    ],
    benefits: [
        "Capital subsidy",
        "Equipment purchase support"
    ],
    requiredDocuments: [
        "Project Report",
        "Identity Proof",
        "Bank Account"
    ],
    applicationProcess: "Apply through Agriculture Department.",
    officialWebsite: "https://agrimachinery.nic.in/",
    tags: ["custom hiring", "machinery", "tractor"]
},
{
    title: "National Mission on Edible Oils - Oil Palm",
    title_ta: "உண்ணக்கூடிய எண்ணெய் - எண்ணெய் பனை தேசிய இயக்கம்",
    category: "Crop Development",
    state: "Central",
    description: "Promotes cultivation of oil palm to increase domestic edible oil production.",
    description_ta: "உள்நாட்டு உண்ணக்கூடிய எண்ணெய் உற்பத்தியை அதிகரிக்க எண்ணெய் பனை சாகுபடியை ஊக்குவிக்கிறது.",
    eligibility: [
        "Eligible Farmers"
    ],
    eligibility_ta: [
        "தகுதியான விவசாயிகள்"
    ],
    benefits: [
        "Planting material assistance",
        "Maintenance support"
    ],
    requiredDocuments: [
        "Aadhaar",
        "Land Record"
    ],
    applicationProcess: "Apply through the Horticulture Department.",
    officialWebsite: "https://nmeo.dac.gov.in/",
    tags: ["oil palm", "horticulture", "plantation"]
},
{
    title: "National Beekeeping and Honey Mission",
    title_ta: "தேசிய தேனீ வளர்ப்பு மற்றும் தேன் இயக்கம்",
    category: "Beekeeping",
    state: "Central",
    description: "Promotes scientific beekeeping and honey production across India.",
    description_ta: "அறிவியல் முறையிலான தேனீ வளர்ப்பு மற்றும் தேன் உற்பத்தியை ஊக்குவிக்கிறது.",
    eligibility: [
        "Farmers",
        "Beekeepers",
        "Entrepreneurs"
    ],
    eligibility_ta: [
        "விவசாயிகள்",
        "தேனீ வளர்ப்போர்",
        "தொழில்முனைவோர்"
    ],
    benefits: [
        "Bee boxes",
        "Training",
        "Equipment assistance"
    ],
    requiredDocuments: [
        "Aadhaar Card",
        "Bank Account"
    ],
    applicationProcess: "Apply through the Agriculture Department.",
    officialWebsite: "https://nbhm.gov.in/",
    tags: ["honey", "bee", "pollination"]
},
{
    title: "National Mission for Sustainable Agriculture",
    title_ta: "நிலையான வேளாண்மைக்கான தேசிய இயக்கம்",
    category: "Sustainable Farming",
    state: "Central",
    description: "Supports climate-resilient farming practices and efficient resource management.",
    description_ta: "காலநிலை மாற்றத்தை சமாளிக்கும் நிலையான வேளாண் முறைகளை ஊக்குவிக்கிறது.",
    eligibility: [
        "Farmers"
    ],
    eligibility_ta: [
        "விவசாயிகள்"
    ],
    benefits: [
        "Climate-smart agriculture support",
        "Water conservation",
        "Training"
    ],
    requiredDocuments: [
        "Aadhaar",
        "Land Record"
    ],
    applicationProcess: "Apply through District Agriculture Office.",
    officialWebsite: "https://nmsa.dac.gov.in/",
    tags: ["climate", "sustainable", "water"]
},
{
    title: "Soil Health Card Scheme",
    title_ta: "மண் ஆரோக்கிய அட்டை திட்டம்",
    category: "Soil Health",
    state: "Central",
    description: "Provides soil testing and nutrient recommendations for farmers.",
    description_ta: "மண் பரிசோதனை செய்து உர பரிந்துரைகளை வழங்குகிறது.",
    eligibility: [
        "All Farmers"
    ],
    eligibility_ta: [
        "அனைத்து விவசாயிகளும்"
    ],
    benefits: [
        "Free soil testing",
        "Nutrient recommendations"
    ],
    requiredDocuments: [
        "Aadhaar Card"
    ],
    applicationProcess: "Visit the nearest Agriculture Office or Soil Testing Laboratory.",
    officialWebsite: "https://soilhealth.dac.gov.in/",
    tags: ["soil", "fertilizer", "testing"]
},
{
    title: "City Compost Promotion Scheme",
    title_ta: "நகர உர ஊக்குவிப்பு திட்டம்",
    category: "Organic Fertilizer",
    state: "Central",
    description: "Promotes the use of city compost in agriculture.",
    description_ta: "நகர உரங்களை விவசாயத்தில் பயன்படுத்த ஊக்குவிக்கிறது.",
    eligibility: [
        "Farmers"
    ],
    eligibility_ta: [
        "விவசாயிகள்"
    ],
    benefits: [
        "Subsidy on compost",
        "Organic farming promotion"
    ],
    requiredDocuments: [
        "Aadhaar Card"
    ],
    applicationProcess: "Apply through Agriculture Department.",
    officialWebsite: "https://agriwelfare.gov.in/",
    tags: ["compost", "organic", "fertilizer"]
},
{
    title: "National Seed Mission",
    title_ta: "தேசிய விதை இயக்கம்",
    category: "Seed Distribution",
    state: "Central",
    description: "Ensures availability of quality certified seeds to farmers.",
    description_ta: "தரமான சான்றளிக்கப்பட்ட விதைகளை விவசாயிகளுக்கு வழங்குகிறது.",
    eligibility: [
        "Registered Farmers"
    ],
    eligibility_ta: [
        "பதிவு செய்யப்பட்ட விவசாயிகள்"
    ],
    benefits: [
        "Certified seeds",
        "Seed subsidy"
    ],
    requiredDocuments: [
        "Aadhaar",
        "Land Record"
    ],
    applicationProcess: "Apply through Seed Distribution Centres.",
    officialWebsite: "https://seednet.gov.in/",
    tags: ["seed", "certified", "crop"]
},
{
    title: "Rainfed Area Development Programme",
    title_ta: "மானாவாரி நில மேம்பாட்டு திட்டம்",
    category: "Water Conservation",
    state: "Central",
    description: "Supports integrated farming systems in rainfed areas.",
    description_ta: "மானாவாரி பகுதிகளில் ஒருங்கிணைந்த விவசாயத்தை ஊக்குவிக்கிறது.",
    eligibility: [
        "Farmers in rainfed regions"
    ],
    eligibility_ta: [
        "மானாவாரி பகுதி விவசாயிகள்"
    ],
    benefits: [
        "Integrated farming support",
        "Water conservation"
    ],
    requiredDocuments: [
        "Aadhaar",
        "Land Record"
    ],
    applicationProcess: "Apply through District Agriculture Office.",
    officialWebsite: "https://nmsa.dac.gov.in/",
    tags: ["rainfed", "water", "conservation"]
},
{
    title: "Agri-Clinics and Agri-Business Centres Scheme",
    title_ta: "வேளாண் மருத்துவ மையங்கள் மற்றும் வேளாண் வணிக மையங்கள் திட்டம்",
    category: "Agriculture Entrepreneurship",
    state: "Central",
    description: "Supports agriculture graduates to establish agri-business ventures.",
    description_ta: "வேளாண் பட்டதாரிகள் வேளாண் தொழில்முனைவுகளை தொடங்க உதவுகிறது.",
    eligibility: [
        "Agriculture Graduates",
        "Diploma Holders"
    ],
    eligibility_ta: [
        "வேளாண் பட்டதாரிகள்",
        "டிப்ளமோ பெற்றவர்கள்"
    ],
    benefits: [
        "Training",
        "Bank loan assistance",
        "Credit-linked subsidy"
    ],
    requiredDocuments: [
        "Educational Certificate",
        "Aadhaar Card",
        "Project Report"
    ],
    applicationProcess: "Apply through the ACABC portal.",
    officialWebsite: "https://www.agriclinics.net/",
    tags: ["startup", "agribusiness", "entrepreneur"]
},{
    title: "National Mission on Natural Farming",
    title_ta: "தேசிய இயற்கை வேளாண்மை இயக்கம்",
    category: "Organic Farming",
    state: "Central",
    description: "Promotes chemical-free natural farming practices to improve soil health and reduce cultivation costs.",
    description_ta: "இரசாயனமில்லா இயற்கை விவசாயத்தை ஊக்குவித்து மண் வளத்தை மேம்படுத்துகிறது.",
    eligibility: [
        "All Farmers",
        "Farmer Groups",
        "FPOs"
    ],
    eligibility_ta: [
        "அனைத்து விவசாயிகள்",
        "விவசாய குழுக்கள்",
        "உழவர் உற்பத்தியாளர் அமைப்புகள்"
    ],
    benefits: [
        "Training on natural farming",
        "Financial assistance for bio-inputs",
        "Technical guidance"
    ],
    requiredDocuments: [
        "Aadhaar Card",
        "Land Ownership Proof",
        "Bank Passbook"
    ],
    applicationProcess: "Apply through the Agriculture Department.",
    officialWebsite: "https://agriwelfare.gov.in/",
    tags: ["natural farming", "organic", "soil"]
},
{
    title: "Per Drop More Crop Scheme",
    title_ta: "ஒரு துளி நீர் - அதிக விளைச்சல் திட்டம்",
    category: "Drip Irrigation Subsidy",
    state: "Central",
    description: "Promotes efficient use of water through drip and sprinkler irrigation systems.",
    description_ta: "சொட்டு மற்றும் தெளிப்பு நீர்ப்பாசன முறைகளை ஊக்குவிக்கிறது.",
    eligibility: [
        "Farmers with cultivable land"
    ],
    eligibility_ta: [
        "சாகுபடி நிலம் கொண்ட விவசாயிகள்"
    ],
    benefits: [
        "Subsidy for drip irrigation",
        "Subsidy for sprinkler systems"
    ],
    requiredDocuments: [
        "Aadhaar Card",
        "Land Record",
        "Bank Account"
    ],
    applicationProcess: "Apply through the State Agriculture Department.",
    officialWebsite: "https://pmksy.gov.in/",
    tags: ["drip", "sprinkler", "irrigation"]
},
{
    title: "National Horticulture Board Back-ended Capital Investment Subsidy",
    title_ta: "தேசிய தோட்டக்கலை வாரிய மூலதன மானிய திட்டம்",
    category: "Horticulture Schemes",
    state: "Central",
    description: "Financial assistance for commercial horticulture projects including nurseries and cold storage.",
    description_ta: "வணிக தோட்டக்கலை திட்டங்களுக்கு நிதி உதவி வழங்குகிறது.",
    eligibility: [
        "Farmers",
        "Entrepreneurs",
        "Companies"
    ],
    eligibility_ta: [
        "விவசாயிகள்",
        "தொழில்முனைவோர்",
        "நிறுவனங்கள்"
    ],
    benefits: [
        "Capital investment subsidy",
        "Cold storage assistance"
    ],
    requiredDocuments: [
        "Project Report",
        "Aadhaar",
        "Bank Details"
    ],
    applicationProcess: "Apply through the National Horticulture Board.",
    officialWebsite: "https://nhb.gov.in/",
    tags: ["horticulture", "nursery", "cold storage"]
},
{
    title: "Integrated Farming System Scheme",
    title_ta: "ஒருங்கிணைந்த விவசாய முறை திட்டம்",
    category: "Integrated Farming",
    state: "Central",
    description: "Encourages combining crops, livestock, fisheries and horticulture to increase farm income.",
    description_ta: "பயிர், கால்நடை, மீன்வளம் மற்றும் தோட்டக்கலையை ஒருங்கிணைத்து வருமானத்தை அதிகரிக்கிறது.",
    eligibility: [
        "Small and Marginal Farmers"
    ],
    eligibility_ta: [
        "சிறு மற்றும் குறு விவசாயிகள்"
    ],
    benefits: [
        "Training",
        "Technical assistance",
        "Demonstration support"
    ],
    requiredDocuments: [
        "Aadhaar Card",
        "Land Record"
    ],
    applicationProcess: "Contact the District Agriculture Office.",
    officialWebsite: "https://agriwelfare.gov.in/",
    tags: ["integrated farming", "livestock", "crop"]
},
{
    title: "National Livestock Health and Disease Control Programme",
    title_ta: "தேசிய கால்நடை ஆரோக்கிய மற்றும் நோய் கட்டுப்பாட்டு திட்டம்",
    category: "Livestock Health",
    state: "Central",
    description: "Provides vaccination and disease control for livestock including cattle, goats and sheep.",
    description_ta: "மாடுகள், ஆடுகள் மற்றும் செம்மறியாடுகளுக்கு தடுப்பூசி மற்றும் நோய் கட்டுப்பாட்டு சேவைகள் வழங்குகிறது.",
    eligibility: [
        "Livestock Farmers"
    ],
    eligibility_ta: [
        "கால்நடை வளர்ப்போர்"
    ],
    benefits: [
        "Free vaccination",
        "Disease surveillance",
        "Veterinary support"
    ],
    requiredDocuments: [
        "Aadhaar Card",
        "Livestock Details"
    ],
    applicationProcess: "Apply through the nearest Veterinary Hospital.",
    officialWebsite: "https://dahd.nic.in/",
    tags: ["livestock", "vaccination", "animal health"]
},
{
    title: "National Artificial Insemination Programme",
    title_ta: "தேசிய செயற்கை கருவூட்டல் திட்டம்",
    category: "Cow Farming Schemes",
    state: "Central",
    description: "Improves cattle breeds through artificial insemination services.",
    description_ta: "செயற்கை கருவூட்டல் மூலம் மாட்டு இன மேம்பாட்டை ஊக்குவிக்கிறது.",
    eligibility: [
        "Cattle Owners"
    ],
    eligibility_ta: [
        "மாட்டு வளர்ப்போர்"
    ],
    benefits: [
        "Breed improvement",
        "Veterinary services"
    ],
    requiredDocuments: [
        "Animal Registration",
        "Aadhaar Card"
    ],
    applicationProcess: "Visit the nearest Veterinary Centre.",
    officialWebsite: "https://dahd.nic.in/",
    tags: ["cow", "breeding", "artificial insemination"]
},
{
    title: "Agricultural Marketing Infrastructure Scheme",
    title_ta: "வேளாண் சந்தைப்படுத்தல் உள்கட்டமைப்பு திட்டம்",
    category: "Agriculture Infrastructure",
    state: "Central",
    description: "Supports construction of grading, storage and marketing infrastructure for agricultural produce.",
    description_ta: "விவசாய பொருட்களின் தரப்படுத்தல், சேமிப்பு மற்றும் சந்தைப்படுத்தல் வசதிகளை உருவாக்க உதவுகிறது.",
    eligibility: [
        "FPOs",
        "Farmers",
        "Entrepreneurs"
    ],
    eligibility_ta: [
        "உழவர் உற்பத்தியாளர் அமைப்புகள்",
        "விவசாயிகள்",
        "தொழில்முனைவோர்"
    ],
    benefits: [
        "Capital subsidy",
        "Infrastructure support"
    ],
    requiredDocuments: [
        "Project Report",
        "Identity Proof",
        "Bank Details"
    ],
    applicationProcess: "Apply through NABARD or designated financial institutions.",
    officialWebsite: "https://www.nabard.org/",
    tags: ["market", "warehouse", "grading"]
},
{
    title: "Mission Organic Value Chain Development for North Eastern Region",
    title_ta: "வடகிழக்கு மாநிலங்களுக்கான இயற்கை மதிப்புச் சங்கிலி மேம்பாட்டு திட்டம்",
    category: "Organic Farming",
    state: "North Eastern States",
    description: "Supports certified organic farming and value chain development in the North Eastern Region.",
    description_ta: "வடகிழக்கு மாநிலங்களில் இயற்கை விவசாயம் மற்றும் சந்தைப்படுத்தல் சங்கிலியை மேம்படுத்துகிறது.",
    eligibility: [
        "Farmers in North Eastern States"
    ],
    eligibility_ta: [
        "வடகிழக்கு மாநில விவசாயிகள்"
    ],
    benefits: [
        "Organic certification",
        "Marketing support",
        "Training"
    ],
    requiredDocuments: [
        "Aadhaar",
        "Land Record"
    ],
    applicationProcess: "Apply through the State Agriculture Department.",
    officialWebsite: "https://movcdner.gov.in/",
    tags: ["organic", "northeast", "value chain"]
},
{
    title: "National Agriculture Market (e-NAM)",
    title_ta: "தேசிய மின்னணு வேளாண் சந்தை",
    category: "Agricultural Marketing",
    state: "Central",
    description: "Online trading platform connecting farmers with agricultural markets across India.",
    description_ta: "இந்தியா முழுவதும் விவசாயிகளை சந்தைகளுடன் இணைக்கும் மின்னணு தளம்.",
    eligibility: [
        "Farmers",
        "Traders",
        "FPOs"
    ],
    eligibility_ta: [
        "விவசாயிகள்",
        "வர்த்தகர்கள்",
        "உழவர் உற்பத்தியாளர் அமைப்புகள்"
    ],
    benefits: [
        "Better market access",
        "Transparent pricing",
        "Online trading"
    ],
    requiredDocuments: [
        "Aadhaar",
        "Bank Account",
        "Mobile Number"
    ],
    applicationProcess: "Register through the e-NAM portal.",
    officialWebsite: "https://enam.gov.in/",
    tags: ["market", "eNAM", "online trading"]
},
{
    title: "Pradhan Mantri Matsya Sampada Yojana",
    title_ta: "பிரதம மந்திரி மத்ஸ்ய சம்பதா யோஜனா",
    category: "Fisheries",
    state: "Central",
    description: "Supports fish farming, aquaculture infrastructure and fisheries development.",
    description_ta: "மீன் வளர்ப்பு மற்றும் மீன்வள உள்கட்டமைப்புக்கு நிதி உதவி வழங்குகிறது.",
    eligibility: [
        "Fish Farmers",
        "Entrepreneurs",
        "Cooperative Societies"
    ],
    eligibility_ta: [
        "மீன் வளர்ப்போர்",
        "தொழில்முனைவோர்",
        "கூட்டுறவு சங்கங்கள்"
    ],
    benefits: [
        "Infrastructure subsidy",
        "Fish seed assistance",
        "Cold chain support"
    ],
    requiredDocuments: [
        "Aadhaar Card",
        "Project Report",
        "Bank Account"
    ],
    applicationProcess: "Apply through the State Fisheries Department.",
    officialWebsite: "https://pmmsy.dof.gov.in/",
    tags: ["fish", "aquaculture", "fisheries", "pond"]
},{
    title: "Agriculture Technology Management Agency (ATMA)",
    title_ta: "வேளாண் தொழில்நுட்ப மேலாண்மை நிறுவனம்",
    category: "Agricultural Extension",
    state: "Central",
    description: "Strengthens agricultural extension services by providing farmer training, demonstrations and advisory support.",
    description_ta: "விவசாயிகளுக்கு பயிற்சி, செயல்விளக்கம் மற்றும் ஆலோசனை சேவைகளை வழங்குகிறது.",
    eligibility: ["Farmers", "Farmer Groups", "FPOs"],
    eligibility_ta: ["விவசாயிகள்", "விவசாய குழுக்கள்", "FPOக்கள்"],
    benefits: ["Free training", "Exposure visits", "Technology demonstrations"],
    requiredDocuments: ["Aadhaar Card"],
    applicationProcess: "Apply through the District ATMA office.",
    officialWebsite: "https://agricoop.nic.in/",
    tags: ["atma", "training", "extension"]
},
{
    title: "Sub-Mission on Seeds and Planting Material (SMSP)",
    title_ta: "விதைகள் மற்றும் நடவு பொருட்கள் துணைத் திட்டம்",
    category: "Seed Scheme",
    state: "Central",
    description: "Promotes production and distribution of quality seeds and planting material.",
    description_ta: "தரமான விதைகள் மற்றும் நடவு பொருட்களின் உற்பத்தி மற்றும் விநியோகத்தை ஊக்குவிக்கிறது.",
    eligibility: ["Farmers", "Seed Producers"],
    eligibility_ta: ["விவசாயிகள்", "விதை உற்பத்தியாளர்கள்"],
    benefits: ["Quality seeds", "Seed production support"],
    requiredDocuments: ["Aadhaar Card", "Land Record"],
    applicationProcess: "Apply through the Agriculture Department.",
    officialWebsite: "https://agricoop.nic.in/",
    tags: ["seed", "planting material", "smsp"]
},
{
    title: "National e-Governance Plan in Agriculture (NeGP-A)",
    title_ta: "வேளாண்மைக்கான தேசிய மின்னணு ஆளுமை திட்டம்",
    category: "Digital Agriculture",
    state: "Central",
    description: "Provides digital agricultural services and online access to government schemes.",
    description_ta: "வேளாண் சேவைகளை டிஜிட்டல் முறையில் வழங்குகிறது.",
    eligibility: ["All Farmers"],
    eligibility_ta: ["அனைத்து விவசாயிகளும்"],
    benefits: ["Digital services", "Online applications"],
    requiredDocuments: ["Aadhaar Card"],
    applicationProcess: "Access through State Agriculture Portal.",
    officialWebsite: "https://agricoop.nic.in/",
    tags: ["digital", "egovernance", "online"]
},
{
    title: "Weather Based Crop Insurance Scheme (WBCIS)",
    title_ta: "வானிலை அடிப்படையிலான பயிர் காப்பீட்டு திட்டம்",
    category: "Crop Insurance",
    state: "Central",
    description: "Provides insurance against adverse weather conditions affecting crops.",
    description_ta: "பாதகமான வானிலை காரணமாக ஏற்படும் பயிர் இழப்பிற்கு காப்பீடு வழங்குகிறது.",
    eligibility: ["Eligible Farmers"],
    eligibility_ta: ["தகுதியான விவசாயிகள்"],
    benefits: ["Weather risk insurance"],
    requiredDocuments: ["Aadhaar", "Land Record", "Bank Account"],
    applicationProcess: "Apply through banks or insurance companies.",
    officialWebsite: "https://pmfby.gov.in/",
    tags: ["weather", "insurance", "wbcis"]
},
{
    title: "Unified Package Insurance Scheme (UPIS)",
    title_ta: "ஒருங்கிணைந்த காப்பீட்டு தொகுப்பு திட்டம்",
    category: "Insurance",
    state: "Central",
    description: "Offers integrated insurance coverage for crops and allied risks.",
    description_ta: "பயிர்கள் மற்றும் தொடர்புடைய அபாயங்களுக்கு ஒருங்கிணைந்த காப்பீடு வழங்குகிறது.",
    eligibility: ["Farmers"],
    eligibility_ta: ["விவசாயிகள்"],
    benefits: ["Integrated insurance coverage"],
    requiredDocuments: ["Aadhaar", "Bank Account"],
    applicationProcess: "Apply through participating banks.",
    officialWebsite: "https://pmfby.gov.in/",
    tags: ["insurance", "upis"]
},
{
    title: "Soil Health Management (SHM)",
    title_ta: "மண் வள மேலாண்மை திட்டம்",
    category: "Soil Health",
    state: "Central",
    description: "Promotes balanced nutrient management and soil fertility improvement.",
    description_ta: "மண் வளத்தை மேம்படுத்தவும் சமநிலை உர பயன்பாட்டை ஊக்குவிக்கவும் உதவுகிறது.",
    eligibility: ["All Farmers"],
    eligibility_ta: ["அனைத்து விவசாயிகளும்"],
    benefits: ["Soil fertility improvement", "Nutrient management"],
    requiredDocuments: ["Aadhaar Card"],
    applicationProcess: "Apply through Agriculture Department.",
    officialWebsite: "https://agricoop.nic.in/",
    tags: ["soil", "shm", "fertility"]
},
{
    title: "Rainfed Area Development (RAD)",
    title_ta: "மானாவாரி பகுதி மேம்பாட்டு திட்டம்",
    category: "Water Conservation",
    state: "Central",
    description: "Supports integrated farming systems in rainfed areas.",
    description_ta: "மானாவாரி பகுதிகளில் ஒருங்கிணைந்த விவசாயத்தை ஊக்குவிக்கிறது.",
    eligibility: ["Farmers in Rainfed Areas"],
    eligibility_ta: ["மானாவாரி பகுதி விவசாயிகள்"],
    benefits: ["Integrated farming support"],
    requiredDocuments: ["Aadhaar Card", "Land Record"],
    applicationProcess: "Apply through Agriculture Department.",
    officialWebsite: "https://agricoop.nic.in/",
    tags: ["rainfed", "rad", "water"]
},
{
    title: "Climate Change and Sustainable Agriculture: Monitoring, Modelling and Networking (CCSAMMN)",
    title_ta: "காலநிலை மாற்றம் மற்றும் நிலையான வேளாண்மை திட்டம்",
    category: "Climate Smart Agriculture",
    state: "Central",
    description: "Supports climate-resilient agricultural practices and monitoring.",
    description_ta: "காலநிலை மாற்றத்திற்கேற்ற வேளாண் முறைகளை ஊக்குவிக்கிறது.",
    eligibility: ["Farmers", "Research Institutions"],
    eligibility_ta: ["விவசாயிகள்", "ஆராய்ச்சி நிறுவனங்கள்"],
    benefits: ["Climate adaptation support"],
    requiredDocuments: ["Aadhaar Card"],
    applicationProcess: "Implemented through government programmes.",
    officialWebsite: "https://agricoop.nic.in/",
    tags: ["climate", "sustainable", "ccsammn"]
},
{
    title: "Modified Interest Subvention Scheme (MISS)",
    title_ta: "திருத்தப்பட்ட வட்டி மானிய திட்டம்",
    category: "Agricultural Credit",
    state: "Central",
    description: "Provides interest subvention on short-term crop loans through eligible banks.",
    description_ta: "குறுகிய கால பயிர் கடன்களுக்கு வட்டி மானியம் வழங்குகிறது.",
    eligibility: ["Eligible Farmers with Crop Loans"],
    eligibility_ta: ["பயிர் கடன் பெற்ற தகுதியான விவசாயிகள்"],
    benefits: ["Reduced interest on crop loans"],
    requiredDocuments: ["Aadhaar", "Bank Account", "Loan Details"],
    applicationProcess: "Available through participating banks.",
    officialWebsite: "https://agricoop.nic.in/",
    tags: ["loan", "interest", "credit"]
},
{
    title: "Digital Crop Survey (DCS)",
    title_ta: "டிஜிட்டல் பயிர் கணக்கெடுப்பு",
    category: "Digital Agriculture",
    state: "Central",
    description: "Digitally records crop information to improve planning and scheme delivery.",
    description_ta: "பயிர் விவரங்களை டிஜிட்டல் முறையில் பதிவு செய்து திட்ட செயல்பாட்டை மேம்படுத்துகிறது.",
    eligibility: ["Farmers"],
    eligibility_ta: ["விவசாயிகள்"],
    benefits: ["Accurate crop records", "Better scheme implementation"],
    requiredDocuments: ["Aadhaar Card"],
    applicationProcess: "Implemented through State Agriculture Departments.",
    officialWebsite: "https://agricoop.nic.in/",
    tags: ["digital", "crop survey", "dcs"]
},{
    title: "Pradhan Mantri Kisan Maandhan Yojana (PM-KMY)",
    title_ta: "பிரதம மந்திரி கிசான் மாந்தன் யோஜனா",
    category: "Farmer Pension",
    state: "Central",
    description: "Provides a monthly pension of ₹3,000 after the age of 60 to eligible small and marginal farmers.",
    description_ta: "தகுதியான சிறு மற்றும் குறு விவசாயிகளுக்கு 60 வயதுக்கு பிறகு மாதம் ₹3,000 ஓய்வூதியம் வழங்குகிறது.",
    eligibility: [
        "Small and Marginal Farmers",
        "Age 18-40 years"
    ],
    eligibility_ta: [
        "சிறு மற்றும் குறு விவசாயிகள்",
        "18 முதல் 40 வயது வரை"
    ],
    benefits: [
        "₹3,000 monthly pension after 60 years"
    ],
    requiredDocuments: [
        "Aadhaar Card",
        "Bank Account",
        "Land Records"
    ],
    applicationProcess: "Register through CSC or PM-KMY portal.",
    officialWebsite: "https://maandhan.in/",
    tags: ["pension","pmkmy","farmer"]
},
{
    title: "Agri-Clinics and Agri-Business Centres (ACABC)",
    title_ta: "வேளாண் ஆலோசனை மற்றும் வேளாண் தொழில் மையங்கள்",
    category: "Agriculture Entrepreneurship",
    state: "Central",
    description: "Supports agriculture graduates in establishing agri-clinics and agri-business centres.",
    description_ta: "வேளாண் பட்டதாரிகள் வேளாண் தொழில் தொடங்க உதவுகிறது.",
    eligibility: [
        "Agriculture Graduates",
        "Diploma Holders in Agriculture"
    ],
    eligibility_ta: [
        "வேளாண் பட்டதாரிகள்",
        "வேளாண் டிப்ளமோ பெற்றவர்கள்"
    ],
    benefits: [
        "Training",
        "Credit-linked subsidy",
        "Business support"
    ],
    requiredDocuments: [
        "Educational Certificate",
        "Aadhaar Card",
        "Project Report"
    ],
    applicationProcess: "Apply through the ACABC portal.",
    officialWebsite: "https://www.agriclinics.net/",
    tags: ["startup","agribusiness","acabc"]
},
{
    title: "Krishi Unnati Yojana (KUY)",
    title_ta: "கிருஷி உன்னதி யோஜனா",
    category: "Agriculture Development",
    state: "Central",
    description: "Umbrella programme integrating multiple agriculture development initiatives to improve farmer income and productivity.",
    description_ta: "விவசாய வருமானம் மற்றும் உற்பத்தியை அதிகரிக்கும் ஒருங்கிணைந்த வேளாண் திட்டம்.",
    eligibility: [
        "Farmers",
        "Farmer Producer Organizations"
    ],
    eligibility_ta: [
        "விவசாயிகள்",
        "உழவர் உற்பத்தியாளர் அமைப்புகள்"
    ],
    benefits: [
        "Support under various agriculture components"
    ],
    requiredDocuments: [
        "Aadhaar Card",
        "Land Records"
    ],
    applicationProcess: "Apply through the State Agriculture Department.",
    officialWebsite: "https://agricoop.gov.in/",
    tags: ["kuy","agriculture","development"]
},
{
    title: "National Mission on Edible Oils – Oil Palm (NMEO-OP)",
    title_ta: "தேசிய உணவு எண்ணெய் இயக்கம் - எண்ணெய் பனை",
    category: "Oil Palm",
    state: "Central",
    description: "Promotes oil palm cultivation to increase domestic edible oil production.",
    description_ta: "உள்நாட்டு சமையல் எண்ணெய் உற்பத்தியை அதிகரிக்க எண்ணெய் பனை சாகுபடியை ஊக்குவிக்கிறது.",
    eligibility: [
        "Eligible Farmers"
    ],
    eligibility_ta: [
        "தகுதியான விவசாயிகள்"
    ],
    benefits: [
        "Planting assistance",
        "Maintenance assistance"
    ],
    requiredDocuments: [
        "Aadhaar Card",
        "Land Records"
    ],
    applicationProcess: "Apply through the Horticulture Department.",
    officialWebsite: "https://nmeo.dac.gov.in/",
    tags: ["oil palm","nmeo","plantation"]
},
{
    title: "Mission Organic Value Chain Development for North Eastern Region (MOVCDNER)",
    title_ta: "வடகிழக்கு மாநிலங்களுக்கான இயற்கை மதிப்புச் சங்கிலி மேம்பாட்டு திட்டம்",
    category: "Organic Farming",
    state: "North Eastern States",
    description: "Supports certified organic farming and value chain development in North Eastern states.",
    description_ta: "வடகிழக்கு மாநிலங்களில் இயற்கை விவசாயம் மற்றும் சந்தைப்படுத்தல் சங்கிலியை மேம்படுத்துகிறது.",
    eligibility: [
        "Farmers in North Eastern States"
    ],
    eligibility_ta: [
        "வடகிழக்கு மாநில விவசாயிகள்"
    ],
    benefits: [
        "Organic certification",
        "Market linkage",
        "Training"
    ],
    requiredDocuments: [
        "Aadhaar Card",
        "Land Records"
    ],
    applicationProcess: "Apply through the State Agriculture Department.",
    officialWebsite: "https://movcdner.gov.in/",
    tags: ["organic","movcdner","northeast"]
}
];

const seedDatabase = async () => {
  try {
    console.log(`⏳ Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB successfully.');

    console.log('🗑️  Clearing existing schemes...');
    await Scheme.deleteMany({});
    
    // Create DB objects (strip out _ta fields which are just for i18n JSONs)
    const dbSchemes = schemesData.map(s => {
      const dbScheme = { ...s };
      delete dbScheme.title_ta;
      delete dbScheme.description_ta;
      delete dbScheme.eligibility_ta;
      delete dbScheme.benefits_ta;
      return dbScheme;
    });

    console.log(`🌱 Seeding ${dbSchemes.length} schemes into the database...`);
    await Scheme.insertMany(dbSchemes);
    console.log(`✅ Successfully seeded database!`);

    // Now update translation files
    const enPath = path.join(__dirname, '..', '..', 'app', 'src', 'locales', 'en', 'translation.json');
    const taPath = path.join(__dirname, '..', '..', 'app', 'src', 'locales', 'ta', 'translation.json');

    const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const taJson = JSON.parse(fs.readFileSync(taPath, 'utf8'));

    schemesData.forEach(s => {
      // Add english fallbacks
      enJson[s.title] = s.title;
      enJson[s.description] = s.description;
      s.eligibility.forEach(e => enJson[e] = e);
      
      // Add tamil translations
      taJson[s.title] = s.title_ta;
      taJson[s.description] = s.description_ta;
      s.eligibility.forEach((e, idx) => {
        taJson[e] = s.eligibility_ta[idx];
      });
    });

    fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2));
    fs.writeFileSync(taPath, JSON.stringify(taJson, null, 2));
    
    console.log(`✅ Successfully updated English and Tamil translation files!`);
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
