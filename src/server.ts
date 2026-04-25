import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { connectDB } from "./config/db";
import deviceRoutes from "./routes/deviceRoutes";
import authRoutes from "./routes/authRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/iot-pro-dashboard";

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "IoT dashboard API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

connectDB(MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
