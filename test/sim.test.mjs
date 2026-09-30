/**
 * Tests for the Monte Carlo rules simulator (sim/). Run with `npm test`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { makeRng } from "../sim/rng.mjs";
import { buildCrew, buildSpider, validateSpider, dataConsistencyIssues } from "../sim/character.mjs";
import { HEISTS, getHeist } from "../sim/heists.mjs";
import { HeistRun, runHeist, outcomeDist } from "../sim/engine.mjs";
import { defaultParams, PRESETS } from "../sim/params.mjs";
import { Recorder } from "../sim/recorder.mjs";

/** An RNG whose dice always show `face`. */
class FixedRng {
  constructor(face) { this.face = face; }
  d6() { return this.face; }
  dice(n) { return Array.from({ length: Math.max(0, n) }, () => this.face); }
  next() { return 0.99; }
  chance() { return false; }
  pick(a) { return a[0]; }
  int(a) { return a; }
  shuffle(a) { return a.slice(); }
  weighted(w) { return Object.keys(w)[0]; }
}

/** Five inert Ghosts (Perks and Flaw with no effect on a single roll). */
function inertCrew() {
  const rng = makeRng(42, "inert");
  return Array.from({ length: 5 }, () => buildSpider(rng, {
    role: "ghost", species: "cellar", build: "specialist",
    perks: ["dead-drop", "i-was-never-here"], flaw: "fear-of-vacuums"
  }));
}

/** A run parked at a non-objective, threat-free obstacle (Heist 2, O1), ready for attempt(). */
function parkedRun(face, params = {}) {
  const P = defaultParams({ silkPolicy: "hoard", failureAttack: false, ...params });
  const run = new HeistRun(getHeist("office"), inertCrew(), P, new FixedRng(face), new Recorder());
  run.idx = 0;
  run.obs = run.seq[0];
  run.round = 1;
  run.helpers = [];
  return run;
}
const stealthRoll = diff => ({ appr: { skill: "stealth", diff, mode: "single" }, skill: "stealth", mode: "single" });

test("character generator builds only Ch 7-legal spiders", () => {
  const rng = makeRng(7, "legal");
  for (let i = 0; i < 400; i++) {
    for (const sp of buildCrew(rng, 5, i % 2 ? "ch20" : "distinct")) {
      assert.deepEqual(validateSpider(sp), [], `${sp.species} ${sp.role} ${sp.build}`);
      assert.equal(sp.silkMax, sp.attrs.wit + sp.attrs.nerve);
      for (const v of Object.values(sp.attrs)) assert.ok(v >= 1 && v <= 5);
      for (const v of Object.values(sp.skills)) assert.ok(v >= 0 && v <= 3);
    }
  }
  assert.deepEqual(dataConsistencyIssues(), []);
});

test("validateSpider catches illegal spiders", () => {
  const sp = buildSpider(makeRng(1, "x"), { role: "tinkerer", species: "orbweaver" });
  const bad = { ...sp, skills: { ...sp.skills, stealth: 4 }, perks: ["field-repair", "soundless"] };
  const errs = validateSpider(bad);
  assert.ok(errs.some(e => /stealth above the creation cap/.test(e)));
  assert.ok(errs.some(e => /soundless not on the tinkerer list/.test(e)));
  assert.ok(errs.some(e => /points spent/.test(e)));
});

test("a pool of 0 or less rolls the Botch die: 1–3 is a Botch (+2 Alert), 4–6 a clean failure", () => {
  const run = parkedRun(2);
  const sp = run.present()[0];
  sp.attrs = { ...sp.attrs, nerve: 1 };
  sp.skills = { ...sp.skills, stealth: 0 };
  sp.vit = 3;                               // Critical: −3 dice → pool −2
  const r = run.attempt(sp, stealthRoll(3));
  assert.equal(r.res, "botch");
  assert.equal(r.passed, false);
  assert.equal(run.alert, 2);

  const run2 = parkedRun(5);
  const sp2 = run2.present()[0];
  sp2.attrs = { ...sp2.attrs, nerve: 1 };
  sp2.skills = { ...sp2.skills, stealth: 0 };
  sp2.vit = 3;
  const r2 = run2.attempt(sp2, stealthRoll(3));
  assert.equal(r2.res, "cleanfail");
  assert.equal(run2.alert, 0);

  // Variant: the clean failure still counts as a Failure (+1).
  const run3 = parkedRun(5, { cleanFailAlert: 1 });
  const sp3 = run3.present()[0];
  sp3.attrs = { ...sp3.attrs, nerve: 1 };
  sp3.skills = { ...sp3.skills, stealth: 0 };
  sp3.vit = 3;
  assert.equal(run3.attempt(sp3, stealthRoll(3)).res, "cleanfail");
  assert.equal(run3.alert, 1);
});

