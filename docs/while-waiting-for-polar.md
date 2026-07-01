# Ledger — Parallel work while Polar verifies

Polar.sh org verification takes 1-7 days. That's a hard blocker on
Stages 4, 6, 8, 9 of [DEPLOY.md](DEPLOY.md). This doc is the punch-list
of everything that CAN progress in parallel, in priority order.

**Where we are (2026-07-01):**
- v0.1.0 code shipped, tests green, tagged, pushed to
  https://github.com/acilox/ledger.
- Polar not started → Stages 4, 6 blocked.
- Cloudflare not configured → Stages 3, 5 blocked (but you control the
  pace here — do it whenever).
- acilox.com/labs card ready to paste (Stage 8) but Polar checkout
  URL is the missing input.
- Launch (Stage 9) blocked on everything above.

---

## Priority 1 — Kick off the long poles (do TODAY)

### Sign up for Polar.sh RIGHT NOW

This is the critical-path blocker. Every day you delay signing up
delays launch by a day.

- [ ] Go to [polar.sh](https://polar.sh) → **Sign up**.
- [ ] Choose **Organization**, name it **`Acilox`** (case-sensitive
      later for URL slugs).
- [ ] Submit ID verification — Polar accepts passport, driver's
      license, or national ID.
- [ ] Add a payout method (bank account). Polar can hold sales until
      the payout method is verified — do this now, not later.
- [ ] While you wait: skim [Polar's license-keys docs](https://docs.polar.sh/features/benefits/license-keys)
      to confirm the `lg-` prefix + activation-limit UX matches your
      expectations.

### Set up Cloudflare (if not already)

- [ ] Sign up at [dash.cloudflare.com](https://dash.cloudflare.com).
      Free tier is fine.
- [ ] Websites → Add site → enter `acilox.com`.
- [ ] Cloudflare gives you two nameservers → point your registrar's
      nameservers at them. Propagation takes 5 min - 24h.
- [ ] Once green, confirm your existing `acilox.com` A/CNAME records
      auto-imported cleanly. If not, add them manually.
- [ ] Confirm you can add a subdomain later without moving the main
      apex.

### wrangler login (once Cloudflare is up)

- [ ] `cd labs/_shared/license-worker && npx wrangler login` — opens
      browser, click accept.
- [ ] `npx wrangler whoami` should print your account name.

Once this is done, ping me and I take over Stages 3 + 5.

---

## Priority 2 — Prepare launch assets (do this week)

None of these need Polar or Cloudflare — they're pure content work
that lands on your machine or GitHub.

### Screenshots for the Polar product listing + Labs card

Polar's product page + acilox.com/labs card both want a hero image.

- [ ] Open `npm run preview` from `labs/ledger/`.
- [ ] Create ~5 varied thought-record entries so the digest looks
      real (not empty).
- [ ] Screenshot these 5 views at 1440×900 or 2880×1800 (retina),
      no cursor visible:
  1. `/` — populated entry list.
  2. `/new` — mid-form with distortion chips visible.
  3. `/entry/thought-N` — a completed entry with the intensity delta
     visible.
  4. `/digest` — populated weekly digest, "Pro" section visible.
  5. `/settings` — the encrypted-backup + license-activation area.
- [ ] Save to `labs/ledger/docs/screenshots/` (create the dir; add
      it to git after — it's not in .gitignore).

### OG social-share image (1200×630)

For when the acilox.com/labs card and future Show HN post get shared
on Twitter/LinkedIn/HN.

- [ ] Design in Figma or use [og-playground.vercel.app](https://og-playground.vercel.app):
      - Background: `#0f172a` (matches app theme_color).
      - Center: the notes/journal mark from `static/favicon.svg`,
        scaled to ~200px.
      - Below the mark: wordmark **"Ledger"** in white, then
        **"a calm CBT thought record"** in slate-400, then
        **"local-first · one-time $79 · not a medical device"** in
        slate-500.
- [ ] Save as `labs/ledger/static/og-image.png` (1200×630).
- [ ] Add to `src/app.html`:
      ```html
      <meta property="og:image" content="https://ledger.acilox.com/og-image.png" />
      <meta property="og:title" content="Ledger — a calm CBT thought record" />
      <meta property="og:description" content="Local-first CBT thought-record PWA. Not a medical device. One-time $79." />
      <meta name="twitter:card" content="summary_large_image" />
      ```

### Test the built PWA on real devices

The dev/preview loop only covers desktop Chrome. Mobile PWAs behave
differently — verify before Show HN.

- [ ] Deploy `build/` to any temporary static host you have access to
      (`npx serve build` + ngrok, Netlify drop, GitHub Pages of the
      repo, etc.). This is NOT `ledger.acilox.com` yet — just a
      throwaway URL for smoke testing.
- [ ] Personal iPhone: open in Safari, tap Share → Add to Home
      Screen. Confirm the icon uses the notes mark (validates apple-
      touch-icon.png), the app opens standalone, entries persist
      across app kill + reopen.
- [ ] Personal Android: open in Chrome, tap the install prompt.
      Same checks.
- [ ] Note any mobile bugs → open GitHub issues on the repo → fix
      before Stage 5.

### Draft the Show HN post

- [ ] Copy the draft from [DEPLOY.md § Stage 9](DEPLOY.md).
- [ ] Adjust the "why I built this" opening to sound like *you*.
      The current draft is generic — a real-voice opening massively
      changes HN engagement.
- [ ] Save as `labs/ledger/docs/launch/show-hn-draft.md` (create the
      dir).
- [ ] Show it to 1-2 people whose HN taste you trust (Dhruv? someone
      from Uber devexp?). Get feedback on the *hook*.

---

## Priority 3 — Get quiet feedback on the format (do this week if possible)

The riskiest thing about launching a CBT tool is a mental-health
professional publicly calling it out as harmful. Head that off with
private feedback first.

- [ ] Identify 2-3 practicing therapists you know personally (not
      strangers on Reddit). If you don't know any:
      - Ask 1-2 close friends "do you have a therapist you trust who
        might look at a small tool I built?" — the personal
        introduction radically changes response rate.
      - Alternative: post in a private community you're part of
        (Slack, Discord) rather than public subreddits.
- [ ] Send them the temp preview URL (Priority 2) with a short note:
      > "I built a small local-first CBT thought-record PWA for my own
      > use. Not launching yet — before I do, I want to make sure the
      > format is faithful to how the therapy literature intends it,
      > and that I've said 'not a medical device' the right way.
      > Would you spend 10 minutes looking? Happy to send $50 for your
      > time."
- [ ] Ledger's tagline says "designed for showing your therapist" —
      confirm the print layout actually works for that. A therapist
      seeing the print output will spot layout problems you won't.
- [ ] Adjust wording of the "not a medical device" disclaimer + the
      crisis-hotline welcome slide based on what comes back.

---

## Priority 4 — Housekeeping (do whenever)

- [ ] Add a GitHub Actions workflow at `.github/workflows/ci.yml`
      that runs `npm run lint && npm test` on push. Free, prevents
      regressions post-launch.
- [ ] Add a repo badge or short "Live at ledger.acilox.com" line to
      the README once the domain resolves (Stage 5).
- [ ] Add a CODEOWNERS file pointing to your handle so PR reviews
      get requested correctly (currently a solo repo, but good
      hygiene).
- [ ] Enable Dependabot security updates on the repo (Settings →
      Code security → Dependabot alerts + security updates).
- [ ] File the first roadmap item as a GitHub issue so contributors
      (if any show up) have something concrete to look at:
      `[roadmap] OG image at 1200×630 for /labs/ledger`.

---

## What NOT to do while waiting

- **Do NOT** post to Show HN / Reddit / Twitter about Ledger before
  Stages 4-9 are done. A launch post that goes to a broken buy
  button destroys the launch. Wait.
- **Do NOT** email anyone about Ledger yet ("hey I built this thing")
  for the same reason.
- **Do NOT** start on v0.2 features (Capacitor, widget, etc.) until
  v0.1.0 is live and getting feedback. See
  [AGENTS.md § Kill criteria](AGENTS.md) — you shouldn't invest in
  v0.2 unless v0.1 clears the day-60 install signal.
- **Do NOT** cut a v0.1.1 release yet. Wait for real feedback from
  Priority 3 + first-week users. Ship v0.1.1 in week 2-3 with a
  cluster of fixes, not one at a time.

---

## Resume point

Ping me when any of the following is true and I'll pick it back up:

1. `wrangler login` succeeded on your machine (I take over Stages 3 + 5).
2. Polar account verified + product created (I take over Stage 4
   verification + Stage 6 end-to-end test).
3. Screenshots + OG image are on disk (I wire them into the app).
4. Mobile-device smoke test surfaced any bugs (I fix + push a
   v0.1.1 tag).

**Nothing else in this doc requires me** — Priority 2 launch assets
and Priority 3 quiet feedback are things only you can do well.
