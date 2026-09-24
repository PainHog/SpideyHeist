import { C, n, svg, spider, tin, cookie, sparkle, stipple, hatch, rng, line, shadow, cobweb, pipsFor } from "./lib.mjs";
import { jar } from "./vig2.mjs";

const FONT = `font-family="Georgia, serif"`;
const text = (x, y, str, size = 16, o = {}) => {
  const { fill = C.ink, weight = "normal", anchor = "middle", style = "" } = o;
  return `<text x="${n(x)}" y="${n(y)}" ${FONT} font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${style ? ` font-style="${style}"` : ""}>${str}</text>`;
};

export function dice_success() {
  const P = "ds";
  const sz = 104, gap = 34, x0 = (900 - (6 * sz + 5 * gap)) / 2, y0 = 34;
  let s = "";
  for (let v = 1; v <= 6; v++) {
    const x = x0 + (v - 1) * (sz + gap), hot = v >= 4, cx = x + sz / 2, cy = y0 + sz / 2;
    if (hot) s += `<rect x="${x - 7}" y="${y0 - 7}" width="${sz + 14}" height="${sz + 14}" rx="22" fill="${C.goldB}" opacity=".45"/>`;
    s += `<rect x="${x + 4}" y="${y0 + 6}" width="${sz}" height="${sz}" rx="17" fill="${C.ink}" opacity="${hot ? .3 : .1}"/>`;
    s += `<rect x="${x}" y="${y0}" width="${sz}" height="${sz}" rx="17" fill="${hot ? C.plum : C.parch}" stroke="${hot ? C.ink : C.edge}" stroke-width="${hot ? 3.4 : 3}"/>`;
    if (hot) s += `<path d="M${x + 14} ${y0 + sz - 22}V${y0 + 22}" stroke="${C.soft}" stroke-width="6" stroke-linecap="round"/>`;
    for (const [px, py] of pipsFor(v, sz * .26)) s += `<circle cx="${n(cx + px)}" cy="${n(cy + py)}" r="${n(sz * .085)}" fill="${hot ? C.goldB : C.edge}"/>`;
    if (hot) { s += sparkle(x + sz - 2, y0 + 2, 11); s += text(cx, y0 + sz + 36, "Success", 20, { weight: "bold", fill: C.plum }); }
  }
  return svg("0 0 900 200", "Dice faces one to six: four, five and six are Successes", s);
}

export function alert_track() {
  const P = "at";
  const cw = 64, cg = 4, x0 = 28, y0 = 62, ch = 64;
  const X = v => x0 + v * (cw + cg);
  const band = v => v <= 2 ? C.good : v <= 4 ? C.gold : v <= 6 ? C.oxB : C.ox;
  let s = "";
  // rail behind the cells
  s += `<rect x="${x0 - 8}" y="${y0 - 8}" width="${X(10) - x0 + 8}" height="${ch + 16}" rx="12" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.6"/>`;
  for (let v = 0; v <= 9; v++) {
    const x = X(v), c = band(v);
    s += `<rect x="${x}" y="${y0}" width="${cw}" height="${ch}" rx="7" fill="${c}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += `<path d="M${x + 7} ${y0 + 8}h${cw - 20}" stroke="${C.cream}" stroke-width="3" stroke-linecap="round" opacity=".3"/>`;
    s += text(x + cw / 2, y0 + ch / 2 + 10, String(v), 28, { weight: "bold", fill: c === C.gold ? C.ink : C.cream });
  }
  // the Limit badge (Full Alert)
  const bx = X(10) + 8, bw = 150, bcx = bx + bw / 2, bcy = y0 + ch / 2;
  let burst = "";
  for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, r = k % 2 ? 44 : 58; burst += `${k ? "L" : "M"}${n(bcx + Math.cos(a) * r * 1.3)} ${n(bcy + Math.sin(a) * r * .72)}`; }
  s += `<path d="${burst}Z" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<rect x="${bcx - 46}" y="${y0}" width="92" height="${ch}" rx="10" fill="${C.ox}" stroke="${C.ink}" stroke-width="3"/>`;
  // alarm bell glyph inside the badge
  s += `<path d="M${bcx - 16} ${bcy + 12}q2 -30 16 -30t16 30z" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${bcx - 20} ${bcy + 12}h40" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/><circle cx="${bcx}" cy="${bcy + 17}" r="4" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2"/>`;
  s += line(`M${bcx - 30} ${bcy - 16}l-8 -6M${bcx + 30} ${bcy - 16}l8 -6M${bcx - 32} ${bcy + 2}h-9M${bcx + 32} ${bcy + 2}h9`, 2.6, C.goldB);
  // bands: brackets + labels
  const bands = [[0, 2, "Calm 0–2", C.good], [3, 4, "Stirring 3–4", C.gold], [5, 6, "Active 5–6", C.oxB], [7, 9, "Lockdown 7+", C.ox]];
  const by = y0 + ch + 18;
  for (const [a, b, lab, c] of bands) {
    const xa = X(a) + 2, xb = X(b) + cw - 2;
    s += `<path d="M${xa} ${by - 6}v8H${xb}v-8" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
    s += text((xa + xb) / 2, by + 26, lab, 18, { weight: "bold", fill: c === C.gold ? C.ink : c });
  }
  // Lockdown continues to the Limit: show the arrow under the badge
  s += `<path d="M${bcx - 70} ${by - 6}v8H${bcx + 70}v-8" fill="none" stroke="${C.ox}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
  s += text(bcx, by + 26, "Full Alert (at the Limit)", 16, { weight: "bold", fill: C.ox });
  // heading rule: the Alert rises this way
  s += `<path d="M${x0} 30H${X(10) + 150}" stroke="${C.edge}" stroke-width="2"/><path d="M${X(10) + 138} 22l14 8-14 8" fill="none" stroke="${C.edge}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
  s += `<circle cx="${x0}" cy="30" r="4" fill="${C.edge}"/>`;
  return svg("0 0 900 200", "The Alert track: Calm 0–2, Stirring 3–4, Active 5–6, Lockdown 7+, Full Alert at the Limit", s);
}

