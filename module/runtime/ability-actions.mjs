/**
 * HEISTY SPIDEYS — Ability actions (runtime, WP-A)
 * ------------------------------------------------
 * `use(actor, key, opts)` runs the "button" rows of the abilities table
 * (docs/AUTOMATION-DESIGN.md §3.11): it checks the ability is the spider's,
 * available on the heist clock and affordable, does what it does through
 * actor-ops, `game.heistySpideys.heist.addEffect`, `alert.raise` and GM ops,
 * then spends its Silk and stamps its usage.
 *
 * Reactions that live on WP-B / WP-C cards (Run It Again, That's Not What
 * Happened, Take the Hit, …) call `use(actor, key, { stampOnly: true })` to
 * validate, pay and stamp in one place.
 *
 * Also here: the Spend Silk menu, Assist, the setup fields (Method Actor,
 * The Long Con), the Storyteller's Fire / player's Delay for Flaws (fallbacks
 * for when the heist runtime isn't loaded), and `registerSpiderAutomation()`.
 */

import { FLAG, OPS, SETTINGS, HOOKS } from "../contracts.mjs";
import { HEISTY } from "../config.mjs";
import { ABILITIES, getAbility, usageStatus, statusLabel, SILK_MENU } from "../logic/abilities.mjs";
import { countSuccesses } from "../logic/rules.mjs";
import { SpiderData } from "../data/actor-data.mjs";
import {
  actorOps, registerSpiderOps, clock, heistState, setting, abilityItem, markUsed, spendSilk, earnSilk,
  addPending, gmRun, postNote, esc, inRange, actorToken, promptReplacement, createReplacement, playerOwner
} from "./actor-ops.mjs";

const api = () => game.heistySpideys ?? {};
const DialogV2 = () => foundry.applications.api.DialogV2;
const PASSING = new Set(["partial", "success", "critical"]);

/* -------------------------------------------- */
/*  Prompts                                     */
/* -------------------------------------------- */

/** Pick one of several options; resolves the option id or null. */
async function choose(title, options, { hint = "" } = {}) {
  if (!options?.length) return null;
  if (options.length === 1) return options[0].id;
  const res = await DialogV2().wait({
    window: { title },
    classes: ["heisty-spideys", "heisty-dialog"],
    content: hint ? `<p>${esc(hint)}</p>` : "",
    buttons: options.map((o, i) => ({ action: String(o.id), label: o.label, default: i === 0 })),
    rejectClose: false
  });
  return res ?? null;
}

/** Ask for a line of text; resolves the string or null. */
async function askText(title, label, { value = "", placeholder = "" } = {}) {
  const res = await DialogV2().prompt({
    window: { title },
    classes: ["heisty-spideys", "heisty-dialog"],
    content: `<label class="heisty-ask"><span>${esc(label)}</span><input type="text" name="text" value="${esc(value)}" placeholder="${esc(placeholder)}" autofocus /></label>`,
    ok: { label: "OK", callback: (event, button) => button.form?.elements?.text?.value ?? "" },
    rejectClose: false
  });
  return typeof res === "string" ? res.trim() : null;
}

/** Ask for several labelled text fields; resolves {name: value} or null. */
async function askFields(title, fields) {
  const content = fields.map(f => `<label class="heisty-ask"><span>${esc(f.label)}</span><input type="text" name="${f.name}" value="${esc(f.value ?? "")}" placeholder="${esc(f.placeholder ?? "")}" /></label>`).join("");
  const res = await DialogV2().prompt({
    window: { title },
    classes: ["heisty-spideys", "heisty-dialog"],
    content,
    ok: { label: "OK", callback: (event, button) => Object.fromEntries(fields.map(f => [f.name, String(button.form?.elements?.[f.name]?.value ?? "").trim()])) },
    rejectClose: false
  });
  return res && typeof res === "object" ? res : null;
}

/* -------------------------------------------- */
/*  Who's around                                */
/* -------------------------------------------- */

/** Crew spiders (present in the heist, or every player-owned active spider in freeplay). */
export function crewActors({ excludeId = null } = {}) {
  const st = heistState();
  let list = [];
  if (Array.isArray(st?.crew) && st.crew.length) {
    list = st.crew.filter(c => c.status === "present" || !c.status).map(c => game.actors.get(c.actorId)).filter(Boolean);
  } else {
    list = game.actors.filter(a => a.type === "spider" && (a.system.heist?.status ?? "active") === "active"
      && game.users.some(u => !u.isGM && a.testUserPermission(u, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)));
  }
  return list.filter(a => a.id !== excludeId);
}

/** Creatures/NPCs to target: the heist's creature list, else threat tokens on the scene, else threat actors. */
export function npcList() {
  const st = heistState();
  if (Array.isArray(st?.creatures) && st.creatures.length) {
    return st.creatures.map(c => ({
      id: c.id, name: c.name, actor: c.actorUuid ? fromUuidSync(c.actorUuid) : null,
      here: !st.current || (c.atObstacles ?? []).includes(st.current) || c.state?.active
    }));
  }
  const tokens = canvas?.ready ? canvas.tokens.placeables.filter(t => t.actor?.type === "threat") : [];
  if (tokens.length) return tokens.map(t => ({ id: t.actor.id, name: t.name, actor: t.actor, token: t, here: true }));
  return game.actors.filter(a => a.type === "threat").map(a => ({ id: a.id, name: a.name, actor: a, here: false }));
}

/** The user's single targeted token, if it fits. */
function targetedToken(filter) {
  const t = [...(game.user.targets ?? [])].filter(tk => tk.actor && filter(tk.actor));
  return t.length === 1 ? t[0] : null;
}

async function pickCrewmate(actor, title, { includeSelf = false, adjacent = false } = {}) {
  const tk = targetedToken(a => a.type === "spider" && (includeSelf || a.id !== actor.id));
  if (tk) return tk.actor;
  let crew = crewActors({ excludeId: includeSelf ? null : actor.id });
  if (includeSelf && !crew.some(a => a.id === actor.id)) crew = [actor, ...crew];
  if (adjacent) {
    const near = crew.filter(a => inRange(actor, a, 1) !== false);
    if (near.length) crew = near;
  }
  if (!crew.length) { ui.notifications?.warn("No crewmate to pick."); return null; }
  const id = await choose(title, crew.map(a => ({ id: a.id, label: a.name })));
  return id ? game.actors.get(id) : null;
}

