#!/usr/bin/env node
/**
 * Heisty Spideys — Monte Carlo rules simulator CLI.
 *
 *   node sim/run.mjs --runs 5000 --seed 1 [--heist N] [--sweep-runs 2000] [--out sim/REPORT.md]
 *
 * Runs every ready-to-run heist under the default reading, the two Partial
 * variants, the generous and strict reading presets, the fix experiments, and
 * one variant per alternative value of every Storyteller parameter; writes
 * sim/REPORT.md.
 */

import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { makeRng } from "./rng.mjs";
import { buildCrew, GEN_STATS, dataConsistencyIssues, ROLES } from "./character.mjs";
import { HEISTS, CREATURES, makeEscape, getHeist } from "./heists.mjs";
import { runHeist } from "./engine.mjs";
import { PARAMS, PRESETS, defaultParams } from "./params.mjs";
import { Recorder, ISSUES } from "./recorder.mjs";
import { RULE_GAPS, MODELLED, NOT_MODELLED } from "./notes.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

/* -------------------------------------------------------------- CLI -- */

function args(argv) {
  const a = { runs: 5000, seed: 1, heist: null, sweepRuns: null, out: join(HERE, "REPORT.md"), dump: null, from: null };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (k === "--runs") { a.runs = Number(v); i++; }
    else if (k === "--seed") { a.seed = Number(v); i++; }
    else if (k === "--heist") { a.heist = v; i++; }
    else if (k === "--sweep-runs") { a.sweepRuns = Number(v); i++; }
    else if (k === "--out") { a.out = v; i++; }
    else if (k === "--dump") { a.dump = v; i++; }     // save the raw results as JSON
    else if (k === "--from") { a.from = v; i++; }     // re-render a report from a --dump file
    else if (k === "--help" || k === "-h") { console.log("node sim/run.mjs --runs 5000 --seed 1 [--heist N] [--sweep-runs N] [--out file]"); process.exit(0); }
  }
  a.sweepRuns ??= Math.min(a.runs, 2000);
  return a;
}

/* ---------------------------------------------------------- running -- */

export function runVariant(P, heists, runs, seed, opts = {}) {
  const out = {};
  for (const h of heists) {
    const rec = new Recorder(h.id);
    for (let i = 0; i < runs; i++) {
      const crew = buildCrew(makeRng(seed, "crew", i), P.crewSize, P.crewComposition);
      const r = runHeist(h, crew, P, makeRng(seed, h.id, i), rec);
      if (opts.keepTrace && i === opts.keepTrace.run) opts.keepTrace.out = { crew, result: r };
    }
    out[h.id] = rec;
  }
  return out;
}

/* --------------------------------------------------------- formatting -- */

