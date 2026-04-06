import mongoose from 'mongoose';
import { db } from './utils/firebase.js';

const BASE_MONGO_URI = 'mongodb://localhost:27017/';

async function migrate() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("❌ Error: FIREBASE_SERVICE_ACCOUNT is missing in .env!");
    process.exit(1);
  }

  try {
    console.log('🔗 Connecting to Local MongoDB to find databases...');
    const connection = await mongoose.createConnection(BASE_MONGO_URI).asPromise();
    const admin = connection.db.admin();
    const dbs = await admin.listDatabases();
    
    // Look for likely candidates
    const dbNames = dbs.databases.map(d => d.name);
    console.log('Found databases:', dbNames);
    
    const targetDb = dbNames.find(n => n.toLowerCase().includes('voting')) || 'test';
    console.log(`🎯 Using database: ${targetDb}`);
    
    const localDb = await mongoose.createConnection(`${BASE_MONGO_URI}${targetDb}`).asPromise();
    
    const LocalUser = localDb.model('User', new mongoose.Schema({}, {strict: false}), 'users');
    const LocalCandidate = localDb.model('Candidate', new mongoose.Schema({}, {strict: false}), 'candidates');
    const LocalElection = localDb.model('Election', new mongoose.Schema({}, {strict: false}), 'elections');

    // 1. Users
    const users = await LocalUser.find({});
    console.log(`👤 Migrating ${users.length} Users...`);
    for (let u of users) {
      const data = u.toObject();
      const id = data._id.toString();
      delete data._id;
      await db.collection('users').doc(id).set({ ...data, id });
    }

    // 2. Candidates
    const candidates = await LocalCandidate.find({});
    console.log(`👨‍💼 Migrating ${candidates.length} Candidates...`);
    for (let c of candidates) {
      const data = c.toObject();
      const id = data._id.toString();
      delete data._id;
      await db.collection('candidates').doc(id).set({ ...data, id });
    }

    // 3. Elections
    const elections = await LocalElection.find({});
    console.log(`🗳️ Migrating ${elections.length} Elections...`);
    for (let e of elections) {
      const data = e.toObject();
      const id = data._id.toString();
      delete data._id;
      await db.collection('elections').doc(id).set({ ...data, id });
    }

    console.log('✅ SUCCESS: Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Failed:', err);
    process.exit(1);
  }
}

migrate();
