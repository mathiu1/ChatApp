import React, { useState } from "react";
import { X } from "lucide-react";

export default function Sidebar({
  contacts,
  selectUser,
  selected,
  isOpen,
  onClose,
  loading,
}) {
  const [preview, setPreview] = useState(null); // 🔹 For avatar modal

  // Sort contacts
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.online !== b.online) return b.online - a.online;
    if ((b.unread || 0) !== (a.unread || 0))
      return (b.unread || 0) - (a.unread || 0);

    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;

    const aSeen = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
    const bSeen = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
    return bSeen - aSeen;
  });

  return (
    <>
      {/* 🔹 Dark overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity md:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-[56px] left-0
          h-[calc(100vh-56px)] 
          w-full md:w-1/3 lg:w-1/4
          bg-[#181826]/95 backdrop-blur-xl text-white  shadow-2xl md:shadow-none
          z-50 md:z-30
          transform transition-transform duration-300 ease-in-out  border-r border-white/10
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Mobile Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 md:hidden">
          <h3 className="font-bold text-lg">Chats</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block px-4 py-3 border-b border-white/10 relative">
          <h3 className="font-bold text-lg">Chats</h3>
          <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400"></span>
        </div>

        {/* Scrollable contacts */}
        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-4rem)] md:h-[calc(100%-3.5rem)]">
          {/* Loading skeleton */}
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-gray-300" />
                <div className="flex-1">
                  <div className="h-3 w-24 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}

          {/* No contacts */}
          {!loading && sortedContacts.length === 0 && (
            <p className="text-gray-400 text-sm">No contacts yet</p>
          )}

          {/* Contacts */}
          {!loading &&
            sortedContacts.map((c) => (
              <div
                key={c.username}
                onClick={() => {
                  selectUser(c);
                  onClose();
                }}
                className={`flex items-center justify-between cursor-pointer px-3 py-2 rounded-xl transition-all duration-200 ${
                  selected === c.username
                    ? "bg-gradient-to-r from-purple-700 to-pink-600  text-white shadow-lg "
                    : "bg-white/5 hover:bg-white/10 "
                }`}
              >
                {/* Avatar + Online Dot */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {c.avatar ? (
                      <img
                        src={c.avatar}
                        alt="avatar"
                        className="w-10 h-10 rounded-full border border-white/20 shadow-sm cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent selecting user
                          setPreview(c.avatar);
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-white/20 bg-gray-600" />
                    )}
                    {c.online && (
                      <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 rounded-full border-2 border-[#181826] shadow-sm"></span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {c.name || c.username}
                    </div>
                    <div
                      className={`text-sm truncate ${
                        c.online
                          ? "text-green-400 font-medium"
                          : "text-gray-400"
                      }`}
                    >
                      {c.online
                        ? "Online"
                        : c.lastSeen
                        ? (() => {
                            const lastSeenDate = new Date(c.lastSeen);
                            const today = new Date();
                            const yesterday = new Date();
                            yesterday.setDate(today.getDate() - 1);

                            if (
                              lastSeenDate.toDateString() ===
                              today.toDateString()
                            ) {
                              return `last seen ${lastSeenDate.toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}`;
                            } else if (
                              lastSeenDate.toDateString() ===
                              yesterday.toDateString()
                            ) {
                              return `Yesterday, ${lastSeenDate.toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}`;
                            } else {
                              return `${lastSeenDate.toLocaleDateString([], {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}, ${lastSeenDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`;
                            }
                          })()
                        : "Offline"}
                    </div>
                  </div>
                </div>

                {/* Unread Badge */}
                {c.unread > 0 && (
                  <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md shadow-red-500/30">
                    {c.unread}
                  </span>
                )}
              </div>
            ))}
        </div>
      </aside>

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
    </>
  );
}
