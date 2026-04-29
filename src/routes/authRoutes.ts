import { Router, Response } from "express";
import User from "../models/User";
import {
  createPasswordResetToken,
  hashPassword,
  hashPasswordResetToken,
  signToken,
  verifyPassword
} from "../utils/security";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
const RESET_TOKEN_EXPIRES_MS = 15 * 60 * 1000;

function normalizeEmail(email: unknown): string {
  return String(email || "").trim().toLowerCase();
}

function safeUser(user: any) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    homeLocation: user.homeLocation || "",
    role: user.role
  };
}

function createSession(user: any) {
  const publicUser = safeUser(user);
  return {
    token: signToken({ id: publicUser.id, email: publicUser.email, role: publicUser.role }),
    user: publicUser
  };
}

function getBaseUrl(req: AuthRequest): string {
  return process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
}

router.post("/register", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      res.status(400).json({ message: "Name, email and password are required" });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ message: "Please enter a valid email address" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: "User already exists. Please login." });
      return;
    }

    const user = await User.create({
      name,
      email,
      password: hashPassword(password),
      role: "user"
    });

    res.status(201).json({ message: "Registration successful", ...createSession(user) });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !verifyPassword(password, user.password)) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    res.json({ message: "Login successful", ...createSession(user) });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

router.post("/forgot-password", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    const user = await User.findOne({ email }).select("+resetPasswordTokenHash +resetPasswordExpires");

    // Same response for existing and non-existing emails to prevent account enumeration.
    const publicMessage = "If this email is registered, a password reset link has been generated.";
    if (!user) {
      res.json({ message: publicMessage });
      return;
    }

    const resetToken = createPasswordResetToken();
    user.resetPasswordTokenHash = hashPasswordResetToken(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES_MS);
    await user.save();

    const resetLink = `${getBaseUrl(req)}/reset-password.html?token=${resetToken}`;

    res.json({
      message: publicMessage,
      resetLink,
      note: "Demo mode: copy this reset link. In production, send it by email instead of returning it in the API response."
    });
  } catch (error) {
    res.status(500).json({ message: "Could not create reset link" });
  }
});

router.post("/reset-password", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = String(req.body.token || "").trim();
    const password = String(req.body.password || "");

    if (!token || !password) {
      res.status(400).json({ message: "Reset token and new password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    const user = await User.findOne({
      resetPasswordTokenHash: hashPasswordResetToken(token),
      resetPasswordExpires: { $gt: new Date() }
    }).select("+resetPasswordTokenHash +resetPasswordExpires +password");

    if (!user) {
      res.status(400).json({ message: "Reset link is invalid or expired" });
      return;
    }

    user.password = hashPassword(password);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful. Please login with your new password." });
  } catch (error) {
    res.status(500).json({ message: "Password reset failed" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user?.id).select("name email phone homeLocation role");
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({ user: safeUser(user) });
});

router.put("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select("+password name email phone homeLocation role");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const phone = String(req.body.phone || "").trim();
    const homeLocation = String(req.body.homeLocation || "").trim();
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!name || name.length < 2) {
      res.status(400).json({ message: "Name must be at least 2 characters" });
      return;
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ message: "Please enter a valid email address" });
      return;
    }

    const emailOwner = await User.findOne({ email, _id: { $ne: user._id } });
    if (emailOwner) {
      res.status(409).json({ message: "This email is already used by another account" });
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        res.status(400).json({ message: "New password must be at least 6 characters" });
        return;
      }
      if (!currentPassword || !verifyPassword(currentPassword, user.password)) {
        res.status(401).json({ message: "Current password is incorrect" });
        return;
      }
      user.password = hashPassword(newPassword);
    }

    user.name = name;
    user.email = email;
    user.phone = phone;
    user.homeLocation = homeLocation;
    await user.save();

    res.json({ message: "Profile updated successfully", ...createSession(user) });
  } catch (error) {
    res.status(500).json({ message: "Profile update failed" });
  }
});

export default router;
