import Admin from "../Models/AdminModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../Models/UserModel.js";

/**
 * @desc Admin Signup
 * @route POST /api/admin/signup
 */
export const adminSignup = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate inputs
    if (!username || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already registered with this username." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin
    const newAdmin = await Admin.create({
      username,
      password: hashedPassword,
      role: "admin",
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newAdmin._id, username: newAdmin.username, role: newAdmin.role },
      process.env.JWT_SECRET || "your_jwt_secret_key",
      { expiresIn: "30d" }
    );

    res.status(201).json({
      message: "Admin registered successfully.",
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        role: newAdmin.role,
      },
      token,
    });
  } catch (error) {
    console.error("Error during admin signup:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc Admin Login
 * @route POST /api/admin/login
 */
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // ✅ Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // ✅ Check if admin exists
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET || "your_jwt_secret_key",
      { expiresIn: "30d" }
    );

    // ✅ Store token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true, // prevents JS access// true in production (HTTPS)
      sameSite: "None", // required for cross-origin requests
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // ✅ Respond without exposing the token
    res.status(200).json({
      message: "Login successful.",
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        token
      },
    });

  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createUserByAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: "User",
    });

    res.status(200).json({
      message: "User created successfully by Admin.",
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



