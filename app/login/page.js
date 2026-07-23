"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "forgot"
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const login = async () => {
    setErr("");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pw,
    });
    setBusy(false);
    if (error) {
      setErr("Wrong email or password. New here? Create an account below.");
      return;
    }
    router.replace("/");
    router.refresh();
  };

  const sendReset = async () => {
    if (!email.trim()) { setErr("Enter your email first."); return; }
    setErr("");
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${location.origin}/reset`,
    });
    setBusy(false);
    setSent(true);
  };

  return (
    <main className="centered">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-dot" />
          QuickQueue
        </div>

        {mode === "forgot" ? (
          sent ? (
            <>
              <p className="auth-sub">Check your email</p>
              <p className="auth-note" style={{ marginTop: 0 }}>
                If <b>{email}</b> has an account, we sent a link to reset your password.
              </p>
              <button className="btn btn-lg" onClick={() => { setMode("login"); setSent(false); setErr(""); }}>
                Back to log in
              </button>
            </>
          ) : (
            <>
              <p className="auth-sub">Reset your password</p>
              <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReset()} autoFocus style={{ marginBottom: 10 }} />
              <button className="btn btn-primary btn-lg" onClick={sendReset} disabled={busy}>
                {busy ? "Sending…" : "Email me a reset link"}
              </button>
              {err && <p className="auth-note" style={{ color: "var(--danger)" }}>{err}</p>}
              <p className="auth-note">
                <a onClick={() => { setMode("login"); setErr(""); }} style={{ cursor: "pointer" }}>Back to log in</a>
              </p>
            </>
          )
        ) : (
          <>
            <p className="auth-sub">Host console — private beta</p>
            <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus style={{ marginBottom: 8 }} />
            <input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} style={{ marginBottom: 10 }} />
            <button className="btn btn-primary btn-lg" onClick={login} disabled={busy}>
              {busy ? "Logging in…" : "Log in"}
            </button>
            {err && <p className="auth-note" style={{ color: "var(--danger)" }}>{err}</p>}
            <p className="auth-note" style={{ marginBottom: 4 }}>
              <a onClick={() => { setMode("forgot"); setErr(""); }} style={{ cursor: "pointer" }}>Forgot password?</a>
            </p>
            <p className="auth-note" style={{ marginTop: 0 }}>
              New here? <Link href="/register">Create an account</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
