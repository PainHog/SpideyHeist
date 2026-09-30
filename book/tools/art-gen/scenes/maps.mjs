// Chapter 19 heist maps: one shared kit, five maps.
//   node book/tools/art-gen/scenes/build.mjs map-cookie map-office map-petstore map-library map-restaurant
//
// Style (from the original Heist 1 map): 50-unit squares on a parchment floor with gold
// stipple, dark brick walls, a faint ink grid over every square, ink room outlines, grey
// furniture blocks (glints = a slippery surface), threshold boards in open doorways.
// Every map is a top-down plan: everything shown lies on the floor or on a piece of
// furniture inside its outline, or is fixed to a wall (vents, beam emitters, the tap, webs).
// Callouts are printed on the map: gold lettered badges = entry points, numbered circles =
// the Suggested Obstacles (dashed = the unknown), dark E-pills = Escape obstacles on the
// dashed gold escape route, red tokens = where threats start (dashed = the unknown).
import { C, n, svg, stipple, line } from "./lib.mjs";

const FONT = `font-family="'Alegreya Sans', 'Segoe UI', sans-serif"`;
const text = (x, y, str, size = 16, o = {}) => {
  const { fill = C.ink, weight = "normal", anchor = "middle", style = "", ls = 0 } = o;
  return `<text x="${n(x)}" y="${n(y)}" ${FONT} font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${style ? ` font-style="${style}"` : ""}${ls ? ` letter-spacing="${ls}"` : ""}>${str}</text>`;
};

const CS = 50;     // one square
const M = 48;      // outer margin (room for entry badges and floor labels)

const WALLS = new Set(["#", "V", "p"]);
const OPEN = new Set(["D", "g", "h"]);
const FLOORS = new Set([".", ",", "w", "!"]);
const cls = ch => WALLS.has(ch) ? "wall" : OPEN.has(ch) ? "open" : FLOORS.has(ch) ? "floor" : ch;

/**
 * One floor plan with its top-left grid corner at (ox, oy).
 * Terrain: # wall · V vent in a wall · p pipe gap through a wall · D open doorway · g door with a gap under it · h serving hatch
 *          . floor · , rough ground (hatched) · w wet floor (mopped) · ! floor under a sensor beam
 *          T furniture (cover, climbable) · ~ slippery worktop (glints) · F feeder tub
 *          S stairs · Q cable riser shaft · H dumbwaiter shaft
 */
