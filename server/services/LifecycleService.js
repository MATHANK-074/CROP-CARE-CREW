const calculateLifeStage = (birthDate, gender) => {
  if (!birthDate) return 'Adult'; // Default if no birthDate is known
  
  const today = new Date();
  const birth = new Date(birthDate);
  const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());

  if (ageInMonths <= 6) return 'Calf';
  
  if (ageInMonths > 6 && ageInMonths <= 24) {
    if (gender === 'Male') return 'Growing Bull';
    return 'Growing Heifer';
  }

  // Adult
  return 'Adult';
};

const handleCalvingEvent = async (motherLivestockId) => {
  // We can flesh this out more - for example changing mother status to Lactating.
  // This is a placeholder for the actual workflow integration.
};

module.exports = {
  calculateLifeStage,
  handleCalvingEvent
};
