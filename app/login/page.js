export default function Login({ searchParams }) {
  const err = searchParams?.e;
  return (
    <main className="centered">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-dot" />
          PicklePlay
        </div>
        <p className="auth-sub">Host console — private beta</p>
        <form method="post" action="/api/login">
          <input
            name="code"
            type="password"
            placeholder="Access code"
            autoFocus
            required
            style={{ marginBottom: 10 }}
          />
          <button className="btn btn-primary btn-lg" type="submit">
            Enter
          </button>
        </form>
        {err ? (
          <p className="auth-note" style={{ color: "var(--danger)" }}>
            Wrong code. Try again.
          </p>
        ) : (
          <p className="auth-note">Enter the access code your organizer gave you.</p>
        )}
      </div>
    </main>
  );
}
