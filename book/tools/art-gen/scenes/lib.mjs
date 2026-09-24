// Shared drawing kit for the Heisty Spideys book art (cover, parts, vignettes, diagrams).
export const C = {
  plum: "#36343a", deep: "#1f1d22", soft: "#5a5660",
  cream: "#f3eee4", parch: "#e6dccb", edge: "#cdbfa4",
  ink: "#141216", gold: "#b8892a", goldB: "#f0cf6b",
  ox: "#8f1d1d", oxB: "#d13a2f", good: "#2f7d4f",
  // The brief asks for a blue tin lid; this muted blue is used for that lid only.
  blue: "#3d5a80", blueL: "#6f90b8",
};

export const n = v => (Math.round(v * 10) / 10).toString();
export const pts = a => a.map(p => `${n(p[0])},${n(p[1])}`).join(" ");

export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function svg(vb, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${title}">\n<title>${title}</title>\n${body}\n</svg>\n`;
}

// Straight hatch lines inside a clip shape.
export function hatch(id, clipShape, x0, y0, x1, y1, gap = 6, ang = 45, stroke = C.ink, w = 1, op = 0.35) {
  const out = [];
  const L = Math.hypot(x1 - x0, y1 - y0);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const a = ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
  for (let t = -L / 2; t <= L / 2; t += gap) {
    const ox = cx + px * t, oy = cy + py * t;
    out.push(`M${n(ox - dx * L / 2)} ${n(oy - dy * L / 2)}L${n(ox + dx * L / 2)} ${n(oy + dy * L / 2)}`);
  }
  return `<clipPath id="${id}">${clipShape}</clipPath><path clip-path="url(#${id})" d="${out.join("")}" stroke="${stroke}" stroke-width="${w}" opacity="${op}" fill="none"/>`;
}

export function stipple(seed, cx, cy, rx, ry, count, r = 1, fill = C.ink, op = 0.3) {
  const R = rng(seed); let d = "";
  for (let i = 0; i < count; i++) {
    const t = R() * Math.PI * 2, u = Math.sqrt(R());
    d += `M${n(cx + Math.cos(t) * rx * u)} ${n(cy + Math.sin(t) * ry * u)}h0.01`;
  }
  return `<path d="${d}" stroke="${fill}" stroke-width="${r * 2}" stroke-linecap="round" opacity="${op}"/>`;
}

// ---------- the spider ----------
// Local frame: cephalothorax centred at 0,0 (rx 14.5, ry 12.5); abdomen behind/above.
// Legs are [attach, knee, foot] for the right side, mirrored for the left.
export const POSES = {
  // every foot on the same ground line (y 26): nothing hovers
  stand: [
    [[9, -6], [20, -24], [17, 26]],
    [[12, -2], [34, -22], [36, 26]],
    [[13, 3], [46, -12], [54, 26]],
    [[10, 7], [48, -2], [64, 26]],
  ],
  dangle: [
    [[9, -6], [22, -12], [14, 22]],
    [[12, -2], [32, -10], [30, 24]],
    [[13, 3], [40, -2], [44, 22]],
    [[10, 7], [36, 8], [48, 26]],
  ],
  sprawl: [
    [[9, -6], [20, -26], [30, -42]],
    [[12, -2], [36, -18], [52, -18]],
    [[13, 3], [42, 4], [56, 16]],
    [[10, 7], [32, 16], [42, 32]],
  ],
  tuck: [
    [[9, -6], [18, -16], [14, 18]],
    [[12, -2], [26, -14], [26, 18]],
    [[13, 3], [30, -6], [36, 18]],
    [[10, 7], [30, 0], [40, 18]],
  ],
};

