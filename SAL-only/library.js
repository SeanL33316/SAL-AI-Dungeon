// ============================================================================
// SAL — STORY ARC LIGHT — AI DUNGEON LIBRARY — v1.3.3
// ============================================================================
// Standalone player-first story direction for AI Dungeon.
// Paste this entire file into the Library tab.
//
// Optional compatibility: Inner Self by LewdLeah.
// If Inner Self's Library is also present above this code, SAL's Input/Context/
// Output wrappers will coordinate with it automatically.
// ============================================================================

const SAL_VERSION = "1.3.3";
const SAL_INITIAL_WAIT_TURNS = 10;
const SAL_FAILED_RETRY_COOLDOWN = 5;
const SAL_SETTINGS_KEYS = "SAL Settings";
const SAL_ARC_KEYS = "Current Story Arc";
const SAL_LEGACY_SETTINGS_KEYS = "/SAL Settings";
const SAL_LEGACY_ARC_KEYS = "/Current Story Arc";
const SAL_CARD_TYPE = "SAL System";

function SAL_state() {
  state.SAL = state.SAL || {};
  const s = state.SAL;

  if (typeof s.enabled !== "boolean") s.enabled = true;
  if (!Number.isFinite(s.turn)) s.turn = 0;
  if (!Number.isFinite(s.turnsPerAICall)) s.turnsPerAICall = 35;
  if (!Number.isFinite(s.turnsPerElemRemoval)) s.turnsPerElemRemoval = 5;
  if (!Number.isFinite(s.attemptLimit)) s.attemptLimit = 3;
  if (!Number.isFinite(s.attempt)) s.attempt = 0;
  if (!Number.isFinite(s.nextArcTurn)) s.nextArcTurn = SAL_INITIAL_WAIT_TURNS;
  if (!Number.isFinite(s.timingVersion)) s.timingVersion = 0;
  if (typeof s.generationReason !== "string") s.generationReason = "";
  if (typeof s.arc !== "string") s.arc = "";
  if (typeof s.pendingGeneration !== "boolean") s.pendingGeneration = false;
  if (typeof s.captureGeneration !== "boolean") s.captureGeneration = false;
  if (typeof s.deferred !== "boolean") s.deferred = false;
  if (typeof s.realPlayerInputThisTurn !== "boolean") s.realPlayerInputThisTurn = false;
  if (typeof s.innerSelfTaskActive !== "boolean") s.innerSelfTaskActive = false;
  if (typeof s.showStatus !== "boolean") s.showStatus = false;
  if (typeof s.pendingMessage !== "string") s.pendingMessage = "";
  if (typeof s.inputStop !== "boolean") s.inputStop = false;
  if (typeof s.commandMessageActive !== "boolean") s.commandMessageActive = false;
  if (typeof s.commandMessage !== "string") s.commandMessage = "";
  if (typeof s.prompt !== "string" || !s.prompt.trim()) s.prompt = SAL_defaultPrompt();
  s.version = SAL_VERSION;
  return s;
}

