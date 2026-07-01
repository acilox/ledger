// Constants and shared formatters.

export const APP_VERSION = '0.1.0';
export const PURCHASE_URL = 'https://acilox.com/labs/ledger';

const DATE_FMT = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const DATETIME_FMT = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const TIME_FMT = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

export function fmtDate(ms: number): string {
  return DATE_FMT.format(new Date(ms));
}

export function fmtDateTime(ms: number): string {
  return DATETIME_FMT.format(new Date(ms));
}

export function fmtTime(ms: number): string {
  return TIME_FMT.format(new Date(ms));
}

export function fmtRelative(ms: number, nowMs: number = Date.now()): string {
  const diffSec = Math.round((nowMs - ms) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h ago`;
  const days = Math.round(diffSec / 86400);
  if (days < 7) return `${days}d ago`;
  return fmtDate(ms);
}

export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dayLabel(ms: number, nowMs: number = Date.now()): string {
  const a = new Date(ms);
  const b = new Date(nowMs);
  const sameDay = a.toDateString() === b.toDateString();
  if (sameDay) return 'Today';
  const yesterday = new Date(nowMs - 86400_000);
  if (a.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return fmtDate(ms);
}
