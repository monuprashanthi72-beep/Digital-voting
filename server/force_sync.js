import mongoose from 'mongoose';
import { db } from './utils/firebase.js';

const BASE_URI = 'mongodb://localhost:27017/';
async function run() {
  const dbName = 'voting'; // Hardcoding since we know this one had 'some' data
  const conn = await mongoose.createConnection(`${BASE_URI}${dbName}`).asPromise();
  const LocalUser = conn.model('User', new mongoose.Schema({}, {strict: false}), 'users');
  const LocalCandidate = conn.model('Candidate', new mongoose.Schema({}, {strict: false}), 'candidates');
  const LocalElection = conn.model('Election', new mongoose.Schema({}, {strict: false}), 'elections');

  const users = await LocalUser.find({});
  console.log(`Found ${users.length} users in Local DB.`);
  
  for (let u of users) {
    const data = u.toObject();
    const id = data._id.toString();
    delete data._id;
    await db.collection('users').doc(id).set({ ...data, id });
    process.stdout.write('.'); // progress
  }
  console.log('\nUsers synced.');

  const candidates = await LocalCandidate.find({});
  console.log(`Found ${candidates.length} candidates in Local DB.`);
  for (let c of candidates) {
    const data = c.toObject();
    const id = data._id.toString();
    delete data._id;
    await db.collection('candidates').doc(id).set({ ...data, id });
  }

  const elections = await LocalElection.find({});
  console.log(`Found ${elections.length} elections in Local DB.`);
  for (let e of elections) {
    const data = e.toObject();
    const id = data._id.toString();
    delete data._id;
    await db.collection('elections').doc(id).set({ ...data, id });
  }

  console.log('SYNC FINISHED.');
  process.exit(0);
}
run();
