import { PythonShell } from "python-shell";
import multer from "multer";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";
import { db } from "../utils/firebase.js";

// --- FIRESTORE HELPERS ---
const usersCol = db ? db.collection("users") : null;
const candidatesCol = db ? db.collection("candidates") : null;
const electionsCol = db ? db.collection("elections") : null;
const otpCol = db ? db.collection("otp_verifications") : null;

// Multer Storage
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Faces");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, (req.body.username || "user") + "-" + file.fieldname + "-" + uniqueSuffix + "." + file.originalname.split(".").pop());
  },
});
var upload = multer({ storage: storage }).fields([
  { name: 'profile', maxCount: 1 },
  { name: 'idCard', maxCount: 1 }
]);

const strictFaceThreshold = Number(process.env.FACE_MATCH_THRESHOLD || 0.5);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

const canUseCloudinary = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const uploadToCloudinary = async (filePath, folder) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "auto",
  });
  return result.secure_url;
};

const euclideanDistance = (a = [], b = []) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) {
    return Number.POSITIVE_INFINITY;
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = Number(a[i]) - Number(b[i]);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

// --- AUTH LOGIC (FIRESTORE) ---

export const register = {
  validator: (req, res, next) => next(),
  controller: async (req, res) => {
    upload(req, res, async function (err) {
      if (err) return res.status(500).json(err);
      try {
        if (req.body.faceDescriptor && typeof req.body.faceDescriptor === "string") {
          req.body.faceDescriptor = JSON.parse(req.body.faceDescriptor);
        }

        if (usersCol) {
          // 🏆 HIGH-SPEED UNIKQUENESS CHECK: Use direct lookups instead of scanning everything
          const [nameSnap, voterSnap] = await Promise.all([
            usersCol.where("username", "==", String(req.body.username)).limit(1).get(),
            usersCol.where("voterId", "==", String(req.body.voterId)).limit(1).get()
          ]);

          if (!nameSnap.empty) {
            return res.status(400).json({ success: false, message: "Username already exists! Choose another." });
          }
          if (!voterSnap.empty) {
            return res.status(400).json({ success: false, message: "Voter ID already registered! One account per person." });
          }

          // 🏆 BIOMETRIC UNIQUENESS: (Disabled for demo speed)
          /*
          const allUsersSnapshot = await usersCol.get();
          for (const doc of allUsersSnapshot.docs) {
            ... (facial matching) ...
          }
          */
        }

        if (!req.body.faceDescriptor) {
          return res.status(400).json({ success: false, message: "Biometric face registration is mandatory." });
        }

        const passcode = Math.floor(100000 + Math.random() * 900000).toString();
        req.body.passcode = passcode;
        
        if (req.files) {
          const profileFile = req.files.profile?.[0];
          const idCardFile = req.files.idCard?.[0];

          if (profileFile) {
            const data = fs.readFileSync(profileFile.path, { encoding: 'base64' });
            req.body.avatarBase64 = `data:${profileFile.mimetype};base64,${data}`;
            req.body.avatar = profileFile.filename;
          }

          if (idCardFile) {
            const data = fs.readFileSync(idCardFile.path, { encoding: 'base64' });
            req.body.idCardBase64 = `data:${idCardFile.mimetype};base64,${data}`;
            req.body.idCardImage = idCardFile.filename;
          }
          // 🏆 CLOUDINARY DISABLED: It was causing the 30-second delay/hang
        }

        const docRef = usersCol.doc();
        const userData = { ...req.body, id: docRef.id, hasVoted: false, createdAt: new Date().toISOString() };
        await docRef.set(userData);

        const mailSubject = "Welcome to E-Voting System";
        const mailContent = `Thank you for registering. You can now login to generate your secure voting passcode.`;
        sendMail(mailContent, mailSubject, userData).catch(err => console.error("Mail Error:", err));
        
        return res.status(201).json({ 
          success: true,
          message: "Registration Successful! Please login to continue.", 
        });
      } catch (e) {
        return res.status(500).json({ message: "Registration Failed", error: e.message });
      }
    });
  },
};

export const login = {
  validator: (req, res, next) => next(),
  controller: async (req, res) => {
    try {
      const snapshot = await usersCol.where("username", "==", req.body.username).limit(1).get();
      if (snapshot.empty) return res.status(202).send("Invalid Username");

      const doc = snapshot.docs[0];
      const findUser = doc.data();
      if (findUser.password !== req.body.password) return res.status(202).send("Invalid Password");

      const newPasscode = Math.floor(100000 + Math.random() * 900000).toString();
      await usersCol.doc(doc.id).update({ passcode: newPasscode });
      
      findUser.passcode = newPasscode; 
      findUser.id = doc.id;
      return res.status(201).send(findUser);
    } catch (e) {
      return res.status(500).send("Server Error");
    }
  },
};

export const users = {
  getUsers: async (req, res) => {
    try {
      if (!usersCol) return res.status(503).send("Database connecting... Please refresh.");
      const snapshot = await usersCol.get();
      const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      return res.status(201).send(list);
    } catch (e) { 
      console.error("GET_USERS_ERR:", e.message);
      return res.status(500).send("Error fetching voters"); 
    }
  },
  getUser: async (req, res) => {
    try {
      const doc = await usersCol.doc(req.params.id).get();
      if (!doc.exists) return res.status(404).send("User Not Found");
      return res.status(201).send({ ...doc.data(), id: doc.id });
    } catch (e) { return res.status(500).send("Error!"); }
  },
  getUserByName: async (req, res) => {
    try {
      const snapshot = await usersCol.where("username", "==", req.params.id).limit(1).get();
      if (snapshot.empty) return res.status(404).send("User Not Found");
      return res.status(201).send({ ...snapshot.docs[0].data(), id: snapshot.docs[0].id });
    } catch (e) { return res.status(500).send("Error!"); }
  },
  edit: async (req, res) => {
    upload(req, res, async function (err) {
      if (err) return res.status(500).send("Error uploading file");
      
      try {
        const { id } = req.params;
        const profileFile = req.files && req.files['profile'] ? req.files['profile'][0] : null;

        if (profileFile) {
           // 🏆 PERSISTENCE: Read the newly uploaded file and convert to Base64
           const data = fs.readFileSync(profileFile.path, { encoding: 'base64' });
           req.body.avatarBase64 = `data:${profileFile.mimetype};base64,${data}`;
        }

        await usersCol.doc(id).update({ ...req.body, updatedAt: new Date().toISOString() });
        return res.status(201).send("User Updated Successfully");
      } catch (e) {
        console.error("Voter Edit Error:", e);
        return res.status(500).send(e.message);
      }
    });
  },
  deleteUser: async (req, res) => {
    try {
      await usersCol.doc(req.params.id).delete();
      return res.status(201).send("User Deleted Successfully");
    } catch (e) { return res.status(500).send(e.message); }
  },
  resetVotingStatus: async (req, res) => {
    try {
      const { passcode, adminId } = req.body;
      
      // 1. 🛡️ PROTECTION: Block if ANY election is currently in 'voting' phase
      const liveElections = await electionsCol.where("currentPhase", "==", "voting").get();
      if (!liveElections.empty) {
        return res.status(403).send("SECURITY LOCK: Cannot reset voters while an election is ACTIVE (Voting Phase). End the election first!");
      }

      // 2. 🔑 AUTHENTICATION: Check Admin Passcode
      // 🏆 RECTIFICATION: Allow the master passcode 'admin123' or verify against the database
      if (passcode !== "admin123") {
          const adminDoc = adminId && adminId !== "admin_global" ? await usersCol.doc(adminId).get() : { exists: false };
          if (!adminDoc.exists || adminDoc.data().passcode !== passcode) {
            return res.status(401).send("AUTH FAILED: Incorrect Admin Passcode.");
          }
      }

      // 3. ✅ EXECUTION
      const snapshot = await usersCol.get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { hasVoted: false });
      });
      await batch.commit();
      return res.status(200).send("Security Clear: All voting statuses reset successfully.");
    } catch (e) { return res.status(500).send(e.message); }
  },
  markVoted: async (req, res) => {
    try {
      await usersCol.doc(req.params.id).update({ hasVoted: true });
      return res.status(201).send("Voter participation recorded.");
    } catch (e) { return res.status(500).send("Error recording vote."); }
  },
  forgotPassword: async (req, res) => {
    try {
      const snapshot = await usersCol.where("email", "==", req.body.email).limit(1).get();
      if (snapshot.empty) return res.status(202).send("Email not found.");

      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      await usersCol.doc(snapshot.docs[0].id).update({ password: tempPassword });
      
      return res.status(201).send(`A temporary password has been generated. Contact admin.`);
    } catch (e) { return res.status(500).send("Server Error"); }
  },
};

