# Changelog

All notable changes to **Ledger** will be documented here.

The format roughly follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-06-30

Initial release. Pre-launch; the full feature set is frozen and the
app is ready for the listing pass on [acilox.com/labs](https://acilox.com/labs).

### Added

- **SvelteKit 2 + Svelte 5 + Tailwind 4 static SPA** built with
  `@sveltejs/adapter-static` and deployable as a flat directory to
  Cloudflare Pages, Netlify, or any static host. No server runtime.
- **CBT thought-record form** (`/new`) — seven sections in one screen:
  situation, automatic thought, emotion + 0-10 intensity slider,
  distortion chips with hover-revealed gloss + Socratic prompt,
  evidence for and against side-by-side, balanced thought, intensity
  after slider (with explicit "Skip" path so partial reframes aren't
  blocked). `⌘/Ctrl+Enter` saves.
- **Panic capture** (`/panic`) — single textarea, intensity slider
  (defaults to 7), optional note, large rose button. Autofocuses the
  textarea on mount; `⌘/Ctrl+Enter` saves. Designed to be openable
  from the home-screen shortcut and saved in under 30 seconds.
- **Entry list** (`/`) — entries grouped by day (Today / Yesterday /
  formatted date) with the two primary actions at the top. Free tier
  caps the list at the most recent 30; Pro at 100 with a "see more"
  affordance.
- **Entry detail** (`/entry/[id]`) — read-only render via the shared
  `Field` component, two-step delete confirmation, print/PDF button
  that calls `window.print()` with the print stylesheet engaged.
  Param token format `thought-<id>` / `panic-<id>` selects the table.
- **Weekly digest** (`/digest`) — 7-day rolling window or calendar-week
  toggle. Always shows counts + average-intensity stats + distortion
  frequency ranking. **Pro adds:** top 5 reframes sorted by
  intensity-drop, and the 5 hardest panics by intensity — explicitly
  scoped to "what's worth bringing into next session." Print button.
- **Settings** (`/settings`) — total-entry count, the "are you working
  with a therapist?" check-in, license-key activation + purchase CTA,
  optional self-hosted license server URL, and the **Pro encrypted
  backup** section (export with passphrase ≥8 chars, restore with
  merge-or-replace mode).
- **First-run welcome** (`/welcome`) — three slides: what Ledger is
  and is not; the therapist nudge with directory links (Psychology
  Today, Open Path Collective, BACP); the two ways people use it
  (structured-first vs. panic-first). Marks `hasSeenWelcome: true`
  on completion so the layout stops redirecting.
- **Dexie 4 schema v1** — `thoughts` and `panics` keyed by `++id` with
  `createdAtMs` / `updatedAtMs` indexes; a single-row `settings`
  table. Full CRUD helpers in `src/lib/db.ts`, plus `exportAll` and
  `importAll` for the backup feature.
- **10-distortion catalog** (`src/lib/distortions.ts`) — Burns / Beck
  lineage: all-or-nothing, catastrophizing, mind-reading,
  fortune-telling, emotional reasoning, should-statements, labeling,
  personalization, mental filter, disqualifying-the-positive. Each
  entry has a label, a one-sentence gloss, and a Socratic prompt
  (`ask`). `resolveDistortion(id, customCatalog)` falls through to
  user-defined entries; built-ins win on id collision.
  `slugifyDistortionLabel` turns a free-form label into a stable
  kebab-case id, suffixing on built-in or existing-custom collision.
- **Custom-distortion editor** — Settings → Your distortion vocabulary
  lists the built-ins, the user's own entries, and a form to add a
  new label + optional gloss. Custom entries show up as chips in the
  thought-record form, render correctly in the entry detail view,
  and are counted in the weekly digest with their user-given label.
  Free tier.
- **Pure license state machine** (`src/lib/license-state.ts`) —
  `PRODUCT_ID = 'ledger'`, 24h recheck interval, 7-day offline grace.
  Same shape as Alembic Migration Guard and FHIR Lens; lifted
  verbatim with only the product id and key-prefix changes. Every
  transition is a pure function: `decideTier`, `isStale`,
  `stateFromResponse`, `stateAfterTransientFailure`, `emptyState`.
- **Browser license cache** (`src/lib/license-cache.ts`) — singleton
  `licenseStore` exposing a Svelte `readable` for `.status`, plus
  `.tier()` / `.isPro()` / `.activate(key)` / `.refresh()` /
  `.setServer(url)` / `.clear()`. Persists to `localStorage` keys
  `ledger.license.state.v1`, `ledger.machine.id.v1`,
  `ledger.license.server.v1`. In-flight Promise deduplication so a
  burst of `.refresh()` calls collapses to one network hop.
- **Encrypted export** (`src/lib/export.ts`) — Web Crypto:
  PBKDF2-SHA256 (310,000 iterations) → AES-GCM-256. A small JSON
  envelope (`v`, `alg`, `kdf`, `iters`, `saltB64`, `ivB64`,
  `cipherB64`) so future schema changes are detectable without magic
  bytes. Throws on `passphrase < 8 chars`; refuses unknown versions
  and unknown schemes; AES-GCM authentication catches tampered
  ciphertext.
- **Pure digest builder** (`src/lib/digest.ts`) — `thisWeekRange`
  (rolling 7d), `calendarWeekRange` (Mon-Sun local), `buildDigest`
  returning thought + panic counts, average intensity before /
  after / delta, distortion frequencies sorted desc, top 5 reframes
  by intensity drop (requires non-empty `balancedThought`), top 5
  hardest panics. No DOM; trivially unit-testable.
- **PWA manifest** with PNG icons (192x192, 512x512, 180x180 Apple
  touch icon, and a maskable 512x512 with 10% safe-area padding),
  generated from the source SVG by `scripts/generate-icons.mjs`
  (`npm run icons`). The SVG is kept as the primary `any`-purpose
  icon for crisp rendering on platforms that accept it. Two home-
  screen shortcuts (Panic capture, New thought record), `display:
  standalone`, and the dark theme color `#0f172a`.
- **Service worker** (`src/service-worker.ts`) — cache-first for
  precached app shell, network-first for any path containing `/v1/`
  (the license-validation endpoint must never be served stale), same-
  origin only, SPA fallback to cached `/` on offline navigation.
- **Print stylesheet** — strips header / footer / chrome via
  `.no-print`, gives the thought-record body the layout a therapist
  can read on paper.
- **Test suite** covering the license state machine (24h recheck,
  7-day grace, revocation, end-to-end happy + sad paths), the 10-
  distortion catalog (uniqueness, kebab-case ids, every field
  populated, custom-fallback resolver), the digest builder (window
  filtering, distortion ranking, average + delta math, top reframes
  + hardest panics ordering), and the encrypted-export round trip
  (correct passphrase, wrong passphrase rejection, version /
  scheme mismatch rejection, short-passphrase guard, tampered-
  ciphertext rejection via AES-GCM auth tag).

### Architecture decisions

- **Local-first, no cloud sync.** Mental-health entries sit in
  IndexedDB only. The single network hop is the optional 24-hour
  license-validation ping. The Pro encrypted backup is the only
  cross-device migration path in v0.1.0. The trade-off was made
  consciously to remove the largest privacy attack surface.
- **Pure state machine for license validation.** Identical pattern
  to Alembic Migration Guard and FHIR Lens. The shell is thin enough
  that its bugs are mechanical (wrong storage key) rather than logical
  (wrong tier decision). All four products will eventually share the
  same module copy-for-copy if we extract it; lifting now would
  premature-abstract one too few callers.
- **Pure digest builder.** Same justification — no DOM, no Dexie
  import, trivially testable; the page component only feeds it
  entries and renders the result.
- **Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`).**
  Reactive state without the boilerplate of stores for view-local
  data, but the license cache stays a classic `readable` store
  because it's truly shared across routes.
- **No PDF library.** `window.print()` + a print stylesheet is
  smaller, faster, and produces a better-looking page than any of
  the in-browser PDF generators in 2026. The trade-off is one extra
  click in the OS print dialog; for a feature used once per therapy
  session, that's acceptable.

### Known limitations

- **No native mobile wrapper.** v0.1.0 is browser-only. iOS Safari's
  PWA is acceptable but inferior to a Capacitor build; v0.2.0 closes
  that gap with no SvelteKit rewrite.
- **30-entry free-tier cap is a soft cap.** Older entries are not
  deleted — the list view simply hides them and surfaces an upsell.
  They reappear the moment Pro activates.
- **No therapist-share mode.** v0.3.0 will add a one-time read-only
  encrypted link; v0.1.0 users export-then-send manually.
- **R5 isn't applicable here** (mentioned because the other Labs
  products mention it) — Ledger has no FHIR / HL7 surface.
