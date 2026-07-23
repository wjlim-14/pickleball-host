"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const PARTS = ["Under 10", "10–20", "20–40", "40–70", "70+"];
const MEETS = ["1", "2", "3", "4+"];

export default function Register() {
  const router = useRouter();
  const [f, setF] = useState({
    email: "",
    password: "",
    club: "",
    meets: "2",
    participants: "20–40",
    location: "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    setErr("");
    if (!f.email.trim() || f.password.length < 6 || !f.club.trim()) {
      setErr("Enter an email, a 6+ character password, and your club name.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
    });
    if (error) {
      setBusy(false);
      setErr(error.message);
      return;
    }
    await supabase.rpc("submit_registration", {
      p_club: f.club.trim(),
      p_meets: f.meets,
      p_participants: f.participants,
      p_location: f.location.trim(),
    });
    setBusy(false);
    router.replace("/activate");
    router.refresh();
  };

  return (
    <main className="centered">
      <div className="auth-card" style={{ maxWidth: 380 }}>
        <div className="brand">
          <span className="brand-dot" />
          QuickQueue
        </div>
        <p className="auth-sub">Register your club for the beta</p>

        <input type="email" placeholder="Email" value={f.email} onChange={(e) => set("email", e.target.value)} style={{ marginBottom: 8 }} />
        <input type="password" placeholder="Password (6+ characters)" value={f.password} onChange={(e) => set("password", e.target.value)} style={{ marginBottom: 8 }} />
        <input type="text" placeholder="Club / venue name" value={f.club} onChange={(e) => set("club", e.target.value)} style={{ marginBottom: 8 }} />
        <input type="text" placeholder="Location (city)" value={f.location} onChange={(e) => set("location", e.target.value)} style={{ marginBottom: 10 }} />

        <div style={{ fontSize: 12, color: "var(--text-2)", textAlign: "left", marginBottom: 4 }}>Meet-ups per week</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {MEETS.map((m) => (
            <button key={m} className={"btn" + (f.meets === m ? " btn-primary" : "")} style={{ flex: 1 }} onClick={() => set("meets", m)}>{m}</button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "var(--text-2)", textAlign: "left", marginBottom: 4 }}>Participants per session</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {PARTS.map((p) => (
            <button key={p} className={"btn" + (f.participants === p ? " btn-primary" : "")} style={{ flex: "1 1 30%", fontSize: 12 }} onClick={() => set("participants", p)}>{p}</button>
          ))}
        </div>

        <button className="btn btn-primary btn-lg" onClick={submit} disabled={busy}>
          {busy ? "Creating account…" : "Register"}
        </button>
        {err && <p className="auth-note" style={{ color: "var(--danger)" }}>{err}</p>}
        <p className="auth-note">Already have an account? <Link href="/login">Log in</Link></p>
      </div>
    </main>
  );
}
