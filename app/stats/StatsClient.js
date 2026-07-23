"use client";

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

function clk(secs) {
  const s = Math.max(0, secs || 0);
  return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
}

export default function StatsClient({ stats, sessions, club }) {
  const s = stats || {};
  const obj = (o) => Object.entries(o || {});
  const avgGames = s.sessions_total ? (s.games_total / s.sessions_total).toFixed(1) : "0";
  const topPlayers = s.top_players || [];

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div className="brand"><span className="brand-dot" />{club} — stats</div>
        <a className="btn" href="/">← Back</a>
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 18 }}>Your club activity, all from your saved sessions.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
        <Metric label="Sessions run" value={s.sessions_total} sub={`${s.sessions_30d || 0} in last 30d`} />
        <Metric label="Games played" value={s.games_total} sub={`${avgGames} avg / session`} />
        <Metric label="Unique players" value={s.unique_players} sub={`${s.checkins_total || 0} check-ins`} />
        <Metric label="Avg game length" value={clk(s.avg_game_secs)} sub="min:sec" />
      </div>

      <div style={{ marginTop: 18 }}>
        {topPlayers.length > 0 && (
          <div className="card">
            <div className="section-title">Most active players</div>
            <div className="list">
              {topPlayers.map((p, i) => (
                <div key={i} className="row">
                  <span style={{ width: 18, color: "var(--text-muted)", fontSize: 13 }}>{i + 1}</span>
                  <span className="grow">{p.name}</span>
                  <span className="muted" style={{ fontSize: 13 }}>{p.games} games · {p.sessions} sessions</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Bars title="Format mix" rows={obj(s.format_mix)} />
        <Bars title="Player gender split" rows={obj(s.gender_split)} />

        <div className="card">
          <div className="section-title">Recent sessions</div>
          {sessions.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>No sessions yet — run one from the app and it&apos;ll show here.</p>
          ) : (
            <div className="list">
              {sessions.map((se) => (
                <div key={se.id} className="row" style={{ display: "block" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="grow" style={{ fontWeight: 500 }}>{se.name || "Session"}</span>
                    <span className="pill" style={{ background: se.status === "ended" ? "#F1EFE8" : "#E1F5EE", color: se.status === "ended" ? "#5F5E5A" : "#085041" }}>
                      {se.status}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                    {se.date || "—"} · {se.games_count || 0} games · {se.players_count || 0} players
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
