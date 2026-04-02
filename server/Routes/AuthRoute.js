import { Router } from "express";
import {
  register,
  login,
  users,
  elections,
  candidates,
  phase,
  votingMail,
  a,
  otpTrial,
  faceAuth,
} from "../Controller/AuthController.js";

const router = Router();

router.post("/register", register.validator, register.controller);

router.post("/election/register", elections.register);
router.post("/phase/edit/:id", phase.controller);
router.get("/voting/elections", elections.voting);
router.get("/result/elections", elections.result);

router.post("/login", login.validator, login.controller);
router.post("/candidate/register", candidates.register);
router.get("/candidate/:username", candidates.getCandidate);
router.get("/candidates", candidates.getCandidates);
router.get("/candidate/delete/:id", candidates.delete);

router.get("/elections", elections.controller);
router.get("/election/:id", elections.getElection);
router.get("/election/delete/:id", elections.delete);

router.get("/users", users.getUsers);
router.get("/user/:id", users.getUser);
router.get("/user/username/:id", users.getUserByName);
router.get("/user/delete/:id", users.delete);
router.post("/user/edit/:id", users.edit);
router.post("/forgotPassword", users.forgotPassword);
router.post("/user/voted/:id", users.markVoted);

router.post("/op", a.sc);
router.post("/votingEmail", votingMail.send);

// --- OTP TRIAL ROUTES ---
router.post("/send-otp", otpTrial.send);
router.post("/verify-otp", otpTrial.verify);
router.post("/verify-face", faceAuth.verify);

export default router;
