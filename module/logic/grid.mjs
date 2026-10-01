/**
 * HEISTY SPIDEYS — Grid helpers (pure)
 * ------------------------------------
 * One square = one spider (Ch 3). Distances are Chebyshev: a diagonal step is
 * one square, so "adjacent" is the eight squares around you. Positions are
 * `{x, y}` in SQUARES (not pixels); `toSquare` converts a token's pixel
 * position given the scene's grid size.
 */

/** Pixel position → grid square. */
export function toSquare(pos, gridSize = 100) {
  const g = Math.max(1, Number(gridSize) || 100);
  return { x: Math.floor((Number(pos?.x) || 0) / g + 1e-6), y: Math.floor((Number(pos?.y) || 0) / g + 1e-6) };
}

/** Grid square → pixel position of its top-left corner. */
export function toPixels(square, gridSize = 100) {
  const g = Math.max(1, Number(gridSize) || 100);
  return { x: Math.round((Number(square?.x) || 0) * g), y: Math.round((Number(square?.y) || 0) * g) };
}

/** Squares between two positions, diagonals counting one. */
export function chebyshev(a, b) {
  return Math.max(Math.abs((Number(a?.x) || 0) - (Number(b?.x) || 0)), Math.abs((Number(a?.y) || 0) - (Number(b?.y) || 0)));
}

/** Next to each other (the eight surrounding squares; the same square counts too). */
export function adjacent(a, b) {
  return chebyshev(a, b) <= 1;
}

/** Within `squares` (inclusive). */
export function withinRange(a, b, squares) {
  return chebyshev(a, b) <= Math.max(0, Number(squares) || 0);
}

/** The eight squares around `sq`, nearest-first (orthogonal before diagonal). */
export function neighbours(sq) {
  const x = Number(sq?.x) || 0, y = Number(sq?.y) || 0;
  return [
    { x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 },
    { x: x + 1, y: y + 1 }, { x: x - 1, y: y + 1 }, { x: x + 1, y: y - 1 }, { x: x - 1, y: y - 1 }
  ];
}

/**
 * A free square next to `target` (Waiting Web arrivals: "next to any crewmate").
 * @param {{x,y}} target
 * @param {{x,y}[]} occupied
 * @param {{width?:number, height?:number}} [bounds]  in squares
 * @returns {{x,y}|null}
 */
export function freeAdjacentSquare(target, occupied = [], bounds = null) {
  const taken = new Set((occupied ?? []).map(o => `${o.x},${o.y}`));
  for (const n of neighbours(target)) {
    if (n.x < 0 || n.y < 0) continue;
    if (bounds && (n.x >= bounds.width || n.y >= bounds.height)) continue;
    if (!taken.has(`${n.x},${n.y}`)) return n;
  }
  return null;
}

/** Squares moved from one position to another (for movement warnings). */
export function moveDistance(from, to) {
  return chebyshev(from, to);
}

/** Butterfingers (N19): 1–2 the square ahead, 3–4 to its left, 5–6 to its right. */
export function butterfingersDirection(d6) {
  const r = Math.min(6, Math.max(1, Math.round(Number(d6) || 1)));
  return r <= 2 ? "ahead" : r <= 4 ? "left" : "right";
}
