# SAL — Story Arc Light for AI Dungeon

**Story Arc Light (SAL)** is a player-first story-direction add-on for AI Dungeon. It uses the public **Story Arc Engine (SAE)** as its planning backend, but changes the behavior from a stronger plot outline into **optional future possibilities** that must yield to the player's newest choice.

SAL was created for long-running stories that need direction without feeling railroaded.

## What SAL changes

- Generates **8 short, flexible future possibilities** instead of treating an outline like destiny.
- Gives the player's newest explicit input **absolute priority** over a pending planning call.
- Defers a hidden arc-refresh call when the player enters a real action, then allows it on a later Continue-style turn.
- Rewrites the stored Story Arc as **optional guidance** so the AI can delay, alter, replace, or discard beats that no longer fit.
- Keeps the default refresh fairly slow: **35 story turns** between new arc generations.
- Gradually removes old arc items every **5 turns**.
- Includes `/sal` and `/sal status` for a quick status readout.
- Automatically coordinates with **Inner Self** when Inner Self is installed, so SAL and Inner Self do not intentionally compete for the same private AI call.

## Requirements

SAL is an add-on for **Story Arc Engine by Yi1i1i**:

https://github.com/Yi1i1i/Story-Arc-Engine

The upstream Story Arc Engine repository currently does not include a software license file, so this repository **does not redistribute SAE's source code**. Install SAE from its original repository, or use the included builder, which downloads the current upstream source directly in your browser.

**Inner Self by LewdLeah is optional**:

https://github.com/LewdLeah/Inner-Self

Inner Self is MIT-licensed. SAL does not require it, but detects it automatically when present.

## Easiest installation

1. Download `builder/SAL_BUILDER.html` from this repository.
2. Open it in a web browser while online.
3. Choose either:
   - **SAL + SAE**, or
   - **SAL + SAE + Inner Self**.
4. Click **Build Paste-Ready Tabs**.
5. Copy the generated **Library**, **Input**, **Context**, and **Output** tabs into AI Dungeon.
6. Completely replace the old contents of those four scripting tabs. Do not append a second modifier wrapper.
7. Save and make sure scripts are enabled.

The builder fetches SAE from its original GitHub repository at build time. If you choose Inner Self, it also fetches Inner Self from its original repository.

## Manual installation

If you already have SAE installed:

1. Keep the current SAE Library code.
2. Paste `src/Library_ADDON.js` **after SAE** in the Library tab.
3. Replace the Input tab with `src/Input.js`.
4. Replace the Context tab with `src/Context.js`.
5. Replace the Output tab with `src/Output.js`.

If you also use Inner Self, the Library order should be:

```text
Inner Self Library
Story Arc Engine Library
SAL Library_ADDON.js
```

Then use SAL's Input, Context, and Output files as the **single hook wrappers**. They call both systems in a coordinated order.

## Commands

`/sal` or `/sal status` — show SAL status and the currently stored arc.

SAE commands still work, including `/redo arc`, `/help sae`, and `/stop`.

## How player priority works

Stock SAE can schedule its next AI call to privately generate an updated outline. If the player types a real action before that call happens, SAL cancels/defers the private planning operation for that turn. The player's action gets the story response instead.

The next Continue-style turn can then be used to refresh the arc.

This means the planning system is there to help the story move, not to take a turn away from the player.

## Customizing SAL

After installation, AI Dungeon's **Story Arc Settings** card still controls the underlying SAE settings. You can change the refresh interval, removal interval, attempt limit, or arc prompt there.

SAL applies its defaults once and then preserves later user edits.

## Suggested AI Dungeon description line

> Uses **SAL — Story Arc Light** for flexible long-term story direction with player-choice priority: https://github.com/SeanL33316/SAL-AI-Dungeon

## Credits

- **SAL / Story Arc Light:** SeanL33316
- **Story Arc Engine (SAE):** Yi1i1i — required upstream planning engine
- **Inner Self:** LewdLeah — optional NPC inner-life system

SAL is not an official Latitude/AI Dungeon project and is not affiliated with Latitude.

## License

The original code authored for SAL in this repository is released under the MIT License. See `LICENSE`.

That license applies only to SAL-authored files. Upstream projects keep their own copyright and licensing terms.
