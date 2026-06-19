import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadAll, bestKey, createProfile, deleteProfile, setActiveProfile,
  recordSession, getActiveProfile, getBest, updateSettings, setSound,
  renameProfile
} from './storage.js';

function freshData() {
  return loadAll();
}

describe('bestKey', () => {
  it('is order-insensitive on ops', () => {
    expect(bestKey(['×', '+'], 12, 60)).toBe(bestKey(['+', '×'], 12, 60));
  });
});

describe('profiles', () => {
  let d;
  beforeEach(() => { d = freshData(); });

  it('creates and sets active', () => {
    const id = createProfile(d, { name: 'Sam', color: '#f00', emoji: '🦊' });
    expect(d.activeProfileId).toBe(id);
    expect(getActiveProfile(d).name).toBe('Sam');
  });

  it('deletes and reassigns active', () => {
    const a = createProfile(d, { name: 'A', color: '#f00', emoji: '🦊' });
    const b = createProfile(d, { name: 'B', color: '#0f0', emoji: '🐼' });
    setActiveProfile(d, a);
    deleteProfile(d, a);
    expect(d.profiles[a]).toBeUndefined();
    expect(d.activeProfileId).toBe(b);
  });

  it('renames profile fields', () => {
    const id = createProfile(d, { name: 'A', color: '#f00', emoji: '🦊' });
    renameProfile(d, id, { name: 'B', color: '#0f0', emoji: '🐼' });
    expect(d.profiles[id]).toMatchObject({ name: 'B', color: '#0f0', emoji: '🐼' });
  });
});

describe('recordSession + bests', () => {
  let d, id;
  beforeEach(() => {
    d = freshData();
    id = createProfile(d, { name: 'Sam', color: '#f00', emoji: '🦊' });
  });

  it('first qualifying session counts as new best', () => {
    const r = recordSession(d, id, {
      startedAt: 0, duration: 60, ops: ['+'], maxOperand: 10,
      correct: 12, wrong: 1, misses: []
    });
    expect(r.isNewBest).toBe(true);
    expect(r.previousBest).toBeNull();
    expect(d.profiles[id].bests['+|10|60'].correct).toBe(12);
  });

  it('does not mark new best when score is not higher', () => {
    recordSession(d, id, { startedAt: 0, duration: 60, ops: ['+'], maxOperand: 10, correct: 15, wrong: 0, misses: [] });
    const r = recordSession(d, id, { startedAt: 0, duration: 60, ops: ['+'], maxOperand: 10, correct: 10, wrong: 0, misses: [] });
    expect(r.isNewBest).toBe(false);
    expect(r.previousBest).toBe(15);
  });

  it('beats prior best correctly', () => {
    recordSession(d, id, { startedAt: 0, duration: 60, ops: ['+'], maxOperand: 10, correct: 15, wrong: 0, misses: [] });
    const r = recordSession(d, id, { startedAt: 0, duration: 60, ops: ['+'], maxOperand: 10, correct: 20, wrong: 0, misses: [] });
    expect(r.isNewBest).toBe(true);
    expect(r.previousBest).toBe(15);
  });

  it('isolates bests per config', () => {
    recordSession(d, id, { startedAt: 0, duration: 60, ops: ['+'], maxOperand: 10, correct: 20, wrong: 0, misses: [] });
    const r = recordSession(d, id, { startedAt: 0, duration: 60, ops: ['×'], maxOperand: 12, correct: 5, wrong: 0, misses: [] });
    expect(r.isNewBest).toBe(true);
    expect(r.previousBest).toBeNull();
  });

  it('isolates bests across profiles', () => {
    const other = createProfile(d, { name: 'B', color: '#0f0', emoji: '🐼' });
    recordSession(d, id, { startedAt: 0, duration: 60, ops: ['+'], maxOperand: 10, correct: 20, wrong: 0, misses: [] });
    expect(getBest(d.profiles[other], ['+'], 10, 60)).toBeNull();
  });
});

describe('settings + sound', () => {
  it('updates settings and sound flag', () => {
    const d = freshData();
    const id = createProfile(d, { name: 'Sam', color: '#f00', emoji: '🦊' });
    updateSettings(d, id, { ops: ['×'], maxOperand: 12 });
    expect(d.profiles[id].settings.ops).toEqual(['×']);
    expect(d.profiles[id].settings.maxOperand).toBe(12);
    setSound(d, id, false);
    expect(d.profiles[id].soundEnabled).toBe(false);
  });
});
