# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-09-28

### Added
- Hidden-code bidding duel vs a profiling AI (match to 3 round wins)
- Per-claim honesty ledger with smoothing; challenge threshold adapts to the human's caught lies
- Seeded reproducibility (`--seed`), deterministic self-playing demo writing `results/demo-transcript.txt`
- Reason codes on every bot decision (`opening`, `truthful-raise`, `estimate-high`, `cornered`, `no-higher-claim`)
- 17 unit tests covering game math, AI invariants, engine rules, and seed determinism
