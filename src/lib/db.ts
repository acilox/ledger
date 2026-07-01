// Local-first storage.
//
// IndexedDB via Dexie. Two record kinds: full CBT thought records and
// quick "panic" captures (situation + intensity only). Settings are
// stored alongside as a single key-value row so the Settings page is one
// place, not three.
//
// Migrations: bump DB version + add a .upgrade block. Never delete data
// silently — this is therapy material and the buyer's trust hinges on it
// being there in six months.

import Dexie, { type Table } from 'dexie';

/** A full CBT thought-record entry. */
export interface ThoughtRecord {
  id?: number;
  kind: 'thought';
  createdAtMs: number;
  updatedAtMs: number;
  situation: string;
  automaticThought: string;
  emotion: string;
  intensityBefore: number;      // 0–10
  distortions: string[];        // distortion ids from distortions.ts
  evidenceFor: string;
  evidenceAgainst: string;
  balancedThought: string;
  intensityAfter: number | null;
}

/** A panic / quick-capture entry. */
export interface PanicEntry {
  id?: number;
  kind: 'panic';
  createdAtMs: number;
  situation: string;
  intensity: number;            // 0–10
  note: string;
}

export type Entry = ThoughtRecord | PanicEntry;

/** Single-row settings table. id is always 1. */
export interface Settings {
  id: 1;
  hasSeenWelcome: boolean;
  hasTherapist: 'yes' | 'no' | 'unanswered';
  lastDigestViewedMs: number;
  customDistortions: { id: string; label: string; gloss: string }[];
}

export class LedgerDb extends Dexie {
  thoughts!: Table<ThoughtRecord, number>;
  panics!: Table<PanicEntry, number>;
  settings!: Table<Settings, number>;

  constructor(name = 'ledger.v1') {
    super(name);
    this.version(1).stores({
      thoughts: '++id, createdAtMs, updatedAtMs',
      panics: '++id, createdAtMs',
      settings: 'id',
    });
  }
}

// Singleton — the DB connection is intentionally process-wide.
let _db: LedgerDb | null = null;
export function db(): LedgerDb {
  if (!_db) _db = new LedgerDb();
  return _db;
}

// ---------- query helpers ------------------------------------------------

export async function listThoughts(limit?: number): Promise<ThoughtRecord[]> {
  let coll = db().thoughts.orderBy('createdAtMs').reverse();
  if (limit !== undefined) coll = coll.limit(limit);
  return coll.toArray();
}

export async function listPanics(limit?: number): Promise<PanicEntry[]> {
  let coll = db().panics.orderBy('createdAtMs').reverse();
  if (limit !== undefined) coll = coll.limit(limit);
  return coll.toArray();
}

export async function listEntriesSince(sinceMs: number): Promise<Entry[]> {
  const [thoughts, panics] = await Promise.all([
    db().thoughts.where('createdAtMs').above(sinceMs).toArray(),
    db().panics.where('createdAtMs').above(sinceMs).toArray(),
  ]);
  return [...thoughts, ...panics].sort((a, b) => b.createdAtMs - a.createdAtMs);
}

/** Last N combined entries across both kinds. */
export async function listRecentEntries(limit: number): Promise<Entry[]> {
  // Cheap to over-fetch then merge — the volumes are personal-scale.
  const [thoughts, panics] = await Promise.all([
    db().thoughts.orderBy('createdAtMs').reverse().limit(limit).toArray(),
    db().panics.orderBy('createdAtMs').reverse().limit(limit).toArray(),
  ]);
  return [...thoughts, ...panics]
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .slice(0, limit);
}

export async function getThought(id: number): Promise<ThoughtRecord | undefined> {
  return db().thoughts.get(id);
}

export async function getPanic(id: number): Promise<PanicEntry | undefined> {
  return db().panics.get(id);
}

export async function saveThought(record: Omit<ThoughtRecord, 'id' | 'kind' | 'updatedAtMs'> & { id?: number }): Promise<number> {
  const nowMs = Date.now();
  if (record.id !== undefined) {
    await db().thoughts.update(record.id, { ...record, kind: 'thought', updatedAtMs: nowMs });
    return record.id;
  }
  return db().thoughts.add({ ...record, kind: 'thought', updatedAtMs: nowMs });
}

export async function savePanic(record: Omit<PanicEntry, 'id' | 'kind'>): Promise<number> {
  return db().panics.add({ ...record, kind: 'panic' });
}

export async function deleteThought(id: number): Promise<void> {
  await db().thoughts.delete(id);
}

export async function deletePanic(id: number): Promise<void> {
  await db().panics.delete(id);
}

// ---------- settings ----------------------------------------------------

const DEFAULT_SETTINGS: Settings = {
  id: 1,
  hasSeenWelcome: false,
  hasTherapist: 'unanswered',
  lastDigestViewedMs: 0,
  customDistortions: [],
};

export async function getSettings(): Promise<Settings> {
  const existing = await db().settings.get(1);
  if (existing) return existing;
  await db().settings.put(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS };
}

export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
  const current = await getSettings();
  const next: Settings = { ...current, ...patch, id: 1 };
  await db().settings.put(next);
  return next;
}

// ---------- counts ------------------------------------------------------

export async function totalEntryCount(): Promise<number> {
  const [t, p] = await Promise.all([db().thoughts.count(), db().panics.count()]);
  return t + p;
}

// ---------- bulk for export/import --------------------------------------

export async function exportAll(): Promise<{
  thoughts: ThoughtRecord[];
  panics: PanicEntry[];
  settings: Settings;
}> {
  const [thoughts, panics, settings] = await Promise.all([
    db().thoughts.toArray(),
    db().panics.toArray(),
    getSettings(),
  ]);
  return { thoughts, panics, settings };
}

export async function importAll(
  data: { thoughts: ThoughtRecord[]; panics: PanicEntry[]; settings?: Settings },
  mode: 'merge' | 'replace',
): Promise<{ thoughtsImported: number; panicsImported: number }> {
  return db().transaction('rw', db().thoughts, db().panics, db().settings, async () => {
    if (mode === 'replace') {
      await db().thoughts.clear();
      await db().panics.clear();
    }
    const thoughtsImported = await db().thoughts.bulkAdd(
      data.thoughts.map(({ id: _id, ...rest }) => rest as ThoughtRecord),
      { allKeys: true },
    ).then((keys) => (Array.isArray(keys) ? keys.length : 0));
    const panicsImported = await db().panics.bulkAdd(
      data.panics.map(({ id: _id, ...rest }) => rest as PanicEntry),
      { allKeys: true },
    ).then((keys) => (Array.isArray(keys) ? keys.length : 0));
    if (data.settings) {
      const merged: Settings = { ...(await getSettings()), ...data.settings, id: 1 };
      await db().settings.put(merged);
    }
    return { thoughtsImported, panicsImported };
  });
}
