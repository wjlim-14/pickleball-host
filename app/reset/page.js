"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Reset() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setErr("This reset link is invalid or expired. Request a new one from the login page.");
        setReady(true);
      });
    } else {
      setReady(true);
    }
  }, []);

  const submit = async () => {
    if (pw.length < 6) { setErr("Use at least 6 characters."); return; }
    setErr("");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setDone(true);
  };

  return (
    <main className="centered">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-dot" />
          QuickQueue
        </div>

        {done ? (
          <>
            <p className="auth-sub">Password updated</p>
            <button className="btn btn-primary btn-lg" onClick={() => { router.replace("/"); router.refresh(); }}>
              Continue
            </button>
          </>
        ) : (
          <>
            <p className="auth-sub">Set a new password</p>
            <input
              type="password"
              placeholder="New password (6+ characters)"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoFocus
              disabled={!ready}
              style={{ marginBottom: 10 }}
            />
            <button className="btn btn-primary btn-lg" onClick={submit} disabled={busy || !ready}>
              {busy ? "Saving…" : "Save new password"}
            </button>
            {err && <p className="auth-note" style={{ color: "var(--danger)" }}>{err}</p>}
          </>
        )}
      </div>
    </main>
  );
}