export function spider(o = {}) {
  const {
    x = 0, y = 0, s = 1, r = 0, pose = "stand", body = C.plum, hi = C.soft,
    mark = "chevron", mask = false, hat = null, look = [0, 0], mouth = "grin",
    brow = "none", thread = 0, threadColor = C.goldB, over = "", under = "",
    legOverride = {}, abd = [0, -22, 19, 17], flip = false, eyes = "open", legW = 1, sw = 2.2,
    rim = null, rimOp = .5,
  } = o;
  const base = POSES[pose] || POSES.stand;
  const legs = [];
  const lw = 4.4 * legW, iw = 2.2 * legW;
  for (const side of ["R", "L"]) {
    const m = side === "R" ? 1 : -1;
    base.forEach((leg, i) => {
      const L = legOverride[side + i] || leg.map(p => [p[0] * m, p[1]]);
      const [a, k, f] = L;
      const mid = [k[0] + (f[0] - k[0]) * 0.55 + (Math.sign(f[0] - a[0] || m) * 3), k[1] + (f[1] - k[1]) * 0.55];
      legs.push(`M${n(a[0])} ${n(a[1])}L${n(k[0])} ${n(k[1])}L${n(mid[0])} ${n(mid[1])}L${n(f[0])} ${n(f[1])}`);
    });
  }
  const legD = legs.join("");
  const [ax, ay, arx, ary] = abd;
  let pattern = "";
  if (mark === "chevron") pattern = `<path d="M${ax - 8} ${ay - 4}l8 6 8-6M${ax - 6} ${ay + 4}l6 5 6-5" stroke="${C.goldB}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  else if (mark === "dots") pattern = `<g fill="${C.goldB}"><circle cx="${ax - 6}" cy="${ay - 3}" r="2.2"/><circle cx="${ax + 6}" cy="${ay - 3}" r="2.2"/><circle cx="${ax - 4}" cy="${ay + 6}" r="1.8"/><circle cx="${ax + 4}" cy="${ay + 6}" r="1.8"/></g>`;
  else if (mark === "stripe") pattern = `<path d="M${ax - 14} ${ay - 2}q14 -6 28 0M${ax - 13} ${ay + 6}q13 -5 26 0" stroke="${C.goldB}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  else if (mark === "star") pattern = `<path d="M${ax} ${ay - 8}l2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.7-4.9 2.7 1.1-5.3-4-3.7 5.4-.6z" fill="${C.goldB}"/>`;

  const threadEl = thread ? `<path d="M${ax} ${ay - ary + 1}V${ay - ary - thread}" stroke="${threadColor}" stroke-width="1.4" fill="none"/>` : "";
  const E = (ex, ey, rr) => {
    const px = ex + look[0] * rr * 0.35, py = ey + look[1] * rr * 0.35;
    if (eyes === "closed") return `<path d="M${n(ex - rr)} ${n(ey)}q${n(rr)} ${n(rr * 0.8)} ${n(rr * 2)} 0" stroke="${C.ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    if (eyes === "x") return `<path d="M${n(ex - rr * .6)} ${n(ey - rr * .6)}l${n(rr * 1.2)} ${n(rr * 1.2)}m0 ${n(-rr * 1.2)}l${n(-rr * 1.2)} ${n(rr * 1.2)}" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/>`;
    if (eyes === "swirl") return `<circle cx="${n(ex)}" cy="${n(ey)}" r="${n(rr)}" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.3"/><path d="M${n(ex)} ${n(ey)}m-1 0a1 1 0 1 1 2 0a2 2 0 1 1-4 0a3 3 0 1 1 6 0" stroke="${C.ink}" stroke-width="1" fill="none"/>`;
    return `<circle cx="${n(ex)}" cy="${n(ey)}" r="${n(rr)}" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.3"/>` +
      `<circle cx="${n(px)}" cy="${n(py)}" r="${n(rr * 0.58)}" fill="${C.ink}"/>` +
      `<circle cx="${n(px + rr * 0.22)}" cy="${n(py - rr * 0.25)}" r="${n(rr * 0.24)}" fill="${C.goldB}"/>`;
  };
  const small = (ex, ey, rr) => `<circle cx="${ex}" cy="${ey}" r="${rr}" fill="${C.ink}"/><circle cx="${n(ex + rr * .3)}" cy="${n(ey - rr * .3)}" r="${n(rr * .4)}" fill="${C.goldB}"/>`;
  let mouthEl = "";
  if (mouth === "grin") mouthEl = `<path d="M-3.5 7.2q3.5 3 7 0" stroke="${C.ink}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  if (mouth === "smirk") mouthEl = `<path d="M-2.5 7.8q3 1.6 6-1.2" stroke="${C.ink}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  if (mouth === "o") mouthEl = `<ellipse cx="0" cy="8" rx="1.8" ry="2.2" fill="${C.ink}"/>`;
  if (mouth === "flat") mouthEl = `<path d="M-2.5 8h5" stroke="${C.ink}" stroke-width="1.4" stroke-linecap="round"/>`;
  if (mouth === "worried") mouthEl = `<path d="M-3.6 9q1.2-2 2.4 0t2.4 0 2.4 0" stroke="${C.ink}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
  if (mouth === "big") mouthEl = `<path d="M-4.5 6.5q4.5 6 9 0z" fill="${C.ink}"/><path d="M-2 9q2 1.6 4 0" stroke="${C.oxB}" stroke-width="1.4" fill="none"/>`;
  let browEl = "";
  if (brow === "down") browEl = `<path d="M-10 -7.8l7 2.2M10 -7.8l-7 2.2" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/>`;
  if (brow === "up") browEl = `<path d="M-10 -8l7 -1.6M10 -8l-7 -1.6" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/>`;
  if (brow === "worried") browEl = `<path d="M-10 -6l7 -2.6M10 -6l-7 -2.6" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/>`;
  const maskEl = mask ? `<path d="M-15.5 -5.5q15.5 -5 31 0l0.5 7q-16 5 -32 0z" fill="${C.ink}"/><path d="M15.5 -3l6 -4M15.5 -1l6 2" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/>` : "";
  let hatEl = "";
  if (hat === "beanie") hatEl = `<path d="M-12 -10q12 -18 24 0z" fill="${C.ox}" stroke="${C.ink}" stroke-width="1.6"/><path d="M-13 -10h26" stroke="${C.ink}" stroke-width="3.4" stroke-linecap="round"/><path d="M-13 -10h26" stroke="${C.oxB}" stroke-width="1.8" stroke-linecap="round"/><circle cx="0" cy="-21" r="2.8" fill="${C.oxB}" stroke="${C.ink}" stroke-width="1.2"/>`;
  if (hat === "fedora") hatEl = `<path d="M-17 -10q17 -4 34 0" stroke="${C.ink}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-10 -11q-1 -9 3 -10q3 2 7 0q4 1 3 10z" fill="${C.ink}"/><path d="M-10 -13h19" stroke="${C.gold}" stroke-width="1.8"/>`;
  if (hat === "bowtie") hatEl = `<path d="M0 13l-6 -3.5v7zM0 13l6 -3.5v7z" fill="${C.oxB}" stroke="${C.ink}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="0" cy="13" r="1.6" fill="${C.ink}"/>`;
  if (hat === "goggles") hatEl = `<path d="M-14 -10h28" stroke="${C.ink}" stroke-width="2.4"/><circle cx="-6" cy="-11" r="4.2" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.8"/><circle cx="6" cy="-11" r="4.2" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.8"/>`;

  const rimEl = rim ? `<g opacity="${rimOp}" stroke="${rim}" fill="${rim}" stroke-linecap="round" stroke-linejoin="round"><path d="${legD}" stroke-width="${lw + 5}" fill="none"/><ellipse cx="${ax}" cy="${ay}" rx="${arx + 2.5}" ry="${ary + 2.5}" stroke-width="0"/><ellipse cx="0" cy="0" rx="17" ry="15" stroke-width="0"/></g>` : "";
  const inner = `${under}${threadEl}${rimEl}
<path d="${legD}" stroke="${C.ink}" stroke-width="${lw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${legD}" stroke="${body}" stroke-width="${iw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<ellipse cx="${ax}" cy="${ay}" rx="${arx}" ry="${ary}" fill="${body}" stroke="${C.ink}" stroke-width="${sw}"/>
<ellipse cx="${n(ax - arx * 0.35)}" cy="${n(ay - ary * 0.4)}" rx="${n(arx * 0.38)}" ry="${n(ary * 0.26)}" fill="${hi}" transform="rotate(-25 ${n(ax - arx * .35)} ${n(ay - ary * .4)})"/>
${pattern}
<ellipse cx="0" cy="0" rx="14.5" ry="12.5" fill="${body}" stroke="${C.ink}" stroke-width="${sw}"/>
<path d="M-8 -8q8 -5 16 0" stroke="${hi}" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M-4.5 10.5q-1.5 4 0.5 5.5M4.5 10.5q1.5 4 -0.5 5.5" stroke="${C.ink}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
${maskEl}${small(-10.8, -5.2, 1.6)}${small(10.8, -5.2, 1.6)}${small(-3.2, -8.6, 1.2)}${small(3.2, -8.6, 1.2)}
${E(-5.6, -0.2, 5.1)}${E(5.6, -0.2, 5.1)}${browEl}${mouthEl}${hatEl}${over}`;
  const tr = `translate(${n(x)} ${n(y)})${r ? ` rotate(${n(r)})` : ""}${s !== 1 || flip ? ` scale(${flip ? -s : s} ${s})` : ""}`;
  return `<g transform="${tr}">${inner}</g>`;
}

