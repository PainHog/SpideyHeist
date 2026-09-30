#!/usr/bin/env node
/**
 * Heisty Spideys — balance-package comparison.
 *
 *   node sim/packages.mjs [--runs 5000] [--seed 1] [--packages P0,P1,P2,P3,P4,P4B,P4H]
 *                         [--rules '{"successFace":5}'] [--label name] [--out file.md] [--json file.json]
 *   node sim/packages.mjs --tables loo,tweaks,spend [--runs 2000]   (BALANCE.md §4–§5 side tables)
 *
 * Every package is the strict reading + the clarified baseline (params.mjs
 * CLARIFIED) + the package's own rule changes (params.mjs PACKAGES). `--rules`
 * adds an ad-hoc package for exploring. Prints Markdown tables (the ones in
 * sim/BALANCE.md) to stdout, or to --out.
 */

import { writeFileSync } from "node:fs";
import { HEISTS, HEIST_TWEAKS } from "./heists.mjs";
import { PACKAGES, packageParams } from "./params.mjs";
import { runVariant, merge, winBaseline } from "./run.mjs";

const pct = (x, d = 1) => (Number.isFinite(x) ? (100 * x).toFixed(d) + "%" : "—");
const num = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");
const sgn = (x, d = 1) => (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(d);
const table = (head, rows) => ["| " + head.join(" | ") + " |", "|" + head.map(() => "---").join("|") + "|", ...rows.map(r => "| " + r.join(" | ") + " |")].join("\n");

function args(argv) {
  const a = { runs: null, seed: 1, packages: Object.keys(PACKAGES), rules: null, label: "X", out: null, json: null, tables: null };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (k === "--runs") { a.runs = Number(v); i++; }
    else if (k === "--seed") { a.seed = Number(v); i++; }
    else if (k === "--packages" || k === "--package") { a.packages = v.split(",").filter(Boolean); i++; }
    else if (k === "--rules") { a.rules = JSON.parse(v); i++; }
    else if (k === "--label") { a.label = v; i++; }
    else if (k === "--out") { a.out = v; i++; }
    else if (k === "--json") { a.json = v; i++; }
    else if (k === "--tables") { a.tables = v.split(",").filter(Boolean); i++; }
    else if (k === "--help" || k === "-h") { console.log("node sim/packages.mjs [--runs N] [--seed N] [--packages P0,P1] [--rules JSON] [--label X] [--out file.md] [--json file]"); process.exit(0); }
  }
  a.runs ??= a.tables ? 2000 : 5000;
  if (a.rules && !a.packages.includes(a.label)) a.packages = [...(argv.includes("--packages") || argv.includes("--package") ? a.packages : []), a.label];
  return a;
}

/** Everything BALANCE.md reports for one package. */
export function summarize(recs) {
  const all = merge(recs);
  const n = all.c.rolls || 1;
  const byLabel = {};
  for (const h of HEISTS) {
    const r = recs[h.id];
    const b = (byLabel[h.difficulty] ??= { runs: 0, win: 0, partial: 0, loss: 0, outs: 0 });
    b.runs += r.runs; b.win += r.outcomes.win; b.partial += r.outcomes.partial; b.loss += r.outcomes.loss; b.outs += r.c.outs ?? 0;
  }
  const rises = Object.entries(all.alertBy).filter(([k]) => k !== "critical").reduce((x, [, v]) => x + v, 0) / all.runs;
  const hist = Array.from({ length: 11 }, (_, i) => all.c[`silkFrac:${i}`] ?? 0);
  const spiders = all.c.spidersWithSilk || 1;
  let acc = 0, medianDecile = 10;
  for (let i = 0; i <= 10; i++) { acc += hist[i]; if (acc >= spiders / 2) { medianDecile = i; break; } }
  const outliers = Object.entries(all.ability)
    .filter(([k, v]) => /^(perk|flaw|species|role):/.test(k) && v.crews > 0.1 * all.runs)
    .map(([k, v]) => [k, v.wins / v.crews - winBaseline(all, k)])
    .filter(([, d]) => Math.abs(d) >= 0.025)
    .sort((x, y) => y[1] - x[1]);
  return {
    heists: Object.fromEntries(HEISTS.map(h => {
      const r = recs[h.id];
      return [h.id, {
        win: r.outcomes.win / r.runs, partial: r.outcomes.partial / r.runs, loss: r.outcomes.loss / r.runs,
        fullAlert: (r.c.fullAlert ?? 0) / r.runs, outs: (r.c.outs ?? 0) / r.runs,
        outRuns: 1 - (r.outsHist[0] ?? 0) / r.runs,
        fail: ((r.results.failure + r.results.botch + r.results.cleanfail) / (r.c.rolls || 1)),
        crit: r.results.critical / (r.c.rolls || 1),
        creatureAlert: (r.alertBy.creature ?? 0) / r.runs,
        alertEnd: (r.c.alertEnd ?? 0) / r.runs
      }];
    })),
    byLabel: Object.fromEntries(Object.entries(byLabel).map(([k, b]) => [k, { win: b.win / b.runs, partial: b.partial / b.runs, loss: b.loss / b.runs, outs: b.outs / b.runs }])),
    win: all.outcomes.win / all.runs,
    results: {
      critical: all.results.critical / n, success: all.results.success / n, partial: all.results.partial / n,
      failure: all.results.failure / n, botch: all.results.botch / n, cleanfail: all.results.cleanfail / n
    },
    rollsPerRun: n / all.runs,
    meanPool: all.c.poolSum / n, meanD: all.c.diffSum / n, bonusDice: (all.c.bonusDiceSum ?? 0) / n,
    alertGained: rises, alertRemoved: -(all.alertBy.critical ?? 0) / all.runs, alertCapped: (all.c.alertCapped ?? 0) / all.runs,
    alertBy: Object.fromEntries(Object.entries(all.alertBy).map(([k, v]) => [k, v / all.runs])),
    fullAlert: (all.c.fullAlert ?? 0) / all.runs,
    outs: (all.c.outs ?? 0) / all.runs,
    hitsPerRun: (all.c.hits ?? 0) / all.runs,
    hitsLand: all.c.hits ? 1 - (all.c.hitsShrugged ?? 0) / all.c.hits : NaN,
    silkStart: all.c.silkStart / (all.c.spidersPlayed || 1),
    silkSpent: (all.c.silkSpentGross ?? 0) / spiders,
    spentHalf: (all.c.spidersSpentHalf ?? 0) / spiders,
    medianSpentDecile: medianDecile,
    silkSpentBy: Object.fromEntries(Object.entries(all.silkSpent).map(([k, v]) => [k, v / all.runs])),
    outliers
  };
}

