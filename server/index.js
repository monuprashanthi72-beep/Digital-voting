import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Auth from "./Routes/AuthRoute.js";
import cors from "cors";

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

mongoose
  .connect(process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_URI)
  .then(() => console.log("Connected With DB Successfull"))
  .catch((e) => console.log("Db Connection Failed: " + e.message));

app.listen(port, () => {
  console.log(`Server is Listening on PORT ${port}`);
});
