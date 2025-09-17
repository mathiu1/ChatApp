import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});
export default mongoose.model("Message", messageSchema);
