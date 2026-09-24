import { C, n, svg, spider, tin, cookie, sparkle, cobweb, stipple, hatch, rng, line, shadow, stage } from "./lib.mjs";

// magnifying glass; x,y lens centre
export const magnifier = (x, y, r, ang = 40) => {
  const a = ang * Math.PI / 180, hx = x + Math.cos(a) * r, hy = y + Math.sin(a) * r;
  return line(`M${n(hx)} ${n(hy)}L${n(hx + Math.cos(a) * r * 1.3)} ${n(hy + Math.sin(a) * r * 1.3)}`, r * .42, C.ink) +
    line(`M${n(hx + Math.cos(a) * 3)} ${n(hy + Math.sin(a) * 3)}L${n(hx + Math.cos(a) * r * 1.25)} ${n(hy + Math.sin(a) * r * 1.25)}`, r * .22, C.ox) +
    `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${C.cream}" fill-opacity=".45" stroke="${C.ink}" stroke-width="${n(r * .34)}"/>` +
    `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="none" stroke="${C.gold}" stroke-width="${n(r * .16)}"/>` +
    line(`M${n(x - r * .5)} ${n(y - r * .2)}q${n(r * .2)} ${n(-r * .4)} ${n(r * .5)} ${n(-r * .45)}`, r * .12, C.cream);
};
// pencil from (x1,y1) to tip (x2,y2)
export const pencil = (x1, y1, x2, y2, w = 10) => {
  const L = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return `<g transform="translate(${n(x1)} ${n(y1)}) rotate(${n(a)})">` +
    `<rect x="0" y="${-w / 2}" width="${n(L * .12)}" height="${w}" rx="2" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2"/>` +
    `<rect x="${n(L * .12)}" y="${-w / 2}" width="${n(L * .08)}" height="${w}" fill="${C.edge}" stroke="${C.ink}" stroke-width="2"/>` +
    `<rect x="${n(L * .2)}" y="${-w / 2}" width="${n(L * .62)}" height="${w}" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2"/>` +
    `<path d="M${n(L * .2)} 0H${n(L * .82)}" stroke="${C.gold}" stroke-width="${n(w * .3)}"/>` +
    `<path d="M${n(L * .82)} ${-w / 2}L${n(L)} 0L${n(L * .82)} ${w / 2}z" fill="${C.parch}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M${n(L * .94)} ${n(-w * .16)}L${n(L)} 0L${n(L * .94)} ${n(w * .16)}z" fill="${C.ink}"/></g>`;
};

