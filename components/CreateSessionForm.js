"use client";
import { useState } from "react";

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function nowHM() {
  const d = new Date();
  return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}

export default function CreateSessionForm({ onCreate }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState(nowHM());
  const [location, setLocation] = useState("");
  const [method, setMethod] = useState("requeue");
  const [courts, setCourts] = useState(["Court 1", "Court 2", "Court 3"]);

  const setCourt = (i, v) =>
    setCourts((c) => c.map((x, idx) => (idx === i ? v : x)));
  const addCourt = () =>
    setCourts((c) => [...c, "Court " + (c.length + 1)]);
  const removeCourt = (i) =>
    setCourts((c) => (c.length > 1 ? c.filter((_, idx) => idx !== i) : c));

  const submit = () => {
    const cleanCourts = courts.map((c, i) => c.trim() || "Court " + (i + 1));
    onCreate({
      name: name.trim() || "Open Play",
      date,
      time,
      location: location.trim(),
      method,
      courts: cleanCourts,
    });
  };

  return (
    <div className="card">
      <div className="section-title">Create new session</div>

      <input
        type="text"
        placeholder="Session name (e.g. Sunday Open Play)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        style={{ marginBottom: 4 }}
      />

      <div className="label">Game method</div>
      <div className="seg">
        {[
          ["requeue", "Re-queue all"],
          ["winners", "Winners stay"],
        ].map((o) => (
          <button
            key={o[0]}
            className={method === o[0] ? "on" : ""}
            onClick={() => setMethod(o[0])}
          >
            {o[1]}
          </button>
        ))}
      </div>
      <div className="hint" style={{ marginTop: 5 }}>
        Winners stay keeps the winning pair on and pulls 2 challengers (ladder mode).
      </div>

      <div className="label">Courts</div>
      <div className="list">
        {courts.map((c, i) => (
          <div key={i} style={{ display: "flex", gap: 6 }}>
            <input value={c} onChange={(e) => setCourt(i, e.target.value)} />
            <button
              className="btn"
              onClick={() => removeCourt(i)}
              aria-label="Remove court"
              style={{ flex: "0 0 auto" }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button className="btn btn-full" style={{ marginTop: 8 }} onClick={addCourt}>
        + Add court
      </button>

      <button
        className="btn btn-primary btn-full"
        style={{ marginTop: 14 }}
        onClick={submit}
      >
        Create session
      </button>
      <div className="hint" style={{ marginTop: 6 }}>
        After creating, check players in, then press Start to auto-generate matches.
      </div>
    </div>
  );
}
