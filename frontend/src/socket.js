import { io } from "socket.io-client";
const socket = io(import.meta.env.VITE_API_URL || "https://chatapp-250t.onrender.com", {
  withCredentials: true,
});
export default socket;
