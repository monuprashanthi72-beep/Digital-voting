import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

let db;
let auth;

try {
  let serviceAccount;
  const saPath = path.join(__dirname, "..", "serviceAccount.json");

  if (fs.existsSync(saPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
    console.log("🔥 Firebase Admin Initialized from serviceAccount.json");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    let input = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    
    // Check if it's Base64
    if (!input.startsWith('{')) {
      input = Buffer.from(input, 'base64').toString('utf8');
    }

    const jsonMatch = input.match(/\{.*\}/s);
    if (jsonMatch) {
      serviceAccount = JSON.parse(jsonMatch[0]);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
    }
  }

  if (serviceAccount) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    db = admin.firestore();
    auth = admin.auth();
    db.settings({ ignoreUndefinedProperties: true });
    if (!fs.existsSync(saPath)) {
       console.log("🔥 Firebase Admin Initialized from .env (Base64/JSON)");
    }
  } else {
    console.warn("⚠️  No Firebase credentials found!");
  }
} catch (error) {
  console.error("❌ Firebase Initialization Error:", error.message);
}

export { db, auth };
