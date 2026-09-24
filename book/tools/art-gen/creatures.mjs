import { C, setPrefix, save, spider, oval, shadow, circ, ell, path, line, strokes, mirror, STAND_R, star, rng, r1, uid, pt, poly, furTicks, hairRing, face, toWorld, planted, arch, leg } from "./lib.mjs";

const VB = "0 0 480 400";
const mini = (x, y, s, faceO = {}, extra = {}) => spider({
  x, y, s,
  ceph: { rx: 44, ry: 38 }, abd: { dx: 0, dy: -62, rx: 50, ry: 44 },
  legs: [...STAND_R, ...mirror(STAND_R)], legW: 8, band: C.deep, dash: "3 12",
  fy: -2, ...extra,
  faceO: { er: 17, esp: 20, lid: "worry", small: "std", mouth: "o", ...faceO },
});
// A spider hanging head-down on a vertical silk line from (x, ay) to the abdomen tip; body centre at (x, y).
const hang = (x, ay, y, s, faceO = {}, extra = {}) =>
  path(`M${x} ${ay} V${r1(y - 106 * s + 2)}`, "none", C.gold, 2.4) + circ(x, ay, 3, C.gold, C.ink, 1.5) + mini(x, y, s, faceO, extra);
const drop = (x, y, s = 1) => path(`M${x} ${y} q${-7 * s} ${11 * s} 0 ${16 * s} q${7 * s} ${-5 * s} 0 ${-16 * s} Z`, C.cream, C.ink, 2);

