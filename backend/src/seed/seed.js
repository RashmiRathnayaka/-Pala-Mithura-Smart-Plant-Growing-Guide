/**
 * Seeds categories, sample plants, the disease knowledge base and three demo accounts.
 *   npm run seed         → idempotent upsert (safe to run repeatedly; keeps your edits to other records)
 *   npm run seed:reset   → wipes ALL app data first (users, plants, reports…). Local development only.
 */
const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const models = require('../models');
const categoriesData = require('./data/categories');
const plantsData = require('./data/plants');
const diseasesData = require('./data/diseases');

const { User, Category, Plant, Disease, Counter } = models;

async function seedUsers(log = console.log) {
  const accounts = [
    { name: 'පද්ධති පරිපාලක (Admin)', email: process.env.SEED_ADMIN_EMAIL || 'admin@palamithura.lk', password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345', role: 'admin' },
    {
      name: 'කෘෂි උපදේශක (Instructor)',
      email: process.env.SEED_INSTRUCTOR_EMAIL || 'instructor@palamithura.lk',
      password: process.env.SEED_INSTRUCTOR_PASSWORD || 'Instructor@12345',
      role: 'instructor',
      district: 'Kandy',
      instructorProfile: { qualification: 'Demo account', organization: 'Demo', serviceArea: 'Kandy' },
    },
    { name: 'ගොවි මහතා (Farmer)', email: process.env.SEED_USER_EMAIL || 'farmer@palamithura.lk', password: process.env.SEED_USER_PASSWORD || 'Farmer@12345', role: 'user', district: 'Kurunegala', agroZone: 'intermediate' },
  ];
  for (const a of accounts) {
    const exists = await User.findOne({ email: a.email });
    if (exists) {
      log(`  · user exists: ${a.email} (${exists.role})`);
      continue;
    }
    await User.create(a);
    log(`  + user ${a.email} (${a.role})`);
  }
}

/** Writes all seed data to the current connection. */
async function seedData({ reset = false, quiet = false } = {}) {
  const log = quiet ? () => {} : console.log;
  if (reset) {
    if (env.isProd) throw new Error('Refusing to reset data in production');
    log('Resetting collections…');
    await Promise.all(Object.values(models).map((m) => m.collection.deleteMany({})));
  }

  log('Categories');
  const catBySlug = {};
  for (const c of categoriesData) {
    catBySlug[c.slug] = await Category.findOneAndUpdate({ slug: c.slug }, { $set: c }, { upsert: true, returnDocument: 'after' });
  }
  log(`  ✓ ${categoriesData.length} categories`);

  log('Plants');
  const plantByKey = {};
  for (const p of plantsData) {
    const { key, category, ...rest } = p;
    const doc = await Plant.findOneAndUpdate(
      { plantCode: p.plantCode },
      { $set: { ...rest, category: catBySlug[category]._id, isPublished: true } },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );
    plantByKey[key] = doc;
  }
  // Keep the auto-numbering ahead of the seeded codes.
  await Counter.updateOne({ _id: 'plant' }, { $max: { seq: plantsData.length } }, { upsert: true });
  log(`  ✓ ${plantsData.length} plants`);

  log('Diseases & pests');
  for (const d of diseasesData) {
    const plantIds = d.plants.map((k) => plantByKey[k]?._id).filter(Boolean);
    const doc = await Disease.findOneAndUpdate(
      { code: d.code },
      { $set: { ...d, plants: plantIds } },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );
    await Plant.updateMany({ _id: { $in: plantIds } }, { $addToSet: { pestsAndDiseases: doc._id } });
  }
  log(`  ✓ ${diseasesData.length} diseases/pests`);

  log('Users');
  await seedUsers(log);

  return { plantByKey, catBySlug };
}

async function seed() {
  await connectDB();
  await seedData({ reset: process.argv.includes('--reset') });
  console.log('\nSeed complete.');
  console.log('Demo logins (change these passwords before any real use):');
  console.log(`  Admin       ${process.env.SEED_ADMIN_EMAIL || 'admin@palamithura.lk'} / ${process.env.SEED_ADMIN_PASSWORD || 'Admin@12345'}`);
  console.log(`  Instructor  ${process.env.SEED_INSTRUCTOR_EMAIL || 'instructor@palamithura.lk'} / ${process.env.SEED_INSTRUCTOR_PASSWORD || 'Instructor@12345'}`);
  console.log(`  Farmer      ${process.env.SEED_USER_EMAIL || 'farmer@palamithura.lk'} / ${process.env.SEED_USER_PASSWORD || 'Farmer@12345'}`);
}

if (require.main === module) {
  seed()
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exitCode = 1;
    })
    .finally(() => disconnectDB());
}

module.exports = { seed, seedData };
