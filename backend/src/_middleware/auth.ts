import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../../config.json";

export interface AuthPayload {
  id: number;
  email: string;
  role: string;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

export function authorizeRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ error: "Access denied: insufficient permissions" });
      return;
    }
    next();
  };
}