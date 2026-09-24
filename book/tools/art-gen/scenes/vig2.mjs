import { C, n, svg, spider, tin, cookie, sparkle, stipple, hatch, rng, line, shadow, stage, die3d, cobweb, silk } from "./lib.mjs";

const V = (title, body) => svg("0 0 900 300", title, body);
const GY = 262;

// wooden spool wound with glowing silk. x,y = centre bottom
const spool = (id, x, y, w, h, glow = true) => {
  let s = "";
  if (glow) s += `<ellipse cx="${x}" cy="${n(y - h / 2)}" rx="${n(w * 1.1)}" ry="${n(h * .75)}" fill="url(#${id})"/>`;
  const fl = w * .62, fh = w * .2;
  s += `<rect x="${n(x - w / 2 + 6)}" y="${n(y - h + fh / 2)}" width="${n(w - 12)}" height="${n(h - fh)}" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2.6"/>`;
  let wind = ""; for (let yy = y - h + fh; yy < y - fh / 2; yy += 5) wind += `M${n(x - w / 2 + 7)} ${n(yy)}q${n(w / 2 - 7)} 3 ${n(w - 14)} 0`;
  s += line(wind, 1.4, C.gold);
  s += `<path d="M${n(x - w / 2 + 12)} ${n(y - h + fh)}v${n(h - fh * 1.6)}" stroke="${C.cream}" stroke-width="4" opacity=".8" stroke-linecap="round"/>`;
  for (const yy of [y - h + fh / 2, y - fh / 2]) s += `<ellipse cx="${x}" cy="${n(yy)}" rx="${n(w / 2 + 4)}" ry="${n(fh / 2)}" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<ellipse cx="${x}" cy="${n(y - h + fh / 2)}" rx="${n(w * .12)}" ry="${n(fh * .22)}" fill="${C.ink}"/>`;
  return s;
};

export function ch_silk() {
  const P = "csk";
  let s = stage(P);
  s += `<defs><radialGradient id="${P}-g"><stop offset="0" stop-color="${C.goldB}" stop-opacity=".7"/><stop offset="1" stop-color="${C.goldB}" stop-opacity="0"/></radialGradient></defs>`;
  s += shadow(170, GY, 60, 7) + shadow(290, GY, 50, 6) + shadow(390, GY, 36, 5);
  s += spool(`${P}-g`, 170, GY - 2, 96, 120);
  s += spool(`${P}-g`, 290, GY - 2, 76, 92);
  s += spool(`${P}-g`, 390, GY - 2, 56, 64);
  // the spinner hangs from its own dragline (anchored off the top of the frame, taut and vertical,
  // attached at the spinnerets on the tip of the abdomen) and pays out a fresh line to the big spool,
  // which sags gently under its own weight
  const sp = { x: 700, y: 120, s: 1.3 };
  s += `<path d="M${sp.x} 0V${n(sp.y - 39 * sp.s + 2)}" stroke="${C.goldB}" stroke-width="5" opacity=".3"/>`;
  s += `<path d="M${sp.x} 0V${n(sp.y - 39 * sp.s + 2)}" stroke="${C.gold}" stroke-width="1.8"/>`;
  s += `<path d="M214 150Q433 170 653 130" stroke="${C.goldB}" stroke-width="7" opacity=".35" fill="none" stroke-linecap="round"/>`;
  s += silk(214, 150, 653, 130, 30, C.gold, 2.4);
  s += spider({ ...sp, pose: "dangle", look: [-1, .4], mouth: "grin", mark: "chevron", brow: "up", rim: C.goldB, rimOp: .25,
    legOverride: { L0: [[-9, -6], [-24, -16], [-36, 8]], L1: [[-12, -2], [-32, -12], [-40, 14]] } });
  // a second, small spider abseils down its own line
  s += line(`M520 0V${n(190 - 39 * .62 + 1)}`, 1.6, C.gold);
  s += spider({ x: 520, y: 190, s: .62, look: [0, 1], mouth: "big", brow: "up", mark: "dots", pose: "dangle" });
  s += sparkle(300, 60, 9) + sparkle(470, 100, 6) + sparkle(610, 190, 5) + sparkle(120, 110, 5) + sparkle(580, 60, 4);
  // floating silk wisps
  return V("Glowing silk spools and a freshly spun line", s);
}

