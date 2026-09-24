// Spot illustrations: small self-contained vignettes that fill end-of-chapter gaps.
// 600x450 (4:3), transparent background, soft ground and contact shadows, no frame.
import { C, n, pts, rng, svg, hatch, stipple, spider, flatCookie, tin, sparkle, shadow, line, pipsFor } from "./lib.mjs";

const V = (title, body) => svg("0 0 600 450", title, body);

// ---------- shared helpers (local to the spot pieces) ----------

// Soft parchment glow behind a vignette, fading to the page.
function glow(P, cx = 300, cy = 235, rx = 290, ry = 205, col = C.parch, op = 1) {
  return `<defs><radialGradient id="${P}-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${col}" stop-opacity="${op}"/><stop offset=".62" stop-color="${col}" stop-opacity="${op * .7}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient></defs>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${P}-glow)"/>`;
}

// A mask that fades content out towards the left/right ends (x0..x1), and optionally the top.
function fadeMask(id, x0, x1, o = {}) {
  const { edge = .16, y0 = -50, y1 = 500, top = null } = o;
  let s = `<linearGradient id="${id}-lx" gradientUnits="userSpaceOnUse" x1="${x0}" y1="0" x2="${x1}" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${edge}" stop-color="#fff"/><stop offset="${1 - edge}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  let body = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="url(#${id}-lx)"/>`;
  if (top) {
    const [ta, tb] = top;
    s += `<linearGradient id="${id}-ly" gradientUnits="userSpaceOnUse" x1="0" y1="${ta}" x2="0" y2="${tb}"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`;
    body += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${tb - y0}" fill="url(#${id}-ly)"/>`;
  }
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="${x0 - 5}" y="${y0}" width="${x1 - x0 + 10}" height="${y1 - y0}">${s}${body}</mask>`;
}
const faded = (id, x0, x1, content, o) => `<defs>${fadeMask(id, x0, x1, o)}</defs><g mask="url(#${id})">${content}</g>`;

// An inked floor line with hatching below, fading at both ends.
function floor(P, y, x0 = 40, x1 = 560, o = {}) {
  const { fill = null, depth = 0, gap = 12, w = 2.6 } = o;
  let c = "";
  if (fill) c += `<rect x="${x0}" y="${y - depth}" width="${x1 - x0}" height="${depth}" fill="${fill}"/>`;
  c += `<path d="M${x0} ${y}H${x1}" stroke="${C.ink}" stroke-width="${w}" stroke-linecap="round"/>`;
  let d = "";
  for (let xx = x0 + 10; xx < x1; xx += gap) d += `M${xx} ${y + 5}l-7 9`;
  c += `<path d="${d}" stroke="${C.ink}" stroke-width="1.3" opacity=".3"/>`;
  return faded(`${P}-fl`, x0, x1, c);
}

// A tabletop seen from slightly above: a lit top band (fading back into the page) over an inked front edge.
function tabletop(P, y, x0, x1, o = {}) {
  const { depth = 70, thick = 16, top = C.parch, edge = C.edge, grain = true } = o;
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
  return faded(`${P}-tt`, x0, x1, c, { top: [y - depth, y - depth * .45] });
}

// A room corner seen from low down: wall fading up into the page, a skirting board,
// and a floor plane (boards receding) from the skirting down to the front line gy.
function room(P, o = {}) {
  const { x0 = 20, x1 = 580, sk = 196, skH = 40, gy = 380, wall = C.parch, boards = true, floorFill = C.edge } = o;
  let c = `<rect x="${x0}" y="${sk - skH - 120}" width="${x1 - x0}" height="120" fill="${wall}"/>`;
  c += `<rect x="${x0}" y="${sk}" width="${x1 - x0}" height="${gy - sk}" fill="${floorFill}" opacity=".55"/>`;
  if (boards) {
    let d = ""; let yy = sk, step = 10;
    while (yy < gy - 4) { yy += step; step *= 1.35; if (yy < gy - 4) d += `M${x0} ${n(yy)}H${x1}`; }
    c += `<path d="${d}" stroke="${C.ink}" stroke-width="1.2" opacity=".22"/>`;
  }
  // skirting board with a moulded top
  c += `<rect x="${x0}" y="${sk - skH}" width="${x1 - x0}" height="${skH}" fill="${C.cream}"/>`;
  c += `<rect x="${x0}" y="${sk - skH}" width="${x1 - x0}" height="8" fill="${C.edge}"/>`;
  c += `<path d="M${x0} ${sk - skH}H${x1}M${x0} ${sk - skH + 8}H${x1}M${x0} ${sk}H${x1}" stroke="${C.ink}" stroke-width="2.2"/>`;
  c += `<path d="M${x0} ${sk + 3}H${x1}" stroke="${C.ink}" stroke-width="5" opacity=".12"/>`;
  return faded(`${P}-rm`, x0, x1, c, { top: [sk - skH - 120, sk - skH - 30], edge: .14 });
}

// ---------- spiders ----------
const SA = [[9, -6], [12, -2], [13, 3], [10, 7]]; // leg attach points (right side) on the cephalothorax
// Charcoal spider with a gold rim so it separates from paper and dark objects (checklist #12).
const sp = o => spider({ rim: C.goldB, rimOp: .55, ...o });
// Place a leg's foot at a WORLD point; knee is computed (up and out) unless given (world).
function legs(x, y, s, feet, knees = {}) {
  const lo = {};
  for (const k of Object.keys(feet)) {
    const i = +k[1], m = k[0] === "R" ? 1 : -1;
    const a = [SA[i][0] * m, SA[i][1]];
    const f = [(feet[k][0] - x) / s, (feet[k][1] - y) / s];
    let kn;
    if (knees[k]) kn = [(knees[k][0] - x) / s, (knees[k][1] - y) / s];
    else {
      const H = [22, 20, 14, 9][i];
      kn = [a[0] + (f[0] - a[0]) * .62 + m * 4, Math.min(a[1], f[1]) - H];
    }
    lo[k] = [a, kn, f];
  }
  return lo;
}
// all eight feet on one ground line gy (spread as in the "stand" pose), with optional overrides
function standOn(x, gy, s, over = {}, knees = {}) {
  const y = gy - 26 * s, sp4 = [17, 36, 54, 64], feet = {};
  for (let i = 0; i < 4; i++) { feet["R" + i] = [x + sp4[i] * s, gy]; feet["L" + i] = [x - sp4[i] * s, gy]; }
  Object.assign(feet, over);
  return { x, y, s, legOverride: legs(x, y, s, feet, knees) };
}
// every leg collapsed into the body (used to redraw a body over legs that pass in front of an object)
function noLegs(keep = {}) {
  const lo = {};
  for (const side of ["R", "L"]) for (let i = 0; i < 4; i++) {
    const m = side === "R" ? 1 : -1, a = [SA[i][0] * m * .5, SA[i][1] * .5];
    lo[side + i] = keep[side + i] || [a, a, a];
  }
  return lo;
}

// A single spider leg drawn in world coordinates (for feet that grip props).
const legPath = (d, s) => line(d, 4.4 * s, C.ink) + line(d, 2.2 * s, C.plum);

// Affine map of the unit square onto a parallelogram: origin o, u-edge a, v-edge b.
const mat = (o, a, b) => `matrix(${n(a[0])} ${n(a[1])} ${n(b[0])} ${n(b[1])} ${n(o[0])} ${n(o[1])})`;
const NS = ` vector-effect="non-scaling-stroke"`;

// ================================================================
// 1. Crew huddle: four spiders round a matchbox table with a blueprint
// ================================================================
export function spot_crew_huddle() {
  const P = "sch";
  let s = glow(P, 300, 250, 295, 205);
  const GY = 382;
  s += room(P, { sk: 190, skH: 42, gy: GY });
  s += floor(P, GY, 24, 576);
  // the crew's hideout: a hole gnawed in the skirting board, lit from inside
  s += `<path d="M58 190V168q0 -18 20 -18h20q20 0 20 18V190z" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += `<path d="M66 190V172q0 -12 14 -12h16q14 0 14 12V190z" fill="${C.gold}" opacity=".35"/>`;
  s += `<path d="M60 158l6 4M114 160l-5 4M58 176h5" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/>`;
  // a candle stub in a bottle cap on the floor by the door: the crew's lamp
  {
    const cx = 150, cyB = 214;
    s += `<ellipse cx="${cx}" cy="${cyB - 40}" rx="56" ry="50" fill="${C.goldB}" opacity=".22"/>`;
    s += shadow(cx + 4, cyB, 24, 4, .3);
    s += `<path d="M${cx - 18} ${cyB - 9}v7q18 6 36 0v-7" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/>`;
    s += `<path d="M${cx - 14} ${cyB - 6}v4M${cx - 7} ${cyB - 5}v5M${cx} ${cyB - 4}v5M${cx + 7} ${cyB - 5}v5M${cx + 14} ${cyB - 6}v4" stroke="${C.ink}" stroke-width="1.2" opacity=".5"/>`;
    s += `<ellipse cx="${cx}" cy="${cyB - 9}" rx="18" ry="5" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2"/>`;
    s += `<ellipse cx="${cx}" cy="${cyB - 9}" rx="12" ry="3.2" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.2"/>`;
    s += `<path d="M${cx - 6} ${cyB - 9}V${cyB - 34}q6 -2.4 12 0V${cyB - 9}z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.8"/>`;
    s += `<path d="M${cx} ${cyB - 35}v-4" stroke="${C.ink}" stroke-width="1.5"/>`;
    s += `<path d="M${cx} ${cyB - 58}q7 9 4 15q-4 4 -8 0q-3 -6 4 -15z" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.5"/>`;
    s += `<path d="M${cx} ${cyB - 49}q2.4 4 .8 6q-2.4 .8 -2.4 -1.6z" fill="${C.gold}"/>`;
  }
  // matchbox lying flat: front face X0..X1 x (GY-Hh..GY), depth vector D
  const X0 = 150, X1 = 430, Hh = 54, D = [40, -84];
  const FL = [X0, GY - Hh], FR = [X1, GY - Hh], BR = [X1 + D[0], GY - Hh + D[1]], BL = [X0 + D[0], GY - Hh + D[1]];
  const LW = 1.25;

  // back spiders: they cling to the back wall of the box, forelegs resting on the blueprint.
  // pass 1 (before the box): whole spider; the legs that grip the back of the box are hidden by it.
  const bs = .82;
  // each back spider: forelegs on the blueprint, the other six gripping the back wall of the box
  const bf = (x, y, f0R, f0L) => ({ R0: f0R, L0: f0L, R1: [x + 34, y + 44], R2: [x + 48, y + 44], R3: [x + 58, y + 44], L1: [x - 34, y + 44], L2: [x - 48, y + 44], L3: [x - 58, y + 44] });
  const back = [
    { x: 250, y: 236, look: [.3, 1], mouth: "flat", brow: "down", mark: "chevron", f: bf(250, 236, [278, 282], [224, 280]) },
    { x: 384, y: 234, look: [-.3, 1], mouth: "smirk", mark: "dots", f: bf(384, 234, [408, 280], [358, 284]) },
  ];
  const bsp = (b, lo, extra = {}) => sp({ x: b.x, y: b.y, s: bs, legW: LW, look: b.look, mouth: b.mouth, brow: b.brow || "none", mark: b.mark, hat: b.hat || null, legOverride: lo, ...extra });
  const bk = b => ({ R0: [b.x + 40, b.y - 4], L0: [b.x - 40, b.y - 4],
    R1: [b.x + 28, b.y - 18], R2: [b.x + 42, b.y - 12], R3: [b.x + 54, b.y - 4],
    L1: [b.x - 28, b.y - 18], L2: [b.x - 42, b.y - 12], L3: [b.x - 54, b.y - 4] });
  for (const b of back) s += bsp(b, legs(b.x, b.y, bs, b.f, bk(b)));

  // the matchbox
  s += shadow(300, GY - 6, 168, 16, .28);
  s += `<path d="M${pts([FR, [X1, GY], [X1 + D[0], GY + D[1]], BR])}z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.8" stroke-linejoin="round"/>`;
  // open end of the sleeve: the tray's end wall inside it
  s += `<path d="M${pts([[X1 + 5, GY - Hh + 6], [X1 + 5, GY - 5], [X1 + D[0] - 4, GY + D[1] + 2], [X1 + D[0] - 4, GY - Hh + D[1] + 10]])}z" fill="${C.parch}" stroke="${C.ink}" stroke-width="1.8"/>`;
  s += `<rect x="${X0}" y="${GY - Hh}" width="${X1 - X0}" height="${Hh}" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.8"/>`;
  // striker strip along the long side
  s += `<rect x="${X0 + 10}" y="${GY - Hh + 14}" width="${X1 - X0 - 20}" height="22" fill="${C.soft}" stroke="${C.ink}" stroke-width="1.8"/>`;
  s += stipple(11, (X0 + X1) / 2, GY - Hh + 25, (X1 - X0) / 2 - 14, 9, 240, 1, C.ink, .55);
  s += `<path d="M${X0} ${GY - Hh + 6}H${X1}M${X0} ${GY - 6}H${X1}" stroke="${C.gold}" stroke-width="2.4"/>`;
  // top face (the label)
  s += `<path d="M${pts([FL, FR, BR, BL])}z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.8" stroke-linejoin="round"/>`;
  s += `<path d="M${pts([[FL[0] + 7, FL[1] - 4], [FR[0] - 3, FR[1] - 4], [BR[0] - 7, BR[1] + 4], [BL[0] + 3, BL[1] + 4]])}z" fill="none" stroke="${C.gold}" stroke-width="2.2"/>`;
  // the blueprint, lying flat on the top face (drawn in the face's own coordinates)
  {
    const M = mat(FL, [X1 - X0, 0], D);
    let b = `<g transform="${M}"><g transform="rotate(-2 .5 .5)">`;
    b += `<rect x=".07" y=".1" width=".86" height=".8" fill="${C.deep}" stroke="${C.ink}" stroke-width="2"${NS}/>`;
    let g = "";
    for (let u = .12; u < .9; u += .06) g += `M${n(u * 100) / 100} .12V.88`;
    for (let v = .16; v < .88; v += .12) g += `M.09 ${n(v * 100) / 100}H.91`;
    b += `<path d="${g}" stroke="${C.soft}" stroke-width=".8" fill="none"${NS}/>`;
    b += `<path d="M.14 .2H.86V.8H.14ZM.44 .2V.52M.44 .66V.8M.44 .52H.62M.62 .52V.8M.62 .2V.34" stroke="${C.cream}" stroke-width="2"${NS} fill="none"/>`;
    b += `<path d="M.18 .72Q.3 .5 .5 .6T.76 .36" stroke="${C.goldB}" stroke-width="1.8" fill="none" stroke-dasharray="4 3"${NS}/>`;
    b += `<path d="M.76 .24l.012 .07.05 .01-.036 .04.01 .07-.036-.035-.036 .035.01-.07-.036-.04.05-.01z" fill="${C.goldB}"/>`;
    b += `<path d="M.18 .36q.04 .02 .08 0t.08 0M.66 .68q.03 .02 .06 0t.06 0" stroke="${C.cream}" stroke-width="1.3" fill="none"${NS}/>`;
    b += `</g></g>`;
    s += b;
  }
  // pass 2: back spiders' forelegs (on the blueprint) and bodies, drawn over the box
  for (const b of back) { const lo = legs(b.x, b.y, bs, b.f, bk(b)); s += bsp(b, noLegs({ R0: lo.R0, L0: lo.L0 })); }

  // a spent match lying on the floor in front
  s += shadow(300, GY + 22, 64, 4, .25);
  s += `<path d="M246 ${GY + 20}L344 ${GY + 16}" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/><path d="M248 ${GY + 20}L342 ${GY + 16}" stroke="${C.parch}" stroke-width="4.5" stroke-linecap="round"/>`;
  s += `<ellipse cx="348" cy="${GY + 16}" rx="9" ry="6" fill="${C.deep}" stroke="${C.ink}" stroke-width="1.8"/>`;
  s += `<path d="M352 ${GY + 8}q-4 -8 2 -14M346 ${GY + 6}q5 -10 -1 -18" stroke="${C.soft}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`;

  // side spiders on the floor, forelegs up on the table edge
  const fs = .82;
  {
    const x = 112, P1 = standOn(x, GY, fs, { R0: [162, 331], R1: [150, GY] }, { R0: [150, 316] });
    s += shadow(x + 4, GY, 60, 6, .25);
    s += sp({ ...P1, legW: LW, look: [1, -.4], mouth: "o", brow: "up", mark: "stripe", hat: "goggles" });
  }
  {
    const x = 498, P1 = standOn(x, GY, fs, { L0: [428, 330] }, { L0: [446, 312] });
    s += shadow(x - 4, GY, 60, 6, .25);
    s += sp({ ...P1, legW: LW, look: [-1, -.5], mouth: "grin", mark: "star" });
  }
  return V("Four spider crooks huddle over a blueprint spread on a matchbox table", s);
}

// ================================================================
// 2. Cat nap: a cat asleep in a round basket, a spider tiptoeing past
// ================================================================
const Z = (x, y, h, c = C.soft) => line(`M${n(x - h * .35)} ${n(y - h / 2)}h${n(h * .7)}l${n(-h * .7)} ${n(h)}h${n(h * .7)}`, Math.max(2, h * .13), c);

export function spot_cat_nap() {
  const P = "scn";
  let s = glow(P, 300, 250, 295, 205);
  const GY = 436;
  s += room(P, { sk: 206, skH: 40, gy: GY });
  s += floor(P, GY, 24, 576);
  const bx = 250, ry0 = 282, rrx = 160, rry = 46, by0 = 380, brx = 136, bry = 36;
  const rimFront = x => ry0 + rry * Math.sqrt(Math.max(0, 1 - ((x - bx) / rrx) ** 2));

  // the cat's bowl by the skirting (back right), on the floor
  {
    const x = 510, y = 300;
    s += shadow(x + 3, y, 46, 7, .25);
    s += `<path d="M${x - 40} ${y - 24}L${x - 30} ${y - 4}q30 10 60 0L${x + 40} ${y - 24}z" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += `<ellipse cx="${x}" cy="${y - 24}" rx="40" ry="10" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += `<ellipse cx="${x}" cy="${y - 23}" rx="32" ry="6.5" fill="${C.deep}"/>`;
    const R = rng(5); let k = "";
    for (let i = 0; i < 14; i++) k += `<ellipse cx="${n(x - 24 + R() * 48)}" cy="${n(y - 25 + R() * 5)}" rx="3.4" ry="2" fill="${C.gold}" stroke="${C.ink}" stroke-width=".8"/>`;
    s += k;
    s += `<path d="M${x - 30} ${y - 16}q4 8 12 10" stroke="${C.cream}" stroke-width="2.4" fill="none" opacity=".5" stroke-linecap="round"/>`;
  }
  // a ball of yarn with its loose end trailing on the floor (front left)
  {
    const x = 62, y = 420, r = 24;
    s += shadow(x + 4, y + r - 2, 30, 5, .3);
    s += line(`M${x + 18} ${y + r - 4}q30 6 40 -2t36 4`, 2.4, C.good);
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.good}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += `<path d="M${x - 20} ${y - 8}q20 -10 40 6M${x - 22} ${y + 4}q22 -12 42 8M${x - 12} ${y + 18}q14 -18 30 -2M${x - 6} ${y - 22}q-8 22 4 44M${x + 8} ${y - 22}q-10 22 2 44" stroke="${C.cream}" opacity=".6" stroke-width="2" fill="none"/>`;
  }

  // basket: contact shadow, inner back wall, then the cat, then the front wall
  s += shadow(bx + 8, by0 + bry - 4, brx + 24, 16, .3);
  s += `<ellipse cx="${bx}" cy="${ry0}" rx="${rrx}" ry="${rry}" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.8"/>`;
  s += hatch(`${P}-in`, `<ellipse cx="${bx}" cy="${ry0}" rx="${rrx}" ry="${rry}"/>`, bx - rrx, ry0 - rry, bx + rrx, ry0 + rry, 7, 90, C.ink, 1.2, .35);
  // cushion showing at the sides
  s += `<ellipse cx="${bx}" cy="${ry0 + 6}" rx="${rrx - 14}" ry="${rry - 10}" fill="${C.cream}" stroke="${C.ink}" stroke-width="2"/>`;
  // the cat's curled body (back and haunch), inside the basket
  const cat = C.gold, str = C.ox;
  s += `<ellipse cx="268" cy="262" rx="134" ry="62" fill="${cat}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<path d="M300 212q6 -8 18 -10M330 206q8 -4 18 0M362 214q8 0 14 8M236 206q4 -6 14 -8M206 212q2 -6 10 -10" stroke="${str}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M232 222q30 -18 70 -10" stroke="${C.goldB}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`;
  // tail: from behind the haunch, draped over the rim, hanging down outside the basket
  const tail = `M378 262Q414 266 418 296Q420 326 414 348Q410 368 424 374Q436 376 434 362`;
  s += line(tail, 26, C.ink) + line(tail, 19, cat) + line(`M404 270l6 -14M418 296h-16M418 324l-16 -2M414 348l-15 -3`, 5, str);
  s += `<ellipse cx="330" cy="248" rx="62" ry="44" fill="${cat}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += line(`M318 208q8 -4 18 0M350 214q8 0 14 8`, 5, str);
  // basket front wall (over the cat)
  {
    let d = `M${bx - rrx} ${ry0}`;
    for (let i = 0; i <= 40; i++) { const x = bx - rrx + i / 40 * 2 * rrx; d += `L${n(x)} ${n(rimFront(x))}`; }
    d += `L${bx + brx} ${by0}A${brx} ${bry} 0 0 1 ${bx - brx} ${by0}z`;
    s += `<path d="${d}" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.8" stroke-linejoin="round"/>`;
    // wicker: horizontal rows following the curvature, and staggered upright weaves
    let w = "";
    for (let k = 1; k < 6; k++) {
      const t = k / 6, cy = ry0 + (by0 - ry0) * t, rx = rrx + (brx - rrx) * t, ryy = rry + (bry - rry) * t;
      w += `M${n(bx - rx)} ${n(cy)}A${n(rx)} ${n(ryy)} 0 0 0 ${n(bx + rx)} ${n(cy)}`;
    }
    s += `<clipPath id="${P}-fw"><path d="${d}"/></clipPath>`;
    s += `<path d="${w}" stroke="${C.ink}" stroke-width="1.6" fill="none" opacity=".55" clip-path="url(#${P}-fw)"/>`;
    let u = "";
    for (let k = 0; k < 6; k++) {
      const t0 = k / 6, t1 = (k + 1) / 6;
      for (let j = -9; j <= 9; j++) {
        const a = (j + (k % 2) * .5) / 10.2; if (Math.abs(a) > .98) continue;
        const x0 = bx + a * (rrx + (brx - rrx) * t0), x1 = bx + a * (rrx + (brx - rrx) * t1);
        const y0 = ry0 + (by0 - ry0) * t0 + (rry + (bry - rry) * t0) * Math.sqrt(1 - a * a);
        const y1 = ry0 + (by0 - ry0) * t1 + (rry + (bry - rry) * t1) * Math.sqrt(1 - a * a);
        u += `M${n(x0 + (x1 - x0) * .2)} ${n(y0 + (y1 - y0) * .2)}L${n(x0 + (x1 - x0) * .8)} ${n(y0 + (y1 - y0) * .8)}`;
      }
    }
    s += `<path d="${u}" stroke="${C.goldB}" stroke-width="3.2" fill="none" stroke-linecap="round" clip-path="url(#${P}-fw)"/>`;
    s += `<path d="${u}" stroke="${C.ink}" stroke-width=".8" fill="none" opacity=".3" clip-path="url(#${P}-fw)"/>`;
    // thick rolled rim
    let rd = `M${bx - rrx} ${ry0}`;
    for (let i = 0; i <= 40; i++) { const x = bx - rrx + i / 40 * 2 * rrx; rd += `L${n(x)} ${n(rimFront(x))}`; }
    s += line(rd, 12, C.ink) + line(rd, 7, C.goldB) + line(rd, 1.2, C.gold);
  }
  // the tail again where it lies over the rim and hangs outside the wall
  {
    const t2 = `M418 290Q420 326 414 348Q410 368 424 374Q436 376 434 362`;
    s += line(t2, 26, C.ink) + line(t2, 19, cat) + line(`M418 296h-16M418 324l-16 -2M414 348l-15 -3`, 5, str);
    s += line(`M414 298q-4 20 -4 40`, 3, C.goldB, ` opacity=".6"`);
  }
  // front paw draped over the rim
  {
    const x = 262, y = rimFront(262);
    s += line(`M258 ${n(y - 34)}Q262 ${n(y - 10)} 262 ${n(y + 4)}`, 30, C.ink) + line(`M258 ${n(y - 34)}Q262 ${n(y - 10)} 262 ${n(y + 4)}`, 23, cat);
    s += `<ellipse cx="${x}" cy="${n(y + 10)}" rx="21" ry="13" fill="${cat}" stroke="${C.ink}" stroke-width="2.6"/>`;
    s += `<path d="M${x - 7} ${n(y + 13)}v8M${x} ${n(y + 14)}v9M${x + 7} ${n(y + 13)}v8" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`;
    s += line(`M250 ${n(y - 26)}l14 -2`, 4.5, str);
  }
  // head resting on the rim, face to us, both eyes closed
  {
    const hx = 178, hy = 282;
    // ears
    s += `<path d="M${hx - 50} ${hy - 12}L${hx - 46} ${hy - 66}L${hx - 12} ${hy - 38}z" fill="${cat}" stroke="${C.ink}" stroke-width="2.8" stroke-linejoin="round"/>`;
    s += `<path d="M${hx - 42} ${hy - 22}L${hx - 40} ${hy - 54}L${hx - 20} ${hy - 38}z" fill="${C.cream}"/>`;
    s += `<path d="M${hx + 50} ${hy - 12}L${hx + 46} ${hy - 66}L${hx + 12} ${hy - 38}z" fill="${cat}" stroke="${C.ink}" stroke-width="2.8" stroke-linejoin="round"/>`;
    s += `<path d="M${hx + 42} ${hy - 22}L${hx + 40} ${hy - 54}L${hx + 20} ${hy - 38}z" fill="${C.cream}"/>`;
    s += `<ellipse cx="${hx}" cy="${hy}" rx="56" ry="44" fill="${cat}" stroke="${C.ink}" stroke-width="3"/>`;
    s += `<path d="M${hx} ${hy - 44}l-5 14h10zM${hx - 18} ${hy - 42}l-2 10h6zM${hx + 18} ${hy - 42}l2 10h-6z" fill="${str}"/>`;
    s += `<path d="M${hx - 56} ${hy + 2}l14 -2M${hx - 55} ${hy + 12}l13 -5M${hx + 56} ${hy + 2}l-14 -2M${hx + 55} ${hy + 12}l-13 -5" stroke="${str}" stroke-width="4" stroke-linecap="round"/>`;
    // muzzle
    s += `<ellipse cx="${hx - 11}" cy="${hy + 18}" rx="14" ry="11" fill="${C.cream}" stroke="${C.ink}" stroke-width="2"/>`;
    s += `<ellipse cx="${hx + 11}" cy="${hy + 18}" rx="14" ry="11" fill="${C.cream}" stroke="${C.ink}" stroke-width="2"/>`;
    s += `<path d="M${hx - 6} ${hy + 6}h12l-6 7z" fill="${C.oxB}" stroke="${C.ink}" stroke-width="1.8" stroke-linejoin="round"/>`;
    s += `<path d="M${hx} ${hy + 13}v5" stroke="${C.ink}" stroke-width="1.8"/>`;
    // closed eyes (both), with lashes
    s += line(`M${hx - 34} ${hy - 6}q12 10 24 0M${hx + 10} ${hy - 6}q12 10 24 0`, 3.2);
    s += line(`M${hx - 30} ${hy - 2}l-4 4M${hx - 22} ${hy}l-1 5M${hx + 30} ${hy - 2}l4 4M${hx + 22} ${hy}l1 5`, 2);
    // whiskers
    s += line(`M${hx - 20} ${hy + 18}l-40 -6M${hx - 20} ${hy + 22}l-40 4M${hx + 20} ${hy + 18}l40 -6M${hx + 20} ${hy + 22}l40 4`, 1.4);
    s += `<path d="M${hx - 34} ${hy - 30}q20 -12 40 -8" stroke="${C.goldB}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`;
  }
  // Zzz rising
  s += Z(118, 214, 16) + Z(96, 182, 22) + Z(70, 140, 30);

  // the spider tiptoeing past on the floor, eyes on the cat
  {
    const x = 476, gy = 428, sc = .8;
    s += shadow(x + 2, gy, 44, 5, .25);
    const P1 = standOn(x, gy, sc, {
      R0: [x + 14, gy], L0: [x - 14, gy], R1: [x + 32, gy - 16], L1: [x - 28, gy], R2: [x + 40, gy], L2: [x - 40, gy - 14], R3: [x + 50, gy], L3: [x - 50, gy],
    }, { R0: [x + 22, gy - 44], L0: [x - 22, gy - 44], R1: [x + 34, gy - 50], L1: [x - 34, gy - 46], R2: [x + 44, gy - 38], L2: [x - 46, gy - 40], R3: [x + 52, gy - 30], L3: [x - 52, gy - 30] });
    P1.y = gy - 34;
    Object.assign(P1, standOn(x, gy, sc, {}), { y: gy - 34 });
    P1.legOverride = legs(x, gy - 34, sc, {
      R0: [x + 14, gy], L0: [x - 14, gy], R1: [x + 32, gy - 16], L1: [x - 28, gy], R2: [x + 40, gy], L2: [x - 42, gy - 14], R3: [x + 52, gy], L3: [x - 52, gy],
    }, { R0: [x + 22, gy - 60], L0: [x - 22, gy - 60], R1: [x + 36, gy - 62], L1: [x - 36, gy - 60], R2: [x + 46, gy - 50], L2: [x - 48, gy - 54], R3: [x + 56, gy - 40], L3: [x - 56, gy - 40] });
    s += sp({ ...P1, s: sc, look: [-1, -.5], mouth: "worried", brow: "worried", mark: "chevron" });
    // tiptoe marks: little arcs where the lifted feet came from
    s += line(`M${x + 44} ${gy - 20}q6 -8 12 0M${x - 58} ${gy - 18}q6 -8 12 0`, 1.8, C.ink, ` opacity=".5"`);
    s += line(`M${x + 70} ${gy - 30}h10M${x + 72} ${gy - 20}h14`, 2, C.ink, ` opacity=".4"`);
  }
  return V("A spider tiptoes past a cat asleep in its basket", `<g transform="translate(0 -26)">${s}</g>`);
}

