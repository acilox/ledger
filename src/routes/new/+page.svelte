<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { DISTORTIONS, type Distortion } from '$lib/distortions';
  import { getSettings, saveThought } from '$lib/db';

  // Form state
  let situation = $state('');
  let automaticThought = $state('');
  let emotion = $state('');
  let intensityBefore = $state(5);
  let selectedDistortions = $state<string[]>([]);
  let evidenceFor = $state('');
  let evidenceAgainst = $state('');
  let balancedThought = $state('');
  let intensityAfter = $state<number | null>(null);

  let saving = $state(false);
  let error = $state<string | null>(null);

  // Built-in + user-defined distortions. Custom entries get an empty `ask`
  // since we never asked the user for one — the chip just shows the gloss.
  let customDistortions = $state<{ id: string; label: string; gloss: string }[]>([]);
  let allDistortions = $derived<Distortion[]>([
    ...DISTORTIONS,
    ...customDistortions.map((c) => ({ id: c.id, label: c.label, gloss: c.gloss, ask: '' })),
  ]);

  // Distortion gloss + ask peek
  let hoveredDistortion = $state<string | null>(null);
  let hoverData = $derived(
    hoveredDistortion ? allDistortions.find((d) => d.id === hoveredDistortion) ?? null : null,
  );

  function toggleDistortion(id: string): void {
    if (selectedDistortions.includes(id)) {
      selectedDistortions = selectedDistortions.filter((x) => x !== id);
    } else {
      selectedDistortions = [...selectedDistortions, id];
    }
  }

  let canSave = $derived(
    situation.trim().length > 0 || automaticThought.trim().length > 0,
  );

  async function onSave(): Promise<void> {
    if (!canSave || saving) return;
    saving = true;
    error = null;
    try {
      const id = await saveThought({
        createdAtMs: Date.now(),
        situation: situation.trim(),
        automaticThought: automaticThought.trim(),
        emotion: emotion.trim(),
        intensityBefore: Number(intensityBefore),
        distortions: selectedDistortions,
        evidenceFor: evidenceFor.trim(),
        evidenceAgainst: evidenceAgainst.trim(),
        balancedThought: balancedThought.trim(),
        intensityAfter: intensityAfter === null ? null : Number(intensityAfter),
      });
      await goto(`/entry/thought-${id}`);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not save.';
      saving = false;
    }
  }

  onMount(async () => {
    const settings = await getSettings();
    customDistortions = settings.customDistortions;
    // Focus the first field on load — friction reduction.
    const el = document.getElementById('situation');
    el?.focus();
  });
</script>

<div class="space-y-8">
  <header>
    <h1 class="text-2xl font-semibold tracking-tight">New thought record</h1>
    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
      Go in order. You can leave anything blank and finish later.
    </p>
  </header>

  <section>
    <label for="situation" class="field-label">1. Situation</label>
    <textarea
      id="situation"
      bind:value={situation}
      class="field-textarea"
      placeholder="What happened? Where were you, and who was there?"
    ></textarea>
  </section>

  <section>
    <label for="automatic" class="field-label">2. Automatic thought</label>
    <textarea
      id="automatic"
      bind:value={automaticThought}
      class="field-textarea"
      placeholder="What ran through your head, word for word?"
    ></textarea>
    <p class="field-hint">
      The first sentence that surfaced. Not what you think you "should" have thought.
    </p>
  </section>

  <section>
    <label for="emotion" class="field-label">3. Emotion · intensity now</label>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
      <input
        id="emotion"
        type="text"
        bind:value={emotion}
        class="field-input"
        placeholder="One word: anxious, ashamed, angry, flat…"
      />
      <div class="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          bind:value={intensityBefore}
          class="w-40 accent-slate-900 dark:accent-slate-100"
          aria-label="Intensity before reframing"
        />
        <span class="w-8 text-right font-mono text-lg tabular-nums">{intensityBefore}</span>
      </div>
    </div>
  </section>

  <section>
    <p class="field-label">4. Distortions you can spot in the thought</p>
    <p class="field-hint mb-3 mt-0">
      Tap one or several. Hover for the question to ask yourself.
    </p>
    <div class="flex flex-wrap gap-2">
      {#each allDistortions as d}
        <button
          type="button"
          class="chip"
          class:chip-selected={selectedDistortions.includes(d.id)}
          onclick={() => toggleDistortion(d.id)}
          onmouseenter={() => (hoveredDistortion = d.id)}
          onmouseleave={() => (hoveredDistortion = null)}
          onfocus={() => (hoveredDistortion = d.id)}
          onblur={() => (hoveredDistortion = null)}
        >
          {d.label}
        </button>
      {/each}
    </div>
    {#if hoverData}
      <div class="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
        {#if hoverData.gloss}
          <p class="text-slate-700 dark:text-slate-300">{hoverData.gloss}</p>
        {/if}
        {#if hoverData.ask}
          <p class="mt-1 text-slate-500 dark:text-slate-400">
            <em>Ask yourself:</em> {hoverData.ask}
          </p>
        {/if}
      </div>
    {/if}
  </section>

  <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div>
      <label for="for" class="field-label">5a. Evidence that supports the thought</label>
      <textarea id="for" bind:value={evidenceFor} class="field-textarea" placeholder="Facts only."></textarea>
    </div>
    <div>
      <label for="against" class="field-label">5b. Evidence against it</label>
      <textarea id="against" bind:value={evidenceAgainst} class="field-textarea" placeholder="Things you might be skipping."></textarea>
    </div>
  </section>

  <section>
    <label for="balanced" class="field-label">6. A more balanced thought</label>
    <textarea
      id="balanced"
      bind:value={balancedThought}
      class="field-textarea"
      placeholder="Not the opposite of the thought. Something you could actually believe."
    ></textarea>
  </section>

  <section>
    <label for="after" class="field-label">7. Intensity now (optional)</label>
    <div class="flex items-center gap-3">
      <input
        id="after"
        type="range"
        min="0"
        max="10"
        step="1"
        value={intensityAfter ?? 5}
        oninput={(e) => (intensityAfter = Number((e.target as HTMLInputElement).value))}
        class="w-40 accent-slate-900 dark:accent-slate-100"
        aria-label="Intensity after reframing"
      />
      <span class="w-8 text-right font-mono text-lg tabular-nums">{intensityAfter ?? '—'}</span>
      <button type="button" class="btn-ghost" onclick={() => (intensityAfter = null)}>
        Skip
      </button>
    </div>
  </section>

  {#if error}
    <p class="text-sm text-rose-600 dark:text-rose-400">{error}</p>
  {/if}

  <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
    <a href="/" class="btn-ghost">Cancel</a>
    <button class="btn-primary" disabled={!canSave || saving} onclick={onSave}>
      {saving ? 'Saving…' : 'Save record'}
    </button>
  </div>
</div>
