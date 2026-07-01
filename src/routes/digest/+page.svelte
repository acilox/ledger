<script lang="ts">
  import { onMount } from 'svelte';
  import {
    buildDigest,
    calendarWeekRange,
    thisWeekRange,
    type Digest,
    type DigestRange,
  } from '$lib/digest';
  import { listEntriesSince, getSettings, updateSettings } from '$lib/db';
  import { licenseStore } from '$lib/license-cache';
  import { fmtDate, fmtDateTime, PURCHASE_URL } from '$lib/constants';
  import { distortionById } from '$lib/distortions';
  import Stat from '$lib/Stat.svelte';

  let isPro = $state(false);
  let mode = $state<'7d' | 'cal'>('7d');
  let digest = $state<Digest | null>(null);
  let loading = $state(true);

  async function recompute(): Promise<void> {
    loading = true;
    const now = Date.now();
    const range: DigestRange = mode === '7d' ? thisWeekRange(now) : calendarWeekRange(now);
    // We always pull 14 days back so the cal range and 7d range both fit.
    const since = Math.min(range.startMs, now - 14 * 86400_000);
    const entries = await listEntriesSince(since);
    const settings = await getSettings();
    digest = buildDigest(entries, range, settings.customDistortions);
    await updateSettings({ lastDigestViewedMs: now });
    loading = false;
  }

  onMount(async () => {
    isPro = licenseStore.isPro();
    await recompute();
  });

  $effect(() => {
    if (mode) void recompute();
  });

  function pct(top: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((top / total) * 100);
  }
</script>

<div class="space-y-6">
  <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Weekly digest</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        A one-page summary you can print and bring to your next session.
      </p>
    </div>
    <div class="flex gap-2">
      <button class="btn-ghost" class:font-semibold={mode === '7d'} onclick={() => (mode = '7d')}>Last 7 days</button>
      <button class="btn-ghost" class:font-semibold={mode === 'cal'} onclick={() => (mode = 'cal')}>This week</button>
      <button class="btn-secondary" onclick={() => window.print()}>Print / PDF</button>
    </div>
  </header>

  {#if loading}
    <p class="text-sm text-slate-400">Building…</p>
  {:else if !digest}
    <p class="text-sm text-slate-500">No digest available.</p>
  {:else if digest.isEmpty}
    <div class="card text-center">
      <p class="text-slate-700 dark:text-slate-300">Nothing yet for this window.</p>
      <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Add a thought record or a panic capture and come back here.
      </p>
    </div>
  {:else}
    <article class="card space-y-8 print:border-0 print:shadow-none">
      <section class="border-b border-slate-200 pb-4 dark:border-slate-800">
        <p class="text-xs uppercase tracking-widest text-slate-400">Window</p>
        <p class="mt-1 text-base">{digest.range.label}</p>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          {fmtDate(digest.range.startMs)} → {fmtDate(digest.range.endMs)} · generated {fmtDateTime(Date.now())}
        </p>
      </section>

      <section>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Thought records" value={String(digest.thoughtCount)} />
          <Stat label="Panic captures" value={String(digest.panicCount)} />
          <Stat
            label="Avg intensity before"
            value={digest.averageIntensityBefore === null ? '—' : digest.averageIntensityBefore.toFixed(1)}
          />
          <Stat
            label="Avg drop after reframe"
            value={digest.averageDelta === null ? '—' : digest.averageDelta.toFixed(1)}
          />
        </div>
      </section>

      <section>
        <h2 class="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Distortions that kept showing up
        </h2>
        {#if digest.distortions.length === 0}
          <p class="text-sm text-slate-500">None recorded in this window.</p>
        {:else}
          <ul class="space-y-2">
            {#each digest.distortions as d}
              {@const cat = distortionById(d.id)}
              <li class="flex items-baseline justify-between gap-3">
                <div>
                  <p class="font-medium">{d.label}</p>
                  {#if cat}
                    <p class="text-xs text-slate-500 dark:text-slate-400">{cat.gloss}</p>
                  {/if}
                </div>
                <span class="font-mono text-sm tabular-nums text-slate-500 dark:text-slate-400">
                  {d.count}× · {pct(d.count, digest.thoughtCount)}%
                </span>
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      {#if !isPro}
        <section class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/60 no-print">
          <p class="font-medium">Free digest preview</p>
          <p class="mt-1 text-slate-600 dark:text-slate-400">
            Pro adds the highlight sections below — your hardest reframes and the panic captures
            that scored highest. These are the parts a therapist actually scans first.
          </p>
          <a href={PURCHASE_URL} class="mt-2 inline-block text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 dark:text-slate-100 dark:decoration-slate-700">
            See Pro
          </a>
        </section>
      {:else}
        {#if digest.topReframes.length > 0}
          <section>
            <h2 class="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Reframes that landed
            </h2>
            <ul class="space-y-4">
              {#each digest.topReframes as r}
                <li class="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                  <p class="text-xs text-slate-400">{fmtDate(r.createdAtMs)}</p>
                  <p class="mt-1 italic text-slate-600 dark:text-slate-400">"{r.automaticThought}"</p>
                  <p class="mt-1">→ {r.balancedThought}</p>
                  <p class="mt-1 font-mono text-xs tabular-nums text-slate-500">
                    {r.intensityBefore} → {r.intensityAfter} · drop of {r.delta}
                  </p>
                </li>
              {/each}
            </ul>
          </section>
        {/if}
        {#if digest.hardestPanics.length > 0}
          <section>
            <h2 class="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Hardest panic captures
            </h2>
            <ul class="space-y-3">
              {#each digest.hardestPanics as p}
                <li class="border-l-4 border-rose-500 pl-3 text-sm">
                  <p class="text-xs text-slate-400">{fmtDateTime(p.createdAtMs)} · {p.intensity}/10</p>
                  <p class="mt-1">{p.situation}</p>
                  {#if p.note}
                    <p class="text-slate-500 dark:text-slate-400">{p.note}</p>
                  {/if}
                </li>
              {/each}
            </ul>
          </section>
        {/if}
      {/if}
    </article>
  {/if}
</div>
