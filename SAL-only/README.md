# SAL-only

Use this folder when you want **Story Arc Light v1.3.9 without Inner Self or Auto-Cards**.

## Install

Replace the contents of the four AI Dungeon script tabs with the matching files:

1. Library → [`1-Library.js`](1-Library.js)
2. Input → [`2-Input.js`](2-Input.js)
3. Context → [`3-Context.js`](3-Context.js)
4. Output → [`4-Output.js`](4-Output.js)

Do not keep older modifier wrappers below the new files.

## First run

1. Save all four tabs and make sure Scripts are enabled.
2. Confirm the `SAL Settings` and `Current Story Arc` Story Cards exist.
3. Enter `/sal`.
4. Continue normally for the default 10-turn observation period, or use `/sal redo` to test immediately.

If you see **`SAL_protectPlayerInput is not defined`**, the Library file is missing or does not match the other tabs. Replace all four tabs from this folder.

More help: [Troubleshooting](../docs/TROUBLESHOOTING.md)

Story Arc Light was developed from **Story Arc Engine (SAE) by Yi1i1i**:
https://github.com/Yi1i1i/Story-Arc-Engine
