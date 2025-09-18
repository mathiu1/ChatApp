import React, { useState, useRef, useEffect } from "react";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Trash2 } from "lucide-react";

export default function ChatBox({ messages, onSend, selectedUser }) {

const API_URL = import.meta.env.VITE_API_URL;

  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const endRef = useRef();
  const longPressTimer = useRef(null);
  const { user } = useAuth();

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Typing indicator
  useEffect(() => {
    if (!selectedUser) return;
    const handleTyping = ({ sender }) => {
      if (sender === selectedUser.username) setIsTyping(true);
    };
    const handleStopTyping = ({ sender }) => {
      if (sender === selectedUser.username) setIsTyping(false);
    };
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [selectedUser?.username]);

  const handleChange = (e) => {
    setText(e.target.value);
    if (!typing) {
      setTyping(true);
      socket.emit("typing", {
        sender: user.username,
        receiver: selectedUser?.username,
      });
    }
    clearTimeout(window._typingTimeout);
    window._typingTimeout = setTimeout(() => {
      setTyping(false);
      socket.emit("stopTyping", {
        sender: user.username,
        receiver: selectedUser?.username,
      });
    }, 1200);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    setTyping(false);
    socket.emit("stopTyping", {
      sender: user.username,
      receiver: selectedUser?.username,
    });
  };

  // Mark read
  useEffect(() => {
    if (!selectedUser || messages.length === 0) return;
    const unread = messages.filter(
      (m) => m.sender === selectedUser.username && !m.read
    );
    if (unread.length > 0) {
      socket.emit("markRead", {
        messageIds: unread.map((m) => m._id),
        sender: selectedUser.username,
        receiver: user.username,
      });
    }
  }, [messages.length, selectedUser?.username, user.username]);

  // Delete message
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/messages/${id}`);
      socket.emit("deleteMessage", { messageId: id });
      setSelectedMessage(null);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // Long press (mobile)
  const handleTouchStart = (id) => {
    longPressTimer.current = setTimeout(() => {
      setSelectedMessage(id);
    }, 600);
  };
  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  return (
    <div
      className="flex flex-col h-[36rem] md:h-full bg-white rounded-lg shadow relative"
      onClick={() => setSelectedMessage(null)}
    >
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b bg-white md:static fixed top-14 left-0 right-0 z-10 shadow-sm">
        {selectedUser?.avatar && (
          <img
            src={selectedUser.avatar}
            alt="avatar"
            className="w-10 h-10 rounded-full border shadow-sm"
          />
        )}
        <div>
          <div className="font-semibold text-gray-900 text-base">
            {selectedUser?.name || selectedUser?.username}
          </div>
          {isTyping ? (
            <div className="italic text-blue-500 text-xs">typing...</div>
          ) : selectedUser?.online ? (
            <div className="text-xs text-green-500 font-medium">Online</div>
          ) : selectedUser?.lastSeen ? (
            <div className="text-xs text-gray-500">
              last seen{" "}
              {new Date(selectedUser.lastSeen).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          ) : (
            <div className="text-xs text-gray-400">Offline</div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 space-y-3 md:pt-5 pt-20 md:pb-0 pb-20">
        {messages.map((m, i) => {
          const mine = m.sender === user.username;
          return (
            <div
              key={m._id || i}
              className={`flex items-end ${
                mine ? "justify-end" : "justify-start"
              }`}
              onContextMenu={(e) => {
                e.preventDefault();
                if (mine) setSelectedMessage(m._id);
              }}
              onTouchStart={() => mine && handleTouchStart(m._id)}
              onTouchEnd={handleTouchEnd}
            >
              {!mine && (
                <img
                  src={m.senderAvatar}
                  alt="avatar"
                  className="w-8 h-8 rounded-full mr-2 shadow-sm"
                />
              )}

              <div
                className={`relative max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                  mine
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                } ${selectedMessage === m._id ? "ring-2 ring-red-400" : ""}`}
              >
                <div className="text-sm leading-snug">{m.text}</div>
                <div className="text-[11px] mt-1 flex items-center justify-end gap-1">
                  <span className="opacity-70">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {mine && (
                    <span className="text-xs">{m.read ? "✓✓" : "✓"}</span>
                  )}
                </div>

                {/* Delete button */}
                {mine && selectedMessage === m._id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(m._id);
                    }}
                    className="absolute -top-7 right-0 flex items-center gap-1 text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded shadow-md"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
              </div>

              {mine && (
                <img
                  src={user.avatar}
                  alt="me"
                  className="w-8 h-8 rounded-full ml-2 shadow-sm"
                />
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={submit}
        className="flex items-center gap-2 p-3 border-t bg-gray-50 md:static fixed bottom-0 left-0 right-0 z-10"
      >
        <input
          value={text}
          onChange={handleChange}
          placeholder={`Message ${
            selectedUser?.name || selectedUser?.username
          }...`}
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white shadow-sm"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-medium shadow-md transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
