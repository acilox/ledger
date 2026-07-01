// Encrypted export / import (Pro feature).
//
// Web Crypto: PBKDF2-SHA256 (310,000 iters) → AES-GCM-256.
// The file is a tiny JSON envelope so future versions can detect schema
// changes without sniffing magic bytes.
//
// Why encrypt at all: the unencrypted JSON would be a printable transcript
// of someone's mental-health diary. Even a one-time export-to-Dropbox flow
// deserves at-rest protection.

import { exportAll, importAll, type PanicEntry, type Settings, type ThoughtRecord } from './db';

const ENVELOPE_VERSION = 1;
const PBKDF2_ITERS = 310_000;
const PBKDF2_HASH: AlgorithmIdentifier = 'SHA-256';
const SALT_BYTES = 16;
const IV_BYTES = 12;

export interface ExportPayload {
  thoughts: ThoughtRecord[];
  panics: PanicEntry[];
  settings: Settings;
  exportedAtMs: number;
  appVersion: string;
}

export interface EncryptedEnvelope {
  v: number;
  alg: 'AES-GCM-256';
  kdf: 'PBKDF2-SHA256';
  iters: number;
  saltB64: string;
  ivB64: string;
  cipherB64: string;
}

function b64encode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]!);
  return btoa(s);
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERS, hash: PBKDF2_HASH },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptPayload(payload: ExportPayload, passphrase: string): Promise<EncryptedEnvelope> {
  if (!passphrase || passphrase.length < 8) {
    throw new Error('Passphrase must be at least 8 characters.');
  }
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, plaintext as BufferSource);
  return {
    v: ENVELOPE_VERSION,
    alg: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256',
    iters: PBKDF2_ITERS,
    saltB64: b64encode(salt),
    ivB64: b64encode(iv),
    cipherB64: b64encode(cipher),
  };
}

export async function decryptPayload(envelope: EncryptedEnvelope, passphrase: string): Promise<ExportPayload> {
  if (envelope.v !== ENVELOPE_VERSION) {
    throw new Error(`Unsupported export version: ${envelope.v}`);
  }
  if (envelope.alg !== 'AES-GCM-256' || envelope.kdf !== 'PBKDF2-SHA256') {
    throw new Error('Unsupported encryption scheme.');
  }
  const salt = b64decode(envelope.saltB64);
  const iv = b64decode(envelope.ivB64);
  const cipher = b64decode(envelope.cipherB64);
  const key = await deriveKey(passphrase, salt);
  let plainBuf: ArrayBuffer;
  try {
    plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, cipher as BufferSource);
  } catch {
    throw new Error('Could not decrypt — passphrase is wrong or the file is corrupt.');
  }
  const text = new TextDecoder().decode(plainBuf);
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch {
    throw new Error('File decrypted but did not contain a Ledger export.');
  }
  return parsed as ExportPayload;
}

// ---------- high-level browser hooks ------------------------------------

/** Build an encrypted blob ready to download. */
export async function buildEncryptedExport(passphrase: string, appVersion: string): Promise<Blob> {
  const data = await exportAll();
  const payload: ExportPayload = {
    ...data,
    exportedAtMs: Date.now(),
    appVersion,
  };
  const envelope = await encryptPayload(payload, passphrase);
  const json = JSON.stringify(envelope, null, 2);
  return new Blob([json], { type: 'application/json;charset=utf-8' });
}

/** Decrypt + import a file picked from <input type="file">. */
export async function importEncryptedFile(
  file: File,
  passphrase: string,
  mode: 'merge' | 'replace',
): Promise<{ thoughtsImported: number; panicsImported: number }> {
  const text = await file.text();
  let envelope: EncryptedEnvelope;
  try { envelope = JSON.parse(text); } catch {
    throw new Error('That file is not valid JSON.');
  }
  const payload = await decryptPayload(envelope, passphrase);
  if (!Array.isArray(payload.thoughts) || !Array.isArray(payload.panics)) {
    throw new Error('Decrypted payload is missing required fields.');
  }
  return importAll(payload, mode);
}
