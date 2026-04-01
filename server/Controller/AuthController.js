import { PythonShell } from "python-shell";
import multer from "multer";
import fs from "fs";
import path from "path";
import User from "../Models/User.js";
import Election from "../Models/Election.js";
import Candidate from "../Models/Candidate.js";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const abiPath = path.join(__dirname, "../utils/Transaction.json");
const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

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
  { name: 'idCard', maxCount: 1 }
]);
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

        // Generate a 6-digit random passcode
        const passcode = Math.floor(100000 + Math.random() * 900000).toString();
        req.body.passcode = passcode;
        // Handle multiple files if they exist
        if (req.files) {
          if (req.files.profile) req.body.avatar = req.files.profile[0].filename;
          if (req.files.idCard) req.body.idCardImage = req.files.idCard[0].filename;
        }

        const newUser = await User.create(req.body);

        const mailSubject = "Welcome to E-Voting System";
        const mailContent = `Thank you for registering. You are now officially enrolled for the upcoming election.`;

        // Send a welcome email but DO NOT send the passcode. Passcode is given at login.
        try {
          await sendMail(mailContent, mailSubject, newUser);
          return res.status(201).send("Registration Successful! (You will receive your Session Passcode when you login)");
        } catch (mailError) {
          console.error("Mail Sending Failed during registration:", mailError);
          return res.status(201).send("Registration Successful! (You will receive your Session Passcode when you login)");
        }

      } catch (e) {
        console.error("Registration Error Details:", e);
        return res.status(500).json({ 
          message: "Registration Failed", 
          error: e.message,
          stack: e.stack // For debugging
        });
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
      if (err instanceof multer.MulterError) {
        return res.status(500).json(err);
      } else if (err) {
        return res.status(500).json(err);
      }
      try {
        let profileImage = "";
        // We use the same 'profile' fieldname as the User registration
        if (req.files && req.files.profile) {
          profileImage = req.files.profile[0].filename;
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
          profileImage: profileImage,
        });
        return res.status(201).send("Candidate Added");
      } catch (e) {
        console.error("Candidate Registration Error:", e);
        return res.status(500).send("Registration Failed");
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
        startHour: req.body.startHour || 9,
        endHour: req.body.endHour || 17,
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
      user: process.env.EMAIL,
      pass: process.env.EMAILPASSWORD,
    },
  });

  var mailOptions = {
    from: process.env.EMAIL,
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

export const otpTrial = {
  send: async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).send("Email is required");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    tempOtpStore.set(identifier, { code, expires: Date.now() + 10 * 60 * 1000 }); // 10 minutes

    try {
      await sendMail(`Your E-Voting Verification Code is: ${code}`, "Secure Verification Code", { email: identifier });
      return res.status(200).send("Verification code sent to your email!");
    } catch (err) {
      console.error("Mail Error:", err);
      return res.status(200).send("Verification code has been sent to your email. (Please check your spam folder)");
    }
  },
  verify: async (req, res) => {
    const { identifier, code } = req.body;
    const stored = tempOtpStore.get(identifier);

    if (!stored) return res.status(202).send("No verification record found. Please resend code.");
    if (Date.now() > stored.expires) {
      tempOtpStore.delete(identifier);
      return res.status(202).send("Verification code expired. Please request a new one.");
    }

    if (stored.code === code) {
      tempOtpStore.delete(identifier);
      return res.status(200).send("Email Verified Successfully!");
    } else {
      return res.status(202).send("Invalid verification code. Please try again.");
    }
  }
};

const getEthereumContract = () => {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi.abi, wallet);
    return contract;
};

export const blockchain = {
    castVote: async (req, res) => {
        try {
            const { election_id, candidate_id, user_id } = req.body;
            const contract = getEthereumContract();
            
            console.log(`[BLOCKCHAIN] Casting vote for user ${user_id} in election ${election_id}`);
            
            const tx = await contract.addToBlockchain(
                process.env.ADMIN_ADDRESS, // Use admin address as 'from' for gasless
                user_id,
                election_id,
                candidate_id
            );

            const receipt = await tx.wait();
            console.log(`[BLOCKCHAIN] Transaction successful: ${receipt.transactionHash}`);
            
            return res.status(200).json({ 
                success: true, 
                hash: receipt.transactionHash, 
                message: "Vote cast successfully" 
            });
        } catch (error) {
            console.error("[BLOCKCHAIN] Error casting vote:", error);
            return res.status(500).json({ 
                success: false, 
                message: error.message || "Blockchain transaction failed" 
            });
        }
    },

    getTransactions: async (req, res) => {
        try {
            const contract = getEthereumContract();
            const data = await contract.getAllTransaction();
            
            const formatted = data.map((tx) => ({
                election_id: tx.election_id.toString(),
                candidate_id: tx.candidate_id.toString(),
                user_id: tx.user_id.toString(),
            }));
            
            return res.status(200).json(formatted);
        } catch (error) {
            console.error("[BLOCKCHAIN] Error fetching transactions:", error);
            return res.status(500).json([]);
        }
    }
};
