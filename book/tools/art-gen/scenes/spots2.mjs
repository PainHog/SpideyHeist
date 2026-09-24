// Spot illustrations 8-14: small self-contained vignettes that fill end-of-chapter gaps.
// Same set as spots.mjs: 600x450 (4:3), transparent background, soft parchment glow,
// inked ground with hatching, gold-rimmed charcoal spiders, contact shadows, no frame.
import { C, n, pts, rng, svg, hatch, stipple, spider, flatCookie, sparkle, shadow, line, pipsFor } from "./lib.mjs";

const V = (title, body) => svg("0 0 600 450", title, body);

// ---------- shared helpers (local to these spot pieces; they mirror spots.mjs) ----------

// Soft parchment glow behind a vignette, fading to the page.
function glow(P, cx = 300, cy = 235, rx = 290, ry = 205, col = C.parch, op = 1) {
  return `<defs><radialGradient id="${P}-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${col}" stop-opacity="${op}"/><stop offset=".62" stop-color="${col}" stop-opacity="${op * .7}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient></defs>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${P}-glow)"/>`;
}

// A mask that fades content out towards the left/right ends (x0..x1), and optionally the top.
function fadeMask(id, x0, x1, o = {}) {
  const { edge = .16, y0 = -50, y1 = 500, top = null, bottom = null } = o;
  let s = `<linearGradient id="${id}-lx" gradientUnits="userSpaceOnUse" x1="${x0}" y1="0" x2="${x1}" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${edge}" stop-color="#fff"/><stop offset="${1 - edge}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  let body = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="url(#${id}-lx)"/>`;
  if (top) {
    const [ta, tb] = top;
    s += `<linearGradient id="${id}-ly" gradientUnits="userSpaceOnUse" x1="0" y1="${ta}" x2="0" y2="${tb}"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`;
    body += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${tb - y0}" fill="url(#${id}-ly)"/>`;
  }
  if (bottom) {
    const [ba, bb] = bottom;
    s += `<linearGradient id="${id}-lb" gradientUnits="userSpaceOnUse" x1="0" y1="${ba}" x2="0" y2="${bb}"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000"/></linearGradient>`;
    body += `<rect x="${x0}" y="${ba}" width="${x1 - x0}" height="${y1 - ba}" fill="url(#${id}-lb)"/>`;
  }
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="${x0 - 5}" y="${y0}" width="${x1 - x0 + 10}" height="${y1 - y0}">${s}${body}</mask>`;
}
const faded = (id, x0, x1, content, o) => `<defs>${fadeMask(id, x0, x1, o)}</defs><g mask="url(#${id})">${content}</g>`;

// An inked floor line with hatching below, fading at both ends.
function floor(P, y, x0 = 40, x1 = 560, o = {}) {
  const { gap = 12, w = 2.6 } = o;
  let c = `<path d="M${x0} ${y}H${x1}" stroke="${C.ink}" stroke-width="${w}" stroke-linecap="round"/>`;
  let d = "";
  for (let xx = x0 + 10; xx < x1; xx += gap) d += `M${xx} ${y + 5}l-7 9`;
  c += `<path d="${d}" stroke="${C.ink}" stroke-width="1.3" opacity=".3"/>`;
  return faded(`${P}-fl`, x0, x1, c);
}

// A tabletop seen from slightly above: a lit top band (fading back into the page) over an inked front edge.
function tabletop(P, y, x0, x1, o = {}) {
  const { depth = 70, thick = 16, top = C.parch, edge = C.edge, grain = true, fadeTop = true } = o;
  let c = `<rect x="${x0}" y="${y - depth}" width="${x1 - x0}" height="${depth}" fill="${top}"/>`;
  if (grain) {
    const R = rng(depth * 7 + x0);
    let d = "";
    for (let i = 0; i < 7; i++) {
      const yy = y - depth * (.15 + .8 * R()), xs = x0 + (x1 - x0) * R() * .6, L = 60 + R() * 160;
      d += `M${n(xs)} ${n(yy)}q${n(L / 2)} ${n(-2 + R() * 4)} ${n(L)} 0`;
    }
    c += `<path d="${d}" stroke="${C.gold}" stroke-width="1.3" fill="none" opacity=".45" stroke-linecap="round"/>`;
  }
  c += `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${thick}" fill="${edge}"/>`;
  c += `<path d="M${x0} ${y}H${x1}M${x0} ${y + thick}H${x1}" stroke="${C.ink}" stroke-width="2.6"/>`;
  c += `<path d="M${x0} ${y + thick + 4}H${x1}" stroke="${C.ink}" stroke-width="7" opacity=".12"/>`;
  return faded(`${P}-tt`, x0, x1, c, fadeTop ? { top: [y - depth, y - depth * .45] } : {});
}

// A room corner seen from low down: wall fading up into the page, a skirting board,
// and a floor plane (boards receding) from the skirting down to the front line gy.
function room(P, o = {}) {
  const { x0 = 20, x1 = 580, sk = 196, skH = 40, gy = 380, wall = C.parch, boards = true, floorFill = C.edge, wallH = 120, extraWall = "" } = o;
  let c = `<rect x="${x0}" y="${sk - skH - wallH}" width="${x1 - x0}" height="${wallH}" fill="${wall}"/>${extraWall}`;
  c += `<rect x="${x0}" y="${sk}" width="${x1 - x0}" height="${gy - sk}" fill="${floorFill}" opacity=".55"/>`;
  if (boards) {
    let d = ""; let yy = sk, step = 10;
    while (yy < gy - 4) { yy += step; step *= 1.35; if (yy < gy - 4) d += `M${x0} ${n(yy)}H${x1}`; }
    c += `<path d="${d}" stroke="${C.ink}" stroke-width="1.2" opacity=".22"/>`;
  }
  c += `<rect x="${x0}" y="${sk - skH}" width="${x1 - x0}" height="${skH}" fill="${C.cream}"/>`;
  c += `<rect x="${x0}" y="${sk - skH}" width="${x1 - x0}" height="8" fill="${C.edge}"/>`;
  c += `<path d="M${x0} ${sk - skH}H${x1}M${x0} ${sk - skH + 8}H${x1}M${x0} ${sk}H${x1}" stroke="${C.ink}" stroke-width="2.2"/>`;
  c += `<path d="M${x0} ${sk + 3}H${x1}" stroke="${C.ink}" stroke-width="5" opacity=".12"/>`;
  return faded(`${P}-rm`, x0, x1, c, { top: [sk - skH - wallH, sk - skH - wallH * .25], edge: .14 });
}

// ---------- spiders ----------
const SA = [[9, -6], [12, -2], [13, 3], [10, 7]]; // leg attach points (right side) on the cephalothorax
// Charcoal spider with a gold rim so it separates from paper and dark objects (checklist #12).
const sp = o => spider({ rim: C.goldB, rimOp: .55, ...o });
// Leg overrides from WORLD foot (and optional knee) points, for a spider at x,y, scale s, rotated r degrees.
// Default knees rise up and out above the higher of attach/foot.
function legs(x, y, s, feet, knees = {}, r = 0) {
  const a0 = -r * Math.PI / 180, ca = Math.cos(a0), sa = Math.sin(a0);
  const L = p => { const dx = (p[0] - x) / s, dy = (p[1] - y) / s; return [dx * ca - dy * sa, dx * sa + dy * ca]; };
  const lo = {};
  for (const k of Object.keys(feet)) {
    const i = +k[1], m = k[0] === "R" ? 1 : -1;
    const a = [SA[i][0] * m, SA[i][1]];
    const f = L(feet[k]);
    let kn;
    if (knees[k]) kn = L(knees[k]);
    else {
      const H = [22, 20, 14, 9][i];
      kn = [a[0] + (f[0] - a[0]) * .62 + m * 4, Math.min(a[1], f[1]) - H];
    }
    lo[k] = [a, kn, f];
  }
  return lo;
}
// all eight feet on one ground line gy (spread as in the "stand" pose), with optional overrides
function standOn(x, gy, s, over = {}, knees = {}, lift = 26) {
  const y = gy - lift * s, sp4 = [17, 36, 54, 64], feet = {};
  for (let i = 0; i < 4; i++) { feet["R" + i] = [x + sp4[i] * s, gy]; feet["L" + i] = [x - sp4[i] * s, gy]; }
  Object.assign(feet, over);
  return { x, y, s, legOverride: legs(x, y, s, feet, knees) };
}
// A single spider leg in world coordinates (for tarsi that wrap round a prop, drawn over it).
const legPath = (d, s) => line(d, 4.4 * s, C.ink) + line(d, 2.2 * s, C.plum);

// Affine map of the unit square onto a parallelogram: origin o, u-edge a, v-edge b.
const mat = (o, a, b) => `matrix(${n(a[0])} ${n(a[1])} ${n(b[0])} ${n(b[1])} ${n(o[0])} ${n(o[1])})`;
const NS = ` vector-effect="non-scaling-stroke"`;
const add = (p, q, k = 1) => [p[0] + q[0] * k, p[1] + q[1] * k];

// sweat drop falling (point up, round bottom)
const drop = (x, y, r = 4) => `<path d="M${n(x)} ${n(y - r * 2.2)}q${n(r * 1.1)} ${n(r * 1.4)} ${n(r)} ${n(r * 2.2)}a${n(r)} ${n(r)} 0 0 1 ${n(-r * 2)} 0q${n(-r * .1)} ${n(-r * .8)} ${n(r)} ${n(-r * 2.2)}z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.4"/>`;

// A pencil lying flat on a surface from a (eraser end) to b (tip); w = width.
function pencil(a, b, w = 11) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), u = [dx / L, dy / L], p = [-u[1] * w / 2, u[0] * w / 2];
  const at = (t, k = 0) => [a[0] + u[0] * t + p[0] * k, a[1] + u[1] * t + p[1] * k];
  const e = w * 1.1, f = w * .7, cone = w * 1.8;
  let s = shadow(a[0] + dx / 2 + 3, a[1] + dy / 2 + w * .55, L / 2 + 4, w * .45, .25);
  s += `<path d="M${pts([at(0, -1), at(e, -1), at(e, 1), at(0, 1)])}z" fill="${C.edge}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
  s += `<path d="M${pts([at(e, -1), at(e + f, -1), at(e + f, 1), at(e, 1)])}z" fill="${C.soft}" stroke="${C.ink}" stroke-width="1.6"/>`;
  s += `<path d="M${pts([at(e + f, -1), at(L - cone, -1), at(L - cone, 1), at(e + f, 1)])}z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.6"/>`;
  s += line(`M${pts([at(e + f + 2, -.2), at(L - cone - 2, -.2)])}`, 1.2, C.goldB);
  s += `<path d="M${pts([at(L - cone, -1), b, at(L - cone, 1)])}z" fill="${C.parch}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
  s += `<path d="M${pts([at(L - cone * .42, -.45), b, at(L - cone * .42, .45)])}z" fill="${C.ink}"/>`;
  return s;
}

