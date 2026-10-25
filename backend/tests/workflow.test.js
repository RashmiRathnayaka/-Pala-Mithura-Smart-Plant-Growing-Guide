require('./setup-env');
const { describe, test, before, after, mock } = require('node:test');
const { expect } = require('expect');
/**
 * End-to-end recommendation workflow (spec §8):
 * report → AI → queue → accept / modify / reject → publish → notify, with audit trail.
 */
const { setup, teardown, tokens, request, PNG_1PX } = require('./helpers');
const ai = require('../src/services/ai/aiService');

let t;
let tomato;
let chilli;
const auth = (token) => ({ Authorization: `Bearer ${token}` });

before(async () => {
  await setup();
  t = await tokens();
  tomato = (await request().get('/api/plants').query({ q: 'Tomato' })).body.items[0];
  chilli = (await request().get('/api/plants').query({ q: 'Chilli' })).body.items[0];
});
after(teardown);

async function submitReport(fields = {}, token = t.farmer) {
  let req = request()
    .post('/api/reports')
    .set(auth(token))
    .field('plant', fields.plant || tomato._id)
    .field('symptoms', JSON.stringify(fields.symptoms || ['brown_spots', 'yellow_leaves']))
    .field('affectedParts', 'leaves')
    .field('description', fields.description || 'පහළ කොළවල දුඹුරු ලප, වටේ කහ පාටයි')
    .field('durationDays', '5');
  if (fields.photo !== false) req = req.attach('photos', PNG_1PX, 'leaf.png');
  return req;
}

describe('problem report → AI → review queue', () => {
  let rec;
  test('submitting a report creates a preliminary AI recommendation in the queue', async () => {
    const res = await submitReport();
    expect(res.status).toBe(201);
    rec = res.body.recommendation;
    expect(rec.recommendationCode).toMatch(/^REC-\d{6}$/);
    expect(rec.status).toBe('pending_review');
    expect(rec.isInstructorVerified).toBe(false);
    expect(rec.preliminary).toBeTruthy();
    expect(rec.final).toBeNull();
    // mock provider ranks early blight (brown spots + yellow leaves) first and labels test output
    expect(rec.aiIsTestOutput).toBe(true);
    expect(rec.preliminary.possibleCauses[0].diseaseCode).toBe('DZ-TOM-EB');
    expect(rec.preliminary.confidence.level).toBe('low');
    expect(rec.preliminary.safetyPrecautions.length).toBeGreaterThan(0);
    expect(res.body.report.photos).toHaveLength(1);
  });

  test('report needs at least a photo, symptom or description', async () => {
    const res = await request().post('/api/reports').set(auth(t.farmer)).field('plant', tomato._id);
    expect(res.status).toBe(400);
  });

  test('invalid symptom key is rejected', async () => {
    const res = await submitReport({ symptoms: ['made_up'] });
    expect(res.status).toBe(400);
  });

  test('user gets a "preliminary ready" notification; instructor gets a queue notification', async () => {
    const u = await request().get('/api/notifications').set(auth(t.farmer));
    expect(u.body.items.map((n) => n.type)).toContain('recommendation_ready');
    const i = await request().get('/api/notifications').set(auth(t.instructor));
    expect(i.body.items.map((n) => n.type)).toContain('new_review_item');
  });

  test('item appears in the instructor queue; farmer cannot access the queue', async () => {
    expect((await request().get('/api/instructor/queue').set(auth(t.farmer))).status).toBe(403);
    const q = await request().get('/api/instructor/queue').set(auth(t.instructor));
    expect(q.body.items.map((r) => r._id)).toContain(rec._id);
  });

  test('instructor sees full details without farmer email/phone', async () => {
    const res = await request().get(`/api/instructor/recommendations/${rec._id}`).set(auth(t.instructor));
    expect(res.status).toBe(200);
    expect(res.body.recommendation.user.email).toBeUndefined();
    expect(res.body.recommendation.report.photos).toHaveLength(1);
    expect(res.body.audit.map((a) => a.action)).toEqual(['ai_generated', 'queued_for_review']);
  });

  test('farmers and admins cannot make review decisions', async () => {
    const body = { decision: 'accepted' };
    expect((await request().post(`/api/instructor/recommendations/${rec._id}/review`).set(auth(t.farmer)).send(body)).status).toBe(403);
    expect((await request().post(`/api/instructor/recommendations/${rec._id}/review`).set(auth(t.admin)).send(body)).status).toBe(403);
  });

  test('ACCEPT → published to user and marked instructor-verified', async () => {
    const res = await request()
      .post(`/api/instructor/recommendations/${rec._id}/review`)
      .set(auth(t.instructor))
      .send({ decision: 'accepted', comment: 'පහළ කොළ ඉවත් කරන්න.' });
    expect(res.status).toBe(200);
    expect(res.body.recommendation.status).toBe('published');
    expect(res.body.recommendation.review.decision).toBe('accepted');

    const mine = await request().get(`/api/recommendations/${rec._id}`).set(auth(t.farmer));
    expect(mine.body.recommendation.isInstructorVerified).toBe(true);
    expect(mine.body.recommendation.final.possibleCauses[0].diseaseCode).toBe('DZ-TOM-EB');
    expect(mine.body.recommendation.preliminary).toBeNull();
    expect(mine.body.recommendation.review.comment).toBe('පහළ කොළ ඉවත් කරන්න.');
  });

  test('a second decision on the same item is refused (409)', async () => {
    const res = await request().post(`/api/instructor/recommendations/${rec._id}/review`).set(auth(t.instructor)).send({ decision: 'accepted' });
    expect(res.status).toBe(409);
  });

  test('audit trail records the full lifecycle', async () => {
    const res = await request().get(`/api/instructor/recommendations/${rec._id}/audit`).set(auth(t.instructor));
    expect(res.body.items.map((a) => a.action)).toEqual(['ai_generated', 'queued_for_review', 'accepted', 'published']);
    const accepted = res.body.items.find((a) => a.action === 'accepted');
    expect(accepted.actor.name).toBeTruthy();
    expect(accepted.before).toBeTruthy(); // original AI version kept
  });

  test('user is notified that the review is complete', async () => {
    const res = await request().get('/api/notifications').set(auth(t.farmer));
    const n = res.body.items.find((x) => x.type === 'review_completed');
    expect(n.data.decision).toBe('accepted');
    await request().patch(`/api/notifications/${n._id}/read`).set(auth(t.farmer)).expect(200);
  });
});

