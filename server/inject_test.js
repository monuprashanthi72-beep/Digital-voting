import { db } from "./utils/firebase.js";

async function inject() {
  if (!db) return;
  
  // Try to find Artadddict
  const snap = await db.collection("users").where("username", "==", "Artadddict").limit(1).get();
  if (snap.empty) {
    console.log("Artadddict not found");
    return;
  }
  
  const id = snap.docs[0].id;
  // A tiny red dot base64 image
  const testBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";
  
  await db.collection("users").doc(id).update({
    avatarBase64: testBase64
  });
  
  console.log("Injected test picture into Artadddict");
}

inject();
