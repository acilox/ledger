# acilox.com/labs — Changes for Ledger launch

This doc describes the exact content to add to acilox.com when **Ledger**
goes live. **Nothing already on the site changes** — the existing
`/labs` contact form is preserved verbatim, and the Alembic Migration
Guard card added by
[`alembic-migration-guard/docs/acilox-com-labs-changes.md`](../../alembic-migration-guard/docs/acilox-com-labs-changes.md)
is preserved verbatim. This card slots in *after* the Alembic Migration
Guard card and *after* FHIR Lens (whenever FHIR Lens ships), inside the
existing `.labs-products` section.

## Where this lives

Per the locked sequencing rules ([memory: acilox_labs_plan](../../../.claude/projects/-Users-dkumar191-Documents-Custom-Projects-portfolio/memory/acilox_labs_plan.md)):
- Marketing surface = `acilox.com/labs` (NOT `acilox.github.io`)
- Acilox Source (acilox.github.io) stays untouched
- Build-first → ship live → THEN launch — the PWA is reachable at
  `ledger.acilox.com` (or `/labs/ledger` path) before this card goes
  live

## Section to add to acilox.com/labs

Insert this `<article class="product-card">` block **inside** the
existing `<section class="labs-products">` opened by the Alembic
Migration Guard card. No new section wrapper, no CSS additions — the
existing `.product-card` styles already cover everything.

```mdx
  <article class="product-card">
    <header>
      <h3>Ledger</h3>
      <span class="badge badge-live">Live · v0.1.0</span>
    </header>

    <p class="tagline">
      A calm CBT thought record. Yours forever. Local-first, no account,
      no AI advice — just the right fields and the right print layout
      for showing your therapist.
    </p>

    <ul class="product-bullets">
      <li>Full Burns / Beck thought-record format in seven sections:
          situation, automatic thought, emotion + intensity, distortion
          chips (with definitions on hover), evidence for and against,
          balanced thought, intensity after.</li>
      <li>30-second <strong>panic capture</strong> when the structured
          form is too much. One textarea, one slider, one button — saved
          to the same encrypted local store.</li>
      <li>Weekly digest ranks your distortions and surfaces your hardest
          reframes — designed for "what I want to discuss this week"
          therapy prep, not for streaks.</li>
      <li>Local-first by design: entries live in your browser's
          IndexedDB. The Pro encrypted backup (AES-GCM-256, PBKDF2 with
          310,000 iterations) is the only export path.</li>
      <li>One-time $79. No subscription, no ads, no model reads your
          entries.</li>
    </ul>

    <div class="product-pricing">
      <div class="price-tier">
        <div class="price">Free</div>
        <div class="tier-name">Thought record · Panic capture · Last 30 entries · Basic digest</div>
        <a href="https://ledger.acilox.com" class="cta">
          Open Ledger
        </a>
      </div>
      <div class="price-tier price-tier-recommended">
        <div class="price">$79<span class="cadence">one-time</span></div>
        <div class="tier-name">Pro <span class="badge-small">recommended</span></div>
        <a href="https://buy.polar.sh/<LEDGER_PRODUCT_ID>" class="cta cta-primary">
          Buy Pro Lifetime
        </a>
        <div class="tier-bonus">Unlimited entries · Pro digest sections · Encrypted backup</div>
      </div>
    </div>

    <div class="product-links">
      <a href="https://ledger.acilox.com">
        Try Ledger
      </a>
      <span class="dot">·</span>
      <a href="https://github.com/acilox/ledger">
        Source (commercial license)
      </a>
      <span class="dot">·</span>
      <a href="https://github.com/acilox/ledger/blob/main/README.md">
        Docs
      </a>
    </div>

    <p class="product-disclaimer">
      Ledger is not a medical device and is not a substitute for
      professional care. If you are in crisis, the welcome screen
      surfaces hotlines.
    </p>
  </article>
```

## Replacements before publishing

| Placeholder | Where to get it | When |
|---|---|---|
| `<LEDGER_PRODUCT_ID>` | Polar dashboard → Products → "Ledger Pro – Lifetime" → Public link | After the Ledger Polar product is created |
| `https://ledger.acilox.com` | Subdomain set up to serve the static build from `labs/ledger/build/` (Cloudflare Pages or equivalent) | Before this card goes live |
| `https://github.com/acilox/ledger` Marketplace URL | First public push gives you the canonical URL | After v0.1.0 tag is pushed |

## Optional small CSS addition

The only new class in this card is `.product-disclaimer`. The existing
AMG / FHIR Lens cards don't need it; Ledger's mental-health context
does. Add once, anywhere in the `.labs-products` block:

```css
.labs-products .product-disclaimer {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--color-text-tertiary, #6b7280);
  font-style: italic;
  border-left: 2px solid var(--color-border, #e5e7eb);
  padding-left: 0.75rem;
}
```

## Things NOT to change

- **Contact form on `/labs`** — preserved as-is. Secondary CTA for
  prospects who aren't ready to buy.
- **Alembic Migration Guard card** — preserved as-is. The Ledger card
  appends after it inside the same `.labs-products` section.
- **FHIR Lens card** — when it lands, slot it between AMG and Ledger
  (the canonical order is annual-ladder, lifetime-ladder, one-time).
- **acilox.com brand visuals** — Ledger inherits the existing palette
  and typography via the same `var()` fallbacks the AMG CSS uses.
- **acilox.github.io** — Source repos stay untouched.

## Open Graph card for the Ledger row

When the page goes live, optional addition: a small OG image of the
Ledger journal mark on the slate-900 background, matching the in-app
favicon. The same source SVG that `scripts/generate-icons.mjs` consumes
([`labs/ledger/static/favicon.svg`](../static/favicon.svg)) is the right
starting point — render at 1200×630 with the journal mark centered and
the wordmark "Ledger · a calm CBT thought record" below it.

## SEO

Title: `Ledger – A calm CBT thought record. Yours forever. | Acilox Labs`
Description: `Local-first cognitive behavioural therapy thought-record
PWA. Full Burns / Beck format, 30-second panic capture, weekly digest
for therapy prep, encrypted backup. One-time $79, no subscription, no
AI reads your entries.`
Keywords: `cbt, cognitive behavioural therapy, thought record, panic
capture, mental health journal, therapy prep, local-first, pwa, no
subscription, private journal`
