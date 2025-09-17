import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, LogOut } from "lucide-react";

export default function Navbar({ onLogout, onToggleSidebar }) {
  const { user } = useAuth();

  return (
    <nav className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 flex justify-between items-center shadow-md sticky top-0 z-50">
      {/* Left: Logo + Mobile Menu */}
      <div className="flex items-center gap-3">
        {user && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-md hover:bg-blue-700/40 focus:outline-none transition"
          >
            <Menu size={22} />
          </button>
        )}

        <div className="font-semibold text-lg tracking-tight">
          <Link to="/" className="hover:text-gray-200 transition">
            ChatApp
          </Link>
        </div>
      </div>

      {/* Right: User Info + Logout */}
      {user && (
        <div className="flex items-center gap-4">
          {/* Avatar + Name */}
          <div className="flex items-center gap-2">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                className="w-9 h-9 rounded-full border border-white/40"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-800 flex items-center justify-center text-sm font-medium">
                {user.username?.[0].toUpperCase()}
              </div>
            )}
            <span className="hidden sm:inline font-medium text-sm">
              {user.name || user.username}
            </span>
          </div>

          {/* Logout Button */}
         {/* Logout Button */}
<button
  onClick={onLogout}
  className="flex items-center gap-2 px-4 py-1.5 rounded bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
>
  <LogOut size={16} />
  <span className="hidden sm:inline">Logout</span>
</button>

        </div>
      )}
    </nav>
  );
}
