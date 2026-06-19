<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { lastDrillResult, activeProfile } from '$lib/stores/appState.js';
  import { playNewBest } from '$lib/audio.js';
  import { hapticNewBest } from '$lib/haptics.js';

  let result = $derived($lastDrillResult);
  let profile = $derived($activeProfile);

  let accuracy = $derived.by(() => {
    if (!result) return 0;
    const total = result.session.correct + result.session.wrong;
    return total === 0 ? 0 : Math.round((result.session.correct / total) * 100);
  });

  onMount(() => {
    if (!result) { goto(`${base}/`); return; }
    if (result.isNewBest) {
      playNewBest();
      hapticNewBest();
    }
  });

  function playAgain() { goto(`${base}/drill`); }
  function home() { goto(`${base}/`); }
</script>

{#if result && profile}
  <div class="results">
    <header class="topbar">
      <span class="profile-mini" style="background:{profile.color}">{profile.emoji}</span>
      <span class="name">{profile.name}</span>
      <span class="spacer"></span>
    </header>

    <main class="main">
      {#if result.isNewBest}
        <div class="badge pop">🏆 New best!</div>
        {#if result.previousBest != null}
          <div class="prev">was {result.previousBest}</div>
        {/if}
      {/if}

      <div class="score pop">{result.session.correct}</div>
      <div class="score-sub">correct in {result.session.duration}s</div>

      <div class="stats">
        <div class="stat">
          <div class="stat-num">{accuracy}%</div>
          <div class="stat-label">accuracy</div>
        </div>
        <div class="stat">
          <div class="stat-num">{result.session.wrong}</div>
          <div class="stat-label">missed</div>
        </div>
      </div>

      {#if result.session.misses.length > 0}
        <section class="misses">
          <div class="misses-label">Misses</div>
          <ul>
            {#each result.session.misses as m}
              <li>
                <span class="mono">{m.a} {m.op} {m.b}</span>
                <span class="given">you: {m.given}</span>
                <span class="right">= {m.correct}</span>
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    </main>

    <div class="actions">
      <button class="btn secondary" onclick={home}>⚙ Change</button>
      <button class="btn big" style="flex:1" onclick={playAgain}>↻ Play again</button>
    </div>
  </div>
{/if}

<style>
  .results { display: flex; flex-direction: column; height: 100%; padding: 12px 16px 16px; }
  .topbar { display: flex; align-items: center; gap: 10px; }
  .profile-mini { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; }
  .name { font-weight: 700; }
  .spacer { flex: 1; }

  .main { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; overflow-y: auto; padding: 12px 0; }
  .badge { background: linear-gradient(135deg, var(--warn), #fbbf24); color: white; padding: 10px 18px; border-radius: 999px; font-weight: 800; font-size: 18px; box-shadow: var(--shadow-md); }
  .prev { color: var(--ink-soft); font-size: 14px; margin-top: -4px; }

  .score { font-size: 96px; font-weight: 900; color: var(--accent); line-height: 1; margin-top: 8px; font-variant-numeric: tabular-nums; }
  .score-sub { color: var(--ink-soft); font-size: 16px; }

  .stats { display: flex; gap: 16px; margin-top: 8px; }
  .stat { background: var(--surface); border: 2px solid var(--line); padding: 10px 18px; border-radius: var(--radius-md); text-align: center; min-width: 90px; }
  .stat-num { font-size: 24px; font-weight: 800; }
  .stat-label { color: var(--ink-soft); font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; }

  .misses { width: 100%; background: var(--surface); border: 2px solid var(--line); border-radius: var(--radius-lg); padding: 12px 16px; margin-top: 8px; }
  .misses-label { font-weight: 700; color: var(--ink-soft); font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
  .misses ul { list-style: none; padding: 0; margin: 0; }
  .misses li { display: flex; gap: 12px; align-items: baseline; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 16px; }
  .misses li:last-child { border-bottom: 0; }
  .mono { font-family: var(--font-mono); font-weight: 700; min-width: 4ch; }
  .given { color: var(--bad); font-size: 14px; }
  .right { margin-left: auto; color: var(--good); font-weight: 700; }

  .actions { display: flex; gap: 10px; padding-top: 8px; }
</style>