export function vitality_track() {
  const P = "vt";
  const xs = [96, 273, 450, 627, 804], cy = 92, R = 64;
  const ring = [C.good, C.gold, C.oxB, C.ox, C.ink];
  const labels = ["Unharmed", "Rattled −1", "Hurt −2 · ½ Speed", "Critical −3", "Out"];
  let s = "";
  // silk thread linking the states
  s += line(`M${xs[0]} ${cy}H${xs[4]}`, 2.4, C.gold);
  for (let i = 0; i < 4; i++) { const mx = (xs[i] + xs[i + 1]) / 2; s += `<path d="M${mx - 8} ${cy - 10}l12 10-12 10" fill="none" stroke="${C.gold}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`; }
  xs.forEach((x, i) => {
    s += `<circle cx="${x + 3}" cy="${cy + 5}" r="${R}" fill="${C.ink}" opacity=".12"/>`;
    s += `<circle cx="${x}" cy="${cy}" r="${R}" fill="${C.cream}" stroke="${ring[i]}" stroke-width="6"/>`;
    s += `<circle cx="${x}" cy="${cy}" r="${R + 3}" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`;
    s += `<circle cx="${x}" cy="${cy}" r="${R - 3}" fill="none" stroke="${C.ink}" stroke-width="1.2"/>`;
  });
  const band = (d, w = 4) => `<path d="${d}" stroke="${C.cream}" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" stroke="${C.ink}" stroke-width=".9" stroke-dasharray="1.5 2.5" opacity=".6"/>`;
  // each standing spider gets a contact shadow at its feet (y = cy + 14 + 26)
  for (const x of [xs[0], xs[1], xs[2] - 4, xs[3]]) s += shadow(x, cy + 41, 46, 4, .16);
  // 1 Unharmed
  s += spider({ x: xs[0], y: cy + 14, s: 1, mouth: "grin", look: [0, 0], mark: "chevron" });
  s += sparkle(xs[0] + 34, cy - 34, 6);
  // 2 Rattled: wobble lines, sweat drop
  s += spider({ x: xs[1], y: cy + 14, s: 1, mouth: "worried", brow: "worried", look: [.6, -.3], mark: "chevron" });
  s += line(`M${xs[1] - 44} ${cy - 30}q-6 6 0 12M${xs[1] + 44} ${cy - 30}q6 6 0 12`, 2.2);
  s += `<path d="M${xs[1] + 15.5} ${cy + 7}q-4 8 0 11q4 -3 0 -11z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.4"/>`;
  // 3 Hurt: bandages, a leg in a sling, limping
  s += spider({ x: xs[2] - 4, y: cy + 14, s: 1, mouth: "flat", brow: "worried", look: [0, .4], mark: "chevron",
    legOverride: { R0: [[9, -6], [20, -6], [14, 10]] },
    over: band("M-12 -30l24 12", 5) + `<rect x="5" y="-12" width="12" height="6" rx="1.5" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.2" transform="rotate(25 11 -9)"/>` });
  // a matchstick crutch under the limping side
  s += `<path d="M${xs[2] + 40} ${cy + 39}L${xs[2] + 30} ${cy - 4}" stroke="${C.ink}" stroke-width="6.5" stroke-linecap="round"/><path d="M${xs[2] + 40} ${cy + 39}L${xs[2] + 30} ${cy - 4}" stroke="${C.gold}" stroke-width="3.5" stroke-linecap="round"/>`;
  s += `<path d="M${xs[2] + 22} ${cy - 4}h16" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><path d="M${xs[2] + 22} ${cy - 4}h16" stroke="${C.gold}" stroke-width="3" stroke-linecap="round"/>`;
  s += sparkle(xs[2] - 30, cy - 32, 5, C.oxB);
  // 4 Critical: swirl eyes, lots of bandages, dizzy stars
  s += spider({ x: xs[3], y: cy + 14, s: 1, mouth: "worried", eyes: "swirl", mark: "none",
    over: band("M-17 -32l34 10", 5) + band("M-17 -22l34 -6", 5) + `<rect x="-14" y="-12" width="10" height="6" rx="1.5" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.2" transform="rotate(-30 -9 -9)"/>` });
  s += `<ellipse cx="${xs[3]}" cy="${cy - 36}" rx="26" ry="7" fill="none" stroke="${C.ink}" stroke-width="1.4" stroke-dasharray="3 4"/>`;
  s += sparkle(xs[3] - 22, cy - 38, 5) + sparkle(xs[3] + 18, cy - 32, 4.5) + sparkle(xs[3] + 4, cy - 44, 3.5);
  // 5 Out: in a jar
  s += `<g transform="translate(${xs[4]} ${cy + 46})">`;
  s += spider({ x: 0, y: -18 * .72 - 1.4, s: .72, mouth: "worried", eyes: "x", mark: "none", pose: "tuck", body: C.soft, hi: C.plum });
  s += `<path d="M-30 0v-58q0 -8 8 -9h44q8 1 8 9v58z" fill="${C.cream}" fill-opacity=".35" stroke="${C.ink}" stroke-width="2.8"/>`;
  s += `<rect x="-33" y="-78" width="66" height="13" rx="3" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<path d="M-22 -58v48" stroke="${C.cream}" stroke-width="4" stroke-linecap="round" opacity=".75"/>`;
  s += `<path d="M-40 0h80" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`;
  s += `</g>`;
  // labels
  xs.forEach((x, i) => s += text(x, cy + R + 36, labels[i], i === 2 ? 17 : 19, { weight: "bold", fill: i === 4 ? C.ink : i === 1 ? C.ink : ring[i] }));
  return svg("0 0 900 210", "The Vitality track: Unharmed, Rattled −1, Hurt −2 · ½ Speed, Critical −3, Out", s);
}