function SAL_defaultPrompt() {
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
- Output exactly eight lines numbered 1. through 8.
- Do not add a heading, introduction, explanation, or closing text.
- Keep developments broad, flexible, and easy to alter.
- Build mainly from established characters, places, consequences, goals,
  tensions, mysteries, and unresolved threads in the actual story.
- Respect the established genre, setting, tone, scale, and continuity.
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
  `.trim();
}

function SAL_hasInnerSelf() {
  return typeof globalThis.InnerSelf === "function";
}

function SAL_hasInnerSelfTask() {
  return Boolean(
    state.InnerSelf &&
    typeof state.InnerSelf.agent === "string" &&
    state.InnerSelf.agent.trim().length > 0
  );
}

function SAL_isBusy() {
  const s = SAL_state();
  return Boolean(s.pendingGeneration || s.captureGeneration);
}

function SAL_normalizeCommand(value) {
  let raw = String(value || "").trim();
  if (!raw) return "";

  // AI Dungeon may wrap Do/Say inputs before the Input hook sees them.
  // Accept raw Story commands, > Character /command, and
  // > Character says, "/command" without treating ordinary prose as a command.
  raw = raw.replace(/[.!?]\s*$/, "").trim();

  let candidate = raw;
  let match = raw.match(/^>\s+(?:[A-Z][A-Za-z0-9_.'’\-]*(?:\s+[A-Z][A-Za-z0-9_.'’\-]*){0,4})\s+[Ss]ay(?:s)?,?\s*["“](\/[^"”]+)["”]$/);
  if (match) {
    candidate = match[1];
  } else {
    match = raw.match(/^>\s+([A-Z][A-Za-z0-9_.'’\-]*(?:\s+[A-Z][A-Za-z0-9_.'’\-]*){0,4})\s+(\/.+)$/);
    if (match) candidate = match[2];
  }

  candidate = candidate
    .replace(/^["“]|["”]$/g, "")
    .replace(/[.!?]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  const allowed = [
    "/sal",
    "/sal status",
    "/sal help",
    "/sal redo",
    "/sal refresh",
    "/redo arc",
    "/sal stop",
    "/stop"
  ];

  return allowed.includes(candidate) ? candidate : "";
}

function SAL_isCommand(value) {
  return Boolean(SAL_normalizeCommand(value));
}

function SAL_isRealPlayerInput(value) {
  const t = String(value || "").trim();
  if (!t) return false;
  if (SAL_isCommand(t)) return false;
  return true;
}

function SAL_findCardIndex(keys) {
  if (!Array.isArray(storyCards)) return -1;
  const wanted = String(keys || "").trim().toLowerCase();
  return storyCards.findIndex(card => {
    if (!card) return false;
    const cardKeys = Array.isArray(card.keys) ? card.keys.join(",") : String(card.keys || "");
    return cardKeys.trim().toLowerCase() === wanted;
  });
}

function SAL_getCard(keys) {
  const index = SAL_findCardIndex(keys);
  return index >= 0 ? storyCards[index] : null;
}

function SAL_ensureCard(keys, entry) {
  let index = SAL_findCardIndex(keys);
  if (index >= 0) return index;
  try {
    const added = addStoryCard(keys, entry, SAL_CARD_TYPE);
    if (added !== false) return added;
  } catch (error) {
    log("SAL addStoryCard failed: " + error);
  }
  return SAL_findCardIndex(keys);
}

function SAL_updateCard(keys, entry) {
  const index = SAL_ensureCard(keys, entry);
  if (index < 0) return false;
  try {
    updateStoryCard(index, keys, entry, SAL_CARD_TYPE);
    return true;
  } catch (error) {
    // Older sandboxes may allow direct mutation even when updateStoryCard fails.
    try {
      storyCards[index].keys = keys;
      storyCards[index].entry = entry;
      storyCards[index].type = SAL_CARD_TYPE;
      return true;
    } catch (_) {
      log("SAL updateStoryCard failed: " + error);
      return false;
    }
  }
}

function SAL_migrateLegacyCard(oldKeys, newKeys) {
  const oldIndex = SAL_findCardIndex(oldKeys);
  if (oldIndex < 0 || SAL_findCardIndex(newKeys) >= 0) return;

  const card = storyCards[oldIndex];
  const entry = String(card?.entry || "");
  const type = card?.type || SAL_CARD_TYPE;

  try {
    updateStoryCard(oldIndex, newKeys, entry, type);
  } catch (_) {
    try {
      storyCards[oldIndex].keys = newKeys;
      storyCards[oldIndex].entry = entry;
      storyCards[oldIndex].type = type;
    } catch (error) {
      log("SAL legacy Story Card migration failed: " + error);
    }
  }
}

function SAL_migrateLegacyCards() {
  SAL_migrateLegacyCard(SAL_LEGACY_SETTINGS_KEYS, SAL_SETTINGS_KEYS);
  SAL_migrateLegacyCard(SAL_LEGACY_ARC_KEYS, SAL_ARC_KEYS);
}

function SAL_settingsText() {
  const s = SAL_state();
  return [
    "SAL — Story Arc Light Settings",
    "",
    "enabled = " + s.enabled,
    "turnsPerAICall = " + s.turnsPerAICall,
    "turnsPerElemRemoval = " + s.turnsPerElemRemoval,
    "",
    "Commands:",
    "/sal or /sal status — show SAL status",
    "/sal redo or /redo arc — generate a new arc now",
    "/sal stop or /stop — cancel a pending arc generation",
    "",
    "The player's newest explicit choice always outranks the Story Arc."
  ].join("\n");
}

function SAL_parseSettings(entry) {
  const s = SAL_state();
  const text = String(entry || "");
  let match;

  match = text.match(/enabled\s*=\s*(true|false)/i);
  if (match) s.enabled = match[1].toLowerCase() === "true";

  match = text.match(/turnsPerAICall\s*=\s*(\d+)/i);
  if (match) s.turnsPerAICall = Math.max(5, Math.min(500, Number(match[1])));

  match = text.match(/turnsPerElemRemoval\s*=\s*(\d+)/i);
  if (match) s.turnsPerElemRemoval = Math.max(0, Math.min(100, Number(match[1])));

}

function SAL_syncCards() {
  const s = SAL_state();
  SAL_migrateLegacyCards();

  const settingsIndex = SAL_ensureCard(SAL_SETTINGS_KEYS, SAL_settingsText());
  if (settingsIndex >= 0) {
    SAL_parseSettings(storyCards[settingsIndex]?.entry);
  }

  const arcIndex = SAL_ensureCard(SAL_ARC_KEYS, s.arc);
  let cardArc = "";
  if (arcIndex >= 0) {
    cardArc = String(storyCards[arcIndex]?.entry || "").trim();
    // Respect manual user edits to the Current Story Arc card.
    if (cardArc !== String(s.arc || "").trim()) s.arc = cardArc;
  }

  // v1.3.3 timing migration: do not surprise an existing story with an
  // immediate refresh. New/no-arc stories wait for the 10-turn observation
  // period; stories that already have an arc get a full refresh interval.
  if (s.timingVersion < 2) {
    s.nextArcTurn = cardArc
      ? s.turn + s.turnsPerAICall
      : Math.max(SAL_INITIAL_WAIT_TURNS, s.turn);
    s.timingVersion = 2;
  }
}

function SAL_saveSettings() {
  SAL_updateCard(SAL_SETTINGS_KEYS, SAL_settingsText());
}

function SAL_saveArc() {
  const s = SAL_state();
  SAL_updateCard(SAL_ARC_KEYS, s.arc || "");
}

function SAL_softArcText(numbered) {
  const clean = String(numbered || "").trim();
  if (!clean) return "";
  return [
    "OPTIONAL STORY ARC LIGHT POSSIBILITIES:",
    "The player's newest explicit input has absolute priority over every item below.",
    "Respond to the player's current action first.",
    "Never force, assume, or manufacture a player decision just to advance a beat.",
    "Delay, alter, replace, or discard any beat that conflicts with what the player does.",
    clean
  ].join("\n");
}

function SAL_extractNumberedArc(text) {
  const lines = String(text || "").replace(/\r/g, "").split("\n");
  let items = [];

  // Accept normal numbering, Markdown-bold numbering, and 1) style numbering.
  for (const raw of lines) {
    const match = raw.trim().match(/^(?:[-*•]\s*)?(?:\*\*)?(\d{1,2})[.)](?:\*\*)?\s+(.+)/);
    if (!match) continue;
    const body = match[2].trim();
    if (body) items.push(body);
  }

  // Some models occasionally return eight bullet points despite the prompt.
  // Accept that shape too rather than forcing the player into a retry cycle.
  if (items.length < 8) {
    const bullets = lines
      .map(line => line.trim().match(/^[-*•]\s+(.+)/))
      .filter(Boolean)
      .map(match => match[1].trim())
      .filter(Boolean);
    if (bullets.length >= 8) items = bullets;
  }

  if (items.length < 8) return "";
  return items.slice(0, 8).map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function SAL_removeFirstArcItem() {
  const s = SAL_state();
  if (!s.arc.trim()) return;

  const numbered = s.arc
    .split("\n")
    .filter(line => /^\s*\d+\.\s+/.test(line))
    .map(line => line.replace(/^\s*\d+\.\s+/, "").trim())
    .filter(Boolean);

  if (!numbered.length) return;
  numbered.shift();

  s.arc = numbered.length
    ? SAL_softArcText(numbered.map((item, index) => `${index + 1}. ${item}`).join("\n"))
    : "";

  SAL_saveArc();
}

function SAL_scheduleIfDue() {
  const s = SAL_state();
  if (!s.enabled || SAL_isBusy()) return false;
  if (s.turn < s.nextArcTurn) return false;

  s.pendingGeneration = true;
  s.captureGeneration = true;
  s.generationReason = "auto";
  s.attempt = 0;
  return true;
}

function SAL_protectPlayerInput(inputText) {
  const s = SAL_state();

  // Clear only a previous SAL-owned command message. Never erase messages
  // created by another script such as Inner Self or Auto-Cards.
  if (s.commandMessageActive && state.message === s.commandMessage) {
    delete state.message;
  }
  s.commandMessageActive = false;
  s.commandMessage = "";
  s.inputStop = false;

  const realInput = SAL_isRealPlayerInput(inputText);
  const command = SAL_isCommand(inputText);
  s.realPlayerInputThisTurn = realInput;
  s.innerSelfTaskActive = false;

  if (!realInput) {
    // Only a real Continue-like empty turn resumes a deferred automatic refresh.
    // SAL commands such as /sal status must never accidentally restart it.
    if (!command && s.deferred && s.enabled && !SAL_isBusy()) {
      s.pendingGeneration = true;
      s.captureGeneration = true;
      s.generationReason = "auto";
      s.deferred = false;
    }
    return;
  }

  if (SAL_isBusy()) {
    s.pendingGeneration = false;
    s.captureGeneration = false;
    s.attempt = 0;
    s.deferred = true;
    s.generationReason = "auto";
  }

  if (SAL_hasInnerSelfTask()) {
    state.InnerSelf.agent = "";
  }
}

function SAL_setCommandMessage(message) {
  const s = SAL_state();
  const clean = String(message || "");
  s.inputStop = true;
  s.commandMessage = clean;
  s.commandMessageActive = true;
  state.message = clean;
}

function SAL_inputCommands(inputText) {
  const s = SAL_state();
  const t = SAL_normalizeCommand(inputText);

  if (t === "/sal" || t === "/sal status") {
    s.showStatus = false;
    SAL_setCommandMessage(SAL_statusText());
    return null;
  }

  if (t === "/sal help") {
    s.showStatus = false;
    SAL_setCommandMessage(SAL_helpText());
    return null;
  }

  if (t === "/sal redo" || t === "/sal refresh" || t === "/redo arc") {
    if (!s.enabled) {
      s.pendingMessage = "SAL is disabled. Set enabled = true in the SAL Settings Story Card.";
      return " ";
    }
    s.pendingGeneration = true;
    s.captureGeneration = true;
    s.generationReason = "manual";
    s.deferred = false;
    s.attempt = 0;
    return " ";
  }

  if (t === "/sal stop" || t === "/stop") {
    const wasPending = SAL_isBusy() || s.deferred;
    s.pendingGeneration = false;
    s.captureGeneration = false;
    s.deferred = false;
    s.generationReason = "";
    s.attempt = 0;
    s.pendingMessage = "";
    SAL_setCommandMessage(
      wasPending
        ? "Story Arc Light generation stopped."
        : "No Story Arc Light generation is currently pending."
    );
    return null;
  }

  return inputText;
}

function SAL_generationContext(baseText) {
  const s = SAL_state();
  s.pendingGeneration = false;
  s.captureGeneration = true;
  return String(baseText || "") + "\n\n" + s.prompt;
}

function SAL_injectArc(baseText) {
  const s = SAL_state();
  if (!s.enabled || !s.arc.trim()) return baseText;

  const guidance = [
    "<<STORY ARC LIGHT — OPTIONAL GUIDANCE>>",
    s.arc,
    "<<END STORY ARC LIGHT>>"
  ].join("\n");

  return String(baseText || "") + "\n\n" + guidance;
}

function SAL_processGeneratedOutput(outputText) {
  const s = SAL_state();
  const numbered = SAL_extractNumberedArc(outputText);

  if (numbered) {
    s.arc = SAL_softArcText(numbered);
    s.pendingGeneration = false;
    s.captureGeneration = false;
    s.attempt = 0;
    s.deferred = false;
    s.generationReason = "";
    s.nextArcTurn = s.turn + s.turnsPerAICall;
    SAL_saveArc();
    return "<< ✅ Story Arc Light updated and saved. Continue playing normally. >>";
  }

  // Do not enter an automatic Continue/retry loop. Keep the old arc, clear the
  // private generation state, and give automatic SAL a short cooldown. The
  // player can always use /sal redo again immediately if they want to retry.
  const hadArc = Boolean(String(s.arc || "").trim());
  s.pendingGeneration = false;
  s.captureGeneration = false;
  s.attempt = 0;
  s.deferred = false;
  s.generationReason = "";
  s.nextArcTurn = Math.max(s.nextArcTurn, s.turn + SAL_FAILED_RETRY_COOLDOWN);

  return hadArc
    ? "<< ⚠️ Story Arc Light could not build a valid 8-part arc this time. The existing arc was kept. Continue playing normally, or use '/sal redo' to try again. >>"
    : "<< ⚠️ Story Arc Light could not build a valid 8-part arc this time. No arc was saved. Continue playing normally; SAL will try again later, or use '/sal redo' to try again now. >>";
}

function SAL_onNormalOutput(outputText) {
  const s = SAL_state();
  s.turn += 1;

  if (
    s.turnsPerElemRemoval > 0 &&
    s.turn >= 5 &&
    s.turn % s.turnsPerElemRemoval === 0
  ) {
    SAL_removeFirstArcItem();
  }

  const scheduled = SAL_scheduleIfDue();
  s.realPlayerInputThisTurn = false;
  s.innerSelfTaskActive = false;
  SAL_saveSettings();

  if (scheduled) {
    return String(outputText || "") +
      "\n\n<< ⚠️ Story Arc Light will update next turn. Click 'Continue', or keep playing and SAL will defer the update. >>";
  }

  return outputText;
}

function SAL_statusText() {
  const s = SAL_state();
  return [
    `Story Arc Light ${SAL_VERSION}`,
    `Enabled: ${s.enabled ? "yes" : "no"}`,
    `Story turns: ${s.turn}`,
    `First automatic arc: after ${SAL_INITIAL_WAIT_TURNS} story turns`,
    `Refresh every: ${s.turnsPerAICall} story turns after a saved arc`,
    `Next automatic arc check: story turn ${s.nextArcTurn}`,
    `Remove one beat every: ${s.turnsPerElemRemoval === 0 ? "off" : s.turnsPerElemRemoval + " turns"}`,
    `Private arc call pending: ${SAL_isBusy() ? "yes" : "no"}`,
    `Refresh deferred for player input: ${s.deferred ? "yes" : "no"}`,
    `Inner Self detected: ${SAL_hasInnerSelf() ? "yes" : "no"}`,
    "",
    s.arc || "No Story Arc has been generated yet."
  ].join("\n");
}

function SAL_helpText() {
  return [
    `Story Arc Light ${SAL_VERSION} commands`,
    "",
    "/sal or /sal status — show SAL status without advancing the story",
    "/sal help — show this command list",
    "/sal redo or /sal refresh or /redo arc — generate a fresh arc now",
    "/sal stop or /stop — cancel a pending SAL generation"
  ].join("\n");
}

function SAL_outputCommands(outputText) {
  const s = SAL_state();

  if (s.pendingMessage) {
    const message = s.pendingMessage;
    s.pendingMessage = "";
    return message;
  }

  // Backward-compatible fallback for adventures carrying the old status flag.
  if (!s.showStatus) return outputText;
  s.showStatus = false;
  return SAL_statusText();
}

// Initialize and synchronize editable Story Cards on every hook.
SAL_state();
SAL_syncCards();
