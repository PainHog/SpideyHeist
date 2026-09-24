import { C, setPrefix, save, spider, medallion, shadow, circ, ell, path, line, strokes, mirror, STAND_R, star, rng, r1, uid, pt, poly, hairRing } from "./lib.mjs";

const VB = "0 0 400 400";
const basePat = circ(0, -84, 8, C.gold, C.ink, 2) + path("M-30 -58 Q0 -44 30 -58", "none", C.gold, 4, ` stroke-dasharray="2 7"`) + circ(-22, -76, 4, C.soft) + circ(22, -76, 4, C.soft);
const base = (o = {}) => spider({
  x: 200, y: 232, s: 0.8,
  ceph: { rx: 44, ry: 38 },
  abd: { dx: 0, dy: -62, rx: 50, ry: 44, pattern: basePat },
  legs: [...STAND_R, ...mirror(STAND_R)], legW: 7.5, band: C.deep, dash: "3 12",
  fy: -2,
  ...o,
  faceO: { er: 16, esp: 19, lid: "sly", small: "std", mouth: "smirk", ...(o.faceO || {}) },
});
const legs = (R, L = mirror(R)) => [...R, ...L];
const S = STAND_R;

// ---------------- face ----------------
{
  setPrefix("rl-face");
  const m = medallion();
  const R = [[[24, 10], [62, -18], [86, -52], [98, -90]], S[1], S[2], S[3]];
  const L = mirror(S);
  // bow tie + pocket square flourish drawn in spider space
  const bow = path("M0 50 L-24 38 L-26 64 Z", C.oxb, C.ink, 3) + path("M0 50 L24 38 L26 64 Z", C.oxb, C.ink, 3) +
    path("M-20 44 L-22 58 M20 44 L22 58", "none", C.ox, 2.4) + circ(0, 50, 6.5, C.ox, C.ink, 2.6);
  // a slick little quiff of hair
  const quiff = path("M-6 -36 q4 -18 18 -16 q-10 2 -8 14 M4 -37 q6 -12 16 -10", "none", C.ink, 3);
  const sp = base({
    legs: legs(R, L),
    over: bow + quiff,
    faceO: { lid: ["sly", "wink"], mouth: "grin", look: [0.3, 0] },
  });
  let body = m.bg + `<g clip-path="${m.clip}">`;
  // warm spotlight
  body += ell(200, 330, 150, 40, C.edge, C.ink, 0, ` opacity="0.8"`);
  body += path("M60 80 L140 350 M340 80 L260 350", "none", C.edge, 2, ` stroke-dasharray="3 9"`);
  body += `</g>`;
  body += sp;
  // speech bubble with an ellipsis only
  body += `<g transform="translate(-16 8)">` + path("M236 132 Q236 86 282 84 Q330 84 332 118 Q334 150 288 152 Q274 152 262 148 L238 168 L246 144 Q236 140 236 132 Z", C.cream, C.ink, 3.5) +
    circ(264, 118, 5.5, C.ink) + circ(284, 118, 5.5, C.ink) + circ(304, 118, 5.5, C.ink) + `</g>`;
  body += star(92, 128, 11) + star(118, 96, 6) + star(330, 206, 8);
  body += m.ring;
  save("role-face", VB, "The Face: a charming spider in a bow tie, winking mid-pitch beside an empty speech bubble", body);
}

