/**
 * WP-D: integration smoke test — the three automation packages together.
 * -----------------------------------------------------------------------
 * Boots the real entry module (module/heisty-spideys.mjs) on a deterministic
 * fake Foundry (tools/fake-foundry.mjs) with a Storyteller and two players
 * connected, then plays a heist end to end, each step as the user who would
 * click it, and checks what every package did:
 *
 *   init → setup → ready (migration, seeding) → Start Heist → Planning (a
 *   Casing roll) → the Heist → a player's roll with Silk dice → a Silk Reroll
 *   on their own card → a crewmate's Failure raising the Alert (and the ST's
 *   Spotted deduped onto it) → That's Not What Happened from the Face (a GM op
 *   and a card patch by a non-author) → End Round (the cat's +1, the pending
 *   card finalized, the engaged cat's hit) → the shrug-off by the target's
 *   player → a second attack → Out (+2, a spike card, Damage Control from a
 *   player) → the Waiting Web (the player's replacement dialog over a query)
 *   → the next obstacle (the replacement arrives) → a Silk Clutch → the
 *   Escape → the Debrief (AP to both spiders of a slot) → idle.
 *
 * Players' writes go through the fake's permission checks (own actors and own
 * messages only; world settings, actor creation and other people's cards are
 * GM-only), so a package that writes what it doesn't own fails here.
 *   npm test    (node --test)
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  installFoundry, log, settle, asUser, diceQueue, dialogResponders, fakeForm, renderMessage, clickButton,
  buttonLabels, packDoc, FakeElement, Hooks
} from "../tools/fake-foundry.mjs";

const USERS = [
  { id: "gmUser0000000000", name: "Storyteller", isGM: true },
  { id: "player1000000000", name: "Pat" },
  { id: "player2000000000", name: "Robin" }
];
const { game } = installFoundry({ users: USERS });
const [GM, P1, P2] = USERS.map(u => game.users.get(u.id));

const { OPS, CARD, QUERY, FLAG, SETTINGS } = await import("../module/contracts.mjs");
await import("../module/heisty-spideys.mjs");

/* ---------------------------------------------------------------- helpers -- */

const card = m => m?.flags?.[FLAG]?.card ?? null;
const cards = kind => game.messages.filter(m => card(m)?.kind === kind);
const lastCard = kind => cards(kind).at(-1) ?? null;
const ns = () => game.heistySpideys;
const state = () => ns().heist.state;
const alert = () => ns().alert.value;
const silk = a => a.system.silk.value;
const vit = a => a.system.vitality.state;
const asGM = fn => asUser(GM, fn);

/** The roll dialog: fill these fields and press Roll (after its live preview runs). */
const rollDialog = values => opts => {
  assert.match(String(opts.content ?? ""), /Roll the Pool|hrd|form-group/, "the roll dialog rendered");
  // Its live preview runs against the real dialog markup…
  const el = new FakeElement("div");
  el.innerHTML = `<form>${opts.content}</form>`;
  opts.render?.({}, { element: el });
  // …then Roll reads the form.
  return opts.ok.callback({}, { form: fakeForm(values) });
};

/** Fail the test with every error the fake world recorded. */
function assertClean(where) {
  const errs = log.errors.splice(0);
  const left = diceQueue.splice(0);
  assert.deepEqual(left, [], `${where}: scripted dice left unrolled`);
  assert.deepEqual(errs, [], `${where}: errors were recorded:\n${errs.join("\n\n")}`);
}

function makeSpider({ name, owner, species, role, perks = [], flaw, attrs, skills }) {
  const items = [packDoc("species", species, "species"), packDoc("roles", role, "role"), ...perks.map(p => packDoc("perks", p, "perk"))];
  if (flaw) items.push(packDoc("flaws", flaw, "flaw"));
  for (const i of items) if (i.type === "perk" || i.type === "flaw") i.system.key = "";   // as 1.7 worlds have them
  return {
    name, type: "spider", ownership: { default: 0, [owner.id]: 3 },
    system: {
      attributes: Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, { value: v }])),
      skills: Object.fromEntries(["acrobatics", "athletics", "stealth", "brawl", "endurance", "intimidation", "deception", "persuasion", "perception", "tactics", "engineering", "disguise"].map(k => [k, { value: skills[k] ?? 0 }])),
      speed: { value: 5 }, silk: { value: 0, max: 0 }, vitality: { state: "unharmed", outCause: "" },
      heist: { status: "active", slot: "", replacementOf: "", recoveredSerial: -1, camouflaged: false, methodActorTarget: "", longConIdentity: "", pending: [] },
      advancement: { value: 0, earned: 0 }, details: {}, biography: ""
    },
    items
  };
}

