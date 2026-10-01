/**
 * HEISTY SPIDEYS — Waiting Web orchestration (design §3.9, §16 #12)
 * -----------------------------------------------------------------
 * When a crew spider goes Out (setting autoWaitingWeb):
 *  1. the GM asks the owner's client for a name and an optional species swap
 *     (WP-A's `waitingWeb.promptReplacement`, 60 s, defaults if offline);
 *  2. the GM creates the replacement (WP-A's `waitingWeb.createReplacement`:
 *     same Role, Attributes, Skills, Perks and Flaw, Rattled, half starting
 *     Silk, usage stamps carried, same slot);
 *  3. the heist state records it — arriving at the start of the next obstacle
 *     next to any crewmate, or, Out in the last Escape obstacle, already waiting
 *     at the exit (and that player earns half AP).
 * Without WP-A's runtime, a plain duplicate is made from the pure builder.
 */

import { SYSTEM_ID, SETTINGS, FLAG } from "../contracts.mjs";
import * as flow from "../logic/heist-flow.mjs";
import { store } from "./store.mjs";
import { placeNextToCrew } from "./tokens.mjs";

const api = () => game.heistySpideys ?? {};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

function setting(key, fallback) {
  try { return game.settings.get(SYSTEM_ID, key) ?? fallback; } catch (e) { return fallback; }
}

/** The player who owns the spider (not a GM), if any. */
function playerOwner(actor) {
  const viaA = api().waitingWeb?.playerOwner?.(actor);
  if (viaA !== undefined) return viaA;
  return game.users.find(u => !u.isGM && actor?.testUserPermission?.(u, "OWNER")) ?? null;
}

/** Ask the owner (WP-A), or fall back to a default name. */
async function askOwner(actor) {
  try {
    const fn = api().waitingWeb?.promptReplacement ?? api().actorOps?.promptReplacement;
    if (typeof fn === "function") return await fn(actor, { timeout: 60000 });
  } catch (err) { console.warn("Heisty Spideys | replacement prompt failed:", err); }
  return { name: `${actor.name} II`, speciesUuid: null, defaulted: true };
}

/** Create the replacement actor (WP-A, else a plain duplicate). */
async function create(actor, answer, arrivesAtSerial) {
  const fn = api().waitingWeb?.createReplacement ?? api().actorOps?.createReplacement;
  if (typeof fn === "function") return fn(actor, answer, { arrivesAtSerial });
  try {
    const { replacementActorData } = await import("../logic/waiting-web.mjs");
    const data = replacementActorData(actor.toObject(), { sourceId: actor.id, name: answer?.name, silkMax: actor.system.silk?.max, arrivesAtSerial, flag: FLAG });
    return Actor.create(data);
  } catch (err) {
    console.error("Heisty Spideys | couldn't build the replacement:", err);
    return null;
  }
}

/**
 * A crew spider went Out (active GM). Runs the Waiting Web per the setting.
 * @param {Actor} actor
 * @param {{postPrompt?:Function}} [hooks]  posts the GM prompt in "prompt" mode
 */
export async function onSpiderOut(actor, { postPrompt = null } = {}) {
  const mode = setting(SETTINGS.autoWaitingWeb, "auto");
  if (mode === "off" || !actor) return null;
  if (mode === "prompt") {
    await postPrompt?.({
      title: "The Waiting Web",
      html: `<p><strong>${esc(actor.name)}</strong> is Out. Bring in the replacement from the Waiting Web?</p>`,
      buttons: [{ action: "replacement", label: "Bring in the replacement", primary: true, args: { actorId: actor.id } }]
    });
    return null;
  }
  return bringReplacement(actor.id);
}

/** Create and record the replacement for an Out spider (active GM). */
export async function bringReplacement(actorId) {
  const actor = game.actors.get(actorId);
  if (!actor) return null;
  const s = store.state;
  const crew = (s.crew ?? []).find(c => c.actorId === actorId);
  if ((s.crew ?? []).some(c => c.replacementOf === actorId)) return null;   // already brought in
  const answer = await askOwner(actor);
  const lastEscape = !!crew?.caughtLastEscape;
  const created = await create(actor, answer, lastEscape ? null : (Number(s.obstacleSerial) || 0) + 1);
  if (!created) return null;
  const owner = playerOwner(actor);
  await store.mutate(st => flow.addReplacement(st, {
    slot: crew?.slot || actor.system.heist?.slot || actor.id, actorId: created.id, userId: owner?.id ?? crew?.userId ?? null,
    name: created.name, replacementOf: actorId
  }), { label: "replacement" });
  const status = lastEscape ? "escaped" : "waiting";
  try { if (created.system?.heist?.status !== status) await created.update({ "system.heist.status": status }); } catch (e) { /* schema without heist */ }
  await ChatMessage.create({
    speaker: { alias: "The Waiting Web" },
    content: lastEscape
      ? `<p><strong>${esc(created.name)}</strong> is waiting at the exit. (Caught in the last Escape obstacle: that player earns half AP.)</p>`
      : `<p><strong>${esc(created.name)}</strong> heard it was bad in there and came anyway — Rattled, with half their starting Silk. They arrive at the start of the next obstacle, next to a crewmate.</p>`
  });
  return created;
}

/** A replacement arrives at the start of an obstacle (active GM): token next to a crewmate, status active. */
export async function arrive(actorId) {
  const actor = game.actors.get(actorId);
  if (!actor) return;
  try { if (actor.system?.heist?.status !== "active") await actor.update({ "system.heist.status": "active" }); } catch (e) { /* ignore */ }
  const mates = flow.presentCrew(store.state).map(c => c.actorId).filter(id => id !== actorId);
  try { await placeNextToCrew(actor, mates); } catch (err) { console.warn("Heisty Spideys | couldn't place the replacement:", err); }
}
