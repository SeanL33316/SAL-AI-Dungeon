# Changelog

## 1.3.11 — combined coordination update (2026-11-01)

- Integrates the reviewed v1.3.9 release candidate into v1.3.10 without losing player-priority guidance placement, compact notices, or saved-arc pacing.
- Keeps Inner Self NPC thought-and-story calls narrative: NPC memories can update while SAL guidance remains present and SAL counts the visible story turn.
- Defers private Auto-Cards work for typed actions and isolates SAL planning/status calls from NPC memory updates.
- Reserves story context before optional guidance; restores a trimmed Recent Story heading after retained memory and tolerates stale memory-length metadata when the heading is present.
- Preserves arc pacing on existing v1.3.10 adventures and on failed saves; only confirmed removal writes advance the beat counter.
- Labels SAL possibilities as future options rather than completed events or shared NPC knowledge.
- Retains the release candidate's persistence rollback, parser bounds, settings validation, stop/disable handling, vendor memory fixes, documentation, and CI.
- Adds 29 integration regressions to the inherited 106-test suite; 135 local tests pass. Live AI Dungeon acceptance testing remains outstanding.

## 1.3.10 — player-action priority

- Moved optional guidance before Recent Story so the latest player action stays after the arc guidance.
- Added compact refresh notices and preserved the Recent Story heading during long-context trimming.
- Based beat removal on the saved arc's turn and extended pacing for partial arcs.

## 1.3.9 — release candidate (not yet tagged)

### Fixed

- Separated queued SAL planning from Output capture so a due planning event cannot consume a model response before the private planning prompt runs.
- Cancels queued, active, and deferred SAL planning when SAL is disabled.
- Rolls SAL state back when a `Current Story Arc` write fails, preventing state/card desynchronization.
- Rejects non-string JSON values during arc parsing.
- Preserves room for the newest base/player context when injected SAL guidance is larger than the available context window.
- Prevents multiline parser normalization from treating a trailing word such as `idea` on one line as the label for the next numbered item.
- Correctly treats Inner Self “thought + story continuation” output as a normal narrative turn.
- Protects typed player actions from enabled Auto-Cards private work by postponing the background event for one turn.
- Narrows a bundled Auto-Cards memory-cleanup expression that could discard valid prose through the final colon.

- Stops arc-item removal while disabled and ignores invisible thought-only outputs when counting story turns.
- Recognizes zero-width Continue input; keeps Input nonempty for Phoenix.
- Repairs malformed SAL state and defensively handles malformed imported card fields.
- Verifies fallback card writes instead of claiming success when a helper does nothing; rediscovers newly created cards by key.
- Cancels a stopped refresh for a full interval and prevents capture from partially clipped planning prompts.
- Preserves longer Auto-Cards delays and its forced-install flag; exempts explicit `/ac` commands.
- Corrects a second Auto-Cards memory bug caused by conditional-operator precedence.
- Preserves settings comments and validates whole assignment values; adds optional debug logging and generated-data limits.

### Added

- Node regression/integration test harness with no runtime dependencies.
- GitHub Actions CI for pull requests, `main`, and release branches.
- Minimal, beginner, and advanced installation examples.
- Troubleshooting, architecture, contribution, and AI Dungeon live-test documentation.

### Changed

- Synchronized SAL version markers across the standalone package.
- Expanded the root and package READMEs for public installation and recovery.

## 1.3.8

- Persisted SAL arcs through live Story Card objects.
- Added/expanded Story Card recovery and planning diagnostics.
- Improved acceptance of partial 5–8-item arc results and avoided rapid automatic retry loops.
