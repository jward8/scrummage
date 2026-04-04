import { useEffect, useState } from "react";
import client from "../api/client";

export default function PracticePlanPage() {
  const [plans, setPlans] = useState([]);
  const [drillLibrary, setDrillLibrary] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [newPlan, setNewPlan] = useState({ title: "", description: "", practice_date: "" });
  const [showNewForm, setShowNewForm] = useState(false);
  const [drillSearch, setDrillSearch] = useState("");

  useEffect(() => {
    fetchPlans();
    client.get("/api/drills/").then(({ data }) => setDrillLibrary(data));
  }, []);

  function fetchPlans() {
    client.get("/api/practice-plans/").then(({ data }) => setPlans(data));
  }

  async function createPlan(e) {
    e.preventDefault();
    const payload = {
      title: newPlan.title,
      description: newPlan.description,
    };
    if (newPlan.practice_date) payload.practice_date = newPlan.practice_date;
    const { data } = await client.post("/api/practice-plans/", payload);
    setPlans([data, ...plans]);
    setNewPlan({ title: "", description: "", practice_date: "" });
    setShowNewForm(false);
    setSelectedPlan(data);
  }

  async function deletePlan(planId) {
    if (!confirm("Delete this plan?")) return;
    await client.delete(`/api/practice-plans/${planId}/`);
    setPlans(plans.filter((p) => p.id !== planId));
    if (selectedPlan?.id === planId) setSelectedPlan(null);
  }

  async function addDrill(drill) {
    const nextOrder = (selectedPlan.plan_drills?.length || 0);
    const { data } = await client.post(`/api/practice-plans/${selectedPlan.id}/drills/`, {
      drill_id: drill.id,
      order: nextOrder,
    });
    const refreshed = await client.get(`/api/practice-plans/${selectedPlan.id}/`);
    setSelectedPlan(refreshed.data);
    setPlans(plans.map((p) => (p.id === selectedPlan.id ? refreshed.data : p)));
  }

  async function removeDrill(entryId) {
    await client.delete(`/api/practice-plans/${selectedPlan.id}/drills/${entryId}/`);
    const refreshed = await client.get(`/api/practice-plans/${selectedPlan.id}/`);
    setSelectedPlan(refreshed.data);
    setPlans(plans.map((p) => (p.id === selectedPlan.id ? refreshed.data : p)));
  }

  async function updateDrillEntry(entryId, patch) {
    await client.patch(`/api/practice-plans/${selectedPlan.id}/drills/${entryId}/`, patch);
    const refreshed = await client.get(`/api/practice-plans/${selectedPlan.id}/`);
    setSelectedPlan(refreshed.data);
    setPlans(plans.map((p) => (p.id === selectedPlan.id ? refreshed.data : p)));
  }

  const filteredDrills = drillLibrary.filter((d) =>
    d.title.toLowerCase().includes(drillSearch.toLowerCase())
  );

  return (
    <div style={{ padding: 16, display: "flex", gap: 24 }}>
      {/* Plan list */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Plans</h2>
          <button onClick={() => setShowNewForm(!showNewForm)}>+ New</button>
        </div>

        {showNewForm && (
          <form onSubmit={createPlan} style={{ marginBottom: 16, padding: 12, border: "1px solid #ccc", borderRadius: 6 }}>
            <input
              placeholder="Title"
              value={newPlan.title}
              onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
              required
              style={{ display: "block", width: "100%", marginBottom: 6 }}
            />
            <input
              placeholder="Description"
              value={newPlan.description}
              onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
              style={{ display: "block", width: "100%", marginBottom: 6 }}
            />
            <input
              type="date"
              value={newPlan.practice_date}
              onChange={(e) => setNewPlan({ ...newPlan, practice_date: e.target.value })}
              style={{ display: "block", width: "100%", marginBottom: 8 }}
            />
            <button type="submit">Create</button>
          </form>
        )}

        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan)}
            style={{
              padding: "10px 12px",
              marginBottom: 6,
              border: "1px solid #ccc",
              borderRadius: 6,
              cursor: "pointer",
              background: selectedPlan?.id === plan.id ? "#f0f0f0" : "white",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{plan.title}</strong>
              <button
                onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}
                style={{ fontSize: 12, color: "red", border: "none", background: "none", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            {plan.practice_date && (
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{plan.practice_date}</div>
            )}
          </div>
        ))}
      </div>

      {/* Plan builder */}
      {selectedPlan && (
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>{selectedPlan.title}</h2>
            <button onClick={() => window.print()} style={{ marginLeft: "auto" }}>Print</button>
          </div>

          {/* Drill list */}
          <h3>Drills in this plan</h3>
          {selectedPlan.plan_drills?.length === 0 && <p style={{ color: "#888" }}>No drills yet. Add from the library below.</p>}
          {selectedPlan.plan_drills?.map((entry) => (
            <DrillEntry key={entry.id} entry={entry} onRemove={removeDrill} onUpdate={updateDrillEntry} />
          ))}

          {/* Drill picker */}
          <h3 style={{ marginTop: 24 }}>Add from library</h3>
          <input
            placeholder="Search drills…"
            value={drillSearch}
            onChange={(e) => setDrillSearch(e.target.value)}
            style={{ marginBottom: 8, display: "block" }}
          />
          <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid #eee", borderRadius: 6 }}>
            {filteredDrills.map((drill) => (
              <div
                key={drill.id}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid #eee" }}
              >
                <span>{drill.title} <span style={{ color: "#888", fontSize: 12 }}>· {drill.skill_level}</span></span>
                <button onClick={() => addDrill(drill)}>Add</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DrillEntry({ entry, onRemove, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [reps, setReps] = useState(entry.custom_reps ?? "");
  const [duration, setDuration] = useState(entry.custom_duration ?? "");
  const [notes, setNotes] = useState(entry.coach_notes ?? "");

  async function save() {
    await onUpdate(entry.id, {
      custom_reps: reps === "" ? null : Number(reps),
      custom_duration: duration === "" ? null : Number(duration),
      coach_notes: notes,
    });
    setEditing(false);
  }

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 6, padding: 12, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{entry.drill.title}</strong>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setEditing(!editing)} style={{ fontSize: 12 }}>Edit</button>
          <button onClick={() => onRemove(entry.id)} style={{ fontSize: 12, color: "red" }}>Remove</button>
        </div>
      </div>
      {!editing && (
        <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
          {entry.custom_reps && <span>Reps: {entry.custom_reps} </span>}
          {entry.custom_duration && <span>Duration: {entry.custom_duration}s </span>}
          {entry.coach_notes && <p style={{ margin: "4px 0 0" }}>{entry.coach_notes}</p>}
        </div>
      )}
      {editing && (
        <div style={{ marginTop: 8 }}>
          <input type="number" placeholder="Reps" value={reps} onChange={(e) => setReps(e.target.value)} style={{ width: 70, marginRight: 6 }} />
          <input type="number" placeholder="Duration (s)" value={duration} onChange={(e) => setDuration(e.target.value)} style={{ width: 110, marginRight: 6 }} />
          <input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: 200, marginRight: 6 }} />
          <button onClick={save}>Save</button>
        </div>
      )}
    </div>
  );
}
