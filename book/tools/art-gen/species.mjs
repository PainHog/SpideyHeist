import { C, setPrefix, save, spider, cameo, shadow, circ, ell, path, line, strokes, mirror, STAND_R, star, rng, r1, uid, hairRing, cloud, arch, pol, leg, poly, face, shaded, pt, toWorld, toLocal, planted } from "./lib.mjs";

const VB = "0 0 400 400";

// ---------------- jumping ----------------
{
  setPrefix("sp-jump");
  const cam = cameo();
  // pose: mid-leap, front legs flung up "ta-da", rear legs trailing to the ledge
  const R = [
    [[26, 6], [58, -30], [92, -64], [104, -104]],
    [[32, 2], [74, -36], [110, -46], [140, -76]],
    [[32, 8], [70, 34], [104, 50], [128, 86]],
    [[26, 14], [52, 50], [72, 88], [82, 124]],
  ];
  const L = mirror(R);
  const spots = path("M-14 -80 L0 -94 L14 -80 L0 -66 Z", C.cream, C.ink, 2.4) +
    circ(-30, -64, 6, C.cream, C.ink, 2) + circ(30, -64, 6, C.cream, C.ink, 2) +
    path("M-46 -40 Q0 -24 46 -40", "none", C.cream, 4, ` stroke-dasharray="7 6"`);
  const sp = spider({
    x: 200, y: 190, s: 1.0, rot: -10,
    ceph: { rx: 60, ry: 48, fuzz: 42 },
    abd: { dx: 0, dy: -72, rx: 50, ry: 42, fuzz: 40, pattern: spots },
    legs: [...R, ...L], legW: 8.5, band: C.deep, dash: "4 9", fuzz: true,
    fy: -4,
    faceO: { er: 24, esp: 26, lid: ["wide", "sly"], small: [[-54, -24, 6.5], [54, -24, 6.5], [-30, -36, 3.6], [30, -36, 3.6]], che: C.good, mouth: "smirk", look: [0.25, -0.1], cheY: 1.5 },
  });
  const R2 = rng(4);
  let body = cam.bg;
  body += `<g clip-path="${cam.clip}">`;
  // bookshelf ledge in the lower part
  body += path("M20 330 L380 318 L380 400 L20 400 Z", C.edge, C.ink, 3);
  body += path("M20 330 L380 318", "none", C.gold, 3);
  for (let i = 0; i < 9; i++) body += line([40 + i * 40, 348 + R2() * 6], [70 + i * 40, 346 + R2() * 6], C.gold, 2);
  // dragline safety silk: anchored on the ledge, running straight up to the spinnerets at the
  // abdomen tip (the abdomen's far end, hidden behind the body in this front view)
  const spin = toWorld({ x: 200, y: 190, s: 1, rot: -10 }, [0, -72 - 42]);
  body += `</g>`;
  body += `<g clip-path="${cam.clip}">` + line([116, 324], spin, C.gold, 2.4, ` stroke-dasharray="1 5"`) + circ(116, 324, 4, C.gold, C.ink, 2) + `</g>`;
  body += cam.ring;
  body += shadow(206, 330, 58, 7, C.ink, 0.18);
  body += sp;
  // show-off sparkles
  body += star(92, 70, 13) + star(320, 64, 10) + star(338, 118, 6);
  body += strokes([[170, 262, 160, 300], [200, 268, 198, 306], [232, 262, 240, 298]], C.ink, 3.5, ` opacity="0.7"`);
  save("species-jumping", VB, "Jumping spider: fuzzy, huge-eyed, mid-leap with a show-off flourish", body);
}

