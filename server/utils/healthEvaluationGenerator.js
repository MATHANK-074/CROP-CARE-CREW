const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const generateHealthEvaluation = async (cowData, medicalRecords) => {
  if (!genAI) {
    console.warn("GEMINI_API_KEY is not set. Using fallback logic.");
    return fallbackEvaluation(cowData, medicalRecords);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are an expert veterinarian and farm manager AI assistant.
    Your task is to evaluate the health and economic viability of a farm animal (cow/buffalo) based on its profile and medical history.
    
    Animal Profile:
    - Tag ID: ${cowData.tagId}
    - Category: ${cowData.category}
    - Breed: ${cowData.breed || 'Unknown'}
    - Gender: ${cowData.gender || 'Unknown'}
    - Current Status: ${cowData.status || 'Unknown'}
    - Milk Production (Avg): ${cowData.averageMilkYield || 0} Liters/Day
    
    Medical History (Vaccines, Treatments, Illnesses):
    ${medicalRecords.length === 0 ? "No medical records found." : medicalRecords.map(r => `- Date: ${r.date}, Type: ${r.type}, Name: ${r.name}, Notes: ${r.notes || 'N/A'}`).join('\n    ')}

    Analyze this data and determine if the farm should "Keep", "Monitor", or "Sell/Cull" this animal.
    - If it has many costly treatments or repeated illnesses, consider "Sell/Cull" or "Monitor".
    - If it's healthy with mostly routine vaccines, output "Keep".
    
    Provide your response as a valid JSON object with the following structure exactly:
    {
      "recommendation": "Keep" | "Monitor" | "Sell/Cull",
      "healthScore": <Number between 0 and 100, where 100 is perfectly healthy>,
      "reasoning": "<A 2-3 sentence explanation for this recommendation based on the data provided>"
    }
    
    Return ONLY the raw JSON string, without markdown formatting like \`\`\`json.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error generating AI health evaluation:", error);
    return fallbackEvaluation(cowData, medicalRecords);
  }
};

const fallbackEvaluation = (cowData, medicalRecords) => {
  const treatments = medicalRecords.filter(r => r.type === 'Treatment' || r.type === 'Other').length;
  
  if (treatments > 3) {
    return {
      recommendation: 'Sell/Cull',
      healthScore: 40,
      reasoning: 'Fallback logic: High number of medical treatments recorded. Economical viability is low.'
    };
  } else if (treatments > 1) {
    return {
      recommendation: 'Monitor',
      healthScore: 70,
      reasoning: 'Fallback logic: Some medical treatments recorded. Requires close monitoring.'
    };
  } else {
    return {
      recommendation: 'Keep',
      healthScore: 95,
      reasoning: 'Fallback logic: Animal appears healthy with minimal non-routine medical interventions.'
    };
  }
};

module.exports = { generateHealthEvaluation };
