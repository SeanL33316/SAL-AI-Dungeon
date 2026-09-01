// ============================================================================
// STORY ARC LIGHT (SAL) — v1.2.0
// Player-first story direction for AI Dungeon
//
// Install AFTER the current Story Arc Engine (SAE) Library code.
// Inner Self support is automatic when Inner Self is also installed.
//
// SAL project: https://github.com/SeanL33316/SAL-AI-Dungeon
// Story Arc Engine dependency: https://github.com/Yi1i1i/Story-Arc-Engine
// Optional Inner Self: https://github.com/LewdLeah/Inner-Self
// ============================================================================

const SAL_VERSION = "1.2.0";
const SAL_PRESET_VERSION = 4;

function SAL_hasInnerSelf() {
  return typeof globalThis.InnerSelf === "function";
}

function SAL_isBusy() {
  return (
    state.stop_SAE !== true &&
    (state.saveOutput === true || state.unlockFeedAIPrompt === true)
  );
}

function SAL_hasInnerSelfTask() {
  return Boolean(
    state.InnerSelf &&
    typeof state.InnerSelf.agent === "string" &&
    state.InnerSelf.agent.trim().length > 0
  );
}

function SAL_isCommand(value) {
  const t = String(value || "").trim().toLowerCase();
  return (
    t === "/redo arc" ||
    t === "/help sae" ||
    t === "/stop" ||
    t === "/sal" ||
    t === "/sal status"
  );
}

function SAL_isRealPlayerInput(value) {
  const t = String(value || "").trim();
  if (!t) return false;
  if (SAL_isCommand(t)) return false;
  return true;
}

function SAL_defaultArcPrompt() {
  return `
<<
<SYSTEM>
Stop normal story generation temporarily.

Create ONLY a numbered list of exactly 8 short, flexible future possibilities
for the current story.

PLAYER AGENCY IS THE HIGHEST PRIORITY:
- The player's newest explicit input always outranks this outline.
- Never contradict, replace, reinterpret, skip, or undo a choice the player made.
- Never decide the player's dialogue, destination, acceptance, refusal,
  relationship, quest choice, or other voluntary decision.
- If the player changes direction, adapt the outline to that new direction.
- If a possibility no longer fits, replace or discard it.
- Treat every item as optional background possibility, never destiny.

STORY ARC LIGHT:
- Write exactly 8 numbered items.
- Each item must be one concise sentence.
- Keep developments broad, flexible, and easy to alter.
- Build mainly from established characters, places, consequences, goals,
  tensions, mysteries, and unresolved threads in the actual story.
- Respect the story's established genre, setting, tone, scale, and continuity.
- Prefer opportunities, reactions, and consequences over predetermined outcomes.
- Mix major developments with ordinary life or quieter beats when appropriate.
- Let NPCs have independent motives, priorities, and lives.
- Avoid repeating recent scenes, locations, dialogue patterns, conflicts,
  emotional beats, or encounters.
- Do not invent an enormous crisis merely to force the plot forward.
- Do not force romance, friendship, rivalry, quests, travel, combat, or commitments.

Output the numbered list only.
</SYSTEM>
>>
  `;
}

function SAL_writeSettingsCard() {
  try {
    if (typeof storeSettingsToSC === "function") {
      storeSettingsToSC();
    }
  } catch (_) {}
}

function SAL_applyPreset() {
  state.SAL = state.SAL || {};
  state.SAL.version = SAL_VERSION;

  if (state.SAL.presetVersion === SAL_PRESET_VERSION) return;

  // SAL keeps SAE's long refresh interval but makes the stored arc lighter.
  state.stop_SAE = false;
  state.turnsPerAICall = 35;
  state.turnsPerElemRemoval = 5;
  state.attemptLimit = 3;
  state.arcPrompt = [SAL_defaultArcPrompt()];

  state.SAL.deferred = false;
  state.SAL.presetVersion = SAL_PRESET_VERSION;

  // SAE creates/reads its settings card before this add-on runs. Persist the
  // SAL defaults immediately so the next hook does not restore older values.
  SAL_writeSettingsCard();
}

SAL_applyPreset();

// ---------------------------------------------------------------------------
// HARD PLAYER-INPUT PRIORITY
//
// SAE normally schedules a private arc-generation call for the following turn.
// If the player enters a real action instead of using Continue, SAL defers that
// private call so the player's action receives the actual story response.
// ---------------------------------------------------------------------------

function SAL_protectPlayerInput(inputText) {
  state.SAL = state.SAL || {};
  const realInput = SAL_isRealPlayerInput(inputText);
  state.SAL.realPlayerInputThisTurn = realInput;

  if (!realInput) {
    if (
      state.SAL.deferred === true &&
      state.stop_SAE !== true &&
      state.saveOutput !== true &&
      state.unlockFeedAIPrompt !== true
    ) {
      state.unlockFeedAIPrompt = true;
      state.saveOutput = true;
      state.SAL.deferred = false;
    }
    return;
  }

  // A real player action always wins over a pending SAL planning call.
  if (SAL_isBusy()) {
    state.unlockFeedAIPrompt = false;
    state.saveOutput = false;
    state.attemptCounter = 0;
    state.SAL.deferred = true;
  }

  // If Inner Self left a hidden task pending, do not let it consume this
  // player's action. Inner Self can form another thought on a later turn.
  if (SAL_hasInnerSelfTask()) {
    state.InnerSelf.agent = "";
  }
}

// ---------------------------------------------------------------------------
// SOFTEN SAE'S STORED ARC
// ---------------------------------------------------------------------------

function SAL_softenStoredArc() {
  if (typeof state.storyArc !== "string" || !state.storyArc.trim()) return;

  const numbered = state.storyArc
    .split("\n")
    .filter(line => /^\s*\d+\.\s+/.test(line))
    .join("\n")
    .trim();

  if (!numbered) return;

  state.storyArc =
`OPTIONAL STORY ARC LIGHT POSSIBILITIES:
The player's newest explicit input has absolute priority over every item below.
Respond to the player's current action first.
Never force, assume, or manufacture a player decision just to advance a beat.
Delay, alter, replace, or discard any beat that conflicts with what the player does.
${numbered}`;

  try {
    if (typeof storeArcToSC === "function") storeArcToSC();
  } catch (_) {}
}

// ---------------------------------------------------------------------------
// SAL STATUS COMMAND
// ---------------------------------------------------------------------------

function SAL_inputCommands(inputText) {
  const t = String(inputText || "").trim().toLowerCase();

  if (t === "/sal" || t === "/sal status") {
    state.SAL = state.SAL || {};
    state.SAL.showStatus = true;
    // AI Dungeon treats an empty Input return as a script error.
    return " ";
  }

  return inputText;
}

function SAL_outputCommands(outputText) {
  state.SAL = state.SAL || {};
  if (state.SAL.showStatus !== true) return outputText;

  state.SAL.showStatus = false;

  const busy = SAL_isBusy() ? "yes" : "no";
  const deferred = state.SAL.deferred === true ? "yes" : "no";
  const turn = Number.isFinite(state.turnNum_SAE) ? state.turnNum_SAE : "?";

  return (
    "Story Arc Light " + SAL_VERSION + " status\n" +
    "Enabled: " + (state.stop_SAE === true ? "no" : "yes") + "\n" +
    "Turn: " + turn + "\n" +
    "Private arc call pending: " + busy + "\n" +
    "Refresh deferred for player input: " + deferred + "\n" +
    "Inner Self detected: " + (SAL_hasInnerSelf() ? "yes" : "no") + "\n\n" +
    (state.storyArc || "No Story Arc has been generated yet.")
  );
}
