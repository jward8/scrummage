import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await client.post("/api/auth/token/", { username, password });
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      navigate("/drills");
    } catch {
      setError("Invalid username or password.");
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", padding: "0 16px" }}>
      <h1>Scrummage</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              style={{ display: "block", width: "100%", marginTop: 4 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ display: "block", width: "100%", marginTop: 4 }}
            />
          </label>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ width: "100%" }}>
          Log in
        </button>
      </form>
    </div>
  );
}
