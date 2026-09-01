# SAL — Story Arc Light for AI Dungeon

**SAL (Story Arc Light)** is a standalone AI Dungeon script for keeping long stories moving without forcing the player down a predetermined path.

SAL generates a lightweight set of future possibilities, feeds them back to the AI as optional guidance, and always gives the player's newest explicit choice priority.

## Features

- Fully standalone — **Story Arc Engine is no longer required**.
- Generates exactly **8 flexible future possibilities**.
- Player actions override/defer a pending SAL planning turn instead of being consumed by it.
- Stored arc beats are treated as optional guidance, not destiny.
- Default refresh: every **35 story turns**.
- Removes one older beat every **5 turns** to let the arc naturally progress.
- Creates editable `/SAL Settings` and `/Current Story Arc` Story Cards.
- `/sal` or `/sal status` shows current SAL status.
- `/redo arc` forces a fresh arc.
- `/stop` cancels a pending SAL generation.
- Optional compatibility with **Inner Self** when both Library codes are used together.

## Install

Open the `src` folder. Each file is the **complete code for that AI Dungeon scripting tab**.

1. Copy all of `src/library.js` into AI Dungeon's **Library** tab.
2. Copy all of `src/input.js` into the **Input** tab.
3. Copy all of `src/context.js` into the **Context** tab.
4. Copy all of `src/output.js` into the **Output** tab.
5. Save the scripts and make sure Scripts are enabled in AI Dungeon.

You do **not** need to download, merge, or paste Story Arc Engine first.

AI Dungeon currently requires the non-Library scripts to end with `modifier(text)`, and the supplied files already include the complete modifier wrappers.

## Using SAL with Inner Self

Inner Self is optional:

https://github.com/LewdLeah/Inner-Self

To combine them:

1. Put the complete **Inner Self Library** code in the Library tab.
2. Paste the complete **SAL `library.js`** underneath it.
3. Use SAL's complete `input.js`, `context.js`, and `output.js` files as the hook tabs.

SAL automatically detects `InnerSelf()` and coordinates private model calls so the two systems do not intentionally compete for the same output. A real player action still gets priority.

## Story Cards

SAL automatically creates two system Story Cards:

- `/SAL Settings` — editable settings such as refresh frequency.
- `/Current Story Arc` — the current flexible arc. You can manually edit it if you want.

Default settings:

```text
enabled = true
turnsPerAICall = 35
turnsPerElemRemoval = 5
attemptLimit = 3
```

## Commands

```text
/sal
/sal status
/redo arc
/stop
```

## Player-first behavior

When SAL is ready to refresh its arc, it normally uses the next Continue-style turn for its private planning call.

If the player types a real action instead, SAL defers that planning call and allows the player's action to receive the normal story response. The arc refresh can happen later.

The generated arc also explicitly tells the AI that beats may be delayed, changed, replaced, or discarded whenever the player's choices make them no longer fit.

## Credits

**SAL / Story Arc Light:** SeanL33316

SAL began as an experiment in making long-form story-arc guidance lighter and more player-driven. The original Story Arc Engine by Yi1i1i was an inspiration for exploring this kind of AI Dungeon story planning, but SAL v1.3.0 is a standalone implementation and does not include or require SAE source code.

SAL is not an official Latitude/AI Dungeon project and is not affiliated with Latitude.

## License

MIT License. See `LICENSE`.
