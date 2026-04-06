import express from "express";
import dotenv from "dotenv";
import Auth from "./Routes/AuthRoute.js";
import cors from "cors";
import "./utils/firebase.js";

dotenv.config();
const app = express();
app.use(express.json());
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: "*", // Allow all for the demo to avoid Vercel blocking
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use("/api/auth", Auth);
app.use("/Faces", express.static("Faces"));

// Database initialization moved to utils/firebase.js

app.get("/", (req, res) => res.send("Digital Voting API - Live on Firestore"));

app.listen(port, () => {
  console.log(`Server is Listening on PORT ${port}`);
});
