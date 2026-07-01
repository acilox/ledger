# Ledger — Agent Handoff

**Purpose of this file.** If you are a new agent (Claude, another
model, or a human) picking up Ledger cold, read this first. It answers
"what is this, what's done, what's left, what did we decide and why"
in one place. If the answer to your question is not here, that is a
bug — fix it here after you find it.

**Companion docs:**
- [README.md](../README.md) — user-facing pitch, install, pricing.
- [CHANGELOG.md](../CHANGELOG.md) — release notes.
- [LICENSE](../LICENSE) — commercial license text.
- [docs/roadmap.md](roadmap.md) — post-v0.1.0 pending work.
- [docs/v0.1.0-launch-checklist.md](v0.1.0-launch-checklist.md) —
  AGENT/USER-tagged sequence to actually go live.
- [docs/DEPLOY.md](DEPLOY.md) — **the** user-facing deployment guide,
  self-contained, copy-paste ready, sequential end-to-end.
- [docs/acilox-com-labs-changes.md](acilox-com-labs-changes.md) — the
  drop-in marketing block for `acilox.com/labs`.

## 30-second pitch

Ledger is a local-first PWA that runs the CBT thought-record format
faithfully (situation → automatic thought → emotion → distortions →
evidence → balanced thought → intensity after) with a 30-second
panic-capture sibling. Everything lives in the browser's IndexedDB.
The only network hop is an optional 24h license-validation ping. It
is **not** a chatbot, **not** a mood tracker, and **not** a medical
device. One-time $79 Pro tier unlocks unlimited entries, richer weekly
digest, and encrypted backup.

**Product slug:** `ledger`
**Version:** v0.1.0
**Status:** Feature-complete, unlaunched. Not yet deployed to
`ledger.acilox.com`. Not yet listed on `acilox.com/labs`. No Polar
product created yet. No end-to-end tests run against a live worker.

## Where you are right now (2026-07-01)

**Development:** v0.1.0 scope frozen. All planned features shipped in
code. Custom-distortion editor added at v0.1.0 (not deferred to
v0.1.1 as the README/CHANGELOG originally implied). PWA icons
generated. License worker updated to accept `product_id: "ledger"`.

**Not done:**
- Never run `npm install`, `npm run build`, `npm test`, or `npm run
  dev` in this session — user instruction was
  *"Don't test anything - just keep building"*. Development is
  "100% good" from the code perspective but nothing has been observed
  running.
- No end-to-end validation against a live license worker.
- No visual verification of PWA install, service-worker cache, or
  print stylesheet.
- No deploy target. No `wrangler` config, no Cloudflare Pages config,
  no `ledger.acilox.com` DNS.
- No Polar product. `<LEDGER_PRODUCT_ID>` in the launch doc is a
  placeholder.
- No repo push. The GitHub `acilox/ledger` repo may not exist yet.

See [docs/roadmap.md](roadmap.md) and
[docs/v0.1.0-launch-checklist.md](v0.1.0-launch-checklist.md) for the
full pending list, grouped by "block launch" vs "polish" vs "v0.2+".

## File map

Everything below is repo-relative to `labs/ledger/`.

### Configuration + build
| Path | Purpose |
|---|---|
| [package.json](../package.json) | SvelteKit 2 + Svelte 5 + Tailwind 4 + Dexie. `sharp` for icon generation. Scripts: `dev`, `build`, `lint` (tsc), `test` (node --test), `icons`, `prepare` (svelte-kit sync). |
| [svelte.config.js](../svelte.config.js) | `@sveltejs/adapter-static` → deployable as flat directory. |
| [vite.config.ts](../vite.config.ts) | Tailwind 4 Vite plugin wiring. |
| [tsconfig.json](../tsconfig.json) | `verbatimModuleSyntax` on — every type import must use `import type`. |
| [.npmrc](../.npmrc) | Forces public npm registry (overrides Uber internal registry on the dev machine). |

