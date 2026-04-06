import mongoose from 'mongoose';
import { db } from './utils/firebase.js';

const BASE_URI = 'mongodb://localhost:27017/';
const possibleDbs = ['DigitalVoting', 'E-Voting', 'voting', 'votingDB'];

async function checkAndMigrate() {
  let bestDb = null;
  let maxUsers = -1;

  for (const name of possibleDbs) {
    try {
      const conn = await mongoose.createConnection(`${BASE_URI}${name}`).asPromise();
      const UserModel = conn.model('User', new mongoose.Schema({}, {strict: false}), 'users');
      const count = await UserModel.countDocuments({});
      console.log(`Checking ${name}: ${count} users found.`);
      if (count > maxUsers) {
        maxUsers = count;
        bestDb = name;
      }
      await conn.close();
    } catch (e) {
      console.log(`Skipped ${name}.`);
    }
  }

  if (bestDb && maxUsers > 0) {
    console.log(`🚀 Migrating from BEST candidate: ${bestDb} (${maxUsers} users)`);
    const finalConn = await mongoose.createConnection(`${BASE_URI}${bestDb}`).asPromise();
    
    const LocalUser = finalConn.model('User', new mongoose.Schema({}, {strict: false}), 'users');
    const LocalCandidate = finalConn.model('Candidate', new mongoose.Schema({}, {strict: false}), 'candidates');
    const LocalElection = finalConn.model('Election', new mongoose.Schema({}, {strict: false}), 'elections');

    const users = await LocalUser.find({});
    for (let u of users) {
      const data = u.toObject();
      const id = data._id.toString();
      delete data._id;
      await db.collection('users').doc(id).set({ ...data, id });
      console.log(`Migrated user: ${data.username}`);
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

    console.log(`✅ SUCCESS: Migrated ${maxUsers} users and related data from ${bestDb}.`);
    process.exit(0);
  } else {
    console.warn("❌ No voting data found in any likely database name.");
    process.exit(1);
  }
}

checkAndMigrate();
