// Shared drawing helpers for the Heisty Spideys cast (species, roles, creatures).
import { writeFileSync } from "node:fs";

export const OUT = new URL("../../art/", import.meta.url).pathname; // book/art/
export const C = {
  plum: "#5f2470", deep: "#3a1348", soft: "#7b3a8e", cream: "#f6efdd",
  parch: "#eaddbe", edge: "#d9c69a", ink: "#2a1c30", gold: "#b8892a",
  glint: "#f0cf6b", ox: "#7a2231", oxb: "#b2364a", good: "#2f7d4f",
};

let PFX = "x", N = 0;
export const setPrefix = p => { PFX = p; N = 0; };
export const uid = s => `${PFX}-${s}${N++}`;
export const r1 = v => Math.round(v * 10) / 10;
export const pt = p => `${r1(p[0])} ${r1(p[1])}`;
export const poly = pts => "M" + pts.map(pt).join(" L");

export function rng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function save(name, vb, title, body) {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-labelledby="${name}-title">\n` +
    `<title id="${name}-title">${title}</title>\n${body}\n</svg>\n`;
  writeFileSync(OUT + name + ".svg", s);
}

// ---------- primitives ----------
export const circ = (x, y, r, fill, st = C.ink, sw = 0, extra = "") =>
  `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${fill}"${sw ? ` stroke="${st}" stroke-width="${sw}"` : ""}${extra}/>`;
export const ell = (x, y, rx, ry, fill, st = C.ink, sw = 0, extra = "") =>
  `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${fill}"${sw ? ` stroke="${st}" stroke-width="${sw}"` : ""}${extra}/>`;
export const path = (d, fill = "none", st = C.ink, sw = 3, extra = "") =>
  `<path d="${d}" fill="${fill}"${sw ? ` stroke="${st}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"` : ""}${extra}/>`;
export const line = (a, b, st = C.ink, sw = 2, extra = "") =>
  `<path d="M${pt(a)} L${pt(b)}" stroke="${st}" stroke-width="${sw}" stroke-linecap="round"${extra}/>`;

// Motion / speed lines: list of [x1,y1,x2,y2]
export const strokes = (list, st = C.ink, sw = 3, extra = "") =>
  list.map(([a, b, c, d]) => line([a, b], [c, d], st, sw, extra)).join("");

// Pseudo-random stipple inside an ellipse band (dotted shading).
function inEll(x, y, cx, cy, rx, ry) { return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; }

// Ellipse with crescent shadow (lower right), stipple along the terminator, and highlight.
export function shaded(cx, cy, rx, ry, o = {}) {
  const { col = C.plum, shade = C.deep, hi = C.soft, sw = 4, rot = 0, seed = 7, pattern = "", dots = 1, fuzz = 0, light = [-0.16, -0.18] } = o;
  const k = uid("c");
  const lx = cx + rx * light[0], ly = cy + ry * light[1];
  let s = `<g transform="rotate(${rot} ${r1(cx)} ${r1(cy)})">`;
  s += `<clipPath id="${k}">${ell(cx, cy, rx, ry, "#000")}</clipPath>`;
  s += ell(cx, cy, rx, ry, shade);
  s += `<g clip-path="url(#${k})">`;
  s += ell(lx, ly, rx * 1.02, ry * 1.02, col);
  // stipple
  const R = rng(seed); let dd = "";
  const n = Math.round(rx * ry * 0.09 * dots);
  for (let i = 0; i < n; i++) {
    const x = cx + (R() * 2 - 1) * rx, y = cy + (R() * 2 - 1) * ry;
    if (inEll(x, y, cx, cy, rx, ry) > 1) continue;
    const q = inEll(x, y, lx, ly, rx * 1.02, ry * 1.02);
    if (q > 1 || q < 0.55) continue;
    if ((x - lx) * 1 + (y - ly) * 1.1 < 0) continue;
    if (R() < (q - 0.55) / 0.45) dd += `M${r1(x)} ${r1(y)}h0`;
  }
  if (dd) s += `<path d="${dd}" stroke="${shade}" stroke-width="${r1(Math.max(1.8, rx / 26))}" stroke-linecap="round"/>`;
  s += pattern;
  if (hi) s += ell(cx - rx * 0.36, cy - ry * 0.46, rx * 0.3, ry * 0.16, hi, C.ink, 0, ` transform="rotate(-24 ${r1(cx - rx * 0.36)} ${r1(cy - ry * 0.46)})" opacity="0.9"`);
  s += `</g>`;
  if (fuzz) s += hairRing(cx, cy, rx, ry, fuzz, seed + 3);
  s += ell(cx, cy, rx, ry, "none", C.ink, sw);
  s += `</g>`;
  return s;
}

// Little hair ticks around an ellipse outline.
export function hairRing(cx, cy, rx, ry, n = 30, seed = 1, len = 5, sw = 1.8) {
  const R = rng(seed); let d = "";
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2 + R() * 0.1;
    const x = cx + Math.cos(t) * rx, y = cy + Math.sin(t) * ry;
    const nx = Math.cos(t) * ry, ny = Math.sin(t) * rx, m = Math.hypot(nx, ny);
    const L = len * (0.6 + R() * 0.7);
    const bx = x + (nx / m) * L - (ny / m) * L * 0.35, by = y + (ny / m) * L + (nx / m) * L * 0.35;
    d += `M${r1(x - nx / m)} ${r1(y - ny / m)} L${r1(bx)} ${r1(by)}`;
  }
  return `<path d="${d}" stroke="${C.ink}" stroke-width="${sw}" stroke-linecap="round" fill="none"/>`;
}

