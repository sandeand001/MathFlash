/**
 * navigator.vibrate wrapper. No-op on iOS Safari (which doesn't support it)
 * and when sound/haptics are disabled.
 */

let enabled = true;

export function setHapticsEnabled(v) {
  enabled = !!v;
}

function vibrate(pattern) {
  if (!enabled) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try { navigator.vibrate(pattern); } catch { /* ignore */ }
}

export function hapticTap() { vibrate(8); }
export function hapticWrong() { vibrate([30, 40, 30]); }
export function hapticNewBest() { vibrate([60, 40, 60, 40, 120]); }