async function pickNpc(title) {
  const tk = targetedToken(a => a.type === "threat");
  const list = npcList();
  if (tk) return list.find(n => n.actor?.id === tk.actor.id) ?? { id: tk.actor.id, name: tk.name, actor: tk.actor, token: tk };
  const here = list.filter(n => n.here);
  const opts = (here.length ? here : list);
  if (!opts.length) { ui.notifications?.warn("No NPC to pick — target a token or start a heist."); return null; }
  const id = await choose(title, opts.map(n => ({ id: n.id, label: n.name })));
  return opts.find(n => String(n.id) === String(id)) ?? null;
}

/* -------------------------------------------- */
/*  Heist effects and NPC checks                */
/* -------------------------------------------- */

/**
 * Add a heist effect (§2 `effects[]`). Through `heist.addEffect` when loaded,
 * else the `heist.addEffect` GM op; returns false when neither is there.
 */
async function addEffect(actor, ability, effect) {
  const full = { source: ability, label: getAbility(ability)?.name ?? ability, sourceActorId: actor?.id ?? "", ...effect };
  try {
    const heist = api().heist;
    if (typeof heist?.addEffect === "function") { await heist.addEffect(full, { actorId: actor?.id, ability }); return true; }
    await gmRun(OPS.heistAddEffect, { effect: full, actorId: actor?.id, ability, userId: game.user.id });
    return true;
  } catch (err) {
    console.warn("Heisty Spideys | no heist runtime for effect", full, err);
    return false;
  }
}

/** Mark the spider as having acted this round (best effort). */
async function markActed(actor) {
  try {
    const heist = api().heist;
    if (typeof heist?.markActed === "function") await heist.markActed(actor.id);
    else await gmRun(OPS.heistActed, { actorId: actor.id, userId: game.user.id });
  } catch (err) { /* no tracker */ }
}

/** An NPC's Perception-like pool for its own checks (Decoy, surprise). */
function npcCheckPool(npcActor) {
  const rolls = npcActor?.system?.rolls ?? [];
  const r = rolls.find(x => /perception|nose|spotting/i.test(`${x.label} ${x.note}`));
  return Number(r?.pool) || 3;
}

/**
 * Roll each NPC's check against a Difficulty; an NPC needs the full
 * Difficulty (E12/E21). Posts one card with every result.
 * @returns {Promise<Array<{id, name, pool, successes, passed}>>}
 */