/* ------------------------------------------------------------------- world -- */

// A 1.7.0 world: two player spiders and the House Cat, made before the upgrade
// (built once init has registered the document classes and data models).
let pebbles, dusty, cat;
function buildWorld() {
  pebbles = new CONFIG.Actor.documentClass(makeSpider({
    name: "Pebbles", owner: P1, species: "wolf-spider", role: "the-face", perks: ["plausible-deniability"], flaw: "show-off",
    attrs: { body: 2, wit: 4, nerve: 4, grace: 3 }, skills: { stealth: 2, deception: 2, persuasion: 2, perception: 2, endurance: 1 }
  }));
  dusty = new CONFIG.Actor.documentClass(makeSpider({
    name: "Dusty", owner: P2, species: "crab-spider", role: "the-bruiser", perks: ["take-the-hit"], flaw: "dramatic",
    attrs: { body: 3, wit: 2, nerve: 2, grace: 2 }, skills: { stealth: 1, brawl: 2, endurance: 1, athletics: 2, acrobatics: 1 }
  }));
  const catData = packDoc("creatures", "house-cat", "threat");
  catData.system.automation = { key: "", perRound: null, wakeAt: null, huntAt: null, roams: "", attackIndex: null, humanRow: "" };
  cat = new CONFIG.Actor.documentClass({ ...catData, ownership: { default: 0 } });
  game.actors.push(pebbles, dusty, cat);
}

/* -------------------------------------------------------------- the story -- */

test("init → setup → ready wires the three packages together", async () => {
  Hooks.callAll("init");
  Hooks.callAll("i18nInit");
  buildWorld();
  Hooks.callAll("setup");
  // 1.7.0 → 1.8.0 migration runs on ready.
  await game.settings.set("heisty-spideys", "systemMigrationVersion", "1.7.0");
  await asGM(async () => { Hooks.callAll("ready"); await settle(); });
  assertClean("boot");

  const api = ns();
  for (const k of ["gm", "heist", "alert", "openTracker", "actorOps", "abilities", "dice", "waitingWeb", "HEISTY", "openBuilder"]) assert.ok(api[k], `game.heistySpideys.${k}`);
  assert.equal(typeof api.waitingWeb.promptReplacement, "function");
  assert.equal(typeof api.waitingWeb.createReplacement, "function");
  assert.equal(typeof api.heist.startHeist, "function");
  assert.equal(typeof api.dice.rollCheck, "function");
  assert.equal(typeof api.abilities.use, "function");
  assert.equal(typeof CONFIG.queries[QUERY], "function");
  for (const op of Object.values(OPS)) assert.ok(api.gm.has(op), `op ${op} registered`);

  // One listener each — none double-bound.
  assert.equal(Hooks.count("renderChatMessageHTML"), 3, "renderChatMessageHTML: WP-A, WP-B, WP-C");
  assert.equal(Hooks.count("createChatMessage"), 2, "createChatMessage: WP-B, WP-C");
  assert.equal(Hooks.count("updateChatMessage"), 2, "updateChatMessage: WP-B, WP-C");

  // Migration: stable keys, slots, the creature key; the stamp moved on.
  assert.equal(game.settings.get("heisty-spideys", "systemMigrationVersion"), game.system.version);
  assert.equal(pebbles.items.find(i => i.type === "perk").system.key, "plausible-deniability");
  assert.equal(dusty.system.heist.slot, dusty.id);
  assert.equal(cat.system.automation.key, "house-cat");
  // Seeded heist state; derived data with the carry lookup injected.
  assert.equal(state().phase, "idle");
  assert.equal(pebbles.system.silk.max, 9);
  assert.equal(typeof CONFIG.Actor.dataModels.spider.carryLookup, "function");
  assert.ok(game.settings.get("heisty-spideys", SETTINGS.autoAlert));
});

