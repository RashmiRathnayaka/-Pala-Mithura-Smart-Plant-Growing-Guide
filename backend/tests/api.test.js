require('./setup-env');
const { describe, test, before, after, mock } = require('node:test');
const { expect } = require('expect');
const { setup, teardown, tokens, request, PNG_1PX } = require('./helpers');

let t;
let tomato;
let category;

before(async () => {
  await setup();
  t = await tokens();
});
after(teardown);

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('health & meta', () => {
  test('GET /api/health', async () => {
    const res = await request().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.db).toBe('connected');
  });
  test('GET /api/meta returns form reference data', async () => {
    const res = await request().get('/api/meta');
    expect(res.body.symptoms).toContain('yellow_leaves');
    expect(res.body.districts.length).toBe(25);
    expect(res.body.services.ai.provider).toBe('mock');
  });
  test('unknown route → 404 JSON', async () => {
    const res = await request().get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('authentication', () => {
  test('register creates a normal user even if role is sent', async () => {
    const res = await request()
      .post('/api/auth/register')
      .send({ name: 'Nimal', email: 'nimal@example.com', password: 'Password1', role: 'admin', district: 'Galle' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.password).toBeUndefined();
  });
  test('duplicate email → 409', async () => {
    const res = await request().post('/api/auth/register').send({ name: 'Xavier', email: 'nimal@example.com', password: 'Password1' });
    expect(res.status).toBe(409);
  });
  test('weak password → 400 with field details', async () => {
    const res = await request().post('/api/auth/register').send({ name: 'Yasas', email: 'y@example.com', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('body.password');
  });
  test('wrong password → 401', async () => {
    const res = await request().post('/api/auth/login').send({ email: 'farmer@palamithura.lk', password: 'nope12345' });
    expect(res.status).toBe(401);
  });
  test('GET /me needs a token', async () => {
    expect((await request().get('/api/auth/me')).status).toBe(401);
    const res = await request().get('/api/auth/me').set(auth(t.farmer));
    expect(res.body.user.email).toBe('farmer@palamithura.lk');
  });
  test('tampered token → 401', async () => {
    const res = await request().get('/api/auth/me').set(auth(`${t.farmer}x`));
    expect(res.status).toBe(401);
  });
  test('update profile language', async () => {
    const res = await request().patch('/api/auth/me').set(auth(t.farmer)).send({ language: 'en' });
    expect(res.body.user.language).toBe('en');
    await request().patch('/api/auth/me').set(auth(t.farmer)).send({ language: 'si' });
  });
});

describe('plants & categories', () => {
  test('categories list with counts', async () => {
    const res = await request().get('/api/categories');
    expect(res.status).toBe(200);
    category = res.body.items.find((c) => c.slug === 'vegetables');
    expect(category.plantCount).toBe(6);
  });
  test('search by Sinhala name', async () => {
    const res = await request().get('/api/plants').query({ q: 'තක්කාලි' });
    expect(res.body.items).toHaveLength(1);
    tomato = res.body.items[0];
    expect(tomato.name.en).toBe('Tomato');
  });
  test('search by scientific name and English name', async () => {
    expect((await request().get('/api/plants').query({ q: 'Mangifera' })).body.items[0].name.en).toBe('Mango');
    expect((await request().get('/api/plants').query({ q: 'okra' })).body.items[0].plantCode).toBe('PM-0004');
  });
  test('filter by category slug and pagination', async () => {
    const res = await request().get('/api/plants').query({ category: 'fruits', limit: 2 });
    expect(res.body.total).toBe(3);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.pages).toBe(2);
  });
  test('details include diseases and verification info', async () => {
    const res = await request().get(`/api/plants/${tomato._id}`);
    expect(res.status).toBe(200);
    expect(res.body.plant.pestsAndDiseases.length).toBeGreaterThan(3);
    expect(res.body.plant.verification.status).toBe('needs_review');
    expect(res.body.plant.fertilizer.applications[0].products[0]).toMatchObject({ name: 'Urea', rate: 65 });
  });
  test('details by plant code', async () => {
    const res = await request().get('/api/plants/pm-0009');
    expect(res.body.plant.name.en).toBe('Mango');
  });
  test('recommended plants use season and zone', async () => {
    const res = await request().get('/api/plants/recommended').set(auth(t.farmer));
    expect(res.status).toBe(200);
    expect(res.body.context.zone).toBe('intermediate');
    expect(res.body.items.length).toBeGreaterThan(0);
  });
  test('farmer cannot create plants; admin can', async () => {
    const body = { name: { si: 'කරවිල', en: 'Bitter gourd' }, scientificName: 'Momordica charantia', category: category._id };
    expect((await request().post('/api/plants').set(auth(t.farmer)).send(body)).status).toBe(403);
    expect((await request().post('/api/plants').set(auth(t.instructor)).send(body)).status).toBe(403);
    const res = await request().post('/api/plants').set(auth(t.admin)).send(body);
    expect(res.status).toBe(201);
    expect(res.body.plant.plantCode).toBe('PM-0010');
  });
  test('instructor can update and verify plant data', async () => {
    const upd = await request().patch(`/api/plants/${tomato._id}`).set(auth(t.instructor)).send({ harvest: { startDays: 70 } });
    expect(upd.status).toBe(200);
    const ver = await request().post(`/api/plants/${tomato._id}/verify`).set(auth(t.instructor)).send({ status: 'verified', notes: 'Checked against DOA' });
    expect(ver.body.plant.verification.status).toBe('verified');
    expect(ver.body.plant.verification.verifiedBy).toBeTruthy();
    // editing again resets verification
    const again = await request().patch(`/api/plants/${tomato._id}`).set(auth(t.admin)).send({ family: 'Solanaceae' });
    expect(again.body.plant.verification.status).toBe('needs_review');
  });
  test('image upload: valid PNG accepted, fake image rejected', async () => {
    const ok = await request().post(`/api/plants/${tomato._id}/images`).set(auth(t.admin)).attach('images', PNG_1PX, 'leaf.png');
    expect(ok.status).toBe(201);
    expect(ok.body.images[0].url).toMatch(/^\/uploads\/plants\//);
    const served = await request().get(ok.body.images[0].url);
    expect(served.status).toBe(200);

    const bad = await request()
      .post(`/api/plants/${tomato._id}/images`)
      .set(auth(t.admin))
      .attach('images', Buffer.from('not really an image'), { filename: 'evil.png', contentType: 'image/png' });
    expect(bad.status).toBe(415);
  });
  test('favorites add/list/remove', async () => {
    await request().post(`/api/favorites/${tomato._id}`).set(auth(t.farmer)).expect(200);
    const list = await request().get('/api/favorites').set(auth(t.farmer));
    expect(list.body.items.map((p) => p._id)).toContain(tomato._id);
    const details = await request().get(`/api/plants/${tomato._id}`).set(auth(t.farmer));
    expect(details.body.isFavorite).toBe(true);
    await request().delete(`/api/favorites/${tomato._id}`).set(auth(t.farmer)).expect(200);
  });
});

describe('diseases knowledge base', () => {
  test('list diseases for a plant', async () => {
    const res = await request().get('/api/diseases').query({ plant: tomato._id });
    expect(res.body.items.map((d) => d.code)).toEqual(expect.arrayContaining(['DZ-TOM-EB', 'DZ-BWILT']));
  });
  test('admin creates disease and it links to the plant', async () => {
    const res = await request()
      .post('/api/diseases')
      .set(auth(t.admin))
      .send({ name: { si: 'පරීක්ෂණ', en: 'Test disease' }, type: 'fungal', plants: [tomato._id], symptomKeys: ['brown_spots'] });
    expect(res.status).toBe(201);
    const plant = await request().get(`/api/plants/${tomato._id}`);
    expect(plant.body.plant.pestsAndDiseases.map((d) => d.code)).toContain(res.body.disease.code);
  });
});

describe('my plants tracker', () => {
  let up;
  test('add a plant with crop-specific schedule', async () => {
    const plantingDate = new Date(Date.now() - 10 * 86400000).toISOString();
    const res = await request()
      .post('/api/my-plants')
      .set(auth(t.farmer))
      .send({ plant: tomato._id, plantingDate, quantity: 12, nickname: 'ගෙවත්තේ තක්කාලි' });
    expect(res.status).toBe(201);
    up = res.body.userPlant;
    expect(up.location.district).toBe('Kurunegala');
    expect(up.schedule.watering.intervalDays).toBe(2);
    expect(up.schedule.watering.intervalSource).toBe('crop');
    // tomato top dressing at day 21 should be the next fertilizer task
    expect(up.schedule.fertilizer.applications.find((a) => a.daysAfterPlanting === 21).done).toBe(false);
    expect(new Date(up.schedule.fertilizer.nextDueAt) > new Date()).toBe(true);
  });
  test('log watering updates last watered and next due', async () => {
    const res = await request().post(`/api/my-plants/${up._id}/watering`).set(auth(t.farmer)).send({ amount: '5 L' });
    expect(res.status).toBe(201);
    expect(res.body.userPlant.lastWateredAt).toBeTruthy();
    expect(res.body.userPlant.schedule.watering.overdue).toBe(false);
  });
  test('future watering date is rejected', async () => {
    const res = await request()
      .post(`/api/my-plants/${up._id}/watering`)
      .set(auth(t.farmer))
      .send({ date: new Date(Date.now() + 5 * 86400000).toISOString() });
    expect(res.status).toBe(400);
  });
  test('user override of watering interval', async () => {
    const res = await request().patch(`/api/my-plants/${up._id}`).set(auth(t.farmer)).send({ reminders: { wateringIntervalDays: 4 }, growthStage: 'vegetative' });
    expect(res.body.userPlant.schedule.watering.intervalDays).toBe(4);
    expect(res.body.userPlant.schedule.watering.intervalSource).toBe('user');
  });
  test('fertilizer log, note, photo, timeline', async () => {
    await request().post(`/api/my-plants/${up._id}/fertilizer`).set(auth(t.farmer)).send({ type: 'Urea', quantity: '50 g' }).expect(201);
    await request().post(`/api/my-plants/${up._id}/notes`).set(auth(t.farmer)).send({ text: 'කොළ කහ වෙනවා', isProblem: true }).expect(201);
    await request().post(`/api/my-plants/${up._id}/photos`).set(auth(t.farmer)).attach('photos', PNG_1PX, 'p.png').expect(201);
    const tl = await request().get(`/api/my-plants/${up._id}/timeline`).set(auth(t.farmer));
    expect(tl.status).toBe(200);
    const types = tl.body.events.map((e) => e.type);
    expect(types).toEqual(expect.arrayContaining(['planted', 'watering', 'fertilizer', 'problem', 'photo']));
    expect(tl.body.stages.length).toBe(4);
  });
  test('reminders across plants', async () => {
    const res = await request().get('/api/my-plants/reminders').set(auth(t.farmer));
    expect(res.body.items.some((r) => r.type === 'watering')).toBe(true);
  });
  test("other users cannot see someone else's plant", async () => {
    const res = await request().get(`/api/my-plants/${up._id}`).set(auth(t.instructor));
    expect(res.status).toBe(404);
  });
});

describe('admin', () => {
  let instructorId;
  test('only admins reach admin routes', async () => {
    expect((await request().get('/api/admin/stats').set(auth(t.instructor))).status).toBe(403);
    const res = await request().get('/api/admin/stats').set(auth(t.admin));
    expect(res.status).toBe(200);
    expect(res.body.stats.plants).toBe(10);
    expect(res.body.stats.users.instructor).toBe(1);
  });
  test('create an instructor account', async () => {
    const res = await request()
      .post('/api/admin/users')
      .set(auth(t.admin))
      .send({ name: 'Kamala', email: 'kamala@doa.lk', password: 'Teacher123', role: 'instructor', instructorProfile: { organization: 'DOA' } });
    expect(res.status).toBe(201);
    instructorId = res.body.user._id;
  });
  test('deactivated account cannot log in or use its token', async () => {
    const login = await request().post('/api/auth/login').send({ email: 'kamala@doa.lk', password: 'Teacher123' });
    const token = login.body.token;
    await request().patch(`/api/admin/users/${instructorId}`).set(auth(t.admin)).send({ isActive: false }).expect(200);
    expect((await request().get('/api/auth/me').set(auth(token))).status).toBe(403);
    expect((await request().post('/api/auth/login').send({ email: 'kamala@doa.lk', password: 'Teacher123' })).status).toBe(403);
  });
  test('admin cannot demote themselves', async () => {
    const me = await request().get('/api/auth/me').set(auth(t.admin));
    const res = await request().patch(`/api/admin/users/${me.body.user._id}`).set(auth(t.admin)).send({ role: 'user' });
    expect(res.status).toBe(400);
  });
  test('activity log records admin actions', async () => {
    const res = await request().get('/api/admin/activity').set(auth(t.admin));
    expect(res.body.items.map((a) => a.action)).toEqual(expect.arrayContaining(['created', 'status_changed', 'verified']));
  });
  test('user search', async () => {
    const res = await request().get('/api/admin/users').query({ role: 'user', q: 'nimal' }).set(auth(t.admin));
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].password).toBeUndefined();
  });
});
