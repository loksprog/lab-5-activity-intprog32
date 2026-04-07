import { Router, Request, Response } from "express";
import { Op } from "sequelize";
import { db } from "../_helpers/db";
import { authenticateToken, authorizeRole } from "../_middleware/auth";

const router = Router();

// GET /api/departments
router.get("/", authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  const departments = await db.Department.findAll();
  res.json(departments);
});

// POST /api/departments
router.post("/", authenticateToken, authorizeRole("admin"), async (req: Request, res: Response): Promise<void> => {
  const { name, description } = req.body;

  if (!name || !description) {
    res.status(400).json({ error: "Name and description are required" });
    return;
  }

  const nameExists = await db.Department.findOne({ where: { name } });
  if (nameExists) {
    res.status(409).json({ error: "Department name already exists" });
    return;
  }

  const dept = await db.Department.create({ name, description });
  res.status(201).json({ message: "Department created", department: dept });
});

// PUT /api/departments/:id
router.put("/:id", authenticateToken, authorizeRole("admin"), async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const dept = await db.Department.findByPk(id);

  if (!dept) {
    res.status(404).json({ error: "Department not found" });
    return;
  }

  const { name, description } = req.body;

  const nameConflict = await db.Department.findOne({
    where: { name, id: { [Op.ne]: id } },
  });
  if (nameConflict) {
    res.status(409).json({ error: "Department name already exists" });
    return;
  }

  await dept.update({
    name: name || dept.name,
    description: description || dept.description,
  });
  res.json({ message: "Department updated", department: dept });
});

// DELETE /api/departments/:id
router.delete("/:id", authenticateToken, authorizeRole("admin"), async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const dept = await db.Department.findByPk(id);

  if (!dept) {
    res.status(404).json({ error: "Department not found" });
    return;
  }

  const hasEmployees = await db.Employee.findOne({ where: { departmentId: id } });
  if (hasEmployees) {
    res.status(409).json({ error: "Cannot delete department with existing employees" });
    return;
  }

  await dept.destroy();
  res.json({ message: "Department deleted" });
});

export default router;