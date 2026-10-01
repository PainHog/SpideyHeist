/**
 * The heist catalog (WP-C, design §4 + §16 #15): parity with the simulator's
 * v4.8 heist data (sim/heists.mjs with the P6 package's heist content), the
 * Escape rule, creature keys and journal names.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { HEISTS, findHeist, heistObstacles, proceduresFor, procedureOutcome, AP_BY_DIFFICULTY } from "../module/logic/heist-catalog.mjs";
import { HEISTS as SIM_HEISTS, applyHeistTweaks, AP_BY_DIFFICULTY as SIM_AP } from "../sim/heists.mjs";
import { PACKAGES } from "../sim/params.mjs";
import { CREATURE_AUTOMATION } from "../module/logic/creatures.mjs";
import { HEISTY } from "../module/config.mjs";

const V48 = PACKAGES.P6.rules.heistTweaks;
const simV48 = id => applyHeistTweaks(SIM_HEISTS.find(h => h.id === id), V48);

test("five heists, the sim's keys, Limits and difficulties", () => {
  assert.deepEqual(HEISTS.map(h => h.key), SIM_HEISTS.map(h => h.id));
  for (const h of HEISTS) {
    const s = simV48(h.key);
    assert.equal(h.name, s.name);
    assert.equal(h.limit, s.limit);
    assert.equal(h.difficulty, s.difficulty);
    assert.equal(h.limit, HEISTY.alertLimits[h.difficulty].value, `${h.key}: Limit matches the difficulty`);
  }
  assert.deepEqual(AP_BY_DIFFICULTY, SIM_AP);
});

test("parity with sim/heists.mjs (v4.8): obstacle ids, approach skills, Difficulties and modes", () => {
  for (const h of HEISTS) {
    const s = simV48(h.key);
    for (const [mine, theirs] of [[h.obstacles, s.obstacles], [h.escape, s.escape]]) {
      assert.deepEqual(mine.map(o => o.id), theirs.map(o => o.id), `${h.key} obstacle ids`);
      mine.forEach((o, i) => {
        const t = theirs[i];
        assert.equal(o.approaches.length, t.approaches.length, `${h.key} ${o.id} approach count`);
        o.approaches.forEach((a, j) => {
          const b = t.approaches[j];
          assert.deepEqual(a.skills, [b.skill], `${h.key} ${o.id}#${j} skill`);
          assert.equal(a.difficulty, b.diff, `${h.key} ${o.id}#${j} Difficulty`);
          assert.equal(a.mode, b.mode, `${h.key} ${o.id}#${j} mode`);
          assert.equal(a.alertOnUse, b.loud ?? 0, `${h.key} ${o.id}#${j} loud`);
          assert.equal(!!a.opposed, !!b.opposed, `${h.key} ${o.id}#${j} opposed`);
          assert.deepEqual(a.excludeRoles, b.excludeRoles ?? [], `${h.key} ${o.id}#${j} excluded roles`);
          if (b.hold) assert.equal(a.hold, b.hold, `${h.key} ${o.id}#${j} hold`);
          if (b.weakness) assert.ok(a.weakness, `${h.key} ${o.id}#${j} weakness`);
        });
        assert.deepEqual(o.threats, t.threats ?? [], `${h.key} ${o.id} threats`);
        assert.deepEqual(o.awake, t.awake ?? [], `${h.key} ${o.id} awake`);
        assert.equal(o.unknown, !!t.unknown, `${h.key} ${o.id} unknown`);
        assert.equal(o.objective, !!t.objective, `${h.key} ${o.id} objective`);
        for (const tag of t.tags) assert.ok(o.tags.includes(tag), `${h.key} ${o.id} tag ${tag}`);
      });
    }
    // Same items and obstacle links; the catalog keeps Ch 19's book order (Casing reveals in book order).
    // (The text follows the book where it is newer than the sim's, so compare its opening words.)
    const pairs = list => list.map(i => `${i.obstacle} ${i.text.slice(0, 24)}`).sort();
    assert.deepEqual(pairs(h.intel), pairs(s.intel), `${h.key} intel`);
    if (s.guardPost) assert.deepEqual(h.creatures.find(c => c.key === "guard-spider").post, s.guardPost, `${h.key} guard post`);
    for (const [k, list] of Object.entries(s.earshot ?? {})) assert.deepEqual(h.creatures.find(c => c.key === k).earshot, list, `${h.key} ${k} earshot`);
  }
});

test("v4.8 content: Heist 1's climb is Acrobatics 1 and the bottle cap is an approach (the cat's Weakness)", () => {
  const cookie = findHeist("cookie");
  const o1 = cookie.obstacles.find(o => o.id === "O1");
  const cap = o1.approaches.find(a => a.skills[0] === "athletics");
  assert.equal(cap.difficulty, 1);
  assert.equal(cap.weakness, "house-cat");
  assert.equal(cookie.obstacles.find(o => o.id === "O2").approaches[0].difficulty, 1);
});

test("every heist has an Escape answer that needs no Athletics", () => {
  for (const h of HEISTS) {
    const ok = h.escape.every(o => o.approaches.some(a => !a.skills.includes("athletics")));
    assert.ok(ok, `${h.key}: each Escape obstacle has a non-Athletics answer`);
    assert.ok(h.escape.length >= 1 && h.escape.length <= 2);
  }
});

test("creatures: keys exist in the pack and cover every obstacle threat", () => {
  const packKeys = readdirSync(new URL("../packs/_source/creatures/", import.meta.url)).map(f => f.replace(/\.json$/, ""));
  for (const h of HEISTS) {
    for (const c of h.creatures) {
      assert.ok(packKeys.includes(c.key), `${h.key}: ${c.key} in the pack`);
      assert.ok(CREATURE_AUTOMATION[c.key], `${h.key}: ${c.key} automated`);
      for (const o of c.atObstacles) assert.ok(heistObstacles(h).some(x => x.id === o), `${h.key}: ${c.id} at ${o}`);
    }
    for (const o of heistObstacles(h)) {
      for (const t of o.threats) assert.ok(h.creatures.some(c => c.key === t && c.atObstacles.includes(o.id)), `${h.key} ${o.id}: ${t} placed`);
      for (const a of o.approaches) {
        if (a.opposed && a.opposed.creature !== "rival-crew") assert.ok(o.threats.includes(a.opposed.creature), `${h.key} ${o.id}: opposed by a threat there`);
        if (a.opposed) assert.ok(a.opposed.pool > 0, `${h.key} ${o.id}: opposed pool`);
      }
    }
  }
});

test("intel points at real obstacles; approach ids are unique per obstacle", () => {
  for (const h of HEISTS) {
    const ids = heistObstacles(h).map(o => o.id);
    for (const i of h.intel) if (i.obstacle) assert.ok(ids.includes(i.obstacle), `${h.key}: intel → ${i.obstacle}`);
    for (const o of heistObstacles(h)) {
      const aids = o.approaches.map(a => a.id);
      assert.equal(new Set(aids).size, aids.length, `${h.key} ${o.id}: unique approach ids`);
    }
  }
});

test("journal names: findHeist by key, number, name and journal key", () => {
  const dir = new URL("../packs/_source/heists/", import.meta.url);
  const journals = readdirSync(dir).map(f => JSON.parse(readFileSync(new URL(f, dir), "utf8")));
  for (const h of HEISTS) {
    const j = journals.find(x => x.key === h.journalKey);
    assert.ok(j, `${h.key}: journal ${h.journalKey}`);
    assert.equal(j.name, h.name);
    assert.equal(findHeist(h.key), h);
    assert.equal(findHeist(String(h.n)), h);
    assert.equal(findHeist(h.name), h);
    assert.equal(findHeist(h.name.toUpperCase()), h);
    assert.equal(findHeist(h.journalKey), h);
  }
  assert.equal(findHeist("nope"), null);
  assert.equal(findHeist(""), null);
});

test("procedures: the twin tin, the water run, the lap, the cleaners, the librarian, the staff, the rat, the sleeper", () => {
  const ids = Object.fromEntries(HEISTS.map(h => [h.key, h.procedures.map(p => p.id)]));
  assert.deepEqual(ids.cookie, ["twin-tin", "water-run"]);
  assert.deepEqual(ids.office, ["guard-lap", "cleaners"]);
  assert.deepEqual(ids.library, ["librarian", "rival-crew"]);
  assert.deepEqual(ids.restaurant, ["staff", "rat-deal", "sleeper"]);
  const tin = findHeist("cookie").procedures[0];
  assert.match(procedureOutcome(tin, 3).text, /LEFT/);
  assert.match(procedureOutcome(tin, 4).text, /RIGHT/);
  assert.deepEqual(proceduresFor(findHeist("library"), "roundEnd").map(p => p.id), ["librarian"]);
  assert.deepEqual(proceduresFor(findHeist("library"), "firstObstacle").map(p => p.id), ["librarian"]);
  const staff = findHeist("restaurant").procedures[0];
  assert.equal(staff.rolls, 2);
  assert.match(procedureOutcome(staff, 6).text, /trash run/);
  const water = findHeist("cookie").procedures[1];
  assert.equal(water.alertAtLeast, 7);
  assert.equal(water.complication, 3);
  assert.equal(findHeist("office").procedures[1].timer.rounds, 6);
});