// A coin lying flat on a surface: x centre, y = contact (lowest point of the edge).
function flatCoin(x, y, r, o = {}) {
  const ry = r * .34, t = Math.max(2, r * .14), cy = y - t - ry;
  return shadow(x + 2, y - ry * .4, r * 1.1, ry * .8, .28) +
    `<path d="M${n(x - r)} ${n(cy)}v${n(t)}a${n(r)} ${n(ry)} 0 0 0 ${n(2 * r)} 0v${n(-t)}z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.8"/>` +
    `<ellipse cx="${n(x)}" cy="${n(cy)}" rx="${n(r)}" ry="${n(ry)}" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.8"/>` +
    `<ellipse cx="${n(x)}" cy="${n(cy)}" rx="${n(r * .72)}" ry="${n(ry * .72)}" fill="none" stroke="${C.gold}" stroke-width="1.4"/>`;
}

// ================================================================
// 3. Vacuum ride: a spider surfing a robot vacuum across the floor
// ================================================================
export function spot_vacuum_ride() {
  const P = "svr";
  let s = glow(P, 300, 240, 295, 205);
  const GY = 426;
  s += room(P, { sk: 196, skH: 40, gy: GY });
  s += floor(P, GY, 24, 576);
  // its charging dock by the skirting (left), empty: the vacuum has left it
  {
    const x = 92, y = 212;
    s += shadow(x + 4, y, 40, 5, .3);
    s += `<path d="M${x - 30} ${y}V${y - 44}q0 -10 10 -10h40q10 0 10 10V${y}z" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += `<path d="M${x - 36} ${y}h72v-8h-72z" fill="${C.soft}" stroke="${C.ink}" stroke-width="2"/>`;
    s += `<circle cx="${x}" cy="${y - 36}" r="5" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.6"/>`;
    s += `<path d="M${x - 16} ${y - 18}h8M${x + 8} ${y - 18}h8" stroke="${C.gold}" stroke-width="3" stroke-linecap="round"/>`;
  }
  // a coin ahead on the floor: where they are headed
  s += flatCoin(528, 404, 22) + sparkle(544, 372, 7);

  const vx = 296, top = 296, rx = 172, ry = 50, band = 38;
  const bot = top + band, lowY = bot + ry;
  const arcY = (x, yc) => yc + ry * Math.sqrt(Math.max(0, 1 - ((x - vx) / rx) ** 2));
  // motion lines trailing behind (left) and dust kicked up along its track
  s += line(`M34 286h78M20 312h96M44 338h70M28 364h86`, 3, C.ink, ` opacity=".55"`);
  s += line(`M64 298h36M54 350h44`, 2, C.ink, ` opacity=".3"`);
  const puff = (x, y, r) => `<path d="M${n(x - r)} ${n(y)}a${n(r * .6)} ${n(r * .6)} 0 0 1 ${n(r * .7)} ${n(-r * .6)}a${n(r * .7)} ${n(r * .7)} 0 0 1 ${n(r * 1.1)} ${n(-r * .1)}a${n(r * .55)} ${n(r * .55)} 0 0 1 ${n(r * .2)} ${n(r * .7)}z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.6" opacity=".9"/>`;
  s += puff(112, 388, 15) + puff(78, 384, 10) + puff(52, 381, 6);

  // spinning side brush under the front edge: only the bristles poke out, sweeping the floor
  {
    const bx = vx + 140, by = arcY(vx + 140, bot) + 5;
    s += `<ellipse cx="${bx + 6}" cy="${n(by + 4)}" rx="36" ry="9" fill="none" stroke="${C.ink}" stroke-width="1.4" stroke-dasharray="5 4" opacity=".55"/>`;
    s += line(`M${bx} ${n(by)}q20 -2 38 4M${bx} ${n(by)}q16 6 30 14M${bx} ${n(by)}q4 8 6 16`, 2.2, C.ink);
    s += line(`M${bx + 38} ${n(by + 4)}l4 -3M${bx + 30} ${n(by + 14)}l4 1M${bx + 6} ${n(by + 16)}l-3 3`, 1.6, C.ink);
  }
  // the robot vacuum
  s += shadow(vx + 6, lowY - 2, rx + 14, 17, .38);
  s += `<path d="M${vx - rx} ${top}v${band}a${rx} ${ry} 0 0 0 ${2 * rx} 0v${-band}z" fill="${C.deep}" stroke="${C.ink}" stroke-width="3"/>`;
  // front bumper (the right half: it is travelling right), a seam and a vent grille
  {
    const x0 = vx + 20;
    s += `<path d="M${x0} ${n(arcY(x0, top) + 3)}A${rx} ${ry} 0 0 0 ${vx + rx - 1} ${top + 3}v${band - 8}A${rx} ${ry} 0 0 1 ${x0} ${n(arcY(x0, bot) - 5)}z" fill="${C.plum}" stroke="${C.ink}" stroke-width="2"/>`;
    s += line(`M${x0 + 16} ${n(arcY(x0 + 16, top) + 8)}A${rx} ${ry} 0 0 0 ${vx + rx - 12} ${top + 10}`, 2.4, C.soft);
  }
  s += line(`M${vx - 132} ${top + 30}v16M${vx - 120} ${top + 34}v16M${vx - 108} ${top + 37}v16M${vx - 96} ${top + 40}v16`, 2.6, C.plum);
  s += `<path d="M${vx - rx + 10} ${top + 10}q0 18 6 28" stroke="${C.soft}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  // top plate, button and status light
  s += `<ellipse cx="${vx}" cy="${top}" rx="${rx}" ry="${ry}" fill="${C.soft}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<ellipse cx="${vx}" cy="${top}" rx="${rx - 18}" ry="${ry - 7}" fill="none" stroke="${C.plum}" stroke-width="2"/>`;
  s += `<path d="M${vx - rx + 26} ${top - 18}q70 -34 170 -30" stroke="${C.edge}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`;
  s += `<ellipse cx="${vx + 108}" cy="${top + 22}" rx="16" ry="6" fill="${C.plum}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<ellipse cx="${vx + 108}" cy="${top + 21}" rx="9" ry="3.2" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.2"/>`;
  s += `<ellipse cx="${vx - 110}" cy="${top + 22}" rx="6" ry="2.6" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.2"/>`;
  // the rider: seven feet planted on the top plate, one leg waved high
  {
    const x = vx - 8, gy = top + 6, sc = 1.15;
    s += shadow(x, gy, 70, 8, .3);
    const P1 = standOn(x, gy, sc, { R0: [x + 70, gy - 108] }, { R0: [x + 64, gy - 60] });
    s += sp({ ...P1, look: [1, -.3], mouth: "big", brow: "up", mark: "chevron", hat: "goggles" });
    s += line(`M${x + 84} ${gy - 116}q8 6 6 16M${x + 92} ${gy - 122}q14 10 10 26`, 2.2, C.ink, ` opacity=".5"`);
  }
  return V("A spider rides a robot vacuum across the floor like a surfboard", s);
}