test("Start Heist: crew reset, creatures mapped, procedures rolled; the tracker renders for GM and players", async () => {
  await asGM(async () => {
    await pebbles.update({ "system.silk.value": 1, "system.vitality.state": "hurt" });
    await ns().openTracker();
    diceQueue.push(2);   // Heist 1's secret twin-tin d6 (heist start)
    await ns().heist.startHeist({ heistKey: "cookie", crewIds: [pebbles.id, dusty.id] });
    await settle();
  });
  assertClean("start heist");
  const s = state();
  assert.equal(s.phase, "score");
  assert.equal(ns().alert.limit, 10);
  assert.equal(alert(), 0);
  assert.equal(silk(pebbles), 9, "full starting Silk");
  assert.equal(vit(pebbles), "unharmed", "Unharmed at heist start");
  assert.deepEqual(s.crew.map(c => [c.actorId, c.userId, c.status]), [[pebbles.id, P1.id, "present"], [dusty.id, P2.id, "present"]]);
  assert.equal(s.creatures.find(c => c.key === "house-cat").actorUuid, cat.uuid, "the cat actor is mapped");
  const proc = lastCard(CARD.procedure);
  assert.ok(proc, "the twin-tin procedure card");
  assert.deepEqual(proc.whisper, [GM.id], "procedures are whispered to the Storyteller");
  assert.match(proc.content, /LEFT tin/);
  // The tracker re-rendered on every change, as the GM and as each player.
  const tracker = foundry.applications.instances.get("heisty-heist-tracker");
  assert.ok(tracker?._renders > 2, "tracker re-renders on heist changes");
  await asUser(P1, () => tracker.render());
  assert.match(tracker.renderedParts.header, /Cookie/);
  assertClean("tracker");
});

test("Planning: a Casing roll is spotted by the GM and revealed in one click", async () => {
  await asGM(async () => { await ns().heist.setPhase("planning"); await settle(); });
  // Pat rolls Perception (WIT 4 + 2): 2 Successes.
  diceQueue.push(5, 6, 1, 2, 3, 1);
  dialogResponders.push(rollDialog({ difficulty: 3 }));
  await asUser(P1, async () => { await pebbles.rollSkill("perception"); await settle(); });
  assertClean("casing roll");
  const roll = lastCard(CARD.check);
  assert.equal(roll.author, P1.id);
  assert.equal(card(roll).roll.successes, 2);
  assert.equal(alert(), 0, "no Alert in Planning");
  assert.deepEqual(state().intel.casingRolled, [pebbles.id]);
  const prompt = lastCard(CARD.prompt);
  assert.match(card(prompt).title, /Casing — Pebbles: 2 details/);
  const ids = card(prompt).checks.filter(c => c.checked).map(c => c.id);
  assert.equal(ids.length, 2);
  await asGM(async () => { await ns().heist.revealIntel(ids); await settle(); });
  assert.equal(state().intel.list.filter(i => i.revealed).length, 2);
  assertClean("reveal");
});

test("The Heist: a player's roll with Silk, then a Silk Reroll on their own card", async () => {
  await asGM(async () => {
    await game.settings.set("heisty-spideys", SETTINGS.autoHits, "auto");
    await ns().heist.setPhase("heist");
    await settle();
  });
  assertClean("into the heist");
  let s = state();
  assert.equal(s.current, "O1");
  assert.equal(s.creatures.find(c => c.key === "house-cat").state.active, true, "Heist 1's cat is awake from the start");

  // Pat: Stealth, the cat opposing (it rolls first: 1 Success → Difficulty 2), 1 Silk die.
  diceQueue.push(5, 1, 2, 3);          // the cat's Perception 4
  diceQueue.push(1, 2, 3, 4, 1, 2, 3); // NERVE 4 + Stealth 2 + 1 Silk
  dialogResponders.push(rollDialog({ approach: "stealth", difficulty: 3, silk: 1, opposed: `${cat.uuid}#0` }));
  await asUser(P1, async () => { await pebbles.rollSkill("stealth"); await settle(); });
  assertClean("Pat's roll");
  const threat = lastCard(CARD.threat);
  assert.equal(card(threat).roll.successes, 1, "the cat rolled first");
  const msg = lastCard(CARD.check);
  let c = card(msg);
  assert.equal(c.roll.difficulty, 2);
  assert.equal(c.roll.pool, 7, JSON.stringify(c.roll.poolParts));
  assert.equal(c.roll.result, "failure");
  assert.equal(silk(pebbles), 8, "1 SP for the Silk die");
  assert.equal(alert(), 1, "a Failure: +1");

  // Who sees what on Pat's card.
  const mine = buttonLabels(msg, P1);
  assert.ok(mine.includes("Reroll (2 SP)") && mine.includes("Silk Clutch (3 SP)") && mine.includes("Accept"), mine.join(" | "));
  assert.ok(!mine.some(l => /Spotted/.test(l)), "no GM buttons for a player");
  assert.ok(buttonLabels(msg, GM).includes("Spotted +1"));
  assert.deepEqual(buttonLabels(msg, P2), [], "Robin has nothing to do on Pat's card");

  // Silk Reroll: up to 3 dice that didn't succeed; the Successes stay.
  diceQueue.push(5, 6, 2);
  clickButton(renderMessage(msg, P1), "Reroll (2 SP)", P1);
  await settle();
  assertClean("reroll");
  c = card(game.messages.get(msg.id));
  assert.equal(c.roll.result, "success");
  assert.equal(c.roll.rerolls.length, 1);
  assert.equal(silk(pebbles), 6);
  assert.equal(alert(), 0, "the Alert entry is amended by the reroll");
  s = state();
  assert.ok(s.progress.O1.passedActors.includes(pebbles.id), "progress counts the rerolled pass");
  assert.ok((s.acted[String(s.roundSerial)] ?? []).includes(pebbles.id), "Pat has acted this round");
});

