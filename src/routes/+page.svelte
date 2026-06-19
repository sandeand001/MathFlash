<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { data, activeProfile } from '$lib/stores/appState.js';
  import { bestKey, updateSettings, setSound } from '$lib/storage.js';
  import { hapticTap } from '$lib/haptics.js';

  const OPS = [
    { sym: '+', label: 'Add', color: 'var(--op-add)' },
    { sym: '-', label: 'Sub', color: 'var(--op-sub)' },
    { sym: '×', label: 'Mul', color: 'var(--op-mul)' },
    { sym: '÷', label: 'Div', color: 'var(--op-div)' }
  ];

  const DURATIONS = [30, 60, 120];
  const RANGES = [5, 10, 12];

  let profile = $derived($activeProfile);
  let settings = $derived(profile?.settings ?? { ops: ['+'], maxOperand: 10, duration: 60 });

  let best = $derived.by(() => {
    if (!profile) return null;
    const k = bestKey(settings.ops, settings.maxOperand, settings.duration);
    return profile.bests[k] ?? null;
  });

  function toggleOp(sym) {
    hapticTap();
    if (!profile) return;
    const cur = new Set(settings.ops);
    if (cur.has(sym)) {
      if (cur.size === 1) return; // must have at least one
      cur.delete(sym);
    } else {
      cur.add(sym);
    }
    const next = [...cur];
    data.mutate((d) => updateSettings(d, d.activeProfileId, { ops: next }));
  }

  function setRange(r) {
    hapticTap();
    data.mutate((d) => updateSettings(d, d.activeProfileId, { maxOperand: r }));
  }

  function setDuration(s) {
    hapticTap();
    data.mutate((d) => updateSettings(d, d.activeProfileId, { duration: s }));
  }

  function toggleSound() {
    if (!profile) return;
    data.mutate((d) => setSound(d, d.activeProfileId, !profile.soundEnabled));
  }

  function start() {
    hapticTap();
    goto(`${base}/drill`);
  }
</script>

{#if profile}
  <div class="home">
    <header class="header">
      <button class="profile-chip" onclick={() => goto(`${base}/profiles`)} aria-label="Switch profile">
        <span class="emoji" style="background:{profile.color}">{profile.emoji}</span>
        <span class="name">{profile.name}</span>
      </button>
      <div class="spacer"></div>
      <button class="icon-btn" onclick={toggleSound} aria-label="Toggle sound">
        {profile.soundEnabled ? '🔊' : '🔇'}
      </button>
      <button class="icon-btn" onclick={() => goto(`${base}/history`)} aria-label="History">🏆</button>
    </header>

    <main class="main">
      <h1 class="title">Math <span class="accent">Cards</span></h1>

      <section class="card">
        <div class="label">Operations</div>
        <div class="op-row">
          {#each OPS as op}
            {@const active = settings.ops.includes(op.sym)}
            <button
              class="op-btn"
              class:active
              style="--op-color: {op.color}"
              onclick={() => toggleOp(op.sym)}
              aria-pressed={active}
            >
              <span class="op-sym">{op.sym}</span>
            </button>
          {/each}
        </div>
      </section>

      <section class="card">
        <div class="label">Numbers up to</div>
        <div class="chip-row">
          {#each RANGES as r}
            <button class="big-chip" class:on={settings.maxOperand === r} onclick={() => setRange(r)}>{r}</button>
          {/each}
        </div>
      </section>

      <section class="card">
        <div class="label">Time</div>
        <div class="chip-row">
          {#each DURATIONS as s}
            <button class="big-chip" class:on={settings.duration === s} onclick={() => setDuration(s)}>{s}s</button>
          {/each}
        </div>
      </section>

      <div class="best">
        {#if best}
          🏆 Best: <strong>{best.correct}</strong>
        {:else}
          No best yet — go for it!
        {/if}
      </div>

      <button class="btn big start" onclick={start}>Start ▶</button>
    </main>
  </div>
{/if}

<style>
  .home { display: flex; flex-direction: column; height: 100%; padding: 12px 16px 16px; }

  .header { display: flex; align-items: center; gap: 8px; padding-bottom: 8px; }
  .spacer { flex: 1; }
  .profile-chip {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--surface); border: 2px solid var(--line);
    padding: 6px 12px 6px 6px; border-radius: 999px; font-weight: 600;
  }
  .emoji {
    width: 32px; height: 32px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 18px; color: white;
  }
  .icon-btn {
    width: 42px; height: 42px; border-radius: 12px;
    background: var(--surface); border: 2px solid var(--line);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 20px;
  }

  .main { flex: 1; display: flex; flex-direction: column; gap: 16px; padding-top: 8px; overflow-y: auto; }

  .title {
    font-size: 36px; font-weight: 900; margin: 4px 0 8px; text-align: center; letter-spacing: -0.02em;
  }
  .accent { color: var(--accent); }

  .card {
    background: var(--surface); border: 2px solid var(--line);
    border-radius: var(--radius-lg); padding: 14px 16px; box-shadow: var(--shadow-md);
  }
  .label {
    font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--ink-soft); font-weight: 700; margin-bottom: 10px;
  }
  .op-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .op-btn {
    height: 70px; border-radius: var(--radius-md);
    border: 3px solid var(--line); background: var(--surface);
    display: flex; align-items: center; justify-content: center;
    font-size: 34px; font-weight: 800; color: var(--muted);
    transition: transform 80ms ease, background 120ms;
  }
  .op-btn.active {
    background: var(--op-color); color: white; border-color: var(--op-color);
    box-shadow: 0 6px 0 -2px color-mix(in srgb, var(--op-color) 60%, black);
  }
  .op-btn:active { transform: translateY(2px); }

  .chip-row { display: flex; gap: 10px; }
  .big-chip {
    flex: 1; padding: 14px 0; border-radius: var(--radius-md);
    background: var(--surface); border: 3px solid var(--line);
    font-size: 18px; font-weight: 800; color: var(--ink-soft);
    min-height: 56px;
  }
  .big-chip.on { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }

  .best {
    text-align: center; font-size: 16px; color: var(--ink-soft);
    padding: 8px 0;
  }
  .best strong { color: var(--ink); font-size: 20px; }

  .start { margin-top: auto; font-size: 26px; min-height: 76px; }
</style>