// ---------------- cat ----------------
{
  setPrefix("cr-cat");
  const v = oval();
  let body = v.bg + `<g clip-path="${v.clip}">`;
  // floorboards
  body += path("M0 300 H480 V400 H0 Z", C.edge, "none", 0) + line([0, 300], [480, 300], C.ink, 3) + strokes([[0, 340, 480, 340], [120, 300, 110, 340], [330, 340, 320, 400], [70, 340, 64, 400]], C.gold, 2);
  // crouched body and chest behind the head
  // the raised left foreleg rises from the shoulder (hidden behind the head) out of the body's right flank
  body += path("M292 330 Q300 250 330 214 L372 172 L408 194 L366 236 Q334 272 318 330 Z", C.gold, C.ink, 3.5) + path("M340 224 l20 -16 M334 256 l16 -12", "none", C.ox, 6);
  body += path("M40 400 Q30 250 120 230 L300 230 Q330 250 326 400 Z", C.gold, C.ink, 3.5);
  body += path("M150 250 Q210 330 270 250 L270 400 L150 400 Z", C.cream, C.ink, 3);
  body += path("M64 300 q30 -8 44 10 M60 340 q34 -8 50 12 M318 300 q-26 -8 -40 10 M320 344 q-30 -8 -44 12", "none", C.ox, 7);

  // planted front paw
  // near foreleg, straight down in front of the chest and out of the bottom of the frame to its paw on the floor
  // (its top runs up under the head, which is drawn later and hides the shoulder, so the leg has no
  // flat cut-off top edge floating on the chest)
  body += path("M110 222 Q102 320 106 404 L180 404 Q184 320 174 222 Z", C.gold, C.ink, 3.5) + path("M118 330 q24 -6 50 6", "none", C.ox, 6);
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
  // raised paw, claws out, poised above the little spider
  body += `<g transform="translate(-12 -10)">`;
  body += ell(396, 186, 48, 40, C.gold, C.ink, 4);
  body += ell(396, 196, 22, 16, C.oxb, C.ink, 2.6);
  // the paw is raised palm-out with the toes on top, so the unsheathed claws come out of the toe tips, curving up
  for (const [x, y, a] of [[360, 164, -24], [384, 152, -8], [410, 152, 6], [432, 166, 22]]) body += `<path d="M${x - 5} ${y} Q${x - 2} ${y - 20} ${x + 5} ${y - 28} Q${x + 3} ${y - 12} ${x + 6} ${y} Z" transform="rotate(${a} ${x} ${y + 6})" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
  for (const [x, y] of [[364, 170], [386, 158], [410, 158], [430, 172]]) body += ell(x, y, 9, 8, C.oxb, C.ink, 2.4);
  body += `</g>`;
  // the tiny heister, very still on the floorboards, right under the paw
  body += mini(362, 320, 0.2, { look: [0, -1] }, { feetShadow: { rx: 10, ry: 3.5, op: 0.25 } });
  // nervous sweat beading on the carapace edge
  body += drop(352, 313, 0.4) + drop(372, 312, 0.36);
  save("creature-cat", VB, "The Cat: a looming ginger tabby with huge hunting pupils, paw raised and claws out over a tiny frozen spider", body);
}

// ---------------- dog ----------------
{
  setPrefix("cr-dog");
  const v = oval();
  let body = v.bg + `<g clip-path="${v.clip}">`;
  body += path("M0 318 H480 V400 H0 Z", C.edge, "none", 0) + line([0, 318], [480, 318], C.ink, 3);
  // rug stripe
  body += path("M40 352 H440", "none", C.plum, 8) + path("M40 366 H440", "none", C.gold, 4);
  // back and wagging tail
  body += path("M404 250 Q380 170 400 120", "none", C.edge, 14, ` opacity="0.8"`) + path("M404 250 Q440 170 470 150", "none", C.edge, 14, ` opacity="0.8"`);
  body += path("M404 250 Q404 170 436 118", "none", C.ink, 22) + path("M404 250 Q404 170 436 118", "none", C.cream, 15) + path("M430 132 Q434 124 436 118", "none", C.gold, 15);
  body += path("M290 330 Q300 236 380 232 Q444 232 452 330 Z", C.cream, C.ink, 3.5) + ell(392, 272, 30, 18, C.gold, C.ink, 0, ` opacity="0.55"`) + furTicks([[300, 280], [330, 244], [380, 234], [430, 240]], 6, 14, 1, C.ink, 2, 4);
  body += path("M384 110 q-18 12 -20 34 M452 108 q18 6 26 26 M410 82 q16 -4 30 6", "none", C.ink, 3.2);
  body += `</g>` + v.ring;
  const hx = 222, hy = 176;
  // chest and forelegs, behind the head: two sturdy legs come down to the paws on the floor
  body += path(`M${hx - 84} 250 Q${hx} 236 ${hx + 84} 250 L${hx + 72} 330 L${hx - 72} 330 Z`, C.parch, C.ink, 3.5);
  for (const x of [150, 294]) body += path(`M${x - 30} 240 Q${x - 34} 290 ${x - 30} 334 L${x + 30} 334 Q${x + 34} 290 ${x + 30} 240 Z`, C.cream, C.ink, 3.5);
  body += furTicks([[hx - 60, 262], [hx - 40, 300]], 6, 14, 1, C.ink, 2, 9) + furTicks([[hx + 60, 262], [hx + 40, 300]], 6, 14, -1, C.ink, 2, 10);
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
  // drool: a strand hanging straight down from the corner of the lip, a drop gathering at its end
  // (the strand starts inside the lower lip's outline at x=hx+50, where the lip edge is at y~hy+89,
  // so it hangs from the mouth rather than from the collar below it)
  body += path(`M${hx + 50} ${hy + 88} Q${hx + 47} ${hy + 114} ${hx + 50} ${hy + 138}`, "none", C.ink, 5) + path(`M${hx + 50} ${hy + 88} Q${hx + 47} ${hy + 114} ${hx + 50} ${hy + 138}`, "none", C.cream, 2.4);
  body += drop(hx + 50, hy + 132, 0.8);
  // big friendly paws
  for (const x of [150, 294]) body += shadow(x + 4, 356, 46, 7, C.ink, 0.3) + ell(x, 340, 42, 20, C.cream, C.ink, 3.5) + path(`M${x - 16} 342 v15 M${x} 344 v15 M${x + 16} 342 v15`, "none", C.ink, 2.6);
  // spider clinging to the nose: body on the nose leather, all eight feet on the muzzle (below the eyes)
  body += mini(hx, hy + 6, 0.26, { lid: "worry", mouth: "wobble", look: [0, 0] }, { rim: { col: C.cream, w: 1.6 } });
  body += drop(hx + 12, hy - 4, 0.4);
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
  body += path("M40 90 L420 60 L60 130 L400 110 L150 170", "none", C.soft, 3, ` stroke-dasharray="2 9" opacity="0.55"`);
  body += path("M0 262 L480 242 L480 262 L0 282 Z", C.gold, C.ink, 3);
  body += path("M0 282 L480 262 L480 400 L0 400 Z", C.deep, "none", 0);
  body += strokes([[0, 330, 480, 310], [0, 380, 480, 360]], C.plum, 3);
  body += `</g>`;
  // vacuum body (3/4 disc)
  const cx = 250, cy = 172, rx = 150, ry = 58, h = 36;
  body += ell(cx + 6, cy + h + 16, rx - 6, ry * 0.5, C.ink, C.ink, 0, ` opacity="0.25"`);
  // spinning side brush under the front-left of the rim: it turns flat on the floor, so its three
  // bristle tufts and the blur of their sweep are foreshortened into the floor plane
  const bx = cx - 116, by = cy + h + 34;
  body += ell(bx, by + 3, 46, 12, C.ink, C.ink, 0, ` opacity="0.18"`);
  body += path(`M${bx - 48} ${by - 4} A48 15 0 0 0 ${bx + 30} ${by + 12}`, "none", C.ink, 2.5, ` stroke-dasharray="6 6"`);
  for (const a of [200, 320, 80]) { const e = [bx + Math.cos(a * Math.PI / 180) * 40, by + Math.sin(a * Math.PI / 180) * 12]; body += path(`M${bx} ${by} L${r1(e[0])} ${r1(e[1])}`, "none", C.ink, 3.5) + path(`M${r1(e[0])} ${r1(e[1])} l${a > 90 && a < 270 ? -5 : 5} -2 M${r1(e[0])} ${r1(e[1])} l${a > 90 && a < 270 ? -5 : 5} 2`, "none", C.ink, 2); }
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
  // crumbs being hoovered
  // crumbs lying on the floor ahead of the brush and beside the machine (flat on the floor)
  for (const [x, y] of [[62, 240], [80, 248], [52, 226], [424, 214], [440, 204]]) body += shadow(x + 3, y + 3, 5, 1.6, C.ink, 0.3) + path(`M${x} ${y} l7 -2 l3 4 l-7 3 Z`, C.gold, C.ink, 1.6);
  body += v.ring;
  // our spider, safe on a silk line anchored to the stair nosing (clear of the vacuum),
  // hanging head-down straight below it from the spinnerets at the abdomen tip
  body += hang(372, 254, 312, 0.22, { lid: "sly", mouth: "grin", look: [-0.4, -0.8] }, { rim: { col: C.cream, w: 1.8 } });
  save("creature-vacuum", VB, "The Vacuum: a relentless robot vacuum halted at a stair edge, sensor glaring, while a spider dangles safely below", body);
}

// ---------------- child ----------------
{
  setPrefix("cr-kid");
  const v = oval();
  let body = v.bg + `<g clip-path="${v.clip}">`;
  // the whole face, close up but entirely in frame: both eyes, nose and grin visible, gazing
  // at the jar held up beside it (only the ear and chin run out of the oval, clearly continuing)
  const fx = 150, fy = 214;
  body += path(`M${fx - 70} 400 L${fx - 60} ${fy + 120} L${fx + 60} ${fy + 120} L${fx + 70} 400 Z`, C.parch, C.ink, 3.5);   // neck
  body += ell(fx - 158, fy + 6, 26, 40, C.parch, C.ink, 3.5);                                                   // left ear
  body += ell(fx, fy, 160, 168, C.parch, C.ink, 4);                                                            // face
  // hair: a gold fringe over the forehead
  body += path(`M${fx - 164} ${fy - 20} Q${fx - 170} ${fy - 190} ${fx} ${fy - 186} Q${fx + 170} ${fy - 190} ${fx + 164} ${fy - 20} Q${fx + 150} ${fy - 96} ${fx + 96} ${fy - 104} L${fx + 80} ${fy - 80} L${fx + 58} ${fy - 106} L${fx + 30} ${fy - 82} L${fx + 6} ${fy - 110} L${fx - 22} ${fy - 84} L${fx - 50} ${fy - 108} L${fx - 76} ${fy - 82} L${fx - 104} ${fy - 104} Q${fx - 150} ${fy - 96} ${fx - 164} ${fy - 20} Z`, C.gold, C.ink, 3.5);
  body += path(`M${fx - 110} ${fy - 150} q50 -26 110 -22 M${fx - 130} ${fy - 118} q40 -30 90 -34`, "none", C.glint, 3);
  // two wide delighted eyes, both looking right at the jar
  const eye = (ex, ey) => {
    const k = uid("eye"), d = `M${ex - 44} ${ey} Q${ex} ${ey - 42} ${ex + 44} ${ey} Q${ex} ${ey + 34} ${ex - 44} ${ey} Z`;
    let e = path(d, C.cream, C.ink, 3.5) + `<clipPath id="${k}"><path d="${d}"/></clipPath><g clip-path="url(#${k})">`;
    e += circ(ex + 12, ey - 1, 22, C.good, C.ink, 2.5) + circ(ex + 12, ey - 1, 13, C.ink);
    e += circ(ex + 5, ey - 8, 6, C.cream) + circ(ex + 19, ey + 6, 2.6, C.cream) + `</g>`;
    e += path(`M${ex - 44} ${ey} Q${ex} ${ey - 42} ${ex + 44} ${ey}`, "none", C.ink, 5);
    e += path(`M${ex - 30} ${ey - 18} l-7 -11 M${ex - 12} ${ey - 24} l-3 -12 M${ex + 8} ${ey - 25} l1 -12 M${ex + 26} ${ey - 20} l5 -10`, "none", C.ink, 3);
    return e;
  };
  body += eye(fx - 58, fy - 20) + eye(fx + 62, fy - 20);
  // eyebrows raised in delight
  body += path(`M${fx - 104} ${fy - 72} Q${fx - 60} ${fy - 96} ${fx - 16} ${fy - 74} M${fx + 18} ${fy - 74} Q${fx + 64} ${fy - 98} ${fx + 108} ${fy - 70}`, "none", C.gold, 9) +
    path(`M${fx - 104} ${fy - 72} Q${fx - 60} ${fy - 96} ${fx - 16} ${fy - 74} M${fx + 18} ${fy - 74} Q${fx + 64} ${fy - 98} ${fx + 108} ${fy - 70}`, "none", C.ink, 2, ` opacity="0.3"`);
  // button nose
  body += path(`M${fx} ${fy + 14} q-14 22 2 30 q12 4 18 -6`, "none", C.ink, 3.5);
  // blushing freckled cheeks
  body += ell(fx - 100, fy + 46, 34, 18, C.oxb, C.ink, 0, ` opacity="0.35"`) + ell(fx + 104, fy + 46, 34, 18, C.oxb, C.ink, 0, ` opacity="0.35"`);
  for (const [x, y] of [[-116, 40], [-100, 50], [-84, 40], [88, 40], [104, 50], [120, 40]]) body += circ(fx + x, fy + y, 2.6, C.gold);
  // a wide gap-toothed grin
  body += path(`M${fx - 84} ${fy + 72} Q${fx} ${fy + 96} ${fx + 86} ${fy + 70} Q${fx + 80} ${fy + 134} ${fx} ${fy + 138} Q${fx - 78} ${fy + 134} ${fx - 84} ${fy + 72} Z`, C.deep, C.ink, 3.5);
  body += path(`M${fx - 78} ${fy + 80} Q${fx} ${fy + 100} ${fx + 80} ${fy + 78} L${fx + 76} ${fy + 94} Q${fx + 30} ${fy + 108} ${fx + 10} ${fy + 108} L${fx + 8} ${fy + 96} L${fx - 10} ${fy + 96} L${fx - 12} ${fy + 108} Q${fx - 44} ${fy + 106} ${fx - 76} ${fy + 94} Z`, C.cream, C.ink, 2);
  body += path(`M${fx - 44} ${fy + 128} Q${fx} ${fy + 112} ${fx + 46} ${fy + 126} Q${fx} ${fy + 140} ${fx - 44} ${fy + 128} Z`, C.oxb, C.ink, 2);
  body += `</g>` + v.ring;
  // the jar
  const jx = 340, jy = 226, jk = uid("jar");
  const jar = `M${jx - 70} ${jy - 80} Q${jx - 82} ${jy - 70} ${jx - 82} ${jy - 50} V${jy + 104} Q${jx - 82} ${jy + 126} ${jx - 60} ${jy + 126} H${jx + 60} Q${jx + 82} ${jy + 126} ${jx + 82} ${jy + 104} V${jy - 50} Q${jx + 82} ${jy - 70} ${jx + 70} ${jy - 80} Z`;
  body += `<clipPath id="${jk}"><path d="${jar}"/></clipPath>`;
  body += path(jar, C.cream, C.ink, 0, ` opacity="0.8"`);
  body += `<g clip-path="url(#${jk})">`;
  body += path(`M${jx - 90} ${jy + 96} H${jx + 90} V${jy + 140} H${jx - 90} Z`, C.edge, "none", 0) + path(`M${jx - 60} ${jy + 96} q20 -14 40 -2 q18 -12 40 0`, "none", C.good, 4);
  // the thumb wraps round the far side of the jar: its pad is seen dimly through the glass
  body += path(`M${jx - 90} ${jy + 22} Q${jx - 40} ${jy + 14} ${jx - 6} ${jy + 24} Q${jx + 8} ${jy + 34} ${jx - 6} ${jy + 46} Q${jx - 40} ${jy + 52} ${jx - 90} ${jy + 48} Z`, C.parch, C.ink, 3, ` opacity="0.55"`);
  // the grumpy prisoner hangs head-down on a silk line anchored under the lid
  body += hang(jx + 4, jy - 78, jy - 8, 0.4, { lid: "glare", mouth: "flat", look: [-1, -0.2] });
  body += `</g>`;
  body += path(jar, "none", C.ink, 4);
  body += path(`M${jx - 64} ${jy - 40} V${jy + 80} M${jx - 50} ${jy - 50} V${jy - 10}`, "none", C.cream, 6);
  body += path(`M${jx + 60} ${jy - 30} V${jy + 30}`, "none", C.cream, 3.5);
  // lid with air holes
  // the lid is screwed onto the neck: its band (y jy-79..jy-99) overlaps the jar's mouth (y jy-80),
  // so it sits on the jar instead of hovering a hair above it
  const ly = 7;
  body += path(`M${jx - 76} ${jy - 86 + ly} H${jx + 76} V${jy - 106 + ly} H${jx - 76} Z`, C.gold, C.ink, 3.5) + ell(jx, jy - 106 + ly, 76, 14, C.glint, C.ink, 3.5);
  for (const [x, y] of [[-40, -106], [-14, -110], [12, -104], [38, -109], [-26, -100], [26, -100], [52, -104], [-54, -104]]) body += circ(jx + x, jy + y + ly, 3, C.ink);
  body += path(`M${jx - 70} ${jy - 92 + ly} V${jy - 100 + ly} M${jx - 50} ${jy - 90 + ly} V${jy - 100 + ly} M${jx - 30} ${jy - 88 + ly} V${jy - 98 + ly} M${jx + 30} ${jy - 88 + ly} V${jy - 98 + ly} M${jx + 50} ${jy - 90 + ly} V${jy - 100 + ly} M${jx + 70} ${jy - 92 + ly} V${jy - 100 + ly}`, "none", C.ink, 2);
  // the grabby hand wrapped around the jar
  body += path(`M${jx - 120} 400 Q${jx - 130} ${jy + 80} ${jx - 84} ${jy + 50} L${jx - 70} ${jy + 90} Q${jx - 90} ${jy + 120} ${jx - 60} 400 Z`, C.parch, C.ink, 4);
  // base of the thumb, where it leaves the palm and turns round the jar's left side
  body += path(`M${jx - 96} ${jy + 60} Q${jx - 100} ${jy + 30} ${jx - 82} ${jy + 22} L${jx - 80} ${jy + 50} Z`, C.parch, C.ink, 3.5);
  // four fingers curl round the near side: index on top, middle longest, pinky shortest
  const ext = [18, 26, 16, 2];
  for (let i = 0; i < 4; i++) {
    const y = jy + 42 + i * 24, e = ext[i] - 26;
    body += path(`M${jx - 86} ${y} Q${jx - 40} ${y - 10} ${jx + 26 + e} ${y + 2} Q${jx + 40 + e} ${y + 14} ${jx + 24 + e} ${y + 24} Q${jx - 40} ${y + 26} ${jx - 86} ${y + 22} Z`, C.parch, C.ink, 3.5);
    body += path(`M${jx + 8 + e} ${y + 6} q8 2 8 10`, "none", C.edge, 3);
  }
  body += path(`M${jx - 110} ${jy + 150} q20 -8 36 0`, "none", C.edge, 4);
  body += star(430, 90, 9) + star(456, 128, 5) + star(250, 60, 6);
  save("creature-child", VB, "The Child: a delighted face, both eyes on a jar with air holes held up in a grabby hand, one grumpy spider inside", body);
}

// ---------------- guard spider ----------------
{
  setPrefix("cr-guard");
  const v = oval();
  const GT = { x: 180, y: 232, s: 0.98 };
  const crew = [362, 304]; // (its right-hand feet's shadows stay clear of the oval's ring)
  // the torch is gripped at (96,-44) in the guard's leg I and aimed straight at the crew member
  const piv = toWorld(GT, [96, -44]);
  const th = Math.atan2(crew[1] - piv[1], crew[0] - piv[0]) * 180 / Math.PI;
  const lens = toWorld(GT, [96 + 20 * Math.cos(th * Math.PI / 180), -44 + 20 * Math.sin(th * Math.PI / 180)]);
  // beam: starts at the lens (its width) and widens away from it along the torch axis
  const rad = d => d * Math.PI / 180, px = -Math.sin(rad(th)), py = Math.cos(rad(th));
  const P1 = [lens[0] + px * 7, lens[1] + py * 7], P2 = [lens[0] - px * 7, lens[1] - py * 7];
  const g = uid("beam");
  const far = [lens[0] + Math.cos(rad(th)) * 220, lens[1] + Math.sin(rad(th)) * 220];
  let body = `<defs><linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="${r1(lens[0])}" y1="${r1(lens[1])}" x2="${r1(far[0])}" y2="${r1(far[1])}"><stop offset="0" stop-color="${C.glint}" stop-opacity="0.9"/><stop offset="1" stop-color="${C.glint}" stop-opacity="0.3"/></linearGradient></defs>`;
  body += v.bg + `<g clip-path="${v.clip}">`;
  // night-time, at floor level: a skirting board towering behind (its top is out of frame), floorboards in front
  body += path("M0 0 H480 V210 H0 Z", C.deep, "none", 0);
  body += path("M0 34 H480", "none", C.ink, 3) + path("M0 40 H480", "none", C.plum, 3) + path("M0 196 H480", "none", C.plum, 4);
  body += path("M0 210 H480 V400 H0 Z", C.plum, "none", 0) + line([0, 210], [480, 210], C.ink, 3);
  body += strokes([[150, 210, 70, 400], [360, 210, 452, 400]], C.deep, 3) + strokes([[30, 262, 110, 262], [200, 300, 300, 300], [250, 370, 360, 370]], C.deep, 2);
  // torch beam, and the pool of light where it hits the floor around the crew member
  // the cone of light ends where it meets the floor: the lit pool (an ellipse on the floor plane)
  const pc = [crew[0] + 2, crew[1] + 12], prx = 70, pry = 24;
  const T1 = [pc[0] + prx * Math.cos(rad(-45)), pc[1] + pry * Math.sin(rad(-45))], T2 = [pc[0] + prx * Math.cos(rad(140)), pc[1] + pry * Math.sin(rad(140))];
  body += path(`M${pt(P1)} L${pt(P2)} L${pt(T1)} A${prx} ${pry} 0 1 1 ${pt(T2)} Z`, `url(#${g})`, "none", 0);
  body += ell(pc[0], pc[1], prx, pry, C.glint, C.ink, 0, ` opacity="0.7"`);
  body += `</g>` + v.ring;
  // the crew member's shadow falls away from the torch (down and to the right)
  body += shadow(crew[0] + 12, crew[1] + 22, 30, 5, C.ink, 0.3);
  body += mini(crew[0], crew[1], 0.3, { lid: "worry", mouth: "o", look: [-0.8, -0.2] }, { feetShadow: { rx: 10, ry: 3.5, op: 0.25 } });
  body += drop(crew[0] - 18, crew[1] - 12, 0.55);
  // the guard: ox-red spider with cap, badge, torch and moustache
  const R = [[[26, 10], [58, -2], [84, -30], [96, -44]], STAND_R[1], STAND_R[2], STAND_R[3]];
  // left legs II-IV tucked in towards the body so their feet and shadows stay on the floor inside the
  // vignette instead of standing on (and shadowing) the oval ring and the page margin beyond it
  const tuck = (l, k) => l.map((p, i) => i ? [p[0] * k, p[1]] : p);
  const L = [[[-26, 10], [-62, -24], [-80, -64], [-78, -104]], ...mirror([tuck(STAND_R[1], 0.9), tuck(STAND_R[2], 0.84), tuck(STAND_R[3], 0.84)])];
  const cap = path("M-44 -28 Q-46 -70 0 -74 Q46 -70 44 -28 Z", C.deep, C.ink, 3.5) + path("M-48 -28 Q0 -44 48 -28 Q48 -16 0 -22 Q-48 -16 -48 -28 Z", C.ink, C.ink, 2) +
    path("M-38 -34 Q0 -42 38 -34", "none", C.gold, 3.5) + path("M-30 -60 Q0 -70 30 -60", "none", C.soft, 2.5) +
    path("M-10 -66 L0 -70 L10 -66 L9 -52 Q6 -44 0 -41 Q-6 -44 -9 -52 Z", C.gold, C.ink, 2.4) + circ(0, -56, 3.2, C.glint);
  const tache = path("M0 24 Q-10 16 -22 22 Q-32 26 -34 18 Q-30 34 -16 32 Q-6 30 0 26 Q6 30 16 32 Q30 34 34 18 Q32 26 22 22 Q10 16 0 24 Z", C.ink, C.ink, 2);
  const torch = `<g transform="rotate(${r1(th)} 96 -44)">` + path("M60 -54 H100 V-34 H60 Z", C.edge, C.ink, 3) + path("M100 -58 H116 V-30 H100 Z", C.edge, C.ink, 3) + ell(116, -44, 4, 14, C.glint, C.ink, 2) + path("M70 -54 V-34 M80 -54 V-34", "none", C.ink, 2) + `</g>`;
  body += spider({
    ...GT,
    col: C.ox, shade: C.deep, hi: C.oxb,
    ceph: { rx: 46, ry: 40 },
    abd: { dx: 0, dy: -66, rx: 52, ry: 46, pattern: path("M-20 -84 L0 -104 L20 -84 L0 -64 Z", C.deep, C.ink, 2) + path("M-36 -52 Q0 -36 36 -52", "none", C.oxb, 4) },
    legs: [...R, ...L], legW: 8, band: C.deep, dash: "3 12", feetShadow: { rx: 14, ry: 4.5, op: 0.35 }, lifted: [0, 4],
    fy: -4,
    faceO: { er: 15, esp: 19, lid: "glare", lidCol: C.ox, small: "std", mouth: "none", look: [1, 0.3] },
    // the torch is drawn over the leg, then the leg's last segment again so the foot visibly grips it
    over: tache + cap + torch + leg([R[0][2], R[0][3]], { w: 8, col: C.ox, hl: C.oxb, band: C.deep, dash: "3 12", knee: false }),
  });
  save("creature-guard-spider", VB, "The Guard Spider: a stern ox-red rival in a peaked cap with a badge and moustache, aiming a torch beam at a sneaking crew member", body);
}

// ======================================================================
// New creatures (snake, parrot, rat, exterminator, goldfish)
// ======================================================================

// A stroke that tapers from w0 to w1 along a polyline (segments with round caps), outlined in ink.
function taper(pts, w0, w1, col, ink = 2.5) {
  let a = "", b = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const w = w0 + (w1 - w0) * (i / Math.max(1, pts.length - 2));
    a += line(pts[i], pts[i + 1], C.ink, w + ink * 2);
    b += line(pts[i], pts[i + 1], col, w);
  }
  return a + b;
}

