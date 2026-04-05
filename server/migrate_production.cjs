const mongoose = require("mongoose");

// 1. --- THE LINKS ---
const LOCAL_URI = "mongodb://localhost:27017/voting"; 
const CLOUD_URI = "mongodb+srv://MajorProject:voting7@e-voting.unaq33p.mongodb.net/voting";

// 2. --- SCHEMAS ---
const CandidateSchema = new mongoose.Schema({}, { strict: false });
const ElectionSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });

async function migrate() {
    console.log("🚀 Starting Production Data Migration...");

    try {
        // --- STEP A: CONNECT TO LOCAL ---
        const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
        console.log("✅ Connected to Local MongoDB");

        const LocalCandidate = localConn.model("Candidate", CandidateSchema, "candidates");
        const LocalElection = localConn.model("Election", ElectionSchema, "elections");
        const LocalUser = localConn.model("User", UserSchema, "users");

        // --- STEP B: FETCH DATA ---
        const candidates = await LocalCandidate.find({});
        const elections = await LocalElection.find({});
        const users = await LocalUser.find({});

        console.log(`📦 Found locally: ${users.length} Users (Voters), ${candidates.length} Candidates, ${elections.length} Elections.`);

        // --- STEP C: CONNECT TO CLOUD ---
        const cloudConn = await mongoose.createConnection(CLOUD_URI).asPromise();
        console.log("✅ Connected to Atlas Cloud");

        const CloudCandidate = cloudConn.model("Candidate", CandidateSchema, "candidates");
        const CloudElection = cloudConn.model("Election", ElectionSchema, "elections");
        const CloudUser = cloudConn.model("User", UserSchema, "users");

        // --- STEP D: TRANSFER USERS (VOTERS) ---
        console.log("⏳ Uploading Voters to Cloud...");
        for (let user of users) {
             const data = user.toObject();
             delete data._id; // Remove _id to avoid conflict
             delete data.__v; // Remove version key
             await CloudUser.updateOne({ username: data.username }, { $set: data }, { upsert: true });
        }
        console.log(`✨ Successfully synced ${users.length} Voters!`);

        // --- STEP E: TRANSFER CANDIDATES ---
        console.log("⏳ Uploading Candidates to Cloud...");
        for (let cand of candidates) {
            const data = cand.toObject();
            delete data._id;
            delete data.__v;
            await CloudCandidate.updateOne({ username: data.username }, { $set: data }, { upsert: true });
        }
        console.log(`✨ Successfully synced ${candidates.length} Candidates!`);

        // --- STEP F: TRANSFER ELECTIONS ---
        console.log("⏳ Uploading Elections to Cloud...");
        for (let elec of elections) {
            const data = elec.toObject();
            delete data._id;
            delete data.__v;
            await CloudElection.updateOne({ name: data.name }, { $set: data }, { upsert: true });
        }
        console.log(`✨ Successfully synced ${elections.length} Elections!`);

        console.log("\n🎉 DATA MIGRATION COMPLETE! Refresh your Vercel dashboard now.");
        
        await localConn.close();
        await cloudConn.close();
        process.exit(0);

    } catch (err) {
        console.error("❌ MIGRATION FAILED:", err);
        process.exit(1);
    }
}

migrate();
