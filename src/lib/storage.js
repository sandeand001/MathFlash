/**
 * Storage layer for MathFlashCards.
 * One namespaced JSON blob in localStorage.
 */

const KEY = 'mathflashcards:v1';

const DEFAULT_DATA = {
  activeProfileId: null,
  profiles: {}
};

const DEFAULT_PROFILE = {
  name: '',
  color: '#7c3aed',
  emoji: '⭐',
  settings: { ops: ['+'], maxOperand: 10, duration: 60 },
  soundEnabled: true,
  sessions: [],
  bests: {},
  lastActiveAt: 0
};

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadAll() {
  if (!isBrowser()) return structuredClone(DEFAULT_DATA);
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_DATA), ...parsed };
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

export function saveAll(data) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save', e);
  }
}

export function bestKey(ops, maxOperand, duration) {
  const sorted = [...ops].sort().join('');
  return `${sorted}|${maxOperand}|${duration}`;
}

function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function createProfile(data, { name, color, emoji }) {
  const id = 'p_' + newId();
  data.profiles[id] = {
    ...structuredClone(DEFAULT_PROFILE),
    name,
    color,
    emoji,
    lastActiveAt: Date.now()
  };
  data.activeProfileId = id;
  return id;
}

export function deleteProfile(data, profileId) {
  delete data.profiles[profileId];
  if (data.activeProfileId === profileId) {
    const remaining = Object.keys(data.profiles);
    data.activeProfileId = remaining[0] ?? null;
  }
}

export function renameProfile(data, profileId, { name, color, emoji }) {
  const p = data.profiles[profileId];
  if (!p) return;
  if (name !== undefined) p.name = name;
  if (color !== undefined) p.color = color;
  if (emoji !== undefined) p.emoji = emoji;
}

export function setActiveProfile(data, profileId) {
  if (!data.profiles[profileId]) return;
  data.activeProfileId = profileId;
  data.profiles[profileId].lastActiveAt = Date.now();
}

export function getActiveProfile(data) {
  if (!data.activeProfileId) return null;
  return data.profiles[data.activeProfileId] ?? null;
}

/**
 * Record a completed session and update bests.
 * Returns { isNewBest, previousBest } so the Results screen can celebrate.
 */
export function recordSession(data, profileId, session) {
  const p = data.profiles[profileId];
  if (!p) return { isNewBest: false, previousBest: null };

  const id = 's_' + newId();
  const stored = { id, ...session };
  p.sessions.push(stored);

  // Cap session history (well under localStorage limits but defensive).
  if (p.sessions.length > 500) {
    p.sessions = p.sessions.slice(-500);
  }

  const key = bestKey(session.ops, session.maxOperand, session.duration);
  const prev = p.bests[key] ?? null;
  let isNewBest = false;
  if (!prev || session.correct > prev.correct) {
    p.bests[key] = {
      correct: session.correct,
      achievedAt: Date.now(),
      sessionId: id
    };
    isNewBest = !!prev || session.correct > 0;
    // First time on this config still counts as a "new best" if they got any right.
    if (!prev && session.correct > 0) isNewBest = true;
  }

  p.lastActiveAt = Date.now();
  return { isNewBest, previousBest: prev?.correct ?? null, sessionId: id };
}

export function getBest(profile, ops, maxOperand, duration) {
  if (!profile) return null;
  return profile.bests[bestKey(ops, maxOperand, duration)] ?? null;
}

export function updateSettings(data, profileId, settings) {
  const p = data.profiles[profileId];
  if (!p) return;
  p.settings = { ...p.settings, ...settings };
}

export function setSound(data, profileId, enabled) {
  const p = data.profiles[profileId];
  if (!p) return;
  p.soundEnabled = !!enabled;
}

export const _internal = { KEY, DEFAULT_DATA, DEFAULT_PROFILE };
