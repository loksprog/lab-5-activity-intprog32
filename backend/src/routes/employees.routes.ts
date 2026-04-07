import { Router, Request, Response } from "express";
import { db } from "../_helpers/db";
import { authenticateToken, authorizeRole } from "../_middleware/auth";

const router = Router();

// GET /api/employees
router.get("/", authenticateToken, authorizeRole("admin"), async (_req: Request, res: Response): Promise<void> => {
  const employees = await db.Employee.findAll();
  res.json(employees);
});

// POST /api/employees
router.post("/", authenticateToken, authorizeRole("admin"), async (req: Request, res: Response): Promise<void> => {
  const { employeeId, userEmail, position, departmentId, hireDate } = req.body;

  if (!employeeId || !userEmail || !position || !departmentId || !hireDate) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  const accountExists = await db.Account.unscoped().findOne({ where: { email: userEmail } });
  if (!accountExists) {
    res.status(404).json({ error: "User email must match an existing account" });
    return;
  }

  const idExists = await db.Employee.findOne({ where: { employeeId } });
  if (idExists) {
    res.status(409).json({ error: "Employee ID already exists" });
    return;
  }

  const deptExists = await db.Department.findByPk(parseInt(departmentId));
  if (!deptExists) {
    res.status(404).json({ error: "Department not found" });
    return;
  }

  const employee = await db.Employee.create({ employeeId, userEmail, position, departmentId: parseInt(departmentId), hireDate });
  res.status(201).json({ message: "Employee added", employee });
});

// PUT /api/employees/:employeeId
router.put("/:employeeId", authenticateToken, authorizeRole("admin"), async (req: Request, res: Response): Promise<void> => {
  const { employeeId } = req.params;
  const employee = await db.Employee.findOne({ where: { employeeId } });

  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  const { userEmail, position, departmentId, hireDate } = req.body;

  const accountExists = await db.Account.unscoped().findOne({ where: { email: userEmail } });
  if (!accountExists) {
    res.status(404).json({ error: "User email must match an existing account" });
    return;
  }

  const deptExists = await db.Department.findByPk(parseInt(departmentId));
  if (!deptExists) {
    res.status(404).json({ error: "Department not found" });
    return;
  }

  await employee.update({ userEmail, position, departmentId: parseInt(departmentId), hireDate });
  res.json({ message: "Employee updated", employee });
});

// DELETE /api/employees/:employeeId
router.delete("/:employeeId", authenticateToken, authorizeRole("admin"), async (req: Request, res: Response): Promise<void> => {
  const { employeeId } = req.params;
  const employee = await db.Employee.findOne({ where: { employeeId } });

  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  await employee.destroy();
  res.json({ message: "Employee deleted" });
});

export default router;