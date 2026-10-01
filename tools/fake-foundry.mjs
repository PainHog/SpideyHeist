/**
 * HEISTY SPIDEYS — a minimal, deterministic stand-in for Foundry VTT (test support)
 * --------------------------------------------------------------------------------
 * Just enough of the v13 client API for the integration smoke test
 * (test/integration-smoke.test.mjs) to boot the real system entry module and
 * play a heist across the three automation packages together, with no browser.
 *
 * What it models (and enforces, so permission bugs fail loudly):
 *  - several connected clients in one process: `game.user` is whoever is acting
 *    *now* (AsyncLocalStorage), and every document event / setting change is
 *    delivered to every connected client's hooks, as Foundry does;
 *  - documents: Actors (with the system's data models and derived data), Items,
 *    ChatMessages — players may write only what they own (actors) or authored
 *    (messages); creating actors and writing world settings are GM-only;
 *  - User#query (CONFIG.queries handlers called as (data, {timeout}) on the
 *    target user's client, data JSON-cloned like the wire);
 *  - dice from a scripted queue (then a seeded generator), so runs repeat;
 *  - DialogV2 answered by scripted responders; ApplicationV2 apps "render" by
 *    compiling their PARTS templates against their real context;
 *  - a tiny DOM (elements, buttons, click listeners) for chat-card buttons and
 *    the Alert HUD.
 * It is NOT shipped (release.yml excludes tools/).
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import HandlebarsLib from "handlebars";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SYSTEM_ID = "heisty-spideys";

/* ------------------------------------------------------------------ state -- */

export const log = { errors: [], warnings: [], infos: [], rolls: [], dialogs: [], emits: [], work: 0 };
const als = new AsyncLocalStorage();
let defaultUser = null;

const touch = () => { log.work++; };
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

/* ---------------------------------------------------------------- utils -- */

const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);

