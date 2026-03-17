import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    console.log("LOGIN CLICKED");

    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

      console.log("DATA:", data);
      console.log("ERROR:", error);

      if (error || !data) {
        setError("User tidak ditemukan");
        return;
      }

      if (data.password !== password) {
        setError("Password salah");
        return;
      }

      console.log("LOGIN SUCCESS");

      localStorage.setItem("user", JSON.stringify(data));
      navigate("/");

    } catch (err) {
      console.error(err);
      setError("An error occurred during login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Coffee POS
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border"
          />

          <button
            type="button"
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-xl"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;