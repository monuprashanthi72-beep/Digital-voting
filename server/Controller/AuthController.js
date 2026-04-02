import { PythonShell } from "python-shell";
import multer from "multer";
import fs from "fs";
import path from "path";
import User from "../Models/User.js";
import Election from "../Models/Election.js";
import Candidate from "../Models/Candidate.js";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { v2 as cloudinary } from "cloudinary";

// http://localhost:5000/api/auth/register
//
// {
//     "username":"prnv",
//     "email":"abc@gmail.com",
//     "mobile":"1111111111",
//     "location":"120",
//     "password":"123"
//     }

//User
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Faces");
  },
  filename: function (req, file, cb) {
    // Unique filename with timestamp to avoid collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.body.username + "-" + file.fieldname + "-" + uniqueSuffix + "." + file.originalname.split(".").pop());
  },
});
var upload = multer({ storage: storage }).fields([
  { name: 'profile', maxCount: 1 },
  { name: 'idCard', maxCount: 1 },
  { name: 'candidateImage', maxCount: 1 } // Added for candidate avatars
]);


const strictFaceThreshold = Number(process.env.FACE_MATCH_THRESHOLD || 0.45);

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

// 🕵️ SECURITY FEATURE: Temporal Liveness Analysis
const calculateTemporalDrift = (frames) => {
  if (!Array.isArray(frames) || frames.length < 2) return 0;
  let totalDrift = 0;
  for (let i = 1; i < frames.length; i++) {
    totalDrift += euclideanDistance(frames[i], frames[i - 1]);
  }
  return totalDrift / frames.length;
};

export const register = {
  validator: async (req, res, next) => {
    next();
  },
  controller: async (req, res) => {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(500).json(err);
      } else if (err) {
        return res.status(500).json(err);
      }
      try {
        if (req.body.faceDescriptor && typeof req.body.faceDescriptor === "string") {
          req.body.faceDescriptor = JSON.parse(req.body.faceDescriptor);
        }

        const passcode = Math.floor(100000 + Math.random() * 900000).toString();
        req.body.passcode = passcode;

        if (req.files) {
          const profileFile = req.files.profile?.[0];
          const idCardFile = req.files.idCard?.[0];

          if (profileFile) {
            if (canUseCloudinary()) {
              req.body.avatar = await uploadToCloudinary(profileFile.path, "evoting/profile");
            } else {
              req.body.avatar = profileFile.filename;
            }
          }

          if (idCardFile) {
            if (canUseCloudinary()) {
              req.body.idCardImage = await uploadToCloudinary(idCardFile.path, "evoting/id-card");
            } else {
              req.body.idCardImage = idCardFile.filename;
            }
          }
        }

        const newUser = await User.create(req.body);
        const mailContent = `Welcome! Your unique Voter Passcode is: ${passcode}`;
        try {
          await sendMail(mailContent, "Welcome to E-Voting", newUser);
          return res.status(201).send("Registration Successful! Passcode sent to email.");
        } catch (mailError) {
          console.log(`[TRIAL] Passcode for ${newUser.username}: ${passcode}`);
          return res.status(201).send("Registration Successful! (Check server console for passcode)");
        }
      } catch (e) {
        return res.status(500).json({ message: "Registration Failed", error: e.message });
      }
    });
  },
};


export const login = {
  validator: async (req, res, next) => {
    next();
  },
  controller: async (req, res) => {
    try {
      const findUser = await User.findOne({
        username: req.body.username,
      });

      if (!findUser) {
        return res.status(202).send("Invalid Username");
      }

      if (findUser.password !== req.body.password) {
        return res.status(202).send("Invalid Password");
      }

      // 🏆 RESEARCH FEATURE #8: Session-Unique Passcode
      // Generate a fresh 6-digit passcode for THIS session
      const newPasscode = Math.floor(100000 + Math.random() * 900000).toString();
      findUser.passcode = newPasscode;
      await findUser.save();

      console.log(`[SESSION PASSCODE] Issued for ${findUser.username}: ${newPasscode}`);

      return res.status(201).send(findUser);
    } catch (e) {
      console.error("Login Error:", e);
      return res.status(500).send("Server Error");
    }
  },
};

