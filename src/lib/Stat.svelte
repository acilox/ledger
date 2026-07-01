<script lang="ts">
  interface Props {
    label: string;
    value: string;
  }
  let { label, value }: Props = $props();
</script>

<div>
  <p class="text-xs uppercase tracking-widest text-slate-400">{label}</p>
  <p class="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</p>
</div>
