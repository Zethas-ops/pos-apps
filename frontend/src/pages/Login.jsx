import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username.trim())
        .eq("password", password.trim())
        .single();

      console.log("USER:", data);
      console.log("ERROR:", error);

      if (error || !data) {
        setError("Invalid username or password");
        return;
      }

      // dummy token
      const dummyToken = btoa(
        JSON.stringify({
          id: data.id,
          username: data.username,
          exp: Date.now() + 86400000,
        })
      );

      localStorage.setItem("token", dummyToken);
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

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;