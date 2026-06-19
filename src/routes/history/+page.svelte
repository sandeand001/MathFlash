<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { activeProfile } from '$lib/stores/appState.js';

  let profile = $derived($activeProfile);

  function decodeKey(key) {
    const [opsStr, max, dur] = key.split('|');
    const ops = [...opsStr];
    return { ops, max: Number(max), duration: Number(dur) };
  }

  function opClass(op) {
    return { '+': 'add', '-': 'sub', '×': 'mul', '÷': 'div' }[op] || 'add';
  }

  let entries = $derived.by(() => {
    if (!profile) return [];
    return Object.entries(profile.bests)
      .map(([key, best]) => ({ key, best, ...decodeKey(key) }))
      .sort((a, b) => b.best.achievedAt - a.best.achievedAt);
  });
</script>

{#if profile}
  <div class="history">
    <header class="topbar">
      <button class="back" onclick={() => goto(`${base}/`)} aria-label="Back">‹</button>
      <h1>🏆 Best Scores</h1>
      <span class="profile-mini" style="background:{profile.color}">{profile.emoji}</span>
    </header>

    <main class="list">
      {#if entries.length === 0}
        <div class="empty">No scores yet.<br/>Play a drill to set your first best!</div>
      {:else}
        {#each entries as e}
          <div class="row">
            <div class="row-top">
              <div class="ops">
                {#each e.ops as op}
                  <span class="op op-{opClass(op)}">{op}</span>
                {/each}
              </div>
              <div class="config">to {e.max} · {e.duration}s</div>
            </div>
            <div class="score">{e.best.correct}</div>
          </div>
        {/each}
      {/if}
    </main>
  </div>
{/if}

<style>
  .history { display: flex; flex-direction: column; height: 100%; padding: 12px 16px 16px; }
  .topbar { display: flex; align-items: center; gap: 12px; padding-bottom: 8px; }
  .back { width: 40px; height: 40px; border-radius: 12px; background: var(--surface); border: 2px solid var(--line); font-size: 26px; line-height: 1; font-weight: 700; }
  h1 { font-size: 22px; margin: 0; flex: 1; }
  .profile-mini { width: 36px; height: 36px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; }
  .list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-top: 8px; }
  .empty { color: var(--ink-soft); text-align: center; padding: 40px 20px; line-height: 1.6; }
  .row { background: var(--surface); border: 2px solid var(--line); border-radius: var(--radius-lg); padding: 14px 16px; display: flex; align-items: center; gap: 12px; box-shadow: var(--shadow-md); }
  .row-top { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .ops { display: flex; gap: 6px; }
  .op { width: 28px; height: 28px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; color: white; font-size: 16px; }
  .op-add { background: var(--op-add); }
  .op-sub { background: var(--op-sub); }
  .op-mul { background: var(--op-mul); }
  .op-div { background: var(--op-div); }
  .config { color: var(--ink-soft); font-size: 14px; font-weight: 600; }
  .score { font-size: 36px; font-weight: 900; color: var(--accent); font-variant-numeric: tabular-nums; }
</style>