test("A crewmate's Failure raises the Alert once (Spotted dedupes); That's Not What Happened cancels it", async () => {
  diceQueue.push(1, 1, 1, 1);          // the cat: 0 Successes → Difficulty 1
  diceQueue.push(1, 2, 3);             // NERVE 2 + Stealth 1
  dialogResponders.push(rollDialog({ approach: "stealth", difficulty: 3, opposed: `${cat.uuid}#0` }));
  await asUser(P2, async () => { await dusty.rollSkill("stealth"); await settle(); });
  assertClean("Robin's roll");
  const msg = lastCard(CARD.check);
  let c = card(msg);
  assert.equal(c.roll.result, "failure");
  assert.equal(alert(), 1);
  assert.equal(c.consequences.hit?.uuid, cat.uuid, "autoHits = auto: the engaged cat will land its hit");

  // The ST: Spotted on the same card → still +1 ("a Failure that gets you spotted is +1, not +2").
  clickButton(renderMessage(msg, GM), "Spotted +1", GM);
  await settle();
  assertClean("spotted");
  assert.equal(alert(), 1);

  // Pat's Face reacts on Robin's card: a GM op (alert.cancel) and a card patch (card.patch).
  const labels = buttonLabels(game.messages.get(msg.id), P1);
  assert.ok(labels.some(l => /That's Not What Happened \(2 SP\) — Pebbles/.test(l)), labels.join(" | "));
  assert.ok(labels.some(l => /Plausible Deniability — Pebbles/.test(l)), labels.join(" | "));
  clickButton(renderMessage(game.messages.get(msg.id), P1), "That's Not What Happened", P1);
  await settle();
  assertClean("That's Not What Happened");
  c = card(game.messages.get(msg.id));
  assert.ok(c.alert.cancels.some(x => x.key === "thatsNotWhatHappened" && x.by === pebbles.id), "the cancel is on Robin's card");
  assert.equal(alert(), 0, "cancelled");
  assert.equal(silk(pebbles), 4, "2 SP");
  const face = pebbles.items.find(i => i.type === "role");
  assert.equal(face.system.usage.heistId, state().heistId, "once per heist: stamped");
  assert.ok(!buttonLabels(game.messages.get(msg.id), P1).some(l => /That's Not What Happened/.test(l)), "gone once used");
});

test("End Round: the cat's +1, pending cards finalize, the engaged cat lands its hit; the target's player shrugs", async () => {
  const before = alert();
  const round = state().round;
  diceQueue.push(5, 5, 6, 1);          // the cat's Pounce 4: 3 Successes
  // "Round 1: everyone has acted" — the Storyteller's one click.
  const prompt = cards(CARD.prompt).find(m => /everyone has acted/.test(card(m).title));
  assert.ok(prompt, "the End round prompt");
  assert.deepEqual(buttonLabels(prompt, P1), [], "players don't see the Storyteller's prompt buttons");
  clickButton(renderMessage(prompt, GM), "End round", GM);
  await settle();
  assertClean("end round");
  assert.equal(card(game.messages.get(prompt.id)).done, true);
  assert.equal(alert(), before + 1, "an active creature adds its +X");
  assert.equal(state().round, round + 1);
  assert.ok(cards(CARD.check).every(m => card(m).consequences?.status === "final"), "pending cards finalized at End Round");
  const atk = lastCard(CARD.attack);
  assert.ok(atk, "the attack card");
  assert.equal(atk.author, GM.id);
  assert.equal(card(atk).attack.targetUuid, dusty.uuid);
  assert.equal(card(atk).attack.successes, 3);
  const robinSees = buttonLabels(atk, P2);
  assert.ok(robinSees.includes("Shrug it off"), robinSees.join(" | "));
  assert.ok(!buttonLabels(atk, P1).includes("Shrug it off"), "only the target's player (and the ST) shrug");

  // Robin shrugs: BODY 3 + Endurance 1 = 4 dice, 1 Success: lose by 2 → drop one level.
  diceQueue.push(1, 2, 3, 5);
  clickButton(renderMessage(atk, P2), "Shrug it off", P2);
  await settle();
  assertClean("shrug");
  const shrug = lastCard(CARD.shrug);
  assert.equal(shrug.author, P2.id);
  assert.equal(card(shrug).shrug.drop, 1);
  assert.equal(vit(dusty), "rattled", "Vitality applied on the owner's own actor");
  assert.ok(card(game.messages.get(atk.id)).attack.shrugMessageId, "the GM's attack card notes the shrug (via card.patch)");

  // A Silk Reroll on the shrug: re-resolved from the stored "before" and re-applied.
  diceQueue.push(5, 6, 5);
  clickButton(renderMessage(shrug, P2), "Reroll (2 SP)", P2);
  await settle();
  assertClean("shrug reroll");
  assert.equal(card(game.messages.get(shrug.id)).shrug.shrugged, true);
  assert.equal(vit(dusty), "unharmed", "the shrug now holds: back to Unharmed");
  assert.equal(silk(dusty), dusty.system.silk.max - 2, "2 SP for the Reroll");
});

test("Out: +2 on its own event, a spike card, Damage Control split between two players", async () => {
  await asGM(async () => { await dusty.update({ "system.vitality.state": "hurt" }); await settle(); });
  diceQueue.push(6, 6, 6, 5);          // Pounce 4: 4 Successes
  let atk;
  await asGM(async () => { [atk] = await ns().dice.threatAttack(cat, null, { targets: [dusty] }); await settle(); });
  const before = alert();
  diceQueue.push(1, 1);                // BODY 3 + Endurance 1 − 2 (Hurt): 2 dice
  clickButton(renderMessage(atk, P2), "Shrug it off", P2);
  await settle();
  // The Waiting Web asks Robin's client for a name — answer it.
  const dlg = [...foundry.applications.instances.values()].find(a => a.constructor.name === "ReplacementDialog");
  assert.ok(dlg, "the replacement dialog opened (on Robin's client)");
  assert.match(dlg.renderedParts.body, /Dusty|Waiting Web/i);
  await asUser(P2, () => dlg.submit({ name: "Gerald", speciesUuid: "" }));
  await settle();
  assertClean("out");
  assert.equal(vit(dusty), "out");
  assert.equal(dusty.system.vitality.outCause, "hit");
  assert.equal(alert(), Math.min(10, before + 2), "a spider Out: +2");
  const spike = lastCard(CARD.alertEvent);
  assert.ok(spike, "the spike card (Damage Control / Not Part of the Plan)");
  assert.equal(state().crew.find(c => c.actorId === dusty.id).status, "out");

  // The replacement is on its way: Rattled, half the starting Silk.
  const gerald = game.actors.find(a => a.name === "Gerald");
  assert.ok(gerald, "the replacement exists");
  assert.equal(silk(gerald), Math.floor(dusty.system.silk.max / 2));

  // Damage Control from the spike card: Pat chips in 1, Robin 2 (from Gerald) — GM ops from each player.
  assert.deepEqual(buttonLabels(spike, GM), [], "crew spends are for the crew");
  clickButton(renderMessage(game.messages.get(spike.id), P1), "Chip in 1", P1);
  await settle();
  const robinsCard = renderMessage(game.messages.get(spike.id), P2);
  assert.equal(robinsCard.querySelector("select[data-crew-picker]").value, gerald.id, "Robin's picker offers the replacement (Dusty is Out)");
  clickButton(robinsCard, "2", P2);
  await settle();
  assertClean("damage control");
  assert.equal(alert(), Math.min(10, before + 1), "the spike is reduced by 1");
  assert.equal(silk(pebbles), 3);
  assert.equal(silk(gerald), 0);
  assert.equal(state().crewUsage.damageControl.done, true);
  assert.match(game.messages.get(spike.id).content, /reduced by 1/);
});

test("The Waiting Web: the replacement (Rattled, half Silk, same slot, stamps carried) arrives at the next obstacle", async () => {
  const gerald = game.actors.find(a => a.name === "Gerald");
  assert.ok(gerald, "the replacement exists");
  assert.ok(gerald.testUserPermission(P2, "OWNER"), "owned by Robin");
  assert.equal(vit(gerald), "rattled");
  assert.equal(gerald.system.heist.slot, dusty.id);
  assert.equal(gerald.system.heist.replacementOf, dusty.id);
  assert.equal(gerald.system.heist.status, "waiting");
  assert.deepEqual(gerald.items.map(i => i.name).sort(), dusty.items.map(i => i.name).sort());
  assert.equal(dusty.system.heist.status, "out");
  let entry = state().crew.find(c => c.actorId === gerald.id);
  assert.equal(entry.status, "waiting");

  await asGM(async () => { await ns().heist.nextObstacle(); await settle(); });
  assertClean("next obstacle");
  entry = state().crew.find(c => c.actorId === gerald.id);
  assert.equal(state().current, "O2");
  assert.equal(entry.status, "present", "arrived");
  assert.equal(gerald.system.heist.status, "active");
});

test("Abilities across packages: Make a Scene (effect + Alert via GM ops), a Silk Clutch, a GM award, Delay a Flaw", async () => {
  const gerald = game.actors.find(a => a.name === "Gerald");
  const before = alert();
  // Robin's Bruiser replacement makes a scene: a round effect and +1 Alert, both through GM ops.
  await asUser(P2, async () => { const r = await ns().abilities.use(gerald, "sig:bruiser"); assert.ok(r.ok, JSON.stringify(r)); await settle(); });
  assertClean("Make a Scene");
  assert.equal(alert(), before + 1, "Make a Scene: +1, the only Alert it costs");
  assert.ok(state().effects.some(e => e.kind === "dice" && e.value === 2 && (e.excludeActors ?? []).includes(gerald.id)), "+2 dice for the others this round");
  assert.equal(gerald.items.find(i => i.type === "role").system.usage.sceneSerial, state().sceneSerial, "once per scene: stamped");

  // The cat swipes at Pat; Gerald (a Bruiser) Takes the Hit — a GM op from Robin — and shrugs it off.
  diceQueue.push(5, 1, 1, 1);          // Pounce 4: 1 Success
  let atk;
  await asGM(async () => { [atk] = await ns().dice.threatAttack(cat, null, { targets: [pebbles] }); await settle(); });
  assert.ok(buttonLabels(atk, P2).includes("Take the Hit — Gerald"), buttonLabels(atk, P2).join(" | "));
  clickButton(renderMessage(atk, P2), "Take the Hit — Gerald", P2);
  await settle();
  assertClean("take the hit");
  assert.equal(card(game.messages.get(atk.id)).attack.targetUuid, gerald.uuid, "retargeted");
  assert.equal(gerald.items.find(i => i.type === "perk").system.usage.sceneSerial, state().sceneSerial);
  diceQueue.push(5, 6, 1);             // BODY 3 + Endurance 1 − 1 (Rattled): 2 Successes beat 1
  clickButton(renderMessage(game.messages.get(atk.id), P2), "Shrug it off", P2);
  await settle();
  assertClean("Gerald's shrug");
  assert.equal(vit(gerald), "rattled", "shrugged off");
  assert.equal(vit(pebbles), "unharmed");

  // Pat climbs (GRACE 3 + Make a Scene's +2) and fails; then Clutches it.
  diceQueue.push(1, 2, 3, 4, 1);
  dialogResponders.push(rollDialog({ approach: "acrobatics", difficulty: 1 }));
  await asUser(P1, async () => { await pebbles.rollSkill("acrobatics"); await settle(); });
  const msg = lastCard(CARD.check);
  assert.equal(card(msg).roll.pool, 5, JSON.stringify(card(msg).roll.poolParts));
  assert.equal(card(msg).roll.result, "failure", JSON.stringify(card(msg).roll.diffParts));
  assert.equal(alert(), before + 2);
  clickButton(renderMessage(msg, P1), "Silk Clutch (3 SP)", P1);
  await settle();
  assertClean("clutch");
  const c = card(game.messages.get(msg.id));
  assert.equal(c.roll.clutched, true);
  assert.equal(alert(), before + 2, "the Clutch costs +1 instead of the Failure's +1");
  assert.equal(silk(pebbles), 0);
  assert.ok(state().progress.O2.passedActors.includes(pebbles.id), "a Clutched roll counts as progress");

  // A Phase Through (Ghost-style effect, sent as Robin): Gerald is through without a roll, and the obstacle is done.
  await asUser(P2, async () => { await ns().heist.addEffect({ kind: "phaseThrough", actors: [gerald.id], label: "phased through" }, { actorId: gerald.id, ability: "sig:ghost" }); await settle(); });
  assertClean("phase through");
  assert.ok(state().progress.O2.passedActors.includes(gerald.id));
  assert.equal(state().progress.O2.cleared, true, "every present spider is through");
  assert.ok(cards(CARD.prompt).some(m => card(m).title === "Obstacle cleared"));

  // The Storyteller's award; Pat spends it to delay the Show-Off Flaw (a GM op schedules it).
  await asGM(async () => { await ns().heist.awardSilk(pebbles.id, 1, "Creative Species Use"); await settle(); });
  assert.equal(silk(pebbles), 1);
  await asUser(P1, async () => { const r = await ns().abilities.delayFlaw(pebbles); assert.ok(r.ok); await settle(); });
  assertClean("delay flaw");
  assert.equal(silk(pebbles), 0);
  assert.deepEqual(state().flawSchedule.map(f => [f.actorId, f.flawKey]), [[pebbles.id, "show-off"]]);

  // End Round: the delayed Flaw fires by itself (arming the next roll; it pays only if that roll costs).
  await asGM(async () => { await ns().heist.endRound(); await settle(); });
  assertClean("end round 2");
  assert.ok(pebbles.system.heist.pending.some(p => p.source === "show-off"), "Show-Off armed");
  assert.equal(silk(pebbles), 0, "no Flaw Moment yet");
  assert.equal(pebbles.items.find(i => i.type === "flaw").system.usage.heistId, state().heistId);
  assert.ok(!state().effects.some(e => e.kind === "dice"), "Make a Scene's round effect expired");
});

test("Tracker buttons: a player's \"I acted\", the Storyteller fires a Flaw and nudges the clock", async () => {
  const tracker = foundry.applications.instances.get("heisty-heist-tracker");
  const gerald = game.actors.find(a => a.name === "Gerald");
  await asUser(P1, async () => { await tracker.runAction("acted", { actor: pebbles.id }); await settle(); });
  assertClean("I acted");
  assert.ok(state().acted[String(state().roundSerial)].includes(pebbles.id));

  const before = alert();
  const sp = silk(gerald);
  await asGM(async () => { await tracker.runAction("fireFlaw", { actor: gerald.id }); await settle(); });
  assertClean("fire Flaw");
  assert.equal(alert(), before + 1, "Dramatic: +1 Alert");
  assert.equal(silk(gerald), sp + 1, "the Flaw Moment: +1 SP");
  assert.equal(gerald.items.find(i => i.type === "flaw").system.usage.heistId, state().heistId, "once per heist: stamped");

  diceQueue.push(5);                   // Mid-Heist Complication 5: no cover this round
  await asGM(async () => { await tracker.runAction("nudge"); await settle(); });
  assertClean("nudge");
  const comp = lastCard(CARD.complication);
  assert.equal(card(comp).roll, 5);
  assert.ok(state().effects.some(e => e.kind === "noCover"));
});

test("The Escape: a group check — the cat rolls once, the Alert rises once; Show-Off pays its Flaw Moment", async () => {
  await asGM(async () => { await ns().heist.setPhase("escape"); await settle(); });
  assertClean("escape");
  assert.equal(state().phase, "escape");
  assert.equal(state().current, "E1");
  const gerald = game.actors.find(a => a.name === "Gerald");
  await asGM(async () => { await ns().heist.groupCheck("stealth"); await settle(); });
  const gc = lastCard(CARD.group);
  const groupId = card(gc).groupId;
  assert.deepEqual([...card(gc).expected].sort(), [pebbles.id, gerald.id].sort());
  diceQueue.push(5, 1, 1, 1);          // the cat's one roll this round: 1 Success → Difficulty 2 for everyone
  assert.deepEqual(buttonLabels(gc, P1), ["Roll Stealth"], "Pat sees only their own Roll button");
  clickButton(renderMessage(gc, GM), "rolls once for the round", GM);
  await settle();
  assert.equal(state().groups[groupId].opposed.successes, 1);
  const before = alert();
  // Each player rolls from the group card (what its Roll button does).
  diceQueue.push(1, 2, 3, 4, 1, 2);    // Pat: NERVE 4 + Stealth 2 — a Failure (armed: Show-Off)
  dialogResponders.push(rollDialog({ approach: "stealth" }));
  clickButton(renderMessage(game.messages.get(gc.id), P1), "Roll Stealth", P1);
  await settle();
  const patCard = card(lastCard(CARD.check));
  assert.equal(patCard.groupId, groupId);
  assert.equal(patCard.eventId, groupId, "a group check's rolls share one event");
  assert.equal(patCard.roll.showOff, true, "the armed Show-Off");
  // The creature's 1 Success + 1 = 2; Show-Off makes it 4; the Alert band's Stealth penalty still applies on top.
  assert.deepEqual(patCard.roll.diffParts.map(p => [p.id, p.value]), [["base", 2], ["showOff", 2], ["alert", 1]]);
  assert.equal(patCard.roll.difficulty, 5);
  assert.equal(patCard.roll.result, "failure");
  assert.equal(silk(pebbles), 1, "Show-Off's Flaw Moment: it cost them");
  assert.ok(!pebbles.system.heist.pending.some(p => p.source === "show-off"), "the marker is spent");
  diceQueue.push(6, 5);                // Gerald: NERVE 2 + Stealth 1 − 1 (Rattled): a Partial
  dialogResponders.push(rollDialog({ approach: "stealth" }));
  clickButton(renderMessage(game.messages.get(gc.id), P2), "Roll Stealth", P2);
  await settle();
  assertClean("group rolls");
  assert.equal(card(lastCard(CARD.check)).roll.result, "partial");
  assert.equal(alert(), before + 1, "the group raises the Alert once, by its largest trigger");
  assert.equal(state().groups[groupId].closed, true, "everyone expected has rolled");
});

test("With the Storyteller offline a roll still counts: the GM's reconcile applies it on login", async () => {
  GM.active = false;
  const before = alert();
  diceQueue.push(1, 1, 1, 1);          // WIT 4 + Tactics 0: a Failure
  dialogResponders.push(rollDialog({ approach: "tactics", difficulty: 3 }));
  await asUser(P1, async () => { await pebbles.rollSkill("tactics"); await settle(); });
  assert.equal(alert(), before, "nobody applied it yet");
  GM.active = true;
  const { readyHeistAutomation } = await import("../module/heist/automation.mjs");
  await asGM(async () => { await readyHeistAutomation(); await settle(); });
  assertClean("reconcile");
  assert.equal(alert(), before + 1, "reconciled");
});

test("The Debrief: AP to both spiders of a slot; back to idle", async () => {
  await asGM(async () => { await ns().heist.setPhase("debrief"); await settle(); });
  assertClean("debrief");
  const deb = lastCard(CARD.debrief);
  assert.ok(deb, "the Debrief card");
  assert.equal(card(deb).outcome, "partial", "out with no cookie: a Partial");
  const gerald = game.actors.find(a => a.name === "Gerald");
  clickButton(renderMessage(deb, GM), "Award AP", GM);
  await settle();
  assertClean("award");
  const ap = a => a.system.advancement.value;
  assert.ok(ap(pebbles) > 0);
  assert.equal(ap(dusty), ap(pebbles), "the original…");
  assert.equal(ap(gerald), ap(pebbles), "…and the replacement both earn it");
  assert.equal(state().phase, "idle");
  assert.equal(dusty.system.heist.status, "active", "either spider can come back next heist");
});

test("Sheets and HUD render with the live state; no stray dialogs, errors or unhandled rejections", async () => {
  const { SpiderSheet } = await import("../module/sheets/spider-sheet.mjs");
  for (const user of [P1, GM]) {
    const sheet = new SpiderSheet({ document: pebbles });
    await asUser(user, () => sheet.render({ force: true }));
    assert.match(sheet.renderedParts.kit + sheet.renderedParts.main, /Pebbles|Silk|Plausible/);
  }
  const { ThreatSheet } = await import("../module/sheets/threat-sheet.mjs");
  const threat = new ThreatSheet({ document: cat });
  await asGM(() => threat.render({ force: true }));
  assert.match(Object.values(threat.renderedParts).join(""), /House Cat/);
  // With a spider targeted, the GM's pool click is an attack on it.
  GM.targets = new Set([{ actor: pebbles }]);
  diceQueue.push(1, 1, 1, 1);
  const attacks = cards(CARD.attack).length;
  await asGM(async () => { await threat.runAction("rollThreat", { index: "2" }); await settle(); });
  GM.targets = new Set();
  assert.equal(cards(CARD.attack).length, attacks + 1);
  assert.equal(card(lastCard(CARD.attack)).attack.targetUuid, pebbles.uuid);
  const { HeistyItemSheet } = await import("../module/sheets/item-sheet.mjs");
  const flawSheet = new HeistyItemSheet({ document: pebbles.items.find(i => i.type === "flaw") });
  await asUser(P1, () => flawSheet.render({ force: true }));
  assert.match(Object.values(flawSheet.renderedParts).join(""), /Show-Off/);

  // Spend the Debrief's AP: +1 Stealth from the Advance window (the player's own actor).
  const { AdvancementApp } = await import("../module/apps/advancement-app.mjs");
  const apBefore = pebbles.system.advancement.value;
  const adv = await asUser(P1, () => AdvancementApp.open(pebbles));
  assert.match(adv.renderedParts.body, /Stealth/);
  await asUser(P1, () => adv.runAction("buy", { type: "skill", key: "stealth" }));
  await settle();
  assert.equal(pebbles.system.skills.stealth.value, 3);
  assert.equal(pebbles.system.advancement.value, apBefore - 1);
  await asUser(P1, () => adv.close());

  await asGM(() => ui.heistyAlert.render());
  assert.match(ui.heistyAlert.el.innerHTML, /Alert/);
  assert.equal(dialogResponders.length, 0, "every scripted dialog was used");
  assertClean("the end");
});
