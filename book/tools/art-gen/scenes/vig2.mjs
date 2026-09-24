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
  // the fresh line leaves the spinnerets (tip of the abdomen, behind the body) and winds onto the
  // big spool's thread, just under its top flange
  const tipY = sp.y - 39 * sp.s + 1;
  s += `<path d="M209 165Q450 170 ${sp.x} ${n(tipY)}" stroke="${C.goldB}" stroke-width="7" opacity=".35" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M209 165Q450 170 ${sp.x} ${n(tipY)}" stroke="${C.gold}" stroke-width="2.4" fill="none"/>`;
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
  let s = stage(P, { gw: .94 });
  // alarm beacon (left)
  s += `<defs><radialGradient id="${P}-r"><stop offset="0" stop-color="${C.oxB}" stop-opacity=".55"/><stop offset="1" stop-color="${C.oxB}" stop-opacity="0"/></radialGradient></defs>`;
  s += `<ellipse cx="220" cy="150" rx="150" ry="110" fill="url(#${P}-r)"/>`;
  // the rotating beams fade out with distance (no hard cut-off edge)
  s += `<defs><linearGradient id="${P}-bl" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="${C.oxB}" stop-opacity=".3"/><stop offset="1" stop-color="${C.oxB}" stop-opacity="0"/></linearGradient><linearGradient id="${P}-br" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.oxB}" stop-opacity=".3"/><stop offset="1" stop-color="${C.oxB}" stop-opacity="0"/></linearGradient></defs>`;
  s += `<path d="M220 150L40 72L40 152z" fill="url(#${P}-bl)"/><path d="M220 150L420 84L420 178z" fill="url(#${P}-br)"/>`;
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
  s += `<path d="M800 ${GY - 50}q4 8 0 12q-4 -4 0 -12z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.4"/>`;
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
  let s = stage(P, { gw: .98 });   // the vacuum head rests on the floor, so the floor runs under it
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
        // bandages wrap the abdomen and a plaster sits on the head, clear of the eyes
    over: `<path d="M-18 -30l36 10M-19 -20l37 7" stroke="${C.cream}" stroke-width="5"/><path d="M-18 -30l36 10M-19 -20l37 7" stroke="${C.ink}" stroke-width="1" opacity=".3"/><rect x="-14" y="-12" width="12" height="6" rx="1.5" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.3" transform="rotate(-24 -8 -9)"/><rect x="6" y="-32" width="16" height="8" rx="2" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.4" transform="rotate(30 14 -28)"/>` });
  s += `<path d="M322 ${GY - 54}q4 8 0 12q-4 -4 0 -12z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.4"/>`;
  // vacuum floor nozzle from the right, sucking everything in
  // the hose runs on past the right edge of the page box (the chapter-art box is wider than
  // the 3:1 viewBox, so it must reach well beyond x 900 or its cut end would show)
  const hp = [[1200, 22], [880, 22], [796, 80], [784, 180]];
  const tube = `M${hp[0]}C${hp[1]} ${hp[2]} ${hp[3]}`;
  s += `<path d="${tube}" stroke="${C.ink}" stroke-width="42" fill="none"/><path d="${tube}" stroke="${C.plum}" stroke-width="34" fill="none"/>`;
  const bz = (t, k) => { const u = 1 - t; return u * u * u * hp[0][k] + 3 * u * u * t * hp[1][k] + 3 * u * t * t * hp[2][k] + t * t * t * hp[3][k]; };
  let rib = ""; for (let t = 0.04; t < .97; t += .045) { const x = bz(t, 0), y = bz(t, 1), dx = bz(t + .01, 0) - x, dy = bz(t + .01, 1) - y, L = Math.hypot(dx, dy), nx = -dy / L * 16, ny = dx / L * 16; rib += `M${n(x - nx)} ${n(y - ny)}L${n(x + nx)} ${n(y + ny)}`; }
  s += line(rib, 2.2, C.deep);
  s += line("M960 30C870 34 818 70 808 120", 4, C.soft);
  s += `<rect x="762" y="168" width="44" height="30" rx="6" fill="${C.soft}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<path d="M666 246V214q0 -18 18 -18h180q18 0 18 18v32z" fill="${C.soft}" stroke="${C.ink}" stroke-width="3.2" stroke-linejoin="round"/>`;
  s += line("M684 210h170", 3, C.cream, ` opacity=".35"`);
  s += `<rect x="660" y="244" width="228" height="10" rx="3" fill="${C.ink}"/>`;
  let br = ""; for (let x = 666; x < 884; x += 6) br += `M${x} 254v7`; s += line(br, 1.6, C.soft);
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
  for (const [x, y] of [[112, 58], [788, 58]]) s += `<circle cx="${x}" cy="${y}" r="8" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.4"/><circle cx="${x - 2}" cy="${y - 2}" r="2.4" fill="${C.cream}"/>`;
  return V("A blueprint with the five phases of a heist marked along the route", s);
}