function plan(rows, ox, oy, seed = 4) {
  const H = rows.length, W = rows[0].length;
  if (rows.some(r => r.length !== W)) throw new Error("map row length");
  const X = c => ox + c * CS, Y = r => oy + r * CS;
  const at = (c, r) => (r < 0 || r >= H || c < 0 || c >= W) ? null : rows[r][c];
  const isWallish = ch => ch != null && (WALLS.has(ch) || OPEN.has(ch));
  let s = "";
  s += `<rect x="${ox + 6}" y="${oy + 8}" width="${W * CS}" height="${H * CS}" fill="${C.ink}" opacity=".18"/>`;
  s += `<rect x="${ox}" y="${oy}" width="${W * CS}" height="${H * CS}" fill="${C.parch}"/>`;
  s += stipple(seed, ox + W * CS / 2, oy + H * CS / 2, W * CS / 2, H * CS / 2, Math.round(W * H * 2.3), .9, C.gold, .35);
  let walls = "", soft = "", edge = "", deep = "", br = "", gl = "", wet = "", rough = "", planks = "", woodEdge = "", treads = "", extra = "";
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    const x = X(c), y = Y(r);
    const cell = fill => `<rect x="${x}" y="${y}" width="${CS}" height="${CS}" fill="${fill}"/>`;
    if (ch === "#" || ch === "V" || ch === "p") {
      walls += cell(C.deep);
      if (ch === "p") extra += `<circle cx="${x + 25}" cy="${y + 25}" r="16" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.2"/>`
        // the dishwasher's drain pipe runs in from the kitchen side and elbows down through the floor inside the gap
        + `<path d="M${x + 25} ${y}V${y + 25}" stroke="${C.ink}" stroke-width="11"/><path d="M${x + 25} ${y}V${y + 25}" stroke="${C.soft}" stroke-width="7"/>`
        + `<circle cx="${x + 25}" cy="${y + 25}" r="6.5" fill="${C.soft}" stroke="${C.ink}" stroke-width="2"/><circle cx="${x + 25}" cy="${y + 25}" r="2.5" fill="${C.ink}"/>`
        + `<path d="M${x + 19} ${y + 10}h12" stroke="${C.ink}" stroke-width="2"/>`;
      if (ch === "#") br += `M${x} ${y + 17}h${CS}M${x} ${y + 34}h${CS}M${x + (r + c) % 2 * 25 + 12} ${y}v17M${x + ((r + c + 1) % 2) * 25 + 12} ${y + 17}v17M${x + (r + c) % 2 * 25 + 12} ${y + 34}v16`;
    }
    if (ch === "~" || ch === "T" || ch === "F") {
      soft += cell(C.soft);
      if (ch === "~") gl += r % 2 ? `M${x + 12} ${y + 14}l10 -6` : `M${x + 26} ${y + 30}l12 -7`;
      if (at(c, r + 1) !== ch) woodEdge += `M${x + (at(c - 1, r) === ch ? 0 : 4)} ${y + CS - 5}H${x + CS - (at(c + 1, r) === ch ? 0 : 4)}`;
      if (ch === "F") extra += `<rect x="${x + 7}" y="${y + 7}" width="${CS - 14}" height="${CS - 14}" rx="7" fill="${C.plum}" stroke="${C.ink}" stroke-width="1.6"/>`
        + [[16, 18], [30, 15], [24, 28], [34, 32], [15, 34]].map(([a, b]) => `<ellipse cx="${x + a}" cy="${y + b}" rx="3" ry="1.8" fill="${C.edge}"/>`).join("");
    }
    if (ch === "," ) rough += `M${x + 4} ${y + 18}l14 -14M${x + 4} ${y + 34}l30 -30M${x + 4} ${y + 48}l44 -44M${x + 18} ${y + 48}l30 -30M${x + 34} ${y + 48}l14 -14`;
    if (ch === "w") wet += `M${x + 10} ${y + 16}l12 -6M${x + 28} ${y + 38}l12 -6`;
    if (ch === "S") {
      edge += cell(C.edge);
      const across = at(c - 1, r) === "S" || at(c + 1, r) === "S";   // treads run across the flight
      for (let k = 1; k < 4; k++) treads += across ? `M${x + k * 12.5} ${y + 3}v${CS - 6}` : `M${x + 3} ${y + k * 12.5}h${CS - 6}`;
    }
    if (ch === "Q" || ch === "H") {
      deep += cell(C.deep);
      if (ch === "Q") extra += `<rect x="${x + 5}" y="${y + 5}" width="${CS - 10}" height="${CS - 10}" fill="none" stroke="${C.soft}" stroke-width="2"/>`
        + [[18, 18], [30, 20], [22, 31], [33, 32]].map(([a, b]) => `<circle cx="${x + a}" cy="${y + b}" r="4.2" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.2"/>`).join("");
      if (ch === "H") extra += `<rect x="${x + 7}" y="${y + 7}" width="${CS - 14}" height="${CS - 14}" fill="${C.edge}" stroke="${C.ink}" stroke-width="1.8"/>`
        + line(`M${x + 7} ${y + 7}L${x + CS - 7} ${y + CS - 7}M${x + CS - 7} ${y + 7}L${x + 7} ${y + CS - 7}`, 1.4, C.plum)
        + `<circle cx="${x + 25}" cy="${y + 25}" r="6" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.4"/>`;
    }
    if (OPEN.has(ch)) {
      edge += cell(C.edge);
      const vertWall = isWallish(at(c, r - 1)) || isWallish(at(c, r + 1));   // the opening sits in a wall that runs up–down
      for (let k = 1; k < 4; k++) planks += vertWall ? `M${x + 2} ${y + k * 12.5}h${CS - 4}` : `M${x + k * 12.5} ${y + 2}v${CS - 4}`;
      if (ch === "g") {   // a closed door leaf across the opening; spiders squeeze through the gap under it
        extra += vertWall
          ? `<rect x="${x + 18}" y="${y}" width="14" height="${CS}" fill="${C.plum}" stroke="${C.ink}" stroke-width="1.8"/>`
          : `<rect x="${x}" y="${y + 18}" width="${CS}" height="14" fill="${C.plum}" stroke="${C.ink}" stroke-width="1.8"/>`;
      }
      if (ch === "h") {   // serving hatch: an opening with a sill at worktop height
        extra += vertWall
          ? `<rect x="${x + 10}" y="${y + 3}" width="30" height="${CS - 6}" fill="${C.soft}" stroke="${C.ink}" stroke-width="1.8"/>`
          : `<rect x="${x + 3}" y="${y + 10}" width="${CS - 6}" height="30" fill="${C.soft}" stroke="${C.ink}" stroke-width="1.8"/>`;
      }
    }
  }));
  s += walls + soft + edge + deep;
  if (planks) s += line(planks, 1, C.gold, ` opacity=".7"`);
  if (br) s += line(br, 1.2, C.plum);
  if (rough) s += line(rough, 1.4, C.ink, ` opacity=".4"`);
  if (wet) s += line(wet, 2.6, C.soft, ` opacity=".8"`);
  if (treads) s += line(treads, 1.6, C.ink, ` opacity=".75"`);
  if (woodEdge) s += line(woodEdge, 3, C.plum);
  if (gl) s += line(gl, 2.4, C.cream, ` opacity=".55"`);
  s += extra;
  // grid (every square visible)
  let gd = "";
  for (let c = 0; c <= W; c++) gd += `M${X(c)} ${oy}V${Y(H)}`;
  for (let r = 0; r <= H; r++) gd += `M${ox} ${Y(r)}H${X(W)}`;
  s += line(gd, 1.3, C.ink, ` opacity=".35"`);
  // outlines: wherever two neighbouring squares are of different kinds (an open doorway
  // runs straight into the floor, so that edge stays open; the jambs are drawn)
  let ol = "";
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const a = cls(rows[r][c]);
    for (const [dc, dr] of [[1, 0], [0, 1]]) {
      const b = at(c + dc, r + dr); if (b == null) continue;
      const k = cls(b); if (k === a) continue;
      if ((a === "floor" && k === "open") || (a === "open" && k === "floor")) continue;
      ol += dc ? `M${X(c + 1)} ${Y(r)}V${Y(r + 1)}` : `M${X(c)} ${Y(r + 1)}H${X(c + 1)}`;
    }
  }
  s += `<path d="${ol}" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="square"/>`;
  // vents
  rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === "V") s += vent(X(c), Y(r)); }));
  s += `<rect x="${ox}" y="${oy}" width="${W * CS}" height="${H * CS}" fill="none" stroke="${C.ink}" stroke-width="3.4"/>`;
  return { s, X, Y, W, H, cx: (c) => X(c) + CS / 2, cy: (r) => Y(r) + CS / 2 };
}

