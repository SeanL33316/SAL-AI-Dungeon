// ============================================================================
// STORY ARC LIGHT (SAL) — INPUT TAB — v1.2.0
// ============================================================================

SAL_protectPlayerInput(text);
text = SAL_inputCommands(text);
text = onInput_SAE(text);

if (SAL_hasInnerSelf() && !SAL_isBusy()) {
  InnerSelf("input");
}

const modifier = (text) => {
  return { text };
};

modifier(text);