// ---------------- ghost ----------------
{
  setPrefix("rl-ghost");
  const m = medallion();
  const g = uid("fade");
  // vent: frame + dark mouth + slats (one bent open)
  const vent = path("M112 58 H288 V196 H112 Z", C.edge, C.ink, 3.5) + path("M124 70 H276 V184 H124 Z", C.ink, C.ink, 2) +
    [86, 104, 122].map(y => path(`M126 ${y} H274`, "none", C.edge, 7) + path(`M126 ${y + 4} H274`, "none", C.ink, 1.5)).join("") +
    path("M126 150 L274 150 L262 176 L138 176 Z", C.parch, C.ink, 2.5) +
    circ(120, 64, 3, C.gold, C.ink, 1.5) + circ(280, 64, 3, C.gold, C.ink, 1.5) + circ(120, 190, 3, C.gold, C.ink, 1.5) + circ(280, 190, 3, C.gold, C.ink, 1.5);
  const R = [[[24, 10], [62, -8], [92, 40], [90, 96]], [[30, 4], [84, -26], [118, 26], [128, 84]], S[2], S[3]];
  const L = mirror(R);
  const sp = base({
    y: 216,
    legs: legs(R, L),
    faceO: { lid: ["sly", "sly"], mouth: "smirk", look: [-0.8, 0.2] },
  });
  let body = m.bg + `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${C.deep}" stop-opacity="1"/><stop offset="0.3" stop-color="${C.deep}" stop-opacity="0.94"/>` +
    `<stop offset="0.44" stop-color="${C.deep}" stop-opacity="0.45"/><stop offset="0.53" stop-color="${C.deep}" stop-opacity="0"/></linearGradient></defs>`;
  body += `<g clip-path="${m.clip}">`;
  body += vent;
  body += sp;
  body += path("M40 40 H360 V360 H40 Z", `url(#${g})`, "none", 0);
  // glowing eyes still visible in the shadow + dust motes
  const R2 = rng(3);
  for (let i = 0; i < 14; i++) body += circ(70 + R2() * 260, 70 + R2() * 110, 1.2 + R2() * 1.6, C.glint, C.ink, 0, ` opacity="${r1(0.4 + R2() * 0.5)}"`);
  body += `</g>`;
  body += star(304, 272, 7, C.glint, 1.6) + star(96, 262, 5, C.glint, 1.4);
  body += m.ring;
  save("role-ghost", VB, "The Ghost: a spider slipping out of a wall vent, its back half melting into shadow, one leg raised for hush", body);
}

// ---------------- tinkerer ----------------
{
  setPrefix("rl-tink");
  const m = medallion();
  const R = [[[24, 10], [64, -16], [96, -30], [118, -60]], S[1], S[2], S[3]];
  const L = [[[-24, 10], [-62, -14], [-96, -24], [-116, -54]], ...mirror(S).slice(1)];
  // goggles pushed up on the head
  const gog = path("M-44 -26 Q0 -50 44 -26", "none", C.ink, 8) + path("M-44 -26 Q0 -50 44 -26", "none", C.ox, 4.5) +
    circ(-19, -44, 16, C.gold, C.ink, 3.2) + circ(-19, -44, 10, C.glint, C.ink, 2.4) + circ(19, -44, 16, C.gold, C.ink, 3.2) + circ(19, -44, 10, C.glint, C.ink, 2.4) +
    path("M-4 -46 H4", "none", C.ink, 3.5) + path("M-24 -48 l5 -3 M14 -48 l5 -3", "none", C.cream, 2.6);
  // thumbtack held up in the right front leg (spider space)
  const tack = `<g transform="rotate(24 120 -70)">` + path("M120 -64 L120 -2", "none", C.ink, 6) + path("M120 -64 L120 -4", "none", C.cream, 2.6) +
    path("M108 -64 H132 L128 -82 H112 Z", C.oxb, C.ink, 3) + ell(120, -88, 20, 8, C.oxb, C.ink, 3.2) + ell(113, -90, 6, 2.6, C.cream, C.ink, 0, ` opacity="0.8"`) + `</g>`;
  // paperclip grapple with a lint puff, in the left front leg
  const clip = path("M-118 -56 L-118 -112 Q-118 -124 -130 -124 Q-142 -124 -142 -112 L-142 -70 Q-142 -62 -134 -62 Q-126 -62 -126 -70 L-126 -106", "none", C.ink, 6) +
    path("M-118 -56 L-118 -112 Q-118 -124 -130 -124 Q-142 -124 -142 -112 L-142 -70 Q-142 -62 -134 -62 Q-126 -62 -126 -70 L-126 -106", "none", C.edge, 2.8);
  const lint = [[-150, -140, 12], [-134, -146, 11], [-120, -138, 9], [-142, -128, 9]].map(([x, y, r]) => circ(x, y, r, C.cream, C.ink, 2.4)).join("") +
    [[-150, -140, 12], [-134, -146, 11], [-120, -138, 9], [-142, -128, 9]].map(([x, y, r]) => circ(x, y, r - 2.4, C.cream)).join("") +
    path("M-154 -142 q4 -4 8 0 M-138 -148 q4 -4 8 0 M-126 -136 q3 -3 6 0", "none", C.edge, 2);
  const sp = base({
    y: 240,
    legs: legs(R, L),
    afterLegs: "",
    over: gog + tack + clip + lint,
    faceO: { lid: ["half", "squint"], mouth: "smirk", look: [0.4, -0.3] },
  });
  let body = m.bg + `<g clip-path="${m.clip}">`;
  // workbench: a cog and a spool in the background
  let cog = "";
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; cog += `M${r1(92 + Math.cos(a) * 30)} ${r1(300 + Math.sin(a) * 30)} L${r1(92 + Math.cos(a) * 42)} ${r1(300 + Math.sin(a) * 42)}`; }
  body += path(cog, "none", C.edge, 12) + circ(92, 300, 32, C.edge) + circ(92, 300, 12, C.parch, C.edge, 0);
  body += ell(200, 340, 140, 30, C.edge, C.ink, 0, ` opacity="0.7"`);
  body += `</g>`;
  body += sp;
  body += star(270, 108, 10) + star(300, 136, 6) + star(248, 88, 5);
  body += m.ring;
  save("role-tinkerer", VB, "The Tinkerer: goggles pushed up, brandishing a thumbtack and a paperclip-and-lint grapple", body);
}

