"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Reset() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    const type = params.get("type") || "recovery";
    const code = params.get("code");

    // If Supabase delivered the recovery session via the URL hash, it fires this.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) { setAuthed(true); setReady(true); }
    });

    (async () => {
      // Give @supabase/ssr's auto-detect a beat — it may consume the code/hash itself.
      let ok = false;
      try {
        if (token_hash) {
          const { error } = await supabase.auth.verifyOtp({ type, token_hash });
          if (!error) ok = true;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) ok = true;
        }
      } catch (e) {
        /* fall through to session check */
      }
      // Whatever happened above, trust an actual session if one exists.
      if (!ok) {
        const { data } = await supabase.auth.getSession();
        if (data.session) ok = true;
      }
      if (ok) { setAuthed(true); setErr(""); }
      else setErr("This reset link is invalid or expired. Request a new one from the login page.");
      setReady(true);
    })();

    return () => sub?.subscription?.unsubscribe();
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
              disabled={!ready || !authed}
              style={{ marginBottom: 10 }}
            />
            <button className="btn btn-primary btn-lg" onClick={submit} disabled={busy || !ready || !authed}>
              {busy ? "Saving…" : "Save new password"}
            </button>
            {err && <p className="auth-note" style={{ color: "var(--danger)" }}>{err}</p>}
            {!authed && !err && ready && (
              <p className="auth-note">Waiting for the reset link to verify…</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
