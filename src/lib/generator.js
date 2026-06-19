/**
 * Pure problem generator.
 * Given {ops, maxOperand}, produce {a, op, b, answer}.
 *  - Subtraction: a >= b (never negative)
 *  - Division: always whole number (generate quotient*divisor)
 *  - Avoid immediate repeats (previous problem optional)
 */

const ALL_OPS = ['+', '-', '×', '÷'];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function isValidConfig({ ops, maxOperand }) {
  if (!Array.isArray(ops) || ops.length === 0) return false;
  if (!ops.every((o) => ALL_OPS.includes(o))) return false;
  if (typeof maxOperand !== 'number' || maxOperand < 1 || maxOperand > 20) return false;
  return true;
}

export function nextProblem({ ops, maxOperand }, previous = null) {
  if (!isValidConfig({ ops, maxOperand })) {
    throw new Error('Invalid generator config');
  }
  for (let tries = 0; tries < 20; tries++) {
    const op = pick(ops);
    let a, b, answer;
    if (op === '+') {
      a = randInt(0, maxOperand);
      b = randInt(0, maxOperand);
      answer = a + b;
    } else if (op === '-') {
      a = randInt(0, maxOperand);
      b = randInt(0, a);
      answer = a - b;
    } else if (op === '×') {
      a = randInt(0, maxOperand);
      b = randInt(0, maxOperand);
      answer = a * b;
    } else if (op === '÷') {
      // Pick divisor and quotient, multiply for dividend.
      // Avoid divide-by-zero entirely.
      b = randInt(1, maxOperand);
      const quotient = randInt(0, maxOperand);
      a = b * quotient;
      answer = quotient;
    }
    const problem = { a, op, b, answer };
    if (!previous || problem.a !== previous.a || problem.b !== previous.b || problem.op !== previous.op) {
      return problem;
    }
  }
  // Fallback: just return whatever we last generated even if duplicate.
  const op = pick(ops);
  const a = randInt(0, maxOperand);
  const b = op === '÷' ? Math.max(1, randInt(1, maxOperand)) : randInt(0, maxOperand);
  return { a, op, b, answer: compute(a, op, b) };
}

export function compute(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? 0 : Math.floor(a / b);
    default: return 0;
  }
}

/**
 * Smart auto-submit helper: given the current typed string and the correct answer,
 * decide whether to auto-submit. Submit when the typed string can no longer become
 * a different correct answer (length-equal or longer).
 *
 * For our generator with operands <= 12, multiplication caps at 144 (3 digits),
 * everything else fits in 2 digits. We auto-submit when:
 *  - typed length == answer length (str compare)
 *  - OR typed length > answer length (already wrong, definitely submit)
 */
export function shouldAutoSubmit(typed, answer) {
  if (!typed || typed.length === 0) return false;
  const ansStr = String(answer);
  return typed.length >= ansStr.length;
}
