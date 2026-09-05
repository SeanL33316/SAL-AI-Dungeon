// ============================================================================
// SAL — STORY ARC LIGHT — AI DUNGEON INPUT — v1.3.2
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
