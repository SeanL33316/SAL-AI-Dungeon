# Advanced example — Inner Self + SAL + Auto-Cards

This setup uses the combined package and enables the Auto-Cards integration bundled with Inner Self.

## Install

Use the complete `src/` package:

- Library → [`../src/1-Library.js`](../src/1-Library.js)
- Input → [`../src/2-Input.js`](../src/2-Input.js)
- Context → [`../src/3-Context.js`](../src/3-Context.js)
- Output → [`../src/4-Output.js`](../src/4-Output.js)

Follow the [beginner setup](beginner.md) first. Then set **Install Auto-Cards** to true in **Configure Inner Self** if you want automatic world/story cards. Read its separate in-game configuration guide before enabling extra automation.

## Suggested SAL tuning

Start from the defaults and change only one value at a time in `SAL Settings`.

Example for a slower long-form story:

```text
enabled = true
turnsPerAICall = 50
turnsPerElemRemoval = 7
```

Example for more frequent direction changes:

```text
enabled = true
turnsPerAICall = 25
turnsPerElemRemoval = 4
```

The minimums/limits are enforced by SAL, so extreme edits may be clamped.

## Coordination behavior in v1.3.9

SAL and Auto-Cards can both need private model turns. v1.3.9 separates **queued work** from **capturing the current output** and protects real player actions:

- SAL does not capture Output until its planning prompt was actually attached in Context.
- If Auto-Cards background work is due on a turn where the player typed a real action, that event is postponed for at least one turn, preserving a longer existing delay. Explicit `/ac` commands keep their upstream behavior.
- The player's action proceeds as the narrative call.
- Auto-Cards can perform the deferred work on a later Continue-like turn.
- Inner Self's normal “thought + story” behavior is not mistaken for a private-only task.

## Diagnostics

Use `/sal status` when something looks wrong. It includes planning/parser/card-sync details intended to help distinguish:

- no planning call yet;
- prompt attached but too few usable possibilities returned;
- Story Card synchronization trouble;
- deferred planning waiting for a suitable turn.

For a fresh planning call, use `/sal redo`. Avoid repeatedly forcing it during normal play unless you are testing; the regular interval is designed to keep SAL from interrupting the story too often.

## Modification rule

If you edit SAL's Library code, keep the SAL implementation in `SAL-only/1-Library.js` synchronized with the SAL tail embedded in `src/1-Library.js`. The automated tests intentionally fail if those two copies diverge.

## Optional creator add-on: set defaults once

Append this to the **end of the complete combined Library**, never in place of it. Customize the values and the namespace if another script uses `VillageSALExample`.

```javascript
// Run once per adventure; later manual card edits remain respected.
if (!state.VillageSALExample) {
  const settings = SAL_state();
  settings.turnsPerAICall = 50;
  settings.turnsPerElemRemoval = 0;
  SAL_saveSettings(); // Persist defaults into the editable settings card.
  state.VillageSALExample = true;
}
```

The Library runs before each hook, so an unguarded assignment would reset player settings repeatedly. See the [extension reference](../docs/ARCHITECTURE.md#extension-points-and-internal-functions) before changing the planning prompt or integrating other hooks.
