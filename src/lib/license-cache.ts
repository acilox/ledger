// License cache — browser-side impure shell.
//
// Wraps license-state.ts with localStorage persistence + fetch validation.
// The cached tier resolves synchronously from localStorage so UI gates
// don't flash; revalidation runs in the background every 24h.
//
// One install = one machineId, generated lazily and persisted. Sent to the
// worker so future seat-enforcement has a stable per-device handle.

import { writable, get, type Readable } from 'svelte/store';
import {
  PRODUCT_ID,
  RECHECK_INTERVAL_MS,
  decideTier,
  emptyState,
  isStale,
  stateAfterTransientFailure,
  stateFromResponse,
  type CachedLicenseState,
  type LicenseTier,
  type ValidateResponse,
} from './license-state';

const DEFAULT_SERVER = 'https://acilox-license-worker.acilox.workers.dev';
const LS_STATE_KEY = 'ledger.license.state.v1';
const LS_MACHINE_KEY = 'ledger.machine.id.v1';
const LS_SERVER_KEY = 'ledger.license.server.v1';

type Status = {
  tier: LicenseTier;
  message: string;
  lastChecked: Date | null;
  staleSince: Date | null;
  serverUrl: string;
};

function readState(): CachedLicenseState | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(LS_STATE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedLicenseState;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.licenseKey !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeState(state: CachedLicenseState | null): void {
  if (typeof localStorage === 'undefined') return;
  if (state === null) {
    localStorage.removeItem(LS_STATE_KEY);
    return;
  }
  localStorage.setItem(LS_STATE_KEY, JSON.stringify(state));
}

function machineId(): string {
  if (typeof localStorage === 'undefined') return 'ssr';
  const existing = localStorage.getItem(LS_MACHINE_KEY);
  if (existing) return existing;
  const id = `m_${crypto.randomUUID()}`;
  localStorage.setItem(LS_MACHINE_KEY, id);
  return id;
}

function serverUrl(): string {
  if (typeof localStorage === 'undefined') return DEFAULT_SERVER;
  return (localStorage.getItem(LS_SERVER_KEY) || DEFAULT_SERVER).replace(/\/+$/, '');
}

function setServerUrl(url: string): void {
  if (typeof localStorage === 'undefined') return;
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed || trimmed === DEFAULT_SERVER) {
    localStorage.removeItem(LS_SERVER_KEY);
  } else {
    localStorage.setItem(LS_SERVER_KEY, trimmed);
  }
}

// In-flight Promise dedup so two near-simultaneous tier reads make one fetch.
let inFlight: Promise<CachedLicenseState> | null = null;

async function validateNow(key: string, prior: CachedLicenseState | null): Promise<CachedLicenseState> {
  const url = `${serverUrl()}/v1/validate`;
  const nowMs = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        license_key: key,
        product_id: PRODUCT_ID,
        installation_id: machineId(),
      }),
    });
    if (!res.ok) {
      return stateAfterTransientFailure(key, prior, nowMs, `HTTP ${res.status}`);
    }
    const body = (await res.json()) as ValidateResponse;
    return stateFromResponse(key, prior, body, nowMs);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return stateAfterTransientFailure(key, prior, nowMs, detail);
  }
}

function computeStatus(state: CachedLicenseState | null): Status {
  const now = Date.now();
  return {
    tier: decideTier(state, now),
    message: state?.message ?? 'No license key set.',
    lastChecked: state ? new Date(state.lastCheckedMs) : null,
    staleSince: state && isStale(state, now) ? new Date(state.lastCheckedMs + RECHECK_INTERVAL_MS) : null,
    serverUrl: serverUrl(),
  };
}

export function createLicenseStore(): {
  status: Readable<Status>;
  tier: () => LicenseTier;
  isPro: () => boolean;
  activate: (key: string) => Promise<Status>;
  refresh: () => Promise<Status>;
  setServer: (url: string) => void;
  clear: () => void;
  hydrate: () => void;
} {
  const store = writable<Status>(computeStatus(null));

  function refreshStore(): void {
    store.set(computeStatus(readState()));
  }

  async function doValidate(key: string, prior: CachedLicenseState | null): Promise<Status> {
    if (inFlight) {
      await inFlight;
      return get(store);
    }
    inFlight = validateNow(key, prior);
    try {
      const next = await inFlight;
      writeState(next);
      refreshStore();
      return get(store);
    } finally {
      inFlight = null;
    }
  }

  return {
    status: { subscribe: store.subscribe },

    tier(): LicenseTier {
      return decideTier(readState(), Date.now());
    },

    isPro(): boolean {
      return decideTier(readState(), Date.now()) === 'pro';
    },

    async activate(key: string): Promise<Status> {
      const trimmed = key.trim();
      if (!trimmed) {
        writeState(null);
        refreshStore();
        return get(store);
      }
      const prior = readState();
      // Seed an empty pending state so UI shows "checking"
      const pending: CachedLicenseState = prior ?? { ...emptyState(), licenseKey: trimmed };
      writeState({ ...pending, licenseKey: trimmed, message: 'Validating…' });
      refreshStore();
      return doValidate(trimmed, prior);
    },

    async refresh(): Promise<Status> {
      const state = readState();
      if (!state || !state.licenseKey) return get(store);
      if (!isStale(state, Date.now())) return get(store);
      return doValidate(state.licenseKey, state);
    },

    setServer(url: string): void {
      setServerUrl(url);
      refreshStore();
    },

    clear(): void {
      writeState(null);
      refreshStore();
    },

    hydrate(): void {
      refreshStore();
      // Fire-and-forget background revalidation.
      void this.refresh();
    },
  };
}

// Singleton instance. Pages call .hydrate() in onMount.
export const licenseStore = createLicenseStore();
