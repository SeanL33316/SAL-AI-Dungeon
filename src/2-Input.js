// ============================================================================
// SAL — STORY ARC LIGHT — AI DUNGEON INPUT — v1.3.9
// Paste this entire file into the Input tab.
// ============================================================================

if (typeof SAL_state !== "function") {
  throw new Error("SAL Library is missing or incomplete. Replace all four tabs with files from the same SAL package and save.");
}

SAL_protectPlayerInput(text);
text = SAL_inputCommands(text);

// Optional Inner Self integration. SAL's private planning turn gets exclusive
// use of the model call; normal player turns still allow Inner Self processing.
const salInput = SAL_state();
if (SAL_hasInnerSelf() && !SAL_isBusy() && !salInput.commandPending) {
  InnerSelf("input");
}

if (typeof text !== "string" || text.length === 0) text = "\u200B";

const modifier = (text) => {
  return { text };
};

modifier(text);
