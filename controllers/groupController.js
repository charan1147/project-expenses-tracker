import Group from "../models/Group.js";
import Expense from "../models/Expense.js";
import User from "../models/User.js";


export const createGroup = async (req, res) => {
  try {
    const { name, description, members = [] } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Group name required" });
    }


    const users = await User.find({
      $or: [
        { email: { $in: members } },
        { username: { $in: members } },
      ],
    }).select("_id");


    const memberIds = [
      req.user.id,
      ...users.map((u) => u._id.toString()),
    ];
    const uniqueMembers = [...new Set(memberIds)];

    const group = await Group.create({
      name,
      description,
      createdBy: req.user.id,
      members: uniqueMembers,
    });

    res.status(201).json({ success: true, data: group });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error: " + error.message });
  }
};


export const updateGroup = async (req, res) => {
  try {
    const { name, description } = req.body;

    const group = await Group.findOneAndUpdate(
      { _id: req.params.groupId, createdBy: req.user.id },
      { name, description },
      { new: true }
    );

    if (!group) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized action" });
    }

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error: " + error.message });
  }
};


export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findOneAndDelete({
      _id: req.params.groupId,
      createdBy: req.user.id,
    });

    if (!group) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized action" });
    }

    res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error: " + error.message });
  }
};


export const addGroupExpense = async (req, res) => {
  try {
    const { amount, category, date, description } = req.body;

    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const isMember = group.members.some(
      (memberId) => memberId.toString() === req.user.id
    );

    if (!isMember) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized" });
    }

    const expense = await Expense.create({
      userId: req.user.id,
      groupId: group._id,
      amount,
      category,
      date,
      description,
    });

    group.expenses.push(expense._id);
    await group.save();

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error: " + error.message });
  }
};


export const getGroupExpenses = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate({
      path: "expenses",
      populate: { path: "userId", select: "username" },
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    res.status(200).json({ success: true, data: group.expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("createdBy", "username email")
      .populate("members", "username email")
      .populate("expenses");

    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error: " + error.message });
  }
};


export const calculateExpenseSplitting = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("members", "username")
      .populate({
        path: "expenses",
        populate: { path: "userId", select: "username" },
      });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const memberIds = group.members.map((m) => m._id.toString());

    const splitResult = group.expenses.map((expense) => {
      const payerId = expense.userId?._id?.toString();
      const payerName = expense.userId?.username || "Unknown";
      const totalAmount = Number(expense.amount);
      const share = totalAmount / memberIds.length;

      const debts = memberIds
        .filter((id) => id !== payerId)
        .map((id) => ({
          username: group.members.find(
            (m) => m._id.toString() === id
          ).username,
          owes: share,
        }));

      return {
        expenseId: expense._id,
        description: expense.description || "No description",
        payer: payerName,
        totalAmount,
        debts,
      };
    });

    res.status(200).json({ success: true, data: splitResult });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("members", "username")
      .populate({
        path: "expenses",
        populate: { path: "userId", select: "username" },
      });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