// ---------------- snake ----------------
{
  setPrefix("cr-snake");
  const v = oval();
  let body = v.bg + `<g clip-path="${v.clip}">`;
  // the table the tank stands on
  body += path("M0 300 H480 V400 H0 Z", C.edge, "none", 0) + line([0, 300], [480, 300], C.ink, 3) + strokes([[40, 360, 150, 360], [200, 382, 300, 382]], C.gold, 2);
  // tank: front glass x -10..372, y 70..330; the right side recedes by (+32,-20)
  const F = { l: -10, r: 364, t: 76, b: 330 }, D = [40, -34];
  body += shadow(200, 336, 230, 8, C.ink, 0.22);
  // interior seen through the glass: back wall (the room), substrate, hide and water dish
  body += path(`M${F.l + D[0]} ${F.t + D[1]} H${F.r + D[0]} V${F.b + D[1]} H${F.l + D[0]} Z`, C.parch, "none", 0);
  body += path(`M${F.l} 286 L${F.r} 286 L${F.r + D[0]} 266 L${F.r + D[0]} ${F.b + D[1]} L${F.r} ${F.b} L${F.l} ${F.b} Z`, C.glint, C.ink, 0, ` opacity="0.9"`);
  { const R = rng(31); let d = ""; for (let i = 0; i < 70; i++) { const x = R() * 390, y = 290 + R() * 34; d += `M${r1(x)} ${r1(y)} l${r1(4 + R() * 4)} ${r1(-1 - R() * 2)}`; } body += path(d, "none", C.gold, 2); }
  body += path("M4 286 Q4 236 58 236 Q112 236 112 286 Z", C.soft, C.ink, 3) + path("M26 286 Q26 258 58 258 Q90 258 90 286 Z", C.deep, C.ink, 2.5) + path("M18 250 q10 -8 24 -6 M76 244 q12 2 20 10", "none", C.edge, 2.5);
  body += ell(340, 278, 26, 8, C.edge, C.ink, 3) + ell(340, 276, 19, 5, C.soft, C.ink, 1.5, ` opacity="0.7"`);
  // --- the corn snake, coiled on the substrate
  const bodyStroke = (d, w = 30) => path(d, "none", C.ink, w + 6) + path(d, "none", C.gold, w) +
    `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${w - 4}" stroke-dasharray="18 14"/>` +
    `<path d="${d}" fill="none" stroke="${C.ox}" stroke-width="${w - 10}" stroke-dasharray="14 18" stroke-dashoffset="-2"/>` +
    path(d, "none", C.glint, 3, ` opacity="0.55" transform="translate(0 -${Math.round(w * 0.3)})"`);
  const E = (cx, cy, rx, ry, a0, a1) => { // elliptical arc a0->a1 (deg, clockwise) as a path string
    const p = t => [cx + rx * Math.cos(t * Math.PI / 180), cy + ry * Math.sin(t * Math.PI / 180)];
    let d = `M${pt(p(a0))}`; for (let t = a0 + 10; t <= a1; t += 10) d += ` L${pt(p(Math.min(t, a1)))}`; return d;
  };
  // tail tip (tucked out at the front left), bottom coil back half, top coil back half, bottom coil front, top coil front, neck
  body += taper([[92, 306], [70, 314], [52, 318], [40, 316]], 24, 6, C.gold);
  body += bodyStroke(E(186, 292, 112, 22, 180, 360));
  body += bodyStroke(E(182, 268, 78, 15, 180, 360));
  body += bodyStroke(E(186, 292, 112, 22, 0, 180));
  body += bodyStroke(E(182, 268, 78, 15, 0, 180));
  // neck rises from the top coil's right side in an S, then pitches down toward the glass
  const neck = "M258 268 C318 262 236 148 282 172";
  body += bodyStroke(neck, 28);
  // head in profile, pointing down-right at the spider outside; forked tongue flicking out
  const ha = 44;
  body += `<g transform="translate(282 172) rotate(${ha})">` +
    path("M72 4 L94 4 M94 4 L104 -3 M94 4 L104 11", "none", C.ink, 5) + path("M72 4 L94 4 M94 4 L104 -3 M94 4 L104 11", "none", C.oxb, 2.6) +
    path("M-8 -15 Q22 -21 48 -12 Q66 -6 68 2 Q66 10 48 14 Q22 19 -8 15 Z", C.gold, C.ink, 3.5) +
    path("M8 -14 L30 -2 L8 10 L18 -2 Z", C.ox, C.ink, 2) + path("M40 -14 Q54 -10 60 -4", "none", C.glint, 3) +
    path("M66 6 Q46 12 28 10", "none", C.ink, 2.4) + circ(61, -3, 2, C.ink) +
    circ(42, -5, 7.5, C.glint, C.ink, 2.4) + circ(43, -5, 4, C.ink) + circ(41, -7, 1.6, C.cream) + `</g>`;
  // --- glass: faint tint, reflections from a light at the upper left, frame
  body += path(`M${F.l} ${F.t} H${F.r} V${F.b} H${F.l} Z`, C.cream, "none", 0, ` opacity="0.06"`);
  body += path(`M${F.r} ${F.t} L${F.r + D[0]} ${F.t + D[1]} L${F.r + D[0]} ${F.b + D[1]} L${F.r} ${F.b} Z`, C.cream, C.ink, 2.5, ` opacity="0.35"`);
  body += strokes([[30, 200, 110, 90], [60, 214, 130, 116], [300, 150, 340, 96]], C.cream, 5, ` opacity="0.7"`);
  body += path(`M${F.l} ${F.b - 12} H${F.r} V${F.b} H${F.l} Z`, C.ink, C.ink, 2) + path(`M${F.r} ${F.b} L${F.r + D[0]} ${F.b + D[1]} V${F.b + D[1] - 12} L${F.r} ${F.b - 12} Z`, C.deep, C.ink, 2);
  body += path(`M${F.l} ${F.t} H${F.r} V${F.t + 10} H${F.l} Z`, C.ink, C.ink, 2) + path(`M${F.r} ${F.t} L${F.r + D[0]} ${F.t + D[1]} V${F.t + D[1] + 10} L${F.r} ${F.t + 10} Z`, C.deep, C.ink, 2);
  body += line([F.r, F.t], [F.r, F.b], C.ink, 6);
  // --- the loose lid: a mesh screen knocked askew. It still rests on the front and back rims,
  // but its front-right corner overhangs the front and a dark gap has opened along the right end and back.
  const TP = (u, w) => [F.l + u * (F.r - F.l) + w * D[0], F.t + w * D[1]];
  body += path(poly([TP(0, 0), TP(1, 0), TP(1, 1), TP(0, 1)]) + "Z", C.ink, C.ink, 2);
  const LC = [TP(-0.1, 0.02), TP(0.86, -0.22), TP(0.93, 0.82), TP(-0.03, 1.08)];
  const thick = LC.map(([x, y]) => [x, y + 6]);
  body += path(poly([LC[0], LC[1], thick[1], thick[0]]) + "Z", C.edge, C.ink, 2.5) + path(poly([LC[1], LC[2], thick[2], thick[1]]) + "Z", C.gold, C.ink, 2.5);
  body += path(poly(LC) + "Z", C.deep, C.ink, 3);
  { let d = ""; for (let i = 1; i < 16; i++) { const t = i / 16, a = [LC[0][0] + (LC[1][0] - LC[0][0]) * t, LC[0][1] + (LC[1][1] - LC[0][1]) * t], b = [LC[3][0] + (LC[2][0] - LC[3][0]) * t, LC[3][1] + (LC[2][1] - LC[3][1]) * t]; d += `M${pt(a)} L${pt(b)}`; } body += path(d, "none", C.soft, 1.4, ` opacity="0.8"`); }
  body += path(`M${pt(LC[0])} L${pt(LC[1])}`, "none", C.edge, 3);
  body += `</g>` + v.ring;
  // the tiny spider on the table in front of the glass, looking up at the snake
  body += mini(318, 354, 0.12, { lid: "worry", mouth: "o", look: [-0.3, -1] }, { feetShadow: { rx: 11, ry: 4, op: 0.3 } });
  save("creature-snake", VB, "The Snake: a corn snake coiled in its display tank, tongue flicking at a tiny spider on the table outside the glass; the mesh lid has slid askew", body);
}

