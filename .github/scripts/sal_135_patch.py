from pathlib import Path

sal_path = Path('SAL-only/library.js')
text = sal_path.read_text()


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)


def replace_between(text, start_marker, end_marker, new_block, label):
    start = text.find(start_marker)
    if start < 0:
        raise RuntimeError(f'{label}: start marker not found')
    end = text.find(end_marker, start)
    if end < 0:
        raise RuntimeError(f'{label}: end marker not found')
    return text[:start] + new_block.rstrip() + '\n\n' + text[end:]


text = text.replace('v1.3.4', 'v1.3.5')
text = text.replace('const SAL_VERSION = \"1.3.4\";', 'const SAL_VERSION = \"1.3.5\";')
text = replace_once(
    text,
    'const SAL_FAILED_RETRY_COOLDOWN = 5;\n',
    'const SAL_FAILED_RETRY_COOLDOWN = 5;\nconst SAL_PROMPT_VERSION = 2;\n',
    'prompt version constant'
)

text = replace_once(
    text,
    '  if (typeof s.commandResponse !== "string") s.commandResponse = "";\n  if (typeof s.prompt !== "string" || !s.prompt.trim()) s.prompt = SAL_defaultPrompt();\n  s.version = SAL_VERSION;\n',
    '  if (typeof s.commandResponse !== "string") s.commandResponse = "";\n'
    '  if (!Array.isArray(s.utilityOutputs)) s.utilityOutputs = [];\n'
    '  if (!Number.isFinite(s.promptVersion)) s.promptVersion = 0;\n'
    '  if (!Number.isFinite(s.lastArcRecognizedItems)) s.lastArcRecognizedItems = 0;\n'
    '  if (typeof s.lastArcGenerationStatus !== "string") s.lastArcGenerationStatus = "not yet";\n'
    '  if (typeof s.lastPlanningContextTrimmed !== "boolean") s.lastPlanningContextTrimmed = false;\n'
    '  if (s.promptVersion < SAL_PROMPT_VERSION || typeof s.prompt !== "string" || !s.prompt.trim()) {\n'
    '    s.prompt = SAL_defaultPrompt();\n'
    '    s.promptVersion = SAL_PROMPT_VERSION;\n'
    '  }\n'
    '  s.version = SAL_VERSION;\n',
    'state migration'
)

new_prompt = r'''function SAL_defaultPrompt() {
  return `
<<
<SYSTEM>
Stop normal story generation temporarily.

Create ONLY a numbered list of exactly 8 flexible future possibilities for the
current story. Do not continue the narrative and do not write prose outside the
list.

PLAYER AGENCY IS HIGHEST PRIORITY:
- The player's newest explicit input always outranks the outline.
- Never decide or undo the player's dialogue, destination, acceptance, refusal,
  relationship, quest choice, or other voluntary decision.
- If the player changes direction, adapt, replace, delay, or discard ideas.
- Treat every item as an optional possibility, never destiny.

STORY ARC LIGHT:
- Output exactly 8 lines numbered 1. through 8.
- Each item must be only 4 to 8 words.
- Keep the entire response under 80 words.
- Use established characters, places, goals, consequences, tensions, mysteries,
  ordinary life, and unresolved threads from the actual story.
- Mix major developments with quieter or everyday developments when appropriate.
- Let NPCs have independent motives and lives.
- Avoid repeating recent scenes, locations, conflicts, dialogue patterns, or beats.
- Do not force romance, friendship, rivalry, quests, travel, combat, or crises.
- No heading, introduction, explanation, closing text, or extra commentary.

Output the eight numbered lines only.
</SYSTEM>
>>
  `.trim();
}'''
text = replace_between(text, 'function SAL_defaultPrompt() {', 'function SAL_hasInnerSelf() {', new_prompt, 'default prompt')

helpers = r'''function SAL_rememberUtilityOutput(value) {
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
}'''
text = replace_once(text, 'function SAL_softArcText(numbered) {', helpers + '\n\nfunction SAL_softArcText(numbered) {', 'context helpers insertion')

