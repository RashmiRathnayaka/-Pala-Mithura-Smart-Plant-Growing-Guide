const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { rateLimit } = require('express-rate-limit');
const mongoose = require('mongoose');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { categories, diseases } = require('./routes/catalogRoutes');
const { reports, recommendations } = require('./routes/reportRoutes');

function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.corsOrigins.includes('*') ? true : env.corsOrigins,
      credentials: false,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      limit: env.isTest ? 10000 : 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    })
  );

  // Locally stored images (STORAGE_PROVIDER=local). Uploaded images are never executed.
  app.use(
    '/uploads',
    express.static(path.resolve(__dirname, '../uploads'), {
      maxAge: '7d',
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    })
  );

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      name: 'Pala Mithura API',
      status: 'ok',
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      time: new Date().toISOString(),
    });
  });

  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/meta', require('./routes/metaRoutes'));
  app.use('/api/categories', categories);
  app.use('/api/plants', require('./routes/plantRoutes'));
  app.use('/api/diseases', diseases);
  app.use('/api/favorites', require('./routes/favoriteRoutes'));
  app.use('/api/my-plants', require('./routes/myPlantRoutes'));
  app.use('/api/reports', reports);
  app.use('/api/recommendations', recommendations);
  app.use('/api/instructor', require('./routes/instructorRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));
  app.use('/api/notifications', require('./routes/notificationRoutes'));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
