/**
 * Parental gate: a multiplication problem with 2-digit operands. A kid 5-10
 * realistically cannot solve this in under a few seconds; an adult can do it
 * mentally or on paper quickly.
 */

export function newGateProblem() {
  const a = 11 + Math.floor(Math.random() * 19); // 11..29
  const b = 11 + Math.floor(Math.random() * 19);
  return { a, b, answer: a * b };
}
