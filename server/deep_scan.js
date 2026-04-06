import mongoose from 'mongoose';
const BASE_URI = 'mongodb://localhost:27017/';
const possibleDbs = ['DigitalVoting', 'E-Voting', 'voting', 'votingDB'];

async function scan() {
  for (const name of possibleDbs) {
    const conn = await mongoose.createConnection(`${BASE_URI}${name}`).asPromise();
    const count = await conn.db.collection('users').countDocuments({});
    console.log(`Database [${name}] has ${count} users.`);
    await conn.close();
  }
  process.exit(0);
}
scan();
