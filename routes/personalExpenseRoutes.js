import express from "express";
import {
  personalAddExpense,
  personalGetExpensesAll,
  personalGetExpenseById,
  personalUpdateExpense,
  personalDeleteExpense,
  getAllExpenses,
} from "../controllers/expenseController.js";
import { protect } from "../middlewares/authMiddleware.js"; // Assuming routes are protected

const router = express.Router();

router.post("/", protect, personalAddExpense);
router.get("/", protect, personalGetExpensesAll);
router.get("/:id", protect, personalGetExpenseById);
router.put("/:id", protect, personalUpdateExpense);
router.delete("/:id", protect, personalDeleteExpense);
router.get("/admin/all", protect, getAllExpenses);

export default router;