test("Alert bands modify Difficulty: Stirring/Active Stealth +1, Lockdown all +1 and Stealth +2", () => {
  const run = parkedRun(6);
  const sp = run.present()[0];
  const eng = { appr: { skill: "engineering", diff: 3, mode: "single" }, skill: "engineering", mode: "single" };
  const at = (alert, ch) => { run.alert = alert; return run.difficulty(sp, ch).d; };
  // Heist 2's Limit is 8, so Lockdown (7) is reachable.
  assert.deepEqual([0, 2, 3, 4, 5, 6, 7].map(a => at(a, stealthRoll(3))), [3, 3, 4, 4, 4, 4, 5]);
  assert.deepEqual([0, 3, 5, 6, 7].map(a => at(a, eng)), [3, 3, 3, 3, 4]);
  // Literal reading of the Active row ("No roll penalty yet").
  const lit = parkedRun(6, { activeBandStealth: 0 });
  lit.alert = 5;
  assert.equal(lit.difficulty(lit.present()[0], stealthRoll(3)).d, 3);
});

test("a Critical (2× Difficulty) lowers the Alert by 1 only at Difficulty 2+", () => {
  assert.ok(outcomeDist(6, 3).crit > 0 && outcomeDist(5, 3).crit === 0); // 6 Successes needed at D3

  const run = parkedRun(6);                  // every die a 6
  run.alert = 2;
  const r = run.attempt(run.present()[0], stealthRoll(2));
  assert.equal(r.res, "critical");
  assert.equal(run.alert, 1);

  const run1 = parkedRun(6);
  run1.alert = 2;
  const r1 = run1.attempt(run1.present()[0], stealthRoll(1));
  assert.equal(r1.res, "critical");
  assert.equal(run1.alert, 2, "no drop on a Difficulty 1 roll");

  const run0 = parkedRun(6);
  run0.attempt(run0.present()[0], stealthRoll(2));
  assert.equal(run0.alert, 0, "the Alert never goes below 0");
});

test("Failure (+1 Alert) and the two Partial variants", () => {
  const f = parkedRun(1);
  f.attempt(f.present()[0], stealthRoll(3));
  assert.equal(f.alert, 1);

  // A Partial: 1–2 Successes at D3. Dice alternate 6,1,1,1…
  class OneSuccess extends FixedRng { dice(n) { return Array.from({ length: n }, (_, i) => (i === 0 ? 6 : 1)); } }
  const mk = partialCost => {
    const run = new HeistRun(getHeist("office"), inertCrew(), defaultParams({ silkPolicy: "hoard", failureAttack: false, partialCost }), new OneSuccess(1), new Recorder());
    run.idx = 0; run.obs = run.seq[0]; run.round = 1; run.helpers = [];
    return run;
  };
  const a = mk("alert"), b = mk("setback");
  const ra = a.attempt(a.present()[0], stealthRoll(3));
  const rb = b.attempt(b.present()[0], stealthRoll(3));
  assert.equal(ra.res, "partial"); assert.equal(rb.res, "partial");
  assert.ok(ra.passed && rb.passed);
  assert.equal(a.alert, 1, "(a) Partial +1 Alert");
  assert.equal(b.alert, 0, "(b) no Alert…");
  assert.equal(b.present()[0].setback, 1, "…but −1 die on the next roll");
});

test("whole heists are reproducible and produce a legal outcome", () => {
  for (const preset of [{}, PRESETS.strict, PRESETS.generous]) {
    for (const h of HEISTS) {
      const P = defaultParams(preset);
      const crew = buildCrew(makeRng(3, "crew"), 5);
      const a = runHeist(h, crew, P, makeRng(3, h.id), new Recorder());
      const b = runHeist(h, crew, P, makeRng(3, h.id), new Recorder());
      assert.deepEqual({ ...a, trace: null }, { ...b, trace: null });
      assert.ok(["win", "partial", "loss"].includes(a.outcome));
      assert.ok(a.alert >= 0);
    }
  }
});

