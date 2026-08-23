const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'app/src/locales/en/translation.json');
const taPath = path.join(__dirname, 'app/src/locales/ta/translation.json');

const updateTranslation = (filePath, newKeys) => {
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    for (const [key, value] of Object.entries(newKeys)) {
      if (!data[key]) {
        data[key] = value;
      }
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
};

const enKeys = {
  // Feed Types
  "Milk / Milk Replacer": "Milk / Milk Replacer",
  "Calf Starter": "Calf Starter",
  "Green Fodder": "Green Fodder",
  "Paddy Straw": "Paddy Straw",
  "Rice Bran": "Rice Bran",
  "Groundnut Cake": "Groundnut Cake",
  "Mineral Mixture": "Mineral Mixture",
  "Special Diet": "Special Diet",
  
  // Life Stages
  "CALF": "Calf (0-6 months)",
  "GROWING HEIFER": "Growing Heifer (6-24 months)",
  "ADULT NON-LACTATING": "Adult Non-Lactating",
  "PREGNANT": "Pregnant",
  "LACTATING": "Lactating",
  "PREGNANT + LACTATING": "Pregnant & Lactating",
  "DRY COW": "Dry Cow",
  "SPECIAL CARE": "Special Care",
  "BULL": "Bull",

  // Pregnancy Trimesters
  "FIRST TRIMESTER": "First Trimester",
  "SECOND TRIMESTER": "Second Trimester",
  "THIRD TRIMESTER": "Third Trimester",
  
  // Modals
  "Breed": "Breed",
  "Weight": "Weight",
  "Milk Yield": "Milk Yield",
  "To Delivery": "To Delivery"
};

const taKeys = {
  // Feed Types
  "Milk / Milk Replacer": "பால் / பால் மாற்று",
  "Calf Starter": "கன்று தீவனம் (Calf Starter)",
  "Green Fodder": "பசுந்தீவனம்",
  "Paddy Straw": "வைக்கோல்",
  "Rice Bran": "தவிடு",
  "Groundnut Cake": "கடலை புண்ணாக்கு",
  "Mineral Mixture": "தாது உப்புக்கலவை",
  "Special Diet": "சிறப்பு உணவு",
  
  // Life Stages
  "CALF": "கன்று (0-6 மாதங்கள்)",
  "GROWING HEIFER": "வளரும் கிடாரி (6-24 மாதங்கள்)",
  "ADULT NON-LACTATING": "பால் கறக்காத பசு",
  "PREGNANT": "சினை மாடு",
  "LACTATING": "கறவை மாடு",
  "PREGNANT + LACTATING": "சினை மற்றும் கறவை மாடு",
  "DRY COW": "வற்றிய மாடு",
  "SPECIAL CARE": "சிறப்பு கவனம்",
  "BULL": "காளை",

  // Pregnancy Trimesters
  "FIRST TRIMESTER": "முதல் மும்மாதம்",
  "SECOND TRIMESTER": "இரண்டாம் மும்மாதம்",
  "THIRD TRIMESTER": "மூன்றாம் மும்மாதம்",
  
  // Modals
  "Breed": "இனம்",
  "Weight": "எடை",
  "Milk Yield": "பால் அளவு",
  "To Delivery": "பிரசவத்திற்கு"
};

updateTranslation(enPath, enKeys);
updateTranslation(taPath, taKeys);
