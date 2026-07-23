"use client";
import { useRef, useReducer, useEffect } from "react";
import {
  PL,
  mainLabel,
  pickFour,
  findChallengers,
  compat,
} from "@/lib/engine";
import { createClient } from "@/lib/supabase/client";
import CreateSessionForm from "./CreateSessionForm";
import CheckInForm from "./CheckInForm";

const LVCOL = {
  Beginner: { bg: "#E1F5EE", tx: "#085041" },
  Intermediate: { bg: "#E6F1FB", tx: "#0C447C" },
  Advance: { bg: "#FAECE7", tx: "#712B13" },
};
const MPILL = { bg: "#E6F1FB", tx: "#0C447C" };
const FPILL = { bg: "#FBEAF0", tx: "#72243E" };
const TB = {
  mens: { t: "Men's", bg: "#E6F1FB", tx: "#0C447C" },
  womens: { t: "Women's", bg: "#FBEAF0", tx: "#72243E" },
  mixed: { t: "Mixed", bg: "#EEEDFE", tx: "#3C3489" },
};
const FREQ = [
  ["any", "Any"],
  ["mixed", "Mixed"],
  ["mens", "Men's"],
  ["womens", "Women's"],
];

function clk(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
}
function Icon({ name }) {
  const p = {
    session: "M7 4v2M17 4v2M4 8h16M5 6h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z",
    match: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    players: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0 0-6M15 20a6 6 0 0 1 6 0",
    settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.3 1a7 7 0 0 0-1.7-1l-.4-2.5h-4l-.4 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.3-1a7 7 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7 7 0 0 0 1.7-1l2.3 1 2-3.5-2-1.5a7 7 0 0 0 .1-1z",
  }[name];
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={p} />
    </svg>
  );
}

function Chip({ p, onTap }) {
  const lc = LVCOL[mainLabel(p.level)];
  const gc = p.gender === "M" ? MPILL : FPILL;
  return (
    <span
      className={"chip" + (onTap ? " tap" : "")}
      onClick={onTap}
      style={{ background: lc.bg, color: lc.tx }}
    >
      {p.stackId ? <span style={{ fontSize: 11 }}>🔗</span> : null}
      <span className="gpill" style={{ background: gc.bg, color: gc.tx }}>{p.gender}</span>
      {p.name}
      {p.freq !== "any" ? <span style={{ fontSize: 10 }}>🔒</span> : null}
    </span>
  );
}
function Seg({ opts, val, onPick, styleFor }) {
  return (
    <div className="seg">
      {opts.map((o) => (
        <button
          key={o[0]}
          className={val === o[0] ? "on" : ""}
          onClick={() => onPick(o[0])}
          style={styleFor ? styleFor(o[0]) : undefined}
        >
          {o[1]}
        </button>
      ))}
    </div>
  );
}

