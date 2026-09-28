# Results

## Environment
- OS: Windows 11 (win32, bash via Git Bash)
- Runtime: Node v24.13.0
- Dependency manager: npm (zero runtime dependencies)

## Validation performed
- install: PASS (`npm install`; no dependencies to fetch)
- build: PASS (stdlib-only ESM; all modules load)
- unit tests: PASS — 17/17 (`node --test`)
- integration tests: N/A (single-package CLI)
- lint: N/A (no linter configured; Node parses all files strictly at import)
- type check: N/A (plain JavaScript)
- demo run: PASS (`node scripts/demo.js 42` → `results/demo-transcript.txt`)

## Commands executed
```shell
npm install
node --test
node scripts/demo.js 42
```

## Observed result
- `node --test`: **17 tests, 17 pass, 0 fail** (claim ordering/probability math, AI truthful-opening and monotone-raise invariants, forced/cornered/estimate-high challenge paths, trust adaptation, challenge resolution sides, turn enforcement, loser-starts-next, identical-seed ⇒ identical log, different-seed ⇒ different log).
- `node scripts/demo.js 42`: full 4-round match, ends `MATCH OVER: winner=human final=3-0 seed=42`; transcript written to `results/demo-transcript.txt`. Re-running with seed 42 reproduces the same file byte-for-byte (deterministic engine + scripted human policy).

## Generated artifacts
- `results/demo-transcript.txt` — complete self-playing match transcript (seed 42)

## Known limitations
- The bot never bluffs; the mind-game loop is one-sided (human bluffs, bot adapts)
- Fixed code length (3) and symbol set (A–E); not yet configurable
