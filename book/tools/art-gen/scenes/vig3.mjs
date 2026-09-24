import { C, n, svg, spider, tin, cookie, sparkle, stipple, hatch, rng, line, shadow, stage, die3d, pipsFor } from "./lib.mjs";
import { hand } from "./vig2.mjs";

const V = (title, body) => svg("0 0 900 300", title, body);
const GY = 262;

export function ch_obstacles() {
  const P = "cob";
  let s = stage(P);
  // --- glue trap (left)
  s += `<path d="M70 ${GY}L100 ${GY - 30}H300L290 ${GY}Z" fill="${C.edge}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M96 ${GY - 6}L116 ${GY - 25}H284L276 ${GY - 6}Z" fill="${C.goldB}" stroke="${C.gold}" stroke-width="2"/>`;
  s += line(`M130 ${GY - 16}q20 -4 40 0M200 ${GY - 12}q30 -4 60 -2`, 2.4, C.cream, ` opacity=".9"`);
  s += `<path d="M70 ${GY}H290v8H70z" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.4"/>`;
  // a stuck crumb and a spider tugging its stuck foot free
  s += cookie(250, GY - 18, 10, 3);
  s += spider({ x: 180, y: 186, s: 1.25, look: [-.6, 1], mouth: "worried", brow: "worried", mark: "dots",
    legOverride: { R2: [[13, 3], [34, 20], [30, 58]], R3: [[10, 7], [36, 24], [44, 60]] } });
  s += line(`M218 ${GY - 16}q2 -14 -2 -24M231 ${GY - 14}q4 -12 -4 -22`, 1.6, C.gold);
  s += line("M120 130q-12 -6 -18 -18M110 150l-18 -2", 2.4, C.ink, ` opacity=".5"`);
  // --- motion sensor beam (middle)
  s += `<rect x="352" y="${GY - 170}" width="14" height="170" fill="${C.plum}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<rect x="534" y="${GY - 170}" width="14" height="170" fill="${C.plum}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<rect x="340" y="${GY - 170}" width="38" height="44" rx="6" fill="${C.ink}"/><circle cx="366" cy="${GY - 148}" r="9" fill="${C.oxB}" stroke="${C.cream}" stroke-width="2"/>`;
  s += `<rect x="522" y="${GY - 170}" width="38" height="44" rx="6" fill="${C.ink}"/><circle cx="534" cy="${GY - 148}" r="7" fill="${C.ox}"/>`;
  for (const [y, op] of [[GY - 148, 1], [GY - 104, .9], [GY - 60, .8]]) {
    s += `<path d="M366 ${y}H534" stroke="${C.oxB}" stroke-width="8" opacity=".25"/><path d="M366 ${y}H534" stroke="${C.oxB}" stroke-width="2.6" opacity="${op}"/>`;
    s += `<circle cx="366" cy="${y}" r="4" fill="${C.oxB}"/>`;
  }
  s += `<rect x="342" y="${GY - 110}" width="24" height="12" rx="2" fill="${C.ink}"/><rect x="342" y="${GY - 66}" width="24" height="12" rx="2" fill="${C.ink}"/>`;
  // spider doing the limbo under the lowest beam
  s += spider({ x: 450, y: 232, s: 1.05, r: -12, look: [0, -1], mouth: "o", brow: "up", mark: "chevron", pose: "sprawl", abd: [0, -18, 18, 13] });
  // --- gap between counters (right)
  s += `<rect x="600" y="160" width="100" height="${GY - 160}" fill="${C.plum}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<rect x="780" y="160" width="100" height="${GY - 160}" fill="${C.plum}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<rect x="594" y="150" width="110" height="14" fill="${C.soft}" stroke="${C.ink}" stroke-width="3"/><rect x="776" y="150" width="110" height="14" fill="${C.soft}" stroke="${C.ink}" stroke-width="3"/>`;
  s += hatch(`${P}-gap`, `<rect x="700" y="164" width="80" height="${GY - 164}"/>`, 700, 164, 780, GY, 7, 70, C.ink, 1.4, .5);
  s += `<circle cx="660" cy="200" r="4" fill="${C.gold}"/><circle cx="820" cy="200" r="4" fill="${C.gold}"/>`;
  s += line("M640 150Q720 30 820 146", 2.4, C.ink, ` stroke-dasharray="3 8" opacity=".55"`);
  s += spider({ x: 736, y: 84, s: 1.05, r: 20, look: [1, .6], mouth: "big", brow: "up", mark: "stripe", pose: "sprawl" });
  return V("Obstacles: a glue trap, a motion-sensor beam and a gap between counters", s);
}

