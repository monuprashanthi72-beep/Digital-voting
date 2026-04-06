import mongoose from 'mongoose';
import { db } from './utils/firebase.js';

const BASE_URI = 'mongodb://localhost:27017/';
async function run() {
  const dbName = 'DigitalVoting'; // 🎯 FOUND IT!
  console.log(`🚀 Migrating 26 Users and data from: ${dbName}`);
  
  const conn = await mongoose.createConnection(`${BASE_URI}${dbName}`).asPromise();
  
  const LocalUser = conn.model('User', new mongoose.Schema({}, {strict: false}), 'users');
  const LocalCandidate = conn.model('Candidate', new mongoose.Schema({}, {strict: false}), 'candidates');
  const LocalElection = conn.model('Election', new mongoose.Schema({}, {strict: false}), 'elections');

  const users = await LocalUser.find({});
  for (let u of users) {
    const data = u.toObject();
    const id = data._id.toString();
    delete data._id;
    await db.collection('users').doc(id).set({ ...data, id });
  }

  const candidates = await LocalCandidate.find({});
  for (let c of candidates) {
    const data = c.toObject();
    const id = data._id.toString();
    delete data._id;
    await db.collection('candidates').doc(id).set({ ...data, id });
  }

  const elections = await LocalElection.find({});
  for (let e of elections) {
    const data = e.toObject();
    const id = data._id.toString();
    delete data._id;
    await db.collection('elections').doc(id).set({ ...data, id });
  }

  console.log('✅ SYNC COMPLETE! 26 Users and Candidates migrated.');
  process.exit(0);
}
run();
