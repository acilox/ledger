// Weekly digest builder — pure function over a list of entries.
//
// Pro-gated in the UI, but the function itself runs everywhere so we can
// unit-test patterns independent of the DB layer. Outputs a structured
// summary the digest page renders; the page is what gets printed.
//
// Design intent: a therapist needs to see (a) frequency, (b) what hit
// hardest, (c) which distortions kept showing up, and (d) whether the
// reframe lowered intensity. Anything beyond that is noise.

import { distortionById, type Distortion } from './distortions';
import type { Entry, PanicEntry, ThoughtRecord } from './db';

export interface DigestRange {
  startMs: number;
  endMs: number;
  label: string;
}

export interface DigestDistortionCount {
  id: string;
  label: string;
  count: number;
}

export interface DigestReframe {
  thoughtId: number;
  createdAtMs: number;
  situation: string;
  automaticThought: string;
  balancedThought: string;
  intensityBefore: number;
  intensityAfter: number | null;
  delta: number | null;
}

export interface DigestPanicHighlight {
  id: number;
  createdAtMs: number;
  situation: string;
  intensity: number;
  note: string;
}

export interface Digest {
  range: DigestRange;
  thoughtCount: number;
  panicCount: number;
  averageIntensityBefore: number | null;
  averageIntensityAfter: number | null;
  averageDelta: number | null;
  distortions: DigestDistortionCount[];
  topReframes: DigestReframe[];
  hardestPanics: DigestPanicHighlight[];
  isEmpty: boolean;
}

/** Compute the "last 7 days" window ending at nowMs. */
export function thisWeekRange(nowMs: number): DigestRange {
  const endMs = nowMs;
  const startMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  return { startMs, endMs, label: 'Last 7 days' };
}

/** Compute the "current calendar week (Mon–Sun)" window. */
export function calendarWeekRange(nowMs: number): DigestRange {
  const now = new Date(nowMs);
  const day = now.getDay();              // 0 = Sun, 1 = Mon, ...
  const daysSinceMon = (day + 6) % 7;    // Mon=0, Tue=1, ..., Sun=6
  const start = new Date(now);
  start.setDate(now.getDate() - daysSinceMon);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { startMs: start.getTime(), endMs: end.getTime(), label: 'This week (Mon–Sun)' };
}

function isThought(e: Entry): e is ThoughtRecord {
  return e.kind === 'thought';
}

function isPanic(e: Entry): e is PanicEntry {
  return e.kind === 'panic';
}

function mean(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function buildDigest(
  entries: Entry[],
  range: DigestRange,
  customDistortions: { id: string; label: string; gloss: string }[] = [],
): Digest {
  const inRange = entries.filter((e) => e.createdAtMs >= range.startMs && e.createdAtMs < range.endMs);
  const thoughts = inRange.filter(isThought);
  const panics = inRange.filter(isPanic);

  const counts = new Map<string, number>();
  for (const t of thoughts) {
    for (const d of t.distortions) {
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
  }
  const distortions: DigestDistortionCount[] = Array.from(counts.entries())
    .map(([id, count]) => {
      const known: Distortion | undefined = distortionById(id);
      const custom = customDistortions.find((c) => c.id === id);
      return { id, count, label: known?.label ?? custom?.label ?? id };
    })
    .sort((a, b) => b.count - a.count);

  const intensityBefore = thoughts.map((t) => t.intensityBefore);
  const intensityAfter = thoughts
    .map((t) => t.intensityAfter)
    .filter((n): n is number => n !== null);
  const deltas = thoughts
    .filter((t) => t.intensityAfter !== null)
    .map((t) => t.intensityBefore - (t.intensityAfter as number));

  const topReframes: DigestReframe[] = thoughts
    .filter((t) => t.intensityAfter !== null && t.balancedThought.trim().length > 0)
    .map((t) => ({
      thoughtId: t.id!,
      createdAtMs: t.createdAtMs,
      situation: t.situation,
      automaticThought: t.automaticThought,
      balancedThought: t.balancedThought,
      intensityBefore: t.intensityBefore,
      intensityAfter: t.intensityAfter,
      delta: t.intensityBefore - (t.intensityAfter as number),
    }))
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
    .slice(0, 5);

  const hardestPanics: DigestPanicHighlight[] = panics
    .map((p) => ({
      id: p.id!,
      createdAtMs: p.createdAtMs,
      situation: p.situation,
      intensity: p.intensity,
      note: p.note,
    }))
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 5);

  return {
    range,
    thoughtCount: thoughts.length,
    panicCount: panics.length,
    averageIntensityBefore: mean(intensityBefore),
    averageIntensityAfter: mean(intensityAfter),
    averageDelta: mean(deltas),
    distortions,
    topReframes,
    hardestPanics,
    isEmpty: thoughts.length === 0 && panics.length === 0,
  };
}
