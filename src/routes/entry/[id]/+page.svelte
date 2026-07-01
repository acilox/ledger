<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import {
    deletePanic,
    deleteThought,
    getPanic,
    getSettings,
    getThought,
    type PanicEntry,
    type ThoughtRecord,
  } from '$lib/db';
  import { resolveDistortion } from '$lib/distortions';
  import { fmtDateTime } from '$lib/constants';
  import Field from '$lib/Field.svelte';

  let entry = $state<ThoughtRecord | PanicEntry | null>(null);
  let notFound = $state(false);
  let confirmDelete = $state(false);
  let customDistortions = $state<{ id: string; label: string; gloss: string }[]>([]);

  async function load(): Promise<void> {
    const token = $page.params.id;
    const m = /^(thought|panic)-(\d+)$/.exec(token);
    if (!m) { notFound = true; return; }
    const kind = m[1];
    const id = Number(m[2]);
    const [settings, found] = await Promise.all([
      getSettings(),
      kind === 'thought' ? getThought(id) : getPanic(id),
    ]);
    customDistortions = settings.customDistortions;
    if (!found) { notFound = true; return; }
    entry = found;
  }

  onMount(load);

  async function onDelete(): Promise<void> {
    if (!entry) return;
    if (entry.kind === 'thought') await deleteThought(entry.id!);
    else await deletePanic(entry.id!);
    await goto('/');
  }
</script>

{#if notFound}
  <p class="text-sm text-slate-500">No record at this address.</p>
  <a href="/" class="btn-ghost mt-3">Back</a>
{:else if !entry}
  <p class="text-sm text-slate-400">Loading…</p>
{:else if entry.kind === 'thought'}
  <article class="space-y-6">
    <header class="flex items-baseline justify-between gap-3">
      <div>
        <p class="text-xs font-medium uppercase tracking-widest text-slate-400">
          Thought record
        </p>
        <h1 class="mt-1 text-xl font-semibold tracking-tight">
          {fmtDateTime(entry.createdAtMs)}
        </h1>
      </div>
      <div class="flex gap-2 no-print">
        <a href="/digest" class="btn-ghost">Digest</a>
      </div>
    </header>

    <section class="card space-y-4">
      <Field label="Situation" value={entry.situation} />
      <Field label="Automatic thought" value={entry.automaticThought} italic />
      <div class="grid grid-cols-2 gap-4">
        <Field label="Emotion" value={entry.emotion || '—'} />
        <Field label="Intensity before" value={String(entry.intensityBefore) + ' / 10'} mono />
      </div>

      {#if entry.distortions.length > 0}
        <div>
          <p class="field-label">Distortions</p>
          <div class="flex flex-wrap gap-2">
            {#each entry.distortions as id}
              {@const d = resolveDistortion(id, customDistortions)}
              {#if d}
                <span class="chip chip-selected" title={d.gloss}>{d.label}</span>
              {:else}
                <span class="chip" title="Unknown distortion (deleted from your vocabulary)">{id}</span>
              {/if}
            {/each}
          </div>
        </div>
      {/if}

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Evidence for" value={entry.evidenceFor || '—'} />
        <Field label="Evidence against" value={entry.evidenceAgainst || '—'} />
      </div>

      <Field label="Balanced thought" value={entry.balancedThought || '—'} />

      {#if entry.intensityAfter !== null}
        <Field label="Intensity after" value={String(entry.intensityAfter) + ' / 10'} mono />
      {/if}
    </section>

    <div class="flex justify-between gap-3 no-print">
      <a href="/" class="btn-ghost">Back</a>
      <div class="flex gap-2">
        {#if confirmDelete}
          <button class="btn-ghost text-rose-600 dark:text-rose-400" onclick={onDelete}>
            Really delete?
          </button>
          <button class="btn-ghost" onclick={() => (confirmDelete = false)}>Keep</button>
        {:else}
          <button class="btn-ghost" onclick={() => (confirmDelete = true)}>Delete</button>
          <button class="btn-secondary" onclick={() => window.print()}>Print / PDF</button>
        {/if}
      </div>
    </div>
  </article>
{:else}
  <article class="space-y-6">
    <header>
      <p class="text-xs font-medium uppercase tracking-widest text-rose-600 dark:text-rose-400">
        Panic capture
      </p>
      <h1 class="mt-1 text-xl font-semibold tracking-tight">
        {fmtDateTime(entry.createdAtMs)}
      </h1>
    </header>

    <section class="card space-y-4 border-l-4 border-l-rose-500">
      <Field label="Situation" value={entry.situation} />
      <Field label="Intensity" value={String(entry.intensity) + ' / 10'} mono />
      {#if entry.note}
        <Field label="Note" value={entry.note} />
      {/if}
    </section>

    <div class="flex justify-between gap-3 no-print">
      <a href="/" class="btn-ghost">Back</a>
      {#if confirmDelete}
        <div class="flex gap-2">
          <button class="btn-ghost text-rose-600 dark:text-rose-400" onclick={onDelete}>
            Really delete?
          </button>
          <button class="btn-ghost" onclick={() => (confirmDelete = false)}>Keep</button>
        </div>
      {:else}
        <button class="btn-ghost" onclick={() => (confirmDelete = true)}>Delete</button>
      {/if}
    </div>
  </article>
{/if}