// ---------- props ----------
export function cookie(x, y, r, seed = 3, bite = false) {
  const R = rng(seed); let chips = "";
  for (let i = 0; i < 6; i++) {
    const t = R() * 6.28, u = 0.2 + R() * 0.55;
    chips += `<ellipse cx="${n(x + Math.cos(t) * r * u)}" cy="${n(y + Math.sin(t) * r * u)}" rx="${n(r * 0.13)}" ry="${n(r * 0.11)}" fill="${C.deep}"/>`;
  }
  const w = n(Math.max(1.5, r * 0.08));
  const shape = bite
    ? `<path d="M${n(x + r * .5)} ${n(y - r * .87)}A${r} ${r} 0 1 0 ${n(x + r)} ${n(y)}a${n(r * .22)} ${n(r * .22)} 0 0 1 ${n(-r * .3)} ${n(-r * .3)}a${n(r * .22)} ${n(r * .22)} 0 0 1 ${n(-r * .2)} ${n(-r * .57)}z" fill="${C.gold}" stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"/>`
    : `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${C.gold}" stroke="${C.ink}" stroke-width="${w}"/>`;
  return `${shape}<circle cx="${n(x - r * .28)}" cy="${n(y - r * .3)}" r="${n(r * .4)}" fill="${C.goldB}" opacity=".45"/>${chips}`;
}

