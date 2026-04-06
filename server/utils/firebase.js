import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let db;
let auth;

try {
  let serviceAccount;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Check if it's base64 encoded (common for Render/Vercel) or a plain JSON string
    const input = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (input.trim().startsWith('{')) {
      serviceAccount = JSON.parse(input);
    } else {
      // Try Base64 decode
      const decoded = Buffer.from(input, 'base64').toString('ascii');
      serviceAccount = JSON.parse(decoded);
    }
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("🔥 Firebase Admin Initialized (Firestore Mode)");
    }
    
    db = admin.firestore();
    auth = admin.auth();
    
    // Test connectivity
    db.settings({ ignoreUndefinedProperties: true });
    
  } else {
    console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT missing in .env! Backend is running in NO-DB mode.");
  }
} catch (error) {
  console.error("❌ Firebase Initialization Error:", error.message);
}

export { db, auth };
