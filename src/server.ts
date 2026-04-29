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
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/iot-pro-dashboard";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.warn("WARNING: Set a strong JWT_SECRET in .env before production deployment.");
}

app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "IoT dashboard API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

connectDB(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
