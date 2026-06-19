import { describe, it, expect } from 'vitest';
import { nextProblem, shouldAutoSubmit, compute, isValidConfig } from './generator.js';

describe('generator', () => {
  it('rejects invalid configs', () => {
    expect(isValidConfig({ ops: [], maxOperand: 10 })).toBe(false);
    expect(isValidConfig({ ops: ['x'], maxOperand: 10 })).toBe(false);
    expect(isValidConfig({ ops: ['+'], maxOperand: 0 })).toBe(false);
  });

  it('addition stays within range', () => {
    for (let i = 0; i < 200; i++) {
      const p = nextProblem({ ops: ['+'], maxOperand: 12 });
      expect(p.a).toBeGreaterThanOrEqual(0);
      expect(p.a).toBeLessThanOrEqual(12);
      expect(p.b).toBeGreaterThanOrEqual(0);
      expect(p.b).toBeLessThanOrEqual(12);
      expect(p.answer).toBe(p.a + p.b);
    }
  });

  it('subtraction is never negative', () => {
    for (let i = 0; i < 500; i++) {
      const p = nextProblem({ ops: ['-'], maxOperand: 12 });
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.a).toBeGreaterThanOrEqual(p.b);
    }
  });

  it('division is always whole-number and never divides by zero', () => {
    for (let i = 0; i < 500; i++) {
      const p = nextProblem({ ops: ['÷'], maxOperand: 12 });
      expect(p.b).toBeGreaterThan(0);
      expect(p.answer * p.b).toBe(p.a);
    }
  });

  it('avoids immediate repeats', () => {
    let prev = nextProblem({ ops: ['+'], maxOperand: 12 });
    for (let i = 0; i < 100; i++) {
      const next = nextProblem({ ops: ['+'], maxOperand: 12 }, prev);
      const same = next.a === prev.a && next.b === prev.b && next.op === prev.op;
      expect(same).toBe(false);
      prev = next;
    }
  });

  it('compute matches operator semantics', () => {
    expect(compute(3, '+', 4)).toBe(7);
    expect(compute(9, '-', 4)).toBe(5);
    expect(compute(6, '×', 7)).toBe(42);
    expect(compute(56, '÷', 8)).toBe(7);
  });
});

describe('shouldAutoSubmit', () => {
  it('does not submit empty input', () => {
    expect(shouldAutoSubmit('', 56)).toBe(false);
  });
  it('submits when typed length matches answer length', () => {
    expect(shouldAutoSubmit('56', 56)).toBe(true);
    expect(shouldAutoSubmit('5', 7)).toBe(true);
  });
  it('does not submit before full length', () => {
    expect(shouldAutoSubmit('5', 56)).toBe(false);
    expect(shouldAutoSubmit('1', 144)).toBe(false);
    expect(shouldAutoSubmit('14', 144)).toBe(false);
  });
});
