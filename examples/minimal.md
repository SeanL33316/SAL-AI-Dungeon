# Minimal example — SAL only

This is the simplest supported setup.

## Install

Use only the four files in `SAL-only/`:

- Library → [`../SAL-only/1-Library.js`](../SAL-only/1-Library.js)
- Input → [`../SAL-only/2-Input.js`](../SAL-only/2-Input.js)
- Context → [`../SAL-only/3-Context.js`](../SAL-only/3-Context.js)
- Output → [`../SAL-only/4-Output.js`](../SAL-only/4-Output.js)

Replace each AI Dungeon tab completely.

## A small story to test

Use this as the scenario opening, or adapt it to your own setting:

```text
You are Rowan, a traveler arriving at a riverside village. Mira, the bridge keeper,
asks whether you have seen a missing delivery wagon. Market day begins tomorrow.
You can help, ask questions, or go about your own business.
```

After generating an arc, try: `You decline the search and ask Mira where the inn is.` The model should respond to that choice; optional possibilities should not force acceptance. Model compliance must be checked in play.

## Recommended first test

Leave the generated `SAL Settings` card at its defaults:

```text
enabled = true
turnsPerAICall = 35
turnsPerElemRemoval = 5
```

Then:

1. Enter `/sal` and confirm SAL reports v1.3.9.
2. Play normally for several turns.
3. Use `/sal redo` if you want to force the first planning test instead of waiting 10 normal turns.
4. After a successful planning turn, open `Current Story Arc` and confirm it contains 5–8 optional possibilities.
5. Continue the story with an action that contradicts one possibility. The player's action should still be followed; the arc is guidance, not a command.

## Recovery

If a script error appears after installation, replace all four tabs again from `SAL-only/`. A mixed old/new install is the most common cause of missing SAL functions.