function getProperty(obj, path) {
  if (!path) return obj;
  return String(path).split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setProperty(obj, path, value) {
  const keys = String(path).split(".");
  let o = obj;
  for (const k of keys.slice(0, -1)) { if (!isObj(o[k])) o[k] = {}; o = o[k]; }
  o[keys.at(-1)] = value;
  return true;
}
function hasProperty(obj, path) {
  const keys = String(path).split(".");
  let o = obj;
  for (const k of keys) {
    if (!isObj(o) || !(k in o)) return false;
    o = o[k];
  }
  return true;
}
function expandObject(flat) {
  const out = {};
  for (const [k, v] of Object.entries(flat ?? {})) {
    const val = isObj(v) ? expandObject(v) : v;
    const cur = getProperty(out, k);
    if (isObj(cur) && isObj(val)) mergeObject(cur, val); else setProperty(out, k, val);
  }
  return out;
}
/** Foundry's mergeObject (insert/overwrite, recursive for plain objects; arrays replace). */
function mergeObject(target, source) {
  for (const [k, v] of Object.entries(source ?? {})) {
    if (isObj(v) && isObj(target[k])) mergeObject(target[k], v);
    else target[k] = isObj(v) ? clone(v) : (Array.isArray(v) ? clone(v) : v);
  }
  return target;
}
function isNewerVersion(v1, v0) {
  const a = String(v1).split(".").map(Number), b = String(v0).split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return false;
}
let idCounter = 0;
const randomID = (n = 16) => {
  idCounter++;
  const base = `id${idCounter.toString(36)}`;
  return (base + "x".repeat(16)).slice(0, n);
};
const escapeHTML = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" }[c]));

/* ---------------------------------------------------------- tiny DOM -- */

const VOID_TAGS = new Set(["input", "img", "br", "hr", "meta", "link", "source", "col", "area", "base", "wbr"]);
const decode = s => String(s ?? "").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&#x3D;/g, "=").replace(/&#x60;/g, "`")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&middot;/g, "·").replace(/&amp;/g, "&");
const camel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function parseAttrs(src) {
  const attrs = {};
  for (const m of String(src).matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    attrs[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return attrs;
}

/** Parse an HTML fragment into FakeElements (a forgiving tag scanner, enough for our templates). */
function parseInto(parent, html) {
  parent.children = [];
  const stack = [{ el: parent, start: 0 }];
  const re = /<\/?([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase();
    if (m[0].startsWith("</")) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].el.tagName.toLowerCase() === tag) {
          const node = stack[i];
          node.el._innerHTML = html.slice(node.start, m.index);
          node.el.textContent = decode(node.el._innerHTML.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
          stack.length = i;
          break;
        }
      }
      continue;
    }
    const el = new FakeElement(tag);
    const attrs = parseAttrs(m[2]);
    el.attributes = attrs;
    for (const [k, v] of Object.entries(attrs)) if (k.startsWith("data-")) el.dataset[camel(k.slice(5))] = v;
    el.className = attrs.class ?? "";
    el.id = attrs.id ?? "";
    if ("disabled" in attrs) el.disabled = true;
    if (tag === "input") { el._value = attrs.value ?? ""; el._checked = "checked" in attrs; }
    stack.at(-1).el.appendChild(el);
    if (!VOID_TAGS.has(tag) && !m[3]) stack.push({ el, start: re.lastIndex });
  }
}

function matches(el, sel) {
  const m = String(sel).trim().match(/^([a-zA-Z]*)(?:\.([\w-]+))?(?:\[([\w-]+)(?:=['"]?([^'"\]]*)['"]?)?\])?$/);
  if (!m) throw new Error(`fake DOM: unsupported selector ${sel}`);
  const [, tag, cls, attr, val] = m;
  if (tag && el.tagName !== tag.toUpperCase()) return false;
  if (cls && !String(el.className).split(/\s+/).includes(cls)) return false;
  if (attr && !(attr in el.attributes)) return false;
  if (attr && val !== undefined && el.attributes[attr] !== val) return false;
  return true;
}

export class FakeElement {
  constructor(tag = "div") {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.parent = null;
    this.dataset = {};
    this.style = {};
    this.attributes = {};
    this.listeners = {};
    this.className = "";
    this.id = "";
    this.textContent = "";
    this._innerHTML = "";
    this.disabled = false;
    this.hidden = false;
    this.classList = {
      add: () => {}, remove: () => {}, contains: c => String(this.className).split(/\s+/).includes(c),
      toggle: () => {}
    };
  }
  /** A form's named controls. */
  get elements() {
    const named = name => this.querySelector(`[name='${name}']`);
    return new Proxy({ namedItem: named }, { get: (t, k) => (k in t ? t[k] : named(String(k))) });
  }
  get value() {
    if (this._value !== undefined) return this._value;
    if (this.tagName === "SELECT") {
      const opts = this.querySelectorAll("option");
      const o = opts.find(x => "selected" in x.attributes) ?? opts[0];
      return o ? (o.attributes.value ?? o.textContent) : "";
    }
    return this.attributes.value ?? "";
  }
  set value(v) { this._value = String(v ?? ""); }
  get checked() { return !!this._checked; }
  set checked(v) { this._checked = !!v; }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(v) { this._innerHTML = String(v ?? ""); delete this._value; parseInto(this, this._innerHTML); touch(); }
  get isConnected() { return this._root === true || !!this.parent?.isConnected; }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  replaceChildren(...cs) { for (const c of this.children) c.parent = null; this.children = []; for (const c of cs) this.appendChild(c); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(c => c !== this); this.parent = null; this._root = false; }
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
  removeEventListener(type, fn) { this.listeners[type] = (this.listeners[type] ?? []).filter(f => f !== fn); }
  dispatch(type, ev = {}) {
    const event = { type, preventDefault() {}, stopPropagation() {}, currentTarget: this, target: this, shiftKey: false, ...ev };
    return (this.listeners[type] ?? []).map(fn => fn(event));
  }
  click() { return this.dispatch("click"); }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] ?? null; }
  toggleAttribute(k, on) { if (on) this.attributes[k] = ""; else delete this.attributes[k]; }
  closest(sel) { for (let e = this.parent; e; e = e.parent) if (e instanceof FakeElement && matches(e, sel)) return e; return null; }
  getBoundingClientRect() { return { top: 0, left: 0, width: 100, height: 100 }; }
  querySelectorAll(sel) { return [...this.descendants()].filter(e => matches(e, sel)); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null; }
  /** Every descendant (depth first). */
  *descendants() { for (const c of this.children) { yield c; yield* c.descendants(); } }
  /** Every button under this element. */
  buttons() { return [...this.descendants()].filter(e => e.tagName === "BUTTON"); }
}