// ---------------- orb weaver ----------------
{
  setPrefix("sp-orb");
  const cam = cameo();
  const hx = 200, hy = 190, NR = 18;
  let web = "";
  const ang = k => (k / NR) * 360 - 90 + 10;
  // radials
  let rd = "";
  for (let k = 0; k < NR; k++) { const [x, y] = pol(hx, hy, 200, ang(k)); rd += `M${hx} ${hy} L${r1(x)} ${r1(y)}`; }
  web += `<path d="${rd}" stroke="${C.gold}" stroke-width="2" fill="none"/>`;
  // capture spiral as sagging rings
  let sd = "";
  for (let r = 46; r < 190; r += 14) {
    for (let k = 0; k < NR; k++) {
      const a = ang(k), b = ang(k + 1), rr = r + (k / NR) * 14;
      const rb = r + ((k + 1) / NR) * 14;
      const [x1, y1] = pol(hx, hy, rr, a), [x2, y2] = pol(hx, hy, rb, b), [cx, cy] = pol(hx, hy, (rr + rb) / 2 * 0.93, (a + b) / 2);
      sd += `${k === 0 ? `M${r1(x1)} ${r1(y1)}` : ""} Q${r1(cx)} ${r1(cy)} ${r1(x2)} ${r1(y2)}`;
    }
  }
  web += `<path d="${sd}" stroke="${C.gold}" stroke-width="1.5" fill="none"/>`;
  // hub mesh
  let hd = "";
  for (const r of [10, 18, 26]) { for (let k = 0; k <= NR; k++) { const [x, y] = pol(hx, hy, r + (k % 2) * 2, ang(k)); hd += (k ? "L" : "M") + r1(x) + " " + r1(y); } }
  web += `<path d="${hd}" stroke="${C.gold}" stroke-width="1.3" fill="none"/>`;
  // dew drops
  const R = rng(9);
  for (let i = 0; i < 16; i++) { const [x, y] = pol(hx, hy, 70 + R() * 110, ang(Math.floor(R() * NR))); web += circ(x, y, 2 + R() * 2.2, C.glint, C.gold, 1); }

  // spider: feet on radials
  const sx = 200, sy = 214;
  const loc = ([x, y]) => [x - sx, y - sy];
  const footAt = (k, d) => loc(pol(hx, hy, d, ang(k)));
  const roots = [[30, 8], [36, 0], [36, -8], [30, -16]];
  // radial indices: 0 is near top (-80deg). right side k: 4 (~0deg), 3, 2 ; left mirrored
  const RL = [
    arch(roots[0], footAt(6, 142), 34),   // I  down-right
    arch(roots[1], footAt(4, 150), 34),   // II right
    arch(roots[2], footAt(3, 150), 16),   // III up-right
    arch([22, -24], footAt(2, 168), -20),   // IV up
  ];
  const LL = [
    arch([-30, 8], footAt(12, 142), -34),
    arch([-36, 0], footAt(14, 150), -34),
    arch([-36, -8], footAt(15, 150), -16),
    arch([-22, -24], footAt(16, 168), 20),
  ];
  // right leg I holds a plumb-bob instead of a radial
  RL[0] = [[30, 8], [66, -2], [92, 30], [96, 62]];
  // folium + cross pattern for the abdomen (centred at 0,-78)
  let fol = "M0 -134";
  for (let i = 0; i <= 8; i++) { const y = -130 + i * 12.5, w = 8 + Math.sin((i / 8) * Math.PI) * 30 + (i % 2 ? 6 : 0); fol += ` L${r1(w)} ${r1(y)}`; }
  fol += " L0 -22";
  for (let i = 8; i >= 0; i--) { const y = -130 + i * 12.5, w = 8 + Math.sin((i / 8) * Math.PI) * 30 + (i % 2 ? 6 : 0); fol += ` L${r1(-w)} ${r1(y)}`; }
  fol += " Z";
  const pat = path(fol, C.deep, C.gold, 3) +
    [[0, -112], [0, -98], [0, -84], [0, -70], [-14, -98], [14, -98], [-26, -98], [26, -98]].map(([x, y]) => circ(x, y, 3.6, C.cream, C.ink, 1.4)).join("") +
    path("M-54 -60 Q0 -40 54 -60", "none", C.gold, 2.4, ` stroke-dasharray="2 6"`);
  const sp = spider({
    x: sx, y: sy,
    ceph: { rx: 44, ry: 36 },
    abd: { dx: 0, dy: -80, rx: 60, ry: 58, pattern: pat },
    legs: [...RL, ...LL], legW: 7, band: C.gold, dash: "3 12", back: [3, 7],
    fy: -2,
    faceO: { er: 15, esp: 18, lid: "half", small: "std", mouth: "smirk" },
    over: path("M96 62 L96 118", "none", C.gold, 2) + path("M96 114 q-13 16 0 30 q13 -14 0 -30 Z", C.gold, C.ink, 2.6) + circ(92, 126, 2.6, C.glint),
  });
  let body = cam.bg + `<g clip-path="${cam.clip}">${web}</g>` + cam.ring + sp;
  save("species-orb", VB, "Orb weaver: round patterned abdomen, calmly checking the plumb of its neat orb web", body);
}

