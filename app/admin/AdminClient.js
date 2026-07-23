"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminClient({ profiles, codes }) {
  const [gen, setGen] = useState("");
  const [busy, setBusy] = useState(false);

  const codeFor = (uid) => {
    const c = codes.find((x) => x.assigned_to === uid && !x.redeemed_by);
    return c ? c.code : codes.find((x) => x.assigned_to === uid)?.code || null;
  };
  const copy = (t) => navigator.clipboard?.writeText(t);
  const generate = async () => {
    setBusy(true);
    const s = createClient();
    const { data, error } = await s.rpc("generate_code", { p_note: "manual" });
    setBusy(false);
    if (error) { alert(error.message); return; }
    setGen(data);
  };

  const regs = profiles.filter((p) => p.club_name);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 20 }}>
      <div className="brand" style={{ marginBottom: 4 }}><span className="brand-dot" />QuickQueue admin</div>
      <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 20 }}>Review club registrations and send their activation code.</p>

      <div className="card">
        <div className="section-title">Registrations ({regs.length})</div>
        {regs.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>No registrations yet.</p>
        ) : (
          <div className="list">
            {regs.map((p) => {
              const code = codeFor(p.id);
              return (
                <div key={p.id} className="row" style={{ display: "block" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 500 }}>{p.club_name}</span>
                    <span className="pill" style={{ background: p.activated ? "#E1F5EE" : "#FAEEDA", color: p.activated ? "#085041" : "#633806" }}>
                      {p.activated ? "active" : "pending"}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                    {p.email} · {p.location || "—"} · {p.meets_per_week || "?"}×/wk · {p.participants_range || "?"} players
                  </div>
                  {code && !p.activated && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 15 }}>{code}</span>
                      <button className="btn" onClick={() => copy(code)}>Copy code</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-title">Generate a standalone code</div>
        <button className="btn btn-primary" onClick={generate} disabled={busy}>{busy ? "…" : "Generate"}</button>
        {gen && (
          <div className="row" style={{ marginTop: 10 }}>
            <span className="grow" style={{ fontFamily: "monospace", fontSize: 16 }}>{gen}</span>
            <button className="btn" onClick={() => copy(gen)}>Copy</button>
          </div>
        )}
      </div>
    </main>
  );
}
