// Self-playing demo: human moves are scripted, bot is real. Proves the full
// game loop deterministically for a given seed and writes a transcript.
import { writeFileSync, mkdirSync } from "node:fs";
import { Match } from "../src/engine.js";
import { claimLabel, codeLabel } from "../src/game.js";

const seed = Number(process.argv[2] || 7);
const match = new Match(seed);
const lines = [];
const say = (s = "") => { lines.push(s); console.log(s); };

// Scripted human policy: always bid the lowest truthful raise we can compute
// from a fixed private code; when the bot's bid would exceed our code's truth,
// challenge. This exercises bidding, raising, bluffing, and challenges.
const HUMAN_CODES = ["AAB", "CDE", "BBD", "AAA", "ACE", "DDA", "BCE", "EAB", "ABC", "CBA"];

function lowestTruthfulRaise(lastBid, code) {
  const count = (sym) => code.filter((c) => c === sym).length;
  const cands = [];
  for (let n = 1; n <= 3; n++) {
    for (const sym of ["A", "B", "C", "D", "E"]) {
      if (count(sym) >= n) cands.push({ n, sym });
    }
  }
  cands.sort((a, b) => (a.n - b.n) || (["A","B","C","D","E"].indexOf(a.sym) - ["A","B","C","D","E"].indexOf(b.sym)));
  return cands.find((c) => !lastBid || c.n * 5 + c.sym.charCodeAt(0) > lastBid.n * 5 + lastBid.sym.charCodeAt(0)) || null;
}

let roundIdx = 0;
while (!match.matchWinner) {
  if (!match.round) {
    const code = HUMAN_CODES[roundIdx++ % HUMAN_CODES.length].split("");
    const ev = match.startRound(code);
    say(`--- Round ${ev.roundNo} (starter: ${ev.starter}) ---`);
    continue;
  }
  if (match.round.turn === "human") {
    const claim = lowestTruthfulRaise(match.round.lastBid, match.round.humanCode);
    if (match.round.lastBid && !claim) {
      const ev = match.humanChallenge();
      say(`human challenges ${claimLabel(ev.challengedClaim)} -> claimant code ${codeLabel(ev.claimantCode)}, true=${ev.claimWasTrue}, winner=${ev.winner}, score ${ev.score.human}-${ev.score.ai}`);
      continue;
    }
    const ev = match.humanBid(claim);
    say(`human bids ${claimLabel(ev.claim)}`);
    continue;
  }
  const humanBidNow = match.round.lastBid;
  const ev = match.aiTurn();
  if (ev.event === "bid") {
    say(`ai bids ${claimLabel(ev.claim)} [${ev.reason}]`);
  } else {
    const pFalse = match.bot.falseProbability(humanBidNow);
    say(`ai challenges ${claimLabel(humanBidNow)} (est ${(pFalse * 100).toFixed(0)}% false) -> human code ${codeLabel(match.round ? ev.claimantCode : ev.claimantCode)}, true=${ev.claimWasTrue}, winner=${ev.winner}, score ${ev.score.human}-${ev.score.ai}`);
  }
}
say(`MATCH OVER: winner=${match.matchWinner} final=${match.score.human}-${match.score.ai} seed=${seed}`);

mkdirSync("results", { recursive: true });
writeFileSync("results/demo-transcript.txt", lines.join("\n") + "\n");
console.error(`\nwrote results/demo-transcript.txt`);
