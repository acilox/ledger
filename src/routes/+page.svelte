<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { listRecentEntries, totalEntryCount, type Entry } from '$lib/db';
  import { dayLabel, fmtTime, fmtRelative } from '$lib/constants';
  import { distortionById } from '$lib/distortions';
  import { licenseStore } from '$lib/license-cache';

  let entries = $state<Entry[]>([]);
  let total = $state(0);
  let loaded = $state(false);

  let limit = $derived(licenseStore.isPro() ? 100 : 30);

  async function reload(): Promise<void> {
    entries = await listRecentEntries(limit);
    total = await totalEntryCount();
    loaded = true;
  }

  onMount(reload);

  function groupByDay(rows: Entry[]): { day: string; items: Entry[] }[] {
    const out: { day: string; items: Entry[] }[] = [];
    for (const e of rows) {
      const d = dayLabel(e.createdAtMs);
      const last = out[out.length - 1];
      if (last && last.day === d) {
        last.items.push(e);
      } else {
        out.push({ day: d, items: [e] });
      }
    }
    return out;
  }

  let grouped = $derived(groupByDay(entries));
  let hiddenCount = $derived(total - entries.length);
</script>

<div class="space-y-8">
  <section class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Your records</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {#if total === 0}
          Start with a thought record or a panic capture.
        {:else}
          {total} {total === 1 ? 'entry' : 'entries'} on this device.
        {/if}
      </p>
    </div>
    <div class="flex gap-2">
      <button class="btn-panic" onclick={() => goto('/panic')}>
        Panic capture
      </button>
      <button class="btn-primary" onclick={() => goto('/new')}>New record</button>
    </div>
  </section>

  {#if !loaded}
    <p class="text-sm text-slate-400">Loading…</p>
  {:else if entries.length === 0}
    <div class="card text-center">
      <p class="text-slate-700 dark:text-slate-300">Nothing here yet.</p>
      <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
        A thought record walks an anxious thought through five steps. Panic capture is for the
        moments when there is no time for five.
      </p>
    </div>
  {:else}
    <ol class="space-y-8">
      {#each grouped as group}
        <li>
          <h2 class="mb-3 text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {group.day}
          </h2>
          <ul class="space-y-2">
            {#each group.items as e (e.kind + e.id)}
              <li>
                {#if e.kind === 'thought'}
                  <a href={`/entry/thought-${e.id}`} class="card block transition hover:border-slate-300 dark:hover:border-slate-700">
                    <div class="flex items-baseline justify-between gap-3">
                      <span class="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Thought record
                      </span>
                      <span class="text-xs text-slate-400">{fmtTime(e.createdAtMs)}</span>
                    </div>
                    <p class="mt-1 line-clamp-2 font-medium text-slate-900 dark:text-slate-100">
                      {e.situation || '(no situation noted)'}
                    </p>
                    {#if e.automaticThought}
                      <p class="mt-1 line-clamp-2 text-sm italic text-slate-600 dark:text-slate-400">
                        "{e.automaticThought}"
                      </p>
                    {/if}
                    {#if e.distortions.length > 0}
                      <div class="mt-3 flex flex-wrap gap-1.5">
                        {#each e.distortions as id}
                          {@const d = distortionById(id)}
                          {#if d}
                            <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {d.label}
                            </span>
                          {/if}
                        {/each}
                      </div>
                    {/if}
                    {#if e.intensityAfter !== null}
                      <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Intensity {e.intensityBefore} → {e.intensityAfter}
                      </p>
                    {/if}
                  </a>
                {:else}
                  <a href={`/entry/panic-${e.id}`} class="card block border-l-4 border-l-rose-500 transition hover:border-slate-300 dark:hover:border-slate-700">
                    <div class="flex items-baseline justify-between gap-3">
                      <span class="text-xs font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        Panic capture
                      </span>
                      <span class="text-xs text-slate-400">{fmtTime(e.createdAtMs)}</span>
                    </div>
                    <p class="mt-1 font-medium text-slate-900 dark:text-slate-100">
                      {e.situation || '(no situation)'}
                    </p>
                    {#if e.note}
                      <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">{e.note}</p>
                    {/if}
                    <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Intensity {e.intensity}/10 · {fmtRelative(e.createdAtMs)}
                    </p>
                  </a>
                {/if}
              </li>
            {/each}
          </ul>
        </li>
      {/each}
    </ol>

    {#if hiddenCount > 0}
      <div class="card border-dashed bg-slate-50/50 text-center dark:bg-slate-900/50">
        <p class="text-sm text-slate-600 dark:text-slate-400">
          {hiddenCount} older {hiddenCount === 1 ? 'entry is' : 'entries are'} hidden on the free
          tier.
        </p>
        <p class="mt-2 text-xs text-slate-500">
          They are still on this device. Pro shows your full history.
        </p>
        <a href="/settings#pro" class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 dark:text-slate-100 dark:decoration-slate-700 dark:hover:decoration-slate-100">
          See Pro
        </a>
      </div>
    {/if}
  {/if}
</div>
