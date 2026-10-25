/**
 * OFFLINE TEST PROVIDER – used only when no AI key is configured (local development / tests).
 * It does not look at photos. It ranks knowledge-base diseases by how many reported symptom
 * keys they share, and produces deliberately cautious, clearly-labelled test output.
 * It is never used in production (see aiService.js).
 */
const t = (lang, si, en) => (lang === 'en' ? en : si);

const TYPE_MAP = {
  fungal: 'disease',
  bacterial: 'disease',
  viral: 'disease',
  phytoplasma: 'disease',
  pest: 'pest',
  deficiency: 'nutrient_deficiency',
  environmental: 'environmental',
};

async function analyze({ plant, report, language }) {
  const reported = new Set(report.symptoms || []);
  const diseases = (plant.pestsAndDiseases || []).filter((d) => d && d.symptomKeys);

  const scored = diseases
    .map((d) => ({ d, score: d.symptomKeys.filter((k) => reported.has(k)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const possibleCauses = scored.map(({ d, score }) => ({
    name: `${d.name[language] || d.name.en}${d.causalAgent ? ` (${d.causalAgent})` : ''}`,
    type: TYPE_MAP[d.type] || 'other',
    likelihood: score >= 2 ? 'medium' : 'low',
    evidence: t(
      language,
      `වාර්තා කළ රෝග ලක්ෂණ ${score}ක් මෙම ගැටලුවේ සාමාන්‍ය ලක්ෂණ සමඟ ගැළපේ. ඡායාරූප විශ්ලේෂණය කර නැත.`,
      `${score} reported symptom(s) match this problem's typical signs. Photos were not analysed.`
    ),
    diseaseCode: d.code,
  }));

  const prevention = scored.flatMap(({ d }) => (d.prevention?.[language] || []).slice(0, 2));

  return {
    raw: {
      summary: t(
        language,
        'මෙය පරීක්ෂණ (offline) විශ්ලේෂණයකි. AI සේවාව සකසා නොමැති බැවින් ඡායාරූප පරීක්ෂා කර නැත. කරුණාකර උපදේශකවරයාගේ සමාලෝචනය බලාපොරොත්තු වන්න.',
        'This is offline test analysis. The AI service is not configured, so photos were not examined. Please wait for the instructor review.'
      ),
      possibleCauses,
      suggestedActions: [
        {
          action: t(language, 'දැඩි ලෙස බලපෑමට ලක් වූ කොළ/කොටස් ඉවත් කර වත්තෙන් ඉවතට ගෙන විනාශ කරන්න.', 'Remove badly affected leaves/parts and destroy them away from the garden.'),
          priority: 'soon',
        },
        {
          action: t(language, 'පස තෙත්බව පරීක්ෂා කර, වතුර එකතු වීම වළක්වන්න.', 'Check soil moisture and avoid waterlogging.'),
          priority: 'soon',
        },
        {
          action: t(language, 'බලපෑමට ලක් වූ ශාක අනෙක් ශාකවලින් වෙන් කර නිරීක්ෂණය කරන්න.', 'Keep an eye on affected plants and limit contact with healthy ones.'),
          priority: 'routine',
        },
      ],
      requiredMaterials: [],
      preventionMethods: prevention,
      furtherChecks: [
        t(language, 'කොළයේ යටි පැත්ත කෘමීන් සඳහා පරීක්ෂා කරන්න.', 'Check the underside of leaves for insects.'),
        t(language, 'ලක්ෂණ පැතිරෙන වේගය දින 2–3ක් නිරීක්ෂණය කරන්න.', 'Watch how fast the symptoms spread over 2–3 days.'),
      ],
      additionalInfoNeeded: possibleCauses.length
        ? []
        : [t(language, 'බලපෑමට ලක් වූ කොටසේ පැහැදිලි සමීප ඡායාරූප එවන්න.', 'Send clear close-up photos of the affected part.')],
      safetyPrecautions: [],
      urgency: 'medium',
      confidence: {
        level: 'low',
        explanation: t(
          language,
          'පරීක්ෂණ ප්‍රතිදානය: රෝග ලක්ෂණ ගැළපීම පමණක් භාවිත කළා. තහවුරු කිරීම සඳහා උපදේශක සමාලෝචනය අවශ්‍යයි.',
          'Test output: based only on symptom matching. Instructor review is required for confirmation.'
        ),
      },
      language,
    },
    meta: { provider: 'mock', model: 'offline-symptom-matcher', isTestOutput: true, imagesAnalyzed: 0, latencyMs: 0 },
  };
}

module.exports = { analyze };
