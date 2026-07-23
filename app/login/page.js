"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const send = async () => {
    if (!email.trim()) return;
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  };

  return (
    <main className="centered">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-dot" />
          QuickQueue
        </div>
        <p className="auth-sub">Host console — private beta</p>

        {sent ? (
          <>
            <p className="auth-note">
              Check your email — we sent a sign-in link to <b>{email}</b>. Open it on
              this device to continue.
            </p>
            <button className="btn btn-lg" onClick={() => setSent(false)}>
              Use a different email
            </button>
          </>
        ) : (
          <>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              autoFocus
              style={{ marginBottom: 10, textAlign: "center" }}
            />
            <button className="btn btn-primary btn-lg" onClick={send} disabled={busy}>
              {busy ? "Sending…" : "Email me a sign-in link"}
            </button>
            {err && (
              <p className="auth-note" style={{ color: "var(--danger)" }}>{err}</p>
            )}
          </>
        )}
        <p className="auth-note">Access is limited to invited club hosts.</p>
      </div>
    </main>
  );
}