async function rollNpcChecks(actor, ability, difficulty, label) {
  const npcs = npcList().filter(n => n.here || !heistState());
  const results = [];
  const rolls = [];
  for (const n of npcs) {
    const pool = npcCheckPool(n.actor);
    const roll = await new Roll(`${pool}d6`).evaluate();
    const faces = roll.dice[0]?.results?.map(r => r.result) ?? [];
    const successes = countSuccesses(faces);
    results.push({ id: n.id, name: n.name, pool, successes, passed: successes >= difficulty, faces });
    rolls.push(roll);
  }
  const rows = results.map(r => `<li>${esc(r.name)}: ${r.successes} / ${difficulty} — <strong>${r.passed ? "not fooled" : label}</strong> <span class="dim">(${r.pool}d6: ${r.faces.join(", ")})</span></li>`).join("");
  if (results.length) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="heisty-ability-card"><h4 class="hac-title">${esc(getAbility(ability)?.name ?? ability)} — NPC checks (Difficulty ${difficulty})</h4><ul class="hac-list">${rows}</ul></div>`,
      rolls, flags: { [FLAG]: { ability: { key: ability, actorId: actor.id, kind: "npcChecks" } } }
    });
  }
  return results;
}

/* -------------------------------------------- */
/*  Rolls                                       */
/* -------------------------------------------- */

/** A pre-bound roll through WP-B's dice (falls back to the 1.7 dialog). Resolves the message. */
async function preboundRoll(actor, { skill, attr = null, difficulty = null, ability = "", targetId = "", free = false }) {
  const dice = api().dice;
  const opts = { difficulty: difficulty ?? undefined, ability, abilityTargetId: targetId, free, forced: free };
  const asMessage = r => (r?.message instanceof ChatMessage ? r.message : r);
  try {
    if (skill && typeof dice?.rollCheck === "function") return asMessage(await dice.rollCheck(actor, skill, opts));
    if (skill) return asMessage(await actor.rollSkill(skill, opts));
    if (attr) return asMessage(await actor.rollAttribute(attr, opts));
  } catch (err) {
    console.error("Heisty Spideys | ability roll failed:", err);
  }
  return null;
}

/** The result key on a roll message (WP-B card flags), or null. */
export function messageResult(msg) {
  return msg?.flags?.[FLAG]?.card?.roll?.result ?? msg?.getFlag?.(FLAG, "card")?.roll?.result ?? null;
}

/* -------------------------------------------- */
/*  Handlers (one per `action`)                 */
/* -------------------------------------------- */

const title = (def, extra = "") => `${esc(def.name)}${extra ? ` — ${esc(extra)}` : ""}`;

const HANDLERS = {

  /** Did You See That Jump?! */
  async autoSuccess(actor, def) {
    const speed = actor.system.speed?.effective ?? actor.system.speed?.value ?? 0;
    await postNote(actor, `<p><strong>Automatic success:</strong> one straight leap up to ${speed} squares, landing exactly where ${esc(actor.name)} meant to. It does not land quietly — that's a separate problem.</p>`,
      { title: title(def), flags: { ability: { key: def.key, actorId: actor.id } } });
    return {};
  },

  /** Everything Connects: Line or Snare until the scene ends. */
  async orbWeb(actor, def, { mode, clock: c }) {
    mode = mode ?? await choose(def.name, def.modes, { hint: "Spin silk across up to 3 connected squares." });
    if (!mode) return { cancelled: true };
    const line = mode === "line";
    await addEffect(actor, def.key, {
      kind: line ? "orbLine" : "orbSnare", skills: line ? ["acrobatics"] : [], value: 0,
      untilSceneSerial: c.sceneSerial, label: line ? "Orb Weaver's Line: Acrobatics crossings here need no roll" : "Orb Weaver's Snare"
    });
    await postNote(actor, line
      ? "<p><strong>Line:</strong> the crew moves along the webbed squares as safe footing — no Acrobatics roll — until it's broken or the scene ends.</p>"
      : "<p><strong>Snare:</strong> the first creature to enter a webbed square is caught: an Action to break free, or Athletics/Brawl against Difficulty 3.</p>",
    { title: title(def, line ? "Line" : "Snare"), flags: { ability: { key: def.key, actorId: actor.id, mode } } });
    if (!line) await postNote(actor, `<p>${esc(actor.name)}'s snare is set. When a creature steps in, it's caught (Action to break free, or Athletics/Brawl D3).</p>`, { whisperGM: true, title: "Snare set" });
    await markActed(actor);
    return { mode };
  },

  /** Precision Application: jam / snag / pin, 6 squares, line of sight. */
  async spit(actor, def, { mode, clock: c, force }) {
    mode = mode ?? await choose(def.name, def.modes);
    if (!mode) return { cancelled: true };
    const tk = [...(game.user.targets ?? [])][0] ?? null;
    if (tk && !force && inRange(actor, tk, def.range) === false) {
      ui.notifications?.warn(`${tk.name} is more than ${def.range} squares away.`);
      return { cancelled: true };
    }
    if (mode === "pin") {
      const npc = tk?.actor?.type === "threat" ? (npcList().find(n => n.actor?.id === tk.actor.id) ?? { id: tk.actor.id, name: tk.name }) : await pickNpc("Pin which target?");
      if (!npc) return { cancelled: true };
      await addEffect(actor, def.key, { kind: "npcDistracted", actors: [npc.id], untilRoundSerial: c.roundSerial, label: `${npc.name} pinned in place` });
      await postNote(actor, `<p><strong>Pinned:</strong> ${esc(npc.name)} is stuck in place for one round.</p>`, { title: title(def, "Pin"), flags: { ability: { key: def.key, actorId: actor.id, mode } } });
    } else if (mode === "jam") {
      await postNote(actor, "<p><strong>Jammed:</strong> a small mechanism — a lock, a sensor, a latch. A jammed sensor stops sensing; a jammed lock or latch stays shut.</p>",
        { title: title(def, "Jam"), flags: { ability: { key: def.key, actorId: actor.id, mode } } });
      await postNote(actor, `<p>${esc(actor.name)} jammed a small mechanism here. If it's this obstacle's sensor or latch, mark the approach cleared on the tracker.</p>`, { whisperGM: true, title: "Precision Application" });
    } else {
      await postNote(actor, "<p><strong>Snagged:</strong> a light object, pulled in on the strand.</p>", { title: title(def, "Snag"), flags: { ability: { key: def.key, actorId: actor.id, mode } } });
    }
    await markActed(actor);
    return { mode };
  },

  /** Wait, Was That There Before?: hold still. Cleared when the token moves (WP-C tokens). */
  async camouflage(actor, def) {
    if (actor.system.heist?.camouflaged) {
      await actor.update({ "system.heist.camouflaged": false });
      return { noStamp: true, off: true };
    }
    await actor.update({ "system.heist.camouflaged": true });
    await postNote(actor, "<p>Holding perfectly still: Stealth Difficulty −2 until it moves.</p>", { title: title(def), flags: { ability: { key: def.key, actorId: actor.id } } });
    return {};
  },

  /** Phase Through: past this obstacle, no roll, no Alert. */
  async phaseThrough(actor, def, { clock: c }) {
    const cellar = !!abilityItem(actor, "species:cellar");
    await addEffect(actor, def.key, { kind: "phaseThrough", actors: [actor.id], obstacleId: heistState()?.current ?? null, untilSceneSerial: c.sceneSerial, label: `${actor.name} phased through` });
    await postNote(actor, `<p>${esc(actor.name)} slips through a gap — no roll, no Alert — and is through this obstacle.${cellar ? " A Cellar Spider takes the loot through with it, whatever its size." : ""}</p>`,
      { title: title(def), flags: { ability: { key: def.key, actorId: actor.id, cellar } } });
    await markActed(actor);
    return { cellar };
  },

  /** I Made a Thing: Bypass, Boost or Distraction. */
  async madeAThing(actor, def, { mode, targetId, clock: c }) {
    mode = mode ?? await choose(def.name, def.modes, { hint: "Cobble a one-use gadget out of what's on the map." });
    if (!mode) return { cancelled: true };
    if (mode === "bypass") {
      await addPending(actor, { diff: -1, skills: ["engineering"], label: "Bypass (a small mechanism, not the key lock)", source: def.key });
      await postNote(actor, "<p><strong>Bypass:</strong> −1 Difficulty on the next Engineering roll against one small mechanism — not the heist's key lock.</p>", { title: title(def, "Bypass"), flags: { ability: { key: def.key, actorId: actor.id, mode } } });
    } else if (mode === "boost") {
      const target = targetId ? game.actors.get(targetId) : await pickCrewmate(actor, "Boost: hand it to whom?");
      if (!target) return { cancelled: true };
      const ok = await addPending(target, { dice: 2, capped: true, label: `Boost from ${actor.name}`, source: def.key }, { sourceActor: actor, ability: def.key });
      if (!ok) return { cancelled: true };
      await postNote(actor, `<p><strong>Boost:</strong> ${esc(target.name)} gets +2 dice on their next roll.</p>`, { title: title(def, "Boost"), flags: { ability: { key: def.key, actorId: actor.id, mode, targetId: target.id } } });
    } else {
      await addEffect(actor, def.key, { kind: "npcDistracted", actors: [], all: true, untilRoundSerial: c.roundSerial, label: "Distraction: every nearby NPC is looking elsewhere" });
      await postNote(actor, "<p><strong>Distraction:</strong> set off in a square within 6 — every nearby NPC's attention goes there for one round.</p>", { title: title(def, "Distraction"), flags: { ability: { key: def.key, actorId: actor.id, mode } } });
    }
    await markActed(actor);
    return { mode };
  },

  /** Make a Scene: +2 dice for every other crewmate this round; +1 Alert. */
  async makeAScene(actor, def, { clock: c }) {
    const ok = await addEffect(actor, def.key, { kind: "dice", value: 2, excludeActors: [actor.id], untilRoundSerial: c.roundSerial, label: "Make a Scene: +2 dice" });
    if (!ok) {
      for (const mate of crewActors({ excludeId: actor.id })) {
        await addPending(mate, { dice: 2, capped: true, expires: "round", label: "Make a Scene", source: def.key }, { sourceActor: actor, ability: def.key });
      }
    }
    await addEffect(actor, def.key, { kind: "npcDistracted", actors: [], all: true, untilRoundSerial: c.roundSerial, label: `Every NPC is watching ${actor.name}` });
    const raised = await raiseAlert(actor, def, `ability:${def.key}:${actor.id}:${c.heistId}:${c.sceneSerial}`, 1, "Make a Scene");
    await postNote(actor, `<p>${esc(actor.name)} pulls every NPC in the scene onto themselves for one round. Every other crewmate gets <strong>+2 dice</strong> this round. The Alert goes up by 1 — the only Alert it costs.</p>${raised ? "" : "<p class=\"dim\">(Storyteller: add the +1 Alert.)</p>"}`,
      { title: title(def), flags: { ability: { key: def.key, actorId: actor.id } } });
    return {};
  },

  /** I Called It: the ST picks +1 / +2 / 0 for whoever rolls next. */
  async iCalledIt(actor, def, { targetId }) {
    const target = targetId ? game.actors.get(targetId) : await pickCrewmate(actor, "I Called It: whose roll?", { includeSelf: true });
    if (!target) return { cancelled: true };
    const why = await askText(def.name, "What tipped you off? (one sentence)");
    if (why === null) return { cancelled: true };
    await gmPromptCard(actor, def, {
      html: `<p><strong>${esc(actor.name)}</strong> called it for <strong>${esc(target.name)}</strong>'s next roll: <em>“${esc(why || "…")}”</em></p><p>Remotely plausible +1 · fits what's established +2 · contradicts the facts 0.</p>`,
      buttons: [{ value: "1", label: "+1 die", primary: true }, { value: "2", label: "+2 dice" }, { value: "0", label: "Nothing" }],
      data: { kind: "iCalledIt", targetId: target.id }
    });
    await postNote(actor, `<p>${esc(actor.name)}: “I called it.” <em>${esc(why || "")}</em> — the Storyteller decides how plausible.</p>`, { title: title(def) });
    return { targetId: target.id };
  },

  /** I Know a Way: Escape rolls −1 for the whole crew. */
  async iKnowAWay(actor, def) {
    const route = await askText(def.name, "Describe the route nobody knew existed", { placeholder: "a gap behind the washing machine" });
    if (route === null) return { cancelled: true };
    await addEffect(actor, def.key, { kind: "escapeDiff", value: -1, label: "I Know a Way: Escape rolls −1" });
    await postNote(actor, `<p>${esc(actor.name)} knows a way: <em>${esc(route || "a route nobody knew existed")}</em>. Every Escape roll is <strong>−1 Difficulty</strong> for the whole crew.</p>`,
      { title: title(def), flags: { ability: { key: def.key, actorId: actor.id } } });
    return {};
  },

  /** You're Looking at the Wrong Spider: Decoy. */
  async decoy(actor, def, { clock: c }) {
    const what = await askText(def.name, "Describe the Decoy", { placeholder: "a fake crew at the fridge" });
    if (what === null) return { cancelled: true };
    const results = await rollNpcChecks(actor, def.key, def.npcCheck.difficulty, "investigates the Decoy");
    const fooled = results.filter(r => !r.passed).map(r => r.id);
    const until = c.roundSerial + def.rounds - 1;
    if (fooled.length) await addEffect(actor, def.key, { kind: "npcDistracted", actors: fooled, untilRoundSerial: until, label: "Investigating the Decoy" });
    await addEffect(actor, def.key, { kind: "dice", value: 1, jobOnly: true, untilRoundSerial: until, label: "Decoy: +1 die on job rolls" });
    await postNote(actor, `<p>The Decoy: <em>${esc(what || "a fake crew")}</em>. For two rounds the real crew works unobserved; every roll that's part of the actual job gets <strong>+1 die</strong>.</p>`,
      { title: title(def), flags: { ability: { key: def.key, actorId: actor.id } } });
    await markActed(actor);
    return { fooled };
  },

  /** Fast Talk: one NPC distracted for exactly one round. */
  async fastTalk(actor, def, { clock: c }) {
    const npc = await pickNpc("Fast Talk: which NPC?");
    if (!npc) return { cancelled: true };
    await addEffect(actor, def.key, { kind: "npcDistracted", actors: [npc.id], untilRoundSerial: c.roundSerial, label: `${npc.name} distracted` });
    await postNote(actor, `<p>${esc(npc.name)} is distracted for exactly one round.</p>`, { title: title(def), flags: { ability: { key: def.key, actorId: actor.id, npcId: npc.id } } });
    return { npcId: npc.id };
  },

  /** Double Bluff: an NPC that saw through the disguise is confused for a round. */
  async doubleBluff(actor, def, { clock: c }) {
    const npc = await pickNpc("Double Bluff: which NPC saw through you?");
    if (!npc) return { cancelled: true };
    await addEffect(actor, def.key, { kind: "npcDistracted", actors: [npc.id], untilRoundSerial: c.roundSerial, label: `${npc.name} confused` });
    await postNote(actor, `<p>The disguise was the distraction. ${esc(npc.name)} is confused for a round.</p>`, { title: title(def), flags: { ability: { key: def.key, actorId: actor.id, npcId: npc.id } } });
    return { npcId: npc.id };
  },

  /** Actually, I Planned This: the ST confirms; then +1 die for every crewmate. */
  async plannedThis(actor, def) {
    await gmPromptCard(actor, def, {
      html: `<p><strong>${esc(actor.name)}</strong>: “Actually, I planned this.” Did a plan visibly fall apart? If so, every crewmate gets +1 die on their next roll.</p>`,
      buttons: [{ value: "yes", label: "It fell apart — +1 die each", primary: true }, { value: "no", label: "Not yet" }],
      data: { kind: "plannedThis" }
    });
    return { noStamp: true, noSpend: true };
  },

  /** Information Perks: whisper the ST the question with the relevant stat-block text. */
  async infoPrompt(actor, def) {
    const context = creatureContext();
    await gmPromptCard(actor, def, {
      html: `<p><strong>${esc(actor.name)}</strong> uses ${esc(def.name)}.</p><p class="hac-question">${esc(def.question)}</p>${context}`,
      buttons: [{ value: "answer", label: "Answer the player…", primary: true }],
      data: { kind: "info" }
    });
    if (def.usesAction) await markActed(actor);
    return {};
  },

  /** A pre-bound roll (Jury-Rig, Ghost Protocol, Silk Grapple, Counter-Surveillance). */
  async rollCheck(actor, def, { force, clock: c }) {
    let npc = null;
    if (def.target === "npc") {
      npc = await pickNpc(`${def.name}: which target?`);
      if (!npc) return { cancelled: true };
      const tk = npc.token ?? (npc.actor ? actorToken(npc.actor) : null);
      if (def.range && tk && !force && inRange(actor, tk, def.range) === false) {
        ui.notifications?.warn(`${npc.name} is more than ${def.range} squares away.`);
        return { cancelled: true };
      }
    }
    const msg = await preboundRoll(actor, { skill: def.roll.skill, difficulty: def.roll.difficulty ?? null, ability: def.key, free: !!def.roll.free });
    if (!msg) return { cancelled: true };
    const result = messageResult(msg);
    if (PASSING.has(result)) {
      if (npc && def.key === "silk-grapple") {
        await addEffect(actor, def.key, { kind: "npcDistracted", actors: [npc.id], untilRoundSerial: c.roundSerial, label: `${npc.name} held by a silk grapple` });
      }
      if (def.question) await gmPromptCard(actor, def, { html: `<p class="hac-question">${esc(def.question)}</p>${creatureContext()}`, buttons: [{ value: "answer", label: "Answer the player…", primary: true }], data: { kind: "info" } });
    }
    return { messageId: msg.id, result };
  },

  /** Field Repair: adjacent crewmate, Engineering D2, +1 level on a pass. */
  async fieldRepair(actor, def, { targetId, force }) {
    const target = targetId ? game.actors.get(targetId) : await pickCrewmate(actor, "Field Repair: patch whom?", { adjacent: true });
    if (!target) return { cancelled: true };
    if (!force && inRange(actor, target, 1) === false) { ui.notifications?.warn(`${target.name} isn't adjacent.`); return { cancelled: true }; }
    const msg = await preboundRoll(actor, { skill: "engineering", difficulty: 2, ability: def.key, targetId: target.id });
    if (!msg) return { cancelled: true };
    const result = messageResult(msg);
    if (PASSING.has(result)) {
      try {
        await gmRun(OPS.actorHeal, { targetId: target.id, sourceActorId: actor.id, messageId: msg.id, userId: game.user.id });
      } catch (err) { ui.notifications?.warn(err?.message ?? String(err)); }
    } else if (result === null) {
      await postNote(actor, `<p>Field Repair on ${esc(target.name)}: on a pass, the Storyteller steps their Vitality up one level.</p>`, { whisperGM: true, title: title(def) });
    }
    return { messageId: msg.id, result, targetId: target.id };
  },

  /** Planning Perks recorded as free preparations. */
  async preparation(actor, def) {
    const prompts = {
      stash: "What do you stash, and where?",
      trap: "Where's the web trap?",
      shortcut: "Between which two points?",
      evidence: "What false information, and where?"
    };
    const text = await askText(def.name, prompts[def.prep] ?? "Describe it");
    if (text === null) return { cancelled: true };
    try {
      // Perk-granted: free, and not this spider's one Preparation (E15).
      const kind = def.prep === "stash" ? "deadDrop" : "perk";
      await gmRun(OPS.heistPrep, { actorId: actor.id, userId: game.user.id, ability: def.key, kind, text, free: true, prep: { kind, ability: def.key, text, free: true, perkKind: def.prep } });
    } catch (err) { /* the card below is the record */ }
    await postNote(actor, `<p>${esc(def.name)}: <em>${esc(text)}</em></p><p class="dim">Free — it isn't this spider's Preparation.</p>`, { title: title(def), flags: { ability: { key: def.key, actorId: actor.id, text } } });
    return { text };
  },

  /** Contingency: trigger + the roll it replaces. */
  async contingency(actor, def) {
    const res = await askFields(def.name, [
      { name: "trigger", label: "The trigger", placeholder: "if the cat wakes up" },
      { name: "rollDesc", label: "The roll it replaces", placeholder: "the dash to the vent" }
    ]);
    if (!res || !res.trigger) return { cancelled: true };
    try {
      await gmRun(OPS.heistPrep, { actorId: actor.id, userId: game.user.id, ability: def.key, kind: "contingency", text: `${res.trigger} → ${res.rollDesc}`, trigger: res.trigger, rollDesc: res.rollDesc, free: true, prep: { kind: "contingency", ability: def.key, trigger: res.trigger, rollDesc: res.rollDesc, free: true } });
    } catch (err) { /* the card below is the record */ }
    await postNote(actor, `<p>Contingency: <strong>${esc(res.trigger)}</strong> → <em>${esc(res.rollDesc || "that roll")}</em> is a Success — no Alert, no complication.</p>`, { title: title(def), whisperGM: false, flags: { ability: { key: def.key, actorId: actor.id, ...res } } });
    return res;
  },

  /** Tactical Feed: +1 die to a crewmate's next roll (capped; not an Assist). */
  async pendingDie(actor, def, { targetId }) {
    const target = targetId ? game.actors.get(targetId) : await pickCrewmate(actor, `${def.name}: who?`);
    if (!target) return { cancelled: true };
    const ok = await addPending(target, { dice: def.dice ?? 1, capped: true, label: `${def.name} from ${actor.name}`, source: def.key }, { sourceActor: actor, ability: def.key });
    if (!ok) return { cancelled: true };
    await postNote(actor, `<p>${esc(target.name)} gets <strong>+${def.dice ?? 1} die</strong> on their next roll.</p>`, { title: title(def), flags: { ability: { key: def.key, actorId: actor.id, targetId: target.id } } });
    return { targetId: target.id };
  },

  /** Thunderous Entrance: every NPC checks D3 or freezes a round. */
  async thunderous(actor, def, { clock: c }) {
    const results = await rollNpcChecks(actor, def.key, def.npcCheck.difficulty, "freezes in surprise");
    const frozen = results.filter(r => !r.passed).map(r => r.id);
    if (frozen.length) await addEffect(actor, def.key, { kind: "npcDistracted", actors: frozen, untilRoundSerial: c.roundSerial, label: "Frozen in surprise" });
    await postNote(actor, `<p>${esc(actor.name)} enters from an unexpected direction. ${frozen.length ? `${frozen.length} NPC${frozen.length === 1 ? "" : "s"} freeze for a round.` : "Nobody freezes."}</p>`, { title: title(def), flags: { ability: { key: def.key, actorId: actor.id } } });
    return { frozen };
  },

  /** Assist (everyone): handled by `assist()`. */
  async assist(actor, def, opts) {
    return assist(actor, opts);
  }
};