/* ------------------------------------------------------------------ props -- */
const vent = (x, y) => `<rect x="${x + 6}" y="${y + 6}" width="${CS - 12}" height="${CS - 12}" rx="3" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.4"/>`
  + line(`M${x + 12} ${y + 15}h26M${x + 12} ${y + 22}h26M${x + 12} ${y + 29}h26M${x + 12} ${y + 36}h26`, 3, C.ink)
  + `<circle cx="${x + 10}" cy="${y + 10}" r="1.6" fill="${C.ink}"/><circle cx="${x + 40}" cy="${y + 40}" r="1.6" fill="${C.ink}"/>`;

const glow = (x, y, r = 22) => `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${C.goldB}" opacity=".5"/>`;

/** A red threat token (r 17) with a cream letter; dashed = the unknown (ST only). */
function token(x, y, letter, dashed = false) {
  if (dashed) return `<circle cx="${n(x)}" cy="${n(y)}" r="17" fill="${C.cream}" stroke="${C.ox}" stroke-width="2.8" stroke-dasharray="5 3.5"/>` + text(x, y + 7.5, letter, 21, { weight: "bold", fill: C.ox });
  return `<circle cx="${n(x)}" cy="${n(y)}" r="17" fill="${C.ox}" stroke="${C.ink}" stroke-width="2.4"/>` + text(x, y + 7.5, letter, 21, { weight: "bold", fill: C.cream });
}
/** The cat's token (the Heist 1 bed): red rings and a cream paw print. */
function paw(cx, cy) {
  return `<circle cx="${cx}" cy="${cy}" r="20" fill="${C.ox}" stroke="${C.ink}" stroke-width="2.6"/><circle cx="${cx}" cy="${cy}" r="12" fill="${C.oxB}" stroke="${C.ink}" stroke-width="1.8"/>`
    + `<circle cx="${cx}" cy="${cy + 2}" r="3.4" fill="${C.cream}"/><circle cx="${cx - 5}" cy="${cy - 4}" r="1.8" fill="${C.cream}"/><circle cx="${cx}" cy="${cy - 6}" r="1.8" fill="${C.cream}"/><circle cx="${cx + 5}" cy="${cy - 4}" r="1.8" fill="${C.cream}"/>`;
}
/** Obstacle callout: a numbered circle; dashed red for the unknown obstacle. */
function mark(x, y, label, unknown = false) {
  return `<circle cx="${n(x)}" cy="${n(y)}" r="17" fill="${C.cream}" stroke="${unknown ? C.ox : C.ink}" stroke-width="${unknown ? 3 : 2.6}"${unknown ? ` stroke-dasharray="5 3.5"` : ""}/>`
    + text(x, y + 8, label, 23, { weight: "bold", fill: unknown ? C.ox : C.ink });
}
/** Escape callout: a dark pill. */
function esc(x, y, label) {
  return `<rect x="${n(x - 23)}" y="${n(y - 15)}" width="46" height="30" rx="15" fill="${C.deep}" stroke="${C.cream}" stroke-width="1.6"/>`
    + text(x, y + 7, label, 19, { weight: "bold", fill: C.cream });
}
/** Entry badge: a gold lettered circle with a pointer toward the entry (dir: "r","l","u","d" or null). */
function entry(x, y, letter, dir = null) {
  let p = "";
  const t = { r: [[15, -8], [27, 0], [15, 8]], l: [[-15, -8], [-27, 0], [-15, 8]], d: [[-8, 15], [0, 27], [8, 15]], u: [[-8, -15], [0, -27], [8, -15]] }[dir];
  if (t) p = `<path d="M${t.map(([a, b]) => `${n(x + a)} ${n(y + b)}`).join("L")}Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
  return p + `<circle cx="${n(x)}" cy="${n(y)}" r="17" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2.4"/>` + text(x, y + 7.5, letter, 21, { weight: "bold" });
}
/** The escape route: gold dashes cased in ink, ending in an arrowhead. */
function route(pts) {
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${n(x)} ${n(y)}`).join("");
  const [x1, y1] = pts[pts.length - 2], [x2, y2] = pts[pts.length - 1];
  const a = Math.atan2(y2 - y1, x2 - x1), L = 17, w = 10;
  const tip = [x2 + Math.cos(a) * 4, y2 + Math.sin(a) * 4];
  const b1 = [x2 - Math.cos(a) * L + Math.sin(a) * w, y2 - Math.sin(a) * L - Math.cos(a) * w];
  const b2 = [x2 - Math.cos(a) * L - Math.sin(a) * w, y2 - Math.sin(a) * L + Math.cos(a) * w];
  return `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="7.5" stroke-dasharray="13 8" stroke-linecap="butt" stroke-linejoin="round"/>`
    + `<path d="${d}" fill="none" stroke="${C.goldB}" stroke-width="3.6" stroke-dasharray="13 8" stroke-linecap="butt" stroke-linejoin="round"/>`
    + `<path d="M${n(tip[0])} ${n(tip[1])}L${n(b1[0])} ${n(b1[1])}L${n(b2[0])} ${n(b2[1])}Z" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
}
/** A patrol line: red dots with small chevrons showing the direction. */
function patrol(pts, closed = true) {
  const P = closed ? [...pts, pts[0]] : pts;
  const d = P.map(([x, y], i) => `${i ? "L" : "M"}${n(x)} ${n(y)}`).join("");
  let ch = "";
  for (let i = 0; closed && i + 1 < P.length; i++) {
    const [x1, y1] = P[i], [x2, y2] = P[i + 1], mx = (x1 + x2) / 2, my = (y1 + y2) / 2, a = Math.atan2(y2 - y1, x2 - x1);
    const p = (u, v) => `${n(mx + Math.cos(a) * u - Math.sin(a) * v)} ${n(my + Math.sin(a) * u + Math.cos(a) * v)}`;
    ch += `M${p(-5, -7)}L${p(4, 0)}L${p(-5, 7)}`;
  }
  return `<path d="${d}" fill="none" stroke="${C.ox}" stroke-width="2.6" stroke-dasharray="1 7" stroke-linecap="round" stroke-linejoin="round"/>`
    + (ch ? line(ch, 2.6, C.ox) : "");
}
const label = (x, y, str) => text(x, y, str, 22, { weight: "bold", fill: C.plum, anchor: "start", ls: 2.5 });
const note = (x, y, str, anchor = "middle") => text(x, y, str, 21, { style: "italic", fill: C.soft, anchor });

