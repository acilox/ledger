# Ledger — Roadmap

Everything past v0.1.0 the codebase has *not* yet done. Grouped by
release. Each item explains the value + rough scope so a future agent
can pick any one and land it without re-deriving the intent.

Live status → see [AGENTS.md](AGENTS.md).
Launch blockers for v0.1.0 → see [v0.1.0-launch-checklist.md](v0.1.0-launch-checklist.md).

## v0.1.x — polish (post-launch, within 30 days of launch)

Small, non-invasive improvements motivated by the first cohort of real
users. Ship as patch releases with no schema change.

- **OG image at 1200×630 for `ledger.acilox.com`.** The favicon SVG
  already carries the mark. Render it centered on `#0f172a` with the
  wordmark "Ledger · a calm CBT thought record" below. Wire into
  `<meta property="og:image">` in `src/app.html`.
- **Landing page copy on `ledger.acilox.com`.** Right now the deploy
  is the app itself with the welcome flow as the "landing." A dedicated
  marketing route (`/about` or a static index that redirects to the
  app after 2 seconds) would help referral traffic that isn't already
  primed to install a PWA.
- **Distortion vocabulary in the encrypted backup.** The `Settings`
  type already includes `customDistortions`. `exportAll` /
  `importAll` in [src/lib/db.ts](../src/lib/db.ts) copy the whole
  settings row, so the data is already round-tripped — just needs a
  README + CHANGELOG mention and a manual verification.
- **Duplicate-distortion guard in the editor.** `slugifyDistortionLabel`
  already handles slug collisions, but the UI doesn't warn if a user
  adds two entries with the same label. Add an inline error message.
- **Improved date-picker on `/new`.** Right now entries default to
  "now." Some users will want to log a thought from earlier in the
  day. Add an optional "when did this happen?" field that only shows
  after clicking "Adjust time."
- **Search across entries.** Free-text search on situation +
  automaticThought + balancedThought. Client-only, no Dexie index —
  simple filter over `listRecentEntries(limit=1000)` covers 99% of
  cases at v0.1 scale.
- **A11y pass.** Confirm keyboard reachability for every route,
  visible focus rings, and screen-reader labels on the intensity
  slider and distortion chips.

## v0.2.0 — Native wrappers (target: month 2-3 post-launch, if usage warrants)

The web PWA experience is complete. Native wrappers make the panic
capture a *widget* — the single most valuable native surface for a
mental-health tool.

- **Capacitor wrappers for iOS + Android.** Reuse the exact SvelteKit
  build. Capacitor was chosen over Tauri because home-screen widgets
  need native OS-level integration, not a WebView shell.
- **Home-screen widget: "Panic capture."** iOS 17+ interactive
  widgets and Android app widgets both support "one-tap → open into
  `/panic` prefilled." Widget is stateless — it's just a deeplink
  with a beautiful icon.
- **Haptic feedback on the intensity slider.** Native only. Ties
  physical sensation to the intensity scale in a way that's known
  to improve subjective recall of the entry.
- **Native share-sheet for encrypted backup.** iOS `Share` /
  Android `Intent.ACTION_SEND` instead of the browser download flow.
- **App Store + Play Store listings** as an extension of the same
  Polar-issued Pro license — same $79 one-time unlocks both web and
  native. NOT a separate SKU.

Deferred deliberately: face ID / biometric app lock. Nice-to-have but
localStorage on a personal device with an OS-level PIN is already the
right trust model for v0.2 — don't add complexity users can't debug.

## v0.3.0 — Therapist share (target: month 4-6 post-launch)

The single most-requested "cloud" feature we can support without
compromising the local-first thesis.

- **One-time read-only encrypted share link.** User picks an entry
  → gets a URL with the passphrase in the fragment (`#`, never sent
  to the server) → therapist opens the link, enters the passphrase,
  reads once, link burns.
- **Storage:** Cloudflare R2 encrypted-blob-with-TTL. 30-day
  auto-delete regardless of open count. Blob is opaque to the
  server — same AES-GCM envelope as the export file.
- **Pricing:** included in existing $79 Pro tier. Reason: this is
  the killer feature that closes the sale for a lot of therapy-active
  users, and it doesn't cost us anything at Labs scale (Cloudflare R2
  free tier covers thousands of shares/month).
- **Consent UX:** every share link surfaces a red banner in the
  entry chooser reminding the user they're about to leave the
  local-first model for this one entry.

## v0.4.0 — Optional encrypted sync (target: month 6-9 post-launch, only if v0.3 lands well)

Only ship this if v0.3 proves users want cross-device continuity
enough to trust a sync mechanism.

- **Pro-Plus tier: $29 one-time activation** (added on top of $79
  Pro, so total $108). Existing Pro users get a discounted upgrade
  path.
- **Model:** browser-generated ed25519 keypair, private key stays
  on-device, public key uploaded to R2 with the user's account. All
  entries encrypted client-side with AES-GCM before upload; sync is
  content-addressable, never sees plaintext.
- **Conflict resolution:** last-write-wins per entry on
  `updatedAtMs`. Two-device edits within the same second are rare
  enough for v0.4; add CRDT if it ever proves painful.
- **Explicit non-features:** no cross-user sharing, no team
  accounts, no admin console. Sync is *only* your own device to your
  own device.

## v1.0 — Exercise packs (target: month 9-12 post-launch, tied to Pro-Plus success)

Ledger's tagline is "thought record," but the full CBT toolkit is
larger. v1.0 introduces **companion exercise packs** as separate
in-app modules, each bundled with the Pro tier.

- **Behavioural activation** — activity monitoring, mood-per-activity
  log, weekly review, activity scheduling.
- **Exposure & response prevention (ERP)** — for OCD/anxiety. Hierarchy
  builder, exposure log, distress-tolerance curve visualization.
- **Sleep restriction / CBT-I** — sleep diary, prescribed
  time-in-bed calculation, weekly review.
- Each pack is opt-in from Settings so users who only want the
  thought record aren't overwhelmed.
- Each pack ships with its own tests, its own store table (versioned
  independently), and its own subroute (`/ba`, `/erp`, `/sleep`).

## Explicit non-goals (do NOT ship, ever)

- **AI advice / chatbot.** Users can ask the app to help think about
  a thought; they cannot receive advice from it. Full stop.
- **Mood tracker with graphs.** Ledger's thesis is "the format that
  the therapy literature says helps" (Burns, Beck). Mood graphs are
  a different product ("Daylio" et al) and would dilute the pitch.
- **Streaks / gamification.** Explicitly harmful for a therapy
  tool — see AGENTS.md.
- **Social / friends / community.** Same — see AGENTS.md.
- **Prescriptive push notifications.** "Reflect now!" is the wrong
  message from a piece of software.
- **A B2B "for therapists" plan.** Ledger is B2C. Therapists can
  ask their clients to use it, and the therapist-share flow supports
  that, but there is no therapist dashboard product here.

## How to prioritise

If unsure which item to pick next, use this order:

1. **Anything from v0.1.x that a real user asked for.**
2. **v0.2 Capacitor panic-widget** — the highest-leverage native
   feature and the only one that changes the daily-use pattern.
3. **v0.3 therapist-share** — biggest revenue lever within the
   privacy thesis.
4. **v0.4 sync** — only after v0.3 usage justifies it. Sync
   introduces server infrastructure — not free at scale.
5. **v1.0 exercise packs** — largest scope. Only take on when a
   single pack has an obvious champion audience asking for it.

Always sanity-check against [AGENTS.md § Kill criteria](AGENTS.md)
before adding roadmap items. Ledger is a small product with a
narrow thesis — most feature requests are correctly declined.
