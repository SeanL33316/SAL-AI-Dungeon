# Troubleshooting

This guide assumes SAL v1.3.9.

## Missing SAL Library or undefined SAL function

The Input hook is running without the matching SAL Library.

**Fix:** replace all four AI Dungeon tabs from the same package:

- SAL only → `SAL-only/`
- combined → `src/`

Do not mix the Library from one package/version with hooks from another.

## SAL cards do not appear

Confirm:

1. all four script tabs were saved;
2. Scripts are enabled;
3. the Library tab contains the full `1-Library.js`;
4. there is only one set of Input/Context/Output modifier wrappers.

Then enter `/sal`. If the command itself fails with a missing function, reinstall the four matching files.

## No arc has been generated yet

That can be normal. A new story waits 10 normal story turns before the first automatic planning call.

To test immediately, use:

```text
/sal redo
```

Then inspect `/sal status` and `Current Story Arc`.

## SAL found fewer than five possibilities

SAL accepts 5–8 useful items. If the model returns fewer than five usable items, SAL does not replace a good existing arc with a weak result.

The status output records how many items were recognized and a short planning-output preview. SAL waits the normal refresh interval rather than entering an automatic retry loop. Use `/sal redo` only if you deliberately want another attempt sooner.

## `Current Story Arc` is blank but SAL says it had an arc

v1.3.9 keeps persistent SAL state and the live Story Card synchronized. If AI Dungeon presents an unexpectedly blank arc card while state still has a valid arc, SAL attempts to repair the visible card.

If the problem repeats:

1. enter `/sal status` and note the card-sync status;
2. replace all four matching script files;
3. keep the existing Story Cards/state unless you specifically want a full reset.

## A typed action was replaced by background Auto-Cards work

The v1.3.9 combined package postpones enabled Auto-Cards private generation when a real player action is present.

If this still happens, check for a mixed-version installation first. If the complete release still reproduces it, report the action and task sequence; reinstalls cannot resolve every integration issue. Replace **all four** files from `src/`.

## Inner Self thought output seems to pause the SAL counter

Normal Inner Self “thought + story continuation” turns should count as narrative turns in v1.3.9. Private tasks and invisible thought-only outputs are excluded.

Reinstall the four combined files and check `/sal status` before and after an ordinary narrative turn.

## A SAL command appears to use a model turn

This is expected for display-only commands on the current AI Dungeon scripting environment. The script uses a tiny hidden generation and replaces its output with the command response because the available stop/message paths are not reliable for this use.

SAL does not count that utility call as a story turn.

## Output is blank or contains only an invisible character

AI Dungeon can error on a truly empty Output. The hooks use a zero-width placeholder in private/utility paths when necessary. On an ordinary narrative turn, visible story prose should remain.

If an ordinary story turn repeatedly becomes blank, use `/sal status`, check whether private work is active, and reinstall all four package files if the state looks inconsistent.

## Disabling SAL while work is queued

Set:

```text
enabled = false
```

in `SAL Settings`.

v1.3.9 clears queued, active, and deferred SAL planning state when disabled. Re-enable it later by setting `enabled = true`.

## Full safe reinstall

A reinstall does not require deleting the Story Cards.

1. Choose **one** package: `SAL-only/` or `src/`.
2. Replace Library, Input, Context, and Output with the four files from that package.
3. Save.
4. Enter `/sal status`.
5. Use `/sal redo` only if you want an immediate planning test.

Do not append new files beneath old wrappers.

## Story Card save failed

SAL retains the previously saved arc and reports the failed attempt. A helper returning normally is not enough: SAL checks the resulting card entry. Verify that cards are editable and the correct package is installed, then retry `/sal redo`. Keep a copy of manual edits before reinstalling. Hosted persistence must also be checked by reloading the adventure.

## Planning prompt could not fit / guidance omitted

Inspect `/sal status`. Use a larger available context, shorten a customized planning prompt, or shorten an oversized manual arc. SAL keeps an existing arc when planning cannot fit and waits the normal interval; use `/sal redo` after adjusting. Omitting optional guidance for one turn does not delete the arc.

## Settings edits seem ignored

Edit the card's **Entry**, one assignment per line. Use `true`/`false` and whole non-negative integers. `/sal status` reports effective settings and warnings. The first duplicate assignment wins; comments remain unchanged. A changed interval applies to future scheduling, not an already scheduled date.

## Collecting diagnostics

Normal SAL logging is quiet. Add `debug = true` to `SAL Settings` to log failed parse output and card errors; switch it back off after reproducing the problem. Logs may contain private story text. Share the version, package, model, steps, error and status, with sensitive text removed.
