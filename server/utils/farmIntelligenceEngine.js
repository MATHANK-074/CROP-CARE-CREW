/**
 * farmIntelligenceEngine.js
 * Pipeline interface for Predictive Farm Intelligence:
 * DATA -> FEATURE ENGINEERING -> RULE ENGINE -> SCORE -> EXPLANATION -> RECOMMENDATION
 * Structured to be modular so ML models can later replace individual components.
 */

// 1. Data Confidence Score
function calculateDataConfidence(animalLogs, daysRequested = 30) {
  if (!animalLogs || animalLogs.length === 0) {
    return { score: 0, confidence: 'Low', reason: 'Insufficient historical data for reliable prediction.' };
  }
  
  // Basic heuristic: what percentage of requested days have logs?
  const uniqueLogDates = new Set(animalLogs.map(log => new Date(log.date).toISOString().split('T')[0]));
  const percentage = Math.min(100, Math.round((uniqueLogDates.size / daysRequested) * 100));
  
  let confidence = 'Low';
  if (percentage >= 80) confidence = 'High';
  else if (percentage >= 40) confidence = 'Medium';

  return {
    score: percentage,
    confidence,
    reason: `${uniqueLogDates.size} days of historical milk records out of ${daysRequested} days requested.`
  };
}

// 2. Milk Yield Forecasting
function predictMilkYield(animal, thirtyDayAvgYield, currentYield, peakYield, isPregnant, daysToDryOff) {
  let expected30DayDeclinePercent = 0;
  let reason = 'Stable lactation curve.';
  
  // Base natural decline (~5% per month typical for mid/late lactation)
  if (thirtyDayAvgYield > 0) {
    expected30DayDeclinePercent = 5;
    reason = 'Expected natural lactation decline (approx 5%/mo).';
  }

  // Adjusted for pregnancy and dry-off
  if (isPregnant && daysToDryOff !== null) {
    if (daysToDryOff <= 30) {
      expected30DayDeclinePercent = 80;
      reason = `Approaching dry period in ${daysToDryOff} days. Significant yield drop expected.`;
    } else if (daysToDryOff <= 60) {
      expected30DayDeclinePercent = 20;
      reason = 'Late pregnancy natural decline ahead of dry-off.';
    }
  }

  // Adjusted for historical trend (if currently dropping fast, extrapolate)
  if (currentYield < thirtyDayAvgYield * 0.8 && (!isPregnant || daysToDryOff > 60)) {
     expected30DayDeclinePercent = Math.max(expected30DayDeclinePercent, 15);
     reason = 'Recent production drop suggests steeper decline trend.';
  }

  const predicted30DayAvg = Math.max(0, thirtyDayAvgYield * (1 - (expected30DayDeclinePercent / 100)));
  const predicted7DayAvg = Math.max(0, thirtyDayAvgYield * (1 - ((expected30DayDeclinePercent / 4) / 100)));

  return {
    current: thirtyDayAvgYield,
    predicted7Day: predicted7DayAvg,
    predicted30Day: predicted30DayAvg,
    declinePercent: expected30DayDeclinePercent,
    reason
  };
}

// 3. Health Early-Warning Engine
function evaluateHealthRisk(animal, thirtyDayAvgYield, currentYield, recentMedicalCount, isPregnant, daysToDryOff) {
  let score = 10;
  const factors = [];

  const milkDropPercent = currentYield > 0 && thirtyDayAvgYield > 0 ? ((thirtyDayAvgYield - currentYield) / thirtyDayAvgYield) * 100 : 0;
  const isNaturalDryOffDrop = isPregnant && daysToDryOff !== null && daysToDryOff < 30;

  if (milkDropPercent > 15 && !isNaturalDryOffDrop) {
    score += 40;
    factors.push(`${milkDropPercent.toFixed(1)}% milk decline not explained by dry-off.`);
  }
  
  if (recentMedicalCount > 0) {
    score += (recentMedicalCount * 15);
    factors.push(`Recent medical event (${recentMedicalCount} recorded).`);
  }

  const ageYears = animal.birthDate ? (new Date() - new Date(animal.birthDate)) / (1000 * 60 * 60 * 24 * 365.25) : 3;
  if (ageYears > 8) {
    score += 10;
    factors.push(`Advanced age (${ageYears.toFixed(1)} years).`);
  }

  score = Math.min(100, Math.max(0, score));

  let riskLevel = 'LOW';
  if (score >= 75) riskLevel = 'CRITICAL';
  else if (score >= 50) riskLevel = 'HIGH';
  else if (score >= 25) riskLevel = 'MEDIUM';

  return { score, riskLevel, factors };
}

