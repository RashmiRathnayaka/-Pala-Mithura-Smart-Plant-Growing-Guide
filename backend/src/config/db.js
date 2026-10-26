const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

async function connectDB(uri = env.mongoUri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  if (!env.isTest) {
    const { host, name } = mongoose.connection;
    console.log(`[db] MongoDB connected → ${host}/${name}`);
  }
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

/** Hides the password in a connection string before it is logged. */
function redactUri(uri = '') {
  return String(uri).replace(/\/\/([^:/@]+):([^@]+)@/, '//$1:****@');
}

module.exports = { connectDB, disconnectDB, redactUri };
