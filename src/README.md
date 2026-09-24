# Inner Self + SAL combined package

Use this folder for **Inner Self + Story Arc Light (SAL) v1.3.9**. The Library also contains the Auto-Cards version bundled with the upstream Inner Self source.

## Install

Replace the contents of the four AI Dungeon script tabs with:

1. Library → [`1-Library.js`](1-Library.js)
2. Input → [`2-Input.js`](2-Input.js)
3. Context → [`3-Context.js`](3-Context.js)
4. Output → [`4-Output.js`](4-Output.js)

Do not combine these with the files from `SAL-only/`; this folder already contains the coordinated package.

## First run

1. Save all four tabs and make sure Scripts are enabled.
2. Confirm SAL created `SAL Settings` and `Current Story Arc`.
3. Enter `/sal` to check SAL status.
4. Open Inner Self's configuration card and set the player/NPC names you want Inner Self to manage.
5. If you enable Auto-Cards through Inner Self, SAL v1.3.9 coordinates private events so a typed player action is not replaced by background card generation.

If anything looks mismatched, replace **all four** script tabs from this folder before debugging individual functions.

More help: [Troubleshooting](../docs/TROUBLESHOOTING.md)

## Upstream credits

- **Inner Self — LewdLeah**
- **Auto-Cards — LewdLeah**
- **Story Arc Engine (SAE) — Yi1i1i**

See the repository root README and license files for full attribution.