// A coin lying flat on a surface: x centre, y = contact (lowest point of the edge).
function flatCoin(x, y, r) {
  const ry = r * .34, t = Math.max(2, r * .14), cy = y - t - ry;
  return shadow(x + 2, y - ry * .4, r * 1.1, ry * .8, .28) +
    `<path d="M${n(x - r)} ${n(cy)}v${n(t)}a${n(r)} ${n(ry)} 0 0 0 ${n(2 * r)} 0v${n(-t)}z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.8"/>` +
    `<ellipse cx="${n(x)}" cy="${n(cy)}" rx="${n(r)}" ry="${n(ry)}" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.8"/>` +
    `<ellipse cx="${n(x)}" cy="${n(cy)}" rx="${n(r * .72)}" ry="${n(ry * .72)}" fill="none" stroke="${C.gold}" stroke-width="1.4"/>`;
}

// ================================================================
// 8. Dice push: a spider shoulders a six-sided die across the tabletop
// ================================================================
// A solid die resting on its bottom face. x = centre of the front face, yb = the front bottom edge
// (where it meets the surface); D = receding depth vector. Faces: front, top, right (a real die:
// opposite faces sum to 7, and 1-2-3 run anticlockwise round their shared corner).
function solidDie(x, yb, sz, D, f = { front: 5, top: 1, right: 4 }) {
  const h = sz / 2, FL = [x - h, yb - sz], FR = [x + h, yb - sz], BR = [x + h, yb];
  const pipR = .085, off = .25;
  const pipsIn = (v, rot = false) => pipsFor(v, off).map(([u, w]) => rot ? [-w, u] : [u, w])
    .map(([u, w]) => `<circle cx="${n(.5 + u)}" cy="${n(.5 + w)}" r="${pipR}"/>`).join("");
  let s = "";
  // top face (u along the front edge, v receding)
  const topPoly = [FL, FR, add(FR, D), add(FL, D)];
  s += `<path d="M${pts(topPoly)}z" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += `<g transform="${mat(add(FL, D), [sz, 0], [-D[0], -D[1]])}" fill="${C.ink}">${pipsIn(f.top)}</g>`;
  // right face (u receding, v down)
  const sidePoly = [FR, add(FR, D), add(BR, D), BR];
  s += `<path d="M${pts(sidePoly)}z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += `<g transform="${mat(FR, D, [0, sz])}" fill="${C.ink}">${pipsIn(f.right, true)}</g>`;
  s += hatch("sdp-sh", `<path d="M${pts(sidePoly)}z"/>`, FR[0], FR[1] + D[1], BR[0] + D[0], BR[1], 7, 60, C.ink, 1, .14);
  // front face
  s += `<rect x="${n(FL[0])}" y="${n(FL[1])}" width="${sz}" height="${sz}" rx="${n(sz * .06)}" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.8"/>`;
  s += pipsFor(f.front, sz * off).map(([u, w]) => `<circle cx="${n(x + u)}" cy="${n(yb - h + w)}" r="${n(sz * pipR)}" fill="${C.ink}"/>`).join("");
  s += pipsFor(f.front, sz * off).map(([u, w]) => `<circle cx="${n(x + u - sz * .025)}" cy="${n(yb - h + w - sz * .025)}" r="${n(sz * .025)}" fill="${C.soft}"/>`).join("");
  s += line(`M${n(FL[0] + sz * .1)} ${n(yb - sz * .14)}V${n(FL[1] + sz * .16)}`, sz * .045, "#fff", ` opacity=".7"`);
  return s;
}

