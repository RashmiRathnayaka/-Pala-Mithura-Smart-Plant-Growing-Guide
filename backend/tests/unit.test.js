require('./setup-env');
const { describe, test } = require('node:test');
const { expect } = require('expect');
const { computeSchedule } = require('../src/services/reminderService');
const { postProcess } = require('../src/services/ai/aiService');
const { RecommendationContentSchema } = require('../src/services/ai/schema');

const DAY = 86400000;

const plant = {
  watering: { intervalDays: 3, intervalIsEstimate: true },
  fertilizer: {
    applications: [
      { timing: { en: 'Basal' }, daysAfterPlanting: -1, products: [] },
      { timing: { en: 'Week 4' }, daysAfterPlanting: 28, products: [] },
    ],
  },
  harvest: { startDays: 70, endDays: 120 },
  growthStages: [
    { stage: 'seedling', startDay: 0, endDay: 20 },
    { stage: 'vegetative', startDay: 21, endDay: 45 },
  ],
};

describe('reminderService.computeSchedule', () => {
  test('uses the crop interval and marks overdue watering', () => {
    const now = new Date('2026-10-25T08:00:00');
    const up = { plantingDate: new Date(now - 30 * DAY), lastWateredAt: new Date(now - 5 * DAY), reminders: {}, fertilizerLog: [] };
    const s = computeSchedule(up, plant, now);
    expect(s.daysSincePlanting).toBe(30);
    expect(s.estimatedStage).toBe('vegetative');
    expect(s.watering.intervalDays).toBe(3);
    expect(s.watering.overdue).toBe(true);
    expect(s.upcoming[0].type).toBe('watering');
    expect(s.upcoming[0].dueAt > now).toBe(true);
  });

  test('fertilizer applications are matched to logs', () => {
    const now = new Date('2026-10-25T08:00:00');
    const planted = new Date(now - 30 * DAY);
    const up = { plantingDate: planted, reminders: {}, fertilizerLog: [{ date: new Date(planted.getTime() + 27 * DAY) }] };
    const s = computeSchedule(up, plant, now);
    expect(s.fertilizer.applications[1].done).toBe(true);
    expect(s.fertilizer.applications[0].overdue).toBe(true); // basal never logged
  });

  test('harvest window status', () => {
    const now = new Date('2026-10-25T08:00:00');
    const up = { plantingDate: new Date(now - 80 * DAY), reminders: {} };
    expect(computeSchedule(up, plant, now).harvest.status).toBe('in_window');
  });

  test('crop without data produces no fake reminders', () => {
    const up = { plantingDate: new Date(), reminders: {} };
    const s = computeSchedule(up, { watering: {}, fertilizer: {}, harvest: {} });
    expect(s.watering.enabled).toBe(false);
    expect(s.fertilizer.enabled).toBe(false);
    expect(s.harvest.status).toBe('unknown');
    expect(s.upcoming).toHaveLength(0);
  });
});

describe('AI output safety post-processing', () => {
  const base = RecommendationContentSchema.parse({
    summary: 'x',
    possibleCauses: [
      { name: 'A', type: 'disease', likelihood: 'high', evidence: '' },
      { name: 'B', type: 'pest', likelihood: 'high', evidence: '' },
    ],
    confidence: { level: 'high', explanation: 'sure' },
  });

  test('caps confidence when no photo was analysed', () => {
    const out = postProcess(base, { imagesAnalyzed: 0, language: 'en' });
    expect(out.confidence.level).toBe('medium');
  });

  test('only one cause may be "high"', () => {
    const out = postProcess(base, { imagesAnalyzed: 2, language: 'en' });
    expect(out.possibleCauses.map((c) => c.likelihood)).toEqual(['high', 'medium']);
  });

  test('always adds the chemical safety reminder', () => {
    const out = postProcess(base, { imagesAnalyzed: 1, language: 'si' });
    expect(out.safetyPrecautions.join(' ')).toMatch(/කෘෂිකර්ම උපදේශක/);
  });

  test('schema coerces unknown enum values instead of failing', () => {
    const parsed = RecommendationContentSchema.parse({ urgency: 'extreme', confidence: { level: 'sure', explanation: '' } });
    expect(parsed.urgency).toBe('medium');
    expect(parsed.confidence.level).toBe('low');
  });
});