const pct = (x, d = 1) => (Number.isFinite(x) ? (100 * x).toFixed(d) + "%" : "—");
const num = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");
const sgn = (x, d = 1) => (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(d);
const table = (head, rows) => [
  "| " + head.join(" | ") + " |",
  "|" + head.map(() => "---").join("|") + "|",
  ...rows.map(r => "| " + r.join(" | ") + " |")
].join("\n");
const winRate = rec => rec.outcomes.win / rec.runs;
const lossRate = rec => rec.outcomes.loss / rec.runs;
const partRate = rec => rec.outcomes.partial / rec.runs;
const apAvg = rec => rec.ap / rec.runs;
const faRate = rec => (rec.c.fullAlert ?? 0) / rec.runs;
const esc = s => String(s).replace(/\|/g, "\\|");

function merge(recs) {
  const m = new Recorder("all");
  for (const r of Object.values(recs)) {
    m.runs += r.runs;
    for (const k of Object.keys(m.outcomes)) m.outcomes[k] += r.outcomes[k];
    m.ap += r.ap;
    for (const [k, v] of Object.entries(r.c)) m.c[k] = (m.c[k] ?? 0) + v;
    for (const [k, v] of Object.entries(r.results)) m.results[k] += v;
    for (const [k, v] of Object.entries(r.silkEarned)) m.silkEarned[k] = (m.silkEarned[k] ?? 0) + v;
    for (const [k, v] of Object.entries(r.silkSpent)) m.silkSpent[k] = (m.silkSpent[k] ?? 0) + v;
    for (const [k, v] of Object.entries(r.alertBy)) m.alertBy[k] = (m.alertBy[k] ?? 0) + v;
    for (const [k, v] of Object.entries(r.issues)) {
      const e = (m.issues[k] ??= { count: 0, runs: 0, examples: [] });
      e.count += v.count; e.runs += v.runs;
      for (const x of v.examples) if (e.examples.length < 3) e.examples.push(x);
    }
    for (const [k, v] of Object.entries(r.ability)) {
      const a = (m.ability[k] ??= { crews: 0, wins: 0, usedRuns: 0, uses: 0, flips: 0 });
      for (const f of Object.keys(a)) a[f] += v[f];
    }
  }
  return m;
}

/* ------------------------------------------------------------ report -- */

function main() {
  const A = args(process.argv);
  if (A.from) {
    const ctx = JSON.parse(readFileSync(A.from, "utf8"));
    ctx.heists = ctx.heistIds.map(id => getHeist(id));
    ctx.sampleHeist = getHeist(ctx.sampleHeistId);
    ctx.base = ctx.head["default (b)"];
    ctx.strict = ctx.head["strict"];
    writeFileSync(A.out, report(ctx));
    console.log(`re-rendered ${A.out} from ${A.from}`);
    return;
  }
  const heists = A.heist ? [getHeist(A.heist)].filter(Boolean) : HEISTS;
  if (!heists.length) { console.error(`No heist ${A.heist}`); process.exit(1); }
  const t0 = Date.now();
  const log = m => console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${m}`);

  // Headline variants (full run count)
  const HEAD = {
    "default (b)": defaultParams(),
    "Partial +1 Alert (a)": defaultParams({ partialCost: "alert" }),
    "generous": defaultParams(PRESETS.generous),
    "strict": defaultParams(PRESETS.strict),
    "strict, Partial no Alert (b)": defaultParams({ ...PRESETS.strict, partialCost: "setback" }),
    "generous, Partial +1 (a)": defaultParams({ ...PRESETS.generous, partialCost: "alert" })
  };
  const head = {};
  GEN_STATS.built = 0; GEN_STATS.violations = {}; GEN_STATS.byBuild = {};
  for (const [name, P] of Object.entries(HEAD)) {
    head[name] = runVariant(P, heists, A.runs, A.seed);
    log(`headline ${name}`);
  }
  const gen = JSON.parse(JSON.stringify(GEN_STATS));
  const base = head["default (b)"];
  const strict = head["strict"];

  // Fix experiments, on top of default and strict
  const FIX = {};
  for (const [k, p] of Object.entries(PARAMS).filter(([, p]) => p.fix)) {
    FIX[`${k}=${p.alts[0]}`] = { key: k, P: defaultParams({ [k]: p.alts[0] }), S: defaultParams({ ...PRESETS.strict, [k]: p.alts[0] }) };
  }
  FIX["all three fixes"] = {
    key: "all",
    P: defaultParams({ critAlertRule: "baseD3", bonusDiceCap: 3, spittingLimit: "scene" }),
    S: defaultParams({ ...PRESETS.strict, critAlertRule: "baseD3", bonusDiceCap: 3, spittingLimit: "scene" })
  };
  const fixRes = {};
  for (const [name, f] of Object.entries(FIX)) {
    fixRes[name] = { d: runVariant(f.P, heists, A.sweepRuns, A.seed), s: runVariant(f.S, heists, A.sweepRuns, A.seed) };
    log(`fix ${name}`);
  }

  // Parameter sweep: one alternative at a time, against default and strict.
  const baseSweep = { d: runVariant(defaultParams(), heists, A.sweepRuns, A.seed), s: runVariant(defaultParams(PRESETS.strict), heists, A.sweepRuns, A.seed) };
  // Every value any table needs, run once against each base (default, strict).
  const cache = new Map();
  const variant = (base, k, v) => {
    const baseVal = base === "d" ? PARAMS[k].default : (k in PRESETS.strict ? PRESETS.strict[k] : PARAMS[k].default);
    if (JSON.stringify(v) === JSON.stringify(baseVal)) return baseSweep[base];
    const key = `${base}|${k}|${JSON.stringify(v)}`;
    if (!cache.has(key)) {
      const P = base === "d" ? defaultParams({ [k]: v }) : defaultParams({ ...PRESETS.strict, [k]: v });
      cache.set(key, runVariant(P, heists, A.sweepRuns, A.seed));
    }
    return cache.get(key);
  };
  const sweep = [];
  for (const [k, p] of Object.entries(PARAMS)) {
    if (p.fix) continue;
    for (const alt of p.alts) {
      const sAlt = PRESETS.strict[k] === alt ? PARAMS[k].default : alt;
      sweep.push({ k, alt, sAlt, d: variant("d", k, alt), s: variant("s", k, sAlt) });
    }
    log(`sweep ${k}`);
  }
  const readings = [];
  for (const k of Object.keys(PRESETS.strict)) {
    const g = PRESETS.generous[k], st = PRESETS.strict[k];
    if (JSON.stringify(g) === JSON.stringify(st)) continue;
    readings.push({ k, g, st, dg: variant("d", k, g), dst: variant("d", k, st), sg: variant("s", k, g), sst: variant("s", k, st) });
  }
  log("readings");

  // Sample traces
  const traceSpec = { run: 7 };
  const sampleHeist = heists.find(h => h.id === "restaurant") ?? heists[0];
  runVariant(defaultParams({ ...PRESETS.strict, trace: true }), [sampleHeist], 8, A.seed, { keepTrace: traceSpec });
  const traceStrict = traceSpec.out;
  const traceSpec2 = { run: 3 };
  runVariant(defaultParams({ trace: true }), [heists[0]], 4, A.seed, { keepTrace: traceSpec2 });
  const traceDefault = traceSpec2.out;

  const ctx = { A, heists, head, base, strict, fixRes, baseSweep, sweep, readings, gen, traceStrict, traceDefault, sampleHeist };
  if (A.dump) {
    const { heists: _h, sampleHeist: sh, base: _b, strict: _s, ...rest } = ctx;
    writeFileSync(A.dump, JSON.stringify({ ...rest, heistIds: heists.map(h => h.id), sampleHeistId: sh.id }));
    log(`dumped ${A.dump}`);
  }
  const md = report(ctx);
  writeFileSync(A.out, md);
  log(`wrote ${A.out}`);
  // Console summary
  for (const h of heists) {
    console.log(`${h.n}. ${h.name.padEnd(26)} default win ${pct(winRate(base[h.id]))} · (a) ${pct(winRate(head["Partial +1 Alert (a)"][h.id]))} · strict ${pct(winRate(strict[h.id]))} loss ${pct(lossRate(strict[h.id]))}`);
  }
}

function report(ctx) {
  const { A, heists, head, base, strict, fixRes, baseSweep, sweep, readings, gen, traceStrict, traceDefault, sampleHeist } = ctx;
  const L = [];
  const push = (...x) => L.push(...x);
  const allBase = merge(base), allStrict = merge(strict);

  push(`# Heisty Spideys — Monte Carlo Rules Report`, "");
  push(`Generated by \`node sim/run.mjs --runs ${A.runs} --seed ${A.seed}${A.heist ? " --heist " + A.heist : ""}\` (parameter sweeps and fix experiments: ${A.sweepRuns} runs per heist per variant). Rulebook v4.5, rulings from book/REVIEW.md §A–B. Every heist is played by a crew of five legal random spiders (Ch 7), start to finish: Planning, the heist obstacles, a generated Escape, the Debrief. Same seed → same report.`, "");
  push(`**How to read it.** The book leaves many calls to the Storyteller. Each one is a named parameter (§7). Three readings run at full size:`, "");
  push(`- **default**: the simulator's best reading of the book. Partial = −1 die on the spider's next roll, no Alert: variant **(b)**.`);
  push(`- **generous**: every ambiguous rule read in the crew's favour.`);
  push(`- **strict**: every ambiguous rule read against the crew. That includes Partial = +1 Alert (variant **(a)**), opposed creature rolls, creatures adding their Alert everywhere, two rolls per obstacle, humans and Full Alert pursuers landing hits, and the round cap at 5.`, "");
  push(`The real game lies somewhere between generous and strict. Where a number moves a lot between them, the rules are underspecified at that point.`, "");

  /* ---- Top findings ---- */
  push(`## 1. Top findings`, "");
  push(...topFindings(ctx).map((f, i) => `${i + 1}. ${f}`), "");

  /* ---- Headline ---- */
  push(`## 2. Win / Partial / Loss by heist`, "");
  const names = Object.keys(head);
  push(table(["Heist (Limit)", ...names.map(n => `${n}<br>win · partial · loss · AP`)],
    heists.map(h => [`${h.n}. ${h.name} (${h.difficulty}, ${h.limit})`, ...names.map(n => {
      const r = head[n][h.id];
      return `${pct(winRate(r), 1)} · ${pct(partRate(r), 1)} · ${pct(lossRate(r), 2)} · ${num(apAvg(r), 2)}`;
    })])), "");
  push(`AP is per spider: Full Success pays the difficulty's award (Easy 2 · Standard 3 · Hard 5); a Partial pays half, rounded down (Easy 1 · Standard 1 · Hard 2); a Loss pays 0.`, "");
  push(`### Variant (a) vs (b): does a Partial raise the Alert?`, "");
  push(table(["Heist", "(b) win", "(a) win", "Δ", "(b) Full Alert", "(a) Full Alert", "strict+(b) win", "strict (a) win", "Δ"],
    heists.map(h => {
      const b = base[h.id], a = head["Partial +1 Alert (a)"][h.id], sb = head["strict, Partial no Alert (b)"][h.id], sa = strict[h.id];
      return [`${h.n}. ${h.name}`, pct(winRate(b)), pct(winRate(a)), sgn(100 * (winRate(a) - winRate(b))) + " pts", pct(faRate(b)), pct(faRate(a)), pct(winRate(sb)), pct(winRate(sa)), sgn(100 * (winRate(sa) - winRate(sb))) + " pts"];
    })), "");

  /* ---- Alert ---- */
  push(`## 3. Alert trajectories`, "");
  for (const [label, set] of [["default", base], ["strict", strict]]) {
    push(`### ${label} reading: average Alert after each obstacle`, "");
    const ids = [...new Set(heists.flatMap(h => [...h.obstacles.map(o => o.id), "E1", "E2"]))];
    push(table(["Heist", "Limit", ...ids, "% Full Alert", "Full Alert reached at (share of runs)"], heists.map(h => {
      const r = set[h.id];
      const fa = Object.entries(r.fullAlertAt).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v / r.runs)}`).join(", ") || "—";
      return [`${h.n}. ${h.name}`, h.limit, ...ids.map(id => r.alertAfter[id] ? num(r.alertAfter[id][0] / r.alertAfter[id][1], 1) : "—"), pct(faRate(r)), fa];
    })), "");
  }
  push(`### Where the Alert comes from (per run, default | strict)`, "");
  const causes = [...new Set([...Object.keys(allBase.alertBy), ...Object.keys(allStrict.alertBy)])].sort();
  push(table(["Heist", ...causes], heists.map(h => [`${h.n}`, ...causes.map(c => `${num((base[h.id].alertBy[c] ?? 0) / base[h.id].runs, 2)} \\| ${num((strict[h.id].alertBy[c] ?? 0) / strict[h.id].runs, 2)}`)])), "");
  push(`*creature* = per-round Alert Contributions; *critical* = the −1 from Criticals; *scene* = Make a Scene; *loud* = forcing a lock/lid/guard with Brawl or Athletics; *flaw* = Dramatic / Allergic to Dust; *out* = spiders going Out; *spotted* = the guard spider noticing the crew; *shriek* = the parrot; *ratBad* = the rat deal going bad.`, "");

  /* ---- Dice ---- */
  push(`## 4. Dice, Vitality and the Waiting Web`, "");
  push(table(["Heist", "rolls/run", "mean pool", "mean D", "bonus dice/roll", "Critical", "Success", "Partial", "Failure", "Botch", "clean fail", "Critical impossible", "hits/run", "hits that land", "Outs/run", "runs with an Out", "Loss"],
    [...heists.map(h => [h, base[h.id], "default"]), ...heists.map(h => [h, strict[h.id], "strict"])].map(([h, r, lab]) => {
      const n = r.c.rolls || 1;
      const outRuns = 1 - (r.outsHist[0] ?? 0) / r.runs;
      return [`${h.n} ${lab}`, num(n / r.runs, 1), num(r.c.poolSum / n, 1), num(r.c.diffSum / n, 2), num((r.c.bonusDiceSum ?? 0) / n, 1),
        pct(r.results.critical / n), pct(r.results.success / n), pct(r.results.partial / n), pct(r.results.failure / n), pct(r.results.botch / n, 2), pct(r.results.cleanfail / n, 2),
        pct((r.c.critImpossible ?? 0) / n), num((r.c.hits ?? 0) / r.runs, 2), r.c.hits ? pct(1 - (r.c.hitsShrugged ?? 0) / r.c.hits) : "—", num((r.c.outs ?? 0) / r.runs, 3), pct(outRuns), pct(lossRate(r), 2)];
    })), "");
  push(`Spiders Out per run (strict), as a distribution:`, "");
  push(table(["Heist", "0", "1", "2", "3", "4", "5+"], heists.map(h => {
    const r = strict[h.id], H = r.outsHist;
    const g = k => (H[k] ?? 0) / r.runs;
    const five = Object.entries(H).filter(([k]) => Number(k) >= 5).reduce((a, [, v]) => a + v, 0) / r.runs;
    return [`${h.n}. ${h.name}`, pct(g(0)), pct(g(1)), pct(g(2)), pct(g(3)), pct(g(4)), pct(five)];
  })), "");

  /* ---- Silk ---- */
  push(`## 5. Silk Points`, "");
  for (const [label, all] of [["default", allBase], ["strict", allStrict]]) {
    const played = all.c.spidersPlayed || 1;
    push(`**${label}:** ${num(all.c.silkStart / played, 1)} SP per spider at the start, ${num(all.c.silkEnd / played, 1)} at the end (${pct(all.c.silkEnd / all.c.silkStart)} unspent). ${pct((all.c.spidersHoarded ?? 0) / played)} of spiders finish with ≥ 75% of their Silk.`, "");
    const spent = Object.entries(all.silkSpent).sort((a, b) => b[1] - a[1]);
    const earned = Object.entries(all.silkEarned).sort((a, b) => b[1] - a[1]);
    push(table(["Spent on", "SP per run", "", "Earned from", "SP per run"], Array.from({ length: Math.max(spent.length, earned.length) }, (_, i) => [
      spent[i]?.[0] ?? "", spent[i] ? num(spent[i][1] / all.runs, 3) : "", "", earned[i]?.[0] ?? "", earned[i] ? num(earned[i][1] / all.runs, 3) : ""])), "");
  }

  /* ---- Abilities ---- */
  push(`## 6. Species, Roles, Perks and Flaws`, "");
  push(`*used* = share of heists (with that option in the crew) where it fired at least once. For Flaws, *changed a result* counts the uses that earned a Flaw Moment or flipped a roll; *modifier* marks always-on bonuses whose effect on single rolls isn't tracked. *changed a result* = uses that flipped a roll, cancelled an Alert rise or cleared an obstacle outright. *win Δ (strict)* = the strict-reading win rate of crews that include it, minus the strict win rate of comparable crews: for a Perk, crews with the same Role (so the Role's own effect isn't counted); otherwise all crews (all five heists pooled). A Role's own row compares with all crews. The default reading is too easy to separate options, so the Δ uses strict.`, "");
  push(abilityTable(allBase, allStrict), "");

  /* ---- Params ---- */
  push(`## 7. Storyteller judgements (parameters) and how much they matter`, "");
  push(`### 7a. Each ambiguous rule: generous vs strict reading`, "");
  push(`One rule at a time is switched between its generous and its strict reading. The other rules stay at the default reading (left) or the strict reading (right). Win rate is pooled over the five heists (${A.sweepRuns} runs each). *swing* = strict-reading win minus generous-reading win. The rows are sorted by the swing against the strict baseline, which is where the rules bite. Presets are listed in §7c.`, "");
  push(table(["rule", "generous → strict reading", "others default: win (gen · strict)", "swing", "others strict: win (gen · strict)", "swing", "heist most affected (others strict)"],
    readings.map(r => {
      const wg = winRate(merge(r.dg)), wst = winRate(merge(r.dst)), sg = winRate(merge(r.sg)), sst = winRate(merge(r.sst));
      let worst = null;
      for (const h of heists) { const dv = winRate(r.sst[h.id]) - winRate(r.sg[h.id]); if (!worst || Math.abs(dv) > Math.abs(worst.dv)) worst = { h, dv }; }
      return { r, wg, wst, sg, sst, worst };
    }).sort((a, b) => (a.sst - a.sg) - (b.sst - b.sg)).map(({ r, wg, wst, sg, sst, worst }) => [
      `\`${r.k}\` — ${PARAMS[r.k].title}`, `${JSON.stringify(r.g)} → ${JSON.stringify(r.st)}`,
      `${pct(wg)} · ${pct(wst)}`, sgn(100 * (wst - wg)), `${pct(sg)} · ${pct(sst)}`, sgn(100 * (sst - sg)),
      `${worst.h.n}. ${worst.h.name}: ${pct(winRate(r.sg[worst.h.id]), 0)} → ${pct(winRate(r.sst[worst.h.id]), 0)}`])), "");
  push(`### 7b. Every alternative value`, "");
  push(`Each row changes one parameter from the default (left block) or from the strict preset (right block). Win rates are pooled over the five heists (${A.sweepRuns} runs each). The largest per-heist change is shown too.`, "");
  const bd = merge(baseSweep.d), bs = merge(baseSweep.s);
  push(`Baseline at sweep size: default win ${pct(winRate(bd))}, strict win ${pct(winRate(bs))}.`, "");
  const rows = [];
  for (const s of sweep) {
    const md = merge(s.d), ms = merge(s.s);
    let worst = { h: null, dv: 0 };
    for (const h of heists) {
      const dv = winRate(s.s[h.id]) - winRate(baseSweep.s[h.id]);
      if (Math.abs(dv) > Math.abs(worst.dv)) worst = { h, dv };
    }
    rows.push([`\`${s.k}\``, `${JSON.stringify(PARAMS[s.k].default)} → ${JSON.stringify(s.alt)}`, pct(winRate(md)), sgn(100 * (winRate(md) - winRate(bd))), `${JSON.stringify(PRESETS.strict[s.k] ?? PARAMS[s.k].default)} → ${JSON.stringify(s.sAlt)}`, pct(winRate(ms)), sgn(100 * (winRate(ms) - winRate(bs))), worst.h ? `${worst.h.n}: ${sgn(100 * worst.dv)}` : "—", pct(lossRate(ms), 2)]);
  }
  push(table(["parameter", "default →", "win", "Δ pts", "strict →", "win", "Δ pts", "biggest heist Δ (strict)", "strict loss"], rows), "");
  push(`### 7c. Parameter definitions`, "");
  for (const [k, p] of Object.entries(PARAMS)) {
    push(`- **\`${k}\`** — ${p.title}. Default \`${JSON.stringify(p.default)}\`; alternatives ${p.alts.map(x => "`" + JSON.stringify(x) + "`").join(", ")}${PRESETS.strict[k] !== undefined ? `; strict \`${JSON.stringify(PRESETS.strict[k])}\`, generous \`${JSON.stringify(PRESETS.generous[k])}\`` : ""}. ${p.doc} *(${p.ref})*`);
  }
  push("");

  /* ---- Fixes ---- */
  push(`## 8. Fix experiments (proposed rule changes from the table playtests)`, "");
  push(`These are candidate fixes, not readings of the current text: what would happen if the book adopted them.`, "");
  push(table(["experiment", "default win", "default Full Alert", "strict win", "strict Full Alert", "strict loss", "per heist, strict win"], [
    ["(none)", pct(winRate(bd)), pct(faRate(bd)), pct(winRate(bs)), pct(faRate(bs)), pct(lossRate(bs), 2), heists.map(h => `${h.n}: ${pct(winRate(baseSweep.s[h.id]), 0)}`).join(" · ")],
    ...Object.entries(fixRes).map(([name, f]) => {
      const d = merge(f.d), s = merge(f.s);
      return [name, pct(winRate(d)), pct(faRate(d)), pct(winRate(s)), pct(faRate(s)), pct(lossRate(s), 2), heists.map(h => `${h.n}: ${pct(winRate(f.s[h.id]), 0)}`).join(" · ")];
    })]), "");

  /* ---- Issues ---- */
  push(`## 9. Issue detectors`, "");
  push(`Counts are per 1,000 heists. *runs* = share of heists where it happened at least once. **gap** = the rules don't say what happens (the simulator had to choose); **broken** = defined, but degenerate or contradictory in play; **info** = worth knowing.`, "");
  const codes = Object.keys(ISSUES).sort((a, b) => ((allStrict.issues[b]?.runs ?? 0) + (allBase.issues[b]?.runs ?? 0)) - ((allStrict.issues[a]?.runs ?? 0) + (allBase.issues[a]?.runs ?? 0)));
  push(table(["detector", "kind", "default /1000 · runs", "strict /1000 · runs", "worst heist (strict)", "book"], codes.map(c => {
    const d = allBase.issues[c], s = allStrict.issues[c];
    let worst = null;
    for (const h of heists) { const e = strict[h.id].issues[c]; if (e && (!worst || e.runs > worst.e.runs)) worst = { h, e }; }
    return [`**${c}** — ${esc(ISSUES[c].title)}`, ISSUES[c].kind, d ? `${num(1000 * d.count / allBase.runs, 1)} · ${pct(d.runs / allBase.runs)}` : "0", s ? `${num(1000 * s.count / allStrict.runs, 1)} · ${pct(s.runs / allStrict.runs)}` : "0", worst ? `${worst.h.n} (${pct(worst.e.runs / strict[worst.h.id].runs)})` : "—", esc(ISSUES[c].ref)];
  })), "");
  push(`### Example situations`, "");
  for (const c of codes) {
    const ex = [...(allStrict.issues[c]?.examples ?? []), ...(allBase.issues[c]?.examples ?? [])].slice(0, 3);
    if (!ex.length) continue;
    push(`- **${c}**${ISSUES[c].note ? " — " + ISSUES[c].note : ""}`);
    for (const e of ex) push(`  - \`${e}\``);
  }
  push("");

  /* ---- Obstacles ---- */
  push(`## 10. Obstacles: how they were cleared`, "");
  push(table(["Heist", "obstacle", "assumed?", "rounds (default \\| strict)", "rolls (default \\| strict)", "stuck at cap (strict)", "skipped (strict)", "cleared by (default, top 4)"],
    heists.flatMap(h => [...h.obstacles, ...makeEscape(h, 2)].map(o => {
      const b = base[h.id].obs[o.id], s = strict[h.id].obs[o.id];
      const by = b ? Object.entries(b.clearedBy).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k, v]) => `${k} ${pct(v / (b.entered || 1), 0)}`).join(", ") : "—";
      const q = (r, f) => r && r.entered ? num(r[f] / r.entered, 2) : "—";
      return [`${h.n}`, esc(o.name), o.assumed || o.approaches.some(a => a.assumed) ? "yes" : "", `${q(b, "rounds")} \\| ${q(s, "rounds")}`, `${q(b, "rolls")} \\| ${q(s, "rolls")}`, s ? pct(s.stuck / strict[h.id].runs) : "—", s ? pct(s.skipped / strict[h.id].runs) : "—", esc(by)];
    }))), "");

  /* ---- Heist data ---- */
  push(`## 11. The heists as modelled`, "");
  for (const h of heists) {
    push(`### ${h.n}. ${h.name} — ${h.difficulty}, Limit ${h.limit}, loot ${h.loot} (${h.ref})`, "");
    push(`Creatures: ${(h.creatures ?? []).map(id => `${CREATURES[id].name} (active from Alert ${CREATURES[id].wake === Infinity ? "when aware" : CREATURES[id].wake}, +${CREATURES[id].perRound}/round${CREATURES[id].attack ? ", attack " + CREATURES[id].attack.pool : ""})`).join("; ") || "none"}. Intel: ${h.intel.map(i => `“${i.text}” → ${i.obstacle ?? "no obstacle"}`).join("; ")}.`, "");
    for (const o of [...h.obstacles, ...makeEscape(h, 2)]) {
      const ap = o.approaches.map(a => `${a.skill} D${a.diff} (${a.mode}${a.opposed ? ", opposed vs " + a.opposed : ""}${a.loud ? ", loud +" + a.loud : ""}${a.excludeRoles ? ", not " + a.excludeRoles.join("/") : ""})`).join(" · ");
      push(`- **${o.id} ${o.name}**${o.objective ? " — *objective*" : ""}${o.unknown ? " — *unknown*" : ""}: ${ap}. Tags: ${o.tags.join(", ") || "—"}.${o.assumed ? ` **Assumed:** ${o.reason}` : ""}`);
    }
    push("");
  }

  /* ---- Undefined rules ---- */
  push(`## 12. What the book leaves undefined`, "");
  push(`Each entry gives the book reference and what the simulator did. Parameters are in §7; counts are in §9.`, "");
  for (const g of RULE_GAPS) push(`- **${g.title}** *(${g.ref})* — ${g.text}${g.param ? ` → \`${g.param}\`` : ""}${g.detector ? ` · detector \`${g.detector}\`` : ""}`);
  push("");

  /* ---- Modelling coverage ---- */
  push(`## 13. What is modelled`, "");
  push(`**Modelled:** ${MODELLED.join("; ")}.`, "");
  push(`**Not modelled (and why):**`, "");
  for (const [k, why] of NOT_MODELLED) push(`- *${k}* — ${why}`);
  push("");

  /* ---- Generator ---- */
  push(`## 14. Character generator`, "");
  const v = Object.entries(gen.violations);
  push(`${gen.built} spiders built for the headline runs (${Object.entries(gen.byBuild).map(([k, n]) => `${k} ${pct(n / gen.built, 0)}`).join(", ")}). Each one is checked with \`finalAttributes\`, \`attributesSpent\` and \`skillBudget\` from module/logic/rules.mjs. Rules the generator could not satisfy: ${v.length ? v.map(([k, n]) => `${k} ×${n}`).join("; ") : "**none**"}. Pack/config consistency: ${dataConsistencyIssues().join("; ") || "consistent"}.`, "");
  push(`Policies: *specialist* (role Attributes weighted ×6, both core skills 3, three more skills at 3), *generalist* (no Attribute above 4, core skills 2, the rest spread at 1–2), *random* (uniform). Crew: five different Roles, random species (param \`crewComposition\`).`, "");

  /* ---- Traces ---- */
  push(`## 15. Sample heists (full traces)`, "");
  for (const [label, tr, h] of [["Strict reading", traceStrict, sampleHeist], ["Default reading", traceDefault, heists[0]]]) {
    if (!tr) continue;
    push(`### ${label} — ${h.name}`, "");
    push("```");
    for (const c of tr.crew) push(`${c.name.padEnd(14)} ${c.species.padEnd(9)} ${c.role.padEnd(9)} ${Object.entries(c.attrs).map(([k, x]) => k.toUpperCase() + " " + x).join(" ")} | ${Object.entries(c.skills).filter(([, x]) => x).map(([k, x]) => k + " " + x).join(", ")} | ${c.perks.join(", ")} | ${c.flaw} | Silk ${c.silkMax}`);
    push("");
    push(...tr.result.trace);
    push("```", "");
  }
  return L.join("\n") + "\n";
}

const NOT_MODELLED_KEYS = new Set(["species:crab", "perk:ghost-protocol", "perk:i-was-never-here", "perk:dead-drop", "perk:planted-evidence", "perk:shortcut", "perk:trap-architect", "perk:pattern-recognition", "perk:silk-grapple", "perk:double-bluff", "perk:quick-change", "perk:always-a-way-out"]);
const MODIFIER_KEYS = new Set(["sig:wheelman", "perk:escape-routes", "perk:drafting", "perk:tactical-feed", "perk:soundless", "perk:dont-look-down", "perk:unfazed", "perk:method-actor", "perk:the-long-con", "perk:negotiating-position", "perk:passenger", "perk:overclock"]);

const PERK_ROLE = Object.fromEntries(Object.entries(ROLES).flatMap(([r, x]) => x.perks.map(p => [`perk:${p}`, r])));
/** Strict win-rate baseline for an option: its role's crews for a Perk, all crews otherwise. */
function winBaseline(allStrict, k) {
  const r = PERK_ROLE[k];
  const rs = r && allStrict.ability[`role:${r}`];
  return rs?.crews ? rs.wins / rs.crews : winRate(allStrict);
}

function abilityTable(allBase, allStrict) {
  const keys = Object.keys({ ...allBase.ability, ...allStrict.ability }).filter(k => /^(species|role|perk|flaw|sig):/.test(k));
  const rows = [];
  const presentKey = k => k.startsWith("sig:") ? "role:" + k.slice(4) : k;
  const kinds = ["species", "role", "sig", "perk", "flaw"];
  const all = new Set(keys);
  for (const r of Object.keys(ROLES)) { all.add(`role:${r}`); all.add(`sig:${r}`); }
  for (const k of [...all].sort((a, b) => kinds.indexOf(a.split(":")[0]) - kinds.indexOf(b.split(":")[0]) || a.localeCompare(b))) {
    const pk = presentKey(k);
    const pres = allBase.ability[pk], used = allBase.ability[k];
    const presS = allStrict.ability[pk];
    if (!pres?.crews) continue;
    const usedS = allStrict.ability[k];
    const role = k.startsWith("role:");
    const usedShare = role ? null : (used?.usedRuns ?? 0) / pres.crews;
    const usedShareS = role || !presS?.crews ? null : (usedS?.usedRuns ?? 0) / presS.crews;
    const flips = (used?.flips ?? 0) + (usedS?.flips ?? 0), uses = (used?.uses ?? 0) + (usedS?.uses ?? 0);
    const winD = presS?.crews ? presS.wins / presS.crews - winBaseline(allStrict, k) : NaN;
    const maxUse = Math.max(usedShare ?? 0, usedShareS ?? 0);
    const flag = role ? "" : NOT_MODELLED_KEYS.has(k) ? "not modelled" : maxUse === 0 ? "**never fires**" : maxUse < 0.05 ? "rarely fires" : (winD > 0.04 ? "**dominant?**" : winD < -0.04 ? "**liability?**" : "");
    rows.push([k.replace("sig:", "signature:"), pct(pres.crews / allBase.runs, 0), role ? "—" : `${pct(usedShare, 0)} \\| ${pct(usedShareS, 0)}`, `${used ? num(used.uses / pres.crews, 2) : "0"} \\| ${usedS && presS?.crews ? num(usedS.uses / presS.crews, 2) : "0"}`, MODIFIER_KEYS.has(k) ? "modifier" : uses ? pct(flips / uses) : "—", Number.isFinite(winD) ? sgn(100 * winD) + " pts" : "—", flag]);
  }
  return table(["option", "in crew", "used (default \\| strict)", "uses / heist (default \\| strict)", "changed a result", "win Δ (strict)", "flag"], rows);
}

/* ------------------------------------------------------ top findings -- */

function topFindings(ctx) {
  const { heists, head, base, strict, fixRes, sweep, baseSweep, readings } = ctx;
  const allB = merge(base), allS = merge(strict);
  const a = merge(head["Partial +1 Alert (a)"]);
  const gen = merge(head["generous"]);
  const n = allB.c.rolls || 1;
  const byH = (set, f) => heists.map(h => `${h.n} ${f(set[h.id])}`).join(" · ");
  const iss = (all, c) => all.issues[c] ? all.issues[c].runs / all.runs : 0;
  const sw = (k, alt) => sweep.find(x => x.k === k && JSON.stringify(x.alt) === JSON.stringify(alt));
  const bS = merge(baseSweep.s), bD = merge(baseSweep.d);
  const out = [];

  // 1. Too easy
  const failRate = allB.results.failure / n, critRate = allB.results.critical / n;
  out.push(`**By the book, a crew of five almost can't lose these heists. That's a rules finding, not a simulator bug.** Default-reading win rate by heist: ${byH(base, r => pct(winRate(r)))}. Even reading *every* ambiguous rule against the crew (strict) leaves ${pct(winRate(allS))} pooled (generous: ${pct(winRate(gen))}). The cause is the dice. A Failure needs zero Successes. The mean final pool is ${num(allB.c.poolSum / n, 1)} dice against a mean Difficulty of ${num(allB.c.diffSum / n, 2)}, so ${pct(failRate, 2)} of rolls fail and ${pct(critRate)} are Criticals. A specialist brings Attribute 4–5 + Skill 3. Free bonus dice then stack on top at ${num((allB.c.bonusDiceSum ?? 0) / n, 1)} per roll: Assist (minimum 1 die), Make a Scene +2, Tactical Feed +1 every round, I Called It, intel, Boost, Decoy. I checked the pools against the rules roll by roll (trace in §15), and the three table playtests saw the same 10–14-die pools and Alert peaking around 3/10.`);

  // 2. Alert economy
  const crit = -(allB.alertBy.critical ?? 0) / allB.runs;
  const rises = Object.entries(allB.alertBy).filter(([k]) => k !== "critical").reduce((x, [, v]) => x + v, 0) / allB.runs;
  const cancels = ["perk:plausible-deniability", "perk:smoke-and-mirrors", "perk:abort-abort", "sig:face", "silk:damageControl"].reduce((x, k) => x + (allB.ability[k]?.flips ?? 0), 0) / allB.runs;
  out.push(`**The Alert barely moves, because Criticals and cancels undo most rises.** Per heist (default), Alert rises total ${num(rises, 2)}. Criticals take back ${num(crit, 2)}, and cancels (Plausible Deniability, Smoke and Mirrors, Abort Abort, That's Not What Happened, Damage Control) stop another ${num(cancels, 2)} before they land. Ruling B28's "Difficulty 2+" floor doesn't help: 7–8 dice at D2 are Criticals 50–64% of the time. The Escape reducers stack (Escape Routes + I Know a Way, \`ESCAPE_STACK_D1\` in ${pct(iss(allB, "ESCAPE_STACK_D1"))} of heists), pushing Escape rolls to D1, where one Success is a full success (\`PARTIAL_IMPOSSIBLE\`). A Critical at Alert 0 is wasted in ${pct(iss(allB, "CRIT_AT_ZERO_ALERT"))} of heists.`);

  // 3. Ranked ambiguities
  const ranked = readings.map(r => ({ r, sw: winRate(merge(r.sst)) - winRate(merge(r.sg)), dsw: winRate(merge(r.dst)) - winRate(merge(r.dg)) })).sort((x, y) => x.sw - y.sw);
  const worstH = r => { let w = null; for (const h of heists) { const dv = winRate(r.sst[h.id]) - winRate(r.sg[h.id]); if (!w || dv < w.dv) w = { h, dv }; } return w; };
  out.push(`**The ambiguous rules that matter most (§7a).** Each is switched from its generous to its strict reading, with every other rule strict: ${ranked.slice(0, 5).map(({ r, sw: x }) => { const w = worstH(r.r ?? r); return `\`${r.k}\` ${sgn(100 * x)} pts (worst: ${w.h.name} ${pct(winRate(r.sg[w.h.id]), 0)} → ${pct(winRate(r.sst[w.h.id]), 0)})`; }).join("; ")}. With every other rule at the default reading, none of them moves the win rate by more than ${num(Math.max(...ranked.map(x => Math.abs(100 * x.dsw))), 1)} points. The crew's margin absorbs any single call; the ambiguities only matter once the ST is otherwise tough.`);

  // 4. Partial (a) vs (b)
  const sa = strict, sb = head["strict, Partial no Alert (b)"];
  out.push(`**Partial +1 Alert, (a) vs (b).** Default reading: win ${pct(winRate(allB))} (b) vs ${pct(winRate(a))} (a); Full Alert ${pct(faRate(allB))} vs ${pct(faRate(a))}. Strict reading: (b) ${pct(winRate(merge(sb)))} vs (a) ${pct(winRate(allS))}. By heist, strict: ${heists.map(h => `${h.n} ${pct(winRate(sb[h.id]), 0)}→${pct(winRate(sa[h.id]), 0)}`).join(" · ")}. Under (a), Partials add ${num((allS.alertBy.partial ?? 0) / allS.runs, 2)} Alert per strict heist. It hurts most where the crew must cross individually past a creature (Cookie, Library). Whichever way the book rules on Partials, it should rule on group checks at the same time (next finding).`);

  // 5. Group checks
  let single = 0, indiv = 0;
  for (const h of heists) for (const o of h.obstacles) {
    const modes = new Set(o.approaches.map(x => x.mode));
    if (modes.size < 2) continue;
    const cb = base[h.id].obs[o.id]?.clearedBy ?? {};
    for (const [k, v] of Object.entries(cb)) { if (k.startsWith("roll:")) single += v; else if (k === "individual") indiv += v; }
  }
  const gr = readings.find(r => r.k === "groupRolls");
  out.push(`**There is no group-check rule, so one specialist's roll beats the whole crew sneaking.** Where an obstacle can be solved by one spider's roll *or* by everyone rolling (charm vs sneak past the cat, deceive vs sneak past the librarian, jam vs cross the sensor), the crew picks the single roll ${pct(single / Math.max(1, single + indiv))} of the time. Five individual Stealth rolls are five chances of a Failure, a Partial or a weak spider stuck at 1–2 dice. Letting one leader roll for the crew (\`groupRolls\`) is worth ${gr ? sgn(-100 * (winRate(merge(gr.sst)) - winRate(merge(gr.sg)))) : "?"} points strict (Pet Store ${gr ? pct(winRate(gr.sst.petstore), 0) + " → " + pct(winRate(gr.sg.petstore), 0) : "?"}). The book implies individual rolls (Drafting: "each crewmate… movement rolls") but never says so.`);

  // 6. Heist difficulty order
  const order = heists.slice().sort((x, y) => winRate(strict[x.id]) - winRate(strict[y.id]));
  out.push(`**The heists' difficulty labels don't predict how hard they play. Creatures do.** Strict win rate, hardest first: ${order.map(h => `${h.name} (${h.difficulty}, Limit ${h.limit}) ${pct(winRate(strict[h.id]))}`).join(" · ")}. Per-round creature Alert per strict heist: ${byH(strict, r => num((r.alertBy.creature ?? 0) / r.runs, 1))}. The "Easy" Cookie heist has a cat awake from obstacle 1, and the "Standard" Pet Store has two creatures the text makes aware on sight. The "Hard" Restaurant has only humans and a rat with no per-round Alert. Humans never add Alert per round and have no attack, so human-only locations are the safest. \`CREATURE_ALONE_FULL_ALERT\`: ${pct(iss(allS, "CREATURE_ALONE_FULL_ALERT"))} of strict heists. The Limit ≤ 6 locations also skip the Alert 7 escalations entirely (the cat never hunts at Limit 6) and the Lockdown penalty (\`FULL_ALERT_NO_LOCKDOWN\`).`);

  // 7. Bypasses + casing
  const o2 = base.cookie?.obs.O2;
  const o3 = base.office?.obs.O3, o1 = base.office?.obs.O1;
  const cleared = (o, re) => o ? Object.entries(o.clearedBy).filter(([k]) => re.test(k)).reduce((x, [, v]) => x + v, 0) / (o.entered || 1) : NaN;
  out.push(`**Planning and a few abilities delete whole obstacles with no roll.** A Silk Line pre-placed during Planning clears the Cookie cabinet climb in ${pct(cleared(o2, /SilkLine|silk|orb/i))} of heists (\`SILK_LINE_BYPASS\`; the text says "Acrobatics to climb"). No-roll gadgets clear the Office's motion sensors in ${pct(cleared(o1, /spitting|tinkerer/))} and its locked drawer ("Engineering moment") in ${pct(cleared(o3, /spitting|tinkerer/))} of heists. That's I Made a Thing: Bypass every scene, plus the Spitting Spider's jam, which has no usage limit at all (\`MECH_BYPASS\` ${pct(iss(allB, "MECH_BYPASS"))} of default heists). Casing is a formality: ${num((allB.c.casingSuccesses ?? 0) / allB.runs, 1)} Successes per heist for 3 facts (\`CASING_OVERFLOW\` ${pct(iss(allB, "CASING_OVERFLOW"))}), with no cost for failing. Familiar Face can even reveal the "unknown" obstacle.`);

  // 8. Loss / hits / Waiting Web
  const land = allS.c.hits ? 1 - (allS.c.hitsShrugged ?? 0) / allS.c.hits : NaN;
  out.push(`**Loss is effectively impossible, and the Waiting Web almost never activates.** Loss: default ${pct(lossRate(allB), 2)}, strict ${pct(lossRate(allS), 2)}. Spiders Out per heist: default ${num((allB.c.outs ?? 0) / allB.runs, 3)}, strict ${num((allS.c.outs ?? 0) / allS.runs, 3)}, even with threats attacking every round and humans and Full Alert pursuers landing hits (strict). Ch 10 says "a solid hit from a real threat will get through more often than not", but only ${pct(land)} of hits land. Attack pools are 3–4 dice (Pounce 4, Strike 4, Brawl 3) against BODY + Endurance of 4–8, ties go to the defender, and a level comes back every obstacle. Structural gaps the dice rarely reach: a spider Out in the last obstacle never gets a replacement; Alert past the Limit does nothing (\`ALERT_PAST_LIMIT\` ${pct(iss(allS, "ALERT_PAST_LIMIT"))} strict); a Full Alert Escape has no pursuit rule; and humans have no stat block to roll with or against.`);

  // 9. Silk
  const played = allB.c.spidersPlayed || 1;
  const spendy = sw("silkPolicy", "spendy"), hoard = sw("silkPolicy", "hoard");
  out.push(`**Silk Points are mostly unspent.** ${pct((allB.c.spidersHoarded ?? 0) / played)} of spiders (default) and ${pct((allS.c.spidersHoarded ?? 0) / (allS.c.spidersPlayed || 1))} (strict) end with ≥ 75% of their starting Silk. Counting Silk earned mid-heist, crews finish holding ${pct(allB.c.silkEnd / allB.c.silkStart)} as much Silk as they started with (default). The rolls rarely need it. Policy matters only under strict: \`silkPolicy\` hoard ${hoard ? sgn(100 * (winRate(merge(hoard.s)) - winRate(bS))) : "?"} pts, spendy ${spendy ? sgn(100 * (winRate(merge(spendy.s)) - winRate(bS))) : "?"} pts. The biggest spends are Improvise (the weak spiders' way through Stealth) and the 1-SP Silk Line. Compulsive Planner is Silk-neutral by construction (\`COMPULSIVE_NET_ZERO\`).`);

  // 10. Dead content + fixes
  const outliers = Object.entries(allS.ability).filter(([k, v]) => /^(perk|flaw|species|role):/.test(k) && v.crews > 0.1 * allS.runs)
    .map(([k, v]) => [k, v.wins / v.crews - winBaseline(allS, k)]).filter(([, d]) => Math.abs(d) >= 0.025).sort((x, y) => y[1] - x[1]);
  const fixes = Object.entries(fixRes).map(([k, f]) => `${k}: strict ${pct(winRate(merge(f.s)))}, default ${pct(winRate(merge(f.d)))}`).join("; ");
  out.push(`**Dead content, and what the playtest fixes would do.** Never or almost never fires in these five heists: Fear of Vacuums (no vacuum anywhere), Butterfingers (a sensible crew never hands its spider the loot), Loud and Arachnophobe Magnet (the crew avoids Stealth near humans and high Alert), Contingency (it triggers on a Failure, and those almost never happen), Field Repair, and the Jumping Spider and Orb Weaver abilities (no gaps; the climb is pre-lined). See §6. Show-Off's "Difficulty 4 version" would make a Difficulty 5 roll easier. Balance outliers (strict win rate of crews that include it vs comparable crews, §6; ±2.5 pts or more): ${outliers.map(([k, d]) => `${k} ${sgn(100 * d)}`).join(", ") || "none"}. Fix experiments (§8; baseline strict ${pct(winRate(bS))}, default ${pct(winRate(bD))}): ${fixes}. None of them restores real risk under the default reading. The Spitting limit changes nothing here because each heist has at most one sensor. The root causes are the dice-pool-to-Difficulty ratio and the missing group-check and Partial rules.`);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("run.mjs")) main();
