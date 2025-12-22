import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./index.css";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from 'react';


export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

const [showDelayedText, setShowDelayedText] = useState(false);
useEffect(() => {
    let timer;
    if (loading) {
      // Start a timer for 10 seconds
      timer = setTimeout(() => {
        setShowDelayedText(true);
      }, 5000);
    } else {
      // Reset state if loading finishes before 10s
      setShowDelayedText(false);
    }

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [loading]);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-[#1a1a27] to-[#222233] ">
        {/* Spinner */}
        <Loader2 className="w-10 h-10 text-pink-600 animate-spin mb-4" />

        {/* Fancy text */}
        <p className="text-gray-200 text-sm font-medium animate-pulse">
          Loading your chat...
        </p>
        {showDelayedText && (
          <p className="text-gray-200 text-sm mt-2 font-medium animate-pulse">
           Please wait. It may take up to 60 seconds to start the ChatApp on the first load.
          </p>
        )}
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </GoogleOAuthProvider>
);
