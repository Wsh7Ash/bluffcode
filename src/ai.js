// The AI opponent. Two signals drive its decisions:
//  1. baseProbability — how strong the claim would be for a random code.
//  2. honesty profile — how often THIS human has been caught lying when
//     making the same (count, symbol) claim in past rounds of the match.
// The bot itself only ever makes truthful bids; bluffing is the human's
// weapon, and catching bluffs is the bot's. Deterministic given the seeded
// RNG, so matches are reproducible.

import {
  MAX_RANK, claimKey, claimFromRank, claimRank,
  baseProbability, codeSatisfies, isRaise, isValidClaim,
} from "./game.js";

// Smoothing prior: assume ~2 unseen claims at ~30% bluff rate.
const PRIOR_MADE = 2;
const PRIOR_CAUGHT = 0.6;

export class Bot {
  constructor(rng) {
    this.rng = rng;
    // key "nSYM" -> { made, caught }
    this.profile = new Map();
  }

  recordHumanOutcome(claim, caughtLying) {
    const k = claimKey(claim);
    const e = this.profile.get(k) || { made: 0, caught: 0 };
    e.made += 1;
    if (caughtLying) e.caught += 1;
    this.profile.set(k, e);
  }

  /** Estimated probability that this human's claim is honest. */
  honestyEstimate(claim) {
    const e = this.profile.get(claimKey(claim));
    const made = (e ? e.made : 0) + PRIOR_MADE;
    const caught = (e ? e.caught : 0) + PRIOR_CAUGHT;
    return 1 - caught / made;
  }

  /** Estimated probability the human's current bid is FALSE. */
  falseProbability(claim) {
    return 1 - baseProbability(claim) * this.honestyEstimate(claim);
  }

  /** All strictly-higher claims that happen to be true of myCode. */
  truthfulRaises(lastBid, myCode) {
    const from = lastBid ? claimRank(lastBid) + 1 : 0;
    const out = [];
    for (let r = from; r <= MAX_RANK; r++) {
      const claim = claimFromRank(r);
      if (codeSatisfies(myCode, claim)) out.push(claim);
    }
    return out;
  }

  decide(state) {
    const { lastBid, myCode, roundNo, bidsThisRound } = state;

    // Forced: nothing higher exists.
    if (lastBid && claimRank(lastBid) >= MAX_RANK) {
      return { type: "challenge", reason: "no-higher-claim" };
    }

    const truthful = this.truthfulRaises(lastBid, myCode);

    if (lastBid) {
      const pFalse = this.falseProbability(lastBid);
      // Confidence grows slightly as the bidding ladder gets taller.
      const ladder = Math.min(0.12, bidsThisRound * 0.03);
      const threshold = 0.58 + ladder + 0.08 * this.rng();
      if (pFalse > threshold) return { type: "challenge", reason: "estimate-high" };
    }

    // Occasionally prefer a lower "safe" raise to keep the ladder short.
    if (truthful.length > 0) {
      const pick = Math.min(truthful.length - 1, Math.floor(this.rng() * Math.min(3, truthful.length)));
      return { type: "bid", claim: truthful[pick], reason: lastBid ? "truthful-raise" : "opening" };
    }

    // No truthful raise exists and the bid passed the trust check: challenge anyway.
    return { type: "challenge", reason: "cornered" };
  }

  profileSummary() {
    const rows = [...this.profile.entries()].sort();
    return rows.map(([k, e]) => ({ claim: k, made: e.made, caught: e.caught }));
  }
}

/** Validate an action object coming from the human (or tests). */
export function isValidAction(a) {
  if (!a || typeof a !== "object") return false;
  if (a.type === "challenge") return true;
  if (a.type === "bid") return isValidClaim(a.claim);
  return false;
}