export function map_cookie() {
  const P = "mc";
  const rows = [
    "################",
    "V.....~~~~~~..C#",
    "#.....~~~~~~...#",
    "#..............#",
    "#....K.........#",
    "#.........DDDD.#",
    "################",
  ];
  const cs = 50, m = 20, W = 16, H = 7;
  if (rows.some(r => r.length !== W)) throw new Error("map row length");
  const X = c => m + c * cs, Y = r => m + r * cs;
  let s = "";
  // shadow + frame
  s += `<rect x="${m + 6}" y="${m + 8}" width="${W * cs}" height="${H * cs}" fill="${C.ink}" opacity=".18"/>`;
  s += `<rect x="${m}" y="${m}" width="${W * cs}" height="${H * cs}" fill="${C.parch}"/>`;
  // floor boards texture
  s += stipple(4, m + W * cs / 2, m + H * cs / 2, W * cs / 2, H * cs / 2, 260, .9, C.gold, .35);
  // cells
  let walls = "", counter = "", door = "";
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    const x = X(c), y = Y(r);
    if (ch === "#" || ch === "V") walls += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="${C.deep}"/>`;
    if (ch === "~") counter += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="${C.soft}"/>`;
    if (ch === "D") door += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="${C.edge}"/>`;
  }));
  s += walls + counter + door;
  // brick hatch on walls
  let br = "";
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch !== "#") return; const x = X(c), y = Y(r);
    br += `M${x} ${y + 17}h${cs}M${x} ${y + 34}h${cs}M${x + (r + c) % 2 * 25 + 12} ${y}v17M${x + ((r + c + 1) % 2) * 25 + 12} ${y + 17}v17M${x + (r + c) % 2 * 25 + 12} ${y + 34}v16`;
  }));
  s += line(br, 1.2, C.plum);
  // grid (every square visible)
  let gd = "";
  for (let c = 0; c <= W; c++) gd += `M${X(c)} ${m}V${Y(H)}`;
  for (let r = 0; r <= H; r++) gd += `M${m} ${Y(r)}H${X(W)}`;
  s += line(gd, 1.3, C.ink, ` opacity=".35"`);
  // room outline (inner wall edge)
  s += `<path d="M${X(1)} ${Y(1)}H${X(15)}V${Y(6)}H${X(1)}Z" fill="none" stroke="${C.ink}" stroke-width="3"/>`;
  // counter: 6-square run (two rows deep per the legend), wood edge
  s += `<rect x="${X(6)}" y="${Y(1)}" width="${6 * cs}" height="${2 * cs}" fill="none" stroke="${C.ink}" stroke-width="3"/>`;
  s += line(`M${X(6) + 4} ${Y(3) - 5}H${X(12) - 4}`, 3, C.plum);
  let gl = ""; for (let c = 6; c < 12; c++) gl += `M${X(c) + 12} ${Y(1) + 14}l10 -6M${X(c) + 26} ${Y(2) + 30}l12 -7`;
  s += line(gl, 2.4, C.cream, ` opacity=".55"`);
  // entry vent V at (0,1)
  { const x = X(0), y = Y(1); s += `<rect x="${x + 6}" y="${y + 6}" width="${cs - 12}" height="${cs - 12}" rx="3" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += line(`M${x + 12} ${y + 15}h26M${x + 12} ${y + 22}h26M${x + 12} ${y + 29}h26M${x + 12} ${y + 36}h26`, 3, C.ink);
    s += `<circle cx="${x + 10}" cy="${y + 10}" r="1.6" fill="${C.ink}"/><circle cx="${x + 40}" cy="${y + 40}" r="1.6" fill="${C.ink}"/>`; }
  // cabinet C at (14,1) with the blue-lidded tin
  { const x = X(14), y = Y(1); s += `<rect x="${x + 3}" y="${y + 3}" width="${cs - 6}" height="${cs - 6}" rx="3" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.6"/>`;
    s += line(`M${x + 25} ${y + 5}v${cs - 10}`, 1.6, C.ink, ` opacity=".5"`);
    s += `<circle cx="${x + 25}" cy="${y + 25}" r="15" fill="${C.goldB}" opacity=".5"/>`;
    s += `<circle cx="${x + 25}" cy="${y + 25}" r="11" fill="${C.blue}" stroke="${C.ink}" stroke-width="2.2"/><circle cx="${x + 25}" cy="${y + 25}" r="7.5" fill="${C.blueL}"/><circle cx="${x + 22}" cy="${y + 22}" r="2.4" fill="${C.cream}" opacity=".8"/>`; }
  // cat's bed K at (5,4)
  { const x = X(5), y = Y(4), cx = x + 25, cy = y + 25; s += `<circle cx="${cx}" cy="${cy}" r="20" fill="${C.ox}" stroke="${C.ink}" stroke-width="2.6"/><circle cx="${cx}" cy="${cy}" r="12" fill="${C.oxB}" stroke="${C.ink}" stroke-width="1.8"/>`;
    s += `<circle cx="${cx}" cy="${cy + 2}" r="3.4" fill="${C.cream}"/><circle cx="${cx - 5}" cy="${cy - 4}" r="1.8" fill="${C.cream}"/><circle cx="${cx}" cy="${cy - 6}" r="1.8" fill="${C.cream}"/><circle cx="${cx + 5}" cy="${cy - 4}" r="1.8" fill="${C.cream}"/>`; }
  // doorway D at (10..13,5): threshold boards, jamb posts and the open door's swing
  { const x = X(10), y = Y(5); let pl = ""; for (let k = 1; k < 16; k++) pl += `M${x + k * 12.5} ${y + 2}v${cs - 4}`;
    s += line(pl, 1, C.gold, ` opacity=".7"`);
    s += `<rect x="${x}" y="${y + cs - 10}" width="10" height="10" fill="${C.ink}"/><rect x="${x + 4 * cs - 10}" y="${y + cs - 10}" width="10" height="10" fill="${C.ink}"/>`;
    s += `<path d="M${x + 10} ${y + cs - 5}H${x + 4 * cs - 10}" stroke="${C.gold}" stroke-width="3"/>`;
    s += `<path d="M${x + 12} ${y + cs - 8}L${x + 60} ${y + 8}" stroke="${C.plum}" stroke-width="8" stroke-linecap="round"/><path d="M${x + 12} ${y + cs - 8}L${x + 60} ${y + 8}" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/>`;
    const L = Math.hypot(48, cs - 16); // hinge (x+12, y+cs-8) to leaf tip (x+60, y+8)
    s += `<path d="M${x + 60} ${y + 8}A${n(L)} ${n(L)} 0 0 1 ${n(x + 12 + L)} ${y + cs - 8}" fill="none" stroke="${C.ink}" stroke-width="1.4" stroke-dasharray="3 4"/>`; }
  // outer frame
  s += `<rect x="${m}" y="${m}" width="${W * cs}" height="${H * cs}" fill="none" stroke="${C.ink}" stroke-width="3.4"/>`;
  return svg(`0 0 ${W * cs + 2 * m} ${H * cs + 2 * m}`, "Heist 1 sample map: a 16 by 7 grid with the vent, counter, cabinet, cat's bed and door", s);
}

