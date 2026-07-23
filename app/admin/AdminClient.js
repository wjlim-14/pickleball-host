"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminClient({ initialCodes, initialRequests }) {
  const [codes, setCodes] = useState(initialCodes);
  const [requests] = useState(initialRequests);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [latest, setLatest] = useState("");

  const generate = async () => {
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("generate_code", { p_note: note || null });
    setBusy(false);
    if (error) { alert("Error: " + error.message); return; }
    setLatest(data);
    setCodes([{ code: data, note: note || null, redeemed_by: null, redeemed_at: null, created_at: new Date().toISOString() }, ...codes]);
    setNote("");
  };

  const copy = (text) => navigator.clipboard?.writeText(text);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 20 }}>
      <div className="brand" style={{ marginBottom: 4 }}><span className="brand-dot" />QuickQueue admin</div>
      <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 20 }}>Generate beta codes and review access requests.</p>

      <div className="card">
        <div className="section-title">Generate a beta code</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="Note (who it's for) — optional" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn btn-primary" style={{ flex: "0 0 auto" }} onClick={generate} disabled={busy}>
            {busy ? "…" : "Generate"}
          </button>
        </div>
        {latest && (
          <div className="row" style={{ marginTop: 10, background: "var(--accent-bg)", border: "0.5px solid var(--accent-border)" }}>
            <span className="grow" style={{ fontFamily: "monospace", fontSize: 16 }}>{latest}</span>
            <button className="btn" onClick={() => copy(latest)}>Copy</button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-title">Beta requests ({requests.length})</div>
        {requests.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>No requests yet.</p>
        ) : (
          <div className="list">
            {requests.map((r) => (
              <div key={r.id} className="row" style={{ display: "block" }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{r.name || "—"} <span className="muted" style={{ fontWeight: 400 }}>· {r.email}</span></div>
                <div className="muted" style={{ fontSize: 13 }}>{r.club || "—"}{r.location ? " · " + r.location : ""}</div>
                {r.message && <div style={{ fontSize: 13, marginTop: 3 }}>{r.message}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-title">Codes ({codes.length})</div>
        <div className="list">
          {codes.map((c) => (
            <div key={c.code} className="row">
              <span className="grow" style={{ fontFamily: "monospace", fontSize: 14 }}>{c.code}</span>
              <span className="muted" style={{ fontSize: 12 }}>{c.note || ""}</span>
              <span className="pill" style={{ background: c.redeemed_by ? "#FAECE7" : "#E1F5EE", color: c.redeemed_by ? "#712B13" : "#085041" }}>
                {c.redeemed_by ? "used" : "available"}
              </span>
              {!c.redeemed_by && <button className="btn" onClick={() => copy(c.code)}>Copy</button>}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