// A toothpick from a to b (both ends pointed), drawn as a wooden stick of width w.
function toothpick(a, b, w = 6) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px = -uy * w / 2, py = ux * w / 2, tp = w * 2.4;
  const p = [a, [a[0] + ux * tp + px, a[1] + uy * tp + py], [b[0] - ux * tp + px, b[1] - uy * tp + py], b, [b[0] - ux * tp - px, b[1] - uy * tp - py], [a[0] + ux * tp - px, a[1] + uy * tp - py]];
  return `<path d="M${pts(p)}z" fill="${C.parch}" stroke="${C.ink}" stroke-width="1.8" stroke-linejoin="round"/>` +
    line(`M${n(a[0] + ux * tp + px * .3)} ${n(a[1] + uy * tp + py * .3)}L${n(b[0] - ux * tp + px * .3)} ${n(b[1] - uy * tp + py * .3)}`, 1.2, C.gold);
}

// ================================================================
// 4. Jar rescue: a spider trapped in a jar; the crew pry the lid with a toothpick lever
// ================================================================
export function spot_jar_rescue() {
  const P = "sjr";
  let s = glow(P, 300, 225, 295, 210);
  const TY = 398; // table front edge
  s += tabletop(P, TY, 26, 574, { depth: 130, thick: 20, top: C.edge, edge: C.gold });
  const jx = 176, base = 370, bw = 80, bry = 15;
  const skB = 206, skT = 186, lrx = 70, lry = 13;
  // jar: shadow, glass back, the trapped spider, glass front
  s += shadow(jx + 8, base - 2, bw + 16, 12, .3);
  const jarPath = `M${jx - bw} ${base - bry}V${skB + 34}Q${jx - bw} ${skB + 14} ${jx - lrx + 4} ${skB + 10}V${skB}H${jx + lrx - 4}V${skB + 10}Q${jx + bw} ${skB + 14} ${jx + bw} ${skB + 34}V${base - bry}A${bw} ${bry} 0 0 1 ${jx - bw} ${base - bry}z`;
  s += `<path d="${jarPath}" fill="${C.cream}" opacity=".6"/>`;
  s += `<ellipse cx="${jx}" cy="${base - bry}" rx="${bw - 4}" ry="${bry - 3}" fill="${C.parch}" stroke="${C.ink}" stroke-width="1.4" opacity=".8"/>`;
  s += line(`M${jx - bw + 2} ${skB + 34}A${bw - 2} ${bry} 0 0 1 ${jx + bw - 2} ${skB + 34}`, 1.4, C.ink, ` opacity=".35"`);
  // trapped spider on the jar floor, waving up at the rescue
  {
    const x = jx - 6, gy = base - bry + 2, sc = .72;
    s += shadow(x, gy, 44, 5, .25);
    s += sp({ ...standOn(x, gy, sc, { R0: [x + 34, gy - 76] }, { R0: [x + 36, gy - 46] }), look: [.7, -1], mouth: "o", brow: "worried", mark: "dots" });
    s += line(`M${x + 40} ${gy - 88}q6 4 5 12M${x + 46} ${gy - 92}q10 6 8 18`, 1.8, C.ink, ` opacity=".5"`);
  }
  // glass front: outline, reflections
  s += `<path d="${jarPath}" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += line(`M${jx - bw + 14} ${skB + 44}V${base - 30}M${jx - bw + 26} ${skB + 52}V${skB + 84}`, 5, "#fff", ` opacity=".75"`);
  s += line(`M${jx + bw - 14} ${skB + 60}V${base - 40}`, 3, "#fff", ` opacity=".55"`);
  s += `<path d="M${jx - lrx + 2} ${skB + 4}h${2 * lrx - 4}" stroke="${C.ink}" stroke-width="2" opacity=".5"/>`;
  // screw lid with punched air holes
  s += `<path d="M${jx - lrx} ${skT}V${skB}A${lrx} ${lry * .5} 0 0 0 ${jx + lrx} ${skB}V${skT}z" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.6"/>`;
  { let r = ""; for (let k = -5; k <= 5; k++) r += `M${jx + k * 12.5} ${skT + 5 + Math.abs(k) * -.2}v${14 - Math.abs(k) * .6}`; s += line(r, 1.6, C.plum); }
  s += `<ellipse cx="${jx}" cy="${skT}" rx="${lrx}" ry="${lry}" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.6"/>`;
  for (const [hx, hy] of [[-34, -2], [-12, -5], [12, -5], [34, -2], [-22, 5], [0, 3], [22, 5]]) s += `<ellipse cx="${jx + hx}" cy="${skT + hy}" rx="3.4" ry="1.6" fill="${C.deep}"/>`;
  s += line(`M${jx - 50} ${skT - 4}q20 -7 40 -8`, 2.4, C.cream, ` opacity=".8"`);

  // the cookie tin beside the jar: the rim of its lid is the fulcrum
  const tx = 410, tw = 170, th = 124;
  s += tin(tx, base, tw, th, { sw: 2.6 });
  const lidTop = base - tw * .16 - th - th * .22; // centre of the lid's top face
  // toothpick lever: tip wedged under the jar lid's skirt, resting on the tin's rim, long arm over the tin
  const T = [jx + lrx + 1, skB - 1], F = [tx - tw / 2 - 2, lidTop - 6];
  const dir = [F[0] - T[0], F[1] - T[1]], L = Math.hypot(...dir), u = [dir[0] / L, dir[1] / L];
  const at = t => [F[0] + u[0] * t, F[1] + u[1] * t];
  const E = at(196);
  let gyB = 0;
  s += toothpick([T[0] - u[0] * 8, T[1] - u[1] * 8], E, 7);
  // the lid lifting a crack on the lever side
  s += line(`M${jx + lrx + 10} ${skB - 18}l8 -8M${jx + lrx + 16} ${skB - 6}l10 -4`, 2, C.ink);
  // two crewmates standing on the tin lid, in front of the lever, bearing down on its long arm
  {
    const sc = .62, gy = lidTop + 15;
    const onStick = x => { const t = (x - F[0]) / u[0]; return at(t)[1] - 3.5; };
    // crewmate A on the tin lid, hauling the lever down with both forelegs hooked over it
    {
      const x = 368, xl = x - 11, xr = x + 11;
      s += shadow(x + 4, gy, 38, 4, .25);
      s += sp({ ...standOn(x, gy, sc, { L0: [xl, onStick(xl)], R0: [xr, onStick(xr)] }, { L0: [x - 30, onStick(xl) - 4], R0: [x + 28, onStick(xr) - 4] }), look: [-.6, -.8], mouth: "flat", brow: "down", mark: "stripe" });
    }
    // crewmate B standing on the long end of the lever, all eight feet gripping it, weighing it down
    {
      const x = 470, sp4 = [9, 20, 31, 40], f = {}, k = {};
      for (let i = 0; i < 4; i++) {
        f["R" + i] = [x + sp4[i], onStick(x + sp4[i]) + 1]; f["L" + i] = [x - sp4[i], onStick(x - sp4[i]) + 1];
        k["R" + i] = [x + sp4[i] * .7 + 6, onStick(x) - 30 + i * 5]; k["L" + i] = [x - sp4[i] * .7 - 6, onStick(x) - 30 + i * 5];
      }
      const y = onStick(x) - 17;
      s += sp({ x, y, s: sc, legOverride: legs(x, y, sc, f, k), look: [-1, .5], mouth: "grin", brow: "down", mark: "chevron", hat: "goggles" });
      gyB = y;
    }
    s += line(`M504 ${n(gyB - 14)}l6 8M500 ${n(gyB + 4)}l8 4`, 2, C.ink, ` opacity=".55"`);
  }
  // a spoon lying flat on the table (left)
  s += shadow(66, 388, 44, 4, .25);
  s += `<path d="M34 392L80 384" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/><path d="M34 392L80 384" stroke="${C.soft}" stroke-width="3.6" stroke-linecap="round"/>`;
  s += `<ellipse cx="96" cy="381" rx="18" ry="6.5" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.2" transform="rotate(-8 96 381)"/>`;
  s += `<ellipse cx="96" cy="380" rx="11" ry="3.4" fill="${C.edge}" opacity=".6" transform="rotate(-8 96 380)"/>`;
  return V("Two spiders on a cookie tin lever the lid off a jar to free a trapped crewmate", `<g transform="translate(0 -14)">${s}</g>`);
}

