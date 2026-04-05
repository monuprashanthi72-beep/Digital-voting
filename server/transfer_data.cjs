const mongoose = require("mongoose");

// 1. --- THE LINKS ---
// YOUR LOCAL MONGODB (The "Old House")
const LOCAL_URI = "mongodb://localhost:27017/voting"; 

// YOUR CLOUD MONGODB (The "New House")
const CLOUD_URI = "mongodb+srv://MajorProject:batch7@e-voting.unaq33p.mongodb.net/voting";

// 2. --- SETUP SCHEMAS ---
const CandidateSchema = new mongoose.Schema({
    username: String,
    firstName: String,
    lastName: String,
    location: String,
    dob: Date,
    qualification: String,
    updatedAt: Date
}, { strict: false });

const ElectionSchema = new mongoose.Schema({
    name: String,
    candidates: [String]
}, { strict: false });

async function migrate() {
    console.log("🚀 Starting Data Migration...");

    try {
        // --- STEP A: CONNECT TO LOCAL ---
        const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
        console.log("✅ Connected to Local MongoDB");

        const LocalCandidate = localConn.model("Candidate", CandidateSchema, "candidates");
        const LocalElection = localConn.model("Election", ElectionSchema, "elections");

        // --- STEP B: FETCH DATA ---
        const candidates = await LocalCandidate.find({});
        const elections = await LocalElection.find({});

        console.log(`📦 Found ${candidates.length} Candidates and ${elections.length} Elections locally.`);

        if (candidates.length === 0 && elections.length === 0) {
            console.log("⚠️ Nothing to migrate! Closing...");
            process.exit(0);
        }

        // --- STEP C: CONNECT TO CLOUD ---
        const cloudConn = await mongoose.createConnection(CLOUD_URI).asPromise();
        console.log("✅ Connected to Atlas Cloud");

        const CloudCandidate = cloudConn.model("Candidate", CandidateSchema, "candidates");
        const CloudElection = cloudConn.model("Election", ElectionSchema, "elections");

        // --- STEP D: TRANSFER CANDIDATES ---
        console.log("⏳ Uploading Candidates to Cloud...");
        for (let cand of candidates) {
            const data = cand.toObject();
            await CloudCandidate.updateOne({ username: data.username }, { $set: data }, { upsert: true });
        }
        console.log(`✨ Successfully synced ${candidates.length} Candidates!`);

        // --- STEP E: TRANSFER ELECTIONS ---
        console.log("⏳ Uploading Elections to Cloud...");
        for (let elec of elections) {
            const data = elec.toObject();
            await CloudElection.updateOne({ name: data.name }, { $set: data }, { upsert: true });
        }
        console.log(`✨ Successfully synced ${elections.length} Elections!`);

        console.log("\n🎉 ALL DONE! Your live website should now see Alice, Bob, and Charlie!");
        
        await localConn.close();
        await cloudConn.close();
        process.exit(0);

    } catch (err) {
        console.error("❌ MIGRATION FAILED:", err);
        process.exit(1);
    }
}

migrate();