/* ------------------------------------------------------------- Hooks -- */

const hooks = new Map();
let hookId = 0;
export const Hooks = {
  _hooks: hooks,
  on(name, fn, { once = false } = {}) { const id = ++hookId; (hooks.get(name) ?? hooks.set(name, []).get(name)).push({ id, fn, once }); return id; },
  once(name, fn) { return this.on(name, fn, { once: true }); },
  off(name, fn) { hooks.set(name, (hooks.get(name) ?? []).filter(h => h.fn !== fn && h.id !== fn)); },
  callAll(name, ...args) {
    touch();
    const list = [...(hooks.get(name) ?? [])];
    for (const h of list) {
      if (h.once) this.off(name, h.id);
      try {
        const r = h.fn(...args);
        if (r && typeof r.then === "function") r.catch(err => recordError(`hook ${name}`, err));
      } catch (err) { recordError(`hook ${name}`, err); }
    }
    return true;
  },
  call(name, ...args) {
    touch();
    for (const h of [...(hooks.get(name) ?? [])]) {
      if (h.once) this.off(name, h.id);
      try { if (h.fn(...args) === false) return false; } catch (err) { recordError(`hook ${name}`, err); }
    }
    return true;
  },
  count(name) { return (hooks.get(name) ?? []).length; }
};

function recordError(where, err) {
  log.errors.push(`${where}: ${err?.stack ?? err?.message ?? err}`);
}

/* ------------------------------------------------------- Handlebars -- */

const Handlebars = HandlebarsLib.create();
Handlebars.registerHelper("localize", s => String(s ?? ""));
const templateCache = new Map();
async function renderTemplate(path, data) {
  touch();
  const rel = String(path).replace(`systems/${SYSTEM_ID}/`, "");
  if (!templateCache.has(rel)) templateCache.set(rel, Handlebars.compile(readFileSync(join(ROOT, rel), "utf8"), { strict: false }));
  return templateCache.get(rel)(data, { allowProtoPropertiesByDefault: true, allowProtoMethodsByDefault: true });
}

/* ------------------------------------------------------------- Users -- */

export class User {
  constructor({ id, name, isGM = false, active = true }) {
    Object.assign(this, { id, name, isGM, active });
    this.role = isGM ? 4 : 1;
    this.targets = new Set();
  }
  get isSelf() { return game.user?.id === this.id; }
  /** User#query: run CONFIG.queries[name] on this user's client; data crosses "the wire" as JSON. */
  async query(name, data, { timeout } = {}) {
    touch();
    if (!this.active) throw new Error(`${this.name} is not connected`);
    const handler = CONFIG.queries?.[name];
    if (typeof handler !== "function") throw new Error(`No query handler "${name}" on ${this.name}'s client`);
    const result = await asUser(this, () => handler(clone(data), { timeout }));
    return clone(result);
  }
}

class Collection extends Array {
  static get [Symbol.species]() { return Array; }
  get(id) { return this.find(d => d.id === id) ?? undefined; }
  get contents() { return [...this]; }
  getName(n) { return this.find(d => d.name === n); }
}

/** Run `fn` as `user` (async continuations included). */
export function asUser(user, fn) { return als.run({ user }, fn); }

/** Deliver an event to every connected client (each runs its own hooks as itself). */
function broadcast(name, ...args) {
  for (const u of game.users.filter(x => x.active)) asUser(u, () => Hooks.callAll(name, ...args));
}

/* ----------------------------------------------------------- Settings -- */

