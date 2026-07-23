"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ActivateClient({ email }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const redeem = async () => {
    setErr("");
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("redeem_code", { p_code: code.trim() });
    setBusy(false);
    if (error) { setErr("Something went wrong. Try again."); return; }
    if (data === true) { router.replace("/"); router.refresh(); }
    else setErr("That code isn't valid or has already been used.");
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <main className="centered">
      <div className="auth-card">
        <div className="brand"><span className="brand-dot" />QuickQueue</div>
        <p className="auth-sub">Your account is pending approval</p>
        <p className="auth-note" style={{ marginTop: 0 }}>
          Thanks for registering! We&apos;ll review your club and email your activation code shortly. Enter it below once you have it.
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && redeem()}
          placeholder="QQ-XXXXXXXX"
          autoFocus
          style={{ marginBottom: 10, textAlign: "center", textTransform: "uppercase" }}
        />
        <button className="btn btn-primary btn-lg" onClick={redeem} disabled={busy}>
          {busy ? "Checking…" : "Activate"}
        </button>
        {err && <p className="auth-note" style={{ color: "var(--danger)" }}>{err}</p>}
        <p className="auth-note" style={{ marginTop: 16 }}>
          Signed in as {email}. <a onClick={signOut} style={{ cursor: "pointer" }}>Sign out</a>
        </p>
      </div>
    </main>
  );
}
