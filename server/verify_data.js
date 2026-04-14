import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const input = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!input) {
  console.log("Error: FIREBASE_SERVICE_ACCOUNT not found in .env");
  process.exit(1);
}

const serviceAccount = JSON.parse(input.trim().startsWith('{') ? input : Buffer.from(input, 'base64').toString('ascii'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkData() {
  const users = await db.collection("users").get();
  const candidates = await db.collection("candidates").get();
  const elections = await db.collection("elections").get();

  console.log("--- DATABASE CONTENT REPORT ---");
  console.log(`Voters Found: ${users.size}`);
  console.log(`Candidates Found: ${candidates.size}`);
  console.log(`Elections Found: ${elections.size}`);
  console.log("-------------------------------");
  process.exit(0);
}

checkData();