class ClientSettings {
  constructor() { this.settings = new Map(); this.values = new Map(); this.clientValues = new Map(); }
  register(ns, key, data) {
    touch();
    const id = `${ns}.${key}`;
    if (this.settings.has(id)) log.errors.push(`setting ${id} registered twice`);
    this.settings.set(id, { ...data, namespace: ns, key });
    if (!this.values.has(id)) this.values.set(id, clone(data.default));
  }
  get(ns, key) {
    const id = `${ns}.${key}`;
    const def = this.settings.get(id);
    if (!def) throw new Error(`"${id}" is not a registered game setting`);
    if (def.scope === "client") {
      const k = `${game.user?.id}:${id}`;
      return clone(this.clientValues.has(k) ? this.clientValues.get(k) : def.default);
    }
    return clone(this.values.get(id));
  }
  async set(ns, key, value) {
    touch();
    const id = `${ns}.${key}`;
    const def = this.settings.get(id);
    if (!def) throw new Error(`"${id}" is not a registered game setting`);
    if (def.scope === "client") {
      this.clientValues.set(`${game.user?.id}:${id}`, clone(value));
      def.onChange?.(clone(value));
      return value;
    }
    if (!game.user?.isGM) throw new Error(`${game.user?.name} lacks permission to set the world setting ${id}`);
    this.values.set(id, clone(value));
    await Promise.resolve();
    for (const u of game.users.filter(x => x.active)) {
      asUser(u, () => {
        try { const r = def.onChange?.(clone(value)); if (r?.catch) r.catch(err => recordError(`onChange ${id}`, err)); }
        catch (err) { recordError(`onChange ${id}`, err); }
      });
    }
    return value;
  }
}

/* ---------------------------------------------------------- Documents -- */

const OWNER = 3;
function permissionOf(doc, user) {
  if (!user) return 0;
  if (user.isGM) return OWNER;
  const o = doc.ownership ?? {};
  return Math.max(Number(o[user.id] ?? 0), Number(o.default ?? 0));
}
const levelOf = l => (typeof l === "number" ? l : ({ NONE: 0, LIMITED: 1, OBSERVER: 2, OWNER: 3 }[l] ?? 3));

/** Apply an update the Foundry way: dotted keys, objects merged, arrays replaced. */
function applyUpdate(target, changes) {
  const diff = expandObject(changes);
  mergeObject(target, diff);
  return diff;
}

class BaseDocument {
  get isOwner() { return permissionOf(this, game.user) >= OWNER; }
  testUserPermission(user, level) { return permissionOf(this, user) >= levelOf(level); }
  getFlag(scope, key) { return getProperty(this.flags?.[scope], key); }
}

export class Item extends BaseDocument {
  constructor(data = {}, { parent = null } = {}) {
    super();
    this._source = clone(data);
    this.id = data._id ?? randomID();
    this.name = data.name ?? "Item";
    this.type = data.type;
    this.img = data.img ?? "";
    this.flags = clone(data.flags ?? {});
    this.parent = parent;
    this.system = clone(data.system ?? {});
    const Model = CONFIG.Item.dataModels?.[this.type];
    if (Model) Object.setPrototypeOf(this.system, Model.prototype);
    Object.defineProperty(this.system, "parent", { value: this, enumerable: false, configurable: true, writable: true });
  }
  get documentName() { return "Item"; }
  get actor() { return this.parent; }
  get ownership() { return this.parent?.ownership ?? {}; }
  get uuid() { return this.parent ? `${this.parent.uuid}.Item.${this.id}` : `Item.${this.id}`; }
  get isOwner() { return this.parent ? this.parent.isOwner : super.isOwner; }
  updateSource(changes) { applyUpdate(this.system, expandObject(changes).system ?? {}); }
  toObject() { return clone({ _id: this.id, name: this.name, type: this.type, img: this.img, flags: this.flags, system: { ...this.system } }); }
  async update(changes) {
    touch();
    if (!this.isOwner) throw new Error(`${game.user.name} lacks permission to update Item ${this.name}`);
    const diff = applyUpdate(this, changes);
    this.parent?.prepareData?.();
    broadcast("updateItem", this, diff, {}, game.user.id);
    return this;
  }
  static async updateDocuments(updates = []) {
    for (const u of updates) {
      const item = game.items.get(u._id);
      const { _id, ...rest } = u;
      await item?.update(rest);
    }
  }
}

