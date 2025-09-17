import express from "express";
import Message from "../models/Message.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
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
router.post("/", protect, async (req, res) => {

  const { receiver, text } = req.body;
  const sender = req.user.username;
  const msg = await Message.create({ sender, receiver, text });
  res.json(msg);
});


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


export default router;
