# Ledger

> **A calm CBT thought record. Yours forever. Local-first, no account, no AI advice.**

`acilox/ledger` is a tiny progressive web app for writing CBT thought
records — the structured "what happened, what did I think, what's the
evidence, what's a more balanced read" exercise that's the working tool
of cognitive behavioural therapy. It has a 30-second panic-capture
sibling for when the structured form is too much.

It is deliberately **not** a chatbot. It does not interpret your
entries. It does not suggest reframes. It does not produce a "mental
health score". It is a notebook with the right fields and the right
print layout for showing your therapist.

**Status:** v0.1.0 — ships the full thought-record flow, panic capture,
weekly digest, first-run welcome with therapist guidance, encrypted
Pro export, PWA service worker, and license validation against the
[Acilox license worker](../_shared/license-worker/). Not yet listed on
[acilox.com/labs](https://acilox.com/labs).

## Why this exists

The mental-health app market has split into three tiers and none of
them is the right tool for someone doing CBT homework between
sessions:

1. **AI-therapist chatbots** (Wysa, Woebot, Replika, ChatGPT-as-therapist).
   These are interpretation engines: they read what you wrote and tell
   you what it means. CBT homework is the opposite — the *act of
   structuring your own thought* is the intervention. Outsourcing it
   to a model defeats the exercise.
2. **Mood-tracker subscriptions** (Daylio, MoodKit, Sanvello). $4-12 /
   month, locked-in cloud storage, optimised for streaks and analytics
   rather than the messy text a real thought record needs.
3. **Pen-and-paper or Notion templates.** Free, but no structure
   guard-rails, no offline-first reliability, no print-for-therapist
   layout, and your thoughts live in the same workspace as your work
   tasks — which has its own ergonomic cost on a hard day.

**Ledger** is the missing tier: a clean, local-first PWA that runs the
CBT thought-record format faithfully (situation → automatic thought →
emotion + intensity → distortions → evidence → balanced thought →
intensity after), has a panic-capture pressure-relief valve, prints
beautifully for a therapy appointment, and asks for a one-time $79
instead of a forever subscription. The free tier keeps the last 30
entries; the Pro tier removes the cap, unlocks the richer weekly
digest, and turns on encrypted backups.

## What ships in v0.1.0

| Surface | Tier | What it does |
|---|---|---|
| **Thought-record form** (`/new`) | Free | Seven CBT sections in one screen: situation, automatic thought, emotion + 0-10 intensity, distortion chips (with definitions and Socratic prompts on hover), evidence for and against side-by-side, balanced thought, intensity-after slider. `⌘/Ctrl+Enter` saves. |
| **Panic capture** (`/panic`) | Free | One textarea, one intensity slider (default 7), one optional note, one big rose button. Designed to be openable from the home-screen shortcut and saved in under 30 seconds. Autofocuses the textarea. |
| **Entry list** (`/`) | Free | Recent entries grouped by day (Today / Yesterday / date). Two big actions at the top: Panic capture, New record. |
| **Entry detail** (`/entry/[id]`) | Free | Read-only view of any saved entry. Edit, delete (two-step), and Print/PDF buttons. |
| **Weekly digest** (`/digest`) | Free preview / Pro full | Counts, average intensity before / after / delta, distortion-frequency ranking. **Pro adds:** top 5 reframes (sorted by intensity drop) and the 5 hardest panics, both designed for "what I want to discuss this week" therapy prep. |
| **Encrypted backup** (`/settings`) | Pro | Export everything to a single AES-GCM-256-encrypted JSON file. PBKDF2-SHA256 (310,000 iterations) keys the symmetric cipher. Restore with passphrase + merge-or-replace mode. |
| **Self-hosted license server** (`/settings`) | Free | Point license validation at your own worker URL — useful for developers and for users who want to keep the validation hop entirely on their own infrastructure. |
| **First-run welcome** (`/welcome`) | Free | Three slides: what Ledger is and is not, the **"are you working with a therapist?"** question with links to Psychology Today / Open Path / BACP if not, and the two ways people use the app (structured-then-panic vs. panic-then-structured). |
| **PWA** | Free | Installable on iOS / Android / desktop. Service worker caches the app shell for offline use; the license-validation endpoint is explicitly excluded from caching so revocations propagate. Two home-screen shortcuts: Panic capture, New record. |
| **Print layout** | Free | Print stylesheet strips the chrome — your therapist gets the entry text and structure cleanly. |

The 10 cognitive distortions catalog (Burns / Beck lineage):
all-or-nothing, catastrophizing, mind-reading, fortune-telling,
emotional reasoning, should-statements, labeling, personalization,
mental filter, disqualifying the positive. Each has a short gloss and
a Socratic prompt that the chip surfaces on hover. **Settings → Your
distortion vocabulary** lets you add your own labels (e.g.
"meta-shame", "future-tripping") with optional descriptions; user-
defined entries appear as chips in new records alongside the
built-ins and are counted in the weekly digest.

## What Ledger is NOT

These are explicit non-features, not roadmap items:

- **No AI in the form.** Nothing reads or interprets your entries. The
  app has no LLM dependency at runtime.
- **No mood graphs or streaks.** Streak-based gamification rewards
  *logging*, not *living*. We rank distortions and intensity-deltas
  because those map directly to the therapist conversation; we will
  not add a 30-day mood line.
- **No social, no sharing, no cloud sync.** Your data lives in this
  browser. Move it with the encrypted backup file.
- **Not a medical device.** Ledger does not diagnose, treat, or assess
  any condition. If you're in crisis the welcome screen surfaces
  hotlines; the rest of the app stays out of the way.

## License validation (v0.1.0)

The Pro tier is validated against the same Cloudflare Worker that
powers Alembic Migration Guard and FHIR Lens, distinguished by a
`product_id: "ledger"` discriminator.

The flow:

1. User pastes their license key into **Settings → Pro**.
2. App POSTs to `https://acilox-license-worker.<account>.workers.dev/v1/validate`
   with `{ license_key, product_id: "ledger", installation_id }`.
3. Worker looks up the key in KV → returns
   `{ valid, tier, jwt, exp_ms, message }`.
4. App caches the result for 24h in `localStorage`. Pro features turn
   on; the cached tier resolves synchronously.
5. After 24h, the app re-checks in the background. Form latency is
   unaffected.
6. **Offline grace:** if the worker is unreachable but the cache says
   the user was valid within the last 7 days, Pro stays on. After 7
   days offline, the app drops back to free silently.

Override the worker URL via **Settings → Pro → Self-hosted license
server** for users running their own validator instance.

## Architecture

```
Browser ──▶ SvelteKit static SPA  (built with @sveltejs/adapter-static)
                │
                ├─ /new ──┐
                ├─ /panic │
                ├─ /entry │── Svelte routes (CSR-only, no SSR)
                ├─ /digest│
                └─ /...   ┘
                │
                ▼
        Dexie (IndexedDB v1)
        ┌───────────────────────────────────────────┐
        │ thoughts:  ++id, createdAtMs, updatedAtMs │
        │ panics:    ++id, createdAtMs              │
        │ settings:  id (single row)                │
        └───────────────────────────────────────────┘
                │
                ▼ (Pro export only, in-memory)
        Web Crypto: PBKDF2-SHA256 → AES-GCM-256 envelope
                │
                ▼
        downloaded .json file (encrypted)

License cache:
        localStorage  ──▶ pure state machine  ──▶ Svelte readable store
        (string blob)     (decideTier / isStale)    (`licenseStore.status`)
                                │
                                ▼ (every 24h, async; in-flight dedup)
        POST /v1/validate ──▶ Cloudflare Worker  ──▶ KV lookup
                                                       │
                                                       ▼
                                       populated by Polar.sh webhook
```

### Why local-first and not "cloud-backed-with-sync"

Mental-health entries are the most sensitive plaintext a person ever
writes. The least-trust posture is the right default: the data sits in
the browser's IndexedDB, encrypted backups are the only export path,
and the only network hop is the optional 24-hour license validation
ping. There is no server-side database to leak, subpoena, or shut
down. The trade-off is no automatic cross-device sync; for v0.1.0 the
encrypted backup file is the explicit migration path.

### Why a pure state machine for license validation

`src/lib/license-state.ts` has no DOM, no `fetch`, no `localStorage` —
just functions that take state and return state. The browser shell
(`license-cache.ts`) handles I/O. This is the same architecture
Alembic Migration Guard and FHIR Lens use: it lets us test every
transition (cache hit, cache miss, transient failure, explicit
revocation, JWT expiry within grace, JWT expiry past grace) without
mocking anything. The shell is thin enough that its bugs are
mechanical (which key did we write?) rather than logical.

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # static SPA in build/
npm run lint         # tsc --noEmit
npm test             # node --test --import tsx
```

Open `http://localhost:5173`, complete the welcome, and the app is
usable. The license cache reads `ledger.license.state.v1` from
`localStorage` — clear it from devtools to reset to the free tier.

**To exercise Pro features without a real Polar.sh purchase:** stand
up the license-worker locally (see
[../\_shared/license-worker/README.md](../_shared/license-worker/README.md)),
register a dev key with `product_id: "ledger"`, then in **Settings →
Pro → Self-hosted license server** set the URL to
`http://localhost:8787` and paste the dev key. Pro features unlock
within a second.

## Pricing

- **Free** — full thought-record form, panic capture, last **30**
  entries, basic weekly digest, encrypted printable detail view.
- **Pro $79 one-time** — removes the 30-entry cap, adds top-reframes
  and hardest-panics to the weekly digest, and turns on encrypted
  backups. Lifetime access — no subscription, no renewal.

The pricing reference point is one therapy session at $150-250. $79 is
deliberately invisible against that anchor and explicitly avoids the
monthly-fee fatigue mental-health subscriptions cause.

Buy at [acilox.com/labs](https://acilox.com/labs).

## Roadmap

- **v0.1.0 (this release):** Thought-record form, panic capture, weekly
  digest with Pro digest sections, encrypted backups, PWA, license
  validation with 7-day offline grace.
- **v0.2.0:** Native iOS / Android wrappers via [Capacitor](https://capacitorjs.com)
  using the exact same SvelteKit build (no rewrite); home-screen
  widget for panic capture; haptic feedback on the intensity slider.
- **v0.3.0:** Therapist-share mode — generate a one-time read-only
  encrypted link that decrypts in the therapist's browser without
  requiring an account on either side.
- **v0.4.0:** Optional encrypted Cloudflare R2 sync as a separate
  Pro-Plus tier ($29 one-time activation) for users who want
  cross-device. Keys never leave the device; R2 only ever holds
  ciphertext.
- **v1.0:** Companion CBT exercise packs (behavioural activation,
  exposure-response-prevention worksheets, sleep-restriction log) as
  in-app modules; each is the same "structure, not interpretation"
  treatment.

## Known limitations

- **No native mobile wrapper yet** — v0.1.0 is browser-only. iOS
  Safari's PWA experience is acceptable but inferior to a Capacitor
  build; v0.2.0 closes that gap.
- **30-entry free tier cap.** Older entries are not deleted; the list
  view simply hides them and surfaces an upsell. They reappear the
  moment Pro activates.

## License

Source available; commercial license. See `LICENSE`. Built by
[Acilox](https://acilox.com) — production-grade systems for AI-native
products.