export class Actor extends BaseDocument {
  constructor(data = {}) {
    super();
    this.id = data._id ?? randomID();
    this.name = data.name ?? "Actor";
    this.type = data.type;
    this.img = data.img ?? "icons/svg/mystery-man.svg";
    this.flags = clone(data.flags ?? {});
    this.ownership = clone(data.ownership ?? { default: 0 });
    this.system = clone(data.system ?? {});
    this.items = new Collection();
    const IC = CONFIG.Item.documentClass ?? Item;
    for (const i of data.items ?? []) this.items.push(new IC(i, { parent: this }));
    this.prepareData();
  }
  get documentName() { return "Actor"; }
  get uuid() { return `Actor.${this.id}`; }
  get _source() { return this.toObject(); }
  get hasPlayerOwner() { return game.users.some(u => !u.isGM && this.testUserPermission(u, "OWNER")); }
  get sheet() { return { render: () => {}, rendered: false }; }
  getActiveTokens() { return []; }
  getRollData() { return {}; }
  prepareData() {
    const Model = CONFIG.Actor.dataModels?.[this.type];
    if (Model && Object.getPrototypeOf(this.system) !== Model.prototype) Object.setPrototypeOf(this.system, Model.prototype);
    Object.defineProperty(this.system, "parent", { value: this, enumerable: false, configurable: true, writable: true });
    try { this.system.prepareDerivedData?.(); } catch (err) { recordError(`prepareDerivedData ${this.name}`, err); }
  }
  reset() { this.prepareData(); }
  toObject() {
    return clone({ _id: this.id, name: this.name, type: this.type, img: this.img, flags: this.flags, ownership: this.ownership, system: { ...this.system }, items: this.items.map(i => i.toObject()) });
  }
  async update(changes, options = {}) {
    touch();
    if (!this.isOwner) throw new Error(`${game.user.name} lacks permission to update Actor ${this.name}`);
    const diff = applyUpdate(this, changes);
    this.prepareData();
    broadcast("updateActor", this, diff, options, game.user.id);
    return this;
  }
  async setFlag(scope, key, value) { return this.update({ [`flags.${scope}.${key}`]: value }); }
  async createEmbeddedDocuments(type, list) {
    if (!this.isOwner) throw new Error(`${game.user.name} lacks permission to add items to ${this.name}`);
    const IC = CONFIG.Item.documentClass ?? Item;
    const made = list.map(d => new IC(d, { parent: this }));
    this.items.push(...made);
    this.prepareData();
    return made;
  }
  async updateEmbeddedDocuments(type, updates) {
    for (const u of updates) { const { _id, ...rest } = u; await this.items.get(_id)?.update(rest); }
  }
  static async create(data) {
    touch();
    if (!game.user?.isGM) throw new Error(`${game.user?.name} lacks permission to create an Actor`);
    const AC = CONFIG.Actor.documentClass ?? Actor;
    const actor = new AC(clone(data));
    game.actors.push(actor);
    broadcast("createActor", actor, {}, game.user.id);
    return actor;
  }
}

export class ChatMessage extends BaseDocument {
  constructor(data) {
    super();
    Object.assign(this, clone({ ...data, rolls: undefined }));
    this.rolls = data.rolls ?? [];
    this.flags ??= {};
    this.whisper ??= [];
  }
  get documentName() { return "ChatMessage"; }
  get uuid() { return `ChatMessage.${this.id}`; }
  get isOwner() { return !!game.user?.isGM || this.author === game.user?.id; }
  get visible() { return !this.whisper.length || this.whisper.includes(game.user?.id) || this.author === game.user?.id; }
  async update(changes) {
    touch();
    if (!this.isOwner) throw new Error(`${game.user.name} lacks permission to update a ChatMessage they didn't write`);
    const diff = applyUpdate(this, changes);
    broadcast("updateChatMessage", this, diff, {}, game.user.id);
    return this;
  }
  static async create(data, { keepId = false } = {}) {
    touch();
    const msg = new ChatMessage({ ...data, id: keepId && data._id ? data._id : randomID(), author: game.user.id });
    delete msg._id;
    game.messages.push(msg);
    await Promise.resolve();
    broadcast("createChatMessage", msg, {}, game.user.id);
    return msg;
  }
  static getSpeaker({ actor = null, alias = null } = {}) { return actor ? { actor: actor.id, alias: actor.name } : { alias: alias ?? game.user?.name }; }
  static applyRollMode(data) { return data; }
}

/* -------------------------------------------------------------- Dice -- */

let seed = 12345;
const nextRandom = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
/** Faces the next rolls will show, in order (then a seeded generator). */
export const diceQueue = [];

