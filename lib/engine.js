// Pure queue-engine helpers. Operate on plain player objects:
// { id, name, gender:'M'|'F', level:1..5, freq:'any'|'mixed'|'mens'|'womens', qt, status, stackId }
//
// Rotation memory: pass `history` (a map keyed by "minId-maxId" -> { p: round, o: round }
// recording the last round two players were partners (p) or opponents (o)) and the current
// `round` number. Repeats are avoided as a SOFT tiebreak — FIFO order still dominates.

export const PL = [
  "",
  "Beginner",
  "Beginner–Intermediate",
  "Intermediate",
  "Intermediate–Advance",
  "Advance",
];

export function mainLabel(l) {
  return l <= 2 ? "Beginner" : l === 3 ? "Intermediate" : "Advance";
}

export function buildUnits(list) {
  const seen = {};
  const u = [];
  list.forEach((p) => {
    if (seen[p.id]) return;
    if (p.stackId) {
      const m = list.find((q) => q.stackId === p.stackId && q.id !== p.id);
      if (m) {
        seen[p.id] = seen[m.id] = 1;
        u.push({ players: [p, m], qt: Math.max(p.qt, m.qt) });
        return;
      }
    }
    seen[p.id] = 1;
    u.push({ players: [p], qt: p.qt });
  });
  u.sort((a, b) => a.qt - b.qt);
  return u;
}

export function deriveType(four) {
  const m = four.filter((p) => p.gender === "M").length;
  if (m === 4) return "mens";
  if (m === 0) return "womens";
  if (m === 2) return "mixed";
  return null;
}

export function compat(p, type) {
  return p.freq === "any" || p.freq === type;
}

function keepStack(o) {
  const a = {},
    b = {};
  o[0].forEach((p) => {
    if (p.stackId) a[p.stackId] = 1;
  });
  o[1].forEach((p) => {
    if (p.stackId) b[p.stackId] = 1;
  });
  for (const k in a) if (b[k]) return false;
  return true;
}

const DECAY = 4; // rounds over which a repeat still counts

function pairKey(a, b) {
  return Math.min(a, b) + "-" + Math.max(a, b);
}

// How "stale" a proposed team split is: recent partners cost more than recent opponents.
function repeatPenalty(teams, history, round) {
  if (!history) return 0;
  let pen = 0;
  const partners = [
    [teams[0][0], teams[0][1]],
    [teams[1][0], teams[1][1]],
  ];
  partners.forEach(([a, b]) => {
    const h = history[pairKey(a.id, b.id)];
    if (h && h.p != null) pen += Math.max(0, DECAY - (round - h.p)) * 3;
  });
  teams[0].forEach((a) =>
    teams[1].forEach((b) => {
      const h = history[pairKey(a.id, b.id)];
      if (h && h.o != null) pen += Math.max(0, DECAY - (round - h.o)) * 1;
    })
  );
  return pen;
}

export function teamAssign(four, type, history, round) {
  let opts;
  if (type === "mixed") {
    const M = four.filter((p) => p.gender === "M");
    const F = four.filter((p) => p.gender === "F");
    opts = [
      [[M[0], F[0]], [M[1], F[1]]],
      [[M[0], F[1]], [M[1], F[0]]],
    ];
  } else {
    const g = four;
    opts = [
      [[g[0], g[1]], [g[2], g[3]]],
      [[g[0], g[2]], [g[1], g[3]]],
      [[g[0], g[3]], [g[1], g[2]]],
    ];
  }
  const valid = opts.filter(keepStack);
  if (valid.length) opts = valid;
  let best = null;
  opts.forEach((o) => {
    const d = Math.abs(
      o[0][0].level + o[0][1].level - (o[1][0].level + o[1][1].level)
    );
    const score = d * 2 + repeatPenalty(o, history, round) * 2; // lower is better
    if (!best || score < best.score) best = { score, d, teams: o };
  });
  return { teams: best.teams, diff: best.d };
}

function unitCombos(units, need) {
  const res = [];
  (function go(s, acc, sum) {
    if (sum === need) {
      res.push(acc.slice());
      return;
    }
    if (sum > need || res.length > 400) return;
    for (let i = s; i < units.length; i++) {
      const u = units[i];
      if (sum + u.players.length > need) continue;
      acc.push(u);
      go(i + 1, acc, sum + u.players.length);
      acc.pop();
    }
  })(0, [], 0);
  return res;
}

// FIFO-first: anchor is always the front unit; complete the four with the
// earliest-queued compatible players. Rotation memory breaks ties toward fresh
// partners/opponents without overriding FIFO order.
export function pickFour(pool, history, round) {
  const units = buildUnits(pool);
  // Fairness is measured per PLAYER by queue position, not per unit. This stops a
  // stacked pair (one unit, two slots) from getting an artificial "cheaper" score
  // and cutting ahead of players who have waited longer.
  const rank = new Map();
  pool
    .slice()
    .sort((a, b) => a.qt - b.qt)
    .forEach((p, i) => rank.set(p.id, i));
  for (let ai = 0; ai < units.length; ai++) {
    const anchor = units[ai];
    const locked = anchor.players;
    if (locked.length > 4) continue;
    const need = 4 - locked.length;
    const others = units.slice();
    others.splice(ai, 1);
    const window = others.slice(0, 14);
    let best = null;
    unitCombos(window, need).forEach((c) => {
      const extra = c.reduce((a, u) => a.concat(u.players), []);
      const four = locked.concat(extra);
      if (four.length !== 4) return;
      const type = deriveType(four);
      if (!type) return;
      if (!four.every((p) => compat(p, type))) return;
      // Sum the queue positions of the players pulled in beyond the anchor.
      const cost = extra.reduce((s, p) => s + (rank.get(p.id) || 0), 0);
      const ta = teamAssign(four, type, history, round);
      const rep = repeatPenalty(ta.teams, history, round);
      // FIFO (cost) dominates; balance + rotation memory decide within/among near-ties.
      const score = cost * 10000 + ta.diff + rep * 20;
      if (!best || score < best.score)
        best = { score, four, type, teams: ta.teams };
    });
    if (best) return { four: best.four, type: best.type, teams: best.teams };
  }
  return null;
}

export function findChallengers(waitingList, type) {
  const w = waitingList.slice().sort((a, b) => a.qt - b.qt);
  const firstN = (g, n) => {
    const r = [];
    for (let i = 0; i < w.length && r.length < n; i++) {
      if (w[i].gender === g && compat(w[i], type) && !w[i].stackId) r.push(w[i]);
    }
    return r.length === n ? r : null;
  };
  if (type === "mixed") {
    const m = firstN("M", 1),
      f = firstN("F", 1);
    return m && f ? m.concat(f) : null;
  }
  if (type === "mens") return firstN("M", 2);
  return firstN("F", 2);
}
