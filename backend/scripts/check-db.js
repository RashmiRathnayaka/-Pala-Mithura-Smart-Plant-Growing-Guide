/**
 * Diagnoses MongoDB connection problems step by step:  npm run check:db
 * 1. DNS (SRV lookup for mongodb+srv URIs)  2. TCP reachability of each host  3. Real login.
 */
const dns = require('dns').promises;
const net = require('net');
const mongoose = require('mongoose');
const env = require('../src/config/env');
// Self-contained so it works even with an older src/config/db.js.
const redactUri = (uri = '') => String(uri).replace(/\/\/([^:/@]+):([^@]+)@/, '//$1:****@');

const ok = (m) => console.log(`  ✔ ${m}`);
const bad = (m) => console.log(`  ✘ ${m}`);

function tcp(host, port, timeoutMs = 6000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs, () => done('timeout'));
    socket.once('connect', () => done('open'));
    socket.once('error', (e) => done(e.code || e.message));
  });
}

(async () => {
  const uri = env.mongoUri;
  console.log(`\nChecking ${redactUri(uri)}\n`);
  const isSrv = uri.startsWith('mongodb+srv://');
  const hostPart = uri.replace(/^mongodb(\+srv)?:\/\//, '').replace(/^[^@]*@/, '').split('/')[0].split('?')[0];
  let hosts = [];

  console.log('1) DNS');
  if (isSrv) {
    try {
      const records = await dns.resolveSrv(`_mongodb._tcp.${hostPart}`);
      hosts = records.map((r) => ({ host: r.name, port: r.port }));
      ok(`SRV lookup found ${hosts.length} server(s)`);
    } catch (err) {
      bad(`SRV lookup failed (${err.code}).`);
      console.log('     Your DNS cannot resolve mongodb+srv addresses. Fixes:');
      console.log('     • In Atlas → Connect → Drivers, copy the connection string for an older driver');
      console.log('       version (starts with mongodb:// and lists 3 hosts) and use that as MONGO_URI, or');
      console.log('     • set your network DNS to 8.8.8.8 / 1.1.1.1.');
      process.exit(1);
    }
  } else {
    hosts = hostPart.split(',').map((h) => {
      const [host, port] = h.split(':');
      return { host, port: Number(port) || 27017 };
    });
    ok(`Hosts: ${hosts.map((h) => `${h.host}:${h.port}`).join(', ')}`);
  }

  console.log('\n2) Network (can this computer reach the database port?)');
  let reachable = 0;
  for (const h of hosts) {
    const r = await tcp(h.host, h.port);
    if (r === 'open') {
      reachable += 1;
      ok(`${h.host}:${h.port} reachable`);
    } else bad(`${h.host}:${h.port} → ${r}`);
  }
  if (!reachable && hosts.every((h) => ['127.0.0.1', 'localhost'].includes(h.host))) {
    console.log('\n     MongoDB is not running on this computer. Start the "MongoDB Server" service');
    console.log('     (Win + R → services.msc), or install MongoDB Community Server.');
    process.exit(1);
  }
  if (!reachable) {
    console.log('\n     Your network is blocking the MongoDB port. This is common on office/university');
    console.log('     Wi-Fi. Try a phone hotspot or home network, or use a local MongoDB instead:');
    console.log('     MONGO_URI=mongodb://127.0.0.1:27017/pala_mithura');
    process.exit(1);
  }

  console.log('\n3) Login');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    ok(`Connected. Database: "${mongoose.connection.name}"`);
    if (mongoose.connection.name === 'test') {
      console.log('     Tip: add a database name to MONGO_URI, e.g. .../pala_mithura?retryWrites=true&w=majority');
    }
    console.log('\nAll good. Run `npm run seed` (once) and `npm run dev`.\n');
  } catch (err) {
    const msg = String(err.message || err);
    bad(msg.split('\n')[0]);
    if (/auth|bad auth|Authentication failed/i.test(msg)) {
      console.log('     Username or password is wrong. Check Database Access in Atlas, and URL-encode');
      console.log('     special characters in the password (@ → %40, # → %23, / → %2F).');
    } else if (/whitelist|access list/i.test(msg)) {
      console.log('     The servers are reachable but the cluster refused you. Check that this cluster');
      console.log('     belongs to the Atlas project whose IP Access List you edited, and that it is not paused.');
    }
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
