# Architecture

## Layers

```text
cli.js ──▶ engine.js ──▶ ai.js ──▶ game.js
                │                        ▲
                └──────▶ rng.js ─────────┘   (rng injected, pure)
```

- **game.js** — pure domain math. The claim lattice is the 15 pairs `(n, sym)` for `n ∈ 1..3`, `sym ∈ A..E`, totally ordered by `rank = (n−1)·5 + symIndex`. `baseProbability` computes the closed-form chance a uniformly random code satisfies a claim: `1−(4/5)³` for n=1, `3p²q+p³` for n=2, `p³` for n=3 with `p=0.2`. No IO, no randomness.
- **ai.js** — `Bot` consumes decision states and returns actions. Its honesty model is a per-claim Beta-like counter: `honesty(claim) = 1 − (caught + 0.6) / (made + 2)`. `falseProbability = 1 − baseProbability × honesty` combines the *a priori* strength of a claim with this human's track record on that exact claim.
- **engine.js** — `Match` owns rules and state: turn enforcement, strict-raise legality, challenge resolution (reveal claimant's code, satisfy check, score), round-over/match-over transitions, loser-starts-next. Emits plain event objects; never prints.
- **rng.js** — mulberry32; the only randomness source, injected at construction, so a seed fully determines a match.
- **cli.js / demo.js** — presentation only; drive the engine through its public methods.

## Decision policy

The bot only makes truthful bids. Given a bid to answer:

1. `no-higher-claim` — nothing ranks above; forced challenge.
2. `estimate-high` — `falseProbability` exceeds `0.58 + min(0.12, 0.03·bids) + 0.08·rand()`; challenge.
3. `truthful-raise` — pick one of its true raises (biased toward low raises).
4. `cornered` — no truthful raise exists but the bid passed the trust check; challenge anyway.

## Determinism

Same seed ⇒ same bot codes, same decisions, same transcript. The demo script fixes the human policy (lowest truthful raise, challenge when cornered) to keep the whole match deterministic. Tests assert byte-identical logs for equal seeds.