// ---------------- wolf ----------------
{
  setPrefix("sp-wolf");
  const cam = cameo();
  // front three-quarter sprint toward lower left: low and wide, all eight feet on the floorboards
  // (the floor plane runs from the skirting line at y=150 to the bottom; far feet sit higher)
  const WT = { x: 204, y: 214, s: 0.96, rot: 16 };
  const WF = [[262, 294], [318, 280], [352, 238], [334, 180], [150, 300], [94, 272], [66, 222], [132, 172]];
  const WL = planted(WT, WF, [48, 60, 62, 50, 48, 60, 62, 50]);
  const cp = path("M-7 -40 L7 -40 L4 -14 L-4 -14 Z", C.gold, "none", 0) +
    path("M-48 -4 Q-40 -28 -22 -36", "none", C.gold, 6) + path("M48 -4 Q40 -28 22 -36", "none", C.gold, 6);
  const ap = path("M0 -94 L12 -70 L0 -40 L-12 -70 Z", C.deep, C.ink, 2) +
    [-80, -62].map(y => path(`M-44 ${y} L-22 ${y + 12} M44 ${y} L22 ${y + 12}`, "none", C.gold, 4)).join("") +
    path("M-54 -40 Q0 -20 54 -40", "none", C.gold, 5);
  const sp = spider({
    ...WT,
    ceph: { rx: 52, ry: 38, pattern: cp, fuzz: 40 },
    abd: { dx: 0, dy: -60, rx: 60, ry: 40, pattern: ap, fuzz: 44 },
    legs: WL, legW: 7.5, feetShadow: { rx: 13, ry: 4, op: 0.25 }, band: C.gold, dash: "3 10", fuzz: true,
    fx: -2, fy: -8,
    faceO: { er: 16, esp: 19, lid: "glare", small: "wolf", mouth: "grin", look: [-0.5, 0.3], cheY: 1.95 },
  });
  let body = cam.bg + `<g clip-path="${cam.clip}">`;
  // floorboards in perspective
  body += path("M0 150 L400 150 L400 400 L0 400 Z", C.edge, "none", 0) + line([0, 150], [400, 150], C.ink, 3);
  body += path("M0 150 L400 150 L400 110 L0 110 Z", C.parch, "none", 0);
  body += strokes([[120, 150, -60, 400], [200, 150, 150, 400], [280, 150, 360, 400], [360, 150, 560, 400], [40, 150, -260, 400]], C.gold, 2.2);
  body += strokes([[60, 196, 120, 196], [236, 250, 300, 250], [300, 330, 390, 330], [20, 300, 90, 300]], C.gold, 2);
  body += `</g>` + cam.ring;
  body += shadow(206, 250, 118, 30, C.ink, 0.14);
  // dust puffs kicked up behind the rear (upper-right) feet, resting low on the floor
  body += cloud([[350, 172, 10], [362, 164, 8], [364, 180, 7]]) + cloud([[330, 164, 6], [318, 170, 5]]);
  // speed lines trail up-right, behind the direction of travel
  body += strokes([[284, 96, 318, 74], [306, 126, 342, 106], [262, 72, 290, 54]], C.ink, 4.5);

  body += sp;
  save("species-wolf", VB, "Wolf spider: stocky and striped, sprinting low along the floorboards", body);
}

