// The 10 cognitive distortions used in standard CBT thought records
// (Burns / Beck lineage). Glosses are deliberately gentle — the chip set is
// for self-recognition, not diagnosis. The "ask" line is what to ask
// yourself when you suspect this distortion.

export interface Distortion {
  id: string;
  label: string;
  gloss: string;
  ask: string;
}

export const DISTORTIONS: Distortion[] = [
  {
    id: 'all-or-nothing',
    label: 'All-or-nothing',
    gloss: 'Things are either perfect or a total failure — no grey.',
    ask: 'What would I see if I allowed for shades in between?',
  },
  {
    id: 'catastrophizing',
    label: 'Catastrophizing',
    gloss: 'Jumping to the worst case as if it has already happened.',
    ask: "If the worst did happen, what would I actually do next?",
  },
  {
    id: 'mind-reading',
    label: 'Mind reading',
    gloss: "Assuming I know what someone else is thinking without being told.",
    ask: 'What else could explain what I noticed?',
  },
  {
    id: 'fortune-telling',
    label: 'Fortune telling',
    gloss: 'Predicting the future negatively as if it were already certain.',
    ask: 'How many times has this exact prediction been wrong before?',
  },
  {
    id: 'emotional-reasoning',
    label: 'Emotional reasoning',
    gloss: "Treating a feeling as proof: 'I feel it, so it must be true.'",
    ask: 'What is the evidence, separate from how I feel right now?',
  },
  {
    id: 'should-statements',
    label: 'Should statements',
    gloss: "Hard 'should' / 'must' / 'have to' rules — usually borrowed.",
    ask: "If a friend lived by this rule, would I tell them it is fair?",
  },
  {
    id: 'labeling',
    label: 'Labeling',
    gloss: "Naming yourself or someone with one harsh word ('I'm stupid').",
    ask: 'Is this a description of a single moment, or a verdict on a person?',
  },
  {
    id: 'personalization',
    label: 'Personalization',
    gloss: 'Taking blame for something that has many causes outside me.',
    ask: 'Which parts of this were genuinely my responsibility?',
  },
  {
    id: 'mental-filter',
    label: 'Mental filter',
    gloss: 'Zooming in on the one bad detail and missing everything else.',
    ask: 'What is the rest of the picture, even the boring parts?',
  },
  {
    id: 'disqualifying-positive',
    label: 'Disqualifying the positive',
    gloss: "Dismissing good things ('they were just being polite').",
    ask: 'What if I let myself believe the good thing was simply real?',
  },
];

export function distortionById(id: string): Distortion | undefined {
  return DISTORTIONS.find((d) => d.id === id);
}

/** Resolve a distortion id against the catalog OR a user-defined list. */
export function resolveDistortion(
  id: string,
  customDistortions: { id: string; label: string; gloss: string }[] = [],
): { id: string; label: string; gloss: string } | undefined {
  return distortionById(id) ?? customDistortions.find((c) => c.id === id);
}

/**
 * Turn a free-form distortion label into a stable kebab-case id, avoiding
 * collisions with the built-in catalog and any already-defined custom
 * entries. Returns an empty string for an empty / punctuation-only label.
 */
export function slugifyDistortionLabel(
  label: string,
  customDistortions: { id: string }[] = [],
): string {
  const base = label
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!base) return '';
  const taken = new Set<string>([
    ...DISTORTIONS.map((d) => d.id),
    ...customDistortions.map((c) => c.id),
  ]);
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
