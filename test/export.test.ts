// Encrypted export round-trip tests.
//
// Node 20+ ships Web Crypto via globalThis.crypto, which is what export.ts uses.

import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

import {
  decryptPayload,
  encryptPayload,
  type EncryptedEnvelope,
  type ExportPayload,
} from '../src/lib/export';

function makePayload(): ExportPayload {
  return {
    thoughts: [
      {
        id: 1,
        kind: 'thought',
        createdAtMs: 1_700_000_000_000,
        updatedAtMs: 1_700_000_000_000,
        situation: 'standing on the platform',
        automaticThought: 'I am going to mess this up',
        emotion: 'anxious',
        intensityBefore: 8,
        distortions: ['catastrophizing', 'mind-reading'],
        evidenceFor: 'It is busy.',
        evidenceAgainst: 'I have done this before.',
        balancedThought: 'It might be hard but I can handle it.',
        intensityAfter: 4,
      },
    ],
    panics: [
      { id: 1, kind: 'panic', createdAtMs: 1_700_000_100_000, situation: 'sudden surge', intensity: 9, note: '' },
    ],
    settings: {
      id: 1,
      hasSeenWelcome: true,
      hasTherapist: 'yes',
      lastDigestViewedMs: 0,
      customDistortions: [],
    },
    exportedAtMs: 1_700_000_200_000,
    appVersion: '0.1.0',
  };
}

describe('encryptPayload / decryptPayload', () => {
  it('round-trips a payload with the correct passphrase', async () => {
    const payload = makePayload();
    const envelope = await encryptPayload(payload, 'correct-horse-battery');
    const out = await decryptPayload(envelope, 'correct-horse-battery');
    assert.deepEqual(out, payload);
  });

  it('produces a recognizable envelope shape', async () => {
    const envelope = await encryptPayload(makePayload(), 'correct-horse-battery');
    assert.equal(envelope.v, 1);
    assert.equal(envelope.alg, 'AES-GCM-256');
    assert.equal(envelope.kdf, 'PBKDF2-SHA256');
    assert.equal(envelope.iters, 310_000);
    assert.ok(envelope.saltB64.length > 0);
    assert.ok(envelope.ivB64.length > 0);
    assert.ok(envelope.cipherB64.length > 0);
  });

  it('uses a fresh salt + IV each encryption', async () => {
    const payload = makePayload();
    const a = await encryptPayload(payload, 'correct-horse-battery');
    const b = await encryptPayload(payload, 'correct-horse-battery');
    assert.notEqual(a.saltB64, b.saltB64);
    assert.notEqual(a.ivB64, b.ivB64);
    assert.notEqual(a.cipherB64, b.cipherB64);
  });

  it('rejects passphrases shorter than 8 characters', async () => {
    await assert.rejects(
      () => encryptPayload(makePayload(), 'short'),
      /at least 8/,
    );
  });

  it('rejects empty passphrase', async () => {
    await assert.rejects(
      () => encryptPayload(makePayload(), ''),
      /at least 8/,
    );
  });

  it('refuses to decrypt with a wrong passphrase', async () => {
    const envelope = await encryptPayload(makePayload(), 'correct-horse-battery');
    await assert.rejects(
      () => decryptPayload(envelope, 'wrong-horse-battery'),
      /passphrase is wrong/,
    );
  });

  it('refuses to decrypt an envelope with an unsupported version', async () => {
    const envelope = await encryptPayload(makePayload(), 'correct-horse-battery');
    const bumped: EncryptedEnvelope = { ...envelope, v: 99 };
    await assert.rejects(
      () => decryptPayload(bumped, 'correct-horse-battery'),
      /Unsupported export version/,
    );
  });

  it('refuses to decrypt an envelope with an unsupported scheme', async () => {
    const envelope = await encryptPayload(makePayload(), 'correct-horse-battery');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bad: EncryptedEnvelope = { ...envelope, alg: 'ROT-13' as any };
    await assert.rejects(
      () => decryptPayload(bad, 'correct-horse-battery'),
      /Unsupported encryption scheme/,
    );
  });

  it('refuses tampered ciphertext (AES-GCM authentication catches it)', async () => {
    const envelope = await encryptPayload(makePayload(), 'correct-horse-battery');
    // Flip one base64 char in the cipher so the decrypt step's auth tag check fails.
    const tampered: EncryptedEnvelope = {
      ...envelope,
      cipherB64: envelope.cipherB64.slice(0, -2) + (envelope.cipherB64.endsWith('A=') ? 'B=' : 'A='),
    };
    await assert.rejects(
      () => decryptPayload(tampered, 'correct-horse-battery'),
      /passphrase is wrong or the file is corrupt/,
    );
  });
});