// A cookie lying flat on a surface, seen from a low angle: an elliptical top face
// over a thin baked edge. x = centre, y = the contact line (lowest point of the edge).
// bite: a notch taken out of the back-right rim. Includes a small contact shadow.
export function flatCookie(x, y, r, seed = 3, bite = false, o = {}) {
  const { shade = true, lightDx = 1 } = o;
  const ry = r * 0.34, t = Math.max(2, r * 0.2), cy = y - t - ry;
  // Outline in "round" space (a circle of radius r at the origin), then squashed to the ellipse.
  // A bite is a circle centred on the rim; the outline follows its inner arc.
  const bA = -0.55, bC = [Math.cos(bA) * r, Math.sin(bA) * r], br = r * 0.36;
  const inB = p => Math.hypot(p[0] - bC[0], p[1] - bC[1]) < br;
  const base = [];
  for (let i = 0; i < 96; i++) { const a = i / 96 * Math.PI * 2; base.push([Math.cos(a) * r, Math.sin(a) * r]); }
  let outline = base;
  if (bite) {
    const k = base.findIndex(inB), rot = [...base.slice(k), ...base.slice(0, k)];
    const j = rot.findIndex(p => !inB(p));
    const pOut = rot[j], pIn = rot[rot.length - 1];
    const t1 = Math.atan2(pIn[1] - bC[1], pIn[0] - bC[0]); let t2 = Math.atan2(pOut[1] - bC[1], pOut[0] - bC[0]);
    const arc = dir => { const A = []; let d = t2 - t1; if (dir > 0 && d < 0) d += 2 * Math.PI; if (dir < 0 && d > 0) d -= 2 * Math.PI; for (let q = 1; q < 12; q++) { const tt = t1 + d * q / 12; A.push([bC[0] + Math.cos(tt) * br, bC[1] + Math.sin(tt) * br]); } return A; };
    const A1 = arc(1), A2 = arc(-1), m = A => Math.hypot(...A[5]);
    outline = [...rot.slice(j), ...(m(A1) < m(A2) ? A1 : A2)];
  }
  // ring(yy): the outline placed with its centre at (x, yy); index 0 is the rightmost point
  const ring = yy => outline.map(p => [x + p[0], yy + p[1] * ry / r]);
  const byT = bC[1] * ry / r, bx = x + bC[0];
  const top = ring(cy), bot = ring(cy + t);
  const w = n(Math.max(1.2, r * 0.07));
  let s = "";
  if (shade) s += `<ellipse cx="${n(x + lightDx * r * .18)}" cy="${n(y - ry * .45)}" rx="${n(r * 1.08)}" ry="${n(ry * .8)}" fill="${C.ink}" opacity=".32"/>`;
  // the baked edge: the outline dropped by t, joined to the top face by a band
  const edge = `<path d="M${pts(bot)}z"/><rect x="${n(x - r)}" y="${n(cy)}" width="${n(2 * r)}" height="${n(t)}"/>`;
  s += `<g fill="${C.gold}">${edge}</g><g fill="${C.ink}" opacity=".28">${edge}</g>`;
  s += `<path d="M${pts(bot)}z" fill="none" stroke="${C.ink}" stroke-width="${w}"/><path d="M${n(x - r)} ${n(cy)}v${n(t)}M${n(x + r)} ${n(cy)}v${n(t)}" stroke="${C.ink}" stroke-width="${w}"/>`;
  s += `<path d="M${pts(top)}z" fill="${C.gold}" stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"/>`;
  s += `<ellipse cx="${n(x - r * .25)}" cy="${n(cy - ry * .25)}" rx="${n(r * .42)}" ry="${n(ry * .38)}" fill="${C.goldB}" opacity=".45"/>`;
  const R = rng(seed);
  for (let i = 0; i < 6; i++) {
    const a = R() * 6.28, u = 0.2 + R() * 0.5;
    const ex = x + Math.cos(a) * r * u, ey = cy + Math.sin(a) * ry * u;
    if (bite && Math.hypot(ex - bx, (ey - cy - byT) * r / ry) < br * 1.3) continue;
    s += `<ellipse cx="${n(ex)}" cy="${n(ey)}" rx="${n(r * 0.13)}" ry="${n(r * 0.06)}" fill="${C.deep}"/>`;
  }
  return s;
}