export function part_one() {
  const P = "p1";
  let s = stage(P, { w: 900, h: 420, ground: false });
  s += `<defs><linearGradient id="${P}-lamp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.goldB}" stop-opacity=".55"/><stop offset="1" stop-color="${C.goldB}" stop-opacity="0"/></linearGradient></defs>`;
  // lamp light cone
  s += `<path d="M396 58L180 372H720L504 58z" fill="url(#${P}-lamp)" opacity=".7"/>`;
  // tabletop edge
  s += `<path d="M40 372H860" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`;
  let hd = ""; for (let x = 60; x < 850; x += 12) hd += `M${x} 378l-8 10`;
  s += line(hd, 1.3, C.ink, ` opacity=".3"`);
  // the blueprint (a perspective sheet), deep plum with cream lines
  const bp = "M230 196L672 196L742 350L160 350Z";
  s += `<path d="M228 204L674 204L748 358L154 358Z" fill="${C.ink}" opacity=".25"/>`;
  s += `<path d="${bp}" fill="${C.deep}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  // curled corner
  s += `<path d="M672 196l18 40q-26 -6 -40 -20z" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  // grid on the sheet
  let gr = "";
  for (let i = 1; i < 10; i++) { const t = i / 10; gr += `M${n(230 + (160 - 230) * 0)} 0`; }
  gr = "";
  for (let i = 1; i < 12; i++) { const t = i / 12; gr += `M${n(230 + 442 * t)} 196L${n(160 + 582 * t)} 350`; }
  for (let j = 1; j < 5; j++) { const t = j / 5, y = 196 + 154 * t; gr += `M${n(230 - 70 * t)} ${n(y)}L${n(672 + 70 * t)} ${n(y)}`; }
  s += line(gr, 1, C.soft, ` opacity=".8"`);
  // the floor plan walls (cream)
  s += line("M270 214H640L690 334H222Z M430 214L420 334M222 274H436M560 214L580 334", 3, C.cream);
  // door gaps
  s += line("M330 274h30M600 280l6 14", 5, C.deep);
  // route: dotted gold path to the X
  s += line("M236 330Q300 300 350 296T470 250T600 236", 3, C.goldB, ` stroke-dasharray="2 9"`);
  s += `<path d="M590 226l20 20M610 226l-20 20" stroke="${C.oxB}" stroke-width="5" stroke-linecap="round"/>`;
  s += `<circle cx="600" cy="236" r="18" fill="none" stroke="${C.oxB}" stroke-width="2.5" stroke-dasharray="5 4"/>`;
  // a little cat-shaped hazard ring
  s += `<circle cx="330" cy="310" r="14" fill="${C.ox}" opacity=".7" stroke="${C.oxB}" stroke-width="2"/>`;
  s += `<path d="M322 304l3 -8 4 6h2l4 -6 3 8" fill="none" stroke="${C.cream}" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<circle cx="326" cy="312" r="1.6" fill="${C.cream}"/><circle cx="334" cy="312" r="1.6" fill="${C.cream}"/>`;
  // pins: a thimble & a bottle cap holding the sheet
  s += `<path d="M168 330q2 -26 24 -26t24 26z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += stipple(4, 192, 318, 16, 8, 30, 1, C.ink, .5);
  s += `<ellipse cx="192" cy="331" rx="25" ry="7" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<ellipse cx="700" cy="330" rx="30" ry="10" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<path d="M670 330v8q30 14 60 0v-8" fill="${C.ox}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<ellipse cx="700" cy="330" rx="20" ry="6" fill="none" stroke="${C.ink}" stroke-width="1.5" opacity=".6"/>`;

  // back row spiders leaning over the plan
  // contact shadows (lamp overhead) for everyone standing on the table/plan
  s += shadow(330, 212, 62, 7) + shadow(548, 210, 64, 7) + shadow(112, 338, 78, 8) + shadow(800, 338, 76, 8);
  s += magnifier(400, 252, 22, 225);
  s += spider({ x: 330, y: 176, s: 1.4, hat: "goggles", look: [.8, 1], mark: "dots", mouth: "o", brow: "up",
    legOverride: { R0: [[9, -6], [26, -14], [24, 28]] } });
  s += spider({ x: 548, y: 170, s: 1.45, mask: true, look: [.6, .8], mark: "chevron", mouth: "smirk", brow: "down",
    legOverride: { R0: [[9, -6], [26, -18], [36, 40]] } });
  // front spiders
  // a full-size pencil (spiders are tiny) leaning with its tip on the plan; the front leg steadies it
  s += pencil(88, 96, 230, 318, 15);
  s += spider({ x: 112, y: 300, s: 1.5, hat: "fedora", look: [1, -.2], mark: "star", mouth: "grin",
    legOverride: { R0: [[9, -6], [30, -34], [55, -26]] } });
  // thimble cup of tea, held out by the right spider: one foot through the handle, one under the base
  s += `<path d="M740 262q12 0 12 9t-12 9" fill="none" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += `<path d="M706 252h34l-3 30h-28z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<ellipse cx="723" cy="252" rx="17" ry="4" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/>`;
  s += line("M708 264h30", 3, C.oxB);
  s += line("M716 244q-4 -10 2 -18M728 244q-4 -10 2 -18", 1.8, C.ink, ` opacity=".5"`);
  s += spider({ x: 800, y: 300, s: 1.4, hat: "bowtie", body: C.soft, hi: C.edge, look: [-1, .3], mark: "stripe", mouth: "grin", brow: "up",
    legOverride: { L0: [[-9, -6], [-26, -30], [-40, -26]], L1: [[-12, -2], [-40, -14], [-54, -12]] } });

  // desk lamp (top)
  s += `<path d="M392 60q58 -44 116 0z" fill="${C.ox}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M396 60h108" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>`;
  s += `<ellipse cx="450" cy="62" rx="30" ry="6" fill="${C.goldB}"/>`;
  s += line("M450 40V0", 4);
  s += line("M420 40q12 -16 34 -18", 3, C.oxB);
  s += sparkle(600, 236 - 30, 7) + sparkle(250, 180, 5) + sparkle(820, 200, 4);
  return svg("0 0 900 420", "The crew plans the job around a blueprint", s);
}

