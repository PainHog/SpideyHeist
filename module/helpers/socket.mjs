/**
 * HEISTY SPIDEYS — Socket Proxy
 * -----------------------------
 * By default only GMs hold ACTOR_CREATE, so a player finishing the Character
 * Builder can't create their own spider. This lets the player emit a request
 * that the single active GM fulfils on their behalf, assigning ownership back
 * to the player. Requires "socket": true in system.json.
 */

import { HEISTY } from "../config.mjs";

const CHANNEL = `system.${HEISTY.id}`;

/** Register the socket listener (call once, on ready). */
export function registerSocket() {
  game.socket.on(CHANNEL, onMessage);
}

/** Emit a request for the active GM to create a spider for this player. */
export function requestSpiderCreation(actorData) {
  game.socket.emit(CHANNEL, {
    action: "createSpider",
    userId: game.user.id,
    data: actorData
  });
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
  try {
    const data = foundry.utils.deepClone(payload.data ?? {});
    data.ownership = Object.assign(data.ownership ?? {}, {
      [payload.userId]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    });
    const actor = await Actor.create(data);
    game.socket.emit(CHANNEL, { action: "spiderCreated", userId: payload.userId, actorId: actor?.id });
    if (payload.userId === game.user.id) actor?.sheet?.render(true);
  } catch (err) {
    console.error("Heisty Spideys | GM proxy failed to create spider:", err);
    game.socket.emit(CHANNEL, { action: "spiderFailed", userId: payload.userId });
  }
}

/** Requester side: open the freshly-created sheet. */
function handleCreated(payload) {
  if (payload.userId !== game.user.id) return;
  ui.notifications?.info("Your spider joined the crew!");
  const actor = game.actors.get(payload.actorId);
  actor?.sheet?.render(true);
}

/** Requester side: the GM's client couldn't create it. */
function handleFailed(payload) {
  if (payload.userId !== game.user.id) return;
  ui.notifications?.error("The Storyteller's client couldn't create your spider — ask them to build it, or to enable “Create New Actors.”");
}