new_parser = r'''function SAL_cleanArcItem(value) {
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

  let bestCount = 0;
  const jsonCandidates = [raw];
  const firstBracket = raw.indexOf("[");
  const lastBracket = raw.lastIndexOf("]");
  if (firstBracket >= 0 && lastBracket > firstBracket) jsonCandidates.push(raw.slice(firstBracket, lastBracket + 1));

  for (const candidate of jsonCandidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        const items = parsed.map(SAL_cleanArcItem).filter(Boolean);
        bestCount = Math.max(bestCount, items.length);
        if (items.length >= 8) {
          return { count: 8, numbered: items.slice(0, 8).map((item, index) => `${index + 1}. ${item}`).join("\n") };
        }
      }
    } catch (_) {}
  }

  const numberedRaw = raw.replace(/\[\s*([1-8])\s*\]/g, "$1.");
  const markerRegex = /(^|[\n\r]|\s)(?:[-*•]\s*)?(?:\*\*)?([1-8])\s*(?:[.)\:：\-–—])(?:\*\*)?\s+/g;
  const markers = [];
  let match;
  while ((match = markerRegex.exec(numberedRaw)) !== null) {
    markers.push({ number: Number(match[2]), markerStart: match.index + match[1].length, bodyStart: markerRegex.lastIndex });
  }

  let sequence = [];
  let completed = null;
  for (const marker of markers) {
    if (marker.number === 1) sequence = [marker];
    else if (sequence.length && marker.number === sequence.length + 1) sequence.push(marker);
    bestCount = Math.max(bestCount, sequence.length);
    if (sequence.length === 8) {
      completed = sequence.slice();
      break;
    }
  }

  if (completed) {
    const items = completed.map((marker, index) => {
      const end = index < completed.length - 1 ? completed[index + 1].markerStart : numberedRaw.length;
      return SAL_cleanArcItem(numberedRaw.slice(marker.bodyStart, end));
    }).filter(Boolean);
    bestCount = Math.max(bestCount, items.length);
    if (items.length >= 8) {
      return { count: 8, numbered: items.slice(0, 8).map((item, index) => `${index + 1}. ${item}`).join("\n") };
    }
  }

  const lines = raw.split("\n").map(line => line.trim()).filter(Boolean);
  const bullets = lines.map(line => line.match(/^[-*•]\s+(.+)/)).filter(Boolean).map(match => SAL_cleanArcItem(match[1])).filter(Boolean);
  bestCount = Math.max(bestCount, bullets.length);
  if (bullets.length >= 8) {
    return { count: 8, numbered: bullets.slice(0, 8).map((item, index) => `${index + 1}. ${item}`).join("\n") };
  }

  const plain = lines.filter(line => {
    if (/^(?:story arc|future possibilities|outline|here(?:'s| is))/i.test(line)) return false;
    const words = line.split(/\s+/).filter(Boolean).length;
    return words >= 2 && words <= 14 && line.length <= 180;
  });
  bestCount = Math.max(bestCount, plain.length);
  if (plain.length >= 8 && lines.length <= 12) {
    return { count: 8, numbered: plain.slice(0, 8).map((item, index) => `${index + 1}. ${SAL_cleanArcItem(item)}`).join("\n") };
  }

  return { count: Math.min(8, bestCount), numbered: "" };
}

function SAL_extractNumberedArc(text) {
  return SAL_extractArcResult(text).numbered;
}'''
text = replace_between(text, 'function SAL_extractNumberedArc(text) {', 'function SAL_removeFirstArcItem() {', new_parser, 'arc parser')

text = replace_once(text, '  if (!s.enabled || SAL_isBusy()) return false;\n', '  if (!s.enabled || SAL_isBusy() || s.deferred) return false;\n', 'deferred scheduling guard')
text = replace_once(text, '  s.commandResponse = String(message || "SAL command completed.");\n  s.realPlayerInputThisTurn = false;\n', '  s.commandResponse = String(message || "SAL command completed.");\n  SAL_rememberUtilityOutput(s.commandResponse);\n  s.realPlayerInputThisTurn = false;\n', 'utility output memory')

new_context_functions = r'''function SAL_generationContext(baseText) {
  const s = SAL_state();
  s.pendingGeneration = false;
  s.captureGeneration = true;
  return SAL_appendContextBlock(baseText, s.prompt, true);
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
}'''
text = replace_between(text, 'function SAL_generationContext(baseText) {', 'function SAL_processGeneratedOutput(outputText) {', new_context_functions, 'context generation/injection')