// Cookie tin with a blue lid. x,y = the lowest point of the base (where it touches
// the surface it stands on); w width; h body height. o.shadow adds a contact shadow.
export function tin(x, y0, w, h, o = {}) {
  const { open = false, glow = false, sw = 2.4, shadow: sh = true } = o;
  const rx = w / 2, ry = w * 0.16, y = y0 - ry, top = y - h;
  let s = "";
  if (glow) s += `<ellipse cx="${x}" cy="${n(top + h * .2)}" rx="${n(rx * 1.7)}" ry="${n(h * 1)}" fill="${C.goldB}" opacity=".16"/>`;
  if (sh) s += `<ellipse cx="${n(x + rx * .12)}" cy="${n(y0 - ry * .35)}" rx="${n(rx * 1.12)}" ry="${n(ry * .75)}" fill="${C.ink}" opacity=".3"/>`;
  s += `<path d="M${n(x - rx)} ${n(top)}V${n(y)}A${n(rx)} ${n(ry)} 0 0 0 ${n(x + rx)} ${n(y)}V${n(top)}z" fill="${C.parch}" stroke="${C.ink}" stroke-width="${sw}"/>`;
  s += `<path d="M${n(x - rx)} ${n(top + h * .22)}A${n(rx)} ${n(ry)} 0 0 0 ${n(x + rx)} ${n(top + h * .22)}M${n(x - rx)} ${n(top + h * .82)}A${n(rx)} ${n(ry)} 0 0 0 ${n(x + rx)} ${n(top + h * .82)}" stroke="${C.gold}" stroke-width="${n(sw * 1.3)}" fill="none"/>`;
  // a paper label wrapped round the tin (no free-floating cookie decal): a band that
  // follows the tin's curvature, with squiggle "lettering"
  const ly0 = top + h * .38, ly1 = top + h * .68, lx = rx * .62;
  s += `<path d="M${n(x - lx)} ${n(ly0 + ry * .55)}A${n(rx)} ${n(ry)} 0 0 0 ${n(x + lx)} ${n(ly0 + ry * .55)}V${n(ly1 + ry * .55)}A${n(rx)} ${n(ry)} 0 0 1 ${n(x - lx)} ${n(ly1 + ry * .55)}z" fill="${C.cream}" stroke="${C.ink}" stroke-width="${n(sw * .7)}"/>`;
  s += `<path d="M${n(x - lx * .6)} ${n((ly0 + ly1) / 2 + ry * .75)}q${n(lx * .3)} -3 ${n(lx * .6)} 0t${n(lx * .6)} 0M${n(x - lx * .4)} ${n((ly0 + ly1) / 2 + ry * .75 + h * .09)}q${n(lx * .2)} -2 ${n(lx * .4)} 0t${n(lx * .4)} 0" stroke="${C.plum}" stroke-width="${n(Math.max(1.2, sw * .6))}" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M${n(x - rx * .72)} ${n(top + ry + 2)}V${n(y - 2)}" stroke="${C.cream}" stroke-width="${n(w * .07)}" opacity=".9" stroke-linecap="round"/>`;
  s += `<path d="M${n(x + rx * .72)} ${n(top + ry + 2)}V${n(y)}" stroke="${C.ink}" stroke-width="${n(w * .08)}" opacity=".15"/>`;
  if (open) {
    s += `<ellipse cx="${x}" cy="${n(top)}" rx="${n(rx)}" ry="${n(ry)}" fill="${C.deep}" stroke="${C.ink}" stroke-width="${sw}"/>`;
  } else {
    const lh = h * 0.22;
    s += `<path d="M${n(x - rx - 3)} ${n(top)}V${n(top - lh)}A${n(rx + 3)} ${n(ry)} 0 0 1 ${n(x + rx + 3)} ${n(top - lh)}V${n(top)}A${n(rx + 3)} ${n(ry)} 0 0 1 ${n(x - rx - 3)} ${n(top)}z" fill="${C.blue}" stroke="${C.ink}" stroke-width="${sw}"/>`;
    s += `<ellipse cx="${x}" cy="${n(top - lh)}" rx="${n(rx + 3)}" ry="${n(ry)}" fill="${C.blueL}" stroke="${C.ink}" stroke-width="${sw}"/>`;
    s += `<ellipse cx="${n(x - rx * .35)}" cy="${n(top - lh - ry * .15)}" rx="${n(rx * .32)}" ry="${n(ry * .32)}" fill="${C.cream}" opacity=".6"/>`;
    s += `<path d="M${n(x - rx * .6)} ${n(top - lh * .45)}v${n(lh * .5)}" stroke="${C.cream}" stroke-width="${n(w * .05)}" opacity=".6" stroke-linecap="round"/>`;
  }
  return s;
}