### Source of truth
| Path | Purpose |
|---|---|
| [src/lib/db.ts](../src/lib/db.ts) | Dexie schema v1: `thoughts`, `panics`, `settings`. All CRUD helpers + `exportAll`/`importAll` for encrypted backup. |
| [src/lib/distortions.ts](../src/lib/distortions.ts) | 10 canonical CBT distortions (Burns/Beck), `distortionById`, `resolveDistortion` (custom-catalog fallback), `slugifyDistortionLabel` (kebab-case with collision-avoidance). |
| [src/lib/digest.ts](../src/lib/digest.ts) | Pure digest builder. `thisWeekRange` / `calendarWeekRange` / `buildDigest`. No DOM, no Dexie import — testable in isolation. |
| [src/lib/export.ts](../src/lib/export.ts) | Web Crypto encrypted export: PBKDF2-SHA256 (310,000 iters) → AES-GCM-256 envelope. Rejects passphrase <8 chars, unknown versions, unknown schemes, tampered ciphertext. |
| [src/lib/license-state.ts](../src/lib/license-state.ts) | Pure state machine. `PRODUCT_ID = 'ledger'`, 24h recheck, 7-day offline grace. Same shape as AMG + FHIR Lens. |
| [src/lib/license-cache.ts](../src/lib/license-cache.ts) | Impure shell: localStorage persistence + fetch to license worker + Svelte `readable` store + in-flight promise dedup. |
| [src/lib/constants.ts](../src/lib/constants.ts) | `APP_VERSION`, `PURCHASE_URL`, date/time formatters. |
| [src/lib/Field.svelte](../src/lib/Field.svelte) | Read-only labelled value component used in entry detail + print layout. |
| [src/lib/Stat.svelte](../src/lib/Stat.svelte) | Digest stat tile. |

### Routes (all CSR-only, no SSR)
| Path | Purpose |
|---|---|
| [src/routes/+layout.svelte](../src/routes/+layout.svelte) | Top-level shell + first-run redirect to `/welcome` when `hasSeenWelcome !== true`. |
| [src/routes/+layout.ts](../src/routes/+layout.ts) | `export const prerender = true; export const ssr = false;` — SPA config. |
| [src/routes/+page.svelte](../src/routes/+page.svelte) | Entry list grouped by day. Free tier: last 30. Pro: last 100 with "see more". |
| [src/routes/new/+page.svelte](../src/routes/new/+page.svelte) | Thought-record form. Loads built-in + custom distortions. `⌘/Ctrl+Enter` saves. |
| [src/routes/panic/+page.svelte](../src/routes/panic/+page.svelte) | 30-second panic capture. Autofocuses textarea. |
| [src/routes/entry/[id]/+page.svelte](../src/routes/entry/[id]/+page.svelte) | Read-only entry detail. Uses `resolveDistortion(id, customCatalog)`; falls back to raw id chip when a custom distortion has been deleted. Two-step delete. Print button. Param format: `thought-<id>` or `panic-<id>`. |
| [src/routes/digest/+page.svelte](../src/routes/digest/+page.svelte) | Weekly digest with rolling-7d / calendar-week toggle. Passes `settings.customDistortions` to `buildDigest`. |
| [src/routes/settings/+page.svelte](../src/routes/settings/+page.svelte) | Therapist check-in, distortion vocabulary editor, Pro tier (license activation + encrypted backup), self-hosted license server URL. |
| [src/routes/welcome/+page.svelte](../src/routes/welcome/+page.svelte) | Three-slide first-run flow. Marks `hasSeenWelcome: true` on completion. |
| [src/service-worker.ts](../src/service-worker.ts) | Cache-first for app shell; network-first for `/v1/`; SPA fallback to cached `/`. |
| [src/app.html](../src/app.html) | Root HTML. Wires favicon SVG + apple-touch-icon PNG + manifest. |
| [src/app.css](../src/app.css) | Tailwind 4 layers + custom `.field-input` / `.field-textarea` / `.chip` / `.btn-*` / `.card` utilities. |

### Static assets
| Path | Purpose |
|---|---|
| [static/manifest.webmanifest](../static/manifest.webmanifest) | PWA manifest. Icons array: SVG `any`, PNG 192 `any`, PNG 512 `any`, PNG maskable 512 `maskable`. `display: standalone`, dark theme color `#0f172a`. |
| [static/favicon.svg](../static/favicon.svg) | Source SVG for all icon variants. Three-line "notes/journal" mark on slate-900. |
| [static/icon-192.png](../static/icon-192.png) | Generated by `scripts/generate-icons.mjs`. |
| [static/icon-512.png](../static/icon-512.png) | Generated. |
| [static/icon-maskable-512.png](../static/icon-maskable-512.png) | Generated with 10% safe-area pad. |
| [static/apple-touch-icon.png](../static/apple-touch-icon.png) | Generated 180×180. |

