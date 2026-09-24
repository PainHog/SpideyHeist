import { C, n, svg, spider, tin, cookie, sparkle, stipple, hatch, rng, line, shadow, stage, die3d, pipsFor } from "./lib.mjs";
import { pencil, magnifier } from "./parts.mjs";

const V = (title, body) => svg("0 0 900 300", title, body);
const GY = 262;

export function ch_welcome() {
  const P = "cw";
  let s = stage(P);
  // counter edge the spider peeks over (left)
  s += `<path d="M150 ${GY}V196h120v${GY - 196}" fill="${C.edge}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += hatch(`${P}-bx`, `<rect x="150" y="196" width="120" height="66"/>`, 150, 196, 270, 262, 8, 60, C.ink, 1.2, .3);
  s += `<rect x="146" y="190" width="128" height="10" rx="2" fill="${C.parch}" stroke="${C.ink}" stroke-width="3"/>`;
  // spider peering over the box, eyes locked on the tin
  s += spider({ x: 236, y: 150, s: 2.2, look: [1, .2], brow: "up", mouth: "o", mark: "chevron",
    legOverride: { R0: [[9, -6], [20, 8], [22, 18]], L0: [[-9, -6], [-20, 8], [-22, 18]], R1: [[12, -2], [30, 6], [34, 18]], L1: [[-12, -2], [-30, 6], [-34, 18]] } });
  // drool drop
  s += `<path d="M246 178q-3 7 0 10q3 -3 0 -10z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.4"/>`;
  // eyeline
  s += line("M290 140Q420 90 520 140", 2.2, C.gold, ` stroke-dasharray="2 8"`);
  // the tin: lid ajar, cookies peeking, nobody guarding
  s += shadow(600, GY, 110, 10);
  s += tin(590, GY - 2, 130, 110, { open: true, glow: true, sw: 3 });
  s += cookie(566, 140, 24, 4) + cookie(608, 134, 26, 6);
  // lid leaning against the tin
  s += `<ellipse cx="712" cy="${GY - 40}" rx="18" ry="40" fill="${C.blue}" stroke="${C.ink}" stroke-width="3" transform="rotate(-12 712 ${GY - 40})"/>`;
  s += `<ellipse cx="704" cy="${GY - 40}" rx="12" ry="34" fill="${C.blueL}" stroke="${C.ink}" stroke-width="2.4" transform="rotate(-12 704 ${GY - 40})"/>`;
  s += `<ellipse cx="698" cy="${GY - 56}" rx="3" ry="10" fill="${C.cream}" opacity=".6" transform="rotate(-12 698 ${GY - 56})"/>`;
  // a cookie that rolled out
  s += cookie(470, GY - 20, 20, 12, true);
  s += sparkle(540, 96, 10) + sparkle(660, 110, 7) + sparkle(626, 84, 4.5) + sparkle(420, 90, 4);
  return V("A spider eyes an unguarded cookie tin", s);
}

export function ch_dice() {
  const P = "cd";
  let s = stage(P);
  // bounce trails
  s += line("M130 120q60 -60 120 10t110 -10", 2, C.ink, ` stroke-dasharray="3 8" opacity=".45"`);
  s += line("M560 110q50 -70 110 -10", 2, C.ink, ` stroke-dasharray="3 8" opacity=".45"`);
  s += shadow(300, GY, 48, 7) + shadow(430, GY, 48, 7) + shadow(560, GY, 44, 7) + shadow(690, GY, 40, 7);
  s += die3d(300, 214, 80, 5, { r: -8, hot: true, glint: true });
  s += die3d(430, 222, 72, 2, { r: 6 });
  s += die3d(566, 208, 76, 6, { r: 12, hot: true, glint: true });
  s += die3d(250, 110, 56, 1, { r: 30 });
  s += die3d(686, 120, 60, 4, { r: -24, hot: true, glint: true });
  // motion ticks
  s += line("M216 92l-18 -8M214 112l-22 0M726 102l20 -10M730 122l22 0", 2.4);
  // thrower spider (right), one leg flung up
  s += spider({ x: 800, y: 222, s: 1.5, look: [-1, -.6], mouth: "big", brow: "up", mark: "dots",
    legOverride: { L0: [[-9, -6], [-26, -30], [-44, -50]], L1: [[-12, -2], [-34, -24], [-52, -30]] } });
  s += sparkle(360, 150, 6) + sparkle(610, 150, 5);
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
  { const [x, y] = mid(8, 3); s += `<path d="M${n(x - 16)} ${n(y + 4)}q2 -34 16 -36q14 2 16 36z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.4"/>` + stipple(3, x, y - 12, 9, 12, 16, .9, C.ink, .55) + `<ellipse cx="${n(x)}" cy="${n(y + 4)}" rx="16" ry="5" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.4"/>`; }
  // the counting spider standing on square (2,2), a leg pointing along
  { const [x, y] = mid(2, 2); s += spider({ x, y: y - 22, s: 1.3, look: [1, .6], brow: "up", mouth: "o", hat: "goggles", mark: "stripe",
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
  // 1 jumping: compact, huge front eyes
  s += spider({ x: 170, y: 228, s: 1.25, ...sil, abd: [0, -20, 16, 14], look: [0, 0], mouth: "grin", legOverride: {} , pose: "tuck", legW: 1.3 });
  // 2 orb weaver: big round abdomen
  s += spider({ x: 290, y: 234, s: 1.1, ...sil, abd: [0, -34, 28, 28], mouth: "smirk", pose: "stand" });
  // 3 wolf: long body, sturdy legs
  s += spider({ x: 420, y: 230, s: 1.2, ...sil, abd: [0, -30, 15, 22], legW: 1.5, mouth: "flat", brow: "down", pose: "stand" });
  // 4 cellar: tiny body, very long legs
  s += spider({ x: 540, y: 180, s: .9, ...sil, abd: [0, -18, 12, 10], legW: .8, mouth: "o", pose: "stand",
    legOverride: {
      R0: [[9, -6], [30, -60], [26, 92]], L0: [[-9, -6], [-30, -60], [-26, 92]],
      R1: [[12, -2], [46, -56], [56, 92]], L1: [[-12, -2], [-46, -56], [-56, 92]],
      R2: [[13, 3], [60, -40], [80, 90]], L2: [[-13, 3], [-60, -40], [-80, 90]],
      R3: [[10, 7], [62, -20], [96, 84]], L3: [[-10, 7], [-62, -20], [-96, 84]] } });
  // 5 spitting: domed head
  s += spider({ x: 660, y: 228, s: 1.15, ...sil, abd: [0, -26, 17, 15], mouth: "o", brow: "up", pose: "stand",
    over: `<path d="M-14 -4q14 -30 28 0" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.2"/><path d="M-6 -16q6 -6 12 0" stroke="${C.plum}" stroke-width="2" fill="none"/>` });
  // 6 crab: wide, legs to the sides
  s += spider({ x: 760, y: 236, s: 1.05, ...sil, abd: [0, -16, 22, 12], mouth: "smirk", pose: "sprawl", brow: "down" });
  return V("A line-up of spider silhouettes of different shapes", s);
}

export function ch_roles() {
  const P = "cr";
  let s = stage(P);
  const xs = [110, 225, 340, 450, 565, 680, 800];
  xs.forEach(x => s += shadow(x, GY, 44, 6));
  // 1 bow tie (Face)
  { const x = xs[0], y = 214; s += `<path d="M${x} ${y}l-40 -24q-8 24 0 48zM${x} ${y}l40 -24q8 24 0 48z" fill="${C.oxB}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<rect x="${x - 9}" y="${y - 12}" width="18" height="24" rx="5" fill="${C.ox}" stroke="${C.ink}" stroke-width="3"/>`;
    s += line(`M${x - 30} ${y - 10}q10 10 0 22M${x + 30} ${y - 10}q-10 10 0 22`, 2, C.ink, ` opacity=".5"`); s += sparkle(x + 34, y - 36, 5); }
  // 2 vent grille (Ghost)
  { const x = xs[1], y = 200; s += `<rect x="${x - 42}" y="${y - 40}" width="84" height="74" rx="6" fill="${C.edge}" stroke="${C.ink}" stroke-width="3"/>`;
    let sl = ""; for (let k = 0; k < 5; k++) sl += `M${x - 30} ${y - 26 + k * 12}h60`; s += line(sl, 6, C.ink) + line(sl, 2.5, C.deep);
    s += `<circle cx="${x - 34}" cy="${y - 32}" r="3" fill="${C.ink}"/><circle cx="${x + 34}" cy="${y + 26}" r="3" fill="${C.ink}"/>`;
    s += `<circle cx="${x - 6}" cy="${y - 2}" r="2.6" fill="${C.goldB}"/><circle cx="${x + 6}" cy="${y - 2}" r="2.6" fill="${C.goldB}"/>`; }
  // 3 goggles (Tinkerer)
  { const x = xs[2], y = 222; s += line(`M${x - 50} ${y - 6}q50 -20 100 0`, 6, C.ink) + line(`M${x - 50} ${y - 6}q50 -20 100 0`, 3, C.ox);
    for (const d of [-22, 22]) s += `<circle cx="${x + d}" cy="${y}" r="20" fill="${C.gold}" stroke="${C.ink}" stroke-width="3"/><circle cx="${x + d}" cy="${y}" r="13" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2.4"/><path d="M${x + d - 7} ${y - 4}q4 -6 10 -6" stroke="${C.cream}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    s += `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="${C.ink}"/>`; }
  // 4 boxing glove (Bruiser)
  { const x = xs[3], y = 212; s += `<path d="M${x - 30} ${y + 10}q-12 -46 22 -54q40 -6 44 26q4 30 -20 40z" fill="${C.oxB}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="M${x - 34} ${y - 4}q-14 6 -6 22q10 6 18 -4" fill="${C.oxB}" stroke="${C.ink}" stroke-width="3"/>`;
    s += `<rect x="${x - 30}" y="${y + 8}" width="48" height="26" rx="4" fill="${C.cream}" stroke="${C.ink}" stroke-width="3"/>`;
    s += line(`M${x - 20} ${y + 16}h28M${x - 20} ${y + 25}h28`, 2, C.ink, ` opacity=".5"`);
    s += `<path d="M${x - 10} ${y - 34}q14 -4 22 6" stroke="${C.cream}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`; }
  // 5 spyglass (Lookout)
  { const x = xs[4], y = 216; s += `<g transform="rotate(-18 ${x} ${y})"><rect x="${x - 48}" y="${y - 8}" width="36" height="16" rx="3" fill="${C.gold}" stroke="${C.ink}" stroke-width="3"/><rect x="${x - 14}" y="${y - 11}" width="30" height="22" rx="3" fill="${C.plum}" stroke="${C.ink}" stroke-width="3"/><rect x="${x + 14}" y="${y - 15}" width="34" height="30" rx="4" fill="${C.gold}" stroke="${C.ink}" stroke-width="3"/><ellipse cx="${x + 48}" cy="${y}" rx="5" ry="15" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2.6"/><path d="M${x - 44} ${y - 3}h26M${x + 18} ${y - 9}h24" stroke="${C.goldB}" stroke-width="2.4"/></g>`; }
  // 6 window (Wheelman)
  { const x = xs[5], y = 204; s += `<rect x="${x - 40}" y="${y - 50}" width="80" height="84" fill="${C.deep}" stroke="${C.ink}" stroke-width="3"/>`;
    s += `<circle cx="${x + 16}" cy="${y - 26}" r="10" fill="${C.cream}"/>`;
    s += line(`M${x} ${y - 50}v84M${x - 40} ${y - 8}h80`, 6, C.plum) ;
    s += `<rect x="${x - 40}" y="${y - 50}" width="80" height="84" fill="none" stroke="${C.ink}" stroke-width="3"/>`;
    s += `<rect x="${x - 48}" y="${y + 34}" width="96" height="10" fill="${C.soft}" stroke="${C.ink}" stroke-width="3"/>`;
    s += line(`M${x - 32} ${y - 42}l14 -0M${x - 32} ${y - 36}l8 0`, 2.4, C.cream, ` opacity=".5"`); }
  // 7 dust bunny (Grifter)
  { const x = xs[6], y = 228; const R = rng(9); let fz = "";
    for (let k = 0; k < 40; k++) { const a = R() * 6.28, r1 = 20 + R() * 10, r2 = r1 + 6 + R() * 8; fz += `M${n(x + Math.cos(a) * r1)} ${n(y + Math.sin(a) * r1 * .8)}L${n(x + Math.cos(a) * r2)} ${n(y + Math.sin(a) * r2 * .8)}`; }
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
  s += shadow(150, GY, 70, 7);
  s += spider({ x: 150, y: 226, s: 1.45, mouth: "grin", brow: "down", mark: "stripe",
    legOverride: { R0: [[9, -6], [30, -8], [34, -38]], L0: [[-9, -6], [-30, -8], [-34, -38]] } });
  s += line("M72 176H228", 5, C.ink);
  s += line("M72 176H228", 2, C.edge);
  s += cookie(66, 176, 18, 2) + cookie(234, 176, 18, 5);
  s += line("M122 150l-6 -8M178 150l6 -8M150 146v-10", 2.4, C.gold);
  // WIT: thinking, leg on chin, gears/lightbulb
  s += shadow(370, GY, 70, 7);
  s += spider({ x: 370, y: 226, s: 1.45, look: [.6, -1], mouth: "flat", mark: "dots",
    legOverride: { R0: [[9, -6], [22, 10], [8, 18]] } });
  s += `<circle cx="420" cy="118" r="22" fill="${C.goldB}" stroke="${C.ink}" stroke-width="3"/><rect x="411" y="138" width="18" height="12" rx="2" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += line("M414 122q6 -8 12 0M420 122v14", 2);
  s += line("M420 84v-10M446 94l8 -8M394 94l-8 -8M456 118h10M384 118h-10", 2.6, C.gold);
  s += `<circle cx="392" cy="150" r="3.4" fill="${C.edge}" stroke="${C.ink}" stroke-width="1.6"/><circle cx="402" cy="138" r="5" fill="${C.edge}" stroke="${C.ink}" stroke-width="1.6"/>`;
  // NERVE: steady, eyes closed, calm hovering above a teacup... meditating
  s += shadow(580, GY, 70, 7);
  s += spider({ x: 580, y: 222, s: 1.45, eyes: "closed", mouth: "grin", mark: "chevron",
    legOverride: { R0: [[9, -6], [26, 4], [8, 14]], L0: [[-9, -6], [-26, 4], [-8, 14]], R1: [[12, -2], [36, 10], [18, 22]], L1: [[-12, -2], [-36, 10], [-18, 22]] } });
  s += line("M520 150q60 -30 120 0", 2, C.good, ` stroke-dasharray="2 7"`);
  s += line("M530 130q50 -26 100 0", 2, C.good, ` stroke-dasharray="2 7" opacity=".6"`);
  // a fly buzzes past, unnoticed
  s += `<circle cx="650" cy="186" r="4" fill="${C.ink}"/><ellipse cx="646" cy="180" rx="4" ry="2.4" fill="${C.cream}" stroke="${C.ink}" stroke-width="1"/><ellipse cx="654" cy="180" rx="4" ry="2.4" fill="${C.cream}" stroke="${C.ink}" stroke-width="1"/>`;
  s += line("M660 190q14 8 24 -2t20 4", 1.4, C.ink, ` stroke-dasharray="2 4"`);
  // GRACE: balancing on a pencil tip
  s += `<path d="M790 ${GY}l-10 -10h20z" fill="${C.ink}"/>`;
  s += pencil(790, GY - 8, 790, 160, 12);
  s += spider({ x: 790, y: 118, s: 1.25, r: 6, look: [0, 1], mouth: "o", brow: "up", mark: "star",
    legOverride: {
      R0: [[9, -6], [24, -30], [44, -44]], L0: [[-9, -6], [-24, -30], [-44, -44]],
      R1: [[12, -2], [38, -10], [60, -12]], L1: [[-12, -2], [-38, -10], [-60, -12]],
      R2: [[13, 3], [30, 20], [4, 36]], L2: [[-13, 3], [-30, 18], [-4, 36]],
      R3: [[10, 7], [40, 16], [62, 6]], L3: [[-10, 7], [-40, 16], [-62, 6]] } });
  s += line("M728 104q-8 10 0 20M852 104q8 10 0 20", 2, C.ink, ` opacity=".5"`);
  return V("Four spiders: flexing, thinking, steady and balancing", s);
}

export function ch_builder() {
  const P = "cb";
  let s = stage(P, { ground: false });
  // desk edge
  s += `<path d="M40 250H860V300H40z" fill="${C.gold}" opacity=".35"/>`;
  s += line("M40 250H860", 3);
  // the sheet, tilted
  s += `<g transform="rotate(-5 450 150)">`;
  s += `<rect x="286" y="36" width="330" height="236" fill="${C.ink}" opacity=".2" transform="translate(6 6)"/>`;
  s += `<rect x="286" y="36" width="330" height="236" fill="${C.cream}" stroke="${C.ink}" stroke-width="3"/>`;
  // portrait box with a sketched spider
  s += `<rect x="304" y="54" width="92" height="92" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.2"/>`;
  s += spider({ x: 350, y: 110, s: .9, body: C.cream, hi: C.cream, mark: "none", mouth: "grin", legW: .6, sw: 1.6 });
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
  // pencil, eraser crumbs, a die
  s += pencil(700, 70, 560, 220, 12);
  s += line("M548 232q10 4 20 0", 2, C.ink, ` opacity=".6"`);
  s += `<circle cx="640" cy="258" r="3" fill="${C.oxB}"/><circle cx="652" cy="262" r="2" fill="${C.oxB}"/><circle cx="632" cy="264" r="2.4" fill="${C.oxB}"/>`;
  s += die3d(200, 218, 50, 6, { r: -10, hot: true });
  // spider peeking over the desk (right), holding the eraser
  s += spider({ x: 770, y: 222, s: 1.4, look: [-1, -.2], mouth: "grin", brow: "up", hat: "fedora", mark: "dots",
    legOverride: { L0: [[-9, -6], [-26, -6], [-40, 10]] } });
  s += `<rect x="690" y="226" width="30" height="18" rx="4" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2.4" transform="rotate(-12 705 235)"/>`;
  // a thimble mug
  s += `<path d="M120 250v-44h44v44z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.6"/><path d="M164 214q14 0 14 12t-14 12" fill="none" stroke="${C.ink}" stroke-width="2.6"/><path d="M120 222h44" stroke="${C.plum}" stroke-width="5"/>`;
  s += line("M132 196q-6 -12 2 -22M148 196q-6 -12 2 -22", 2, C.ink, ` opacity=".4"`);
  return V("A spider's character sheet on a desk, with a pencil", s);
}
