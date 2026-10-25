const ROLES = Object.freeze({
  USER: 'user',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
});

/**
 * Recommendation lifecycle (spec §7):
 * ai_generated → pending_review → accepted | modified | rejected → published
 */
const REC_STATUS = Object.freeze({
  AI_GENERATED: 'ai_generated',
  PENDING_REVIEW: 'pending_review',
  ACCEPTED: 'accepted',
  MODIFIED: 'modified',
  REJECTED: 'rejected',
  PUBLISHED: 'published',
});

const REVIEW_DECISIONS = Object.freeze(['accepted', 'modified', 'rejected']);

const GROWTH_STAGES = Object.freeze([
  'seed',
  'germination',
  'seedling',
  'vegetative',
  'flowering',
  'fruiting',
  'harvesting',
  'completed',
]);

/** Symptom keys selectable in the problem report form (labels live in the app). */
const SYMPTOMS = Object.freeze([
  'yellow_leaves',
  'brown_spots',
  'black_spots',
  'white_powder',
  'wilting',
  'curling_leaves',
  'damaged_roots',
  'poor_growth',
  'insect_damage',
  'holes_in_leaves',
  'fruit_rot',
  'flower_drop',
  'stem_rot',
  'mosaic_pattern',
  'stunted',
  'leaf_drop',
]);

const PLANT_PARTS = Object.freeze(['leaves', 'stem', 'roots', 'flowers', 'fruits', 'seedling', 'whole_plant']);

const AGRO_ZONES = Object.freeze(['wet', 'intermediate', 'dry', 'up_country', 'mid_country', 'low_country']);

const VERIFICATION = Object.freeze(['verified', 'needs_review', 'unverified']);

module.exports = {
  ROLES,
  REC_STATUS,
  REVIEW_DECISIONS,
  GROWTH_STAGES,
  SYMPTOMS,
  PLANT_PARTS,
  AGRO_ZONES,
  VERIFICATION,
};
