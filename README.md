# bluffcode

A terminal bluffing game: hide a 3-symbol code, bid on what it contains, and face an AI that keeps a running honesty ledger on you.

## Problem

AI opponents in bidding/bluffing games are usually memoryless — the same trick works every round. bluffcode's opponent is *stateful about you*: every claim you make is remembered per `(count, symbol)`, and every time you are caught lying, the bot trusts that exact claim less in future rounds. Bluff early and your honest bids stop being believed.

## Features

- Hidden-code bidding duel (liar's-dice style) — match to 3 round wins
- Strictly raising claim ladder over 15 claims (`1A` … `3E`)
- Per-claim honesty ledger with Bayesian-style smoothing; challenge threshold adapts to *your* caught lies
- Seeded, reproducible matches (`--seed`) and a deterministic self-playing demo
- Every bot decision carries a `reason` code (`opening`, `truthful-raise`, `estimate-high`, `cornered`, `no-higher-claim`)
- Zero runtime dependencies, pure ES modules

## Example session

```text
bluffcode — match to 3 round wins  (seed 42)
Round 1 — your hidden code (e.g. ABD, ? = random): AAB
  Round 1 — you bid first.
  Last bid: (none yet)   Your code: A-A-B
  Your move [bid like 2B | c = challenge]: 2A
  You bid at least 2 x A.
  Bot bids at least 1 x C [truthful-raise]
  Last bid: at least 1 x C (by bot)   Your code: A-A-B
  Your move [bid like 2B | c = challenge]: c
  Bot challenges your at least 2 x A (it estimated 0% false) [estimate-high]
  ...
```

## Architecture

```text
cli.js ──▶ engine.js ──▶ ai.js ──▶ game.js
                │                        ▲
                └──────▶ rng.js ─────────┘   (rng injected, pure)
```

- `game.js` — pure claim math: 15-claim lattice, ordering, closed-form base probabilities
- `ai.js` — the bot: truthful-raise selection, per-claim honesty profiling, challenge thresholds
- `engine.js` — match state machine: turns, legality, challenge resolution, scoring
- `rng.js` — mulberry32 seeded PRNG (injected, so tests are deterministic)
- `cli.js` — readline UI; `scripts/demo.js` — self-playing transcript generator

## Requirements

- Node.js ≥ 18 (developed on Node 24)

## Installation

```shell
git clone https://github.com/Wsh7Ash/bluffcode.git
cd bluffcode
npm install   # no-op: zero dependencies
```

## Quick start

```shell
node src/cli.js            # random seed
node src/cli.js --seed 42  # reproducible match
```

## How to play

1. Each round, enter your hidden code: 3 symbols from `A B C D E`, repetition allowed (`?` or Enter rolls one for you).
2. Players alternate bids. A bid `N` + symbol means "my hidden code contains **at least N** copies of symbol". Every bid must strictly raise the previous one.
3. On your turn, either **bid** (e.g. `2B`) or **challenge** (`c`). On a challenge, the last claimant's code is revealed: if it satisfies the claim, the claimant wins the round; otherwise the challenger wins.
4. First to 3 round wins takes the match. The round loser bids first next round.
5. The bot plays honest bids only — but it remembers every claim you made and how often each got you caught. When the match ends it prints your honesty ledger.

## Configuration

| Flag | Meaning | Default |
|---|---|---|
| `--seed N` | PRNG seed for the bot and AI code rolls | time-based |

## Testing

```shell
npm test          # 17 tests: game math, AI invariants, engine rules, determinism
npm run demo      # self-playing match, writes results/demo-transcript.txt
```

## Project structure

```text
bluffcode/
├─ src/
│  ├─ cli.js        # interactive terminal client
│  ├─ engine.js     # match state machine
│  ├─ ai.js         # profiling bot
│  ├─ game.js       # pure claim/probability math
│  └─ rng.js        # seeded PRNG
├─ tests/           # node:test suites (game, ai, engine)
├─ scripts/demo.js  # deterministic self-play demo
├─ results/         # generated transcript
└─ docs/            # ARCHITECTURE.md, USAGE.md, PROJECT_SPEC.md
```

## Limitations

- The bot never bluffs, so the bluff–deterrence loop is one-sided by design (human bluffs, bot adapts)
- Fixed 5-symbol/3-slot code and 15-claim ladder; no CLI flags to change them yet
- Local two-player (human vs bot) only — no network play
- Terminal UI only

## Roadmap

- Optional bot bluffing with its own catch profile (symmetric mind games)
- Configurable symbol count / code length / ladder size
- Match history export (JSON) for post-game analysis
- Browser version sharing the same pure modules

## Security notes

Pure offline game: no network access, no eval, no persistence beyond stdout/files you explicitly generate.

## License

MIT — see [LICENSE](LICENSE).
