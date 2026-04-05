import mongoose from 'mongoose';

async function migrate() {
  try {
    console.log('Connecting to Local DB...');
    const localDb = await mongoose.createConnection('mongodb://localhost:27017/voting').asPromise();
    const LocalUser = localDb.model('User', new mongoose.Schema({}, {strict: false}), 'users');
    const localUsers = await LocalUser.find({});
    console.log(`Found ${localUsers.length} local users in your laptop.`);

    console.log('Connecting to Cloud DB...');
    const cloudDb = await mongoose.createConnection('mongodb+srv://MajorProject:voting7@e-voting.unaq33p.mongodb.net/voting?appName=E-Voting').asPromise();
    const CloudUser = cloudDb.model('User', new mongoose.Schema({email: String}, {strict: false}), 'users');

    let count = 0;
    for (let u of localUsers) {
      if (u.isAdmin) continue; // Skip admin
      const exists = await CloudUser.findOne({email: u.email});
      if (!exists) {
        let userObj = u.toObject();
        delete userObj._id; // Remove the old local ID
        try {
          await CloudUser.create(userObj);
          count++;
          console.log(`Migrated user: ${u.username}`);
        } catch (e) {
          console.log(`Skipped ${u.username} due to duplicate voterId or mobile.`);
        }
      }
    }
    
    console.log(`SUCCESS: Migrated ${count} new users to your Live Cloud Database!`);
    process.exit(0);
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
}
migrate();
