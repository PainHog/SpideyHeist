import { C, n, svg, spider, tin, cookie, flatCookie, sparkle, stipple, hatch, rng, line, shadow, stage, die3d, pipsFor } from "./lib.mjs";
import { pencil, magnifier } from "./parts.mjs";

const V = (title, body) => svg("0 0 900 300", title, body);
const GY = 262;

export function ch_welcome() {
  const P = "cw";
  let s = stage(P);
  // a box the spider stands on (left)
  s += `<path d="M150 ${GY}V196h120v${GY - 196}" fill="${C.edge}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += hatch(`${P}-bx`, `<rect x="150" y="196" width="120" height="66"/>`, 150, 196, 270, 262, 8, 60, C.ink, 1.2, .3);
  s += `<rect x="146" y="190" width="128" height="10" rx="2" fill="${C.parch}" stroke="${C.ink}" stroke-width="3"/>`;
  // spider standing on the box, every foot on the box top (y 190), eyes locked on the tin
  s += spider({ x: 210, y: 172, s: .95, look: [1, .2], brow: "up", mouth: "o", mark: "chevron",
    legOverride: {
      R0: [[9, -6], [18, -18], [14, 18.9]], L0: [[-9, -6], [-18, -18], [-14, 18.9]],
      R1: [[12, -2], [30, -20], [28, 18.9]], L1: [[-12, -2], [-30, -20], [-28, 18.9]],
      R2: [[13, 3], [42, -12], [42, 18.9]], L2: [[-13, 3], [-42, -12], [-42, 18.9]],
      R3: [[10, 7], [48, -2], [54, 18.9]], L3: [[-10, 7], [-48, -2], [-54, 18.9]] } });
  // drool drop hanging from the mouth
  s += `<path d="M211 180.5q-2 5 0 7q2 -2 0 -7z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.2"/>`;
  // eyeline
  s += line("M232 164Q400 80 520 140", 2.2, C.gold, ` stroke-dasharray="2 8"`);
  // the tin: lid off, cookies inside peeking over the rim, nobody guarding
  s += tin(590, GY, 130, 110, { open: true, glow: true, sw: 3 });
  { // cookies stand inside the tin: clip them to the area above the front rim
    const rx = 65, ry = 130 * .16, top = GY - ry - 110;
    s += `<clipPath id="${P}-in"><path d="M${590 - rx} ${n(top)}A${rx} ${n(ry)} 0 0 0 ${590 + rx} ${n(top)}V0H${590 - rx}z"/></clipPath>`;
    // a tin packed full: a row of cookies standing on edge, the back ones peeking between the front ones
    s += `<g clip-path="url(#${P}-in)">${cookie(548, 146, 22, 8)}${cookie(632, 144, 22, 9)}${cookie(590, 138, 23, 7)}${cookie(566, 146, 24, 4)}${cookie(612, 140, 26, 6)}</g>`;
  }
  // the lid, full size (same diameter as the tin), stood on its rim and leaning against the tin
  s += shadow(690, GY, 26, 4);
  s += `<ellipse cx="680" cy="${GY - 65}" rx="22" ry="66" fill="${C.blue}" stroke="${C.ink}" stroke-width="3" transform="rotate(-10 680 ${GY - 65})"/>`;
  s += `<ellipse cx="674" cy="${GY - 65}" rx="15" ry="58" fill="${C.blueL}" stroke="${C.ink}" stroke-width="2.4" transform="rotate(-10 674 ${GY - 65})"/>`;
  s += `<ellipse cx="670" cy="${GY - 90}" rx="3.4" ry="16" fill="${C.cream}" opacity=".6" transform="rotate(-10 670 ${GY - 90})"/>`;
  // a cookie that rolled out and fell flat
  s += flatCookie(470, GY, 22, 12, true);
  // crumbs lying on the floor where it landed
  for (const [cx, rr] of [[436, 2.6], [446, 1.8], [504, 2.2], [514, 1.6], [424, 1.5]]) s += `<ellipse cx="${cx}" cy="${n(GY - rr * .5)}" rx="${rr}" ry="${n(rr * .55)}" fill="${C.gold}" stroke="${C.ink}" stroke-width=".9"/>`;
  s += sparkle(540, 96, 10) + sparkle(640, 108, 7) + sparkle(626, 84, 4.5) + sparkle(420, 90, 4);
  return V("A spider eyes an unguarded cookie tin", s);
}

export function ch_dice() {
  const P = "cd";
  let s = stage(P, { gw: .94 });   // wide floor: the thrower stands well inside it
  // the thrower (right) flings the dice leftwards: two still in flight, three already landed flat
  // flight arcs start at the thrower's raised foot; bounce ticks where a die hit the table
  s += line("M704 147Q682 98 660 112", 2, C.ink, ` stroke-dasharray="3 8" opacity=".45"`);
  s += line("M704 147Q540 -10 404 170Q392 220 380 256Q352 110 282 118", 2, C.ink, ` stroke-dasharray="3 8" opacity=".45"`);
  s += line("M370 258l-6 -8M380 256v-10M390 258l6 -8", 2, C.ink, ` opacity=".5"`);
  // landed dice: flat on the table, square to it, with contact shadows
  s += shadow(310, GY, 50, 6) + shadow(440, GY, 46, 6) + shadow(576, GY, 48, 6);
  s += die3d(300, GY - 40, 80, 5, { hot: true, glint: true });
  s += die3d(430, GY - 36, 72, 2);
  s += die3d(566, GY - 38, 76, 6, { hot: true, glint: true });
  // airborne dice: tumbling (tilted), with faint shadows on the table below
  s += shadow(262, GY, 26, 3, .1) + shadow(656, GY, 28, 3, .1);
  s += die3d(262, 112, 56, 1, { r: 30 });
  s += die3d(656, 118, 60, 4, { r: -24, hot: true, glint: true });
  // motion ticks trail behind each die (on the side it came from)
  s += line("M326 92l16 -8M328 112l20 0M716 104l18 6M712 122l16 2", 2.4, C.ink, ` opacity=".7"`);
  // thrower spider (right), one leg flung up
  s += shadow(770, GY, 90, 7);
  s += spider({ x: 770, y: 222, s: 1.5, look: [-1, -.6], mouth: "big", brow: "up", mark: "dots",
    legOverride: { L0: [[-9, -6], [-26, -30], [-44, -50]], L1: [[-12, -2], [-34, -24], [-52, -30]] } });
  s += sparkle(360, 150, 6) + sparkle(620, 160, 5);
  return V("Six-sided dice tumbling, the fours, fives and sixes glinting", s);
}

export function ch_grid() {
  const P = "cg";
  let s = stage(P, { ground: false });
  // grid in perspective: 10 x 4 squares on a parchment board
  const x0 = 190, x1 = 710, xb0 = 80, xb1 = 820, yt = 96, yb = 268, cols = 10, rows = 4;
  s += `<path d="M${xb0 + 6} ${yb + 8}L${x0 + 6} ${yt + 8}H${x1 + 6}L${xb1 + 6} ${yb + 8}Z" fill="${C.ink}" opacity=".18"/>`;
  s += `<path d="M${xb0} ${yb}L${x0} ${yt}H${x1}L${xb1} ${yb}Z" fill="${C.parch}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  const at = (c, r) => { // c 0..cols, r 0..rows (perspective-ish)
    const t = r / rows, y = yt + (yb - yt) * t;
    const l = x0 + (xb0 - x0) * t, R = x1 + (xb1 - x1) * t;
    return [l + (R - l) * c / cols, y];
  };
  let gd = "";
  for (let c = 1; c < cols; c++) { const a = at(c, 0), b = at(c, rows); gd += `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`; }
  for (let r = 1; r < rows; r++) { const a = at(0, r), b = at(cols, r); gd += `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`; }
  s += line(gd, 1.6, C.ink, ` opacity=".55"`);
  const cell = (c, r) => { const p = [at(c, r), at(c + 1, r), at(c + 1, r + 1), at(c, r + 1)]; return `M${p.map(q => `${n(q[0])} ${n(q[1])}`).join("L")}Z`; };
  const mid = (c, r) => { const a = at(c + .5, r + .5); return a; };
  // squares counted: gold footprints across 4 squares
  for (let c = 3; c <= 6; c++) s += `<path d="${cell(c, 2)}" fill="${C.goldB}" opacity=".45"/>`;
  for (let c = 3; c <= 6; c++) { const [x, y] = mid(c, 2); for (let k = 0; k < c - 2; k++) s += `<circle cx="${n(x - (c - 3) * 5 + k * 10)}" cy="${n(y)}" r="3.4" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.2"/>`; }
  // hop arcs showing the count
  for (let c = 2; c <= 5; c++) { const [ax, ay] = mid(c, 2), [bx, by] = mid(c + 1, 2); s += line(`M${n(ax + 8)} ${n(ay - 10)}Q${n((ax + bx) / 2)} ${n(ay - 44)} ${n(bx - 8)} ${n(by - 10)}`, 2.2, C.gold, ` stroke-dasharray="3 6"`); }
  // tokens: bottle cap (threat) and a thimble
  const cap = (c, r, col) => { const [x, y] = mid(c, r); return `<ellipse cx="${n(x)}" cy="${n(y + 6)}" rx="20" ry="7" fill="${C.ink}" opacity=".25"/><path d="M${n(x - 18)} ${n(y)}v6q18 9 36 0v-6" fill="${col}" stroke="${C.ink}" stroke-width="2.4"/><ellipse cx="${n(x)}" cy="${n(y)}" rx="18" ry="6.5" fill="${col}" stroke="${C.ink}" stroke-width="2.4"/>`; };
  s += cap(8, 1, C.oxB);
  s += cap(1, 3, C.good);
  // a pawn-like token (a thimble)
  // (standing open end down: only the FRONT half of its rim shows, and it casts a contact shadow)
  { const [x, y] = mid(8, 3); s += `<ellipse cx="${n(x + 3)}" cy="${n(y + 6)}" rx="20" ry="6" fill="${C.ink}" opacity=".25"/>`;
    s += `<path d="M${n(x - 16)} ${n(y + 4)}q2 -34 16 -36q14 2 16 36a16 5 0 0 1 -32 0z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.4"/>` + stipple(3, x, y - 12, 9, 12, 16, .9, C.ink, .55);
    s += line(`M${n(x - 15)} ${n(y + 1)}a16 5 0 0 0 30 0`, 1.6, C.parch); }
  // the counting spider standing on square (2,2), a leg pointing along
  // (scaled so its legs stay clear of the first counted square)
  { const [x0, y] = mid(2, 2), x = x0 - 10; s += shadow(x + 4, y + 10, 44, 5); s += spider({ x, y: y - 15, s: .9, look: [1, .6], brow: "up", mouth: "o", hat: "goggles", mark: "stripe",
      legOverride: { R0: [[9, -6], [28, -20], [46, -8]] } }); }
  s += sparkle(560, 104, 6) + sparkle(210, 100, 4);
  return V("A spider counts squares across a grid", s);
}

