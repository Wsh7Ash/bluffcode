import test from "node:test";
import assert from "node:assert/strict";
import { Match } from "../src/engine.js";

test("full scripted match: rules hold and a winner is declared", () => {
  const m = new Match(42);
  let rounds = 0;
  while (!m.matchWinner && rounds < 50) {
    if (!m.round) {
      m.startRound(["A", "B", rounds % 2 ? "C" : "A"]);
      rounds++;
      continue;
    }
    if (m.round.turn === "human") {
      if (!m.round.lastBid) m.humanBid({ n: 1, sym: "A" });
      else m.humanChallenge();
    } else {
      m.aiTurn();
    }
  }
  assert.ok(m.matchWinner, "match should end");
  assert.ok(m.score.human >= 3 || m.score.ai >= 3);
  assert.ok(m.roundNo > 1);
});

test("challenge resolution: true claim favors claimant, false claim favors challenger", () => {
  const m = new Match(1);
  m.startRound(["A", "A", "B"]);
  // Human truthfully bids 2xA, bot challenges -> human wins.
  m.humanBid({ n: 2, sym: "A" });
  const ev = m.aiTurn();
  assert.equal(ev.event, "round-end");
  assert.equal(ev.claimant, "human");
  assert.equal(ev.claimWasTrue, true);
  assert.equal(ev.winner, "human");

  const m2 = new Match(2);
  m2.startRound(["A", "B", "C"]);
  m2.humanBid({ n: 3, sym: "A" }); // bluff
  const ev2 = m2.aiTurn();
  assert.equal(ev2.claimWasTrue, false);
  assert.equal(ev2.winner, "ai");
});

test("caught lies feed the bot's honesty ledger", () => {
  const m = new Match(3);
  m.startRound(["A", "B", "C"]);
  m.humanBid({ n: 3, sym: "E" });
  m.aiTurn(); // challenge almost certain
  const row = m.bot.profileSummary().find((r) => r.claim === "3E");
  assert.ok(row && row.made === 1 && row.caught === 1, JSON.stringify(m.bot.profileSummary()));
});

test("illegal moves throw", () => {
  const m = new Match(4);
  m.startRound(["A", "A", "A"]);
  assert.throws(() => m.humanBid({ n: 0, sym: "A" }));
  assert.throws(() => m.aiTurn()); // wrong turn
  m.humanBid({ n: 1, sym: "A" });
  assert.throws(() => m.humanBid({ n: 2, sym: "A" })); // out of turn
  const ev = m.aiTurn();
  assert.equal(ev.event, "round-end");
  // Round is over: bidding without a round, or starting twice, throws.
  assert.throws(() => m.humanBid({ n: 1, sym: "A" }), /no round in progress/);
  m.startRound(["B", "B", "C"]);
  assert.throws(() => m.startRound(["B", "B", "D"]), /already in progress/);
});

test("same seed produces identical match log", () => {
  const play = (seed) => {
    const m = new Match(seed);
    let rounds = 0;
    while (!m.matchWinner && rounds < 50) {
      if (!m.round) { m.startRound(["B", "B", "C"]); rounds++; continue; }
      if (m.round.turn === "human") {
        if (!m.round.lastBid) m.humanBid({ n: 1, sym: "B" });
        else m.humanChallenge();
      } else m.aiTurn();
    }
    return JSON.stringify({ score: m.score, log: m.log, winner: m.matchWinner });
  };
  assert.equal(play(12345), play(12345));
  assert.notEqual(play(12345), play(54321));
});

test("loser of a round bids first next round", () => {
  const m = new Match(5);
  m.startRound(["A", "B", "C"]);
  m.humanBid({ n: 3, sym: "E" }); // certain bluff
  const ev = m.aiTurn();
  assert.equal(ev.winner, "ai");
  assert.equal(m.startRound(["A", "B", "C"]).starter, "human", "loser (human) should start next round");

  const m2 = new Match(6);
  m2.startRound(["A", "A", "B"]);
  m2.humanBid({ n: 2, sym: "A" }); // true claim
  const ev2 = m2.aiTurn();
  assert.equal(ev2.winner, "human");
  assert.equal(m2.startRound(["C", "C", "D"]).starter, "ai", "loser (ai) should start next round");
});