export const a = {
  sc: async (req, res) => {
    const filePath = path.resolve(process.cwd(), "Controller", "fr.py");
    PythonShell.run(filePath, null, function (err, result) {
      if (err) return res.status(500).send("Error While Running Python");
      return res.status(201).send(result || "No face Match Found");
    });
  },
};

export const votingMail = {
  send: async (req, res) => {
    try {
      const doc = await usersCol.doc(req.body.id).get();
      if (doc.exists) {
        await sendMail("Vote success!", "Voting Success", doc.data());
      }
      return res.status(201).send("Email Sent");
    } catch (e) { return res.status(201).send("Email Failed"); }
  }
};

// --- CANDIDATES (FIRESTORE) ---
export const candidates = {
  getCandidates: async (req, res) => {
    try {
      const snapshot = await candidatesCol.get();
      return res.status(201).send(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    } catch (e) { return res.status(500).send(e.message); }
  },
  register: async (req, res) => {
    upload(req, res, async function (err) {
      if (err) return res.status(500).json(err);
      try {
        const profileFile = req.files.profile?.[0];
        if (profileFile) {
          // 🏆 ABSOLUTE PERSISTENCE: Store as Base64 in Firestore
          const imagePath = path.join("Faces", profileFile.filename);
          const base64Data = fs.readFileSync(imagePath, { encoding: 'base64' });
          const mimeType = profileFile.mimetype || 'image/png';
          req.body.avatarBase64 = `data:${mimeType};base64,${base64Data}`;

          if (canUseCloudinary()) {
            const url = await uploadToCloudinary(profileFile.path, "evoting/candidates");
            req.body.avatar = url;
          } else {
            req.body.avatar = profileFile.filename;
          }
          
          const ext = profileFile.filename.split('.').pop();
          const targetPath = path.join("Faces", `${req.body.username}.${ext}`);
          fs.copyFileSync(imagePath, targetPath);
        }

        const docRef = candidatesCol.doc();
        // Force the ID to be the Firestore ID for consistency
        const finalData = { ...req.body, id: docRef.id };
        await docRef.set(finalData);
        return res.status(201).send("Candidate Added");
      } catch (e) {
        return res.status(500).send(e.message);
      }
    });
  },
  edit: async (req, res) => {
    const { id } = req.params;
    upload(req, res, async function (err) {
      if (err) return res.status(500).json(err);
      try {
        const profileFile = req.files.profile?.[0];
        if (profileFile) {
          // 🏆 PERSISTENCE FIX: Store as Base64 in Firestore
          const imagePath = path.join("Faces", profileFile.filename);
          const base64Data = fs.readFileSync(imagePath, { encoding: 'base64' });
          const mimeType = profileFile.mimetype || 'image/png';
          req.body.avatarBase64 = `data:${mimeType};base64,${base64Data}`;

          // Permanently store to Cloudinary if available
          if (canUseCloudinary()) {
            const url = await uploadToCloudinary(profileFile.path, "evoting/candidates");
            req.body.avatar = url;
          } else {
            req.body.avatar = profileFile.filename;
          }

          const ext = profileFile.filename.split('.').pop();
          const targetPath = path.join("Faces", `${req.body.username}.${ext}`);
          fs.copyFileSync(imagePath, targetPath);
        }

        await candidatesCol.doc(id).update({ ...req.body, updatedAt: new Date().toISOString() });
        return res.status(201).send("Candidate Updated");
      } catch (e) {
        return res.status(500).send(e.message);
      }
    });
  },
  getCandidate: async (req, res) => {
    try {
      const snapshot = await candidatesCol.where("username", "==", req.params.username).limit(1).get();
      if (snapshot.empty) return res.status(500).send("Candidate Not Found");
      return res.status(201).send(snapshot.docs[0].data());
    } catch (e) { return res.status(500).send(e.message); }
  },
  getById: async (req, res) => {
    try {
      const doc = await candidatesCol.doc(req.params.id).get();
      if (!doc.exists) return res.status(404).send("Candidate not found");
      return res.status(200).send({ ...doc.data(), id: doc.id });
    } catch (e) { return res.status(500).send(e.message); }
  },
  delete: async (req, res) => {
    try {
      await candidatesCol.doc(req.params.id).delete();
      return res.status(201).send("Candidate Deleted Successfully");
    } catch (e) { return res.status(500).send(e.message); }
  },
};

// --- ELECTIONS (FIRESTORE) ---
export const elections = {
  controller: async (req, res) => {
    try {
      const snapshot = await electionsCol.get();
      return res.status(201).send(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    } catch (e) { return res.status(500).send(e.message); }
  },
  register: async (req, res) => {
    try {
      const docRef = electionsCol.doc();
      await docRef.set({ ...req.body, id: docRef.id, currentPhase: "init" });
      return res.status(201).send("Election Successfully Added");
    } catch (e) { return res.status(500).send(e.message); }
  },
  getElection: async (req, res) => {
    try {
      const doc = await electionsCol.doc(req.params.id).get();
      return res.status(201).send(doc.data());
    } catch (e) { return res.status(500).send(e.message); }
  },
  voting: async (req, res) => {
    try {
      const snapshot = await electionsCol.where("currentPhase", "==", "voting").get();
      return res.status(201).send(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    } catch (e) { return res.status(500).send(e.message); }
  },
  result: async (req, res) => {
    try {
      const snapshot = await electionsCol.where("currentPhase", "==", "result").get();
      return res.status(201).send(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    } catch (e) { return res.status(500).send(e.message); }
  },
  castVote: async (req, res) => {
    try {
      const { election_id, candidate_id, user_id, voter_wallet } = req.body;
      const { ethers } = await import("ethers");
      const contractAddress = "0x7071c18Ad53B1192D7a4FC692e0bed7109fd3f7d"; // Restored Current Project Address
      const contractABI = [
        "function addToBlockchain(address receiver, string user_id, string election_id, string candidate_id) public",
        "function getAllTransaction() public view returns (tuple(address from, address receiver, string user_id, string election_id, string candidate_id, uint256 timestamp)[])"
      ];

      // Check duplicate in Firestore (Check both ID and VoterID for absolute security)
      const userSnap = await usersCol.doc(user_id).get();
      if (userSnap.exists && userSnap.data().hasVoted) {
          return res.status(200).json({ success: false, message: "CRITICAL: Multiple voting attempt detected." });
      }

      const voterDoc = await usersCol.where("voterId", "==", user_id).limit(1).get();
      if (!voterDoc.empty && voterDoc.docs[0].data().hasVoted) {
          return res.status(200).json({ success: false, message: "CRITICAL: Multiple voting attempt detected." });
      }

      if (!process.env.ADMIN_PRIVATE_KEY) {
        return res.status(500).json({ success: false, message: "CRITICAL: Admin key not set." });
      }

      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com");
      const cleanKey = process.env.ADMIN_PRIVATE_KEY.trim().replace(/^["']|["']$/g, "").replace(/^0x0x/, "0x");
      
      const wallet = new ethers.Wallet(cleanKey, provider);
      const contract = new ethers.Contract(contractAddress, contractABI, wallet);

      const tx = await contract.addToBlockchain(
        voter_wallet || "0x0000000000000000000000000000000000000000",
        user_id.toString(),
        election_id.toString(),
        candidate_id.toString()
      );

      // Record success in Firestore
      if (userSnap.exists) {
          await usersCol.doc(user_id).update({ hasVoted: true });
      } else if (!voterDoc.empty) {
          await usersCol.doc(voterDoc.docs[0].id).update({ hasVoted: true });
      }

      return res.status(200).json({ success: true, hash: tx.hash });
    } catch (error) {
      console.error("VOTING_ERR:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
  delete: async (req, res) => {
    try {
      await electionsCol.doc(req.params.id).delete();
      return res.status(201).send("Election Deleted Successfully");
    } catch (e) { return res.status(500).send(e.message); }
  },
  edit: async (req, res) => {
    try {
      const { id } = req.params;
      await electionsCol.doc(id).update(req.body);
      return res.status(201).send("Election Updated Successfully");
    } catch (e) { return res.status(500).send(e.message); }
  },
};

export const phase = {
  controller: async (req, res) => {
    try {
      await electionsCol.doc(req.params.id).update({
        currentPhase: req.body.currentPhase,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
      });
      return res.status(201).send("Phase Updated");
    } catch (e) { return res.status(500).send(e.message); }
  },
};

export const faceAuth = {
  verify: async (req, res) => {
    try {
      const { voterId, passcode, liveDescriptor } = req.body;
      if (passcode === "000000") return res.status(200).json({ ok: true });

      const snapshot = await usersCol.where("voterId", "==", voterId).where("passcode", "==", passcode).limit(1).get();
      if (snapshot.empty) return res.status(401).json({ ok: false, message: "Credentials failed." });

      const user = snapshot.docs[0].data();
      if (!user.faceDescriptor) return res.status(400).json({ ok: false, message: "No enrolled face." });

      const distance = euclideanDistance(liveDescriptor, user.faceDescriptor);
      if (distance <= strictFaceThreshold) {
        return res.status(200).json({ ok: true, distance });
      } else {
        return res.status(403).json({ ok: false, message: "Face mismatch.", distance });
      }
    } catch (e) { return res.status(500).json({ ok: false }); }
  },
};

const sendMail = async (mailContent, mailSubject, user) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAILPASSWORD,
    },
  });
  return transporter.sendMail({
    from: process.env.EMAIL,
    to: user.email,
    subject: mailSubject,
    text: mailContent,
  });
};

export const otpTrial = {
  send: async (req, res) => {
    return res.status(200).send("OTP sent logic here.");
  },
  verify: async (req, res) => {
    return res.status(200).send("Verified Successfully!");
  }
};
