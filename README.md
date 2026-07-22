# PicklePlay — Host Console (private beta)

A phone-first web app that runs a pickleball open-play paddle queue: FIFO by check-in,
hidden 5-level skill balancing, per-player format rules (mixed / men's / women's),
dynamic stacking, per-court timers + standby, idle tracking, manual swaps, custom
court names and voice announcements. Sign-in is Google OAuth, gated to an email allowlist.

Built with Next.js (App Router) + Auth.js (NextAuth v5). No database — session data lives
in the browser during a session and is exported as CSV when you end it. (Server storage is
the recommended next step; see "Next steps".)

---

## 1. Run locally (5 minutes)

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

You'll be redirected to `/login`. After Google sign-in (with an allowlisted email) you land
in the host console.

### Environment variables

| Variable | What it is |
| --- | --- |
| `AUTH_SECRET` | Random secret. Generate with `npx auth secret` or `openssl rand -base64 32`. |
| `AUTH_GOOGLE_ID` | Google OAuth client ID. |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret. |
| `ALLOWLIST` | Comma-separated emails allowed to sign in. **Leave blank = anyone with Google can enter (not for beta).** |
| `NEXT_PUBLIC_BUGREPORT_URL` | Where the "Report a bug" button points (a Google Form, or a `mailto:` link). |

---

## 2. Create Google OAuth credentials

1. Go to <https://console.cloud.google.com> → create/select a project.
2. **APIs & Services → OAuth consent screen**: choose **External**, fill app name + your email,
   and **keep it in "Testing"** mode. Add your beta hosts under **Test users** (this is a second
   layer of private access on top of `ALLOWLIST`).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.**
4. Add **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (local dev)
   - `https://YOUR-APP.vercel.app/api/auth/callback/google` (add after step 3 below)
5. Copy the **Client ID** and **Client secret** into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

---

## 3. Deploy to Vercel (tonight)

1. Push this folder to a GitHub repo.
2. On <https://vercel.com>, **Add New → Project → import the repo.** Framework auto-detects as Next.js.
3. In the Vercel project **Settings → Environment Variables**, add all five variables from the table above.
   - For `AUTH_SECRET`, generate a fresh value.
   - Set `ALLOWLIST` to your beta hosts' Google emails.
4. **Deploy.** You'll get `https://YOUR-APP.vercel.app`.
5. Go back to Google Cloud (step 2.4) and add the Vercel redirect URI:
   `https://YOUR-APP.vercel.app/api/auth/callback/google`.
6. Visit the URL, sign in, and you're live. On the host's phone, use the browser's
   **"Add to Home Screen"** to run it like an app; pair the Bluetooth speaker and the
   voice announcements play through it.

If Google sign-in ever loops or errors on Vercel, set `AUTH_URL=https://YOUR-APP.vercel.app`
in the environment variables and redeploy.

---

## 4. Controlling access (private beta)

Two gates, use either or both:

- **`ALLOWLIST`** — only these emails can complete sign-in. Add/remove emails and redeploy.
- **Google "Testing" consent screen** — only emails you list as **Test users** can authorize at all.

To onboard a new club host: add their Google email to `ALLOWLIST` (and to Google Test users),
redeploy, send them the URL.

---

## 5. How the engine works (for testing)

- **FIFO** — the front of the queue always plays next; new check-ins join the back.
- **Levels** — host picks 1 of 5 on check-in; only Beginner/Intermediate/Advance show, the two
  in-between levels are used silently for balancing.
- **Formats** — a legal game is 4 men, 4 women, or 2+2 mixed (1M/1F per team). A player's
  "must play" format is honored; if it can't be filled yet, they hold the front and the court
  runs another game.
- **Stacking** — link two waiting players; they play as partners and move as one unit at the
  later partner's queue position.
- **Standby** — each court shows the next group so you can pre-stack paddles.
- **Idle** — live per-player timer; turns red past your threshold (Settings).
- **Method** — Re-queue all (default) or Winners stay (ladder mode), set per session.

---

## Next steps (post-beta)

- **Server persistence**: add Supabase (Postgres) so sessions/players/games survive refresh and
  sync across devices, and so you can analyze usage. Store courts' live matches by player IDs.
- **Billing**: Stripe Billing for subscription tiers + Stripe Checkout for credit top-ups; meter
  usage and gate features (max courts/players, history/export) by plan server-side.
- **PWA manifest + service worker** for a true installable app and offline resilience.

## File map

```
auth.js                       Auth.js config (Google + allowlist gate)
app/page.js                   Protected entry — redirects to /login if signed out
app/login, app/denied         Auth pages
app/api/auth/[...nextauth]    Auth.js route handler
lib/engine.js                 Pure FIFO/format/stacking engine
components/HostApp.js         The host console UI + state
components/CreateSessionForm  Session creation (name/date/time/location/method/courts)
components/CheckInForm        Player check-in
app/globals.css               Design system (light + dark)
```