// species silhouettes in a police line-up
export function ch_species() {
  const P = "csp";
  let s = stage(P, { ground: false });
  // line-up wall with height bars
  s += `<rect x="90" y="30" width="720" height="232" fill="${C.edge}" stroke="${C.ink}" stroke-width="3"/>`;
  let hb = "";
  for (let y = 60; y < 262; y += 34) hb += `M90 ${y}H810`;
  s += line(hb, 2, C.ink, ` opacity=".35"`);
  let tk = "";
  for (let y = 60; y < 262; y += 17) tk += `M90 ${y}h${(y - 60) % 34 ? 10 : 20}M810 ${y}h-${(y - 60) % 34 ? 10 : 20}`;
  s += line(tk, 2, C.ink, ` opacity=".6"`);
  s += `<rect x="70" y="262" width="760" height="14" fill="${C.plum}" stroke="${C.ink}" stroke-width="3"/>`;
  const sil = { body: C.deep, hi: C.plum, mark: "none" };
  // spaced and scaled so no two suspects' legs cross (every leg can be counted)
  // 1 jumping: compact, huge front eyes
  s += spider({ x: 141, y: 262 - 18 * 1.02, s: 1.02, ...sil, abd: [0, -20, 16, 14], look: [0, 0], mouth: "grin", legOverride: {} , pose: "tuck", legW: 1.3 });
  // 2 orb weaver: big round abdomen
  s += spider({ x: 250, y: 262 - 26 * .9, s: .9, ...sil, abd: [0, -34, 28, 28], mouth: "smirk", pose: "stand" });
  // 3 wolf: long body, sturdy legs
  s += spider({ x: 380, y: 262 - 26 * .98, s: .98, ...sil, abd: [0, -30, 15, 22], legW: 1.5, mouth: "flat", brow: "down", pose: "stand" });
  // 4 cellar: tiny body, very long legs
  s += spider({ x: 514, y: 262 - 91 * .74, s: .74, ...sil, abd: [0, -18, 12, 10], legW: .8, mouth: "o", pose: "stand",
    legOverride: {
      R0: [[9, -6], [28, -60], [23, 91]], L0: [[-9, -6], [-28, -60], [-23, 91]],
      R1: [[12, -2], [42, -56], [49, 91]], L1: [[-12, -2], [-42, -56], [-49, 91]],
      R2: [[13, 3], [54, -40], [70, 91]], L2: [[-13, 3], [-54, -40], [-70, 91]],
      R3: [[10, 7], [56, -20], [84, 91]], L3: [[-10, 7], [-56, -20], [-84, 91]] } });
  // 5 spitting: domed head
  s += spider({ x: 645, y: 262 - 26 * .94, s: .94, ...sil, abd: [0, -26, 17, 15], mouth: "o", brow: "up", pose: "stand",
    over: `<path d="M-14 -4q14 -30 28 0" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.2"/><path d="M-6 -16q6 -6 12 0" stroke="${C.plum}" stroke-width="2" fill="none"/>` });
  // 6 crab: crab spiders hold the front two pairs out sideways; the back pairs stand on the plinth
  s += spider({ x: 758, y: 262 - 25.7 * .86, s: .86, ...sil, abd: [0, -16, 22, 12], mouth: "smirk", pose: "sprawl", brow: "down",
    legOverride: { R2: [[13, 3], [42, -6], [56, 25.7]], L2: [[-13, 3], [-42, -6], [-56, 25.7]], R3: [[10, 7], [34, 0], [42, 25.7]], L3: [[-10, 7], [-34, 0], [-42, 25.7]] } });
  // line-up numbers painted on the front of the plinth
  [141, 250, 380, 514, 645, 758].forEach((x, i) => s += `<rect x="${x - 9}" y="264" width="18" height="11" rx="2" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.4"/><text x="${x}" y="273.2" font-family="Georgia, serif" font-size="10" font-weight="bold" fill="${C.ink}" text-anchor="middle">${i + 1}</text>`);
  return V("A line-up of spider silhouettes of different shapes", s);
}