// dial gauge helper: centre x,y radius r; needle angle a in degrees (-90 left .. +90 right)
const gauge = (P, x, y, r, a, ghosts = []) => {
  let s = "";
  const arc = (a0, a1, rr) => { const p = t => [x + Math.sin(t * Math.PI / 180) * rr, y - Math.cos(t * Math.PI / 180) * rr]; const [p0, p1] = [p(a0), p(a1)]; return `M${n(p0[0])} ${n(p0[1])}A${rr} ${rr} 0 0 1 ${n(p1[0])} ${n(p1[1])}`; };
  s += `<path d="M${x - r - 16} ${y + 12}V${y}A${r + 16} ${r + 16} 0 0 1 ${x + r + 16} ${y}V${y + 12}z" fill="${C.plum}" stroke="${C.ink}" stroke-width="3.2"/>`;
  s += `<path d="M${x - r - 4} ${y}A${r + 4} ${r + 4} 0 0 1 ${x + r + 4} ${y}z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.4"/>`;
  const bands = [[-80, -30, C.good], [-30, 20, C.gold], [20, 55, C.oxB], [55, 80, C.ox]];
  for (const [a0, a1, c] of bands) s += `<path d="${arc(a0, a1, r * .82)}" stroke="${c}" stroke-width="${n(r * .18)}" fill="none"/>`;
  let tk = "";
  for (let t = -80; t <= 80; t += 16) { const s1 = Math.sin(t * Math.PI / 180), c1 = Math.cos(t * Math.PI / 180); tk += `M${n(x + s1 * r * .62)} ${n(y - c1 * r * .62)}L${n(x + s1 * r * .7)} ${n(y - c1 * r * .7)}`; }
  s += line(tk, 2.4);
  for (const g of ghosts) { const s1 = Math.sin(g * Math.PI / 180), c1 = Math.cos(g * Math.PI / 180); s += line(`M${x} ${y}L${n(x + s1 * r * .78)} ${n(y - c1 * r * .78)}`, 3, C.ink, ` opacity=".18"`); }
  const s1 = Math.sin(a * Math.PI / 180), c1 = Math.cos(a * Math.PI / 180);
  s += line(`M${n(x - s1 * 10)} ${n(y + c1 * 10)}L${n(x + s1 * r * .84)} ${n(y - c1 * r * .84)}`, 6, C.ink);
  s += line(`M${x} ${y}L${n(x + s1 * r * .8)} ${n(y - c1 * r * .8)}`, 2.4, C.oxB);
  s += `<circle cx="${x}" cy="${y}" r="9" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.6"/>`;
  return s;
};

export function ch_alert() {
  const P = "cal";
  let s = stage(P);
  // alarm beacon (left)
  s += `<defs><radialGradient id="${P}-r"><stop offset="0" stop-color="${C.oxB}" stop-opacity=".55"/><stop offset="1" stop-color="${C.oxB}" stop-opacity="0"/></radialGradient></defs>`;
  s += `<ellipse cx="220" cy="150" rx="150" ry="110" fill="url(#${P}-r)"/>`;
  s += `<path d="M220 150L60 80L60 150z" fill="${C.oxB}" opacity=".22"/><path d="M220 150L380 96L380 170z" fill="${C.oxB}" opacity=".22"/>`;
  s += `<rect x="176" y="${GY - 36}" width="88" height="36" rx="4" fill="${C.ink}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<path d="M184 ${GY - 36}v-60a36 36 0 0 1 72 0v60z" fill="${C.oxB}" stroke="${C.ink}" stroke-width="3.2"/>`;
  s += line(`M184 ${GY - 70}h72M184 ${GY - 52}h72`, 2.4, C.ox);
  s += `<rect x="208" y="${GY - 108}" width="24" height="56" rx="6" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += `<path d="M196 ${GY - 100}q4 -20 18 -26" stroke="${C.cream}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;
  s += line(`M150 90l-16 -14M220 72v-22M290 90l16 -14M138 140h-22M302 140h22`, 4, C.oxB);
  // gauge (right) swinging into the red
  s += gauge(P, 600, GY - 12, 132, 64, [-50, -10, 30]);
  s += line("M520 144q30 -50 100 -46", 2.4, C.ink, ` stroke-dasharray="3 7" opacity=".6"`);
  s += `<path d="M620 98l-12 -8 2 14z" fill="${C.ink}" opacity=".6"/>`;
  // spider hiding behind the gauge, peeking
  // spider standing on the floor beside the gauge, two front feet on its face, peeking
  s += shadow(776, GY, 62, 6);
  s += spider({ x: 776, y: GY - 33.8, s: 1.3, look: [-1, -.4], mouth: "worried", brow: "worried", mark: "dots",
    legOverride: { L0: [[-9, -6], [-24, -18], [-34, -8]], L1: [[-12, -2], [-30, -6], [-38, 6]] } });
  // a bead of sweat on the side of its head
  s += `<path d="M795.5 ${GY - 40}q4 8 0 12q-4 -4 0 -12z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.4"/>`;
  return V("An alarm light flashing and a meter swinging into the red", s);
}

