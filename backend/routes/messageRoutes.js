import express from "express";
import Message from "../models/Message.js";
import User from "../models/User.js";   // ✅ Add this import
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Get all messages between me & another user
router.get("/:userId", protect, async (req, res) => {
  const other = req.params.userId;
  const me = req.user.username;
  const messages = await Message.find({
    $or: [
      { sender: me, receiver: other },
      { sender: other, receiver: me },
    ],
  }).sort({ createdAt: 1 });

  res.json(messages);
});

// ✅ Send message
router.post("/", protect, async (req, res) => {
  const { receiver, text } = req.body;
  const sender = req.user.username;
  const msg = await Message.create({ sender, receiver, text });
  res.json(msg);
});

// ✅ Delete message
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    await message.deleteOne();

    // notify both users via socket
    req.io.emit("messageDeleted", { messageId: id });

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ NEW: Contacts with unread counts
router.get("/contacts/list", protect, async (req, res) => {
  try {
    const users = await User.find().select("username name avatar online lastSeen");
    const results = [];

    for (let u of users) {
      if (u.username === req.user.username) continue; // skip self

      const unread = await Message.countDocuments({
        sender: u.username,
        receiver: req.user.username,
        read: false,
      });

      results.push({
        ...u.toObject(),
        unread,
      });
    }

    res.json(results);
  } catch (err) {
    console.error("Contacts error:", err.message);
    res.status(500).json({ error: "Failed to load contacts" });
  }
});

export default router;
