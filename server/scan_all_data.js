import mongoose from 'mongoose';
const BASE_URI = 'mongodb://localhost:27017/';
const possibleDbs = ['DigitalVoting', 'E-Voting', 'voting', 'votingDB'];

async function scan() {
  for (const name of possibleDbs) {
    const conn = await mongoose.createConnection(`${BASE_URI}${name}`).asPromise();
    const eCount = await conn.db.collection('elections').countDocuments({});
    const cCount = await conn.db.collection('candidates').countDocuments({});
    console.log(`Database [${name}] has ${eCount} elections and ${cCount} candidates.`);
    await conn.close();
  }
  process.exit(0);
}
scan();
