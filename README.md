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

**Story Arc Light (SAL) v1.3.2** is the lighter, player-first story-arc version used in this repository.

## Main package: Inner Self + SAL

Use the files in `src/`:

```text
src/
├── library.js
├── input.js
├── context.js
└── output.js
```

These four files are already combined and coordinated for **Inner Self + SAL**. The Library contains the core code once, while Input, Context, and Output are short coordination hooks.

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

## How Story Arc Light works

SAL gives a long-running story direction without treating an outline as a fixed script.

1. **SAL watches the story normally.** It keeps track of story turns while the player continues playing.
2. **SAL observes the opening before making its first arc.** The first automatic Story Arc is scheduled only after **10 normal story turns**. After an arc is saved, the next automatic refresh is **35 story turns later** by default.
3. **The planning turn asks the AI for exactly 8 short future possibilities.** These are broad possibilities based on established characters, places, goals, tensions, mysteries, consequences, and unresolved threads.
4. **The result is stored in the `Current Story Arc` Story Card.** This lets the user inspect or manually edit the current possibilities.
5. **The current arc is added to later story context as optional guidance.** It helps the AI remember possible directions without forcing them to happen.
6. **Player input always wins.** If the player chooses something that conflicts with an arc idea, SAL tells the AI to delay, change, replace, or discard that idea instead of overriding the player.
7. **If SAL is waiting to perform a private planning turn and the player types a real action, SAL defers its refresh.** The player's action is processed normally first; SAL can refresh later on a Continue-like turn.
8. **The arc gradually moves forward.** By default SAL removes one older possibility every **5 turns**, preventing the list from becoming a permanent checklist.
9. **SAL eventually creates a fresh set of possibilities.** This keeps long stories moving while allowing the plot to evolve naturally. If a planning response is malformed, SAL stops cleanly instead of entering a Continue/retry loop; it keeps the old arc and tries automatically again later.

The goal is not to predict exactly what must happen. SAL gives the AI a handful of possible directions so the story can develop over time without rushing or railroading the player.

### Story Cards

SAL creates two editable Story Cards:

- `SAL Settings` — contains adjustable SAL settings.
- `Current Story Arc` — contains the current optional story possibilities.

Older adventures that used `/SAL Settings` or `/Current Story Arc` are migrated to the names above.

### Default behavior

- Generates exactly **8 short, flexible future possibilities**.
- Waits **10 normal story turns** before the first automatic Story Arc.
- Refreshes **35 story turns after the last saved arc** by default.
- Removes one older possibility every **5 turns** by default.
- The player's newest explicit action always outranks the stored arc.
- Planned beats can be delayed, changed, replaced, or discarded as the story changes.
- Coordinates its private planning turns with Inner Self in the combined package.

### SAL commands

- `/sal` or `/sal status` — show SAL status and the current Story Arc.
- `/sal redo` or `/redo arc` — request a fresh Story Arc immediately.
- `/sal stop` or `/stop` — cancel a pending SAL generation.

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