// ---------- legs ----------
// pts: [root, knee, ankle, foot] (any length >= 2)
export function leg(pts, o = {}) {
  const { w = 7, col = C.plum, band = null, dash = "3 8", fuzz = false, knee = true, tip = true, hl = C.soft, op = 1 } = o;
  const d = poly(pts);
  let s = `<g${op < 1 ? ` opacity="${op}"` : ""}>`;
  s += path(d, "none", C.ink, w + 5);
  s += path(d, "none", col, w);
  if (band) s += `<path d="${d}" fill="none" stroke="${band}" stroke-width="${w}" stroke-dasharray="${dash}" stroke-linejoin="round"/>`;
  if (hl) {
    let h = "";
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      if (L < w * 3) continue;
      let nx = -dy / L, ny = dx / L; if (ny > 0 || (ny === 0 && nx > 0)) { nx = -nx; ny = -ny; }
      const off = w * 0.22;
      h += `M${r1(a[0] + dx * 0.22 + nx * off)} ${r1(a[1] + dy * 0.22 + ny * off)} L${r1(a[0] + dx * 0.72 + nx * off)} ${r1(a[1] + dy * 0.72 + ny * off)}`;
    }
    if (h) s += `<path d="${h}" stroke="${hl}" stroke-width="${r1(Math.max(1.2, w * 0.26))}" stroke-linecap="round" fill="none"/>`;
  }
  if (fuzz) {
    let h = "";
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      const k = Math.floor(L / 8);
      for (let j = 1; j < k; j++) {
        const t = j / k, sd = j % 2 ? 1 : -1;
        const px = a[0] + dx * t, py = a[1] + dy * t, r0 = w / 2 + 2, r2 = w / 2 + 6;
        h += `M${r1(px + nx * sd * r0)} ${r1(py + ny * sd * r0)} L${r1(px + nx * sd * r2 + ux * 2.5)} ${r1(py + ny * sd * r2 + uy * 2.5)}`;
      }
    }
    s += `<path d="${h}" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`;
  }
  if (knee) for (let i = 1; i < pts.length - 1; i++) s += circ(pts[i][0], pts[i][1], w * 0.62, col, C.ink, 2.2);
  if (tip) { const f = pts[pts.length - 1]; s += circ(f[0], f[1], w * 0.42 + 1, C.ink); }
  return s + `</g>`;
}

export const mirror = legs => legs.map(l => l.map(([x, y]) => [-x, y]));

// Standard right-hand standing pose, ceph at origin (rx ~ 40)
export const STAND_R = [
  [[24, 10], [56, -22], [74, 28], [66, 80]],
  [[30, 4], [80, -42], [110, 8], [118, 68]],
  [[32, -4], [90, -62], [136, -20], [150, 42]],
  [[28, -12], [72, -84], [124, -74], [162, -6]],
];