/* -------------------------------------------- */
/*  Alert and GM prompt cards                   */
/* -------------------------------------------- */

/** Raise the Alert through WP-C's ledger; false if it isn't loaded. */
async function raiseAlert(actor, def, eventId, delta, label) {
  const alert = api().alert;
  if (typeof alert?.raise !== "function") return false;
  try {
    await alert.raise({ eventId, triggers: [{ key: "manual", delta, label }], cause: label, source: { actorId: actor.id, ability: def.key } });
    return true;
  } catch (err) {
    console.warn("Heisty Spideys | couldn't raise the Alert:", err);
    return false;
  }
}

/** Stat-block text of the creatures at the current obstacle (for information Perks). */
function creatureContext() {
  const strip = h => String(h ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const st = heistState();
  const ob = st?.obstacles?.find?.(o => o.id === st.current);
  const parts = [];
  if (ob) parts.push(`<p><strong>Obstacle:</strong> ${esc(ob.name)}${ob.tags?.length ? ` <span class="dim">(${esc(ob.tags.join(", "))})</span>` : ""}</p>`);
  for (const n of npcList().filter(n => n.here).slice(0, 4)) {
    const s = n.actor?.system;
    if (!s) continue;
    const bits = [["Senses", s.senses], ["Escalation", s.escalation], ["Weakness", s.weakness]].filter(([, v]) => strip(v));
    if (bits.length) parts.push(`<details><summary>${esc(n.name)}</summary>${bits.map(([k, v]) => `<p><strong>${k}:</strong> ${esc(strip(v))}</p>`).join("")}</details>`);
  }
  return parts.join("");
}

/** A GM-whispered card with one-click answers, handled by `onRenderAbilityCard`. */
async function gmPromptCard(actor, def, { html, buttons, data }) {
  const btns = buttons.map(b => `<button type="button" class="hac-btn${b.primary ? " primary" : ""}" data-hac-choice="${esc(b.value)}">${esc(b.label)}</button>`).join("");
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    whisper: game.users.filter(u => u.isGM).map(u => u.id),
    content: `<div class="heisty-ability-card gm-prompt"><h4 class="hac-title">${esc(def.name)}</h4>${html}<div class="hac-buttons">${btns}</div></div>`,
    flags: { [FLAG]: { ability: { key: def.key, actorId: actor.id, prompt: true, resolved: false, ...data } } }
  });
}

