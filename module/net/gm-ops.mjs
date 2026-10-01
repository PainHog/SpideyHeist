/**
 * HEISTY SPIDEYS — GM operations (design §8)
 * ------------------------------------------
 * Players write only their own actors and their own chat messages. Anything
 * else (the Alert, the heist state, crew uses, loot, other actors) is a GM
 * operation: a named op with a `check` and an `apply`, run on the active GM.
 *
 *   gm.register(name, { check, apply })   // any package, at init, on every client
 *   gm.run(name, args)                    // runs locally on the active GM, else asks it
 *   gm.ask(userId, name, args)            // GM → a player's client ("ui.*" ops)
 *
 * Transport: Foundry v13's `User#query` with `CONFIG.queries[QUERY]`. The v13
 * API documents a query handler as `(queryData, queryOptions)` where the
 * options carry only `{ timeout }` (foundryvtt.com/api/v13: User#query,
 * CONFIG.queries) — the handler is NOT told who sent the query. So the payload
 * carries `userId` and the GM checks that it is an active user who owns the
 * named actor (the trust level of the old spider relay). If a core passes the
 * sender in the options (`user`, `sender`, `userId` or `senderId`, as a User or
 * an id), that is used instead, and a payload `userId` that disagrees with it
 * is refused. Fallback when `User#query` is missing: a request/ack on the
 * system socket (the sender's id, when the socket passes one, is preferred
 * the same way).
 *
 * The GM keeps the last 200 request ids with their results, so a retry never
 * applies twice. `check` may return true/undefined (ok), false or a string
 * (refused), or throw (refused with the error's message).
 */

import { QUERY, SOCKET } from "../contracts.mjs";

const RECENT_MAX = 200;
const DEFAULT_TIMEOUT = 10000;

/** name → { check, apply } */
const registry = new Map();
/** requestId → result (GM side, dedupe) */
const recent = new Map();
/** requestId → { resolve, timer } (requester side, socket fallback) */
const waiting = new Map();

const NO_GM = "The Storyteller isn't connected — nothing was changed.";

const randomID = () => (globalThis.foundry?.utils?.randomID?.() ?? Math.random().toString(36).slice(2, 18));

/** Ops named "ui.*" run on a player's client, asked by the GM. */
const isClientOp = name => String(name).startsWith("ui.");

/** Is this client the one active GM? */
export function isActiveGM() {
  if (!game.user?.isGM) return false;
  const active = game.users?.activeGM;
  return !active || active.id === game.user.id;
}

/** Does `userId` own the actor (or is a GM)? */
export function ownsActor(userId, actorId) {
  const user = game.users?.get(userId);
  if (!user) return false;
  if (user.isGM) return true;
  const actor = game.actors?.get(actorId);
  return !!actor?.testUserPermission?.(user, "OWNER");
}

function remember(requestId, result) {
  if (!requestId) return;
  recent.set(requestId, result);
  while (recent.size > RECENT_MAX) recent.delete(recent.keys().next().value);
}

/**
 * Execute a registered op here (GM side for GM ops, player side for ui.* ops).
 * @returns {Promise<{ok:boolean, result?:any, error?:string}>}
 */
async function execute(name, args, { userId, requestId, sender = null } = {}) {
  if (requestId && recent.has(requestId)) return recent.get(requestId);
  const def = registry.get(name);
  if (!def) return { ok: false, error: `Unknown operation “${name}”.` };
  const user = sender ?? game.users?.get(userId) ?? null;
  if (!user) return { ok: false, error: "Unknown requesting user." };
  if (isClientOp(name)) {
    if (!user.isGM) return { ok: false, error: "Only the Storyteller can ask that." };
  } else if (user.id !== game.user.id && !user.active) {
    return { ok: false, error: "The requesting user isn't connected." };
  }
  const ctx = { user, userId: user.id, isGM: !!user.isGM, requestId };
  let out;
  try {
    const verdict = def.check ? await def.check(args ?? {}, ctx) : true;
    if (verdict === false || typeof verdict === "string") {
      out = { ok: false, error: typeof verdict === "string" ? verdict : "Not allowed right now." };
    } else {
      const result = await def.apply(args ?? {}, ctx);
      out = { ok: true, result: result ?? null };
    }
  } catch (err) {
    console.warn(`Heisty Spideys | op ${name} refused:`, err);
    out = { ok: false, error: err?.message ?? String(err) };
  }
  remember(requestId, out);
  return out;
}

/**
 * The verified sender of a query or socket message, when the transport tells
 * us (a User document or a user id under any of the usual names); else null.
 */
export function senderFrom(options) {
  const raw = typeof options === "string" ? options
    : options?.user ?? options?.sender ?? options?.userId ?? options?.senderId ?? null;
  if (!raw) return null;
  const id = typeof raw === "string" ? raw : raw?.id;
  if (!id) return null;
  return game.users?.get?.(id) ?? null;
}

/** Who is asking: the verified sender, or the claimed payload id; refuses a mismatch. */
function requester(sender, claimedId) {
  if (sender && claimedId && sender.id !== claimedId) return { error: "The request didn't come from the user it names." };
  return { userId: sender?.id ?? claimedId, sender };
}

