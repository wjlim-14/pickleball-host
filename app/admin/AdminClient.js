"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function Metric({ label, value, sub }) {
  return (
    <div style={{ background: "var(--surface-1)", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 12, color: "var(--text-2)" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, marginTop: 2 }}>{value ?? 0}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}

function Bars({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="card">
      <div className="section-title">{title}</div>
      {rows.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>No data yet.</p>
      ) : (
        rows.map(([k, v]) => (
          <div key={k} style={{ margin: "8px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
              <span>{k}</span><span style={{ fontWeight: 500 }}>{v}</span>
            </div>
            <div style={{ height: 8, background: "var(--surface-0)", borderRadius: 4 }}>
              <div style={{ width: (v / max) * 100 + "%", height: 8, background: "var(--accent)", borderRadius: 4 }} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function AdminClient({ stats, profiles, codes }) {
  const [gen, setGen] = useState("");
  const [busy, setBusy] = useState(false);
  const s = stats || {};

  const obj = (o) => Object.entries(o || {});
  const activationRate = s.clubs_total ? Math.round((s.clubs_active / s.clubs_total) * 100) : 0;
  const avgGames = s.sessions_total ? (s.games_total / s.sessions_total).toFixed(1) : "0";
  const regRows = (s.reg_by_week || []).map((w) => [w.wk, w.c]);
  const topClubs = s.top_clubs || [];

  const codeFor = (uid) => {
    const c = codes.find((x) => x.assigned_to === uid && !x.redeemed_by);
    return c ? c.code : codes.find((x) => x.assigned_to === uid)?.code || null;
  };
  const copy = (t) => navigator.clipboard?.writeText(t);
  const generate = async () => {
    setBusy(true);
    const sb = createClient();
    const { data, error } = await sb.rpc("generate_code", { p_note: "manual" });
    setBusy(false);
    if (error) { alert(error.message); return; }
    setGen(data);
  };
  const regs = profiles.filter((p) => p.club_name);

  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 };

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: 20 }}>
      <div className="brand" style={{ marginBottom: 4 }}><span className="brand-dot" />QuickQueue admin</div>
      <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 18 }}>Insights across all clubs, sessions and games.</p>

      <div className="section-title" style={{ marginBottom: 8 }}>Growth</div>
      <div style={grid}>
        <Metric label="Clubs" value={s.clubs_total} sub={`${s.clubs_active || 0} active · ${s.clubs_pending || 0} pending`} />
        <Metric label="Activation rate" value={activationRate + "%"} />
        <Metric label="Active clubs (30d)" value={s.active_clubs_30d} />
      </div>

      <div className="section-title" style={{ margin: "18px 0 8px" }}>Engagement</div>
      <div style={grid}>
        <Metric label="Sessions" value={s.sessions_total} sub={`${s.sessions_30d || 0} in last 30d`} />
        <Metric label="Games played" value={s.games_total} sub={`${s.games_30d || 0} in last 30d`} />
        <Metric label="Players checked in" value={s.players_total} />
        <Metric label="Avg games / session" value={avgGames} />
      </div>

      <div style={{ marginTop: 18 }}>
        <Bars title="New registrations (last 8 weeks)" rows={regRows} />

        {topClubs.length > 0 && (
          <div className="card">
            <div className="section-title">Most active clubs</div>
            <div className="list">
              {topClubs.map((c, i) => (
                <div key={i} className="row">
                  <span style={{ width: 18, color: "var(--text-muted)", fontSize: 13 }}>{i + 1}</span>
                  <span className="grow">{c.club}</span>
                  <span className="muted" style={{ fontSize: 13 }}>{c.games} games</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="section-title" style={{ margin: "18px 0 8px" }}>Product signal</div>
        <Bars title="Format mix" rows={obj(s.format_mix)} />
        <Bars title="Player gender split" rows={obj(s.gender_split)} />
        <Bars title="Meet-ups per week (clubs)" rows={obj(s.meets_dist)} />
        <Bars title="Participants per session (clubs)" rows={obj(s.participants_dist)} />
      </div>

      <div className="section-title" style={{ margin: "18px 0 8px" }}>Registrations ({regs.length})</div>
      <div className="card">
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
