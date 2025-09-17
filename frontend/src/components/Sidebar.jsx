import React from "react";
import { X } from "lucide-react";

export default function Sidebar({ contacts, selectUser, selected, isOpen, onClose }) {
  //  Sort: most recent chat at top
  const sortedContacts = [...contacts].sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <aside
      className={`fixed md:static top-0 left-0 h-full md:h-auto w-64 md:w-1/3 bg-white shadow-lg md:shadow-none z-50 md:z-30 transform transition-transform duration-300 ease-in-out max-w-xs
      ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
    >
      {/* Mobile Header with Close Button */}
      <div className="flex justify-between items-center px-4 py-3 border-b md:hidden">
        <h3 className="font-bold text-lg">Contacts</h3>
        <button
          onClick={onClose}
          className="p-2 rounded hover:bg-gray-200"
        >
          <X size={20} />
        </button>
      </div>

      {/* ✅ Desktop Header */}
      <h3 className="font-bold text-lg px-4 py-3 hidden md:block border-b">
        Contacts
      </h3>

      {/* ✅ Scrollable contacts list */}
      <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-4rem)] md:h-[calc(100vh-6rem)]">
        {sortedContacts.length === 0 && (
          <p className="text-gray-400 text-sm">No contacts yet</p>
        )}
        {sortedContacts.map((c) => (
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
                    ? `last seen ${new Date(c.lastSeen).toLocaleTimeString([], {
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
  );
}