export function ch_creatures() {
  const P = "ccr";
  let s = stage(P);
  const sil = C.deep;
  // cat, sitting
  s += `<path d="M120 ${GY}C96 ${GY - 30} 100 ${GY - 110} 150 ${GY - 132}L140 ${GY - 180}L166 ${GY - 158}Q180 ${GY - 162} 194 ${GY - 158}L220 ${GY - 180}L212 ${GY - 132}C236 ${GY - 110} 240 ${GY - 40} 210 ${GY}Z" fill="${sil}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M210 ${GY - 4}q50 4 40 -40q-6 -20 12 -26" stroke="${C.ink}" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M210 ${GY - 4}q50 4 40 -40q-6 -20 12 -26" stroke="${sil}" stroke-width="10" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M160 ${GY - 142}q6 -8 12 0q-6 5 -12 0zM186 ${GY - 142}q6 -8 12 0q-6 5 -12 0z" fill="${C.goldB}"/><ellipse cx="166" cy="${GY - 142}" rx="1.3" ry="3.2" fill="${C.ink}"/><ellipse cx="192" cy="${GY - 142}" rx="1.3" ry="3.2" fill="${C.ink}"/>`;
  s += line(`M152 ${GY - 128}l-24 -2M152 ${GY - 124}l-22 6M206 ${GY - 128}l24 -2M206 ${GY - 124}l22 6`, 1.4, C.soft);
  // dog, sitting, tongue out
  const dx = 360;
  s += `<path d="M${dx - 60} ${GY}C${dx - 70} ${GY - 50} ${dx - 40} ${GY - 110} ${dx - 10} ${GY - 120}L${dx - 30} ${GY - 150}C${dx - 30} ${GY - 196} ${dx + 40} ${GY - 200} ${dx + 50} ${GY - 160}L${dx + 86} ${GY - 150}Q${dx + 96} ${GY - 130} ${dx + 70} ${GY - 122}L${dx + 40} ${GY - 120}C${dx + 50} ${GY - 80} ${dx + 60} ${GY - 40} ${dx + 50} ${GY}Z" fill="${sil}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M${dx - 14} ${GY - 176}q-30 6 -26 50q16 -4 22 -24z" fill="${C.ink}"/>`;
  s += `<circle cx="${dx + 88}" cy="${GY - 148}" r="6" fill="${C.ink}"/>`;
  s += `<path d="M${dx + 56} ${GY - 124}q4 20 14 18q8 -2 2 -20z" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<circle cx="${dx + 30}" cy="${GY - 164}" r="6" fill="${C.goldB}"/><circle cx="${dx + 31}" cy="${GY - 164}" r="3" fill="${C.ink}"/>`;
  s += `<rect x="${dx - 22}" y="${GY - 124}" width="60" height="9" rx="4" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2" transform="rotate(8 ${dx} ${GY - 120})"/><circle cx="${dx + 10}" cy="${GY - 108}" r="5" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.6"/>`;
  s += `<path d="M${dx - 62} ${GY - 10}q-30 -10 -24 -40" stroke="${C.ink}" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M${dx - 62} ${GY - 10}q-30 -10 -24 -40" stroke="${sil}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  // upright vacuum
  const vx = 570;
  s += line(`M${vx + 20} ${GY - 40}L${vx + 44} ${GY - 214}`, 12, C.ink) + line(`M${vx + 20} ${GY - 40}L${vx + 44} ${GY - 214}`, 6, sil);
  s += `<path d="M${vx + 30} ${GY - 214}h36q8 0 8 8v10h-52v-10q0 -8 8 -8z" fill="${sil}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<path d="M${vx - 10} ${GY - 50}C${vx - 20} ${GY - 110} ${vx - 4} ${GY - 170} ${vx + 26} ${GY - 176}C${vx + 60} ${GY - 170} ${vx + 64} ${GY - 110} ${vx + 50} ${GY - 50}Z" fill="${sil}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M${vx - 50} ${GY}V${GY - 30}q0 -22 22 -22h96q22 0 22 22V${GY}Z" fill="${sil}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<circle cx="${vx + 72}" cy="${GY - 32}" r="6" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<circle cx="${vx + 72}" cy="${GY - 32}" r="14" fill="${C.oxB}" opacity=".25"/>`;
  s += line(`M${vx + 8} ${GY - 150}q12 -10 30 -6`, 3, C.soft);
  s += line(`M${vx - 60} ${GY - 14}l-18 -4M${vx - 60} ${GY - 4}h-22`, 2.4, C.ink, ` opacity=".5"`);
  // a child's hand reaching down from the top right
  s += `<g opacity="1">` + hand(724, 176, 1.3).replace(new RegExp(C.parch, "g"), sil).replace(new RegExp(C.cream, "g"), C.soft).replace(new RegExp(C.plum, "g"), C.ox).replace(new RegExp(C.soft + '" stroke-width="10"', "g"), C.oxB + '" stroke-width="10"') + `</g>`;
  // the tiny spider in the middle of it all
  s += spider({ x: 470, y: 238, s: .8, look: [-1, -1], mouth: "worried", brow: "worried", mark: "dots", rim: C.cream, rimOp: .9 });
  s += `<path d="M486 214q3 6 0 9q-3 -3 0 -9z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.2"/>`;
  return V("Silhouettes of a cat, a dog, a vacuum and a child's hand", s);
}

export function ch_phases() {
  const P = "cph";
  let s = stage(P, { ground: false });
  const xs = [110, 280, 450, 620, 790], y = 150;
  // winding silk path connecting the stones
  let d = `M${xs[0]} ${y}`;
  for (let i = 1; i < 5; i++) d += `Q${(xs[i - 1] + xs[i]) / 2} ${i % 2 ? y + 70 : y - 70} ${xs[i]} ${y}`;
  s += line(d, 3, C.gold, ` stroke-dasharray="2 9"`);
  for (let i = 0; i < 4; i++) { const mx = (xs[i] + xs[i + 1]) / 2, my = i % 2 === 0 ? y + 35 : y - 35; s += `<path d="M${mx - 7} ${my - 7}l10 7-10 7" stroke="${C.gold}" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; }
  xs.forEach(x => { s += shadow(x + 6, y + 60, 50, 6); s += `<circle cx="${x}" cy="${y}" r="56" fill="${C.cream}" stroke="${C.ink}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="48" fill="none" stroke="${C.edge}" stroke-width="3"/>`; });
  // pips above each stone mark the order
  xs.forEach((x, i) => { for (let k = 0; k <= i; k++) s += `<circle cx="${x - i * 6 + k * 12}" cy="${y - 72}" r="4" fill="${C.plum}"/>`; });
  // 1 the Score: an envelope with a wax seal
  { const x = xs[0]; s += `<rect x="${x - 32}" y="${y - 22}" width="64" height="44" rx="3" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.8"/><path d="M${x - 32} ${y - 22}l32 26 32 -26" fill="none" stroke="${C.ink}" stroke-width="2.8" stroke-linejoin="round"/><circle cx="${x}" cy="${y + 4}" r="9" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2.2"/>`; }
  // 2 Planning: a rolled blueprint and pencil
  { const x = xs[1]; s += `<rect x="${x - 34}" y="${y - 20}" width="60" height="40" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.8"/>`;
    s += line(`M${x - 26} ${y + 8}q14 -22 30 -6t14 -10`, 2.4, C.goldB, ` stroke-dasharray="2 5"`) + `<path d="M${x + 12} ${y - 14}l8 8M${x + 20} ${y - 14}l-8 8" stroke="${C.oxB}" stroke-width="3" stroke-linecap="round"/>`;
    s += `<ellipse cx="${x + 30}" cy="${y}" rx="8" ry="22" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.8"/>`; }
  // 3 the Heist: a cookie, grabbed
  { const x = xs[2]; s += cookie(x, y + 2, 28, 5, true); s += sparkle(x + 28, y - 26, 7); }
  // 4 the Escape: a spider zipping down a line toward an exit
  { const x = xs[3]; s += line(`M${x - 30} ${y - 46}L${x + 26} ${y + 30}`, 2, C.gold);
    s += spider({ x: x + 2, y: y + 6, s: .72, r: -36, look: [1, 1], mouth: "big", brow: "up", mark: "stripe", pose: "tuck" });
    s += line(`M${x - 34} ${y + 10}l-12 4M${x - 30} ${y + 24}l-14 2`, 2.4, C.ink, ` opacity=".5"`); }
  // 5 the Debrief: a loot sack and two thimble toasts
  { const x = xs[4]; s += `<path d="M${x - 26} ${y + 28}q-10 -30 12 -42l-6 -10h20l-6 10q24 12 12 42z" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.8" stroke-linejoin="round"/>`;
    s += line(`M${x - 12} ${y - 14}h20`, 3, C.ox) + `<circle cx="${x - 10}" cy="${y + 8}" r="6" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.6"/>`;
    s += `<path d="M${x + 16} ${y + 26}l-2 -24h16l-2 24z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${x + 30} ${y + 24}l2 -22h14l-2 22z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round" transform="rotate(12 ${x + 38} ${y + 14})"/>`;
    s += sparkle(x + 30, y - 12, 6); }
  return V("Five steps from the briefing to the getaway", s);
}

