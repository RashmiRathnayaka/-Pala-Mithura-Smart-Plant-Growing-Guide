const { z } = require('zod');

/** Validates (and normalises) whatever the AI returns before it is stored. */
const str = (max = 2000) => z.string().trim().max(max);

const RecommendationContentSchema = z.object({
  summary: str(2000).default(''),
  possibleCauses: z
    .array(
      z.object({
        name: str(200).min(1),
        type: z.enum(['disease', 'pest', 'nutrient_deficiency', 'environmental', 'other']).catch('other'),
        likelihood: z.enum(['high', 'medium', 'low']).catch('low'),
        evidence: str(1500).default(''),
        diseaseCode: str(40).optional().default(''),
      })
    )
    .max(6)
    .default([]),
  suggestedActions: z
    .array(
      z.object({
        action: str(800).min(1),
        priority: z.enum(['immediate', 'soon', 'routine']).catch('soon'),
      })
    )
    .max(12)
    .default([]),
  fertilizerAdvice: str(1500).default(''),
  requiredMaterials: z.array(str(200)).max(15).default([]),
  preventionMethods: z.array(str(500)).max(12).default([]),
  furtherChecks: z.array(str(500)).max(10).default([]),
  additionalInfoNeeded: z.array(str(500)).max(10).default([]),
  safetyPrecautions: z.array(str(500)).max(12).default([]),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).catch('medium'),
  confidence: z
    .object({
      level: z.enum(['low', 'medium', 'high']).catch('low'),
      explanation: str(1500).default(''),
    })
    .default({ level: 'low', explanation: '' }),
  language: z.enum(['si', 'en']).catch('si'),
});

/** JSON Schema given to Claude as the tool input schema (forces structured output). */
const toolInputSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'Two or three plain sentences a farmer can understand.' },
    possibleCauses: {
      type: 'array',
      maxItems: 5,
      description: 'Possible causes, most likely first. Never more certain than the evidence allows.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['disease', 'pest', 'nutrient_deficiency', 'environmental', 'other'] },
          likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
          evidence: { type: 'string', description: 'Which observed signs support or argue against this cause.' },
          diseaseCode: { type: 'string', description: 'Code from the knowledge base if it matches one, else empty.' },
        },
        required: ['name', 'type', 'likelihood', 'evidence'],
      },
    },
    suggestedActions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          priority: { type: 'string', enum: ['immediate', 'soon', 'routine'] },
        },
        required: ['action', 'priority'],
      },
    },
    fertilizerAdvice: { type: 'string' },
    requiredMaterials: { type: 'array', items: { type: 'string' } },
    preventionMethods: { type: 'array', items: { type: 'string' } },
    furtherChecks: { type: 'array', items: { type: 'string' }, description: 'Simple checks the farmer can do to narrow down the cause.' },
    additionalInfoNeeded: { type: 'array', items: { type: 'string' }, description: 'Questions or photos needed when evidence is insufficient.' },
    safetyPrecautions: { type: 'array', items: { type: 'string' } },
    urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    confidence: {
      type: 'object',
      properties: {
        level: { type: 'string', enum: ['low', 'medium', 'high'] },
        explanation: { type: 'string' },
      },
      required: ['level', 'explanation'],
    },
    language: { type: 'string', enum: ['si', 'en'] },
  },
  required: [
    'summary',
    'possibleCauses',
    'suggestedActions',
    'furtherChecks',
    'additionalInfoNeeded',
    'safetyPrecautions',
    'urgency',
    'confidence',
    'language',
  ],
};

module.exports = { RecommendationContentSchema, toolInputSchema };
