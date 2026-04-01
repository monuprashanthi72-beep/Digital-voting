import express from "express";
import AuthController from "../Controller/AuthController.js";

const { login, register, otpTrial, blockchain } = AuthController;
const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/otp", otpTrial);

// Blockchain Routes
router.post("/cast-vote", blockchain.castVote);
router.get("/get-transactions", blockchain.getTransactions);

export default router;
