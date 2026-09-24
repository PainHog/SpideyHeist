/**
 * HEISTY SPIDEYS — Rulebook build
 * -------------------------------
 * book/src/chapters/*.html (in filename order) + book/src/book.css + book/art/*.svg
 *   → book/dist/heisty-spideys.html  (self-contained print HTML)
 *   → book/dist/Heisty_Spideys_v<version>.pdf
 *
 * Printed by the local Chromium (Playwright) using native CSS paged media:
 * @page sizes/margins, named pages (cover, part), margin-box page numbers.
 * The Table of Contents gets real page numbers from a two-pass render: pass 1
 * prints with invisible, zero-size markers at each chapter start, we read which
 * page each marker landed on, then pass 2 prints the final PDF without markers
 * (markers are absolutely positioned, so removing them cannot move anything).
 *
 *   npm run build:book            strict: fails on missing art
 *   npm run build:book -- --draft missing art becomes a labelled placeholder
 *   npm run build:book -- --print print-on-demand interior + covers, with bleed
 */
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const BOOK = dirname(fileURLToPath(import.meta.url));
const ROOT = join(BOOK, "..");
const SRC = join(BOOK, "src");
const ART = join(BOOK, "art");
const DIST = join(BOOK, "dist");
const VERSION = "4.5";
const DRAFT = process.argv.includes("--draft");
// --print: print-on-demand files — an interior with 0.125in bleed on every edge
// (no covers, even page count) plus separate front and back covers with bleed.
const PRINT = process.argv.includes("--print");
const BLEED_IN = PRINT ? 0.125 : 0;
const CHROME = process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const warn = [];

/* ---------------------------------------------------------------- art -- */
const artCache = new Map();
function loadArt(name) {
  if (artCache.has(name)) return artCache.get(name);
  const file = join(ART, `${name}.svg`);
  let svg;
  if (existsSync(file)) {
    svg = readFileSync(file, "utf8")
      .replace(/<\?xml[^>]*\?>/g, "")
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .trim();
    // Namespace ids so gradients/clipPaths from different pieces never collide.
    const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    for (const id of ids) {
      const nid = `${name}__${id}`;
      svg = svg
        .replaceAll(`id="${id}"`, `id="${nid}"`)
        .replaceAll(`url(#${id})`, `url(#${nid})`)
        .replaceAll(`href="#${id}"`, `href="#${nid}"`);
    }
    svg = svg.replace(/<svg\b/, `<svg role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet"`);
  } else {
    const msg = `missing art: ${name}.svg`;
    if (!DRAFT) throw new Error(`${msg} (use --draft to build with placeholders)`);
    warn.push(msg);
    svg = `<div class="art-missing">${name}</div>`;
  }
  artCache.set(name, svg);
  return svg;
}

function inlineArt(html) {
  return html.replace(
    /<figure\b([^>]*?)\bdata-art="([^"]+)"([^>]*)>([\s\S]*?)<\/figure>/g,
    (_, pre, name, post, inner) => {
      const caption = (inner.match(/<figcaption[\s\S]*?<\/figcaption>/) ?? [""])[0];
      return `<figure${pre}data-art="${name}"${post}>${loadArt(name)}${caption}</figure>`;
    });
}

/* ------------------------------------------------------------- chapters -- */
const files = readdirSync(join(SRC, "chapters")).filter(f => f.endsWith(".html")).sort();
if (!files.length) throw new Error("no chapters in book/src/chapters");
let body = files.map(f => `\n<!-- ${f} -->\n` + readFileSync(join(SRC, "chapters", f), "utf8")).join("\n");

// Wide tables (4+ columns) span both text columns.
body = body.replace(/<table class="tbl([^"]*)">([\s\S]*?)<\/table>/g, (m, cls, inner) => {
  const head = inner.match(/<tr>([\s\S]*?)<\/tr>/);
  const cols = head ? (head[1].match(/<t[hd]\b/g) ?? []).length : 0;
  return cols >= 4 && !/\bwide\b/.test(cls) ? `<table class="tbl${cls} wide">${inner}</table>` : m;
});

