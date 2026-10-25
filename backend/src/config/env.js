const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const toInt = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const nodeEnv = process.env.NODE_ENV || 'development';

const env = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: toInt(process.env.PORT, 5000),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || `http://localhost:${toInt(process.env.PORT, 5000)}`).replace(/\/$/, ''),
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim()).filter(Boolean),

  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pala_mithura',

  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  storageProvider: (process.env.STORAGE_PROVIDER || 'local').toLowerCase(),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'pala-mithura',
  },
  maxImageSizeMb: toInt(process.env.MAX_IMAGE_SIZE_MB, 5),

  ai: {
    provider: (process.env.AI_PROVIDER || 'anthropic').toLowerCase(),
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.AI_MODEL || 'claude-sonnet-5-5',
    maxImages: toInt(process.env.AI_MAX_IMAGES, 4),
    timeoutMs: toInt(process.env.AI_TIMEOUT_MS, 60000),
  },
};

if (!env.jwtSecret) {
  if (env.isProd) {
    throw new Error('JWT_SECRET must be set in production. See backend/.env.example');
  }
  // Development/test only: an ephemeral secret means tokens are invalidated on restart.
  env.jwtSecret = require('crypto').randomBytes(32).toString('hex');
  if (!env.isTest) {
    console.warn('[config] JWT_SECRET is not set – using a temporary secret. Set it in backend/.env');
  }
}

module.exports = env;