// ---------------- cellar ----------------
{
  setPrefix("sp-cellar");
  const cam = cameo();
  const crackL = [[236, 0], [244, 50], [232, 96], [246, 140], [236, 186], [250, 232], [240, 278], [248, 318], [256, 336]];
  const crackR = [[270, 0], [274, 50], [262, 96], [276, 140], [266, 186], [278, 232], [264, 278], [268, 318], [256, 336]];
  const crack = "M" + [...crackL, ...crackR.slice().reverse()].map(pt).join(" L") + " Z";
  const lipK = uid("lip");
  const lipPoly = "M" + crackR.map(pt).join(" L") + " L256 420 L420 420 L420 0 Z";
  const R = rng(21);
  let flecks = "";
  for (let i = 0; i < 30; i++) { const x = 30 + R() * 340, y = 30 + R() * 280; flecks += `M${r1(x)} ${r1(y)} q6 -3 12 0`; }
  const wall = path(flecks, "none", C.edge, 2) +
    path("M0 330 L400 330 L400 400 L0 400 Z", C.edge, C.ink, 3) + line([0, 346], [400, 346], C.gold, 2);
  let body = cam.bg + `<clipPath id="${lipK}"><path d="${lipPoly}"/></clipPath>`;
  body += `<g clip-path="${cam.clip}">` + wall;
  body += path(crack, C.deep, C.ink, 3);
  body += path("M244 50 l-26 -14 l-14 6 M246 140 l-22 16 M250 232 l-28 10 l-8 14", "none", C.ink, 2);
  body += `</g>`;
  // spider: tiny body, immense folding legs, sidling into the crack
  const Rl = [
    [[8, -2], [28, -96], [52, -60], [74, -40]],
    [[10, 0], [36, -70], [58, -8], [80, 6]],
    [[10, 4], [32, -38], [52, 40], [78, 48]],
    [[6, 8], [24, 48], [50, 90], [78, 88]],
  ];
  const Ll = [
    [[-8, -2], [-40, -112], [-74, -42], [-62, 12]],
    [[-10, 0], [-60, -100], [-98, -12], [-86, 44]],
    [[-10, 4], [-58, -58], [-112, 40], [-94, 88]],
    [[-6, 8], [-36, -20], [-78, 82], [-50, 112]],
  ];
  // stretch the legs (not the roots) so the body stays tiny against very long, thin legs
  const stretch = l => l.map((p, i) => i ? [p[0] * 1.1, p[1] * 1.1] : p);
  const sp = spider({
    x: 214, y: 198, s: 1.3, rot: 6,
    ceph: { rx: 16, ry: 14 },
    abd: { dx: -4, dy: -26, rx: 9, ry: 24, rot: -14 },
    legs: [...Rl, ...Ll].map(stretch), legW: 2.3,
    fy: 0,
    faceO: { er: 7, esp: 7.4, lid: "worry", small: [[-5, -9, 1.3], [5, -9, 1.3], [-14, -5, 1.5], [14, -5, 1.5]], mouth: "o", look: [0.8, 0], cheW: 0.85 },
  });
  body += sp;
  // wall lip over the crack: the leading legs vanish inside it
  body += `<g clip-path="${cam.clip}"><g clip-path="url(#${lipK})">` + path("M0 0 H400 V330 H0 Z", C.parch, "none", 0) + wall + `</g>`;
  body += path("M" + crackR.map(pt).join(" L"), "none", C.ink, 3) + `</g>`;
  body += cam.ring;
  // sweat beading on the carapace edge (drops hang downward, touching the body)
  body += path("M196 180 q-6 10 0 14 q6 -4 0 -14 Z", C.cream, C.ink, 1.8) + path("M193 199 q-5 8 0 11 q5 -3 0 -11 Z", C.cream, C.ink, 1.6);
  save("species-cellar", VB, "Cellar spider: a tiny body folding impossibly long legs to slip into a crack in the wall", body);
}