// Keep headings with what follows. Chromium's multi-column fragmentation does
// not reliably honour `break-after: avoid`, so bind an h3/h4 to its next block
// in an unbreakable wrapper — only when that block is short enough that
// moving it whole can't leave a large gap (no wide tables, ≤ 8 rows/items).
// Markup can override per table: class "flow" lets a short table split across the
// columns (so it doesn't leave a column-high hole beside it), class "nosplit" keeps a
// longer table whole with its heading (so it never strands a row or two on its own).
body = body.replace(
  /(<h[34]\b[^>]*>[\s\S]*?<\/h[34]>)(\s*)(<(p|table|aside|ul|ol)\b([^>]*)>[\s\S]*?<\/\4>)/g,
  (m, head, ws, block, tag, attrs) => {
    if (tag === "table" && /\bnosplit\b/.test(attrs)) return `<div class="keep">${head}${ws}${block}</div>`;
    if (tag === "table" && (/\b(wide|flow)\b/.test(attrs) || (block.match(/<tr\b/g) ?? []).length > 9)) return m;
    if ((tag === "ul" || tag === "ol") && (block.match(/<li\b/g) ?? []).length > 6) return m;
    if (tag === "p" && block.length > 900) return m;
    return `<div class="keep">${head}${ws}${block}</div>`;
  });

body = inlineArt(body);

/* ------------------------------------------------------------------ toc -- */
const strip = s => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const entries = [];
for (const m of body.matchAll(/<section class="(part|chapter|sheet)[^"]*" id="([^"]+)"[^>]*>([\s\S]*?)(?=<section class="(?:part|chapter|sheet|cover)|$)/g)) {
  const [, kind, id, inner] = m;
  if (kind === "part") {
    const kicker = strip((inner.match(/class="part-kicker">([\s\S]*?)</) ?? [, ""])[1]);
    const title = strip((inner.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) ?? [, id])[1]);
    entries.push({ kind, id, label: kicker, title });
  } else if (kind === "chapter") {
    const num = strip((inner.match(/class="chapter-num">([\s\S]*?)</) ?? [, ""])[1]);
    const title = strip((inner.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) ?? [, id])[1]);
    entries.push({ kind, id, label: num, title });
  } else {
    const title = strip((inner.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) ?? [, "Character Sheet"])[1]);
    entries.push({ kind, id, label: "", title });
  }
}

function tocHtml(pages) {
  const rows = entries.map(e => {
    const n = pages?.[e.id] ?? "00";
    if (e.kind === "part") {
      return `<li class="toc-part"><a href="#${e.id}"><span class="toc-label">${e.label}</span> <span class="toc-title">${e.title}</span><span class="toc-page">${n}</span></a></li>`;
    }
    return `<li class="toc-${e.kind}"><a href="#${e.id}"><span class="toc-label">${e.label}</span><span class="toc-title">${e.title}</span><span class="toc-page">${n}</span></a></li>`;
  }).join("\n");
  return `<section class="toc" id="contents">
  <figure class="art toc-art" data-art="orn-corner"></figure>
  <h2>Table of Contents</h2>
  <ol class="toc-list">${rows}</ol>
</section>`;
}

/* ---------------------------------------------------------------- fonts -- */
const FONT_DIR = join(ROOT, "node_modules", "@fontsource");
const fontFace = (family, pkg, weight, style) => {
  const f = join(FONT_DIR, pkg, "files", `${pkg}-latin-${weight}-${style}.woff2`);
  if (!existsSync(f)) throw new Error(`font file missing: ${f} — run npm install`);
  return `@font-face{font-family:"${family}";src:url("${pathToFileURL(f).href}") format("woff2");font-weight:${weight};font-style:${style};}`;
};
const fonts = [
  ...[400, 600, 700, 900].flatMap(w => [fontFace("Fraunces", "fraunces", w, "normal"), fontFace("Fraunces", "fraunces", w, "italic")]),
  ...[400, 500, 700, 800].flatMap(w => [fontFace("Alegreya", "alegreya", w, "normal"), fontFace("Alegreya", "alegreya", w, "italic")]),
  ...[400, 500, 700, 800].flatMap(w => [fontFace("Alegreya Sans", "alegreya-sans", w, "normal"), fontFace("Alegreya Sans", "alegreya-sans", w, "italic")])
].join("\n");