/* ====================================================== Heist 1: cookie === */
export function map_cookie() {
  const rows = [
    "################",
    "V.....~~~~~~..C#",
    "#.....~~~~~~...#",
    "#..............#",
    "#....K.........#",
    "#..............#",
    "##########DDDD##",
  ];
  const p = plan(rows.map(r => r.replace(/[CK]/g, ".")), M, M);
  const { X, Y, cx, cy } = p;
  let s = p.s;
  // sink set into the counter's back row at (8–9,1): basin, drain (entry B), and the tap fixed to the back wall
  { const x = X(8) + 6, y = Y(1) + 5;
    s += `<rect x="${x}" y="${y}" width="${2 * CS - 12}" height="${CS - 8}" rx="12" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.6"/>`;
    s += `<rect x="${x + 5}" y="${y + 5}" width="${2 * CS - 22}" height="${CS - 18}" rx="9" fill="none" stroke="${C.edge}" stroke-width="2"/>`;
    s += `<circle cx="${X(9) + 14}" cy="${Y(1) + 25}" r="6.5" fill="${C.plum}" stroke="${C.ink}" stroke-width="1.8"/>`;
    s += line(`M${X(9) + 10} ${Y(1) + 25}h8M${X(9) + 14} ${Y(1) + 21}v8`, 1.4, C.edge);
    // tap: base plate on the wall face, spout reaching over the basin
    s += `<rect x="${X(9) - 9}" y="${Y(1) - 4}" width="18" height="8" rx="2" fill="${C.soft}" stroke="${C.ink}" stroke-width="1.8"/>`;
    s += `<path d="M${X(9)} ${Y(1) + 4}V${Y(1) + 17}" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><path d="M${X(9)} ${Y(1) + 4}V${Y(1) + 17}" stroke="${C.soft}" stroke-width="3" stroke-linecap="round"/>`; }
  // cabinet C at (14,1) with the blue-lidded tin
  { const x = X(14), y = Y(1); s += `<rect x="${x + 3}" y="${y + 3}" width="${CS - 6}" height="${CS - 6}" rx="3" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.6"/>`;
    s += line(`M${x + 25} ${y + 5}v${CS - 10}`, 1.6, C.ink, ` opacity=".5"`);
    s += `<circle cx="${x + 25}" cy="${y + 25}" r="15" fill="${C.goldB}" opacity=".5"/>`;
    s += `<circle cx="${x + 25}" cy="${y + 25}" r="11" fill="${C.blue}" stroke="${C.ink}" stroke-width="2.2"/><circle cx="${x + 25}" cy="${y + 25}" r="7.5" fill="${C.blueL}"/><circle cx="${x + 22}" cy="${y + 22}" r="2.4" fill="${C.cream}" opacity=".8"/>`; }
  // doorway at (10..13,6): a double door filling the 4-square opening, each leaf hinged at the
  // room-side corner of its jamb and swung open into the room, with its dashed swing arc.
  { const x = X(10), yb = Y(6), Lf = 2 * CS, a = 70 * Math.PI / 180;
    for (const [hx, dir] of [[x, 1], [x + 4 * CS, -1]]) {
      const tx = hx + dir * Lf * Math.cos(a), ty = yb - Lf * Math.sin(a);
      s += `<path d="M${hx} ${yb}L${n(tx)} ${n(ty)}" stroke="${C.plum}" stroke-width="8" stroke-linecap="round"/><path d="M${hx} ${yb}L${n(tx)} ${n(ty)}" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/>`;
      s += `<path d="M${n(tx)} ${n(ty)}A${Lf} ${Lf} 0 0 ${dir > 0 ? 1 : 0} ${hx + dir * Lf} ${yb}" fill="none" stroke="${C.ink}" stroke-width="1.4" stroke-dasharray="3 4"/>`;
    } }
  s += note(X(12), Y(7) + 30, "to the hall, bathroom and bedrooms");
  // a bottle cap lying flat on the floor at (9,4): crimped rim, seen from above
  { const x = cx(9), y = cy(4); let r = "";
    for (let k = 0; k < 21; k++) { const a = k * Math.PI * 2 / 21; r += `${k ? "L" : "M"}${n(x + Math.cos(a) * (k % 2 ? 9.5 : 11))} ${n(y + Math.sin(a) * (k % 2 ? 9.5 : 11))}`; }
    s += `<ellipse cx="${x + 2}" cy="${y + 3}" rx="11" ry="10" fill="${C.ink}" opacity=".18"/>`;
    s += `<path d="${r}Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="6" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.2"/>`; }
  // escape route: cabinet foot → along the floor (south of the counter) → the vent
  s += route([[cx(14), cy(2)], [cx(12), cy(3)], [cx(2), cy(3)], [cx(1), cy(1) + 8], [X(0) + 30, cy(1) + 8]]);
  // threats: the cat's bed K at (5,4)
  s += paw(cx(5), cy(4));
  // callouts
  s += entry(M - 24, cy(1), "A", "r");
  s += entry(X(8) + 20, Y(1) + 25, "B");
  s += mark(cx(4), cy(2), "1");
  s += mark(X(14), Y(2) + 2, "2");
  s += mark(X(14), Y(1), "3");
  s += mark(X(15), Y(1), "4", true);
  s += esc(cx(8), cy(3), "E1");
  s += esc(cx(1) + 10, cy(2) + 4, "E2");
  return svg(`0 0 ${16 * CS + 2 * M} ${7 * CS + 2 * M}`, "Heist 1 map: a 16 by 7 kitchen with the wall vent and the sink drain as entry points, the counter, the tin cabinet, the cat's bed, the doorway to the hall, the numbered obstacles and the escape route", s);
}

