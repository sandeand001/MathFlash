<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { fly } from 'svelte/transition';
  import { data, activeProfile, lastDrillResult } from '$lib/stores/appState.js';
  import { recordSession } from '$lib/storage.js';
  import { nextProblem, shouldAutoSubmit } from '$lib/generator.js';
  import { playCorrect, playWrong } from '$lib/audio.js';
  import { hapticTap, hapticWrong } from '$lib/haptics.js';

  let profile = $derived($activeProfile);
  let settings = $derived(profile?.settings ?? { ops: ['+'], maxOperand: 10, duration: 60 });

  let problem = $state(null);
  let typed = $state('');
  let correctCount = $state(0);
  let wrongCount = $state(0);
  let misses = $state([]);
  let timeLeft = $state(60);
  let running = $state(false);
  let startedAt = $state(0);
  let flashCorrect = $state(false); // showing the right answer after a wrong attempt
  let flashRight = $state(false);   // green flash after a correct answer
  let shakeKey = $state(0);
  let problemKey = $state(0);

  let timerInterval;
  let advanceTimeout;

  const OP_COLORS = { '+': 'var(--op-add)', '-': 'var(--op-sub)', '×': 'var(--op-mul)', '÷': 'var(--op-div)' };

  function start() {
    if (!profile) { goto(`${base}/`); return; }
    correctCount = 0;
    wrongCount = 0;
    misses = [];
    typed = '';
    timeLeft = settings.duration;
    startedAt = Date.now();
    running = true;
    flashCorrect = false;
    flashRight = false;
    problem = nextProblem(settings, null);
    problemKey++;

    const startMs = performance.now();
    timerInterval = setInterval(() => {
      const elapsed = (performance.now() - startMs) / 1000;
      timeLeft = Math.max(0, settings.duration - elapsed);
      if (timeLeft <= 0) end();
    }, 100);
  }

  function end() {
    if (!running) return;
    running = false;
    clearInterval(timerInterval);
    clearTimeout(advanceTimeout);

    const session = {
      startedAt,
      duration: settings.duration,
      ops: [...settings.ops],
      maxOperand: settings.maxOperand,
      correct: correctCount,
      wrong: wrongCount,
      misses: [...misses]
    };

    let result = { isNewBest: false, previousBest: null };
    data.mutate((d) => {
      result = recordSession(d, d.activeProfileId, session);
    });

    lastDrillResult.set({ session, ...result });
    goto(`${base}/results`);
  }

  function nextCard() {
    problem = nextProblem(settings, problem);
    typed = '';
    flashCorrect = false;
    flashRight = false;
    problemKey++;
  }

  function submit() {
    if (!problem || !running || flashCorrect || flashRight) return;
    const given = parseInt(typed, 10);
    if (Number.isNaN(given)) return;
    if (given === problem.answer) {
      correctCount++;
      playCorrect();
      flashRight = true;
      advanceTimeout = setTimeout(() => {
        if (running) nextCard();
      }, 700);
    } else {
      wrongCount++;
      misses = [...misses, { a: problem.a, op: problem.op, b: problem.b, given, correct: problem.answer }];
      playWrong();
      hapticWrong();
      flashCorrect = true;
      shakeKey++;
      advanceTimeout = setTimeout(() => {
        if (running) nextCard();
      }, 750);
    }
  }

  function press(key) {
    if (!running || flashCorrect || flashRight) return;
    hapticTap();
    if (key === '⌫') {
      typed = typed.slice(0, -1);
      return;
    }
    if (key === '↵') {
      submit();
      return;
    }
    if (typed.length >= 4) return;
    typed = typed + key;
    if (shouldAutoSubmit(typed, problem.answer)) {
      submit();
    }
  }

  onMount(start);
  onDestroy(() => {
    clearInterval(timerInterval);
    clearTimeout(advanceTimeout);
  });

  const KEYS = ['1','2','3','4','5','6','7','8','9','⌫','0','↵'];

  let timerPct = $derived((timeLeft / settings.duration) * 100);
  let timerColor = $derived(
    timerPct > 50 ? 'var(--good)' : timerPct > 25 ? 'var(--warn)' : 'var(--bad)'
  );
  let timerText = $derived(`${Math.ceil(timeLeft)}s`);
  let opColor = $derived(problem ? OP_COLORS[problem.op] : 'var(--accent)');
