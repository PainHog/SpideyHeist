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
  s += `<path d="M${pts([at(L - cone * .35, -.35), b, at(L - cone * .35, .35)])}z" fill="${C.ink}"/>`;
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
  // a score pad lying flat at the back left, with a pencil lying across it
  {
    const o = [34, 322], a = [112, -4], b = [38, -62];
    s += `<path d="M${pts([add(o, [4, 5]), add(add(o, a), [4, 5]), add(add(add(o, a), b), [4, 5]), add(add(o, b), [4, 5])])}z" fill="${C.ink}" opacity=".2"/>`;
    s += `<path d="M${pts([o, add(o, a), add(add(o, a), b), add(o, b)])}z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
    s += `<g transform="${mat(add(o, b), a, [-b[0], -b[1]])}">`;
    let d = "";
    for (let k = 0; k < 5; k++) { const v = .24 + k * .15; d += `M.08 ${n(v)}q.05 -.06 .1 0t.1 0 .1 0${k % 2 ? "" : " .1 0"}`; }
    s += `<path d="${d}" stroke="${C.soft}" stroke-width="1.4" fill="none"${NS}/>`;
    s += `<path d="M.06 .1H.94" stroke="${C.ink}" stroke-width="1.6"${NS}/><path d="M.7 .16V.94" stroke="${C.edge}" stroke-width="1.4"${NS}/>`;
    s += `<path d="M.76 .5l.04 .08l.08 -.2" stroke="${C.good}" stroke-width="2" fill="none"${NS}/></g>`;
    s += pencil([48, 338], [166, 304], 10);
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
  s += flatCoin(528, 380, 17) + sparkle(548, 350, 6);
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
    const x = 262, gy = 322, sc = .92, y = gy - 26 * sc;
    // spyglass: eyepiece against the rim of the right eye, three telescoping brass tubes, aimed at the moon
    const ex = x + 5.6 * sc + 3.2, ey = y - .2 * sc - 4;
    const deg = -58, ang = deg * Math.PI / 180, u = [Math.cos(ang), Math.sin(ang)], p = [-u[1], u[0]];
    const at = t => add([ex, ey], u, t);
    const T1 = add(at(68), p, 8), T2 = add(at(38), p, 6.5); // where the forefeet grip (tube's right flank)
    const st = standOn(x, gy, sc, { R0: T1, R1: T2 }, { R0: [x + 48, y - 70], R1: [x + 44, y - 34] });
    // the left eye screwed shut, as you do at an eyepiece
    const wink = `<circle cx="-5.6" cy="-.2" r="5.6" fill="${C.plum}"/><path d="M-10.4 -.4q4.8 3.2 9.6 0" stroke="${C.ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    s += shadow(x, gy, 58, 5, .28);
    s += sp({ ...st, look: [.6, -1], mouth: "smirk", brow: "down", mark: "dots", over: wink, rimOp: .9 });
    const seg = (t0, t1, r0, fill) => { const A = at(t0), B = at(t1); return `<path d="M${pts([add(A, p, r0), add(B, p, r0), add(B, p, -r0), add(A, p, -r0)])}z" fill="${fill}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`; };
    const ring = (t, r0) => { const A = at(t); return line(`M${pts([add(A, p, r0 + 1), add(A, p, -r0 - 1)])}`, 4.5, C.ink) + line(`M${pts([add(A, p, r0), add(A, p, -r0)])}`, 2.4, C.soft); };
    s += seg(0, 24, 4, C.gold) + seg(22, 50, 5.5, C.goldB) + seg(48, 84, 7.5, C.gold);
    s += ring(1, 4.2) + ring(24, 4.2) + ring(50, 5.6) + ring(84, 7.6);
    const O = at(86);
    s += `<ellipse cx="${n(O[0])}" cy="${n(O[1])}" rx="3.2" ry="7.6" transform="rotate(${deg} ${n(O[0])} ${n(O[1])})" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.6"/>`;
    s += line(`M${pts([add(at(54), p, -3.5), add(at(80), p, -5)])}`, 1.6, C.cream, ` opacity=".8"`);
    // forefeet curled round the tube
    const curl = (T, r0) => { const a = add(T, p, 0), b = add(at(0), p, 0); const tipIn = add(add(T, p, -r0 * 1.7), u, -2); return legPath(`M${n(T[0])} ${n(T[1])}Q${n(T[0] + p[0] * -r0 * .4 + u[0] * 6)} ${n(T[1] + p[1] * -r0 * .4 + u[1] * 6)} ${n(tipIn[0])} ${n(tipIn[1])}`, sc); };
    s += curl(T1, 7.5) + curl(T2, 5.5);
  }
  return V("A lookout spider on a night-time window sill peers at the moon through a tiny spyglass", `<g transform="translate(0 34)">${s}</g>`);
}
