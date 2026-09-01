# SAL — Story Arc Light

**Story Arc Light (SAL)** is a player-first story direction script for AI Dungeon.

SAL is designed for long-running stories that need future direction without forcing the player down a predetermined path. It uses **Story Arc Engine (SAE)** as its planning backend, then makes the generated arc lighter, more flexible, and subordinate to the player's newest choice.

## Features

- Generates 8 short, flexible future story possibilities.
- The player's newest explicit input always has priority over the planned arc.
- A pending arc-generation turn is deferred if the player enters a real action.
- Planned beats can be delayed, changed, replaced, or discarded when they no longer fit.
- Default arc refresh: every 35 story turns.
- Old arc items gradually clear every 5 turns.
- `/sal` or `/sal status` shows the current SAL status and stored arc.
- Optional automatic compatibility with **Inner Self**.

## Source Files

```text
src/
├── library.js
├── input.js
├── context.js
└── output.js
```

Each file corresponds to the matching AI Dungeon scripting tab.

## Requirement — Story Arc Engine

SAL currently uses **Story Arc Engine by Yi1i1i** as its underlying arc-generation engine:

https://github.com/Yi1i1i/Story-Arc-Engine

The original Story Arc Engine repository does not currently include a software license file, so its source code is not copied into this repository. Install SAE from the original repository first.

## Installation — SAL + SAE

1. Install the current Story Arc Engine scripts from the original SAE repository.
2. In AI Dungeon's **Library** tab, keep the SAE Library code and paste SAL's `src/library.js` **after it**.
3. Replace the **Input** tab with SAL's `src/input.js`.
4. Replace the **Context** tab with SAL's `src/context.js`.
5. Replace the **Output** tab with SAL's `src/output.js`.
6. Save the scripts and make sure scripting is enabled.

Library order:

```text
Story Arc Engine Library
SAL library.js
```

## Installation — SAL + SAE + Inner Self

Inner Self is optional. If you use it, install **Inner Self by LewdLeah** from:

https://github.com/LewdLeah/Inner-Self

Use this Library order:

```text
Inner Self library.js
Story Arc Engine Library
SAL library.js
```

Then use SAL's `input.js`, `context.js`, and `output.js` as the single hook scripts. SAL coordinates the systems so a SAL private planning call and an Inner Self private NPC call do not intentionally compete for the same AI response.

## Commands

- `/sal` — show SAL status.
- `/sal status` — show SAL status.
- `/redo arc` — request a new arc through SAE.
- `/help sae` — show SAE help.
- `/stop` — stop a pending SAE/SAL arc-generation call.

## Player Priority

When an arc refresh is waiting to use the next AI call and the player enters a real action instead, SAL defers the planning call. The player's action receives the normal story response first.

The planned arc is also stored as **optional guidance**, not destiny. The AI is instructed to adapt or discard planned beats whenever the player's actual choices move the story in a different direction.

## Credits

**SAL / Story Arc Light:** SeanL33316  
**Story Arc Engine:** Yi1i1i  
**Inner Self:** LewdLeah

SAL is not an official Latitude or AI Dungeon project.

## License

SAL-authored source code in this repository is released under the MIT License. See `LICENSE`.

Third-party projects retain their own copyright and licensing terms.