### Icon generation
| Path | Purpose |
|---|---|
| [scripts/generate-icons.mjs](../scripts/generate-icons.mjs) | `sharp` composite pipeline. Run with `npm run icons`. Reads `static/favicon.svg` → writes all PNG variants. |

### Tests
| Path | Purpose |
|---|---|
| [test/distortions.test.ts](../test/distortions.test.ts) | 10-distortion catalog integrity, `distortionById`, `resolveDistortion`, `slugifyDistortionLabel` (5 cases incl. collisions). |
| [test/digest.test.ts](../test/digest.test.ts) | 12 cases: window filtering, distortion ranking, custom-distortion labels, avg + delta, top reframes (max 5, requires balancedThought), hardest panics (max 5). |
| [test/export.test.ts](../test/export.test.ts) | 9 cases: passphrase round-trip, envelope shape, fresh salt+IV, short-passphrase reject, wrong-passphrase reject, version reject, scheme reject, tampered-ciphertext reject. |
| [test/license-state.test.ts](../test/license-state.test.ts) | 24h recheck, 7-day grace, revocation, transient-failure state, happy + sad paths. Uses `import type { CachedLicenseState }` per verbatimModuleSyntax. |

### Docs
| Path | Purpose |
|---|---|
| [README.md](../README.md) | User-facing pitch + install + pricing. |
| [CHANGELOG.md](../CHANGELOG.md) | Release notes. |
| [LICENSE](../LICENSE) | Commercial license. Modelled on FHIR Lens with Ledger-specific clauses (data ownership, not-a-medical-device, license-key-only network transmission). |
| [docs/AGENTS.md](AGENTS.md) | **This file.** |
| [docs/roadmap.md](roadmap.md) | Post-v0.1.0 pending work, grouped. |
| [docs/v0.1.0-launch-checklist.md](v0.1.0-launch-checklist.md) | Everything USER + AGENT must do to go live. |
| [docs/acilox-com-labs-changes.md](acilox-com-labs-changes.md) | Drop-in `<article class="product-card">` for `acilox.com/labs`. |

## Architecture

```
Browser ──▶ SvelteKit static SPA (@sveltejs/adapter-static)
                │
                ├─ /new ──┐
                ├─ /panic │
                ├─ /entry │── Svelte 5 runes ($state, $derived, $effect, $props)
                ├─ /digest│   CSR-only. No SSR. Prerender=true.
                └─ /...   ┘
                │
                ▼
        Dexie 4 (IndexedDB "ledger.v1")
        ┌───────────────────────────────────────────┐
        │ thoughts:  ++id, createdAtMs, updatedAtMs │
        │ panics:    ++id, createdAtMs              │
        │ settings:  id (single row, id=1)          │
        └───────────────────────────────────────────┘
                │
                ▼ (Pro export only, in-memory)
        Web Crypto: PBKDF2-SHA256(310k) → AES-GCM-256 envelope
                │
                ▼
        downloaded .json (encrypted)

License cache:
        localStorage  ──▶ pure state machine  ──▶ Svelte readable
        (string blob)     (decideTier / isStale)    (licenseStore.status)
                                │
                                ▼ (every 24h, async; in-flight dedup)
        POST /v1/validate ──▶ Cloudflare Worker  ──▶ KV lookup
                                                       │
                                                       ▼
                                       populated by Polar.sh webhook
```

### Why these choices

- **Local-first, no cloud sync.** Mental-health entries are the most
  sensitive plaintext a person writes. Least-trust posture is the
  right default. Trade-off: encrypted backup file is the only
  migration path in v0.1.0. Accepted consciously.
- **Pure state machine for license validation.** Identical to AMG +
  FHIR Lens. Shell (license-cache.ts) is thin, so its bugs are
  mechanical (wrong key) not logical (wrong tier). All three products
  will eventually share the same module byte-for-byte if we extract
  it; premature to abstract with one too few callers.
- **Pure digest builder.** Same justification — no DOM, no Dexie
  import.
- **Svelte 5 runes.** `$state`, `$derived`, `$effect`, `$props`
  everywhere for view-local reactivity. License cache stays a classic
  `readable` store because it's truly cross-route.
- **No PDF library.** `window.print()` + print stylesheet is smaller,
  faster, and looks better than every 2026 in-browser PDF generator.
  One-extra-click trade-off for a per-session feature is fine.
- **Tailwind 4 gotcha:** cannot `@apply` a custom class from another
  `@layer components` block. `.field-textarea` inlines the utility
  list instead of `@apply field-input min-h-[7rem]`.
