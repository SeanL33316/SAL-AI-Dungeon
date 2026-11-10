# The Seven Kingdoms — Inner Self NPC Auto-Registration

This is a **scenario-specific** version of the combined Inner Self + Story Arc Light Library. It preserves the normal combined SAL–IS package and adds automatic NPC registration from your existing AI Dungeon Story Cards.

## Install

1. In **The Seven Kingdoms** scenario, open **Edit Scripts**.
2. Replace only the **Library** tab with the complete contents of [1-Library.js](./1-Library.js).
3. Leave the combined SAL–IS **Input**, **Context**, and **Output** tabs installed from the main `src/` folder. If not already present, install [Input](../src/2-Input.js), [Context](../src/3-Context.js), and [Output](../src/4-Output.js).
4. Save the script and start a new test adventure with scripting enabled.
5. Meet a named NPC such as **Mara Voss**. Inner Self should create a Brain card on demand after their name appears in story history.
6. Open **Configure Inner Self** and check the NPC name list if troubleshooting. Do not manually add already recognized names.

## What it does

- Scans the existing `storyCards` array for cards with a **Character**, **NPC**, or **Person** type, including plural variants.
- Gets the character's name from their Story Card title (or the first trigger when no title is present).
- Strips common titles such as King, Queen, Captain, High Matriarch, etc. to use the personal first name for recognition.
- Deduplicates names and excludes common unnamed role labels.
- Leaves regular Story Cards unchanged and preserves existing Inner Self Brain cards and manually registered agents.
- Uses a full name where a short name is ambiguous with everyday words (e.g., "May Winters").
- Registers NPC names automatically on each context pass; **Brain cards are created only when a named character appears during play**.
- Does not change SAL's planning, pacing, or player priority behavior.

## Important limits

- The original Story Cards must have proper **Type** and **Title** fields. Cards incorrectly imported as `class` will not be treated as NPCs.
- Inner Self operates on name mentions in the recent story, not a definitive 'physically encountered' flag. An NPC mentioned in dialogue or rumors can activate their Brain as well.
- First-name triggers cannot safely distinguish two characters who share a first name. Review duplicate names in the imported catalog.
- If a character never appears by name, they will not trigger Inner Self; anonymous background characters remain lightweight.
- This version has been checked with representative story-card samples and its registration helper, **not with a complete live AI Dungeon run using your 884 imported cards**.
- This is a separate addon: the shared original `src/1-Library.js` is unchanged.

## Verify

Try an NPC at the Oakheart guild, then an NPC from another kingdom. A corresponding Brain Story Card should appear after the character is mentioned in the story history. The Brain develops its own memory on later turns. If nothing happens, check that **Inner Self** and **Scripts** are enabled, and that the NPC's Story Card Type includes `Character` or `NPC`.
