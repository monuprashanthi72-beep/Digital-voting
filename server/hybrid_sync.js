import mongoose from 'mongoose';
import { db } from './utils/firebase.js';

const BASE_URI = 'mongodb://localhost:27017/';

async function hybridSync() {
  console.log('🚀 Finalizing Data Restoration for Presentation...');
  
  // 1. Sync 26 Users from DigitalVoting
  const userConn = await mongoose.createConnection(`${BASE_URI}DigitalVoting`).asPromise();
  const users = await userConn.db.collection('users').find({}).toArray();
  console.log(`👤 Syncing ${users.length} Users from DigitalVoting...`);
  for (let u of users) {
    const id = u._id.toString();
    delete u._id;
    await db.collection('users').doc(id).set({ ...u, id });
  }
  await userConn.close();

  // 2. Sync Election and Candidates from voting
  const votingConn = await mongoose.createConnection(`${BASE_URI}voting`).asPromise();
  
  const elections = await votingConn.db.collection('elections').find({}).toArray();
  console.log(`🗳️ Syncing ${elections.length} Elections from voting...`);
  for (let e of elections) {
    const id = e._id.toString();
    delete e._id;
    await db.collection('elections').doc(id).set({ ...e, id });
  }

  const candidates = await votingConn.db.collection('candidates').find({}).toArray();
  console.log(`👨‍💼 Syncing ${candidates.length} Candidates from voting...`);
  for (let c of candidates) {
    const id = c._id.toString();
    delete c._id;
    await db.collection('candidates').doc(id).set({ ...c, id });
  }
  await votingConn.close();

  console.log('✅ DATABASE FULLY RESTORED AND HYBRIDIZED!');
  process.exit(0);
}

hybridSync();