export class Roll {
  constructor(formula) { this.formula = String(formula); }
  async evaluate() {
    touch();
    const m = this.formula.match(/^(\d+)d6$/);
    if (!m) throw new Error(`fake Roll: unsupported formula ${this.formula}`);
    const n = Number(m[1]);
    const results = Array.from({ length: n }, () => ({ result: diceQueue.length ? diceQueue.shift() : 1 + Math.floor(nextRandom() * 6), active: true }));
    this.dice = [{ results, faces: 6, number: n }];
    this.total = results.reduce((a, r) => a + r.result, 0);
    this._evaluated = true;
    log.rolls.push({ formula: this.formula, faces: results.map(r => r.result), user: game.user?.name });
    return this;
  }
  toJSON() { return { formula: this.formula, total: this.total }; }
}

/* ------------------------------------------------------- Applications -- */

const instances = new Map();

function mergedDefaults(cls) {
  const chain = [];
  for (let c = cls; c && c !== Object; c = Object.getPrototypeOf(c)) if (Object.hasOwn(c, "DEFAULT_OPTIONS")) chain.unshift(c.DEFAULT_OPTIONS);
  const out = {};
  for (const d of chain) {
    for (const [k, v] of Object.entries(d)) out[k] = isObj(v) && isObj(out[k]) ? { ...out[k], ...v } : v;
  }
  return out;
}

class ApplicationV2 {
  constructor(options = {}) {
    const defaults = mergedDefaults(this.constructor);
    this.options = { ...defaults, ...options, window: { ...(defaults.window ?? {}), ...(options.window ?? {}) }, actions: { ...(defaults.actions ?? {}), ...(options.actions ?? {}) } };
    this.position = { ...(defaults.position ?? {}), ...(options.position ?? {}) };
    this.id = options.id ?? defaults.id ?? `app-${randomID(8)}`;
    this.rendered = false;
    this.element = null;
    this._renders = 0;
  }
  get title() { return this.options.window?.title ?? ""; }
  async _prepareContext() { return {}; }
  _prepareTabs(group) {
    const cfg = this.constructor.TABS?.[group];
    if (!cfg) return {};
    return Object.fromEntries(cfg.tabs.map(t => [t.id, { ...t, group, active: t.id === cfg.initial, cssClass: t.id === cfg.initial ? "active" : "" }]));
  }
  async render(options = {}) {
    touch();
    const context = await this._prepareContext(options);
    const parts = this.constructor.PARTS ?? {};
    this.renderedParts = {};
    for (const [id, part] of Object.entries(parts)) {
      const ctx = typeof this._preparePartContext === "function" ? await this._preparePartContext(id, { ...context }, options) : context;
      this.renderedParts[id] = await renderTemplate(part.template, ctx);
    }
    const first = !this.rendered;
    this.element ??= new FakeElement(this.options.tag ?? "div");
    this.element.innerHTML = Object.values(this.renderedParts).join("\n");
    this.rendered = true;
    this._renders++;
    instances.set(this.id, this);
    if (first) await this._onFirstRender?.(context, options);
    await this._onRender?.(context, options);
    return this;
  }
  async close(options = {}) {
    await this._onClose?.(options);
    this.rendered = false;
    instances.delete(this.id);
    return this;
  }
  /** Test helper: run one of this app's actions as its button would. */
  async runAction(name, dataset = {}) {
    const fn = this.options.actions?.[name];
    if (!fn) throw new Error(`${this.constructor.name} has no action ${name}`);
    const target = new FakeElement("button");
    Object.assign(target.dataset, dataset);
    return (typeof fn === "function" ? fn : fn.handler).call(this, { preventDefault() {}, shiftKey: false, currentTarget: target, target }, target);
  }
  /** Test helper: submit this app's form with these values. */
  async submit(object = {}) {
    const handler = this.options.form?.handler;
    if (!handler) throw new Error(`${this.constructor.name} has no form handler`);
    await handler.call(this, { preventDefault() {} }, this.element, { object });
    if (this.options.form?.closeOnSubmit) await this.close();
  }
}

const HandlebarsApplicationMixin = Base => class extends Base {};

