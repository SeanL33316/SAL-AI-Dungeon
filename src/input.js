// ============================================================================
// INNER SELF + SAL — COMBINED AI DUNGEON INPUT
// Short coordination hook based on the proven scenario structure.
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
