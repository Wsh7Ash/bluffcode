// Match state machine. The Match class owns the rules: turn order, claim
// legality, challenge resolution, scoring, and the bot's honesty profiling.
// It never prints or reads — the CLI and tests drive it through events.

import { mulberry32 } from "./rng.js";
import { randomCode, isRaise, isValidClaim, codeSatisfies, ROUNDS_TO_WIN } from "./game.js";
import { Bot } from "./ai.js";

export class Match {
  constructor(seed = Date.now() % 2 ** 31) {
    this.seed = seed;
    this.rng = mulberry32(seed);
    this.bot = new Bot(this.rng);
    this.score = { human: 0, ai: 0 };
    this.roundNo = 1;
    this.round = null;
    this.log = [];
  }

  /** Start a round. `first` is who bids first ("human" | "ai"); default: previous loser, human for round 1. */
  startRound(humanCode, first) {
    if (this.round) throw new Error("round already in progress");
    const starter = first || (this.roundNo === 1 ? "human" : this.lastLoser || "human");
    this.round = {
      humanCode: [...humanCode],
      aiCode: randomCode(this.rng),
      lastBid: null,
      lastBidder: null,
      bids: 0,
      turn: starter,
    };
    return { event: "round-start", roundNo: this.roundNo, starter, aiCode: this.round.aiCode };
  }

  _assertTurn(who) {
    if (!this.round) throw new Error("no round in progress");
    if (this.round.turn !== who) throw new Error(`not ${who}'s turn`);
  }

  humanBid(claim) {
    this._assertTurn("human");
    if (!isValidClaim(claim)) throw new Error("invalid claim");
    const { lastBid } = this.round;
    if (lastBid && !isRaise(lastBid, claim)) throw new Error("claim must be a strict raise");
    this.round.lastBid = { ...claim };
    this.round.lastBidder = "human";
    this.round.bids += 1;
    this.round.turn = "ai";
    this.log.push({ round: this.roundNo, actor: "human", action: "bid", claim });
    return { event: "bid", actor: "human", claim };
  }

  humanChallenge() {
    this._assertTurn("human");
    if (!this.round.lastBid) throw new Error("nothing to challenge");
    return this._resolve();
  }

  aiTurn() {
    this._assertTurn("ai");
    const d = this.bot.decide({
      lastBid: this.round.lastBid,
      myCode: this.round.aiCode,
      roundNo: this.roundNo,
      bidsThisRound: this.round.bids,
    });
    if (d.type === "bid") {
      this.round.lastBid = { ...d.claim };
      this.round.lastBidder = "ai";
      this.round.bids += 1;
      this.round.turn = "human";
      this.log.push({ round: this.roundNo, actor: "ai", action: "bid", claim: d.claim });
      return { event: "bid", actor: "ai", claim: d.claim, reason: d.reason };
    }
    this.log.push({ round: this.roundNo, actor: "ai", action: "challenge" });
    const ev = this._resolve();
    ev.by = "ai";
    return ev;
  }

  _resolve() {
    const { lastBid, lastBidder } = this.round;
    if (!lastBid) throw new Error("nothing to resolve");
    const claimant = lastBidder;
    const claimantCode = claimant === "human" ? this.round.humanCode : this.round.aiCode;
    const claimWasTrue = codeSatisfies(claimantCode, lastBid);
    const winner = claimWasTrue ? claimant : claimant === "human" ? "ai" : "human";

    if (claimant === "human") {
      this.bot.recordHumanOutcome(lastBid, !claimWasTrue);
    }

    this.score[winner] += 1;
    this.lastLoser = winner === "human" ? "ai" : "human";
    const matchOver = this.score.human >= ROUNDS_TO_WIN || this.score.ai >= ROUNDS_TO_WIN;

    const event = {
      event: "round-end",
      roundNo: this.roundNo,
      challengedClaim: lastBid,
      claimant,
      claimantCode,
      claimWasTrue,
      winner,
      score: { ...this.score },
      matchOver,
    };
    this.round = null;
    if (matchOver) this.matchWinner = this.score.human > this.score.ai ? "human" : "ai";
    this.roundNo += 1;
    return event;
  }
}