/** GM side of the prompt cards (I Called It, Actually I Planned This, information Perks). */
async function resolvePrompt(message, choice) {
  if (!game.user.isGM) return;
  const info = message.flags?.[FLAG]?.ability;
  if (!info || info.resolved) return;
  const actor = game.actors.get(info.actorId);
  const def = getAbility(info.key);
  let outcome = "";
  if (info.kind === "iCalledIt") {
    const n = Number(choice) || 0;
    const target = game.actors.get(info.targetId);
    if (n > 0 && target) await addPending(target, { dice: n, capped: true, label: `I Called It (${actor?.name ?? "Lookout"})`, source: "sig:lookout" });
    outcome = n > 0 ? `${target?.name ?? "The roller"} gets +${n} ${n === 1 ? "die" : "dice"} on that roll.` : "Nothing — it contradicts what's known.";
  } else if (info.kind === "plannedThis") {
    if (choice !== "yes") return; // stays open until the plan falls apart
    if (actor) await markUsed(actor, "actually-i-planned-this");
    for (const mate of crewActors()) {
      await addPending(mate, { dice: 1, capped: true, label: "Actually, I Planned This", source: "actually-i-planned-this" });
    }
    outcome = "Every crewmate gets +1 die on their next roll.";
  } else if (info.kind === "info") {
    const answer = await askText(def?.name ?? "Answer", "Your answer to the player");
    if (answer === null) return;
    const owners = actor ? game.users.filter(u => actor.testUserPermission(u, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)).map(u => u.id) : [];
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ alias: "Storyteller" }),
      whisper: [...new Set(owners)],
      content: `<div class="heisty-ability-card"><h4 class="hac-title">${esc(def?.name ?? "Answer")}</h4><p>${esc(answer)}</p></div>`
    });
    outcome = `Answered: “${answer}”`;
  }
  await message.update({
    [`flags.${FLAG}.ability.resolved`]: true,
    [`flags.${FLAG}.ability.choice`]: choice,
    content: message.content.replace(/<div class="hac-buttons">[\s\S]*?<\/div>/, `<p class="hac-outcome">${esc(outcome)}</p>`)
  });
}

