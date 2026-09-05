// ============================================================================
// SAL — STORY ARC LIGHT — AI DUNGEON OUTPUT — v1.3.2
// Paste this entire file into the Output tab.
// ============================================================================

const sal = SAL_state();

if (sal.captureGeneration) {
  // This model output is SAL's private eight-beat planning response.
  if (state.InnerSelf) state.InnerSelf.agent = "";
  text = SAL_processGeneratedOutput(text);
} else if (SAL_hasInnerSelf() && sal.innerSelfTaskActive) {
  // Let Inner Self consume/hide its own private brain-operation output.
  InnerSelf("output");
  sal.innerSelfTaskActive = false;
  sal.realPlayerInputThisTurn = false;
} else {
  if (SAL_hasInnerSelf()) InnerSelf("output");
  text = SAL_onNormalOutput(text);
}

text = SAL_outputCommands(text);

// AI Dungeon throws an error if Output returns an empty string.
if (typeof text !== "string" || text.length === 0) text = "\u200B";

const modifier = (text) => {
  return { text };
};

modifier(text);
