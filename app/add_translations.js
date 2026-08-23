const fs = require('fs');

const taPath = 'C:\\Users\\Ponsabari\\OneDrive\\Desktop\\agri\\CROP-CARE-CREW\\app\\src\\locales\\ta\\translation.json';
let taData = JSON.parse(fs.readFileSync(taPath, 'utf8'));

const additions = {
  "Animals": "விலங்குகள்",
  "RETAIN": "தக்கவை",
  "MONITOR": "கண்காணிப்பு",
  "LIFECYCLE REVIEW": "வாழ்க்கை சுழற்சி ஆய்வு",
  "VETERINARY REVIEW": "கால்நடை மருத்துவ ஆய்வு",
  "Farm Intelligence": "பண்ணை நுண்ணறிவு",
  "TODAY'S FARM ACTIONS": "இன்றைய பண்ணை செயல்கள்",
  "No critical actions today": "இன்று எந்த முக்கியமான செயல்களும் இல்லை",
  "Estimated": "மதிப்பிடப்பட்டுள்ளது",
  "Actual": "உண்மையான",
  "Total Asset Value": "மொத்த சொத்து மதிப்பு",
  "Past 30D Revenue": "கடந்த 30டி வருவாய்",
  "Past 30D Expense": "கடந்த 30டி செலவு",
  "Net Profit": "நிகர லாபம்",
  "vs previous 30 days": "முந்தைய 30 நாட்களுடன் ஒப்பிடும்போது",
  "Insufficient historical data": "போதிய வரலாற்று தரவு இல்லை",
  "Profit Forecast": "லாப முன்னறிவிப்பு",
  "PREDICTED": "கணிக்கப்பட்டுள்ளது",
  "Next 7 Days": "அடுத்த 7 நாட்கள்",
  "Next 30 Days": "அடுத்த 30 நாட்கள்",
  "Next 90 Days": "அடுத்த 90 நாட்கள்",
  "Cost Per Litre": "ஒரு லிட்டருக்கான செலவு",
  "Based on last 30 days": "கடந்த 30 நாட்களின் அடிப்படையில்",
  "Est. Margin": "மதிப்பிடப்பட்ட விளிம்பு",
  "Selling price minus CPL": "விற்பனை விலை மைனஸ் CPL",
  "Farm Break-Even Price": "பண்ணை பிரேக்-ஈவன் விலை",
  "Min price to cover costs": "செலவுகளை ஈடுகட்ட குறைந்தபட்ச விலை",
  "Farm Break-Even Yield": "பண்ணை பிரேக்-ஈவன் மகசூல்",
  "Farm-level daily req": "பண்ணை அளவிலான தினசரி தேவை",
  "Production Loss Prediction (30-Day)": "உற்பத்தி இழப்பு கணிப்பு (30 நாள்)",
  "projected loss": "திட்டமிடப்பட்ட இழப்பு",
  "Estimated revenue impact:": "மதிப்பிடப்பட்ட வருவாய் பாதிப்பு:",
  "Reason:": "காரணம்:",
  "No significant production losses predicted": "குறிப்பிடத்தக்க உற்பத்தி இழப்புகள் கணிக்கப்படவில்லை",
  "Historical production is currently stable.": "வரலாற்று உற்பத்தி தற்போது நிலையானது.",
  "Farm Risk Heatmap": "பண்ணை இடர் வரைபடம்",
  "Legend:": "விளக்கம்:",
  "Good": "நல்லது",
  "Review": "ஆய்வு",
  "High Risk": "அதிக ஆபத்து",
  "Animal": "விலங்கு",
  "Health": "சுகாதாரம்",
  "Lifecycle": "வாழ்க்கை சுழற்சி",
  "Production": "உற்பத்தி",
  "Profitability": "லாபம்",
  "Overall Risk": "ஒட்டுமொத்த ஆபத்து",
  "Action": "செயல்"
};

for (const [key, val] of Object.entries(additions)) {
  taData[key] = val;
}

fs.writeFileSync(taPath, JSON.stringify(taData, null, 2));
console.log('Added ta translations');