/* ---------------------------------------------------------------- page -- */
const css = readFileSync(join(SRC, "book.css"), "utf8");

/*
 * Spot illustrations fill the space a chapter leaves empty on its last page.
 * Pass 1 prints an end-of-chapter marker; its height on the page tells us how much
 * room is left, and a spot sized to fit is placed there (never enough to move a page).
 * Each chapter lists spots in order of preference; the first not yet used wins.
 */
const SPOTS = {
  "ch-01": ["spot-crew-huddle"], "ch-02": ["spot-dice-push"], "ch-03": ["spot-silk-swing"],
  "ch-05": ["spot-dust-bunny"], "ch-06": ["spot-lockpick"], "ch-09": ["spot-alarm-freeze"],
  "ch-10": ["spot-jar-rescue"], "ch-11": ["spot-loot-haul"], "ch-16": ["spot-couch-sneak"],
  "ch-18": ["spot-lookout-sill"], "ch-19": ["spot-map-board"], "ch-20": ["spot-vacuum-ride"],
  "ch-21": ["spot-debrief"],
  // chapters that normally end with too little room for a spot; if a layout change ever
  // leaves them a gap, the spare piece (or any other unused one) fills it
  "ch-04": ["spot-cat-nap"], "ch-07": ["spot-cat-nap"], "ch-08": ["spot-cat-nap"], "ch-12": ["spot-cat-nap"],
  "ch-13": ["spot-cat-nap"], "ch-14": ["spot-cat-nap"], "ch-15": ["spot-cat-nap"], "ch-17": ["spot-cat-nap"],
};
const PT_PER_IN = 72;
const BOTTOM_LIMIT_PT = (0.78 + BLEED_IN) * PT_PER_IN;   // @page bottom margin: content must end above this
const MIN_SPOT_IN = 1.5, MAX_SPOT_IN = 5.3, SAFETY_IN = 0.2, MIN_GAP_IN = 0.22;  // 5.3in = 4:3 art at full text width

function planSpots(ends) {
  const used = new Set(), plan = {};
  const order = Object.keys(ends);
  for (const [idx, [id, { freeIn }]] of Object.entries(ends).entries()) {
    const prefs = SPOTS[id];
    const room = freeIn - SAFETY_IN;
    if (!prefs || room - MIN_GAP_IN < MIN_SPOT_IN) continue;
    // preferred spots first, then any spot not used yet; never a repeat (the same
    // illustration twice in one book reads as a mistake)
    const all = [...new Set(Object.values(SPOTS).flat())];
    const have = a => existsSync(join(ART, `${a}.svg`));
    // don't take a spot a later chapter prefers
    const later = new Set(order.slice(idx + 1).flatMap(k => SPOTS[k] ?? []));
    const art = prefs.find(a => !used.has(a) && have(a))
      ?? all.find(a => !used.has(a) && have(a) && !later.has(a));
    if (!art) continue;
    used.add(art);
    const h = +Math.min(MAX_SPOT_IN, room - MIN_GAP_IN).toFixed(2);
    // centre the art in the space left (never closer than MIN_GAP_IN to the text)
    const top = +Math.max(MIN_GAP_IN, (room - h) / 2).toFixed(2);
    plan[id] = { art, h, top };
  }
  return plan;
}

// Print-on-demand overrides: grow every page by the bleed, push margins in by the
// same amount, and let full-bleed pages (covers, part pages) fill the larger sheet.
const PRINT_CSS = `
:root { --page-mt: ${0.72 + BLEED_IN}in; --page-ml: ${0.68 + BLEED_IN}in; }
@page { size: ${8.5 + 2 * BLEED_IN}in ${11 + 2 * BLEED_IN}in; margin: ${0.72 + BLEED_IN}in ${0.68 + BLEED_IN}in ${0.78 + BLEED_IN}in ${0.68 + BLEED_IN}in; }
@page cover { margin: 0; } @page part { margin: 0; } @page back { margin: 0; } @page sheet { margin: ${0.5 + BLEED_IN}in; }
.cover, .part, .back-cover { width: ${8.5 + 2 * BLEED_IN}in; height: ${11 + 2 * BLEED_IN}in; }
.cover .cover-art svg { width: ${8.5 + 2 * BLEED_IN}in; height: auto; margin-top: -${BLEED_IN * 0.3}in; }
.cover h1.cover-title { margin-top: ${0.8 + BLEED_IN}in; }
.part { padding-top: ${2.3 + BLEED_IN}in; }
.back-cover .back-inner { padding: ${0.8 + BLEED_IN}in ${0.9 + BLEED_IN}in; }
.blank-page { page: blankp; break-before: page; height: 1px; }
@page blankp { @bottom-center { content: none; } }
`;

