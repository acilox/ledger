# Ledger v0.1.0 — Deployment Guide

**Audience:** you (Dheeraj). Every command is copy-pasteable. Every
dashboard step spells out the exact clicks and the exact values.

**Time budget:** ~2 hours of focused work, plus 1-7 days of *waiting*
if any account (Polar, Cloudflare) still needs verification.

**Companion docs:**
- [AGENTS.md](AGENTS.md) — architecture + code map, for context.
- [roadmap.md](roadmap.md) — what comes after v0.1.0.
- [acilox-com-labs-changes.md](acilox-com-labs-changes.md) — the
  exact block to paste on `acilox.com/labs` in Stage 8.

---

## Stage 0 — Prerequisites checklist

Before starting Stage 1, all of the following must be true. If any
item is a `[ ]`, resolve it first.

- [ ] **Polar.sh organization "Acilox" verified.** If AMG has already
      launched, this is done. Otherwise:
      → Sign up at [polar.sh](https://polar.sh) as an org named
      **"Acilox"**. Submit ID verification. Wait 1-7 days.
- [ ] **Cloudflare account with Workers + Pages access.** Free tier
      is fine.
      → Sign up at [dash.cloudflare.com](https://dash.cloudflare.com).
      Ensure `acilox.com`'s DNS is managed by Cloudflare (Websites →
      Add site).
- [ ] **GitHub org `acilox` exists** and you have a Personal Access
      Token with `repo` scope. Per
      [github_pat_handling memory](../../../.claude/projects/-Users-dkumar191-Documents-Custom-Projects-portfolio/memory/github_pat_handling.md),
      do NOT save this PAT anywhere on disk.
- [ ] **Node.js 20+ + npm.** `node -v` → should print `v20.x` or
      higher.
- [ ] **Git configured with the correct commit email.** Per
      [commit_email memory](../../../.claude/projects/-Users-dkumar191-Documents-Custom-Projects-portfolio/memory/commit_email.md),
      set locally for this repo:
      ```bash
      cd "labs/ledger"
      git config user.email "acidb062@gmail.com"
      git config user.name "Dheeraj Kumar"
      ```
- [ ] **`wrangler` CLI logged into Cloudflare.** Run once (opens a
      browser):
      ```bash
      npx wrangler login
      ```
- [ ] **You are in the portfolio project root.** All paths below are
      relative to `/Users/dkumar191/Documents/Custom Projects/portfolio/`.

---

## Stage 1 — Local proof (~10 min)

Confirm the code compiles, tests pass, and the built bundle actually
runs on `localhost` before you push a single byte to production.

```bash
cd "labs/ledger"

# First-time only. Uses the local .npmrc that overrides the Uber
# internal registry with the public npm registry.
npm install

# SvelteKit type-generation. Required after every fresh install.
npm run prepare

# TypeScript check. Must be clean.
npm run lint

# 36 unit tests (distortions, digest, export, license state).
npm test

# Static SPA build → build/
npm run build

# Serve build/ for a smoke check → http://localhost:4173
npm run preview
```

**Manually walk each route in the previewed build** (not the dev
server — the dev server can hide production-only bugs):

- `/` — should redirect to `/welcome` on first visit; complete the
  3-slide welcome; land on the empty entry list.
- `/new` — create a thought record. Fill every field. Save. Confirm
  it appears on `/`.
- `/panic` — write a note, drag the slider, save. Confirm it appears
  on `/` with the panic badge.
- `/entry/thought-1` — the entry you just created. Delete workflow
  is two-step (confirm) — click Delete, then confirm.
- `/digest` — should show your 2 entries this week. Toggle
  rolling-7d / calendar-week.
- `/settings` — try the therapist toggle, add a custom distortion
  ("catastrophic future thinking" or similar), delete it. Try
  "Encrypted backup" with a passphrase (≥8 chars); download the
  file. Try "Import backup" with the file you just downloaded.

**Print check:** open any entry, hit `Cmd/Ctrl + P`. The layout
should show only the field content on white, no navbar/buttons.

**PWA install check** (Chrome only):
- Chrome menu (⋮) → Install Ledger… → confirm.
- Open the installed app from Launchpad/Start menu → confirm it
  opens standalone (no browser chrome).
- Create an entry, close the app entirely, reopen → confirm the
  entry persists.

**License worker tests** (from the shared package):

```bash
cd "../_shared/license-worker"
npm install
npm test    # 26 tests total — 21 existing + 5 new product-id tests
```

If any of the above fails, **stop and fix before moving on.** Every
downstream stage assumes green here.

---

## Stage 2 — Push to GitHub (~15 min)

**Create the empty repo:**

1. Go to [github.com/organizations/acilox/repositories/new](https://github.com/organizations/acilox/repositories/new).
2. Repository name: **`ledger`**
3. Description: **`A calm CBT thought record. Yours forever.`**
4. Public.
5. **Do NOT** initialize with README, .gitignore, or license — the
   repo already has them.
6. Click **Create repository**.
7. On the empty-repo page, note the HTTPS URL:
   `https://github.com/acilox/ledger.git`.

**Push the local code:**

```bash
cd "labs/ledger"

# .gitignore already excludes node_modules, build/, .svelte-kit/, etc.
git init
git add -A
git commit -m "v0.1.0 initial release"

# Push using PAT-in-URL so nothing is saved to disk.
# Replace <PAT> with your Personal Access Token; the shell history
# capture setting on your mac is off, but for extra safety, prefix
# the command with a leading space to skip it entirely.
 git remote add origin https://<PAT>@github.com/acilox/ledger.git
 git branch -M main
 git push -u origin main

# Tag v0.1.0 and push the tag.
 git tag v0.1.0
 git push origin v0.1.0

# Immediately scrub the PAT from the remote URL.
 git remote set-url origin https://github.com/acilox/ledger.git
```

**Verify on GitHub:**
- The repo shows all files, README renders, no `node_modules/` or
  `build/`.
- `v0.1.0` tag appears on the tags page.
- On the repo home: click ⚙ (top-right) → set homepage
  `https://ledger.acilox.com`, add topics: `cbt`, `mental-health`,
  `pwa`, `local-first`, `sveltekit`, `svelte`, `dexie`,
  `thought-record`.

**If this is the first push to `acilox/*`,** confirm the commit
author on the GitHub commit page shows **acidb062@gmail.com**, NOT
`dkumar191`. If it shows `dkumar191`, you set the wrong email in
Stage 0 — fix and force-push (only safe because this is the initial
commit and nobody else has pulled yet):

```bash
git commit --amend --author="Dheeraj Kumar <acidb062@gmail.com>" --no-edit
git push -f origin main
```

---

## Stage 3 — Redeploy the license worker (~10 min)

Ledger reuses the same license worker as AMG and FHIR Lens. The only
change needed for Ledger is that Ledger is registered in
`KNOWN_PRODUCT_IDS` (already done in code). You just need to
redeploy so production picks up the change.

```bash
cd "labs/_shared/license-worker"

# Deploy — assumes wrangler.toml already has the KV namespace id
# from the AMG deployment. If it still says
# "REPLACE_AFTER_CREATING_NAMESPACE", follow the AMG worker README
# stage first (npx wrangler kv:namespace create LICENSES).
npx wrangler deploy
```

You'll see something like:
```
Deployed acilox-license-worker triggers:
  https://acilox-license-worker.<your-subdomain>.workers.dev
```

**Note this URL** — you'll paste it in Stage 5 (`LICENSE_SERVER_URL`)
and Stage 4 (Polar webhook).

**Verify the deploy accepts the `ledger` product_id:**

```bash
# Replace <WORKER_URL> with the URL above.
export WORKER_URL="https://acilox-license-worker.<your-subdomain>.workers.dev"

# Should return: {"valid":false,"message":"License key not recognised..."}
curl -s "$WORKER_URL/v1/validate" \
  -H 'content-type: application/json' \
  -d '{"license_key":"nope","product_id":"ledger"}'

# Should return: HTTP 400 + {"valid":false,"message":"Unknown product_id \"nope-product\". ..."}
curl -si "$WORKER_URL/v1/validate" \
  -H 'content-type: application/json' \
  -d '{"license_key":"x","product_id":"nope-product"}' | head -5
```

Both must respond as noted. If either doesn't, the deploy is stale —
re-run `npx wrangler deploy`.

---

## Stage 4 — Create the Polar product (~15 min)

You need to create one product in Polar's dashboard, enable license
keys on it with the `lg-` prefix, and confirm the webhook from AMG
still fires for the new product.

**Create the product:**

1. Log in at [polar.sh/dashboard/acilox](https://polar.sh/dashboard/acilox).
2. Left sidebar → **Products** → **Create Product**.
3. Fill:
   - **Name:** `Ledger Pro`
   - **Description** (paste verbatim):
     ```
     Ledger Pro unlocks unlimited entry history, the richer weekly
     digest (top reframes + hardest panics), and encrypted backup
     (AES-GCM-256 with PBKDF2-SHA256, 310,000 iterations). Lifetime
     license — no subscription. Ledger is not a medical device and
     is not a substitute for professional care.
     ```
   - **Pricing model:** One-time payment
   - **Price:** `$79.00 USD`
   - **Media:** upload a screenshot of the app (`labs/ledger/build/`
     after a build, take a screenshot of `/` with 3-4 entries in
     it, or postpone and use a placeholder for now).
4. **Benefits** section → click **Add benefit** → **License Keys**:
   - **Prefix:** `lg` (Polar will produce keys like `lg_abc123...`)
   - **Expires after:** *(leave blank — lifetime)*
   - **Activation limit:** `3` (allows install on ~3 devices before
     the customer has to email support — a light anti-abuse without
     being punitive)
   - Click **Create Benefit** → attach it to the product.
5. Click **Save Product**.

**Grab the checkout URL:**

1. Back on the product page, click **Share** → **Copy checkout URL**.
2. It will look like `https://buy.polar.sh/<some-uuid>`.
3. **Note this URL** — you'll paste it into the labs marketing block
   in Stage 8.

**Confirm the webhook (from the earlier AMG launch) still catches
Ledger:**

If AMG's launch already configured a webhook, it will fire for every
product's license events on the same endpoint — no change needed.
Just verify:

1. Polar → Settings → Webhooks.
2. Confirm one webhook exists pointing at
   `https://acilox-license-worker.<your-subdomain>.workers.dev/webhooks/polar`.
3. Confirm the subscribed events include `license_key.created` and
   `license_key.updated`.
4. If missing, click **Add endpoint**, paste the worker URL, subscribe
   to those two events, copy the `whsec_...` secret shown, then set
   it on the worker:
   ```bash
   cd "labs/_shared/license-worker"
   npx wrangler secret put POLAR_WEBHOOK_SECRET
   # paste the whsec_... when prompted
   ```

**Sandbox purchase to prove wiring works:**

1. In Polar → your Ledger Pro product page → **⋮ menu** → **Purchase in sandbox** (top-right).
2. Use Polar's test card: `4242 4242 4242 4242`, any future expiry,
   any CVC, any name.
3. Complete the checkout.
4. Polar shows the issued license key. Copy it — starts with `lg_`.
5. Verify the worker received the webhook and stored the key:
   ```bash
   # In one terminal:
   cd "labs/_shared/license-worker"
   npx wrangler tail    # watch live logs

   # In another terminal:
   curl -s "$WORKER_URL/v1/validate" \
     -H 'content-type: application/json' \
     -d "{\"license_key\":\"lg_...\",\"product_id\":\"ledger\"}"
   ```
   Response must be `{"valid":true,"tier":"pro",...}`. If it's
   `valid:false`, the webhook didn't fire — check the tail logs and
   the webhook secret.
6. **Keep the test key handy** — you'll paste it into the deployed
   PWA in Stage 6.

---

## Stage 5 — Deploy the PWA to Cloudflare Pages (~20 min)

Ledger's build is a plain static directory. Cloudflare Pages serves
it at the edge for free.

**One-time: create the Pages project.**

```bash
cd "labs/ledger"

# Fresh build to be safe.
npm run build

# Create + deploy in one command.
npx wrangler pages deploy build --project-name ledger-acilox
```

The first run asks:
- **Production branch name:** `main`
- Confirms creation → deploys → prints a URL like
  `https://ledger-acilox.pages.dev`.

**Note this URL** and open it in a browser. The welcome flow should
render. Create an entry, close, reopen the tab → confirm persistence.

**Wire the custom domain `ledger.acilox.com`:**

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Workers
   & Pages → your `ledger-acilox` project.
2. Top tabs → **Custom domains** → **Set up a custom domain**.
3. Enter `ledger.acilox.com` → **Continue** → **Activate domain**.
4. Cloudflare auto-adds the CNAME to your `acilox.com` zone. SSL
   goes green within 30-90 seconds.
5. Visit **https://ledger.acilox.com/** → welcome flow should render
   with a valid cert.

**Verify service worker in a real deploy:**

1. Chrome DevTools → Application → Service Workers → confirm the
   Ledger service worker is `activated and is running`.
2. Application → Manifest → confirm manifest.webmanifest is parsed,
   all 4 icons load (192, 512, maskable 512, apple 180), theme color
   is `#0f172a`.
3. Application → Storage → confirm IndexedDB `ledger.v1` was created
   after your first entry.

**Install the PWA from the real origin:**

1. Chrome menu (⋮) on `ledger.acilox.com` → **Install Ledger…**
2. Confirm the icon on your dock/desktop uses the notes/journal
   mark, not a generic browser fallback (this validates that the
   PNG icons in the manifest resolve correctly).
3. Open the installed app → create a Pro tier test entry (you'll
   need Stage 6 for the license first, but a Free entry works to
   verify install).

**Set up an auto-deploy from GitHub (optional but recommended):**

1. Cloudflare Pages → project → Settings → Builds & deployments →
   Configure production deployments → **Connect to Git**.
2. Choose GitHub → authorize → pick `acilox/ledger`.
3. Build settings:
   - **Framework preset:** SvelteKit
   - **Build command:** `cd labs/ledger && npm install && npm run build`
     — wait, this doesn't work because the repo IS `labs/ledger`,
     not the whole portfolio. Correct settings:
     - **Root directory (advanced):** *(leave empty)*
     - **Build command:** `npm install && npm run build`
     - **Build output directory:** `build`
4. Save. Next push to `main` auto-deploys.

---

## Stage 6 — Pro end-to-end test on production (~15 min)

Prove the whole loop works: Polar → worker → deployed PWA → Pro tier
unlocked → encrypted backup exports → key revoke → tier drops.

1. **Open** https://ledger.acilox.com/.
2. **Complete the welcome flow** if not already done.
3. **Settings → Ledger Pro → Paste the `lg_...` sandbox key** from
   Stage 4 → click **Activate**.
4. Within ~1 second, a green **Pro** badge should appear at the top
   of Settings and on the entry list. If instead you see
   "Couldn't reach the license server", check DevTools → Network →
   the `/v1/validate` request should succeed. If it does but the
   response says `valid:false`, the worker didn't receive the webhook
   (revisit Stage 4).
5. **Create 30+ entries** (paste-and-save the same content is fine
   for the test). Confirm all remain visible on `/` — proves the
   Free 30-cap is lifted.
6. **Settings → Encrypted backup** → enter passphrase `test-passphrase-01`
   → **Export**. A `.json` file downloads.
7. **Open the file in a text editor** → confirm it's JSON, with
   `scheme: "aes-gcm-pbkdf2"`, `iterations: 310000`, no plaintext
   content visible.
8. **Application → Storage → Clear site data** → refresh.
9. Complete welcome again → **Settings → Import backup** → pick the
   file → enter `test-passphrase-01` → confirm entries restore.
10. **Revoke the license:** Polar → your test purchase → **Revoke
    license key**. In the PWA, either wait 24h or force a re-check:
    DevTools console →
    ```js
    localStorage.setItem('ledger.license.state.v1', '{}');
    location.reload();
    ```
    The Pro badge should drop back to Free (entry cap re-imposed on
    `/`, backup UI still visible but disabled).

If any step fails, do NOT proceed to Stage 8. Debug (see
Troubleshooting section at the bottom).

---

## Stage 7 — Regenerate PWA icons if you tweaked the SVG (skip if you didn't)

Only relevant if you changed `static/favicon.svg` at any point.

```bash
cd "labs/ledger"
npm run icons     # runs scripts/generate-icons.mjs (uses sharp)
npm run build
npx wrangler pages deploy build --project-name ledger-acilox
```

---

## Stage 8 — Update acilox.com/labs (~15 min)

Add the Ledger product card to the marketing surface.

1. Open [acilox-com-labs-changes.md](acilox-com-labs-changes.md) and
   read the whole file — it has the exact `<article class="product-card">`
   MDX block to insert.
2. **Replace `<LEDGER_PRODUCT_ID>`** in the block with the checkout
   URL slug you noted in Stage 4. (Whole URL is
   `https://buy.polar.sh/<slug>` — the block already includes the
   `https://buy.polar.sh/` prefix, so you're replacing just the
   `<LEDGER_PRODUCT_ID>` placeholder with the slug.)
3. In the `acilox.com` codebase, find the `<section class="labs-products">`
   opened by the AMG card. **Do not touch AMG or FHIR Lens content.**
   Paste the Ledger card **after** the FHIR Lens card (if present) or
   after AMG (if FHIR Lens isn't up yet). Order per the locked plan
   is: annual-ladder products first (AMG → FHIR Lens), then
   one-time (Ledger).
4. Add the small `.product-disclaimer` CSS from
   [acilox-com-labs-changes.md](acilox-com-labs-changes.md) if not
   already present in the labs-products stylesheet.
5. Commit + deploy `acilox.com` per its own deployment process (per
   [portfolio_site memory](../../../.claude/projects/-Users-dkumar191-Documents-Custom-Projects-portfolio/memory/portfolio_site.md),
   Astro 5 + Cloudflare Pages — same pattern).
6. **Verify on the live site:**
   - Card renders with the "Live · v0.1.0" badge.
   - "Open Ledger" button → https://ledger.acilox.com/ (correct
     redirect, no cert warning).
   - "Buy Pro Lifetime" button → the exact Polar checkout URL you
     captured. Open it, do NOT complete a real purchase — just
     confirm the correct product name + price shows.
   - Product disclaimer text is legible and italic per the CSS.

---

## Stage 9 — Launch day (~1 hour of active work; monitor for 24h)

Launch order matters. Do not post anywhere until everything below is
green.

**Final go/no-go checklist:**

- [ ] Stages 1-8 all completed with all verifications passing.
- [ ] `https://ledger.acilox.com/` loads within 2s from a cold browser.
- [ ] Buying with the sandbox card issues a `lg_...` key, PWA activates
      Pro within 1 second of pasting.
- [ ] Revoking removes Pro (already verified in Stage 6).
- [ ] The `acilox/ledger` GitHub repo is public and README renders.
- [ ] `acilox.com/labs` shows the Ledger card.

**Post the launch (in this exact order, don't parallelize):**

1. **Show HN post** (Tuesday-Thursday, 8-10am Pacific Time hits
   Front Page algorithm best).
   - Title: `Show HN: Ledger – a calm CBT thought record, local-first, one-time $79`
   - URL: `https://ledger.acilox.com`
   - Body (paste verbatim, edit lightly to sound like you):
     ```
     I built Ledger because every CBT app I tried had at least one of
     these three problems: it was a mood tracker with graphs
     (wrong format), it was an AI chatbot pretending to be a therapist
     (dangerous), or it was a subscription that would delete my
     entries if I ever stopped paying (bad long-term contract with
     therapy material).

     Ledger is a PWA. Entries live in your browser's IndexedDB. The
     only network call is an optional 24-hour license validation ping
     that includes just the license key. If you export your data,
     it's AES-GCM encrypted with a PBKDF2-SHA256 key derived from
     your passphrase — the server never sees plaintext.

     Free forever tier: full Burns/Beck thought-record format,
     30-second panic capture, weekly digest, last 30 entries. Pro is
     one-time $79 for unlimited history, the richer digest, and the
     encrypted backup.

     Not a medical device. If you're in crisis the welcome screen
     surfaces hotlines.

     Would love feedback from anyone doing thought records already —
     particularly on the format faithfulness and the print layout,
     since I designed it around bringing entries into therapy sessions.
     ```
2. **~15 min later**, once the post is live, share on Twitter/X (if
   you use it) with a link, screenshot of the app, and the same
   one-line pitch.
3. **~1 hour later**, crosspost carefully:
   - **r/CBT** — read the sidebar rules; some subs require
     self-promotion flair. Frame as "I built this tool for my own
     thought-record practice and would appreciate feedback on the
     format" — NOT "buy my product."
   - **r/therapists** — very self-promo strict. Only post if you
     have `[Tool]` flair permission from mods. Frame as "asking for
     therapist feedback on a client-facing CBT thought-record app I
     built."
   - Do **NOT** post to r/mentalhealth or r/anxiety — those subs
     correctly police self-promo around vulnerable users. A single
     misstep there can nuke your account's Reddit reputation
     permanently.

**During the first 24 hours, monitor:**

- Cloudflare Pages → your project → Analytics tab (real-time
  visitors, popular pages, error rate).
- Polar dashboard → Products → Ledger Pro (sales count).
- The license worker logs:
  ```bash
  cd "labs/_shared/license-worker"
  npx wrangler tail
  ```
  Watch for any 5xx or spikes in "Unknown product_id" (means someone
  is probing / a client is misconfigured).
- Hacker News comments — reply within 2 hours to every substantive
  comment. Don't argue. Concede real critiques with grace.
- Your inbox — `labs@acilox.com` if configured, or wherever product
  issues land.

**If something breaks in production:**

- **PWA doesn't load / white screen** → Cloudflare Pages → last
  deploy → check build logs. If the build is fine, check the
  service worker in Chrome DevTools → Application → Service Workers
  → **Unregister** and force-reload. Cache issues in the SW are the
  most common post-deploy fail.
- **License activation fails for real customers** → check `wrangler
  tail`, confirm the worker got the webhook, confirm the request from
  the PWA has `product_id: "ledger"`. If missing, it's a code bug in
  `license-cache.ts` — fix, redeploy, publish a v0.1.1.
- **Entries disappear on a customer's device** → this is a trust
  catastrophe for a mental-health tool. Turn it around within 12
  hours. Most likely cause: a browser update changed IndexedDB
  behavior for `.v1`. Ship a v0.1.1 with a schema-preserving
  migration and email affected customers directly.

---

## Stage 10 — Post-launch (first 30 days)

- **Day 1:** publish a short "day one in numbers" thread on X /
  LinkedIn / whatever channel you use. Traffic, sales, HN comment
  themes, first bug fix if any.
- **Day 7:** review Cloudflare Pages Analytics + Polar sales →
  first cohort data. If <30 installs → the channel is off, not the
  product. Reconsider channel mix before iterating the product.
- **Day 14:** ship v0.1.1 with anything from
  [roadmap.md § v0.1.x](roadmap.md) that came up in real feedback.
  Priorities: OG image, dedicated landing page, distortion-editor
  polish, search across entries.
- **Day 30:** kill-criteria review per
  [AGENTS.md § Kill criteria](AGENTS.md). Post a "one month in"
  note if there's anything honest to say (installs, sales, feedback
  themes).

---

## Troubleshooting

### "npm install" fails with EACCES / registry auth errors

Ledger's `.npmrc` overrides your global registry (which is set to
Uber internal) with the public npm registry. If it doesn't work:

```bash
cd "labs/ledger"
cat .npmrc            # should say: registry=https://registry.npmjs.org/
npm install --registry=https://registry.npmjs.org/
```

### "npx wrangler login" opens a browser but never completes

Cloudflare's OAuth callback can miss ports. Alternative: create an
API token at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
with the **Edit Cloudflare Workers** template + **Cloudflare Pages
Edit** permission, then:

```bash
export CLOUDFLARE_API_TOKEN='your-token-here'
npx wrangler whoami   # confirms authentication
```

### `npm run build` succeeds but preview shows a blank page

Almost always a SW cache. In the browser tab hosting the preview:
- DevTools → Application → Service Workers → Unregister.
- DevTools → Application → Storage → Clear site data.
- Hard-refresh (Cmd/Ctrl+Shift+R).

### Custom domain shows "Error 1016 origin DNS error" for hours

Cloudflare's own DNS lookup for the CNAME failed. Check:
1. Your `acilox.com` zone in Cloudflare DNS shows a `CNAME` record
   for `ledger` pointing at `ledger-acilox.pages.dev`.
2. The record's proxy status is 🟠 orange (proxied), not ⚪ grey (DNS
   only).
3. Wait 5-10 minutes for edge propagation.

### Polar sandbox purchase doesn't fire the webhook

- Confirm the webhook URL in Polar → Settings → Webhooks is HTTPS
  and points at the correct worker URL + `/webhooks/polar` path
  (not just the root).
- Confirm `POLAR_WEBHOOK_SECRET` on the worker matches the `whsec_...`
  shown in Polar (case-sensitive).
- Look at Polar → Webhooks → recent deliveries. If Polar shows a
  4xx response from the worker, the HMAC verification failed — the
  secret is wrong.

### Activation says "License key not recognised" but Polar shows the key

- Confirm the worker actually got the webhook: `wrangler tail` should
  have logged a `webhook_polar` event with `handled: true`.
- Confirm the key you're pasting is the exact one from Polar
  (no leading/trailing whitespace).
- Confirm you're sending `product_id: "ledger"` (default in the app;
  only wrong if `PRODUCT_ID` in `src/lib/license-state.ts` was
  changed).

