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
const VERSION = "4.2";
const DRAFT = process.argv.includes("--draft");
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
body = body.replace(
  /(<h[34]\b[^>]*>[\s\S]*?<\/h[34]>)(\s*)(<(p|table|aside|ul|ol)\b([^>]*)>[\s\S]*?<\/\4>)/g,
  (m, head, ws, block, tag, attrs) => {
    if (tag === "table" && (/\bwide\b/.test(attrs) || (block.match(/<tr\b/g) ?? []).length > 9)) return m;
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
function page(pages, markers) {
  let content = body;
  const cover = content.match(/<section class="cover"[\s\S]*?<\/section>/);
  const toc = inlineArt(tocHtml(pages));
  content = cover ? content.replace(cover[0], cover[0] + "\n" + toc) : toc + content;
  if (markers) {
    content = content.replace(/(<section class="(?:part|chapter|sheet)[^"]*" id="([^"]+)"[^>]*>)/g,
      (_, open, id) => `${open}<span class="pdf-marker">@@${id}@@</span>`);
  }
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Heisty Spideys — First Edition</title>
<meta name="author" content="PainHog">
<meta name="description" content="A Tabletop Roleplaying Game of Eight-Legged Larceny">
<style>${fonts}</style>
<style>${css}</style>
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
  await p.setViewportSize({ width: 816, height: 1056 }); // 8.5in × 11in at 96dpi
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
  const found = {};
  for (let i = 1; i <= doc.numPages; i++) {
    const text = (await (await doc.getPage(i)).getTextContent()).items.map(t => t.str).join("");
    for (const m of text.matchAll(/@@([\w-]+)@@/g)) if (!(m[1] in found)) found[m[1]] = i;
  }
  return { found, pages: doc.numPages };
}

mkdirSync(DIST, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
try {
  const pass1 = join(DIST, ".pass1.pdf");
  await printPdf(browser, page(null, true), pass1);
  const { found } = await pageMap(pass1);
  const missing = entries.filter(e => !(e.id in found)).map(e => e.id);
  if (missing.length) throw new Error(`could not locate on any page: ${missing.join(", ")}`);

  const html = page(found, false);
  writeFileSync(join(DIST, "heisty-spideys.html"), html);
  const out = join(DIST, `Heisty_Spideys_v${VERSION}.pdf`);
  await printPdf(browser, html, out);
  const { pages } = await pageMap(out);

  // Pass 2 must paginate identically (markers take no space): verify it.
  const check = await pageMap(pass1);
  console.log(`Built ${relative(ROOT, out)} — ${pages} pages (pass 1: ${check.pages}).`);
  if (pages !== check.pages) throw new Error("pass 1 and pass 2 paginated differently — TOC numbers may be wrong");
  for (const e of entries) console.log(`  p${String(found[e.id]).padStart(3)}  ${e.label ? e.label + " — " : ""}${e.title}`);
  for (const w of warn) console.warn(`  ! ${w}`);
} finally {
  await browser.close();
}