/* ====================================================== Heist 2: office === */
export function map_office() {
  const up = [
    "################",
    "#.......#.....Q#",
    "#.TTT...D..TT..#",
    "#.......########",
    "#.TTT.......SSS#",
    "#...........SSS#",
    "################",
  ];
  const gr = [
    "################",
    "V...!...!.....Q#",
    "#.TT!.TT!.TT...#",
    "#...!...!......#",
    "#.TT!.TT!...SSS#",
    "#...!...!...SSS#",
    "##g#############",
  ];
  const oyU = M + 10, oyG = oyU + 7 * CS + 70;
  const U = plan(up, M, oyU, 5), G = plan(gr, M, oyG, 6);
  let s = U.s + G.s;
  s += label(M, oyU - 14, "UPPER FLOOR") + label(M, oyG - 14, "GROUND FLOOR");
  s += note(M + 16 * CS, oyU - 14, "stairs and riser line up floor to floor", "end");
  // ground floor: two sensor beams (x = 4 and x = 8), emitters fixed to the north wall, receivers to the south wall
  for (const c of [4, 8]) {
    const x = G.cx(c);
    s += `<path d="M${x} ${G.Y(1)}V${G.Y(6)}" stroke="${C.oxB}" stroke-width="3.4" stroke-dasharray="9 6"/>`;
    s += `<rect x="${x - 10}" y="${G.Y(1) - 4}" width="20" height="11" rx="2" fill="${C.plum}" stroke="${C.ink}" stroke-width="1.8"/><circle cx="${x}" cy="${G.Y(1) + 3}" r="3" fill="${C.oxB}"/>`;
    s += `<rect x="${x - 10}" y="${G.Y(6) - 7}" width="20" height="11" rx="2" fill="${C.plum}" stroke="${C.ink}" stroke-width="1.8"/>`;
  }
  // upper floor: the manager's desk (11–12,2) with the drawer (gold, inside the desk's outline)
  s += glow(U.X(12), U.cy(2), 24);
  s += `<rect x="${U.X(12) - 13}" y="${U.Y(2) + 30}" width="26" height="13" rx="2" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/><path d="M${U.X(12) - 5} ${U.Y(2) + 36.5}h10" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`;
  // the unknown: the cleaners' cart wedged in the office doorway (8,2), a cleaner vacuuming inside
  { const x = U.X(8) + 3, y = U.Y(2) + 9;
    s += `<rect x="${x}" y="${y}" width="${CS - 6}" height="32" rx="4" fill="${C.edge}" stroke="${C.ox}" stroke-width="2.4" stroke-dasharray="5 3.5"/>`;
    s += `<circle cx="${x + 14}" cy="${y + 16}" r="8" fill="none" stroke="${C.ox}" stroke-width="2" stroke-dasharray="4 3"/>`;
    for (const [a, b] of [[4, 3], [CS - 10, 3], [4, 29], [CS - 10, 29]]) s += `<circle cx="${x + a}" cy="${y + b}" r="2.6" fill="${C.ink}"/>`; }
  s += token(U.cx(10), U.cy(1), "H", true);
  // the guard spider on the stair landing, and its loop of the open floor
  s += patrol([[U.cx(11), U.cy(5)], [U.cx(1), U.cy(5)], [U.cx(1), U.cy(1)], [U.cx(7), U.cy(1)], [U.cx(7), U.cy(4)], [U.cx(11), U.cy(4)]]);
  s += token(U.cx(11), U.cy(4), "G");
  // escape: drawer → riser (down) … ground: riser → back across the beams → past the vent → service door gap
  s += route([[U.cx(12), U.cy(1) + 6], [U.cx(14) - 14, U.cy(1)]]);
  s += route([[G.cx(14), G.cy(1) + 12], [G.cx(13), G.cy(3)], [G.cx(2), G.cy(3)], [G.cx(2), G.Y(6) + 26]]);
  // callouts
  s += entry(M - 24, G.cy(1), "A", "r");
  s += entry(G.cx(2), G.Y(7) + 24, "B", "u");
  s += mark(G.cx(6), G.cy(1), "1");
  s += mark(U.cx(6), U.cy(4) + 2, "2");
  s += mark(U.cx(9), U.cy(2) + 2, "3", true);
  s += mark(U.cx(13), U.cy(2), "4");
  s += esc(G.cx(6), G.cy(3), "E1");
  s += esc(G.cx(1) + 2, G.cy(1) + 2, "E2");
  const H = oyG + 7 * CS + M + 8;
  return svg(`0 0 ${16 * CS + 2 * M} ${H}`, "Heist 2 map: two 16 by 7 floors of an office. Ground floor: vent and service-door entries, two sensor beams, desks, stairs and a cable riser. Upper floor: the open floor with the guard spider's loop, and the corner office with the manager's desk", s);
}