// ---------------- bruiser ----------------
{
  setPrefix("rl-bruise");
  const m = medallion();
  const R = [[[26, 8], [66, 24], [74, -12], [62, -40]], S[1], S[2], S[3]];
  const L = [[[-26, 8], [-68, 22], [-80, -16], [-72, -46]], ...mirror(S).slice(1)];
  const glove = (x, y, rot) => `<g transform="rotate(${rot} ${x} ${y})">` + path(`M${x - 6} ${y + 12} h12 v10 h-12 Z`, C.cream, C.ink, 2.6) +
    ell(x, y, 17, 19, C.oxb, C.ink, 3.2) + ell(x - 13, y + 2, 8, 10, C.oxb, C.ink, 3) + ell(x - 4, y - 8, 6, 4, C.cream, C.ink, 0, ` opacity="0.7"`) + `</g>`;
  const band = path("M-46 -24 Q0 -50 46 -24", "none", C.ink, 13) + path("M-46 -24 Q0 -50 46 -24", "none", C.oxb, 8.5) +
    path("M44 -26 q18 -6 26 -22 M44 -22 q24 2 34 -10", "none", C.ink, 7.5) + path("M44 -26 q18 -6 26 -22 M44 -22 q24 2 34 -10", "none", C.oxb, 4);
  const sp = base({
    y: 238, s: 0.84,
    ceph: { rx: 50, ry: 40 }, abd: { dx: 0, dy: -64, rx: 56, ry: 46, pattern: basePat },
    legs: legs(R, L), legW: 10,
    over: band + glove(62, -48, 20) + glove(-72, -54, -16),
    faceO: { er: 15, esp: 19, lid: "glare", mouth: "grin", look: [0, 0.2] },
  });
  let body = m.bg + `<g clip-path="${m.clip}">`;
  // cabinet interior with a door swinging open
  body += path("M60 70 H250 V330 H60 Z", C.gold, C.ink, 3) + path("M72 82 H238 V318 H72 Z", C.edge, C.ink, 2.5) + path("M72 200 H238", "none", C.gold, 7) + path("M72 204 H238", "none", C.ink, 2);
  body += path("M84 200 v-40 h24 v40 Z M88 160 v-8 h16 v8", C.cream, C.ink, 2.4) + path("M186 200 q0 -30 14 -30 q14 0 14 30 Z", C.plum, C.ink, 2.4) + path("M82 318 h50 v-26 h-50 Z", C.parch, C.ink, 2.4);
  body += path("M250 70 L344 44 L344 356 L250 330 Z", C.gold, C.ink, 3.5) + path("M262 90 L332 70 L332 330 L262 312 Z", "none", C.ink, 2) + circ(268, 200, 5, C.glint, C.ink, 2);
  body += path("M354 90 q14 24 0 48 M362 170 q14 24 0 48 M354 250 q14 24 0 48", "none", C.ink, 3);
  body += `</g>`;
  body += sp;
  body += star(84, 140, 9) + star(116, 110, 5);
  body += m.ring;
  save("role-bruiser", VB, "The Bruiser: a burly spider in a sweatband and tiny boxing gloves, bursting from a cabinet", body);
}

