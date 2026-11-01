# SAL 1.3.11 coordination audit

Prepared 2026-11-01 from main commit `306c604aff8749051cb463bc297d57a682604311` and reviewed release candidate `3305247df265d14557673b414a4f0620885f4b19`. This is local source and lifecycle validation, not live AI Dungeon acceptance testing.

## Resulting behavior

Normal Inner Self thought-and-story responses retain NPC context, can update NPC brains, receive optional SAL guidance, and advance SAL's visible-story counter. Actual private Auto-Cards work is postponed for typed player actions. SAL planning and utility calls remain separate from NPC memory processing.

The update retains v1.3.10's placement of optional guidance before Recent Story, compact notices, saved-arc timing, and slower pacing for five-to-seven-item arcs. It also incorporates the release candidate's failed-save rollback, parser bounds, strict settings, command recovery, and two documented Auto-Cards memory patches.

## Additional integration fixes

- The context helper uses the retained memory length when repositioning guidance after trimming, rather than the original `info.memoryLength` value.
- A Recent Story heading at the start is not duplicated, and a removed heading is restored after the retained memory prefix.
- An explicit Recent Story heading caps stale memory-length metadata so recent actions are not treated as old memory.
- Successful arc writes establish pacing metadata; rejected or failed writes preserve the prior metadata.
- Failed beat-removal writes do not advance the removal counter.
- Compact utility notices are removed before future story generation. Future possibilities are distinguished from completed events and NPC memories in guidance.

## Validation

- `npm test`: **135 passing local tests, zero failures**.
- The inherited 106 tests remain, with version, notice-text, and partial-arc timing expectations updated for the combined behavior.
- 29 additional tests exercise guidance ordering, heading restoration, context budgets, saved-arc timing, failed saves/removals, upgrades from v1.3.10, NPC memory plus guidance, and collisions between typed actions, SAL, and Auto-Cards.
- Tests run the actual bundled Inner Self/Auto-Cards library with fresh VM realms and JSON-serialized persistent state between hooks; isolated helper tests also remain.
- Repository checks verify syntax, package synchronization, version markers, local documentation links, executable examples, and the pinned upstream source after reversing its two documented patches.
- Both paste-ready packages share the same canonical SAL source and coordination hooks. No new runtime dependencies are required.

## Remaining acceptance work

Complete the [live checklist](LIVE_TEST_CHECKLIST.md) before publishing or merging this update. In particular, verify model compliance, hosted card persistence after reload, Retry/Undo, and sandbox resource use. Local tests supply model responses and simulate the card APIs; they cannot establish those hosted behaviors.

Main, the earlier release branch, installed scenarios, and adventure data are not changed by preparing the separate review branch. The older candidate PR remains available for its history; the new update incorporates that candidate and the newer main fixes together.
