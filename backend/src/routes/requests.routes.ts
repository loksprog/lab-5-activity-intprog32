import { Router, Request, Response } from "express";
import { db } from "../_helpers/db";
import { authenticateToken } from "../_middleware/auth";

const router = Router();

// GET /api/requests
router.get("/", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const requests = await db.Request.findAll({ where: { employeeEmail: req.user!.email } });
  const parsed = requests.map((r) => ({
    ...r.toJSON(),
    items: JSON.parse(r.items),
  }));
  res.json(parsed);
});

// POST /api/requests
router.post("/", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { type, items } = req.body;

  if (!type || !items || items.length === 0) {
    res.status(400).json({ error: "Type and at least one item are required" });
    return;
  }

  const newRequest = await db.Request.create({
    type,
    items: JSON.stringify(items),
    status: "Pending",
    date: new Date().toISOString().split("T")[0],
    employeeEmail: req.user!.email,
  });

  res.status(201).json({
    message: "Request submitted",
    request: { ...newRequest.toJSON(), items },
  });
});

export default router;