export function renderComparison(names, S, titles = {}) {
  const L = [];
  const push = (...x) => L.push(...x);
  push("### Win · Partial · Loss by heist", "");
  push(table(["Heist", ...names], HEISTS.map(h => [`${h.n}. ${h.name} (${h.difficulty}, ${h.limit})`, ...names.map(p => {
    const x = S[p].heists[h.id];
    return `${pct(x.win, 1)} · ${pct(x.partial, 1)} · ${pct(x.loss, 2)}`;
  })])), "");
  push("### By difficulty label (win · partial · loss · Outs per heist)", "");
  push(table(["Label", ...names], ["easy", "standard", "hard"].map(l => [l, ...names.map(p => {
    const x = S[p].byLabel[l];
    return `${pct(x.win, 1)} · ${pct(x.partial, 1)} · ${pct(x.loss, 2)} · ${num(x.outs, 2)}`;
  })])), "");
  push("### Dice, Alert, Vitality, Silk", "");
  const row = (label, f) => [label, ...names.map(p => f(S[p]))];
  push(table(["Metric", ...names], [
    row("win (pooled)", s => pct(s.win)),
    row("Critical", s => pct(s.results.critical)),
    row("Success", s => pct(s.results.success)),
    row("Partial", s => pct(s.results.partial)),
    row("Failure", s => pct(s.results.failure)),
    row("Botch (+ clean fail)", s => `${pct(s.results.botch, 2)} (+${pct(s.results.cleanfail, 2)})`),
    row("rolls per heist", s => num(s.rollsPerRun, 1)),
    row("mean final pool", s => num(s.meanPool, 1)),
    row("mean final Difficulty", s => num(s.meanD, 2)),
    row("non-Silk bonus dice / roll", s => num(s.bonusDice, 2)),
    row("Alert gained / heist", s => num(s.alertGained, 2)),
    row("Alert removed by Criticals / heist", s => num(s.alertRemoved, 2)),
    row("Alert lost to the Limit cap / heist", s => num(s.alertCapped, 2)),
    row("Full Alert (share of heists)", s => pct(s.fullAlert)),
    row("hits / heist", s => num(s.hitsPerRun, 2)),
    row("hits that land", s => pct(s.hitsLand)),
    row("Outs / heist", s => num(s.outs, 3)),
    row("Silk at start / spider", s => num(s.silkStart, 1)),
    row("Silk spent / spider", s => num(s.silkSpent, 2)),
    row("spiders spending ≥ half their Silk", s => pct(s.spentHalf)),
    row("median spider spends", s => `${s.medianSpentDecile * 10}–${s.medianSpentDecile * 10 + 10}%`)
  ]), "");
  push("### Per heist: Failure rate · Critical rate · Outs · Full Alert", "");
  push(table(["Heist", ...names], HEISTS.map(h => [`${h.n}. ${h.name}`, ...names.map(p => {
    const x = S[p].heists[h.id];
    return `${pct(x.fail, 0)} · ${pct(x.crit, 0)} · ${num(x.outs, 2)} · ${pct(x.fullAlert, 0)}`;
  })])), "");
  push("### Heist order (hardest first)", "");
  for (const p of names) {
    const order = HEISTS.slice().sort((a, b) => S[p].heists[a.id].win - S[p].heists[b.id].win);
    push(`- **${p}**: ${order.map(h => `${h.name} (${h.difficulty}) ${pct(S[p].heists[h.id].win, 0)}`).join(" · ")}`);
  }
  push("");
  push("### Perk / Role / Flaw / Species outliers (pooled win Δ vs comparable crews, ±2.5 pts or more)", "");
  for (const p of names) push(`- **${p}**: ${S[p].outliers.map(([k, d]) => `${k} ${sgn(100 * d)}`).join(", ") || "none"}`);
  push("");
  if (Object.keys(titles).length) {
    push("Packages:", "");
    for (const p of names) push(`- **${p}** — ${titles[p] ?? ""}`);
    push("");
  }
  return L.join("\n");
}