// jar helper: x,y centre bottom
export const jar = (x, y, w, h, lidOff = false) => {
  let s = "";
  s += `<path d="M${x - w / 2} ${y - h + 18}q0 -8 8 -10h${w - 16}q8 2 8 10v${h - 26}q0 8 -8 8h-${w - 16}q-8 0 -8 -8z" fill="${C.cream}" fill-opacity=".55" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<path d="M${x - w / 2 + 10} ${y - h + 22}v${h - 40}" stroke="${C.cream}" stroke-width="5" stroke-linecap="round" opacity=".7"/>`;
  s += `<path d="M${x + w / 2 - 10} ${y - h + 30}v${h - 60}" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" opacity=".12"/>`;
  s += `<rect x="${x - w / 2 + 6}" y="${y - h}" width="${w - 12}" height="10" rx="2" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.4"/>`;
  if (!lidOff) s += `<rect x="${x - w / 2 + 2}" y="${y - h - 14}" width="${w - 4}" height="16" rx="3" fill="${C.gold}" stroke="${C.ink}" stroke-width="3"/>` + line(`M${x - w / 2 + 8} ${y - h - 8}h${w - 16}`, 1.6, C.ink, ` opacity=".4"`);
  return s;
};

export function ch_vitality() {
  const P = "cv2";
  let s = stage(P);
  // bandage roll unspooling (left)
  s += shadow(150, GY, 60, 6);
  // the unrolled bandage lies flat on the floor, running out from under the roll
  s += `<path d="M140 ${GY}L150 ${GY - 9}H334L328 ${GY}z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += line(`M156 ${GY - 4.5}H328`, 1.6, C.edge, ` stroke-dasharray="3 5"`);
  s += `<ellipse cx="140" cy="${GY - 34}" rx="30" ry="34" fill="${C.cream}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<ellipse cx="140" cy="${GY - 34}" rx="10" ry="12" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += line(`M120 ${GY - 56}q-8 20 0 42`, 2, C.edge);
  // plaster cross on the roll
  // jar (centre)
  s += shadow(440, GY, 64, 7);
  s += jar(440, GY, 110, 150, true);
  // its lid (same width as the jar) lies flat on the floor, rim down
  s += shadow(560, GY, 56, 4);
  s += `<path d="M507 ${GY - 14}v6q53 18 106 0v-6" fill="${C.gold}" stroke="${C.ink}" stroke-width="3"/><ellipse cx="560" cy="${GY - 14}" rx="53" ry="9" fill="${C.gold}" stroke="${C.ink}" stroke-width="3"/>`;
  // bandaged spider nervously next to the jar
  s += spider({ x: 290, y: GY - 37.7, s: 1.45, look: [1, .5], mouth: "worried", brow: "worried", mark: "stripe",
    over: `<path d="M-16 -12l32 10M-16 -4l32 10" stroke="${C.cream}" stroke-width="5"/><path d="M-16 -12l32 10M-16 -4l32 10" stroke="${C.ink}" stroke-width="1" opacity=".3"/><rect x="6" y="-32" width="16" height="8" rx="2" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.4" transform="rotate(30 14 -28)"/>` });
  s += `<path d="M312 ${GY - 44}q4 8 0 12q-4 -4 0 -12z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.4"/>`;
  // vacuum floor nozzle from the right, sucking everything in
  const tube = "M934 30C844 36 794 90 784 180";
  s += `<path d="${tube}" stroke="${C.ink}" stroke-width="42" fill="none"/><path d="${tube}" stroke="${C.plum}" stroke-width="34" fill="none"/>`;
  let rib = ""; for (let t = 0.08; t < 1; t += .1) { const u = 1 - t; const x = u*u*u*934 + 3*u*u*t*844 + 3*u*t*t*794 + t*t*t*784, y = u*u*u*30 + 3*u*u*t*36 + 3*u*t*t*90 + t*t*t*180; rib += `M${n(x - 15)} ${n(y - 6)}l30 12`; }
  s += line(rib, 2.2, C.deep);
  s += line("M904 40q-60 10 -90 70", 4, C.soft);
  s += `<rect x="762" y="168" width="44" height="30" rx="6" fill="${C.soft}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<path d="M666 246V214q0 -18 18 -18h180q18 0 18 18v32z" fill="${C.soft}" stroke="${C.ink}" stroke-width="3.2" stroke-linejoin="round"/>`;
  s += line("M684 210h170", 3, C.cream, ` opacity=".35"`);
  s += `<rect x="660" y="244" width="228" height="10" rx="3" fill="${C.ink}"/>`;
  let br = ""; for (let x = 666; x < 884; x += 6) br += `M${x} 254v7`; s += line(br, 1.6, C.gold);
  s += `<circle cx="870" cy="252" r="8" fill="${C.ink}"/><circle cx="870" cy="252" r="3" fill="${C.edge}"/>`;
  // suction lines
  s += line("M618 222q22 -1 40 4M622 196q22 4 36 16M622 238q16 -1 32 -2", 2.6, C.ink, ` stroke-dasharray="10 8" opacity=".55"`);
  s += `<circle cx="636" cy="220" r="3" fill="${C.edge}" stroke="${C.ink}" stroke-width="1"/><circle cx="648" cy="236" r="2.4" fill="${C.edge}"/><circle cx="632" cy="204" r="2" fill="${C.edge}"/>`;
  return V("Bandages, a jar and a vacuum nozzle: comedic danger", s);
}