### PWA install prompt never appears

Chrome PWA install requires:
- Served over HTTPS (Cloudflare Pages: yes).
- Valid `manifest.webmanifest` with `name`, `short_name`, `icons`
  (192 + 512), `start_url`, `display: standalone`.
- Service worker registered and controlling the page (Application →
  Service Workers → status must be "activated and is running").
- User has interacted with the page (not just landed on it — click
  something first).
- Not already installed. If Chrome remembers a previous install
  attempt, clear it: chrome://apps → find Ledger → uninstall, then
  clear site data.

---

## Rollback procedure

If a v0.1.0 deployment is materially broken in a way that hurts
users (data loss risk, license failure lockout, security bug), roll
back rather than trying to hotfix live.

**Cloudflare Pages:**
1. Pages project → Deployments tab.
2. Find the last known-good deploy (before v0.1.0).
3. **⋮ menu → Rollback to this deployment.** Instant.
4. Ledger has no previous production deploy in v0.1.0 — so "rollback"
   means **remove the custom domain** so `ledger.acilox.com` returns
   a Cloudflare error and users can't hit a broken build. Fix,
   redeploy, re-add the domain.

**License worker:**
1. Workers & Pages → your worker → Deployments tab.
2. Find the previous deploy → **Rollback**.
3. This flips the `product_id` enforcement off and Ledger clients
   fall back to the "product_id was optional" back-compat path.

**Polar product:**
1. Polar → Products → Ledger Pro → **Archive**. Existing customers
   keep their licenses; the checkout URL 404s and prevents new
   broken-experience sales.

**acilox.com/labs card:**
1. Revert the commit that added the Ledger card. Redeploy the site.

---

## Reference

- [AGENTS.md](AGENTS.md) — full code + architecture reference.
- [roadmap.md](roadmap.md) — v0.1.x → v1.0.
- [acilox-com-labs-changes.md](acilox-com-labs-changes.md) — the
  block for Stage 8.
- [labs/_shared/license-worker/README.md](../../_shared/license-worker/README.md)
  — worker setup + design notes.
- [Polar.sh docs](https://docs.polar.sh) — merchant of record + license keys.
- [Cloudflare Pages docs](https://developers.cloudflare.com/pages/) —
  custom domains, SPA routing.
- [SvelteKit static adapter docs](https://svelte.dev/docs/kit/adapter-static)
  — what `build/` contains.