describe('MODIFY and REJECT', () => {
  test('modify requires an explanation, then publishes the edited version', async () => {
    const { body } = await submitReport();
    const id = body.recommendation._id;

    const missing = await request()
      .post(`/api/instructor/recommendations/${id}/review`)
      .set(auth(t.instructor))
      .send({ decision: 'modified', content: { summary: 'x' } });
    expect(missing.status).toBe(400);

    const content = {
      summary: 'පූර්ව අංගමාරය විය හැක.',
      possibleCauses: [{ name: 'Early blight', type: 'disease', likelihood: 'high', evidence: 'වළලු සහිත ලප', diseaseCode: 'DZ-TOM-EB' }],
      suggestedActions: [{ action: 'රෝගී කොළ ඉවත් කරන්න', priority: 'immediate' }],
      urgency: 'medium',
      confidence: { level: 'medium', explanation: 'Photo reviewed by instructor' },
      language: 'si',
    };
    const res = await request()
      .post(`/api/instructor/recommendations/${id}/review`)
      .set(auth(t.instructor))
      .send({ decision: 'modified', content, changeExplanation: 'Added a clearer first action.' });
    expect(res.status).toBe(200);
    expect(res.body.recommendation.review.decision).toBe('modified');

    const mine = await request().get(`/api/recommendations/${id}`).set(auth(t.farmer));
    expect(mine.body.recommendation.final.summary).toBe('පූර්ව අංගමාරය විය හැක.');
    expect(mine.body.recommendation.review.changeExplanation).toBe('Added a clearer first action.');
    expect(mine.body.recommendation.isInstructorVerified).toBe(true);
  });

  test('reject requires a reason and hides the AI text from the user', async () => {
    const { body } = await submitReport({ plant: chilli._id, symptoms: ['curling_leaves'] });
    const id = body.recommendation._id;

    const noReason = await request().post(`/api/instructor/recommendations/${id}/review`).set(auth(t.instructor)).send({ decision: 'rejected' });
    expect(noReason.status).toBe(400);

    const res = await request()
      .post(`/api/instructor/recommendations/${id}/review`)
      .set(auth(t.instructor))
      .send({
        decision: 'rejected',
        rejectionReason: 'ඡායාරූපය පැහැදිලි නැත.',
        additionalInfoRequested: 'කොළයේ යටි පැත්තේ සමීප ඡායාරූපයක් එවන්න.',
        alternativeRecommendation: 'කොළ යට කෘමීන් සිටීදැයි පරීක්ෂා කරන්න.',
      });
    expect(res.status).toBe(200);

    const mine = await request().get(`/api/recommendations/${id}`).set(auth(t.farmer));
    const r = mine.body.recommendation;
    expect(r.status).toBe('published');
    expect(r.isInstructorVerified).toBe(false);
    expect(r.final).toBeNull();
    expect(r.preliminary).toBeNull();
    expect(r.review.rejectionReason).toBe('ඡායාරූපය පැහැදිලි නැත.');
    expect(r.review.additionalInfoRequested).toMatch(/ඡායාරූප/);
  });

  test('review without publishing, then publish separately', async () => {
    const { body } = await submitReport();
    const id = body.recommendation._id;
    const res = await request().post(`/api/instructor/recommendations/${id}/review`).set(auth(t.instructor)).send({ decision: 'accepted', publish: false });
    expect(res.body.recommendation.status).toBe('accepted');
    // user still sees it as pending until it is published
    const before = await request().get(`/api/recommendations/${id}`).set(auth(t.farmer));
    expect(before.body.recommendation.status).toBe('pending_review');
    expect(before.body.recommendation.review).toBeNull();
    const pub = await request().post(`/api/instructor/recommendations/${id}/publish`).set(auth(t.instructor));
    expect(pub.body.recommendation.status).toBe('published');
  });
});