/** Wire the GM prompt buttons on our ability cards. */
function onRenderAbilityCard(message, html) {
  const info = message?.flags?.[FLAG]?.ability;
  if (!info?.prompt) return;
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  const buttons = root.querySelectorAll("[data-hac-choice]");
  if (!game.user.isGM || info.resolved) { buttons.forEach(b => b.remove()); return; }
  buttons.forEach(btn => btn.addEventListener("click", ev => {
    ev.preventDefault();
    resolvePrompt(message, ev.currentTarget.dataset.hacChoice);
  }));
}

/* -------------------------------------------- */
/*  use()                                       */
/* -------------------------------------------- */

const fail = (reason, notify = true) => {
  if (notify && reason) ui.notifications?.warn(reason);
  return { ok: false, reason };
};

/**
 * Use an ability.
 * @param {Actor} actor
 * @param {string} key           An ABILITIES key.
 * @param {object} [opts]
 * @param {boolean} [opts.stampOnly]  Validate, pay and stamp only (reactions run by card buttons).
 * @param {boolean} [opts.force]      GM override: skip availability and range checks.
 * @param {boolean} [opts.quiet]      No warning toasts.
 * @param {string}  [opts.mode]       Pre-chosen mode (Orb Weaver, Spitting, I Made a Thing).
 * @param {string}  [opts.targetId]   Pre-chosen crewmate.
 * @returns {Promise<{ok:boolean, reason?:string, usage?:object}>}
 */
export async function use(actor, key, opts = {}) {
  const notify = !opts.quiet;
  const def = getAbility(key);
  if (!def) return fail(`Unknown ability "${key}".`, notify);
  if (!actor || actor.type !== "spider") return fail("Pick a spider first.", notify);
  if (!actor.isOwner) return fail("You don't control that spider.", notify);
  if (def.scope === "crew") return fail(`${def.name} is a crew spend — use it from the Alert or complication card.`, notify);
  const item = def.kind === "general" ? null : abilityItem(actor, key);
  if (def.kind !== "general" && !item) return fail(`${actor.name} doesn't have ${def.name}.`, notify);

  const c = clock();
  const status = usageStatus(def, item?.system?.usage, c);
  if (!status.available && !(opts.force && game.user.isGM)) return fail(`${def.name}: ${statusLabel(def, status)}.`, notify);
  const have = Number(actor.system.silk?.value) || 0;
  if (def.cost && setting(SETTINGS.autoSilk, true) && have < def.cost) return fail(`${def.name} costs ${def.cost} SP; ${actor.name} has ${have}.`, notify);

  let res = {};
  if (!opts.stampOnly) {
    if (def.kind === "flaw") return fail("Flaws are fired by the Storyteller.", notify);
    if (def.setup && !def.action) return setup(actor, key);
    const handler = HANDLERS[def.action];
    if (!handler) return fail(`${def.name} is always on — the system applies it for you.`, notify);
    res = (await handler(actor, def, { ...opts, clock: c, item })) ?? {};
    if (res.cancelled) return { ok: false, reason: "cancelled" };
  }
  if (def.cost && !res.noSpend) {
    const paid = await spendSilk(actor, def.cost, { reason: def.name });
    if (!paid) return { ok: false, reason: "silk" };
  }
  // Always-available abilities are stamped only when a card reaction asks (the
  // count is still useful for "once per roll" checks on that card).
  let usage = null;
  if (item && !res.noStamp && (def.freq !== "always" || opts.stampOnly)) usage = await markUsed(actor, key, c);
  return { ok: true, ...res, usage };
}

