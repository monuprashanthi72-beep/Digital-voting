import mongoose from 'mongoose';
async function run() {
  const connection = await mongoose.createConnection('mongodb://localhost:27017/').asPromise();
  const admin = connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log('ALL DATABASES:', dbs.databases.map(d => d.name));
  process.exit(0);
}
run();