// ---------------- spitting ----------------
{
  setPrefix("sp-spit");
  const cam = cameo();
  let body = cam.bg + `<g clip-path="${cam.clip}">`;
  // tabletop
  // tabletop: back edge at y=268 so every foot (near ~300, far ~294) and the card's stand sit on it
  body += path("M0 268 L400 268 L400 400 L0 400 Z", C.edge, "none", 0) + line([0, 268], [400, 268], C.ink, 3);
  body += strokes([[30, 330, 120, 330], [200, 356, 330, 356], [90, 382, 190, 382]], C.gold, 2);
  body += `</g>`;
  // target: a bullseye card propped on the right
  const tx = 322, ty = 176;
  // the card's two wire legs stand on the table, with contact shadows
  body += shadow(tx + 12, 303, 9, 2.5, C.ink, 0.25) + shadow(tx + 34, 296, 8, 2.2, C.ink, 0.25);
  body += path(`M${tx - 8} ${ty + 58} L${tx + 12} 302 M${tx + 22} ${ty + 50} L${tx + 34} 295`, "none", C.ink, 4);
  body += ell(tx, ty, 44, 56, C.cream, C.ink, 4) + ell(tx, ty, 32, 41, C.oxb, C.ink, 2.5) + ell(tx, ty, 21, 27, C.cream, C.ink, 2.5) + ell(tx, ty, 10, 13, C.oxb, C.ink, 2.5);
  // zigzag silk from the fangs to the bullseye
  const fx = 202, fy = 258;
  let zz = `M${fx} ${fy}`; const n = 11;
  for (let i = 1; i <= n; i++) { const x = fx + (tx - fx) * (i / n), y = fy + (ty - fy) * (i / n) + (i < n ? (i % 2 ? -11 : 11) * (1 - i / (n + 2)) : 0); zz += ` L${r1(x)} ${r1(y)}`; }
  body += path(zz, "none", C.ink, 6.5) + path(zz, "none", C.glint, 3);
  // impact splat
  body += path(`M${tx} ${ty} m-16 -6 l10 2 l-2 -12 l8 9 l6 -10 l1 12 l12 -3 l-9 9 l10 7 l-13 -1 l1 12 l-8 -9 l-8 8 l1 -12 l-11 -2 Z`, C.glint, C.ink, 2);
  body += cam.ring;
  // spider: side three-quarter facing right, huge spotted dome
  const near = [
    [[30, 34], [80, 20], [102, 56], [108, 90]],
    [[10, 40], [42, 30], [56, 62], [60, 90]],
    [[-14, 40], [-46, 28], [-68, 60], [-72, 90]],
    [[-30, 34], [-78, 14], [-104, 52], [-114, 90]],
  ];
  const far = [
    [[26, 20], [76, -42], [114, 2], [130, 84]],
    [[10, 16], [40, -60], [74, -30], [86, 82]],
    [[-12, 16], [-50, -60], [-92, -30], [-100, 82]],
    [[-26, 12], [-84, -44], [-128, 0], [-142, 84]],
  ];
  const spots = [[-30, -30, 7], [-8, -40, 6], [14, -32, 7], [-36, -6, 5], [-14, -16, 6], [30, -14, 5], [6, -4, 4], [-44, 12, 4], [-22, 10, 5]]
    .map(([x, y, r]) => circ(x, y, r, C.deep)).join("");
  const aspots = [[-90, -10, 5], [-74, -22, 4], [-104, 6, 4], [-80, 6, 5], [-60, -8, 4]].map(([x, y, r]) => circ(x, y, r, C.deep)).join("");
  const sp = spider({
    x: 154, y: 222, s: 0.86,
    col: C.parch, shade: C.edge, hi: C.cream,
    ceph: { rx: 58, ry: 52, pattern: spots },
    abd: { dx: -72, dy: 0, rx: 42, ry: 32, pattern: aspots },
    legs: [...near, ...far], back: [4, 5, 6, 7], front: [],
    legCols: [C.plum, C.plum, C.plum, C.plum, C.deep, C.deep, C.deep, C.deep], legHl: [C.soft, C.soft, C.soft, C.soft, C.plum, C.plum, C.plum, C.plum],
    legW: 5.5, band: C.parch, dash: "3 9",
    fx: 30, fy: 6,
    faceO: { er: 13, esp: 14, lid: ["wink", "glare"], lidCol: C.parch, small: [[-4, -16, 2.6], [22, -18, 2.6], [36, -8, 3]], mouth: "none", look: [1, 0] },
    over: ell(48, 44, 7, 9, C.plum, C.ink, 2.4) + ell(62, 42, 7, 9, C.plum, C.ink, 2.4) + ell(58, 36, 3, 2, C.glint, C.ink, 0),
  });
  body += shadow(150, 302, 120, 6, C.ink, 0.16);
  body += sp;
  // aim lines
  save("species-spitting", VB, "Spitting spider: domed, spotted carapace, one eye shut, firing a zigzag of silk into a bullseye", body);
}

