// ============================================================================
// SAL — STORY ARC LIGHT — AI DUNGEON INPUT — v1.3.3
// Paste this entire file into the Input tab.
// ============================================================================

SAL_protectPlayerInput(text);
text = SAL_inputCommands(text);

// Optional Inner Self integration. SAL's private planning turn gets exclusive
// use of the model call; normal player turns still allow Inner Self processing.
const salInput = SAL_state();
if (SAL_hasInnerSelf() && !SAL_isBusy() && !salInput.inputStop) {
  InnerSelf("input");
}

const modifier = (text) => {
  return {
    text,
    stop: salInput.inputStop === true
  };
};

modifier(text);
