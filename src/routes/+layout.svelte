<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getSettings } from '$lib/db';
  import { licenseStore } from '$lib/license-cache';

  let { children } = $props();

  onMount(async () => {
    licenseStore.hydrate();
    const settings = await getSettings();
    if (!settings.hasSeenWelcome && $page.url.pathname !== '/welcome') {
      void goto('/welcome', { replaceState: true });
    }
  });

  let status = $state(licenseStore.status);
  let path = $derived($page.url.pathname);
  let hideChrome = $derived(path === '/welcome' || path === '/panic');
</script>

{#if !hideChrome}
  <header class="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 no-print">
    <div class="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
      <a href="/" class="flex items-center gap-2 text-base font-semibold tracking-tight">
        <span class="inline-block h-2.5 w-2.5 rounded-full bg-slate-900 dark:bg-slate-100"></span>
        Ledger
      </a>
      <nav class="flex items-center gap-1 text-sm">
        <a href="/new" class="btn-ghost" class:font-semibold={path === '/new'}>New record</a>
        <a href="/digest" class="btn-ghost" class:font-semibold={path === '/digest'}>Digest</a>
        <a href="/settings" class="btn-ghost" class:font-semibold={path === '/settings'}>Settings</a>
      </nav>
    </div>
  </header>
{/if}

<main class="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
  {@render children()}
</main>

{#if !hideChrome}
  <footer class="mx-auto max-w-3xl px-4 pb-10 pt-6 text-center text-xs text-slate-400 dark:text-slate-600 no-print">
    Ledger is not a medical device and does not provide advice. If you are in crisis, please
    contact your local emergency services or a crisis line.
  </footer>
{/if}
