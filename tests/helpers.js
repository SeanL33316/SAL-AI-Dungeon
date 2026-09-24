const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const SAL_MARKER = "// ============================================================================\n// SAL — STORY ARC LIGHT — AI DUNGEON LIBRARY";

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function sourceFor(packageName = "SAL-only") {
  if (packageName === "SAL-only") return read("SAL-only/1-Library.js");
  const combined = read("src/1-Library.js");
  const index = combined.lastIndexOf(SAL_MARKER);
  if (index < 0) throw new Error("SAL marker missing from combined Library");
  return combined.slice(index);
}

function createSandbox(options = {}) {
  const storyCards = options.storyCards || [];
  const state = options.state || {};
  const sandbox = {
    state,
    storyCards,
    history: options.history || [],
    info: options.info || { maxChars: 12000, memoryLength: 0 },
    text: options.text || "",
    stop: false,
    logs: [],
    log(value) { sandbox.logs.push(String(value)); },
    addStoryCard(keys, entry, type) {
      const card = { keys, entry: String(entry || ""), type, title: String(keys || "") };
      storyCards.push(card);
      return card;
    }
  };
  if (options.updateStoryCard) sandbox.updateStoryCard = options.updateStoryCard;
  vm.createContext(sandbox);
  return sandbox;
}

function loadSal(packageName = "SAL-only", options = {}) {
  const sandbox = createSandbox(options);
  const source = sourceFor(packageName);
  const exports = [
    "SAL_VERSION",
    "SAL_state",
    "SAL_parseSettings",
    "SAL_extractArcResult",
    "SAL_scheduleIfDue",
    "SAL_generationContext",
    "SAL_appendContextBlock",
    "SAL_processGeneratedOutput",
    "SAL_hasInnerSelfTask",
    "SAL_postponeAutoCardsForPlayerInput",
    "SAL_isBusy",
    "SAL_protectPlayerInput",
    "SAL_inputCommands",
    "SAL_syncCards",
    "SAL_saveArc",
    "SAL_onNormalOutput"
  ];
  vm.runInContext(
    source + "\n;globalThis.__SAL_TEST__ = {" + exports.join(",") + "};",
    sandbox,
    { filename: packageName + "/1-Library.js" }
  );
  return { sandbox, api: sandbox.__SAL_TEST__, source };
}

function runHook(packageName, hookFile, options = {}) {
  const { sandbox, api } = loadSal(packageName, options);
  sandbox.text = options.text || "";
  sandbox.stop = options.stop === true;
  if (options.InnerSelf) sandbox.InnerSelf = options.InnerSelf(sandbox, api);
  if (options.AutoCards) sandbox.AutoCards = options.AutoCards(sandbox, api);
  const rel = packageName === "SAL-only" ? "SAL-only/" + hookFile : "src/" + hookFile;
  const result = vm.runInContext(read(rel), sandbox, { filename: rel });
  return { sandbox, api, result };
}

module.exports = { ROOT, read, sourceFor, loadSal, runHook };