// ---------------- crab ----------------
{
  setPrefix("sp-crab");
  const cam = cameo();
  const g = uid("blend"), gd = uid("blendD");
  const defs = `<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0.42" stop-color="${C.plum}"/><stop offset="0.62" stop-color="${C.parch}"/></linearGradient>` +
    `<linearGradient id="${gd}" x1="0" y1="0" x2="1" y2="0"><stop offset="0.42" stop-color="${C.deep}"/><stop offset="0.62" stop-color="${C.edge}"/></linearGradient>`;
  const R = rng(5);
  let specks = "";
  const speck = (x0, y0, w, h, n) => { let s = ""; for (let i = 0; i < n; i++) { const x = x0 + R() * w, y = y0 + R() * h, c = [C.edge, C.gold, C.ink, C.edge][i % 4]; s += circ(x, y, 1.2 + R() * 2.2, c); } return s; };
  let body = `<defs>${defs}</defs>` + cam.bg + `<g clip-path="${cam.clip}">`;
  // backsplash tiles
  body += path("M0 0 H400 V150 H0 Z", C.cream, "none", 0);
  for (let x = 0; x < 400; x += 58) body += line([x, 0], [x, 150], C.edge, 3);
  for (let y = 30; y < 150; y += 58) body += line([0, y], [400, y], C.edge, 3);
  body += path("M0 150 H400 V168 H0 Z", C.gold, C.ink, 3);
  // countertop speckle
  body += path("M0 168 H400 V400 H0 Z", C.parch, "none", 0) + speck(0, 172, 400, 228, 260);
  // a sugar cube at the back of the counter, to scale (about 1.6x the spider's body length):
  // it sits on the counter behind the spider and runs out of frame at the right
  const cube = [[226, 98], [316, 66], [420, 92], [330, 124]];
  body += shadow(330, 236, 118, 12, C.ink, 0.16);
  body += path(poly(cube) + "Z", C.cream, C.ink, 3);
  body += path(`M226 98 L330 124 L330 236 L226 206 Z`, C.parch, C.ink, 3);
  body += path(`M330 124 L420 92 L420 204 L330 236 Z`, C.edge, C.ink, 3);
  { const Rs = rng(12); let g = ""; for (let i = 0; i < 70; i++) { const u = Rs(), v = Rs(); const x = 226 + u * 104, y = 98 + u * 26 + v * 108; g += `M${r1(x)} ${r1(y)} l3 1 l-1 3 l-3 -1 Z`; } body += path(g, C.cream, C.edge, 1); }
  body += `</g>` + cam.ring;
  // spider: flattened, wide, sideways; front two pairs long and open
  // legs I and II are held up and open (ambush pose); legs III and IV stand on the counter
  const CT = { x: 200, y: 248, s: 0.9, rot: -8 };
  const stand = (root, foot, b) => arch(root, toLocal(CT, foot), root[0] > 0 ? b : -b, 0.42, 0.78, 0.4);
  const Rr = [
    [[40, 4], [96, -42], [150, -46], [176, -14]],
    [[44, -6], [104, -76], [156, -96], [184, -74]],
    stand([38, 12], [270, 312], 22),
    stand([30, 16], [236, 326], 14),
  ];
  const Ll = [
    [[-40, 4], [-96, -42], [-150, -46], [-176, -14]],
    [[-44, -6], [-104, -76], [-156, -96], [-184, -74]],
    stand([-38, 12], [138, 318], 22),
    stand([-30, 16], [170, 330], 14),
  ];
  // camouflage speckles over the pale half
  const camo = (cx, cy, w, h) => `<g opacity="0.95">${speck(cx, cy, w, h, 40)}</g>`;
  const sp = spider({
    ...CT, feetShadow: { rx: 12, ry: 4, op: 0.25 }, lifted: [0, 1, 4, 5],
    col: `url(#${g})`, shade: `url(#${gd})`, hi: "none",
    ceph: { rx: 54, ry: 30, pattern: camo(6, -30, 50, 60), hi: "none" },
    abd: { dx: 0, dy: -44, rx: 70, ry: 44, pattern: camo(8, -88, 64, 90) + path("M-30 -62 Q0 -50 30 -62 M-40 -40 Q0 -26 40 -40", "none", C.deep, 3, ` opacity="0.5"`), hi: "none" },
    legs: [...Rr, ...Ll], legW: 7.5,
    legCols: [C.parch, C.parch, C.parch, C.parch, C.plum, C.plum, C.plum, C.plum], legHl: [C.cream, C.cream, C.cream, C.cream, C.soft, C.soft, C.soft, C.soft],
    fx: -4, fy: -6,
    faceO: { er: 13, esp: 16, lid: "sly", lidCol: C.plum, small: [[-40, -12, 3.5], [36, -12, 3.5], [-8, -18, 2.4], [8, -18, 2.4]], mouth: "smirk", look: [-1, 0.2], che: C.soft },
  });
  body += shadow(204, 300, 96, 22, C.ink, 0.12);
  body += sp;
  save("species-crab", VB, "Crab spider: flattened and sideways, long front legs held open, half its body blending into a speckled countertop", body);
}
