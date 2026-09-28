# Project Spec — bluffcode

- **Name:** bluffcode
- **Category:** game
- **Target user:** casual players who enjoy liar's-dice / social-deduction style games in a terminal
- **Problem:** AI opponents in bidding/bluffing games are usually memoryless; the same trick works every round
- **Solution:** a hidden-code bidding duel where the bot keeps a per-claim honesty ledger of the human and adapts its challenge threshold accordingly
- **Core workflow:** enter hidden code → alternate bids raising a 15-claim ladder → challenge → reveal → score → repeat to 3 wins → ledger summary
- **Must-have features:** strict claim ordering; legality enforcement; challenge resolution; per-claim honesty profiling with smoothing; seeded determinism; reason codes on bot decisions
- **Nice-to-have features:** self-playing demo transcript; honesty ledger display; loser-starts-next rule
- **Stack:** Node.js (≥18) ES modules, zero runtime dependencies, node:test
- **Test strategy:** unit tests for claim math (ordering, closed-form probabilities), AI invariants (truthful opening, monotone raises, forced challenge, trust adaptation), engine rules (turn enforcement, resolution sides, loser-starts, determinism across seeds)
- **Demo/result strategy:** `npm run demo` produces `results/demo-transcript.txt` from a fixed seed
- **Safety considerations:** fully offline; no network, no persistence, no secrets
- **Definition of done:** all tests pass; demo runs deterministically; README/docs complete; no placeholder code