- **TypeScript 5.7 stricter Web Crypto typing.** `Uint8Array<ArrayBufferLike>`
  is not assignable to `BufferSource` — `src/lib/export.ts` casts at
  three call sites in `deriveKey` and `decryptPayload`.

## Data model

**Ledger DB name:** `ledger.v1`. Bump the number when you migrate.

**ThoughtRecord** (`src/lib/db.ts`):
```ts
{ id?: number, kind: 'thought',
  createdAtMs, updatedAtMs,
  situation, automaticThought, emotion,
  intensityBefore: 0..10,
  distortions: string[],          // ids from distortions.ts OR settings.customDistortions
  evidenceFor, evidenceAgainst, balancedThought,
  intensityAfter: number | null }
```

**PanicEntry**:
```ts
{ id?: number, kind: 'panic',
  createdAtMs, situation,
  intensity: 0..10, note }
```

**Settings** (single row, `id: 1`):
```ts
{ id: 1,
  hasSeenWelcome: boolean,
  hasTherapist: 'yes' | 'no' | 'unanswered',
  lastDigestViewedMs: number,
  customDistortions: { id: string, label: string, gloss: string }[] }
```

**Never delete data silently.** This is therapy material. Migrations
must preserve. The 30-entry free-tier cap is a *display* cap, not a
delete — Pro reveals everything the moment it activates.

## License validation

**Product slug on the wire:** `ledger` (via `PRODUCT_ID` constant in
`license-state.ts`). Registered in
[`labs/_shared/license-worker/src/products.ts`](../../_shared/license-worker/src/products.ts)
in the `KNOWN_PRODUCT_IDS` array alongside `alembic-migration-guard`
and `fhir-lens`.

**Worker endpoint:** `https://acilox-license-worker.acilox.workers.dev/v1/validate`
(overridable via Settings → Pro → Self-hosted license server).

**LocalStorage keys:**
- `ledger.license.state.v1` — cached `CachedLicenseState` JSON blob.
- `ledger.machine.id.v1` — per-install UUID sent as `installation_id`.
- `ledger.license.server.v1` — override URL (empty when using default).

**Flow:**
1. User pastes key → `licenseStore.activate(key)`.
2. Pending state written; UI shows "Validating…".
3. POST `{ license_key, product_id: 'ledger', installation_id }`.
4. On 200 `{ valid: true }` → `stateFromResponse` → tier flips to
   `pro` synchronously.
5. Every 24h `licenseStore.refresh()` re-checks in the background.
6. On network failure → `stateAfterTransientFailure` keeps prior tier
   until 7 days elapse (`OFFLINE_GRACE_MS`).

**License key prefix:** `lg_` (Polar prefix convention — must match
whatever the user configures in Polar when creating the product).

## Feature status

| Surface | Status | Notes |
|---|---|---|
| Thought-record form (`/new`) | Done | Loads custom distortions in onMount. |
| Panic capture (`/panic`) | Done | Autofocuses. ⌘/Ctrl+Enter saves. |
| Entry list (`/`) | Done | Free cap = 30, Pro cap = 100. |
| Entry detail (`/entry/[id]`) | Done | `resolveDistortion` with raw-id fallback for deleted custom vocab. |
| Weekly digest (`/digest`) | Done | Rolling-7d + calendar-week toggle. Pro adds top reframes + hardest panics. |
| Encrypted backup | Done | AES-GCM-256 / PBKDF2-SHA256 310k. Merge or replace on import. |
| Settings → therapist check-in | Done | Surfaces directory links when "no". |
| Settings → distortion vocabulary editor | Done | Add/delete custom entries with kebab-case collision-safe ids. |
| Settings → license activation | Done | Includes clear + self-hosted-server override. |
| First-run welcome | Done | Three slides, marks `hasSeenWelcome`. |
| PWA manifest + icons | Done | SVG + 192/512/180 PNG + maskable 512. |
| Service worker | Done | `/v1/` bypassed; SPA fallback to `/`. |
| Print stylesheet | Done | Strips chrome via `.no-print`. |
| Unit tests | Written | Not yet executed in this session. |
| Live-worker round trip | Not done | Requires deploy + Polar. |
| Landing page (`ledger.acilox.com`) | Not done | `labs/ledger/landing/` still empty. |

## Tests

Written but not yet run:

```bash
npm test
# node --test --import tsx test/**/*.test.ts
```

