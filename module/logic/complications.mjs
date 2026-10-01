/**
 * HEISTY SPIDEYS — Mid-Heist Complications (pure; Ch 20 table, E14, N22)
 * ---------------------------------------------------------------------
 * Rolled when the crew STARTS a third round at one obstacle ("the world doesn't
 * wait"), or when the night needs a nudge. `complicationEffect` turns a d6 into
 * a list of actions the runtime applies (and Not Part of the Plan can negate).
 *
 * Action shapes:
 *   { type: "wakeCreature", creatureId, choices: [creatureId] }
 *   { type: "alert", delta, key: "complication", label }
 *   { type: "revealIntel", intelId, choices: [intelId] }
 *   { type: "effect", effect: { kind, value, skills, untilRoundSerial, untilSceneSerial, once, label } }
 *   { type: "forcedRoll", flaw: "fear-of-vacuums", actors: [actorId], attr: "nerve", difficulty: 3 }
 *   { type: "activateCreature", creatureId, pursuit: true }
 *   { type: "procedure", trigger: "complication3" }
 */

export const MID_HEIST = Object.freeze({
  1: { title: "The cat woke up.", text: "Not because of anything the crew did. Just because.", effect: "The nearest sleeping creature is active now. Nothing asleep? +1 Alert." },
  2: { title: "A drawer slid open on its own.", text: "Something's in it. Maybe the objective. Maybe not.", effect: "The ST gives the crew one detail they didn't case (never the unknown obstacle). Nothing left uncased? The next roll here gets +1 die." },
  3: { title: "A human got up for water.", text: "They're in the kitchen. Right now. Everyone freeze.", effect: "Stealth +1 Difficulty here, this round and next." },
  4: { title: "The vacuum switched on.", text: "Its cycle begins. Fear of Vacuums triggers.", effect: "Its roar covers you: Stealth −1 Difficulty this round." },
  5: { title: "A phone lit up on the counter.", text: "The room is briefly, brightly visible.", effect: "No cover this round." },
  6: { title: "Something fell off a shelf across the location.", text: "Not the crew's fault.", effect: "The Alert rises by 1 anyway. That's the effect." }
});

/** The crew starts round 3 at one obstacle: roll the complication. */
export function clockDue(round) {
  return Number(round) === 3;
}

/**
 * Turn a Mid-Heist Complication roll into actions.
 * @param {number} roll  1–6
 * @param {object} ctx
 * @param {{id, key, active:boolean, asleep?:boolean}[]} [ctx.creatures]  in the heist's list order (nearest first)
 * @param {{id, revealed:boolean, unknown?:boolean}[]} [ctx.intel]        in book order
 * @param {number} [ctx.roundSerial]
 * @param {number} [ctx.sceneSerial]
 * @param {string|null} [ctx.obstacleId]
 * @param {string[]} [ctx.fearOfVacuums]   actor ids with the Flaw
 * @returns {{roll:number, title:string, text:string, effect:string, actions:object[]}}
 */
export function complicationEffect(roll, ctx = {}) {
  const r = Math.min(6, Math.max(1, Math.round(Number(roll) || 1)));
  const row = MID_HEIST[r];
  const roundSerial = Number(ctx.roundSerial) || 0;
  const actions = [];
  switch (r) {
    case 1: {
      const asleep = (ctx.creatures ?? []).filter(c => !c.active && c.asleep !== false && c.wakeable !== false);
      if (asleep.length) actions.push({ type: "wakeCreature", creatureId: asleep[0].id, choices: asleep.map(c => c.id) });
      else actions.push({ type: "alert", delta: 1, key: "complication", label: "Mid-Heist Complication 1: nothing asleep" });
      break;
    }
    case 2: {
      const uncased = (ctx.intel ?? []).filter(i => !i.revealed && !i.unknown);
      if (uncased.length) actions.push({ type: "revealIntel", intelId: uncased[0].id, choices: uncased.map(i => i.id) });
      else actions.push({
        type: "effect",
        effect: { kind: "dice", value: 1, once: true, obstacleId: ctx.obstacleId ?? null, untilSceneSerial: ctx.sceneSerial ?? null, label: "Complication 2: +1 die on the next roll here", source: "complication" }
      });
      break;
    }
    case 3:
      actions.push({ type: "effect", effect: { kind: "diff", value: 1, skills: ["stealth"], untilRoundSerial: roundSerial + 1, label: "Complication 3: Stealth +1 (this round and next)", source: "complication" } });
      actions.push({ type: "procedure", trigger: "complication3" });
      break;
    case 4: {
      actions.push({ type: "effect", effect: { kind: "diff", value: -1, skills: ["stealth"], untilRoundSerial: roundSerial, label: "Complication 4: the vacuum's roar — Stealth −1 this round", source: "complication" } });
      const vac = (ctx.creatures ?? []).find(c => c.key === "vacuum");
      if (vac) actions.push({ type: "activateCreature", creatureId: vac.id, pursuit: true });
      if ((ctx.fearOfVacuums ?? []).length) actions.push({ type: "forcedRoll", flaw: "fear-of-vacuums", actors: [...ctx.fearOfVacuums], attr: "nerve", difficulty: 3 });
      break;
    }
    case 5:
      actions.push({ type: "effect", effect: { kind: "noCover", value: 1, untilRoundSerial: roundSerial, label: "Complication 5: no cover this round", source: "complication" } });
      break;
    case 6:
      actions.push({ type: "alert", delta: 1, key: "complication", label: "Mid-Heist Complication 6: something fell off a shelf" });
      break;
  }
  return { roll: r, ...row, actions };
}