new_process = r'''function SAL_processGeneratedOutput(outputText) {
  const s = SAL_state();
  const parsed = SAL_extractArcResult(outputText);
  const numbered = parsed.numbered;
  s.lastArcRecognizedItems = parsed.count;

  if (numbered) {
    s.arc = SAL_softArcText(numbered);
    s.pendingGeneration = false;
    s.captureGeneration = false;
    s.attempt = 0;
    s.deferred = false;
    s.generationReason = "";
    s.nextArcTurn = s.turn + s.turnsPerAICall;
    s.lastArcGenerationStatus = "success";
    SAL_saveArc();
    return "<< ✅ Story Arc Light updated and saved. Continue playing normally. >>";
  }

  const hadArc = Boolean(String(s.arc || "").trim());
  s.pendingGeneration = false;
  s.captureGeneration = false;
  s.attempt = 0;
  s.deferred = false;
  s.generationReason = "";
  s.nextArcTurn = Math.max(s.nextArcTurn, s.turn + SAL_FAILED_RETRY_COOLDOWN);
  s.lastArcGenerationStatus = `failed (${parsed.count}/8 recognized)`;

  try {
    log(`SAL arc parse failed: recognized ${parsed.count}/8 items. Raw model output: ` + String(outputText || "").slice(0, 1600));
  } catch (_) {}

  return hadArc
    ? `<< ⚠️ Story Arc Light could not build a valid 8-part arc this time (${parsed.count}/8 items recognized). The existing arc was kept. Continue playing normally, or use '/sal redo' to try again. >>`
    : `<< ⚠️ Story Arc Light could not build a valid 8-part arc this time (${parsed.count}/8 items recognized). No arc was saved. Continue playing normally; SAL will try again later, or use '/sal redo' to try again now. >>`;
}'''
text = replace_between(text, 'function SAL_processGeneratedOutput(outputText) {', 'function SAL_onNormalOutput(outputText) {', new_process, 'generation output processing')

text = replace_once(
    text,
    '    `Inner Self detected: ${SAL_hasInnerSelf() ? "yes" : "no"}`,\n    "",\n',
    '    `Inner Self detected: ${SAL_hasInnerSelf() ? "yes" : "no"}`,\n'
    '    `Last arc generation: ${s.lastArcGenerationStatus}`,\n'
    '    `Last planning context trimmed to fit: ${s.lastPlanningContextTrimmed ? "yes" : "no"}`,\n'
    '    "",\n',
    'status diagnostics'
)

sal_path.write_text(text)

for name in ['input.js', 'context.js', 'output.js']:
    p = Path('SAL-only') / name
    p.write_text(p.read_text().replace('v1.3.4', 'v1.3.5'))

for filename in ['SAL-only/context.js', 'src/context.js']:
    p = Path(filename)
    hook = p.read_text()
    old = '} else if (SAL_isBusy()) {\n  // SAL owns this private planning call.\n  if (state.InnerSelf) state.InnerSelf.agent = "";\n  sal.innerSelfTaskActive = false;\n  text = SAL_generationContext(text);\n'
    new = '} else if (SAL_isBusy()) {\n  // SAL owns this private planning call.\n  if (state.InnerSelf) state.InnerSelf.agent = "";\n  sal.innerSelfTaskActive = false;\n  globalThis.stop = false;\n  text = SAL_generationContext(text);\n'
    hook = replace_once(hook, old, new, f'{filename}: SAL stop reset')
    p.write_text(hook)

combined_path = Path('src/library.js')
combined = combined_path.read_text()
combined = combined.replace('Story Arc Light (SAL) v1.3.4', 'Story Arc Light (SAL) v1.3.5', 1)
marker = '// ============================================================================\n// SAL — STORY ARC LIGHT — AI DUNGEON LIBRARY —'
idx = combined.find(marker)
if idx < 0:
    raise RuntimeError('combined SAL marker not found')
combined_path.write_text(combined[:idx] + sal_path.read_text())

readme_path = Path('README.md')
readme = readme_path.read_text().replace('SAL) v1.3.4', 'SAL) v1.3.5')
readme = readme.replace(
    '3. **The planning turn asks the AI for exactly 8 short future possibilities.** These are broad possibilities based on established characters, places, goals, tensions, mysteries, consequences, and unresolved threads.\n',
    "3. **The planning turn asks the AI for exactly 8 very short future possibilities.** Each item is kept compact so all eight fit even with shorter model response settings. SAL also reserves room for its private planning prompt inside AI Dungeon's `info.maxChars` limit so late-story refreshes do not lose the instructions to context truncation.\n"
)
readme = readme.replace(
    "7. **If SAL is waiting to perform a private planning turn and the player types a real action, SAL defers its refresh.** The player's action is processed normally first; SAL can refresh later on a Continue-like turn.\n",
    "7. **If SAL is waiting to perform a private planning turn and the player types a real action, SAL defers its refresh.** The player's action is processed normally first, and SAL stays deferred until a later Continue-like turn instead of immediately scheduling itself again.\n"
)
readme = readme.replace(
    '9. **SAL eventually creates a fresh set of possibilities.** This keeps long stories moving while allowing the plot to evolve naturally. If a planning response is malformed, SAL stops cleanly instead of entering a Continue/retry loop; it keeps the old arc and tries automatically again later.\n',
    '9. **SAL eventually creates a fresh set of possibilities.** The parser accepts common numbered, one-line, bracketed, bullet, JSON-array, and short-line formats. If a response is still unusable, SAL stops cleanly instead of entering a Continue/retry loop, keeps the old arc, records how many items it recognized, and tries automatically again later.\n'
)
readme_path.write_text(readme)
