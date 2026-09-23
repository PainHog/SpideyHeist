/**
 * HEISTY SPIDEYS — Socket Proxy
 * -----------------------------
 * By default only GMs hold ACTOR_CREATE, so a player finishing the Character
 * Builder can't create their own spider. This lets the player relay a request
 * that the single active GM fulfils, assigning ownership back to the player.
 *
 * We never claim success optimistically: the request carries an id, the GM
 * echoes an ack, and if no ack arrives the requester is told it's unconfirmed
 * (sockets aren't delivered to offline users and aren't guaranteed). Requires
 * "socket": true in system.json.
 */

import { HEISTY } from "../config.mjs";

const CHANNEL = `system.${HEISTY.id}`;
const ACK_TIMEOUT_MS = 12000;

/** Outstanding creation requests on THIS client, keyed by request id. */
const pending = new Map();

/** Register the socket listener (call once, on ready). */
export function registerSocket() {
  game.socket.on(CHANNEL, onMessage);
}

/** Relay a spider-creation request to the active GM. Resolves nothing — the
 *  ack (or its absence) drives the user-facing outcome. */
export function requestSpiderCreation(actorData, { name } = {}) {
  const requestId = foundry.utils.randomID();
  const timer = setTimeout(() => {
    if (!pending.has(requestId)) return;
    pending.delete(requestId);
    ui.notifications?.warn(
      `No confirmation yet for “${name ?? "your spider"}.” The Storyteller may be away — ask them to build it, or try again when they're connected.`
    );
  }, ACK_TIMEOUT_MS);
  pending.set(requestId, { timer, name });
  game.socket.emit(CHANNEL, { action: "createSpider", userId: game.user.id, requestId, data: actorData });
}

function clearPending(requestId) {
  const p = pending.get(requestId);
  if (p) { clearTimeout(p.timer); pending.delete(requestId); }
}

async function onMessage(payload) {
  if (!payload?.action) return;
  switch (payload.action) {
    case "createSpider": return handleCreateRequest(payload);
    case "spiderCreated": return handleCreated(payload);
    case "spiderFailed": return handleFailed(payload);
  }
}

/** GM side: exactly one GM (the active one) fulfils the request. */
async function handleCreateRequest(payload) {
  if (game.users.activeGM?.id !== game.user.id) return;
  const reply = extra => game.socket.emit(CHANNEL, {
    userId: payload.userId, requestId: payload.requestId, ...extra
  });
  try {
    const data = foundry.utils.deepClone(payload.data ?? {});
    data.ownership = Object.assign(data.ownership ?? {}, {
      [payload.userId]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    });
    const actor = await Actor.create(data);
    if (!actor) throw new Error("Actor.create returned nothing");
    reply({ action: "spiderCreated", actorId: actor.id });
    if (payload.userId === game.user.id) actor.sheet?.render(true);
  } catch (err) {
    console.error("Heisty Spideys | GM proxy failed to create spider:", err);
    reply({ action: "spiderFailed" });
  }
}

/** Requester side: the GM created it — open the (now-verified) sheet. */
function handleCreated(payload) {
  if (payload.userId !== game.user.id) return;
  clearPending(payload.requestId);
  ui.notifications?.info("Your spider joined the crew!");
  game.actors.get(payload.actorId)?.sheet?.render(true);
}

/** Requester side: the GM's client couldn't create it. */
function handleFailed(payload) {
  if (payload.userId !== game.user.id) return;
  clearPending(payload.requestId);
  ui.notifications?.error("The Storyteller's client couldn't create your spider — ask them to build it, or to enable “Create New Actors.”");
}