export function orn_divider() {
  let s = "";
  s += `<path d="M6 10Q300 20 594 10" stroke="${C.gold}" stroke-width="1.3" fill="none"/>`;
  s += `<circle cx="6" cy="10" r="2.2" fill="${C.ink}"/><circle cx="594" cy="10" r="2.2" fill="${C.ink}"/>`;
  for (const t of [.12, .24, .36, .64, .76, .88]) { const x = 6 + 588 * t, y = (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 20 + t * t * 10; s += `<circle cx="${n(x)}" cy="${n(y + 1.6)}" r="1.4" fill="${C.goldB}" stroke="${C.gold}" stroke-width=".6"/>`; }
  // tiny spider sitting on the thread, midway
  s += spider({ x: 300, y: 15 - 26 * .22, s: .22, pose: "stand", mark: "chevron", look: [0, .3], mouth: "grin", legW: 1.3 });
  return svg("0 0 600 24", "Section divider: a silk thread with a tiny spider", s);
}

export function orn_corner() {
  let s = "";
  s += cobweb(0, 0, 196, 0, 90, 7, 6, C.ink, 1.1, .55);
  // dew drops on the strands
  const R = rng(12);
  for (let i = 0; i < 10; i++) { const a = (Math.floor(R() * 7) / 6) * Math.PI / 2, r = 36 + R() * 140; s += `<circle cx="${n(Math.cos(a) * r)}" cy="${n(Math.sin(a) * r)}" r="${n(1.8 + R() * 1.4)}" fill="${C.goldB}" stroke="${C.gold}" stroke-width=".8"/>`; }
  // tiny spider dropping from the web on a gold thread
  s += `<path d="M124 71.6V${n(138 - 39 * .38 + .6)}" stroke="${C.gold}" stroke-width="1.4"/><circle cx="124" cy="71.6" r="2" fill="${C.gold}"/>`;
  s += spider({ x: 124, y: 138, s: .38, pose: "dangle", mark: "chevron", look: [0, .4], mouth: "grin" });
  return svg("0 0 200 200", "Cobweb corner flourish", s);
}

export function orn_spider() {
  let s = "";
  s += `<path d="M30 0V184" stroke="${C.gold}" stroke-width="1.6"/>`;
  s += `<circle cx="30" cy="4" r="2.4" fill="${C.ink}"/>`;
  s += spider({ x: 30, y: 206, s: .56, pose: "dangle", mark: "chevron", look: [0, .5], mouth: "grin" });
  return svg("0 0 60 240", "A tiny spider dangling on a thread", s);
}
