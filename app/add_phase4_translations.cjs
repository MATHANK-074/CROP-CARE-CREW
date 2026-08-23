const fs = require('fs');

const taPath = 'C:\\Users\\Ponsabari\\OneDrive\\Desktop\\agri\\CROP-CARE-CREW\\app\\src\\locales\\ta\\translation.json';
let taData = JSON.parse(fs.readFileSync(taPath, 'utf8'));

const additions = {
  "Farm Settings": "பண்ணை அமைப்புகள்",
  "Financial Settings": "நிதி அமைப்புகள்",
  "Milk Selling Price": "பால் விற்பனை விலை",
  "per Litre": "ஒரு லிட்டருக்கு",
  "Leave empty if not configured": "அமைக்கப்படாவிட்டால் காலியாக விடவும்",
  "Currency": "நாணயம்",
  "Save Price": "விலையை சேமி",
  "Price History": "விலை வரலாறு",
  "Price": "விலை",
  "Effective Date": "நடைமுறை தேதி",
  "Effective To": "நடைமுறை முடிவு",
  "Updated By": "புதுப்பித்தவர்",
  "Milk selling price not configured": "பால் விற்பனை விலை அமைக்கப்படவில்லை",
  "Feed margin calculations are disabled until a milk price is set.": "பால் விலை அமைக்கப்படும் வரை தீவன லாபக் கணக்கீடுகள் முடக்கப்படும்.",
  "Configure Price": "விலையை அமை",
  "Feed Cost Anomaly": "தீவன செலவு முரண்பாடு",
  "Cost increased by": "செலவு அதிகரித்துள்ளது",
  "compared to 7-day average": "7 நாள் சராசரியுடன் ஒப்பிடும்போது",
  "Feed Efficiency Trend": "தீவன செயல்திறன் போக்கு",
  "Prev 7 Days Cost/Litre": "முந்தைய 7 நாட்கள் செலவு/லிட்டர்",
  "Cur 7 Days Cost/Litre": "தற்போதைய 7 நாட்கள் செலவு/லிட்டர்"
};

for (const [key, val] of Object.entries(additions)) {
  taData[key] = val;
}

fs.writeFileSync(taPath, JSON.stringify(taData, null, 2));
console.log('Added Phase 4 ta translations');
