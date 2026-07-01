// Pure license state machine.
//
// Same contract as the FHIR Lens / Alembic Migration Guard equivalents so
// all three products share one Cloudflare Worker. No DOM, no fetch, no
// storage — the impure shell is license-cache.ts. Keeping this pure makes
// the 24h-recheck + 7-day-offline-grace policy unit-testable in isolation.

export type LicenseTier = 'free' | 'pro';

export interface CachedLicenseState {
  licenseKey: string;
  lastValid: boolean;
  lastTier: LicenseTier;
  lastCheckedMs: number;
  lastValidMs: number;
  jwt: string | null;
  expMs: number;
  message: string;
}

export interface ValidateResponse {
  valid: boolean;
  tier?: LicenseTier;
  jwt?: string;
  exp_ms?: number;
  message: string;
}

export const RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;        // 24h
export const OFFLINE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;        // 7 days
export const PRODUCT_ID = 'ledger' as const;

export function isStale(state: CachedLicenseState, nowMs: number): boolean {
  return nowMs - state.lastCheckedMs > RECHECK_INTERVAL_MS;
}

export function decideTier(state: CachedLicenseState | null, nowMs: number): LicenseTier {
  if (!state) return 'free';
  if (!state.lastValid) return 'free';
  if (state.expMs > 0 && nowMs > state.expMs) {
    const sinceLastSuccess = nowMs - state.lastValidMs;
    if (sinceLastSuccess > OFFLINE_GRACE_MS) return 'free';
  }
  return state.lastTier;
}

export function stateFromResponse(
  key: string,
  prior: CachedLicenseState | null,
  body: ValidateResponse,
  nowMs: number,
): CachedLicenseState {
  return {
    licenseKey: key,
    lastValid: body.valid === true,
    lastTier: body.valid === true ? (body.tier ?? 'pro') : 'free',
    lastCheckedMs: nowMs,
    lastValidMs: body.valid === true ? nowMs : (prior?.lastValidMs ?? 0),
    jwt: body.jwt ?? null,
    expMs: body.exp_ms ?? 0,
    message: body.message ?? (body.valid ? 'License validated.' : 'License invalid.'),
  };
}

export function stateAfterTransientFailure(
  key: string,
  prior: CachedLicenseState | null,
  nowMs: number,
  detail: string,
): CachedLicenseState {
  if (prior) {
    return {
      ...prior,
      lastCheckedMs: nowMs,
      message: `Could not reach license server (${detail}). Using cached state.`,
    };
  }
  return {
    licenseKey: key,
    lastValid: false,
    lastTier: 'free',
    lastCheckedMs: nowMs,
    lastValidMs: 0,
    jwt: null,
    expMs: 0,
    message: `Could not reach license server (${detail}). Will retry.`,
  };
}

export function emptyState(): CachedLicenseState {
  return {
    licenseKey: '',
    lastValid: false,
    lastTier: 'free',
    lastCheckedMs: Date.now(),
    lastValidMs: 0,
    jwt: null,
    expMs: 0,
    message: 'No license key set.',
  };
}