export function spot_dice_push() {
  const P = "sdp";
  let s = glow(P, 300, 240, 295, 205);
  const TY = 386;
  s += tabletop(P, TY, 40, 560, { depth: 190, thick: 22, top: C.parch, edge: C.gold });
  // a score pad lying flat at the back left, with a pencil lying across it; its depth edge
  // recedes along the same vector as the die's top face (58,-44), so both share one table plane
  {
    const o = [44, 330], a = [98, -3], b = [50, -38];
    s += `<path d="M${pts([add(o, [4, 5]), add(add(o, a), [4, 5]), add(add(add(o, a), b), [4, 5]), add(add(o, b), [4, 5])])}z" fill="${C.ink}" opacity=".2"/>`;
    s += `<path d="M${pts([o, add(o, a), add(add(o, a), b), add(o, b)])}z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
    s += `<g transform="${mat(add(o, b), a, [-b[0], -b[1]])}">`;
    let d = "";
    for (let k = 0; k < 5; k++) { const v = .24 + k * .15; d += `M.08 ${n(v)}q.05 -.06 .1 0t.1 0 .1 0${k % 2 ? "" : " .1 0"}`; }
    s += `<path d="${d}" stroke="${C.soft}" stroke-width="1.4" fill="none"${NS}/>`;
    s += `<path d="M.06 .1H.94" stroke="${C.ink}" stroke-width="1.6"${NS}/><path d="M.7 .16V.94" stroke="${C.edge}" stroke-width="1.4"${NS}/>`;
    s += `<path d="M.76 .5l.04 .08l.08 -.2" stroke="${C.good}" stroke-width="2" fill="none"${NS}/></g>`;
    // the pencil lies wholly on the pad (both ends inside the pad outline), never overhanging
    s += pencil([72, 321], [164, 300], 10);
  }
  // the die, resting flat on the table, being shoved to the left
  const dx = 262, yb = 352, sz = 144, D = [58, -44];
  // scuffs where it has slid: faint drag marks on the tabletop behind the leading face
  s += line(`M${dx + 76} ${yb + 1}h72M${dx + 96} ${yb - 12}h58M${dx + 120} ${yb - 26}h40`, 1.6, C.ink, ` opacity=".25"`);
  // contact shadow under the whole base, pushed right/back by the lamp-light from the left
  s += `<path d="M${pts([[dx - sz / 2 - 6, yb + 4], [dx + sz / 2 + 10, yb + 4], [dx + sz / 2 + D[0] + 18, yb + D[1] + 2], [dx - sz / 2 + D[0], yb + D[1] + 2]])}z" fill="${C.ink}" opacity=".3"/>`;
  s += solidDie(dx, yb, sz, D, { front: 5, top: 1, right: 4 });
  // dust kicked up at the leading bottom edge
  const puff = (x, y, r) => `<path d="M${n(x - r)} ${n(y)}a${n(r * .6)} ${n(r * .6)} 0 0 1 ${n(r * .7)} ${n(-r * .6)}a${n(r * .7)} ${n(r * .7)} 0 0 1 ${n(r * 1.1)} ${n(-r * .1)}a${n(r * .55)} ${n(r * .55)} 0 0 1 ${n(r * .2)} ${n(r * .7)}z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.6"/>`;
  s += puff(dx - sz / 2 - 6, yb + 1, 13) + puff(dx - sz / 2 - 30, yb, 8);
  // the pusher: leaning hard into the right face, forelegs braced on it, back legs planted and driving
  {
    const sc = 1, r = 14, gy = yb + 2, x = dx + sz / 2 + 86, y = gy - 30;
    const onFace = (t, v) => [dx + sz / 2 + D[0] * t, yb - sz * v + D[1] * t]; // t depth, v height (0..1)
    const feet = {
      L0: onFace(.34, .5), L1: onFace(.56, .27),
      L2: [x - 48, gy], L3: [x - 24, gy + 1],
      R0: [x + 26, gy + 1], R1: [x + 56, gy], R2: [x + 86, gy], R3: [x + 114, gy],
    };
    const knees = {
      L0: [x - 36, y - 64], L1: [x - 26, y - 36], L2: [x - 44, y - 20], L3: [x - 26, y - 8],
      R0: [x + 20, y - 30], R1: [x + 44, y - 36], R2: [x + 76, y - 30], R3: [x + 106, y - 18],
    };
    s += shadow(x + 24, gy, 80, 6, .28);
    s += sp({ x, y, s: sc, r, legW: 1.2, legOverride: legs(x, y, sc, feet, knees, r), look: [-1, -.2], mouth: "flat", brow: "down", mark: "chevron" });
    // pressure marks where the forefeet meet the die, sweat dropping from the brow
    for (const f of [feet.L0, feet.L1]) s += line(`M${n(f[0] + 4)} ${n(f[1] - 12)}l6 -5M${n(f[0] + 4)} ${n(f[1] + 10)}l6 5`, 1.8, C.ink, ` opacity=".6"`);
    s += drop(x + 30, y + 6, 3.6) + drop(x + 40, y + 22, 2.8);
    s += line(`M${x + 44} ${y - 50}q8 -6 16 -2M${x + 64} ${y - 36}q8 -2 12 4`, 1.8, C.ink, ` opacity=".5"`);
  }
  // a coin lying flat at the front right: the stake
  s += flatCoin(500, 380, 16) + sparkle(518, 354, 6);
  return V("A spider leans into a die bigger than itself and shoves it across the table", `<g transform="translate(300 292) scale(1.1) translate(-300 -300)">${s}</g>`);
}

// ================================================================
// 9. Lookout on the sill: a spider with a spyglass at a night window
// ================================================================
export function spot_lookout_sill() {
  const P = "sls";
  let s = glow(P, 300, 225, 295, 215);
  // window geometry
  const WX0 = 124, WX1 = 424, WY0 = 72, WY1 = 300; // casing outer
  const GX0 = 146, GX1 = 402, GY0 = 94, GY1 = 292;  // glass
  const MX = (GX0 + GX1) / 2, RY = 190;              // centre stile / meeting rail
  // wall: plaster fading out at the ends and top
  {
    let w = `<rect x="20" y="10" width="560" height="420" fill="${C.parch}"/>`;
    w += stipple(41, 300, 210, 270, 190, 300, .9, C.ink, .12);
    s += faded(`${P}-wall`, 20, 580, w, { top: [10, 60], bottom: [360, 430], edge: .14 });
  }
  // night sky in the glass
  s += `<rect x="${GX0}" y="${GY0}" width="${GX1 - GX0}" height="${GY1 - GY0}" fill="${C.deep}"/>`;
  s += `<clipPath id="${P}-gl"><rect x="${GX0}" y="${GY0}" width="${GX1 - GX0}" height="${GY1 - GY0}"/></clipPath><g clip-path="url(#${P}-gl)">`;
  // moon (crescent) with a soft halo, stars
  const mx = 352, my = 134;
  s += `<circle cx="${mx}" cy="${my}" r="46" fill="${C.goldB}" opacity=".12"/><circle cx="${mx}" cy="${my}" r="30" fill="${C.goldB}" opacity=".14"/>`;
  s += `<path d="M${mx + 6} ${my - 22}a22 22 0 1 0 14 34a18 18 0 1 1 -14 -34z" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.8"/>`;
  for (const [x, y, r] of [[176, 118, 6], [228, 106, 4], [196, 160, 3.5], [300, 118, 5], [388, 196, 4], [252, 208, 3], [170, 214, 4.5], [318, 226, 3]]) s += sparkle(x, y, r, C.goldB, C.goldB);
  for (const [x, y] of [[214, 132], [270, 150], [392, 110], [336, 200], [160, 186], [288, 190]]) s += `<circle cx="${x}" cy="${y}" r="1.4" fill="${C.cream}" opacity=".8"/>`;
  // rooftops across the street, a couple of lit windows
  s += `<path d="M${GX0} 292V246l28 -18 28 18v-10h22v-14l30 -22 30 22v34h18v-24l36 -20 36 20v14h26l20 -16 20 16V292z" fill="${C.ink}"/>`;
  s += `<path d="M${GX0 + 20} 254h10v10h-10zM${GX0 + 100} 238h10v12h-10zM${GX0 + 190} 252h9v10h-9z" fill="${C.gold}"/>`;
  s += `<path d="M${GX0 + 124} 222v-12h8v6" fill="${C.ink}"/>`;
  s += `</g>`;
  // glass sheen
  s += line(`M${GX0 + 14} ${GY0 + 40}l30 -30M${GX0 + 14} ${GY0 + 60}l48 -48M${MX + 16} ${RY + 60}l40 -40`, 3, C.cream, ` opacity=".22"`);
  // sash frame: stiles, rails, meeting rail with a latch
  const fr = C.cream;
  s += `<path d="M${WX0} ${WY0}H${WX1}V${WY1}H${WX0}z M${GX0} ${GY0}V${RY - 5}H${MX - 5}V${GY0}z M${MX + 5} ${GY0}V${RY - 5}H${GX1}V${GY0}z M${GX0} ${RY + 5}V${GY1}H${MX - 5}V${RY + 5}z M${MX + 5} ${RY + 5}V${GY1}H${GX1}V${RY + 5}z" fill="${fr}" fill-rule="evenodd" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += `<rect x="${WX0 + 10}" y="${WY0 + 10}" width="${WX1 - WX0 - 20}" height="${WY1 - WY0 - 10}" fill="none" stroke="${C.edge}" stroke-width="2"/>`;
  s += line(`M${GX0} ${RY}H${GX1}`, 1.4, C.edge);
  s += `<path d="M${MX - 12} ${RY - 9}h24v7h-24z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.6"/><path d="M${MX - 2} ${RY - 9}q8 -8 16 -4" stroke="${C.ink}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  // curtain rod on two wall brackets
  const rodY = 44, bx = [102, 446];
  for (const x of bx) {
    s += `<rect x="${x - 8}" y="${rodY - 22}" width="16" height="22" rx="3" fill="${C.soft}" stroke="${C.ink}" stroke-width="2"/>`;
    s += `<circle cx="${x}" cy="${rodY - 16}" r="1.8" fill="${C.edge}"/><circle cx="${x}" cy="${rodY - 7}" r="1.8" fill="${C.edge}"/>`;
    s += `<path d="M${x - 7} ${rodY - 2}v6q7 8 14 0v-6" fill="none" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  }
  s += line(`M84 ${rodY + 1}H464`, 8, C.ink) + line(`M84 ${rodY + 1}H464`, 4, C.gold);
  s += `<circle cx="80" cy="${rodY + 1}" r="7" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/><circle cx="468" cy="${rodY + 1}" r="7" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/>`;
  // the curtain: hung from rings on the rod, drawn back to the left, hem just clearing the sill
  {
    const x0 = 94, x1 = 196, top = rodY + 8, hem = 296;
    const folds = 5, fw = (x1 - x0) / folds;
    let edgeTop = `M${x0} ${top}`, hemPath = "";
    for (let i = 0; i < folds; i++) hemPath += `q${n(fw / 2)} ${i % 2 ? -8 : 8} ${n(fw)} 0`;
    let body = `M${x0} ${top}H${x1}Q${x1 - 6} ${(top + hem) / 2} ${x1 + 2} ${hem}` + `H${x0}z`;
    body = `M${x0} ${top}H${x1}Q${x1 - 8} ${(top + hem) / 2} ${x1 + 4} ${hem}` + `L${x0} ${hem}z`;
    s += `<path d="M${x0} ${top}H${x1}Q${x1 - 8} ${(top + hem) / 2} ${x1 + 4} ${hem}${"" }` + `" fill="none"/>`;
    let hemD = `M${x1 + 4} ${hem}`; for (let i = 0; i < folds; i++) hemD += `q${n(-fw / 2 - .8)} ${i % 2 ? -8 : 8} ${n(-fw - .8)} 0`;
    s += `<path d="M${x0} ${top}H${x1}Q${x1 - 8} ${(top + hem) / 2} ${x1 + 4} ${hem}${hemD.replace(/^M[^q]+/, "")}z" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
    let f = "";
    for (let i = 1; i < folds; i++) { const xx = x0 + i * fw; f += `M${n(xx)} ${top + 4}Q${n(xx - 3)} ${(top + hem) / 2} ${n(xx + i * .8)} ${hem - 4}`; }
    s += line(f, 2, C.ink, ` opacity=".55"`);
    let hl = "";
    for (let i = 0; i < folds; i++) { const xx = x0 + i * fw + fw * .45; hl += `M${n(xx)} ${top + 10}Q${n(xx - 2)} ${(top + hem) / 2} ${n(xx + i * .8)} ${hem - 14}`; }
    s += line(hl, 4, C.soft, ` opacity=".8"`);
    // rings round the rod
    for (let i = 0; i <= folds; i++) { const xx = x0 + 4 + i * (x1 - x0 - 8) / folds; s += `<ellipse cx="${n(xx)}" cy="${rodY + 1}" rx="4" ry="8" fill="none" stroke="${C.ink}" stroke-width="2.4"/><ellipse cx="${n(xx)}" cy="${rodY + 1}" rx="4" ry="8" fill="none" stroke="${C.gold}" stroke-width="1"/>`; }
  }
  // the sill: top surface, bullnose front edge, apron below
  const SY0 = 300, SY1 = 330, SX0 = 96, SX1 = 454;
  s += `<path d="M${WX0} ${SY0}H${WX1}L${SX1} ${SY1}H${SX0}z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<path d="M${WX0 + 22} ${SY0 + 1}H${WX1 - 22}L${WX1 - 70} ${SY1 - 2}H${WX0 + 70}z" fill="${C.goldB}" opacity=".18"/>`;
  s += `<rect x="${SX0}" y="${SY1}" width="${SX1 - SX0}" height="14" rx="5" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += `<path d="M${SX0 + 16} ${SY1 + 14}v18h${SX1 - SX0 - 32}v-18" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.2"/>`;
  s += line(`M${SX0 + 18} ${SY1 + 20}H${SX1 - 18}`, 5, C.ink, ` opacity=".12"`);
  // a little cactus in a pot on the sill, right
  {
    const x = 408, y = 320;
    s += shadow(x + 4, y, 26, 4, .28);
    s += `<path d="M${x - 14} ${y - 50}v-10q0 -18 14 -18t14 18v10z" fill="${C.good}" stroke="${C.ink}" stroke-width="2.2"/>`;
    s += `<path d="M${x + 12} ${y - 56}h4q6 0 6 -6v-8q0 -4 -4 -4t-4 4v6h-2" fill="${C.good}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
    s += line(`M${x - 5} ${y - 70}v12M${x + 4} ${y - 72}v14`, 1.4, C.cream, ` opacity=".6"`);
    s += `<path d="M${x - 18} ${y - 50}h36l-5 50h-26z" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += `<rect x="${x - 21}" y="${y - 56}" width="42" height="10" rx="2" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += line(`M${x - 11} ${y - 40}l3 34`, 3, C.goldB, ` opacity=".6"`);
  }
  // the lookout: standing on the sill, spyglass to its right eye, trained up at the moon
  {
    const x = 258, gy = 323, sc = 1.1, y = gy - 26 * sc, k = sc / .92;
    // spyglass: eyepiece against the rim of the right eye, three telescoping brass tubes, aimed at the moon
    const ex = x + 5.6 * sc + 3.2, ey = y - .2 * sc - 4;
    const deg = -58, ang = deg * Math.PI / 180, u = [Math.cos(ang), Math.sin(ang)], p = [-u[1], u[0]];
    const at = t => add([ex, ey], u, t * k);
    const T1 = add(at(68), p, 8 * k), T2 = add(at(38), p, 6.5 * k); // where the forefeet grip (tube's right flank)
    const st = standOn(x, gy, sc, { R0: T1, R1: T2 }, { R0: [x + 56, y - 78], R1: [x + 50, y - 38] });
    // the left eye screwed shut, as you do at an eyepiece
    const wink = `<circle cx="-5.6" cy="-.2" r="5.1" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.3"/><path d="M-10.7 -.2a5.1 5.1 0 0 1 10.2 0q-5.1 3.4 -10.2 0z" fill="${C.plum}" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/>`;
    s += shadow(x, gy, 58, 5, .28);
    s += sp({ ...st, look: [.6, -1], mouth: "smirk", brow: "down", mark: "dots", over: wink, rimOp: .9 });
    const seg = (t0, t1, r0, fill) => { const A = at(t0), B = at(t1); r0 *= k; return `<path d="M${pts([add(A, p, r0), add(B, p, r0), add(B, p, -r0), add(A, p, -r0)])}z" fill="${fill}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`; };
    const ring = (t, r0) => { const A = at(t); r0 *= k; return line(`M${pts([add(A, p, r0 + 1), add(A, p, -r0 - 1)])}`, 4.5, C.ink) + line(`M${pts([add(A, p, r0), add(A, p, -r0)])}`, 2.4, C.soft); };
    s += seg(0, 24, 4, C.gold) + seg(22, 50, 5.5, C.goldB) + seg(48, 84, 7.5, C.gold);
    s += ring(1, 4.2) + ring(24, 4.2) + ring(50, 5.6) + ring(84, 7.6);
    const O = at(86);
    s += `<ellipse cx="${n(O[0])}" cy="${n(O[1])}" rx="${n(3.2 * k)}" ry="${n(7.6 * k)}" transform="rotate(${deg} ${n(O[0])} ${n(O[1])})" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.6"/>`;
    s += line(`M${pts([add(at(54), p, -3.5), add(at(80), p, -5)])}`, 1.6, C.cream, ` opacity=".8"`);
    // forefeet curled round the tube
    const curl = (T, r0) => { const a = add(T, p, 0), b = add(at(0), p, 0); const tipIn = add(add(T, p, -r0 * 1.7), u, -2); return legPath(`M${n(T[0])} ${n(T[1])}Q${n(T[0] + p[0] * -r0 * .4 + u[0] * 6)} ${n(T[1] + p[1] * -r0 * .4 + u[1] * 6)} ${n(tipIn[0])} ${n(tipIn[1])}`, sc); };
    s += curl(T1, 7.5 * k) + curl(T2, 5.5 * k);
  }
  return V("A lookout spider on a night-time window sill peers at the moon through a tiny spyglass", `<g transform="translate(0 34)">${s}</g>`);
}

// ================================================================
// 10. Dust bunny: a spider in a dust-bunny disguise shuffles along the skirting board
// ================================================================
// A fluffy ball of dust: centre cx,cy, radii rx,ry; wisps round the edge and fibres inside.
function fluff(seed, cx, cy, rx, ry, o = {}) {
  const { fill = C.cream, fibre = C.soft, ears = false, flatBottom = false } = o;
  const R = rng(seed), N = Math.max(12, Math.round((rx + ry) / 5)), P = [], Q = [];
  const flat = y => flatBottom && y > cy + ry * .8 ? cy + ry * .8 + (y - cy - ry * .8) * .2 : y;
  for (let i = 0; i < N; i++) {
    const a = (i + R() * .3) / N * Math.PI * 2, j = .94 + R() * .08;
    P.push([cx + Math.cos(a) * rx * j, flat(cy + Math.sin(a) * ry * j)]);
    const a2 = (i + .5) / N * Math.PI * 2, j2 = 1.1 + R() * .1;
    Q.push([cx + Math.cos(a2) * rx * j2, flat(cy + Math.sin(a2) * ry * j2)]);
  }
  let d = `M${n(P[0][0])} ${n(P[0][1])}`;
  for (let i = 0; i < N; i++) { const q = Q[i], p = P[(i + 1) % N]; d += `Q${n(q[0])} ${n(q[1])} ${n(p[0])} ${n(p[1])}`; }
  let s = "";
  if (ears) {
    // two floppy fluff tufts on top: it is a dust *bunny*
    for (const [dx, lean] of [[-rx * .3, -14], [rx * .16, 10]]) {
      const bx = cx + dx, by = cy - ry * .78;
      s += `<path d="M${n(bx - 10)} ${n(by + 8)}q${n(lean - 8)} -40 ${n(lean + 1)} -60q14 4 ${n(-lean * .3 + 9)} 60z" fill="${fill}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
      s += line(`M${n(bx - 2)} ${n(by)}q${n(lean * .5)} -24 ${n(lean + 1)} -48`, 1.3, fibre, ` opacity=".7"`);
    }
  }
  s += `<path d="${d}z" fill="${fill}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
  s += stipple(seed + 3, cx, cy + ry * .1, rx * .85, ry * .8, Math.round(rx * ry / 18), 1, C.soft, .22);
  // stray wisps curling off the edge
  let w = "";
  for (let i = 0; i < N; i++) {
    if (R() < .45) continue;
    const q = Q[i], a = Math.atan2((q[1] - cy) / ry, (q[0] - cx) / rx), L = 5 + R() * 7;
    if (flatBottom && q[1] > cy + ry * .6) continue;
    const t = [q[0] + Math.cos(a) * L, q[1] + Math.sin(a) * L];
    w += `M${n(q[0] - Math.cos(a) * 2)} ${n(q[1] - Math.sin(a) * 2)}Q${n(t[0] + Math.sin(a) * 5)} ${n(t[1] - Math.cos(a) * 5)} ${n(t[0])} ${n(t[1])}q${n(-Math.sin(a) * 3)} ${n(Math.cos(a) * 3)} ${n(-Math.cos(a) * 3)} ${n(-Math.sin(a) * 3)}`;
  }
  s += line(w, 1.3, C.ink, ` opacity=".75"`);
  // inner fibres: loose curls
  let f = "";
  for (let i = 0; i < Math.round(rx * ry / 110) + 4; i++) {
    const t = R() * Math.PI * 2, u = Math.sqrt(R()) * .78, x = cx + Math.cos(t) * rx * u, y = cy + Math.sin(t) * ry * u, L = 7 + R() * 10;
    f += `M${n(x)} ${n(y)}q${n(L * .5)} ${n(-5 + R() * 3)} ${n(L)} ${n(-1 + R() * 4)}q${n(3)} ${n(2)} ${n(1)} ${n(5)}`;
  }
  s += line(f, 1.3, fibre, ` opacity=".5"`);
  s += `<ellipse cx="${n(cx - rx * .3)}" cy="${n(cy - ry * .42)}" rx="${n(rx * .32)}" ry="${n(ry * .18)}" fill="#fff" opacity=".45"/>`;
  return s;
}

export function spot_dust_bunny() {
  const P = "sdb";
  let s = glow(P, 300, 235, 295, 205);
  const SK = 252, GY = 404;
  s += room(P, { sk: SK, skH: 44, gy: GY, wallH: 140 });
  s += floor(P, GY, 24, 576);
  // a wall socket above the skirting, and a plug's lead running down behind the skirting top
  {
    const x = 468, y = 150;
    s += `<rect x="${x - 26}" y="${y - 26}" width="52" height="52" rx="6" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += `<rect x="${x - 20}" y="${y - 20}" width="40" height="40" rx="4" fill="none" stroke="${C.edge}" stroke-width="1.6"/>`;
    s += `<path d="M${x - 9} ${y - 8}v8M${x + 9} ${y - 8}v8" stroke="${C.ink}" stroke-width="3.4" stroke-linecap="round"/><circle cx="${x}" cy="${y + 9}" r="2.6" fill="${C.ink}"/>`;
    s += `<circle cx="${x}" cy="${y - 19}" r="1.6" fill="${C.soft}"/><circle cx="${x}" cy="${y + 19}" r="1.6" fill="${C.soft}"/>`;
  }
  // real dust bunnies lying against the skirting ahead: the disguise fits right in
  s += shadow(452, SK + 20, 30, 4, .22) + fluff(7, 450, SK + 8, 26, 15, { flatBottom: true });
  s += shadow(520, SK + 16, 18, 3, .2) + fluff(9, 518, SK + 8, 15, 10, { flatBottom: true });
  // a lost button lying flat on the boards, and a hairpin
  {
    const x = 176, y = 384;
    s += shadow(x + 2, y - 3, 22, 5, .25);
    s += `<path d="M${x - 20} ${y - 9}v4a20 7 0 0 0 40 0v-4z" fill="${C.ox}" stroke="${C.ink}" stroke-width="1.8"/>`.replace(C.ox, C.plum);
    s += `<ellipse cx="${x}" cy="${y - 9}" rx="20" ry="7" fill="${C.soft}" stroke="${C.ink}" stroke-width="1.8"/>`;
    s += `<ellipse cx="${x}" cy="${y - 9}" rx="14" ry="4.6" fill="none" stroke="${C.plum}" stroke-width="1.4"/>`;
    for (const [dx, dy] of [[-4, -1.4], [4, -1.4], [-4, 1.4], [4, 1.4]]) s += `<ellipse cx="${x + dx}" cy="${y - 9 + dy}" rx="1.8" ry="1" fill="${C.ink}"/>`;
    s += shadow(92, GY - 10, 36, 3, .22) + line(`M58 ${GY - 14}l62 -6q6 0 6 4t-6 4l-60 4`, 2.2, C.plum);
    // the prize ahead: half a cookie someone dropped
    s += flatCookie(500, 382, 28, 9, true);
  }
  // the disguised spider, mid-shuffle to the right
  const cx = 292, gy = 330, rx = 80, ry = 52, cy = gy - ry * .8 - 7;
  // track of scuffed dust behind it, and shuffle lines
  s += line(`M40 ${gy - 2}q14 -4 28 0t28 0 28 0 28 0`, 2, C.soft, ` opacity=".45"`);
  s += line(`M110 ${gy - 50}h-40M118 ${gy - 30}h-56M104 ${gy - 70}h-24`, 3, C.ink, ` opacity=".5"`);
  s += shadow(cx + 6, gy, rx * 1.6, 8, .28);
  // eight legs poke out under the fluff: 4 a side, knees up at the flanks, feet planted in step
  {
    const H = [[.9, -.1], [.92, .2], [.86, .46], [.72, .66]], K = [[1.08, -.66], [1.24, -.34], [1.38, -.04], [1.48, .28]], F = [1.12, 1.3, 1.48, 1.64];
    const footY = { R: [gy - 3, gy, gy - 2, gy + 2], L: [gy, gy - 3, gy + 1, gy - 1] };
    let d = "";
    for (const m of [1, -1]) for (let i = 0; i < 4; i++) {
      const h = [cx + m * rx * H[i][0], cy + ry * H[i][1]], k = [cx + m * rx * K[i][0], cy + ry * K[i][1]], f = [cx + m * rx * F[i], footY[m > 0 ? "R" : "L"][i]];
      const mid = [k[0] + (f[0] - k[0]) * .55 + m * 3, k[1] + (f[1] - k[1]) * .55];
      d += `M${n(h[0] - m * 16)} ${n(h[1])}L${n(k[0])} ${n(k[1])}L${n(mid[0])} ${n(mid[1])}L${n(f[0])} ${n(f[1])}`;
    }
    s += line(d, 4.4 * 1.2 + 5, C.goldB, ` opacity=".5"`) + line(d, 4.4 * 1.2, C.ink) + line(d, 2.2 * 1.2, C.plum);
  }
  s += fluff(12, cx, cy, rx, ry, { ears: true, flatBottom: true });
  // a peep-hole in the fluff: two wary eyes looking the way it is going
  {
    const ex = cx + 18, ey = cy + 4;
    s += `<ellipse cx="${ex}" cy="${ey}" rx="22" ry="12" fill="${C.deep}" stroke="${C.ink}" stroke-width="1.8"/>`;
    for (const dx of [-8, 8]) {
      s += `<circle cx="${ex + dx}" cy="${ey}" r="6.4" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.3"/><circle cx="${ex + dx + 2.4}" cy="${ey + .4}" r="3.6" fill="${C.ink}"/><circle cx="${ex + dx + 3.4}" cy="${ey - 1}" r="1.3" fill="${C.goldB}"/>`;
    }
    s += line(`M${ex - 20} ${ey - 9}q10 -6 20 -3M${ex + 20} ${ey - 9}q-10 -6 -20 -3`, 1.6, C.soft, ` opacity=".8"`);
  }
  return V("A spider disguised as a dust bunny shuffles along the skirting board", s);
}

// ================================================================
// 11. Alarm freeze: a spider frozen mid-step under a flashing wall beacon
// ================================================================
// The same spider drawn flat in ink, for a cast shadow (colours all to ink).
const inkOnly = svgStr => svgStr.replace(/#[0-9a-fA-F]{6}/g, C.ink);

export function spot_alarm_freeze() {
  const P = "saf";
  let s = glow(P, 300, 235, 295, 210);
  const SK = 282, GY = 412;
  s += room(P, { sk: SK, skH: 44, gy: GY, wallH: 200 });
  s += floor(P, GY, 24, 576);
  // the beacon: a red dome on a base, standing on a wall bracket (plate screwed to the wall, arm out)
  const Lx = 176, Ly = 150; // centre of the dome
  // red wash and rays thrown by the lamp
  s += `<defs><radialGradient id="${P}-red" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${C.oxB}" stop-opacity=".42"/><stop offset=".5" stop-color="${C.oxB}" stop-opacity=".14"/><stop offset="1" stop-color="${C.oxB}" stop-opacity="0"/></radialGradient></defs>`;
  s += `<ellipse cx="${Lx}" cy="${Ly + 10}" rx="170" ry="150" fill="url(#${P}-red)"/>`;
  {
    let d = "";
    for (const a0 of [-160, -120, -80, -40, 0, 30, 58, 84]) {
      const a = a0 * Math.PI / 180, w = .09, R0 = 34, R1 = 230;
      const p = (ang, r) => [Lx + Math.cos(ang) * r, Ly + Math.sin(ang) * r];
      d += `M${pts([p(a - w * .4, R0), p(a - w, R1), p(a + w, R1), p(a + w * .4, R0)])}z`;
    }
    s += `<defs><radialGradient id="${P}-rg" gradientUnits="userSpaceOnUse" cx="${Lx}" cy="${Ly}" r="140"><stop offset=".25" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
      `<mask id="${P}-rm2" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="450"><rect x="0" y="0" width="600" height="450" fill="url(#${P}-rg)"/></mask></defs>`;
    s += `<g mask="url(#${P}-rm2)"><path d="${d}" fill="${C.oxB}" opacity=".2"/></g>`;
    let f = "";
    for (const a0 of [-150, -110, -70, -30, 10]) { const a = a0 * Math.PI / 180; f += `M${n(Lx + Math.cos(a) * 36)} ${n(Ly + Math.sin(a) * 36)}L${n(Lx + Math.cos(a) * 54)} ${n(Ly + Math.sin(a) * 54)}`; }
    s += line(f, 4, C.oxB) ;
  }
  // bracket: a plate screwed to the wall, its arm out under the lamp's base (shadow on the wall below)
  s += `<path d="M${Lx - 20} ${Ly + 26}h40l6 10h-52z" fill="${C.ink}" opacity=".18"/>`;
  s += `<rect x="${Lx - 20}" y="${Ly + 14}" width="40" height="44" rx="3" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.2"/>`;
  s += `<circle cx="${Lx}" cy="${Ly + 36}" r="2.6" fill="${C.edge}" stroke="${C.ink}" stroke-width="1"/><circle cx="${Lx}" cy="${Ly + 50}" r="2.6" fill="${C.edge}" stroke="${C.ink}" stroke-width="1"/>`;
  s += `<path d="M${Lx - 34} ${Ly + 26}h68l-6 -8h-56z" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
  // its cable: out of the base, clipped down the wall, into the skirting
  {
    const d = `M${Lx + 26} ${Ly + 14}q14 0 14 16V${SK - 44}`;
    s += line(d, 5, C.ink) + line(d, 2, C.plum);
    for (const yy of [Ly + 52, Ly + 78]) s += `<path d="M${Lx + 34} ${yy}h12" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/><path d="M${Lx + 34} ${yy}h12" stroke="${C.cream}" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  // lamp base and dome with a wire guard
  s += `<path d="M${Lx - 26} ${Ly + 18}v-10h52v10z" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += `<path d="M${Lx - 22} ${Ly + 8}v-12a22 26 0 0 1 44 0v12z" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<path d="M${Lx - 12} ${Ly - 4}q0 -14 10 -18" stroke="${C.cream}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>`;
  s += `<ellipse cx="${Lx}" cy="${Ly - 2}" rx="12" ry="10" fill="${C.goldB}" opacity=".45"/>`;
  s += line(`M${Lx} ${Ly - 30}V${Ly + 8}M${Lx - 22} ${Ly - 2}h44M${Lx - 14} ${Ly - 22}q-4 16 -4 30M${Lx + 14} ${Ly - 22}q4 16 4 30`, 1.8, C.ink);
  s += `<circle cx="${Lx}" cy="${Ly - 32}" r="3" fill="${C.plum}" stroke="${C.ink}" stroke-width="1.4"/>`;
  // the motion sensor that caught it: a little box screwed high on the wall, its sweep marked in dashes
  {
    const x = 486, y = 128;
    s += line(`M${x - 8} ${y + 20}L${318 - 70} ${370}M${x} ${y + 22}L${318 + 70} 372`, 1.6, C.ink, ` opacity=".35" stroke-dasharray="6 6"`);
    s += `<path d="M${x - 22} ${y - 14}h44v22q-22 16 -44 0z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
    s += `<path d="M${x - 14} ${y + 10}q14 18 28 0z" fill="${C.deep}" stroke="${C.ink}" stroke-width="2"/>`;
    s += `<circle cx="${x + 5}" cy="${y + 14}" r="2" fill="${C.oxB}"/>`;
    s += `<circle cx="${x - 14}" cy="${y - 6}" r="1.8" fill="${C.soft}"/><circle cx="${x + 14}" cy="${y - 6}" r="1.8" fill="${C.soft}"/>`;
  }
  // the prize they were heading for: a cookie on the floor, far left
  s += flatCookie(96, 388, 30, 6, true);
  // the spider, frozen with one leg in the air
  {
    const x = 318, gy = 374, sc = 1.2;
    const st = standOn(x, gy, sc, { L1: [x - 88 * sc, gy - 44] }, { L1: [x - 56 * sc, gy - 104] });
    const body = { ...st, look: [-.8, -1], mouth: "o", brow: "up", mark: "chevron" };
    // its shadow, thrown along the floor away from the lamp (down and to the right)
    const c = -.9, d = -.34;
    s += `<g transform="matrix(1 0 ${c} ${d} ${n(-c * gy)} ${n(gy * (1 - d))})" opacity=".22">${inkOnly(spider({ ...body, rim: null }))}</g>`;
    s += sp({ ...body, rim: C.oxB, rimOp: .5 });
    // shock lines
    s += line(`M${x - 64} ${gy - 86}l-10 -10M${x - 30} ${gy - 106}l-4 -14M${x + 12} ${gy - 110}l2 -14M${x + 52} ${gy - 98}l8 -10`, 2.4, C.ink, ` opacity=".7"`);
    s += drop(x + 70, gy - 60, 3.4) + line(`M${x - 118} ${gy - 30}l-8 4M${x - 116} ${gy - 16}l-10 0`, 2, C.ink, ` opacity=".55"`);
  }
  return V("A spider freezes mid-step under a flashing red alarm beacon", s);
}

// ================================================================
// 12. Debrief: three spiders toast with thimbles round a pile of cookie crumbs
// ================================================================
// One cookie crumb: an irregular baked chunk, with a lit facet and maybe a chocolate chip.
function crumb(R, x, y, r) {
  const k = 5 + Math.floor(R() * 3), P = [];
  for (let i = 0; i < k; i++) { const a = (i + R() * .5) / k * Math.PI * 2; const rr = r * (.75 + R() * .4); P.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * .8]); }
  let s = `<path d="M${pts(P)}z" fill="${C.gold}" stroke="${C.ink}" stroke-width="${n(Math.max(1.1, r * .12))}" stroke-linejoin="round"/>`;
  s += `<path d="M${pts([P[k - 1], P[0], [x, y]])}z" fill="${C.goldB}" opacity=".55"/>`;
  if (R() < .35) s += `<ellipse cx="${n(x + r * .2)}" cy="${n(y + r * .15)}" rx="${n(r * .28)}" ry="${n(r * .2)}" fill="${C.deep}"/>`;
  return s;
}
// A thimble used as a cup: domed base, dimpled sides, open rim on top with something golden in it.
// x = centre, yb = bottom of the dome. Returns [svg, rimY].
function thimbleCup(x, yb, w = 26, h = 30) {
  const top = yb - h, rx = w / 2, bw = w * .42;
  let s = `<path d="M${n(x - rx)} ${n(top)}L${n(x - bw)} ${n(yb - 6)}Q${n(x)} ${n(yb + 4)} ${n(x + bw)} ${n(yb - 6)}L${n(x + rx)} ${n(top)}z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
  let d = "";
  for (let r = 0; r < 4; r++) for (let c = -2; c <= 2; c++) {
    const yy = top + 7 + r * 5.6, ww = rx - (rx - bw) * (yy - top) / (h - 6);
    const xx = x + c * ww * .36 + (r % 2 ? ww * .18 : 0);
    if (Math.abs(xx - x) < ww - 3) d += `M${n(xx)} ${n(yy)}h.01`;
  }
  s += `<path d="${d}" stroke="${C.soft}" stroke-width="2.2" stroke-linecap="round"/>`;
  s += `<path d="M${n(x - rx + 4)} ${n(top + 5)}L${n(x - bw + 3)} ${n(yb - 8)}" stroke="${C.cream}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`;
  s += `<ellipse cx="${n(x)}" cy="${n(top)}" rx="${n(rx + 1.5)}" ry="${n(w * .17)}" fill="${C.soft}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<ellipse cx="${n(x)}" cy="${n(top + .6)}" rx="${n(rx - 2)}" ry="${n(w * .12)}" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1"/>`;
  return [s, top];
}

export function spot_debrief() {
  const P = "sde";
  let s = glow(P, 300, 235, 295, 210);
  const TY = 396;
  s += tabletop(P, TY, 40, 560, { depth: 210, thick: 22, top: C.parch, edge: C.gold });
  const R = rng(21);
  // a bitten cookie at the back: what is left of the score
  s += flatCookie(470, 262, 40, 4, true);
  // a candle stub in a bottle cap, lighting the party (back left)
  {
    const cx = 120, cyB = 262;
    s += `<ellipse cx="${cx}" cy="${cyB - 44}" rx="60" ry="54" fill="${C.goldB}" opacity=".2"/>`;
    s += shadow(cx + 4, cyB, 24, 4, .3);
    s += `<path d="M${cx - 18} ${cyB - 9}v7q18 6 36 0v-7" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/>`;
    s += `<ellipse cx="${cx}" cy="${cyB - 9}" rx="18" ry="5" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2"/>`;
    s += `<path d="M${cx - 6} ${cyB - 9}V${cyB - 38}q6 -2.4 12 0V${cyB - 9}z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.8"/>`;
    s += `<path d="M${cx} ${cyB - 39}v-4" stroke="${C.ink}" stroke-width="1.5"/>`;
    s += `<path d="M${cx} ${cyB - 62}q7 9 4 15q-4 4 -8 0q-3 -6 4 -15z" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.5"/>`;
  }
  // the crumb pile: back (upper) crumbs first, front crumbs last
  const px = 300, pb = 350, pw = 96, ph = 70;
  s += shadow(px + 6, pb - 2, pw + 16, 12, .3);
  const rows = 7; let pile = "";
  for (let rI = rows - 1; rI >= 0; rI--) {
    const t = rI / (rows - 1), yy = pb - 8 - t * ph, half = pw * (1 - t * .82);
    const cnt = Math.max(1, Math.round(half / 11));
    for (let c = 0; c < cnt; c++) {
      const xx = px - half + (2 * half) * (cnt === 1 ? .5 : c / (cnt - 1)) + (R() - .5) * 8;
      pile += crumb(R, xx, yy + (R() - .5) * 4, 9 + R() * 5);
    }
  }
  s += pile;
  // scattered crumbs lying on the table
  for (const [x, y, r] of [[196, 372, 5], [228, 380, 4], [398, 376, 5], [420, 384, 3.5], [360, 384, 4], [250, 360, 3.5]]) s += shadow(x + 1, y + r * .6, r * 1.2, r * .4, .25) + crumb(R, x, y, r);
  // spider helper: a thimble held up in a foreleg, second leg steadying its base
  const toast = (o, cup, side) => {
    const m = side === "R" ? 1 : -1, [tx, tb] = cup;
    const [cs, top] = thimbleCup(tx, tb);
    const grip = [tx - m * 12, tb - 16], under = [tx - m * 2, tb - 2];
    const st = standOn(o.x, o.gy, o.s, { [side + "0"]: grip, [side + "1"]: under, ...(o.feet || {}) }, { [side + "0"]: o.k0, [side + "1"]: o.k1, ...(o.knees || {}) });
    let out = shadow(o.x + 2, o.gy, 62 * o.s, 5, .28) + sp({ ...st, ...o.face }) + cs;
    out += legPath(`M${n(grip[0])} ${n(grip[1] + 4)}q${n(m * 6)} -2 ${n(m * 9)} -9`, o.s);
    return [out, top];
  };
  // left crewmate on the table, toasting to the right
  {
    const x = 160, gy = 376, sc = .95;
    const [o] = toast({ x, gy, s: sc, k0: [x + 18, gy - 100], k1: [x + 52, gy - 50], face: { look: [1, -.6], mouth: "big", brow: "up", mark: "chevron" } }, [x + 40, gy - 76], "R");
    s += o;
  }
  // right crewmate on the table, toasting to the left
  {
    const x = 440, gy = 378, sc = .95;
    const [o] = toast({ x, gy, s: sc, k0: [x - 18, gy - 100], k1: [x - 52, gy - 50], face: { look: [-1, -.6], mouth: "grin", brow: "up", mark: "dots" } }, [x - 40, gy - 76], "L");
    s += o;
  }
  // the third, standing on top of the pile, thimble raised high
  {
    const x = 300, gy = pb - ph - 10, sc = .82;
    const feet = { L0: [x - 16, gy + 2], L1: [x - 34, gy + 6], L2: [x - 48, gy + 16], L3: [x - 58, gy + 28], R2: [x + 46, gy + 16], R3: [x + 58, gy + 28] };
    const [o] = toast({ x, gy, s: sc, feet, k0: [x + 20, gy - 88], k1: [x + 52, gy - 50], face: { look: [0, -1], mouth: "big", brow: "up", mark: "star", hat: "goggles" } }, [x + 38, gy - 66], "R");
    s += o;
  }
  // cheers: little bursts round the raised cups
  s += line(`M188 262l-6 -10M204 256l2 -12M396 256l-2 -12M412 262l6 -10M318 166l-6 -10M358 168l9 -8`, 2.2, C.ink, ` opacity=".55"`);
  return V("Three spiders toast with thimbles round a pile of cookie crumbs", `<g transform="translate(300 262) scale(1.1) translate(-300 -290)">${s}</g>`);
}

// ================================================================
// 13. Map board: a spider briefs the plan on a corkboard leaning on the desk
// ================================================================
// A pushpin stuck into a board, seen from the front: x,y = where the point goes in.
function pushpin(x, y, col = C.gold, r = 6) {
  return `<ellipse cx="${n(x + 3)}" cy="${n(y + 3)}" rx="${n(r)}" ry="${n(r * .7)}" fill="${C.ink}" opacity=".25"/>` +
    `<path d="M${n(x - r * .45)} ${n(y - r * .2)}h${n(r * .9)}l${n(r * .25)} ${n(-r * 1.1)}h${n(-r * 1.4)}z" fill="${col}" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<ellipse cx="${n(x)}" cy="${n(y - r * 1.4)}" rx="${n(r)}" ry="${n(r * .55)}" fill="${col}" stroke="${C.ink}" stroke-width="1.6"/>` +
    `<ellipse cx="${n(x - r * .35)}" cy="${n(y - r * 1.55)}" rx="${n(r * .35)}" ry="${n(r * .18)}" fill="${C.cream}" opacity=".8"/>`;
}
// A reel of thread standing on its end: x centre, y contact.
function spool(x, y, w = 34, h = 40) {
  const rx = w / 2, ry = w * .2, fl = 5;
  let s = shadow(x + 4, y - 2, rx + 8, ry * .8, .3);
  s += `<path d="M${n(x - rx)} ${n(y - ry - fl)}v${fl}a${rx} ${ry} 0 0 0 ${w} 0v${-fl}z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<path d="M${n(x - rx + 4)} ${n(y - ry - fl)}V${n(y - h + fl)}h${w - 8}V${n(y - ry - fl)}a${rx - 4} ${ry} 0 0 1 ${-(w - 8)} 0z" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/>`;
  let d = ""; for (let yy = y - h + fl + 5; yy < y - ry - fl - 1; yy += 4) d += `M${n(x - rx + 5)} ${n(yy)}q${rx - 4} 3 ${w - 10} 0`;
  s += line(d, 1, C.goldB, ` opacity=".8"`);
  s += `<path d="M${n(x - rx)} ${n(y - h)}v${fl}a${rx} ${ry} 0 0 0 ${w} 0v${-fl}z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<ellipse cx="${x}" cy="${n(y - h)}" rx="${rx}" ry="${n(ry)}" fill="${C.parch}" stroke="${C.ink}" stroke-width="2"/><ellipse cx="${x}" cy="${n(y - h)}" rx="4" ry="2" fill="${C.ink}"/>`;
  return s;
}

export function spot_map_board() {
  const P = "smb";
  let s = glow(P, 300, 230, 295, 212);
  const TY = 382, DEPTH = 104, WALL = TY - DEPTH;
  // wall behind the desk
  s += faded(`${P}-wall`, 26, 574, `<rect x="26" y="20" width="548" height="${WALL - 20}" fill="${C.parch}"/>` + stipple(5, 300, 150, 260, 120, 200, .9, C.ink, .1), { top: [20, 70], edge: .14 });
  s += tabletop(P, TY, 26, 574, { depth: DEPTH, thick: 22, top: C.edge, edge: C.gold, fadeTop: false });
  s += faded(`${P}-dl`, 26, 574, line(`M26 ${WALL}H574`, 2, C.ink, ` opacity=".5"`));
  // the corkboard: bottom rail standing on the desk, top leaning on the wall
  const bL = 128, bR = 452, bY = 306, tY = 62, inset = 8, th = 16;
  const BL = [bL, bY], BR = [bR, bY], TR = [bR - inset, tY], TL = [bL + inset, tY];
  // its shadow on the wall (right of the top, where it stands off) and on the desk
  s += `<path d="M${pts([TR, [TR[0] + 16, tY + 10], [BR[0] + 22, WALL], [BR[0], WALL]])}z" fill="${C.ink}" opacity=".14"/>`;
  s += `<path d="M${pts([[bL - 4, bY], [bR + 4, bY], [bR + 26, bY - 16], [bL + 18, bY - 16]])}z" fill="${C.ink}" opacity=".22"/>`;
  // edge thickness on the right, sloping back to the wall
  s += `<path d="M${pts([BR, TR, [TR[0] + 5, tY + 3], [BR[0] + 7, bY - 4]])}z" fill="${C.plum}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<path d="M${pts([BL, BR, TR, TL])}z" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const IBL = [bL + th, bY - th], IBR = [bR - th, bY - th], ITR = [bR - inset - th + 1, tY + th], ITL = [bL + inset + th - 1, tY + th];
  s += `<path d="M${pts([IBL, IBR, ITR, ITL])}z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<clipPath id="${P}-cork"><path d="M${pts([IBL, IBR, ITR, ITL])}z"/></clipPath><g clip-path="url(#${P}-cork)">`;
  s += stipple(33, 290, (tY + bY) / 2, (bR - bL) / 2, (bY - tY) / 2, 900, 1.1, C.gold, .7);
  s += stipple(34, 290, (tY + bY) / 2, (bR - bL) / 2, (bY - tY) / 2, 420, .9, C.ink, .25) + `</g>`;
  s += line(`M${pts([lerp(BL, TL, .06), lerp(BL, TL, .94)])}`, 2.4, C.goldB, ` opacity=".6"`);
  // the floor plan, pinned at four corners
  const px0 = 164, py0 = 92, pw = 196, ph = 150;
  s += `<rect x="${px0 + 4}" y="${py0 + 5}" width="${pw}" height="${ph}" fill="${C.ink}" opacity=".2"/>`;
  s += `<rect x="${px0}" y="${py0}" width="${pw}" height="${ph}" fill="${C.cream}" stroke="${C.ink}" stroke-width="2"/>`;
  {
    const X = u => px0 + 14 + u * (pw - 28), Y = v => py0 + 14 + v * (ph - 28);
    // outer walls with a front-door gap, inner walls with door gaps
    s += line(`M${X(.42)} ${Y(1)}H${X(0)}V${Y(0)}H${X(1)}V${Y(1)}H${X(.56)}`, 3.4, C.ink);
    s += line(`M${X(.45)} ${Y(0)}V${Y(.3)}M${X(.45)} ${Y(.46)}V${Y(.62)}H${X(.3)}M${X(.16)} ${Y(.62)}H${X(0)}M${X(.45)} ${Y(.62)}H${X(.62)}M${X(.78)} ${Y(.62)}H${X(1)}M${X(.72)} ${Y(0)}V${Y(.22)}M${X(.72)} ${Y(.38)}V${Y(.62)}`, 2.4, C.ink);
    // furniture blocks
    s += `<rect x="${X(.05)}" y="${Y(.06)}" width="${X(.2) - X(0)}" height="${Y(.22) - Y(0)}" fill="${C.edge}" stroke="${C.ink}" stroke-width="1.2"/>`;
    s += `<rect x="${X(.78)}" y="${Y(.72)}" width="${X(.18) - X(0)}" height="${Y(.2) - Y(0)}" fill="${C.edge}" stroke="${C.ink}" stroke-width="1.2"/>`;
    s += `<circle cx="${X(.84)}" cy="${Y(.14)}" r="7" fill="${C.edge}" stroke="${C.ink}" stroke-width="1.2"/>`;
    // the route: dashed gold line from the front door to the target, round the danger
    s += line(`M${X(.49)} ${Y(1.06)}V${Y(.82)}Q${X(.49)} ${Y(.7)} ${X(.7)} ${Y(.7)}H${X(.7)}Q${X(.86)} ${Y(.62)} ${X(.86)} ${Y(.36)}`, 2.6, C.gold, ` stroke-dasharray="6 4"`);
    // danger: the cat's room, ringed in red
    s += `<ellipse cx="${X(.2)}" cy="${Y(.36)}" rx="24" ry="18" fill="none" stroke="${C.oxB}" stroke-width="2.6"/>`;
    s += `<path d="M${X(.2) - 9} ${Y(.36) + 6}v-8l4 -7 4 5h2l4 -5 4 7v8q-9 5 -18 0z" fill="${C.ink}"/>`;
    // target star
    s += `<path d="M${X(.86)} ${Y(.26) - 10}l3 6.4 7 .8 -5.2 4.8 1.4 7 -6.2 -3.6 -6.2 3.6 1.4 -7 -5.2 -4.8 7 -.8z" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
  }
  for (const [x, y] of [[px0 + 8, py0 + 10], [px0 + pw - 8, py0 + 10], [px0 + 8, py0 + ph - 6], [px0 + pw - 8, py0 + ph - 6]]) s += pushpin(x, y, C.soft);
  // an index card of notes (squiggles) and a snapshot of the cat, each pinned
  {
    const x = 372, y = 96;
    s += `<rect x="${x + 3}" y="${y + 4}" width="62" height="44" fill="${C.ink}" opacity=".2"/><rect x="${x}" y="${y}" width="62" height="44" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.8"/>`;
    s += line(`M${x + 6} ${y + 12}h50`, 1.4, C.ink) + line(`M${x + 8} ${y + 22}q5 -4 10 0t10 0 10 0 10 0M${x + 8} ${y + 32}q5 -4 10 0t10 0 10 0`, 1.3, C.soft);
    s += pushpin(x + 31, y + 7, C.gold, 5);
    const qx = 376, qy = 160, w = 56, h = 64;
    s += `<rect x="${qx + 3}" y="${qy + 4}" width="${w}" height="${h}" fill="${C.ink}" opacity=".2"/><rect x="${qx}" y="${qy}" width="${w}" height="${h}" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.8"/>`;
    s += `<rect x="${qx + 5}" y="${qy + 5}" width="${w - 10}" height="${h - 20}" fill="${C.plum}"/>`;
    // the cat's face: two ears, two eyes, nose
    const cx = qx + w / 2, cy = qy + 30;
    s += `<path d="M${cx - 14} ${cy - 4}l2 -14 8 8h8l8 -8 2 14q0 14 -14 14t-14 -14z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
    s += `<ellipse cx="${cx - 6}" cy="${cy - 1}" rx="2.6" ry="3.2" fill="${C.good}" stroke="${C.ink}" stroke-width="1"/><ellipse cx="${cx + 6}" cy="${cy - 1}" rx="2.6" ry="3.2" fill="${C.good}" stroke="${C.ink}" stroke-width="1"/>`;
    s += `<path d="M${cx - 6} ${cy - 3}v4M${cx + 6} ${cy - 3}v4" stroke="${C.ink}" stroke-width="1.2"/><path d="M${cx - 2} ${cy + 5}h4l-2 2.4z" fill="${C.oxB}"/>`;
    s += pushpin(cx, qy + 6, C.oxB, 5);
  }
  // on the desk: a reel of thread, a pencil
  s += spool(88, 352, 38, 46);
  s += pencil([96, 372], [214, 360], 10);
  // the briefer: on the desk in front of the board, pointing a toothpick at the target star
  {
    const x = 468, gy = 346, sc = .95;
    const tip = [px0 + 14 + .86 * (pw - 28) + 6, py0 + 14 + .26 * (ph - 28) + 10];
    const hold = [x - 40, gy - 70];
    const dir = [tip[0] - hold[0], tip[1] - hold[1]], L = Math.hypot(...dir), u = [dir[0] / L, dir[1] / L];
    const butt = [hold[0] - u[0] * 20, hold[1] - u[1] * 20];
    const st = standOn(x, gy, sc, { L0: hold, L1: add(hold, u, 26) }, { L0: [x - 22, gy - 96], L1: [x - 12, gy - 90] });
    s += shadow(x + 2, gy, 62, 5, .28);
    s += sp({ ...st, look: [-1, -.8], mouth: "smirk", brow: "down", mark: "stripe" });
    // toothpick pointer (pointed at both ends), drawn over the forefeet, tarsi curled over it
    const w = 5, px = -u[1] * w / 2, py = u[0] * w / 2, tp = 12;
    const a = butt, b = [tip[0] - u[0] * 2, tip[1] - u[1] * 2];
    s += `<path d="M${pts([a, [a[0] + u[0] * tp + px, a[1] + u[1] * tp + py], [b[0] - u[0] * tp + px, b[1] - u[1] * tp + py], b, [b[0] - u[0] * tp - px, b[1] - u[1] * tp - py], [a[0] + u[0] * tp - px, a[1] + u[1] * tp - py]])}z" fill="${C.parch}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
    for (const h of [hold, add(hold, u, 26)]) s += legPath(`M${n(h[0] + 2)} ${n(h[1] - 5)}q-6 2 -5 9`, sc);
    s += line(`M${tip[0] + 10} ${tip[1] - 10}l6 -6M${tip[0] + 12} ${tip[1] + 2}h8`, 2, C.ink, ` opacity=".6"`);
  }
  return V("A spider points out the target on a floor plan pinned to a corkboard", s);
}

// ================================================================
// 14. Couch sneak: a spider tiptoes beneath a sleeper's dangling hand
// ================================================================
const Zz = (x, y, h, c = C.soft) => line(`M${n(x - h * .35)} ${n(y - h / 2)}h${n(h * .7)}l${n(-h * .7)} ${n(h)}h${n(h * .7)}`, Math.max(2, h * .13), c);

export function spot_couch_sneak() {
  const P = "scs";
  let s = glow(P, 300, 230, 295, 215);
  const GY = 414, FL = 340; // floor front line, and where the couch legs stand
  // floor: boards receding from under the couch to the front line
  {
    let c = `<rect x="20" y="${FL - 40}" width="560" height="${GY - FL + 40}" fill="${C.edge}" opacity=".55"/>`;
    let d = "", yy = FL - 40, st = 10; while (yy < GY - 4) { yy += st; st *= 1.3; if (yy < GY - 4) d += `M20 ${n(yy)}H580`; }
    c += `<path d="${d}" stroke="${C.ink}" stroke-width="1.2" opacity=".22"/>`;
    s += faded(`${P}-fp`, 20, 580, c, { edge: .14 });
  }
  s += floor(P, GY, 24, 576);
  // ---- the couch (continues off to the left; its right end, arm and leg in view) ----
  const X0 = 20, AX0 = 452, AX1 = 548; // couch left (faded), arm span
  const backT = 44, seatT = 120, seatF = 138, cushB = 208, baseB = 292;
  let cc = "";
  // backrest cushions, fading up into the page
  cc += `<rect x="${X0}" y="${backT}" width="${AX0 + 60 - X0}" height="${seatT - backT + 6}" fill="${C.plum}"/>`;
  cc += `<path d="M${X0 + 150} ${backT + 10}q-6 40 0 ${seatT - backT - 10}M${X0 + 320} ${backT + 10}q6 40 0 ${seatT - backT - 10}" stroke="${C.ink}" stroke-width="2.4" fill="none"/>`;
  cc += line(`M${X0 + 180} ${backT + 30}q60 -10 120 0`, 5, C.soft, ` opacity=".7"`);
  // seat cushion: top band then front face with piping
  cc += `<rect x="${X0}" y="${seatT}" width="${AX0 - X0}" height="${seatF - seatT}" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.4"/>`;
  cc += `<rect x="${X0}" y="${seatF}" width="${AX0 - X0 + 6}" height="${cushB - seatF}" rx="14" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.6"/>`;
  cc += line(`M${X0} ${seatF + 5}H${AX0 - 8}M${X0} ${cushB - 5}H${AX0 - 8}`, 2, C.plum);
  cc += line(`M${X0 + 20} ${seatF + 16}H${AX0 - 30}`, 4, C.edge, ` opacity=".35"`);
  cc += line(`M${X0 + 220} ${seatF + 2}v${cushB - seatF - 4}`, 2.4, C.ink, ` opacity=".6"`); // seam between two seat cushions
  // base rail with a pleated valance
  cc += `<rect x="${X0}" y="${cushB}" width="${AX0 - X0}" height="${baseB - cushB}" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.6"/>`;
  let pl = ""; for (let x = X0 + 30; x < AX0; x += 48) pl += `M${x} ${cushB + 10}V${baseB - 4}`;
  cc += line(pl, 2, C.ink, ` opacity=".45"`);
  cc += line(`M${X0} ${cushB + 8}H${AX0}`, 3, C.soft, ` opacity=".6"`);
  // the dark gap under the couch, and a left leg lost in the fade
  cc += `<rect x="${X0}" y="${baseB}" width="${AX1 - X0}" height="${FL - baseB}" fill="${C.deep}" opacity=".55"/>`;
  s += faded(`${P}-cc`, X0, 640, cc, { edge: .2, top: [backT, backT + 44] });
  // the coin they are after, lying flat in the shadow under the couch
  s += flatCoin(170, FL - 6, 15) + sparkle(188, FL - 26, 5.5);
  // right arm of the couch: a rolled arm, front face
  {
    s += `<path d="M${AX0} ${baseB}V${seatT - 20}q0 -44 48 -44t48 44V${baseB}z" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.8" stroke-linejoin="round"/>`;
    s += `<path d="M${AX0 + 12} ${seatT - 20}q0 -32 36 -32t36 32q0 28 -36 28t-36 -28z" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.2"/>`;
    s += `<path d="M${AX0 + 30} ${seatT - 20}q0 -14 18 -14t18 14q0 12 -18 12t-18 -12z" fill="${C.soft}" stroke="${C.ink}" stroke-width="1.8"/>`;
    s += line(`M${AX0 + 10} ${seatT + 30}V${baseB - 10}`, 5, C.edge, ` opacity=".3"`);
    s += line(`M${AX0} ${cushB}H${AX1}`, 2.4, C.ink) + line(`M${AX0} ${cushB + 8}H${AX1}`, 3, C.plum, ` opacity=".6"`);
  }
  // the leg under the arm: a turned wooden foot standing on the floor, with its contact shadow
  const leg = (x) => shadow(x + 4, FL, 22, 4, .35) +
    `<path d="M${x - 14} ${baseB}h28l-4 10h-20z" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<path d="M${x - 9} ${baseB + 10}h18l-4 ${FL - baseB - 16}h-10z" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<ellipse cx="${x}" cy="${FL - 4}" rx="8" ry="3" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/>` +
    line(`M${x - 5} ${baseB + 14}v${FL - baseB - 22}`, 2, C.goldB, ` opacity=".7"`);
  s += leg(AX1 - 26);
  // ---- the sleeper's right arm draped over the cushion, hand hanging, back of the hand to us ----
  {
    const hx = 346; // centre line of the forearm
    // pillow on the seat against the arm of the couch, and the sleeper's head on it (lying on their back,
    // face turned up: a profile, so one closed eye), body under a blanket stretching away to the left
    s += `<path d="M384 ${seatT + 16}q-6 -30 8 -34q34 -6 60 2q10 16 2 34q-36 8 -70 -2z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += line(`M396 ${seatT - 8}q20 6 44 -2`, 1.8, C.edge);
    {
      const H = [424, seatT - 36];
      let h = `<path d="M-4 -24C-18 -24 -24 -16 -23 -7L-31 3L-24 7Q-26 9 -24 11Q-25 14 -22 16Q-24 22 -14 24Q-4 26 8 22A25 25 0 1 0 -4 -24z" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
      h += `<path d="M-18 -18Q-6 -30 10 -22Q26 -12 22 8Q18 20 8 22Q14 8 8 -4Q0 -14 -18 -18z" fill="${C.plum}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
      h += `<ellipse cx="4" cy="3" rx="5.5" ry="7.5" fill="${C.parch}" stroke="${C.ink}" stroke-width="1.8"/><path d="M5.5 -1q-3.5 4 0 8" stroke="${C.ink}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
      h += `<path d="M-19 -5q5 4 10 0" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/><path d="M-17 -3l-2 3M-14 -2l-1 3.4M-11 -3l0 3" stroke="${C.ink}" stroke-width="1.2" stroke-linecap="round"/>`;
      h += `<path d="M-21 -11q5 -3 10 -1" fill="none" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/>`;
      h += `<ellipse cx="-23.5" cy="12.5" rx="2" ry="2.6" fill="${C.ink}"/>`;
      s += `<g transform="translate(${H[0]} ${H[1]}) rotate(90) scale(1.12)">${h}</g>`;
    }
    // blanket: a long mound over the sleeper, its hem hanging over the seat's front edge
    {
      const top = [[14, seatT - 40], [90, seatT - 50], [170, seatT - 44], [250, seatT - 56], [320, seatT - 58], [378, seatT - 64], [402, seatT - 46]];
      let d = `M${top[0][0]} ${seatF + 14}V${top[0][1]}`;
      for (let i = 0; i < top.length - 1; i++) { // Catmull-Rom through the points
        const p0 = top[Math.max(0, i - 1)], p1 = top[i], p2 = top[i + 1], p3 = top[Math.min(top.length - 1, i + 2)];
        d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]} ${p2[1]}`;
      }
      d += `Q412 ${seatT - 20} 406 ${seatF + 14}`;
      for (let x = 406; x > 20; x -= 48) d += `q-12 8 -24 3t-24 -1`;
      d += "z";
      let bl = `<path d="${d}" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
      bl += `<clipPath id="${P}-bl"><path d="${d}"/></clipPath><g clip-path="url(#${P}-bl)">`;
      let g = ""; for (let x = 60; x < 420; x += 64) g += `M${x} ${seatT - 80}V${seatF + 30}`;
      bl += line(g, 4, C.edge) + line(`M14 ${seatT - 20}H420M14 ${seatF - 2}H420`, 4, C.edge);
      bl += line(`M150 ${seatT - 40}q14 20 6 54M280 ${seatT - 50}q12 24 2 64`, 2, C.ink, ` opacity=".3"`);
      bl += `</g>`;
      s += faded(`${P}-blk`, 20, 700, bl, { edge: .16 });
    }
    // sleeve: out from under the blanket's hem, over the seat's front edge
    const cuffY = seatF + 34;
    s += `<path d="M${hx - 25} ${cuffY}V${seatF + 4}h50V${cuffY}z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += line(`M${hx - 12} ${seatF + 6}V${cuffY}M${hx + 2} ${seatF + 6}V${cuffY}M${hx + 15} ${seatF + 6}V${cuffY}`, 2.4, C.plum, ` opacity=".6"`);
    s += `<path d="M${hx - 30} ${seatF + 10}q8 -6 16 -2t16 0 16 -2 16 2" fill="none" stroke="${C.ink}" stroke-width="2"/>`;
    s += `<path d="M${hx - 30} ${seatF + 10}q8 -6 16 -2t16 0 16 -2 16 2v-10h-64z" fill="${C.cream}"/>`;
    // forearm and wrist hanging straight down the cushion front
    const wy = cuffY + 40;
    s += `<path d="M${hx - 19} ${cuffY}L${hx - 17} ${wy + 4}h34L${hx + 19} ${cuffY}z" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += `<path d="M${hx - 26} ${cuffY - 8}q26 7 52 0v10q-26 7 -52 0z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.2"/>`;
    // back of the hand
    const hb = wy + 46;
    // thumb first (behind the hand's edge): on OUR right for a right hand seen from the back, hanging relaxed by the index finger
    const thumb = `M${hx + 14} ${wy + 12}Q${hx + 31} ${wy + 22} ${hx + 30} ${wy + 50}`;
    s += line(thumb, 15.5, C.ink) + line(thumb, 11, C.parch);
    s += `<path d="M${hx + 26} ${wy + 49}q4 -5 8 0" stroke="${C.ink}" stroke-width="1.3" fill="none"/>`;
    // four fingers, relaxed, hanging with a slight curl: index (our right) to little finger (our left)
    const fingers = [[hx + 15, 38, 2.5], [hx + 5, 46, 1], [hx - 5, 42, -.5], [hx - 15, 32, -2.5]];
    for (const [fx, L, lean] of fingers) {
      const d = `M${fx} ${hb - 10}Q${n(fx + lean)} ${n(hb + L * .55)} ${n(fx + lean * 2.4 - 1.5)} ${hb + L}`;
      s += line(d, 13, C.ink) + line(d, 9, C.parch);
      s += line(`M${n(fx + lean * 1.2 - 3)} ${n(hb + L * .5)}q3 1.5 6 0`, 1.1, C.ink, ` opacity=".55"`);
    }
    const handD = `M${hx - 17} ${wy - 2}Q${hx - 25} ${hb - 18} ${hx - 22} ${hb - 2}q22 6 44 0Q${hx + 23} ${hb - 18} ${hx + 17} ${wy - 2}z`;
    s += `<path d="${handD}" fill="${C.parch}"/>`;
    s += line(`M${hx - 17} ${wy - 2}Q${hx - 25} ${hb - 18} ${hx - 22} ${hb - 2}M${hx + 17} ${wy - 2}Q${hx + 23} ${hb - 18} ${hx + 22} ${hb - 2}`, 2.4, C.ink);
    s += `<path d="M${hx - 20} ${hb - 3}q5 3 10 0M${hx - 10} ${hb - 1}q5 3 10 0M${hx} ${hb - 1}q5 3 10 0M${hx + 10} ${hb - 2}q5 3 10 0" stroke="${C.ink}" stroke-width="1.3" fill="none" opacity=".6"/>`;
    s += line(`M${hx - 9} ${wy + 10}l-4 24M${hx + 1} ${wy + 10}v25M${hx + 10} ${wy + 10}l3 23`, 1.2, C.edge);
    s += line(`M${hx - 19} ${wy + 8}q-3 14 -1 24`, 3, C.cream, ` opacity=".8"`);
  }
  // Zzz drifting up from the sleeper, off beyond the backrest
  s += Zz(448, 56, 9) + Zz(466, 43, 11) + Zz(488, 29, 14);
  // ---- the spider, tiptoeing along the floor beneath the hand ----
  {
    const x = 330, gy = 392, sc = .82, y = gy - 34;
    const feet = { R0: [x + 16, gy], L0: [x - 14, gy], R1: [x + 34, gy - 14], L1: [x - 30, gy], R2: [x + 44, gy], L2: [x - 46, gy - 12], R3: [x + 56, gy], L3: [x - 56, gy] };
    const knees = { R0: [x + 22, y - 26], L0: [x - 22, y - 26], R1: [x + 38, y - 28], L1: [x - 36, y - 24], R2: [x + 48, y - 16], L2: [x - 50, y - 20], R3: [x + 60, y - 6], L3: [x - 60, y - 6] };
    s += shadow(x + 2, gy, 48, 5, .28);
    s += sp({ x, y, s: sc, legOverride: legs(x, y, sc, feet, knees), look: [.2, -1], mouth: "worried", brow: "worried", mark: "chevron" });
    s += line(`M${x + 60} ${gy - 30}q6 -8 12 0M${x - 64} ${gy - 26}q6 -8 12 0`, 1.8, C.ink, ` opacity=".5"`);
  }
  return V("A spider tiptoes along the floor beneath a sleeping person's hand dangling off the couch", s);
}