// ---------------- lookout ----------------
{
  setPrefix("rl-look");
  const m = medallion();
  const R = [[[24, 10], [52, 30], [76, 14], [70, -12]], S[1], S[2], S[3]];
  const L = [S[0], S[1], S[2], S[3]].map((l, i) => i === 0 ? [[24, 10], [58, -20], [70, 30], [64, 78]] : l);
  const glass = `<g transform="rotate(-14 20 -4)">` + path("M12 -12 H34 V4 H12 Z", C.gold, C.ink, 3) + path("M32 -14 H92 V6 H32 Z", C.gold, C.ink, 3) + path("M90 -20 H124 V12 H90 Z", C.gold, C.ink, 3) +
    path("M52 -14 V6 M70 -14 V6", "none", C.ink, 2.4) + path("M36 -9 H88", "none", C.glint, 2.4) + ell(124, -4, 5, 16, C.glint, C.ink, 2.4) + `</g>`;
  const sp = base({
    x: 150, y: 176, s: 0.66,
    legs: legs(R, mirror(L)),
    front: [0],
    afterLegs: "",
    over: glass,
    faceO: { lid: ["wink", "wide"], mouth: "flat", look: [1, 0] },
  });
  let body = m.bg + `<g clip-path="${m.clip}">`;
  // night window on the right
  body += path("M258 60 H372 V250 H258 Z", C.deep, C.ink, 3) + path("M315 60 V250 M258 150 H372", "none", C.edge, 5);
  body += path("M340 92 a16 16 0 1 0 12 26 a12 12 0 1 1 -12 -26 Z", C.glint, C.ink, 2);
  for (const [x, y] of [[278, 84], [296, 120], [282, 200], [344, 188], [360, 226]]) body += circ(x, y, 1.8, C.glint);
  // tall bookcase: top shelf ledge + spines dropping away
  body += path("M40 222 H232 V420 H40 Z", C.gold, C.ink, 3.5) + path("M36 214 H240 V230 H36 Z", C.edge, C.ink, 3);
  const cols = [C.plum, C.ox, C.deep, C.soft, C.good, C.ox, C.plum, C.deep];
  let x = 50;
  for (let i = 0; i < 8; i++) { const w = 18 + (i * 7) % 9; body += path(`M${x} 240 h${w} v160 h${-w} Z`, cols[i], C.ink, 2.5) + path(`M${x + 3} 262 h${w - 6} M${x + 3} 268 h${w - 6}`, "none", C.glint, 1.5); x += w + 2; }
  // dizzying drop: dangling safety line
  body += path("M214 214 V352", "none", C.gold, 2, ` stroke-dasharray="2 5"`);
  // sight line to the window
  body += path("M238 132 L300 112", "none", C.ink, 2.4, ` stroke-dasharray="6 7"`);
  body += `</g>`;
  body += sp;
  body += m.ring;
  save("role-lookout", VB, "The Lookout: perched atop a tall bookcase, one eye to a tiny brass spyglass", body);
}