export function ch_heist() {
  const P = "ch";
  let s = stage(P, { groundY: 284, gw: .92 });
  // blueprint sheet with curled ends
  s += `<rect x="96" y="44" width="708" height="220" fill="${C.ink}" opacity=".2" transform="translate(6 7)"/>`;
  s += `<rect x="96" y="44" width="708" height="220" fill="${C.deep}" stroke="${C.ink}" stroke-width="3"/>`;
  let gr = ""; for (let x = 120; x < 800; x += 24) gr += `M${x} 44V264`; for (let y = 68; y < 264; y += 24) gr += `M96 ${y}H804`;
  s += line(gr, 1, C.soft, ` opacity=".6"`);
  s += `<path d="M96 44q-26 110 0 220h-16q-20 -110 0 -220z" fill="${C.plum}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<path d="M804 44q26 110 0 220h16q20 -110 0 -220z" fill="${C.plum}" stroke="${C.ink}" stroke-width="3"/>`;
  // floor plan sketch
  s += line("M140 80H760V236H140Z M320 80V160M320 196V236M520 80V120M520 156V236M140 160H260M600 190H760", 3, C.cream, ` opacity=".85"`);
  // route through five phase markers (pips 1..5 inside)
  const pts = [[190, 206], [290, 122], [450, 180], [620, 118], [720, 214]];
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]]; d += `C${a[0] + 60} ${a[1]} ${b[0] - 60} ${b[1]} ${b[0]} ${b[1]}`; }
  s += line(d, 3.4, C.goldB, ` stroke-dasharray="2 9"`);
  pts.forEach(([x, y], i) => {
    const c = i === 2 ? C.oxB : C.goldB;
    s += `<circle cx="${x}" cy="${y}" r="24" fill="${C.deep}" stroke="${c}" stroke-width="4"/>`;
    const o = 8, pp = { 1: [[0, 0]], 2: [[-o, 0], [o, 0]], 3: [[-o, o * .6], [0, -o * .7], [o, o * .6]], 4: [[-o, -o], [o, -o], [-o, o], [o, o]], 5: [[-o, -o], [o, -o], [0, 0], [-o, o], [o, o]] }[i + 1];
    for (const [px, py] of pp) s += `<circle cx="${x + px}" cy="${y + py}" r="3.6" fill="${c}"/>`;
  });
  // the objective: a star by marker 3; exit arrow at 5
  s += sparkle(486, 150, 12);
  s += `<path d="M752 214h36l-10 -10M788 214l-10 10" stroke="${C.goldB}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  // spider leaning on the corner, pointing at phase one
  s += shadow(118, 284, 56, 5);
  s += spider({ x: 118, y: 284 - 31.2, s: 1.2, look: [1, -.4], mask: true, mouth: "smirk", mark: "chevron", rim: C.cream, rimOp: .5,
    legOverride: { R0: [[9, -6], [26, -20], [48, -34]] } });
  // pushpins
  for (const [x, y] of [[112, 58], [788, 58]]) s += `<circle cx="${x}" cy="${y}" r="8" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2.4"/><circle cx="${x - 2}" cy="${y - 2}" r="2.4" fill="${C.cream}"/>`;
  return V("A blueprint with the five phases of a heist marked along the route", s);
}

