"use client";
import { useState } from "react";
import { PL } from "@/lib/engine";

const FREQ = [
  ["any", "Any"],
  ["mixed", "Mixed"],
  ["mens", "Men's"],
  ["womens", "Women's"],
];

export default function CheckInForm({ onAdd }) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("M");
  const [level, setLevel] = useState(3);
  const [freq, setFreq] = useState("any");

  const submit = () => {
    onAdd({ name: name.trim(), gender, level, freq });
    setName("");
    setLevel(3);
    setFreq("any");
  };

  return (
    <div className="card">
      <div className="section-title">Check in a player</div>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        style={{ marginBottom: 8 }}
      />

      <div className="label" style={{ marginTop: 0 }}>Gender</div>
      <div className="seg">
        {[["M", "Male"], ["F", "Female"]].map((o) => (
          <button key={o[0]} className={gender === o[0] ? "on" : ""} onClick={() => setGender(o[0])}>
            {o[1]}
          </button>
        ))}
      </div>

      <div className="label">
        Level — <b style={{ color: "var(--text)" }}>{PL[level]}</b>
      </div>
      <div className="seg">
        {[1, 2, 3, 4, 5].map((l) => {
          const main = l === 1 || l === 3 || l === 5;
          const lab = l === 1 ? "Beginner" : l === 3 ? "Intermediate" : l === 5 ? "Advance" : "·";
          return (
            <button
              key={l}
              className={level === l ? "on" : ""}
              onClick={() => setLevel(l)}
              title={PL[l]}
              style={{ flex: main ? 2 : 1, fontSize: main ? 12 : 14 }}
            >
              {lab}
            </button>
          );
        })}
      </div>

      <div className="label">Must play format</div>
      <div className="seg">
        {FREQ.map((o) => (
          <button key={o[0]} className={freq === o[0] ? "on" : ""} onClick={() => setFreq(o[0])}>
            {o[1]}
          </button>
        ))}
      </div>

      <button className="btn btn-primary btn-full" style={{ marginTop: 12 }} onClick={submit}>
        Check in (join back of queue)
      </button>
    </div>
  );
}