export function ch_alert_play() {
  const P = "cap";
  let s = stage(P);
  // wide VU-style meter panel
  const cx = 450, cy = 250, R = 190;
  s += `<rect x="226" y="36" width="448" height="${GY - 36}" rx="14" fill="${C.plum}" stroke="${C.ink}" stroke-width="3.2"/>`;
  s += `<rect x="244" y="52" width="412" height="${GY - 72}" rx="8" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<clipPath id="${P}-face"><rect x="244" y="52" width="412" height="${GY - 72}" rx="8"/></clipPath><g clip-path="url(#${P}-face)">`;
  const ang = t => -62 + 124 * t; // t 0..1
  const pt = (a, r) => [cx + Math.sin(a * Math.PI / 180) * r, cy - Math.cos(a * Math.PI / 180) * r];
  const seg = (t0, t1, col) => { const [a, b] = [pt(ang(t0), R - 44), pt(ang(t1), R - 44)]; return `<path d="M${n(a[0])} ${n(a[1])}A${R - 44} ${R - 44} 0 0 1 ${n(b[0])} ${n(b[1])}" stroke="${col}" stroke-width="22" fill="none"/>`; };
  s += seg(0, .27, C.good) + seg(.27, .45, C.gold) + seg(.45, .63, C.oxB) + seg(.63, 1, C.ox);
  let tk = ""; for (let k = 0; k <= 10; k++) { const a = ang(k / 10), [p, q] = [pt(a, R - 62), pt(a, R - 74 - (k % 5 ? 0 : 8))]; tk += `M${n(p[0])} ${n(p[1])}L${n(q[0])} ${n(q[1])}`; }
  s += line(tk, 2.6);
  // ghost needles showing the climb
  for (const [t, op] of [[.1, .12], [.3, .18], [.5, .26]]) { const p = pt(ang(t), R - 40); s += line(`M${cx} ${cy}L${n(p[0])} ${n(p[1])}`, 4, C.ink, ` opacity="${op}"`); }
  const tn = .7, p = pt(ang(tn), R - 36);
  s += line(`M${cx} ${cy}L${n(p[0])} ${n(p[1])}`, 7, C.ink) + line(`M${cx} ${cy}L${n(p[0])} ${n(p[1])}`, 3, C.oxB);
  // climb arrow
  const a0 = pt(ang(.35), R - 16), a1 = pt(ang(.62), R - 16);
  s += `<path d="M${n(a0[0])} ${n(a0[1])}A${R - 16} ${R - 16} 0 0 1 ${n(a1[0])} ${n(a1[1])}" stroke="${C.ink}" stroke-width="3" fill="none" stroke-dasharray="4 6" opacity=".7"/>`;
  s += `</g>`;
  s += `<path d="M${cx - 40} ${GY - 20}a40 40 0 0 1 80 0z" fill="${C.plum}" stroke="${C.ink}" stroke-width="3"/><circle cx="${cx}" cy="${GY - 24}" r="8" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += `<circle cx="${n(a1[0] + 6)}" cy="${n(a1[1] + 2)}" r="0"/>`;
  // spider clinging to the needle tip, hauling it back down
  s += spider({ x: n(p[0] + 34), y: n(p[1] + 26), s: 1.05, r: 28, look: [-1, -.2], mouth: "worried", brow: "worried", mark: "chevron",
    legOverride: { L0: [[-9, -6], [-26, -18], [-34, -26]], L1: [[-12, -2], [-30, -12], [-36, -22]] } }).replace(/translate\(([^ ]+) ([^)]+)\)/, "translate($1 $2)");
  // a Storyteller's die nudging the Alert up, and an ox alarm dot
  s += die3d(160, 222, 60, 6, { r: -12, hot: true, glint: true });
  s += line("M200 160q20 -30 40 -24", 2.4, C.ink, ` stroke-dasharray="3 6" opacity=".6"`);
  s += `<circle cx="720" cy="80" r="16" fill="${C.oxB}" stroke="${C.ink}" stroke-width="3"/><circle cx="720" cy="80" r="30" fill="${C.oxB}" opacity=".18"/>`;
  s += line("M720 40v-14M752 56l10 -8M688 56l-10 -8M760 84h14", 3, C.oxB);
  s += `<rect x="710" y="96" width="20" height="10" fill="${C.ink}"/><path d="M720 106V${GY}" stroke="${C.ink}" stroke-width="5"/>`;
  return V("An Alert meter with its needle climbing", s);
}

export function ch_heists() {
  const P = "chs";
  let s = stage(P);
  const win = (x, y, w, h, lit = true) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${lit ? C.goldB : C.deep}" stroke="${C.ink}" stroke-width="2.2"/>`;
  // house
  { const x = 110; s += `<rect x="${x - 58}" y="${GY - 100}" width="116" height="100" fill="${C.parch}" stroke="${C.ink}" stroke-width="3"/>`;
    s += `<path d="M${x - 72} ${GY - 96}L${x} ${GY - 160}L${x + 72} ${GY - 96}Z" fill="${C.ox}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<rect x="${x + 26}" y="${GY - 160}" width="18" height="36" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += `<rect x="${x - 14}" y="${GY - 54}" width="28" height="54" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.6"/><circle cx="${x + 8}" cy="${GY - 26}" r="2.6" fill="${C.gold}"/>`;
    s += win(x - 48, GY - 82, 26, 24) + win(x + 22, GY - 82, 26, 24, false);
    s += `<circle cx="${x}" cy="${GY - 118}" r="10" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.2"/><circle cx="${x}" cy="${GY - 118}" r="4" fill="${C.goldB}"/>`; }
  // office tower
  { const x = 280; s += `<rect x="${x - 50}" y="${GY - 200}" width="100" height="200" fill="${C.soft}" stroke="${C.ink}" stroke-width="3"/>`;
    s += `<rect x="${x - 56}" y="${GY - 208}" width="112" height="12" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.6"/>`;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) s += win(x - 38 + c * 28, GY - 188 + r * 26, 20, 16, (r * 3 + c) % 4 === 1);
    s += `<rect x="${x - 16}" y="${GY - 30}" width="32" height="30" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += line(`M${x} ${GY - 208}v-20`, 3) + `<circle cx="${x}" cy="${GY - 230}" r="3.6" fill="${C.oxB}"/>`; }
  // pet store: awning + fishbowl
  { const x = 450; s += `<rect x="${x - 64}" y="${GY - 120}" width="128" height="120" fill="${C.parch}" stroke="${C.ink}" stroke-width="3"/>`;
    s += `<rect x="${x - 70}" y="${GY - 134}" width="140" height="18" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.6"/>`;
    let aw = `M${x - 70} ${GY - 116}`; for (let k = 0; k < 7; k++) aw += `h20v14a10 10 0 0 1 -20 0z m20 0`;
    let stripes = ""; for (let k = 0; k < 7; k++) stripes += `<path d="M${x - 70 + k * 20} ${GY - 116}h20v14a10 10 0 0 1 -20 0z" fill="${k % 2 ? C.cream : C.good}" stroke="${C.ink}" stroke-width="2"/>`;
    s += stripes;
    s += `<rect x="${x - 54}" y="${GY - 88}" width="64" height="52" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += `<circle cx="${x - 22}" cy="${GY - 58}" r="17" fill="${C.cream}" fill-opacity=".8" stroke="${C.ink}" stroke-width="2.2"/><path d="M${x - 30} ${GY - 58}q6 -6 12 0q-6 6 -12 0zM${x - 18} ${GY - 58}l6 -5v10z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.4"/>`;
    s += `<rect x="${x + 20}" y="${GY - 60}" width="30" height="60" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += `<path d="M${x - 10} ${GY - 110}q0 -10 8 -10q8 0 8 10" fill="none" stroke="${C.ink}" stroke-width="0"/>`;
    // paw print sign
    s += `<circle cx="${x}" cy="${GY - 125}" r="4" fill="${C.goldB}"/><circle cx="${x - 7}" cy="${GY - 131}" r="2" fill="${C.goldB}"/><circle cx="${x}" cy="${GY - 133}" r="2" fill="${C.goldB}"/><circle cx="${x + 7}" cy="${GY - 131}" r="2" fill="${C.goldB}"/>`; }
  // library: pediment + columns + books
  { const x = 625; s += `<path d="M${x - 76} ${GY - 136}L${x} ${GY - 178}L${x + 76} ${GY - 136}Z" fill="${C.parch}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<rect x="${x - 76}" y="${GY - 136}" width="152" height="12" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.6"/>`;
    s += `<rect x="${x - 66}" y="${GY - 124}" width="132" height="112" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.6"/>`;
    // books glimpsed between columns
    const R = rng(3); let bk = "";
    for (let bx = x - 60; bx < x + 60; bx += 7) { const h = 16 + R() * 10; bk += `<rect x="${bx}" y="${n(GY - 52 - h)}" width="6" height="${n(h)}" fill="${[C.ox, C.gold, C.good, C.soft][Math.floor(R() * 4)]}"/>`; }
    s += bk + line(`M${x - 66} ${GY - 52}h132`, 2.4, C.gold);
    for (let c = 0; c < 5; c++) s += `<rect x="${x - 62 + c * 30}" y="${GY - 124}" width="14" height="112" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += `<rect x="${x - 82}" y="${GY - 12}" width="164" height="12" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.6"/>`;
    s += `<circle cx="${x}" cy="${GY - 152}" r="8" fill="${C.cream}" stroke="${C.ink}" stroke-width="2"/>` + line(`M${x} ${GY - 152}v-5M${x} ${GY - 152}h4`, 1.6); }
  // restaurant: awning + plate sign + cloche in window
  { const x = 800; s += `<rect x="${x - 60}" y="${GY - 118}" width="120" height="118" fill="${C.oxB}" stroke="${C.ink}" stroke-width="3"/>`;
    let stripes = ""; for (let k = 0; k < 6; k++) stripes += `<path d="M${x - 66 + k * 22} ${GY - 110}h22l-4 22h-22z" fill="${k % 2 ? C.cream : C.ox}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<rect x="${x - 66}" y="${GY - 122}" width="132" height="12" fill="${C.ox}" stroke="${C.ink}" stroke-width="2.4"/>` + stripes;
    s += `<rect x="${x - 50}" y="${GY - 76}" width="60" height="44" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += `<path d="M${x - 38} ${GY - 42}q0 -22 18 -22t18 22z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.2"/><circle cx="${x - 20}" cy="${GY - 66}" r="2.6" fill="${C.ink}"/><path d="M${x - 42} ${GY - 42}h44" stroke="${C.ink}" stroke-width="2.6"/>`;
    s += `<rect x="${x + 18}" y="${GY - 64}" width="30" height="64" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.4"/>`;
    s += `<circle cx="${x}" cy="${GY - 142}" r="16" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.4"/><circle cx="${x}" cy="${GY - 142}" r="9" fill="none" stroke="${C.edge}" stroke-width="2"/>`;
    s += line(`M${x - 24} ${GY - 154}v24M${x + 24} ${GY - 154}v24`, 3) + line(`M${x - 28} ${GY - 154}v8M${x - 20} ${GY - 154}v8`, 1.6) ;
    s += line(`M${x} ${GY - 158}v-8`, 2); }
  // a tiny spider on the office roof, looking out over the job board
  s += spider({ x: 250, y: GY - 222, s: .5, look: [1, 0], mouth: "smirk", mark: "dots", pose: "stand" });
  s += sparkle(540, 70, 6) + sparkle(160, 80, 4) + sparkle(730, 90, 5);
  return V("Five tiny locations: a house, an office, a pet store, a library and a restaurant", s);
}

