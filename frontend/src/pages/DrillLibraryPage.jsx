import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

const SKILL_LEVELS = ["", "beginner", "intermediate", "advanced"];

export default function DrillLibraryPage() {
  const [drills, setDrills] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [skillLevel, setSkillLevel] = useState("");

  useEffect(() => {
    client.get("/api/drills/").then(({ data }) => setDrills(data));
  }, []);

  const categories = ["", ...new Set(drills.map((d) => d.category).filter(Boolean))];

  const filtered = drills.filter((d) => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !category || d.category === category;
    const matchSkill = !skillLevel || d.skill_level === skillLevel;
    return matchSearch && matchCategory && matchSkill;
  });

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Drills</h2>
        <Link to="/drills/new">
          <button>+ Add Drill</button>
        </Link>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Search drills…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>{c || "All categories"}</option>
          ))}
        </select>
        <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)}>
          {SKILL_LEVELS.map((s) => (
            <option key={s} value={s}>{s || "All levels"}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {filtered.map((drill) => (
          <Link key={drill.id} to={`/drills/${drill.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ border: "1px solid #ccc", borderRadius: 6, padding: 12 }}>
              <strong>{drill.title}</strong>
              <div style={{ marginTop: 4, fontSize: 13, color: "#555" }}>
                <span>{drill.category}</span>
                {" · "}
                <span>{drill.skill_level}</span>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 13 }}>{drill.description}</p>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <p>No drills found.</p>}
      </div>
    </div>
  );
}