const paperclipHook = (x, y, sc = 1) => {
  // a paperclip bent into a three-pronged grappling hook, local coords
  const d = "M0 -60V10q0 14 -12 14q-14 0 -14 -16v-8M0 10q0 14 12 14q14 0 14 -16v-8M0 10v16q0 10 -6 10";
  return `<g transform="translate(${x} ${y}) scale(${sc})">${line(d, 8, C.ink)}${line(d, 4.5, C.edge)}${line("M-2 -50v50", 1.5, C.cream)}<circle cx="0" cy="-62" r="5" fill="none" stroke="${C.ink}" stroke-width="3"/></g>`;
};

export function ch_gadgets() {
  const P = "cgd";
  let s = stage(P);
  // paperclip grappling hook with a silk line looping from above
  // hangs straight down from its silk line (the line runs off the top of the frame)
  s += line("M190 0V58", 2.4, C.gold);
  s += paperclipHook(190, 150, 1.4);
  s += shadow(190, GY, 40, 5);
  // bottle cap shield held by a spider (same scale as the catapult spider)
  s += shadow(446, GY, 76, 7);
  s += spider({ x: 420, y: GY - 31.2, s: 1.2, look: [1, -.2], mouth: "grin", brow: "down", mark: "dots", hat: "goggles",
    legOverride: { R0: [[9, -6], [26, -10], [44, -6]], R1: [[12, -2], [30, 6], [46, 8]] } });
  s += `<ellipse cx="478" cy="204" rx="18" ry="50" fill="${C.ox}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<ellipse cx="486" cy="204" rx="13" ry="45" fill="${C.oxB}" stroke="${C.ink}" stroke-width="3"/>`;
  let crimp = ""; for (let k = -4; k <= 4; k++) crimp += `M${n(474 - Math.sqrt(1 - (k / 5) ** 2) * 13)} ${204 + k * 10}l-6 3`;
  s += line(crimp, 2);
  s += `<ellipse cx="488" cy="204" rx="6" ry="24" fill="none" stroke="${C.goldB}" stroke-width="3"/>`;
  s += sparkle(500, 160, 7);
  // rubber-band catapult between two pins stuck in the floor: a spider hauls the pouch down and back
  s += shadow(720, GY, 90, 7);
  s += `<path d="M640 ${GY}V132M800 ${GY}V132" stroke="${C.ink}" stroke-width="12" stroke-linecap="round"/><path d="M640 ${GY}V132M800 ${GY}V132" stroke="${C.gold}" stroke-width="7" stroke-linecap="round"/>`;
  s += `<circle cx="640" cy="128" r="9" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2.6"/><circle cx="800" cy="128" r="9" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += spider({ x: 720, y: GY - 31.2, s: 1.2, look: [0, -1], mouth: "big", brow: "down", mark: "stripe",
    legOverride: { R0: [[9, -6], [22, -24], [9, -30]], L0: [[-9, -6], [-22, -24], [-9, -30]] } });
  s += `<path d="M640 132L712 196Q720 200 728 196L800 132" stroke="${C.ink}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M640 132L712 196Q720 200 728 196L800 132" stroke="${C.ox}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += cookie(720, 189, 10, 4);
  // the spider's front feet grip the pouch
  s += line("M711 195l3 3M729 195l-3 3", 4, C.ink);
  s += line("M690 112l-10 -12M720 104v-16M750 112l10 -12", 2.6, C.ink, ` opacity=".5"`);
  // a spare loose rubber band
  s += `<ellipse cx="300" cy="${GY - 10}" rx="36" ry="8" fill="none" stroke="${C.ink}" stroke-width="7"/><ellipse cx="300" cy="${GY - 10}" rx="36" ry="8" fill="none" stroke="${C.ox}" stroke-width="3.5"/>`;
  return V("Gadgets: a paperclip grappling hook, a bottle-cap shield and a rubber band", s);
}