// ---------------- parrot ----------------
{
  setPrefix("cr-parrot");
  const v = oval();
  let body = v.bg + `<g clip-path="${v.clip}">`;
  // side table the cage stands on
  body += path("M0 336 H480 V400 H0 Z", C.edge, "none", 0) + line([0, 336], [480, 336], C.ink, 3);
  const CG = { l: 40, r: 324, top: -10, tray: 312 };
  body += shadow(182, 344, 160, 7, C.ink, 0.25);
  // back bars (behind the bird), seen through the cage
  { let d = ""; for (let x = CG.l + 11; x < CG.r; x += 22) d += `M${x} ${CG.top} V${CG.tray}`; body += path(d, "none", C.gold, 2, ` opacity="0.45"`); }
  body += path(`M${CG.l} 140 H${CG.r}`, "none", C.gold, 2, ` opacity="0.45"`);
  // the tail hangs down behind the perch
  body += path("M170 212 L146 300 Q160 312 176 304 L198 220 Z", C.oxb, C.ink, 3) + path("M180 232 L160 298 Q167 303 174 300 L190 236 Z", C.plum, C.ink, 2) + path("M168 250 l10 3 M162 272 l10 3", "none", C.ox, 2);
  // perch: a wooden dowel running side to side, its ends fixed into the cage sides
  const PY = 226;
  body += path(`M${CG.l} ${PY - 7} H${CG.r} V${PY + 7} H${CG.l} Z`, C.gold, C.ink, 3) + path(`M${CG.l} ${PY - 3} H${CG.r}`, "none", C.glint, 2) + path(`M70 ${PY + 2} q10 -3 20 0 M250 ${PY + 1} q12 -3 24 0`, "none", C.ink, 1.8, ` opacity="0.5"`);
  // --- the parrot (a scarlet macaw-ish bird), in profile facing right
  // body
  body += path("M150 196 Q140 120 196 96 Q246 84 252 140 Q258 196 222 222 Q190 236 164 222 Z", C.oxb, C.ink, 3.5);
  body += path("M232 120 Q248 150 238 192", "none", C.ox, 4) + path("M168 118 Q180 102 204 98", "none", C.cream, 3, ` opacity="0.5"`);
  // folded wing: gold coverts, green middle, plum flight feathers pointing down and back to the tail
  body += path("M170 128 Q214 124 222 164 Q212 206 184 226 Q162 232 154 214 Q150 166 170 128 Z", C.gold, C.ink, 3);
  body += path("M160 176 Q192 176 214 186 Q204 212 184 226 Q164 230 156 214 Z", C.good, C.ink, 2.5);
  body += path("M158 206 Q184 206 204 206 Q196 220 184 228 L176 244 L170 232 L164 242 L160 228 Q152 220 158 206 Z", C.plum, C.ink, 2.5);
  body += path("M176 140 q10 -4 20 2 M170 156 q14 -4 26 4", "none", C.ox, 2);
  // head
  body += circ(232, 84, 38, C.oxb, C.ink, 3.5);
  body += path("M222 50 Q240 44 258 56", "none", C.cream, 3, ` opacity="0.45"`);
  // bare cream face patch with the eye
  body += path("M234 70 Q252 62 264 76 Q268 96 252 104 Q236 104 232 90 Z", C.cream, C.ink, 2.5);
  body += path("M240 94 l6 1 M242 99 l7 0 M246 88 l6 2", "none", C.ox, 1.4);
  body += circ(248, 80, 8, C.glint, C.ink, 2.4) + circ(249, 80, 4.2, C.ink) + circ(247, 78, 1.6, C.cream);
  // beak, open mid-squawk: hooked pale upper mandible over a dropped dark lower mandible, tongue inside
  body += path("M260 94 L290 98 L288 126 L258 110 Z", C.deep, C.ink, 2);
  body += path("M258 104 Q278 110 292 134 Q282 140 270 134 Q260 124 256 112 Z", C.ink, C.ink, 2.5);
  body += ell(272, 112, 7, 5, C.ox, C.ink, 1.6, ` transform="rotate(30 272 112)"`);
  body += path("M256 66 Q290 58 303 84 Q310 106 298 120 Q296 104 288 97 Q276 91 260 97 Z", C.cream, C.ink, 3);
  body += path("M262 70 Q284 66 294 84", "none", C.edge, 2);
  // legs and zygodactyl feet on the perch: two toes forward over the dowel, two back (behind it)
  for (const fx of [192, 208]) {
    body += path(`M${fx} 222 L${fx} ${PY - 6}`, "none", C.ink, 8) + path(`M${fx} 222 L${fx} ${PY - 6}`, "none", C.edge, 4.5);
    body += path(`M${fx} ${PY - 7} Q${fx + 9} ${PY - 9} ${fx + 12} ${PY - 1} Q${fx + 13} ${PY + 6} ${fx + 8} ${PY + 9}`, "none", C.ink, 7) + path(`M${fx} ${PY - 7} Q${fx + 9} ${PY - 9} ${fx + 12} ${PY - 1} Q${fx + 13} ${PY + 6} ${fx + 8} ${PY + 9}`, "none", C.edge, 3.5);
    body += path(`M${fx} ${PY - 7} Q${fx + 4} ${PY - 8} ${fx + 6} ${PY - 2} Q${fx + 7} ${PY + 5} ${fx + 3} ${PY + 8}`, "none", C.ink, 6) + path(`M${fx} ${PY - 7} Q${fx + 4} ${PY - 8} ${fx + 6} ${PY - 2} Q${fx + 7} ${PY + 5} ${fx + 3} ${PY + 8}`, "none", C.edge, 3);
  }
  // front bars (in front of the bird and perch), cross rings, and the base tray on the table
  { let d = ""; for (let x = CG.l; x <= CG.r; x += 22) d += `M${x} ${CG.top} V${CG.tray}`; body += path(d, "none", C.ink, 5) + path(d, "none", C.gold, 2.6); }
  body += path(`M${CG.l - 4} 150 H${CG.r + 4}`, "none", C.ink, 7) + path(`M${CG.l - 4} 150 H${CG.r + 4}`, "none", C.gold, 4);
  body += path(`M${CG.l - 10} ${CG.tray} H${CG.r + 10} V${CG.tray + 24} H${CG.l - 10} Z`, C.plum, C.ink, 3.5) + path(`M${CG.l - 10} ${CG.tray + 6} H${CG.r + 10}`, "none", C.soft, 3);
  // squawk: sound arcs spreading from the open beak toward the right
  for (const r of [24, 40, 56]) body += path(`M${r1(290 + r * Math.cos(-0.5))} ${r1(106 + r * Math.sin(-0.5))} A${r} ${r} 0 0 1 ${r1(290 + r * Math.cos(0.55))} ${r1(106 + r * Math.sin(0.55))}`, "none", C.ink, 3.5);
  // the spider's silk line runs down from above the frame to the spinnerets
  body += path(`M404 0 V${r1(164 - 106 * 0.11 + 2)}`, "none", C.gold, 2.2);
  body += `</g>` + v.ring;
  // tiny spider hanging outside the cage, braced against the noise
  body += mini(404, 164, 0.11, { lid: "squint", mouth: "wobble", look: [-1, 0] });
  save("creature-parrot", VB, "The Parrot: a scarlet macaw on the perch of its cage, beak wide mid-squawk at a tiny spider dangling on a silk line outside the bars", body);
}

