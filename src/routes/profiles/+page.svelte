<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { data } from '$lib/stores/appState.js';
  import { createProfile, deleteProfile, setActiveProfile, renameProfile } from '$lib/storage.js';
  import { newGateProblem } from '$lib/parental.js';

  const PROFILE_CAP = 6;
  const COLORS = ['#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#3b82f6','#8b5cf6','#ec4899'];
  const EMOJIS = ['🦊','🐼','🦁','🐸','🦄','🐙','🐯','🐨','🦉','🐢','🐳','🦖'];

  let mode = $state('list');
  let pendingAction = $state(null);
  let newName = $state('');
  let newColor = $state(COLORS[0]);
  let newEmoji = $state(EMOJIS[0]);

  let gate = $state(null);
  let gateError = $state('');

  let profiles = $derived(Object.entries($data.profiles).map(([id, p]) => ({ id, ...p })));

  function pickActive(id) {
    data.mutate((d) => setActiveProfile(d, id));
    goto(`${base}/`);
  }

  function beginCreate() {
    if (profiles.length >= PROFILE_CAP) return;
    newName = '';
    newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    newEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    mode = 'create';
  }

  function submitCreate() {
    const name = newName.trim();
    if (!name) return;
    data.mutate((d) => createProfile(d, { name, color: newColor, emoji: newEmoji }));
    mode = 'list';
    goto(`${base}/`);
  }

  function beginGate(action) {
    pendingAction = action;
    gate = { ...newGateProblem(), input: '' };
    gateError = '';
    mode = 'gate';
  }

  function submitGate() {
    if (!gate) return;
    const v = parseInt(gate.input, 10);
    if (v === gate.answer) {
      const action = pendingAction;
      pendingAction = null;
      gate = null;
      if (action.type === 'delete') {
        data.mutate((d) => deleteProfile(d, action.profileId));
        mode = 'list';
      } else if (action.type === 'rename') {
        const p = $data.profiles[action.profileId];
        newName = p.name; newColor = p.color; newEmoji = p.emoji;
        pendingAction = { type: 'rename-confirmed', profileId: action.profileId };
        mode = 'rename';
      }
    } else {
      gateError = 'Ask a grown-up.';
      gate = { ...newGateProblem(), input: '' };
    }
  }

  function submitRename() {
    const name = newName.trim();
    if (!name || !pendingAction) return;
    const id = pendingAction.profileId;
    data.mutate((d) => renameProfile(d, id, { name, color: newColor, emoji: newEmoji }));
    pendingAction = null;
    mode = 'list';
  }

  function cancel() { mode = 'list'; pendingAction = null; gate = null; gateError = ''; }
</script>

