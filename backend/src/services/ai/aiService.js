/**
 * AI service façade: picks the provider, validates the output and applies safety post-processing.
 */
const env = require('../../config/env');
const { RecommendationContentSchema } = require('./schema');
const anthropicProvider = require('./anthropicProvider');
const mockProvider = require('./mockProvider');

let warned = false;

function selectProvider() {
  if (env.ai.provider === 'mock') return { name: 'mock', impl: mockProvider };
  if (env.ai.apiKey) return { name: 'anthropic', impl: anthropicProvider };
  if (env.isProd) {
    // In production a missing key is an AI failure – the report goes straight to an instructor.
    return { name: 'none', impl: null };
  }
  if (!warned && !env.isTest) {
    console.warn('[ai] ANTHROPIC_API_KEY is not set – using the offline test provider. Results are labelled as test output.');
    warned = true;
  }
  return { name: 'mock', impl: mockProvider };
}

const SAFETY_LINE = {
  si: 'කිසිදු රසායනික පළිබෝධනාශකයක් භාවිත කිරීමට පෙර ඔබේ කෘෂිකර්ම උපදේශකවරයාගෙන් අනුමත නිෂ්පාදනය සහ ලේබලයේ මාත්‍රාව තහවුරු කරගන්න.',
  en: 'Before using any chemical pesticide, confirm an approved product and the label rate with your Agricultural Instructor.',
};

/** Rules applied regardless of provider. */
function postProcess(content, { imagesAnalyzed, language }) {
  const out = { ...content, language };

  // Without any analysed photo the result cannot be "high" confidence.
  if (imagesAnalyzed === 0 && out.confidence.level === 'high') {
    out.confidence = {
      level: 'medium',
      explanation: `${out.confidence.explanation} ${language === 'en' ? '(Capped: no photos were analysed.)' : '(ඡායාරූප විශ්ලේෂණය නොකළ බැවින් විශ්වාසය සීමා කළා.)'}`.trim(),
    };
  }

  // Nothing is presented as a definite diagnosis.
  out.possibleCauses = out.possibleCauses.map((c, i) => (i > 0 && c.likelihood === 'high' ? { ...c, likelihood: 'medium' } : c));

  // Always carry the chemical-safety reminder.
  const line = SAFETY_LINE[language] || SAFETY_LINE.si;
  if (!out.safetyPrecautions.includes(line)) out.safetyPrecautions = [...out.safetyPrecautions, line];

  return out;
}

/**
 * @returns {Promise<{content: object, meta: object}>}  throws on failure
 */
async function generateRecommendation({ plant, userPlant, report, language = 'si' }) {
  const provider = selectProvider();
  if (!provider.impl) throw new Error('AI provider is not configured (ANTHROPIC_API_KEY missing)');

  const { raw, meta } = await provider.impl.analyze({ plant, userPlant, report, language });
  const parsed = RecommendationContentSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`AI output failed validation: ${parsed.error.issues.slice(0, 3).map((i) => i.path.join('.') + ' ' + i.message).join('; ')}`);
  }
  const content = postProcess(parsed.data, { imagesAnalyzed: meta.imagesAnalyzed, language });
  return { content, meta: { ...meta, generatedAt: new Date() } };
}

function providerInfo() {
  const p = selectProvider();
  return { provider: p.name, model: p.name === 'anthropic' ? env.ai.model : p.name === 'mock' ? 'offline-symptom-matcher' : null };
}

module.exports = { generateRecommendation, providerInfo, postProcess };
