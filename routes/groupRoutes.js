import express from "express";
import {
  createGroup,
  updateGroup,
  deleteGroup,
  addGroupExpense,
  getGroupExpenses,
  getAllGroups,
  calculateExpenseSplitting,
  getGroupById,
} from "../controllers/groupController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createGroup);
router.get("/", protect, getAllGroups);
router.get("/:groupId", protect, getGroupById);
router.put("/:groupId", protect, updateGroup);
router.delete("/:groupId", protect, deleteGroup);
router.post("/:groupId/expenses", protect, addGroupExpense);
router.get("/:groupId/expenses", protect, getGroupExpenses);
router.get("/:groupId/split", protect, calculateExpenseSplitting);

export default router;
