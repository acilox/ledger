# Ledger — Launch copy pack

Every post you might publish, pre-written and ready to paste. Read
[DEPLOY.md § Stage 9](DEPLOY.md) for the *order* of posting; this doc
is only the *content*.

Edit lightly so it sounds like you — the drafts here are deliberately
plain. Voice > polish on Show HN.

---

## Before you post — a 60-second sanity check

- [ ] `https://ledger.acilox.com/` loads cold in <2s on mobile.
- [ ] Real Polar checkout works end-to-end with a test card.
- [ ] The buy button on the site points at the LIVE Polar URL, not
      the sandbox URL.
- [ ] You've done the mobile PWA "add to home screen" test on your
      personal iPhone AND Android (or borrowed one).
- [ ] You can afford to answer replies for the next 6 hours. Silence
      after a Show HN post looks worse than not posting.
- [ ] Time zone: US Pacific 8-10am Tue/Wed/Thu is the algorithm
      sweet spot for HN Front Page.

---

## 1 — Show HN post

**Where:** [https://news.ycombinator.com/submit](https://news.ycombinator.com/submit)

**Title (80-char limit — this is 74):**
```
Show HN: Ledger – a calm CBT thought record, local-first, one-time $79
```

**URL:**
```
https://ledger.acilox.com
```

**Text (leave blank if pasting URL, or use the body below as a
follow-up first comment):**

> **First comment (post it yourself, ~30 seconds after submission,
> so the top-of-thread has your voice not a stranger's):**

```
Author here. Quick context on why this exists:

Every CBT app I tried had at least one of three problems for me:
it was a mood tracker with graphs (wrong format for cognitive
restructuring), an AI chatbot pretending to be a therapist
(dangerous — the literature is clear that LLMs are not a substitute
for a trained clinician), or a subscription that would delete my
entries if I ever stopped paying (a bad long-term contract with
therapy material).

Ledger is a PWA. Entries live in your browser's IndexedDB. The only
network call is an optional 24-hour license validation ping that
sends just the license key — no entries, no analytics, no telemetry.
If you export your data, it's AES-GCM encrypted with a PBKDF2-SHA256
key (310k iterations) derived from your passphrase. The server never
sees plaintext.

Free forever tier: full Burns/Beck thought-record format (situation,
automatic thought, distortions, evidence for/against, balanced
thought, re-rated intensity), 30-second panic capture, weekly
digest, last 30 entries. Pro is one-time $79 for unlimited history,
the richer digest with distortion patterns over time, and the
encrypted backup.

Explicit non-goals I want to name so people don't ask:
- No AI advice. Ledger is a form you fill out, not a therapist.
- No mood graphs. Different product.
- No streaks or gamification. Harmful for a therapy tool.
- No social features. Ever.

Not a medical device. If you're in crisis the welcome screen
surfaces hotlines.

Would love feedback from anyone who does thought records already,
particularly on the format faithfulness and the print layout — I
designed the print output around bringing entries into therapy
sessions. Also open to being told the pricing is wrong.

Source: https://github.com/acilox/ledger (MIT, PWA is fully
functional in free tier — Pro is unlocked by a license key from
Polar).
```

**How to handle the first hour:**
- Reply within 5 min to every comment. Be short. Concede real
  critiques with grace.
- If someone points out a bug — thank them, file the issue in the
  repo publicly, link it in your reply.
- If someone questions the price — don't defend, ask what they'd
  compare it to.
- If a therapist shows up in the thread — get their DM. Free Pro
  license as thanks.
- Do NOT argue politics, do NOT engage with bad-faith comments,
  do NOT reply to your own submission with alt accounts (HN
  detects, ban is permanent).

---

## 2 — Bluesky / Twitter / X (public link + screenshot)

**Where:** post ~15-30 min after the HN submission goes live, once
you have an HN URL to link.

**Post (Bluesky char limit 300; X 280 — this is 269):**

```
I built Ledger — a calm CBT thought record.

Local-first PWA. Entries never leave your device.
Full Burns/Beck format. 30s panic capture. Weekly
digest for therapy prep. Encrypted backup.

One-time $79. No subscription. Not a medical device.

https://ledger.acilox.com

Show HN: [paste HN link]
```

**Attach:** the OG image (`static/og-image.png`) or a real product
screenshot. Prefer the digest page or `/new` mid-form — those
communicate the product better than the landing.

**Thread reply #1 (~2 min later):**
```
Why it exists in one line:

Every CBT app I tried was either an AI chatbot pretending to be a
therapist, a mood tracker with graphs, or a subscription that
would delete my entries if I ever stopped paying. None of those
match how thought records are supposed to work.
```

**Thread reply #2 (~2 min later):**
```
Non-goals I want to name explicitly so they don't come up as
"missing features":

- No AI advice. It's a form, not a therapist.
- No mood graphs. Different product.
- No streaks. Actively harmful for therapy tools.
- No social features. Ever.
```

---

## 3 — LinkedIn (only if you post there — otherwise skip)

**Where:** LinkedIn feed, personal profile. Post the same day as
Show HN but ~4-6 hours later so it doesn't split the launch audience.

**Post:**

```
Shipped a small tool this week I've been sitting on: Ledger, a
local-first CBT thought record.

It's a PWA — entries live in your browser, not on my server. The
only thing that touches the network is an optional license
validation ping. If you export your data, it's encrypted with a
key derived from your passphrase.

Three deliberate non-features:
→ No AI advice. It's a structured form, not a chatbot pretending
  to be a therapist.
→ No mood graphs. Ledger uses the Burns/Beck cognitive
  restructuring format, which the literature says is what actually
  works. Mood tracking is a different product.
→ No subscription. One-time $79 for Pro (unlimited history,
  encrypted backup, richer digest). Free forever tier is a fully
  usable thought record with the last 30 entries.

Not a medical device. If you're in crisis the welcome screen
surfaces hotlines.

Feedback from anyone doing therapy work, either as a client or a
clinician, would mean a lot — particularly on format faithfulness
and the print layout, which I designed around bringing entries
into sessions.

→ ledger.acilox.com
→ Source: github.com/acilox/ledger
```

---

## 4 — r/CBT

**Where:** [reddit.com/r/CBT](https://reddit.com/r/CBT) — CHECK THE
RULES FIRST. Some subs require flair for self-promotion; some ban
it outright. If ambiguous, message the mods before posting.

**Title:**
```
Built a local-first thought-record PWA for my own CBT practice — asking for format-faithfulness feedback
```

**Body:**

```
Hi r/CBT — long-time reader.

I've been keeping thought records for [~N months/years — say
whatever's true for you]. The apps I tried never quite fit: some
felt like mood trackers with graphs, some tried to be chatbot
therapists, and the paid ones would lock me out of my own history
if I stopped subscribing.

So I built one for myself and eventually turned it into a
downloadable PWA called Ledger. It's the full Burns/Beck cognitive
restructuring format: situation, automatic thought, distortions,
evidence for/against, balanced thought, re-rated intensity. Plus a
30-second "panic capture" for when the full format is too much in
the moment, and a weekly digest that highlights recurring
distortion patterns.

Entries live in your browser (IndexedDB). Nothing touches my
server unless you buy Pro, and even then the only thing that goes
to the server is an anonymous license key — no entries, no
content, no telemetry.

I'm launching this week and before I do I would love feedback from
this community on **format faithfulness**. Specifically:

1. Does the distortion list match what your therapist / textbook
   uses? Ledger uses the standard Burns 10, but I know traditions
   differ.
2. Is the "re-rate intensity after the balanced thought" flow
   right? I read it as "shift in belief" in Beck; some sources
   frame it as "shift in emotion intensity."
3. Is the print layout actually useful for bringing entries into a
   session? That's what I designed it around but I haven't tested
   it with a working therapist yet.

Not a medical device — the welcome screen surfaces crisis hotlines
and reminds users this is a self-help tool, not treatment.

Free forever tier lives at ledger.acilox.com if you want to try
the format.

Not looking to sell here — genuinely looking for "the format is
wrong in this way" feedback before I promote it more broadly.
Happy to answer any questions.
```

**If the sub has a self-promotion flair:** use it. If not, keep the
"asking for feedback on the format" frame — that is honest AND is
what the sub is for.

---

## 5 — r/therapists

**Only post if you have `[Tool]` or `[App Review]` flair permission
from mods.** r/therapists is aggressively self-promo strict.
Message the mods first with a link to your unlaunched preview if
possible. Skip this sub entirely if uncertain.

**Title:**
```
[Tool feedback wanted] Local-first CBT thought-record PWA I built — would love clinician eyes on the format
```

**Body:**

```
Not selling here — asking for feedback.

I built a small PWA called Ledger to keep my own CBT thought
records (Burns/Beck format). It's now a public tool at
ledger.acilox.com. Before I promote it more broadly I want to make
sure the format is faithful to how it's actually taught, and that
the "not a medical device" framing lands correctly.

What it is:
- Local-first (IndexedDB) — nothing leaves the client except an
  optional license validation ping
- Full Burns/Beck thought record: situation → automatic thought →
  intensity → distortions → evidence for → evidence against →
  balanced thought → re-rated intensity
- 30-second "panic capture" for when the full format is too much
- Weekly digest that surfaces recurring distortion patterns —
  designed to be printed and brought to a session

What it is NOT:
- Not AI-driven. There's no chatbot. It's a structured form.
- Not a mood tracker.
- Not subscription-based (one-time $79 for Pro).
- Not a medical device — welcome screen surfaces crisis hotlines.

What I'd love clinician feedback on:
1. Does the format faithfully match how you'd teach a client to
   run a thought record?
2. Is the print layout usable for a session (bringing to therapy)?
3. Is the "not a medical device" framing sufficient? I want to
   avoid any suggestion that Ledger substitutes for treatment.
4. Would you feel comfortable directing a client to try it? Why
   or why not?

Free tier is fully functional (last 30 entries). Happy to give any
practicing clinician a free Pro license — DM me.

Source is public on GitHub if you want to audit the encryption /
data handling: github.com/acilox/ledger
```

---

## 6 — r/PWA and r/webdev (technical audience)

**Where:** r/PWA is small but engaged. r/webdev is huge — expect
mixed signal. Both are self-promo-tolerant when the technical
angle is real.

**Title:**
```
Show r/PWA: Ledger — local-first CBT thought record, IndexedDB + AES-GCM export + PWA install
```

**Body:**

```
Built and shipped a local-first PWA this week. Stack details for
the technical audience:

- SvelteKit 2 + Svelte 5 runes + Tailwind 4
- @sveltejs/adapter-static → static build, deploys on Cloudflare
  Pages
- Dexie 4 for IndexedDB (ledger.v1 database, three tables:
  thoughts, panics, settings)
- Encrypted backup: PBKDF2-SHA256 (310k iterations) → AES-GCM-256
  via WebCrypto. Passphrase-derived, server never sees plaintext
- License validation: Cloudflare Worker + KV, 24-hour local cache,
  gracefully degrades to cached state if the network is offline
- Installable via the standard PWA prompt. Add-to-Home-Screen
  works on iOS 17+ and Android Chrome
- MIT source: github.com/acilox/ledger

The product itself is a CBT thought record (mental health self-
help), one-time $79 for Pro, but posting here for the PWA nerds.

Interested in feedback on:
- Anything I've done wrong in the service worker / install flow
- Better patterns for the offline-first license validation
- iOS PWA quirks I might not have hit yet (still smoke-testing on
  real devices)
```

---

## 7 — Day 1 recap (post 24h after launch)

**Where:** Bluesky/X, personal profile. Same-day thread as launch
if you want; otherwise post next morning.

**Post:**

```
Ledger — day 1 in numbers:

→ [X] unique visitors
→ [X] PWA installs
→ [X] Pro purchases → $[X] gross
→ [X] Show HN comments, [X] karma
→ [X] bugs filed, [X] fixed, [X] shipped in v0.1.1

Biggest surprise: [one true observation]
Biggest thing I got wrong: [one true concession]
Biggest thing to fix in week 2: [one commit]

Not a medical device.
Free tier at ledger.acilox.com.
```

**Guidance for filling in:**
- Post real numbers. If you have 3 sales say 3. Fake growth
  posturing is easy to spot and destroys the trust the launch
  built.
- If a number is embarrassing, post it anyway with a plain-language
  explanation. Honest founders get followed; posturing founders
  get muted.
- If numbers are strong, still lead with the concession — makes
  the wins more credible.

---

## 8 — Day 7 update (only if there's genuinely something to report)

Skip this entirely if the week was quiet. A boring "still shipping"
post dilutes the launch signal.

**Post-if-worth-posting:**

```
Ledger — week 1:

→ [X] installs total
→ [X] Pro purchases
→ First real user story: [one line from a real user, anonymized]
→ Shipped in v0.1.x: [1-3 fixes that landed]

What week 2 looks like: [one concrete next thing]

github.com/acilox/ledger
```

---

## 9 — Day 30 recap + kill-criteria decision

**Where:** blog post (if you have one) or a long-form thread. Only
post if there's a real decision to communicate — otherwise sit on
it.

Reference [AGENTS.md § Kill criteria](AGENTS.md) before writing.
The point of the day-30 recap is to publicly hold yourself to the
criteria you set BEFORE launch. That's the trust the audience
follows you for on the next thing.

**Structure:**
1. Numbers (installs, sales, revenue, churn signals if any).
2. What the kill criteria were.
3. Did it clear them? Yes / No / Ambiguous.
4. What you're doing next: (a) invest further per the roadmap,
   (b) hold at maintenance, (c) sunset.
5. One thing you learned that generalizes beyond Ledger.

Post the decision publicly whether it went well or not. Founders
who publicly kill unsuccessful bets get *more* trust for the next
launch, not less.

---

## Response templates for common Show HN questions

Save yourself typing. All of these are pre-approved for tone; edit
only the specifics.

**"Why not just use [Daylio / MoodTracker / other]?"**
```
Great question. Those are mood trackers — they log how you feel
over time and graph it. Ledger is a thought record — it walks you
through cognitive restructuring on a specific automatic thought
(Burns/Beck format). Different tools, different job. If you want
mood tracking Daylio is genuinely great; I'm not trying to compete
with it.
```

**"Why not free / open-core / donation-supported?"**
```
Two reasons. One: I want this to still exist in 5 years, and free
tools built by one person on nights and weekends tend to bit-rot
when the maintainer's attention shifts. Paying for it makes it
sustainable. Two: the free tier is genuinely usable (full Burns/
Beck format, last 30 entries, weekly digest, panic capture) — Pro
is unlimited history + encrypted backup + richer digest. If you
never buy Pro you still have a working thought record.
```

**"How is this not a medical device?"**
```
Honest answer: because it doesn't diagnose, treat, cure, or
prevent any condition, and it explicitly says so on the welcome
screen. It's a form. Same regulatory footing as a paper CBT
workbook. If Ledger claimed to detect depression or recommend
treatment, that would be a device — it does neither.
```

**"Is this HIPAA compliant?"**
```
HIPAA compliance applies to Covered Entities (healthcare providers,
plans, clearinghouses). Ledger is B2C — I'm not a Covered Entity
and you're not my patient. That said: the data model is designed
so that HIPAA compliance wouldn't require significant changes.
Entries never touch my server. Encrypted export uses AES-GCM-256
with a PBKDF2-SHA256 (310k iterations) passphrase-derived key. If
you're a clinician who wants to direct clients here, the client's
data stays on the client's device.
```

**"Why should I trust encryption you wrote yourself?"**
```
I didn't. Ledger uses the browser's WebCrypto API — PBKDF2 and
AES-GCM primitives that ship in every modern browser and are the
same ones your bank uses. The code that calls them is 40 lines and
public on GitHub (github.com/acilox/ledger). No custom crypto.
```

**"Can I self-host?"**
```
The PWA itself is self-hostable — clone the repo, `npm ci`,
`npm run build`, serve the `build/` directory anywhere. The
license validation worker is also open source. If you don't
need Pro features you never need to run the worker; the free tier
works standalone.
```

**"Will you ship [Capacitor native / therapist share / sync]?"**
```
All three are on the public roadmap (docs/roadmap.md): v0.2
Capacitor + home-screen panic widget, v0.3 one-time encrypted
therapist share, v0.4 optional encrypted sync. v0.2 ships if v0.1
clears its install kill-criteria; v0.3 and v0.4 depend on v0.2
adoption. I don't want to promise dates I can't hold.
```

---

## What NOT to post, ever

- Do not run paid ads on Ledger. It's not the strategy and it
  poisons the "one dev, self-funded" trust that carries the launch.
- Do not comment on your own HN submission with alt accounts.
  Detection is automatic and the ban is permanent.
- Do not post to r/mentalhealth, r/anxiety, r/depression, or any
  crisis-adjacent sub. Those subs correctly police self-promo
  around vulnerable users, and a single misstep can nuke your
  Reddit reputation forever.
- Do not DM strangers on Twitter/X or LinkedIn about Ledger. The
  ROI is zero and the "spam" perception damage is real.
- Do not respond to negative reviews / comments with a defensive
  tone. Concede real critiques, ignore trolls, don't argue.
- Do not lie about numbers in the day-1 / day-7 recap. If it's
  boring, post it boring. Honesty is the only long-term compound
  strategy for a solo founder.
