import { C, n, svg, spider, flatCookie, sparkle, cobweb, stipple, hatch, rng, line } from "./lib.mjs";

// COVER — a moonlit kitchen at spider scale.
// Physics rules this scene obeys: everything stands on a surface (with a contact
// shadow), hangs from a mounted fixture, or is drawn inside a container that
// holds it. Silk lines come down from the ceiling (above the frame) and attach at
// each spider's abdomen, which hangs uppermost.
export function cover() {
  const P = "cv";
  const cy = 640;          // counter front edge
  const CT = cy - 8;       // contact line for things standing on the counter top
  const sy = 474;          // shelf front edge
  const gy = sy - 3;       // contact line for things standing on the shelf

  let s = `<defs>
<linearGradient id="${P}-wall" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${C.ink}"/><stop offset=".34" stop-color="${C.deep}"/><stop offset="1" stop-color="${C.plum}"/>
</linearGradient>
<linearGradient id="${P}-sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${C.deep}"/><stop offset="1" stop-color="${C.soft}"/>
</linearGradient>
<radialGradient id="${P}-moon" cx="50%" cy="50%" r="50%">
  <stop offset=".55" stop-color="${C.goldB}" stop-opacity=".45"/><stop offset="1" stop-color="${C.goldB}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="${P}-beam" x1="0" y1="0" x2="1" y2=".4">
  <stop offset="0" stop-color="${C.cream}" stop-opacity=".2"/><stop offset="1" stop-color="${C.cream}" stop-opacity=".02"/>
</linearGradient>
<radialGradient id="${P}-glow" cx="50%" cy="50%" r="50%">
  <stop offset="0" stop-color="${C.goldB}" stop-opacity=".4"/><stop offset="1" stop-color="${C.goldB}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="${P}-glass" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${C.cream}" stop-opacity=".34"/><stop offset=".3" stop-color="${C.cream}" stop-opacity=".08"/>
  <stop offset=".75" stop-color="${C.cream}" stop-opacity=".05"/><stop offset="1" stop-color="${C.cream}" stop-opacity=".26"/>
</linearGradient>
<linearGradient id="${P}-counter" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${C.plum}"/><stop offset="1" stop-color="${C.deep}"/>
</linearGradient>
<linearGradient id="${P}-steel" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${C.edge}"/><stop offset=".35" stop-color="${C.cream}"/><stop offset="1" stop-color="${C.parch}"/>
</linearGradient>
</defs>`;

  /* ---------------------------------------------------------------- wall */
  s += `<rect width="612" height="792" fill="url(#${P}-wall)"/>`;
  // crown moulding where wall meets ceiling (top edge), quiet under the title
  s += `<path d="M0 10H612" stroke="${C.soft}" stroke-width="3" opacity=".35"/><path d="M0 16H612" stroke="${C.soft}" stroke-width="1.2" opacity=".25"/>`;
  s += cobweb(0, 18, 140, 0, 90, 6, 6, C.soft, 1.1, .32);
  s += cobweb(612, 18, 110, 90, 180, 5, 5, C.soft, 1.1, .26);

  // subway-tile backsplash between counter and shelf/window (brick bond, 40×20)
  let grout = "";
  const bTop = 500, bBot = CT;
  for (let y = bTop, row = 0; y < bBot; y += 20, row++) {
    grout += `M0 ${y}H612`;
    for (let x = (row % 2 ? -20 : 0); x <= 612; x += 40) grout += `M${x} ${y}V${Math.min(y + 20, bBot)}`;
  }
  s += `<rect x="0" y="${bTop}" width="612" height="${bBot - bTop}" fill="${C.soft}" opacity=".32"/>`;
  s += `<path d="${grout}" stroke="${C.ink}" stroke-width="1.1" opacity=".38"/>`;
  s += `<path d="M0 ${bTop}H612" stroke="${C.ink}" stroke-width="2.5" opacity=".5"/>`;
  s += stipple(11, 306, 420, 320, 120, 220, 0.9, C.soft, .3);

  /* ------------------------------------------------------ window (left) */
  const wx = 42, wy = 292, ww = 206, wh = 250;
  s += `<rect x="${wx - 12}" y="${wy - 12}" width="${ww + 24}" height="${wh + 24}" rx="4" fill="${C.plum}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#${P}-sky)" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<clipPath id="${P}-win"><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}"/></clipPath><g clip-path="url(#${P}-win)">`;
  s += `<circle cx="120" cy="366" r="80" fill="url(#${P}-moon)"/>`;
  s += `<circle cx="120" cy="366" r="44" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.5"/>`;
  s += `<circle cx="104" cy="352" r="9" fill="${C.parch}"/><circle cx="136" cy="384" r="6" fill="${C.parch}"/><circle cx="130" cy="350" r="4" fill="${C.parch}"/><circle cx="108" cy="386" r="3.5" fill="${C.parch}"/>`;
  const R = rng(5); let stars = "";
  for (let i = 0; i < 22; i++) { const x = wx + 6 + R() * (ww - 12), y = wy + 6 + R() * (wh - 70); if (Math.hypot(x - 120, y - 366) > 60) stars += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.8 + R() * 1.4)}" fill="${C.goldB}" opacity="${n(.5 + R() * .5)}"/>`; }
  s += stars;
  // neighbours' rooftops with a chimney and lit windows
  s += `<path d="M42 542V492l30-22 30 22v-14h22v30l40-30 40 30V474l24-16 20 16V542z" fill="${C.deep}"/>`;
  s += `<rect x="176" y="446" width="10" height="20" fill="${C.deep}"/>`;
  s += `<rect x="92" y="502" width="8" height="10" fill="${C.goldB}" opacity=".7"/><rect x="186" y="496" width="7" height="9" fill="${C.goldB}" opacity=".55"/><rect x="146" y="508" width="7" height="9" fill="${C.goldB}" opacity=".4"/>`;
  s += `</g>`;
  // muntins
  s += `<path d="M${wx + ww / 2} ${wy}V${wy + wh}M${wx} ${wy + wh / 2}H${wx + ww}" stroke="${C.plum}" stroke-width="9"/>`;
  s += `<path d="M${wx + ww / 2 - 4.5} ${wy}V${wy + wh}M${wx + ww / 2 + 4.5} ${wy}V${wy + wh}M${wx} ${wy + wh / 2 - 4.5}H${wx + ww}M${wx} ${wy + wh / 2 + 4.5}H${wx + ww}" stroke="${C.ink}" stroke-width="2"/>`;
  // sash latch on the meeting rail
  s += `<rect x="${wx + ww / 2 - 9}" y="${wy + wh / 2 - 7}" width="18" height="7" rx="2" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.6"/>`;
  s += `<path d="M58 310h40M58 318h22" stroke="${C.cream}" stroke-width="3" stroke-linecap="round" opacity=".35"/>`;
  // sill, resting on two corbels
  const sillY = wy + wh + 12;
  s += `<path d="M${wx - 22} ${sillY}h${ww + 44}v12h-${ww + 44}z" fill="${C.soft}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  for (const cx of [wx + 10, wx + ww - 10]) s += `<path d="M${cx - 8} ${sillY + 12}h16l-4 14h-8z" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
  // potted plant standing on the sill (pot base on the sill top)
  s += `<ellipse cx="220" cy="${sillY}" rx="16" ry="2.4" fill="${C.ink}" opacity=".35"/>`;
  s += `<path d="M206 ${sillY}l-4 -22h36l-4 22z" fill="${C.ox}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<path d="M200 ${sillY - 22}h40v-5h-40z" fill="${C.oxB}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<path d="M220 ${sillY - 27}q-12 -24 -2 -38q8 12 2 38zM220 ${sillY - 27}q6 -22 20 -26q0 16 -20 26zM220 ${sillY - 27}q-16 -10 -24 -8q6 14 24 8z" fill="${C.good}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
  // little sponge resting on the sill
  s += `<ellipse cx="80" cy="${sillY}" rx="13" ry="2" fill="${C.ink}" opacity=".3"/><rect x="68" y="${sillY - 9}" width="24" height="9" rx="2" fill="${C.goldB}" stroke="${C.ink}" stroke-width="1.8"/><path d="M68 ${sillY - 3}h24" stroke="${C.good}" stroke-width="3"/>`;

  // curtain: rings on a rod; the rod sits in a wall bracket
  s += `<path d="M0 262h58q-6 98 -18 150q-14 70 -6 148H0z" fill="${C.ox}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += line("M16 268q-2 140 4 292M34 268q-4 100 -10 198", 2, C.ink, ` opacity=".45"`);
  s += `<path d="M58 262q-4 60 -14 110" stroke="${C.oxB}" stroke-width="2" fill="none" opacity=".5"/>`;
  s += `<path d="M66 258v14h8v-14z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.8"/>`;          // bracket plate
  s += `<path d="M0 262h78" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/><path d="M0 262h78" stroke="${C.gold}" stroke-width="3.5" stroke-linecap="round"/><circle cx="80" cy="262" r="5" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/>`;
  for (const rx of [10, 30, 50]) s += `<ellipse cx="${rx}" cy="262" rx="4" ry="6" fill="none" stroke="${C.gold}" stroke-width="2"/>`;

  // moonbeam falling from the window across the room
  s += `<path d="M248 300L612 360V792H430L248 552z" fill="url(#${P}-beam)"/>`;

  // wall outlet between window and counter run
  s += `<rect x="276" y="584" width="22" height="32" rx="3" fill="${C.parch}" stroke="${C.ink}" stroke-width="2"/><path d="M283 594v5M291 594v5M283 606v5M291 606v5" stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round"/>`;

  /* ----------------------------------------------------- shelf (right) */
  s += hatch(`${P}-sh`, `<path d="M318 ${sy + 16}H612V${sy + 64}H360z"/>`, 318, sy + 10, 612, sy + 74, 7, 60, C.ink, 1.2, .3);
  // brackets screwed to the wall, supporting the board from below
  for (const [bx, dir] of [[404, 1], [584, -1]]) {
    s += `<path d="M${bx} ${sy + 16}v40q0 -28 ${30 * dir} -40z" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
    s += `<circle cx="${bx + 3 * dir}" cy="${sy + 44}" r="1.8" fill="${C.ink}"/>`;
  }
  s += `<path d="M318 ${sy}l10 -12H618V${sy}z" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<rect x="318" y="${sy}" width="300" height="16" fill="${C.gold}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<path d="M322 ${sy + 3}H612" stroke="${C.goldB}" stroke-width="2.5" opacity=".8"/>`;
  s += line(`M350 ${sy + 9}q20 -3 40 0M430 ${sy + 10}q24 2 50 -1M520 ${sy + 9}q20 -2 40 1`, 1.2, C.ink, ` opacity=".45"`);

  // two mugs standing side by side on the shelf
  for (const [mx, band] of [[344, C.oxB], [376, C.good]]) {
    s += `<ellipse cx="${mx + 14}" cy="${gy}" rx="17" ry="2.6" fill="${C.ink}" opacity=".32"/>`;
    s += `<path d="M${mx} ${gy}v-34h28v34z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += `<ellipse cx="${mx + 14}" cy="${gy - 34}" rx="14" ry="3" fill="${C.edge}" stroke="${C.ink}" stroke-width="2"/>`;
    s += `<path d="M${mx} ${gy - 20}h28" stroke="${band}" stroke-width="4"/>`;
  }
  s += `<path d="M404 ${gy - 28}q12 0 12 10t-12 10" fill="none" stroke="${C.ink}" stroke-width="2.4"/>`;

  // jam jar with a cloth-and-string lid
  s += `<ellipse cx="572" cy="${gy}" rx="24" ry="3" fill="${C.ink}" opacity=".32"/>`;
  s += `<path d="M552 ${gy}v-40q0 -6 6 -6h30q6 0 6 6v40z" fill="${C.ox}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<path d="M550 ${gy - 46}q23 -10 46 0l-4 10h-38z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
  s += `<path d="M554 ${gy - 38}h38" stroke="${C.gold}" stroke-width="2.4"/>`;
  s += `<rect x="558" y="${gy - 30}" width="30" height="16" rx="2" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.8"/><path d="M564 ${gy - 22}h18" stroke="${C.ox}" stroke-width="2"/>`;
  s += `<path d="M556 ${gy - 30}v24" stroke="${C.cream}" stroke-width="3" opacity=".4" stroke-linecap="round"/>`;

  /* --------------------------------- the glass cookie jar (the target) */
  const jx = 466, jw = 124, jh = 112, jr = jw / 2, jry = 10;
  const jBase = gy, jTop = jBase - jh;               // jTop = top of the glass shoulder
  s += `<ellipse cx="${jx}" cy="${jTop + 30}" rx="150" ry="120" fill="url(#${P}-glow)"/>`;
  s += `<ellipse cx="${jx + 6}" cy="${jBase - 2}" rx="${jr + 8}" ry="4" fill="${C.ink}" opacity=".35"/>`;
  // back wall of the glass (seen through the jar)
  const jarBody = `M${jx - jr} ${jBase - jry}V${jTop + 18}q0 -18 18 -18h${jw - 36}q18 0 18 18V${jBase - jry}A${jr} ${jry} 0 0 1 ${jx - jr} ${jBase - jry}z`;
  s += `<path d="${jarBody}" fill="${C.deep}" opacity=".55"/>`;
  s += `<ellipse cx="${jx}" cy="${jBase - jry}" rx="${jr - 3}" ry="${jry - 3}" fill="${C.ink}" opacity=".35"/>`;  // jar floor
  // cookies stacked ON the jar floor: each rests on the one below
  const floor = jBase - 5;
  const stack = (x, count, r, seed) => {
    let out = "", y = floor;
    for (let i = 0; i < count; i++) { out += flatCookie(x + (i % 2 ? 2 : -2), y, r, seed + i, false, { shade: i === 0 }); y -= r * 0.2 + 3; }
    return out;
  };
  s += stack(jx - 26, 5, 22, 11) + stack(jx + 24, 4, 22, 21);
  // a few crumbs lying on the jar floor
  s += `<ellipse cx="${jx - 4}" cy="${floor - 2}" rx="2.4" ry="1.2" fill="${C.gold}"/><ellipse cx="${jx + 44}" cy="${floor - 3}" rx="2" ry="1" fill="${C.gold}"/>`;
  // front glass: tint, highlights, outline, rim
  s += `<path d="${jarBody}" fill="url(#${P}-glass)" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<path d="M${jx - jr + 10} ${jTop + 22}V${jBase - 22}" stroke="${C.cream}" stroke-width="6" opacity=".45" stroke-linecap="round"/>`;
  s += `<path d="M${jx - jr + 22} ${jTop + 26}V${jTop + 60}" stroke="${C.cream}" stroke-width="2.5" opacity=".4" stroke-linecap="round"/>`;
  s += `<path d="M${jx + jr - 10} ${jTop + 30}V${jBase - 30}" stroke="${C.cream}" stroke-width="2.5" opacity=".25" stroke-linecap="round"/>`;
  s += `<path d="M${jx - jr} ${jBase - jry}A${jr} ${jry} 0 0 0 ${jx + jr} ${jBase - jry}" stroke="${C.cream}" stroke-width="1.5" fill="none" opacity=".35"/>`;
  // neck and lid (the lid sits on the neck)
  const neckY = jTop - 8;
  s += `<path d="M${jx - 44} ${jTop + 2}v-10h88v10" fill="${C.deep}" fill-opacity=".4" stroke="${C.ink}" stroke-width="2.6"/>`;
  const lidY = neckY;                                 // bottom edge of the lid band
  s += `<path d="M${jx - 50} ${lidY}v-16a50 8 0 0 1 100 0v16a50 8 0 0 1 -100 0z" fill="${C.blue}" stroke="${C.ink}" stroke-width="2.8"/>`;
  s += `<ellipse cx="${jx}" cy="${lidY - 16}" rx="50" ry="8" fill="${C.blueL}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<path d="M${jx - 12} ${lidY - 18}v-6a12 4 0 0 1 24 0v6a12 4 0 0 1 -24 0z" fill="${C.blue}" stroke="${C.ink}" stroke-width="2.2"/>`;  // knob
  s += `<ellipse cx="${jx}" cy="${lidY - 24}" rx="12" ry="4" fill="${C.blueL}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<path d="M${jx - 40} ${lidY - 10}v8" stroke="${C.cream}" stroke-width="3" opacity=".55" stroke-linecap="round"/>`;
  const knobTop = lidY - 28;
  s += sparkle(544, sy - 160, 7) + sparkle(392, sy - 124, 5);

  /* ------------------------------------------- utensil rail under shelf */
  const railY = 536;
  s += `<path d="M414 ${railY}H602" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><path d="M414 ${railY}H602" stroke="${C.goldB}" stroke-width="3" stroke-linecap="round"/>`;
  for (const bx of [420, 596]) s += `<rect x="${bx - 4}" y="${railY - 9}" width="8" height="18" rx="2" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.8"/>`;
  const hook = x => `<path d="M${x} ${railY - 2}q-6 0 -6 6t6 8" stroke="${C.ink}" stroke-width="2" fill="none"/>`;
  // ladle
  s += hook(446) + `<path d="M446 ${railY + 12}v54" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><path d="M446 ${railY + 12}v54" stroke="${C.edge}" stroke-width="3" stroke-linecap="round"/>`;
  s += `<path d="M430 ${railY + 66}h32a16 14 0 0 1 -32 0z" fill="url(#${P}-steel)" stroke="${C.ink}" stroke-width="2.2"/>`;
  // whisk
  s += hook(500) + `<path d="M500 ${railY + 12}v26" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/><path d="M500 ${railY + 12}v26" stroke="${C.ox}" stroke-width="4" stroke-linecap="round"/>`;
  s += `<path d="M500 ${railY + 38}c-14 10 -14 42 0 46c14 -4 14 -36 0 -46zM500 ${railY + 38}c-6 12 -6 40 0 46c6 -6 6 -34 0 -46z" fill="none" stroke="${C.edge}" stroke-width="1.8"/>`;
  /* ----------------------------------------------------- the crew */
  const RIM = { rim: C.goldB, rimOp: .3 };
  const crew = [
    { x: 356, y: 296, s: .9, hat: "beanie", look: [.8, .6], mark: "dots", mouth: "grin" },
    { x: 572, y: 272, s: .85, hat: "bowtie", look: [-.8, .6], mark: "star", mouth: "o", brow: "up", body: C.soft, hi: C.edge },
    { x: 132, y: 404, s: .85, hat: "goggles", look: [1, .9], mark: "stripe", mouth: "flat", brow: "down" },
  ];
  // the lead hangs over the lid; its front feet rest on the lid top beside the knob
  const lead = { x: jx, y: knobTop - 33, s: 1.05 };
  const threadTop = c => c.y + (-22 - 17) * c.s;
  let th = "";
  for (const c of [...crew, lead]) th += `M${n(c.x)} 0V${n(threadTop(c) + 2)}`;
  s += `<path d="${th}" stroke="${C.goldB}" stroke-width="4" opacity=".16" fill="none"/>`;
  s += `<path d="${th}" stroke="${C.goldB}" stroke-width="1.5" fill="none"/>`;
  s += stipple(21, 450, 420, 150, 120, 40, 1.2, C.cream, .45);   // dust motes in the beam
  for (const c of crew) s += spider({ pose: "dangle", ...RIM, ...c });
  s += spider({
    ...lead, ...RIM, mask: true, look: [0, 1], mouth: "smirk", brow: "down", mark: "chevron", pose: "dangle",
    legOverride: {
      R0: [[9, -6], [20, -2], [18, 30]], L0: [[-9, -6], [-20, -2], [-18, 30]],
      R1: [[12, -2], [34, -4], [36, 34]], L1: [[-12, -2], [-34, -4], [-36, 34]],
    },
  });
  s += sparkle(356, 226, 3.5) + sparkle(132, 300, 3.5) + sparkle(572, 206, 3.5);

  /* --------------------------------------- counter, oven and cabinets */
  s += `<rect x="0" y="${cy}" width="612" height="152" fill="url(#${P}-counter)"/>`;
  s += `<rect x="-4" y="${cy - 10}" width="620" height="22" fill="${C.soft}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<path d="M0 ${cy - 8}H612" stroke="${C.parch}" stroke-width="2" opacity=".5"/>`;
  let units = "";
  // two cupboard doors (left), each with a knob
  for (const [x, knobRight] of [[10, true], [158, false]]) {
    units += `<rect x="${x}" y="${cy + 24}" width="140" height="138" rx="4" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.6"/>`;
    units += `<rect x="${x + 12}" y="${cy + 36}" width="116" height="114" rx="3" fill="none" stroke="${C.ink}" stroke-width="1.6" opacity=".6"/>`;
    units += `<circle cx="${knobRight ? x + 124 : x + 16}" cy="${cy + 50}" r="5" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/>`;
  }
  // oven: control panel with knobs, door with window, and a handle bar on two standoffs
  const ox = 306, ow = 162;
  units += `<rect x="${ox}" y="${cy + 14}" width="${ow}" height="148" rx="4" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.6"/>`;
  units += `<rect x="${ox + 6}" y="${cy + 18}" width="${ow - 12}" height="18" rx="2" fill="${C.ink}" opacity=".5"/>`;
  for (let i = 0; i < 4; i++) units += `<circle cx="${ox + 30 + i * 34}" cy="${cy + 27}" r="5.5" fill="${C.edge}" stroke="${C.ink}" stroke-width="1.6"/><path d="M${ox + 30 + i * 34} ${cy + 23}v4" stroke="${C.ink}" stroke-width="1.5"/>`;
  units += `<rect x="${ox + 10}" y="${cy + 42}" width="${ow - 20}" height="114" rx="4" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.4"/>`;
  units += `<rect x="${ox + 28}" y="${cy + 72}" width="${ow - 56}" height="66" rx="6" fill="${C.ink}" stroke="${C.ink}" stroke-width="2"/>`;
  units += `<path d="M${ox + 36} ${cy + 108}H${ox + ow - 36}M${ox + 36} ${cy + 124}H${ox + ow - 36}" stroke="${C.soft}" stroke-width="1.4" opacity=".6"/>`;
  units += `<path d="M${ox + 34} ${cy + 78}l18 0" stroke="${C.cream}" stroke-width="2.5" opacity=".3" stroke-linecap="round"/>`;
  const barY = cy + 56;
  for (const sx of [ox + 22, ox + ow - 22]) units += `<rect x="${sx - 3}" y="${barY - 2}" width="6" height="10" fill="${C.edge}" stroke="${C.ink}" stroke-width="1.4"/>`;
  units += `<path d="M${ox + 18} ${barY}H${ox + ow - 18}" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/><path d="M${ox + 18} ${barY}H${ox + ow - 18}" stroke="${C.cream}" stroke-width="3.5" stroke-linecap="round"/>`;
  // drawer stack (right)
  for (let i = 0; i < 3; i++) {
    const dy = cy + 24 + i * 47;
    units += `<rect x="476" y="${dy}" width="134" height="42" rx="4" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.6"/>`;
    units += `<path d="M528 ${dy + 16}h30" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><path d="M528 ${dy + 16}h30" stroke="${C.gold}" stroke-width="3" stroke-linecap="round"/>`;
  }
  s += units;
  s += hatch(`${P}-cb`, `<rect x="0" y="${cy + 12}" width="612" height="150"/>`, 0, cy, 612, 792, 8, 70, C.ink, 1.1, .25);
  // tea towel folded over the oven handle: the fold wraps the top of the bar
  const tx = 360;
  s += `<path d="M${tx} ${barY - 4}q0 -6 7 -6h36q7 0 7 6l4 64q-29 8 -58 0z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += `<path d="M${tx + 1} ${barY - 3}h48" stroke="${C.edge}" stroke-width="2.2" opacity=".9"/>`;       // fold crease over the bar
  s += line(`M${tx - 1} ${barY + 42}h54M${tx - 1} ${barY + 50}h55`, 3, C.oxB);
  s += line(`M${tx + 14} ${barY + 4}q2 30 -2 56M${tx + 34} ${barY + 4}q-2 28 2 56`, 1.4, C.edge);

  /* ------------------------------------------------ items on the counter */
  // kettle standing on the counter (right)
  const kx = 574;
  s += `<ellipse cx="${kx}" cy="${CT}" rx="34" ry="3.2" fill="${C.ink}" opacity=".38"/>`;
  s += `<path d="M${kx - 30} ${CT}q-4 -40 10 -54h40q14 14 10 54z" fill="url(#${P}-steel)" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += `<path d="M${kx - 30} ${CT - 36}q-18 -6 -26 -24l6 -3q10 14 22 16" fill="url(#${P}-steel)" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;  // spout
  s += `<path d="M${kx - 16} ${CT - 54}q16 -30 32 0" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><path d="M${kx - 16} ${CT - 54}q16 -30 32 0" fill="none" stroke="${C.ox}" stroke-width="3" stroke-linecap="round"/>`;
  s += `<ellipse cx="${kx}" cy="${CT - 54}" rx="20" ry="4" fill="${C.edge}" stroke="${C.ink}" stroke-width="2"/><circle cx="${kx}" cy="${CT - 58}" r="3.5" fill="${C.ox}" stroke="${C.ink}" stroke-width="1.4"/>`;
  s += `<path d="M${kx - 20} ${CT - 44}q-4 18 0 38" stroke="${C.cream}" stroke-width="4" opacity=".7" fill="none" stroke-linecap="round"/>`;
  // the runaway cookie lying flat, with crumbs, between the cat and the kettle
  s += flatCookie(470, CT + 1, 24, 9, true);
  s += `<ellipse cx="432" cy="${CT}" rx="3" ry="1.5" fill="${C.gold}" stroke="${C.ink}" stroke-width="1"/><ellipse cx="418" cy="${CT + 1}" rx="2.2" ry="1.1" fill="${C.gold}" stroke="${C.ink}" stroke-width=".9"/><ellipse cx="506" cy="${CT}" rx="1.8" ry="1" fill="${C.gold}"/>`;

  /* ------------------------------------------------ the sleeping cat */
  s += `<ellipse cx="220" cy="${CT}" rx="176" ry="10" fill="${C.ink}" opacity=".35"/>`;
  const body = `M58 ${CT}C40 ${cy - 70} 110 ${cy - 128} 200 ${cy - 124}C268 ${cy - 122} 322 ${cy - 100} 344 ${cy - 58}L360 ${CT}Z`;
  s += `<path d="${body}" fill="${C.deep}" stroke="${C.ink}" stroke-width="3.2" stroke-linejoin="round"/>`;
  s += line(`M80 ${cy - 72}C110 ${cy - 118} 170 ${cy - 128} 226 ${cy - 122}C272 ${cy - 118} 306 ${cy - 104} 326 ${cy - 84}`, 4, C.soft);
  s += line(`M150 ${cy - 124}q-8 20 2 34M190 ${cy - 126}q-10 22 0 38M232 ${cy - 122}q-8 20 4 34M110 ${cy - 108}q-2 18 10 28M270 ${cy - 112}q-6 18 6 28`, 5, C.ink, ` opacity=".75"`);
  s += line(`M96 ${CT - 4}q-20 -60 50 -70`, 2.4, C.ink, ` opacity=".6"`);
  // back paw tucked under the haunch, resting on the counter
  s += `<path d="M84 ${CT}q-2 -12 14 -12h18q10 0 10 12z" fill="${C.deep}" stroke="${C.ink}" stroke-width="2.4"/>`;
  // tail wrapped round the front, lying on the counter
  s += `<path d="M66 ${CT - 10}C90 ${CT + 6} 190 ${CT + 8} 262 ${CT}C290 ${CT - 4} 300 ${CT - 20} 290 ${CT - 28}C282 ${CT - 18} 250 ${CT - 16} 200 ${CT - 14}C140 ${CT - 12} 96 ${CT - 20} 66 ${CT - 10}Z" fill="${C.plum}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += line(`M130 ${CT - 12}v14M170 ${CT - 12}v16M210 ${CT - 13}v15M248 ${CT - 10}v12`, 4, C.ink, ` opacity=".6"`);
  s += `<path d="M280 ${CT - 24}q10 -2 10 -6" stroke="${C.parch}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  // both front paws, side by side, resting on the counter
  s += `<path d="M296 ${CT}q0 -14 18 -14h20q10 0 10 14z" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<path d="M322 ${CT}q0 -12 18 -12h18q10 0 10 12z" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += line(`M306 ${CT - 8}v7M316 ${CT - 9}v8M340 ${CT - 7}v6M350 ${CT - 8}v7`, 1.5);
  // head
  const hx = 336, hy = cy - 80;
  s += `<path d="M${hx - 44} ${hy - 12}L${hx - 40} ${hy - 62}L${hx - 12} ${hy - 36}Z" fill="${C.deep}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M${hx + 36} ${hy - 20}L${hx + 50} ${hy - 66}L${hx + 12} ${hy - 38}Z" fill="${C.deep}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M${hx - 36} ${hy - 20}L${hx - 34} ${hy - 48}L${hx - 18} ${hy - 34}ZM${hx + 32} ${hy - 26}L${hx + 42} ${hy - 52}L${hx + 18} ${hy - 36}Z" fill="${C.ox}"/>`;
  s += `<ellipse cx="${hx}" cy="${hy}" rx="54" ry="46" fill="${C.deep}" stroke="${C.ink}" stroke-width="3.2"/>`;
  s += line(`M${hx - 40} ${hy - 26}q20 -22 56 -18`, 3.5, C.soft);
  s += line(`M${hx - 8} ${hy - 44}v12M${hx + 4} ${hy - 44}v12M${hx - 20} ${hy - 40}l4 10`, 3, C.ink, ` opacity=".7"`);
  // muzzle, nose, mouth
  s += `<path d="M${hx - 24} ${hy + 22}q0 -20 24 -20t24 20q-4 18 -24 18t-24 -18z" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += `<path d="M${hx - 6} ${hy + 8}h12l-6 7z" fill="${C.oxB}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
  s += line(`M${hx} ${hy + 15}v5q-6 6 -11 1M${hx} ${hy + 20}q6 6 11 1`, 1.8);
  s += line(`M${hx - 20} ${hy + 16}l-44 -6M${hx - 20} ${hy + 22}l-42 4M${hx + 20} ${hy + 16}l46 -8M${hx + 20} ${hy + 22}l44 2`, 1.4, C.cream, ` opacity=".85"`);
  // TWO eyes, same size and height, symmetric about the nose:
  // left (viewer's) fast asleep — a closed lid; right just opening — a gold sliver
  const eL = hx - 22, eR = hx + 22, ey = hy - 6;
  s += `<path d="M${eL - 13} ${ey}q13 -11 26 0q-13 9 -26 0z" fill="${C.soft}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;   // closed lid
  s += line(`M${eL - 13} ${ey}q13 9 26 0`, 3.2);                                                                                                     // lash line
  s += line(`M${eL - 9} ${ey + 5}l-2 4M${eL} ${ey + 6.5}v4M${eL + 9} ${ey + 5}l2 4`, 1.6);                                                            // lashes
  s += `<path d="M${eR - 13} ${ey}q13 -11 26 0q-13 9 -26 0z" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;       // open eye
  s += `<ellipse cx="${eR + 1}" cy="${ey}" rx="2" ry="4" fill="${C.ink}"/><circle cx="${eR + 4}" cy="${ey - 2.5}" r="1.2" fill="${C.cream}"/>`;
  s += `<path d="M${eR - 13} ${ey}q13 -11 26 0v-4q-13 -9 -26 0z" fill="${C.soft}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;        // heavy upper lid
  s += line(`M${eR + 16} ${ey - 10}l6 -6M${eR + 20} ${ey - 2}l8 -2`, 2, C.goldB);                                                                     // "noticing" ticks

  /* ------------------------------------------------ framing vignette */
  s += `<defs><radialGradient id="${P}-vig" cx="50%" cy="58%" r="75%"><stop offset=".55" stop-color="${C.ink}" stop-opacity="0"/><stop offset="1" stop-color="${C.ink}" stop-opacity=".55"/></radialGradient></defs>`;
  s += `<rect width="612" height="792" fill="url(#${P}-vig)"/>`;
  return svg("0 0 612 792", "A crew of spiders abseils toward a glass cookie jar on a kitchen shelf while the cat sleeps on the counter", s);
}
