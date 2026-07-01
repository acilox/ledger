// License state machine — same tests as FHIR Lens / Alembic Guard.

import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

import {
  OFFLINE_GRACE_MS,
  RECHECK_INTERVAL_MS,
  decideTier,
  emptyState,
  isStale,
  stateAfterTransientFailure,
  stateFromResponse,
} from '../src/lib/license-state';
import type { CachedLicenseState } from '../src/lib/license-state';

const KEY = 'lg-test-key';
const t0 = 1_700_000_000_000;

function priorProState(opts: Partial<CachedLicenseState> = {}): CachedLicenseState {
  return {
    licenseKey: KEY,
    lastValid: true,
    lastTier: 'pro',
    lastCheckedMs: t0,
    lastValidMs: t0,
    jwt: 'fake.jwt.value',
    expMs: t0 + RECHECK_INTERVAL_MS * 30,
    message: 'License validated.',
    ...opts,
  };
}

describe('decideTier', () => {
  it('null state → free', () => {
    assert.equal(decideTier(null, t0), 'free');
  });

  it('lastValid=false → free', () => {
    assert.equal(decideTier(priorProState({ lastValid: false }), t0), 'free');
  });

  it('fresh valid pro → pro', () => {
    assert.equal(decideTier(priorProState(), t0), 'pro');
  });

  it('JWT expired but within grace → still pro', () => {
    const state = priorProState({ expMs: t0 - 1, lastValidMs: t0 - OFFLINE_GRACE_MS / 2 });
    assert.equal(decideTier(state, t0), 'pro');
  });

  it('JWT expired AND grace exhausted → free', () => {
    const state = priorProState({ expMs: t0 - OFFLINE_GRACE_MS * 2, lastValidMs: t0 - OFFLINE_GRACE_MS * 2 });
    assert.equal(decideTier(state, t0), 'free');
  });

  it('no exp (expMs=0) → always pro if lastValid', () => {
    const state = priorProState({ expMs: 0 });
    assert.equal(decideTier(state, t0 + RECHECK_INTERVAL_MS * 365), 'pro');
  });
});

describe('isStale', () => {
  it('within 24h → fresh', () => {
    assert.equal(isStale(priorProState(), t0 + RECHECK_INTERVAL_MS - 1), false);
  });
  it('exactly at 24h → fresh (boundary)', () => {
    assert.equal(isStale(priorProState(), t0 + RECHECK_INTERVAL_MS), false);
  });
  it('past 24h → stale', () => {
    assert.equal(isStale(priorProState(), t0 + RECHECK_INTERVAL_MS + 1), true);
  });
});

describe('stateFromResponse', () => {
  it('valid=true sets lastValidMs to now', () => {
    const next = stateFromResponse(KEY, null, { valid: true, tier: 'pro', exp_ms: 0, message: 'ok' }, t0);
    assert.equal(next.lastValid, true);
    assert.equal(next.lastValidMs, t0);
    assert.equal(next.lastTier, 'pro');
  });

  it('valid=false preserves prior lastValidMs', () => {
    const prior = priorProState({ lastValidMs: t0 - 1000 });
    const next = stateFromResponse(KEY, prior, { valid: false, message: 'revoked' }, t0);
    assert.equal(next.lastValid, false);
    assert.equal(next.lastValidMs, t0 - 1000);
    assert.equal(next.lastTier, 'free');
  });

  it('uses default tier=pro when valid but tier missing', () => {
    const next = stateFromResponse(KEY, null, { valid: true, message: 'ok' }, t0);
    assert.equal(next.lastTier, 'pro');
  });
});

describe('stateAfterTransientFailure', () => {
  it('with prior state — preserves lastValidMs, updates lastChecked + message', () => {
    const prior = priorProState();
    const next = stateAfterTransientFailure(KEY, prior, t0 + 1_000_000, 'connection reset');
    assert.equal(next.lastValid, true);
    assert.equal(next.lastValidMs, t0);
    assert.equal(next.lastCheckedMs, t0 + 1_000_000);
    assert.ok(next.message.includes('connection reset'));
  });

  it('without prior state — falls back to free, message mentions detail', () => {
    const next = stateAfterTransientFailure(KEY, null, t0, 'timeout');
    assert.equal(next.lastValid, false);
    assert.equal(next.lastTier, 'free');
    assert.ok(next.message.includes('timeout'));
  });
});

describe('emptyState', () => {
  it('has the shape decideTier expects', () => {
    const s = emptyState();
    assert.equal(decideTier(s, Date.now()), 'free');
  });
});

describe('end-to-end scenarios', () => {
  it('happy path: first activation → pro stays pro after 24h recheck', () => {
    let state: CachedLicenseState | null = null;
    state = stateFromResponse(KEY, state, { valid: true, tier: 'pro', exp_ms: t0 + 1e10, message: 'ok' }, t0);
    assert.equal(decideTier(state, t0), 'pro');
    assert.equal(decideTier(state, t0 + RECHECK_INTERVAL_MS - 1), 'pro');
    assert.equal(decideTier(state, t0 + RECHECK_INTERVAL_MS * 2), 'pro');
  });

  it('offline survival: pro state, network down for 5 days → still pro', () => {
    let state: CachedLicenseState = stateFromResponse(KEY, null, { valid: true, tier: 'pro', exp_ms: t0 - 1, message: 'ok' }, t0);
    for (let day = 1; day <= 5; day++) {
      state = stateAfterTransientFailure(KEY, state, t0 + day * 86400_000, 'timeout');
      assert.equal(decideTier(state, t0 + day * 86400_000), 'pro', `day ${day}`);
    }
  });

  it('grace exhausted: pro state, network down for 10 days → free', () => {
    let state: CachedLicenseState = stateFromResponse(KEY, null, { valid: true, tier: 'pro', exp_ms: t0 - 1, message: 'ok' }, t0);
    state = stateAfterTransientFailure(KEY, state, t0 + 10 * 86400_000, 'timeout');
    assert.equal(decideTier(state, t0 + 10 * 86400_000), 'free');
  });

  it('explicit revocation: server says valid:false → immediate free', () => {
    let state: CachedLicenseState = stateFromResponse(KEY, null, { valid: true, tier: 'pro', message: 'ok' }, t0);
    state = stateFromResponse(KEY, state, { valid: false, message: 'revoked' }, t0 + 1000);
    assert.equal(decideTier(state, t0 + 1000), 'free');
  });
});
