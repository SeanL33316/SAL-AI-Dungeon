# SAL 1.3.9 release audit

Reviewed 2026-09-20 against PR #1's `102d646` release candidate, preserving the other chat's numbered-label parser fix, memory-compression prefix fix, package layout, examples, and card-write rollback behavior. This report describes source review and local execution, not completed AI Dungeon acceptance testing.

## Architecture and scope

`SAL-only/1-Library.js` is canonical SAL. It initializes/synchronizes state and cards before each hook. Input routes commands and protects explicit actions; Context selects narrative, private planning, or utility work; Output parses the owning task or advances narrative timing. Persistent SAL data lives in `state.SAL` and two editable cards. The combined package prepends pinned Inner Self/Auto-Cards code and coordinates those systems through the same hooks.

The review covered both packages, configuration, state transitions, commands, parsing, context budgeting, comments, existing tests, examples, documentation, licenses, version markers, and CI. Bundled upstream code was compared with its pinned source and its relevant execution paths were exercised. This does not independently certify every Auto-Cards or optional LSI feature.

## Confirmed defects addressed in this follow-up

| Finding | Correction / evidence |
| --- | --- |
| Disabling SAL still aged out arc items | Removal now checks enabled; regression crosses an actual removal turn. |
| Zero-width Continue classified as typed input | Ignore invisible placeholders for input classification; planning regression. |
| Thought-only Inner Self output advanced SAL | Count visible narrative only; full bundled Inner Self execution. |
| Auto-Cards memory cleanup discarded valid memories | Parenthesize conditional suffix; execute actual bundled `AutoCards(null)` path. |
| Postponement shortened existing delays and requested forced installation | Preserve longer delay and previous forced flag; actual Auto-Cards API test. |
| SAL could interfere with explicit `/ac` commands | Exempt upstream-recognized commands from background postponement/restoration. |
| Malformed state/card fields broke synchronization | Normalize SAL container, validate field types, test malformed JSON-like values. |
| No-op fallback helper falsely acknowledged failed writes | Read back the matching card entry; retain release branch's prior-arc rollback. |
| Returned card index could select an unrelated card in alternate hosts | Always rediscover by key; index/object/undefined/wrong-index cases. |
| Stop immediately requeued an already-due refresh | Schedule the next automatic attempt one interval later. |
| A clipped planning heading could authorize Output capture | Require the full prompt plus reserved story space; fail with a utility explanation. |
| Context memory could crowd out newest narrative; empty-block path bypassed budget | Reserve recent narrative and apply bounds without a guidance block. |
| Partial settings values/comments were treated as assignments | Validate exact lines; preserve user text and report warnings. |
| Oversized generated data and utility snapshots enlarged persistent state | Bound parser input/items and legacy snapshots; delimit new utility output. |

Optional debug logging, missing-Library diagnostics, source synchronization tooling, vendor provenance checks, installation/update instructions, concrete examples, API documentation, and an issue template accompany the fixes.

## Validation

- **106 passing local tests, zero failures**, Node.js 24.19.0.
- The original release branch's 36 tests remain intact and passing.
- New tests run fresh VM realms and serialize state/cards between hooks, including actual combined-library execution and the documented JavaScript add-on.
- Repository checks validate all eight paste-ready files, version markers, canonical copies, local Markdown links, example syntax, and the upstream hash after reversing exactly two documented patches.
- `git diff --check` passes.
- CI runs the same checks on Node.js 22 and 24. Consult the PR's current check results for hosted completion.
- **Live AI Dungeon tests remain unchecked.** Local VM timing is not a hosted 16 MB memory-limit test or proof of model compliance.

## Final audience review

- **New user:** README explains purpose, package choice, opening the editor, copying Raw files, saving, first-run commands, expected cards, model-call costs, updating and troubleshooting. Examples include a real opening and commented settings.
- **Script creator:** architecture reference identifies persistent state, hook ownership, public extension helpers, configuration precedence and custom-fork migration notes. The combined example explains exact NPC/player configuration fields.
- **Maintainer:** canonical-source tooling prevents package drift; regression tests cover cross-hook lifecycle and failure paths; provenance isolates vendor patches. Existing files and upstream attribution remain recognizable.

## Compatibility and changes

No breaking changes to supported commands, file paths, or documented settings keys. Custom forks may need adjustments: use one settings assignment per line; explicitly save creator-written settings; do not parse exact utility display formatting; respect generated-text bounds. See [upgrade notes](ARCHITECTURE.md#upgrade-notes-for-custom-forks).

## Remaining release gates and risks

Complete [the live checklist](LIVE_TEST_CHECKLIST.md) in both packages, including reload persistence, Continue/Retry/Undo, player-action conflicts, NPC thought-only output, Auto-Cards generation/compression, and long-context/resource behavior. Official API evidence and source-derived assumptions are separated in [compatibility notes](COMPATIBILITY.md).

Keep PR #1 open and `main` unchanged until those checks pass. Then merge the reviewed candidate and create the public release/tag. The code and documentation are prepared for that smoke test; the project is not yet verified for unrestricted public release.

## Future work, separate from release gates

- Define explicit Retry/Undo counter semantics if live testing exposes drift.
- Expand command-wrapper handling beyond tested English Do/Say forms.
- Benchmark large NPC/card sets in the hosted sandbox and establish practical configuration guidance.
- Revisit the two local upstream patches when updating Inner Self/Auto-Cards; do not silently swap vendor versions.