export function pipsFor(v, o) {
  const m = { 1: [[0, 0]], 2: [[-o, -o], [o, o]], 3: [[-o, -o], [0, 0], [o, o]], 4: [[-o, -o], [o, -o], [-o, o], [o, o]], 5: [[-o, -o], [o, -o], [0, 0], [-o, o], [o, o]], 6: [[-o, -o], [o, -o], [-o, 0], [o, 0], [-o, o], [o, o]] };
  return m[v] || [];
}

// A 3/4-view d6. x,y centre of front face; sz size; v value on front.
export function die3d(x, y, sz, v, o = {}) {
  const { r = 0, fill = C.cream, pip = C.ink, hot = false, glint = false } = o;
  const d = sz * 0.3, h = sz / 2;
  const topF = `<path d="M${n(-h + 2)} ${n(-h)}L${n(-h + d + 2)} ${n(-h - d)}H${n(h + d - 2)}L${n(h - 2)} ${n(-h)}z" fill="${hot ? C.soft : C.parch}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  const sideF = `<path d="M${n(h)} ${n(-h + 2)}L${n(h + d)} ${n(-h - d + 2)}V${n(h - d - 2)}L${n(h)} ${n(h - 2)}z" fill="${hot ? C.deep : C.edge}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  const front = `<rect x="${n(-h)}" y="${n(-h)}" width="${sz}" height="${sz}" rx="${n(sz * .14)}" fill="${hot ? C.plum : fill}" stroke="${C.ink}" stroke-width="2.6"/>`;
  const pc = hot ? C.goldB : pip;
  const P = pipsFor(v, sz * 0.25).map(([px, py]) => `<circle cx="${n(px)}" cy="${n(py)}" r="${n(sz * .085)}" fill="${pc}"/>`).join("");
  const shine = `<path d="M${n(-h + sz * .16)} ${n(h - sz * .2)}V${n(-h + sz * .2)}" stroke="${hot ? C.soft : C.cream}" stroke-width="${n(sz * .06)}" stroke-linecap="round" opacity=".6"/>`;
  const gl = glint ? sparkle(h + d * .6, -h - d * .9, sz * .22) : "";
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(r)})">${topF}${sideF}${front}${shine}${P}${gl}</g>`;
}

