<script lang="ts">
  interface Props {
    label: string;
    value: string;
    italic?: boolean;
    mono?: boolean;
  }
  let { label, value, italic = false, mono = false }: Props = $props();
</script>

<div>
  <p class="field-label">{label}</p>
  <p
    class="whitespace-pre-wrap text-base leading-relaxed text-slate-900 dark:text-slate-100"
    class:italic
    class:font-mono={mono}
    class:tabular-nums={mono}
  >
    {value || '—'}
  </p>
</div>