Coverage (36 test cases total):
- **distortions.test.ts** (13 cases) — catalog integrity, kebab-case
  ids, `distortionById`, `resolveDistortion` (custom fallback +
  built-in-wins-on-collision), `slugifyDistortionLabel` (5 cases:
  normalize, punctuation, empty, built-in collision, custom
  collision).
- **digest.test.ts** (12 cases) — window filtering, distortion
  ranking, custom-distortion label fallback, average + delta math,
  top reframes ordering + `balancedThought` requirement, hardest
  panics.
- **export.test.ts** (9 cases) — passphrase round-trip, envelope
  shape, fresh salt+IV per encryption, <8-char guard, empty guard,
  wrong-passphrase reject, version reject, scheme reject,
  tampered-ciphertext reject via AES-GCM auth tag.
- **license-state.test.ts** — 24h recheck, 7-day grace, revocation,
  transient failure, happy + sad paths.

**Missing coverage** (accepted for v0.1.0):
- Browser Dexie integration (helpers are exercised only through the
  routes, not in a headless-browser test).
- Service worker cache/network-first behavior in a real browser.
- PWA install flow on iOS Safari.
- License-cache localStorage persistence + in-flight dedup (only the
  pure state machine is tested).

## Pending work — quick view

See [docs/roadmap.md](roadmap.md) for the deep list. Highlights:

**Blocks v0.1.0 launch (in order):**
1. Run `npm install && npm run build && npm test` and fix anything
   that surfaces.
2. Manually walk every route in `npm run dev` — welcome, new, panic,
   entry, digest, settings. Verify print layout. Verify PWA install.
3. Create GitHub repo `acilox/ledger`, push v0.1.0.
4. Deploy the static build to Cloudflare Pages behind
   `ledger.acilox.com`. DNS + SSL.
5. Create Polar product "Ledger Pro" ($79 one-time), enable license
   keys with prefix `lg_`.
6. Register Polar webhook at deployed license worker.
7. Deploy the updated license worker (`products.ts` change).
8. Test purchase → key issued → activation unlocks Pro. Revoke → Pro
   drops within grace window.
9. Apply [docs/acilox-com-labs-changes.md](acilox-com-labs-changes.md)
   to `acilox.com/labs`.
10. Launch: Show HN, r/CBT, r/mentalhealth (with care), Product Hunt.

**v0.1.x polish (post-launch):**
- OG image at 1200×630 for `/labs/ledger`.
- Screenshot set for the landing page.
- Distortion vocabulary export/import inside the encrypted backup
  (already in `Settings` type; just needs UI surfacing).

**v0.2+ roadmap items** (do NOT ship in v0.1.0):
- Capacitor iOS/Android wrapper reusing the same SvelteKit build.
- Home-screen widget for panic capture.
- Haptic feedback on intensity slider.
- v0.3.0: therapist-share mode — one-time read-only encrypted link.
- v0.4.0: optional encrypted R2 sync as Pro-Plus ($29).
- v1.0: companion CBT exercise packs (behavioural activation, ERP
  worksheets, sleep-restriction log).

## How to run + build + test locally

```bash
cd labs/ledger
npm install              # first time (uses .npmrc override)
npm run prepare          # generates .svelte-kit/tsconfig.json
npm run dev              # http://localhost:5173
npm run build            # static SPA in build/
npm run preview          # serves build/ for a smoke check
npm run lint             # tsc --noEmit
npm test                 # node --test with tsx loader
npm run icons            # regenerate PNG icons from static/favicon.svg
```

**Reset the app** in the browser: DevTools → Application → Storage →
Clear site data. Kills the DB, the license cache, and the welcome
flag.

**Test Pro without a real Polar purchase:** stand up the license
worker locally (see
[../../_shared/license-worker/README.md](../../_shared/license-worker/README.md)),
register a dev key with any prefix in `KNOWN_KEYS_JSON`, set the
self-hosted server URL to `http://localhost:8787`, paste the key.

## How to add things (patterns)

**Add a built-in distortion.** Append to `DISTORTIONS` in
`src/lib/distortions.ts`. It appears in `/new`'s chip list
automatically and is picked up by `resolveDistortion` first.

**Add a route.** Create `src/routes/<name>/+page.svelte`. It's CSR
because of `+layout.ts`. If it needs custom distortions, load
`settings.customDistortions` in `onMount` and pass to any helper that
expects the custom catalog.

