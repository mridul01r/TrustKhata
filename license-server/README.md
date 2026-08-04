# RetailERP License Server

A small, always-online service that issues license keys for the RetailERP
desktop app — either a time-limited trial, or a permanent license after
payment via Razorpay. Runs independently of the main app (which stays
offline-first on the customer's PC).

## What this does

- `POST /trial` — issues a 14-day trial license and emails it
- `POST /checkout/create-payment-link` — creates a Razorpay payment link for the website's "Buy now" button
- `POST /webhooks/razorpay` — Razorpay calls this automatically after a successful payment; issues a permanent (`PERPETUAL`) license and emails it
- `GET /health` — uptime check
- `POST /debug/verify` — paste a license key back in to confirm it's well-formed (sanity check only, not used by the desktop app)

License keys are signed with the **same Ed25519 keypair** as the existing
`license-tool/LicenseKeyGenerator.java` tool, so keys issued here work with
every already-shipped copy of the desktop app with no changes needed there.

## One-time local setup

```powershell
npm install
```

Copy `.env.example` to `.env` and fill in:

```powershell
Copy-Item .env.example .env
```

- `LICENSE_SIGNING_PRIVATE_KEY` / `LICENSE_SIGNING_PUBLIC_KEY` — use the **real** keypair from `license-tool` (the files `license-private-key.txt` / `license-public-key.txt`), not a freshly generated one.

Verify it builds cleanly:

```powershell
npx tsc --noEmit
```

Run it locally:

```powershell
npm run dev
```

## What you still need to plug in (the only remaining work)

Nothing else in the code needs to change — just these values in `.env`, and two things to configure in outside dashboards:

| # | What | Where it comes from | Goes in |
|---|------|----------------------|---------|
| 1 | Razorpay API keys | Razorpay Dashboard → Settings → API Keys | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| 2 | Razorpay webhook secret | Razorpay Dashboard → Settings → Webhooks → after adding the webhook URL (see below) | `RAZORPAY_WEBHOOK_SECRET` |
| 3 | Payment success redirect | Your real website's "thank you" page URL, once it exists | `PAYMENT_CALLBACK_URL` |
| 4 | Resend API key | [resend.com](https://resend.com) → API Keys, after verifying your sending domain | `RESEND_API_KEY` |
| 5 | Sender email address | Must be on a domain verified in Resend | `LICENSE_EMAIL_FROM` |

**Configuring the Razorpay webhook (do this after deploying, see below):**
1. Razorpay Dashboard → Settings → Webhooks → Add New Webhook
2. URL: `https://<your-deployed-domain>/webhooks/razorpay`
3. Active events: check `payment.captured` (and `payment_link.paid` if using Payment Links)
4. Save — Razorpay shows you the webhook secret once; copy it into `RAZORPAY_WEBHOOK_SECRET`

**Connecting the website later:**
- "Start free trial" button → `POST https://<your-domain>/trial` with `{ "email": "...", "customerName": "..." }`
- "Buy now" button → `POST https://<your-domain>/checkout/create-payment-link` with `{ "email": "...", "customerName": "...", "amountRupees": ... }`, then redirect the browser to the `paymentUrl` it returns

No other code changes are needed for either integration — both routes are already built and tested.

## Deploying (Render — recommended)

Render's free tier is enough for this service's traffic level.

1. Push this `license-server` folder to its own GitHub repo (or a subfolder of an existing one, using Render's "Root Directory" setting)
2. [render.com](https://render.com) → New → Web Service → connect the repo
3. Settings:
   - **Root Directory**: `license-server` (if part of a larger repo)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free is fine to start
4. Add every variable from `.env` (except comments) under Render's **Environment** tab — never commit `.env` itself
5. Deploy. Render gives you a URL like `https://retailerp-license-server.onrender.com` — that's the domain to use in the Razorpay webhook setup and the website integration above

**Alternative: Railway** — nearly identical process at [railway.app](https://railway.app); also has a usable free tier and auto-detects Node projects with less manual configuration than Render.

**Note on free-tier cold starts:** both Render and Railway free tiers spin the service down after inactivity, causing a several-second delay on the first request after idle. For a trial/purchase flow (not instant/high-frequency), this is a minor UX detail, not a functional problem — worth knowing about, not worth paying for a paid tier to avoid unless it bothers you.

## Known gaps (not yet built, flagged for later — not urgent)

- **No trial-abuse prevention** — nothing stops the same email requesting unlimited trials. Would need a small persistence layer (even a lightweight database table) to track "this email already got a trial."
- **No webhook idempotency** — if Razorpay retries a webhook delivery (which it does on timeout or non-2xx response), a duplicate `PERPETUAL` license would be issued for the same payment. Low-impact today (an extra license costs nothing), but worth a dedup table if it ever matters.

Both are deliberate scope cuts to keep this shippable now — revisit if real usage shows they're needed.
