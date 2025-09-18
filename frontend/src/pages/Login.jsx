import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSuccess = async (credentialResponse) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/google`,
        { token: credentialResponse.credential },
        { withCredentials: true }
      );
      login(data.user);
      navigate("/");
    } catch {
      alert("Google login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-lg p-6 flex flex-col items-center">
        {/* Logo / App Name */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent tracking-wide">
            ChatApp
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Connect instantly, anywhere 🚀
          </p>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-6">
          <p className="text-gray-600 text-sm leading-relaxed">
           A simple,
            fast, and secure way to chat with your friends and colleagues.
          </p>
          
        </div>

        {/* Google Login */}
        <div className="w-full flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.log("Login Failed")}
            shape="pill"
            size="large"
          />
        </div>

        {/* Footer */}
        <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
          By continuing, you agree to our{" "}
          <span className="text-blue-600 cursor-pointer hover:underline">
            Terms
          </span>{" "}
          &{" "}
          <span className="text-blue-600 cursor-pointer hover:underline">
            Privacy Policy
          </span>
          . We respect your privacy ❤️
        </p>
      </div>
    </div>
  );
}
