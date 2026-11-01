# AI Dungeon compatibility and evidence

Checked during release preparation on **2026-09-20**. “Verified in documentation” is not “tested in an adventure.”

| Area | Evidence | What SAL does / remaining verification |
| --- | --- | --- |
| Library and three modifier hooks | [Official scripting guide](https://help.aidungeon.com/scripting); existing package layout | Supplies four complete tab files. Verify editor installation and hook execution live. |
| `state`, Story Cards, history and info | Official guide; SAL and bundled source | Uses state for persistence. Local tests serialize across hooks; backend saving is unverified. |
| Empty Input/Output, `stop`, `state.message` | Official guide documents Phoenix limitations | Uses nonempty placeholders and utility model calls. Verify costs/display on your current client. |
| `addStoryCard` / `updateStoryCard` | Official guide documents index-based helpers | SAL rediscovers by keys and reports failed writes and keeps the previous saved arc. Verify visible card after reload. |
| `info.maxChars` and `memoryLength` | Official guide documents context metadata | Budgets the planning suffix and prioritizes recent narrative. Token/server truncation still needs inspection. |
| Extra card arguments, `title`, `description`, `{returnCard:true}` | Pinned [Inner Self implementation](https://github.com/LewdLeah/Inner-Self/blob/297a1a04c0e11b41f69e3e57a607b47eee34334b/src/library.js) | Combined package relies on richer card behavior not fully specified by the guide. Test NPC brain/config creation live. |
| Live mutation of Story Card objects | Existing SAL 1.3.8 and pinned upstream implementation | Retained for compatibility, not independently verified against the hosted service. |
| Modern JavaScript | Syntax and behavior tested locally; bundled upstream usage | Combined code uses private fields, static blocks, lookbehind, `findLast`, `replaceAll`, `Map`, `Set`, `Proxy`, and `globalThis`. No claim of support for older JS sandboxes. |
| Retry, erase, undo, Continue without Input | Client-dependent; upstream includes retry heuristics | SAL does not transactionally roll back its turn counter or cards. Run the manual cases. |
| Model compliance | Cannot be established with mocked outputs | Test actual models/response lengths. Prompts are text, not privileged system roles enforced by the runtime. |
| Networking and host APIs | Source inspection | SAL does not request network/filesystem/browser/Node access. Development tools use Node outside AI Dungeon. |
| Optional LSI evaluation | Pinned Auto-Cards implementation | `isolateLSIv2` uses `eval` for intentionally enabled card scripts. It is off by default; do not mistake it for a security boundary. SAL does not evaluate generated arc text. |

The [archived Latitude scripting repository](https://github.com/latitudegames/Scripting) explicitly points readers to the current Guidebook. Historical examples are not the current runtime specification. The official guide specifies **16 MB of memory and a 2-second execution timeout per hook**; local Node tests do not reproduce that memory limit. Auto-Cards' internal 38,000-character spillover heuristic is not a verified platform limit.

## Supported release target

- AI Dungeon scenario scripts using Library/Input/Context/Output.
- SAL alone, or this repository's pinned combined package.
- Common raw Story commands and the tested English Do/Say wrappers.

Other runtimes, Live Script Interface configurations, future Inner Self versions, additional mods, multiplayer names, and alternate client execution orders require their own acceptance tests. For an unsupported Do/Say command wrapper, use the same command in **Story mode**.
