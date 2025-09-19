import React from "react";
import { X } from "lucide-react";

export default function Sidebar({
  contacts,
  selectUser,
  selected,
  isOpen,
  onClose,
  loading, 
}) {
  // Sort contacts by last message time
const sortedContacts = [...contacts].sort((a, b) => {
  // 🔹 1. Online first
  if (a.online !== b.online) {
    return b.online - a.online; // true > false
  }

  // 🔹 2. Unread count (higher first)
  if ((b.unread || 0) !== (a.unread || 0)) {
    return (b.unread || 0) - (a.unread || 0);
  }

  // 🔹 3. Last message time
  const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
  const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
  if (aTime !== bTime) {
    return bTime - aTime;
  }

  // 🔹 4. Fallback: lastSeen
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
          w-full md:w-1/3 lg:w-1/5
          bg-white shadow-lg md:shadow-none
          z-50 md:z-30
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Mobile Header with Close Button */}
        <div className="flex justify-between items-center px-4 py-3 border-b md:hidden">
          <h3 className="font-bold text-lg">Contacts</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>

        {/* Desktop Header */}
        <h3 className="font-bold text-lg px-4 py-3 hidden md:block border-b">
          Contacts
        </h3>

        {/* Scrollable contacts list */}
        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-4rem)] md:h-[calc(100%-3.5rem)]">
          {/* 🔹 Loading State */}
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

          {/* 🔹 No contacts */}
          {!loading && sortedContacts.length === 0 && (
            <p className="text-gray-400 text-sm">No contacts yet</p>
          )}

          {/* 🔹 Contacts */}
          {!loading &&
            sortedContacts.map((c) => (
              <div
                key={c.username}
                onClick={() => {
                  selectUser(c);
                  onClose(); // close sidebar on mobile
                }}
                className={`flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg transition ${
                  selected === c.username
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-100"
                }`}
              >
                {/* Avatar + Online Dot */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {c.avatar ? (
                      <img
                        src={c.avatar}
                        alt="avatar"
                        className="w-10 h-10 rounded-full border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border bg-gray-300" />
                    )}
                    {c.online && (
                      <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {c.name || c.username}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {c.online
                        ? "Online"
                        : c.lastSeen
                        ? `last seen ${new Date(
                            c.lastSeen
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "Offline"}
                    </div>
                  </div>
                </div>

                {/* Unread Badge */}
                {c.unread > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {c.unread}
                  </span>
                )}
              </div>
            ))}
        </div>
      </aside>
    </>
  );
}
