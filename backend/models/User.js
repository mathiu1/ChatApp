import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: String,
  avatar: String,
  password: String,
  online: { type: Boolean, default: false },
  lastSeen: { type: Date, default: null },
});

export default mongoose.model("User", userSchema);