**Add a route parameter.** `src/routes/entry/[id]/+page.svelte` shows
the pattern — parse the token via regex, dispatch to the right table.

**Add a DB migration.** Bump `this.version(N)` in `LedgerDb` and add
`.upgrade(tx => ...)`. Never drop data silently. Add a migration test
in `test/`.

**Add a distortion editor edge case.** `slugifyDistortionLabel`
handles collisions. If you introduce a new invariant (e.g. reserved
slug names), enforce it in the slugifier + `test/distortions.test.ts`.

**Regenerate icons.** Edit `static/favicon.svg` → `npm run icons`.
The script re-composites onto slate-900 (`#0f172a`) with 10%
safe-area pad on the maskable variant.

**Add a new product slug to the license worker.** Add to
`KNOWN_PRODUCT_IDS` in
[`labs/_shared/license-worker/src/products.ts`](../../_shared/license-worker/src/products.ts).
Add a test case in `labs/_shared/license-worker/test/worker.test.ts`.
Redeploy the worker.

## Cross-repo dependencies

- **`labs/_shared/license-worker/`** — the Cloudflare Worker Ledger
  validates against. Must have `ledger` in `KNOWN_PRODUCT_IDS`
  (already done). Must be deployed before Pro can activate.
- **`labs/alembic-migration-guard/`** — parallel product using the
  same worker + license state pattern. Read its `docs/` for launch
  precedent.
- **`labs/fhir-lens/`** — same pattern. In-build per the plan.
- **`labs/site/PRODUCTS.md`** — Labs product registry. Ledger is
  listed. Astro scaffold hasn't been built yet.
- **`acilox.github.io/`** — Acilox **Source** brand. Untouched.
  Ledger is in **Labs**, not Source.

## Locked constraints (from user memory)

- **Commit email:** always `acidb062@gmail.com`, never `dkumar191`.
  See [commit_email memory](../../../.claude/projects/-Users-dkumar191-Documents-Custom-Projects-portfolio/memory/commit_email.md).
- **GitHub PAT handling:** push to `acilox/*` without saving the PAT
  anywhere. See [github_pat_handling memory](../../../.claude/projects/-Users-dkumar191-Documents-Custom-Projects-portfolio/memory/github_pat_handling.md).
- **Source repos** (`acilox.github.io` + the 10 portfolio projects)
  **stay untouched.**
- **Cash budget:** $0-100 over 90 days. Organic only, no paid ads.
- **Marketing surface** is `acilox.com/labs`, NOT `acilox.github.io`.
- **Build-first → ship live → THEN launch.** No waitlist demand-gate.
- **Testing:** user said "Don't test anything - just keep building,
  start doing tests once you feel like you are 100% good on
  development". Don't run `npm test` / `npm run build` /
  `npm run dev` mid-session unless the user asks or you have
  explicitly finished the dev pass.

## Related memory pointers

- [acilox_labs_plan.md](../../../.claude/projects/-Users-dkumar191-Documents-Custom-Projects-portfolio/memory/acilox_labs_plan.md) — 4-bet Labs portfolio, ship calendar, kill criteria. Ledger was added as a B2C extra outside the original 4-bet plan.
- [portfolio_site.md](../../../.claude/projects/-Users-dkumar191-Documents-Custom-Projects-portfolio/memory/portfolio_site.md) — Astro 5 + Tailwind 4 build gotchas (relevant when `labs/site/` gets scaffolded).
- [tend_marketplace_plan.md](../../../.claude/projects/-Users-dkumar191-Documents-Custom-Projects-portfolio/memory/tend_marketplace_plan.md) — flagship product, separate arm.

## Kill criteria

Ledger sits outside the original 4-bet plan's calibrated kill list, so
no formal "sunset if X" gate. Practical cues to reconsider:

- **<30 unique installs in the first 60 days post-launch.** Signal
  that the CBT-tool-buying audience isn't reachable via organic dev
  channels (Show HN, r/CBT, therapist forums). Not a kill —
  reconsider the channel mix.
- **<3 paying customers in the first 90 days.** Signal that the
  $79-once anchor isn't clearing the "I could just use Notion" bar.
  Consider Pro-Plus features or bundle-with-Pattern-Library.
- **A single therapy body flags Ledger as unsafe or misleading.**
  Full pause. Ledger's disclaimer is explicit; if that's not
  sufficient in someone's jurisdiction, address before continuing.

## Change log for THIS document

- 2026-07-01 — Initial version.
