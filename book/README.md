# Heisty Spideys — the rulebook

| Path | What |
|---|---|
| `original/Heisty_Spideys_v4_1.pdf` | The author's v4.1 PDF (reference) |
| `REVIEW.md` | Editorial review: fixes applied in v4.2 (A), rulings made in v4.3 (B), Foundry-vs-book (C) |
| `dist/Heisty_Spideys_v4.5.pdf` | The typeset, illustrated edition (current, for digital sale) |
| `dist/Heisty_Spideys_v4.5_print-*.pdf` | Print-on-demand files: interior (8.75×11.25in incl. 0.125in bleed, even page count) and separate front/back covers |
| `src/chapters/*.html` | The text, one file per chapter (see `src/MARKUP.md`) |
| `src/book.css` | The print design |
| `art/*.svg` | All illustrations (catalogue in `art/README.md`) |
| `tools/art-gen/` | Scripts that regenerate the art (`node tools/art-gen/species.mjs`, `node tools/art-gen/scenes/build.mjs`, …) |

```bash
npm install
npm run build:book                                         # → book/dist/Heisty_Spideys_v4.5.pdf
npm run build:book -- --print                              # → print-on-demand interior + covers (with bleed)
python3 book/tools/text-diff.py book/original/Heisty_Spideys_v4_1.pdf book/dist/Heisty_Spideys_v4.5.pdf   # word-level check vs the original
```

The build fails on missing art (use `-- --draft` for placeholders) and on anything
wider than the page. Fonts (Fraunces, Alegreya, Alegreya Sans) are SIL OFL and
embedded in the PDF, so the file can be sold.
