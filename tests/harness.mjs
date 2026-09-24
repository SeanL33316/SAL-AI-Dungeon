// Local contract model, not the AI Dungeon service or its model.
// A fresh JS realm and JSON round-trip per hook catch accidental global storage.
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clone = value => JSON.parse(JSON.stringify(value));
export const beats = Array.from({ length: 8 }, (_, i) => `${i + 1}. A familiar neighbor reveals another local mystery`).join('\n');
export class Adventure {
  constructor(packageName = 'SAL-only', options = {}) {
    this.packageName = packageName;
    this.state = {};
    this.cards = [];
    this.history = [];
    this.count = 0;
    this.options = options;
    this.logs = [];
  }
  run(hook, text = '', extra = '') {
    const context = {
      state: clone(this.state), storyCards: clone(this.cards), history: clone(this.history), text,
      info: hook === 'context' ? { actionCount: this.count, maxChars: 12000, memoryLength: 0, ...this.options.info } : { actionCount: this.count },
      log: (...args) => this.logs.push(args.join(' ')),
    };
    context.console = { log: context.log };
    context.addStoryCard = (keys, entry, type, title = keys, description = '', options = {}) => {
      if (this.options.noCards) throw Error('Simulated card service failure');
      if (context.storyCards.some(c => c?.keys === keys)) return false;
      const card = { id: context.storyCards.length + 10, keys, entry, type, title, description };
      const index = context.storyCards.push(card) - 1;
      if (options.returnCard || this.options.addReturn === 'object') return card;
      return this.options.addReturn === 'undefined' ? undefined : this.options.addReturn === 'wrong-index' ? 0 : index;
    };
    context.updateStoryCard = (index, keys, entry, type) => {
      if (this.options.noopUpdate) return;
      if (this.options.readonly || !context.storyCards[index]) throw Error('Simulated update failure');
      Object.assign(context.storyCards[index], { keys, entry, type });
    };
    context.removeStoryCard = index => context.storyCards.splice(index, 1);
    if (this.options.readonly) context.storyCards.forEach(Object.freeze);
    vm.createContext(context);
    vm.runInContext('Math.random = () => 0.1', context);
    const library = fs.readFileSync(path.join(root, this.packageName, '1-Library.js'), 'utf8');
    const file = { input: '2-Input.js', context: '3-Context.js', output: '4-Output.js' }[hook];
    const source = library + '\n' + (this.options.setup || '') + '\n' + (file ? fs.readFileSync(path.join(root, this.packageName, file), 'utf8') : '') + '\n' + extra;
    const result = vm.runInContext(source, context, { timeout: 2000, filename: `${this.packageName}/${hook}` });
    this.state = clone(context.state);
    this.cards = clone(context.storyCards);
    return result;
  }
  evaluate(code) { return this.run('library', '', code); }
  turn(input, output = 'The story moves forward.', base = 'Recent Story:\nMira waits beside the village bridge.') {
    this.count++;
    const i = this.run('input', input);
    if (input) this.history.push({ type: 'story', text: input });
    const c = this.run('context', base + (input ? '\n' + input : ''));
    const o = this.run('output', output);
    this.history.push({ type: 'continue', text: o.text });
    return { input: i, context: c, output: o };
  }
  settings(entry) { this.cards.find(c => c.keys === 'SAL Settings').entry = entry; }
}