export function ch_roles() {
  const P = "cr";
  let s = stage(P);
  const xs = [110, 225, 340, 450, 565, 680, 800];
  xs.forEach(x => s += shadow(x, GY, 44, 6));
  // 1 bow tie (Face)
  // (lying flat on the floor, so seen foreshortened: a squashed bow with a thin edge)
  { const x = xs[0], y = GY - 14; s += `<path d="M${x} ${y + 4}l-40 -9q-8 10 0 20zM${x} ${y + 4}l40 -9q8 10 0 20z" fill="${C.ox}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
    s += `<path d="M${x} ${y}l-40 -9q-8 10 0 20zM${x} ${y}l40 -9q8 10 0 20z" fill="${C.oxB}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<ellipse cx="${x}" cy="${y}" rx="9" ry="6" fill="${C.ox}" stroke="${C.ink}" stroke-width="2.6"/>`;
    s += line(`M${x - 30} ${y - 4}q8 4 0 9M${x + 30} ${y - 4}q-8 4 0 9`, 2, C.ink, ` opacity=".5"`); s += sparkle(x + 34, y - 26, 5); }
  // 2 vent grille (Ghost)
  { const x = xs[1], y = GY - 34;
    s += `<path d="M${x - 38} ${y - 40}l14 -12h78l-12 12zM${x + 42} ${y - 36}l12 -16V${GY - 12}l-12 12z" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
    s += `<rect x="${x - 42}" y="${y - 40}" width="84" height="74" rx="6" fill="${C.edge}" stroke="${C.ink}" stroke-width="3"/>`;
    let sl = ""; for (let k = 0; k < 5; k++) sl += `M${x - 30} ${y - 26 + k * 12}h60`; s += line(sl, 6, C.ink) + line(sl, 2.5, C.deep);
    s += `<circle cx="${x - 34}" cy="${y - 32}" r="3" fill="${C.ink}"/><circle cx="${x + 34}" cy="${y + 26}" r="3" fill="${C.ink}"/>`;
    s += `<circle cx="${x - 6}" cy="${y - 2}" r="2.6" fill="${C.goldB}"/><circle cx="${x + 6}" cy="${y - 2}" r="2.6" fill="${C.goldB}"/>`; }
  // 3 goggles (Tinkerer)
  // goggles lie on the lens rims; the strap flops down to the ground behind them
  { const x = xs[2], y = GY - 10; const strap = `M${x - 40} ${y - 2}Q${x - 58} ${y - 18} ${x} ${y - 20}Q${x + 58} ${y - 18} ${x + 40} ${y - 2}`;
    s += line(strap, 6, C.ink) + line(strap, 3, C.plum);
    for (const d of [-22, 22]) s += `<path d="M${x + d - 20} ${y}v5a20 7 0 0 0 40 0v-5" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.6"/><ellipse cx="${x + d}" cy="${y}" rx="20" ry="7" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.6"/><ellipse cx="${x + d}" cy="${y}" rx="13" ry="4.5" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2"/><path d="M${x + d - 8} ${y - 1}q4 -2.4 9 -2.6" stroke="${C.cream}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    s += `<rect x="${x - 4}" y="${y - 2}" width="8" height="5" fill="${C.ink}"/>`; }
  // 4 boxing glove (Bruiser)
  { const x = xs[3], y = GY - 34; s += `<path d="M${x - 30} ${y + 10}q-12 -46 22 -54q40 -6 44 26q4 30 -20 40z" fill="${C.oxB}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="M${x - 34} ${y - 4}q-14 6 -6 22q10 6 18 -4" fill="${C.oxB}" stroke="${C.ink}" stroke-width="3"/>`;
    s += `<rect x="${x - 30}" y="${y + 8}" width="48" height="26" rx="4" fill="${C.cream}" stroke="${C.ink}" stroke-width="3"/>`;
    s += line(`M${x - 20} ${y + 16}h28M${x - 20} ${y + 25}h28`, 2, C.ink, ` opacity=".5"`);
    s += `<path d="M${x - 10} ${y - 34}q14 -4 22 6" stroke="${C.cream}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`; }
  // 5 spyglass (Lookout)
  { const x = xs[4], y = GY - 11.8; s += `<g transform="rotate(-4.2 ${x} ${y})"><rect x="${x - 48}" y="${y - 8}" width="36" height="16" rx="3" fill="${C.gold}" stroke="${C.ink}" stroke-width="3"/><rect x="${x - 14}" y="${y - 11}" width="30" height="22" rx="3" fill="${C.plum}" stroke="${C.ink}" stroke-width="3"/><rect x="${x + 14}" y="${y - 15}" width="34" height="30" rx="4" fill="${C.gold}" stroke="${C.ink}" stroke-width="3"/><ellipse cx="${x + 48}" cy="${y}" rx="5" ry="15" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2.6"/><path d="M${x - 44} ${y - 3}h26M${x + 18} ${y - 9}h24" stroke="${C.goldB}" stroke-width="2.4"/></g>`; }
  // 6 window (Wheelman)
  { const x = xs[5], y = GY - 44;
    s += `<path d="M${x - 52} ${y - 62}l12 -10h92l-12 10zM${x + 52} ${y - 62}l12 -10V${GY - 10}l-12 10z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
    s += `<rect x="${x - 52}" y="${y - 62}" width="104" height="${GY - y + 62}" fill="${C.parch}" stroke="${C.ink}" stroke-width="3"/>`;
    s += line(`M${x - 52} ${y - 36}h12M${x + 40} ${y - 36}h12M${x - 52} ${y + 6}h12M${x + 40} ${y + 6}h12`, 1.4, C.ink, ` opacity=".35"`);
    s += `<rect x="${x - 40}" y="${y - 50}" width="80" height="84" fill="${C.deep}" stroke="${C.ink}" stroke-width="3"/>`;
    s += `<circle cx="${x + 16}" cy="${y - 26}" r="10" fill="${C.cream}"/>`;
    s += line(`M${x} ${y - 50}v84M${x - 40} ${y - 8}h80`, 6, C.plum) ;
    s += `<rect x="${x - 40}" y="${y - 50}" width="80" height="84" fill="none" stroke="${C.ink}" stroke-width="3"/>`;
    s += `<rect x="${x - 48}" y="${y + 34}" width="96" height="10" fill="${C.soft}" stroke="${C.ink}" stroke-width="3"/>`;
    s += line(`M${x - 32} ${y - 42}l14 -0M${x - 32} ${y - 36}l8 0`, 2.4, C.cream, ` opacity=".5"`); }
  // 7 dust bunny (Grifter)
  { const x = xs[6], y = GY - 25; const R = rng(9); let fz = "";
    // fluff spreads out but stops at the floor
    for (let k = 0; k < 40; k++) { const a = R() * 6.28, r1 = 20 + R() * 10, r2 = r1 + 6 + R() * 8; fz += `M${n(x + Math.cos(a) * r1)} ${n(Math.min(GY - 1, y + Math.sin(a) * r1 * .8))}L${n(x + Math.cos(a) * r2)} ${n(Math.min(GY - 1, y + Math.sin(a) * r2 * .8))}`; }
    s += `<ellipse cx="${x}" cy="${y}" rx="30" ry="25" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.4"/>` + line(fz, 1.6, C.ink, ` opacity=".7"`);
    s += `<path d="M${x - 16} ${y - 20}q-6 -26 4 -30q6 10 4 30zM${x + 6} ${y - 22}q2 -26 12 -28q2 12 -4 30z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += `<circle cx="${x - 8}" cy="${y - 4}" r="3" fill="${C.ink}"/><circle cx="${x + 8}" cy="${y - 4}" r="3" fill="${C.ink}"/><circle cx="${x - 7}" cy="${y - 5}" r="1" fill="${C.goldB}"/><circle cx="${x + 9}" cy="${y - 5}" r="1" fill="${C.goldB}"/>`;
    s += line(`M${x - 4} ${y + 6}q4 3 8 0`, 1.8); }
  return V("Seven tools of the trade: bow tie, vent, goggles, glove, spyglass, window and dust bunny", s);
}

export function ch_attributes() {
  const P = "ca";
  let s = stage(P);
  // BODY: flexing with a crumb dumbbell
  s += shadow(150, GY, 56, 6);
  s += spider({ x: 150, y: 233.4, s: 1.1, mouth: "grin", brow: "down", mark: "stripe",
    legOverride: { R0: [[9, -6], [30, -12], [34, -48]], L0: [[-9, -6], [-30, -12], [-34, -48]] } });
  s += line("M88 181H212", 5, C.ink);
  s += line("M88 181H212", 2, C.edge);
  // cookie "plates" sit square on the bar, so from the front we see them edge-on
  for (const [cx, sd] of [[96, 1], [204, -1]]) for (const dx of [0, 9]) {
    const px = cx - sd * dx;
    s += `<ellipse cx="${px}" cy="181" rx="7" ry="20" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.4"/>` +
      `<path d="M${px - 2} 169v7M${px + 1} 185v6" stroke="${C.deep}" stroke-width="3" stroke-linecap="round"/>`;
  }
  s += line("M122 164l-6 -8M178 164l6 -8M150 160v-10", 2.4, C.gold);
  // WIT: thinking, leg on chin, gears/lightbulb
  s += shadow(370, GY, 56, 6);
  s += spider({ x: 370, y: 233.4, s: 1.1, look: [.6, -1], mouth: "flat", mark: "dots",
    legOverride: { R0: [[9, -6], [22, 10], [8, 18]] } });
  // the idea is a thought bubble (a drawn symbol), not an object in the room
  s += `<path d="M372 118q-8 -28 20 -32q10 -22 36 -12q24 -10 34 12q22 6 12 30q6 22 -18 24q-12 16 -34 6q-22 12 -36 -6q-22 -2 -14 -22z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<circle cx="420" cy="118" r="22" fill="${C.goldB}" stroke="${C.ink}" stroke-width="3"/><rect x="411" y="138" width="18" height="12" rx="2" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += line("M414 122q6 -8 12 0M420 122v14", 2);
  s += line("M420 90v-6M442 98l5 -5M398 98l-5 -5M447 118h6M393 118h-6", 2.6, C.gold);
  s += `<circle cx="386" cy="180" r="3.4" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.6"/><circle cx="394" cy="164" r="5" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.6"/>`;
  // NERVE: steady, eyes closed, meditating on the floor
  s += shadow(580, GY, 56, 6);
  s += spider({ x: 580, y: 233.4, s: 1.1, eyes: "closed", mouth: "grin", mark: "chevron",
    legOverride: { R0: [[9, -6], [26, 4], [8, 14]], L0: [[-9, -6], [-26, 4], [-8, 14]], R1: [[12, -2], [36, 10], [18, 22]], L1: [[-12, -2], [-36, 10], [-18, 22]] } });
  s += line("M526 172q54 -28 108 0", 2, C.good, ` stroke-dasharray="2 7"`);
  s += line("M540 154q40 -22 80 0", 2, C.good, ` stroke-dasharray="2 7" opacity=".6"`);
  // a fly buzzes past, unnoticed
  s += `<circle cx="650" cy="186" r="4" fill="${C.ink}"/><ellipse cx="646" cy="180" rx="4" ry="2.4" fill="${C.cream}" stroke="${C.ink}" stroke-width="1"/><ellipse cx="654" cy="180" rx="4" ry="2.4" fill="${C.cream}" stroke="${C.ink}" stroke-width="1"/>`;
  s += line("M660 190q14 8 24 -2t20 4", 1.4, C.ink, ` stroke-dasharray="2 4"`);
  // GRACE: balancing on the tip of a pencil stood on its flat end (a full-length pencil: spiders are small)
  s += shadow(790, GY, 16, 3);
  s += pencil(790, GY, 790, 116, 14);
  s += spider({ x: 790, y: 76.4, s: 1.1, r: 4, look: [0, 1], mouth: "o", brow: "up", mark: "star",
    legOverride: {
      R0: [[9, -6], [24, -30], [44, -44]], L0: [[-9, -6], [-24, -30], [-44, -44]],
      R1: [[12, -2], [38, -10], [60, -12]], L1: [[-12, -2], [-38, -10], [-60, -12]],
      R2: [[13, 3], [30, 20], [4, 36]], L2: [[-13, 3], [-30, 18], [-4, 36]],
      R3: [[10, 7], [40, 16], [62, 6]], L3: [[-10, 7], [-40, 16], [-62, 6]] } });
  s += line("M722 66q-8 10 0 20M858 66q8 10 0 20", 2, C.ink, ` opacity=".5"`);
  return V("Four spiders: flexing, thinking, steady and balancing", s);
}

export function ch_builder() {
  const P = "cb";
  let s = stage(P, { ground: false });
  // the desk top (seen from above, receding) and its front edge
  s += `<path d="M70 14H830L860 282H40z" fill="${C.edge}" opacity=".45"/>`;
  s += line("M160 60q200 -6 380 2M120 150q260 4 520 -2M90 230q300 -6 700 2", 1.2, C.gold, ` opacity=".5"`);
  s += `<path d="M40 282H860V300H40z" fill="${C.gold}" opacity=".35"/>`;
  s += line("M40 282H860", 3);
  // the sheet, tilted
  s += `<g transform="rotate(-5 450 150)">`;
  s += `<rect x="286" y="36" width="330" height="236" fill="${C.ink}" opacity=".2" transform="translate(6 6)"/>`;
  s += `<rect x="286" y="36" width="330" height="236" fill="${C.cream}" stroke="${C.ink}" stroke-width="3"/>`;
  // portrait box with a sketched spider
  s += `<rect x="304" y="54" width="92" height="92" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.2"/>`;
  s += spider({ x: 350, y: 106, s: .62, body: C.cream, hi: C.cream, mark: "none", mouth: "grin", legW: .8, sw: 2 });
  // "name" line & scribbles (no legible text)
  s += line("M412 66h180", 2, C.ink) + line("M416 58q10 -8 18 0t18 0 18 0 18 0 18 -2", 2, C.plum);
  // attribute rows: pip boxes
  for (let r = 0; r < 4; r++) {
    const y = 88 + r * 18; s += line(`M412 ${y}h52`, 2, C.ink, ` opacity=".5"`);
    for (let k = 0; k < 5; k++) s += `<circle cx="${480 + k * 20}" cy="${y - 3}" r="6" fill="${k < [3, 2, 4, 1][r] ? C.plum : C.cream}" stroke="${C.ink}" stroke-width="1.8"/>`;
  }
  // skills list lines
  for (let r = 0; r < 5; r++) { const y = 170 + r * 18; s += line(`M306 ${y}h110`, 1.6, C.ink, ` opacity=".45"`); s += `<rect x="424" y="${y - 10}" width="12" height="12" fill="${r % 2 ? C.cream : C.goldB}" stroke="${C.ink}" stroke-width="1.6"/>`; }
  // vitality track boxes
  for (let k = 0; k < 5; k++) s += `<rect x="${470 + k * 26}" y="164" width="20" height="20" rx="3" fill="${k === 0 ? C.good : C.cream}" stroke="${C.ink}" stroke-width="1.8"/>`;
  s += line("M470 208h128M470 226h96M470 244h112", 1.6, C.ink, ` opacity=".45"`);
  s += `</g>`;
  // the pencil lies on the desk, its tip resting on the sheet by the line it just drew; eraser crumbs, a die
  s += line("M560 236L728 204", 10, C.ink, ` opacity=".2"`);
  s += pencil(728, 196, 560, 228, 12);
  s += line("M540 236q10 4 20 0", 2, C.ink, ` opacity=".6"`);
  s += `<ellipse cx="640" cy="264" rx="3" ry="1.8" fill="${C.edge}" stroke="${C.ink}" stroke-width=".8"/><ellipse cx="652" cy="267" rx="2.2" ry="1.3" fill="${C.edge}" stroke="${C.ink}" stroke-width=".8"/><ellipse cx="630" cy="269" rx="2.4" ry="1.4" fill="${C.edge}" stroke="${C.ink}" stroke-width=".8"/>`;
  s += shadow(208, 262, 34, 5) + die3d(200, 237, 50, 6, { hot: true });
  // spider peeking over the desk (right), holding the eraser
  s += shadow(770, 262, 70, 6) + shadow(695, 264, 22, 3);
  s += `<rect x="678" y="244" width="34" height="20" rx="4" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.4"/><path d="M682 250h14" stroke="${C.edge}" stroke-width="2.4" stroke-linecap="round"/>`;
  s += spider({ x: 770, y: 226, s: 1.4, look: [-1, -.2], mouth: "grin", brow: "up", hat: "fedora", mark: "dots",
    legOverride: { L0: [[-9, -6], [-30, -18], [-47, 14]] } });
  // a thimble mug
  s += shadow(142, 262, 30, 4);
  s += `<path d="M120 262v-44h44v44z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.6"/><path d="M164 226q14 0 14 12t-14 12" fill="none" stroke="${C.ink}" stroke-width="2.6"/><path d="M120 234h44" stroke="${C.plum}" stroke-width="5"/>`;
  s += line("M132 208q-6 -12 2 -22M148 208q-6 -12 2 -22", 2, C.ink, ` opacity=".4"`);
  return V("A spider's character sheet on a desk, with a pencil", s);
}