class DocumentSheetV2 extends ApplicationV2 {
  constructor(options = {}) {
    super(options);
    this.document = options.document;
    this.id = `${this.constructor.name}-${this.document?.id}`;
  }
  get isEditable() { return !!this.document?.isOwner; }
  async _prepareContext() {
    return { document: this.document, source: this.document?.toObject?.(), editable: this.isEditable, owner: this.document?.isOwner, user: game.user, rootId: this.id };
  }
}
class ActorSheetV2 extends DocumentSheetV2 { get actor() { return this.document; } }
class ItemSheetV2 extends DocumentSheetV2 { get item() { return this.document; } }

/** Scripted dialog answers: push functions (options, kind) => answer. */
export const dialogResponders = [];
function answerDialog(kind, options) {
  touch();
  log.dialogs.push({ kind, title: options?.window?.title ?? "", user: game.user?.name });
  const fn = dialogResponders.shift();
  if (!fn) {
    if (kind === "confirm") return true;
    log.errors.push(`unexpected ${kind} dialog "${options?.window?.title ?? ""}" for ${game.user?.name}`);
    return null;
  }
  return fn(options, kind);
}
const DialogV2 = {
  async confirm(options = {}) { return answerDialog("confirm", options); },
  async prompt(options = {}) { return answerDialog("prompt", options); },
  async wait(options = {}) { return answerDialog("wait", options); },
  async input(options = {}) { return answerDialog("input", options); }
};

/** A fake form for DialogV2 ok callbacks: named controls with value/checked. */
export function fakeForm(values = {}) {
  const el = name => {
    if (!(name in values)) return null;
    const v = values[name];
    return { value: typeof v === "boolean" ? (v ? "on" : "") : String(v), checked: v === true, name };
  };
  const elements = new Proxy({ namedItem: el }, { get: (t, k) => (k in t ? t[k] : el(k)) });
  return { elements, querySelectorAll: () => [], querySelector: () => null };
}

/* -------------------------------------------------------------- install -- */

export let game;
export let CONFIG;

/**
 * Install the globals. Returns the handles a test needs.
 * @param {{users: {id,name,isGM?,active?}[]}} opts
 */
export function installFoundry({ users = [] } = {}) {
  const userDocs = new Collection(...users.map(u => new User(u)));
  Object.defineProperty(userDocs, "activeGM", { get: () => userDocs.find(u => u.isGM && u.active) ?? null });
  defaultUser = userDocs.find(u => u.isGM) ?? userDocs[0];

  CONFIG = globalThis.CONFIG = {
    Actor: { dataModels: {}, documentClass: Actor },
    Item: { dataModels: {}, documentClass: Item },
    Combat: {},
    queries: {}
  };
  const settings = new ClientSettings();
  settings.register("core", "rollMode", { scope: "client", default: "publicroll" });

  game = globalThis.game = {
    system: { id: SYSTEM_ID, version: JSON.parse(readFileSync(join(ROOT, "system.json"), "utf8")).version },
    users: userDocs,
    get user() { return als.getStore()?.user ?? defaultUser; },
    settings,
    actors: new Collection(),
    items: new Collection(),
    messages: new Collection(),
    journal: new Collection(),
    scenes: { viewed: null },
    packs: new Map(),
    combat: null,
    i18n: { localize: s => s, format: s => s },
    socket: {
      _listeners: new Map(),
      on(name, fn) { (this._listeners.get(name) ?? this._listeners.set(name, []).get(name)).push(fn); },
      emit(name, payload) { touch(); log.emits.push({ name, payload: clone(payload), from: game.user?.id }); }
    }
  };
  globalThis.Hooks = Hooks;
  globalThis.Handlebars = Handlebars;
  globalThis.Actor = Actor;
  globalThis.Item = Item;
  globalThis.User = User;
  globalThis.ChatMessage = ChatMessage;
  globalThis.Roll = Roll;
  globalThis.CONST = {
    CHAT_MESSAGE_STYLES: { OTHER: 0, OOC: 1, IC: 2, EMOTE: 3 },
    DOCUMENT_OWNERSHIP_LEVELS: { NONE: 0, LIMITED: 1, OBSERVER: 2, OWNER: 3 },
    USER_ROLES: { PLAYER: 1, TRUSTED: 2, ASSISTANT: 3, GAMEMASTER: 4 }
  };
  globalThis.canvas = { ready: false, scene: null, grid: null, tokens: { placeables: [] } };
  globalThis.ui = {
    notifications: {
      info: m => { log.infos.push(String(m)); },
      warn: m => { log.warnings.push(`${game.user?.name}: ${m}`); },
      error: m => { log.errors.push(`notification for ${game.user?.name}: ${m}`); }
    },
    controls: { render() {} },
    chat: { scrollBottom() {} }
  };
  globalThis.window = { innerWidth: 1920, innerHeight: 1080 };
  globalThis.HTMLElement = FakeElement;
  const body = new FakeElement("body");
  body._root = true;
  globalThis.document = {
    body,
    createElement: tag => new FakeElement(tag),
    addEventListener() {}, removeEventListener() {}
  };
  globalThis.fromUuidSync = uuid => resolveUuid(uuid);
  globalThis.fromUuid = async uuid => resolveUuid(uuid);
  globalThis.foundry = {
    utils: {
      randomID, deepClone: clone, duplicate: clone, getProperty, setProperty, hasProperty, mergeObject: (a, b) => mergeObject(a, b),
      expandObject, isNewerVersion, escapeHTML, debounce: fn => fn
    },
    abstract: { TypeDataModel: class { static defineSchema() { return {}; } } },
    data: { fields: new Proxy({}, { get: () => class { constructor(...a) { this.args = a; } } }) },
    applications: {
      api: { ApplicationV2, HandlebarsApplicationMixin, DialogV2, DocumentSheetV2 },
      sheets: { ActorSheetV2, ItemSheetV2 },
      apps: { DocumentSheetConfig: { registerSheet() {}, unregisterSheet() {} } },
      handlebars: { renderTemplate },
      instances,
      ux: { TextEditor: { implementation: { enrichHTML: async s => String(s ?? ""), getDragEventData: () => null } } }
    }
  };
  process.on("unhandledRejection", err => recordError("unhandled rejection", err));
  return { game, CONFIG, log, Hooks };
}

