# Usage

## Play a match

```shell
node src/cli.js            # random seed
node src/cli.js --seed 42  # reproducible
```

You will be asked for a hidden code each round (3 symbols from `A B C D E`, repetition allowed; `?` or Enter rolls one randomly — it is printed for you).

On your turn either:

- **Bid** — `N` + symbol, e.g. `2B` means "my code contains at least two B". Must strictly raise the previous bid.
- **Challenge** — type `c`. The last claimant's code is revealed; if it satisfies the claim they win the round, otherwise you do.

First to **3 round wins** wins the match. The loser of a round bids first in the next one. After the match, the bot prints its honesty ledger for you (per claim: how many times you made it, how many times you were caught lying).

## Programmatic use

```js
import { Match } from "./src/engine.js";

const m = new Match(42);
m.startRound(["A", "A", "B"]);
m.humanBid({ n: 2, sym: "A" });
const ev = m.aiTurn();           // bot bids or challenges
// ev = { event: "bid", actor: "ai", claim: {n:1,sym:"C"}, reason: "truthful-raise" }
// or  { event: "round-end", claimWasTrue: true, winner: "human", score: {...}, matchOver: false }
```

All engine methods throw on illegal moves (wrong turn, non-raising claim, bid with no round in progress, starting a round twice).

## Demo transcript

```shell
node scripts/demo.js 42
```

Scripted human (always lowest truthful raise; challenges when cornered) vs the real bot; writes `results/demo-transcript.txt`. Same seed ⇒ identical file.
