/**
 * WP-A: SpiderData.prepareDerivedData with a stubbed TypeDataModel — the real
 * derived-data code, run without Foundry: Unfazed, Speed with an injected
 * carry lookup, starting Silk, and ability keys.
 *   npm test    (node --test)
 */
import test from "node:test";
import assert from "node:assert/strict";

// Just enough of `foundry` for actor-data.mjs to define its classes.
globalThis.foundry ??= {};
globalThis.foundry.abstract ??= { TypeDataModel: class {} };
const { SpiderData } = await import("../module/data/actor-data.mjs");

const item = (type, name, system = {}) => ({ type, name, system });

/** A SpiderData instance with plain fields, bypassing the schema. */
function spider({ state = "unharmed", items = [], attrs = { body: 2, wit: 4, nerve: 3, grace: 1 }, speed = 5 } = {}) {
  const sys = Object.create(SpiderData.prototype);
  Object.assign(sys, {
    attributes: Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, { value: v }])),
    speed: { value: speed },
    silk: { value: 3, max: 0 },
    vitality: { state },
    parent: { id: "A1", items }
  });
  return sys;
}

const withLookup = async (fn, body) => {
  const prev = SpiderData.carryLookup;
  SpiderData.carryLookup = fn;
  try { return await body(); } finally { SpiderData.carryLookup = prev; }
};

test("the default carry lookup is 'not carrying'", () => {
  assert.equal(SpiderData.carryLookup({}), null);
});

test("Unfazed: Rattled costs no dice; Hurt still does", () => {
  const unfazed = item("perk", "Unfazed", { key: "" });
  const s = spider({ state: "rattled", items: [unfazed] });
  s.prepareDerivedData();
  assert.equal(s.vitality.penalty, 0);
  assert.equal(s.vitality.unfazed, true);
  assert.ok(s.abilityKeys.includes("unfazed"));
  const plain = spider({ state: "rattled" });
  plain.prepareDerivedData();
  assert.equal(plain.vitality.penalty, -1);
  const hurt = spider({ state: "hurt", items: [unfazed] });
  hurt.prepareDerivedData();
  assert.equal(hurt.vitality.penalty, -2);
});

test("Speed: species base, Hurt halves, injected carry lookup, halvings don't stack", async () => {
  const wolf = item("species", "Wolf Spider", { speciesKey: "wolf", speed: 7, bonuses: { body: 2 } });
  const s = spider({ items: [wolf] });
  s.prepareDerivedData();
  assert.equal(s.speed.base, 7);
  assert.equal(s.speed.effective, 7);
  assert.equal(s.speed.carrying, false);

  await withLookup(actor => (actor.id === "A1" ? { tier: "prize", carriers: 1 } : null), () => {
    const c = spider({ items: [wolf] });
    c.prepareDerivedData();
    assert.equal(c.speed.effective, 3);
    assert.equal(c.speed.carrying, true);
    const h = spider({ state: "hurt", items: [wolf] });
    h.prepareDerivedData();
    assert.equal(h.speed.effective, 3, "Hurt + Prize alone = half once");
  });

  await withLookup(() => ({ tier: "treasure", carriers: 1 }), () => {
    const t = spider({ items: [wolf] });
    t.prepareDerivedData();
    assert.equal(t.speed.effective, 0);
  });

  await withLookup(() => ({ carryingPassenger: true }), () => {
    const p = spider({ items: [wolf, item("perk", "Passenger")] });
    p.prepareDerivedData();
    assert.equal(p.speed.effective, 7, "Passenger: full Speed with a crewmate");
  });

  await withLookup(() => { throw new Error("heist store not ready"); }, () => {
    const e = spider({ items: [wolf] });
    e.prepareDerivedData();
    assert.equal(e.speed.effective, 7, "a failing lookup never breaks the sheet");
  });

  const crit = spider({ state: "critical", items: [wolf] });
  crit.prepareDerivedData();
  assert.equal(crit.speed.effective, 0);
  assert.equal(crit.vitality.assisted, true);
});

test("starting Silk ignores the species bonus; ability keys cover every ability item", () => {
  const spit = item("species", "Spitting Spider", { speciesKey: "spitting", speed: 5, bonuses: { wit: 2, nerve: 1 } });
  const s = spider({ attrs: { body: 1, wit: 4, nerve: 3, grace: 2 }, items: [spit, item("role", "The Face", { roleKey: "face" }),
    item("flaw", "Show-Off"), item("gadget", "Paperclip")] });
  s.prepareDerivedData();
  assert.equal(s.silk.max, 5);
  assert.deepEqual(s.abilityKeys.sort(), ["show-off", "sig:face", "species:spitting"]);
});
