#!/usr/bin/env node
// Interactive terminal client for bluffcode. Usage: node src/cli.js [--seed N]
import { createInterface } from "node:readline/promises";
import { Match } from "./engine.js";
import { SYMBOLS, CODE_LEN, ROUNDS_TO_WIN, claimLabel, codeLabel, isValidCodeString, codeFromString } from "./game.js";

const args = process.argv.slice(2);
let seed = Date.now() % 2 ** 31;
const si = args.indexOf("--seed");
if (si !== -1 && args[si + 1]) seed = Number(args[si + 1]) || seed;

const m = new Match(seed);
const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => rl.question(q);
const say = (s = "") => console.log(s);

function parseBid(line) {
  const t = line.trim().toUpperCase();
  const mt = t.match(/^([1-3])\s*([A-E])$/);
  if (!mt) return null;
  return { n: Number(mt[1]), sym: mt[2] };
}

function showProfile() {
  const rows = m.bot.profileSummary();
  say("  Bot's honesty ledger for you (claim: made/caught-lying):");
  if (rows.length === 0) say("    (no resolved claims yet)");
  for (const r of rows) say(`    ${r.claim}: ${r.made} made, ${r.caught} caught lying`);
}

function reportRoundEnd(ev) {
  const who = ev.claimant === "human" ? "You" : "Bot";
  say(`  ${who} claimed ${claimLabel(ev.challengedClaim)}; ${who === "You" ? "your" : "bot's"} code was ${codeLabel(ev.claimantCode)}`);
  say(`  Claim was ${ev.claimWasTrue ? "TRUE" : "FALSE"} — ${ev.winner === "human" ? "you win" : "bot wins"} the round.`);
  say(`  Score: you ${ev.score.human} — ${ev.score.ai} bot`);
}

say(`bluffcode — match to ${ROUNDS_TO_WIN} round wins  (seed ${seed})`);
say(`Hidden codes are ${CODE_LEN} symbols from ${SYMBOLS.join("")}. Bid = "my code contains at least N of X".`);
say("Raise the bid or challenge. Bluffing is allowed — but the bot keeps notes on you.");

while (!m.matchWinner) {
  if (!m.round) {
    say();
    const raw = (await ask(`Round ${m.roundNo} — your hidden code (e.g. ABD, ? = random): `)).trim();
    let code;
    if (raw === "?" || raw === "") {
      const rng = m.rng;
      code = [0, 1, 2].map(() => SYMBOLS[Math.floor(rng() * SYMBOLS.length)]);
      say(`  Your code: ${codeLabel(code)}`);
    } else if (isValidCodeString(raw)) {
      code = codeFromString(raw);
    } else {
      say(`  Invalid code. Use exactly ${CODE_LEN} symbols from ${SYMBOLS.join("")}.`);
      continue;
    }
    const ev = m.startRound(code);
    say(`  Round ${ev.roundNo} — ${ev.starter === "human" ? "you bid first" : "bot bids first"}.`);
    continue;
  }

  if (m.round.turn === "human") {
    const last = m.round.lastBid;
    say();
    say(`  Last bid: ${last ? `${claimLabel(last)} (by bot)` : "(none yet)"}   Your code: ${codeLabel(m.round.humanCode)}`);
    const line = await ask("  Your move [bid like 2B | c = challenge]: ");
    const t = line.trim().toLowerCase();
    if (t === "c" || t === "challenge") {
      const ev = m.humanChallenge();
      reportRoundEnd(ev);
      continue;
    }
    const claim = parseBid(line);
    if (!claim) {
      say("  Enter a bid like 2B (N=1..3, symbol A-E) or 'c' to challenge.");
      continue;
    }
    try {
      const ev = m.humanBid(claim);
      say(`  You bid ${claimLabel(ev.claim)}.`);
    } catch (e) {
      say(`  Illegal move: ${e.message}`);
    }
    continue;
  }

  // Bot's turn. Show its read before it acts? No — reveal only after acting.
  const humanBidNow = m.round.lastBid;
  const ev = m.aiTurn();
  if (ev.event === "bid") {
    say(`  Bot bids ${claimLabel(ev.claim)} [${ev.reason}]`);
  } else {
    const pFalse = humanBidNow ? m.bot.falseProbability(humanBidNow) : NaN;
    say(`  Bot challenges your ${claimLabel(humanBidNow)} (it estimated ${(pFalse * 100).toFixed(0)}% false) [${ev.reason}]`);
    reportRoundEnd(ev);
  }
}

say();
say(m.matchWinner === "human" ? "You win the match!" : "Bot wins the match.");
showProfile();
rl.close();