// 4. Smart Animal Lifecycle Prediction
function calculateLifecycleScore(animal, healthScore, thirtyDayAvgYield, netContribution, ageYears, aiAttempts, isPregnant) {
  let score = 0;
  const reasons = [];

  if (ageYears > 7) {
    score += 20;
    reasons.push(`Age is above optimal productive threshold (${ageYears.toFixed(1)} years).`);
  }

  if (thirtyDayAvgYield > 0 && thirtyDayAvgYield < 5 && animal.status === 'Milking') {
    score += 25;
    reasons.push(`Average milk yield is economically low (${thirtyDayAvgYield.toFixed(1)} L/day).`);
  }

  if (healthScore > 50) {
    score += 20;
    reasons.push(`High health risk score (${Math.round(healthScore)}/100).`);
  }

  if (netContribution < 0 && animal.status === 'Milking') {
    score += 25;
    reasons.push(`Negative economic contribution.`);
  }

  if (aiAttempts >= 3 && !isPregnant) {
    score += 15;
    reasons.push(`Required ${aiAttempts} AI attempts without confirmed pregnancy.`);
  }

  score = Math.min(100, Math.max(0, score));

  let recommendation = 'RETAIN';
  if (healthScore >= 75) {
    recommendation = 'VETERINARY REVIEW';
  } else if (score >= 75) {
    recommendation = 'CONSIDER SALE';
  } else if (score >= 50) {
    recommendation = 'LIFECYCLE REVIEW';
  } else if (score >= 35) {
    recommendation = 'MONITOR';
  }

  // Exception for highly profitable old cows
  if (recommendation === 'LIFECYCLE REVIEW' && netContribution > 10000) {
    recommendation = 'RETAIN';
    reasons.push('Retained due to strong positive economic contribution despite age/health flags.');
  }

  return { score, recommendation, reasons };
}

// 5. Keep vs Sell - 12 Month Analysis
function calculateKeepVsSell(metrics, animal) {
  // 12-Month Projections
  const est12MonthRevenue = metrics.estMonthlyRevenue * 12;
  const est12MonthFeed = metrics.estMonthlyFeed * 12;
  const est12MonthMedical = metrics.estMonthlyMedical * 12;
  const est12MonthContribution = metrics.netContribution * 12;
  
  // 15% annual depreciation rule
  const projectedAssetValue = metrics.assetValue * 0.85; 

  const keepEconomicValue = est12MonthContribution + projectedAssetValue;
  const sellEconomicValue = metrics.assetValue; // Cash now
  
  const difference = keepEconomicValue - sellEconomicValue;
  
  let recommendation = '';
  if (difference > 0) {
    recommendation = "Retention may be economically preferable based on current assumptions.";
  } else {
    recommendation = "Sale may be economically preferable to avoid future losses and asset depreciation.";
  }

  return {
    est12MonthRevenue,
    est12MonthFeed,
    est12MonthMedical,
    est12MonthContribution,
    projectedAssetValue,
    keepEconomicValue,
    sellEconomicValue,
    difference,
    recommendation
  };
}

module.exports = {
  calculateDataConfidence,
  predictMilkYield,
  evaluateHealthRisk,
  calculateLifecycleScore,
  calculateKeepVsSell
};
