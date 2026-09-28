import test from "node:test";
import assert from "node:assert/strict";
import {
  claimFromRank, claimRank, isValidClaim, isRaise, baseProbability,
  isValidCodeString, codeFromString, countIn, codeSatisfies, MAX_CLAIM,
} from "../src/game.js";

test("claim ordering is total and consistent with rank round-trip", () => {
  let prev = null;
  for (let r = 0; r <= 14; r++) {
    const c = claimFromRank(r);
    assert.equal(claimRank(c), r);
    assert.ok(isValidClaim(c));
    if (prev) assert.ok(isRaise(prev, c), `${JSON.stringify(prev)} -> ${JSON.stringify(c)}`);
    prev = c;
  }
  assert.ok(!isRaise(MAX_CLAIM, claimFromRank(0)));
});

test("max claim is 3xE", () => {
  assert.deepEqual(MAX_CLAIM, { n: 3, sym: "E" });
});

test("invalid claims rejected", () => {
  for (const bad of [null, {}, { n: 0, sym: "A" }, { n: 4, sym: "A" }, { n: 1, sym: "Z" }, { n: 1.5, sym: "A" }]) {
    assert.ok(!isValidClaim(bad), JSON.stringify(bad));
  }
});

test("baseProbability matches closed-form values", () => {
  const p = 0.2;
  assert.ok(Math.abs(baseProbability({ n: 1, sym: "A" }) - (1 - 0.8 ** 3)) < 1e-12);
  assert.ok(Math.abs(baseProbability({ n: 2, sym: "A" }) - (3 * p * p * 0.8 + p ** 3)) < 1e-12);
  assert.ok(Math.abs(baseProbability({ n: 3, sym: "A" }) - p ** 3) < 1e-12);
  assert.ok(baseProbability({ n: 1, sym: "A" }) > baseProbability({ n: 2, sym: "B" }));
  assert.ok(baseProbability({ n: 2, sym: "B" }) > baseProbability({ n: 3, sym: "C" }));
});

test("code helpers", () => {
  assert.ok(isValidCodeString("abc"));
  assert.ok(!isValidCodeString("abz"));
  assert.ok(!isValidCodeString("abcd"));
  assert.deepEqual(codeFromString("bcd"), ["B", "C", "D"]);
  assert.equal(countIn(["A", "B", "A"], "A"), 2);
  assert.ok(codeSatisfies(["A", "B", "A"], { n: 2, sym: "A" }));
  assert.ok(!codeSatisfies(["A", "B", "C"], { n: 2, sym: "A" }));
});
