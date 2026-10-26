const env = require('./config/env');
const { connectDB, disconnectDB, redactUri } = require('./config/db');
const createApp = require('./app');
const ai = require('./services/ai/aiService');
const storage = require('./services/storageService');

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error(`[db] Could not connect to MongoDB at ${redactUri(env.mongoUri)}`);
    console.error('     Is MongoDB running? Check MONGO_URI in backend/.env');
    if (/mongodb\+srv:/.test(env.mongoUri)) {
      console.error('     Atlas: add your IP under Security → Network Access in the Atlas dashboard.');
    }
    console.error(`     ${err.message}`);
    process.exit(1);
  }

  const app = createApp();
  // 0.0.0.0 so a phone on the same Wi-Fi can reach the API through your computer's LAN IP.
  const server = app.listen(env.port, '0.0.0.0', () => {
    const aiInfo = ai.providerInfo();
    console.log(`[api] පැළ මිතුරා API running on http://localhost:${env.port}  (${env.nodeEnv})`);
    console.log(`[api] AI provider: ${aiInfo.provider}${aiInfo.model ? ` (${aiInfo.model})` : ''} · storage: ${storage.activeProvider()}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[api] ${signal} received, shutting down…`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