const sectionOf = (html, cls) => (html.match(new RegExp(`<section class="${cls}"[\\s\\S]*?<\\/section>`)) ?? [null])[0];

function page(pages, markers, spots = {}, { only = null, padBlank = false } = {}) {
  let content = body;
  if (only) {
    content = sectionOf(body, only) ?? "";
  } else {
    const toc = inlineArt(tocHtml(pages));
    // the Table of Contents follows the credits page (or the cover if there is none)
    const anchor = sectionOf(content, "credits") ?? sectionOf(content, "cover");
    content = anchor ? content.replace(anchor, anchor + "\n" + toc) : toc + content;
    if (PRINT) {
      // the print interior carries no covers: those are separate files
      for (const cls of ["cover", "back-cover"]) { const sec = sectionOf(content, cls); if (sec) content = content.replace(sec, ""); }
      if (padBlank) content += `\n<section class="blank-page"></section>`;
    }
  }
  // end of each chapter: a spot illustration (if planned) and, in marker passes, an end marker
  content = content.replace(/(<section class="chapter[^"]*" id="([^"]+)"[^>]*>)([\s\S]*?)(<\/section>)(?=\s*(?:<!--|<section|$))/g,
    (m, open, id, inner, close) => {
      const sp = spots[id];
      const fig = sp ? `<figure class="art tailpiece" data-art="${sp.art}" style="height:${sp.h}in;margin-top:${sp.top}in"></figure>` : "";
      const end = markers ? `<div class="end-marker"><span>@@end-${id}@@</span></div>` : "";
      return `${open}${inner}${fig ? inlineArt(fig) : ""}${end}${close}`;
    });
  if (markers) {
    content = content.replace(/(<section class="(?:part|chapter|sheet)[^"]*" id="([^"]+)"[^>]*>)/g,
      (_, open, id) => `${open}<span class="pdf-marker">@@${id}@@</span>`);
  }
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Heisty Spideys — First Edition</title>
<meta name="author" content="Richard Moore">
<meta name="description" content="A Tabletop Roleplaying Game of Eight-Legged Larceny">
<style>${fonts}</style>
<style>${css}</style>
${PRINT ? `<style>${PRINT_CSS}</style>` : ""}
</head><body>
${content}
</body></html>`;
}

/* ---------------------------------------------------------------- print -- */
async function printPdf(browser, html, out) {
  const tmp = join(DIST, ".print.html");
  writeFileSync(tmp, html);
  const p = await browser.newPage();
  await p.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  // Chromium silently shrinks EVERY page when any element is wider than the
  // paper. Refuse to print instead, naming the culprits.
  await p.setViewportSize({ width: Math.round((8.5 + 2 * BLEED_IN) * 96), height: Math.round((11 + 2 * BLEED_IN) * 96) }); // the sheet at 96dpi
  await p.emulateMedia({ media: "print" });
  const wide = await p.evaluate(() => {
    const W = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth <= W + 1) return [];
    // Shapes inside an <svg> are clipped by it, so only name HTML boxes and svg roots.
    return [...document.querySelectorAll("body *")]
      .filter(el => !el.ownerSVGElement && el.getBoundingClientRect().right > W + 1)
      .slice(0, 8)
      .map(el => `${el.tagName.toLowerCase()}.${el.getAttribute("class") ?? ""} "${(el.textContent ?? "").trim().slice(0, 40)}"`);
  });
  if (wide.length) throw new Error(`content wider than the page (Chromium would shrink every page):\n  ${wide.join("\n  ")}`);
  await p.pdf({ path: out, preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });
  await p.close();
}

async function pageMap(pdfPath) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(pdfPath)), verbosity: 0 }).promise;
  const found = {}, ends = {};
  for (let i = 1; i <= doc.numPages; i++) {
    const items = (await (await doc.getPage(i)).getTextContent()).items;
    const text = items.map(t => t.str).join("");
    for (const m of text.matchAll(/@@([\w-]+)@@/g)) {
      if (m[1].startsWith("end-")) continue;
      if (!(m[1] in found)) found[m[1]] = i;
    }
    for (const it of items) {
      const m = it.str.match(/@@end-([\w-]+)@@/);
      if (!m) continue;
      // baseline y (from the page bottom); the marker's top edge is ~4pt above it
      const topPt = it.transform[5] + 4;
      ends[m[1]] = { page: i, freeIn: Math.max(0, (topPt - BOTTOM_LIMIT_PT) / PT_PER_IN) };
    }
  }
  return { found, ends, pages: doc.numPages };
}

mkdirSync(DIST, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
try {
  // Pass 1: where does everything land, and how much room is left after each chapter?
  const pass1 = join(DIST, ".pass1.pdf");
  await printPdf(browser, page(null, true), pass1);
  const p1 = await pageMap(pass1);
  const missing = entries.filter(e => !(e.id in p1.found)).map(e => e.id);
  if (missing.length) throw new Error(`could not locate on any page: ${missing.join(", ")}`);

  // Pass 2: place spot illustrations; drop any that would move a page, and re-check.
  let spots = planSpots(p1.ends);
  for (let attempt = 0; attempt < 4; attempt++) {
    const pass2 = join(DIST, ".pass2.pdf");
    await printPdf(browser, page(p1.found, true, spots), pass2);
    const p2 = await pageMap(pass2);
    const moved = Object.keys(spots).filter(id => p2.ends[id]?.page !== p1.ends[id]?.page);
    const shifted = entries.filter(e => p2.found[e.id] !== p1.found[e.id]).map(e => e.id);
    if (!moved.length && !shifted.length && p2.pages === p1.pages) break;
    if (attempt === 3) throw new Error(`spot illustrations keep moving pages: ${[...moved, ...shifted].join(", ")}`);
    for (const id of moved) delete spots[id];
    if (shifted.length && !moved.length) spots = {};
  }

  const out = join(DIST, PRINT ? `Heisty_Spideys_v${VERSION}_print-interior.pdf` : `Heisty_Spideys_v${VERSION}.pdf`);
  let html = page(p1.found, false, spots);
  if (!PRINT) writeFileSync(join(DIST, "heisty-spideys.html"), html);
  await printPdf(browser, html, out);
  let { pages } = await pageMap(out);
  if (pages !== p1.pages) throw new Error("pass 1 and the final pass paginated differently — TOC numbers may be wrong");
  if (PRINT && pages % 2) {           // print interiors need an even page count
    html = page(p1.found, false, spots, { padBlank: true });
    await printPdf(browser, html, out);
    ({ pages } = await pageMap(out));
  }
  console.log(`Built ${relative(ROOT, out)} — ${pages} pages (pass 1: ${p1.pages}).`);
  if (PRINT) {
    for (const [cls, name] of [["cover", "front"], ["back-cover", "back"]]) {
      if (!sectionOf(body, cls)) continue;
      const f = join(DIST, `Heisty_Spideys_v${VERSION}_print-cover-${name}.pdf`);
      await printPdf(browser, page(null, false, {}, { only: cls }), f);
      console.log(`Built ${relative(ROOT, f)} (${8.5 + 2 * BLEED_IN}in × ${11 + 2 * BLEED_IN}in, bleed included).`);
    }
  }
  for (const e of entries) {
    const sp = spots[e.id];
    console.log(`  p${String(p1.found[e.id]).padStart(3)}  ${e.label ? e.label + " — " : ""}${e.title}${sp ? `   [+ ${sp.art} ${sp.h}in]` : ""}`);
  }
  const gaps = Object.entries(p1.ends).filter(([id, v]) => !spots[id] && v.freeIn > 3).map(([id, v]) => `${id} (${v.freeIn.toFixed(1)}in free)`);
  if (gaps.length) console.warn(`  ! large gaps with no spot: ${gaps.join(", ")}`);
  for (const w of warn) console.warn(`  ! ${w}`);
} finally {
  await browser.close();
}
