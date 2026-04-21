import mongoose from 'mongoose';
import { db } from './utils/firebase.js';

const BASE_URI = 'mongodb://localhost:27017/';
async function run() {
  const dbName = 'voting'; // 🎯 Set to the database we found data in
  console.log(`🚀 Migrating data from local MongoDB: ${dbName}`);
  
  const conn = await mongoose.createConnection(`${BASE_URI}${dbName}`).asPromise();
  
  const LocalUser = conn.model('User', new mongoose.Schema({}, {strict: false}), 'users');
  const LocalCandidate = conn.model('Candidate', new mongoose.Schema({}, {strict: false}), 'candidates');
  const LocalElection = conn.model('Election', new mongoose.Schema({}, {strict: false}), 'elections');

  const users = await LocalUser.find({});
  console.log(`Found ${users.length} users to migrate...`);
  for (let u of users) {
    const data = u.toObject();
    const id = data._id.toString();
    delete data._id;
    await db.collection('users').doc(id).set({ ...data, id }, { merge: true });
    console.log(`Synced user: ${data.username || id}`);
  }

  const candidates = await LocalCandidate.find({});
  console.log(`Found ${candidates.length} candidates to migrate...`);
  for (let c of candidates) {
    const data = c.toObject();
    const id = data._id.toString();
    delete data._id;
    await db.collection('candidates').doc(id).set({ ...data, id }, { merge: true });
    console.log(`Synced candidate: ${data.name || id}`);
  }

  const elections = await LocalElection.find({});
  console.log(`Found ${elections.length} elections to migrate...`);
  for (let e of elections) {
    const data = e.toObject();
    const id = data._id.toString();
    delete data._id;
    await db.collection('elections').doc(id).set({ ...data, id }, { merge: true });
    console.log(`Synced election: ${data.electionName || id}`);
  }

  console.log('✅ SYNC COMPLETE! Data successfully migrated to Firestore.');
  process.exit(0);
}
run();