</script>

{#if profile}
  <div class="drill">
    <div class="topbar">
      <span class="profile-mini" style="background:{profile.color}">{profile.emoji}</span>
      <span class="counter">✓ {correctCount}</span>
      <span class="counter wrong">✗ {wrongCount}</span>
      <span class="spacer"></span>
      <span class="timer-text">{timerText}</span>
      <button class="quit" onclick={end} aria-label="End drill">✕</button>
    </div>

    <div class="timer-bar-bg">
      <div class="timer-bar" style="width:{timerPct}%; background:{timerColor}"></div>
    </div>

    <div class="problem-area">
      {#if problem}
        {#key problemKey}
          <div class="problem" in:fly={{ y: 30, duration: 180 }}>
            <span class="num">{problem.a}</span>
            <span class="op" style="color:{opColor}">{problem.op}</span>
            <span class="num">{problem.b}</span>
            <span class="eq">=</span>
            <span class="answer-slot" class:flashing-wrong={flashCorrect} class:flashing-right={flashRight}>
              {#if flashCorrect}
                <span class="correct-flash">{problem.answer}</span>
              {:else if flashRight}
                <span class="right-flash">{problem.answer}</span>
              {:else}
                {#key shakeKey}
                  <span class="typed" class:has={typed}>{typed || '?'}</span>
                {/key}
              {/if}
            </span>
          </div>
        {/key}
      {/if}
    </div>

    <div class="keypad">
      {#each KEYS as k}
        <button
          class="key"
          class:special={k === '⌫' || k === '↵'}
          class:enter={k === '↵'}
          onclick={() => press(k)}
          aria-label={k === '⌫' ? 'Delete' : k === '↵' ? 'Enter' : k}
        >{k}</button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .drill { display: flex; flex-direction: column; height: 100%; padding: 8px 12px 12px; }
  .topbar { display: flex; align-items: center; gap: 10px; padding: 4px 4px 6px; font-weight: 700; font-size: 16px; }
  .profile-mini { width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; color: white; }
  .counter { color: var(--good); }
  .counter.wrong { color: var(--bad); }
  .spacer { flex: 1; }
  .timer-text { font-variant-numeric: tabular-nums; color: var(--ink-soft); }
  .quit { width: 34px; height: 34px; border-radius: 10px; background: var(--surface); border: 2px solid var(--line); font-size: 16px; font-weight: 700; color: var(--ink-soft); }

  .timer-bar-bg { height: 8px; background: var(--line); border-radius: 999px; overflow: hidden; margin-bottom: 8px; }
  .timer-bar { height: 100%; border-radius: 999px; transition: width 100ms linear, background 200ms; }

  .problem-area { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; }
  .problem { display: flex; align-items: center; gap: 14px; font-family: var(--font-mono); font-size: clamp(48px, 12vw, 88px); font-weight: 800; letter-spacing: -0.02em; }
  .num { color: var(--ink); }
  .op { font-weight: 900; }
  .eq { color: var(--ink-soft); }
  .answer-slot { min-width: 1.8ch; display: inline-flex; align-items: center; justify-content: center; border-bottom: 4px solid var(--muted); padding: 0 6px; transition: border-color 120ms; }
  .answer-slot.flashing-wrong { border-color: var(--bad); }
  .answer-slot.flashing-right { border-color: var(--good); }
  .typed { color: var(--accent); }
  .typed.has { color: var(--ink); }
  .correct-flash { color: var(--bad); animation: pop 220ms ease-out; }
  .right-flash { color: var(--good); animation: pop 220ms ease-out; }

  .keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding-top: 8px; }
  .key { height: 72px; border-radius: var(--radius-md); background: var(--surface); border: 2px solid var(--line); font-size: 28px; font-weight: 800; color: var(--ink); box-shadow: 0 3px 0 var(--line); transition: transform 60ms ease, box-shadow 60ms ease; user-select: none; }
  .key:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--line); }
  .key.special { color: var(--ink-soft); }
  .key.enter { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); box-shadow: 0 3px 0 color-mix(in srgb, var(--accent) 60%, black); }
</style>