// ---------- eyes / face ----------
// lid: 'wide' | 'sly' | 'half' | 'wink' | 'squint' | 'happy' | 'worry' | 'glare'
function eye(x, y, r, side, lid, look, lidCol) {
  if (lid === "wink") {
    return path(`M${r1(x - r)} ${r1(y + r * 0.1)} Q${r1(x)} ${r1(y - r * 0.75)} ${r1(x + r)} ${r1(y + r * 0.1)}`, "none", C.ink, r * 0.32) +
      path(`M${r1(x - r * 0.8 * side * -1)} ${r1(y - r * 0.2)} l${r1(-side * r * 0.35)} ${r1(-r * 0.3)}`, "none", C.ink, r * 0.14);
  }
  const k = uid("e");
  const [lx, ly] = look;
  let s = circ(x, y, r + 2.6, C.ink);
  s += `<clipPath id="${k}">${circ(x, y, r, "#000")}</clipPath><g clip-path="url(#${k})">`;
  s += circ(x, y, r, C.ink);
  s += circ(x + lx * r * 0.14, y + ly * r * 0.14, r * 0.8, C.deep);
  s += circ(x + lx * r * 0.2, y + ly * r * 0.2, r * 0.5, C.ink);
  s += path(`M${r1(x - r * 0.62)} ${r1(y + r * 0.36)} Q${r1(x)} ${r1(y + r * 0.92)} ${r1(x + r * 0.62)} ${r1(y + r * 0.36)}`, "none", C.soft, Math.max(1.2, r * 0.1), ` opacity="0.9"`);
  const gy = ["sly", "glare", "half", "squint"].includes(lid) ? 0.02 : -0.3;
  s += circ(x - r * 0.3 + lx * r * 0.12, y + r * gy + ly * r * 0.12, r * 0.26, C.glint);
  s += circ(x + r * 0.36 + lx * r * 0.1, y + r * 0.34 + ly * r * 0.1, r * 0.13, C.glint);
  // lids
  const o = x - side * r * 1.1, i = x + side * r * 1.1; // outer / inner x
  const T = y - r * 1.2;
  const L = (yo, yi) => path(`M${r1(o)} ${r1(T)} L${r1(o)} ${r1(yo)} L${r1(i)} ${r1(yi)} L${r1(i)} ${r1(T)} Z`, lidCol, "none", 0) +
    path(`M${r1(o)} ${r1(yo)} L${r1(i)} ${r1(yi)}`, "none", C.ink, Math.max(2.4, r * 0.16));
  if (lid === "sly") s += L(y - r * 0.62, y - r * 0.28);
  if (lid === "glare") s += L(y - r * 0.7, y - r * 0.12);
  if (lid === "half") s += L(y - r * 0.3, y - r * 0.3);
  if (lid === "squint") s += L(y + r * 0.12, y + r * 0.2);
  if (lid === "worry") s += L(y - r * 0.18, y - r * 0.62);
  if (lid === "happy") s += path(`M${r1(x - r * 1.2)} ${r1(y + r * 1.2)} L${r1(x - r * 1.2)} ${r1(y + r * 0.55)} Q${r1(x)} ${r1(y + r * 0.1)} ${r1(x + r * 1.2)} ${r1(y + r * 0.55)} L${r1(x + r * 1.2)} ${r1(y + r * 1.2)} Z`, lidCol, C.ink, Math.max(2.4, r * 0.16));
  s += `</g>`;
  return s;
}
export function smallEye(x, y, r) {
  return circ(x, y, r + 1.6, C.ink) + circ(x, y, r, C.deep) + circ(x - r * 0.3, y - r * 0.3, Math.max(1.1, r * 0.36), C.glint);
}