/* ==================================================== Heist 3: pet store === */
export function map_petstore() {
  const rows = [
    "####g###########",
    "#,FF,,,,FF,,,FF#",
    "#,,,,,,,,,,,,,,#",
    "########DD######",
    "#..............#",
    "#..T...T...T...#",
    "#..T...T...T...#",
    "#..T...T...T...#",
    "#..........TTT.#",
    "#..........T...#",
    "#..........T...#",
    "####g###########",
  ];
  const p = plan(rows, M, M, 7);
  const { X, Y, cx, cy } = p;
  let s = p.s;
  // snake tank on the floor at the end of aisle 3 (12–13, 6–7): glass box, lid shifted (still resting on the rim)
  { const x = X(12) + 5, y = Y(6) + 6, w = 2 * CS - 10, h = 2 * CS - 12;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.6"/>`;
    s += `<rect x="${x + 7}" y="${y + 2}" width="${w - 9}" height="${h - 8}" rx="2" fill="none" stroke="${C.plum}" stroke-width="1.8" stroke-dasharray="7 4"/>`;   // the loose lid, shifted but wholly on the rim
    s += line(`M${x + 8} ${y + 20}l14 -10M${x + w - 26} ${y + h - 10}l16 -11`, 2.2, C.edge); }
  s += token(X(13), Y(7), "S");
  // parrot cage on its stand at (3,9): round cage with bars
  { const x = cx(3), y = cy(9);
    s += `<circle cx="${x}" cy="${y}" r="23" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.4"/>`;
    let b = ""; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; b += `M${n(x + Math.cos(a) * 17)} ${n(y + Math.sin(a) * 17)}L${n(x + Math.cos(a) * 23)} ${n(y + Math.sin(a) * 23)}`; }
    s += line(b, 1.6, C.ink); }
  s += token(cx(3), cy(9), "P");
  // the cage cover, folded, lying on the end of the nearest shelf unit (3,7)
  { const x = X(3) + 9, y = Y(7) + 12;
    s += `<rect x="${x}" y="${y}" width="32" height="24" rx="3" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.8"/>`;
    s += line(`M${x + 3} ${y + 12}h26`, 1.4, C.edge); }
  // a box of crackers on the counter (11,10)
  { const x = X(11) + 12, y = Y(10) + 8;
    s += `<rect x="${x}" y="${y}" width="26" height="34" rx="2" fill="${C.parch}" stroke="${C.ink}" stroke-width="1.8"/>`;
    s += `<circle cx="${x + 13}" cy="${y + 12}" r="5" fill="${C.edge}" stroke="${C.ink}" stroke-width="1.2"/><circle cx="${x + 13}" cy="${y + 24}" r="5" fill="${C.edge}" stroke="${C.ink}" stroke-width="1.2"/>`; }
  // the counter (11, 9–10), the back shelf (11–13, 8), and the feeder bin behind them at (13,10)
  s += glow(cx(13), cy(10), 23);
  { const x = X(13) + 6, y = Y(10) + 7;
    s += `<rect x="${x}" y="${y}" width="${CS - 12}" height="${CS - 14}" rx="4" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += [[9, 10], [20, 8], [29, 12], [12, 21], [24, 22], [31, 25], [16, 30]].map(([a, b]) => `<ellipse cx="${x + a}" cy="${y + b}" rx="3.2" ry="1.9" fill="${C.ink}"/>`).join(""); }
  // escape: bin → the narrow approach → up aisle 3 → stockroom door → the dock gap
  s += route([[cx(13), cy(10) - 8], [cx(14), cy(9)], [cx(14), cy(4)], [cx(9), cy(4)], [cx(8) + 25, cy(2)], [cx(4), cy(2)], [cx(4), Y(1) - 14]]);
  // callouts
  s += entry(cx(4), M - 24, "A", "d");
  s += entry(cx(4), Y(12) + 24, "B", "u");
  s += mark(cx(6), cy(1), "1");
  s += mark(cx(10), cy(6), "2");
  s += mark(cx(6), cy(9), "3");
  s += mark(cx(12), cy(9) + 4, "4", true);
  s += esc(cx(14) - 2, cy(5), "E1");
  s += esc(cx(11), cy(2), "E2");
  return svg(`0 0 ${16 * CS + 2 * M} ${12 * CS + 2 * M}`, "Heist 3 map: a 16 by 12 pet store: the stockroom with feeder tubs and the loading-dock gap, three aisles of shelving, the snake tank, the parrot's cage by the front door gap, and the feeder bin behind the counter", s);
}

/* ====================================================== Heist 4: library === */
export function map_library() {
  const f2 = [
    "################",
    "#SS..TT..TT..SS#",
    "#SS..........SS#",
    "#######D########",
    "#........H.....#",
    "#..............#",
    "################",
  ];
  const f1 = [
    "################",
    "#SS..T.T.T...SS#",
    "#SS..T.T.T...SS#",
    "#..............#",
    "#....TTTTH.....#",
    "#..............g",
    "#######g########",
  ];
  const oy2 = M + 10, oy1 = oy2 + 7 * CS + 70;
  const U = plan(f2, M, oy2, 8), G = plan(f1, M, oy1, 9);
  let s = U.s + G.s;
  s += label(M, oy2 - 14, "SECOND FLOOR") + label(M, oy1 - 14, "GROUND FLOOR");
  s += note(M + 16 * CS, oy2 - 14, "third floor off the map", "end");
  // second floor: the locked glass case (3–5,5) against the south wall, the book inside it
  { const x = U.X(3) + 6, y = U.Y(5) + 5, w = 3 * CS - 12, h = CS - 10;
    s += glow(U.X(4) + 25, U.cy(5), 26);
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${C.cream}" fill-opacity=".45" stroke="${C.ink}" stroke-width="2.6"/>`;
    s += `<rect x="${U.X(4) + 5}" y="${y + 8}" width="40" height="${h - 16}" rx="2" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/><path d="M${U.X(4) + 11} ${y + 8}v${h - 16}" stroke="${C.ink}" stroke-width="1.6"/>`;
    s += line(`M${x + 8} ${y + 26}l14 -18M${x + w - 24} ${y + h - 6}l14 -18`, 2, C.edge);
    s += `<circle cx="${x + w - 12}" cy="${y + h / 2}" r="5" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.6"/><path d="M${x + w - 12} ${y + h / 2}v5" stroke="${C.ink}" stroke-width="1.6"/>`; }
  // the librarian's centre-aisle walks (both floors), stair to stair
  s += patrol([[U.cx(3), U.cy(2)], [U.cx(12), U.cy(2)]], false);
  s += patrol([[G.cx(3), G.cy(3)], [G.cx(12), G.cy(3)]], false);
  s += token(U.cx(9), U.cy(2), "H");
  s += paw(U.cx(3), U.cy(1));
  // ground floor: the resident guard spider's web in the lobby's south-west corner, anchored to both walls
  { const x0 = G.X(1), y0 = G.Y(6), R = 78; let w = "";
    for (let k = 0; k <= 4; k++) { const a = -k * Math.PI / 8; w += `M${x0} ${y0}L${n(x0 + Math.cos(a) * R)} ${n(y0 + Math.sin(a) * R)}`; }
    for (const rr of [22, 40, 58, 76]) { let d = ""; for (let k = 0; k <= 4; k++) { const a = -k * Math.PI / 8; d += `${k ? "L" : "M"}${n(x0 + Math.cos(a) * rr)} ${n(y0 + Math.sin(a) * rr)}`; } w += d; }
    s += line(w, 1.6, C.plum, ` opacity=".85"`); }
  s += token(G.cx(2), G.cy(5), "G");
  // escape: case → the dumbwaiter (down) … ground: dumbwaiter → the lobby → out the book-return slot
  s += route([[U.X(6), U.cy(5)], [U.X(9) + 4, U.cy(4)]]);
  s += route([[G.X(10) + 6, G.cy(4) + 8], [G.cx(10), G.cy(5)], [G.cx(7), G.cy(5)], [G.cx(7), G.Y(6) + 26]]);
  // callouts
  s += entry(G.cx(7), G.Y(7) + 24, "A", "u");
  s += entry(G.X(16) + 24, G.cy(5), "B", "l");
  s += mark(G.cx(4), G.cy(5), "1");
  s += mark(U.cx(7), U.cy(2), "2");
  s += mark(U.cx(6), U.cy(4), "3");
  s += mark(U.cx(2), U.cy(4), "4", true);
  s += esc(U.cx(11), U.cy(4), "E1");
  s += esc(G.cx(9), G.cy(5), "E2");
  const H = oy1 + 7 * CS + M + 8;
  return svg(`0 0 ${16 * CS + 2 * M} ${H}`, "Heist 4 map: two 16 by 7 floors of a library. Ground floor: the book-return slot and staff-door entries, stacks, the circulation desk, the dumbwaiter, two stairwells and the guard spider's web. Second floor: reading tables, the librarian's walk, the cat, and the reference room with the locked glass case", s);
}

