// Core domain rules for bluffcode: codes, claims, ordering, probabilities.
// Pure functions only — no IO, no randomness (randomness lives in engine.js).

export const SYMBOLS = ["A", "B", "C", "D", "E"];
export const CODE_LEN = 3;
export const ROUNDS_TO_WIN = 3;

/**
 * A claim is { n, sym }: "my hidden code contains at least n copies of sym".
 * n in 1..CODE_LEN, sym in SYMBOLS. Total ordering by rank:
 * (1,A) < (1,B) < ... < (1,E) < (2,A) < ... < (3,E).
 */
export function isValidClaim(c) {
  return (
    c !== null && typeof c === "object" &&
    Number.isInteger(c.n) && c.n >= 1 && c.n <= CODE_LEN &&
    SYMBOLS.includes(c.sym)
  );
}

export function claimRank(c) {
  return (c.n - 1) * SYMBOLS.length + SYMBOLS.indexOf(c.sym);
}

export function claimFromRank(r) {
  return { n: Math.floor(r / SYMBOLS.length) + 1, sym: SYMBOLS[r % SYMBOLS.length] };
}

export function claimKey(c) {
  return `${c.n}${c.sym}`;
}

export function claimLabel(c) {
  return `at least ${c.n} x ${c.sym}`;
}

/** A next claim must be a strict raise of the previous one. */
export function isRaise(prev, next) {
  return isValidClaim(next) && claimRank(next) > claimRank(prev);
}

export const MAX_RANK = CODE_LEN * SYMBOLS.length - 1;
export const MAX_CLAIM = claimFromRank(MAX_RANK);

export function countIn(code, sym) {
  return code.filter((s) => s === sym).length;
}

export function codeSatisfies(code, claim) {
  return countIn(code, claim.sym) >= claim.n;
}

/**
 * Probability that a uniformly random code (5 symbols, repetition allowed,
 * CODE_LEN slots) satisfies the claim — the "strength" of a bid.
 */
export function baseProbability(claim) {
  const p = 1 / SYMBOLS.length;
  const q = 1 - p;
  if (claim.n === 1) return 1 - Math.pow(q, CODE_LEN);
  if (claim.n === 2) return 3 * p * p * q + Math.pow(p, CODE_LEN);
  return Math.pow(p, CODE_LEN);
}

export function randomCode(rng) {
  const code = [];
  for (let i = 0; i < CODE_LEN; i++) {
    code.push(SYMBOLS[Math.floor(rng() * SYMBOLS.length)]);
  }
  return code;
}

export function isValidCodeString(s) {
  return (
    typeof s === "string" && s.length === CODE_LEN &&
    s.toUpperCase().split("").every((ch) => SYMBOLS.includes(ch))
  );
}

export function codeFromString(s) {
  return s.toUpperCase().split("");
}

export function codeLabel(code) {
  return code.join("-");
}
