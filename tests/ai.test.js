import test from "node:test";
import assert from "node:assert/strict";
import { Bot, isValidAction } from "../src/ai.js";
import { claimFromRank, claimRank, codeSatisfies, MAX_CLAIM } from "../src/game.js";
import { mulberry32 } from "../src/rng.js";

const rng = () => mulberry32(1234)();

test("bot opens with a truthful bid for any code", () => {
  const codes = [["A", "A", "B"], ["C", "D", "E"], ["E", "E", "E"], ["B", "B", "C"]];
  for (const code of codes) {
    for (let s = 0; s < 20; s++) {
      const bot = new Bot(mulberry32(s));
      const d = bot.decide({ lastBid: null, myCode: code, roundNo: 1, bidsThisRound: 0 });
      assert.equal(d.type, "bid");
      assert.ok(codeSatisfies(code, d.claim), `bot opened with false claim ${JSON.stringify(d.claim)} for ${code}`);
      assert.equal(d.reason, "opening");
    }
  }
});

test("bot never bids below the current claim", () => {
  const bot = new Bot(mulberry32(7));
  const code = ["A", "B", "C"];
  let last = null;
  for (let i = 0; i < 40; i++) {
    const d = bot.decide({ lastBid: last, myCode: code, roundNo: 1, bidsThisRound: i });
    assert.ok(isValidAction(d), JSON.stringify(d));
    if (d.type === "bid") {
      if (last) assert.ok(claimRank(d.claim) > claimRank(last));
      last = d.claim;
    } else break;
  }
});

test("bot challenges when the claim is impossible given its knowledge", () => {
  const bot = new Bot(mulberry32(1));
  // Profile: human claimed 3xE and was caught lying twice -> strongly distrusted.
  bot.recordHumanOutcome({ n: 3, sym: "E" }, true);
  bot.recordHumanOutcome({ n: 3, sym: "E" }, true);
  const d = bot.decide({ lastBid: { n: 3, sym: "E" }, myCode: ["A", "B", "C"], roundNo: 2, bidsThisRound: 2 });
  assert.equal(d.type, "challenge");
});

test("forced challenge at the top of the ladder", () => {
  const bot = new Bot(mulberry32(2));
  const d = bot.decide({ lastBid: MAX_CLAIM, myCode: ["A", "A", "A"], roundNo: 1, bidsThisRound: 5 });
  assert.equal(d.type, "challenge");
  assert.equal(d.reason, "no-higher-claim");
});

test("honesty estimate starts neutral and drops with catches", () => {
  const bot = new Bot(rng);
  const claim = { n: 2, sym: "C" };
  const neutral = bot.honestyEstimate(claim);
  assert.ok(neutral > 0.5 && neutral < 1);
  bot.recordHumanOutcome(claim, true);
  bot.recordHumanOutcome(claim, true);
  assert.ok(bot.honestyEstimate(claim) < neutral);
  assert.ok(bot.falseProbability(claim) > 1 - (1 / 5) ** 2);
});

test("cornered bot challenges instead of raising past a trusted bid", () => {
  const bot = new Bot(mulberry32(9));
  const code = ["A", "A", "A"]; // no truthful raises above 2E
  const last = { n: 2, sym: "E" };
  const d = bot.decide({ lastBid: last, myCode: code, roundNo: 1, bidsThisRound: 1 });
  assert.equal(d.type, "challenge");
  assert.ok(["estimate-high", "cornered"].includes(d.reason), d.reason);
});
