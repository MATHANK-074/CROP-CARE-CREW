const fs = require('fs');

const taPath = 'C:\\Users\\Ponsabari\\OneDrive\\Desktop\\agri\\CROP-CARE-CREW\\app\\src\\locales\\ta\\translation.json';
let taData = JSON.parse(fs.readFileSync(taPath, 'utf8'));

const additions = {
  "Your farm is currently operating profitably.": "உங்கள் பண்ணை தற்போது லாபகரமாக செயல்படுகிறது.",
  "Your farm is currently operating at a loss.": "உங்கள் பண்ணை தற்போது நஷ்டத்தில் செயல்படுகிறது.",
  "Milk production is stable across the herd.": "மந்தை முழுவதும் பால் உற்பத்தி நிலையாக உள்ளது.",
  "Milk production is declining due to upcoming dry-offs.": "வரவிருக்கும் உலர் காலங்களால் பால் உற்பத்தி குறைகிறது.",
  "{{count}} animal(s) require monitoring.": "{{count}} விலங்குகளுக்கு கண்காணிப்பு தேவை.",
  "No animals require monitoring.": "எந்த விலங்குகளுக்கும் கண்காணிப்பு தேவையில்லை.",
  "{{count}} critical veterinary alerts are currently active.": "{{count}} முக்கியமான கால்நடை மருத்துவ எச்சரிக்கைகள் தற்போது செயலில் உள்ளன.",
  "No critical veterinary alerts are currently active.": "தற்போது முக்கியமான கால்நடை மருத்துவ எச்சரிக்கைகள் ஏதும் இல்லை.",
  "Estimated 30-day net profit:": "மதிப்பிடப்பட்ட 30-நாள் நிகர லாபம்:",
  "Farm Assets": "பண்ணை சொத்துக்கள்",
  "Herd Directory": "கால்நடை அடைவு",
  "Feed Management": "தீவன மேலாண்மை",
  "Reproductive AI": "இனப்பெருக்க ஏஜ",
  "Milk Analytics": "பால் பகுப்பாய்வு",
  "Alert Center": "எச்சரிக்கை மையம்"
};

for (const [key, val] of Object.entries(additions)) {
  taData[key] = val;
}

fs.writeFileSync(taPath, JSON.stringify(taData, null, 2));
console.log('Added summary ta translations');