// ---------------- rat ----------------
{
  setPrefix("cr-rat");
  const v = oval();
  const FUR = C.soft, SH = C.plum, PINK = C.parch;
  const fg = uid("floor");
  let body = `<defs><linearGradient id="${fg}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.plum}"/><stop offset="0.55" stop-color="${C.edge}"/><stop offset="1" stop-color="${C.parch}"/></linearGradient></defs>`;
  body += v.bg + `<g clip-path="${v.clip}">`;
  // under the dishwasher: the machine's underside overhead, a dark void behind, the kitchen floor
  // (tiles) catching light that comes in from the kitchen at the front
  body += path("M0 0 H480 V400 H0 Z", C.deep, "none", 0);
  body += path("M0 250 H480 V400 H0 Z", `url(#${fg})`, "none", 0) + line([0, 250], [480, 250], C.ink, 3);
  body += strokes([[0, 290, 480, 290], [150, 250, 120, 290], [360, 250, 380, 290], [0, 350, 480, 350], [120, 290, 90, 350], [380, 290, 410, 350]], C.ink, 2, ` opacity="0.35"`);
  // corrugated drain hose lying along the back of the floor
  body += path("M0 236 Q240 226 480 240", "none", C.ink, 22) + path("M0 236 Q240 226 480 240", "none", C.edge, 16);
  { let d = ""; for (let x = 8; x < 480; x += 14) { const t = x / 480, y = (1 - t) * (1 - t) * 236 + 2 * t * (1 - t) * 226 + t * t * 240; d += `M${x} ${r1(y - 7)} v14`; } body += path(d, "none", C.gold, 2); }
  // the dishwasher's underside and its levelling foot (a threaded post down to a pad on the floor)
  body += path("M0 0 H480 V46 H0 Z", C.ink, "none", 0) + path("M0 46 H480", "none", C.edge, 4) + path("M0 38 H480", "none", C.soft, 2, ` opacity="0.6"`);
  for (const x of [70, 170, 300, 410]) body += circ(x, 28, 4, C.edge, C.ink, 1.5);
  body += path("M52 46 H70 V268 H52 Z", C.edge, C.ink, 3) + path("M52 90 l18 -6 M52 110 l18 -6 M52 130 l18 -6 M52 150 l18 -6 M52 170 l18 -6 M52 190 l18 -6", "none", C.ink, 1.6) + ell(61, 270, 22, 7, C.gold, C.ink, 3);
  body += shadow(64, 276, 30, 5, C.ink, 0.35);
  // --- the crumb on the floor between them: the bargaining chip
  body += shadow(296, 334, 16, 3.5, C.ink, 0.35) + path("M284 332 l6 -12 l14 -2 l8 10 l-4 8 Z", C.gold, C.ink, 2.4) + circ(294, 326, 1.6, C.deep) + circ(302, 324, 1.6, C.deep);
  // --- the rat: sitting up on its haunches, three-quarter view facing right, arms crossed
  const rx = 190;
  body += shadow(rx - 4, 318, 92, 11, C.ink, 0.4);
  // tail: one long naked tail lying on the floor, curling round in front
  body += taper([[140, 300], [104, 312], [82, 330], [96, 346], [140, 352], [196, 348], [226, 340]], 11, 3, C.parch);
  { let d = ""; for (const [x, y] of [[112, 309], [92, 322], [88, 338], [110, 348], [150, 351], [184, 349]]) d += `M${x - 3} ${y - 3} l5 5`; body += path(d, "none", C.ink, 1.4); }
  // far hind foot (behind), haunch and body
  body += path(`M${rx - 44} 312 Q${rx - 20} 302 ${rx + 8} 310 L${rx + 10} 316 Q${rx - 20} 318 ${rx - 44} 318 Z`, PINK, C.ink, 2.5);
  body += path(`M${rx - 70} 300 Q${rx - 86} 236 ${rx - 42} 196 Q${rx - 20} 150 ${rx + 10} 150 Q${rx + 44} 156 ${rx + 46} 200 Q${rx + 50} 260 ${rx + 36} 300 Q${rx - 20} 322 ${rx - 70} 300 Z`, FUR, C.ink, 3.5);
  body += path(`M${rx - 18} 196 Q${rx + 16} 190 ${rx + 30} 220 Q${rx + 34} 270 ${rx + 16} 300 Q${rx - 10} 306 ${rx - 20} 290 Q${rx - 30} 240 ${rx - 18} 196 Z`, C.parch, C.ink, 2.5);
  body += furTicks([[rx - 70, 290], [rx - 80, 240], [rx - 50, 196], [rx - 20, 156]], 7, 12, -1, C.ink, 2, 5);
  body += path(`M${rx - 60} 250 Q${rx - 50} 280 ${rx - 30} 296`, "none", SH, 4);
  // near hind foot: long, flat on the floor, five toes
  body += path(`M${rx - 34} 318 Q${rx - 34} 304 ${rx - 10} 304 L${rx + 30} 308 Q${rx + 40} 312 ${rx + 36} 318 Z`, PINK, C.ink, 2.5);
  for (let i = 0; i < 5; i++) body += circ(rx + 20 + i * 4.5, 316 - Math.abs(i - 2) * 1.5, 2.6, PINK, C.ink, 1.4);
  // crossed arms: the far forearm (higher) runs right-to-left with its paw tucked on the near upper arm;
  // the near forearm (lower, in front) runs left-to-right with its paw tucked on the far upper arm
  const arm = (d) => path(d, FUR, C.ink, 3);
  const fingers = (x, y, dir) => { let f = ""; for (let i = 0; i < 4; i++) { const d = `M${x} ${y + i * 4.5} q${dir * 9} -1 ${dir * 11} 4`; f += path(d, "none", C.ink, 5.5) + path(d, "none", PINK, 3); } return f; };
  body += arm(`M${rx + 24} 190 Q${rx + 44} 200 ${rx + 46} 226 Q${rx + 44} 238 ${rx + 32} 236 L${rx - 22} 232 Q${rx - 30} 226 ${rx - 22} 218 L${rx + 24} 220 Z`);
  body += arm(`M${rx - 26} 188 Q${rx - 50} 206 ${rx - 48} 236 Q${rx - 46} 256 ${rx - 32} 256 L${rx - 20} 250 Q${rx - 34} 226 ${rx - 16} 196 Z`);
  body += fingers(rx - 34, 216, -1);
  body += arm(`M${rx - 46} 240 Q${rx - 48} 258 ${rx - 32} 260 L${rx + 26} 256 Q${rx + 34} 250 ${rx + 26} 242 L${rx - 30} 240 Z`);
  body += fingers(rx + 28, 240, 1);
  body += path(`M${rx - 36} 250 L${rx + 10} 248`, "none", SH, 2.5, ` opacity="0.8"`);
  // head: pointed snout to the right, two round ears (the near one notched), both eyes
  const hx = rx + 18, hy = 128;
  body += circ(hx + 26, hy - 40, 16, FUR, C.ink, 3) + circ(hx + 26, hy - 40, 9, PINK, C.ink, 0, ` opacity="0.8"`);
  body += path(`M${hx - 36} ${hy + 10} Q${hx - 40} ${hy - 34} ${hx} ${hy - 38} Q${hx + 36} ${hy - 36} ${hx + 50} ${hy - 4} L${hx + 76} ${hy + 14} Q${hx + 80} ${hy + 22} ${hx + 70} ${hy + 26} Q${hx + 30} ${hy + 40} ${hx - 10} ${hy + 36} Q${hx - 36} ${hy + 30} ${hx - 36} ${hy + 10} Z`, FUR, C.ink, 3.5);
  body += path(`M${hx - 30} ${hy - 10} Q${hx - 24} ${hy - 30} ${hx} ${hy - 32}`, "none", C.cream, 3, ` opacity="0.4"`);
  body += path(`M${hx - 20} ${hy - 30} A22 22 0 1 1 ${hx - 2} ${hy - 62} L${hx - 8} ${hy - 50} L${hx + 2} ${hy - 46} A22 22 0 0 1 ${hx - 20} ${hy - 30} Z`, FUR, C.ink, 3);
  body += path(`M${hx - 16} ${hy - 34} A14 14 0 1 1 ${hx - 4} ${hy - 56} L${hx - 9} ${hy - 48} Z`, PINK, "none", 0, ` opacity="0.8"`);
  body += circ(hx + 76, hy + 16, 6, PINK, C.ink, 2.4);
  // eyes: the near one half-lidded and sceptical, the far one just visible past the snout ridge
  body += circ(hx + 30, hy - 14, 4.5, C.ink) + circ(hx + 29, hy - 15, 1.4, C.glint);
  body += circ(hx + 8, hy - 6, 8, C.ink) + circ(hx + 6, hy - 8, 2.6, C.glint) + path(`M${hx - 2} ${hy - 10} L${hx + 18} ${hy - 10}`, "none", C.ink, 3) + path(`M${hx - 2} ${hy - 14} L${hx + 18} ${hy - 12} L${hx + 18} ${hy - 18} L${hx - 2} ${hy - 18} Z`, FUR, "none", 0);
  body += path(`M${hx - 6} ${hy - 22} q12 -8 26 -2`, "none", C.ink, 3) + path(`M${hx - 4} ${hy - 2} l10 -16`, "none", C.ink, 1.6, ` opacity="0.6"`);
  // mouth, two incisors, and a toothpick held at the corner of the mouth
  body += path(`M${hx + 70} ${hy + 26} Q${hx + 56} ${hy + 30} ${hx + 44} ${hy + 26}`, "none", C.ink, 2.4);
  body += path(`M${hx + 62} ${hy + 26} h5 v7 h-5 Z M${hx + 67} ${hy + 26} h5 v7 h-5 Z`, C.glint, C.ink, 1.6);
  body += path(`M${hx + 46} ${hy + 27} L${hx + 22} ${hy + 44}`, "none", C.ink, 5) + path(`M${hx + 46} ${hy + 27} L${hx + 22} ${hy + 44}`, "none", C.gold, 2.6);
  // whiskers grow from the muzzle
  for (const [dx, dy] of [[58, 12], [62, 18], [54, 20]]) body += circ(hx + dx, hy + dy, 1.4, C.ink);
  body += path(`M${hx + 58} ${hy + 12} Q${hx + 90} ${hy - 6} ${hx + 118} ${hy - 4} M${hx + 62} ${hy + 18} Q${hx + 96} ${hy + 14} ${hx + 124} ${hy + 22} M${hx + 54} ${hy + 20} Q${hx + 80} ${hy + 34} ${hx + 104} ${hy + 50}`, "none", C.ink, 1.6);
  body += `</g>` + v.ring;
  // the tiny spider, standing on the floor across from the rat, one front leg raised to make its pitch
  const ST = { x: 356, y: 318, s: 0.14 };
  const SL = [...STAND_R, ...mirror(STAND_R)];
  SL[4] = [[-24, 10], [-56, -50], [-96, -78], [-130, -84]];
  body += mini(ST.x, ST.y, ST.s, { lid: "sly", mouth: "grin", look: [-1, 0] }, { legs: SL, lifted: [4], feetShadow: { rx: 12, ry: 4, op: 0.35 } });
  save("creature-rat", VB, "The Rat: a streetwise rat sitting up under a dishwasher, arms crossed and toothpick in its teeth, sizing up a tiny spider pitching a deal over a crumb", body);
}