// A paperclip bent into a three-tine grappling hook, drawn as a loaded hook hangs: crown
// uppermost, tines curving down, shank below it with the eye at its foot. x,y = the crown;
// ang = the shank's lean from vertical (deg, + leans right) so it lines up with a taut line.
// Returns {svg, eye:[x,y]}.
const paperclipHook = (x, y, sc = 1, ang = 0) => {
  const shank = "M0 0V58";
  const tL = "M0 0C-6 -14 -26 -14 -28 4C-29 12 -26 18 -22 22";   // catching tine
  const tR = "M0 0C6 -14 26 -14 28 4C29 12 26 18 22 22";        // outer tine
  const tF = "M0 0C-2 -8 -9 -9 -11 1C-12 7 -10 11 -7 14";       // third tine, turned toward the viewer
  const wire = d => line(d, 7.5, C.ink) + line(d, 4, C.edge);
  const barb = (tx, ty, dx) => `<path d="M${tx} ${ty}l${dx * 3.5} -1.5 ${-dx * 1.5} 6z" fill="${C.edge}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
  let g = wire(tL) + wire(tR) + wire(shank) + wire(tF);
  g += barb(-22, 21, 1) + barb(22, 21, -1) + barb(-7, 13, 1);
  g += `<circle cx="0" cy="65" r="7" fill="none" stroke="${C.ink}" stroke-width="7.5"/><circle cx="0" cy="65" r="7" fill="none" stroke="${C.edge}" stroke-width="4"/>`;
  g += line("M-1.4 16V52", 1.4, C.cream, ` opacity=".9"`) + line("M-4 -7C-12 -12 -22 -10 -24 0", 1.4, C.cream, ` opacity=".9"`);
  // wire wrapped round the crown binds the three tines to the shank
  g += line("M-4 5l8 2M-4 9l8 2M-4 13l8 2", 2.2, C.ink);
  const a = ang * Math.PI / 180, L = 72 * sc;
  return { svg: `<g transform="translate(${x} ${y}) rotate(${n(-ang)}) scale(${sc})">${g}</g>`, eye: [x + Math.sin(a) * L, y + Math.cos(a) * L] };
};

export function ch_gadgets() {
  const P = "cgd";
  let s = stage(P, { gw: .92 });
  const sp = .85;                     // one spider scale for the whole scene: tiny beside the glass
  const feet = GY - 26 * sp;          // spider y for feet on the floor

  // ---- 1. GRAPPLING HOOK, caught over the rim of a glass tumbler holding two sugar cubes.
  // The silk line is knotted to the hook's eye and runs taut to the climber's spinnerets:
  // it is testing that the hook has set before it climbs.
  const gx = 146, gw = 132, rimY = 70, gry = 11, grx = gw / 2;
  s += shadow(gx + 8, GY, grx + 12, 7, .22);
  const glass = `M${gx - grx} ${rimY}L${gx - grx + 6} ${GY - gry}A${grx - 6} ${gry} 0 0 0 ${gx + grx - 6} ${GY - gry}L${gx + grx} ${rimY}`;
  s += `<path d="${glass}A${grx} ${gry} 0 0 0 ${gx - grx} ${rimY}z" fill="${C.cream}" fill-opacity=".35"/>`;
  s += `<path d="M${gx - grx} ${rimY}A${grx} ${gry} 0 0 1 ${gx + grx} ${rimY}" fill="none" stroke="${C.ink}" stroke-width="2.4" opacity=".55"/>`;
  s += `<ellipse cx="${gx}" cy="${GY - gry - 8}" rx="${grx - 8}" ry="${gry - 2}" fill="${C.edge}" opacity=".45" stroke="${C.ink}" stroke-width="1.4" stroke-opacity=".5"/>`;
  const cube = (cx, by, z) => `<path d="M${cx - z} ${by}v${-z * 1.4}l${z * .5} ${-z * .4}h${z * 2}v${z * 1.4}l${-z * .5} ${z * .4}z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/><path d="M${cx - z} ${by - z * 1.4}h${z * 2}l${z * .5} ${-z * .4}M${cx + z} ${by - z * 1.4}v${z * 1.4}" fill="none" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>` + stipple(cx, cx, by - z * .7, z * .8, z * .5, 8, .8, C.edge, .9);
  s += cube(gx - 24, GY - gry - 4, 17) + cube(gx + 22, GY - gry - 2, 15);
  // the crook of the catching tine rests on the right-hand rim; the loaded hook hangs straight,
  // shank down the outside of the glass, and the climber stands directly below the eye
  const crown = [gx + grx + 14, rimY + 6];
  const hk = paperclipHook(crown[0], crown[1], 1, 0);
  const cx = crown[0], abTop = feet - 39 * sp;
  s += hk.svg;                                              // the tine inside is seen through the glass
  s += `<path d="M${gx - grx} ${rimY}A${grx} ${gry} 0 0 0 ${gx + grx} ${rimY}" fill="none" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<path d="${glass}" fill="${C.cream}" fill-opacity=".18" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += line(`M${gx - grx + 12} ${rimY + 22}L${gx - grx + 16} ${GY - 40}`, 6, C.cream, ` opacity=".75"`);
  s += line(`M${gx - grx + 26} ${rimY + 26}l1 36`, 2.4, C.cream, ` opacity=".6"`);
  // the outside of the hook (outer tine, shank, eye) is in front of the glass: redraw it on top
  s += `<clipPath id="${P}-out"><rect x="${gx + grx - 1}" y="0" width="300" height="300"/></clipPath><g clip-path="url(#${P}-out)">${hk.svg}</g>`;
  const [ex, ey] = hk.eye;
  // the line is threaded through the eye (over the bottom of the loop) and knotted just below it
  s += `<path d="M${n(ex)} ${n(ey - 6)}V${n(abTop + 1)}" stroke="${C.gold}" stroke-width="2.2"/>`;
  s += `<path d="M${n(ex - 4)} ${n(ey + 3)}q4 -5 8 0q-4 5 -8 0z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.2"/>`;
  s += shadow(cx, GY, 52, 5);
  s += spider({ x: cx, y: feet, s: sp, look: [0, -1], mouth: "grin", brow: "up", mark: "chevron",
    legOverride: { R0: [[9, -6], [22, -34], [5, -58]], L0: [[-9, -6], [-22, -34], [-5, -58]] } });
  s += line(`M${cx - 30} ${abTop - 4}l-8 -6M${cx + 30} ${abTop - 4}l8 -6`, 2.2, C.ink, ` opacity=".45"`);

  // ---- 2. BOTTLE-CAP SHIELD: a steel crown cap stood on its rim on the floor, its printed face
  // turned toward the viewer and the right, held upright by a crouching spider whose two front
  // feet hook over the crimped skirt.
  const kx = 462, kr = 38, kry = 33, ky = GY - kr;
  const hx = 392;
  s += shadow(hx + 36, GY, 96, 6);
  s += spider({ x: hx, y: feet, s: sp, look: [1, -.2], mouth: "flat", brow: "down", mark: "dots", hat: "goggles",
    legOverride: { R0: [[9, -6], [28, -44], [40.5, -36.5]], R1: [[12, -2], [30, -14], [35, 3.5]] } });
  let crimp = "";
  for (let k = -5; k <= 5; k++) { const t = k / 6, yy = ky + t * kr, xx = kx - 12 - Math.sqrt(1 - t * t) * kry; crimp += `M${n(xx)} ${n(yy)}l12 ${n(-2 * t)}`; }
  s += `<ellipse cx="${kx - 12}" cy="${ky}" rx="${kry}" ry="${kr}" fill="${C.edge}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<path d="M${kx - 12} ${ky - kr}H${kx}V${ky + kr}H${kx - 12}z" fill="${C.edge}"/>`;
  s += line(crimp, 2.4, C.ink, ` opacity=".7"`);
  s += `<ellipse cx="${kx}" cy="${ky}" rx="${kry}" ry="${kr}" fill="${C.parch}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<ellipse cx="${kx}" cy="${ky}" rx="${kry - 8}" ry="${kr - 8}" fill="none" stroke="${C.edge}" stroke-width="3"/>`;
  s += `<path d="M${kx} ${ky - 16}l4.4 9.4 10.2 1.1-7.6 7 2.1 10.1-9.1-5.1-9.1 5.1 2.1-10.1-7.6-7 10.2-1.1z" fill="${C.plum}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
  s += line(`M${kx - 18} ${ky - 18}q8 -12 22 -14`, 4, C.cream, ` opacity=".85"`);
  // the two front feet press on the skirt, their tips hooked over its crimped edge
  const tip = d => line(d, 4.4, C.ink) + line(d, 2.2, C.plum);
  const grip = (t, dx, dy) => { const x0 = kx - 12 - Math.sqrt(1 - t * t) * kry, y0 = ky + t * kr; return tip(`M${n(x0 - 3)} ${n(y0 - 1)}l${dx} ${dy}`); };
  s += grip(-.7, 9, 3) + grip(.5, 9, -1);
  // a dried pea bounces off the shield: ping!
  s += `<circle cx="${kx + 80}" cy="${ky - 42}" r="7" fill="${C.good}" stroke="${C.ink}" stroke-width="2"/><circle cx="${kx + 78}" cy="${ky - 44}" r="2" fill="${C.cream}" opacity=".7"/>`;
  s += line(`M${kx + 40} ${ky - 6}l14 -4M${kx + 36} ${ky - 20}l12 -10M${kx + 42} ${ky + 8}l14 2`, 2.4, C.ink, ` opacity=".6"`);
  s += line(`M${kx + 42} ${ky - 18}Q${kx + 60} ${ky - 46} ${kx + 72} ${ky - 44}`, 1.8, C.ink, ` stroke-dasharray="2 5" opacity=".55"`);

  // ---- 3. RUBBER-BAND LAUNCHER: a forked twig planted in a cork block; a rubber band is wrapped
  // round the tip of each arm and its leather pouch, cupping a cookie, is hauled back by a spider
  // with its back legs braced. Three-quarter view: the far arm sits up and right of the near one.
  const bx = 784;
  s += shadow(bx + 6, GY, 54, 6, .25);
  s += `<path d="M${bx - 40} ${GY}V${GY - 34}l10 -8h64l6 8V${GY}z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.8" stroke-linejoin="round"/>`;
  s += `<path d="M${bx - 40} ${GY - 34}l10 -8h64l6 8z" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += stipple(41, bx, GY - 16, 34, 12, 30, 1, C.gold, .9);
  const nearTip = [bx - 34, 118], farTip = [bx + 26, 104], fork = [bx, 180];
  const twig = `M${bx} ${GY - 38}L${fork[0]} ${fork[1]}Q${bx - 22} 160 ${nearTip[0]} ${nearTip[1]}M${fork[0]} ${fork[1]}Q${bx + 18} 150 ${farTip[0]} ${farTip[1]}`;
  const pc = [672, 184], pr = 15;                  // cookie in the pouch
  const pTop = [pc[0] + 13, pc[1] - pr - 2], pBot = [pc[0] + 13, pc[1] + pr + 2];
  const band = (a, b, w = 7) => line(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`, w, C.ink) + line(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`, w - 3.4, C.edge);
  s += band([farTip[0] - 2, farTip[1] + 7], pTop);               // far band, behind the frame
  s += line(twig, 13, C.ink) + line(twig, 8, C.gold);
  s += line(`M${bx - 3} ${GY - 44}L${bx - 3} 196M${bx - 26} 148l-4 -18`, 2, C.goldB, ` opacity=".8"`);
  s += `<ellipse cx="${bx}" cy="${GY - 38}" rx="9" ry="3" fill="${C.ink}" opacity=".45"/>`;
  for (const [tx, ty] of [nearTip, farTip]) s += `<path d="M${tx - 6} ${ty + 4}l12 3M${tx - 6} ${ty + 9}l12 3" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/><path d="M${tx - 6} ${ty + 4}l12 3M${tx - 6} ${ty + 9}l12 3" stroke="${C.edge}" stroke-width="2.4" stroke-linecap="round"/>`;
  const lx = 620;
  s += shadow(lx + 4, GY, 64, 6);
  s += spider({ x: lx, y: feet, s: sp, look: [1, -.4], mouth: "big", brow: "down", mark: "stripe",
    legOverride: {
      R0: [[9, -6], [30, -44], [44, -70]], R1: [[12, -2], [40, -30], [48, -52]],
      L2: [[-13, 3], [-40, -12], [-60, 26]], L3: [[-10, 7], [-44, 0], [-76, 26]] } });
  // the pouch: a leather sling cupping the back (left) half of the cookie; its corners take the band
  s += `<path d="M${pTop[0]} ${pTop[1]}Q${pc[0] - 30} ${pc[1] - 26} ${pc[0] - 24} ${pc[1]}Q${pc[0] - 30} ${pc[1] + 26} ${pBot[0]} ${pBot[1]}Q${pc[0] - 16} ${pc[1]} ${pTop[0]} ${pTop[1]}z" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += cookie(pc[0] + 2, pc[1], pr, 4);
  s += `<path d="M${pTop[0]} ${pTop[1]}Q${pc[0] - 26} ${pc[1] - 22} ${pc[0] - 22} ${pc[1]}" fill="none" stroke="${C.ink}" stroke-width="2.6"/>`;   // pouch lip over the cookie
  s += band([nearTip[0] - 2, nearTip[1] + 7], pBot);             // near band, in front
  s += line(`M${pc[0] - 50} ${pc[1] - 40}l-10 -8M${pc[0] - 58} ${pc[1] - 20}l-12 -2`, 2.2, C.ink, ` opacity=".45"`);

  // workbench odds and ends lying flat: a spare rubber band
  s += `<ellipse cx="60" cy="${GY - 5}" rx="20" ry="4" fill="none" stroke="${C.ink}" stroke-width="6"/><ellipse cx="60" cy="${GY - 5}" rx="20" ry="4" fill="none" stroke="${C.edge}" stroke-width="2.6"/>`;
  s += sparkle(420, 62, 6) + sparkle(260, 34, 4);
  return V("Gadgets: a paperclip grappling hook caught on a glass rim, a bottle-cap shield and a rubber-band launcher", s);
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
  // the sleeve runs up and out through the TOP of the frame (never ends in mid-air)
  const sleeve = `<path d="M-14 -84L40 -260L200 -260L96 -60Z" fill="${C.plum}" stroke="${C.ink}" stroke-width="3.2" stroke-linejoin="round"/>` +
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
  s += `<path d="M226 58q48 -44 96 0z" fill="${C.plum}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/><path d="M240 50q14 -16 34 -18" stroke="${C.soft}" stroke-width="3.4" fill="none" stroke-linecap="round"/><ellipse cx="274" cy="59" rx="24" ry="5" fill="${C.goldB}"/>`;
  // the miniature room: an open box diorama in perspective
  const fl = "M160 250L260 190H600L700 250Z";
  // the diorama sits on the Storyteller's table: a tabletop line and a soft contact shadow
  s += `<ellipse cx="436" cy="272" rx="300" ry="9" fill="${C.ink}" opacity=".2"/>`;
  s += line("M70 272H830", 2.6);
  { let d = ""; for (let xx = 84; xx < 826; xx += 11) d += `M${xx} 277l-7 9`; s += line(d, 1.3, C.ink, ` opacity=".3"`); }
  s += `<path d="M160 250L260 190V70L160 120Z" fill="${C.edge}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M260 190V70H600V190Z" fill="${C.parch}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="${fl}" fill="${C.gold}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  let pl = ""; for (let k = 1; k < 6; k++) { const t = k / 6; pl += `M${n(160 + 100 * t)} ${n(250 - 60 * t)}H${n(700 - 100 * t)}`; }
  s += line(pl, 1.4, C.ink, ` opacity=".35"`);
  s += `<path d="M160 250H700V270H160Z" fill="${C.plum}" stroke="${C.ink}" stroke-width="3"/>`;
  // wallpaper dots, a window, a tiny table & rug
  s += stipple(4, 430, 130, 160, 50, 70, 1.4, C.gold, .45);
  s += `<rect x="300" y="92" width="70" height="56" fill="${C.deep}" stroke="${C.ink}" stroke-width="3"/><path d="M335 92v56M300 120h70" stroke="${C.plum}" stroke-width="4"/><circle cx="352" cy="106" r="6" fill="${C.cream}"/>`;
  s += `<ellipse cx="430" cy="224" rx="90" ry="14" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.4"/><ellipse cx="430" cy="224" rx="78" ry="10" fill="none" stroke="${C.edge}" stroke-width="3"/>`;
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
  s += shadow(88, 288, 54, 5);
  // one front leg raised to scratch the side of its head
  s += spider({ x: 88, y: 288 - 28.6, s: 1.1, look: [1, -.6], mouth: "flat", brow: "worried", mark: "stripe",
    legOverride: { R0: [[9, -6], [30, -30], [17, -8]] } });
  s += `<path d="M58 190q-2 -12 8 -14q8 0 8 8q0 6 -6 8v6" fill="none" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/><circle cx="68" cy="206" r="2" fill="${C.ink}"/>`;
  // pushpins hold the plan to the wall
  for (const [px, py] of [[x0 + 12, y0 + 12], [x0 + cols * cw - 12, y0 + 12]]) s += `<circle cx="${px}" cy="${py}" r="7" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.2"/><circle cx="${px - 2}" cy="${py - 2}" r="2" fill="${C.cream}"/>`;
  return V("A gridded floor plan with two possible routes", s);
}
