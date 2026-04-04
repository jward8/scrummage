import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";

export default function DrillDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [drill, setDrill] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    client.get("/api/auth/me/").then(({ data }) => setCurrentUserId(data.id)).catch(() => {});
    client.get(`/api/drills/${id}/`).then(({ data }) => {
      setDrill(data);
      setForm({
        title: data.title,
        description: data.description,
        category: data.category,
        skill_level: data.skill_level,
        instructions: (data.instructions || []).join("\n"),
        video_url: data.video_url || "",
      });
    });
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this drill?")) return;
    await client.delete(`/api/drills/${id}/`);
    navigate("/drills");
  }

  async function handleSave(e) {
    e.preventDefault();
    const { data } = await client.patch(`/api/drills/${id}/`, {
      ...form,
      instructions: form.instructions.split("\n").filter(Boolean),
    });
    setDrill(data);
    setEditing(false);
  }

  if (!drill) return <p style={{ padding: 16 }}>Loading…</p>;

  const isOwner = currentUserId && drill.created_by?.id === currentUserId;

  if (editing) {
    return (
      <div style={{ padding: 16, maxWidth: 640 }}>
        <h2>Edit Drill</h2>
        <form onSubmit={handleSave}>
          {["title", "description", "category"].map((field) => (
            <div key={field} style={{ marginBottom: 10 }}>
              <label>
                {field.charAt(0).toUpperCase() + field.slice(1)}
                <input
                  style={{ display: "block", width: "100%", marginTop: 4 }}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  required
                />
              </label>
            </div>
          ))}
          <div style={{ marginBottom: 10 }}>
            <label>
              Skill level
              <select
                style={{ display: "block", marginTop: 4 }}
                value={form.skill_level}
                onChange={(e) => setForm({ ...form, skill_level: e.target.value })}
              >
                {["beginner", "intermediate", "advanced"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>
              Instructions (one step per line)
              <textarea
                style={{ display: "block", width: "100%", marginTop: 4, height: 100 }}
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 640 }}>
      <button onClick={() => navigate("/drills")} style={{ marginBottom: 12 }}>← Back</button>
      <h2>{drill.title}</h2>
      <p style={{ color: "#555", margin: "4px 0 12px" }}>
        {drill.category} · {drill.skill_level}
      </p>
      <p>{drill.description}</p>

      {drill.video_url && (
        <video
          src={drill.video_url}
          controls
          style={{ width: "100%", maxWidth: 560, marginBottom: 16 }}
        />
      )}

      {drill.instructions?.length > 0 && (
        <>
          <h3>Instructions</h3>
          <ol>
            {drill.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </>
      )}

      {isOwner && (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={() => setEditing(true)}>Edit</button>
          <button onClick={handleDelete} style={{ color: "red" }}>Delete</button>
        </div>
      )}
    </div>
  );
}
