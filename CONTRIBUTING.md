# Contributing

Thanks for helping improve SAL.

## Before changing code

This repository contains both SAL-authored code and bundled upstream code.

- SAL standalone code lives in `SAL-only/`.
- The combined `src/1-Library.js` also contains **Inner Self and Auto-Cards by LewdLeah**.
- SAL was developed from the Story Arc Engine concept/system by **Yi1i1i**.

Keep credits and license notices intact.

## Development rules

1. Make behavior changes on a branch.
2. Keep `SAL-only/1-Library.js` and the SAL tail in `src/1-Library.js` synchronized.
3. Keep Input/Context/Output hooks small; shared behavior belongs in the Library when practical.
4. Preserve player-action priority over background/private work.
5. Do not make unrelated formatting changes to bundled upstream Inner Self/Auto-Cards code.
6. Add or update a regression test for every bug fix.
7. Use Node.js 22+, run `npm run sync` after canonical edits, then `npm test`.
8. For hook/runtime changes, run the [live-test checklist](docs/LIVE_TEST_CHECKLIST.md) in AI Dungeon before a public release.

## Tests

```bash
npm test
```

The test harness uses Node's built-in `node:test` and `vm` modules.

Important coverage includes parser formats and malformed values, queue/capture/defer lifecycle, Story Card persistence and rollback, context budgeting, standalone/combined synchronization, Inner Self hybrid narrative behavior, Auto-Cards/player-action coordination, and JavaScript syntax for every paste-ready file.

## Pull requests

A useful PR description should explain the user-visible problem, the turn/state sequence that reproduces it, what changed, tests added or updated, and live-test results when runtime behavior is involved.

Avoid changing upstream version labels unless the bundled upstream project itself was updated. Local compatibility patches should be documented separately.