function resolveUuid(uuid) {
  const parts = String(uuid ?? "").split(".");
  if (parts[0] === "Actor") {
    const a = game.actors.get(parts[1]);
    if (parts[2] === "Item") return a?.items.get(parts[3]) ?? null;
    return a ?? null;
  }
  if (parts[0] === "Item") return game.items.get(parts[1]) ?? null;
  if (parts[0] === "ChatMessage") return game.messages.get(parts[1]) ?? null;
  return null;
}

/**
 * Wait until nothing has happened for a while: every hook, document write,
 * setting change, roll and render bumps a counter; queued automation finishes.
 */
export async function settle({ idleTurns = 25, maxTurns = 20000 } = {}) {
  let last = -1, idle = 0;
  for (let i = 0; i < maxTurns; i++) {
    await new Promise(r => setImmediate(r));
    if (log.work === last) { if (++idle >= idleTurns) return; }
    else { idle = 0; last = log.work; }
  }
  throw new Error("settle(): the fake world never went quiet");
}

/** Render a chat message on one client: the renderChatMessageHTML hooks inject its buttons. */
export function renderMessage(message, user) {
  const root = new FakeElement("li");
  root._root = true;
  root.innerHTML = message.content ?? "";
  asUser(user, () => Hooks.callAll("renderChatMessageHTML", message, root, {}));
  return root;
}

/** Click the button whose label contains `text` (as the user the message was rendered for). */
export function clickButton(root, text, user) {
  const btn = root.buttons().find(b => String(b.textContent).includes(text));
  if (!btn) throw new Error(`no "${text}" button; there are: ${root.buttons().map(b => b.textContent).join(" | ") || "none"}`);
  if (btn.disabled) throw new Error(`the "${text}" button is disabled`);
  asUser(user, () => btn.click());
  return btn;
}

/** Labels of the buttons a user sees on a message. */
export function buttonLabels(message, user) {
  return renderMessage(message, user).buttons().map(b => b.textContent);
}

/** Load a pack source document (packs/_source/<pack>/<key>.json) as item/actor data. */
export function packDoc(pack, key, type) {
  const d = JSON.parse(readFileSync(join(ROOT, "packs/_source", pack, `${key}.json`), "utf8"));
  const system = clone(d.system ?? {});
  if (["species", "role", "perk", "flaw"].includes(type)) system.usage ??= { heistId: "", sceneSerial: -1, roundSerial: -1, count: 0 };
  return { name: d.name, type, img: d.img ?? "", system };
}