/* -------------------------------------------- */
/*  Assist                                      */
/* -------------------------------------------- */

/**
 * Assist a crewmate's next roll: roll one of your Skills (1–3 dice) plus your
 * own Silk dice (outside the 3); each Success is +1 die on their roll (capped
 * with the other bonuses). One Assist per roll — the latest replaces.
 * Delegates to WP-B's `dice.rollAssist` when it's loaded.
 */
export async function assist(actor, { targetId, skill, silk = null, force = false } = {}) {
  if (!actor?.isOwner) return fail("You don't control that spider.");
  const target = targetId ? game.actors.get(targetId) : await pickCrewmate(actor, "Assist whom?", { adjacent: true });
  if (!target) return { ok: false, reason: "cancelled" };
  if (!force && inRange(actor, target, 1) === false) {
    const go = await DialogV2().confirm({ window: { title: "Assist" }, content: `<p>${esc(target.name)} isn't adjacent. Are you connected by a silk line, or otherwise able to help?</p>`, rejectClose: false });
    if (!go) return { ok: false, reason: "range" };
  }
  const dice = api().dice;
  if (typeof dice?.rollAssist === "function") {
    const msg = await dice.rollAssist(actor, { targetId: target.id, skill, silk });
    if (msg) await markActed(actor);
    return { ok: !!msg, messageId: msg?.id };
  }
  // Fallback: pick a Skill and Silk, roll, queue the bonus.
  if (!skill || silk === null) {
    const opts = Object.entries(HEISTY.skills).map(([k, s]) => `<option value="${k}">${esc(s.label)} (${actor.system.skills?.[k]?.value ?? 0})</option>`).join("");
    const maxSilk = Number(actor.system.silk?.value) || 0;
    const res = await DialogV2().prompt({
      window: { title: `Assist ${target.name}` },
      classes: ["heisty-spideys", "heisty-dialog"],
      content: `<label class="heisty-ask"><span>Your Skill (the ST's call)</span><select name="skill">${opts}</select></label>
        <label class="heisty-ask"><span>Your own Silk dice (1 SP each, max ${maxSilk})</span><input type="number" name="silk" min="0" max="${maxSilk}" value="0" /></label>`,
      ok: { label: "Roll Assist", callback: (ev, btn) => ({ skill: btn.form.elements.skill.value, silk: Number(btn.form.elements.silk.value) || 0 }) },
      rejectClose: false
    });
    if (!res) return { ok: false, reason: "cancelled" };
    skill = res.skill; silk = res.silk;
  }
  const rating = Number(actor.system.skills?.[skill]?.value) || 0;
  const silkDice = Math.max(0, Math.min(Number(silk) || 0, Number(actor.system.silk?.value) || 0));
  if (silkDice && !(await spendSilk(actor, silkDice, { reason: "Silk dice on the Assist" }))) return { ok: false, reason: "silk" };
  const pool = Math.min(3, Math.max(1, rating)) + silkDice;
  const roll = await new Roll(`${pool}d6`).evaluate();
  const faces = roll.dice[0]?.results?.map(r => r.result) ?? [];
  const successes = countSuccesses(faces);
  if (successes > 0) await addPending(target, { dice: successes, capped: true, label: `Assist from ${actor.name}`, source: "assist" }, { sourceActor: actor, ability: "assist" });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    rolls: [roll],
    content: `<div class="heisty-ability-card"><h4 class="hac-title">Assist → ${esc(target.name)}</h4><p>${esc(HEISTY.skills[skill]?.label ?? skill)}: ${pool}d6${silkDice ? ` (${silkDice} Silk)` : ""} — ${faces.join(", ")}</p><p><strong>${successes} Success${successes === 1 ? "" : "es"}</strong>: +${successes} ${successes === 1 ? "die" : "dice"} on ${esc(target.name)}'s next roll (with the +2 bonus limit).</p></div>`,
    flags: { [FLAG]: { ability: { key: "assist", actorId: actor.id, targetId: target.id, successes } } }
  });
  await markActed(actor);
  return { ok: true, successes };
}

/* -------------------------------------------- */
/*  Spend Silk menu, setup, Flaws               */
/* -------------------------------------------- */

/** The sheet's Spend Silk menu (§3.3). */
export async function spendSilkMenu(actor, key) {
  const entry = SILK_MENU.find(s => s.key === key);
  if (!entry || !actor?.isOwner) return { ok: false };
  if (key === "delay-flaw") return delayFlaw(actor);
  if (!(await spendSilk(actor, entry.cost, { reason: entry.label }))) return { ok: false, reason: "silk" };
  if (key === "silk-sled") {
    try { await gmRun(OPS.heistLoot, { action: "sled", actorId: actor.id, userId: game.user.id }); } catch (err) { /* card is the record */ }
  }
  await postNote(actor, `<p><strong>${entry.cost} SP</strong> — ${esc(entry.text)}</p>`, { title: esc(entry.label), flags: { ability: { key: `silk:${key}`, actorId: actor.id } } });
  if (entry.usesAction) await markActed(actor);
  return { ok: true };
}

/** Set Method Actor's NPC or The Long Con's identity. */
export async function setup(actor, key) {
  const def = getAbility(key);
  if (!def?.setup || !actor?.isOwner) return { ok: false };
  const label = def.setup === "methodActorTarget" ? "Which NPC have you studied?" : "Your false identity (specific and named)";
  const text = await askText(def.name, label, { value: actor.system.heist?.[def.setup] ?? "" });
  if (text === null) return { ok: false, reason: "cancelled" };
  await actor.update({ [`system.heist.${def.setup}`]: text });
  return { ok: true, text };
}

/** The once-per-heist Flaw the spider has (if any). */
function stFlaw(actor) {
  return actorOps.abilityItems(actor).find(e => e.def?.stTriggered) ?? null;
}

