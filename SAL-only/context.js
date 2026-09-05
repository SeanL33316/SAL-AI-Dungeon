// ============================================================================
// SAL — STORY ARC LIGHT — AI DUNGEON CONTEXT — v1.3.4
// Paste this entire file into the Context tab.
// ============================================================================

globalThis.stop ??= false;
const sal = SAL_state();

if (sal.commandPending) {
  // Phoenix has no clean no-model command path: stop:true throws an error and
  // state.message is not implemented. Use one tiny hidden model call, then
  // replace its Output with the command response.
  if (state.InnerSelf) state.InnerSelf.agent = "";
  sal.innerSelfTaskActive = false;
  globalThis.stop = false;
  text = "SAL utility command. Reply with OK only.";
} else if (SAL_isBusy()) {
  // SAL owns this private planning call.
  if (state.InnerSelf) state.InnerSelf.agent = "";
  sal.innerSelfTaskActive = false;
  text = SAL_generationContext(text);
} else {
  const beforeInnerSelf = text;
  let innerTask = false;

  if (SAL_hasInnerSelf()) {
    InnerSelf("context");
    innerTask = SAL_hasInnerSelfTask();

    // Never let a private Inner Self task consume an explicit player action.
    if (sal.realPlayerInputThisTurn && innerTask) {
      if (state.InnerSelf) state.InnerSelf.agent = "";
      globalThis.stop = false;
      text = beforeInnerSelf;
      innerTask = false;
    }
  }

  sal.innerSelfTaskActive = innerTask;

  // Arc guidance belongs only in an ordinary narrative model call.
  if (globalThis.stop !== true && !innerTask) {
    text = SAL_injectArc(text);
  }
}

const modifier = (text) => {
  return {
    text,
    stop: globalThis.stop === true
  };
};

modifier(text);
