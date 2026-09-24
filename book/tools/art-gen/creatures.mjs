import { C, setPrefix, save, spider, oval, shadow, circ, ell, path, line, strokes, mirror, STAND_R, star, rng, r1, uid, pt, poly, furTicks, hairRing, face } from "./lib.mjs";

const VB = "0 0 480 400";
const mini = (x, y, s, faceO = {}, extra = {}) => spider({
  x, y, s,
  ceph: { rx: 44, ry: 38 }, abd: { dx: 0, dy: -62, rx: 50, ry: 44 },
  legs: [...STAND_R, ...mirror(STAND_R)], legW: 8, band: C.deep, dash: "3 12",
  fy: -2, ...extra,
  faceO: { er: 17, esp: 20, lid: "worry", small: "std", mouth: "o", ...faceO },
});
const drop = (x, y, s = 1) => path(`M${x} ${y} q${-7 * s} ${11 * s} 0 ${16 * s} q${7 * s} ${-5 * s} 0 ${-16 * s} Z`, C.cream, C.ink, 2);

// ---------------- cat ----------------
{
  setPrefix("cr-cat");
  const v = oval();
  let body = v.bg + `<g clip-path="${v.clip}">`;
  // floorboards
  body += path("M0 300 H480 V400 H0 Z", C.edge, "none", 0) + line([0, 300], [480, 300], C.ink, 3) + strokes([[0, 340, 480, 340], [120, 300, 110, 340], [330, 340, 320, 400], [70, 340, 64, 400]], C.gold, 2);
  // crouched body and chest behind the head
  body += path("M40 400 Q30 250 120 230 L310 230 Q350 250 352 400 Z", C.gold, C.ink, 3.5);
  body += path("M150 250 Q210 330 270 250 L270 400 L150 400 Z", C.cream, C.ink, 3);
  body += path("M64 300 q30 -8 44 10 M60 340 q34 -8 50 12 M340 300 q-26 -8 -40 10 M346 344 q-30 -8 -44 12", "none", C.ox, 7);
  // planted front paw
  body += path("M96 300 Q92 350 104 372 L170 372 Q176 340 168 300 Z", C.gold, C.ink, 3.5);
  body += ell(136, 372, 42, 18, C.cream, C.ink, 3.5) + path("M122 372 v14 M138 374 v14 M154 372 v14", "none", C.ink, 2.4);
  body += `</g>` + v.ring;
  // head (breaks the frame at the top)
  const hx = 214, hy = 168;
  const ears = path(`M${hx - 128} ${hy - 30} L${hx - 116} ${hy - 150} L${hx - 36} ${hy - 96} Z`, C.gold, C.ink, 4) +
    path(`M${hx + 128} ${hy - 30} L${hx + 116} ${hy - 150} L${hx + 36} ${hy - 96} Z`, C.gold, C.ink, 4) +
    path(`M${hx - 112} ${hy - 58} L${hx - 108} ${hy - 124} L${hx - 58} ${hy - 90} Z`, C.parch, C.ink, 2.5) +
    path(`M${hx + 112} ${hy - 58} L${hx + 108} ${hy - 124} L${hx + 58} ${hy - 90} Z`, C.parch, C.ink, 2.5) +
    path(`M${hx - 104} ${hy - 80} l-6 -12 M${hx - 96} ${hy - 76} l-2 -14 M${hx + 104} ${hy - 80} l6 -12 M${hx + 96} ${hy - 76} l2 -14`, "none", C.ink, 2);
  body += ears;
  // head shape with cheek fluff
  const head = `M${hx - 138} ${hy + 10} Q${hx - 150} ${hy - 104} ${hx} ${hy - 110} Q${hx + 150} ${hy - 104} ${hx + 138} ${hy + 10}` +
    ` L${hx + 152} ${hy + 30} L${hx + 128} ${hy + 40} L${hx + 142} ${hy + 62} L${hx + 108} ${hy + 64} Q${hx + 60} ${hy + 104} ${hx} ${hy + 104}` +
    ` Q${hx - 60} ${hy + 104} ${hx - 108} ${hy + 64} L${hx - 142} ${hy + 62} L${hx - 128} ${hy + 40} L${hx - 152} ${hy + 30} Z`;
  body += path(head, C.gold, C.ink, 4);
  body += path(`M${hx - 110} ${hy - 72} Q${hx - 60} ${hy - 104} ${hx - 10} ${hy - 104}`, "none", C.glint, 5, ` opacity="0.7"`);
  // tabby stripes
  body += path(`M${hx} ${hy - 108} L${hx - 7} ${hy - 70} L${hx} ${hy - 58} L${hx + 7} ${hy - 70} Z M${hx - 30} ${hy - 104} L${hx - 26} ${hy - 72} L${hx - 18} ${hy - 104} Z M${hx + 30} ${hy - 104} L${hx + 26} ${hy - 72} L${hx + 18} ${hy - 104} Z`, C.ox, "none", 0);
  body += path(`M${hx - 138} ${hy - 6} l34 6 l-34 10 Z M${hx - 144} ${hy + 22} l30 2 l-26 12 Z M${hx + 138} ${hy - 6} l-34 6 l34 10 Z M${hx + 144} ${hy + 22} l-30 2 l26 12 Z`, C.ox, "none", 0);
  // eyes: huge, pupils blown wide (hunting)
  const catEye = (x, y, s) => {
    const k = uid("ce");
    return ell(x, y, 42, 36, C.ink) + `<clipPath id="${k}">${ell(x, y, 38, 32, "#000")}</clipPath><g clip-path="url(#${k})">` +
      ell(x, y, 38, 32, C.glint) + path(`M${x - 38} ${y + 18} Q${x} ${y + 40} ${x + 38} ${y + 18} L${x + 40} ${y + 40} L${x - 40} ${y + 40} Z`, C.gold, "none", 0, ` opacity="0.6"`) +
      ell(x + 4 * s, y + 2, 25, 29, C.ink) + circ(x - 8 * s + 4 * s, y - 10, 8, C.cream) + circ(x + 12 * s, y + 12, 3.5, C.cream) +
      path(`M${x - 44} ${y - 40} L${x - 44} ${y - (s < 0 ? 4 : 18)} L${x + 44} ${y - (s < 0 ? 18 : 4)} L${x + 44} ${y - 40} Z`, C.gold, "none", 0) + `</g>` +
      path(`M${x - 40} ${y - (s < 0 ? 4 : 18)} L${x + 40} ${y - (s < 0 ? 18 : 4)}`, "none", C.ink, 4);
  };
  body += catEye(hx - 58, hy - 16, 1) + catEye(hx + 58, hy - 16, -1);
  // muzzle, nose, blep
  body += ell(hx - 24, hy + 52, 32, 24, C.cream, C.ink, 3) + ell(hx + 24, hy + 52, 32, 24, C.cream, C.ink, 3);
  body += ell(hx, hy + 76, 22, 16, C.cream, C.ink, 3);
  body += path(`M${hx - 20} ${hy + 52} L${hx + 20} ${hy + 52} Q${hx + 20} ${hy + 60} ${hx} ${hy + 76}`, C.cream, "none", 0);
  body += path(`M${hx - 15} ${hy + 22} L${hx + 15} ${hy + 22} Q${hx + 14} ${hy + 34} ${hx} ${hy + 40} Q${hx - 14} ${hy + 34} ${hx - 15} ${hy + 22} Z`, C.oxb, C.ink, 3) + ell(hx - 5, hy + 26, 4, 2, C.cream);
  body += path(`M${hx} ${hy + 40} V${hy + 50} M${hx} ${hy + 50} Q${hx - 12} ${hy + 62} ${hx - 26} ${hy + 54} M${hx} ${hy + 50} Q${hx + 12} ${hy + 62} ${hx + 26} ${hy + 54}`, "none", C.ink, 3.2);
  body += path(`M${hx + 2} ${hy + 58} q2 16 12 14 q8 -2 4 -16 Z`, C.oxb, C.ink, 2.6);
  // whisker dots + whiskers
  for (const [dx, dy] of [[-34, 46], [-42, 56], [-30, 60], [34, 46], [42, 56], [30, 60]]) body += circ(hx + dx, hy + dy, 1.8, C.ink);
  body += path(`M${hx - 48} ${hy + 46} Q${hx - 120} ${hy + 20} ${hx - 196} ${hy + 30} M${hx - 50} ${hy + 56} Q${hx - 120} ${hy + 52} ${hx - 192} ${hy + 72} M${hx - 46} ${hy + 64} Q${hx - 110} ${hy + 76} ${hx - 164} ${hy + 110}` +
    ` M${hx + 48} ${hy + 46} Q${hx + 120} ${hy + 20} ${hx + 196} ${hy + 30} M${hx + 50} ${hy + 56} Q${hx + 120} ${hy + 52} ${hx + 192} ${hy + 72} M${hx + 46} ${hy + 64} Q${hx + 110} ${hy + 76} ${hx + 164} ${hy + 110}`, "none", C.ink, 2.2);
  body += furTicks([[hx - 138, hy + 10], [hx - 140, hy - 50], [hx - 100, hy - 94]], 7, 14, 1, C.ink, 2, 2);
  // raised paw, claws out, over the little spider
  body += `<g clip-path="${v.clip}">` + path("M470 330 Q440 260 380 214 L430 190 Q480 230 500 300 Z", C.gold, C.ink, 3.5) + path("M446 250 l24 -18 M460 284 l22 -16", "none", C.ox, 6) + `</g>`;
  body += ell(396, 186, 48, 40, C.gold, C.ink, 4);
  body += ell(396, 196, 22, 16, C.oxb, C.ink, 2.6);
  for (const [x, y] of [[364, 170], [386, 158], [410, 158], [430, 172]]) body += ell(x, y, 9, 8, C.oxb, C.ink, 2.4);
  for (const [x, y, a] of [[360, 222, 24], [384, 230, 8], [410, 230, -6], [432, 218, -22]]) body += `<path d="M${x - 5} ${y - 4} Q${x} ${y + 24} ${x + 3} ${y + 32} Q${x + 5} ${y + 12} ${x + 7} ${y - 4} Z" transform="rotate(${a} ${x} ${y})" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
  body += path("M332 150 q-10 -12 -4 -26 M440 130 q12 -8 10 -24", "none", C.ink, 3);
  // the tiny heister, very still
  body += shadow(398, 354, 30, 4, C.ink, 0.2);
  body += mini(398, 336, 0.32, { look: [0, -1] });
  body += drop(434, 296, 0.8) + drop(364, 300, 0.6);
  save("creature-cat", VB, "The Cat: a looming ginger tabby with huge hunting pupils, paw raised and claws out over a tiny frozen spider", body);
}

// ---------------- dog ----------------
{
  setPrefix("cr-dog");
  const v = oval();
  let body = v.bg + `<g clip-path="${v.clip}">`;
  body += path("M0 318 H480 V400 H0 Z", C.edge, "none", 0) + line([0, 318], [480, 318], C.ink, 3);
  // rug stripe
  body += path("M40 352 H440", "none", C.ox, 8) + path("M40 366 H440", "none", C.gold, 4);
  // back and wagging tail
  body += path("M404 250 Q380 170 400 120", "none", C.edge, 14, ` opacity="0.8"`) + path("M404 250 Q440 170 470 150", "none", C.edge, 14, ` opacity="0.8"`);
  body += path("M404 250 Q404 170 436 118", "none", C.ink, 22) + path("M404 250 Q404 170 436 118", "none", C.cream, 15) + path("M430 132 Q434 124 436 118", "none", C.gold, 15);
  body += path("M290 330 Q300 236 380 232 Q444 232 452 330 Z", C.cream, C.ink, 3.5) + ell(392, 272, 30, 18, C.gold, C.ink, 0, ` opacity="0.55"`) + furTicks([[300, 280], [330, 244], [380, 234], [430, 240]], 6, 14, 1, C.ink, 2, 4);
  body += path("M384 110 q-18 12 -20 34 M452 108 q18 6 26 26 M410 82 q16 -4 30 6", "none", C.ink, 3.2);
  body += `</g>` + v.ring;
  const hx = 222, hy = 176;
  // floppy ears behind head
  body += path(`M${hx - 96} ${hy - 76} Q${hx - 160} ${hy - 60} ${hx - 150} ${hy + 40} Q${hx - 140} ${hy + 90} ${hx - 100} ${hy + 60} Q${hx - 88} ${hy} ${hx - 70} ${hy - 60} Z`, C.gold, C.ink, 4);
  body += path(`M${hx + 96} ${hy - 76} Q${hx + 160} ${hy - 60} ${hx + 150} ${hy + 40} Q${hx + 140} ${hy + 90} ${hx + 100} ${hy + 60} Q${hx + 88} ${hy} ${hx + 70} ${hy - 60} Z`, C.gold, C.ink, 4);
  body += path(`M${hx - 132} ${hy - 20} q6 20 2 40 M${hx + 132} ${hy - 20} q-6 20 -2 40`, "none", C.ox, 3);
  // head
  body += path(`M${hx - 108} ${hy + 10} Q${hx - 118} ${hy - 108} ${hx} ${hy - 112} Q${hx + 118} ${hy - 108} ${hx + 108} ${hy + 10} Q${hx + 104} ${hy + 90} ${hx} ${hy + 98} Q${hx - 104} ${hy + 90} ${hx - 108} ${hy + 10} Z`, C.cream, C.ink, 4);
  body += path(`M${hx - 80} ${hy - 80} Q${hx - 30} ${hy - 106} ${hx + 20} ${hy - 100}`, "none", C.parch, 6);
  body += path(`M${hx + 70} ${hy + 60} Q${hx + 96} ${hy + 30} ${hx + 100} ${hy - 10}`, "none", C.edge, 8);
  // brows raised in delight
  body += path(`M${hx - 70} ${hy - 62} q20 -18 42 -4 M${hx + 70} ${hy - 62} q-20 -18 -42 -4`, "none", C.gold, 8);
  // cross-eyed at the spider on its nose
  const dEye = (x, y, lx) => ell(x, y, 22, 24, C.cream, C.ink, 3.5) + circ(x + lx, y + 2, 13, C.ink) + circ(x + lx - 4, y - 3, 4.5, C.cream) + circ(x + lx + 4, y + 6, 1.8, C.cream);
  body += dEye(hx - 46, hy - 30, 9) + dEye(hx + 46, hy - 30, -9);
  // collar + tag
  body += path(`M${hx - 96} ${hy + 76} Q${hx} ${hy + 126} ${hx + 96} ${hy + 76}`, "none", C.ink, 16) + path(`M${hx - 96} ${hy + 76} Q${hx} ${hy + 126} ${hx + 96} ${hy + 76}`, "none", C.ox, 10);
  body += circ(hx - 62, hy + 108, 12, C.gold, C.ink, 3) + circ(hx - 62, hy + 108, 5, C.glint);
  // snout, mouth, huge tongue
  body += path(`M${hx - 70} ${hy + 40} Q${hx - 60} ${hy + 110} ${hx} ${hy + 112} Q${hx + 60} ${hy + 110} ${hx + 70} ${hy + 40} Q${hx} ${hy + 62} ${hx - 70} ${hy + 40} Z`, C.deep, C.ink, 3.5);
  body += path(`M${hx - 30} ${hy + 76} Q${hx - 40} ${hy + 170} ${hx + 6} ${hy + 180} Q${hx + 46} ${hy + 176} ${hx + 36} ${hy + 76} Z`, C.oxb, C.ink, 3.5);
  body += path(`M${hx + 3} ${hy + 90} Q${hx + 6} ${hy + 130} ${hx + 4} ${hy + 160}`, "none", C.ox, 3);
  body += ell(hx - 14, hy + 110, 6, 14, C.cream, C.ink, 0, ` opacity="0.35"`);
  body += ell(hx, hy + 22, 70, 42, C.parch, C.ink, 3.5);
  body += path(`M${hx} ${hy + 30} V${hy + 58} M${hx} ${hy + 58} Q${hx - 30} ${hy + 72} ${hx - 60} ${hy + 50} M${hx} ${hy + 58} Q${hx + 30} ${hy + 72} ${hx + 60} ${hy + 50}`, "none", C.ink, 3.5);
  for (const [dx, dy] of [[-36, 36], [-46, 28], [-28, 46], [36, 36], [46, 28], [28, 46]]) body += circ(hx + dx, hy + dy, 2, C.gold);
  body += ell(hx, hy + 12, 32, 20, C.ink) + ell(hx - 10, hy + 5, 9, 5, C.soft) + path(`M${hx - 8} ${hy + 22} q8 6 16 0`, "none", C.deep, 2);
  // drool
  body += path(`M${hx + 40} ${hy + 180} q-8 14 0 22 q8 -8 0 -22 Z`, C.cream, C.ink, 2);
  // big friendly paws
  for (const x of [120, 330]) body += ell(x, 352, 48, 26, C.cream, C.ink, 3.5) + path(`M${x - 18} 352 v18 M${x} 354 v18 M${x + 18} 352 v18`, "none", C.ink, 2.6);
  // spider clinging to the nose
  body += mini(hx, hy - 4, 0.3, { lid: "worry", mouth: "wobble", look: [0, 0] });
  body += drop(hx + 40, hy - 26, 0.7);
  body += star(84, 90, 9) + star(372, 70, 7);
  save("creature-dog", VB, "The Dog: a huge, delighted pup going cross-eyed at a spider clinging to its nose, tongue lolling, tail a blur", body);
}

// ---------------- vacuum ----------------
{
  setPrefix("cr-vac");
  const v = oval();
  let body = v.bg + `<g clip-path="${v.clip}">`;
  // floor (upper) + stair drop (lower)
  body += path("M0 0 H480 V262 H0 Z", C.parch, "none", 0);
  body += strokes([[0, 90, 480, 70], [0, 160, 480, 140], [0, 230, 480, 210], [180, 83, 170, 153], [360, 76, 352, 146], [90, 157, 84, 226], [290, 148, 282, 218]], C.edge, 3);
  // the route it has been mowing: dotted zigzag trail
  body += path("M40 90 L420 60 L60 130 L400 110 L150 170", "none", C.gold, 3, ` stroke-dasharray="2 9"`);
  body += path("M0 262 L480 242 L480 262 L0 282 Z", C.gold, C.ink, 3);
  body += path("M0 282 L480 262 L480 400 L0 400 Z", C.deep, "none", 0);
  body += strokes([[0, 330, 480, 310], [0, 380, 480, 360]], C.plum, 3);
  body += `</g>`;
  // vacuum body (3/4 disc)
  const cx = 250, cy = 172, rx = 150, ry = 58, h = 36;
  body += ell(cx + 6, cy + h + 16, rx - 6, ry * 0.5, C.ink, C.ink, 0, ` opacity="0.25"`);
  body += path(`M${cx - rx} ${cy} V${cy + h} A${rx} ${ry} 0 0 0 ${cx + rx} ${cy + h} V${cy} Z`, C.ink, C.ink, 3);
  body += path(`M${cx - rx + 10} ${cy + h * 0.5} A${rx - 10} ${ry} 0 0 0 ${cx + rx - 10} ${cy + h * 0.5}`, "none", C.gold, 5);
  body += ell(cx, cy, rx, ry, C.deep, C.ink, 3.5);
  body += ell(cx, cy - 4, rx - 22, ry - 12, C.plum, C.ink, 2.5);
  body += ell(cx - 30, cy - 18, 60, 12, C.soft, C.ink, 0, ` opacity="0.8"`);
  // top button + lidar turret
  body += ell(cx + 40, cy - 14, 26, 12, C.ink, C.ink, 0) + ell(cx + 40, cy - 18, 26, 12, C.deep, C.ink, 2.5) + circ(cx + 40, cy - 19, 4, C.glint);
  body += ell(cx - 50, cy + 6, 14, 6, C.glint, C.ink, 2) ;
  // the glaring sensor eye on the bumper
  body += path(`M${cx - 44} ${cy + 64} Q${cx} ${cy + 72} ${cx + 44} ${cy + 64} L${cx + 40} ${cy + 78} Q${cx} ${cy + 86} ${cx - 40} ${cy + 78} Z`, C.ox, C.ink, 3);
  body += path(`M${cx - 26} ${cy + 70} Q${cx} ${cy + 76} ${cx + 26} ${cy + 70}`, "none", C.oxb, 6) + path(`M${cx - 8} ${cy + 73} h16`, "none", C.glint, 4);
  body += path(`M${cx - 70} ${cy + 96} l-12 12 M${cx} ${cy + 104} v16 M${cx + 70} ${cy + 96} l12 12`, "none", C.oxb, 4);
  // spinning side brush at the front left
  const bx = cx - 118, by = cy + 64;
  for (const a of [0, 120, 240]) body += `<path d="M${bx} ${by} l34 -6" transform="rotate(${a} ${bx} ${by}) scale(1 1)" stroke="${C.ink}" stroke-width="3.5" stroke-linecap="round"/>`;
  body += ell(bx, by, 9, 5, C.gold, C.ink, 2);
  body += path(`M${bx - 44} ${by - 14} A46 18 0 0 0 ${bx + 20} ${by + 20}`, "none", C.ink, 2.5, ` stroke-dasharray="6 6"`);
  // crumbs being hoovered
  for (const [x, y] of [[140, 232], [160, 244], [108, 226], [330, 238], [352, 228]]) body += path(`M${x} ${y} l6 -3 l3 5 l-6 3 Z`, C.gold, C.ink, 1.6);
  // motion lines behind
  body += strokes([[404, 96, 440, 86], [414, 124, 452, 116], [386, 72, 414, 62]], C.ink, 3.5);
  body += v.ring;
  // our spider, safe on a silk line just over the stair lip
  body += path("M330 252 V312", "none", C.gold, 2.4) + circ(330, 252, 3, C.gold, C.ink, 1.5);
  body += mini(330, 334, 0.28, { lid: "sly", mouth: "grin", look: [-0.4, -0.8] });
  body += star(372, 300, 6) + star(288, 318, 4);
  save("creature-vacuum", VB, "The Vacuum: a relentless robot vacuum halted at a stair edge, sensor glaring, while a spider dangles safely below", body);
}

// ---------------- child ----------------
{
  setPrefix("cr-kid");
  const v = oval();
  let body = v.bg + `<g clip-path="${v.clip}">`;
  // the enormous face filling the left side
  body += circ(40, 170, 250, C.parch, C.ink, 4);
  body += path("M-40 20 Q60 -30 180 10 Q140 30 120 60 Q60 40 -40 60 Z", C.gold, C.ink, 3.5);
  body += path("M60 28 q30 -6 60 4 M10 40 q30 -8 60 0", "none", C.glint, 3);
  // eyebrow raised
  body += path("M40 88 Q130 42 214 86", "none", C.gold, 12) + path("M40 88 Q130 42 214 86", "none", C.ink, 2, ` opacity="0.3"`);
  // giant delighted eye
  const ex = 128, ey = 150, k = uid("eye");
  body += path(`M${ex - 100} ${ey} Q${ex} ${ey - 88} ${ex + 100} ${ey} Q${ex} ${ey + 70} ${ex - 100} ${ey} Z`, C.cream, C.ink, 4);
  body += `<clipPath id="${k}"><path d="M${ex - 100} ${ey} Q${ex} ${ey - 88} ${ex + 100} ${ey} Q${ex} ${ey + 70} ${ex - 100} ${ey} Z"/></clipPath><g clip-path="url(#${k})">`;
  body += circ(ex + 22, ey - 2, 46, C.good, C.ink, 3) + circ(ex + 22, ey - 2, 30, C.ink);
  let rays = ""; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; rays += `M${r1(ex + 22 + Math.cos(a) * 32)} ${r1(ey - 2 + Math.sin(a) * 32)} L${r1(ex + 22 + Math.cos(a) * 44)} ${r1(ey - 2 + Math.sin(a) * 44)}`; }
  body += path(rays, "none", C.ink, 1.6, ` opacity="0.5"`);
  body += circ(ex + 8, ey - 16, 12, C.cream) + circ(ex + 38, ey + 12, 5, C.cream) + star(ex + 36, ey - 18, 5, C.glint, 1.2);
  body += path(`M${ex - 100} ${ey} Q${ex} ${ey - 88} ${ex + 100} ${ey} L${ex + 110} ${ey - 70} L${ex - 110} ${ey - 70} Z`, C.parch, "none", 0, ` opacity="0"`);
  body += `</g>`;
  body += path(`M${ex - 100} ${ey} Q${ex} ${ey - 88} ${ex + 100} ${ey}`, "none", C.ink, 6);
  body += path(`M${ex - 70} ${ey - 34} l-10 -18 M${ex - 40} ${ey - 48} l-4 -20 M${ex - 6} ${ey - 54} l2 -20 M${ex + 30} ${ey - 50} l8 -18 M${ex + 64} ${ey - 36} l12 -14`, "none", C.ink, 4);
  // blushing freckled cheek and a gap-toothed grin at the edge
  body += ell(120, 256, 56, 26, C.oxb, C.ink, 0, ` opacity="0.35"`);
  for (const [x, y] of [[96, 248], [112, 258], [130, 246], [146, 260], [104, 268]]) body += circ(x, y, 2.6, C.gold);
  body += path("M140 306 Q196 318 244 272 Q252 318 212 342 Q170 356 140 306 Z", C.deep, C.ink, 3.5) + path("M162 316 Q196 322 232 296 L236 306 Q200 332 166 326 Z", C.cream, C.ink, 2) + path("M180 342 Q204 330 226 334 Q210 348 188 346 Z", C.oxb, C.ink, 2);
  body += `</g>` + v.ring;
  // the jar
  const jx = 340, jy = 226, jk = uid("jar");
  const jar = `M${jx - 70} ${jy - 80} Q${jx - 82} ${jy - 70} ${jx - 82} ${jy - 50} V${jy + 104} Q${jx - 82} ${jy + 126} ${jx - 60} ${jy + 126} H${jx + 60} Q${jx + 82} ${jy + 126} ${jx + 82} ${jy + 104} V${jy - 50} Q${jx + 82} ${jy - 70} ${jx + 70} ${jy - 80} Z`;
  body += `<clipPath id="${jk}"><path d="${jar}"/></clipPath>`;
  body += path(jar, C.cream, C.ink, 0, ` opacity="0.8"`);
  body += `<g clip-path="url(#${jk})">`;
  body += path(`M${jx - 90} ${jy + 96} H${jx + 90} V${jy + 140} H${jx - 90} Z`, C.edge, "none", 0) + path(`M${jx - 60} ${jy + 96} q20 -14 40 -2 q18 -12 40 0`, "none", C.good, 4);
  body += mini(jx + 4, jy - 8, 0.4, { lid: "glare", mouth: "flat", look: [-1, -0.2] });
  body += `</g>`;
  body += path(jar, "none", C.ink, 4);
  body += path(`M${jx - 64} ${jy - 40} V${jy + 80} M${jx - 50} ${jy - 50} V${jy - 10}`, "none", C.cream, 6);
  body += path(`M${jx + 60} ${jy - 30} V${jy + 30}`, "none", C.cream, 3.5);
  // lid with air holes
  body += path(`M${jx - 76} ${jy - 86} H${jx + 76} V${jy - 106} H${jx - 76} Z`, C.gold, C.ink, 3.5) + ell(jx, jy - 106, 76, 14, C.glint, C.ink, 3.5);
  for (const [x, y] of [[-40, -106], [-14, -110], [12, -104], [38, -109], [-26, -100], [26, -100], [52, -104], [-54, -104]]) body += circ(jx + x, jy + y, 3, C.ink);
  body += path(`M${jx - 70} ${jy - 92} V${jy - 100} M${jx - 50} ${jy - 90} V${jy - 100} M${jx - 30} ${jy - 88} V${jy - 98} M${jx + 30} ${jy - 88} V${jy - 98} M${jx + 50} ${jy - 90} V${jy - 100} M${jx + 70} ${jy - 92} V${jy - 100}`, "none", C.ink, 2);
  // the grabby hand wrapped around the jar
  body += path(`M${jx - 120} 400 Q${jx - 130} ${jy + 80} ${jx - 84} ${jy + 50} L${jx - 70} ${jy + 90} Q${jx - 90} ${jy + 120} ${jx - 60} 400 Z`, C.parch, C.ink, 4);
  for (let i = 0; i < 4; i++) {
    const y = jy + 42 + i * 24;
    body += path(`M${jx - 86} ${y} Q${jx - 40} ${y - 10} ${jx + 26 - i * 8} ${y + 2} Q${jx + 40 - i * 8} ${y + 14} ${jx + 24 - i * 8} ${y + 24} Q${jx - 40} ${y + 26} ${jx - 86} ${y + 22} Z`, C.parch, C.ink, 3.5);
    body += path(`M${jx + 8 - i * 8} ${y + 6} q8 2 8 10`, "none", C.edge, 3);
  }
  body += path(`M${jx - 110} ${jy + 150} q20 -8 36 0`, "none", C.edge, 4);
  body += star(430, 90, 9) + star(456, 128, 5) + star(250, 60, 6);
  save("creature-child", VB, "The Child: a giant delighted eye and a grabby hand clutching a jar with air holes, one grumpy spider inside", body);
}

// ---------------- guard spider ----------------
{
  setPrefix("cr-guard");
  const v = oval();
  const g = uid("beam");
  let body = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.glint}" stop-opacity="0.95"/><stop offset="1" stop-color="${C.glint}" stop-opacity="0.35"/></linearGradient></defs>`;
  body += v.bg + `<g clip-path="${v.clip}">`;
  // night-time hallway
  body += path("M0 0 H480 V400 H0 Z", C.plum, "none", 0);
  body += path("M0 0 H480 V260 H0 Z", C.deep, "none", 0);
  body += path("M0 260 H480", "none", C.ink, 3) + strokes([[0, 300, 480, 300], [0, 350, 480, 350]], C.deep, 3);
  body += path("M60 40 H130 V200 H60 Z", C.plum, C.ink, 3) + circ(118, 124, 4, C.gold);
  // torch beam across the floor, catching a sneaking crew member
  body += path("M292 196 L480 176 L480 400 L318 400 Z", `url(#${g})`, "none", 0);
  body += ell(404, 332, 62, 22, C.glint, C.ink, 0, ` opacity="0.7"`);
  body += `</g>` + v.ring;
  body += shadow(402, 338, 26, 4, C.ink, 0.25);
  body += mini(402, 320, 0.3, { lid: "worry", mouth: "o", look: [-0.8, -0.2] });
  body += drop(436, 276, 0.7);
  // the guard: ox-red spider with cap, badge, torch and moustache
  const R = [[[26, 10], [58, -2], [84, -30], [96, -44]], STAND_R[1], STAND_R[2], STAND_R[3]];
  const L = [[[-26, 10], [-62, -24], [-80, -64], [-78, -104]], ...mirror(STAND_R).slice(1)];
  const cap = path("M-44 -28 Q-46 -70 0 -74 Q46 -70 44 -28 Z", C.deep, C.ink, 3.5) + path("M-48 -28 Q0 -44 48 -28 Q48 -16 0 -22 Q-48 -16 -48 -28 Z", C.ink, C.ink, 2) +
    path("M-38 -34 Q0 -42 38 -34", "none", C.gold, 3.5) + path("M0 -66 l7 12 l-7 10 l-7 -10 Z", C.glint, C.ink, 2.4) + path("M-30 -60 Q0 -70 30 -60", "none", C.soft, 2.5);
  const tache = path("M0 24 Q-10 16 -22 22 Q-32 26 -34 18 Q-30 34 -16 32 Q-6 30 0 26 Q6 30 16 32 Q30 34 34 18 Q32 26 22 22 Q10 16 0 24 Z", C.ink, C.ink, 2);
  const badge = path("M26 20 L40 16 L42 30 Q40 40 32 44 Q22 38 22 30 Z", C.gold, C.ink, 2.4) + circ(32, 28, 3.5, C.glint);
  const torch = `<g transform="rotate(20 96 -44)">` + path("M60 -54 H100 V-34 H60 Z", C.edge, C.ink, 3) + path("M100 -58 H116 V-30 H100 Z", C.edge, C.ink, 3) + ell(116, -44, 4, 14, C.glint, C.ink, 2) + path("M70 -54 V-34 M80 -54 V-34", "none", C.ink, 2) + `</g>`;
  body += spider({
    x: 180, y: 232, s: 0.98,
    col: C.ox, shade: C.deep, hi: C.oxb,
    ceph: { rx: 46, ry: 40 },
    abd: { dx: 0, dy: -66, rx: 52, ry: 46, pattern: path("M-20 -84 L0 -104 L20 -84 L0 -64 Z", C.deep, C.ink, 2) + path("M-36 -52 Q0 -36 36 -52", "none", C.oxb, 4) },
    legs: [...R, ...L], legW: 8, band: C.deep, dash: "3 12",
    fy: -4,
    faceO: { er: 15, esp: 19, lid: "glare", lidCol: C.ox, small: "std", mouth: "none", look: [1, 0.3] },
    over: tache + badge + cap + torch,
  });
  save("creature-guard-spider", VB, "The Guard Spider: a stern ox-red rival in a peaked cap with a badge and moustache, torch beam sweeping the floor", body);
}
