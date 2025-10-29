import jwt from "jsonwebtoken";
import Admin from "../Models/AdminModel.js";
import User from "../Models/UserModel.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No Token Provided" });
    }

    // 🔐 Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id || !decoded.role) {
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }

    let user;

    // 🧭 Identify role and fetch user
    if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id);
    } else if (decoded.role === "User") {
      user = await User.findById(decoded.id);
    } else {
      return res.status(403).json({ error: "Unauthorized role" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Attach user data to request
    req.user = user;
    req.userId = decoded.id;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    console.error("Protect Route Error:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
