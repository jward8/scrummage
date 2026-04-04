import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function DrillUploadPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    skill_level: "beginner",
    instructions: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setUploading(true);
    try {
      let video_url = null;

      if (videoFile) {
        const { data: presigned } = await client.post("/api/s3/presigned-upload/", {
          filename: videoFile.name,
          content_type: videoFile.type,
        });
        await fetch(presigned.upload_url, {
          method: "PUT",
          body: videoFile,
          headers: { "Content-Type": videoFile.type },
        });
        video_url = presigned.upload_url.split("?")[0];
      }

      const { data: drill } = await client.post("/api/drills/", {
        ...form,
        instructions: form.instructions.split("\n").filter(Boolean),
        video_url,
      });
      navigate(`/drills/${drill.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 640 }}>
      <button onClick={() => navigate("/drills")} style={{ marginBottom: 12 }}>← Back</button>
      <h2>Add Drill</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>
            Title
            <input style={{ display: "block", width: "100%", marginTop: 4 }} value={form.title} onChange={set("title")} required />
          </label>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>
            Description
            <textarea style={{ display: "block", width: "100%", marginTop: 4 }} value={form.description} onChange={set("description")} required />
          </label>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>
            Category
            <input style={{ display: "block", width: "100%", marginTop: 4 }} value={form.category} onChange={set("category")} required />
          </label>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>
            Skill level
            <select style={{ display: "block", marginTop: 4 }} value={form.skill_level} onChange={set("skill_level")}>
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
              onChange={set("instructions")}
            />
          </label>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>
            Video (optional)
            <input
              type="file"
              accept="video/mp4"
              style={{ display: "block", marginTop: 4 }}
              onChange={(e) => setVideoFile(e.target.files[0] || null)}
            />
          </label>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading…" : "Save Drill"}
        </button>
      </form>
    </div>
  );
}