// ---------------- wheelman ----------------
{
  setPrefix("rl-wheel");
  const m = medallion();
  const R = [[[24, 8], [66, -28], [104, -6], [124, 30]], [[30, 4], [84, -42], [118, 6], [132, 58]], S[2], S[3]];
  const L = [[[-24, 10], [-58, -12], [-84, 20], [-96, 64]], ...mirror(S).slice(1)];
  const cap = path("M-48 -28 Q-46 -58 4 -60 Q54 -58 52 -30 Q2 -40 -48 -28 Z", C.ox, C.ink, 3.5) +
    path("M-26 -50 Q4 -56 34 -50", "none", C.oxb, 3) + path("M-40 -30 Q8 -44 58 -28 Q66 -16 50 -12 Q8 -26 -32 -16 Q-46 -18 -40 -30 Z", C.deep, C.ink, 3.5) +
    path("M-30 -24 Q8 -34 52 -22", "none", C.soft, 2) + circ(4, -59, 5, C.gold, C.ink, 2);
  const gog = path("M-44 -2 H44", "none", C.ink, 8) + path("M-44 -2 H44", "none", C.ox, 4) +
    circ(-19, -2, 20, "none", C.ink, 9) + circ(19, -2, 20, "none", C.ink, 9) + circ(-19, -2, 20, "none", C.gold, 5) + circ(19, -2, 20, "none", C.gold, 5) +
    path("M-28 -12 l8 -6 M10 -12 l8 -6", "none", C.cream, 3);
  const scarf = path("M-34 30 Q0 46 34 30 L30 42 Q0 56 -30 42 Z", C.oxb, C.ink, 3) + path("M-30 36 Q-70 40 -104 18 Q-84 44 -118 44 Q-76 64 -32 46 Z", C.oxb, C.ink, 3);
  const sp = base({
    x: 176, y: 240, s: 0.8, rot: 6,
    legs: legs(R, L),
    over: cap + gog + scarf,
    faceO: { er: 15, esp: 19, lid: "glare", mouth: "grin", look: [1, 0] },
  });
  let body = m.bg + `<g clip-path="${m.clip}">`;
  // open window at the right with night outside
  body += path("M276 120 H372 V310 H276 Z", C.deep, C.ink, 3.5) + path("M276 40 H372 V132 H276 Z", C.edge, C.ink, 3) + path("M324 40 V132", "none", C.ink, 2.5);
  body += path("M264 306 H384 V322 H264 Z", C.edge, C.ink, 3);
  for (const [x, y] of [[300, 160], [346, 190], [310, 250], [356, 276], [330, 222]]) body += circ(x, y, 2, C.glint);
  body += path("M350 150 a14 14 0 1 0 10 22 a10 10 0 1 1 -10 -22 Z", C.glint, C.ink, 2);
  // exit arrow painted on the wall, pointing out of the window
  body += path("M150 86 H218 V68 L262 100 L218 132 V114 H150 Z", C.glint, C.ink, 3.5) + path("M160 100 H214", "none", C.gold, 3);
  // speed lines and the anchored getaway line
  body += strokes([[50, 262, 96, 256], [56, 290, 104, 282], [72, 316, 110, 308]], C.ink, 4);
  body += path("M60 330 Q140 300 208 262", "none", C.gold, 2.5, ` stroke-dasharray="2 5"`) + circ(60, 330, 4, C.gold, C.ink, 2);
  body += `</g>`;
  body += sp;
  body += m.ring;
  save("role-wheelman", VB, "The Wheelman: driving cap, goggles and a streaming scarf, poised at an open window beside an exit arrow", body);
}

