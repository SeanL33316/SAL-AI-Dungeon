// ============================================================================
// SAL — STORY ARC LIGHT — AI DUNGEON INPUT — v1.3.4
// Paste this entire file into the Input tab.
// ============================================================================

SAL_protectPlayerInput(text);
text = SAL_inputCommands(text);

// Optional Inner Self integration. SAL's private planning turn gets exclusive
// use of the model call; normal player turns still allow Inner Self processing.
const salInput = SAL_state();
if (SAL_hasInnerSelf() && !SAL_isBusy() && !salInput.commandPending) {
  InnerSelf("input");
}

const modifier = (text) => {
  return { text };
};

modifier(text);
