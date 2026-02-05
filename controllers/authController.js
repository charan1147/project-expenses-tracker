import User from "../models/User.js";
import { generateToken } from "../config/genrateToken.js";

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res
      .status(400)
      .json({ success: false, message: "All fields required" });

  if (await User.findOne({ email }))
    return res
      .status(409)
      .json({ success: false, message: "Email already exists" });

  const user = await User.create({ username, email, password });

  res.status(201).json({
    success: true,
    token: generateToken(user._id),
    user: { id: user._id, username, email },
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: "Missing credentials" });

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password)))
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });

  res.json({
    success: true,
    token: generateToken(user._id),
    user: { id: user._id, username: user.username, email },
  });
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json({ success: true, user });
};