export const users = {
  deleteUserProfile: (user) => {
    // 🚩 FIX: If it's the default Firebase URL, don't try to delete it as a file!
    const defaultAvatar = "https://firebasestorage.googleapis.com/v0/b/luxuryhub-3b0f6.appspot.com/o/Site%20Images%2Fprofile.png?alt=media&token=6f94d26d-315c-478b-9892-67fda99d2cd6";
    
    if (!user.avatar || user.avatar === defaultAvatar || user.avatar.startsWith("http")) {
      console.log("Skipping deletion of default/remote avatar.");
      return true;
    }

    const filePath = path.join("Faces", user.avatar);

    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("File deletion error:", err);
          return false;
        }
      });
    }
    return true;
  },
  getUsers: async (req, res) => {
    try {
      const tmp = await User.find();
      return res.status(201).send(tmp);
    } catch (e) {
      return res.status(500).send("Error");
    }
  },
  getUser: async (req, res) => {
    try {
      const tmp = await User.findById(req.params.id);
      return res.status(201).send(tmp);
    } catch (e) {
      console.log(e);
      return res.status(500).send("Error!");
    }
  },
  getUserByName: async (req, res) => {
    try {
      const tmp = await User.find({ username: req.params.id });
      return res.status(201).send(tmp);
    } catch (e) {
      console.log(e);
      return res.status(500).send("Error!");
    }
  },
  delete: async (req, res) => {
    try {
      const tmp = await User.findByIdAndDelete(req.params.id);
      const isPhotoDeleted = users.deleteUserProfile(tmp);
      if (isPhotoDeleted) {
        return res
          .status(201)
          .send("Election and photo file deleted successfully");
      } else {
        return res.status(500).send("Error deleting photo file");
      }
    } catch (e) {
      console.log(e);
      return res.status(500).send("Error!");
    }
  },

  edit: async (req, res) => {
    const tmp = await User.findById(req.params.id);
    const isPhotoDeleted = users.deleteUserProfile(tmp);
    if (!isPhotoDeleted) {
      return res.status(500).send("Error updating User");
    }
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(500).json(err);
      } else if (err) {
        return res.status(500).json(err);
      }
      try {
        const user = {
          username: req.body.username,
          email: req.body.email,
          mobile: req.body.mobile,
          fname: req.body.fname,
          lname: req.body.lname,
        };
        const tmp = await User.findByIdAndUpdate(req.params.id, user);
        return res.status(201).send("User Updated Successfully");
      } catch (e) {
        console.log(e);
        return res.status(500).send("error");
      }
    });
  },
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const findUser = await User.findOne({ email });

      if (!findUser) {
        return res.status(202).send("Email not found in our records.");
      }

      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      findUser.password = tempPassword;
      await findUser.save();

      console.log(`[PASSWORD RESET] For ${email}. New Temp Password: ${tempPassword}`);
      
      return res.status(201).send(`A temporary password has been generated. Please check server console.`);
    } catch (e) {
      console.error(e);
      return res.status(500).send("Server Error");
    }
  },
  markVoted: async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.params.id, { hasVoted: true });
      return res.status(201).send("Voter participation recorded.");
    } catch (e) {
      console.error(e);
      return res.status(500).send("Error recording vote participation.");
    }
  },
};

//Candidate
export const candidateRegister = {
  validator: async (req, res, next) => {
    next();
  },
  controller: async (req, res) => {
    const candidate = await Candidate.create({
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dob: req.body.dob,
      qualification: req.body.qualification,
      join: req.body.join,
      location: req.body.location,
      description: req.body.description,
    });
    return res.status(201).send("Candidate Added");
  },
};

