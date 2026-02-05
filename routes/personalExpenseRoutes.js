import express from "express";
import {
  personalAddExpense,
  personalGetExpensesAll,
  personalGetExpenseById,
  personalUpdateExpense,
  personalDeleteExpense,
} from "../controllers/expenseController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, personalAddExpense);
router.get("/", protect, personalGetExpensesAll);
router.get("/:id", protect, personalGetExpenseById);
router.put("/:id", protect, personalUpdateExpense);
router.delete("/:id", protect, personalDeleteExpense);

export default router;