// Face centred on (fx, fy). er = main eye radius, esp = half spacing.
export function face(fx, fy, o = {}) {
  const { er = 13, esp = 16, lid = "sly", look = [0, 0], lidCol = C.plum, small = "std", mouth = "smirk", che = C.soft, fangs = true, cheW = 1, cheY = 1.62 } = o;
  const lids = Array.isArray(lid) ? lid : [lid, lid];
  let s = "";
  // chelicerae + fangs
  const cy = fy + er * cheY;
  const cw = er * 0.5 * cheW;
  if (mouth !== "none") {
    if (fangs) {
      s += path(`M${r1(fx - cw * 1.25)} ${r1(cy + er * 0.45)} l${r1(cw * 0.35)} ${r1(er * 0.5)} l${r1(cw * 0.3)} ${r1(-er * 0.45)} Z`, C.cream, C.ink, 2);
      s += path(`M${r1(fx + cw * 1.25)} ${r1(cy + er * 0.45)} l${r1(-cw * 0.35)} ${r1(er * 0.5)} l${r1(-cw * 0.3)} ${r1(-er * 0.45)} Z`, C.cream, C.ink, 2);
    }
    s += ell(fx - cw * 0.98, cy, cw, er * 0.62, che, C.ink, 2.6);
    s += ell(fx + cw * 0.98, cy, cw, er * 0.62, che, C.ink, 2.6);
    s += ell(fx - cw * 1.2, cy - er * 0.25, cw * 0.35, er * 0.16, C.glint, C.ink, 0, ` opacity="0.55"`);
    s += ell(fx + cw * 0.76, cy - er * 0.25, cw * 0.35, er * 0.16, C.glint, C.ink, 0, ` opacity="0.55"`);
  }
  // secondary eyes
  let se = [];
  if (small === "std") se = [[-esp * 0.42, -er * 1.02, er * 0.2], [esp * 0.42, -er * 1.02, er * 0.2], [-(esp + er * 1.05), -er * 0.62, er * 0.3], [esp + er * 1.05, -er * 0.62, er * 0.3]];
  if (small === "jump") se = [[-(esp + er * 1.08), er * 0.08, er * 0.42], [esp + er * 1.08, er * 0.08, er * 0.42], [-(esp + er * 0.5), -er * 1.15, er * 0.2], [esp + er * 0.5, -er * 1.15, er * 0.2]];
  if (small === "wolf") se = [[-er * 1.05, er * 1.02, er * 0.17], [-er * 0.36, er * 1.12, er * 0.17], [er * 0.36, er * 1.12, er * 0.17], [er * 1.05, er * 1.02, er * 0.17], [-(esp + er * 1.1), -er * 0.7, er * 0.32], [esp + er * 1.1, -er * 0.7, er * 0.32]];
  if (Array.isArray(small)) se = small;
  for (const [x, y, r] of se) s += smallEye(fx + x, fy + y, r);
  s += eye(fx - esp, fy, er, -1, lids[0], look, lidCol);
  s += eye(fx + esp, fy, er, 1, lids[1], look, lidCol);
  if (mouth !== "none") {
    const my = cy - er * 0.52 + 4;
    if (mouth === "smirk") s += path(`M${r1(fx - er * 0.75)} ${r1(my + er * 0.02)} Q${r1(fx + er * 0.1)} ${r1(my + er * 0.42)} ${r1(fx + er * 0.95)} ${r1(my - er * 0.22)}`, "none", C.ink, Math.max(2.6, er * 0.2));
    if (mouth === "grin") s += path(`M${r1(fx - er * 0.9)} ${r1(my - er * 0.1)} Q${r1(fx)} ${r1(my + er * 0.62)} ${r1(fx + er * 0.9)} ${r1(my - er * 0.1)}`, "none", C.ink, Math.max(2.6, er * 0.2));
    if (mouth === "o") s += ell(fx + er * 0.1, my + er * 0.18, er * 0.22, er * 0.28, C.deep, C.ink, 2.4);
    if (mouth === "flat") s += path(`M${r1(fx - er * 0.6)} ${r1(my + er * 0.12)} L${r1(fx + er * 0.6)} ${r1(my + er * 0.08)}`, "none", C.ink, Math.max(2.6, er * 0.2));
    if (mouth === "wobble") s += path(`M${r1(fx - er * 0.7)} ${r1(my + er * 0.2)} q${r1(er * 0.23)} ${r1(-er * 0.25)} ${r1(er * 0.46)} 0 t${r1(er * 0.46)} 0 t${r1(er * 0.46)} 0`, "none", C.ink, Math.max(2.4, er * 0.17));
    }
  return s;
}