/* ---- balance packages (sim/BALANCE.md) ---- */
import { packageParams, PACKAGES, CLARIFIED } from "../sim/params.mjs";

test("package rule params: 5–6 Successes, half-Difficulty Partials, Critical at D+3", () => {
  const run = parkedRun(4, { successFace: 5 });
  assert.equal(run.succ([4, 4, 5, 6]), 2);
  const half = parkedRun(4, { partialRule: "half" });
  assert.equal(half.classify(1, 3), "failure");
  assert.equal(half.classify(2, 3), "partial");
  assert.equal(half.classify(1, 2), "partial");
  const p3 = parkedRun(4, { critRule: "plus3" });
  assert.equal(p3.classify(6, 3), "critical");
  assert.equal(p3.classify(6, 4), "success");
  assert.equal(p3.classify(7, 4), "critical");
  assert.equal(outcomeDist(8, 3, 5).fail.toFixed(4), ((2 / 3) ** 8).toFixed(4));
});

test("clarified Full Alert: the Alert stops at the Limit, Criticals can't lower it, Lockdown penalties apply", () => {
  const run = parkedRun(6, { fullAlertRule: "locked" });   // Heist 2, Limit 8
  run.alert = 7;
  run.addAlert(2, "failure");
  assert.equal(run.alert, 8);
  run.addAlert(1, "failure");
  assert.equal(run.alert, 8);
  run.attempt(run.present()[0], stealthRoll(2));             // all sixes: a Critical
  assert.equal(run.alert, 8, "no Critical drop at Full Alert");
  assert.deepEqual([run.band().stealth, run.band().all], [2, 1]);
});

test("Criticals lower the Alert only at the package's minimum Difficulty", () => {
  const run = parkedRun(6, { critAlertMinDiff: 3 });
  run.alert = 2;
  run.attempt(run.present()[0], stealthRoll(2));
  assert.equal(run.alert, 2);
  run.attempt(run.present()[1], stealthRoll(3));
  assert.equal(run.alert, 1);
});

test("clarified group check: only the worst result of the round raises the Alert, once", () => {
  const run = parkedRun(1, { groupRolls: "worstAlert" });    // every die a 1: every roll fails
  run.group = { rolls: [] };
  for (const sp of run.present().slice(0, 3)) run.attempt(sp, stealthRoll(3));
  assert.equal(run.alert, 0, "deferred");
  run.resolveGroup();
  assert.equal(run.alert, 1);
});

test("every package runs whole heists reproducibly", () => {
  assert.ok(Object.keys(CLARIFIED).length > 5);
  for (const name of Object.keys(PACKAGES)) {
    const P = packageParams(name);
    for (const h of HEISTS) {
      const crew = buildCrew(makeRng(5, "crew"), 5);
      const a = runHeist(h, crew, P, makeRng(5, h.id), new Recorder());
      const b = runHeist(h, crew, P, makeRng(5, h.id), new Recorder());
      assert.deepEqual({ ...a, trace: null }, { ...b, trace: null });
      assert.ok(["win", "partial", "loss"].includes(a.outcome));
      assert.ok(a.alert <= h.limit, `${name} ${h.id}: the Alert stops at the Limit`);
    }
  }
});

test("P5 (v4.7): starting Silk ignores species bonuses; the clock's complication moves Stealth; a paid guard stops counting", () => {
  const crew = inertCrew();
  const base = new HeistRun(getHeist("office"), crew, defaultParams(), new FixedRng(1), new Recorder());
  const p5 = new HeistRun(getHeist("office"), crew, packageParams("P5"), new FixedRng(1), new Recorder());
  for (let i = 0; i < crew.length; i++) {
    assert.equal(base.slots[i].cur.silk, crew[i].attrs.wit + crew[i].attrs.nerve);
    assert.equal(p5.slots[i].cur.silk, crew[i].base.wit + crew[i].base.nerve + 1);
  }
  // FixedRng(3) rolls a 3 on the complication table: Stealth +1 this round and next.
  const run = parkedRun(3, { stallClock: 3 });
  run.stallComplication();
  assert.equal(run.difficulty(run.present()[0], stealthRoll(3)).d, 4);
  // A bribed guard is no longer active (and adds no +X).
  const g = parkedRun(1, { guardRules: "paid" });
  g.cs["guard-spider"].forced = true;
  assert.equal(g.active("guard-spider"), true);
  g.cs["guard-spider"].paid = true;
  assert.equal(g.active("guard-spider"), false);
});
