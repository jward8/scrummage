import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";

export default function NavBar() {
  const [username, setUsername] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    client.get("/api/auth/me/").then(({ data }) => setUsername(data.username)).catch(() => {});
  }, []);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  }

  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 16px", borderBottom: "1px solid #ccc" }}>
      <Link to="/drills" style={{ fontWeight: "bold", textDecoration: "none" }}>
        Rugby Drill Hub
      </Link>
      <Link to="/drills">Drills</Link>
      <Link to="/plans">Plans</Link>
      <span style={{ marginLeft: "auto" }}>
        {username && <span style={{ marginRight: 12 }}>{username}</span>}
        {username && (
          <button onClick={logout}>Log out</button>
        )}
      </span>
    </nav>
  );
}