// cartoon hand reaching down from the upper right; fingertips pinch at (x,y)
export const hand = (x, y, sc = 1) => {
  const fingers = [ // polyline points, width
    [[[30, -66], [22, -34], [4, -6]], 17],    // index
    [[[50, -64], [46, -32], [30, -14]], 17],  // middle
    [[[68, -58], [64, -30], [50, -16]], 16],  // ring
    [[[84, -50], [80, -28], [68, -20]], 14],  // little
  ];
  const thumb = [[[-4, -66], [-14, -34], [-2, -4]], 17];
  const back = "M-18 -70Q-4 -96 40 -98Q86 -98 98 -64Q100 -44 84 -40L20 -40Q-12 -40 -18 -70Z";
  const P = pts => "M" + pts.map(p => p.join(" ")).join("L");
  let ink = `<path d="${back}" fill="${C.ink}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`;
  let fill = `<path d="${back}" fill="${C.parch}"/>`;
  for (const [pp, w] of [thumb, ...fingers]) { ink += line(P(pp), w + 6, C.ink); fill += line(P(pp), w, C.parch); }
  // draw fingers individually so their overlaps keep an ink edge
  let fing = "";
  for (const [pp, w] of [...fingers].reverse()) fing += line(P(pp), w + 5, C.ink) + line(P(pp), w, C.parch);
  const sleeve = `<path d="M-14 -84L60 -170L170 -120L96 -60Z" fill="${C.plum}" stroke="${C.ink}" stroke-width="3.2" stroke-linejoin="round"/>` +
    `<path d="M-16 -78Q40 -110 100 -60" stroke="${C.ink}" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M-16 -78Q40 -110 100 -60" stroke="${C.soft}" stroke-width="10" fill="none" stroke-linecap="round"/>`;
  const det = line("M20 -52q10 -4 16 2M44 -52q8 -2 14 4M-8 -40q-6 -2 -8 4", 2, C.ink, ` opacity=".5"`) + line("M10 -84q24 -8 50 -4", 3, C.cream, ` opacity=".7"`);
  const nail = `<path d="M-2 -12q-4 -8 2 -10q4 4 -2 10z" fill="${C.cream}"/>`;
  return `<g transform="translate(${x} ${y}) scale(${sc})">${ink}${fill}${line(P(thumb[0]), 17, C.parch)}${fing}${sleeve}${det}</g>`;
};