// ---------------- exterminator ----------------
{
  setPrefix("cr-exterm");
  const v = oval();
  const bg = uid("xbeam");
  // torch beam from a light held high off-frame at the upper left, aimed at the floor beside the table leg
  const src = [40, -120], pool = { x: 262, y: 322, rx: 74, ry: 17 };
  const tA = [pool.x + pool.rx * Math.cos(-1.9), pool.y + pool.ry * Math.sin(-1.9)], tB = [pool.x + pool.rx * Math.cos(0.5), pool.y + pool.ry * Math.sin(0.5)];
  let body = `<defs><linearGradient id="${bg}" gradientUnits="userSpaceOnUse" x1="${src[0]}" y1="${src[1]}" x2="${pool.x}" y2="${pool.y}"><stop offset="0" stop-color="${C.glint}" stop-opacity="0.75"/><stop offset="1" stop-color="${C.glint}" stop-opacity="0.35"/></linearGradient></defs>`;
  body += v.bg + `<g clip-path="${v.clip}">`;
  // a dim room at floor level: far wall, skirting, floorboards receding
  body += path("M0 0 H480 V232 H0 Z", C.deep, "none", 0) + path("M0 206 H480 V232 H0 Z", C.plum, C.ink, 2.5);
  body += path("M0 232 H480 V400 H0 Z", C.edge, "none", 0) + line([0, 232], [480, 232], C.ink, 3);
  body += strokes([[200, 232, 150, 400], [420, 232, 480, 330]], C.gold, 3) + strokes([[40, 280, 120, 280], [300, 372, 400, 372], [230, 250, 300, 250]], C.gold, 2);
  // the beam: a cone from the torch (off-frame) that ends in a pool of light on the floor
  body += path(`M${src[0] - 10} ${src[1]} L${src[0] + 10} ${src[1]} L${pt(tB)} A${pool.rx} ${pool.ry} 0 0 1 ${pt(tA)} Z`, `url(#${bg})`, "none", 0);
  body += ell(pool.x, pool.y, pool.rx, pool.ry, C.glint, C.ink, 0, ` opacity="0.75"`);
  // --- the table leg (its top runs out of frame), lit on the side facing the torch,
  // casting its shadow across the floor away from the light (to the lower right)
  const TL = { l: 330, r: 368, foot: 330 };
  // (the torch is held above the exterminator, off to the left, so the shadow runs straight out to the right)
  body += path(`M${TL.r - 4} ${TL.foot - 5} L480 ${TL.foot - 14} L480 ${TL.foot + 14} L${TL.r - 4} ${TL.foot + 4} Z`, C.ink, "none", 0, ` opacity="0.35"`);
  body += shadow((TL.l + TL.r) / 2, TL.foot, (TL.r - TL.l) / 2 + 8, 5, C.ink, 0.4);
  const legD = `M${TL.l - 6} -10 H${TL.r + 6} V60 Q${TL.r + 10} 74 ${TL.r} 84 L${TL.r - 2} ${TL.foot - 12} Q${TL.r + 6} ${TL.foot - 4} ${TL.r + 2} ${TL.foot} H${TL.l - 2} Q${TL.l - 6} ${TL.foot - 4} ${TL.l + 2} ${TL.foot - 12} L${TL.l} 84 Q${TL.l - 10} 74 ${TL.l - 6} 60 Z`;
  body += path(legD, C.gold, C.ink, 3.5);
  body += path(`M${TL.l + 5} 96 L${TL.l + 7} ${TL.foot - 16}`, "none", C.glint, 5) + path(`M${TL.r - 8} 96 L${TL.r - 8} ${TL.foot - 16}`, "none", C.ink, 5, ` opacity="0.3"`);
  body += path(`M${TL.l - 6} 60 H${TL.r + 6}`, "none", C.ink, 2.5);
  // --- the exterminator: two huge work boots on the floor, trouser legs rising out of frame
  const boot = (x, y, s, far) => {
    // x,y = heel bottom; the boot faces right; s = scale. A lace-up work boot with a toe cap and a lugged sole.
    const P = (a, b) => `${r1(x + a * s)} ${r1(y + b * s)}`;
    const leather = far ? C.ox : C.oxb, dark = far ? C.deep : C.ox;
    let b = "";
    b += path(`M${P(10, -140)} L${P(6, -330)} L${P(122, -330)} L${P(112, -140)} Z`, far ? C.gold : C.parch, C.ink, 3.5); // trouser leg
    b += path(`M${P(34, -170)} L${P(30, -320)} M${P(92, -160)} L${P(98, -300)}`, "none", far ? C.deep : C.edge, 3, ` opacity="0.5"`);
    b += path(`M${P(2, -14)} L${P(-2, -154)} L${P(116, -154)} L${P(120, -98)} Q${P(156, -94)} ${P(196, -80)} Q${P(250, -68)} ${P(264, -36)} Q${P(270, -16)} ${P(258, -14)} Z`, leather, C.ink, 3.5); // upper
    b += path(`M${P(192, -80)} Q${P(250, -68)} ${P(264, -36)} Q${P(270, -16)} ${P(258, -14)} L${P(186, -14)} Q${P(180, -50)} ${P(192, -80)} Z`, dark, C.ink, 3); // toe cap
    b += path(`M${P(-2, -154)} L${P(116, -154)} L${P(116, -142)} L${P(-2, -142)} Z`, dark, C.ink, 2.5) + path(`M${P(4, -150)} L${P(-8, -174)} L${P(14, -174)} L${P(18, -150)}`, dark, C.ink, 2.5); // collar + pull tab
    b += path(`M${P(206, -70)} Q${P(242, -62)} ${P(254, -38)}`, "none", C.cream, 3, ` opacity="0.4"`);
    for (let i = 0; i < 4; i++) {
      const ax = 88 + i * 14, ay = -136 + i * 12;
      b += path(`M${P(ax, ay)} L${P(ax + 30, ay + 8)} M${P(ax, ay + 8)} L${P(ax + 30, ay)}`, "none", C.cream, 3);
      b += circ(x + ax * s, y + ay * s, 2.4 * s, C.glint, C.ink, 1) + circ(x + (ax + 30) * s, y + (ay + 8) * s, 2.4 * s, C.glint, C.ink, 1);
    }
    b += path(`M${P(-6, -16)} L${P(262, -16)} Q${P(274, -8)} ${P(262, 0)} L${P(-6, 0)} Z`, C.ink, C.ink, 2.5); // sole
    b += path(`M${P(-6, -22)} L${P(58, -22)} L${P(58, -16)} L${P(-6, -16)} Z`, C.deep, C.ink, 2); // heel block
    for (let k = 0; k < 7; k++) b += path(`M${P(10 + k * 36, 0)} v${r1(-5 * s)} h${r1(14 * s)} v${r1(5 * s)}`, "none", C.edge, 2);
    return b;
  };
  body += shadow(170, 296, 150, 9, C.ink, 0.4) + boot(40, 294, 0.84, true);
  body += shadow(110, 366, 170, 11, C.ink, 0.4) + boot(-30, 362, 1, false);
  // --- the spray wand: held off-frame above, a metal tube angling down to a nozzle near the floor
  body += path("M150 -10 L262 262", "none", C.ink, 11) + path("M150 -10 L262 262", "none", C.edge, 6) + path("M150 -10 L262 262", "none", C.cream, 2, ` transform="translate(-2 0)" opacity="0.7"`);
  body += path("M252 252 L270 244 L284 280 L266 288 Z", C.ink, C.ink, 2) + path("M262 272 L284 264", "none", C.edge, 3);
  // a drip gathering at the nozzle and a drop falling straight down from it
  body += path("M276 284 q-3 6 0 8 q3 -2 0 -8 Z", C.cream, C.ink, 1.6) + drop(276, 298, 0.5);
  body += `</g>` + v.ring;
  // --- the tiny spider hiding behind the table leg, in its shadow, peeking round the far side
  const hide = mini(378, 322, 0.11, { lid: "worry", mouth: "o", look: [-1, 0] }, { feetShadow: { rx: 11, ry: 4, op: 0.35 } });
  const hk = uid("hidek");
  // the leg occludes the spider: clip the spider to the region right of the leg's right edge
  // the spider is masked by the leg's exact silhouette (outline included), so it tucks in behind it
  body += `<mask id="${hk}" maskUnits="userSpaceOnUse" x="0" y="0" width="480" height="400"><rect width="480" height="400" fill="#fff"/><path d="${legD}" fill="#000" stroke="#000" stroke-width="3.5"/></mask><g mask="url(#${hk})">${hide}</g>`;
  save("creature-exterminator", VB, "The Exterminator, seen from spider height: two huge work boots and a dripping spray wand, a torch beam sweeping the floor while a tiny spider hides behind a table leg", body);
}

