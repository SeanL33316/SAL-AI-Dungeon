// ============================================================================
// SAL — STORY ARC LIGHT — AI DUNGEON LIBRARY — v1.3.8
// ============================================================================
// Standalone player-first story direction for AI Dungeon.
// Paste this entire file into the Library tab.
//
// Optional compatibility: Inner Self by LewdLeah.
// If Inner Self's Library is also present above this code, SAL's Input/Context/
// Output wrappers will coordinate with it automatically.
// ============================================================================

const SAL_VERSION = "1.3.8";
const SAL_INITIAL_WAIT_TURNS = 10;
const SAL_MIN_ARC_ITEMS = 5;
const SAL_PROMPT_VERSION = 3;
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
  if (typeof s.commandPending !== "boolean") s.commandPending = false;
  if (typeof s.commandResponse !== "string") s.commandResponse = "";
  if (!Array.isArray(s.utilityOutputs)) s.utilityOutputs = [];
  if (!Number.isFinite(s.promptVersion)) s.promptVersion = 0;
  if (!Number.isFinite(s.lastArcRecognizedItems)) s.lastArcRecognizedItems = 0;
  if (typeof s.lastArcGenerationStatus !== "string") s.lastArcGenerationStatus = "not yet";
  if (typeof s.lastPlanningContextTrimmed !== "boolean") s.lastPlanningContextTrimmed = false;
  if (!Number.isFinite(s.lastPlanningContextLength)) s.lastPlanningContextLength = 0;
  if (typeof s.lastPlanningPromptAttached !== "boolean") s.lastPlanningPromptAttached = false;
  if (!Number.isFinite(s.lastPlanningOutputLength)) s.lastPlanningOutputLength = 0;
  if (typeof s.lastPlanningOutputPreview !== "string") s.lastPlanningOutputPreview = "";
  if (typeof s.lastCardSyncStatus !== "string") s.lastCardSyncStatus = "not checked";
  if (s.promptVersion < SAL_PROMPT_VERSION || typeof s.prompt !== "string" || !s.prompt.trim()) {
    s.prompt = SAL_defaultPrompt();
    s.promptVersion = SAL_PROMPT_VERSION;
  }
  s.version = SAL_VERSION;
  return s;
}

