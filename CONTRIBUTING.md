# Contributing

Thanks for considering a contribution to bluffcode!

## Ground rules

- Zero runtime dependencies is a design goal — argue carefully before adding any
- Pure modules stay pure: no IO in `game.js`, `ai.js`, or `engine.js`
- Every bot decision carries a `reason` code; keep it that way
- New behavior requires tests; determinism must never break (same seed ⇒ same transcript)

## Workflow

1. Fork / branch from `main`
2. `npm test` must pass (Node's built-in test runner)
3. `npm run demo` must still run cleanly and deterministically
4. Update `CHANGELOG.md` for user-visible changes
