import { db } from "./utils/firebase.js";

async function check() {
  if (!db) {
    console.error("No DB connection");
    return;
  }
  
  const candidates = await db.collection("candidates").get();

  console.log("--- CANDIDATE DATA CHECK ---");
  candidates.forEach(doc => {
    const data = doc.data();
    console.log(`Candidate: ${data.username} (${data.firstName} ${data.lastName})`);
    console.log(`- ID: ${doc.id}`);
    console.log(`- Avatar: ${data.avatar}`);
    console.log(`- Base64 Length: ${data.avatarBase64 ? data.avatarBase64.length : "MISSING"}`);
  });
}

check();