// ---------- the spider ----------
// legs: array of 8 point lists (0-3 right I..IV, 4-7 left I..IV) in local coords.
export function spider(o) {
  const {
    x = 0, y = 0, s: sc = 1, rot = 0, flip = false,
    col = C.plum, shade = C.deep, hi = C.soft,
    ceph = { rx: 40, ry: 34 }, abd = { dx: 0, dy: -66, rx: 54, ry: 48 },
    legs = [...STAND_R, ...mirror(STAND_R)], legW = 7, legCol, band = null, dash, fuzz = false,
    legCols = [], legHl = [], back = [], front = [], faceO = {}, fx = 0, fy = -2, under = "", over = "", afterLegs = "", preFront = "", legOp = [], seed = 3,
    feetShadow = null, lifted = [],
  } = o;
  const lc = legCol || col;
  let s = `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${rot}) scale(${flip ? -sc : sc} ${sc})">`;
  s += under;
  // contact shadows under every planted foot (legs listed in `lifted` are in the air)
  if (feetShadow) {
    const { rx = 12, ry = 4, op = 0.22, col = C.ink } = feetShadow;
    for (let i = 0; i < 8; i++) if (!lifted.includes(i)) { const f = legs[i][legs[i].length - 1]; s += ell(f[0], f[1] + ry * 0.6, rx, ry, col, C.ink, 0, ` opacity="${op}"`); }
  }
  const order = [3, 7, 2, 6, 1, 5, 0, 4];
  const L = i => leg(legs[i], { w: (legW * (i % 4 === 0 ? 1.05 : 1)), col: legCols[i] || lc, hl: legHl[i] || hi, band, dash, fuzz, op: legOp[i] ?? 1 });
  for (const i of order) if (back.includes(i)) s += L(i);
  if (abd) s += shaded(abd.dx, abd.dy, abd.rx, abd.ry, { col: abd.col || col, shade: abd.shade || shade, hi: abd.hi ?? hi, rot: abd.rot || 0, pattern: abd.pattern || "", fuzz: abd.fuzz || 0, seed: seed + 11, light: abd.light });
  for (const i of order) if (!back.includes(i) && !front.includes(i)) s += L(i);
  s += afterLegs;
  s += shaded(0, 0, ceph.rx, ceph.ry, { col: ceph.col || col, shade: ceph.shade || shade, hi: ceph.hi ?? hi, pattern: ceph.pattern || "", fuzz: ceph.fuzz || 0, seed, rot: ceph.rot || 0 });
  s += face(fx, fy, { lidCol: ceph.col || col, ...faceO });
  s += preFront;
  for (const i of order) if (front.includes(i)) s += L(i);
  s += over;
  return s + `</g>`;
}

// ---------- frames ----------
// Species cameo: parchment disc with a double ring. Returns {bg, fg, clip}
export function cameo(cx = 200, cy = 200, r = 178) {
  const k = uid("cam");
  const bg = `<clipPath id="${k}">${circ(cx, cy, r, "#000")}</clipPath>` +
    circ(cx, cy, r + 8, C.cream, C.edge, 3) +
    circ(cx, cy, r, C.parch, C.edge, 2.5);
  const ring = circ(cx, cy, r, "none", C.ink, 3) + circ(cx, cy, r + 8, "none", C.gold, 1.6, ` stroke-dasharray="1.5 7" stroke-linecap="round"`);
  return { bg, clip: `url(#${k})`, ring };
}

// Role medallion: scalloped plum wax seal + beaded gold ring + parchment field.
export function medallion(field = C.parch) {
  const cx = 200, cy = 200, R = 192, n = 28;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2, a2 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) d += `M${r1(cx + Math.cos(a0) * (R - 7))} ${r1(cy + Math.sin(a0) * (R - 7))}`;
    if (i < n) d += ` Q${r1(cx + Math.cos(a1) * (R + 5))} ${r1(cy + Math.sin(a1) * (R + 5))} ${r1(cx + Math.cos(a2) * (R - 7))} ${r1(cy + Math.sin(a2) * (R - 7))}`;
  }
  d += "Z";
  const k = uid("med");
  let bg = path(d, C.plum, C.ink, 4);
  // wax sheen
  bg += path(`M${cx - 150} ${cy - 70} A 165 165 0 0 1 ${cx - 40} ${cy - 160}`, "none", C.soft, 7, ` opacity="0.8"`);
  bg += path(`M${cx + 150} ${cy + 80} A 165 165 0 0 1 ${cx + 60} ${cy + 158}`, "none", C.deep, 7);
  bg += circ(cx, cy, 160, C.gold, C.ink, 3);
  let beads = "";
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; beads += circ(cx + Math.cos(a) * 160, cy + Math.sin(a) * 160, 2.6, C.glint); }
  bg += beads;
  bg += `<clipPath id="${k}">${circ(cx, cy, 148, "#000")}</clipPath>`;
  bg += circ(cx, cy, 148, field, C.ink, 3);
  const ring = circ(cx, cy, 148, "none", C.ink, 3.5);
  return { bg, clip: `url(#${k})`, ring };
}

// Soft ground shadow
export const shadow = (x, y, rx, ry, col = C.edge, op = 0.9) => ell(x, y, rx, ry, col, C.ink, 0, ` opacity="${op}"`);

