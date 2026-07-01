<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { getSettings, updateSettings } from '$lib/db';

  let step = $state(0);
  let hasTherapist = $state<'yes' | 'no' | null>(null);

  async function next(): Promise<void> {
    if (step < 2) {
      step += 1;
      return;
    }
    await updateSettings({
      hasSeenWelcome: true,
      hasTherapist: hasTherapist ?? 'unanswered',
    });
    await goto('/');
  }

  onMount(async () => {
    const s = await getSettings();
    if (s.hasSeenWelcome) {
      // Re-entry; pre-load the prior answer.
      hasTherapist = s.hasTherapist === 'yes' ? 'yes' : s.hasTherapist === 'no' ? 'no' : null;
    }
  });
</script>

<div class="mx-auto flex min-h-[80vh] max-w-xl flex-col justify-center gap-8 py-10">
  <header class="text-center">
    <span class="inline-block h-3 w-3 rounded-full bg-slate-900 dark:bg-slate-100"></span>
    <h1 class="mt-4 text-3xl font-semibold tracking-tight">Welcome to Ledger</h1>
  </header>

  {#if step === 0}
    <article class="space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
      <p>
        Ledger is a calm place to write down an anxious thought and walk it through. It uses a
        format from cognitive behavioural therapy called a <em>thought record</em>: situation,
        thought, emotion, distortions, evidence, balanced thought.
      </p>
      <p>
        There are no accounts. Everything you write stays on this device, in this browser. You
        can install it to your home screen so it opens in one tap.
      </p>
      <p>
        Ledger does not give you advice. It does not have an AI that tells you what to do.
        That is on purpose.
      </p>
    </article>
  {:else if step === 1}
    <article class="space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
      <p class="font-medium">A small question, no wrong answer.</p>
      <p>
        Are you working with a therapist or counsellor right now? Ledger is designed to be a
        notebook you bring to sessions. It works best when there is someone on the other end
        of what you write down.
      </p>
      <div class="flex gap-2 pt-2">
        <button
          class="btn-secondary"
          class:font-semibold={hasTherapist === 'yes'}
          onclick={() => (hasTherapist = 'yes')}
        >Yes, I do</button>
        <button
          class="btn-secondary"
          class:font-semibold={hasTherapist === 'no'}
          onclick={() => (hasTherapist = 'no')}
        >Not right now</button>
      </div>
      {#if hasTherapist === 'no'}
        <div class="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
          <p>That is okay. When you are ready, you can find one through:</p>
          <ul class="mt-2 list-inside list-disc space-y-1 text-slate-600 dark:text-slate-400">
            <li><a class="underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 dark:decoration-slate-700" href="https://www.psychologytoday.com/us/therapists" target="_blank" rel="noopener">Psychology Today</a> (US/UK/CA/AU)</li>
            <li><a class="underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 dark:decoration-slate-700" href="https://www.openpathcollective.org/" target="_blank" rel="noopener">Open Path Collective</a> (sliding scale, US)</li>
            <li><a class="underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 dark:decoration-slate-700" href="https://www.bacp.co.uk/search/Therapists" target="_blank" rel="noopener">BACP</a> (UK)</li>
          </ul>
          <p class="mt-2 text-xs text-slate-500">You can keep using Ledger in the meantime — just notice that it is your own notebook, not a clinician.</p>
        </div>
      {/if}
    </article>
  {:else}
    <article class="space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
      <p>Two ways to use it:</p>
      <ul class="space-y-3">
        <li class="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <p class="font-medium">A full thought record</p>
          <p class="text-sm text-slate-600 dark:text-slate-400">When you have a few minutes and a thought you want to look at carefully.</p>
        </li>
        <li class="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <p class="font-medium">A panic capture</p>
          <p class="text-sm text-slate-600 dark:text-slate-400">When there is no time for five steps. One sentence and an intensity score, under 30 seconds.</p>
        </li>
      </ul>
      <p class="text-sm text-slate-500 dark:text-slate-500">
        On Sunday-ish, open the weekly digest. Print it. Bring it to your next session.
      </p>
      <p class="text-xs text-slate-500 dark:text-slate-500">
        If you are in crisis, please contact your local emergency services or a crisis line.
        Ledger is a notebook, not an emergency contact.
      </p>
    </article>
  {/if}

  <div class="flex items-center justify-between gap-3 pt-2">
    <p class="text-xs text-slate-400">Step {step + 1} of 3</p>
    <button class="btn-primary" onclick={next}>
      {step < 2 ? 'Continue' : 'Get started'}
    </button>
  </div>
</div>
