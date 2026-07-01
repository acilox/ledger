<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getSettings, totalEntryCount, updateSettings, type Settings } from '$lib/db';
  import { DISTORTIONS, slugifyDistortionLabel } from '$lib/distortions';
  import { licenseStore } from '$lib/license-cache';
  import { buildEncryptedExport, importEncryptedFile } from '$lib/export';
  import { APP_VERSION, fmtDateTime, PURCHASE_URL } from '$lib/constants';

  let settings = $state<Settings | null>(null);
  let total = $state(0);
  let status = licenseStore.status;

  let licenseKey = $state('');
  let serverUrl = $state('');
  let activating = $state(false);
  let activationError = $state<string | null>(null);

  let exportPass = $state('');
  let exportError = $state<string | null>(null);
  let exporting = $state(false);

  let importFile = $state<File | null>(null);
  let importPass = $state('');
  let importMode = $state<'merge' | 'replace'>('merge');
  let importError = $state<string | null>(null);
  let importMessage = $state<string | null>(null);
  let importing = $state(false);

  // Custom distortions editor.
  let newDistortionLabel = $state('');
  let newDistortionGloss = $state('');
  let distortionError = $state<string | null>(null);
  let savingDistortion = $state(false);

  async function onAddDistortion(): Promise<void> {
    if (!settings || savingDistortion) return;
    const label = newDistortionLabel.trim();
    if (!label) return;
    distortionError = null;
    savingDistortion = true;
    try {
      const existing = settings.customDistortions;
      const id = slugifyDistortionLabel(label, existing);
      if (!id) {
        distortionError = 'That label has no usable characters.';
        return;
      }
      const next = [...existing, { id, label, gloss: newDistortionGloss.trim() }];
      settings = await updateSettings({ customDistortions: next });
      newDistortionLabel = '';
      newDistortionGloss = '';
    } catch (e) {
      distortionError = e instanceof Error ? e.message : 'Could not save.';
    } finally {
      savingDistortion = false;
    }
  }

  async function onDeleteDistortion(id: string): Promise<void> {
    if (!settings) return;
    const next = settings.customDistortions.filter((c) => c.id !== id);
    settings = await updateSettings({ customDistortions: next });
  }

  onMount(async () => {
    settings = await getSettings();
    total = await totalEntryCount();
    serverUrl = $status.serverUrl;
  });

  async function setTherapistAnswer(value: 'yes' | 'no'): Promise<void> {
    settings = await updateSettings({ hasTherapist: value });
  }

  async function onActivate(): Promise<void> {
    if (activating) return;
    activating = true;
    activationError = null;
    try {
      await licenseStore.activate(licenseKey);
    } catch (e) {
      activationError = e instanceof Error ? e.message : 'Activation failed.';
    } finally {
      activating = false;
    }
  }

  function onClearLicense(): void {
    licenseStore.clear();
    licenseKey = '';
  }

  function onSaveServer(): void {
    licenseStore.setServer(serverUrl);
  }

  async function onExport(): Promise<void> {
    exportError = null;
    exporting = true;
    try {
      const blob = await buildEncryptedExport(exportPass, APP_VERSION);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `ledger-export-${stamp}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      exportError = e instanceof Error ? e.message : 'Export failed.';
    } finally {
      exporting = false;
    }
  }

  async function onImport(): Promise<void> {
    if (!importFile) return;
    importError = null;
    importMessage = null;
    importing = true;
    try {
      const result = await importEncryptedFile(importFile, importPass, importMode);
      importMessage = `Imported ${result.thoughtsImported} thought records and ${result.panicsImported} panic captures.`;
      total = await totalEntryCount();
    } catch (e) {
      importError = e instanceof Error ? e.message : 'Import failed.';
    } finally {
      importing = false;
    }
  }

  function onFile(e: Event): void {
    const t = e.target as HTMLInputElement;
    importFile = t.files?.[0] ?? null;
  }
</script>

<div class="space-y-10">
  <header>
    <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>
  </header>

  <section class="card space-y-4">
    <h2 class="text-base font-semibold">Your data</h2>
    <p class="text-sm text-slate-600 dark:text-slate-400">
      {total} {total === 1 ? 'entry' : 'entries'} stored locally in your browser. Ledger has no
      server account and never sends your records anywhere.
    </p>
    <p class="text-xs text-slate-500 dark:text-slate-500">
      Clearing your browser data will delete everything. Use the encrypted backup below to move
      to a new device.
    </p>
  </section>

  {#if settings}
    <section class="card space-y-4">
      <h2 class="text-base font-semibold">Do you have a therapist?</h2>
      <p class="text-sm text-slate-600 dark:text-slate-400">
        Ledger is built to be a notebook you bring to sessions. It is not a substitute for one.
      </p>
      <div class="flex gap-2">
        <button class="btn-secondary" class:font-semibold={settings.hasTherapist === 'yes'} onclick={() => setTherapistAnswer('yes')}>Yes</button>
        <button class="btn-secondary" class:font-semibold={settings.hasTherapist === 'no'} onclick={() => setTherapistAnswer('no')}>Not yet</button>
      </div>
      {#if settings.hasTherapist === 'no'}
        <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
          <p class="text-slate-700 dark:text-slate-300">
            If finding one feels hard, these directories are a calm place to start:
          </p>
          <ul class="mt-2 list-inside list-disc space-y-1 text-slate-600 dark:text-slate-400">
            <li><a class="underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 dark:decoration-slate-700" href="https://www.psychologytoday.com/us/therapists" target="_blank" rel="noopener">Psychology Today directory (US/UK/CA/AU)</a></li>
            <li><a class="underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 dark:decoration-slate-700" href="https://www.openpathcollective.org/" target="_blank" rel="noopener">Open Path Collective (sliding-scale, US)</a></li>
            <li><a class="underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 dark:decoration-slate-700" href="https://www.bacp.co.uk/search/Therapists" target="_blank" rel="noopener">BACP directory (UK)</a></li>
          </ul>
        </div>
      {/if}
    </section>
  {/if}

  {#if settings}
    <section class="card space-y-4">
      <h2 class="text-base font-semibold">Your distortion vocabulary</h2>
      <p class="text-sm text-slate-600 dark:text-slate-400">
        The 10 built-in CBT distortions cover most cases. Add your own
        labels for patterns that feel specific to you — they appear as chips
        in new thought records alongside the built-ins.
      </p>

      <div>
        <h3 class="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Built-in</h3>
        <div class="flex flex-wrap gap-1.5">
          {#each DISTORTIONS as d}
            <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {d.label}
            </span>
          {/each}
        </div>
      </div>

      <div>
        <h3 class="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Your own</h3>
        {#if settings.customDistortions.length === 0}
          <p class="text-sm text-slate-500 dark:text-slate-500">None yet.</p>
        {:else}
          <ul class="space-y-2">
            {#each settings.customDistortions as c}
              <li class="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{c.label}</p>
                  {#if c.gloss}
                    <p class="text-xs text-slate-600 dark:text-slate-400">{c.gloss}</p>
                  {/if}
                  <p class="mt-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-600">{c.id}</p>
                </div>
                <button class="btn-ghost text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400" onclick={() => onDeleteDistortion(c.id)}>Delete</button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <div class="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300">Add a new one</h3>
        <div>
          <label for="distLabel" class="field-label">Label</label>
          <input id="distLabel" type="text" bind:value={newDistortionLabel} class="field-input" placeholder="Meta-shame" maxlength="64" />
        </div>
        <div>
          <label for="distGloss" class="field-label">Short description (optional)</label>
          <input id="distGloss" type="text" bind:value={newDistortionGloss} class="field-input" placeholder="Feeling ashamed about feeling ashamed." maxlength="160" />
        </div>
        <button class="btn-secondary" disabled={savingDistortion || !newDistortionLabel.trim()} onclick={onAddDistortion}>
          {savingDistortion ? 'Adding…' : 'Add distortion'}
        </button>
        {#if distortionError}
          <p class="text-sm text-rose-600 dark:text-rose-400">{distortionError}</p>
        {/if}
      </div>
    </section>
  {/if}

  <section id="pro" class="card space-y-4">
    <h2 class="text-base font-semibold">Pro</h2>

    {#if $status.tier === 'pro'}
      <p class="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        Pro is active. {$status.message}
      </p>
    {:else}
      <p class="text-sm text-slate-600 dark:text-slate-400">
        Pro adds full history, a richer digest with your hardest reframes and panic captures,
        and encrypted backup for moving to a new device. One-time $79, yours forever.
      </p>
      <a href={PURCHASE_URL} class="btn-primary inline-flex w-fit">Get Pro — $79 once</a>
    {/if}

    <div class="space-y-2 pt-2">
      <label for="key" class="field-label">License key</label>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input id="key" type="text" bind:value={licenseKey} class="field-input font-mono" placeholder="lg_…" />
        <button class="btn-primary" disabled={activating || !licenseKey.trim()} onclick={onActivate}>
          {activating ? 'Checking…' : 'Activate'}
        </button>
        {#if $status.tier === 'pro'}
          <button class="btn-ghost" onclick={onClearLicense}>Clear</button>
        {/if}
      </div>
      {#if activationError}
        <p class="text-sm text-rose-600 dark:text-rose-400">{activationError}</p>
      {/if}
      <p class="text-xs text-slate-500 dark:text-slate-500">
        Last checked: {$status.lastChecked ? fmtDateTime($status.lastChecked.getTime()) : 'never'}
      </p>
    </div>

    <details class="text-sm">
      <summary class="cursor-pointer text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
        Self-hosted license server
      </summary>
      <div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <input type="url" bind:value={serverUrl} class="field-input" placeholder="https://…/workers.dev" />
        <button class="btn-secondary" onclick={onSaveServer}>Save</button>
      </div>
      <p class="field-hint">
        Leave the default unless you are running the Acilox license worker locally.
      </p>
    </details>
  </section>

  <section class="card space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold">Encrypted backup</h2>
      {#if $status.tier !== 'pro'}
        <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          Pro
        </span>
      {/if}
    </div>
    <p class="text-sm text-slate-600 dark:text-slate-400">
      Exports a single encrypted JSON file. AES-GCM 256, key derived from a passphrase via
      PBKDF2 (310,000 iterations). If you lose the passphrase the file cannot be recovered.
    </p>

    {#if $status.tier !== 'pro'}
      <p class="text-sm text-slate-500">Available on Pro.</p>
    {:else}
      <div class="space-y-3">
        <div>
          <label for="exportPass" class="field-label">Passphrase (8+ characters)</label>
          <input id="exportPass" type="password" bind:value={exportPass} class="field-input" autocomplete="new-password" />
        </div>
        <button class="btn-secondary" disabled={exporting || exportPass.length < 8} onclick={onExport}>
          {exporting ? 'Building…' : 'Download encrypted backup'}
        </button>
        {#if exportError}
          <p class="text-sm text-rose-600 dark:text-rose-400">{exportError}</p>
        {/if}
      </div>

      <hr class="my-2 border-slate-200 dark:border-slate-800" />

      <div class="space-y-3">
        <h3 class="text-sm font-medium">Restore from backup</h3>
        <input type="file" accept="application/json" onchange={onFile} class="text-sm" />
        <div>
          <label for="importPass" class="field-label">Passphrase</label>
          <input id="importPass" type="password" bind:value={importPass} class="field-input" autocomplete="current-password" />
        </div>
        <div class="flex gap-2 text-sm">
          <label class="inline-flex items-center gap-2"><input type="radio" bind:group={importMode} value="merge" /> Merge</label>
          <label class="inline-flex items-center gap-2"><input type="radio" bind:group={importMode} value="replace" /> Replace</label>
        </div>
        <button class="btn-secondary" disabled={importing || !importFile || !importPass} onclick={onImport}>
          {importing ? 'Restoring…' : 'Restore'}
        </button>
        {#if importError}
          <p class="text-sm text-rose-600 dark:text-rose-400">{importError}</p>
        {/if}
        {#if importMessage}
          <p class="text-sm text-emerald-700 dark:text-emerald-300">{importMessage}</p>
        {/if}
      </div>
    {/if}
  </section>

  <section class="card space-y-2 text-xs text-slate-500 dark:text-slate-500">
    <p>Ledger {APP_VERSION} · <a class="underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 dark:decoration-slate-700" href="https://acilox.com/labs/ledger">acilox.com/labs/ledger</a></p>
    <p>Not a medical device. Not a substitute for professional care.</p>
    <button class="btn-ghost mt-2 px-0 text-xs" onclick={() => goto('/welcome')}>Re-open the welcome page</button>
  </section>
</div>
