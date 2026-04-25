import { Router } from "express";
import crypto from "crypto";
import User from "../models/User";

const router = Router();

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (String(password).length < 4) {
      return res.status(400).json({ message: "Password must be at least 4 characters" });
    }

    const existingUser = await User.findOne({ email: String(email).toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists. Please login." });
    }

    const user = await User.create({
      name,
      email,
      password: hashPassword(password),
      role: "user"
    });

    res.status(201).json({
      message: "Registration successful",
      token: makeToken(),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValid = user.password === hashPassword(password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      token: makeToken(),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

export default router;