export function part_two() {
  const P = "p2";
  let s = stage(P, { w: 900, h: 420, ground: false });
  // ground
  s += line("M60 388H840", 3);
  let hd = ""; for (let x = 76; x < 836; x += 12) hd += `M${x} 394l-8 10`;
  s += line(hd, 1.3, C.ink, ` opacity=".3"`);
  // house shell
  const L = 210, R = 690, T = 150, M = 270, B = 388;
  s += `<path d="M${L - 30} ${T + 6}L450 26L${R + 30} ${T + 6}Z" fill="${C.ox}" stroke="${C.ink}" stroke-width="3.2" stroke-linejoin="round"/>`;
  let sh = ""; for (let i = 0; i < 5; i++) sh += `M${n(450 - (i + 1) * 50)} ${n(26 + (i + 1) * 25.6)}H${n(450 + (i + 1) * 50)}`;
  s += line(sh, 1.6, C.ink, ` opacity=".35"`);
  // attic with vent + chimney
  s += `<rect x="560" y="40" width="34" height="60" fill="${C.plum}" stroke="${C.ink}" stroke-width="3"/><rect x="554" y="34" width="46" height="12" fill="${C.soft}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<rect x="424" y="96" width="52" height="34" rx="3" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += line("M428 104h44M428 112h44M428 120h44", 2.4, C.soft);
  // outer walls
  s += `<rect x="${L}" y="${T}" width="${R - L}" height="${B - T}" fill="${C.cream}" stroke="${C.ink}" stroke-width="4"/>`;
  // room backs (wallpaper tones)
  s += `<rect x="${L}" y="${T}" width="240" height="${M - T}" fill="${C.parch}"/>`;
  s += `<rect x="${L + 240}" y="${T}" width="${R - L - 240}" height="${M - T}" fill="${C.edge}"/>`;
  s += `<rect x="${L}" y="${M}" width="200" height="${B - M}" fill="${C.edge}"/>`;
  s += `<rect x="${L + 200}" y="${M}" width="${R - L - 200}" height="${B - M}" fill="${C.parch}"/>`;
  // wallpaper stripes / dots
  let wp = ""; for (let x = L + 12; x < L + 240; x += 18) wp += `M${x} ${T + 4}V${M - 4}`;
  s += line(wp, 1.4, C.gold, ` opacity=".35"`);
  s += stipple(14, L + 470 - 100, T + 60, 110, 50, 90, 1.4, C.plum, .25);
  // floors & walls
  s += `<rect x="${L - 6}" y="${M - 6}" width="${R - L + 12}" height="12" fill="${C.gold}" stroke="${C.ink}" stroke-width="3"/>`;
  s += line(`M${L + 240} ${T}V${M - 6}M${L + 200} ${M + 6}V${B}`, 6);
  s += `<rect x="${L}" y="${T}" width="${R - L}" height="${B - T}" fill="none" stroke="${C.ink}" stroke-width="4"/>`;
  // cutaway edge hatch (the "sawn" wall edges)
  s += line(`M${L - 6} ${T}V${B}M${R + 6} ${T}V${B}`, 12, C.plum);
  s += line(`M${L - 12} ${T}V${B}M${R + 12} ${T}V${B}`, 2.4);
  let saw = ""; for (let y = T + 8; y < B; y += 14) saw += `M${L - 12} ${y}l12 8M${R} ${y}l12 8`;
  s += line(saw, 1.4, C.ink, ` opacity=".5"`);

  // --- upstairs left: child's bedroom
  s += `<rect x="232" y="228" width="110" height="28" rx="4" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += line("M232 256v8M342 256v8", 4);
  s += `<rect x="226" y="206" width="14" height="50" rx="3" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += `<path d="M262 228q20 -26 56 -8q10 4 24 8z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  // child, sitting up, awake (threat), curious eyes
  s += `<circle cx="258" cy="210" r="15" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<path d="M244 204q14 -18 30 -2q-6 -12 -16 -12q-10 0 -14 14z" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<circle cx="253" cy="211" r="2.6" fill="${C.ink}"/><circle cx="264" cy="211" r="2.6" fill="${C.ink}"/><ellipse cx="258" cy="219" rx="2.4" ry="2" fill="${C.ink}"/>`;
  // sight cone from the child
  s += `<path d="M270 212L440 170L440 250Z" fill="${C.oxB}" opacity=".16"/>`;
  s += `<rect x="370" y="244" width="24" height="20" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2.2"/><rect x="394" y="252" width="18" height="12" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2.2"/>`;
  s += `<path d="M300 170h40v30h-40z" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.4"/><circle cx="330" cy="180" r="4" fill="${C.goldB}"/>`;

  // --- upstairs right: office with the memory stick
  s += `<rect x="492" y="222" width="150" height="10" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += line("M500 232v32M634 232v32", 4);
  s += `<rect x="520" y="178" width="66" height="44" rx="3" fill="${C.ink}" stroke="${C.ink}" stroke-width="2.4"/><rect x="526" y="184" width="54" height="32" fill="${C.soft}"/>`;
  s += line("M532 194h30M532 202h40M532 210h22", 2, C.goldB, ` opacity=".7"`);
  s += `<path d="M546 222h14v-6h-14z" fill="${C.ink}"/>`;
  // glowing memory stick
  s += `<circle cx="612" cy="216" r="18" fill="${C.goldB}" opacity=".3"/>`;
  s += `<rect x="602" y="212" width="22" height="10" rx="2" fill="${C.plum}" stroke="${C.ink}" stroke-width="2"/><rect x="596" y="214" width="7" height="6" fill="${C.edge}" stroke="${C.ink}" stroke-width="1.4"/>`;
  s += sparkle(626, 202, 6);
  // office chair
  s += `<path d="M656 196v40h-26" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`;
  s += line("M643 236v20M630 258h26", 4) + `<circle cx="632" cy="261" r="3" fill="${C.ink}"/><circle cx="654" cy="261" r="3" fill="${C.ink}"/>`;

  // --- downstairs left: living room with the dog
  s += `<ellipse cx="310" cy="376" rx="84" ry="10" fill="${C.ox}" opacity=".5"/>`;
  s += line("M230 372v14M310 372v14", 5);
  s += `<path d="M226 364q-4 -40 16 -44h40q16 0 16 20v24z" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<rect x="220" y="346" width="100" height="28" rx="8" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.6"/>`;
  // sleeping dog
  s += `<path d="M300 378q-4 -30 36 -32q38 -2 46 20q2 12 -6 12z" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.8"/>`;
  s += `<circle cx="376" cy="356" r="16" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.8"/>`;
  s += `<path d="M362 348q-10 4 -8 22q8 -2 10 -14z" fill="${C.ox}" stroke="${C.ink}" stroke-width="2.2"/>`;
  s += line("M372 356q4 3 8 0", 2) + `<ellipse cx="391" cy="360" rx="4" ry="3" fill="${C.ink}"/>`;
  s += `<path d="M306 372q-14 0 -16 -12" stroke="${C.ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M398 334q4 -6 10 -6M404 324q4 -6 10 -6" stroke="${C.ink}" stroke-width="2" fill="none" opacity=".5"/>`;
  // stairs connecting the floors (in the living room)
  // --- downstairs right: kitchen with the tin
  s += `<rect x="462" y="330" width="218" height="58" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<rect x="456" y="322" width="230" height="10" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += line("M516 340v40M572 340v40M626 340v40", 2, C.ink, ` opacity=".6"`);
  s += `<circle cx="506" cy="360" r="3" fill="${C.gold}"/><circle cx="582" cy="360" r="3" fill="${C.gold}"/><circle cx="616" cy="360" r="3" fill="${C.gold}"/>`;
  // upper cabinet with the tin
  s += `<path d="M596 309v14q0 -10 10 -14zM664 309v14q0 -10 -10 -14z" fill="${C.gold}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<rect x="580" y="300" width="96" height="9" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += tin(640, 300, 30, 20, { glow: true, sw: 2 });
  s += sparkle(664, 282, 5);
  // cat prowling on the counter, sight cone
  s += `<path d="M470 322q0 -24 30 -26q30 -2 40 12l6 14z" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<circle cx="540" cy="300" r="12" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<path d="M532 292l2 -12 8 8zM546 290l6 -10 2 12z" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
  s += `<ellipse cx="544" cy="299" rx="2.4" ry="3" fill="${C.goldB}"/><ellipse cx="536" cy="299" rx="2.4" ry="3" fill="${C.goldB}"/>`;
  s += `<path d="M470 316q-24 -4 -22 -30" stroke="${C.ink}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M470 316q-24 -4 -22 -30" stroke="${C.deep}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M552 300L680 262L680 330Z" fill="${C.oxB}" opacity=".14"/>`;
  // robot vacuum rolling in the hall
  s += `<ellipse cx="434" cy="381" rx="18" ry="6" fill="${C.ink}"/><path d="M416 376q18 -12 36 0v4q-18 7 -36 0z" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.2"/><circle cx="434" cy="372" r="2.4" fill="${C.oxB}"/>`;

  // the crew's route: from the roof vent down to the tin (dotted gold)
  s += line("M450 150C452 166 468 172 470 196C472 244 432 250 440 290C448 312 560 302 612 298", 4, C.gold, ` stroke-dasharray="1 9"`);
  s += spider({ x: 450, y: 134, s: .55, mask: true, look: [0, 1], pose: "dangle", rim: C.cream, rimOp: .8, thread: 12, threadColor: C.goldB });
  // storyteller's threat markers: little ox pins over each threat
  const pin = (x, y) => `<path d="M${x} ${y}q-10 -12 -10 -20a10 10 0 0 1 20 0q0 8 -10 20z" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2.2"/><circle cx="${x}" cy="${y - 20}" r="3.6" fill="${C.cream}"/>`;
  s += pin(258, 190) + pin(540, 280) + pin(376, 336) + pin(434, 362);
  // a garden, trees either side for charm
  s += `<path d="M110 388v-60" stroke="${C.ink}" stroke-width="6"/><circle cx="110" cy="300" r="40" fill="${C.good}" stroke="${C.ink}" stroke-width="3"/><path d="M92 290q10 -14 26 -12" stroke="${C.goldB}" opacity=".5" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M790 388v-44" stroke="${C.ink}" stroke-width="6"/><circle cx="790" cy="324" r="30" fill="${C.good}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<circle cx="800" cy="70" r="26" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.4"/><circle cx="792" cy="64" r="5" fill="${C.parch}"/>`;
  s += sparkle(140, 80, 6) + sparkle(740, 120, 4) + sparkle(90, 170, 3.5);
  return svg("0 0 900 420", "A dollhouse cutaway of a location, with its threats marked", s);
}
