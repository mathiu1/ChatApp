import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload; // get Google profile picture
    let user = await User.findOne({ username: email });
    if (!user) {
      user = await User.create({
        username: email,
        password: "google-oauth",
        avatar: picture,
        name: name,
      });
    }
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", jwtToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      user: { id: user._id, username: email, name, avatar: picture },
    }); // send avatar
  } catch (err) {
    res.status(500).json({ msg: "Google login failed" });
  }
});

router.post("/logout", protect, async (req, res) => {
  try {
    if (req.user) {
      // update last seen
      await User.findByIdAndUpdate(req.user._id, {
        online: false,
        lastSeen: new Date(),
         
      });
      //await User.findByIdAndDelete(req.user._id);
    }

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    return res.json({ msg: "User account deleted & logged out" });
  } catch (err) {
    console.error("Logout error:", err.message);
    res.status(500).json({ error: "Logout failed" });
  }
});

router.get("/users", protect, async (req, res) => {
  const users = await User.find().select(
    "username name avatar online lastSeen -_id"
  );
  const filtered = users.filter((u) => u.username !== req.user.username);
  res.json(filtered);
});

// Already logged-in user info
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
