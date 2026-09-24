import { C, setPrefix, save, spider, medallion, shadow, circ, ell, path, line, strokes, mirror, STAND_R, star, rng, r1, uid, pt, poly, hairRing, toWorld, leg, rimLight } from "./lib.mjs";

const VB = "0 0 400 400";
const basePat = circ(0, -84, 8, C.gold, C.ink, 2) + path("M-30 -58 Q0 -44 30 -58", "none", C.gold, 4, ` stroke-dasharray="2 7"`) + circ(-22, -76, 4, C.soft) + circ(22, -76, 4, C.soft);
const base = (o = {}) => spider({
  x: 200, y: 232, s: 0.8,
  ceph: { rx: 44, ry: 38 },
  abd: { dx: 0, dy: -62, rx: 50, ry: 44, pattern: basePat },
  legs: [...STAND_R, ...mirror(STAND_R)], legW: 7.5, band: C.deep, dash: "3 12",
  fy: -2, feetShadow: { rx: 13, ry: 4.5, op: 0.22 },
  ...o,
  faceO: { er: 16, esp: 19, lid: "sly", small: "std", mouth: "smirk", ...(o.faceO || {}) },
});
const legs = (R, L = mirror(R)) => [...R, ...L];
// A floor plane seen from slightly above: back edge (horizon) at y=hy, running to the bottom of the field.
const floor = (hy, col = C.edge, op = 0.8) => path(`M30 ${hy} H370 V380 H30 Z`, col, "none", 0, ` opacity="${op}"`) + line([30, hy], [370, hy], C.ink, 2.5);
const S = STAND_R;

