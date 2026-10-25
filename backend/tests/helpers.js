const mongoose = require('mongoose');
const request = require('supertest');
const createApp = require('../src/app');
const { connectDB } = require('../src/config/db');
const { seedData } = require('../src/seed/seed');

let app;

async function setup() {
  await connectDB(process.env.MONGO_URI);
  await mongoose.connection.dropDatabase();
  await seedData({ reset: true, quiet: true });
  app = createApp();
  return app;
}

async function teardown() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

async function login(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${JSON.stringify(res.body)}`);
  return res.body.token;
}

const tokens = async () => ({
  admin: await login('admin@palamithura.lk', 'Admin@12345'),
  instructor: await login('instructor@palamithura.lk', 'Instructor@12345'),
  farmer: await login('farmer@palamithura.lk', 'Farmer@12345'),
});

/** A real 1×1 PNG so magic-byte validation passes. */
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

module.exports = { setup, teardown, tokens, login, request: () => request(app), PNG_1PX };
