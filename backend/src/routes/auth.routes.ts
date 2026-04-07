import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../_helpers/db";
import { authenticateToken } from "../_middleware/auth";
import config from "../../config.json";

const router = Router();

// POST /api/register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await db.Account.unscoped().findOne({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already exists" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.Account.create({ firstName, lastName, email, password: hashedPassword, role: "employee", verified: false });

  const verificationToken = jwt.sign({ email }, config.jwtSecret, { expiresIn: "1d" });

  res.status(201).json({
    message: "Account registered. Please verify your email.",
    verificationToken,
  });
});

// POST /api/verify-email
router.post("/verify-email", async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: "Verification token required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { email: string };
    const account = await db.Account.unscoped().findOne({ where: { email: decoded.email } });

    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    if (account.verified) {
      res.status(400).json({ error: "Account already verified" });
      return;
    }

    await account.update({ verified: true });
    res.json({ message: "Email verified successfully" });
  } catch {
    res.status(403).json({ error: "Invalid or expired verification token" });
  }
});

// POST /api/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  const account = await db.Account.scope("withPassword").findOne({ where: { email } });

  if (!account || !(await bcrypt.compare(password, account.password))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (!account.verified) {
    res.status(403).json({ error: "Account not verified. Please verify your email first." });
    return;
  }

  const token = jwt.sign(
    { id: account.id, email: account.email, role: account.role },
    config.jwtSecret,
    { expiresIn: "1h" }
  );

  res.json({
    token,
    user: {
      id: account.id,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      role: account.role,
    },
  });
});

// GET /api/profile
router.get("/profile", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const account = await db.Account.findByPk(req.user!.id);
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json(account);
});

// PUT /api/profile
router.put("/profile", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName } = req.body;

  if (!firstName || !lastName) {
    res.status(400).json({ error: "First name and last name are required" });
    return;
  }

  const account = await db.Account.findByPk(req.user!.id);
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  await account.update({ firstName, lastName });
  res.json({
    message: "Profile updated",
    user: { id: account.id, firstName: account.firstName, lastName: account.lastName, email: account.email, role: account.role },
  });
});

export default router;