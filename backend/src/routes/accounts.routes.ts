import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../_helpers/db";
import { authenticateToken, authorizeRole } from "../_middleware/auth";

const router = Router();

// GET /api/accounts
router.get("/", authenticateToken, authorizeRole("admin"), async (_req: Request, res: Response): Promise<void> => {
  const accounts = await db.Account.findAll();
  res.json(accounts);
});

// POST /api/accounts
router.post("/", authenticateToken, authorizeRole("admin"), async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password, role, verified } = req.body;

  if (!firstName || !lastName || !email || !password || !role) {
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
  const account = await db.Account.create({ firstName, lastName, email, password: hashedPassword, role, verified: verified || false });
  const safe = await db.Account.findByPk(account.id);
  res.status(201).json({ message: "Account created", account: safe });
});

// PUT /api/accounts/:id
router.put("/:id", authenticateToken, authorizeRole("admin"), async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const account = await db.Account.unscoped().findByPk(id);

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  const { firstName, lastName, email, password, role, verified } = req.body;

  const emailConflict = email ? await db.Account.unscoped().findOne({ where: { email } }) : null;
  if (emailConflict && emailConflict.id !== id) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const updatedPassword = password && password.length >= 6
    ? await bcrypt.hash(password, 10)
    : account.password;

  await account.update({
    firstName: firstName || account.firstName,
    lastName: lastName || account.lastName,
    email: email || account.email,
    password: updatedPassword,
    role: role || account.role,
    verified: verified !== undefined ? verified : account.verified,
  });

  const safe = await db.Account.findByPk(id);
  res.json({ message: "Account updated", account: safe });
});

// PUT /api/accounts/:id/reset-password
router.put("/:id/reset-password", authenticateToken, authorizeRole("admin"), async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const account = await db.Account.unscoped().findByPk(id);

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  await account.update({ password: await bcrypt.hash(newPassword, 10) });
  res.json({ message: "Password reset successfully" });
});

// DELETE /api/accounts/:id
router.delete("/:id", authenticateToken, authorizeRole("admin"), async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));

  if (req.user!.id === id) {
    res.status(403).json({ error: "You cannot delete your own account" });
    return;
  }

  const account = await db.Account.findByPk(id);
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  await account.destroy();
  res.json({ message: "Account deleted" });
});

export default router;