// ---------------- goldfish ----------------
{
  setPrefix("cr-fish");
  const v = oval();
  // bowl: a glass sphere (centre bc, radius R) cut flat at the rim (y=RIM) and the base (y=BASE)
  const bc = [236, 206], R = 136, RIM = 84, BASE = 330, WL = 124;
  const hw = y => Math.sqrt(R * R - (y - bc[1]) ** 2);
  const bowl = `M${r1(bc[0] - hw(RIM))} ${RIM} A${R} ${R} 0 0 0 ${r1(bc[0] - hw(BASE))} ${BASE} L${r1(bc[0] + hw(BASE))} ${BASE} A${R} ${R} 0 0 0 ${r1(bc[0] + hw(RIM))} ${RIM} Z`;
  const bk = uid("bowl");
  let body = v.bg + `<g clip-path="${v.clip}">`;
  // the table the bowl stands on
  body += path("M0 300 H480 V400 H0 Z", C.edge, "none", 0) + line([0, 300], [480, 300], C.ink, 3) + strokes([[30, 350, 120, 350], [330, 372, 440, 372]], C.gold, 2);
  body += shadow(bc[0] + 8, BASE + 2, hw(BASE) + 26, 9, C.ink, 0.28);
  body += `</g>`;
  body += `<clipPath id="${bk}"><path d="${bowl}"/></clipPath>`;
  // water: fills the bowl below the water line; the surface is an ellipse
  body += `<g clip-path="url(#${bk})">`;
  body += path(bowl, C.cream, "none", 0, ` opacity="0.35"`);
  body += path(`M0 ${WL} H480 V400 H0 Z`, C.cream, "none", 0, ` opacity="0.55"`) + path(`M0 ${WL} H480 V400 H0 Z`, C.good, "none", 0, ` opacity="0.08"`);
  body += ell(bc[0], WL, hw(WL), 12, C.cream, C.ink, 2, ` opacity="0.6"`);
  // gravel resting on the bottom, and a plant rooted in it
  { const Rg = rng(8); let g = ""; const cols = [C.gold, C.cream, C.plum, C.edge, C.soft];
    for (let i = 0; i < 46; i++) { const x = bc[0] - hw(BASE) - 20 + Rg() * (2 * hw(BASE) + 40), y = BASE - 4 - Rg() * 18 * (1 - Math.abs(x - bc[0]) / 140); g += circ(x, y, 3.5 + Rg() * 3, cols[i % 5], C.ink, 1.5); } body += g; }
  body += path("M150 316 Q142 270 156 226 M150 300 Q128 280 124 256 M152 276 Q172 256 176 236", "none", C.ink, 7) + path("M150 316 Q142 270 156 226 M150 300 Q128 280 124 256 M152 276 Q172 256 176 236", "none", C.good, 4);
  // --- the goldfish, near the surface, tilted up toward the spider on the rim
  const fx = 238, fy = 196, fa = -20;
  let fish = "";
  fish += path("M-50 0 Q-86 -40 -104 -28 Q-92 -6 -98 0 Q-92 8 -104 30 Q-84 40 -50 6 Z", C.glint, C.ink, 3) + path("M-60 -2 L-94 -22 M-62 2 L-96 22 M-62 0 L-98 0", "none", C.gold, 2);
  fish += path("M-20 -30 Q0 -58 26 -34 Z", C.glint, C.ink, 3) + path("M-8 -40 L6 -34", "none", C.gold, 2);
  fish += path("M-10 30 Q0 50 16 32 Z M-40 22 Q-44 40 -28 30 Z", C.glint, C.ink, 2.5);
  fish += ell(0, 0, 58, 34, C.gold, C.ink, 3.5);
  fish += path("M-30 -22 Q0 -34 30 -24", "none", C.glint, 4, ` opacity="0.8"`);
  fish += path("M-24 -4 a8 8 0 0 0 0 12 M-10 -12 a8 8 0 0 0 0 12 M-10 6 a8 8 0 0 0 0 12 M4 -4 a8 8 0 0 0 0 12", "none", C.glint, 2.2);
  fish += path("M12 8 Q2 24 20 26 Z", C.glint, C.ink, 2.5);
  // blank, happy face: big round eye with a small centred pupil, a little open smile
  fish += circ(34, -8, 13, C.cream, C.ink, 3) + circ(35, -8, 4.5, C.ink) + circ(33, -10, 1.6, C.cream);
  fish += path("M48 8 Q54 14 58 6", "none", C.ink, 3) + ell(55, 4, 3.5, 3, C.deep, C.ink, 1.6);
  body += `<g transform="translate(${fx} ${fy}) rotate(${fa})">${fish}</g>`;
  // bubbles rising straight up from its mouth, growing a little as they rise
  body += circ(fx + 56, 170, 3, "none", C.ink, 2) + circ(fx + 57, 154, 4, "none", C.ink, 2) + circ(fx + 56, 138, 5, "none", C.ink, 2);
  body += `</g>`;
  // glass: rim, outline, highlights from a light at the upper left
  body += path(bowl, "none", C.ink, 4);
  body += ell(bc[0], RIM, hw(RIM), 10, "none", C.ink, 3) + ell(bc[0], RIM, hw(RIM) - 4, 7, "none", C.cream, 2, ` opacity="0.8"`);
  body += path(`M${bc[0] - 112} 170 A118 118 0 0 1 ${bc[0] - 56} 112`, "none", C.cream, 7, ` opacity="0.85"`) + path(`M${bc[0] - 118} 206 A120 120 0 0 1 ${bc[0] - 114} 184`, "none", C.cream, 5, ` opacity="0.85"`);
  body += v.ring;
  // --- the tiny spider standing on the rim's front lip, all eight feet on the glass edge, leaning in to talk
  const ST = { x: 257, y: 76, s: 0.19 };
  const rimPt = t => [bc[0] + hw(RIM) * Math.cos(t * Math.PI / 180), RIM + 10 * Math.sin(t * Math.PI / 180)];
  const feet = [30, 40, 50, 60, 70, 80, 90, 100].map(rimPt);
  const SL = planted(ST, [feet[3], feet[2], feet[1], feet[0], feet[4], feet[5], feet[6], feet[7]], [36, 64, 84, 84, 36, 64, 84, 84]);
  body += mini(ST.x, ST.y, ST.s, { lid: "sly", mouth: "grin", look: [-0.6, 0.8] }, { legs: SL });
  // a speech bubble with no words, just an ellipsis
  body += path("M296 48 Q296 26 322 26 Q350 26 350 46 Q350 64 324 64 Q316 64 310 62 L292 72 L300 58 Q296 54 296 48 Z", C.cream, C.ink, 3) + circ(312, 46, 3, C.ink) + circ(323, 46, 3, C.ink) + circ(334, 46, 3, C.ink);
  save("creature-goldfish", VB, "The Goldfish: a round-eyed, blissfully blank goldfish in a glass bowl on a table, listening to a tiny spider talking from the bowl's rim", body);
}
