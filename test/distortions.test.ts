// Distortions catalog tests.

import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

import { DISTORTIONS, distortionById, resolveDistortion, slugifyDistortionLabel } from '../src/lib/distortions';

describe('distortions catalog', () => {
  it('contains exactly 10 canonical entries', () => {
    assert.equal(DISTORTIONS.length, 10);
  });

  it('has unique ids', () => {
    const ids = DISTORTIONS.map((d) => d.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('every entry has label + gloss + ask', () => {
    for (const d of DISTORTIONS) {
      assert.ok(d.label.length > 0, `${d.id} missing label`);
      assert.ok(d.gloss.length > 0, `${d.id} missing gloss`);
      assert.ok(d.ask.length > 0, `${d.id} missing ask`);
    }
  });

  it('every id is kebab-case', () => {
    for (const d of DISTORTIONS) {
      assert.match(d.id, /^[a-z]+(-[a-z]+)*$/, `${d.id} not kebab-case`);
    }
  });
});

describe('distortionById', () => {
  it('finds a known distortion', () => {
    const d = distortionById('catastrophizing');
    assert.ok(d);
    assert.equal(d!.label, 'Catastrophizing');
  });

  it('returns undefined for unknown id', () => {
    assert.equal(distortionById('not-a-thing'), undefined);
  });
});

describe('resolveDistortion', () => {
  it('falls through to custom catalog when not found in the built-in', () => {
    const custom = [{ id: 'meta-shame', label: 'Meta-shame', gloss: 'Shame about feeling shame.' }];
    const d = resolveDistortion('meta-shame', custom);
    assert.ok(d);
    assert.equal(d!.label, 'Meta-shame');
  });

  it('prefers built-in over custom with the same id', () => {
    const custom = [{ id: 'catastrophizing', label: 'Overridden', gloss: 'Should not win.' }];
    const d = resolveDistortion('catastrophizing', custom);
    assert.ok(d);
    assert.equal(d!.label, 'Catastrophizing');
  });
});

describe('slugifyDistortionLabel', () => {
  it('lowercases, kebab-cases, and trims', () => {
    assert.equal(slugifyDistortionLabel('  Meta Shame  '), 'meta-shame');
  });

  it('strips punctuation and collapses runs', () => {
    assert.equal(slugifyDistortionLabel("It's a what-now?!"), 'it-s-a-what-now');
  });

  it('returns empty string for empty or punctuation-only input', () => {
    assert.equal(slugifyDistortionLabel(''), '');
    assert.equal(slugifyDistortionLabel('   '), '');
    assert.equal(slugifyDistortionLabel('!!!'), '');
  });

  it('suffixes when colliding with a built-in', () => {
    assert.equal(slugifyDistortionLabel('Catastrophizing'), 'catastrophizing-2');
  });

  it('suffixes when colliding with an existing custom entry', () => {
    const custom = [
      { id: 'meta-shame', label: 'Meta-shame', gloss: '' },
      { id: 'meta-shame-2', label: 'Meta-shame', gloss: '' },
    ];
    assert.equal(slugifyDistortionLabel('Meta-shame', custom), 'meta-shame-3');
  });
});