/* =================================================== Heist 5: restaurant === */
export function map_restaurant() {
  const rows = [
    "################",
    "VTTTT...h~~~wTT#",
    "#.......#wwwwwwg",
    "#.T..T..gw~~~ww#",
    "#.......#wwwwTT#",
    "#.T..T..####gp##",
    "#.......#......#",
    "#.T..T..##g##g##",
    "#.......#...#..#",
    "#.......#.T.#.T#",
    "#.......#...#..#",
    "################",
  ];
  const p = plan(rows, M, M, 10);
  const { X, Y, cx, cy } = p;
  let s = p.s;
  // stove (13–14,1): four burner rings, hot
  for (const [c, dy] of [[13, 0], [14, 0]]) { s += `<circle cx="${cx(c)}" cy="${cy(1) + dy}" r="13" fill="none" stroke="${C.oxB}" stroke-width="2.6"/><circle cx="${cx(c)}" cy="${cy(1) + dy}" r="6" fill="none" stroke="${C.oxB}" stroke-width="2"/>`; }
  // the new snap trap on the floor by the back door (14,3)
  { const x = X(14) + 9, y = Y(3) + 14;
    s += `<rect x="${x}" y="${y}" width="32" height="22" rx="2" fill="${C.edge}" stroke="${C.ink}" stroke-width="2"/>`;
    s += `<path d="M${x + 6} ${y + 4}v14M${x + 6} ${y + 11}h20" stroke="${C.oxB}" stroke-width="3" stroke-linecap="round"/><circle cx="${x + 24}" cy="${y + 11}" r="3" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.2"/>`; }
  // the rat, under the dishwasher (13–14,4)
  s += token(X(14), cy(4), "R");
  // the notebook on the office desk (10,9), inside the desk's outline
  s += glow(cx(10), cy(9), 22);
  s += `<rect x="${X(10) + 10}" y="${Y(9) + 9}" width="30" height="32" rx="2" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.2"/><path d="M${X(10) + 16} ${Y(9) + 9}v32" stroke="${C.ink}" stroke-width="1.6"/><path d="M${X(10) + 33} ${Y(9) + 9}v32" stroke="${C.ox}" stroke-width="2.4"/>`;
  // staff: A mopping, B stacking chairs; the sleeper on the break-room couch (14,9) is the unknown
  s += token(cx(6), cy(4), "H");
  s += token(cx(3), cy(9), "H");
  s += token(cx(14), cy(9), "H", true);
  // escape: desk → office door → corridor → kitchen door → past the trap → out under the back door
  s += route([[cx(10), cy(8)], [cx(10), cy(6)], [cx(12), cy(6)], [cx(12), cy(4)], [cx(13), cy(3) - 8], [cx(14) - 4, cy(2)], [X(15) + 2, cy(2)]]);
  // callouts
  s += entry(M - 24, cy(1), "A", "r");
  s += entry(X(16) + 24, cy(2), "B", "l");
  s += mark(cx(4), cy(6), "1");
  s += mark(cx(10), cy(2) + 2, "2");
  s += mark(cx(11), cy(4) + 2, "3");
  s += mark(cx(13), cy(8), "4", true);
  s += esc(cx(11), cy(6), "E1");
  s += esc(cx(13) + 4, cy(2) - 2, "E2");
  return svg(`0 0 ${16 * CS + 2 * M} ${12 * CS + 2 * M}`, "Heist 5 map: a 16 by 12 restaurant: the dining room and bar with the alley vent, the kitchen with the back door, stove, steel counters, dishwasher and snap trap, the corridor, the office with the notebook, and the break room", s);
}
