// Digest builder tests — pure function, no DB needed.

import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

import {
  buildDigest,
  calendarWeekRange,
  thisWeekRange,
} from '../src/lib/digest';
import type { Entry, PanicEntry, ThoughtRecord } from '../src/lib/db';

const t0 = 1_700_000_000_000;
const DAY = 86_400_000;

function t(opts: Partial<ThoughtRecord> & { id: number; createdAtMs: number }): ThoughtRecord {
  return {
    kind: 'thought',
    updatedAtMs: opts.createdAtMs,
    situation: 'situation',
    automaticThought: 'auto',
    emotion: 'anxious',
    intensityBefore: 7,
    distortions: [],
    evidenceFor: '',
    evidenceAgainst: '',
    balancedThought: '',
    intensityAfter: null,
    ...opts,
  };
}

function p(opts: Partial<PanicEntry> & { id: number; createdAtMs: number }): PanicEntry {
  return {
    kind: 'panic',
    situation: 'sit',
    intensity: 8,
    note: '',
    ...opts,
  };
}

describe('thisWeekRange', () => {
  it('spans 7 days ending at nowMs', () => {
    const r = thisWeekRange(t0);
    assert.equal(r.endMs, t0);
    assert.equal(r.endMs - r.startMs, 7 * DAY);
    assert.match(r.label, /7 days/);
  });
});

describe('calendarWeekRange', () => {
  it('starts on Monday 00:00 and spans 7 days', () => {
    // t0 = 2023-11-14 Tue UTC ; local TZ may shift this. Just assert width.
    const r = calendarWeekRange(t0);
    assert.equal(r.endMs - r.startMs, 7 * DAY);
    const start = new Date(r.startMs);
    assert.equal(start.getDay(), 1, 'starts on Monday in local time');
    assert.equal(start.getHours(), 0);
    assert.equal(start.getMinutes(), 0);
  });
});

describe('buildDigest', () => {
  const range = { startMs: t0 - 7 * DAY, endMs: t0, label: 'Last 7 days' };

  it('empty entries → isEmpty=true', () => {
    const d = buildDigest([], range);
    assert.equal(d.isEmpty, true);
    assert.equal(d.thoughtCount, 0);
    assert.equal(d.panicCount, 0);
    assert.equal(d.averageIntensityBefore, null);
    assert.equal(d.averageIntensityAfter, null);
    assert.equal(d.averageDelta, null);
    assert.equal(d.distortions.length, 0);
  });

  it('excludes entries outside the window', () => {
    const entries: Entry[] = [
      t({ id: 1, createdAtMs: t0 - 8 * DAY }),       // outside
      t({ id: 2, createdAtMs: t0 - 1 * DAY }),       // inside
      p({ id: 3, createdAtMs: t0 - 10 * DAY }),      // outside
    ];
    const d = buildDigest(entries, range);
    assert.equal(d.thoughtCount, 1);
    assert.equal(d.panicCount, 0);
  });

  it('excludes entries at or beyond endMs', () => {
    const entries: Entry[] = [t({ id: 1, createdAtMs: range.endMs })];
    const d = buildDigest(entries, range);
    assert.equal(d.thoughtCount, 0);
  });

  it('counts distortions across thoughts and sorts by frequency', () => {
    const entries: Entry[] = [
      t({ id: 1, createdAtMs: t0 - DAY, distortions: ['catastrophizing', 'mind-reading'] }),
      t({ id: 2, createdAtMs: t0 - DAY, distortions: ['catastrophizing'] }),
      t({ id: 3, createdAtMs: t0 - DAY, distortions: ['catastrophizing', 'all-or-nothing'] }),
    ];
    const d = buildDigest(entries, range);
    assert.equal(d.distortions[0]!.id, 'catastrophizing');
    assert.equal(d.distortions[0]!.count, 3);
    assert.equal(d.distortions[1]!.count, 1);
  });

  it('falls back to custom distortion label when not in catalog', () => {
    const entries: Entry[] = [
      t({ id: 1, createdAtMs: t0 - DAY, distortions: ['meta-shame'] }),
    ];
    const custom = [{ id: 'meta-shame', label: 'Meta-shame', gloss: '' }];
    const d = buildDigest(entries, range, custom);
    assert.equal(d.distortions[0]!.label, 'Meta-shame');
  });

  it('renders distortion id as label when no catalog match', () => {
    const entries: Entry[] = [
      t({ id: 1, createdAtMs: t0 - DAY, distortions: ['unknown-id'] }),
    ];
    const d = buildDigest(entries, range);
    assert.equal(d.distortions[0]!.label, 'unknown-id');
  });

  it('averages intensities and computes deltas only for completed reframes', () => {
    const entries: Entry[] = [
      t({ id: 1, createdAtMs: t0 - DAY, intensityBefore: 8, intensityAfter: 4 }),  // delta=4
      t({ id: 2, createdAtMs: t0 - DAY, intensityBefore: 6, intensityAfter: 2 }),  // delta=4
      t({ id: 3, createdAtMs: t0 - DAY, intensityBefore: 5, intensityAfter: null }), // excluded from delta
    ];
    const d = buildDigest(entries, range);
    assert.equal(d.thoughtCount, 3);
    assert.equal(d.averageIntensityBefore, (8 + 6 + 5) / 3);
    assert.equal(d.averageIntensityAfter, (4 + 2) / 2);
    assert.equal(d.averageDelta, 4);
  });

  it('top reframes sorted by delta desc, max 5, requires balancedThought', () => {
    const entries: Entry[] = [
      t({ id: 1, createdAtMs: t0 - DAY, intensityBefore: 10, intensityAfter: 1, balancedThought: 'a' }),
      t({ id: 2, createdAtMs: t0 - DAY, intensityBefore: 9, intensityAfter: 8, balancedThought: 'b' }),
      t({ id: 3, createdAtMs: t0 - DAY, intensityBefore: 7, intensityAfter: 2, balancedThought: '' }),  // no balancedThought
      t({ id: 4, createdAtMs: t0 - DAY, intensityBefore: 6, intensityAfter: 3, balancedThought: 'c' }),
    ];
    const d = buildDigest(entries, range);
    assert.equal(d.topReframes.length, 3);
    assert.equal(d.topReframes[0]!.thoughtId, 1);
    assert.equal(d.topReframes[0]!.delta, 9);
  });

  it('hardest panics sorted by intensity desc, max 5', () => {
    const entries: Entry[] = Array.from({ length: 7 }, (_, i) =>
      p({ id: i + 1, createdAtMs: t0 - DAY, intensity: i + 1 }),
    );
    const d = buildDigest(entries, range);
    assert.equal(d.hardestPanics.length, 5);
    assert.equal(d.hardestPanics[0]!.intensity, 7);
    assert.equal(d.hardestPanics[4]!.intensity, 3);
  });
});