/** The query handler (`CONFIG.queries[QUERY]`). */
async function onQuery(data, options = {}) {
  const { op, args, userId, requestId } = data ?? {};
  const who = requester(senderFrom(options), userId);
  if (isClientOp(op)) {
    // A "ui.*" query answers with the op's own result (callers may use User#query directly).
    if (who.error) throw new Error(who.error);
    const res = await execute(op, args, { userId: who.userId, requestId, sender: who.sender });
    if (!res.ok) throw new Error(res.error);
    return res.result;
  }
  if (!isActiveGM()) return { ok: false, error: "Not the active Storyteller." };
  if (who.error) return { ok: false, error: who.error };
  return execute(op, args, { userId: who.userId, requestId, sender: who.sender });
}

/** Socket fallback (both directions). */
async function onSocket(payload, senderId) {
  if (!payload?.action) return;
  switch (payload.action) {
    case "heistyOp": {
      if (isClientOp(payload.op)) {
        if (payload.targetUserId !== game.user.id) return;
      } else if (!isActiveGM()) return;
      const who = requester(typeof senderId === "string" ? senderFrom(senderId) : null, payload.userId);
      const result = who.error ? { ok: false, error: who.error }
        : await execute(payload.op, payload.args, { userId: who.userId, requestId: payload.requestId, sender: who.sender });
      game.socket.emit(SOCKET, { action: "heistyOpResult", requestId: payload.requestId, userId: payload.userId, result });
      return;
    }
    case "heistyOpResult": {
      if (payload.userId !== game.user.id) return;
      const w = waiting.get(payload.requestId);
      if (!w) return;
      clearTimeout(w.timer);
      waiting.delete(payload.requestId);
      w.resolve(payload.result);
    }
  }
}

function viaSocket(message, timeout) {
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      waiting.delete(message.requestId);
      resolve({ ok: false, error: "No answer from the Storyteller in time — nothing was confirmed." });
    }, timeout);
    waiting.set(message.requestId, { resolve, timer });
    game.socket.emit(SOCKET, message);
  });
}

function canQuery(user) {
  return typeof user?.query === "function" && !!globalThis.CONFIG?.queries;
}

export const gm = {
  /** Register an operation: { check(args, ctx), apply(args, ctx) }. */
  register(name, def) {
    if (!name || typeof def?.apply !== "function") throw new Error(`gm.register(${name}): an apply() is required`);
    registry.set(name, { check: def.check ?? null, apply: def.apply });
  },

  has(name) { return registry.has(name); },

  /** Names registered (for the contracts test / debugging). */
  get names() { return [...registry.keys()]; },

  isActiveGM,

  /**
   * Run an operation on the active GM. Resolves to the op's result; throws
   * with the refusal message when it is refused (or no GM is connected).
   * @param {string} name
   * @param {object} [args]
   * @param {{timeout?:number, quiet?:boolean}} [opts]
   */
  async run(name, args = {}, { timeout = DEFAULT_TIMEOUT, quiet = false } = {}) {
    const res = await gm.request(name, args, { timeout });
    if (!res?.ok) {
      if (!quiet) ui.notifications?.warn(res?.error ?? NO_GM);
      throw new Error(res?.error ?? NO_GM);
    }
    return res.result;
  },

  /** Like run, but resolves to {ok, result, error} instead of throwing. */
  async request(name, args = {}, { timeout = DEFAULT_TIMEOUT } = {}) {
    const requestId = randomID();
    if (isActiveGM()) return execute(name, args, { userId: game.user.id, requestId });
    const target = game.users?.activeGM;
    if (!target) return { ok: false, error: NO_GM };
    const payload = { op: name, args, userId: game.user.id, requestId };
    if (canQuery(target)) {
      try { return await target.query(QUERY, payload, { timeout }); }
      catch (err) { return { ok: false, error: err?.message ?? NO_GM }; }
    }
    return viaSocket({ action: "heistyOp", ...payload }, timeout);
  },

  /**
   * GM → a player's client: run a "ui.*" op there (a prompt, a forced roll).
   * Resolves to {ok, result, error}; an offline user is {ok:false}.
   */
  async ask(userId, name, args = {}, { timeout = 60000 } = {}) {
    const requestId = randomID();
    if (userId === game.user.id) return execute(name, args, { userId, requestId });
    const target = game.users?.get(userId);
    if (!target?.active) return { ok: false, error: "That player isn't connected." };
    const payload = { op: name, args, userId: game.user.id, requestId };
    if (canQuery(target)) {
      try { return { ok: true, result: await target.query(QUERY, payload, { timeout }) }; }
      catch (err) { return { ok: false, error: err?.message ?? "No answer." }; }
    }
    return viaSocket({ action: "heistyOp", targetUserId: userId, ...payload }, timeout);
  }
};

/** Init: the query handler (every client — players answer "ui.*" queries). */
export function registerGmQueries() {
  if (globalThis.CONFIG) {
    CONFIG.queries = CONFIG.queries ?? {};
    CONFIG.queries[QUERY] = onQuery;
  }
}

let socketBound = false;

/** Ready: the socket fallback listener (bound once). */
export function registerGmSocket() {
  if (socketBound || !game.socket) return;
  socketBound = true;
  game.socket.on(SOCKET, onSocket);
}
