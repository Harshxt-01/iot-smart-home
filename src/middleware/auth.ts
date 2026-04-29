import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/security";

export type AuthRequest = Request & {
  user?: {
    id: string;
    email: string;
    role: string;
  };
};

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.header("authorization") || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ success: false, message: "Login required" });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired session. Please login again." });
  }
}