export function ch_tables() {
  const P = "ctb";
  let s = stage(P);
  // scroll with six entries, each keyed to a d6 face
  s += `<path d="M300 44H640V244H300Z" fill="${C.cream}" stroke="${C.ink}" stroke-width="3"/>`;
  s += hatch(`${P}-sc`, `<rect x="300" y="44" width="340" height="200"/>`, 300, 44, 640, 244, 9, 80, C.edge, 1, .6);
  s += `<path d="M300 244V${GY + 2}q0 10 -12 10H640q12 0 12 -10V244" fill="${C.parch}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<rect x="286" y="30" width="368" height="22" rx="11" fill="${C.parch}" stroke="${C.ink}" stroke-width="3"/><circle cx="286" cy="41" r="11" fill="${C.edge}" stroke="${C.ink}" stroke-width="3"/><circle cx="654" cy="41" r="11" fill="${C.edge}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<rect x="286" y="236" width="368" height="22" rx="11" fill="${C.parch}" stroke="${C.ink}" stroke-width="3"/><circle cx="286" cy="247" r="11" fill="${C.edge}" stroke="${C.ink}" stroke-width="3"/><circle cx="654" cy="247" r="11" fill="${C.edge}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<path d="M314 ${70 + 3 * 28 - 14}h318v28H314z" fill="${C.goldB}" opacity=".4"/>`;
  const R = rng(17);
  for (let i = 0; i < 6; i++) {
    const y = 70 + i * 28;
    s += `<rect x="322" y="${y - 10}" width="20" height="20" rx="4" fill="${i === 3 ? C.plum : C.cream}" stroke="${C.ink}" stroke-width="2"/>`;
    for (const [px, py] of pipsFor(i + 1, 5)) s += `<circle cx="${332 + px}" cy="${y + py}" r="1.9" fill="${i === 3 ? C.goldB : C.ink}"/>`;
    // squiggle "names"
    let d = `M356 ${y + 2}`; const L = 130 + R() * 120; for (let x = 0; x < L; x += 12) d += `q3 ${-6 - R() * 4} 6 0t6 0`;
    s += line(d, 2.2, i === 3 ? C.plum : C.ink, i === 3 ? "" : ` opacity=".7"`);
  }
  // dice on the left
  s += shadow(170, GY, 70, 7);
  s += die3d(140, 220, 64, 4, { r: -8, hot: true, glint: true });
  s += die3d(214, 230, 50, 2, { r: 14 });
  s += line("M100 150q30 -40 60 -10", 2.2, C.ink, ` stroke-dasharray="3 7" opacity=".5"`);
  // quill on the right, with an inkpot
  s += `<path d="M760 ${GY}v-30q0 -12 12 -12h28q12 0 12 12v30z" fill="${C.ink}"/><rect x="772" y="${GY - 50}" width="28" height="10" fill="${C.deep}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<path d="M790 ${GY - 46}C770 ${GY - 100} 780 ${GY - 170} 850 ${GY - 220}C846 ${GY - 160} 826 ${GY - 110} 790 ${GY - 46}Z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += line(`M790 ${GY - 46}Q810 ${GY - 140} 850 ${GY - 220}`, 2, C.ink);
  s += line(`M800 ${GY - 110}l-14 -8M806 ${GY - 136}l-14 -10M816 ${GY - 162}l-12 -12M808 ${GY - 96}l12 -14M818 ${GY - 124}l12 -16`, 1.6, C.edge);
  // spider abseiling beside the scroll, reading along
  s += line("M704 0V92", 1.6, C.gold);
  s += spider({ x: 704, y: 130, s: .95, look: [-1, .3], mouth: "grin", mark: "star", pose: "dangle", brow: "up" });
  return V("Dice and a scroll of random names", s);
}

export function ch_quickref() {
  const P = "cqr";
  let s = stage(P);
  // corkboard patch
  s += `<rect x="190" y="18" width="520" height="${GY - 26}" rx="6" fill="${C.gold}" stroke="${C.ink}" stroke-width="3"/>`;
  s += stipple(33, 450, 140, 250, 116, 420, 1.3, C.ink, .28);
  s += stipple(34, 450, 140, 250, 116, 200, 1.4, C.goldB, .6);
  s += `<rect x="178" y="8" width="544" height="${GY - 6}" rx="10" fill="none" stroke="${C.plum}" stroke-width="12"/><rect x="172" y="2" width="556" height="${GY + 6}" rx="12" fill="none" stroke="${C.ink}" stroke-width="3"/><rect x="184" y="14" width="532" height="${GY - 18}" rx="8" fill="none" stroke="${C.ink}" stroke-width="2.4"/>`;
  // index card, tilted
  s += `<g transform="rotate(-4 450 140)">`;
  s += `<rect x="300" y="52" width="300" height="180" fill="${C.ink}" opacity=".22" transform="translate(6 7)"/>`;
  s += `<rect x="300" y="52" width="300" height="180" fill="${C.cream}" stroke="${C.ink}" stroke-width="3"/>`;
  s += line("M300 84H600", 2.4, C.oxB);
  let rl = ""; for (let y = 108; y < 232; y += 22) rl += `M300 ${y}H600`; s += line(rl, 1.2, C.soft, ` opacity=".45"`);
  // mini icons + squiggles on the lines
  s += `<rect x="318" y="92" width="16" height="16" rx="3" fill="${C.plum}" stroke="${C.ink}" stroke-width="1.6"/><circle cx="322.5" cy="96.5" r="1.6" fill="${C.goldB}"/><circle cx="329.5" cy="103.5" r="1.6" fill="${C.goldB}"/><circle cx="326" cy="100" r="1.6" fill="${C.goldB}"/>`;
  s += `<path d="M318 132a9 9 0 0 1 18 0" stroke="${C.oxB}" stroke-width="4" fill="none"/><path d="M327 132l5 -6" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<rect x="318" y="140" width="18" height="12" rx="2" fill="${C.good}" stroke="${C.ink}" stroke-width="1.6"/>`;
  s += cookie(327, 172, 8, 2);
  s += `<rect x="318" y="184" width="18" height="18" fill="${C.edge}" stroke="${C.ink}" stroke-width="1.6"/><path d="M318 190h18M318 196h18M324 184v18M330 184v18" stroke="${C.ink}" stroke-width="1"/>`;
  const R = rng(8);
  for (let i = 0; i < 5; i++) { const y = 102 + i * 22; let d = `M346 ${y}`; const L = 120 + R() * 110; for (let x = 0; x < L; x += 12) d += `q3 ${-5 - R() * 3} 6 0t6 0`; s += line(d, 2, C.ink, ` opacity=".65"`); }
  s += line("M318 70q10 -8 20 0t20 0 20 0 20 0 20 0", 2.6, C.plum);
  s += `</g>`;
  // thumbtack
  s += `<ellipse cx="452" cy="72" rx="15" ry="5" fill="${C.ink}" opacity=".3"/>`;
  s += `<path d="M444 56h14l4 12h-22z" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<ellipse cx="451" cy="54" rx="13" ry="7" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2.4"/><ellipse cx="447" cy="52" rx="4" ry="2" fill="${C.cream}" opacity=".8"/>`;
  s += `<ellipse cx="451" cy="68" rx="14" ry="4" fill="${C.ox}" stroke="${C.ink}" stroke-width="2.2"/>`;
  // spider on the cork, reading the card
  s += spider({ x: 652, y: 176, s: .95, look: [-1, -.3], mouth: "smirk", mark: "chevron", brow: "up", rim: C.cream, rimOp: .6,
    legOverride: { L0: [[-9, -6], [-22, -22], [-38, -30]] } });
  return V("An index card pinned by a thumbtack", s);
}
