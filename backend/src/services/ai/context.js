/**
 * Builds the text context sent to the AI: verified crop knowledge from MongoDB,
 * the user's growing history, and the reported problem.
 */
const SYMPTOM_LABELS = {
  yellow_leaves: 'yellowing leaves',
  brown_spots: 'brown spots',
  black_spots: 'black spots',
  white_powder: 'white powdery growth',
  wilting: 'wilting',
  curling_leaves: 'curling leaves',
  damaged_roots: 'damaged roots',
  poor_growth: 'poor growth',
  insect_damage: 'insect damage',
  holes_in_leaves: 'holes in leaves',
  fruit_rot: 'fruit rot',
  flower_drop: 'flower drop',
  stem_rot: 'stem rot / collar rot',
  mosaic_pattern: 'mosaic / mottled pattern on leaves',
  stunted: 'stunted plant',
  leaf_drop: 'leaf drop',
};

const DAY = 86400000;
const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : 'unknown');
const val = (v, unit = '') => (v === null || v === undefined || v === '' ? 'not recorded' : `${v}${unit}`);

function plantKnowledge(plant) {
  const lines = [];
  lines.push(`Crop: ${plant.name?.en} (${plant.name?.si}) – ${plant.scientificName}`);
  lines.push(`Knowledge-base verification status: ${plant.verification?.status || 'unknown'}`);
  if (plant.verification?.uncertainFields?.length) {
    lines.push(`Fields marked uncertain: ${plant.verification.uncertainFields.join(', ')}`);
  }
  lines.push(`Soil pH: ${val(plant.soil?.phMin)}–${val(plant.soil?.phMax)}; soil: ${plant.soil?.type?.en || 'not recorded'}`);
  lines.push(`Watering: ${plant.watering?.notes?.en || 'not recorded'}`);
  const apps = plant.fertilizer?.applications || [];
  if (apps.length) {
    lines.push('Recommended fertilizer schedule (source: knowledge base):');
    apps.forEach((a) => {
      const prods = (a.products || []).map((p) => `${p.name} ${val(p.rate)} ${p.unit}`).join(', ');
      lines.push(`  - ${a.timing?.en}: ${prods}`);
    });
  }
  if (plant.fertilizer?.organicOptions?.en?.length) {
    lines.push(`Organic options: ${plant.fertilizer.organicOptions.en.join('; ')}`);
  }
  const diseases = (plant.pestsAndDiseases || []).filter((d) => d && d.name);
  if (diseases.length) {
    lines.push('Known diseases/pests of this crop in the knowledge base:');
    diseases.forEach((d) => {
      lines.push(
        `  - [${d.code}] ${d.name.en} (${d.type}${d.causalAgent ? `, ${d.causalAgent}` : ''}). ` +
          `Typical signs: ${(d.symptoms?.en || []).join('; ') || 'not recorded'}. ` +
          `Prevention: ${(d.prevention?.en || []).join('; ') || 'not recorded'}.`
      );
    });
  }
  return lines.join('\n');
}

function growingHistory(userPlant, now = new Date()) {
  if (!userPlant) return 'The user did not link this report to a tracked plant, so planting history is unknown.';
  const days = Math.floor((now - new Date(userPlant.plantingDate)) / DAY);
  const ferts = (userPlant.fertilizerLog || [])
    .slice(-5)
    .map((f) => `${fmtDate(f.date)}: ${f.type} ${f.quantity || ''}`.trim());
  const waters = (userPlant.wateringLog || []).slice(-5).map((w) => fmtDate(w.date));
  return [
    `Planting date: ${fmtDate(userPlant.plantingDate)} (${days} days ago)`,
    `Number of plants: ${userPlant.quantity}`,
    `Growth stage recorded by user: ${userPlant.growthStage}`,
    `Location: ${userPlant.location?.district || 'unknown district'} ${userPlant.location?.agroZone ? `(${userPlant.location.agroZone} zone)` : ''}`,
    `Last watered: ${fmtDate(userPlant.lastWateredAt)}; recent watering dates: ${waters.join(', ') || 'none logged'}`,
    `Recent fertilizer applications: ${ferts.join('; ') || 'none logged'}`,
    `User notes: ${(userPlant.notes || []).slice(-3).map((n) => n.text).join(' | ') || 'none'}`,
  ].join('\n');
}

function problemDescription(report) {
  return [
    `Selected symptoms: ${(report.symptoms || []).map((s) => SYMPTOM_LABELS[s] || s).join(', ') || 'none selected'}`,
    `Affected parts: ${(report.affectedParts || []).join(', ') || 'not specified'}`,
    `Problem duration: ${report.durationDays != null ? `${report.durationDays} days` : 'not specified'}`,
    `Growth stage at report: ${report.growthStage || 'not specified'}`,
    `District: ${report.district || 'not specified'}`,
    `Recent weather: ${report.recentWeather || 'not specified'}`,
    `Farmer's own description (may be Sinhala or English): """${(report.description || '').slice(0, 3000)}"""`,
    `Photos attached: ${(report.photos || []).length}`,
  ].join('\n');
}

module.exports = { plantKnowledge, growingHistory, problemDescription, SYMPTOM_LABELS };