// ================================================================
// 5. Silk swing: a spider swings on a line anchored under a wall shelf, over the gap between counters
// ================================================================
export function spot_silk_swing() {
  const P = "sss";
  let s = glow(P, 300, 220, 295, 215);
  const CT = 300, CB = 270, gap0 = 222, gap1 = 378; // counter front edge, counter back (wall line), gap
  // tiled backsplash wall
  {
    let c = `<rect x="20" y="104" width="560" height="${CB - 104}" fill="${C.cream}"/>`;
    let d = "";
    for (let y = CB - 34; y > 104; y -= 34) d += `M20 ${y}H580`;
    for (let x = 30; x < 580; x += 34) d += `M${x} 104V${CB}`;
    c += `<path d="${d}" stroke="${C.edge}" stroke-width="2.2"/>`;
    c += stipple(8, 300, 190, 270, 80, 90, .9, C.edge, .6);
    s += faded(`${P}-tl`, 20, 580, c, { top: [104, 150] });
  }
  // the gap between the counters: a dark drop, fading out below
  {
    s += `<defs><linearGradient id="${P}-gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.soft}"/><stop offset=".35" stop-color="${C.deep}"/><stop offset="1" stop-color="${C.deep}" stop-opacity="0"/></linearGradient></defs>`;
    s += `<rect x="${gap0}" y="${CB}" width="${gap1 - gap0}" height="${450 - CB - 6}" fill="url(#${P}-gp)"/>`;
  }
  // the two counters: top surface, stone front edge, cabinet doors fading out below
  const counter = (x0, x1, id, knobSide) => {
    let c = `<rect x="${x0}" y="${CB}" width="${x1 - x0}" height="${CT - CB}" fill="${C.parch}"/>`;
    c += `<path d="M${x0} ${CB}H${x1}" stroke="${C.ink}" stroke-width="1.6" opacity=".6"/>`;
    c += `<rect x="${x0}" y="${CT}" width="${x1 - x0}" height="16" fill="${C.plum}"/>`;
    c += `<path d="M${x0} ${CT}H${x1}M${x0} ${CT + 16}H${x1}" stroke="${C.ink}" stroke-width="2.6"/>`;
    c += `<rect x="${x0}" y="${CT + 16}" width="${x1 - x0}" height="${450 - CT - 20}" fill="${C.edge}"/>`;
    const dx0 = x0 + 12, dx1 = x1 - 12, mid = (dx0 + dx1) / 2;
    c += `<path d="M${dx0} ${CT + 26}H${mid - 4}V446H${dx0}zM${mid + 4} ${CT + 26}H${dx1}V446H${mid + 4}z" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.2"/>`;
    c += `<path d="M${dx0 + 12} ${CT + 38}H${mid - 16}V446M${dx0 + 12} ${CT + 38}V446M${mid + 16} ${CT + 38}H${dx1 - 12}V446M${mid + 16} ${CT + 38}V446" stroke="${C.ink}" stroke-width="1.2" fill="none" opacity=".4"/>`;
    c += `<rect x="${mid - 14}" y="${CT + 44}" width="5" height="22" rx="2.5" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.4"/><rect x="${mid + 9}" y="${CT + 44}" width="5" height="22" rx="2.5" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.4"/>`;
    c += `<path d="M${x0} ${CB}V446M${x1} ${CB}V446" stroke="${C.ink}" stroke-width="2.6"/>`;
    const mx0 = knobSide === "L" ? x0 - 20 : x0, mx1 = knobSide === "L" ? x1 : x1 + 20;
    return `<defs>${fadeMask(id, mx0, mx1, { edge: knobSide === "L" ? .2 : 0, top: null })}<linearGradient id="${id}-b" x1="0" y1="0" x2="0" y2="1"><stop offset=".62" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="${id}-v" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="450"><rect x="0" y="0" width="600" height="450" fill="url(#${id}-b)"/></mask></defs><g mask="url(#${id}-v)">${c}</g>`;
  };
  // horizontal fade for the outer ends only: left counter fades left, right counter fades right
  const cL = counter(20, gap0, `${P}-cl`, "L"), cR = counter(gap1, 580, `${P}-cr`, "R");
  s += `<defs>${fadeMask(`${P}-ch`, 20, 580, { edge: .1 })}</defs><g mask="url(#${P}-ch)">${cL}${cR}</g>`;

  // wall shelf on two screwed L-brackets, with a jar and a mug on it
  const SX0 = 150, SX1 = 450, ST = 84, SF = 98, SU = 106; // shelf top, front-edge bottom, underside
  s += `<path d="M205 ${ST + 6}V${ST - 42}q0 -6 6 -6h28q6 0 6 6V${ST + 6}z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.4" opacity=".95"/>`;
  s += `<rect x="202" y="${ST - 50}" width="46" height="10" rx="3" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.2"/>`;
  s += `<path d="M211 ${ST - 26}h28" stroke="${C.gold}" stroke-width="10" opacity=".5"/>`;
  s += `<path d="M352 ${ST + 6}V${ST - 30}h40V${ST + 6}z" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += `<path d="M392 ${ST - 22}q16 0 16 12t-16 12" stroke="${C.ink}" stroke-width="7" fill="none"/><path d="M392 ${ST - 22}q16 0 16 12t-16 12" stroke="${C.soft}" stroke-width="3" fill="none"/>`;
  s += `<path d="M${SX0} ${SF}L${SX0 + 10} ${SU}H${SX1 - 10}L${SX1} ${SF}z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<rect x="${SX0}" y="${ST}" width="${SX1 - SX0}" height="${SF - ST}" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += line(`M${SX0 + 20} ${ST + 7}h90M${SX0 + 150} ${ST + 9}h110`, 1.4, C.goldB, ` opacity=".8"`);
  for (const bx of [190, 410]) {
    s += `<path d="M${bx - 5} ${SU}V${SU + 50}h10V${SU + 14}h0z" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
    s += `<path d="M${bx + 5} ${SU + 40}L${bx + (bx < 300 ? 32 : -32)} ${SU}" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><path d="M${bx + 5} ${SU + 40}L${bx + (bx < 300 ? 32 : -32)} ${SU}" stroke="${C.soft}" stroke-width="2.6" stroke-linecap="round"/>`;
    s += `<rect x="${bx - (bx < 300 ? 5 : 40)}" y="${SU - 3}" width="45" height="6" fill="${C.soft}" stroke="${C.ink}" stroke-width="2"/>`;
    s += `<circle cx="${bx}" cy="${SU + 16}" r="2.4" fill="${C.ink}"/><circle cx="${bx}" cy="${SU + 38}" r="2.4" fill="${C.ink}"/>`;
  }

  // the swing: silk anchored under the shelf, spider on the arc over the gap
  const A = [300, SU + 1], R = 160, th = 11 * Math.PI / 180, sc = .92;
  const S = [A[0] + R * Math.sin(th), A[1] + R * Math.cos(th)];
  const rdeg = -11, rr = rdeg * Math.PI / 180;
  const cx = S[0] - 39 * sc * Math.sin(rr), cy = S[1] + 39 * sc * Math.cos(rr);
  // the path its body has swung along, dashed: from a take-off on the left counter, down through the gap
  {
    const Rb = Math.hypot(cx - A[0], cy - A[1]), a0 = -41 * Math.PI / 180, a1 = 1 * Math.PI / 180;
    s += `<path d="M${n(A[0] + Rb * Math.sin(a0))} ${n(A[1] + Rb * Math.cos(a0))}A${n(Rb)} ${n(Rb)} 0 0 0 ${n(A[0] + Rb * Math.sin(a1))} ${n(A[1] + Rb * Math.cos(a1))}" stroke="${C.goldB}" stroke-width="2.4" fill="none" stroke-dasharray="4 8" stroke-linecap="round"/>`;
    const t0 = [A[0] + Rb * Math.sin(a0), A[1] + Rb * Math.cos(a0)];
    // take-off scuffs on the counter top
    s += line(`M${n(t0[0] - 20)} ${CB + 16}l6 -5M${n(t0[0] - 6)} ${CB + 18}l2 -7M${n(t0[0] + 8)} ${CB + 17}l-3 -6`, 1.8, C.ink, ` opacity=".5"`);
  }
  s += `<circle cx="${A[0]}" cy="${A[1] + 1}" r="3" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.2"/>`;
  s += line(`M${A[0]} ${A[1] + 2}L${n(S[0])} ${n(S[1])}`, 1.8, C.goldB);
  s += line(`M${n(cx - 62)} ${n(cy + 4)}l-24 -4M${n(cx - 56)} ${n(cy + 20)}l-20 -5M${n(cx - 60)} ${n(cy - 14)}l-16 -3`, 2.4, C.cream, ` opacity=".7"`);
  s += sp({ x: cx, y: cy, s: sc, r: rdeg, pose: "tuck", look: [1, .2], mouth: "big", brow: "up", mark: "chevron",
    legOverride: {
      R0: [[9, -6], [28, -26], [52, -18]], R1: [[12, -2], [38, -14], [60, 0]], R2: [[13, 3], [40, 4], [56, 22]], R3: [[10, 7], [30, 18], [40, 38]],
      L0: [[-9, -6], [-24, -24], [-40, -30]], L1: [[-12, -2], [-34, -14], [-50, -8]], L2: [[-13, 3], [-36, 2], [-50, 16]], L3: [[-10, 7], [-28, 16], [-36, 34]] } });

  // the goal on the right counter: a cookie on a saucer
  s += shadow(510, CB + 22, 50, 6, .25);
  s += `<ellipse cx="510" cy="${CB + 18}" rx="46" ry="10" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.2"/>`;
  s += `<ellipse cx="510" cy="${CB + 17}" rx="30" ry="6" fill="none" stroke="${C.edge}" stroke-width="1.6"/>`;
  s += flatCookie(510, CB + 20, 26, 7, false, { shade: false }) + sparkle(540, CB - 22, 7);
  // salt shaker on the left counter
  s += shadow(70, CB + 20, 22, 4, .25);
  s += `<path d="M56 ${CB + 16}V${CB - 22}q0 -12 14 -12t14 12V${CB + 16}q-14 5 -28 0z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.2"/>`;
  s += `<path d="M56 ${CB - 18}q14 5 28 0" stroke="${C.ink}" stroke-width="1.6" fill="none"/>`;
  s += `<circle cx="66" cy="${CB - 28}" r="1.4" fill="${C.ink}"/><circle cx="72" cy="${CB - 30}" r="1.4" fill="${C.ink}"/><circle cx="76" cy="${CB - 26}" r="1.4" fill="${C.ink}"/>`;
  return V("A spider swings on a silk line from under a wall shelf across the gap between two counters", s);
}

// ================================================================
// 6. Lockpick: a spider picks a jewellery-box drawer lock with a bent pin (and a tension pin)
// ================================================================
export function spot_lockpick() {
  const P = "slp";
  let s = glow(P, 300, 225, 295, 210);
  const TY = 404;
  s += tabletop(P, TY, 26, 574, { depth: 150, thick: 20, top: C.edge, edge: C.gold });
  const X0 = 136, X1 = 464, D = [44, -44];
  const FEET = 388, PL = 372, PLT = 356, BOT = 350, TOPB = 196, LID = 164;
  // contact shadow and bun feet
  s += shadow(X0 + (X1 - X0) / 2 + 18, FEET - 2, (X1 - X0) / 2 + 30, 12, .32);
  for (const fx of [X0 + 18, X1 - 18]) s += `<path d="M${fx - 14} ${PL}q-2 16 14 16q16 0 14 -16z" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += `<path d="M${X1 + D[0] * .8 - 9} ${PL + D[1] * .8 - 2}q-1 14 9 14q10 0 9 -14z" fill="${C.deep}" stroke="${C.ink}" stroke-width="2"/>`;
  // right side face
  s += `<path d="M${X1} ${LID}L${X1 + D[0]} ${LID + D[1]}V${PL + D[1]}L${X1} ${PL}z" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += hatch(`${P}-sd`, `<path d="M${X1} ${LID}L${X1 + D[0]} ${LID + D[1]}V${PL + D[1]}L${X1} ${PL}z"/>`, X1, LID + D[1], X1 + D[0], PL, 6, 70, C.ink, 1.2, .35);
  // lid top face and lid front
  s += `<path d="M${X0 - 6} ${LID}L${X0 - 6 + D[0]} ${LID + D[1]}H${X1 + 6 + D[0]}L${X1 + 6} ${LID}z" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += `<path d="M${X0 + 30} ${LID - 10}L${X0 + 30 + D[0] * .6} ${LID - 10 + D[1] * .6}H${X1 - 30 + D[0] * .6}L${X1 - 30} ${LID - 10}z" fill="none" stroke="${C.gold}" stroke-width="2"/>`;
  s += `<rect x="${X0 - 6}" y="${LID}" width="${X1 - X0 + 12}" height="${TOPB - LID}" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += line(`M${X0 + 8} ${LID + 8}H${X1 - 60}`, 2.2, C.soft, ` opacity=".8"`);
  // clasp
  s += `<rect x="288" y="${TOPB - 16}" width="24" height="24" rx="4" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/><circle cx="300" cy="${TOPB - 4}" r="3" fill="${C.ink}"/>`;
  // carcass front and two drawers
  s += `<rect x="${X0}" y="${TOPB}" width="${X1 - X0}" height="${BOT - TOPB}" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.6"/>`;
  const drawer = (y0, y1, key) => {
    let d = `<rect x="${X0 + 12}" y="${y0}" width="${X1 - X0 - 24}" height="${y1 - y0}" rx="3" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.4"/>`;
    d += `<rect x="${X0 + 22}" y="${y0 + 8}" width="${X1 - X0 - 44}" height="${y1 - y0 - 16}" rx="2" fill="none" stroke="${C.gold}" stroke-width="1.6"/>`;
    d += line(`M${X0 + 16} ${y0 + 4}H${X1 - 16}`, 2, C.cream, ` opacity=".35"`);
    for (const kx of [X0 + 64, X1 - 64]) d += `<circle cx="${kx}" cy="${(y0 + y1) / 2}" r="7" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/><circle cx="${kx - 2}" cy="${(y0 + y1) / 2 - 2}" r="2.4" fill="${C.goldB}"/>`;
    if (key) {
      const ky = (y0 + y1) / 2;
      d += `<g transform="translate(300 ${ky}) scale(1.3) translate(-300 ${-ky})">`;
      d += `<path d="M291 ${ky - 16}h18q4 0 4 4v26q0 4 -4 4h-18q-4 0 -4 -4v-26q0 -4 4 -4z" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/>`;
      d += `<circle cx="300" cy="${ky - 3}" r="4.4" fill="${C.ink}"/><path d="M297.4 ${ky - 1}l-2 11h9.2l-2 -11z" fill="${C.ink}"/>`;
      d += `<circle cx="300" cy="${ky - 12}" r="1.2" fill="${C.ink}"/><circle cx="300" cy="${ky + 14}" r="1.2" fill="${C.ink}"/>`;
      d += line(`M292 ${ky - 13}v10`, 1.8, C.goldB) + `</g>`;
    }
    return d;
  };
  s += drawer(TOPB + 10, 270, false);
  s += drawer(280, BOT - 8, true);
  // plinth with a ledge along the front
  s += `<path d="M${X0 - 8} ${PLT}L${X0 - 8 + 10} ${BOT}H${X1 + 8 - 10}L${X1 + 8} ${PLT}z" fill="${C.soft}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<rect x="${X0 - 8}" y="${PLT}" width="${X1 - X0 + 16}" height="${PL - PLT}" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += line(`M${X0 - 2} ${PLT + 5}H${X1 + 2}`, 1.6, C.gold, ` opacity=".8"`);
  // a gold chain caught in the top drawer, hanging straight down with its pendant
  {
    let c = "";
    for (let y = TOPB + 12; y < 252; y += 7) c += `<ellipse cx="${X1 - 110}" cy="${y}" rx="2.6" ry="4" fill="none" stroke="${C.goldB}" stroke-width="1.8"/>`;
    s += `<g stroke="${C.ink}">${c.replace(/stroke="#f0cf6b"/g, `stroke="${C.ink}" stroke-opacity=".0"`)}</g>`;
    s += c;
    s += `<path d="M${X1 - 110} 252l-9 12 9 12 9 -12z" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.8" stroke-linejoin="round"/>`;
    s += sparkle(X1 - 96, 258, 6);
  }

  // the spider on the plinth ledge beside the lock, working two bent pins with its forelegs
  const ky = (280 + BOT - 8) / 2;
  {
    const sc = 1.02, x = 372, gy = PLT + 2;
    // tension pin: short end in the bottom of the keyhole, bent to run right to the second left leg
    const tw = `M${300} ${ky + 10}v5H${340}`;
    // pick: hooked tip in the top of the keyhole, shaft up-right to the first left leg, round head
    const pk = `M${300} ${ky - 2}l5 -4L${346} ${ky - 22}`;
    s += line(tw, 5.4, C.ink) + line(tw, 2.6, C.cream);
    s += line(pk, 5.4, C.ink) + line(pk, 2.6, C.cream);
    s += `<circle cx="${349}" cy="${ky - 23.5}" r="5.2" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2"/>`;
    const feet = { L0: [334, ky - 17], L1: [332, ky + 15] }, kn = { L0: [318, ky - 36], L1: [316, ky - 2] };
    s += shadow(x, gy, 62, 5, .3);
    s += sp({ ...standOn(x, gy, sc, feet, kn), look: [-1, -.6], mouth: "flat", brow: "down", mark: "chevron", mask: true });
    s += line(`M280 ${ky - 34}l-6 -6M296 ${ky - 40}v-8M312 ${ky - 36}l4 -6`, 2, C.goldB);
  }
  // a ring lying flat on the dresser top (right), and a perfume bottle
  s += shadow(530, 392, 16, 4, .25) + `<ellipse cx="530" cy="388" rx="14" ry="5" fill="none" stroke="${C.ink}" stroke-width="5"/><ellipse cx="530" cy="388" rx="14" ry="5" fill="none" stroke="${C.goldB}" stroke-width="2.4"/>`;
  s += `<path d="M524 382l6 -8 6 8z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.4"/>`;
  s += shadow(78, 380, 26, 5, .25);
  s += `<path d="M58 378V338q0 -8 8 -8h24q8 0 8 8V378q-20 5 -40 0z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.2" opacity=".95"/>`;
  s += `<path d="M62 346h32v26q-16 4 -32 0z" fill="${C.gold}" opacity=".5"/>`;
  s += `<rect x="70" y="316" width="16" height="14" rx="2" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/>`;
  s += line(`M64 340v22`, 3, "#fff", ` opacity=".7"`);
  return V("A masked spider picks the lock of a jewellery-box drawer with two bent pins", s);
}