/** Side tables: P4 leave-one-out, heist tweaks on P4, P1–P3 with the 'spend your Silk' advice. */
function sideTables(which) {
  const P4 = PACKAGES.P4.rules;
  const drop = k => { const r = { ...P4 }; delete r[k]; return r; };
  const T = {
    loo: {
      "P4 (all)": P4,
      "− Successes on 5–6": drop("successFace"),
      "− Partial needs half": drop("partialRule"),
      "− two rolls per obstacle": drop("obstacleSteps"),
      "− Critical Alert at D3+": drop("critAlertMinDiff"),
      "− +2 bonus-dice cap": drop("bonusDiceCap"),
      "− Full Alert capture": drop("fullAlertFailure"),
      "+ shrug ties to the threat (optional)": { ...P4, hitTies: "attacker" },
      "+ Plausible Deniability once per heist (optional)": { ...P4, pdLimit: "heist" },
      "− 'spend your Silk' advice (= P4B)": drop("silkPolicy")
    },
    tweaks: {
      "P4": P4,
      ...Object.fromEntries(Object.keys(HEIST_TWEAKS).map(t => [`+ ${t}`, { ...P4, heistTweaks: [t] }])),
      "+ both office tweaks": { ...P4, heistTweaks: ["office-guard-aware", "office-cleaners-first"] },
      "P4H (guard aware + alert staff)": PACKAGES.P4H.rules,
      "P4H + cleaners first + wedge lid": { ...P4, heistTweaks: ["office-guard-aware", "office-cleaners-first", "restaurant-alert-staff", "petstore-wedge-lid"] }
    },
    spend: Object.fromEntries(["P0", "P1", "P2", "P3"].map(p => [`${p} + spend advice`, { ...PACKAGES[p].rules, silkPolicy: "spendy" }]))
  };
  if (!T[which]) throw new Error(`Unknown table ${which} (loo, tweaks, spend)`);
  return T[which];
}

function renderSide(rows) {
  const head = ["variant", ...HEISTS.map(h => String(h.n)), "easy", "standard", "hard", "Hard Outs", "Hard Loss", "Critical", "Failure", "Silk ≥ half"];
  return table(head, rows.map(([name, S]) => [name, ...HEISTS.map(h => pct(S.heists[h.id].win, 0)), pct(S.byLabel.easy.win), pct(S.byLabel.standard.win), pct(S.byLabel.hard.win),
    num(S.byLabel.hard.outs, 2), pct(S.byLabel.hard.loss, 2), pct(S.results.critical), pct(S.results.failure + S.results.botch + S.results.cleanfail), pct(S.spentHalf)]));
}

function main() {
  const A = args(process.argv);
  if (A.tables) {
    const L = [`Generated by \`node sim/packages.mjs --tables ${A.tables.join(",")} --runs ${A.runs} --seed ${A.seed}\` — ${A.runs} runs per heist per row.`, ""];
    for (const t of A.tables) {
      const rows = [];
      for (const [name, rules] of Object.entries(sideTables(t))) {
        rows.push([name, summarize(runVariant(packageParams(rules), HEISTS, A.runs, A.seed))]);
        console.error(`${t}: ${name}`);
      }
      L.push(`### ${t}`, "", renderSide(rows), "");
    }
    const md = L.join("\n");
    if (A.out) writeFileSync(A.out, md); else console.log(md);
    return;
  }
  const S = {}, titles = {};
  const t0 = Date.now();
  for (const name of A.packages) {
    const rules = name === A.label && A.rules ? A.rules : PACKAGES[name]?.rules;
    if (!rules) { console.error(`Unknown package ${name}`); process.exit(1); }
    titles[name] = name === A.label && A.rules ? JSON.stringify(A.rules) : PACKAGES[name].title;
    const recs = runVariant(packageParams(rules), HEISTS, A.runs, A.seed);
    S[name] = summarize(recs);
    console.error(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${name}: win ${pct(S[name].win)} · ${HEISTS.map(h => pct(S[name].heists[h.id].win, 0)).join(" ")}`);
  }
  const md = `Generated by \`node sim/packages.mjs --runs ${A.runs} --seed ${A.seed}\` — ${A.runs} runs per heist per package.\n\n` + renderComparison(A.packages, S, titles);
  if (A.json) writeFileSync(A.json, JSON.stringify(S, null, 1));
  if (A.out) writeFileSync(A.out, md); else console.log(md);
}

if (process.argv[1]?.endsWith("packages.mjs")) main();
