"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ActivateClient({ email, name }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [req, setReq] = useState({ name: name || "", email: email || "", club: "", location: "", message: "" });
  const [sent, setSent] = useState(false);

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

  const submitRequest = async () => {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("beta_requests").insert({
      name: req.name, email: req.email, club: req.club, location: req.location, message: req.message,
    });
    setBusy(false);
    setSent(true);
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
        {!showForm ? (
          <>
            <p className="auth-sub">Enter your beta access code</p>
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
            <p className="auth-note">
              Don&apos;t have a code?{" "}
              <a onClick={() => setShowForm(true)} style={{ cursor: "pointer" }}>Contact us for beta access</a>
            </p>
          </>
        ) : sent ? (
          <>
            <p className="auth-sub">Request received</p>
            <p className="auth-note">Thanks! We&apos;ll email your access code soon.</p>
            <button className="btn btn-lg" onClick={() => setShowForm(false)}>Back</button>
          </>
        ) : (
          <>
            <p className="auth-sub">Request beta access</p>
            <input placeholder="Your name" value={req.name} onChange={(e) => setReq({ ...req, name: e.target.value })} style={{ marginBottom: 8 }} />
            <input placeholder="Email" value={req.email} onChange={(e) => setReq({ ...req, email: e.target.value })} style={{ marginBottom: 8 }} />
            <input placeholder="Club / venue" value={req.club} onChange={(e) => setReq({ ...req, club: e.target.value })} style={{ marginBottom: 8 }} />
            <input placeholder="Location" value={req.location} onChange={(e) => setReq({ ...req, location: e.target.value })} style={{ marginBottom: 8 }} />
            <textarea placeholder="Anything else? (optional)" value={req.message} onChange={(e) => setReq({ ...req, message: e.target.value })} style={{ marginBottom: 10, minHeight: 70 }} />
            <button className="btn btn-primary btn-lg" onClick={submitRequest} disabled={busy}>
              {busy ? "Sending…" : "Send request"}
            </button>
            <button className="btn btn-lg" style={{ marginTop: 8 }} onClick={() => setShowForm(false)}>Back</button>
          </>
        )}
        <p className="auth-note" style={{ marginTop: 16 }}>
          Signed in as {email}. <a onClick={signOut} style={{ cursor: "pointer" }}>Sign out</a>
        </p>
      </div>
    </main>
  );
}