export const candidates = {
  getCandidates: async (req, res) => {
    const data = await Candidate.find();
    return res.status(201).send(data);
  },
  register: async (req, res) => {
    upload(req, res, async function (err) {
      if (err) return res.status(500).json(err);
      try {
        let avatarUrl = "";
        if (req.files && req.files.candidateImage) {
          const file = req.files.candidateImage[0];
          if (canUseCloudinary()) {
            avatarUrl = await uploadToCloudinary(file.path, "evoting/candidates");
          } else {
            avatarUrl = file.filename;
          }
        }

        const candidate = await Candidate.create({
          username: req.body.username,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          dob: req.body.dob,
          qualification: req.body.qualification,
          join: req.body.join,
          location: req.body.location,
          description: req.body.description,
          avatar: avatarUrl,
        });
        return res.status(201).send("Candidate Added Successfully");
      } catch (e) {
        return res.status(500).send("Internal Error: " + e.message);
      }
    });
  },

  getCandidate: async (req, res) => {
    const data = await Candidate.findOne({ username: req.params.username });
    if (data == null) {
      return res.status(500).send("Candidate Not Found");
    }
    return res.status(201).send(data);
  },
  delete: async (req, res) => {
    try {
      const data = await Candidate.findByIdAndDelete(req.params.id);
      return res.status(201).send("Candidate Deleted Successfully");
    } catch (e) {
      return res.status(500).send("Error");
    }
  },
};

export const phase = {
  controller: async (req, res) => {
    const data = await Election.findByIdAndUpdate(req.params.id, {
      currentPhase: req.body.currentPhase,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
    }, { new: true });
    return res.status(201).send(data);
  },
};

//Election

export const elections = {
  controller: async (req, res) => {
    try {
      const tmp = await Election.find();
      return res.status(201).send(tmp);
    } catch (e) {
      return res.status(500).send("Error");
    }
  },
  register: async (req, res) => {
    try {
      const newElection = await Election.create({
        name: req.body.name,
        candidates: req.body.candidates,
      });
      return res.status(201).send("Election Successfully Added");
    } catch (e) {
      return res.status(500).send("Internal Error" + e);
    }
  },
  getElection: async (req, res) => {
    try {
      const data = await Election.findById(req.params.id);
      return res.status(201).send(data);
    } catch (e) {
      return res.status(500).send("Error");
    }
  },
  voting: async (req, res) => {
    try {
      const tmp = await Election.find({ currentPhase: "voting" });
      return res.status(201).send(tmp);
    } catch (e) {
      return res.status(500).send("Error");
    }
  },
  result: async (req, res) => {
    try {
      const tmp = await Election.find({ currentPhase: "result" });
      return res.status(201).send(tmp);
    } catch (e) {
      return res.status(500).send("Error");
    }
  },
  delete: async (req, res) => {
    try {
      const tmp = await Election.findByIdAndDelete(req.params.id);
      return res.status(201).send("Election Deleted Successfully");
    } catch (e) {
      return res.status(500).send("Error");
    }
  },
};

const sendMail = async (mailContent, mailSubject, user) => {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL || process.env.EMAIL_USER,
      pass: process.env.EMAILPASSWORD || process.env.EMAIL_PASS,
    },
  });

  var mailOptions = {
    from: process.env.EMAIL || process.env.EMAIL_USER,
    to: user.email,
    subject: mailSubject,
    text: mailContent,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Mail Error:", error);
        reject(error);
      } else {
        console.log("Email sent: " + info.response);
        resolve(info);
      }
    });
  });

};

export const a = {
  sc: async (req, res) => {
    const filePath = path.resolve(process.cwd(), "Controller", "fr.py");
    PythonShell.run(filePath, null, function (err, result) {
      // console.log(result);
      // console.log("Error : ");
      // console.log(err);
      // console.log("Python script finished");
      if (err) {
        return res.status(500).send("Error While Running Python");
      }

      if (result) {
        return res.status(201).send(result);
      } else {
        return res.status(500).send("No face Match Found");
      }
    });
  },
};

