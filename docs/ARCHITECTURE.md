# Architecture

## Package layout

SAL is shipped in two forms:

- `SAL-only/` — standalone SAL.
- `src/` — upstream Inner Self + bundled Auto-Cards followed by the same SAL Library implementation, plus coordinated hooks.

Each package maps directly to AI Dungeon's four scripting tabs.

## Lifecycle

A normal AI Dungeon model turn is coordinated roughly as:

1. **Library** — executes before each hook, initializes `state.SAL`, migrates legacy cards, and synchronizes editable cards. Ordinary globals do not persist across hooks.
2. **Input** — SAL identifies commands and whether the user supplied a real player action.
3. **Context** — SAL/Inner Self/Auto-Cards decide whether the call is ordinary narrative work or private system work, then modify the prompt/context.
4. **Model generation**
5. **Output** — private results are consumed by their owner; ordinary narrative output is processed and SAL advances its turn counter.

The key v1.3.9 distinction is between **queued planning** and **capturing Output**. `pendingGeneration` means SAL intends to run private planning; `captureGeneration` becomes true only after the SAL planning prompt was actually attached in Context.

## Persistent SAL state

SAL stores runtime data under `state.SAL`, including:

- enabled/turn/timing fields;
- the current arc;
- queued/capture/deferred planning state;
- generation reason/status;
- parser diagnostics;
- context-trimming diagnostics;
- Story Card synchronization status.

`s.version` is updated to the current SAL version during state initialization.

## Story Cards

SAL owns two user-facing cards:

- `SAL Settings`
- `Current Story Arc`

Legacy keys beginning with `/` are migrated.

Direct mutation of the live Story Card object is the persistence path inherited from SAL and Inner Self; hosted persistence still requires a reload test. v1.3.9 treats arc persistence transactionally: if a card write fails, SAL keeps/returns to the previously saved state rather than reporting a successful update.

## Planning

`SAL_scheduleIfDue()` queues planning without capturing the current model output.

`SAL_generationContext()` appends the private planning prompt within `info.maxChars`. It requires the complete prompt plus reserved story space to fit. Otherwise it cancels that attempt and queues an explanatory utility response; a truncated heading cannot authorize capture.

`SAL_processGeneratedOutput()` parses common numbered, bracketed, bullet, JSON-array, and compact-line formats. A valid saved result requires at least five usable text items.

## Context budgeting

`SAL_appendContextBlock()` preserves the AI Dungeon context limit. Optional arc guidance larger than half the available character budget is omitted. Remaining budgeting reserves recent narrative before memory, and respects a zero-length body budget. `info.maxChars` is an estimate, not a token guarantee.

## Combined-package coordination

The combined package distinguishes:

- **normal Inner Self thought + story turns** — narrative output remains visible, SAL guidance can be injected, and SAL's story counter advances;
- **true private Inner Self/Auto-Cards work** — signaled by private stop/event state, consumed without advancing SAL's story counter;
- **SAL private planning** — SAL exclusively owns the planning model call;
- **explicit player actions** — highest priority.

When enabled Auto-Cards work collides with a typed player action, SAL calls the upstream `AutoCards().API.postponeEvents(...)` API so the background event can run later instead of replacing the action. Longer existing postponements and the integration’s forced-install flag are preserved. Explicit `/ac` commands retain upstream behavior.

## Bundled upstream code

The combined Library contains upstream Inner Self and Auto-Cards source. Keep upstream attribution and license intact.

v1.3.9 carries two narrow patches: memory-output cleanup preserves prose containing colons, and parentheses correct a memory-context conditional that discarded valid memories. [Provenance](../THIRD_PARTY_NOTICES.md) records the pinned source and both patches.

Avoid unrelated reformatting of the upstream bundle. It makes upstream comparison and future updates much harder.

## Canonical SAL synchronization

For this repository, the SAL Library in `SAL-only/1-Library.js` is the canonical standalone copy. The SAL section appended to `src/1-Library.js` must remain byte-for-byte identical.

Run `npm run sync` after editing the canonical files. Automated checks enforce identical Library tails and hooks, verify all version headers, and reverse the documented vendor patches to verify the pinned upstream hash.

## Tests

Run:

```bash
npm test
```

The harness uses Node's built-in test runner and `vm` module; there are no runtime npm dependencies.

## Extension points and internal functions

| Interface | Intended use |
| --- | --- |
| `SAL Settings` / `Current Story Arc` | Preferred user configuration and manual arc edits. |
| `SAL_state()` | Returns the mutable persistent SAL object with normalized defaults. |
| `SAL_saveSettings()` | Writes current state settings into the settings card; otherwise the next hook reloads card values. |
| `SAL_saveArc(previousArc)` | Saves `state.SAL.arc`; returns a boolean. On failure restores the supplied prior arc, or the card entry when omitted. |
| `SAL_extractArcResult(text)` | Parses generated text into `{count, numbered}`; empty `numbered` means rejection. |
| `SAL_defaultPrompt()` | Seeds new adventures; existing adventures keep `state.SAL.prompt`. |
| `SAL_statusText()` / `SAL_helpText()` | Returns display text; no extra turn handling by themselves. |

Other `SAL_*` functions are integration internals. In particular, call the stock Input/Context/Output hooks exactly once; do not independently toggle capture flags or call `SAL_onNormalOutput` a second time. Preserve both packages when maintaining a fork.

To change an existing adventure's prompt, assign `SAL_state().prompt` once using a namespaced migration flag. Retain the numbered 5–8-item format and player-priority instructions. Do not reset state on every Library execution.

Generated responses are limited to 16,000 characters and each accepted item to 500 characters. Manual card entries are not limited by those parser bounds. Utility displays use delimiters removed from later context; old snapshot cleanup is retained with bounded storage. Debug logging is opt-in, and status previews are capped at 320 characters.

The `.js` tests retain the original release branch's isolated SAL/stub integration checks. The `.mjs` harness runs the full combined Library with fresh VM realms and JSON serialization between hooks. Neither reproduces AI Dungeon's hosted sandbox or actual model behavior.

## Upgrade notes for custom forks

No supported command, installation path, or settings key was removed. The existing release branch's rollback-on-card-failure behavior remains in place. Default timing and prompt version are unchanged.

Settings parsing now requires one complete assignment per line, preventing comments, decimals and partial values from silently changing behavior. If an old custom card placed several assignments on one line, split them into separate lines using the README example. Creator code that sets state defaults must call `SAL_saveSettings()` once to persist them; ordinary Output no longer rewrites the settings card on every turn. Utility display text now has cleanup delimiters, so extensions must not depend on its exact text layout. Large generated responses/items beyond the documented bounds are rejected; shorten a custom planning prompt's requested output rather than depending on unlimited item size.
