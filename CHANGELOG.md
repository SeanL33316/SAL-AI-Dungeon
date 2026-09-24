# Changelog

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