<div class="screen">
  <header class="topbar">
    {#if mode !== 'list' && profiles.length > 0}
      <button class="back" onclick={cancel}>‹</button>
    {/if}
    <h1>
      {#if mode === 'list'}Who's playing?
      {:else if mode === 'create'}New player
      {:else if mode === 'gate'}Grown-up check
      {:else if mode === 'rename'}Edit player
      {/if}
    </h1>
  </header>

  {#if mode === 'list'}
    <main class="list">
      {#if profiles.length === 0}
        <div class="empty">No players yet. Add one to begin!</div>
      {/if}
      {#each profiles as p}
        <div class="profile-row">
          <button class="profile-tile" onclick={() => pickActive(p.id)} style="border-color:{p.color}">
            <span class="emoji" style="background:{p.color}">{p.emoji}</span>
            <span class="name">{p.name}</span>
          </button>
          <button class="row-action" onclick={() => beginGate({ type: 'rename', profileId: p.id })} aria-label="Edit">✎</button>
          <button class="row-action danger" onclick={() => beginGate({ type: 'delete', profileId: p.id })} aria-label="Delete">🗑</button>
        </div>
      {/each}
      {#if profiles.length < PROFILE_CAP}
        <button class="btn big add" onclick={beginCreate}>+ Add Player</button>
      {/if}
    </main>
  {:else if mode === 'create' || mode === 'rename'}
    <main class="form">
      <div class="preview" style="background:{newColor}">{newEmoji}</div>
      <input class="name-input" bind:value={newName} placeholder="Name" maxlength="12" />

      <div class="label">Color</div>
      <div class="palette">
        {#each COLORS as c}
          <button class="swatch" style="background:{c}" class:on={newColor === c} onclick={() => newColor = c} aria-label="Color {c}"></button>
        {/each}
      </div>

      <div class="label">Emoji</div>
      <div class="emojis">
        {#each EMOJIS as e}
          <button class="emoji-btn" class:on={newEmoji === e} onclick={() => newEmoji = e}>{e}</button>
        {/each}
      </div>

      <div class="actions">
        {#if profiles.length > 0}
          <button class="btn secondary" onclick={cancel}>Cancel</button>
        {/if}
        <button class="btn big" style="flex:1" onclick={mode === 'create' ? submitCreate : submitRename} disabled={!newName.trim()}>
          {mode === 'create' ? 'Create' : 'Save'}
        </button>
      </div>
    </main>
  {:else if mode === 'gate'}
    <main class="gate">
      <p class="gate-text">Only a grown-up can change players.</p>
      <div class="gate-problem">{gate.a} × {gate.b} = ?</div>
      <input
        class="gate-input"
        type="number"
        inputmode="numeric"
        bind:value={gate.input}
        onkeydown={(e) => e.key === 'Enter' && submitGate()}
      />
      {#if gateError}<div class="gate-err">{gateError}</div>{/if}
      <div class="actions">
        <button class="btn secondary" onclick={cancel}>Cancel</button>
        <button class="btn big" style="flex:1" onclick={submitGate}>OK</button>
      </div>
    </main>
  {/if}
</div>

<style>
  .screen { display: flex; flex-direction: column; height: 100%; padding: 16px; }
  .topbar { display: flex; align-items: center; gap: 12px; padding-bottom: 12px; }
  .back { width: 40px; height: 40px; border-radius: 12px; background: var(--surface); border: 2px solid var(--line); font-size: 26px; line-height: 1; font-weight: 700; }
  h1 { font-size: 22px; margin: 0; flex: 1; }

  .list { flex: 1; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
  .empty { text-align: center; color: var(--ink-soft); padding: 40px 20px; }
  .profile-row { display: flex; gap: 8px; align-items: stretch; }
  .profile-tile { flex: 1; display: flex; align-items: center; gap: 14px; background: var(--surface); border: 3px solid var(--line); border-radius: var(--radius-lg); padding: 12px 16px; font-weight: 700; font-size: 20px; min-height: 72px; box-shadow: var(--shadow-md); }
  .emoji { width: 48px; height: 48px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; color: white; }
  .row-action { width: 48px; border-radius: var(--radius-md); background: var(--surface); border: 2px solid var(--line); font-size: 18px; }
  .row-action.danger { color: var(--bad); }
  .add { margin-top: 12px; }

  .form { display: flex; flex-direction: column; gap: 14px; flex: 1; overflow-y: auto; }
  .preview { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 56px; align-self: center; margin: 8px 0; box-shadow: var(--shadow-lg); }
  .name-input { padding: 14px 16px; border-radius: var(--radius-md); border: 2px solid var(--line); background: var(--surface); font-size: 20px; font-weight: 700; text-align: center; }
  .label { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-soft); font-weight: 700; }
  .palette { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; }
  .swatch { aspect-ratio: 1; border-radius: 50%; border: 3px solid transparent; }
  .swatch.on { border-color: var(--ink); transform: scale(1.1); }
  .emojis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
  .emoji-btn { aspect-ratio: 1; border-radius: var(--radius-md); background: var(--surface); border: 2px solid var(--line); font-size: 28px; }
  .emoji-btn.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, white); }

  .actions { display: flex; gap: 10px; margin-top: auto; padding-top: 12px; }

  .gate { display: flex; flex-direction: column; gap: 16px; flex: 1; padding-top: 20px; }
  .gate-text { color: var(--ink-soft); text-align: center; margin: 0; }
  .gate-problem { font-family: var(--font-mono); font-size: 48px; font-weight: 800; text-align: center; padding: 16px; background: var(--surface); border: 2px solid var(--line); border-radius: var(--radius-lg); }
  .gate-input { padding: 16px; border-radius: var(--radius-md); border: 2px solid var(--line); background: var(--surface); font-size: 28px; text-align: center; font-family: var(--font-mono); }
  .gate-err { color: var(--bad); text-align: center; font-weight: 700; }
</style>
