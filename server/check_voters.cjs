const mongoose = require("mongoose");

// 1. --- LINK TO LOCAL ---
const LOCAL_URI = "mongodb://127.0.0.1:27017/voting"; 

// 2. --- USER SCHEMA ---
const UserSchema = new mongoose.Schema({
    username: String,
    voterId: String,
    passcode: String
}, { strict: false });

async function check() {
    console.log("🔍 Checking Local Voters...");

    try {
        const conn = await mongoose.createConnection(LOCAL_URI).asPromise();
        console.log("✅ Connected to Local MongoDB\n");

        const User = conn.model("User", UserSchema, "users");

        const users = await User.find({});

        if (users.length === 0) {
            console.log("⚠️ No users found in local database! Try registering a NEW user with a unique username.");
        } else {
            console.log("📋 --- REGISTERED USERS ---");
            console.table(users.map(u => ({
                Username: u.username,
                VoterID: u.voterId,
                Passcode: u.passcode
            })));
            console.log("----------------------------");
            console.log("💡 USE THE VOTER ID AND PASSCODE ABOVE TO VOTE!");
        }

        await conn.close();
        process.exit(0);

    } catch (err) {
        console.error("❌ FAILED TO READ USERS:", err);
        process.exit(1);
    }
}

check();