export const faceAuth = {
  verify: async (req, res) => {
    try {
      const {
        voterId,
        passcode,
        liveDescriptor,
        totalFrames,
        movedFrames,
        blinkDetected,
        frameVariance,
        descriptorsSequence, // Required for temporal drift check
      } = req.body;

      if (!voterId || !passcode || !Array.isArray(liveDescriptor)) {
        return res.status(400).json({ ok: false, message: "Invalid biometric payload." });
      }

      const user = await User.findOne({ voterId, passcode });
      if (!user || !user.faceDescriptor) {
        return res.status(401).json({ ok: false, message: "Identity credentials or enrolled face not found." });
      }

      // --- 🚨 STRICT LIVENESS CHECKS ---
      const minFrames = 10;
      const hasEnoughFrames = Number(totalFrames) >= minFrames;
      const hasMovement = Number(movedFrames) >= 3;
      const hasBlink = Boolean(blinkDetected);
      
      // Calculate temporal drift from descriptor sequence
      // Real humans have small, non-zero drift even when trying to stay still.
      // Static photos have EXACTLY zero drift unless the camera has extreme noise.
      const temporalDrift = descriptorsSequence ? calculateTemporalDrift(descriptorsSequence) : parseFloat(frameVariance || 0);
      const isNotStatic = temporalDrift > 0.0001; // Minimum variance threshold for liveness

      if (!hasEnoughFrames || !hasMovement || !hasBlink || !isNotStatic) {
        return res.status(403).json({
          ok: false,
          message: "Liveness verification failed. Rejecting potential spoofing attempt.",
          details: { hasEnoughFrames, hasMovement, hasBlink, isNotStatic, temporalDrift }
        });
      }

      // --- STRICT FACE MATCHING ---
      const distance = euclideanDistance(liveDescriptor, user.faceDescriptor);
      const isMatch = distance <= strictFaceThreshold;

      if (!isMatch) {
        return res.status(403).json({
          ok: false,
          message: "Face mismatch! You are not authorized to vote as this user.",
          distance,
          threshold: strictFaceThreshold
        });
      }

      return res.status(200).json({
        ok: true,
        message: "Biometric authentication successful.",
        distance
      });
    } catch (e) {
      console.error("Face verify error:", e);
      return res.status(500).json({ ok: false, message: "System error during face verification." });
    }
  },
};


//Voting Mail

export const votingMail = {
  send: async (req, res) => {
    const mailContent =
      "Thank You For The Voting but if it's not you contact admin@votingsystem.com";

    const mailSubject = "Voting Success";

    const findUser = await User.findOne({ _id: req.body.id });

    try {
      await sendMail(mailContent, mailSubject, findUser);
      return res.status(201).send("Email Sent");
    } catch (mailError) {
      console.error("Voting email failed:", mailError);
      return res.status(201).send("Email Failed (Vote cast successfully)");
    }
  },
};

// --- OTP TRIAL LOGIC ---
const tempOtpStore = new Map();

export const otpTrial = {
  send: async (req, res) => {
    const { identifier, type } = req.body;
    if (!identifier) return res.status(400).send("Identifier is required");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    tempOtpStore.set(identifier, { code, expires: Date.now() + 5 * 60 * 1000 });

    console.log(`\n-----------------------------------------`);
    console.log(`[TRIAL MODE] OTP for ${type} (${identifier}): ${code}`);
    console.log(`-----------------------------------------\n`);

    if (type === "email") {
      try {
        await sendMail(`Your Verification Code is: ${code}`, "E-Voting Verification Code", { email: identifier });
        return res.status(200).send("OTP sent to your email! (Also check server console)");
      } catch (err) {
        return res.status(200).send("Trial Mode: Email failed, but you can get the code from the server terminal console!");
      }
    } else {
      try {
        await sendSMS(`Your E-Voting Verification Code is: ${code}`, identifier);
        return res.status(200).send("OTP sent to your mobile! (Check your SMS)");
      } catch (err) {
        console.error("SMS Error:", err);
        return res.status(200).send("Trial Mode: SMS failed or credentials missing, but you can get the code from the server terminal console!");
      }
    }
  },
  verify: async (req, res) => {
    const { identifier, code } = req.body;
    const stored = tempOtpStore.get(identifier);

    if (!stored) return res.status(202).send("No OTP found or it expired.");
    if (Date.now() > stored.expires) {
      tempOtpStore.set(identifier, null);
      return res.status(202).send("OTP expired. Request a new one.");
    }

    if (stored.code === code) {
      tempOtpStore.delete(identifier);
      return res.status(200).send("Verified Successfully!");
    } else {
      return res.status(202).send("Invalid Code. Check the console and try again.");
    }
  }
};

const sendSMS = async (content, mobile) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioNumber) {
    throw new Error("Twilio credentials missing in .env");
  }

  const client = twilio(accountSid, authToken);
  
  // 🏆 PREPENDING +91 for Indian phone numbers if it's missing (a common Twilio mistake)
  const formattedMobile = mobile.startsWith("+") ? mobile : `+91${mobile}`;

  return client.messages.create({
    body: content,
    from: twilioNumber,
    to: formattedMobile,
  });
};
