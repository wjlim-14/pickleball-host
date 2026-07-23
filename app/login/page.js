"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

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

  return (
    <main className="centered">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-dot" />
          QuickQueue
        </div>
        <p className="auth-sub">Host console — private beta</p>
        <input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          style={{ marginBottom: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          style={{ marginBottom: 10 }}
        />
        <button className="btn btn-primary btn-lg" onClick={login} disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
        {err && <p className="auth-note" style={{ color: "var(--danger)" }}>{err}</p>}
        <p className="auth-note">
          New here? <Link href="/register">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
