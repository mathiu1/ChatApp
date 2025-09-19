import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token = null;

    //  Try from cookie
    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    //  If not in cookie, try Authorization header
    else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    //  No token found
    if (!token) {
      return res.status(401).json({ msg: "No token, not authorized" });
    }

    //  Verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //  Get user without password
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ msg: "Token invalid or expired" });
  }
};
