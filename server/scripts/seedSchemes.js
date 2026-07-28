const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Scheme = require('../models/Scheme');

// Load environment variables from the server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in your .env file!');
  process.exit(1);
}

const seedSchemes = [
  {
    title: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    category: "PM-KISAN",
    state: "Central",
    description: "A central sector scheme to provide income support to all landholding farmers' families in the country to supplement their financial needs for procuring various inputs related to agriculture and allied activities.",
    eligibility: [
      "All landholding farmers' families",
      "Must have cultivable landholding in their names",
      "Institutional land holders are excluded",
      "Professionals (Doctors, Engineers, Lawyers) who practice are excluded"
    ],
    benefits: [
      "Financial benefit of Rs 6,000/- per year",
      "Payable in three equal installments of Rs 2,000/- each",
      "Direct Benefit Transfer (DBT) into bank accounts"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Land ownership documents (Khatauni)",
      "Bank Account details",
      "Passport size photograph"
    ],
    applicationProcess: "Apply online through the official PM-KISAN portal or via local Common Service Centres (CSCs).",
    officialWebsite: "https://pmkisan.gov.in/",
    tags: ["income support", "cash transfer", "central", "farmer financial aid"]
  },
  {
    title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    category: "PMFBY",
    state: "Central",
    description: "A comprehensive crop insurance scheme aimed at providing financial support to farmers suffering crop loss/damage arising out of unforeseen events, encouraging them to adopt innovative and modern agricultural practices.",
    eligibility: [
      "All farmers growing notified crops in a notified area",
      "Sharecroppers and tenant farmers are also eligible",
      "Compulsory for loanee farmers (who took crop loans)"
    ],
    benefits: [
      "Insurance cover against crop failure due to non-preventable risks like drought, flood, pests, and diseases",
      "Low premium rates: 2% for Kharif crops, 1.5% for Rabi crops, and 5% for commercial/horticulture crops"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Land Records / Tenancy Agreement",
      "Bank Passbook",
      "Sowing Certificate"
    ],
    applicationProcess: "Apply via banks, CSCs, or the official PMFBY portal.",
    officialWebsite: "https://pmfby.gov.in/",
    tags: ["insurance", "crop loss", "drought", "flood", "subsidy"]
  },
  {
    title: "Kisan Credit Card (KCC)",
    category: "Loan Advisor",
    state: "Central",
    description: "The scheme aims to provide adequate and timely credit support from the banking system under a single window with flexible and simplified procedure to the farmers for their cultivation and other needs.",
    eligibility: [
      "Individual farmers/Joint borrowers who are owner cultivators",
      "Tenant Farmers, Oral Lessees & Share Croppers",
      "Self Help Groups (SHGs) or Joint Liability Groups (JLGs) of farmers"
    ],
    benefits: [
      "Short term credit for crops",
      "Post-harvest expenses",
      "Produce marketing loan",
      "Consumption requirements of farmer household",
      "Interest subvention of 2% and Prompt Repayment Incentive of 3%"
    ],
    requiredDocuments: [
      "Duly filled application form",
      "Identity proof (Aadhaar/Voter ID)",
      "Address proof",
      "Land ownership documents"
    ],
    applicationProcess: "Apply directly at any commercial bank, Regional Rural Bank (RRB), or cooperative bank.",
    officialWebsite: "https://sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card",
    tags: ["loan", "credit", "finance", "bank", "interest subvention"]
  },
  {
    title: "Soil Health Card Scheme",
    category: "Soil Health",
    state: "Central",
    description: "Promotes soil test based nutrient management. The scheme assists State Governments to issue Soil Health Cards to all farmers in the country, providing information on the nutrient status of their soil.",
    eligibility: [
      "All farmers in India"
    ],
    benefits: [
      "Information on 12 soil parameters (pH, EC, OC, N, P, K, S, Zn, Fe, Cu, Mn, Bo)",
      "Recommendations on appropriate dosage of fertilizers and soil amendments",
      "Reduces fertilizer costs and improves crop yield"
    ],
    requiredDocuments: [
      "Land details",
      "Aadhaar Card"
    ],
    applicationProcess: "Contact local agriculture department officials or Krishi Vigyan Kendras (KVKs) for soil sampling.",
    officialWebsite: "https://soilhealth.dac.gov.in/",
    tags: ["soil", "fertilizer", "testing", "health", "nutrients"]
  },
  {
    title: "PM KUSUM (Solar Pump Subsidy)",
    category: "Solar Pump Subsidy",
    state: "Central",
    description: "Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan (PM-KUSUM) aims to provide energy security along with financial and water security to farmers.",
    eligibility: [
      "Individual farmers, groups of farmers, cooperatives, panchayats, Farmer Producer Organisations (FPOs)"
    ],
    benefits: [
      "Setup of decentralized solar power plants",
      "Installation of standalone solar agriculture pumps",
      "Solarisation of existing grid-connected agriculture pumps",
      "Government subsidy up to 60% of the pump cost"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Land documents",
      "Bank Account details",
      "Grid connection details (if applicable)"
    ],
    applicationProcess: "Apply through the respective State Nodal Agencies for renewable energy.",
    officialWebsite: "https://pmkusum.mnre.gov.in/",
    tags: ["solar", "pump", "electricity", "irrigation", "subsidy"]
  },
  {
    title: "Per Drop More Crop (Drip Irrigation Subsidy)",
    category: "Drip Irrigation Subsidy",
    state: "Central",
    description: "A component of the Pradhan Mantri Krishi Sinchayee Yojana (PMKSY) focusing on enhancing water use efficiency at farm level through Micro Irrigation (Drip and Sprinkler Irrigation Systems).",
    eligibility: [
      "All farmers having cultivable land and water source",
      "Preference given to small and marginal farmers"
    ],
    benefits: [
      "Subsidy of 55% for small and marginal farmers",
      "Subsidy of 45% for other farmers for installing micro-irrigation systems",
      "Significant water savings and yield increase"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Land records",
      "Bank passbook",
      "Quotation from approved vendor"
    ],
    applicationProcess: "Apply through the State Agriculture/Horticulture Department portal.",
    officialWebsite: "https://pmksy.gov.in/",
    tags: ["water", "irrigation", "drip", "sprinkler", "subsidy"]
  },
  {
    title: "Dairy Entrepreneurship Development Scheme (DEDS)",
    category: "Dairy Farming Schemes",
    state: "Central",
    description: "Implemented by NABARD to promote setting up of modern dairy farms for production of clean milk, encourage heifer calf rearing, and bring structural changes in the unorganized sector.",
    eligibility: [
      "Farmers, individual entrepreneurs, NGOs, companies, groups of unorganized and organized sector"
    ],
    benefits: [
      "25% back-ended capital subsidy (33.33% for SC/ST farmers)",
      "Financial assistance for purchasing milch animals, milking machines, and establishing dairy units"
    ],
    requiredDocuments: [
      "Detailed project report (DPR)",
      "Bank loan application",
      "Identity and Address Proof",
      "Land documents for farm setup"
    ],
    applicationProcess: "Submit project report and loan application to any commercial or cooperative bank approved by NABARD.",
    officialWebsite: "https://www.nabard.org/",
    tags: ["dairy", "cows", "milk", "nabard", "livestock"]
  },
  {
    title: "National Livestock Mission (Goat & Poultry Farming)",
    category: "Goat Farming Schemes",
    state: "Central",
    description: "The mission is designed to cover all activities required to ensure quantitative and qualitative improvement in livestock production systems and capacity building.",
    eligibility: [
      "Farmers, FPOs, SHGs, JLGs, and entrepreneurs interested in goat, sheep, poultry, and pig farming."
    ],
    benefits: [
      "50% capital subsidy (up to Rs. 50 Lakhs) for establishing rural slaughterhouses, poultry farms, and goat breeding units",
      "Support for fodder seed procurement"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Detailed Project Report",
      "Bank Guarantee",
      "Proof of land availability"
    ],
    applicationProcess: "Apply online via the National Livestock Mission portal (nlm.udyamimitra.in).",
    officialWebsite: "https://nlm.udyamimitra.in/",
    tags: ["goat", "poultry", "livestock", "subsidy", "breeding"]
  }
];

const seedDatabase = async () => {
  try {
    console.log(`⏳ Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB successfully.');

    // Clear existing schemes to avoid duplicates
    console.log('🗑️  Clearing existing schemes...');
    await Scheme.deleteMany({});
    
    // Insert new schemes
    console.log(`🌱 Seeding ${seedSchemes.length} schemes into the database...`);
    const inserted = await Scheme.insertMany(seedSchemes);
    
    console.log(`✅ Successfully seeded ${inserted.length} schemes!`);
    console.log('🔌 Closing database connection...');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
