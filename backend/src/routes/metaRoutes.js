/** Reference data for the app's forms and an AI/storage status check. */
const router = require('express').Router();
const { SYMPTOMS, PLANT_PARTS, GROWTH_STAGES, AGRO_ZONES } = require('../utils/constants');
const { DISTRICTS, currentSeason } = require('../utils/srilanka');
const ai = require('../services/ai/aiService');
const storage = require('../services/storageService');

router.get('/', (_req, res) => {
  res.json({
    success: true,
    symptoms: SYMPTOMS,
    plantParts: PLANT_PARTS,
    growthStages: GROWTH_STAGES,
    agroZones: AGRO_ZONES,
    districts: DISTRICTS,
    currentSeason: currentSeason(),
    services: { ai: ai.providerInfo(), storage: storage.activeProvider() },
  });
});

module.exports = router;
