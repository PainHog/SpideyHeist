# Heisty Spideys rulebook — source markup

The book is plain HTML fragments + one stylesheet, paginated by Paged.js and
printed to PDF by Chromium (`npm run build:book`). Every chapter is one file in
`book/src/chapters/NN-slug.html`, concatenated in filename order.

**Text is canon.** Transcribe the author's words exactly (including jokes,
em dashes, curly quotes, italics). Only apply edits listed in `book/REVIEW.md`
under "Applied in v4.2". Never add rules, numbers, names or flavour text.

## Structure

```html
<section class="part" id="part-one">            <!-- Part title page -->
  <p class="part-kicker">Part One</p>
  <h1>The Player's Guide</h1>
  <p class="part-lede">…</p>
  <figure class="art part-art" data-art="part-one"></figure>
</section>

<section class="chapter" id="ch-02">
  <header class="chapter-head">
    <figure class="art chapter-art" data-art="dice"></figure>
    <p class="chapter-num">Chapter 2</p>
    <h2>Core Rules — How to Roll Dice</h2>
  </header>
  <p class="opener">When a spider tries …</p>   <!-- first paragraph: gets the drop cap -->
  <h3>The Core Mechanic</h3>
  <p>…</p>
  <h4>Minor heading</h4>
</section>
```

- `h1` part titles, `h2` chapter titles (TOC reads `.chapter-head h2`), `h3` sections, `h4` minor.
- Use real characters: — – ’ “ ” … × − (minus in "−1 die"), not entities.
- Italic for in-fiction thought/aside text the original italicises: `<em>`.
- Rule terms the original bolds stay `<strong>`.

## Boxes

```html
<aside class="box rule"><h4>The One Rule</h4><p>…</p></aside>          <!-- key rule -->
<aside class="box example"><h4>Example</h4><p>…</p></aside>            <!-- worked example -->
<aside class="box st"><h4>Storyteller Note — Keep the Map Honest</h4>…</aside>
<aside class="box designer"><h4>Designer's Note</h4>…</aside>
<aside class="box list"><h4>What You Need</h4><ul>…</ul></aside>       <!-- checklists, tips -->
```

## Tables

```html
<table class="tbl">
  <thead><tr><th>Difficulty</th><th>Successes</th><th>What It Looks Like</th></tr></thead>
  <tbody><tr><td>Trivial</td><td class="num">1</td><td>…</td></tr></tbody>
</table>
```
`class="num"` centres a numeric column cell. Tables may break across pages; the header repeats.
Add `flow` to let a short table split across the two columns, or `nosplit` to keep a table whole
with its heading (use sparingly — a large unsplittable table can leave a gap).

## Species / Roles / Creatures

```html
<article class="entry species" id="sp-jumping">
  <figure class="art portrait" data-art="species-jumping"></figure>
  <h3>Jumping Spider</h3>
  <div class="ability">
    <h4>Species Ability — “Did You See That Jump?!”</h4>
    <p>…</p>
  </div>
  <p>…flavour…</p>
  <p class="statline"><strong>Attribute Bonus:</strong> BODY +1, GRACE +1 <span class="sep">·</span> <strong>Speed:</strong> 6</p>
</article>

<article class="entry role" id="role-face">
  <figure class="art badge" data-art="role-face"></figure>
  <h3>The Face</h3>
  <p class="quote">“Relax. I've got this. …”</p>
  <p>…</p>
  <p class="statline"><strong>Core Skills:</strong> Deception, Persuasion <span class="sep">·</span> <strong>Role Bonus:</strong> +3 points split between them.</p>
  <div class="signature"><h4>Signature Move — “That's Not What Happened”</h4><p>…</p></div>
  <table class="tbl perks">…Perk | Effect…</table>
</article>

<article class="statblock" id="cr-house-cat">
  <figure class="art creature" data-art="creature-cat"></figure>
  <h3>House Cat <span class="epithet">“The Reason We Can't Have Nice Heists”</span></h3>
  <dl class="stats">
    <dt>Threat Level</dt><dd>Standard</dd>
    <dt>Alert Contribution</dt><dd>+1 per round while active</dd>
    <dt>Speed</dt><dd>8</dd>
  </dl>
  <p class="pools">Perception 4 · Pursuit (Athletics) 5 · Pounce (Brawl) 4</p>
  <dl class="traits">
    <dt>Passive</dt><dd>…</dd>
    <dt>Senses</dt><dd>…</dd>
    <dt>Escalation</dt><dd>…</dd>
    <dt>Weakness</dt><dd>…</dd>
    <dt>Fear</dt><dd>…</dd>
  </dl>
</article>
```

## Heists (Chapter 19)

```html
<article class="heist" id="heist-1">
  <h3>Heist 1 — The Cookie Situation <span class="tag">House · Easy</span></h3>
  <p class="heist-meta"><strong>Alert Limit:</strong> 10 <span class="sep">·</span> <strong>Loot:</strong> Crumb/Trinket <span class="sep">·</span> <strong>For:</strong> a first session</p>
  <p><strong>The Objective:</strong> …</p>
  …
  <aside class="box list"><h4>Suggested Obstacles</h4><ol>…</ol></aside>
</article>
```

## Art

`<figure class="art …" data-art="NAME"></figure>` is replaced at build time by
`book/art/NAME.svg`, inlined. Add `<figcaption>` inside if the original has a caption.
Available names are listed in `book/art/README.md`.