export function ch_running() {
  const P = "crn";
  let s = stage(P, { ground: false });
  s += `<defs><linearGradient id="${P}-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.goldB}" stop-opacity=".6"/><stop offset="1" stop-color="${C.goldB}" stop-opacity="0"/></linearGradient></defs>`;
  // lamp at top-left
  s += line("M274 0V38", 4);
  s += `<path d="M226 58q48 -44 96 0z" fill="${C.ox}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="274" cy="59" rx="24" ry="5" fill="${C.goldB}"/>`;
  // the miniature room: an open box diorama in perspective
  const fl = "M160 250L260 190H600L700 250Z";
  s += `<path d="M160 250L260 190V70L160 120Z" fill="${C.edge}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M260 190V70H600V190Z" fill="${C.parch}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="${fl}" fill="${C.gold}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  let pl = ""; for (let k = 1; k < 6; k++) { const t = k / 6; pl += `M${n(160 + 100 * t)} ${n(250 - 60 * t)}H${n(700 - 100 * t)}`; }
  s += line(pl, 1.4, C.ink, ` opacity=".35"`);
  s += `<path d="M160 250H700V270H160Z" fill="${C.plum}" stroke="${C.ink}" stroke-width="3"/>`;
  // wallpaper dots, a window, a tiny table & rug
  s += stipple(4, 430, 130, 160, 50, 70, 1.4, C.gold, .45);
  s += `<rect x="300" y="92" width="70" height="56" fill="${C.deep}" stroke="${C.ink}" stroke-width="3"/><path d="M335 92v56M300 120h70" stroke="${C.plum}" stroke-width="4"/><circle cx="352" cy="106" r="6" fill="${C.cream}"/>`;
  s += `<ellipse cx="430" cy="224" rx="90" ry="14" fill="${C.ox}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += `<rect x="480" y="160" width="80" height="10" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.4"/><path d="M488 170v34M552 170v34" stroke="${C.ink}" stroke-width="4"/>`;
  s += tin(520, 160, 26, 18, { sw: 1.8 });
  s += `<path d="M232 60L120 262H500L316 60z" fill="url(#${P}-l)" opacity=".75"/>`;
  // a spider token on the rug
  // (room scale: a spider is tiny beside the table, the tin and the cat)
  s += shadow(392, 224, 14, 2.4) + spider({ x: 392, y: 224 - 7.8, s: .3, look: [1, -.8], mouth: "o", brow: "up", mark: "dots", sw: 3, legW: 1.6 });
  // the Storyteller's hand lowering a cat figure
  s += hand(612, 124, 1);
  // cat figurine dangling from the pinch
  s += `<path d="M606 124v8" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<path d="M588 176q-4 -28 18 -40q22 12 18 40z" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<path d="M594 140l2 -12 8 8zM618 140l-2 -12 -8 8z" fill="${C.deep}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<ellipse cx="600" cy="146" rx="2" ry="3" fill="${C.goldB}"/><ellipse cx="612" cy="146" rx="2" ry="3" fill="${C.goldB}"/>`;
  s += `<ellipse cx="606" cy="178" rx="20" ry="5" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.2"/>`;
  s += line("M636 196q10 8 0 18", 2, C.ink, ` stroke-dasharray="3 5" opacity=".5"`);
  return V("The Storyteller's hand and lamp over a miniature room", s);
}