describe('privacy and failure handling', () => {
  test("a user cannot read another user's recommendation", async () => {
    const reg = await request().post('/api/auth/register').send({ name: 'Other', email: 'other@example.com', password: 'Password1' });
    const list = await request().get('/api/recommendations').set(auth(t.farmer));
    const id = list.body.items[0]._id;
    const res = await request().get(`/api/recommendations/${id}`).set(auth(reg.body.token));
    expect(res.status).toBe(404);
  });

  test('AI failure still queues the report for an instructor (no fake advice shown)', async () => {
    const spy = mock.method(ai, 'generateRecommendation', async () => {
      throw new Error('upstream timeout');
    });
    const res = await submitReport();
    spy.mock.restore();
    expect(res.status).toBe(201);
    const rec = res.body.recommendation;
    expect(rec.status).toBe('pending_review');
    expect(rec.aiAvailable).toBe(false);
    expect(rec.preliminary).toBeNull();

    // accept is impossible without AI content; instructor must modify (write) or reject
    const acc = await request().post(`/api/instructor/recommendations/${rec._id}/review`).set(auth(t.instructor)).send({ decision: 'accepted' });
    expect(acc.status).toBe(400);

    const full = await request().get(`/api/instructor/recommendations/${rec._id}`).set(auth(t.instructor));
    expect(full.body.recommendation.aiMeta.error).toBe('upstream timeout');
    expect(full.body.audit.map((a) => a.action)).toEqual(['ai_failed', 'queued_for_review']);

    // retry AI from the instructor screen
    const regen = await request().post(`/api/instructor/recommendations/${rec._id}/regenerate`).set(auth(t.instructor));
    expect(regen.status).toBe(200);
    expect(regen.body.recommendation.aiOutput).toBeTruthy();
  });

  test('instructor dashboard and history', async () => {
    const d = await request().get('/api/instructor/dashboard').set(auth(t.instructor));
    expect(d.body.stats.reviewedTotal).toBe(4);
    expect(d.body.stats.decisions).toMatchObject({ accepted: 2, modified: 1, rejected: 1 });
    const h = await request().get('/api/instructor/history').set(auth(t.instructor));
    expect(h.body.items).toHaveLength(4);
  });

  test('user report list hides internal review state before publishing', async () => {
    const res = await request().get('/api/reports').set(auth(t.farmer));
    const pending = res.body.items.filter((r) => r.recommendation && r.recommendation.status !== 'published');
    pending.forEach((r) => expect(r.recommendation.review).toBeUndefined());
  });
});
