# Beginner example — Inner Self + SAL

Use this when you want persistent NPC thoughts from Inner Self and lightweight story direction from SAL.

## Install

Use only the four files in `src/`:

- Library → [`../src/1-Library.js`](../src/1-Library.js)
- Input → [`../src/2-Input.js`](../src/2-Input.js)
- Context → [`../src/3-Context.js`](../src/3-Context.js)
- Output → [`../src/4-Output.js`](../src/4-Output.js)

Replace each AI Dungeon tab completely.

## Setup

1. Start the adventure and confirm SAL creates `SAL Settings` and `Current Story Arc`.
2. Enter `/sal`; the status should identify SAL v1.3.9.
3. Open **Configure Inner Self** after a normal story turn.
4. Set **First name of player character** to `Rowan`. At the bottom of the card’s **Notes**, beneath its instructions, put `Mira` on its own line. Use names matching your story; the player does not belong in the NPC list.
5. Leave SAL at its defaults at first.

## What to expect

On ordinary story turns, Inner Self can perform a character thought operation **and** allow the story to continue. SAL treats that as a real narrative turn, so the SAL counter continues normally and optional arc guidance can still be present.

Private background work is treated differently: SAL does not count a model call that exists only for SAL planning, Inner Self/Auto-Cards private work, or a SAL utility command as a normal story turn.

## First-run check

- A normal NPC thought+story output should still show story prose.
- `/sal status` should show the turn counter increasing after normal narrative outputs.
- `/sal redo` should produce a private SAL planning result and then return to normal play.
- A typed player action should not be swallowed just because a background task became due.

## Recovery

If Inner Self works but SAL functions are reported as undefined—or the reverse—replace all four files from `src/`. Do not mix `src/` hooks with the `SAL-only/` Library.

## Optional gentle pacing

Once the default setup works, replace **SAL Settings → Entry** with:

```text
# Keep guidance and planning enabled.
enabled = true
# Wait 50 narrative turns after a planning attempt before refreshing.
turnsPerAICall = 50
# Keep possibilities until a refresh or manual edit; 0 turns removal off.
turnsPerElemRemoval = 0
# Turn on only while investigating a failure.
debug = false
```

This does not change the initial ten-turn observation period. Open **Current Story Arc → Entry** to edit a possibility to fit your setting. A non-empty edit is adopted on the next hook. Use `/sal status` to confirm the effective settings.
