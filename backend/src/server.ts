import express, { Application } from "express";
import cors from "cors";
import { initialize } from "./_helpers/db";
import { errorHandler } from "./_middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import accountRoutes from "./routes/accounts.routes";
import departmentRoutes from "./routes/departments.routes";
import employeeRoutes from "./routes/employees.routes";
import requestRoutes from "./routes/requests.routes";

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: ["http://127.0.0.1:5500", "http://localhost:5500"] }));

// Routes
app.use("/api", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/requests", requestRoutes);

// Global error handler
app.use(errorHandler);

// Start
initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Backend running on http://localhost:${PORT}`);
      console.log(`🔑 Default login: admin@example.com / Password123!`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to initialize database:", err);
    process.exit(1);
  });