export function ch_location() {
  const P = "clo";
  let s = stage(P, { groundY: 288, gw: .96 });
  // floor plan sheet, grid
  const x0 = 120, y0 = 34, cw = 30, cols = 22, rows = 8;
  s += `<rect x="${x0 + 6}" y="${y0 + 7}" width="${cols * cw}" height="${rows * cw}" fill="${C.ink}" opacity=".2"/>`;
  s += `<rect x="${x0}" y="${y0}" width="${cols * cw}" height="${rows * cw}" fill="${C.cream}" stroke="${C.ink}" stroke-width="3"/>`;
  let gd = ""; for (let c = 1; c < cols; c++) gd += `M${x0 + c * cw} ${y0}v${rows * cw}`; for (let r = 1; r < rows; r++) gd += `M${x0} ${y0 + r * cw}h${cols * cw}`;
  s += line(gd, 1.2, C.edge);
  // walls (thick ink) on grid lines
  const X = c => x0 + c * cw, Y = r => y0 + r * cw;
  s += line(`M${X(0)} ${Y(0)}H${X(22)}V${Y(8)}H${X(0)}Z M${X(8)} ${Y(0)}V${Y(3)}M${X(8)} ${Y(5)}V${Y(8)}M${X(14)} ${Y(0)}V${Y(2)}M${X(14)} ${Y(4)}V${Y(8)}M${X(14)} ${Y(4)}H${X(18)}M${X(20)} ${Y(4)}H${X(22)}`, 6, C.ink);
  // furniture blocks
  s += `<rect x="${X(2)}" y="${Y(1)}" width="${cw * 4}" height="${cw * 2}" fill="${C.edge}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<rect x="${X(10)}" y="${Y(6)}" width="${cw * 3}" height="${cw}" fill="${C.edge}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<rect x="${X(16)}" y="${Y(1)}" width="${cw * 5}" height="${cw}" fill="${C.edge}" stroke="${C.ink}" stroke-width="2"/>`;
  // threat zone (cat) as an ox circle
  s += `<circle cx="${X(11)}" cy="${Y(3)}" r="${cw * 1.6}" fill="${C.oxB}" opacity=".16" stroke="${C.oxB}" stroke-width="2" stroke-dasharray="5 5"/>`;
  s += `<path d="M${X(11) - 9} ${Y(3) + 4}l2 -12 6 7h2l6 -7 2 12q-9 8 -18 0z" fill="${C.ox}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
  // entry vent (left) and target (right)
  s += `<rect x="${X(0) - 8}" y="${Y(4) - 16}" width="16" height="32" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += line(`M${X(0) - 5} ${Y(4) - 8}h10M${X(0) - 5} ${Y(4)}h10M${X(0) - 5} ${Y(4) + 8}h10`, 2, C.soft);
  s += `<circle cx="${X(20.5)}" cy="${Y(6)}" r="18" fill="${C.goldB}" opacity=".45"/>` + tin(X(20.5), Y(6) + 10, 26, 18, { sw: 1.8 });
  // Route A (gold, dotted): through the doorways, the long way round the cat
  const c = (a, b) => `${X(a)} ${Y(b)}`;
  s += line(`M${c(.5, 4)}H${X(7.5)}V${Y(4)}H${X(9)}Q${X(9)} ${Y(7.5)} ${X(11)} ${Y(7.4)}H${X(15)}Q${X(17)} ${Y(7.4)} ${X(17)} ${Y(6)}Q${X(17)} ${Y(5)} ${X(19)} ${Y(5.5)}L${X(20)} ${Y(6)}`, 4, C.gold, ` stroke-dasharray="2 8"`);
  // Route B (plum, dashed): straight up over the furniture, past the cat
  s += line(`M${c(.5, 4)}Q${X(4)} ${Y(4)} ${X(6)} ${Y(3)}L${X(8)} ${Y(3.6)}Q${X(11)} ${Y(1.2)} ${X(14)} ${Y(3)}L${X(18)} ${Y(3)}L${X(19)} ${Y(4)}Q${X(20.5)} ${Y(4.6)} ${X(20.5)} ${Y(5.4)}`, 4, C.plum, ` stroke-dasharray="12 7"`);
  // the fork: spider scratching its head at the start
  s += shadow(72, 288, 54, 5);
  s += spider({ x: 72, y: 288 - 28.6, s: 1.1, look: [1, -.6], mouth: "flat", brow: "worried", mark: "stripe",
    legOverride: { R0: [[9, -6], [20, -30], [6, -20]] } });
  s += `<path d="M86 196q-2 -12 8 -14q8 0 8 8q0 6 -6 8v6" fill="none" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/><circle cx="96" cy="212" r="2" fill="${C.ink}"/>`;
  // pushpins hold the plan to the wall
  for (const [px, py] of [[x0 + 12, y0 + 12], [x0 + cols * cw - 12, y0 + 12]]) s += `<circle cx="${px}" cy="${py}" r="7" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2.2"/><circle cx="${px - 2}" cy="${py - 2}" r="2" fill="${C.cream}"/>`;
  return V("A gridded floor plan with two possible routes", s);
}