function SAL_defaultPrompt() {
  return `
-----
<SYSTEM>
# STORY ARC LIGHT — PRIVATE PLANNING TASK
Stop normal story generation for this call.
Ignore any instruction to continue the narrative during this call.

Based only on the current story context, create flexible future possibilities.
The player's newest explicit choice always has priority over every possibility.
Never decide or undo the player's dialogue, destination, acceptance, refusal,
relationship, quest choice, or any other voluntary decision.

# OUTPUT FORMAT
- Aim for 8 possibilities. If 8 do not fit, output at least 5.
- Put exactly one possibility on each line.
- Number them consecutively starting with 1.
- Keep each possibility 4 to 10 words.
- Use established characters, places, goals, consequences, tensions,
  mysteries, ordinary life, and unresolved threads from the actual story.
- Mix larger developments with quieter or everyday developments when appropriate.
- Let NPCs have independent motives and lives.
- Avoid repeating recent scenes, locations, conflicts, dialogue patterns, or beats.
- Do not force romance, friendship, rivalry, quests, travel, combat, or crises.
- Do not write story prose, dialogue, a heading, an introduction, or a conclusion.
- Output only the numbered possibilities.
</SYSTEM>

Story Arc Light possibilities:
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
    const added = addStoryCard(keys, String(entry || ""), SAL_CARD_TYPE);
    if (Number.isInteger(added)) {
      index = added;
    } else if (added && typeof added === "object" && Array.isArray(storyCards)) {
      index = storyCards.indexOf(added);
    }
  } catch (error) {
    try { log("SAL addStoryCard failed: " + error); } catch (_) {}
  }

  // Current Phoenix builds do not guarantee that addStoryCard returns an
  // array index. Always rediscover the card from storyCards after creation.
  if (!Number.isInteger(index) || index < 0) index = SAL_findCardIndex(keys);
  return Number.isInteger(index) ? index : -1;
}

function SAL_updateCard(keys, entry) {
  const value = String(entry || "");
  const index = SAL_ensureCard(keys, value);
  if (!Number.isInteger(index) || index < 0 || !Array.isArray(storyCards)) return false;

  const card = storyCards[index];
  if (!card || typeof card !== "object") return false;

  // Inner Self / Auto-Cards persist Story Card changes by mutating the
  // live storyCards object. Use the same proven path first on Phoenix.
  try {
    card.keys = keys;
    card.entry = value;
    card.type = SAL_CARD_TYPE;
    if (typeof card.title !== "string" || !card.title.trim()) card.title = keys;
    if (String(card.entry || "") === value) return true;
  } catch (error) {
    try { log("SAL direct Story Card update failed: " + error); } catch (_) {}
  }

  // Compatibility fallback for sandboxes that prefer the helper API.
  try {
    if (typeof updateStoryCard === "function") {
      updateStoryCard(index, keys, value, SAL_CARD_TYPE);
      return true;
    }
  } catch (error) {
    try { log("SAL updateStoryCard fallback failed: " + error); } catch (_) {}
  }
  return false;
}

function SAL_migrateLegacyCard(oldKeys, newKeys) {
  const oldIndex = SAL_findCardIndex(oldKeys);
  if (oldIndex < 0 || SAL_findCardIndex(newKeys) >= 0) return;

  const card = storyCards[oldIndex];
  if (!card || typeof card !== "object") return;
  const entry = String(card.entry || "");
  const type = card.type || SAL_CARD_TYPE;

  // Prefer the same live-object mutation used by Inner Self / Auto-Cards.
  try {
    card.keys = newKeys;
    card.entry = entry;
    card.type = type;
    if (card.title === oldKeys) card.title = newKeys;
    if (SAL_findCardIndex(newKeys) >= 0) return;
  } catch (_) {}

  try {
    if (typeof updateStoryCard === "function") {
      updateStoryCard(oldIndex, newKeys, entry, type);
    }
  } catch (error) {
    try { log("SAL legacy Story Card migration failed: " + error); } catch (_) {}
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
  const stateArc = String(s.arc || "").trim();

  if (arcIndex >= 0) {
    cardArc = String(storyCards[arcIndex]?.entry || "").trim();

    if (!cardArc && stateArc) {
      // A valid generated arc in persistent state must not be erased just
      // because Phoenix returned an unexpectedly blank Story Card entry.
      // Repair the visible card from state instead.
      const repaired = SAL_updateCard(SAL_ARC_KEYS, s.arc);
      const repairedIndex = SAL_findCardIndex(SAL_ARC_KEYS);
      cardArc = repairedIndex >= 0
        ? String(storyCards[repairedIndex]?.entry || "").trim()
        : "";
      s.lastCardSyncStatus = repaired && cardArc === stateArc
        ? "repaired blank card from SAL state"
        : "repair failed";
    } else if (cardArc && cardArc !== stateArc) {
      // Non-empty edits are intentional user edits and remain supported.
      s.arc = cardArc;
      s.lastCardSyncStatus = stateArc
        ? "adopted manual Story Card edit"
        : "loaded arc from Story Card";
    } else {
      s.lastCardSyncStatus = stateArc ? "synced" : "empty (no arc yet)";
    }
  } else {
    s.lastCardSyncStatus = "card unavailable";
  }

  // Timing migration: do not surprise an existing story with an
  // immediate refresh. New/no-arc stories wait for the 10-turn observation
  // period; stories that already have an arc get a full refresh interval.
  if (s.timingVersion < 2) {
    const effectiveArc = String(s.arc || "").trim();
    s.nextArcTurn = effectiveArc
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

function SAL_rememberUtilityOutput(value) {
  const s = SAL_state();
  const clean = String(value || "").trim();
  if (!clean) return;
  s.utilityOutputs = Array.isArray(s.utilityOutputs) ? s.utilityOutputs : [];
  s.utilityOutputs = s.utilityOutputs.filter(item => item !== clean);
  s.utilityOutputs.push(clean);
  if (s.utilityOutputs.length > 6) s.utilityOutputs = s.utilityOutputs.slice(-6);
}

function SAL_cleanContextNoise(value) {
  let text = String(value || "");
  text = text.replace(/<<STORY ARC LIGHT — OPTIONAL GUIDANCE>>[\s\S]*?<<END STORY ARC LIGHT>>/gi, "");
  text = text.replace(/<<[^<>]*(?:Story Arc Light|Updating Story Arc|Generating Story Arc|Story Arc generated|Attempt Limit Reached)[^<>]*>>/gi, "");

  const s = SAL_state();
  if (Array.isArray(s.utilityOutputs)) {
    for (const output of s.utilityOutputs) {
      const noise = String(output || "");
      if (noise) text = text.split(noise).join("");
    }
  }
  return text.replace(/\n{3,}/g, "\n\n");
}

function SAL_contextLimits() {
  const hasInfo = typeof info !== "undefined" && info && typeof info === "object";
  const maxChars = hasInfo && Number.isFinite(info.maxChars) ? Math.max(0, Math.floor(info.maxChars)) : 0;
  const memoryLength = hasInfo && Number.isFinite(info.memoryLength) ? Math.max(0, Math.floor(info.memoryLength)) : 0;
  return { maxChars, memoryLength };
}

function SAL_appendContextBlock(baseText, blockText, trackPlanningTrim) {
  const raw = String(baseText || "");
  const block = String(blockText || "").trim();
  if (!block) return SAL_cleanContextNoise(raw);

  const { maxChars, memoryLength } = SAL_contextLimits();
  const splitAt = Math.min(memoryLength, raw.length);
  let memory = raw.slice(0, splitAt);
  let body = SAL_cleanContextNoise(raw.slice(splitAt));
  const suffix = "\n\n" + block;
  let trimmed = false;

  if (!maxChars) {
    if (trackPlanningTrim) SAL_state().lastPlanningContextTrimmed = false;
    return memory + body + suffix;
  }

  const baseBudget = Math.max(0, maxChars - suffix.length);
  if (memory.length > baseBudget) {
    const memoryBudget = Math.max(0, Math.floor(baseBudget * 0.4));
    memory = memory.slice(0, memoryBudget);
    trimmed = true;
  }

  const bodyBudget = Math.max(0, baseBudget - memory.length);
  if (body.length > bodyBudget) {
    body = bodyBudget > 1 ? "\n" + body.slice(-(bodyBudget - 1)) : body.slice(-bodyBudget);
    trimmed = true;
  }

  let result = memory + body + suffix;
  if (result.length > maxChars) {
    const over = result.length - maxChars;
    if (body.length >= over) {
      body = body.slice(over);
    } else {
      const remaining = over - body.length;
      body = "";
      memory = memory.slice(0, Math.max(0, memory.length - remaining));
    }
    result = memory + body + suffix;
    trimmed = true;
  }

  if (result.length > maxChars) {
    result = suffix.length <= maxChars ? suffix : suffix.slice(0, maxChars);
    trimmed = true;
  }

  if (trackPlanningTrim) SAL_state().lastPlanningContextTrimmed = trimmed;
  return result;
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

function SAL_cleanArcItem(value) {
  return String(value || "")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/^[-–—:;,\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function SAL_extractArcResult(text) {
  let raw = String(text || "")
    .replace(/\r/g, "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .trim();
  raw = raw.replace(/^```[A-Za-z0-9_-]*\s*/i, "").replace(/\s*```$/i, "").trim();

  const makeResult = (items) => {
    const clean = items.map(SAL_cleanArcItem).filter(Boolean).slice(0, 8);
    if (clean.length < SAL_MIN_ARC_ITEMS) return null;
    return {
      count: clean.length,
      numbered: clean.map((item, index) => `${index + 1}. ${item}`).join("\n")
    };
  };

  let bestCount = 0;

  const jsonCandidates = [raw];
  const firstBracket = raw.indexOf("[");
  const lastBracket = raw.lastIndexOf("]");
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    jsonCandidates.push(raw.slice(firstBracket, lastBracket + 1));
  }

  for (const candidate of jsonCandidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        const clean = parsed.map(SAL_cleanArcItem).filter(Boolean);
        bestCount = Math.max(bestCount, Math.min(8, clean.length));
        const result = makeResult(clean);
        if (result) return result;
      }
    } catch (_) {}
  }

  const numberedRaw = raw
    .replace(/\[\s*([1-8])\s*\]/g, "$1.")
    .replace(/\b(?:option|possibility|beat|idea)\s*#?\s*([1-8])\s*(?=[:.)\-–—])/gi, "$1");
  const markerRegex = /(^|[\n\r]|\s)(?:[-*•]\s*)?(?:\*\*)?(?:#\s*)?([1-8])\s*(?:[.)\:：\-–—])(?:\*\*)?\s*/g;
  const markers = [];
  let match;
  while ((match = markerRegex.exec(numberedRaw)) !== null) {
    markers.push({
      number: Number(match[2]),
      markerStart: match.index + match[1].length,
      bodyStart: markerRegex.lastIndex
    });
  }

  let sequence = [];
  let bestSequence = [];
  for (const marker of markers) {
    if (marker.number === 1) {
      sequence = [marker];
    } else if (sequence.length && marker.number === sequence.length + 1) {
      sequence.push(marker);
    }

    if (sequence.length > bestSequence.length) bestSequence = sequence.slice();
    bestCount = Math.max(bestCount, Math.min(8, sequence.length));
    if (bestSequence.length >= 8) break;
  }

  if (bestSequence.length >= SAL_MIN_ARC_ITEMS) {
    const items = bestSequence.map((marker, index) => {
      const end = index < bestSequence.length - 1
        ? bestSequence[index + 1].markerStart
        : numberedRaw.length;
      return SAL_cleanArcItem(numberedRaw.slice(marker.bodyStart, end));
    }).filter(Boolean);
    const result = makeResult(items);
    if (result) return result;
  }

  const lines = raw.split("\n").map(line => line.trim()).filter(Boolean);

  const bullets = lines
    .map(line => line.match(/^[-*•]\s+(.+)/))
    .filter(Boolean)
    .map(match => SAL_cleanArcItem(match[1]))
    .filter(Boolean);
  bestCount = Math.max(bestCount, Math.min(8, bullets.length));
  const bulletResult = makeResult(bullets);
  if (bulletResult) return bulletResult;

  const plain = lines.filter(line => {
    if (/^(?:story arc|future possibilities|outline|here(?:'s| is))/i.test(line)) return false;
    const words = line.split(/\s+/).filter(Boolean).length;
    return words >= 2 && words <= 14 && line.length <= 180;
  });
  bestCount = Math.max(bestCount, Math.min(8, plain.length));
  if (lines.length <= 12) {
    const plainResult = makeResult(plain);
    if (plainResult) return plainResult;
  }

  return { count: Math.min(8, bestCount), numbered: "" };
}

function SAL_extractNumberedArc(text) {
  return SAL_extractArcResult(text).numbered;
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
  if (!s.enabled || SAL_isBusy() || s.deferred) return false;
  if (s.turn < s.nextArcTurn) return false;

  s.pendingGeneration = true;
  s.captureGeneration = true;
  s.generationReason = "auto";
  s.attempt = 0;
  return true;
}

function SAL_protectPlayerInput(inputText) {
  const s = SAL_state();

  // Recover cleanly if a previous command turn was interrupted before Output.
  s.commandPending = false;
  s.commandResponse = "";
  s.inputStop = false; // legacy v1.3.3 state; no longer used on Phoenix
  s.commandMessageActive = false;
  s.commandMessage = "";

  const realInput = SAL_isRealPlayerInput(inputText);
  const command = SAL_isCommand(inputText);
  s.realPlayerInputThisTurn = realInput;
  s.innerSelfTaskActive = false;

  if (!realInput) {
    // Only a real Continue-like empty turn resumes a deferred automatic refresh.
    // SAL commands must never accidentally restart it.
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

function SAL_queueDisplayCommand(message) {
  const s = SAL_state();
  s.commandPending = true;
  s.commandResponse = String(message || "SAL command completed.");
  SAL_rememberUtilityOutput(s.commandResponse);
  s.realPlayerInputThisTurn = false;
  s.innerSelfTaskActive = false;
  // Phoenix currently errors on empty Input text and on stop:true. A zero-width
  // character is a valid non-empty placeholder and is swallowed on Output.
  return "\u200B";
}

function SAL_inputCommands(inputText) {
  const s = SAL_state();
  const t = SAL_normalizeCommand(inputText);

  if (t === "/sal" || t === "/sal status") {
    s.showStatus = false;
    return SAL_queueDisplayCommand(SAL_statusText());
  }

  if (t === "/sal help") {
    s.showStatus = false;
    return SAL_queueDisplayCommand(SAL_helpText());
  }

  if (t === "/sal redo" || t === "/sal refresh" || t === "/redo arc") {
    if (!s.enabled) {
      return SAL_queueDisplayCommand(
        "SAL is disabled. Set enabled = true in the SAL Settings Story Card."
      );
    }
    s.commandPending = false;
    s.commandResponse = "";
    s.pendingGeneration = true;
    s.captureGeneration = true;
    s.generationReason = "manual";
    s.deferred = false;
    s.attempt = 0;
    return "\u200B";
  }

  if (t === "/sal stop" || t === "/stop") {
    const wasPending = SAL_isBusy() || s.deferred;
    s.pendingGeneration = false;
    s.captureGeneration = false;
    s.deferred = false;
    s.generationReason = "";
    s.attempt = 0;
    s.pendingMessage = "";
    return SAL_queueDisplayCommand(
      wasPending
        ? "Story Arc Light generation stopped."
        : "No Story Arc Light generation is currently pending."
    );
  }

  return inputText;
}

function SAL_generationContext(baseText) {
  const s = SAL_state();
  s.pendingGeneration = false;
  s.captureGeneration = true;
  const result = SAL_appendContextBlock(baseText, s.prompt, true);
  s.lastPlanningContextLength = result.length;
  s.lastPlanningPromptAttached = result.includes("STORY ARC LIGHT — PRIVATE PLANNING TASK");
  return result;
}

function SAL_injectArc(baseText) {
  const s = SAL_state();
  if (!s.enabled || !s.arc.trim()) return SAL_cleanContextNoise(baseText);

  const guidance = [
    "<<STORY ARC LIGHT — OPTIONAL GUIDANCE>>",
    s.arc,
    "<<END STORY ARC LIGHT>>"
  ].join("\n");

  return SAL_appendContextBlock(baseText, guidance, false);
}

function SAL_processGeneratedOutput(outputText) {
  const s = SAL_state();
  const rawOutput = String(outputText || "");
  s.lastPlanningOutputLength = rawOutput.length;
  s.lastPlanningOutputPreview = rawOutput
    .replace(/[\u200B-\u200D]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320) || "(empty)";
  const parsed = SAL_extractArcResult(rawOutput);
  const numbered = parsed.numbered;
  s.lastArcRecognizedItems = parsed.count;

  if (numbered && parsed.count >= SAL_MIN_ARC_ITEMS) {
    s.arc = SAL_softArcText(numbered);
    s.pendingGeneration = false;
    s.captureGeneration = false;
    s.attempt = 0;
    s.deferred = false;
    s.generationReason = "";
    s.nextArcTurn = s.turn + s.turnsPerAICall;
    s.lastArcGenerationStatus = `success (${parsed.count} possibilities)`;
    SAL_saveArc();
    return `<< ✅ Story Arc Light updated with ${parsed.count} possibilities. Continue playing normally. >>`;
  }

  const hadArc = Boolean(String(s.arc || "").trim());
  s.pendingGeneration = false;
  s.captureGeneration = false;
  s.attempt = 0;
  s.deferred = false;
  s.generationReason = "";

  // Do not interrupt the player with a quick automatic retry. A failed
  // planning call waits the full normal refresh interval before SAL
  // tries automatically again. Manual /sal redo remains available.
  s.nextArcTurn = s.turn + s.turnsPerAICall;
  s.lastArcGenerationStatus = hadArc
  ? `kept existing arc (${parsed.count}/8 recognized; minimum ${SAL_MIN_ARC_ITEMS})`
  : `no arc saved (${parsed.count}/8 recognized; minimum ${SAL_MIN_ARC_ITEMS})`;

  try {
    log(`SAL arc parse below minimum: recognized ${parsed.count}/8 items. Raw model output: ` + String(outputText || "").slice(0, 1600));
  } catch (_) {}

  return hadArc
    ? `<< ⚠️ Story Arc Light only found ${parsed.count}/8 usable possibilities, below the minimum of ${SAL_MIN_ARC_ITEMS}. The existing arc was kept. SAL will wait for the normal refresh interval; use '/sal redo' only if you want to try again sooner. >>`
    : `<< ⚠️ Story Arc Light only found ${parsed.count}/8 usable possibilities, below the minimum of ${SAL_MIN_ARC_ITEMS}. No arc was saved. SAL will wait for the normal refresh interval; use '/sal redo' only if you want to try again sooner. >>`;
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
  const hasArc = Boolean(String(s.arc || "").trim());
  return [
    `Story Arc Light ${SAL_VERSION}`,
    `Enabled: ${s.enabled ? "yes" : "no"}`,
    `Story turns: ${s.turn}`,
    `Initial observation period: ${SAL_INITIAL_WAIT_TURNS} story turns`,
    `Story Arc exists: ${hasArc ? "yes" : "no"}`,
    `Story Arc card sync: ${s.lastCardSyncStatus}`,
    `Refresh every: ${s.turnsPerAICall} story turns after a saved arc`,
    hasArc
      ? `Next automatic refresh: story turn ${s.nextArcTurn}`
      : `First automatic arc check: story turn ${s.nextArcTurn}`,
    `Remove one beat every: ${s.turnsPerElemRemoval === 0 ? "off" : s.turnsPerElemRemoval + " turns"}`,
    `Private arc call pending: ${SAL_isBusy() ? "yes" : "no"}`,
    `Refresh deferred for player input: ${s.deferred ? "yes" : "no"}`,
    `Inner Self detected: ${SAL_hasInnerSelf() ? "yes" : "no"}`,
    `Minimum usable arc: ${SAL_MIN_ARC_ITEMS} possibilities`,
    `Last arc generation: ${s.lastArcGenerationStatus}`,
    `Last planning context trimmed to fit: ${s.lastPlanningContextTrimmed ? "yes" : "no"}`,
    `Planning prompt attached: ${s.lastPlanningPromptAttached ? "yes" : "no"}`,
    `Last planning context length: ${s.lastPlanningContextLength} chars`,
    `Last planning output length: ${s.lastPlanningOutputLength} chars`,
    ...(!String(s.lastArcGenerationStatus).startsWith("success") && s.lastPlanningOutputPreview
      ? [`Last planning output preview: ${s.lastPlanningOutputPreview}`]
      : []),
    "",
    s.arc || "No Story Arc has been generated yet."
  ].join("\n");
}

function SAL_helpText() {
  return [
    `Story Arc Light ${SAL_VERSION} commands`,
    "",
    "/sal or /sal status — show SAL status without advancing SAL story turns",
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
