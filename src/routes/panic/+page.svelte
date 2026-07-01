<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { savePanic } from '$lib/db';

  let situation = $state('');
  let intensity = $state(7);
  let note = $state('');
  let saving = $state(false);

  async function onSave(): Promise<void> {
    if (saving) return;
    saving = true;
    try {
      await savePanic({
        createdAtMs: Date.now(),
        situation: situation.trim() || '(unspecified)',
        intensity: Number(intensity),
        note: note.trim(),
      });
      await goto('/');
    } catch {
      saving = false;
    }
  }

  onMount(async () => {
    await tick();
    const el = document.getElementById('panic-situation');
    el?.focus();
  });

  function onKeydown(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onSave();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="flex min-h-[80vh] flex-col gap-6 pt-4">
  <header class="text-center">
    <p class="text-xs font-medium uppercase tracking-widest text-rose-600 dark:text-rose-400">
      Panic capture
    </p>
    <h1 class="mt-1 text-2xl font-semibold tracking-tight">Breathe. Type one line.</h1>
    <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
      You can come back later and turn this into a full record.
    </p>
  </header>

  <section>
    <label for="panic-situation" class="sr-only">What is happening</label>
    <textarea
      id="panic-situation"
      bind:value={situation}
      class="field-textarea text-lg"
      rows="3"
      placeholder="What is happening right now?"
    ></textarea>
  </section>

  <section>
    <p class="field-label text-center">How intense, 0–10</p>
    <div class="flex items-center justify-center gap-4">
      <input
        type="range"
        min="0"
        max="10"
        step="1"
        bind:value={intensity}
        class="w-full max-w-xs accent-rose-600"
        aria-label="Intensity"
      />
      <span class="w-10 text-center font-mono text-2xl tabular-nums">{intensity}</span>
    </div>
  </section>

  <section>
    <label for="panic-note" class="field-label">Anything you want to add (optional)</label>
    <input id="panic-note" type="text" bind:value={note} class="field-input" placeholder="One line is enough." />
  </section>

  <div class="mt-auto grid grid-cols-1 gap-3 pt-6 sm:grid-cols-[auto_1fr]">
    <a href="/" class="btn-secondary w-full">Cancel</a>
    <button class="btn-panic w-full text-lg" disabled={saving} onclick={onSave}>
      {saving ? 'Saving…' : 'Save panic capture'}
    </button>
  </div>

  <p class="text-center text-xs text-slate-400">
    ⌘/Ctrl + Enter to save fast.
  </p>
</div>
