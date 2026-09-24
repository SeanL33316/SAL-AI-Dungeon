# Story Arc Light (SAL) for AI Dungeon

**Story Arc Light (SAL) v1.3.9** gives AI Dungeon stories a lightweight, flexible sense of direction without turning an outline into a railroad.

This repository contains two ready-to-paste packages:

| Package | Use it when | Folder |
| --- | --- | --- |
| **SAL only** | You want Story Arc Light by itself | [`SAL-only/`](SAL-only/) |
| **Inner Self + SAL** | You want SAL together with LewdLeah's Inner Self, with the bundled Auto-Cards integration available | [`src/`](src/) |

You do **not** need to merge JavaScript by hand. Pick one package and replace the contents of all four matching AI Dungeon script tabs.

## Before installing

Use a scenario you own with scripting available (Simple Start or Character Creator). Back up existing scripts first; replacing the four tabs also replaces any other script installed there. No Node.js, npm, downloads of dependencies, or GitHub account are needed to play with SAL.

In the scenario editor, open **Details → Scripting**. Open each linked GitHub file below, select **Raw**, and copy its entire contents into the matching tab. Save all four tabs, then use **Play** to start a test adventure. Scripts belong to the scenario; its adventures share scripts but have separate state. See the [official scripting guide](https://help.aidungeon.com/scripting) if the editor differs from these instructions.

## Quick install

### Option A — SAL only

Paste these files into the matching AI Dungeon tabs:

1. **Library** → [`SAL-only/1-Library.js`](SAL-only/1-Library.js)
2. **Input** → [`SAL-only/2-Input.js`](SAL-only/2-Input.js)
3. **Context** → [`SAL-only/3-Context.js`](SAL-only/3-Context.js)
4. **Output** → [`SAL-only/4-Output.js`](SAL-only/4-Output.js)

### Option B — Inner Self + SAL

Paste these files instead:

1. **Library** → [`src/1-Library.js`](src/1-Library.js)
2. **Input** → [`src/2-Input.js`](src/2-Input.js)
3. **Context** → [`src/3-Context.js`](src/3-Context.js)
4. **Output** → [`src/4-Output.js`](src/4-Output.js)

**Important:** replace each tab's contents. Do not paste a second modifier wrapper underneath an older copy.

## First-run check

After saving the scripts and starting or continuing an adventure:

- SAL should create a **`SAL Settings`** Story Card.
- SAL should create a **`Current Story Arc`** Story Card.
- Enter **`/sal`** or **`/sal status`** to confirm SAL is active.
- A new story normally waits **10 story turns** before SAL schedules its first automatic arc.
- If you want to test immediately, use **`/sal redo`**.

For the combined package, Inner Self also creates its own configuration/brain cards as described by Inner Self. Set the player name and NPC names in the Inner Self configuration if you want its character-brain features.

## What SAL does

SAL periodically asks the model for a short set of possible future developments, stores them in a Story Card, and adds them to later narrative context as **optional guidance**.

The important rule is simple: **the player's newest explicit action wins.** SAL guidance can be delayed, changed, replaced, or discarded when the player takes the story somewhere else.

Default behavior:

- observes the first **10** normal story turns before the first automatic planning call;
- asks for up to **8** concise possibilities;
- accepts a useful partial result containing **5–8** possibilities;
- refreshes **35 story turns** after a planning attempt by default;
- removes one older possibility every **5 turns** by default;
- keeps an existing arc when a planning response is too short or unusable;
- defers background planning when the player types a real action;
- keeps SAL state and the visible `Current Story Arc` card synchronized.

The combined v1.3.9 coordination also prevents an Auto-Cards private generation event from replacing a typed player action. That background work is postponed so it can run on a later Continue-like turn.

## SAL commands

| Command | Purpose |
| --- | --- |
| `/sal` or `/sal status` | Show SAL status and diagnostics |
| `/sal help` | Show the command list |
| `/sal redo`, `/sal refresh`, or `/redo arc` | Request a fresh arc immediately |
| `/sal stop` or `/stop` | Cancel queued/deferred SAL planning |

Display-only commands use a tiny hidden model turn because the current AI Dungeon scripting environment does not provide a reliable zero-generation display path. SAL prevents those utility turns from advancing its story counter.

## Editable Story Cards

### `SAL Settings`

The main user-facing settings are:

- `enabled = true|false`
- `turnsPerAICall = 35`
- `turnsPerElemRemoval = 5`
- `debug = false` (optional failure logging)

Disabling SAL cancels queued/deferred planning and pauses guidance and item removal; its counter still tracks visible story outputs. `turnsPerAICall` accepts 5–500 and `turnsPerElemRemoval` accepts 0–100 (0 turns removal off). Removal uses the global SAL turn counter; it is age-based, not a check that an event happened.

Use one `name = value` assignment per line. `#` and `//` comments are allowed. Invalid values retain the previous setting; `/sal status` shows warnings. A changed refresh interval does not reschedule an already queued date. `/sal stop` cancels queued planning for a full interval.

### `Current Story Arc`

This contains SAL's current optional possibilities. You can read or edit it manually. SAL treats a non-empty manual edit as intentional. A blank card is repaired from state when an arc exists; disable SAL to pause it rather than blanking the card.

## Examples

Start with the example that matches how much setup you want:

- [Minimal — SAL only](examples/minimal.md)
- [Beginner — Inner Self + SAL](examples/beginner.md)
- [Advanced — Inner Self + SAL + Auto-Cards](examples/advanced.md)

## Troubleshooting

See [Troubleshooting](docs/TROUBLESHOOTING.md) for common installation mistakes, missing-library errors, blank arc cards, planning failures, command behavior, and recovery steps.

If you are validating a new release or a local modification, use the [AI Dungeon live-test checklist](docs/LIVE_TEST_CHECKLIST.md).

For maintainers and people modifying SAL, see [Architecture](docs/ARCHITECTURE.md) and [Contributing](CONTRIBUTING.md).

## Compatibility, limitations, and updating

SAL targets AI Dungeon's current four-tab scenario scripting environment. The combined package includes Inner Self 1.0.2 and Auto-Cards 1.1.3. [Compatibility evidence](docs/COMPATIBILITY.md) separates official API documentation, source-derived assumptions, and live tests still needed.

- Player priority is a prompt instruction; the model can still ignore it. Edit the arc or disable SAL if it pushes the wrong direction.
- Private planning and utility commands consume model generations. They do not advance SAL's story counter.
- Very large arc guidance is omitted for that turn to preserve story space. A planning prompt that cannot fit is rejected with a useful message.
- Retry/Undo and interaction with additional scripts require live testing. SAL does not promise transactional rollback of every adventure edit.
- Optional Auto-Cards Live Script Interface code execution is disabled by default. Only enable it with scripts you trust.

To update, back up your four tabs and customizations, replace all four with one matching package, save, and run `/sal status`. Keep existing SAL cards and state. Reapply intentional Library customizations after comparing the new source. See the [live checklist](docs/LIVE_TEST_CHECKLIST.md) before updating a public scenario.

## Automated tests

For maintainers, Node.js 22 or later runs a zero-dependency test harness for parser, persistence, lifecycle, package-sync, and combined-hook regressions.

```bash
npm test
```

GitHub Actions runs the same suite for pull requests and release branches.

## Reporting bugs

[Open an issue](https://github.com/SeanL33316/SAL-AI-Dungeon/issues) with the SAL version, package, steps, expected/actual behavior, exact error, and `/sal status`. Include the model and whether the problem followed Retry, Undo, or an update. Remove private story text before sharing logs. [Contributing](CONTRIBUTING.md) explains local checks and customization boundaries.

## Version 1.3.9 highlights

v1.3.9 hardens the public package around edge cases found during a full release audit:

- queued SAL planning no longer captures a model output before the private planning prompt is actually attached;
- disabling SAL clears queued/deferred planning;
- failed Story Card writes keep the previously saved arc instead of desynchronizing state;
- non-text JSON values cannot become fake arc items;
- oversized guidance preserves room for the newest story/player text;
- multiline numbered parsing no longer mistakes a trailing word such as “idea” for the next item label;
- combined Inner Self thought+story turns are treated as normal narrative turns;
- Auto-Cards background work is postponed when necessary to protect a typed player action;
- a bundled Auto-Cards memory-cleanup expression was narrowed so valid prose after earlier colons is not discarded;
- automated regression tests and public setup/troubleshooting documentation were added.

See [CHANGELOG.md](CHANGELOG.md) for the release notes.

## Credits and upstream projects

### Inner Self
Created by **LewdLeah**.  
Original project: https://github.com/LewdLeah/Inner-Self

### Auto-Cards
Created by **LewdLeah** and bundled with the upstream Inner Self source used by the combined package.

### Story Arc Engine (SAE)
Created by **Yi1i1i**. SAL was developed from the Story Arc Engine story-arc concept/system.  
Original project: https://github.com/Yi1i1i/Story-Arc-Engine

## License

SAL-authored code is released under the MIT License in [`LICENSE`](LICENSE).

Inner Self and its bundled Auto-Cards source remain attributed to **LewdLeah** and retain the upstream MIT license preserved in [`LICENSE-INNER-SELF`](LICENSE-INNER-SELF).

Story Arc Engine remains the work of **Yi1i1i**; refer to the upstream project for its source and terms.

See [third-party provenance and local patches](THIRD_PARTY_NOTICES.md).

This repository is a community project and is not an official Latitude / AI Dungeon project.