// Sparkle / star
export function star(x, y, r, fill = C.glint, sw = 2) {
  let d = "";
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.38 : r; d += (i ? "L" : "M") + r1(x + Math.cos(a) * rr) + " " + r1(y + Math.sin(a) * rr); }
  return path(d + "Z", fill, C.ink, sw);
}

// Leg from root to foot with knee/ankle bulging to the left of the travel direction
// (i.e. "up" for a leg reaching right). Negative bulge bends the other way.
export function arch(root, foot, bulge = 30, kt = 0.38, at = 0.74, ab = 0.5) {
  const dx = foot[0] - root[0], dy = foot[1] - root[1], L = Math.hypot(dx, dy);
  const nx = dy / L, ny = -dx / L;
  return [root, [root[0] + dx * kt + nx * bulge, root[1] + dy * kt + ny * bulge],
    [root[0] + dx * at + nx * bulge * ab, root[1] + dy * at + ny * bulge * ab], foot];
}
// World point -> a spider's local coords, for a spider placed with {x, y, s, rot, flip}.
export function toLocal({ x = 0, y = 0, s = 1, rot = 0, flip = false }, [wx, wy]) {
  const dx = (wx - x) / s, dy = (wy - y) / s, a = -rot * Math.PI / 180;
  let lx = dx * Math.cos(a) - dy * Math.sin(a); const ly = dx * Math.sin(a) + dy * Math.cos(a);
  if (flip) lx = -lx;
  return [lx, ly];
}
// Local spider coords -> world point.
export function toWorld({ x = 0, y = 0, s = 1, rot = 0, flip = false }, [lx, ly]) {
  const a = rot * Math.PI / 180, px = (flip ? -lx : lx) * s, py = ly * s;
  return [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)];
}
export const STAND_ROOTS = [[24, 10], [30, 4], [32, -4], [28, -12], [-24, 10], [-30, 4], [-32, -4], [-28, -12]];
// Eight legs whose feet land exactly on the given WORLD points (0-3 right I..IV, 4-7 left I..IV).
// Knees always bulge up/outward (right legs +bulge, left legs -bulge in arch terms).
export function planted(t, feet, bulge = 30, roots = STAND_ROOTS) {
  return feet.map((f, i) => {
    const b = Array.isArray(bulge) ? bulge[i] : bulge;
    return arch(roots[i], toLocal(t, f), roots[i][0] >= 0 ? b : -b);
  });
}

// polar helper
export const pol = (cx, cy, r, deg) => [cx + Math.cos(deg * Math.PI / 180) * r, cy + Math.sin(deg * Math.PI / 180) * r];

// Creature vignette: soft oval cameo. Returns {bg, clip, ring}
export function oval(cx = 240, cy = 202, rx = 224, ry = 184) {
  const k = uid("ov");
  const bg = `<clipPath id="${k}">${ell(cx, cy, rx, ry, "#000")}</clipPath>` +
    ell(cx, cy, rx + 8, ry + 8, C.cream, C.edge, 3) + ell(cx, cy, rx, ry, C.parch, C.edge, 2.5);
  const ring = ell(cx, cy, rx, ry, "none", C.ink, 3) + ell(cx, cy, rx + 8, ry + 8, "none", C.gold, 1.6, ` stroke-dasharray="1.5 7" stroke-linecap="round"`);
  return { bg, clip: `url(#${k})`, ring };
}

// Fur ticks along an arbitrary polyline (list of points), on one side.
export function furTicks(pts, len = 7, every = 12, side = 1, st = C.ink, sw = 2, seed = 1) {
  const R = rng(seed); let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), n = Math.max(1, Math.floor(L / every));
    const nx = (-dy / L) * side, ny = (dx / L) * side;
    for (let j = 0; j < n; j++) {
      const t = (j + 0.5) / n, x = a[0] + dx * t, y = a[1] + dy * t, l = len * (0.6 + R() * 0.6);
      d += `M${r1(x)} ${r1(y)} l${r1(nx * l + (dx / L) * l * 0.5)} ${r1(ny * l + (dy / L) * l * 0.5)}`;
    }
  }
  return `<path d="${d}" stroke="${st}" stroke-width="${sw}" stroke-linecap="round" fill="none"/>`;
}

// A merged puff cloud from circles [[x,y,r],...]
export function cloud(list, fill = C.cream, sw = 2.6) {
  return list.map(([x, y, r]) => circ(x, y, r + sw / 2, C.ink)).join("") +
    list.map(([x, y, r]) => circ(x, y, r - sw / 2, fill)).join("");
}