export function sparkle(x, y, r, fill = C.goldB, stroke = C.ink) {
  const a = r, b = r * 0.26;
  return `<path d="M${n(x)} ${n(y - a)}Q${n(x + b)} ${n(y - b)} ${n(x + a)} ${n(y)}Q${n(x + b)} ${n(y + b)} ${n(x)} ${n(y + a)}Q${n(x - b)} ${n(y + b)} ${n(x - a)} ${n(y)}Q${n(x - b)} ${n(y - b)} ${n(x)} ${n(y - a)}z" fill="${fill}" stroke="${stroke}" stroke-width="${n(Math.max(0.9, r * .1))}" stroke-linejoin="round"/>`;
}

// The shared vignette stage: soft parchment glow + an inked ground with hatch.
export function stage(id, o = {}) {
  const { w = 900, h = 300, groundY = 262, cx = 450, glow = true, ground = true, gw = 0.8 } = o;
  let s = `<defs><radialGradient id="${id}-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${C.parch}"/><stop offset=".6" stop-color="${C.parch}" stop-opacity=".75"/><stop offset="1" stop-color="${C.parch}" stop-opacity="0"/></radialGradient></defs>`;
  if (glow) s += `<ellipse cx="${cx}" cy="${n(h * .5)}" rx="${n(w * .48)}" ry="${n(h * .5)}" fill="url(#${id}-glow)"/>`;
  if (ground) {
    const x0 = cx - w * gw / 2, x1 = cx + w * gw / 2;
    s += `<path d="M${n(x0)} ${groundY}H${n(x1)}" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/>`;
    let d = "";
    for (let xx = x0 + 14; xx < x1 - 4; xx += 11) d += `M${n(xx)} ${groundY + 5}l-7 9`;
    s += `<path d="${d}" stroke="${C.ink}" stroke-width="1.3" opacity=".3"/>`;
  }
  return s;
}

export const shadow = (x, y, rx, ry = rx * 0.18, op = .18) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${C.ink}" opacity="${op}"/>`;
export const line = (d, w = 2, c = C.ink, extra = "") => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
export const silk = (x1, y1, x2, y2, sag = 10, c = C.gold, w = 1.6) => `<path d="M${n(x1)} ${n(y1)}Q${n((x1 + x2) / 2)} ${n((y1 + y2) / 2 + sag)} ${n(x2)} ${n(y2)}" stroke="${c}" stroke-width="${w}" fill="none"/>`;

// Cobweb fan anchored at a corner (x,y) spreading into the quadrant given by angles a0..a1 (deg).
export function cobweb(x, y, R, a0 = 0, a1 = 90, spokes = 6, rings = 5, stroke = C.ink, w = 1.4, op = 1) {
  const rad = d => d * Math.PI / 180;
  let d = "";
  const angs = [];
  for (let i = 0; i < spokes; i++) angs.push(a0 + (a1 - a0) * i / (spokes - 1));
  for (const a of angs) d += `M${n(x)} ${n(y)}L${n(x + Math.cos(rad(a)) * R)} ${n(y + Math.sin(rad(a)) * R)}`;
  for (let k = 1; k <= rings; k++) {
    const rr = R * (k / (rings + 0.4)) ** 1.1;
    for (let i = 0; i < spokes - 1; i++) {
      const p = [x + Math.cos(rad(angs[i])) * rr, y + Math.sin(rad(angs[i])) * rr];
      const q = [x + Math.cos(rad(angs[i + 1])) * rr, y + Math.sin(rad(angs[i + 1])) * rr];
      const mA = rad((angs[i] + angs[i + 1]) / 2), mr = rr * 0.86;
      d += `M${n(p[0])} ${n(p[1])}Q${n(x + Math.cos(mA) * mr)} ${n(y + Math.sin(mA) * mr)} ${n(q[0])} ${n(q[1])}`;
    }
  }
  return `<path d="${d}" stroke="${stroke}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
}

export const ART = new URL("../../../art/", import.meta.url).pathname; // book/art/