/**
 * Storyteller: fire a spider's Flaw. Delegates to the heist runtime when it's
 * loaded; otherwise stamps it, pays the Flaw Moment (+1 SP, setting autoFlaws)
 * and applies the simple effects.
 */
export async function fireFlaw(actor, key = null) {
  if (!game.user.isGM) return fail("Only the Storyteller fires Flaws.");
  const entry = key ? actorOps.abilityItems(actor).find(e => e.key === key) : stFlaw(actor);
  if (!entry?.def) return fail(`${actor?.name ?? "That spider"} has no Flaw to fire.`);
  const heist = api().heist;
  if (typeof heist?.fireFlaw === "function") return heist.fireFlaw(actor, entry.key);
  const c = clock();
  const st = usageStatus(entry.def, entry.item.system.usage, c);
  if (!st.available) return fail(`${entry.def.name}: ${statusLabel(entry.def, st)}.`);
  await markUsed(actor, entry.key, c);
  if (setting(SETTINGS.autoFlaws, true)) await earnSilk(actor, 1, { reason: "Flaw Moment" });
  let extra = "";
  if (entry.key === "dramatic") {
    const ok = await raiseAlert(actor, entry.def, `flaw:dramatic:${actor.id}:${c.heistId}`, 1, "Dramatic");
    extra = ok ? "<p>+1 Alert.</p>" : "<p>+1 Alert (Storyteller: apply it).</p>";
  } else if (entry.key === "show-off") {
    await addPending(actor, { dice: 0, diff: 0, label: "Show-Off armed: Difficulty 4 (or +1 if 4+)", source: "show-off" });
    extra = "<p>The next roll is armed: Difficulty 4, or +1 if it was already 4 or more.</p>";
  } else if (entry.key === "allergic-to-dust") {
    extra = "<p>Stealth, Difficulty 3, or the Alert rises by 1.</p>";
    await preboundRoll(actor, { skill: "stealth", difficulty: 3, ability: entry.key, free: true });
  } else if (entry.key === "butterfingers") {
    const r = 1 + Math.floor(Math.random() * 6);
    extra = `<p>It lands ${r <= 2 ? "on the square ahead" : r <= 4 ? "on the square to its left" : "on the square to its right"} (d6: ${r}) — lower, if that square is lower. Someone must spend an Action to recover it.</p>`;
  }
  await postNote(actor, `<p>${esc(entry.def.effect)}</p>${extra}<p class="dim">Flaw Moment: +1 SP.</p>`, { title: `Flaw — ${esc(entry.def.name)}`, flags: { ability: { key: entry.key, actorId: actor.id, flaw: true } } });
  return { ok: true };
}

/** Player: spend 1 SP to delay the Flaw one round (only Flaws that allow it). */
export async function delayFlaw(actor) {
  const entry = actorOps.abilityItems(actor).find(e => e.def?.delayCost);
  if (!entry) return fail("Your Flaw can't be delayed.");
  if (!(await spendSilk(actor, entry.def.delayCost, { reason: "Delaying your Flaw" }))) return { ok: false, reason: "silk" };
  const heist = api().heist;
  try {
    if (typeof heist?.delayFlaw === "function") await heist.delayFlaw(actor.id, entry.key);
  } catch (err) { console.warn("Heisty Spideys | delayFlaw:", err); }
  await postNote(actor, `<p>${esc(actor.name)} spends ${entry.def.delayCost} SP to delay <strong>${esc(entry.def.name)}</strong> one round. It still fires.</p>`, { title: "Flaw delayed", flags: { ability: { key: entry.key, actorId: actor.id, delayed: true } } });
  return { ok: true };
}

/* -------------------------------------------- */
/*  Registration                                */
/* -------------------------------------------- */

/** The public namespace (`game.heistySpideys.abilities`). */
export const abilityActions = {
  ABILITIES, use, assist, spendSilkMenu, setup, fireFlaw, delayFlaw, crewActors, npcList, messageResult
};

/** The Waiting Web namespace pieces WP-A owns (`game.heistySpideys.waitingWeb`). */
export const waitingWebApi = { promptReplacement, createReplacement, playerOwner };

let registered = false;
let opsRegistered = false;

/** Re-render open spider sheets (the clock moved: status chips change). */
function rerenderSpiderSheets() {
  for (const app of foundry.applications.instances?.values?.() ?? []) {
    if (app.rendered && app.document?.type === "spider" && app.options?.classes?.includes("spider")) app.render();
  }
}

/**
 * Init-time registration (WP-D calls this after `registerHeistAutomation()`):
 * the carry-lookup default, the GM ops, the ability-card listener, sheet
 * refreshes on heist changes, and the crab-camouflage clear on token moves.
 * @param {{gm?: object}} [opts]  WP-C's gm API, if not yet on game.heistySpideys.
 */
export function registerSpiderAutomation({ gm = null } = {}) {
  if (registered) return;
  registered = true;
  if (typeof SpiderData.carryLookup !== "function") SpiderData.carryLookup = () => null;
  const registerOps = g => {
    if (opsRegistered) return;
    registerSpiderOps(g);
    opsRegistered = !!g?.register;
  };
  registerOps(gm ?? api().gm);
  // If the gm API arrived later (built at the end of init), register then.
  Hooks.once("ready", () => registerOps(api().gm));

  Hooks.on("renderChatMessageHTML", onRenderAbilityCard);

  const refresh = foundry.utils.debounce ? foundry.utils.debounce(rerenderSpiderSheets, 100) : rerenderSpiderSheets;
  Hooks.on(HOOKS.heistChanged, refresh);

  // Prune round/scene bonuses when the round ends (each owner writes their own).
  Hooks.on(HOOKS.roundEnded, () => {
    for (const a of game.actors.filter(x => x.type === "spider" && x.isOwner && (x.system.heist?.pending?.length ?? 0))) {
      if (game.user.isGM && playerOwner(a)?.active) continue; // its player prunes it
      actorOps.prunePendingFor(a);
    }
  });

  // Wait, Was That There Before?: the camouflage ends when the token moves.
  // (WP-C's token handling may clear it too; writing false twice is harmless.)
  Hooks.on("updateToken", (tokenDoc, change) => {
    if (!("x" in (change ?? {}) || "y" in (change ?? {}))) return;
    const actor = tokenDoc.actor;
    if (!actor?.system?.heist?.camouflaged || !actor.isOwner) return;
    if (game.user.isGM && playerOwner(actor)?.active) return; // the player's client clears it
    actor.update({ "system.heist.camouflaged": false });
  });
}