// ================================================================
// 7. Loot haul: two spiders carry one cookie, flat and overhead, across the floor
// ================================================================
export function spot_loot_haul() {
  const P = "slh";
  let s = glow(P, 300, 230, 295, 210);
  const GY = 402;
  s += room(P, { sk: 214, skH: 44, gy: GY });
  s += floor(P, GY, 24, 576);
  // their destination: a gap under the skirting board (right), dark inside
  s += `<path d="M470 214V198q0 -16 18 -16h30q18 0 18 16V214z" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += `<path d="M472 184l-6 -6M534 186l6 -5" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/>`;
  // a trail of crumbs behind them, lying on the floor
  { const R = rng(21); let c = "";
    for (const [x, y] of [[58, 372], [84, 380], [104, 366], [130, 384], [150, 372], [66, 390], [118, 394]]) {
      const w = 3 + R() * 4;
      c += `<ellipse cx="${x}" cy="${y + 2}" rx="${n(w + 2)}" ry="1.8" fill="${C.ink}" opacity=".2"/><path d="M${n(x - w)} ${y + 1}l${n(w * .6)} ${n(-w * .9)}l${n(w * 1.2)} ${n(w * .2)}l${n(w * .3)} ${n(w * .7)}z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.2" stroke-linejoin="round"/>`;
    }
    s += c; }

  const cx = 302, r = 104, cyBot = 322; // cookie centre x, radius, lowest point of its edge
  const ry = r * .34, t = r * .17, yTop = cyBot - t - ry;
  const rimBot = x => yTop + t + ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / r) ** 2));
  // (the porters and their cookie are drawn in a group scaled up about the floor line)
  const s0 = s; s = "";
  // the cookie's shadow on the floor beneath it
  s += `<ellipse cx="${cx + 8}" cy="${GY - 8}" rx="${r + 10}" ry="16" fill="${C.ink}" opacity=".16"/>`;
  // two porters: four legs walking, forelegs and second legs raised to hold the cookie up
  const sc = 1.02, porters = [
    { x: 240, look: [.3, -.6], mouth: "flat", brow: "down", mark: "stripe" },
    { x: 366, look: [-.2, -.6], mouth: "grin", brow: "up", mark: "chevron", hat: "goggles" },
  ];
  for (const p of porters) {
    const x = p.x, y = GY - 26 * sc;
    const up = { R0: [x + 16, rimBot(x + 16) - 5], L0: [x - 16, rimBot(x - 16) - 5], R1: [x + 34, rimBot(x + 34) - 5], L1: [x - 34, rimBot(x - 34) - 5] };
    const kn = { R0: [x + 34, y - 22], L0: [x - 34, y - 22], R1: [x + 56, y - 12], L1: [x - 56, y - 12] };
    s += shadow(x + 2, GY, 64, 6, .28);
    s += sp({ ...standOn(x, GY, sc, { ...up, R2: [x + 48, GY], L2: [x - 46, GY], R3: [x + 64, GY], L3: [x - 62, GY] }, kn), ...p });
  }
  // the cookie (drawn over the raised feet: they press on its underside)
  {
    const cy = yTop, band = `M${cx - r} ${n(cy)}v${n(t)}A${r} ${n(ry)} 0 0 0 ${cx + r} ${n(cy + t)}v${n(-t)}z`;
    s += `<path d="${band}" fill="${C.gold}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="${band}" fill="${C.ink}" opacity=".22"/>`;
    s += `<ellipse cx="${cx}" cy="${n(cy)}" rx="${r}" ry="${n(ry)}" fill="${C.gold}" stroke="${C.ink}" stroke-width="3"/>`;
    s += `<ellipse cx="${cx - 26}" cy="${n(cy - 8)}" rx="${r * .5}" ry="${n(ry * .45)}" fill="${C.goldB}" opacity=".45"/>`;
    s += stipple(31, cx, cy, r * .9, ry * .85, 90, 1, C.ox, .45);
    s += line(`M${cx - 60} ${n(cy + 10)}q10 -6 22 -2M${cx + 30} ${n(cy - 14)}q12 4 20 -2M${cx + 52} ${n(cy + 14)}q-8 -6 -18 -4`, 1.6, C.ox, ` opacity=".7"`);
    const R = rng(4);
    for (let i = 0; i < 11; i++) {
      const a = R() * 6.28, u = .15 + R() * .7, ex = cx + Math.cos(a) * r * u, ey = cy + Math.sin(a) * ry * u, w = r * (.05 + R() * .03);
      s += `<ellipse cx="${n(ex)}" cy="${n(ey)}" rx="${n(w)}" ry="${n(w * .55)}" fill="${C.deep}"/><ellipse cx="${n(ex - w * .3)}" cy="${n(ey - w * .2)}" rx="${n(w * .3)}" ry="${n(w * .15)}" fill="${C.soft}"/>`;
    }
    for (const fx of [-.8, -.35, .2, .66]) { const ex = cx + fx * r, ey = cy + t * .5 + ry * Math.sqrt(1 - fx * fx); s += `<ellipse cx="${n(ex)}" cy="${n(ey)}" rx="5" ry="3.4" fill="${C.deep}"/>`; }
  }
  s += sparkle(cx + 70, yTop - 40, 9) + sparkle(cx - 88, yTop - 24, 5);
  // effort: a bead of sweat falling from the left porter, strain ticks
  s += `<path d="M206 342q-4 6 0 9q4 -3 0 -9z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.2"/>`;
  s += line(`M168 326l-8 -4M166 338l-9 0`, 2, C.ink, ` opacity=".5"`);
  s += line(`M438 326l8 -4M440 338l9 0`, 2, C.ink, ` opacity=".5"`);
  s = s0 + `<g transform="translate(300 ${GY}) scale(1.18) translate(-300 ${-GY})">${s}</g>`;
  return V("Two spiders carry a cookie overhead across the floor", s);
}
