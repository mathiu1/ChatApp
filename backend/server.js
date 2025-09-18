import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import Message from "./models/Message.js";
import User from "./models/User.js";

import path from "path";
import { fileURLToPath } from "url";

// ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "config/config.env") });

connectDB();
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({ origin: "https://chatapp-friends.netlify.app", credentials: true })
);

app.get("/ping", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

app.use("/api/auth", authRoutes);
app.use((req, res, next) => {
  req.io = io; // attach socket instance
  next();
});
app.use("/api/messages", messageRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "https://chatapp-friends.netlify.app", credentials: true },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  // Add user
  socket.on("addUser", async (username) => {
    onlineUsers.set(username, socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));

    // mark DB user online
    await User.findOneAndUpdate(
      { username },
      { online: true },
      { new: true }
    ).exec();
  });

  // Send message
  socket.on("sendMessage", async ({ sender, receiver, text }) => {
    const saved = await Message.create({ sender, receiver, text });

    const receiverSocket = onlineUsers.get(receiver);
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", saved);
    }

    socket.emit("receiveMessage", saved); // back to sender
  });

  // Typing indicators
  socket.on("typing", ({ sender, receiver }) => {
    const receiverSocket = onlineUsers.get(receiver);
    if (receiverSocket) io.to(receiverSocket).emit("typing", { sender });
  });

  socket.on("stopTyping", ({ sender, receiver }) => {
    const receiverSocket = onlineUsers.get(receiver);
    if (receiverSocket) io.to(receiverSocket).emit("stopTyping", { sender });
  });

  // Read receipts (batch)
  socket.on("markRead", async ({ messageIds, sender, receiver }) => {
    try {
      if (!Array.isArray(messageIds)) return;

      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $set: { read: true } }
      );

      const senderSocket = onlineUsers.get(sender);
      if (senderSocket) {
        io.to(senderSocket).emit("messagesRead", { messageIds });
      }
    } catch (err) {
      console.error("Error marking messages as read:", err.message);
    }
  });

  // Disconnect
  socket.on("disconnect", async () => {
    for (const [username, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(username);
        io.emit("onlineUsers", Array.from(onlineUsers.keys()));

        await User.findOneAndUpdate(
          { username },
          { online: false, lastSeen: new Date() },
          { new: true }
        ).exec();
      }
    }
  });

  //deletemsg
  socket.on("deleteMessage", async ({ messageId }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      await msg.deleteOne();

      // notify both users
      io.emit("messageDeleted", { messageId });
    } catch (err) {
      console.error("Delete failed:", err.message);
    }
  });
});

server.listen(process.env.PORT, () => {
  console.log(` Server running on ${process.env.PORT}`);


 const PING_URL = "https://chatapp-250t.onrender.com/ping";
  setInterval(async () => {
    try {
      const res = await axios.get(PING_URL);
      console.log("Self-ping success:", res.status);
    } catch (err) {
      console.error("Self-ping failed:", err.message);
    }
  }, 5 * 60 * 1000);


});