// ---------------- grifter ----------------
{
  setPrefix("rl-grift");
  const m = medallion();
  const fluff = (cx, cy, r, n, seed, eyes = "") => {
    const R = rng(seed); let s = "";
    let d = "";
    const P = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, rr = r * (0.9 + R() * 0.12); P.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.86, a]); }
    d = "M" + pt(P[0]);
    for (let i = 0; i < n; i++) { const [x1, y1, a1] = P[i], [x2, y2, a2] = P[(i + 1) % n]; const am = a1 + Math.PI / n, bulge = r * (1.1 + R() * 0.06); d += ` Q${r1(cx + Math.cos(am) * bulge)} ${r1(cy + Math.sin(am) * bulge * 0.86)} ${r1(x2)} ${r1(y2)}`; }
    s += path(d + "Z", C.edge, C.ink, 3);
    let t = "";
    for (let i = 0; i < n * 1.6; i++) {
      const a = R() * Math.PI * 2, rr = r * Math.sqrt(R()) * 0.9, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.86;
      t += `M${r1(x)} ${r1(y)} q${r1(4 + R() * 4)} ${r1(-3 - R() * 3)} ${r1(8 + R() * 6)} 0`;
    }
    s += path(t, "none", C.gold, 1.8, ` opacity="0.8"`);
    let h = "";
    for (let i = 0; i < n * 1.4; i++) { const a = (i / (n * 1.4)) * Math.PI * 2, x = cx + Math.cos(a) * r * 0.98, y = cy + Math.sin(a) * r * 0.84; h += `M${r1(x)} ${r1(y)} l${r1(Math.cos(a + 0.4) * (6 + R() * 6))} ${r1(Math.sin(a + 0.4) * (6 + R() * 6))}`; }
    s += path(h, "none", C.ink, 2);
    return s + eyes;
  };
  let body = m.bg + `<g clip-path="${m.clip}">`;
  // baseboard corner
  body += path("M40 290 H360 V360 H40 Z", C.edge, C.ink, 3) + line([40, 306], [360, 306], C.gold, 2);
  body += ell(96, 300, 30, 6, C.ink, C.ink, 0, ` opacity="0.14"`) + ell(310, 300, 26, 5, C.ink, C.ink, 0, ` opacity="0.14"`) + ell(196, 302, 96, 10, C.ink, C.ink, 0, ` opacity="0.16"`);
  // real dust bunnies for cover
  body += fluff(96, 276, 30, 18, 4) + fluff(310, 278, 26, 16, 8);
  // eight little feet poking out under the disguise
  const feet = [-70, -50, -30, -12, 12, 30, 50, 70];
  for (const [i, dx] of feet.entries()) body += path(`M${196 + dx} 272 L${196 + dx * 1.14} 298`, "none", C.ink, 7) + path(`M${196 + dx} 272 L${196 + dx * 1.14} 298`, "none", C.plum, 3.5) + circ(196 + dx * 1.14, 299, 3.6, C.ink);
  // the disguise
  const eyeHole = ell(196, 204, 56, 24, C.deep, C.ink, 3);
  const k = uid("hole");
  body += fluff(196, 210, 98, 30, 12);
  body += eyeHole + `<clipPath id="${k}">${ell(196, 204, 54, 22, "#000")}</clipPath>`;
  body += `<g clip-path="url(#${k})">` + ell(196, 214, 60, 30, C.plum) + `</g>`;
  body += `</g>`;
  // eyes peeking out from the fluff
  body += `<g transform="translate(196 206)">` +
    `${(await import("./lib.mjs")).face(0, 0, { er: 17, esp: 22, lid: "sly", small: [[-46, -6, 3.2], [46, -6, 3.2]], mouth: "none", look: [0.6, 0.1] })}</g>`;
  // tufts drooping over the eye slot
  body += path("M142 184 q10 10 22 2 q10 8 22 0 q12 8 22 0 q12 8 22 0 q10 8 20 -2", "none", C.ink, 3) + path("M146 184 q8 7 18 1 q10 7 22 0 q12 7 22 0 q12 7 22 0 q8 7 16 -2", "none", C.edge, 3);
  body += star(300, 150, 8) + star(96, 150, 6);
  body += m.ring;
  save("role-grifter", VB, "The Grifter: disguised as a dust bunny, sly eyes and eight tiny feet peeking out", body);
}
