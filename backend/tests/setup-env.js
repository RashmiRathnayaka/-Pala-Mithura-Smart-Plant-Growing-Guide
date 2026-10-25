// Required at the top of every test file, before the app is loaded.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/pala_mithura_test';
process.env.AI_PROVIDER = 'mock'; // never call the paid API from tests
process.env.STORAGE_PROVIDER = 'local';
process.env.JWT_SECRET = 'test-secret-for-tests-only';
