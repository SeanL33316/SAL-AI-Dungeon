# Inner Self + SAL — AI Dungeon Combined Script

This repository provides a **copy-and-paste-ready combined version of Inner Self + Story Arc Light (SAL)** for AI Dungeon, plus a separate **SAL-only** folder for anyone who wants Story Arc Light by itself.

The combined version is the main package in `src/`. Each file is complete for its matching AI Dungeon scripting tab—no manual merging is needed.

## Original scripts and authors

- **Inner Self v1.0.2 — LewdLeah**  
  Gives characters an internal life with memory, goals, secrets, planning, self-reflection, and other persistent character behavior.  
  Original project: https://github.com/LewdLeah/Inner-Self

- **Auto-Cards v1.1.3 — LewdLeah**  
  Included inside the official Inner Self Library and available through Inner Self's configuration.

- **Story Arc Engine (SAE) — Yi1i1i**  
  The original story-arc system that Story Arc Light was developed from.  
  Original project: https://github.com/Yi1i1i/Story-Arc-Engine

**Story Arc Light (SAL) v1.3.1** is the lighter, player-first story-arc version used in this repository.

## Main package: Inner Self + SAL

Use the files in `src/`:

```text
src/
├── library.js
├── input.js
├── context.js
└── output.js
```

These four files are already combined and coordinated for **Inner Self + SAL**.

### Install

1. Copy all of `src/library.js` into AI Dungeon's **Library** tab.
2. Copy all of `src/input.js` into the **Input** tab.
3. Copy all of `src/context.js` into the **Context** tab.
4. Copy all of `src/output.js` into the **Output** tab.
5. Save and make sure **Scripts** are enabled.

Replace the contents of those tabs rather than adding a second set of modifier wrappers.

## SAL-only package

If you want **Story Arc Light without Inner Self**, use the separate `SAL-only/` folder:

```text
SAL-only/
├── library.js
├── input.js
├── context.js
└── output.js
```

Copy each file into the matching AI Dungeon scripting tab exactly the same way.

## What Story Arc Light does

SAL is designed to give long-running stories direction without turning the outline into destiny.

- Generates exactly **8 short, flexible future possibilities**.
- The player's newest explicit action always outranks the stored arc.
- A pending SAL planning turn is deferred when the player enters a real action instead of consuming that action.
- Planned beats can be delayed, changed, replaced, or discarded as the story changes.
- Default arc refresh is every **35 story turns**.
- Removes one older beat every **5 turns** so the arc can naturally move forward.
- Creates editable `SAL Settings` and `Current Story Arc` Story Cards.
- Coordinates its private planning turns with Inner Self in the combined package.

### SAL commands

- `/sal` or `/sal status` — show SAL status and the current Story Arc.
- `/redo arc` — request a fresh Story Arc.
- `/stop` — cancel a pending SAL generation.

## Credits

### Inner Self
Created by **LewdLeah**.  
https://github.com/LewdLeah/Inner-Self

### Auto-Cards
Created by **LewdLeah** and included as part of the official Inner Self Library source.

### Story Arc Engine (SAE)
Created by **Yi1i1i**. Story Arc Light was developed from the Story Arc Engine story-arc system.  
https://github.com/Yi1i1i/Story-Arc-Engine

## License

SAL-authored code is released under the MIT License in `LICENSE`.

Inner Self and the Inner Self copy of Auto-Cards remain credited to **LewdLeah** and are redistributed under the upstream MIT License preserved in `LICENSE-INNER-SELF`.

Story Arc Engine remains the work of **Yi1i1i**. Refer to the original Story Arc Engine repository for its source and terms.

This project is not an official Latitude / AI Dungeon project and is not affiliated with Latitude.
