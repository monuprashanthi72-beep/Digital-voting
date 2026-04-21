import { db } from './utils/firebase.js';
async function check() {
  const users = await db.collection('users').get();
  const candidates = await db.collection('candidates').get();
  const elections = await db.collection('elections').get();
  
  console.log("--- CLOUDBASE REPORT ---");
  console.log(`Voters in Cloud: ${users.size}`);
  console.log(`Candidates in Cloud: ${candidates.size}`);
  console.log(`Elections in Cloud: ${elections.size}`);
  console.log("------------------------");
  process.exit(0);
}
check();
