// ============================================================================
// INNER SELF + SAL — COMBINED AI DUNGEON INPUT
// ============================================================================
// Inner Self v1.0.2 — LewdLeah
// Story Arc Light (SAL) v1.3.1 — SeanL33316
// Copy this entire file into the matching AI Dungeon scripting tab.
// ============================================================================

// ============================================================================
// SAL — STORY ARC LIGHT — AI DUNGEON LIBRARY — v1.3.1
// ============================================================================
// Standalone player-first story direction for AI Dungeon.
// SAL core embedded in this combined modifier.
//
// Optional compatibility: Inner Self by LewdLeah.
// If Inner Self's Library is also present above this code, SAL's Input/Context/
// Output wrappers will coordinate with it automatically.
// ============================================================================

const SAL_VERSION = "1.3.1";
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
  if (typeof s.arc !== "string") s.arc = "";
  if (typeof s.pendingGeneration !== "boolean") s.pendingGeneration = false;
  if (typeof s.captureGeneration !== "boolean") s.captureGeneration = false;
  if (typeof s.deferred !== "boolean") s.deferred = false;
  if (typeof s.realPlayerInputThisTurn !== "boolean") s.realPlayerInputThisTurn = false;
  if (typeof s.innerSelfTaskActive !== "boolean") s.innerSelfTaskActive = false;
  if (typeof s.showStatus !== "boolean") s.showStatus = false;
  if (typeof s.pendingMessage !== "string") s.pendingMessage = "";
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
  return s.enabled && (s.pendingGeneration || s.captureGeneration);
}

function SAL_isCommand(value) {
  const t = String(value || "").trim().toLowerCase();
  return [
    "/sal",
    "/sal status",
    "/sal help",
    "/redo arc",
    "/stop"
  ].includes(t);
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
    "attemptLimit = " + s.attemptLimit,
    "",
    "Commands:",
    "/sal or /sal status — show SAL status",
    "/redo arc — generate a new arc on this turn",
    "/stop — cancel a pending arc generation",
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

  match = text.match(/attemptLimit\s*=\s*(\d+)/i);
  if (match) s.attemptLimit = Math.max(1, Math.min(10, Number(match[1])));
}

function SAL_syncCards() {
  const s = SAL_state();
  SAL_migrateLegacyCards();

  const settingsIndex = SAL_ensureCard(SAL_SETTINGS_KEYS, SAL_settingsText());
  if (settingsIndex >= 0) {
    SAL_parseSettings(storyCards[settingsIndex]?.entry);
  }

  const arcIndex = SAL_ensureCard(SAL_ARC_KEYS, s.arc);
  if (arcIndex >= 0) {
    const cardArc = String(storyCards[arcIndex]?.entry || "").trim();
    // Respect manual user edits to the Current Story Arc card.
    if (cardArc !== String(s.arc || "").trim()) s.arc = cardArc;
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
  const lines = String(text || "").split("\n");
  const items = [];

  for (const raw of lines) {
    const match = raw.trim().match(/^(\d+)\.\s+(.+)/);
    if (!match) continue;
    const body = match[2].trim();
    if (!body) continue;
    items.push(body);
  }

  // SAL deliberately requires exactly eight usable items.
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

  const due = s.turn === 1 || (s.turnsPerAICall > 0 && s.turn % s.turnsPerAICall === 0);
  if (!due) return false;

  s.pendingGeneration = true;
  s.captureGeneration = true;
  s.attempt = 0;
  return true;
}

function SAL_protectPlayerInput(inputText) {
  const s = SAL_state();
  const realInput = SAL_isRealPlayerInput(inputText);
  s.realPlayerInputThisTurn = realInput;
  s.innerSelfTaskActive = false;

  if (!realInput) {
    if (s.deferred && s.enabled && !SAL_isBusy()) {
      s.pendingGeneration = true;
      s.captureGeneration = true;
      s.deferred = false;
    }
    return;
  }

  if (SAL_isBusy()) {
    s.pendingGeneration = false;
    s.captureGeneration = false;
    s.attempt = 0;
    s.deferred = true;
  }

  if (SAL_hasInnerSelfTask()) {
    state.InnerSelf.agent = "";
  }
}

function SAL_inputCommands(inputText) {
  const s = SAL_state();
  const t = String(inputText || "").trim().toLowerCase();

  if (t === "/sal" || t === "/sal status" || t === "/sal help") {
    s.showStatus = true;
    return " ";
  }

  if (t === "/redo arc") {
    if (!s.enabled) {
      s.pendingMessage = "SAL is disabled. Set enabled = true in the SAL Settings Story Card.";
      return " ";
    }
    s.pendingGeneration = true;
    s.captureGeneration = true;
    s.deferred = false;
    s.attempt = 0;
    return " ";
  }

  if (t === "/stop") {
    if (SAL_isBusy() || s.deferred) {
      s.pendingGeneration = false;
      s.captureGeneration = false;
      s.deferred = false;
      s.attempt = 0;
      s.pendingMessage = "Story Arc Light generation stopped.";
      return " ";
    }
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
    SAL_saveArc();
    return "<< ✅ Story Arc Light updated and saved. Click 'Continue'. >>";
  }

  if (s.attempt < s.attemptLimit) {
    s.attempt += 1;
    s.pendingGeneration = true;
    s.captureGeneration = true;
    return `<< ⏳ Story Arc Light retry ${s.attempt}/${s.attemptLimit}. Click 'Continue' or type '/stop'. >>`;
  }

  s.pendingGeneration = false;
  s.captureGeneration = false;
  s.attempt = 0;
  return "<< 🧱 Story Arc Light could not build a valid arc. Keeping the current arc. Type '/redo arc' to retry. >>";
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

function SAL_outputCommands(outputText) {
  const s = SAL_state();

  if (s.pendingMessage) {
    const message = s.pendingMessage;
    s.pendingMessage = "";
    return message;
  }

  if (!s.showStatus) return outputText;
  s.showStatus = false;

  return [
    `Story Arc Light ${SAL_VERSION}`,
    `Enabled: ${s.enabled ? "yes" : "no"}`,
    `Story turns: ${s.turn}`,
    `Refresh every: ${s.turnsPerAICall} turns`,
    `Remove one beat every: ${s.turnsPerElemRemoval === 0 ? "off" : s.turnsPerElemRemoval + " turns"}`,
    `Private arc call pending: ${SAL_isBusy() ? "yes" : "no"}`,
    `Refresh deferred for player input: ${s.deferred ? "yes" : "no"}`,
    `Inner Self detected: ${SAL_hasInnerSelf() ? "yes" : "no"}`,
    "",
    s.arc || "No Story Arc has been generated yet."
  ].join("\n");
}

// Initialize and synchronize editable Story Cards on every hook.
SAL_state();
SAL_syncCards();

// ============================================================================
// SAL — STORY ARC LIGHT — AI DUNGEON INPUT — v1.3.1
// Paste this entire file into the Input tab.
// ============================================================================

SAL_protectPlayerInput(text);
text = SAL_inputCommands(text);

// Optional Inner Self integration. SAL's private planning turn gets exclusive
// use of the model call; normal player turns still allow Inner Self processing.
if (SAL_hasInnerSelf() && !SAL_isBusy()) {
  InnerSelf("input");
}

const modifier = (text) => {
  return { text };
};

modifier(text);
