import { C, n, svg, spider, tin, flatCookie, sparkle, cobweb, stipple, hatch, rng, line } from "./lib.mjs";

export function cover() {
  const P = "cv";
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
  <stop offset="0" stop-color="${C.cream}" stop-opacity=".22"/><stop offset="1" stop-color="${C.cream}" stop-opacity=".02"/>
</linearGradient>
<radialGradient id="${P}-tinglow" cx="50%" cy="50%" r="50%">
  <stop offset="0" stop-color="${C.goldB}" stop-opacity=".42"/><stop offset="1" stop-color="${C.goldB}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="${P}-counter" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${C.plum}"/><stop offset="1" stop-color="${C.deep}"/>
</linearGradient>
</defs>`;
  // 1. wall
  s += `<rect width="612" height="792" fill="url(#${P}-wall)"/>`;
  // faint cobweb in the top-left corner, very quiet so the title stays calm
  s += cobweb(0, 0, 150, 0, 90, 6, 6, C.soft, 1.2, .35);
  // backsplash tiles (lower wall)
  let tiles = "";
  for (let y = 360; y <= 640; y += 46) tiles += `M0 ${y}H612`;
  for (let x = 0; x <= 612; x += 46) tiles += `M${x} 360V640`;
  s += `<path d="${tiles}" stroke="${C.soft}" stroke-width="1.2" opacity=".28"/>`;
  s += `<path d="M0 360H612" stroke="${C.ink}" stroke-width="3" opacity=".5"/>`;
  s += stipple(11, 306, 500, 320, 140, 260, 0.9, C.soft, .35);

  // 2. window with the moon (left)
  const wx = 42, wy = 292, ww = 206, wh = 262;
  s += `<rect x="${wx - 12}" y="${wy - 12}" width="${ww + 24}" height="${wh + 24}" rx="4" fill="${C.plum}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#${P}-sky)" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<clipPath id="${P}-win"><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}"/></clipPath><g clip-path="url(#${P}-win)">`;
  s += `<circle cx="120" cy="366" r="80" fill="url(#${P}-moon)"/>`;
  s += `<circle cx="120" cy="366" r="44" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.5"/>`;
  s += `<circle cx="104" cy="352" r="9" fill="${C.parch}"/><circle cx="136" cy="384" r="6" fill="${C.parch}"/><circle cx="130" cy="350" r="4" fill="${C.parch}"/><circle cx="108" cy="386" r="3.5" fill="${C.parch}"/>`;
  const R = rng(5); let stars = "";
  for (let i = 0; i < 22; i++) { const x = wx + 6 + R() * (ww - 12), y = wy + 6 + R() * (wh - 12); if (Math.hypot(x - 120, y - 366) > 60) stars += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.8 + R() * 1.4)}" fill="${C.goldB}" opacity="${n(.5 + R() * .5)}"/>`; }
  s += stars + sparkle(206, 318, 5) + sparkle(70, 470, 4);
  // rooftops of the neighbours, far away
  s += `<path d="M42 554V500l30-22 30 22v-14h22v30l40-30 40 30V480l24-16 20 16V554z" fill="${C.deep}"/>`;
  s += `<rect x="92" y="512" width="8" height="10" fill="${C.goldB}" opacity=".7"/><rect x="186" y="504" width="7" height="9" fill="${C.goldB}" opacity=".55"/>`;
  s += `</g>`;
  // muntins + sash
  s += `<path d="M${wx + ww / 2} ${wy}V${wy + wh}M${wx} ${wy + wh / 2}H${wx + ww}" stroke="${C.plum}" stroke-width="9"/>`;
  s += `<path d="M${wx + ww / 2} ${wy}V${wy + wh}M${wx} ${wy + wh / 2}H${wx + ww}" stroke="${C.ink}" stroke-width="9" fill="none" opacity="0"/>`;
  s += `<path d="M${wx + ww / 2 - 4.5} ${wy}V${wy + wh}M${wx + ww / 2 + 4.5} ${wy}V${wy + wh}M${wx} ${wy + wh / 2 - 4.5}H${wx + ww}M${wx} ${wy + wh / 2 + 4.5}H${wx + ww}" stroke="${C.ink}" stroke-width="2"/>`;
  // glass glints
  s += `<path d="M58 310l40 -0M58 318l22 0" stroke="${C.cream}" stroke-width="3" stroke-linecap="round" opacity=".35"/>`;
  // sill
  s += `<path d="M${wx - 22} ${wy + wh + 12}h${ww + 44}v12h-${ww + 44}z" fill="${C.soft}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  // curtain on the left
  s += `<path d="M0 262h58q-6 98 -18 150q-14 70 -6 148H0z" fill="${C.ox}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += line("M16 268q-2 140 4 298M34 268q-4 100 -10 198", 2, C.ink, ` opacity=".45"`);
  s += `<path d="M0 262h72" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/><path d="M0 262h72" stroke="${C.gold}" stroke-width="3.5" stroke-linecap="round"/><circle cx="74" cy="262" r="5" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/>`;
  // curtain rings round the rod
  for (const rx of [10, 30, 50]) s += `<ellipse cx="${rx}" cy="262" rx="4" ry="6" fill="none" stroke="${C.gold}" stroke-width="2"/>`;
  // little potted plant on the sill
  s += `<path d="M204 566l4 -22h24l4 22z" fill="${C.ox}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<path d="M220 544q-10 -22 -2 -34q6 10 2 34zM220 544q6 -20 18 -24q0 14 -18 24zM220 544q-14 -10 -22 -8q6 12 22 8z" fill="${C.good}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;

  // 3. moonbeam
  s += `<path d="M248 300L612 360V792H430L248 556z" fill="url(#${P}-beam)"/>`;

  // 4. high shelf with the tin
  const sy = 474; // front edge of the shelf top; objects stand on the strip just above it
  // shadow under shelf
  s += hatch(`${P}-sh`, `<path d="M318 ${sy + 16}H612V${sy + 70}H360z"/>`, 318, sy + 10, 612, sy + 80, 7, 60, C.ink, 1.2, .35);
  // brackets
  s += `<path d="M404 ${sy + 14}v44q0 -30 30 -44z" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += `<path d="M576 ${sy + 14}v44q0 -30 -30 -44z" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += `<path d="M318 ${sy}l10 -12H618V${sy}z" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<rect x="318" y="${sy}" width="300" height="16" fill="${C.gold}" stroke="${C.ink}" stroke-width="3"/>`;
  const gy = sy - 3; // where things on the shelf touch it
  s += `<path d="M322 ${sy + 3}H612" stroke="${C.goldB}" stroke-width="2.5" opacity=".8"/>`;
  s += line(`M350 ${sy + 9}q20 -3 40 0M430 ${sy + 10}q24 2 50 -1M520 ${sy + 9}q20 -2 40 1`, 1.2, C.ink, ` opacity=".45"`);
  // mugs on the left of the shelf (stacked, the top one resting on the lower rim)
  s += `<ellipse cx="354" cy="${gy}" rx="24" ry="3" fill="${C.ink}" opacity=".3"/><ellipse cx="572" cy="${gy}" rx="26" ry="3" fill="${C.ink}" opacity=".3"/>`;
  s += `<path d="M334 ${gy}v-40h36v40z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += `<path d="M370 ${gy - 32}q14 0 14 12t-14 12" fill="none" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<path d="M334 ${gy - 26}h36" stroke="${C.oxB}" stroke-width="5"/>`;
  s += `<path d="M338 ${gy - 40}v-34h30v34z" fill="${C.edge}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<path d="M368 ${gy - 68}q11 0 11 10t-11 10" fill="none" stroke="${C.ink}" stroke-width="2.4"/>`;
  // jam jar on the right
  s += `<path d="M548 ${gy}v-44q0 -6 6 -6h34q6 0 6 6v44z" fill="${C.ox}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += `<rect x="552" y="${gy - 62}" width="38" height="14" rx="3" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += `<path d="M556 ${gy - 62}l4 -6h22l4 6" fill="${C.parch}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<rect x="556" y="${gy - 34}" width="30" height="18" rx="2" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.8"/>`;
  s += `<path d="M562 ${gy - 25}h18" stroke="${C.ox}" stroke-width="2"/>`;
  s += `<path d="M554 ${gy - 40}v28" stroke="${C.cream}" stroke-width="3" opacity=".4" stroke-linecap="round"/>`;
  // the tin (target) glowing in the beam
  // big enough that the crew are clearly tiny beside it
  s += `<ellipse cx="466" cy="${sy - 70}" rx="140" ry="120" fill="url(#${P}-tinglow)"/>`;
  s += tin(466, gy + 1, 128, 100, { sw: 3 });
  s += sparkle(540, sy - 150, 7) + sparkle(392, sy - 118, 5) + sparkle(538, sy - 60, 4);

  // 5. the crew on silk lines
  const RIM = { rim: C.goldB, rimOp: .3 };
  const crew = [
    { x: 356, y: 296, s: .9, hat: "beanie", look: [.8, .6], mark: "dots", mouth: "grin" },
    { x: 572, y: 272, s: .85, hat: "bowtie", look: [-.8, .6], mark: "star", mouth: "o", brow: "up", body: C.soft, hi: C.edge },
    { x: 132, y: 404, s: .85, hat: "goggles", look: [1, .9], mark: "stripe", mouth: "flat", brow: "down" },
  ];
  // the lead hangs just over the lid, front feet touching it (lid top ellipse ~ sy-143)
  const lead = { x: 466, y: sy - 176, s: 1.05 };
  const threadTop = c => c.y + (-22 - 17) * c.s;
  let th = "";
  for (const c of [...crew, lead]) th += `M${n(c.x)} 0V${n(threadTop(c) + 2)}`;
  s += `<path d="${th}" stroke="${C.goldB}" stroke-width="4" opacity=".16" fill="none"/>`;
  s += `<path d="${th}" stroke="${C.goldB}" stroke-width="1.5" fill="none"/>`;
  // dust motes in the moonbeam
  s += stipple(21, 450, 420, 150, 120, 40, 1.2, C.cream, .45);
  for (const c of crew) s += spider({ pose: "dangle", ...RIM, ...c });
  // lead spider, masked, front legs reaching for the lid
  s += spider({
    ...lead, ...RIM, mask: true, look: [0, 1], mouth: "smirk", brow: "down", mark: "chevron", pose: "dangle",
    legOverride: {
      R0: [[9, -6], [20, -2], [14, 30]], L0: [[-9, -6], [-20, -2], [-14, 30]],
      R1: [[12, -2], [32, -4], [32, 28]], L1: [[-12, -2], [-32, -4], [-32, 28]],
    },
  });
  // sparkles of silk
  s += sparkle(356, 226, 3.5) + sparkle(132, 300, 3.5) + sparkle(572, 206, 3.5);

  // 6. counter with the sleeping cat
  const cy = 640;
  s += `<rect x="0" y="${cy}" width="612" height="152" fill="url(#${P}-counter)"/>`;
  s += `<rect x="-4" y="${cy - 10}" width="620" height="22" fill="${C.soft}" stroke="${C.ink}" stroke-width="3"/>`;
  s += `<path d="M0 ${cy - 8}H612" stroke="${C.parch}" stroke-width="2" opacity=".5"/>`;
  // cabinet doors
  let doors = "";
  for (let i = 0; i < 4; i++) {
    const x = 12 + i * 150;
    doors += `<rect x="${x}" y="${cy + 26}" width="138" height="140" rx="4" fill="${C.plum}" stroke="${C.ink}" stroke-width="2.6"/>`;
    doors += `<rect x="${x + 12}" y="${cy + 38}" width="114" height="118" rx="3" fill="none" stroke="${C.ink}" stroke-width="1.6" opacity=".6"/>`;
    doors += `<circle cx="${i % 2 ? x + 20 : x + 118}" cy="${cy + 52}" r="5" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/>`;
  }
  s += doors;
  s += hatch(`${P}-cb`, `<rect x="0" y="${cy + 12}" width="612" height="150"/>`, 0, cy, 612, 792, 8, 70, C.ink, 1.1, .3);

  // the cat — curled up on the counter, head on the right, one eye opening
  s += `<ellipse cx="220" cy="${cy - 4}" rx="176" ry="12" fill="${C.ink}" opacity=".35"/>`;
  // tail wrapping the front
  const body = `M58 ${cy - 6}C40 ${cy - 70} 110 ${cy - 128} 200 ${cy - 124}C268 ${cy - 122} 322 ${cy - 100} 344 ${cy - 58}L360 ${cy - 6}Z`;
  s += `<path d="${body}" fill="${C.deep}" stroke="${C.ink}" stroke-width="3.2" stroke-linejoin="round"/>`;
  // moonlit rim
  s += line(`M80 ${cy - 72}C110 ${cy - 118} 170 ${cy - 128} 226 ${cy - 122}C272 ${cy - 118} 306 ${cy - 104} 326 ${cy - 84}`, 4, C.soft);
  // stripes
  s += line(`M150 ${cy - 124}q-8 20 2 34M190 ${cy - 126}q-10 22 0 38M232 ${cy - 122}q-8 20 4 34M110 ${cy - 108}q-2 18 10 28M270 ${cy - 112}q-6 18 6 28`, 5, C.ink, ` opacity=".75"`);
  // haunch curve
  s += line(`M96 ${cy - 10}q-20 -60 50 -70`, 2.4, C.ink, ` opacity=".6"`);
  // tail
  s += `<path d="M66 ${cy - 16}C90 ${cy + 2} 190 ${cy + 6} 262 ${cy - 6}C290 ${cy - 10} 300 ${cy - 26} 290 ${cy - 34}C282 ${cy - 24} 250 ${cy - 22} 200 ${cy - 20}C140 ${cy - 18} 96 ${cy - 26} 66 ${cy - 16}Z" fill="${C.plum}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += line(`M130 ${cy - 18}v14M170 ${cy - 18}v16M210 ${cy - 19}v15M248 ${cy - 16}v12`, 4, C.ink, ` opacity=".6"`);
  s += `<path d="M280 ${cy - 30}q10 -2 10 -6" stroke="${C.parch}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  // front paws
  s += `<path d="M300 ${cy - 14}q0 -14 20 -14h26q10 0 10 12v6z" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += line(`M336 ${cy - 22}v10M346 ${cy - 22}v10`, 1.6);
  // head
  const hx = 336, hy = cy - 78;
  s += `<path d="M${hx - 44} ${hy - 12}L${hx - 40} ${hy - 62}L${hx - 12} ${hy - 36}Z" fill="${C.deep}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M${hx + 36} ${hy - 20}L${hx + 50} ${hy - 66}L${hx + 12} ${hy - 38}Z" fill="${C.deep}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<path d="M${hx - 36} ${hy - 20}L${hx - 34} ${hy - 48}L${hx - 18} ${hy - 34}ZM${hx + 32} ${hy - 26}L${hx + 42} ${hy - 52}L${hx + 18} ${hy - 36}Z" fill="${C.ox}"/>`;
  s += `<ellipse cx="${hx}" cy="${hy}" rx="54" ry="46" fill="${C.deep}" stroke="${C.ink}" stroke-width="3.2"/>`;
  s += line(`M${hx - 40} ${hy - 26}q20 -22 56 -18`, 3.5, C.soft);
  s += line(`M${hx - 8} ${hy - 44}v12M${hx + 4} ${hy - 44}v12M${hx - 20} ${hy - 40}l4 10`, 3, C.ink, ` opacity=".7"`);
  // muzzle
  s += `<path d="M${hx - 24} ${hy + 22}q0 -20 24 -20t24 20q-4 18 -24 18t-24 -18z" fill="${C.parch}" stroke="${C.ink}" stroke-width="2.4"/>`;
  s += `<path d="M${hx - 6} ${hy + 8}h12l-6 7z" fill="${C.oxB}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
  s += line(`M${hx} ${hy + 15}v5q-6 6 -11 1M${hx} ${hy + 20}q6 6 11 1`, 1.8);
  // whiskers
  s += line(`M${hx - 20} ${hy + 16}l-44 -6M${hx - 20} ${hy + 22}l-42 4M${hx + 20} ${hy + 16}l46 -8M${hx + 20} ${hy + 22}l44 2`, 1.4, C.cream, ` opacity=".85"`);
  // left eye: fast asleep
  s += line(`M${hx - 34} ${hy - 4}q10 9 22 0`, 3);
  // right eye: just opening — a sliver of gold
  s += `<path d="M${hx + 10} ${hy - 4}q12 -9 24 0q-12 6 -24 0z" fill="${C.goldB}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += `<ellipse cx="${hx + 23}" cy="${hy - 4.5}" rx="1.8" ry="3.4" fill="${C.ink}"/>`;
  s += line(`M${hx + 8} ${hy - 12}q14 -8 28 -2`, 2.4);
  s += line(`M${hx + 40} ${hy - 20}l6 -6M${hx + 44} ${hy - 10}l8 -2`, 2, C.goldB);

  // crumbs and a runaway cookie on the counter (right)
  // the cookie lies flat on the counter top; crumbs lie beside it
  s += flatCookie(520, cy + 2, 26, 9, true);
  s += `<ellipse cx="480" cy="${cy}" rx="3" ry="1.6" fill="${C.gold}" stroke="${C.ink}" stroke-width="1"/><ellipse cx="462" cy="${cy + 2}" rx="2.4" ry="1.3" fill="${C.gold}" stroke="${C.ink}" stroke-width=".9"/><ellipse cx="446" cy="${cy - 1}" rx="1.8" ry="1" fill="${C.gold}"/>`;
  // vignette edges to frame the page
  // tea towel hanging from a cabinet knob
  s += `<path d="M164 ${cy + 52}q0 -8 8 -8h20q8 0 8 8l6 68q-25 8 -50 0z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += line(`M159 ${cy + 96}h48M160 ${cy + 104}h48`, 3, C.oxB);
  s += line(`M172 ${cy + 56}q2 30 -2 60`, 1.6, C.edge);
  s += line(`M176 ${cy + 50}q6 -4 12 0`, 1.6, C.edge);
  // soft darkening at the edges to frame the scene
  s += `<defs><radialGradient id="${P}-vig" cx="50%" cy="58%" r="75%"><stop offset=".55" stop-color="${C.ink}" stop-opacity="0"/><stop offset="1" stop-color="${C.ink}" stop-opacity=".55"/></radialGradient></defs>`;
  s += `<rect width="612" height="792" fill="url(#${P}-vig)"/>`;
  return svg("0 0 612 792", "A crew of spiders abseils toward a blue-lidded cookie tin while the cat sleeps", s);
}
