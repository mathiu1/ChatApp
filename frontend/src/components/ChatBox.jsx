import React, { useState, useRef, useEffect } from "react";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";

import { Trash2, Loader2 } from "lucide-react";
import api from "../api/axiosClient";
import { SendHorizontal } from "lucide-react";

export default function ChatBox({ messages, onSend, selectedUser, loading }) {
  

  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [preview, setPreview] = useState(null); // 🔹 For avatar modal
  const endRef = useRef();
  const longPressTimer = useRef(null);
  const { user } = useAuth();

  // Auto scroll on new messages
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
      await api.delete(`/api/messages/${id}`);
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

  //  Group messages by day
  const groupMessagesByDate = () => {
    const groups = {};
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      let label;

      if (msgDate.toDateString() === today.toDateString()) {
        label = "Today";
      } else if (msgDate.toDateString() === yesterday.toDateString()) {
        label = "Yesterday";
      } else {
        label = msgDate.toLocaleDateString([], {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(msg);
    });

    return groups;
  };

  const grouped = groupMessagesByDate();

  return (
    <div
      className="flex flex-col h-full md:h-screen bg-[#181826] rounded-lg shadow-xl relative"
      onClick={() => setSelectedMessage(null)}
    >
      {/* Header */}
      <header
        className="
          flex items-center gap-3 p-4 border-b border-white/10 bg-[#1f1f2e] shadow
          fixed top-[56px] left-0 right-0 z-10
          md:sticky  md:z-10
        "
      >
        {selectedUser?.avatar && (
          <img
            src={selectedUser.avatar}
            alt="avatar"
            className="w-10 h-10 rounded-full border border-white/20 shadow-sm"
            onClick={(e) => {
              e.stopPropagation(); //  prevent selecting user
              setPreview(selectedUser.avatar);
            }}
          />
        )}
        <div>
          <div className="font-semibold text-white text-base">
            {selectedUser?.name || selectedUser?.username}
          </div>
          {isTyping ? (
            <div className="italic text-pink-500 text-xs">typing...</div>
          ) : selectedUser?.online ? (
            <div className="text-xs text-green-500 font-medium">Online</div>
          ) : selectedUser?.lastSeen ? (() => {
                            const lastSeenDate = new Date(selectedUser?.lastSeen);
                            const today = new Date();
                            const yesterday = new Date();
                            yesterday.setDate(today.getDate() - 1);

                            if (
                              lastSeenDate.toDateString() ===
                              today.toDateString()
                            ) {
                              return <div className="text-gray-400">last seen {lastSeenDate.toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}</div>;
                            } else if (
                              lastSeenDate.toDateString() ===
                              yesterday.toDateString()
                            ) {
                              return <div className="text-gray-400">yesterday {lastSeenDate.toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}</div>;
                            } else {
                              return <div className="text-gray-400">{lastSeenDate.toLocaleDateString([], {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })},{lastSeenDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}</div>;
                            }
                          })() : (
            <div className="text-xs text-gray-500">Offline</div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div
        className="
          flex-1 overflow-y-auto px-3
          pt-[120px] md:pt-8 md:pb-28 pb-24
        "
      >
        {loading ? (
          //  Loader + Skeleton
          <div className="flex flex-col gap-4 items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
            <div className="w-full flex flex-col gap-2 px-6">
              <div className="w-1/2 h-5 bg-gray-200 rounded-lg animate-pulse" />
              <div className="w-1/3 h-5 bg-gray-200 rounded-lg animate-pulse self-end" />
              <div className="w-2/3 h-5 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        ) : (
          Object.keys(grouped).map((dateLabel) => (
            <div key={dateLabel}>
              {/* 📌 Date Divider */}
              <div className="flex justify-center my-6">
                <span
                  className="
                    bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200
                    text-gray-700 text-xs font-semibold
                    px-4 py-2.5
                    rounded-full shadow-sm border border-gray-300
                    backdrop-blur-sm
                  "
                >
                  {dateLabel}
                </span>
              </div>

              {grouped[dateLabel].map((m, i) => {
                const mine = m.sender === user.username;
                const isOptimistic = !m._id || typeof m._id === "number";

                return (
                  <div
                    key={m._id || i}
                    className={`flex items-end ${
                      mine ? "justify-end" : "justify-start"
                    } mt-4 mb-2`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (mine && !isOptimistic) setSelectedMessage(m._id);
                    }}
                    onTouchStart={() =>
                      mine && !isOptimistic && handleTouchStart(m._id)
                    }
                    onTouchEnd={handleTouchEnd}
                  >
                    {/*  Always show avatar */}
                    {!mine && (
                      <img
                        src={m.senderAvatar}
                        alt="avatar"
                        className="w-8 h-8 rounded-full mr-2 shadow-sm"
                      />
                    )}

                    <div
                      className={`relative max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
                        mine
                          ? "bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 text-white rounded-br-none shadow-lg border border-white/10"
                          : "bg-white/10 text-gray-100 rounded-bl-none"
                      } ${
                        selectedMessage === m._id ? "ring-2 ring-red-400" : ""
                      }`}
                      
                    >
                      <div
                        className={`text-sm leading-snug whitespace-pre-wrap break-words break-all overflow-hidden ${
                          mine ? "text-white" : "text-white"
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: m.text
                            //  URLs (http, https, www.)
                            .replace(
                              /((https?:\/\/[^\s]+)|(www\.[^\s]+))/g,
                              (match) => {
                                let url = match.startsWith("http")
                                  ? match
                                  : `https://${match}`;
                                let display =
                                  match.length > 40
                                    ? match.slice(0, 37) + "..."
                                    : match;

                                let linkClass = mine
                                  ? "text-white underline"
                                  : "text-blue-500 underline";

                                return `<a href="${url}" target="_blank" rel="noopener noreferrer" title="${url}" class="${linkClass} break-words break-all">${display}</a>`;
                              }
                            )
                            //  Emails
                            .replace(
                              /([\w.-]+@[\w.-]+\.[A-Za-z]{2,})/g,
                              (match) => {
                                let linkClass = mine
                                  ? "text-white underline"
                                  : "text-blue-500 underline";
                                return `<a href="mailto:${match}" title="Send email to ${match}" class="${linkClass} break-words break-all">${match}</a>`;
                              }
                            )
                            //  Phone numbers
                            .replace(/(\+?\d[\d\s-]{7,}\d)/g, (match) => {
                              const tel = match.replace(/[\s-]/g, "");
                              let linkClass = mine
                                ? "text-white underline"
                                : "text-blue-500 underline";
                              return `<a href="tel:${tel}" title="Call ${match}" class="${linkClass} break-words break-all">${match}</a>`;
                            }),
                        }}
                      ></div>

                      <div className="text-[11px] mt-1 flex items-center justify-end gap-1">
                        <span className="opacity-70">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {mine && (
                          <span className="text-xs">
                            {isOptimistic ? "…" : m.read ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>

                      {/* Delete button */}
                      {mine && !isOptimistic && selectedMessage === m._id && (
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
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={submit}
        className="
          flex items-center gap-2 px-3 p-1 md:p-3 border-t  border-white/10 bg-[#1f1f2e]
          fixed bottom-0 left-0 right-0 z-10
          md:sticky md:bottom-0 md:z-10
        "
      >
       <div className="flex flex-1 items-center bg-white/5 border border-white/10 rounded-full px-3 py-1 shadow-inner">
          {/* Input */}
          <input
            value={text}
            onChange={handleChange}
            placeholder={`Message ${selectedUser?.name || selectedUser?.username}...`}
            className="flex-1 bg-transparent text-sm px-3 py-2 text-white placeholder-gray-400 outline-none"
          />

          {/* Send Button inside input */}
          <button
            type="submit"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 hover:opacity-90 hover:scale-105 transition-all shadow-md"
          >
            <SendHorizontal size={18} className="text-white" />
          </button>
        </div>
      </form>
      {/* 🔹 Image Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999]"
          onClick={() => setPreview(null)}
        >
          <img
            src={preview}
            alt="preview"
            className="max-w-[90%] max-h-[80%] rounded-lg shadow-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