// ---------------- face ----------------
{
  setPrefix("rl-face");
  const m = medallion();
  const R = [[[24, 10], [62, -18], [86, -52], [98, -90]], S[1], S[2], S[3]]; // raised in a flourish, above the other legs
  const L = mirror(S);
  // bow tie + pocket square flourish drawn in spider space
  const bow = path("M0 50 L-24 38 L-26 64 Z", C.gold, C.ink, 3) + path("M0 50 L24 38 L26 64 Z", C.gold, C.ink, 3) +
    path("M-20 44 L-22 58 M20 44 L22 58", "none", C.glint, 2.4) + circ(0, 50, 6.5, C.glint, C.ink, 2.6);
  // a slick little quiff of hair
  const quiff = path("M-6 -36 q4 -18 18 -16 q-10 2 -8 14 M4 -37 q6 -12 16 -10", "none", C.ink, 3);
  const sp = base({
    legs: legs(R, L), lifted: [0],
    over: bow + quiff,
    faceO: { lid: ["sly", "wink"], mouth: "grin", look: [0.3, 0] },
  });
  let body = m.bg + `<g clip-path="${m.clip}">`;
  // a stage floor (back edge above the rear feet) and a warm spotlight from above:
  // the beam starts narrow above the frame and widens down to the pool of light the spider stands in
  body += floor(190);
  body += path("M170 52 L206 52 L352 262 L48 262 Z", C.cream, "none", 0, ` opacity="0.35"`);
  body += path("M170 52 L48 262 M206 52 L352 262", "none", C.edge, 2, ` stroke-dasharray="3 9"`);
  body += ell(200, 262, 152, 50, C.cream, C.ink, 0, ` opacity="0.75"`);
  body += `</g>`;
  body += sp;
  // speech bubble with an ellipsis only
  body += `<g transform="translate(416 8) scale(-1 1)">` + path("M236 132 Q236 86 282 84 Q330 84 332 118 Q334 150 288 152 Q274 152 262 148 L238 168 L246 144 Q236 140 236 132 Z", C.cream, C.ink, 3.5) +
    circ(264, 118, 5.5, C.ink) + circ(284, 118, 5.5, C.ink) + circ(304, 118, 5.5, C.ink) + `</g>`;
  body += star(306, 124, 11) + star(282, 92, 6);
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
  L[0] = [[-24, 10], [-66, -4], [-52, 34], [-12, 30]]; // hush: the leg tip held up to the chelicerae
  const GO = { legs: legs(R, L), legW: 7.5, ceph: { rx: 44, ry: 38 }, abd: { dx: 0, dy: -62, rx: 50, ry: 44 } };
  const sp = base({
    y: 216, feetShadow: { rx: 12, ry: 4, op: 0.2 },
    legs: GO.legs, front: [4],
    faceO: { lid: ["sly", "sly"], mouth: "smirk", look: [-0.8, 0.2] },
  });
  // light spilling from the room catches the top edges of the body and legs inside the shadow
  const rimL = rimLight({ x: 200, y: 216, s: 0.8 }, GO, { col: C.gold, w: 2, legs: [1, 2, 3, 5, 6, 7], segs: [0, 1], op: 0.9 });
  let body = m.bg + `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${C.deep}" stop-opacity="1"/><stop offset="0.3" stop-color="${C.deep}" stop-opacity="0.94"/>` +
    `<stop offset="0.44" stop-color="${C.deep}" stop-opacity="0.45"/><stop offset="0.53" stop-color="${C.deep}" stop-opacity="0"/></linearGradient></defs>`;
  body += `<g clip-path="${m.clip}">`;
  body += vent;
  body += sp;
  body += path("M40 40 H360 V360 H40 Z", `url(#${g})`, "none", 0);
  { const rk = uid("rimk"); body += `<clipPath id="${rk}"><path d="M40 40 H360 V206 H40 Z"/></clipPath><g clip-path="url(#${rk})">${rimL}</g>`; }
  // dust motes drifting in the air of the vent
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
  const gog = path("M-44 -26 Q0 -50 44 -26", "none", C.ink, 8) + path("M-44 -26 Q0 -50 44 -26", "none", C.edge, 4.5) +
    circ(-19, -44, 16, C.gold, C.ink, 3.2) + circ(-19, -44, 10, C.glint, C.ink, 2.4) + circ(19, -44, 16, C.gold, C.ink, 3.2) + circ(19, -44, 10, C.glint, C.ink, 2.4) +
    path("M-4 -46 H4", "none", C.ink, 3.5) + path("M-24 -48 l5 -3 M14 -48 l5 -3", "none", C.cream, 2.6);
  // thumbtack held up in the right front leg (spider space)
  const tack = `<g transform="rotate(24 120 -70)">` + path("M120 -64 L120 -2", "none", C.ink, 6) + path("M120 -64 L120 -4", "none", C.cream, 2.6) +
    path("M108 -64 H132 L128 -82 H112 Z", C.oxb, C.ink, 3) + ell(120, -88, 20, 8, C.oxb, C.ink, 3.2) + ell(113, -90, 6, 2.6, C.cream, C.ink, 0, ` opacity="0.8"`) + `</g>`;
  // paperclip grapple in the left front leg: the clip is unbent into a shank with a double hook
  // (two curved prongs with points) at the top; a lint wad is wound round the shank as a muffler,
  // and a silk line is tied through the eye at the bottom and hangs down to the bench.
  const wire = d => path(d, "none", C.ink, 6) + path(d, "none", C.edge, 2.8);
  const clip = wire("M-122 -44 L-122 -118") +
    wire("M-122 -118 Q-122 -140 -142 -138 Q-156 -136 -154 -120") + wire("M-122 -118 Q-122 -140 -102 -138 Q-88 -136 -90 -120") +
    path("M-154 -120 l-4 -7 M-90 -120 l4 -7", "none", C.ink, 3) +
    wire("M-122 -44 q-10 0 -10 -8 q0 -8 10 -8");
  const lint = [[-128, -84, 9], [-116, -90, 8], [-118, -76, 8], [-128, -96, 7]].map(([x, y, r]) => circ(x, y, r, C.cream, C.ink, 2.2)).join("") +
    [[-128, -84, 9], [-116, -90, 8], [-118, -76, 8], [-128, -96, 7]].map(([x, y, r]) => circ(x, y, r - 2.2, C.cream)).join("") +
    path("M-132 -88 q4 -4 8 0 M-120 -80 q3 -3 6 0", "none", C.edge, 1.8);
  // silk line: knotted at the eye, falling straight down to the bench, a few loose coils lying there
  const GT = { x: 200, y: 240, s: 0.8 };
  const eyeW = toWorld(GT, [-132, -52]);
  const sp = base({
    y: 240,
    legs: legs(R, L), lifted: [0, 4],
    afterLegs: "",
    // the last segment of each front leg is redrawn over its tool, so the foot visibly grips it
    over: gog + tack + clip + lint + circ(-132, -52, 3.4, C.gold, C.ink, 1.6) + leg([R[0][2], R[0][3]], { w: 7.5, band: C.deep, dash: "3 12", knee: false }) + leg([L[0][2], L[0][3]], { w: 7.5, band: C.deep, dash: "3 12", knee: false }),
    faceO: { lid: ["half", "squint"], mouth: "smirk", look: [0.4, -0.3] },
  });
  let body = m.bg + `<g clip-path="${m.clip}">`;
  // workbench top (back edge above the rear feet); a spare cog lies flat on it, in perspective
  body += floor(184, C.edge, 0.7);
  // wood grain in a pale tone, so it can't be mistaken for the gold silk line
  body += strokes([[60, 250, 130, 250], [64, 206, 120, 206], [230, 214, 290, 214]], C.parch, 2.5);
  const [gx, gy] = [214, 326];
  let cog = "";
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; cog += `M${r1(gx + Math.cos(a) * 20)} ${r1(gy + Math.sin(a) * 8)} L${r1(gx + Math.cos(a) * 28)} ${r1(gy + Math.sin(a) * 11)}`; }
  body += ell(gx + 2, gy + 4, 30, 11, C.ink, C.ink, 0, ` opacity="0.18"`) + path(cog, "none", C.ink, 9) + path(cog, "none", C.gold, 6) + ell(gx, gy, 22, 8.5, C.gold, C.ink, 2) + ell(gx, gy, 7, 2.8, C.edge, C.ink, 1.6);
  // the grapple's line: straight down from the knot to the bench, then a loose coil lying flat on it
  const benchY = 262;
  body += path(`M${r1(eyeW[0])} ${r1(eyeW[1])} L${r1(eyeW[0])} ${benchY} q-14 -4 -22 2 q-6 8 10 9 q18 1 20 -6 q0 -6 -12 -6`, "none", C.gold, 2.2);
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
    x: 194, y: 238, s: 0.84, lifted: [0, 4],
    ceph: { rx: 50, ry: 40 }, abd: { dx: 0, dy: -64, rx: 56, ry: 46, pattern: basePat },
    legs: legs(R, L), legW: 10,
    over: band + glove(62, -48, 20) + glove(-72, -54, -16),
    faceO: { er: 15, esp: 19, lid: "glare", mouth: "grin", look: [0, 0.2] },
  });
  let body = m.bg + `<g clip-path="${m.clip}">`;
  // inside a kitchen cabinet at spider scale: wooden back wall, the shelf floor he stands on,
  // the foot of a giant bottle (running out of frame), the open door's edge, the shelf lip, the dark room below
  body += path("M30 30 H370 V206 H30 Z", C.parch, "none", 0);
  body += strokes([[80, 30, 80, 206], [170, 30, 170, 206], [262, 30, 262, 206]], C.edge, 3);
  body += path("M190 60 q20 -6 40 0 M290 120 q16 -5 32 0 M104 150 q14 -4 28 0", "none", C.edge, 2);
  body += path("M30 206 H336 L352 330 H30 Z", C.edge, C.ink, 2.5);
  body += strokes([[40, 238, 150, 238], [180, 270, 320, 270], [60, 302, 170, 302]], C.gold, 2);
  // right side wall of the cabinet, with the open door's hinge knuckles on its front edge
  body += path("M336 206 L352 330 L370 330 L370 30 L336 30 Z", C.edge, C.ink, 2.5) + path("M348 60 v30 M348 150 v30", "none", C.ink, 7) + path("M348 60 v30 M348 150 v30", "none", C.gold, 4);
  body += ell(96, 212, 58, 11, C.ink, C.ink, 0, ` opacity="0.25"`);
  body += path("M40 20 V208 A56 10 0 0 0 152 208 V20 Z", C.gold, C.ink, 3) + path("M54 20 V198", "none", C.glint, 8) + path("M40 110 H152 V172 H40 Z", C.cream, C.ink, 2.5) +
    path("M60 132 q8 -6 16 0 t16 0 t16 0 t16 0 M66 152 q7 -5 14 0 t14 0 t14 0", "none", C.ink, 2.4);
  body += path("M30 330 H370 V348 H30 Z", C.gold, C.ink, 3) + path("M30 348 H370 V380 H30 Z", C.deep, "none", 0);
  body += `</g>`;
  body += sp;
  body += m.ring;
  save("role-bruiser", VB, "The Bruiser: a burly spider in a sweatband and tiny boxing gloves, squaring up on a kitchen-cabinet shelf beside a giant bottle", body);
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
    x: 150, y: 170, s: 0.62, lifted: [0],
    legs: legs(R, mirror(L)),
    afterLegs: "",
    over: glass + leg([R[0][2], R[0][3]], { w: 7.5, band: C.deep, dash: "3 12", knee: false }),
    faceO: { lid: ["wink", "wide"], mouth: "flat", look: [1, 0] },
  });
  let body = m.bg + `<g clip-path="${m.clip}">`;
  // night window on the far wall across the room (small only because it is far away): the frame runs
  // off the right edge; a crossbar, a sill, the moon and stars make it read as a window
  body += path("M288 70 H420 V214 H288 Z", C.deep, C.ink, 3);
  body += path("M296 78 H420 V206 H296 Z", "none", C.edge, 3) + path("M296 140 H420", "none", C.edge, 5);
  body += path("M320 162 a12 12 0 1 0 9 20 a9 9 0 1 1 -9 -20 Z", C.glint, C.ink, 1.8);
  body += star(308, 118, 5, C.glint, 1.2) + star(330, 100, 3.5, C.glint, 1) + star(312, 194, 3.5, C.glint, 1);
  body += path("M280 214 H420 V224 H280 Z", C.parch, C.ink, 2.5);
  // top of a tall bookcase, seen from slightly above: the top board is a surface the feet stand on
  body += path("M20 156 H272 V232 H20 Z", C.edge, C.ink, 3) + strokes([[40, 180, 120, 180], [150, 206, 250, 206]], C.gold, 2);
  body += path("M20 232 H276 V248 H20 Z", C.gold, C.ink, 3);
  body += path("M28 248 H268 V420 H28 Z", C.gold, C.ink, 3);
  // book spines at spider scale: each spine is wider than the spider's body
  const cols = [C.parch, C.deep, C.soft, C.good];
  let x = 30;
  for (let i = 0; i < 4; i++) { const w = 56 + (i * 5) % 9; body += path(`M${x} 256 h${w} v160 h${-w} Z`, cols[i], C.ink, 2.5) + path(`M${x + 5} 282 h${w - 10} M${x + 5} 290 h${w - 10}`, "none", i === 0 ? C.gold : C.glint, 2); x += w + 3; }
  // safety line: anchored on the top board's front edge, hanging straight down past the frame
  body += path("M226 234 V420", "none", C.gold, 2, ` stroke-dasharray="2 5"`) + circ(226, 234, 3.5, C.gold, C.ink, 1.5);
  // sight line from the spyglass lens to the window
  { const [lx, ly] = toWorld({ x: 150, y: 170, s: 0.62 }, [20 + 104 * Math.cos(-14 * Math.PI / 180) + 4, -4 + 104 * Math.sin(-14 * Math.PI / 180)]); body += path(`M${r1(lx + 4)} ${r1(ly - 1)} L304 150`, "none", C.ink, 2.4, ` stroke-dasharray="6 7"`); }
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
  const cap = path("M-48 -28 Q-46 -58 4 -60 Q54 -58 52 -30 Q2 -40 -48 -28 Z", C.soft, C.ink, 3.5) +
    path("M-26 -50 Q4 -56 34 -50", "none", C.edge, 3) + path("M-46 -34 Q2 -46 50 -36", "none", C.gold, 4) + path("M-40 -30 Q8 -44 58 -28 Q66 -16 50 -12 Q8 -26 -32 -16 Q-46 -18 -40 -30 Z", C.deep, C.ink, 3.5) +
    path("M-30 -24 Q8 -34 52 -22", "none", C.soft, 2) + circ(4, -59, 5, C.gold, C.ink, 2);
  const gog = path("M-44 -2 H44", "none", C.ink, 8) + path("M-44 -2 H44", "none", C.edge, 4) +
    circ(-19, -2, 20, "none", C.ink, 9) + circ(19, -2, 20, "none", C.ink, 9) + circ(-19, -2, 20, "none", C.gold, 5) + circ(19, -2, 20, "none", C.gold, 5) +
    path("M-28 -12 l8 -6 M10 -12 l8 -6", "none", C.cream, 3);
  // a white silk driving scarf
  const scarf = path("M-34 30 Q0 46 34 30 L30 42 Q0 56 -30 42 Z", C.cream, C.ink, 3) + path("M-30 36 Q-70 40 -104 18 Q-84 44 -118 44 Q-76 64 -32 46 Z", C.cream, C.ink, 3) +
    path("M-40 44 Q-70 48 -96 36 M-26 44 Q0 50 24 40", "none", C.edge, 2.4);
  const WT = { x: 180, y: 262, s: 0.74, rot: 6 };
  const sp = base({
    ...WT,
    legs: legs(R, L),
    over: cap + gog + scarf,
    faceO: { er: 15, esp: 19, lid: "glare", mouth: "grin", look: [1, 0] },
  });
  let body = m.bg + `<g clip-path="${m.clip}">`;
  // a deep window sill at spider scale: wall at the left, the casing edge, and the open window
  // (night outside) at the right; the sill's top surface runs under all eight feet
  body += path("M306 20 H380 V236 H306 Z", C.deep, "none", 0);
  // the night outside: moon and stars placed inside the visible part of the opening
  body += path("M316 138 a13 13 0 1 0 10 22 a10 10 0 1 1 -10 -22 Z", C.glint, C.ink, 1.8);
  body += star(322, 112, 4.5, C.glint, 1.1) + star(334, 196, 3.5, C.glint, 1) + star(316, 212, 3, C.glint, 1);
  body += path("M282 20 H306 V236 H282 Z", C.edge, C.ink, 3) + path("M290 30 V226", "none", C.parch, 3);
  body += path("M20 214 H380 V236 H20 Z", C.ink, "none", 0, ` opacity="0.08"`);
  body += path("M20 236 H380 V322 H20 Z", C.edge, C.ink, 3) + strokes([[44, 262, 130, 262], [210, 300, 330, 300], [300, 250, 370, 250]], C.gold, 2);
  body += path("M20 322 H380 V340 H20 Z", C.gold, C.ink, 3);
  // an exit-arrow sign screwed to the wall, pointing out of the window (a thin plate with a
  // contact shadow on the wall and a screw at each end, so it reads as mounted, not floating)
  body += path("M136 98 H204 V80 L248 112 L204 144 V126 H136 Z", C.ink, "none", 0, ` opacity="0.14"`);
  body += path("M132 92 H200 V74 L244 106 L200 138 V120 H132 Z", C.glint, C.ink, 3.5) + path("M150 106 H196", "none", C.gold, 3);
  body += circ(141, 106, 3.6, C.edge, C.ink, 1.6) + circ(222, 106, 3.6, C.edge, C.ink, 1.6);
  // getaway dragline: anchored on the wall, running to the spinnerets at the abdomen tip
  // (hidden behind the body in this front view); it sags a little under its own weight
  { const [sx, sy] = toWorld(WT, [0, -62 - 44]); body += path(`M62 178 Q${r1((62 + sx) / 2)} ${r1(Math.max(178, sy) + 18)} ${r1(sx)} ${r1(sy)}`, "none", C.gold, 2.5, ` stroke-dasharray="2 5"`) + circ(62, 178, 4, C.gold, C.ink, 2); }
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
  body += path("M30 250 H370 V290 H30 Z", C.gold, C.ink, 3) + line([30, 262], [370, 262], C.ink, 1.6);
  body += path("M30 290 H370 V380 H30 Z", C.edge, C.ink, 3) + strokes([[40, 320, 150, 320], [220, 340, 350, 340]], C.gold, 2);
  body += ell(112, 302, 24, 5, C.ink, C.ink, 0, ` opacity="0.14"`) + ell(288, 302, 22, 5, C.ink, C.ink, 0, ` opacity="0.14"`) + ell(196, 302, 96, 10, C.ink, C.ink, 0, ` opacity="0.16"`);
  // real dust bunnies for cover
  body += fluff(112, 284, 22, 16, 4) + fluff(288, 286, 20, 14, 8);
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
