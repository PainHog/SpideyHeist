/**
 * HEISTY SPIDEYS — Tokens (design §3.9, §3.11, §3.14)
 * ---------------------------------------------------
 * Canvas helpers for the heist runtime, every one guarded for a client with no
 * canvas: Waiting Web arrivals placed next to a crewmate, hiding an Out
 * spider's token, adjacency from tokens, the Crab's camouflage cleared when its
 * token moves, and (setting movementWarnings) a warning when a token moves
 * further than its effective Speed during a combat. Movement is never blocked.
 */

import { SYSTEM_ID, SETTINGS } from "../contracts.mjs";
import { toSquare, toPixels, chebyshev, adjacent, freeAdjacentSquare, moveDistance } from "../logic/grid.mjs";

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const canvasReady = () => !!globalThis.canvas?.ready && !!canvas.scene;
const gridSize = () => canvas?.grid?.size ?? canvas?.scene?.grid?.size ?? 100;

function setting(key, fallback) {
  try { return game.settings.get(SYSTEM_ID, key) ?? fallback; } catch (e) { return fallback; }
}

/** The token documents of an actor on the viewed scene. */
export function tokensOf(actor, scene = canvas?.scene) {
  if (!actor || !scene) return [];
  return scene.tokens.filter(t => t.actorId === actor.id);
}

/** The grid square of a token document. */
export function squareOf(tokenDoc) {
  return toSquare({ x: tokenDoc?.x, y: tokenDoc?.y }, gridSize());
}

/** Squares between two actors' tokens (null with no canvas or no token). */
export function distanceBetween(a, b) {
  if (!canvasReady()) return null;
  const ta = tokensOf(a)[0], tb = tokensOf(b)[0];
  if (!ta || !tb) return null;
  return chebyshev(squareOf(ta), squareOf(tb));
}

/** Adjacent on the grid? null when it can't be told (no tokens). */
export function actorsAdjacent(a, b) {
  const d = distanceBetween(a, b);
  return d === null ? null : d <= 1;
}

/**
 * Place (or move) an arriving spider's token on a free square next to any
 * crewmate (GM). Returns the token document, or null with no canvas/crewmate.
 * @param {Actor} actor
 * @param {string[]} crewIds  actor ids of crewmates on the board
 */
export async function placeNextToCrew(actor, crewIds = []) {
  if (!game.user.isGM || !canvasReady() || !actor) return null;
  const scene = canvas.scene;
  const mates = crewIds.map(id => game.actors.get(id)).filter(a => a && a.id !== actor.id);
  const mateToken = mates.map(a => tokensOf(a, scene).find(t => !t.hidden)).find(Boolean);
  if (!mateToken) return null;
  const occupied = scene.tokens.map(t => squareOf(t));
  const bounds = { width: Math.ceil((scene.dimensions?.sceneWidth ?? scene.width ?? 4000) / gridSize()) + 50, height: Math.ceil((scene.dimensions?.sceneHeight ?? scene.height ?? 4000) / gridSize()) + 50 };
  const sq = freeAdjacentSquare(squareOf(mateToken), occupied, bounds) ?? squareOf(mateToken);
  const px = toPixels(sq, gridSize());
  const existing = tokensOf(actor, scene)[0];
  if (existing) {
    await existing.update({ x: px.x, y: px.y, hidden: false });
    return existing;
  }
  const data = await actor.getTokenDocument({ x: px.x, y: px.y, hidden: false });
  const [created] = await scene.createEmbeddedDocuments("Token", [data.toObject ? data.toObject() : data]);
  return created ?? null;
}

/** Hide an Out spider's tokens (GM). */
export async function hideTokens(actor) {
  if (!game.user.isGM || !canvas?.scene || !actor) return;
  const updates = tokensOf(actor).filter(t => !t.hidden).map(t => ({ _id: t.id, hidden: true }));
  if (updates.length) await canvas.scene.updateEmbeddedDocuments("Token", updates);
}

/**
 * updateToken hook (every client).
 * - Active GM: a camouflaged Crab Spider that moves loses its camouflage.
 * - The mover's client: a movement warning beyond effective Speed (in combat).
 */
export function onUpdateToken(tokenDoc, changes, options, userId, { isActiveGM }) {
  const moved = changes?.x !== undefined || changes?.y !== undefined;
  if (!moved) return;
  const actor = tokenDoc?.actor;
  if (!actor || actor.type !== "spider") return;
  if (isActiveGM() && actor.system?.heist?.camouflaged) {
    actor.update({ "system.heist.camouflaged": false }).catch(() => {});
    ChatMessage.create({ content: `<p><strong>${esc(actor.name)}</strong> moved: the camouflage is gone.</p>`, speaker: { alias: "The Heist" }, whisper: game.users.filter(u => u.isGM || actor.testUserPermission(u, "OWNER")).map(u => u.id) });
  }
  if (userId !== game.user.id || !setting(SETTINGS.movementWarnings, false) || !game.combat?.started) return;
  const from = options?.heistyFrom ?? options?._heistyFrom;
  const speed = Number(actor.system?.speed?.effective ?? actor.system?.speed?.value);
  if (!from || !Number.isFinite(speed)) return;
  const dist = moveDistance(toSquare(from, gridSize()), squareOf(tokenDoc));
  if (dist > speed) ui.notifications?.warn(`${actor.name} moved ${dist} squares — their Speed is ${speed}.`);
}

/** preUpdateToken: remember where a token started (for the warning). */
export function onPreUpdateToken(tokenDoc, changes, options) {
  if (changes?.x === undefined && changes?.y === undefined) return;
  options.heistyFrom = { x: tokenDoc.x, y: tokenDoc.y };
}

export { adjacent, chebyshev };
