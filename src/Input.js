// ============================================================================
// STORY ARC LIGHT (SAL) — INPUT TAB — v1.2.0
// ============================================================================

SAL_protectPlayerInput(text);
text = SAL_inputCommands(text);
text = onInput_SAE(text);

// Optional Inner Self integration. SAL's private arc-generation turn belongs
// exclusively to SAL, so Inner Self is skipped during that call.
if (SAL_hasInnerSelf() && !SAL_isBusy()) {
  InnerSelf("input");
}

const modifier = (text) => {
  return { text };
};

modifier(text);