export default function HostApp({ user }) {
  const bugReportUrl = process.env.NEXT_PUBLIC_BUGREPORT_URL || "";
  const S = useRef({
    players: [],
    courts: [],
    log: [],
    session: { status: "none", dbId: null, name: "", date: "", time: "", location: "", method: "requeue", start: null },
    ui: { tab: "session", editId: null, swap: null, ending: false, exportText: null, idleFlag: 300, sound: true, editRoster: false },
    roster: [],
    history: {},
    round: 0,
    id: 1,
    sid: 1,
  });
  const [, force] = useReducer((x) => x + 1, 0);
  const st = S.current;

  // ---- supabase client (browser) ----
  const sb = useRef(null);
  if (typeof window !== "undefined" && !sb.current) {
    try { sb.current = createClient(); } catch (e) {}
  }
  const syncRef = useRef(null);

  // ---- serialize / hydrate state ----
  function serializeState() {
    const courts = st.courts.map((ct) => ({
      name: ct.name,
      cur: ct.cur ? { type: ct.cur.type, start: ct.cur.start, teams: ct.cur.teams.map((t) => t.map((p) => p.id)) } : null,
      standby: ct.standby ? { type: ct.standby.type, teams: ct.standby.teams.map((t) => t.map((p) => p.id)) } : null,
    }));
    return { players: st.players, courts, log: st.log, session: st.session, id: st.id, sid: st.sid, history: st.history, round: st.round, prefs: { idleFlag: st.ui.idleFlag, sound: st.ui.sound } };
  }
  function hydrate(d) {
    const map = {};
    (d.players || []).forEach((p) => (map[p.id] = p));
    const ok = (g) => g && g.teams.every((t) => t.every((id) => map[id]));
    const courts = (d.courts || []).map((ct) => ({
      name: ct.name,
      cur: ok(ct.cur) ? { type: ct.cur.type, start: ct.cur.start, teams: ct.cur.teams.map((t) => t.map((id) => map[id])) } : null,
      standby: ok(ct.standby) ? { type: ct.standby.type, teams: ct.standby.teams.map((t) => t.map((id) => map[id])) } : null,
    }));
    st.players = d.players || [];
    st.courts = courts;
    st.log = d.log || [];
    st.session = d.session || st.session;
    st.id = d.id || st.id;
    st.sid = d.sid || st.sid;
    st.history = d.history || {};
    st.round = d.round || 0;
    if (d.prefs) { st.ui.idleFlag = d.prefs.idleFlag ?? 300; st.ui.sound = d.prefs.sound ?? true; }
    st.ui.tab = st.session.status === "started" ? "match" : st.session.status === "created" ? "players" : "session";
  }

  // ---- local cache ----
  const STORAGE_KEY = "qq_state_v1";
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState())); } catch (e) {}
  }

  // ---- database sync ----
  async function upsertSession() {
    if (!sb.current || !st.session.dbId) return;
    const se = st.session;
    try {
      await sb.current.from("sessions").upsert({
        id: se.dbId,
        host_id: user.id,
        name: se.name, date: se.date, time: se.time, location: se.location,
        method: se.method,
        courts: st.courts.map((c) => c.name),
        state: serializeState(),
        status: se.status,
        games_count: st.log.length,
        players_count: st.players.length,
        started_at: se.start ? new Date(se.start).toISOString() : null,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {}
  }
  function queueDbSync() {
    if (!sb.current || !st.session.dbId) return;
    if (syncRef.current) clearTimeout(syncRef.current);
    syncRef.current = setTimeout(() => { void upsertSession(); }, 1500);
  }
  function insertGameDb(ct, g, winnerSide) {
    if (!sb.current || !st.session.dbId) return;
    const team = (t) => t.map((p) => ({ name: p.name, level: p.level, gender: p.gender }));
    try {
      sb.current.from("games").insert({
        session_id: st.session.dbId,
        host_id: user.id,
        court: ct.name,
        format: TB[g.type].t,
        team1: team(g.teams[0]),
        team2: team(g.teams[1]),
        winner: winnerSide == null ? null : g.teams[winnerSide].map((p) => p.name).join(" & "),
        duration_seconds: Math.round((Date.now() - g.start) / 1000),
      }).then(() => {}, () => {});
    } catch (e) {}
  }
  function finalizeSession() {
    if (!sb.current || !st.session.dbId) return;
    const sid = st.session.dbId;
    try {
      sb.current.from("sessions").update({
        status: "ended", ended_at: new Date().toISOString(),
        state: serializeState(), games_count: st.log.length, players_count: st.players.length,
      }).eq("id", sid).then(() => {}, () => {});
      if (st.players.length) {
        sb.current.from("session_players").insert(st.players.map((p) => ({
          session_id: sid, host_id: user.id, name: p.name, gender: p.gender, level: p.level, format_req: p.freq, games_played: p.games,
        }))).then(() => {}, () => {});
      }
    } catch (e) {}
  }
  async function signOut() {
    try { if (sb.current) await sb.current.auth.signOut(); } catch (e) {}
    window.location.href = "/login";
  }

  const act = (fn) => { fn(); save(); queueDbSync(); force(); };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let restored = false;
      try {
        if (sb.current) {
          const { data } = await sb.current
            .from("sessions")
            .select("state")
            .eq("host_id", user.id)
            .neq("status", "ended")
            .order("updated_at", { ascending: false })
            .limit(1);
          if (data && data[0] && data[0].state) { hydrate(data[0].state); restored = true; }
        }
      } catch (e) {}
      if (!restored) {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) hydrate(JSON.parse(raw));
        } catch (e) {}
      }
      try {
        if (sb.current) {
          const { data } = await sb.current.from("club_players").select("id, name, gender, level, format_req").eq("host_id", user.id).order("name");
          if (data) st.roster = data.map((r) => ({ id: r.id, name: r.name, gender: r.gender, level: r.level, freq: r.format_req || "any" }));
        }
      } catch (e) {}
      if (!cancelled) force();
    })();
    const t = setInterval(() => force(), 1000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // ---- data helpers ----
  const waiting = () => st.players.filter((p) => p.status === "wait");
  const byId = (id) => st.players.find((p) => p.id === id);

  function addPlayer({ name, gender, level, freq }) {
    st.players.push({
      id: st.id++,
      name: name || "Player " + st.id,
      gender,
      level,
      freq: freq || "any",
      qt: Date.now(),
      games: 0,
      status: "wait",
      stackId: null,
    });
    upsertRoster({ name, gender, level, freq });
    if (st.session.status === "started") autofill();
  }
  function upsertRoster({ name, gender, level, freq }) {
    const nm = (name || "").trim();
    if (!nm || !sb.current) return;
    const existing = st.roster.find((r) => r.name.toLowerCase() === nm.toLowerCase());
    if (existing) {
      existing.gender = gender; existing.level = level; existing.freq = freq || "any";
      try { sb.current.from("club_players").update({ gender, level, format_req: freq || "any", updated_at: new Date().toISOString() }).eq("id", existing.id).then(() => {}, () => {}); } catch (e) {}
    } else {
      const entry = { id: "tmp-" + Date.now(), name: nm, gender, level, freq: freq || "any" };
      st.roster.push(entry);
      try {
        sb.current.from("club_players").insert({ host_id: user.id, name: nm, gender, level, format_req: freq || "any" }).select("id").single().then(({ data }) => { if (data) entry.id = data.id; });
      } catch (e) {}
    }
  }
  function removeFromRoster(id) {
    st.roster = st.roster.filter((r) => r.id !== id);
    try { if (sb.current) sb.current.from("club_players").delete().eq("id", id).then(() => {}, () => {}); } catch (e) {}
  }
  function quickAddFromRoster(r) {
    addPlayer({ name: r.name, gender: r.gender, level: r.level, freq: r.freq });
  }
  function stack(pId, mId) {
    const p = byId(pId), m = byId(mId);
    if (!p || !m) return;
    const sid = st.sid++;
    p.stackId = sid; m.stackId = sid;
    p.qt = m.qt = Math.max(p.qt, m.qt);
    if (st.session.status === "started") autofill();
  }
  function unstack(pId) {
    const p = byId(pId);
    if (!p || !p.stackId) return;
    const m = st.players.find((q) => q.stackId === p.stackId && q.id !== p.id);
    p.stackId = null;
    if (m) m.stackId = null;
    if (st.session.status === "started") autofill();
  }
  function autofill() {
    if (st.session.status !== "started") return;
    for (const ct of st.courts) {
      if (!ct.cur) {
        const r = pickFour(waiting(), st.history, st.round);
        if (r) {
          r.four.forEach((p) => (p.status = "play"));
          ct.cur = { teams: r.teams, type: r.type, start: Date.now() };
        }
      }
    }
    computeStandby();
  }
  function computeStandby() {
    let virt = waiting().slice();
    for (const ct of st.courts) {
      const r = pickFour(virt, st.history, st.round);
      if (r) {
        ct.standby = { teams: r.teams, type: r.type };
        virt = virt.filter((p) => r.four.indexOf(p) < 0);
      } else ct.standby = null;
    }
  }
  function logGame(ct, g, winnerSide) {
    if (st.session.status !== "started") return;
    st.log.push({
      t: new Date().toLocaleTimeString(),
      court: ct.name,
      type: TB[g.type].t,
      team1: g.teams[0].map((p) => p.name).join(" & "),
      team2: g.teams[1].map((p) => p.name).join(" & "),
      winner: winnerSide == null ? "" : g.teams[winnerSide].map((p) => p.name).join(" & "),
      secs: Math.round((Date.now() - g.start) / 1000),
    });
    insertGameDb(ct, g, winnerSide);
  }
  function recordHistory(g) {
    const mark = (a, b, kind) => {
      const k = Math.min(a.id, b.id) + "-" + Math.max(a.id, b.id);
      const h = st.history[k] || (st.history[k] = {});
      h[kind] = st.round;
    };
    mark(g.teams[0][0], g.teams[0][1], "p");
    mark(g.teams[1][0], g.teams[1][1], "p");
    g.teams[0].forEach((x) => g.teams[1].forEach((y) => mark(x, y, "o")));
    st.round++;
  }
  function gameDone(i) {
    const ct = st.courts[i], g = ct.cur;
    if (!g) return;
    logGame(ct, g, null);
    recordHistory(g);
    g.teams[0].concat(g.teams[1]).forEach((p) => { p.status = "wait"; p.qt = Date.now(); p.games++; });
    ct.cur = null;
    autofill();
  }
  function winners(i, side) {
    const ct = st.courts[i], g = ct.cur;
    if (!g) return;
    logGame(ct, g, side);
    recordHistory(g);
    const win = g.teams[side], lose = g.teams[1 - side];
    lose.forEach((p) => { p.status = "wait"; p.qt = Date.now(); p.games++; });
    win.forEach((p) => p.games++);
    const ch = findChallengers(waiting(), g.type);
    if (ch) {
      ch.forEach((p) => (p.status = "play"));
      ct.cur = { teams: [win, ch], type: g.type, start: Date.now() };
    } else {
      win.forEach((p) => { p.status = "wait"; p.qt = Date.now(); });
      ct.cur = null;
    }
    autofill();
  }
  function speakAnnounce(ct) {
    const g = ct.cur;
    if (!g || !st.ui.sound || typeof window === "undefined" || !window.speechSynthesis) return;
    const names = g.teams[0].concat(g.teams[1]).map((p) => p.name);
    try {
      window.speechSynthesis.cancel();
      const u1 = new SpeechSynthesisUtterance(names.join(". "));
      u1.rate = 0.88; u1.volume = 1;
      u1.onend = () => setTimeout(() => {
        const u2 = new SpeechSynthesisUtterance("on " + ct.name + ". " + ct.name);
        u2.rate = 0.9; u2.volume = 1;
        window.speechSynthesis.speak(u2);
      }, 1000);
      window.speechSynthesis.speak(u1);
    } catch (e) {}
  }

  // ---- session lifecycle ----
  function createSession(cfg) {
    const dbId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
    st.session = { status: "created", dbId, name: cfg.name, date: cfg.date, time: cfg.time, location: cfg.location, method: cfg.method, start: null };
    st.courts = cfg.courts.map((name) => ({ name, cur: null, standby: null }));
    st.players = []; st.log = []; st.id = 1; st.sid = 1;
    st.history = {}; st.round = 0;
    st.ui.tab = "players";
    void upsertSession();
  }
  function startSession() {
    st.session.status = "started";
    st.session.start = Date.now();
    autofill();
    st.ui.tab = "match";
    void upsertSession();
  }
  function resetSession() {
    st.session = { status: "none", dbId: null, name: "", date: "", time: "", location: "", method: "requeue", start: null };
    st.courts = []; st.players = []; st.log = [];
    st.history = {}; st.round = 0;
    st.ui.exportText = null; st.ui.ending = false; st.ui.tab = "session";
  }
  function buildCSV() {
    const rows = [["time", "court", "format", "team1", "team2", "winner", "seconds"]];
    st.log.forEach((l) => rows.push([l.t, l.court, l.type, l.team1, l.team2, l.winner, l.secs]));
    rows.push([]);
    rows.push(["player", "gender", "level", "games"]);
    st.players.forEach((p) => rows.push([p.name, p.gender, PL[p.level], p.games]));
    const q = (c) => '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"';
    const meta =
      "Session," + st.session.name + "\nDate," + st.session.date +
      "\nTime," + st.session.time + "\nLocation," + st.session.location + "\n\n";
    return meta + rows.map((r) => r.map(q).join(",")).join("\n");
  }
  function downloadCSV() {
    try {
      const blob = new Blob([st.ui.exportText], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = (st.session.name || "session") + ".csv";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) {}
  }

  // ---- court config (session tab) ----
  function addCourt() { st.courts.push({ name: "Court " + (st.courts.length + 1), cur: null, standby: null }); autofill(); }
  function removeCourt(i) {
    const ct = st.courts[i];
    if (ct.cur) ct.cur.teams[0].concat(ct.cur.teams[1]).forEach((p) => { p.status = "wait"; p.qt = Date.now(); });
    st.courts.splice(i, 1); autofill();
  }
  function removeEmptyCourt() {
    const i = st.courts.findIndex((c) => !c.cur);
    if (i >= 0 && st.courts.length > 1) st.courts.splice(i, 1);
    autofill();
  }

  // ================= RENDER =================
  const onCourt = st.courts.reduce((s, c) => s + (c.cur ? 4 : 0), 0);
  const tabs = [
    ["session", "Session"],
    ["match", "Match"],
    ["players", "Players"],
    ["settings", "Settings"],
  ];
  const titleFor = { session: "Session", match: "Courts", players: "Players", settings: "Settings" };

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-row">
          <h1>{titleFor[st.ui.tab]}</h1>
          <span className="meta">{waiting().length} waiting · {onCourt} on court</span>
        </div>
        {st.session.status !== "none" && (
          <div className="sess">{st.session.name}{st.session.status === "created" ? " · not started" : ""}</div>
        )}
      </div>

      <div className="screen">
        {st.ui.tab === "session" && renderSession()}
        {st.ui.tab === "match" && renderMatch()}
        {st.ui.tab === "players" && renderPlayers()}
        {st.ui.tab === "settings" && renderSettings()}
      </div>

      <div className="tabbar">
        {tabs.map((t) => (
          <button
            key={t[0]}
            className={"tab" + (st.ui.tab === t[0] ? " on" : "")}
            onClick={() => act(() => { st.ui.tab = t[0]; st.ui.editId = null; st.ui.swap = null; })}
          >
            <Icon name={t[0]} />
            <span>{t[1]}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // ---- SESSION TAB ----
  function renderSession() {
    if (st.ui.exportText != null) {
      return (
        <div>
          <div className="section-title">Session data</div>
          <textarea defaultValue={st.ui.exportText} style={{ height: 220, fontFamily: "monospace", fontSize: 11 }} readOnly />
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button className="btn" onClick={downloadCSV}>Download CSV</button>
            <button className="btn btn-primary" onClick={() => act(resetSession)}>Done</button>
          </div>
        </div>
      );
    }
    if (st.ui.ending) {
      return (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>End this session?</div>
          <div className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            {st.log.length} games recorded. Export the data before ending?
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn btn-primary" onClick={() => act(() => { const csv = buildCSV(); finalizeSession(); resetSession(); st.ui.exportText = csv; })}>Export data and end</button>
            <button className="btn" onClick={() => act(() => { finalizeSession(); resetSession(); })}>End without export</button>
            <button className="btn" onClick={() => act(() => { st.ui.ending = false; })}>Cancel</button>
          </div>
        </div>
      );
    }
    if (st.session.status === "none") {
      return <CreateSessionForm onCreate={(cfg) => act(() => createSession(cfg))} />;
    }
    const se = st.session;
    return (
      <div>
        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 600 }}>{se.name}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>📅 {se.date} &nbsp; 🕐 {se.time}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>📍 {se.location || "—"}</div>
          {se.status === "started" && (
            <div className="metrics">
              <span>Elapsed <b>{clk(Date.now() - se.start)}</b></span>
              <span>Games <b>{st.log.length}</b></span>
              <span>Players <b>{st.players.length}</b></span>
            </div>
          )}
        </div>

        <div className="label">Game method</div>
        <Seg opts={[["requeue", "Re-queue all"], ["winners", "Winners stay"]]} val={se.method} onPick={(v) => act(() => { se.method = v; })} />

        <div className="label">Courts</div>
        <div className="list">
          {st.courts.map((ct, i) => (
            <div key={i} style={{ display: "flex", gap: 6 }}>
              <input defaultValue={ct.name} onChange={(e) => { ct.name = e.target.value.trim() || ct.name; }} onBlur={() => act(() => {})} />
              <button className="btn" style={{ flex: "0 0 auto" }} onClick={() => act(() => removeCourt(i))} aria-label="Remove court">✕</button>
            </div>
          ))}
        </div>
        <button className="btn btn-full" style={{ marginTop: 8 }} onClick={() => act(addCourt)}>+ Add court</button>

        {se.status === "created" ? (
          <>
            <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} onClick={() => act(startSession)}>▶ Start session — auto-generate matches</button>
            <div className="hint" style={{ marginTop: 6 }}>Check players in on the Players tab first. Matches generate when you start.</div>
          </>
        ) : (
          <button className="btn btn-danger btn-full" style={{ marginTop: 16 }} onClick={() => act(() => { st.ui.ending = true; })}>■ End session</button>
        )}
      </div>
    );
  }

  // ---- MATCH TAB ----
  function renderMatch() {
    if (st.session.status === "none") return <div className="dashed" style={{ textAlign: "center" }}>Create a session first.</div>;
    if (st.session.status === "created") return <div className="dashed" style={{ textAlign: "center" }}>Session created. Press <b>Start session</b> on the Session tab to generate matches.</div>;
    if (st.ui.swap) return renderSwap();

    const activeCount = st.players.filter((p) => p.status !== "rest").length;
    const openCount = st.courts.filter((c) => !c.cur).length;
    const windingDown = st.session.status === "started" && openCount > 0 && (waiting().length < 4 || activeCount < st.courts.length * 4);

    const order = st.courts.map((ct, i) => ({ ct, i }));
    order.sort((a, b) => {
      const ca = a.ct.cur, cb = b.ct.cur;
      if (ca && cb) return ca.start - cb.start;
      if (ca) return -1;
      if (cb) return 1;
      return a.i - b.i;
    });

    const cards = order.map(({ ct, i }) => {
      if (!ct.cur) {
        return (
          <div className="dashed" key={i}>
            <b className="muted">{ct.name}</b>
            <div style={{ textAlign: "center", fontSize: 13, marginTop: 6 }} className="muted">Open — needs 4 compatible players</div>
            {standbyBlock(ct.standby)}
          </div>
        );
      }
      const g = ct.cur, tb = TB[g.type];
      return (
        <div className="card" key={i}>
          <div className="court-head">
            <span className="name">{ct.name}</span>
            <span className="right">
              <span className="timer">{clk(Date.now() - g.start)}</span>
              <span className="type-badge" style={{ background: tb.bg, color: tb.tx }}>{tb.t}</span>
              <button className="btn iconbtn" onClick={() => speakAnnounce(ct)} aria-label="Announce">🔊</button>
            </span>
          </div>
          <div className="team">{g.teams[0].map((p, k) => <Chip key={p.id} p={p} onTap={() => act(() => { st.ui.swap = { court: i, side: 0, idx: k }; })} />)}</div>
          <div className="vs">vs</div>
          <div className="team">{g.teams[1].map((p, k) => <Chip key={p.id} p={p} onTap={() => act(() => { st.ui.swap = { court: i, side: 1, idx: k }; })} />)}</div>
          <div className="hint" style={{ marginTop: 6 }}>tap a name to swap</div>
          {standbyBlock(ct.standby)}
          {st.session.method === "winners" ? (
            <div className="btn-row" style={{ marginTop: 10 }}>
              <button className="btn" onClick={() => act(() => winners(i, 0))}>🏆 Top won</button>
              <button className="btn" onClick={() => act(() => winners(i, 1))}>🏆 Bottom won</button>
            </div>
          ) : (
            <button className="btn btn-full" style={{ marginTop: 10 }} onClick={() => act(() => gameDone(i))}>✓ Game done</button>
          )}
        </div>
      );
    });
    return (
      <>
        {windingDown && (
          <div className="card" style={{ background: "var(--surface-1)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13 }}>⏳ Winding down — {waiting().length} waiting. Fewer courts keeps everyone playing.</span>
            {st.courts.length > 1 && <button className="btn" style={{ flex: "0 0 auto" }} onClick={() => act(removeEmptyCourt)}>Remove a court</button>}
          </div>
        )}
        {cards}
      </>
    );
  }
  function standbyBlock(g) {
    if (!g) return <div className="standby"><div className="hint">Standby — not enough waiting yet</div></div>;
    const f = g.teams[0].concat(g.teams[1]);
    return (
      <div className="standby">
        <div className="standby-label">⤓ Standby ({TB[g.type].t}) — up next</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 8px" }}>
          {f.map((p) => (
            <span key={p.id} style={{ fontSize: 12, color: "var(--text-2)" }}>
              <span className="gpill" style={{ background: (p.gender === "M" ? MPILL : FPILL).bg, color: (p.gender === "M" ? MPILL : FPILL).tx }}>{p.gender}</span> {p.name}
            </span>
          ))}
        </div>
      </div>
    );
  }
  function renderSwap() {
    const sw = st.ui.swap, ct = st.courts[sw.court], g = ct.cur;
    const slot = g.teams[sw.side][sw.idx];
    const cands = waiting().slice().sort((a, b) => a.qt - b.qt).filter((p) => p.gender === slot.gender && compat(p, g.type));
    const doSwap = (inP) => act(() => {
      const out = ct.cur.teams[sw.side][sw.idx];
      const oq = out.qt;
      out.status = "wait"; out.qt = inP.qt;
      inP.status = "play"; inP.qt = oq;
      ct.cur.teams[sw.side][sw.idx] = inP;
      st.ui.swap = null;
      computeStandby();
    });
    return (
      <div>
        <button className="btn" style={{ marginBottom: 10 }} onClick={() => act(() => { st.ui.swap = null; })}>← Cancel</button>
        <div style={{ fontSize: 13, marginBottom: 8 }}>Swap out <b>{slot.name}</b> ({mainLabel(slot.level)}) on {ct.name} with:</div>
        {cands.length ? (
          <div className="list">
            {cands.map((p) => (
              <div className="row" key={p.id} style={{ cursor: "pointer" }} onClick={() => doSwap(p)}>
                <span className="gpill" style={{ background: (p.gender === "M" ? MPILL : FPILL).bg, color: (p.gender === "M" ? MPILL : FPILL).tx }}>{p.gender}</span>
                <span className="grow">{p.name}</span>
                <span className="muted" style={{ fontSize: 12 }}>{mainLabel(p.level)}</span>
                <span className="hint">idle {clk(Date.now() - p.qt)}</span>
              </div>
            ))}
          </div>
        ) : <div className="muted" style={{ fontSize: 13 }}>No compatible waiting player to swap in.</div>}
      </div>
    );
  }

  // ---- PLAYERS TAB ----
  function renderPlayers() {
    if (st.session.status === "none") return <div className="dashed" style={{ textAlign: "center" }}>Create a session first, then check players in here.</div>;
    const wq = waiting().slice().sort((a, b) => a.qt - b.qt);
    const sorted = st.players.slice().sort((a, b) => {
      if (a.status !== b.status) return a.status === "wait" ? -1 : 1;
      return a.qt - b.qt;
    });
    return (
      <div>
        <CheckInForm onAdd={(pl) => act(() => addPlayer(pl))} />
        {st.roster.length > 0 && renderRoster()}
        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Players ({st.players.length}) — waiting shown in FIFO order, tap to edit</div>
        <div className="list">
          {sorted.map((p) => renderPlayerRow(p, wq.indexOf(p)))}
        </div>
      </div>
    );
  }
  function renderRoster() {
    const inNames = new Set(st.players.map((p) => p.name.toLowerCase()));
    const sorted = st.roster.slice().sort((a, b) => a.name.localeCompare(b.name));
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span className="muted" style={{ fontSize: 12 }}>Your roster ({st.roster.length}) — tap to add</span>
          <a onClick={() => act(() => { st.ui.editRoster = !st.ui.editRoster; })} style={{ cursor: "pointer", fontSize: 12 }}>{st.ui.editRoster ? "Done" : "Edit"}</a>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {sorted.map((r) => {
            const added = inNames.has(r.name.toLowerCase());
            const lc = LVCOL[mainLabel(r.level)];
            const gc = r.gender === "M" ? MPILL : FPILL;
            return (
              <span key={r.id} className="chip"
                onClick={() => { if (!st.ui.editRoster && !added) act(() => quickAddFromRoster(r)); }}
                style={{ background: added ? "var(--surface-1)" : lc.bg, color: added ? "var(--text-muted)" : lc.tx, opacity: added ? 0.55 : 1, cursor: st.ui.editRoster || added ? "default" : "pointer" }}>
                <span className="gpill" style={{ background: gc.bg, color: gc.tx }}>{r.gender}</span>
                {r.name}
                {st.ui.editRoster && (
                  <span onClick={(e) => { e.stopPropagation(); act(() => removeFromRoster(r.id)); }} style={{ cursor: "pointer", marginLeft: 2, fontWeight: 600 }}>×</span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    );
  }
  function renderPlayerRow(p, pos) {
    const lc = LVCOL[mainLabel(p.level)];
    const gc = p.gender === "M" ? MPILL : FPILL;
    const open = st.ui.editId === p.id;
    const flagged = p.status === "wait" && (Date.now() - p.qt) / 1000 > st.ui.idleFlag;
    const status =
      p.status === "play" ? <span style={{ color: "var(--accent)" }}>on court</span>
      : p.status === "rest" ? <span className="muted">resting</span>
      : <span style={{ color: flagged ? "var(--danger)" : "inherit" }}>#{pos + 1} · idle {clk(Date.now() - p.qt)}</span>;
    const mates = waiting().filter((q) => q.id !== p.id && !q.stackId);
    return (
      <div key={p.id}>
        <div className="row" style={{ cursor: "pointer", borderRadius: open ? "10px 10px 0 0" : undefined }} onClick={() => act(() => { st.ui.editId = open ? null : p.id; })}>
          <span style={{ width: 14, textAlign: "center" }}>{p.stackId ? "🔗" : ""}</span>
          <span className="gpill" style={{ background: gc.bg, color: gc.tx }}>{p.gender}</span>
          <span className="grow" style={{ fontSize: 14 }}>{p.name}{p.freq !== "any" ? <span className="muted" style={{ fontSize: 10 }}> ({p.freq})</span> : null}</span>
          <span className="pill" style={{ background: lc.bg, color: lc.tx }}>{mainLabel(p.level)}</span>
          <span style={{ fontSize: 11, minWidth: 84, textAlign: "right" }}>{status}</span>
        </div>
        {open && (
          <div className="edit-panel">
            <input defaultValue={p.name} onChange={(e) => { p.name = e.target.value.trim() || p.name; }} style={{ marginBottom: 8 }} />
            <div className="label" style={{ marginTop: 0 }}>Level — <b style={{ color: "var(--text)" }}>{PL[p.level]}</b></div>
            <Seg
              opts={[[1, "Beg"], [2, "·"], [3, "Int"], [4, "·"], [5, "Adv"]]}
              val={p.level}
              onPick={(v) => act(() => { p.level = v; upsertRoster({ name: p.name, gender: p.gender, level: p.level, freq: p.freq }); if (st.session.status === "started") autofill(); })}
              styleFor={(v) => ({ flex: v === 1 || v === 3 || v === 5 ? 2 : 1 })}
            />
            <div className="label">Must play format</div>
            <Seg opts={FREQ} val={p.freq} onPick={(v) => act(() => { if (p.stackId) unstack(p.id); p.freq = v; upsertRoster({ name: p.name, gender: p.gender, level: p.level, freq: p.freq }); if (st.session.status === "started") autofill(); })} />
            <div className="label">Stacking</div>
            {p.stackId ? (
              <button className="btn btn-full" onClick={() => act(() => unstack(p.id))}>Unstack partner</button>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <select defaultValue="" onChange={(e) => { st.ui._mate = e.target.value; }}>
                  <option value="">Stack with…</option>
                  {mates.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.gender})</option>)}
                </select>
                <button className="btn" onClick={() => act(() => { const mid = parseInt(st.ui._mate, 10); if (mid) stack(p.id, mid); st.ui._mate = ""; })}>Link</button>
              </div>
            )}
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              {p.status !== "play" && (
                <button className="btn" style={{ flex: 1 }} onClick={() => act(() => { p.status = p.status === "rest" ? "wait" : "rest"; if (p.status === "wait") p.qt = Date.now(); if (st.session.status === "started") autofill(); })}>
                  {p.status === "rest" ? "▶ Back" : "❚❚ Rest"}
                </button>
              )}
              {p.status !== "play" ? (
                <button className="btn btn-danger" style={{ flex: "0 0 auto" }} onClick={() => act(() => { st.players = st.players.filter((q) => q.id !== p.id); st.ui.editId = null; if (st.session.status === "started") autofill(); })}>🗑</button>
              ) : (
                <span className="hint">finish game to edit status</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- SETTINGS TAB (account) ----
  function renderSettings() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card">
          <div className="section-title">Account</div>
          <div className="row" style={{ border: "none", padding: "4px 0" }}>
            <span className="muted grow">Signed in as</span>
            <span style={{ fontSize: 13 }}>{user.email}</span>
          </div>
          <div className="row" style={{ border: "none", padding: "4px 0" }}>
            <span className="muted grow">Plan</span>
            <span className="pill" style={{ background: "#EEEDFE", color: "#3C3489" }}>Private beta</span>
          </div>
          <div className="row" style={{ border: "none", padding: "4px 0" }}>
            <span className="muted grow">Credits</span>
            <span>Unlimited (beta)</span>
          </div>
          <a className="btn btn-full" href="/stats" style={{ marginTop: 8 }}>Your club stats</a>
          {user.isAdmin && (
            <a className="btn btn-full" href="/admin" style={{ marginTop: 8 }}>Admin — manage beta codes</a>
          )}
        </div>

        <div className="card">
          <div className="section-title">Preferences</div>
          <div className="row" style={{ border: "none", padding: "6px 0" }}>
            <span className="grow">Voice announcements</span>
            <button className={"btn" + (st.ui.sound ? " btn-primary" : "")} onClick={() => act(() => { st.ui.sound = !st.ui.sound; })}>{st.ui.sound ? "On" : "Off"}</button>
          </div>
          <div className="label">Flag idle over <b>{Math.round(st.ui.idleFlag / 60)}</b> min</div>
          <input type="range" min="60" max="900" step="30" defaultValue={st.ui.idleFlag} onChange={(e) => act(() => { st.ui.idleFlag = parseInt(e.target.value, 10); })} />
        </div>

        <div className="card">
          <div className="section-title">Support</div>
          <a className="btn btn-full" href={bugReportUrl || "#"} target="_blank" rel="noreferrer">Report a bug</a>
          <div className="hint" style={{ marginTop: 8 }}>QuickQueue · v0.2 beta</div>
        </div>

        <button className="btn btn-danger btn-full" onClick={signOut}>Sign out</button>
      </div>
    );
  }
}
