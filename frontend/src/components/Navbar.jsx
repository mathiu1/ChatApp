import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, LogOut } from "lucide-react";

export default function Navbar({ onLogout, onToggleSidebar }) {
  const { user } = useAuth();

  return (
    <nav
      className="
    fixed top-0 left-0 right-0
    w-full bg-gradient-to-r from-purple-700 to-pink-600  text-white  px-4 sm:px-6 py-3 shadow-lg
    flex justify-between items-center
     z-50 backdrop-blur-lg bg-opacity-95 border-b border-white/20
  "
      
    >
      {/* Left: Logo + Mobile Menu */}
      <div className="flex items-center gap-3">
        {user && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-white/20 transition duration-200"
          >
            <Menu size={22} />
          </button>
        )}

        <div className="font-semibold text-lg md:font-bold md:text-xl tracking-tight">
          <Link to="/" className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400">
            ChatApp
          </Link>
        </div>
      </div>

      {/* Right: User Info + Logout */}
      {user && (
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Avatar + Name */}
          <div className="flex items-center gap-2">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                className="w-10 h-10 rounded-full border-2 border-white/40 shadow-md"
              />
            ) : (
             <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-orange-500 flex items-center justify-center text-sm font-semibold shadow-md text-white">
                {user.username?.[0].toUpperCase()}
              </div>
            )}
            <span className="hidden sm:inline font-medium text-sm truncate max-w-[120px]">
              {user.name || user.username}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-red-500 via-rose-600 to-pink-600 hover:from-red-600 hover:via-rose-700 hover:to-pink-700 transition duration-200 shadow-md text-sm font-semibold"
            
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}
