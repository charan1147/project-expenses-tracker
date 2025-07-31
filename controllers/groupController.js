import Group from "../models/Group.js";
import Expense from "../models/Expense.js";
import User from "../models/User.js";

export const createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Group name is required" });

    const existingGroup = await Group.findOne({ name });
    if (existingGroup)
      return res
        .status(400)
        .json({ success: false, message: "Group name already exists" });

    const memberIds = new Set([req.user.id]);

    if (Array.isArray(members) && members.length) {
      const foundUsers = await User.find({
        $or: [{ username: { $in: members } }, { email: { $in: members } }],
      }).select("_id");
      foundUsers.forEach((user) => memberIds.add(user._id.toString()));
    }

    const group = await new Group({
      name,
      description,
      createdBy: req.user.id,
      members: Array.from(memberIds),
    }).save();

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

    if (!group)
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized action" });

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

    if (!group)
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized action" });

    res
      .status(200)
      .json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error: " + error.message });
  }
};

export const addGroupExpense = async (req, res) => {
  try {
    const { amount, category, date, description } = req.body;

    if (!amount || !category || !date || isNaN(amount)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid amount, category, and date are required",
        });
    }

    const group = await Group.findById(req.params.groupId);
    if (!group || !group.members.includes(req.user.id)) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to add expenses" });
    }

    const expense = await new Expense({
      userId: req.user.id,
      amount,
      category,
      date: new Date(date),
      description,
    }).save();

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
    const group = await Group.findById(req.params.groupId).populate(
      "expenses",
      "userId amount category date description"
    );

    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    const expenses = await Expense.find({
      _id: { $in: group.expenses },
    }).populate("userId", "username");

    res.json({ success: true, data: expenses });
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

    if (!groups.length)
      return res
        .status(404)
        .json({ success: false, message: "No groups found" });

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

    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    const uniqueMembers = [
      ...new Set(group.members.map((m) => m._id.toString())),
    ];

    const splitResult = group.expenses.map((expense) => {
      const payerId = expense.userId?._id?.toString();
      const payerUsername = expense.userId?.username || "Unknown";
      const totalAmount = Number(expense.amount);
      const sharePerMember = totalAmount / uniqueMembers.length;

      const debts = uniqueMembers
        .filter((id) => id !== payerId)
        .map((id) => ({
          username: group.members.find((m) => m._id.toString() === id).username,
          owes: sharePerMember,
        }));

      return {
        expenseId: expense._id,
        description: expense.description || "No description",
        payer: payerUsername,
        totalAmount,
        debts,
      };
    });

    res.json({ success: true, data: splitResult });
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

    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    res.json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
