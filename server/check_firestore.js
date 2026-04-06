import { db } from './utils/firebase.js';
async function check() {
  const snapshot = await db.collection('users').get();
  console.log(`CLOUDBASE CHECK: Found ${snapshot.size} users in your Firestore Cloud!`);
  process.exit(0);
}
check();
