/**
 * HEISTY SPIDEYS — Monte Carlo rules engine.
 *
 * Plays one heist for a crew of five strictly by the book (v4.5): Planning
 * (Casing, Preparation), the heist obstacles, the Escape, the Debrief. Every
 * Storyteller judgement is a parameter (sim/params.mjs); everything the rules
 * do not define, or that looks broken, is logged through the Recorder's issue
 * detectors (sim/recorder.mjs).
 *
 * Abstraction: an obstacle is played in rounds (Ch 3 Turn Order: crew acts,
 * then the threats). In a round every spider present gets one Action — roll
 * for the obstacle, Assist, or use an ability. Creatures add their per-round
 * Alert in the threat phase. Movement and grid distances are not simulated;
 * adjacency is assumed wherever the fiction plausibly allows it.
 */

import { HEISTY } from "../module/config.mjs";
import { countSuccesses, classifyResult, classifyBotch, alertForResult, getAlertState } from "./rules-v45.mjs";
import { SKILL_ATTR } from "./character.mjs";
import { CREATURES, makeEscape, applyHeistTweaks } from "./heists.mjs";

/* ------------------------------------------------------------ constants -- */

const VIT_KEYS = HEISTY.vitalityOrder;                               // unharmed … out
const VIT_PEN = VIT_KEYS.map(k => -HEISTY.vitality[k].penalty);       // 0 1 2 3 0
const OUT = 4, CRITICAL = 3, HURT = 2, RATTLED = 1;
const RANK = { botch: 0, cleanfail: 1, failure: 1, partial: 2, success: 3, critical: 4 };
const PHYSICAL = new Set(["athletics", "brawl"]);
const ONCE_PER_HEIST_FLAWS = new Set(["overconfident", "dramatic", "allergic-to-dust", "compulsive-planner", "butterfingers", "easily-distracted", "show-off"]);
const AP = HEISTY.advancement.awards;

/* --------------------------------------------------------- probability -- */

/** Binomial tables per success face (4 → p = 1/2, 5 → p = 1/3). */
const PMFS = {};
function pmfTable(face) {
  if (PMFS[face]) return PMFS[face];
  const q = (7 - face) / 6;
  const t = [];
  for (let n = 0; n <= 60; n++) {
    const row = new Array(n + 1).fill(0);
    let c = 1;
    for (let k = 0; k <= n; k++) {
      row[k] = c * q ** k * (1 - q) ** (n - k);
      c = (c * (n - k)) / (k + 1);
    }
    t.push(row);
  }
  return (PMFS[face] = t);
}
const pmf = (n, face = 4) => pmfTable(face)[Math.max(0, Math.min(60, n))];

/** Successes a Critical needs at Difficulty d. */
export const critAt = (d, rule = "double") => (rule === "plus3" ? d + 3 : rule === "plus2" ? d + 2 : 2 * d);

/** Outcome distribution of an n-dice pool against Difficulty d. */
/** Fewest Successes that still count as a Partial at Difficulty d. */
export const partialAt = (d, rule = "one") => (rule === "half" ? Math.max(1, Math.ceil(d / 2)) : 1);

export function outcomeDist(n, d, face = 4, critRule = "double", partialRule = "one") {
  if (n <= 0) return { botch: 0.5, clean: 0.5, fail: 0, partial: 0, success: 0, crit: 0 };
  d = Math.max(1, d);
  const p = pmf(n, face);
  const c = critAt(d, critRule), pm = partialAt(d, partialRule);
  const o = { botch: 0, clean: 0, fail: 0, partial: 0, success: 0, crit: 0 };
  for (let k = 0; k <= n; k++) {
    if (k < pm) o.fail += p[k];
    else if (k >= c) o.crit += p[k];
    else if (k >= d) o.success += p[k];
    else o.partial += p[k];
  }
  return o;
}

/** P(spider with n dice beats a creature with m dice); ties to the world. */
export function opposedWin(n, m, face = 4) {
  if (n <= 0) return 0;
  const a = pmf(n, face), b = pmf(m, face);
  let cdf = 0, win = 0;
  for (let k = 0; k <= n; k++) {
    // P(creature < k)
    if (k > 0) cdf += b[k - 1] ?? 0;
    win += a[k] * cdf;
  }
  return win;
}

/* ================================================================ run ==== */

export class HeistRun {
  /**
   * @param heist      a HEISTS entry
   * @param templates  five spiders from character.mjs
   * @param P          params (defaultParams())
   * @param rng        Rng
   * @param rec        Recorder
   */
  constructor(heist, templates, P, rng, rec) {
    if (P.heistTweaks?.length) heist = applyHeistTweaks(heist, P.heistTweaks);
    this.h = heist;
    this.P = P;
    this.rng = rng;
    this.rec = rec;
    this.limit = Math.max(1, heist.limit + (P.limitShift ?? 0));
    this.alert = 0;
    this.alertGained = 0;
    this.creatureAlert = 0;
    this.creatureAlertAtFull = null;
    this.face = P.successFace ?? 4;
    const shift = P.obstacleDiffShift ?? 0;
    const sh = o => (shift ? { ...o, approaches: o.approaches.map(a => ({ ...a, diff: a.diff + shift })) } : o);
    this.seq = [
      ...heist.obstacles.map(o => sh({ ...o, phase: "heist" })),
      ...makeEscape(heist, P.escapeCount, P.escapeDiffShift).map(sh)
    ];
    this.objIdx = this.seq.findIndex(o => o.objective);
    this.objectiveTaken = false;
    this.objectiveLost = false;
    this.lootHolder = null;
    this.lootDropped = false;
    this.lootLost = false;
    this.fullAlert = false;
    this.fullAlertAt = null;
    this.loss = false;
    this.escaped = 0;
    this.outs = 0;
    this.known = new Set();
    this.preLines = new Set();
    this.dcUsed = false;
    this.crewNptpUsed = false;
    this.planFell = false;
    this.spitUses = 0;
    this.persuadeRerolls = 0;
    this.creatureIds = [...(heist.creatures ?? [])];
    if (P.exterminator && heist.limit > 7) this.creatureIds.push("the-exterminator");
    this.cs = Object.fromEntries(this.creatureIds.map(id => [id, {
      forced: false, textAwake: false, suppressed: 0, bad: false, shrieked: false,
      spawned: !CREATURES[id].optional
    }]));
    this.trace = P.trace ? [] : null;
    this.slots = templates.map((tpl, i) => {
      const slot = { i, tpl, heistUsed: new Set(), pending: null, flawAt: 0, flawFired: false, flawSilk: 0, spiders: [] };
      slot.cur = this.makeSpider(slot, false);
      slot.cur.arrived = true;
      return slot;
    });
  }

  /* -------------------------------------------------------- spiders -- */

  makeSpider(slot, replacement) {
    const t = slot.tpl;
    const max = this.P.silkStart === "base+1" ? t.base.wit + t.base.nerve + 1 : t.silkMax;
    const silk = replacement ? Math.floor(max / 2) : max;
    const sp = {
      slot, tpl: t, name: t.name + (replacement ? ` II` : ""), role: t.role, species: t.species, flaw: t.flaw,
      perks: new Set(t.perks), attrs: t.attrs, skills: t.skills,
      vit: replacement ? RATTLED : 0, silk, silkStart: silk,
      out: false, escaped: false, arrived: false, isReplacement: replacement, everActed: false,
      setback: 0, bonusNext: 0, intelUsed: new Set(), sceneUsed: new Set(), heistUsed: new Set(),
      recovered: false, acted: false, frozen: false, passed: false, carrying: false,
      consecFail: 0, rollsHere: 0, contFlawSilk: 0
    };
    slot.spiders.push(sp);
    return sp;
  }

  /** Successes on these faces (package param successFace; the book: 4–6). */
  succ(faces) {
    if (this.face === 4) return countSuccesses(faces);
    let n = 0;
    for (const f of faces) if (f >= this.face) n++;
    return n;
  }

  /** Result of a normal roll (package param critRule; the book: Critical at 2× Difficulty). */
  classify(s, d) {
    if ((this.P.critRule ?? "double") === "double" && this.P.partialRule !== "half") return classifyResult(s, d);
    d = Math.max(1, d);
    if (s < partialAt(d, this.P.partialRule)) return "failure";
    if (s >= critAt(d, this.P.critRule)) return "critical";
    return s >= d ? "success" : "partial";
  }

  /** Full Alert under the clarified rule: permanent, capped at the Limit, Lockdown penalties. */
  get lockedFull() {
    return this.P.fullAlertRule === "locked" && (this.fullAlert || this.alert >= this.limit);
  }

  /** The Alert creatures' Escalations read: Full Alert counts as 7+ under the clarified rule. */
  get escAlert() {
    return this.lockedFull ? Math.max(this.alert, 7) : this.alert;
  }

  log(msg) {
    if (this.trace) this.trace.push(`${this.obs ? this.obs.id + (this.round ? " r" + this.round : "") : "PLAN"} [A${this.alert}] ${msg}`);
  }

  present() {
    const out = [];
    for (const s of this.slots) {
      const sp = s.cur;
      if (sp.arrived && !sp.out && !sp.escaped) out.push(sp);
    }
    return out;
  }

  usedHeist(sp, key) {
    return (this.P.replacementResets ? sp.heistUsed : sp.slot.heistUsed).has(key);
  }
  markHeist(sp, key) {
    (this.P.replacementResets ? sp.heistUsed : sp.slot.heistUsed).add(key);
  }
  usedScene(sp, key) { return sp.sceneUsed.has(key); }
  markScene(sp, key) { sp.sceneUsed.add(key); }

  pen(sp) {
    if (sp.vit === RATTLED && sp.perks.has("unfazed")) {
      this.rec.use("perk:unfazed", true);
      return 0;
    }
    return VIT_PEN[sp.vit] ?? 0;
  }

  spend(sp, type, n) {
    sp.silk -= n;
    sp.silkSpent = (sp.silkSpent ?? 0) + n;
    this.rec.spend(type, n);
  }
  earn(sp, type, n) {
    sp.silk += n;
    this.rec.earn(type, n);
  }

  where(sp) {
    const v = VIT_KEYS[sp.vit];
    return `${this.h.id} ${this.obs?.id ?? "plan"} r${this.round ?? 0}, Alert ${this.alert}/${this.limit}: ${sp.name} (${sp.species} ${sp.role}${v !== "unharmed" ? ", " + v : ""})`;
  }

  /* ---------------------------------------------------------- alert -- */

  /** Alert band modifiers (config.mjs), with the Active-band Stealth reading as a parameter. */
  band() {
    if (this.lockedFull) return { key: "fullalert", stealth: 2, all: 1 };
    const st = getAlertState(this.alert, this.limit);
    if (this.alert >= 5 && this.alert <= 6 && !this.P.activeBandStealth) return { ...st, stealth: 0 };
    return st;
  }

  get pressure() { return this.alert / this.limit; }

  /** Would +n push the location to Full Alert while the objective is still in play? */
  critical(n) {
    return this.obs?.phase !== "escape" && !this.objectiveTaken && !this.objectiveLost && this.alert + n >= this.limit;
  }

  addAlert(n, cause, o = {}) {
    if (n <= 0) return 0;
    const P = this.P, rec = this.rec;
    // Clarified Full Alert: the Alert stops at the Limit.
    if (P.fullAlertRule === "locked" && this.alert >= this.limit) { rec.inc("alertCapped", n); return 0; }
    // Plausible Deniability — once per scene, a single +1 from something the crew did. Free: always used.
    if (n === 1 && o.crewAction) {
      const perHeist = this.P.pdLimit === "heist";
      const pd = this.present().find(sp => sp.perks.has("plausible-deniability") && !(perHeist ? this.usedHeist(sp, "pd") : this.usedScene(sp, "pd")));
      if (pd) {
        if (perHeist) this.markHeist(pd, "pd"); else this.markScene(pd, "pd");
        rec.use("perk:plausible-deniability", true);
        if (cause === "scene") rec.issue("MAKE_A_SCENE_FREE", this.where(pd));
        return 0;
      }
    }
    // Damage Control — the crew pools 3 SP to cut a spike of +2 or more by 1. Once per heist.
    if (n >= 2 && !this.dcUsed && P.silkPolicy !== "never") {
      const worth = this.critical(n) || P.silkPolicy === "spendy" || (P.silkPolicy === "greedy" && this.alert + n >= this.limit - 1 && this.obs?.phase !== "escape");
      const crew = this.present().sort((a, b) => b.silk - a.silk);
      const total = crew.reduce((a, s) => a + Math.max(0, s.silk), 0);
      if (worth && total >= 3) {
        let need = 3;
        for (const s of crew) {
          const take = Math.min(need, Math.max(0, s.silk));
          if (take > 0) { this.spend(s, "damageControl", take); need -= take; }
          if (!need) break;
        }
        this.dcUsed = true;
        n -= 1;
        rec.use("silk:damageControl", true);
      }
    }
    if (P.fullAlertRule === "locked" && this.alert + n > this.limit) { rec.inc("alertCapped", this.alert + n - this.limit); n = this.limit - this.alert; }
    if (this.fullAlert) rec.issue("ALERT_PAST_LIMIT", `${this.h.id} ${this.obs?.id}: +${n} (${cause}) at Alert ${this.alert} ≥ Limit ${this.limit}`);
    this.alert += n;
    this.alertGained += n;
    this.log(`Alert +${n} (${cause}) → ${this.alert}`);
    rec.alert(cause, n);
    if (cause === "creature") this.creatureAlert += n;
    this.triggers();
    return n;
  }

  /** Critical Success: the only thing that lowers the Alert (Difficulty 2+). */
  critDrop(d, sp, baseD) {
    if (alertForResult("critical", d) === 0) { this.rec.issue("CRIT_D1_NO_ALERT", this.where(sp)); return; }
    if (d < (this.P.critAlertMinDiff ?? 2)) { this.rec.inc("critDropBlockedByMinD"); return; }
    if (this.lockedFull) { this.rec.inc("critDropBlockedByFullAlert"); return; }
    if (this.P.critAlertRule === "baseD3") {
      if (baseD < 3 || this.fullAlert || this.obs.critDropped) { this.rec.inc("critDropBlockedByFix"); return; }
      this.obs.critDropped = true;
    }
    if (this.alert <= 0) { this.rec.issue("CRIT_AT_ZERO_ALERT", this.where(sp)); return; }
    this.alert -= 1;
    this.rec.alert("critical", -1);
    this.log(`Critical: Alert −1 → ${this.alert}`);
  }

  triggers() {
    if (this._inTriggers) return;
    this._inTriggers = true;
    // Parrot: Alert 7, shrieks — the Alert rises by 2 once.
    const parrot = this.cs["alert-parrot"];
    if (parrot && !parrot.shrieked && this.alert >= CREATURES["alert-parrot"].shriekAt && this.parrotCanShriek()) {
      parrot.shrieked = true;
      const before = this.alert;
      this.addAlert(CREATURES["alert-parrot"].shriek, "shriek", { spike: true });
      this.rec.use("creature:parrot-shriek");
      if (before < this.limit && this.alert >= this.limit) this.rec.issue("PARROT_SHRIEK", `${this.h.id} ${this.obs?.id}: Alert ${before} → ${this.alert} (Limit ${this.limit})`);
    }
    // P5 Guard Spider: an aware guard calls for backup at Alert 7 (or Full Alert): +2 once.
    const gd = this.cs["guard-spider"];
    if (this.P.guardRules === "full" && gd && !gd.backup && this.escAlert >= 7 && this.active("guard-spider")) {
      gd.backup = true;
      this.rec.inc("guardBackup");
      this.addAlert(2, "backup", { spike: true });
    }
    // Exterminator: only at Lockdown, only if the ST calls him.
    const ex = this.cs["the-exterminator"];
    if (ex && !ex.spawned && this.alert >= 7) { ex.spawned = true; ex.forced = true; this.rec.use("creature:exterminator"); }
    this._inTriggers = false;
  }

  /* ------------------------------------------------------- creatures -- */

  /** P6: the parrot shrieks only at a spider it can see, and never under its cover. */
  parrotCanShriek() {
    const st = this.cs["alert-parrot"];
    if (st.shut && this.P.weaknessRule === "backoff") return false;   // under its cover
    if (!this.P.parrotSight) return true;
    return !!this.obs && (this.obs.threats?.includes("alert-parrot") || !!this.seenBy?.has("alert-parrot"));
  }

  active(id) {
    const c = CREATURES[id], st = this.cs[id];
    if (!st.spawned) return false;
    if (st.paid || (st.driven && !this.lockedFull)) return false;
    if (st.forced || st.textAwake) return true;
    const thr = this.P.creatureWake === "hunt" ? c.hunt : c.wake;
    if (this.escAlert >= thr) {
      if (this.P.creatureStaysActive) st.forced = true;
      return true;
    }
    return false;
  }

  isHere(id) {
    const c = CREATURES[id], st = this.cs[id];
    if (this.obs.threats?.includes(id)) return true;
    if (st.beaten && this.P.guardBeaten === "post") return !!this.h.guardPost?.includes(this.obs.id);   // P6: the backup holds the post
    if (st.shut && this.P.weaknessRule === "backoff") return false;   // P6: shut in, it can't follow anyone
    if (this.P.parrotSight && this.h.earshot?.[id]?.includes(this.obs.id)) return true;   // P6: the parrot hears the whole shop floor
    if (this.P.creatureScope === "location") return true;
    if (this.P.creatureScope === "obstacle") return false;
    switch (c.mobile) {
      case "always": return true;
      case "hunting": return this.escAlert >= c.hunt;
      case "aware": return st.forced;
      default: return false;
    }
  }

  activeHere(id) {
    return this.active(id) && this.isHere(id) && this.cs[id].suppressed <= 0;
  }

  activeThreatsHere() {
    return this.creatureIds.filter(id => this.activeHere(id));
  }

  hasNPCs() {
    return this.obs.threats?.length > 0 || this.obs.tags.includes("human") || this.activeThreatsHere().length > 0;
  }

  suppress(ids, rounds, who) {
    for (const id of ids) this.cs[id].suppressed = Math.max(this.cs[id].suppressed, rounds);
    if (ids.length) this.rec.use(who, true);
  }

  attacker() {
    let best = null;
    for (const id of this.creatureIds) {
      const c = CREATURES[id], st = this.cs[id];
      if (!c.attack || !this.activeHere(id)) continue;
      if (c.attackOnlyHunting && this.escAlert < c.hunt) continue;
      if (c.attackOnlyBad && !st.bad) continue;
      if (st.shut && this.P.weaknessRule === "backoff") continue;   // P6: shut in, it can't strike
      const engaged = this.obs.threats?.includes(id) || this.escAlert >= c.hunt || (this.obs.phase === "escape" && this.fullAlert);
      if (!engaged) continue;
      if (!best || c.attack.pool > best.pool) best = { id, pool: c.attack.pool, label: `${c.name} ${c.attack.label}` };
    }
    if (!best && this.obs.tags.includes("human") && this.P.humanAttackPool > 0) best = { id: "human", pool: this.P.humanAttackPool, label: "human" };
    if (!best && this.obs.phase === "escape" && this.fullAlert && this.P.fullAlertPursuit > 0) best = { id: "pursuit", pool: this.P.fullAlertPursuit, label: "Full Alert pursuit" };
    return best;
  }

  /** A Failure near an active threat: it lands a hit (Ch 10). */
  threatAttack(sp) {
    const atk = this.attacker();
    if (!atk) {
      if (this.obs.phase === "escape" && this.fullAlert) this.rec.issue("ESCAPE_FAILURE_FREE", this.where(sp));
      return;
    }
    let target = sp;
    if (this.sceneBruiser && !this.sceneBruiser.out) target = this.sceneBruiser; // Make a Scene: every NPC is on the Bruiser
    this.resolveHit(target, atk);
  }

  resolveHit(target, atk) {
    const rng = this.rng, rec = this.rec;
    // Take the Hit (Bruiser): redirect a physical consequence meant for an adjacent crewmate. Once per scene.
    const tth = this.present().find(b => b !== target && b.perks.has("take-the-hit") && !this.usedScene(b, "tth") && b.vit <= RATTLED
      && (target.vit >= HURT || (b.attrs.body + b.skills.endurance) > (target.attrs.body + target.skills.endurance)));
    if (tth) { this.markScene(tth, "tth"); rec.use("perk:take-the-hit", true); target = tth; }

    const aS = this.succ(rng.dice(atk.pool));
    const dPool = target.attrs.body + (target.skills.endurance ?? 0) - this.pen(target);
    let dS = 0;
    if (dPool <= 0) rec.issue("DEFENSE_POOL_ZERO", `${this.where(target)} defends vs ${atk.label} with pool ${dPool}`);
    else dS = this.succ(rng.dice(dPool));
    let margin = aS - dS;
    const lands = m => m > 0 || (m === 0 && this.P.hitTies === "attacker");
    // P5: a shrug-off is a physical-confrontation roll — Run It Again rerolls the dice that didn't succeed.
    if (this.P.wolfShrug && lands(margin) && dPool > dS && target.species === "wolf" && !this.usedScene(target, "wolf")) {
      this.markScene(target, "wolf");
      dS += this.succ(rng.dice(dPool - dS));
      margin = aS - dS;
      rec.use("species:wolf", !lands(margin));
    }
    this.log(`${atk.label} (${atk.pool} dice: ${aS}) hits ${target.name} (defence ${dPool}: ${dS})`);
    rec.inc("hits");
    if (margin < 0 || (margin === 0 && this.P.hitTies !== "attacker")) { rec.inc("hitsShrugged"); return; }
    let drop = margin <= 2 ? 1 : 2;   // a tie that goes to the attacker (hitTies) drops one level
    rec.inc(drop === 1 ? "hitsDrop1" : "hitsDrop2");
    if (atk.id === "the-exterminator" && this.obs.tags.includes("movement")) {
      rec.issue("EXTERMINATOR_OUT", this.where(target));
      drop = OUT;
    }
    let nv = Math.min(OUT, target.vit + drop);
    // That All You Got? — a hit that would drop you to Critical: BODY + Endurance (D3) → stop at Hurt.
    if (nv === CRITICAL && target.perks.has("that-all-you-got")) {
      const pool = target.attrs.body + target.skills.endurance - this.pen(target);
      const s = pool > 0 ? this.succ(rng.dice(pool)) : 0;
      const ok = s >= (this.P.passChecks === "partial" ? partialAt(3, this.P.partialRule) : 3);
      rec.use("perk:that-all-you-got", ok);
      if (ok) nv = HURT;
    }
    target.vit = nv;
    if (nv >= OUT) this.goOut(target, atk.label);
  }

  /* ------------------------------------------------------------- out -- */

  goOut(sp, cause) {
    const rec = this.rec;
    sp.out = true;
    sp.vit = OUT;
    this.outs++;
    this.log(`${sp.name} is OUT (${cause})`);
    rec.inc("outs");
    rec.inc(`outBy:${cause}`);
    const last = this.idx >= this.seq.length - 1;
    if (last) { rec.issue("REPLACEMENT_NEVER_ARRIVES", this.where(sp) + ` — Out (${cause}) in the final obstacle`); rec.inc("outsLastObstacle"); this.lastOuts = (this.lastOuts ?? 0) + 1; }
    else {
      sp.slot.pending = this.makeSpider(sp.slot, true);
      rec.inc("replacements");
    }
    if (this.lootHolder === sp) {
      rec.issue("LOOT_CARRIER_OUT", this.where(sp) + ` — carrying the loot (${cause})`);
      this.lootHolder = null;
      if (this.P.lootOnOut === "lost") { this.lootLost = true; rec.issue("LOOT_LOST", this.where(sp)); }
      else this.lootDropped = true;
    }
    this.addAlert(2, "out", { spike: true });
    this.planFellApart();
    if (this.present().length === 0 && this.escaped === 0) this.loss = true;
  }

  /** Actually, I Planned This — once per heist, after a plan visibly falls apart. */
  planFellApart() {
    if (this.planFell) return;
    this.planFell = true;
    const face = this.present().find(sp => sp.perks.has("actually-i-planned-this") && !this.usedHeist(sp, "aipt"));
    if (!face) return;
    this.markHeist(face, "aipt");
    for (const sp of this.present()) sp.bonusNext += 1;
    this.rec.use("perk:actually-i-planned-this", true);
  }

  /* -------------------------------------------------------- dice pools -- */

  basePool(sp, skill, calledSkill = null) {
    const attr = calledSkill && this.P.improviseAttr === "called" ? SKILL_ATTR[calledSkill] : SKILL_ATTR[skill];
    return sp.attrs[attr] + (sp.skills[skill] ?? 0) - this.pen(sp);
  }

  /** Final Difficulty. Returns { d, raw, flawMod }. */
  difficulty(sp, ch, showOff = false) {
    const obs = this.obs;
    let d = ch.jury ? 2 : (ch.rolledD ?? ch.appr.diff);
    if (ch.bypass) d -= 1;
    if (this.P.preLineRule === "minus1" && this.preLines.has(obs.id)) d -= 1;
    else if (this.sceneLines?.has(obs.id) && ch.skill === "acrobatics") d -= 1;   // P6: a line spun in the scene
    if (showOff) {
      if (this.P.showOffRule === "plus1" && d >= 4) d += 1;
      else {
        if (d > 4) this.rec.issue("SHOWOFF_EASIER", this.where(sp) + ` — D${d} → D4`);
        d = 4;
      }
    }
    const skill = ch.skill;
    const st = this.band();
    d += skill === "stealth" ? st.stealth + this.stallStealth() : st.all;   // band.stealth is the Stealth total (as module/helpers/dice.mjs uses it)
    if (skill === "acrobatics" && obs.tags.includes("height") && !ch.noHeight) {
      if (sp.perks.has("dont-look-down")) this.rec.use("perk:dont-look-down", true);
      else d += 1;
    }
    let flawMod = 0;
    if (skill === "stealth" && sp.flaw === "loud" && this.alert >= 5) flawMod += 1;
    if (skill === "stealth" && sp.flaw === "arachnophobe-magnet" && obs.tags.includes("human")) flawMod += 1;
    d += flawMod;
    if (ch.improvise) d += 1;
    if (skill === "stealth" && sp.perks.has("soundless") && obs.tags.includes("movement")) { d -= 1; this.rec.use("perk:soundless"); }
    if (obs.phase === "escape") {
      if (this.escapeRoutes && !this.escapeRoutes.out) { d -= 1; this.rec.use("perk:escape-routes"); }
      if (this.iKnowAWay) { d -= 1; this.rec.use("sig:wheelman"); }
    }
    const raw = d;
    if (d <= 0) { this.rec.issue("DIFFICULTY_ZERO", this.where(sp) + ` ${skill} D${d}`); d = 1; }
    return { d, raw, flawMod };
  }

  /** Estimated dice on top of the base pool that the spider will certainly get. */
  knownBonus(sp, ch) {
    const obs = this.obs;
    let b = -sp.setback + sp.bonusNext;
    if (obs.known && (this.P.intelValue === "allRolls" || (this.P.intelValue === "firstRoll" && !sp.intelUsed.has(obs.id)))) b += 1;
    if (this.decoyRounds > 0) b += 1;
    if (this.sceneBruiser && this.sceneBruiser !== sp) b += 2;
    if (this.drafting && ch.mode === "individual" && obs.tags.includes("movement") && this.drafting !== sp) b += 1;
    if ((ch.skill === "deception" || ch.skill === "disguise")) {
      if (sp.methodActorObs === obs.id) b += 2;
      if (sp.perks.has("the-long-con")) b += 1;
    }
    if (ch.skill === "persuasion" && sp.role === "face" && this.present().some(b2 => b2.perks.has("negotiating-position"))) b += 1;
    return b;
  }

  opposedPool(kind) {
    if (kind === "rival") return 5;
    const id = this.obs.threats?.[0];
    const c = CREATURES[id];
    if (!c) return 3;
    if (kind === "perception") return c.perception;
    if (kind === "brawl") return c.attack?.pool ?? 3;
    if (kind === "haggle") return 4;
    return 3;
  }

  /** Decision value of rolling n dice at Difficulty d (or opposed vs m dice). */
  value(n, d, m = null) {
    if (m != null) {
      if (n <= 0) return -0.75;
      const w = opposedWin(n, m, this.face);
      return w - (1 - w) * 0.5;
    }
    const o = outcomeDist(n, d, this.face, this.P.critRule, this.P.partialRule);
    const pv = this.P.partialCost === "alert" ? 0.55 : this.P.partialCost === "setback" ? 0.8 : 1;
    return o.crit * (1 + (d >= 2 ? 0.3 : 0)) + o.success + o.partial * pv - o.fail * 0.5 - o.botch * 1 - o.clean * (this.P.cleanFailAlert ? 0.5 : 0.3);
  }

  pPass(n, d, m = null) {
    if (n <= 0) return 0;
    if (m != null) return opposedWin(n, m, this.face);
    const pm = partialAt(Math.max(1, Math.round(d)), this.P.partialRule), row = pmf(n, this.face);
    let f = 0;
    for (let k = 0; k < pm && k <= n; k++) f += row[k];
    return 1 - f;
  }

  /** Evaluate one spider on one approach (optionally Improvised). */
  evalChoice(sp, appr, skill, improvise) {
    const P = this.P, obs = this.obs;
    const ch = { appr, skill, mode: appr.mode, improvise, calledSkill: improvise ? appr.skill : null };
    const mech = obs.tags.includes("smallMech") || obs.tags.includes("lock") || obs.tags.includes("sensor");
    // Jury-Rig: Engineering at D2 on a small mechanical device / lock / sensor. Once per scene.
    if (!improvise && skill === "engineering" && sp.perks.has("jury-rig") && !this.usedScene(sp, "jury")
      && mech && appr.diff > 2) ch.jury = true;
    // Clarified Bypass: the Tinkerer's gadget is an Engineering roll at −1 Difficulty.
    if (P.bypassRule === "roll" && !ch.jury && !improvise && skill === "engineering" && sp.role === "tinkerer" && !this.usedScene(sp, "thing")
      && mech && (!obs.tags.includes("complexLock") || P.bypassComplexLocks)) ch.bypass = true;
    const st = this.band();
    let mod = (skill === "stealth" ? st.stealth + this.stallStealth() : st.all) + (improvise ? 1 : 0) - (ch.bypass ? 1 : 0);
    if (P.preLineRule === "minus1" && this.preLines.has(obs.id)) mod -= 1;
    else if (this.sceneLines?.has(obs.id) && skill === "acrobatics") mod -= 1;
    if (skill === "acrobatics" && obs.tags.includes("height") && !sp.perks.has("dont-look-down")) mod += 1;
    if (skill === "stealth" && sp.flaw === "loud" && this.alert >= 5) mod += 1;
    if (skill === "stealth" && sp.flaw === "arachnophobe-magnet" && obs.tags.includes("human")) mod += 1;
    if (skill === "stealth" && sp.perks.has("soundless") && obs.tags.includes("movement")) mod -= 1;
    if (obs.phase === "escape") mod -= (this.escapeRoutes && !this.escapeRoutes.out ? 1 : 0) + (this.iKnowAWay ? 1 : 0);
    const n = this.basePool(sp, skill, ch.calledSkill) + this.knownBonus(sp, ch);
    if (P.creatureRolls === "rolled" && appr.opposed && !ch.jury) {
      // Expected value over the creature's roll: Difficulty = its Successes + 1 (+ the location shift).
      const m = this.opposedPool(appr.opposed), pk = pmf(m, this.face);
      let v = 0, dd = 0;
      for (let k = 0; k <= m; k++) {
        const d = Math.max(1, k + 1 + (P.obstacleDiffShift ?? 0) + mod);
        v += pk[k] * this.value(n, d);
        dd += pk[k] * d;
      }
      ch.est = { n, d: dd, m: null, v, p: this.pPass(n, dd) };
      return ch;
    }
    const d = Math.max(1, (ch.jury ? 2 : appr.diff) + mod);
    const m = P.creatureRolls === "opposed" && appr.opposed ? this.opposedPool(appr.opposed) : null;
    ch.est = { n, d, m, v: this.value(n, d, m), p: this.pPass(n, d, m) };
    return ch;
  }

  approaches(mode) {
    return this.obs.approaches.map(a => (this.P.groupRolls === "leader" && a.mode === "individual") ? { ...a, mode: "single" } : a)
      .filter(a => a.mode === mode);
  }

  /** Best choice for a spider among approaches of a mode, Improvise included. */
  bestFor(sp, mode) {
    let best = null;
    for (const a of this.approaches(mode)) {
      if (a.excludeRoles?.includes(sp.role)) continue;
      const ch = this.evalChoice(sp, a, a.skill, false);
      if (!best || ch.est.v > best.est.v) best = ch;
    }
    if (!best) return null;
    // Improvise: 2 SP, swap in a plausible Skill at +1 Difficulty.
    if (this.P.silkPolicy !== "hoard" && sp.silk >= 2 && this.obs.improvise?.length) {
      for (const a of this.approaches(mode).slice(0, 1)) {
        for (const skill of this.obs.improvise) {
          const ch = this.evalChoice(sp, a, skill, true);
          ch.est.v -= 0.2;   // the 2 SP it costs
          if (ch.est.v > best.est.v) best = ch;
        }
      }
    }
    return best;
  }

  /* ------------------------------------------------------------- roll -- */

  pickHelper(sp, ch) {
    const cands = this.helpers.filter(h => h !== sp && !h.acted && !h.frozen && !h.out);
    if (!cands.length) return null;
    const skills = new Set([ch.skill, ...this.obs.approaches.map(a => a.skill)]);
    let best = null, bestDice = -1;
    for (const h of cands) {
      let s = 0;
      for (const k of skills) s = Math.max(s, h.skills[k] ?? 0);
      const dice = Math.max(1, Math.min(3, s - this.pen(h)));
      if (dice > bestDice) { best = h; bestDice = dice; }
    }
    return best;
  }

  /** How many Silk Points to spend on extra dice before a roll. */
  silkDice(sp, n, d, m, ch, important, maxDice = Infinity) {
    const avail = sp.silk;
    const P = this.P;
    if (P.silkPolicy === "hoard") return { k: 0, dice: 0 };
    const overclock = ch.skill === "engineering" && sp.perks.has("overclock");
    let theta;
    if (P.silkPolicy === "spendy") theta = 0.04;
    else if (important) theta = 0.1;
    else if (this.pressure >= 0.5) theta = 0.14;
    else theta = 0.3;
    const reserve = P.silkPolicy === "greedy" && !important && this.pressure < 0.6 ? Math.min(3, avail) : 0;
    const budget = Math.max(0, Math.min(3, avail - reserve));
    const base = this.value(n, d, m);
    let best = { k: 0, dice: 0, gain: 0 };
    for (let k = 1; k <= budget; k++) {
      const dice = k + (overclock ? 1 : 0);
      if (dice > maxDice) break;
      const gain = this.value(n + dice, d, m) - base - k * theta;
      if (gain > best.gain + 1e-9) best = { k, dice, gain };
    }
    return best;
  }

  /**
   * Make one roll for the obstacle. Returns { res, passed }.
   * Everything a roll can trigger — Assist, Silk, rerolls, Clutch, Alert,
   * complications, hits — happens here.
   */
  attempt(sp, ch) {
    const P = this.P, rec = this.rec, rng = this.rng, obs = this.obs;
    sp.acted = true;
    sp.everActed = true;
    sp.rollsHere++;
    rec.inc("rolls");
    rec.obstacle(obs.id).rolls++;
    const skill = ch.skill;
    const important = obs.objective || (obs.phase === "escape" && (this.lootHolder === sp || this.idx === this.seq.length - 1)) || this.critical(1);

    // Flaws that fire on a roll
    let showOff = false;
    if (this.flawDue(sp, "show-off")) { showOff = ch.appr.diff !== 4 || P.showOffRule === "plus1"; this.fireFlaw(sp); }
    if (this.flawDue(sp, "dramatic")) {
      this.fireFlaw(sp);
      this.earn(sp, "flawMoment", 1);
      this.addAlert(1, "flaw", { crewAction: true });
    }
    if (ch.improvise) { this.spend(sp, "improvise", 2); rec.issue("IMPROVISE_USED", this.where(sp) + ` — ${skill} for ${ch.appr.skill}`); rec.use("silk:improvise"); }
    if (ch.jury) { this.markScene(sp, "jury"); rec.use("perk:jury-rig", true); if (ch.appr.diff >= 3) rec.issue("JURY_RIG_LOCK", this.where(sp) + ` — D${ch.appr.diff} → D2`); }
    if (ch.bypass) { this.markScene(sp, "thing"); rec.use("sig:tinkerer", true); rec.inc("bypassRolls"); }
    // Clarified opposed roll: an actively resisting creature rolls its pool; its Successes + 1 are the Difficulty.
    if (P.creatureRolls === "rolled" && ch.appr.opposed && !ch.jury) {
      const g0 = this.group;
      if (P.groupOpposed === "once" && g0 && g0.oppD?.[ch.appr.opposed] != null) ch.rolledD = g0.oppD[ch.appr.opposed];
      else {
        ch.rolledD = this.succ(rng.dice(this.opposedPool(ch.appr.opposed))) + 1 + (P.obstacleDiffShift ?? 0);
        rec.inc("rolledDiffRolls"); rec.inc("rolledDiffSum", ch.rolledD);
        if (P.groupOpposed === "once" && g0) (g0.oppD ??= {})[ch.appr.opposed] = ch.rolledD;
      }
    }
    // P6: an approach in a creature's sight (the Pet Store's shelf tops and the parrot).
    if (ch.appr.seenBy?.length) { for (const id of ch.appr.seenBy) this.seenBy.add(id); this.triggers(); }

    const { d, flawMod } = this.difficulty(sp, ch, showOff);
    const m = P.creatureRolls === "opposed" && ch.appr.opposed ? this.opposedPool(ch.appr.opposed) : null;
    if (m != null) rec.issue("OPPOSED_NO_PARTIAL", this.where(sp) + ` ${skill} vs ${m} dice`);

    // Pool: Attribute + Skill − Vitality + bonuses
    let n = this.basePool(sp, skill, ch.calledSkill) + this.knownBonus(sp, ch);
    if (skill === "deception" || skill === "disguise") {
      if (sp.methodActorObs === obs.id) rec.use("perk:method-actor");
      if (sp.perks.has("the-long-con")) rec.use("perk:the-long-con");
    }
    if (skill === "persuasion" && sp.role === "face") {
      const np = this.present().find(b2 => b2.perks.has("negotiating-position"));
      if (np) rec.use("perk:negotiating-position");
    }
    if (obs.known && !sp.intelUsed.has(obs.id)) { sp.intelUsed.add(obs.id); if (P.intelValue !== "none") rec.inc("intelDice"); }
    sp.setback = 0;
    sp.bonusNext = 0;

    // I Called It — once per heist, before any roll: +1, or +2 if it fits what's been established.
    const lookout = this.present().find(l => l.role === "lookout" && !this.usedHeist(l, "icalled"));
    if (lookout && (important || (this.pressure >= 0.5 && this.pPass(n, d, m) < 0.8))) {
      this.markHeist(lookout, "icalled");
      n += obs.known ? 2 : 1;
      rec.use("sig:lookout", true);
    }
    // Tactical Feed — once per round, a free +1 die (not the Assist).
    const feeder = this.present().find(l => l !== sp && l.perks.has("tactical-feed") && !this.feedUsedRound);
    if (feeder) { this.feedUsedRound = true; n += 1; rec.use("perk:tactical-feed"); }

    // Assist: Skill only, 1–3 dice, each Success +1 die. One helper.
    const od = outcomeDist(n, d, this.face, P.critRule, P.partialRule);
    const uncertain = m != null ? this.pPass(n, d, m) < 0.9 : od.success + od.crit < 0.9;
    const helper = this.pickHelper(sp, ch);
    if (helper) {
      let hs = 0;
      for (const k of new Set([skill, ...obs.approaches.map(a => a.skill)])) hs = Math.max(hs, helper.skills[k] ?? 0);
      const raw = Math.min(3, hs - this.pen(helper));
      if (this.pen(helper) > 0 && hs > 0) rec.issue("ASSIST_PENALTY", this.where(helper) + ` assists with Skill ${hs} (−${this.pen(helper)})`);
      let dice = Math.max(1, raw);
      helper.acted = true;
      helper.everActed = true;
      // P6: the helper may put their own Silk dice into the Assist roll (the roller still gains at most +2).
      if (P.assistSilk && P.silkPolicy !== "hoard" && helper.silk >= 4 && important && raw < 3) {
        const k = 1;   // one die, and only while the helper keeps a Clutch in reserve
        this.spend(helper, "assistDie", k); dice += k; rec.inc("assistSilkDice", k);
      }
      const got = this.succ(rng.dice(dice));
      n += got;
      rec.inc("assists");
      rec.inc("assistDice", got);
    } else if (uncertain) rec.issue("NO_ASSIST_HELPER", this.where(sp) + ` ${skill} pool ${n} vs D${d}`);

    // FIX EXPERIMENT: cap on non-Silk bonus dice.
    const base0 = this.basePool(sp, skill, ch.calledSkill);
    if (n - base0 > P.bonusDiceCap) { rec.inc("bonusDiceCapped", n - base0 - P.bonusDiceCap); n = base0 + P.bonusDiceCap; }
    rec.inc("bonusDiceSum", Math.max(0, n - base0));

    // Hopeless: nothing but a Clutch gets this through.
    const overclockBonus = skill === "engineering" && sp.perks.has("overclock") ? 1 : 0;
    if (n + sp.silk + overclockBonus + (helper ? 0 : 3) <= 0) rec.issue("HOPELESS_ROLL", this.where(sp) + ` ${skill} pool ${n}, ${sp.silk} SP`);

    // Silk: extra dice
    const maxSilkDice = P.bonusCapScope === "all" ? Math.max(0, P.bonusDiceCap - Math.max(0, n - base0)) : Infinity;
    // P6: the spider Assisting you may pay for your Silk when your own runs short.
    const buy = this.silkDice(sp, n, d, m, ch, important, maxSilkDice);
    if (buy.k > 0) {
      this.spend(sp, buy.dice > buy.k ? "overclock" : "extraDie", buy.k);
      if (buy.dice > buy.k) rec.use("perk:overclock");
      n += buy.dice;
    }

    // Detectors on the final pool
    if (m == null) {
      if (d === 1) rec.issue("PARTIAL_IMPOSSIBLE", this.where(sp) + ` ${skill} D1`);
      if (n > 0 && n < critAt(d, P.critRule)) { rec.inc("critImpossible"); rec.issue("CRIT_IMPOSSIBLE", this.where(sp) + ` ${skill} pool ${n} vs D${d}`); }
    }

    rec.inc("poolSum", n); rec.inc("diffSum", d);
    // ------- the roll
    let faces = null, s = 0, res, oppS = 0;
    if (n <= 0) {
      rec.issue("BOTCH_PATH", this.where(sp) + ` ${skill} pool ${n}`);
      rec.inc("botchPathRolls");
      res = classifyBotch(rng.d6());
    } else {
      faces = rng.dice(n);
      s = this.succ(faces);
      if (m != null) { oppS = this.succ(rng.dice(m)); res = s > oppS ? "success" : "failure"; }
      else res = this.classify(s, d);
    }
    const classify = succ => (m != null ? (succ > oppS ? "success" : "failure") : this.classify(succ, d));
    const rerollFailed = (maxDice) => {
      const fails = faces.filter(f => f < (P.rerollFix ? this.face : 4)).length;
      const k = Math.min(maxDice, fails);
      const s2 = s - 0 + this.succ(rng.dice(k));
      return s2;
    };

    // Wolf Spider — Run It Again: fail/partial on a chase or physical roll: reroll failed dice, keep the better. Once per scene.
    if (faces && (res === "failure" || res === "partial") && sp.species === "wolf" && !this.usedScene(sp, "wolf")
      && (PHYSICAL.has(skill) || obs.tags.includes("chase"))) {
      this.markScene(sp, "wolf");
      const s2 = rerollFailed(99);
      const r2 = classify(s2);
      const flip = RANK[r2] > RANK[res];
      if (flip) { s = s2; res = r2; }
      rec.use("species:wolf", flip);
      if (flip && this.rng.chance(P.creativeSpecies)) this.earn(sp, "creativeSpecies", 1);
    }
    // Silver Tongue — fail a Persuasion roll: reroll it once. (No per-heist limit.)
    if (faces && res === "failure" && skill === "persuasion" && sp.perks.has("silver-tongue")) {
      const s2 = this.succ(rng.dice(n));
      const r2 = classify(s2);
      const flip = RANK[r2] > RANK[res];
      if (flip) { s = s2; res = r2; }
      rec.use("perk:silver-tongue", flip);
      if (++this.persuadeRerolls === 2) rec.issue("PERSUADE_REROLL_UNLIMITED", this.where(sp));
    }
    // Silk Reroll (2 SP): up to 3 failed dice, keep the better.
    if (faces && P.silkPolicy !== "hoard" && sp.silk >= 2 && (res === "failure" || (res === "partial" && P.partialCost === "alert" && this.critical(1)))) {
      const worth = P.silkPolicy === "spendy" || important || this.pressure >= 0.5;
      if (worth) {
        this.spend(sp, "reroll", 2);
        const s2 = rerollFailed(3);
        const r2 = classify(s2);
        const flip = RANK[r2] > RANK[res];
        if (flip) { s = s2; res = r2; }
        rec.use("silk:reroll", flip);
      }
    }
    // Contingency (Lookout): the pre-arranged trigger fires — automatically a success.
    const failed = res === "failure" || res === "botch" || res === "cleanfail";
    if (failed && this.contingency && this.contingency.obs === obs.id && !this.contingency.used) {
      this.contingency.used = true;
      res = "success";
      rec.use("perk:contingency", true);
    }
    // Silk Clutch (3 SP): fail → succeed anyway, Alert +1.
    let clutched = false;
    if ((res === "failure" || res === "botch" || res === "cleanfail") && sp.silk >= 3) {
      const worth = P.silkPolicy === "spendy" || important
        || (P.silkPolicy === "greedy" && (this.pressure >= 0.6 || sp.consecFail >= 2 || obs.phase === "escape"))
        || (P.silkPolicy === "hoard" && obs.objective);
      if (worth) {
        if (res === "botch") rec.issue("CLUTCH_ON_BOTCH", this.where(sp));
        this.spend(sp, "clutch", 3);
        res = "success";
        clutched = true;
        rec.use("silk:clutch", true);
      }
    }

    // Always-on Flaws (Loud, Arachnophobe Magnet): did the +1 Difficulty flip the result? → Flaw Moment.
    if (flawMod > 0 && faces && m == null && !clutched) {
      const alt = this.classify(s, Math.max(1, d - flawMod));
      if (RANK[alt] > RANK[res]) {
        this.earn(sp, "flawMoment", 1);
        rec.use(`flaw:${sp.flaw}`, true);
        if (++sp.slot.flawSilk === 2) rec.issue("CONTINUOUS_FLAW_SILK", this.where(sp) + ` (${sp.flaw})`);
      }
    }
    if (ch.overconfident && RANK[res] <= RANK.partial) { this.earn(sp, "flawMoment", 1); rec.use("flaw:overconfident", true); }
    if (showOff) {
      if (res === "critical") { this.earn(sp, "showOff", 1); rec.use("flaw:show-off", true); }
      else if (RANK[res] <= RANK.partial && (ch.appr.diff < 4 || P.showOffRule === "plus1")) { this.earn(sp, "flawMoment", 1); rec.use("flaw:show-off", true); }
    }

    rec.results[res]++;
    this.log(`${sp.name} (${sp.role}, ${VIT_KEYS[sp.vit]}) ${skill}${ch.improvise ? " [Improvise]" : ""}${ch.jury ? " [Jury-Rig]" : ""} ${n} dice vs ${m != null ? m + " dice (opposed)" : "D" + d}${helper ? " +assist" : ""}${buy.k ? " +" + buy.dice + " Silk dice" : ""}: ${s} → ${res}${clutched ? " (Silk Clutch)" : ""}`);

    // ------- consequences
    const passed = res === "critical" || res === "success" || res === "partial";
    if (clutched) {
      const before = this.alert;
      this.addAlert(1, "clutch", { crewAction: true });
      if (!this.fullAlert && before < this.limit && this.alert >= this.limit) rec.issue("CLUTCH_AT_LIMIT", this.where(sp));
    }
    // Clarified group check: the round's Alert comes from the worst result only (resolveGroup).
    const g = this.group;
    if (g) g.rolls.push({ sp, res, d, baseD: ch.jury ? 2 : ch.appr.diff, skill, loud: ch.appr.loud ?? 0 });
    if (res === "critical" && !g) this.critDrop(d, sp, ch.jury ? 2 : ch.appr.diff);
    if (P.creatureDefeat === "critical" && res === "critical" && (skill === "brawl" || skill === "intimidation") && ch.appr.opposed && obs.threats?.length) {
      for (const id of obs.threats) if (this.cs[id] && !this.cs[id].driven) { this.cs[id].driven = true; rec.inc("creatureDrivenOff"); }
    }
    if (res === "partial") {
      if (P.fullAlertPartial === "cost" && this.lockedFull) this.fullAlertPartialCost(sp);
      else if (!g) this.partialComplication(sp);
      else if (P.partialCost === "setback") sp.setback += 1;
      if (P.partialHit && this.attacker()) { rec.inc("partialHits"); this.threatAttack(sp); }
    }
    if (res === "failure" || res === "botch" || res === "cleanfail") {
      sp.consecFail++;
      if (sp.consecFail === 3) rec.issue("REPEATED_FAILURE", this.where(sp) + ` ${skill} pool ${n} vs D${d}`);
      const engagedBefore = P.engagedRule === "before" ? this.attacker() : undefined;
      if (!g) {
        let cost = res === "botch" ? 2 : res === "failure" ? 1 : P.cleanFailAlert;
        if (ch.appr.loud && res !== "cleanfail") cost += ch.appr.loud;
        cost = this.cancelRollAlert(sp, skill, cost, res);
        if (cost > 0) this.addAlert(cost, res === "botch" ? "botch" : "failure", { crewAction: cost === 1, spike: cost >= 2 });
        this.onNpcFailure(sp);
      }
      const caught = P.fullAlertFailure && P.fullAlertFailure !== "none" && obs.phase === "escape" && (this.fullAlert || this.alert >= this.limit) && res !== "cleanfail";
      if (caught) {
        rec.inc("fullAlertFailureHits");
        if (P.fullAlertFailure === "caught") this.goOut(sp, "caught at Full Alert");
        else { sp.vit = Math.min(OUT, sp.vit + 1); rec.inc("hits"); rec.inc("hitsDrop1"); if (sp.vit >= OUT) this.goOut(sp, "Full Alert hit"); }
      } else if (res !== "cleanfail" && P.failureAttack) {
        // P6: only a threat already engaged (or the one you were fighting) lands the hit.
        if (P.engagedRule !== "before" || engagedBefore || skill === "brawl") this.threatAttack(sp);
        else rec.inc("hitsNotEngaged");
      }
      if (res === "botch") { this.planFellApart(); if (rng.chance(P.spectacularFailure)) this.earn(sp, "spectacularFailure", 1); }
      else if (res === "failure" && rng.chance(P.spectacularFailure / 5)) this.earn(sp, "spectacularFailure", 1);
    } else {
      sp.consecFail = 0;
      if (ch.appr.loud) {
        const c = this.cancelRollAlert(sp, skill, ch.appr.loud, "loud");
        if (c > 0) this.addAlert(c, "loud", { crewAction: c === 1 });
      }
      this.onNpcSuccess(sp);
    }
    return { res, passed };
  }

  /** Group check (groupRolls = worstAlert): apply the worst result's Alert once for the round. */
  resolveGroup() {
    const g = this.group;
    this.group = null;
    if (!g || !g.rolls.length || this.loss) return;
    const P = this.P, rec = this.rec;
    const w = g.rolls.reduce((a, b) => (RANK[b.res] < RANK[a.res] ? b : a));
    rec.inc("groupChecks");
    rec.inc("groupCheckRolls", g.rolls.length);
    if (w.res === "critical") this.critDrop(w.d, w.sp, w.baseD);
    else if (w.res === "partial") {
      if (P.fullAlertPartial === "cost" && this.lockedFull) { /* each Partial already paid its own cost (P6) */ }
      else if (P.partialCost === "alert") this.partialComplication(w.sp); else rec.inc("partials");
    }
    else if (w.res === "failure" || w.res === "botch" || w.res === "cleanfail") {
      let cost = w.res === "botch" ? 2 : w.res === "failure" ? 1 : P.cleanFailAlert;
      if (w.loud && w.res !== "cleanfail") cost += w.loud;
      cost = this.cancelRollAlert(w.sp, w.skill, cost, w.res);
      if (cost > 0) this.addAlert(cost, w.res === "botch" ? "botch" : "failure", { crewAction: cost === 1, spike: cost >= 2 });
      this.onNpcFailure(w.sp);
    }
  }

  /** Roll-level Alert cancels: Smoke and Mirrors, Abort Abort, That's Not What Happened. */
  cancelRollAlert(sp, skill, cost, res) {
    const P = this.P, rec = this.rec;
    if (cost <= 0) return 0;
    if (skill === "deception" && res !== "loud" && sp.perks.has("smoke-and-mirrors")) {
      rec.use("perk:smoke-and-mirrors", true);
      return 0;
    }
    const worth = cost >= 2 || this.critical(cost);
    const wheel = this.present().find(w => w.perks.has("abort-abort") && !this.usedHeist(w, "abort"));
    if (wheel && res !== "loud" && worth) {
      this.markHeist(wheel, "abort");
      rec.use("perk:abort-abort", true);
      return 0;
    }
    const face = this.present().find(f => f.role === "face" && !this.usedHeist(f, "tnwh") && f.silk >= 2);
    if (face && worth && P.silkPolicy !== "hoard") {
      this.markHeist(face, "tnwh");
      this.spend(face, "thatsNotWhatHappened", 2);
      rec.use("sig:face", true);
      return 0;
    }
    return cost;
  }

  /** P6: at Full Alert a Partial can't cost Alert — a hit from an engaged threat, or −1 die next roll. */
  fullAlertPartialCost(sp) {
    this.rec.inc("partials");
    this.rec.inc("fullAlertPartials");
    const atk = this.attacker();
    if (atk && atk.id !== "pursuit") { this.rec.inc("fullAlertPartialHits"); this.threatAttack(sp); }
    else sp.setback += 1;
  }

  partialComplication(sp) {
    const P = this.P, rec = this.rec;
    rec.inc("partials");
    if (P.partialCost === "none") return;
    // Not Part of the Plan (4 SP): negate the complication. Once per heist.
    const nptpOk = s => s.silk >= 4 && (P.nptpScope === "crew" ? !this.crewNptpUsed : !this.usedHeist(s, "nptp"));
    if (P.partialCost === "alert") {
      if (P.silkPolicy !== "hoard" && this.critical(1)) {
        const payer = this.present().filter(nptpOk).sort((a, b) => b.silk - a.silk)[0];
        if (payer) {
          this.spend(payer, "notPartOfThePlan", 4);
          this.markHeist(payer, "nptp");
          this.crewNptpUsed = true;
          rec.use("silk:notPartOfThePlan", true);
          return;
        }
      }
      this.addAlert(1, "partial", { crewAction: true });
    } else {
      sp.setback += 1;
    }
  }

  /** Obstacle-specific NPC reactions to a failed roll. */
  onNpcFailure(sp) {
    const obs = this.obs;
    const g = this.cs["guard-spider"];
    if (g && obs.threats?.includes("guard-spider") && !g.forced) {
      g.forced = true;   // aware
      this.addAlert(CREATURES["guard-spider"].spotAlert, "spotted");
      this.rec.inc("guardAware");
    }
    const r = this.cs["protection-rat"];
    if (r && obs.ratDeal && !r.bad && !r.deal) {
      r.bad = true;
      r.forced = true;
      this.addAlert(CREATURES["protection-rat"].badAlert, "ratBad", { spike: true });
      this.rec.inc("ratWentBad");
    }
  }

  onNpcSuccess() {
    const r = this.cs["protection-rat"];
    if (r && this.obs.ratDeal && !r.bad) r.deal = true;
  }

  /* ------------------------------------------------------------ flaws -- */

  flawDue(sp, key) {
    return sp.flaw === key && !sp.slot.flawFired && this.idx >= sp.slot.flawAt;
  }
  fireFlaw(sp) {
    sp.slot.flawFired = true;
    this.rec.use(`flaw:${sp.flaw}`);
  }

  /* ---------------------------------------------------------- planning -- */

  planning() {
    const rng = this.rng, rec = this.rec, P = this.P, h = this.h;
    const crew = this.present();
    // Casing: one Perception or Tactics roll per spider; each Success = one true detail.
    let succ = 0;
    for (const sp of crew) {
      const pool = Math.max(sp.attrs.wit + sp.skills.perception, sp.attrs.wit + sp.skills.tactics);
      succ += this.succ(rng.dice(pool));
    }
    rec.inc("casingSuccesses", succ);
    const facts = rng.shuffle(h.intel);
    const got = facts.slice(0, succ);
    rec.inc("intelFacts", got.length);
    if (succ > h.intel.length) {
      rec.inc("casingOverflowSuccesses", succ - h.intel.length);
      if (P.casingRule !== "capped") rec.issue("CASING_OVERFLOW", `${h.id}: ${succ} Successes for ${h.intel.length} facts`);
    }
    for (const f of got) if (f.obstacle) this.known.add(f.obstacle);
    // Familiar Face: one true detail that wasn't in the briefing → the unknown obstacle.
    const ff = crew.find(sp => sp.perks.has("familiar-face"));
    const unknown = this.seq.find(o => o.unknown);
    if (ff && unknown && P.casingRule !== "capped") { this.known.add(unknown.id); rec.use("perk:familiar-face", true); }
    // Preparation: pre-place a Silk Line on a known climb/gap.
    for (const o of this.seq) {
      if (this.known.has(o.id) && (o.tags.includes("climb") || o.tags.includes("gap")) && (P.silkLineBypass || P.preLineRule === "minus1")) {
        this.preLines.add(o.id);
        rec.inc("preparedLines");
      }
    }
    // Contingency: one pre-arranged success on a known obstacle's first failure.
    const look = crew.find(sp => sp.perks.has("contingency"));
    if (look) {
      const cands = this.seq.filter(o => o.phase === "heist" && !o.unknown && (this.known.has(o.id) || !o.unknown));
      const pick = cands.find(o => o.objective) ?? cands.sort((a, b) => Math.max(...b.approaches.map(x => x.diff)) - Math.max(...a.approaches.map(x => x.diff)))[0];
      if (pick) this.contingency = { obs: pick.id, used: false };
    }
    // Method Actor: pick the first obstacle with an NPC and a Deception approach.
    for (const sp of crew) {
      if (!sp.perks.has("method-actor")) continue;
      const o = this.seq.find(x => (x.threats?.length || x.tags.includes("human")) && x.approaches.some(a => a.skill === "deception" || a.skill === "disguise"));
      if (o) sp.methodActorObs = o.id;
    }
    // Brilliant Plan (+2 SP), ST's call.
    if (rng.chance(P.brilliantPlan)) this.earn(rng.pick(crew), "brilliantPlan", 2);
    // Flaw timing for the once-per-heist Flaws.
    for (const s of this.slots) {
      s.flawAt = P.flawTiming === "worst" && this.objIdx >= 0 ? this.objIdx : rng.int(0, this.seq.length - 1);
    }
  }

  /* ---------------------------------------------------------- the run -- */

  run() {
    const rec = this.rec;
    rec.startRun();
    this.planning();
    for (this.idx = 0; this.idx < this.seq.length; this.idx++) {
      const obs = this.seq[this.idx];
      this.obs = obs;
      const skip = obs.phase === "heist" && (this.fullAlert || this.abandoned);
      if (skip) {
        rec.obstacle(obs.id).skipped++;
      } else {
        this.runObstacle(obs);
        if (this.loss) break;
        this.gap();
      }
      const a = (rec.alertAfter[obs.id] ??= [0, 0]);
      a[0] += this.alert; a[1]++;
    }
    return this.finish();
  }

  enterPhase(obs) {
    if (obs.phase === "escape" && !this.inEscape) {
      this.inEscape = true;
      if (this.P.sceneIs === "phase") for (const sp of this.present()) sp.sceneUsed.clear();
      // Wheelman — I Know a Way: once per heist, during the Escape only: −1 Difficulty to every Escape roll.
      const wm = this.present().find(sp => sp.role === "wheelman" && !this.usedHeist(sp, "iknow"));
      if (wm) { this.markHeist(wm, "iknow"); this.iKnowAWay = true; }
      // Leader: Escape Routes (Lookout) or Drafting (Wheelman). One leader.
      const lr = this.present().find(sp => sp.perks.has("escape-routes"));
      if (lr) { this.escapeRoutes = lr; this.drafting = null; }
      if (this.escapeRoutes && this.iKnowAWay) this.rec.issue("ESCAPE_STACK_D1", `${this.h.id}: Escape Difficulty ${this.seq[this.seq.length - 1].approaches[0].diff} → −2`);
      if (this.fullAlert && this.alert < 7) this.rec.issue("FULL_ALERT_NO_LOCKDOWN", `${this.h.id}: Full Alert Escape at Alert ${this.alert} (Limit ${this.limit}) — no roll penalty`);
    }
  }

  runObstacle(obs) {
    const P = this.P, rec = this.rec, rng = this.rng;
    this.enterPhase(obs);
    const ro = rec.obstacle(obs.id);
    ro.entered++;
    // Waiting Web: replacements enter at the start of the next obstacle.
    for (const s of this.slots) {
      if (s.pending) {
        s.cur = s.pending;
        s.pending = null;
        s.cur.arrived = true;
        s.cur.arrivedAt = this.idx;
      }
    }
    if (P.sceneIs === "obstacle") for (const sp of this.present()) sp.sceneUsed.clear();
    for (const sp of this.present()) {
      sp.passed = false; sp.recovered = false; sp.rollsHere = 0; sp.consecFail = 0; sp.frozen = false;
    }
    for (const id of this.creatureIds) {
      const st = this.cs[id];
      if (st.backupPending) { st.backupPending = false; st.forced = true; }   // P6: the beaten guard's backup takes its post
      st.textAwake = !!obs.awake?.includes(id);
      if (st.textAwake && P.creatureStaysActive) st.forced = true;
    }
    this.drafting = this.inEscape && this.escapeRoutes ? null : this.present().find(sp => sp.perks.has("drafting")) ?? null;
    if (this.drafting && obs.tags.includes("movement")) rec.use("perk:drafting");
    this.trailUp = false;
    this.decoyRounds = 0;
    this.seenBy = new Set();        // P6: creatures that can see the crew here (beyond the obstacle's own threats)
    this.sceneLines = new Set();    // P6: a Silk Line spun in this scene (−1 to the climb)
    if (P.parrotSight) this.triggers();
    // Intel on this obstacle: cased, or a Perk that reads it.
    const crew = this.present();
    obs.known = this.known.has(obs.id);
    const mech = obs.tags.includes("lock") || obs.tags.includes("sensor") || obs.tags.includes("smallMech");
    if (!obs.known && crew.some(sp => sp.perks.has("read-the-room")) && (obs.kind === "social" || obs.approaches.some(a => a.skill === "persuasion"))) { obs.known = true; rec.use("perk:read-the-room", true); }
    if (!obs.known && mech && crew.some(sp => sp.perks.has("i-see-how-this-works"))) { obs.known = true; rec.use("perk:i-see-how-this-works", true); }
    if (!obs.known && obs.tags.includes("sensor") && crew.some(sp => sp.perks.has("spider-sense-sort-of"))) { obs.known = true; rec.use("perk:spider-sense-sort-of", true); }
    if (!obs.known && (this.activeThreatsHere().length || (P.earlyWarningAll && obs.threats?.length)) && crew.some(sp => sp.perks.has("early-warning"))) { obs.known = true; rec.use("perk:early-warning", true); }
    const cs = crew.find(sp => sp.perks.has("counter-surveillance"));
    if (!obs.known && cs && this.hasNPCs()) {
      const s = this.succ(rng.dice(Math.max(0, cs.attrs.wit + cs.skills.perception - this.pen(cs))));
      if (s >= 2) { obs.known = true; rec.use("perk:counter-surveillance", true); }
    }
    // Ch 20 mid-heist complication (optional).
    if (P.midHeistComplications > 0 && rng.chance(P.midHeistComplications)) this.midComplication();

    this.round = 0;
    this.stallMod = null;
    this.log(`— ${obs.name}${obs.known ? " (intel)" : ""}; crew: ${this.present().map(sp => sp.name + "/" + sp.role + (sp.vit ? "/" + VIT_KEYS[sp.vit] : "")).join(", ")}`);
    obs.progress = 0;
    // P5: Treasure is slow — a silk sled (1 SP), or an extra round at the first Escape obstacle.
    if (P.lootCarry === "sled" && obs.phase === "escape" && !this.hauled && this.objectiveTaken && this.lootHolder
      && (/Treasure/.test(this.h.loot) || this.h.difficulty === "hard")) {
      this.hauled = true;
      const payer = P.silkPolicy === "hoard" ? null : this.present().filter(sp => sp.silk >= 1).sort((a, b) => b.silk - a.silk)[0];
      if (payer) { this.spend(payer, "sled", 1); rec.inc("lootSled"); }
      else {
        rec.inc("lootHaulRound");
        this.round = 1; ro.rounds++;
        this.threatPhase(false);
        if (this.loss) return;
      }
    }
    let cleared = false;
    while (!cleared) {
      if (this.round >= P.maxRounds) { this.stuck(obs); break; }
      this.round++;
      ro.rounds++;
      if (P.stallClock && (this.round === P.stallClock || (P.stallEvery > 0 && this.round > P.stallClock && (this.round - P.stallClock) % P.stallEvery === 0))) this.stallComplication();
      cleared = this.runRound(obs);
      if (this.loss) return;
      this.threatPhase(cleared);
      if (this.stallMod && --this.stallMod.rounds <= 0) this.stallMod = null;
      if (this.loss) return;
      if (!this.fullAlert && this.alert >= this.limit) {
        this.fullAlert = true;
        this.fullAlertAt = obs.id;
        this.log(`FULL ALERT (${this.alert}/${this.limit})${this.objectiveTaken ? "" : " — objective out of reach"}`);
        this.creatureAlertAtFull = this.creatureAlert;
        rec.fullAlertAt[obs.id] = (rec.fullAlertAt[obs.id] ?? 0) + 1;
        this.planFellApart();
        if (!this.objectiveTaken && obs.phase === "heist") {
          this.objectiveLost = true;
          rec.issue("FULL_ALERT_BEFORE_OBJECTIVE", `${this.h.id} ${obs.id} round ${this.round}: Alert ${this.alert}/${this.limit}`);
        }
        if (obs.phase === "heist" && !cleared) break;
      }
      // Recovery: a full round with no threat able to reach you (once per obstacle).
      if (!cleared && !this.activeThreatsHere().length && !obs.threats?.length && !obs.tags.includes("human")) {
        for (const sp of this.present()) this.recover(sp, "quietRound");
      }
    }
    if (cleared && obs.phase === "escape" && this.idx === this.seq.length - 1) {
      for (const sp of this.present()) { sp.escaped = true; this.escaped++; }
    }
  }

  recover(sp, how) {
    if (sp.recovered || sp.vit <= 0 || sp.vit >= OUT) return;
    sp.recovered = true;
    sp.vit -= 1;
    this.rec.inc(`recover:${how}`);
  }

  stuck(obs) {
    const rec = this.rec;
    rec.obstacle(obs.id).stuck++;
    const left = this.present().filter(sp => !sp.passed);
    const anyPassed = this.present().some(sp => sp.passed);
    rec.issue("STUCK_OBSTACLE", `${this.h.id} ${obs.id}: ${this.P.maxRounds} rounds, ${left.length} spider(s) still not through, Alert ${this.alert}/${this.limit}` +
      (left[0] ? ` (e.g. ${left[0].name}, ${VIT_KEYS[left[0].vit]})` : ""));
    if (obs.phase === "escape" || anyPassed) {
      // Leave them behind: caught.
      for (const sp of left) {
        if (sp.vit === CRITICAL) rec.issue("CRITICAL_LEFT_BEHIND", this.where(sp));
        this.goOut(sp, "left behind");
        if (this.loss) return;
      }
      if (obs.phase === "escape" && this.idx === this.seq.length - 1) {
        for (const sp of this.present()) { sp.escaped = true; this.escaped++; }
      }
      return;
    }
    if (!this.objectiveTaken) {
      this.objectiveLost = true;
      rec.issue("ABANDONED_OBJECTIVE", `${this.h.id} ${obs.id}: gave up after ${this.P.maxRounds} rounds`);
      this.abandoned = true;   // the rest of the heist obstacles are skipped
    }
  }

  midComplication() {
    const r = this.rng.d6(), rec = this.rec;
    rec.inc(`complication:${r}`);
    if (r === 1 && this.cs["house-cat"]) this.cs["house-cat"].forced = true;
    if (r === 4) {
      for (const sp of this.present()) {
        if (sp.flaw !== "fear-of-vacuums") continue;
        const s = this.succ(this.rng.dice(Math.max(0, sp.attrs.nerve - this.pen(sp))));
        const need = this.P.passChecks === "partial" ? partialAt(3, this.P.partialRule) : 3;
        rec.use("flaw:fear-of-vacuums", s < need);
        if (s < need) { sp.frozenFirstRound = true; this.earn(sp, "flawMoment", 1); }
      }
      this.vacuumSeen = true;
    }
    if (r === 6) this.addAlert(1, "complication");
  }

  /** P5 clock: the Ch 20 Mid-Heist Complication (v4.7 effects), rolled when the crew starts round N at one obstacle. */
  stallComplication() {
    const r = this.rng.d6(), rec = this.rec;
    rec.inc(`stall:${r}`);
    if (r === 1) {
      // The cat woke up: the nearest sleeping creature is active now; nothing asleep → +1 Alert.
      const id = this.creatureIds.find(k => this.cs[k].spawned && Number.isFinite(CREATURES[k].wake) && CREATURES[k].perRound > 0 && !this.active(k) && !this.cs[k].driven && !this.cs[k].paid);
      if (id) { this.cs[id].forced = true; rec.inc("stallWake"); } else this.addAlert(1, "complication");
    } else if (r === 2) {
      this.obs.known = true;                                       // a detail the crew didn't case
    } else if (r === 3) {
      this.stallMod = { mod: 1, rounds: 2 };                       // a human up for water: Stealth +1, this round and next
    } else if (r === 4) {
      for (const sp of this.present()) {
        if (sp.flaw !== "fear-of-vacuums") continue;
        const s = this.succ(this.rng.dice(Math.max(0, sp.attrs.nerve - this.pen(sp))));
        const need = this.P.passChecks === "partial" ? partialAt(3, this.P.partialRule) : 3;
        rec.use("flaw:fear-of-vacuums", s < need);
        if (s < need) { sp.frozenNext = true; this.earn(sp, "flawMoment", 1); }
      }
      this.vacuumSeen = true;
      this.stallMod = { mod: -1, rounds: 1 };                      // its roar covers you: Stealth −1 this round
    } else if (r === 5) {
      this.stallMod = { mod: 1, rounds: 1 };                       // phone lights the room: no cover this round (≈ Stealth +1)
    } else {
      this.addAlert(1, "complication");
    }
  }

  stallStealth() { return this.stallMod ? this.stallMod.mod : 0; }

  /* -------------------------------------------------------- one round -- */

  runRound(obs) {
    const P = this.P, rec = this.rec, rng = this.rng;
    const crew = this.present();
    if (!crew.length) return false;
    for (const sp of crew) { sp.acted = false; sp.carrying = false; sp.frozen = false; }
    this.sceneBruiser = null;
    this.feedUsedRound = false;
    this.helpers = [];
    if (this.round === 1) for (const sp of crew) if (sp.frozenFirstRound) { sp.frozen = true; sp.frozenFirstRound = false; }
    for (const sp of crew) if (sp.frozenNext) { sp.frozen = true; sp.frozenNext = false; }

    // Loot on the floor: someone spends their Action to grab it.
    if (this.lootDropped) {
      const g = crew.find(sp => !sp.frozen);
      if (g) { g.acted = true; this.lootDropped = false; this.lootHolder = g; rec.inc("lootPickedUp"); }
    }

    // Round-start Flaws.
    for (const sp of crew) {
      const needed = !sp.passed;
      if (this.flawDue(sp, "compulsive-planner")) {
        this.fireFlaw(sp);
        sp.frozen = true;
        let net = 0;
        if (needed) { this.earn(sp, "flawMoment", 1); net++; }
        if (sp.silk > 0) { sp.silk -= 1; rec.inc("silkLostCompulsive"); net--; }
        if (needed && net === 0) rec.issue("COMPULSIVE_NET_ZERO", this.where(sp));
      }
      if (sp.flaw === "easily-distracted" && !sp.slot.flawFired && (this.idx >= sp.slot.flawAt || obs.flawTrigger === "easily-distracted")) {
        this.fireFlaw(sp);
        sp.frozen = true;
        if (needed) this.earn(sp, "flawMoment", 1);
      }
      if (this.flawDue(sp, "allergic-to-dust")) {
        this.fireFlaw(sp);
        const st = this.band();
        const d = 3 + st.stealth + (sp.flaw === "loud" && this.alert >= 5 ? 1 : 0);
        const pool = sp.attrs.nerve + sp.skills.stealth - this.pen(sp);
        const s = pool > 0 ? this.succ(rng.dice(pool)) : 0;
        const need = P.passChecks === "partial" ? partialAt(d, P.partialRule) : d;
        if (s < need) { this.earn(sp, "flawMoment", 1); this.addAlert(1, "flaw", { crewAction: true }); }
      }
      if (this.flawDue(sp, "butterfingers") && this.lootHolder === sp) {
        this.fireFlaw(sp);
        this.earn(sp, "flawMoment", 1);
        const g = crew.find(x => x !== sp && !x.acted && !x.frozen) ?? sp;
        g.acted = true;   // someone spends an Action recovering it
        rec.inc("butterfingersDrops");
      }
    }

    // Round-1 free abilities: Fast Talk, Thunderous Entrance.
    if (this.round === 1) {
      const threats = this.activeThreatsHere();
      const ft = crew.find(sp => sp.perks.has("fast-talk") && !this.usedScene(sp, "ft"));
      const ftT = P.faceVsGuard ? threats.filter(id => id !== "guard-spider") : threats;
      if (ft && ftT.length) { this.markScene(ft, "ft"); this.suppress([ftT[0]], 1, "perk:fast-talk"); }
      const te = crew.find(sp => sp.perks.has("thunderous-entrance") && !this.usedScene(sp, "te"));
      if (te && threats.length) {
        this.markScene(te, "te");
        const frozen = threats.filter(id => this.succ(rng.dice(CREATURES[id].perception)) < 3);
        this.suppress(frozen, 1, "perk:thunderous-entrance");
      }
    }

    // ---------- whole-crew bypasses
    const by = this.tryBypass(obs, crew);
    if (by) return this.clear(obs, by.method, by.actor);

    // ---------- choose the plan for this round
    const unpassed = crew.filter(sp => !sp.passed);
    const canAct = sp => !sp.frozen && !sp.acted;

    // Individual auto-passes (species / Signature / Perk).
    const indivApproaches = this.approaches("individual");
    if (indivApproaches.length) {
      for (const sp of unpassed) {
        if (!canAct(sp)) continue;
        const auto = this.autoPass(sp, obs);
        if (auto) {
          sp.acted = true; sp.everActed = true; sp.passed = true; rec.use(auto, true); if (obs.tags.includes("climb") && sp.perks.has("silk-trail") && P.silkLineBypass) this.trailUp = true;
          // P5: a Cellar Spider's Phase Through brings one adjacent crewmate along.
          if (auto === "sig:ghost" && sp.species === "cellar" && P.cellarPhase) {
            const buddy = unpassed.find(b => b !== sp && !b.passed && !b.frozen);
            if (buddy) { buddy.passed = true; rec.inc("cellarPhaseBuddy"); }
          }
        }
      }
    }
    const stillUnpassed = crew.filter(sp => !sp.passed);
    if (!stillUnpassed.length) return this.clear(obs, "auto");

    // Single-roll option: the best spider on any single approach (or the Overconfident volunteer).
    let single = null;
    if (this.approaches("single").length) {
      for (const sp of crew) {
        if (!canAct(sp)) continue;
        const ch = this.bestFor(sp, "single");
        if (ch && (!single || ch.est.v > single.est.v)) { single = ch; single.sp = sp; }
      }
    }
    // Individual option: every spider not yet through rolls its own best approach.
    let indiv = null;
    if (indivApproaches.length) {
      indiv = [];
      let pAll = 1, alertExp = 0;
      for (const sp of stillUnpassed) {
        const ch = canAct(sp) ? this.bestFor(sp, "individual") : null;
        if (ch) { ch.sp = sp; indiv.push(ch); pAll *= ch.est.p; alertExp += 1 - ch.est.p; }
        else pAll = 0;
      }
      indiv.score = pAll - 0.15 * (P.groupRolls === "worstAlert" ? 1 - pAll : alertExp);
    }
    const singleScore = single ? single.est.p - 0.15 * (1 - single.est.p) : -Infinity;
    const useSingle = single && (!indiv || !indiv.length || singleScore >= indiv.score);
    // Overconfident: the ST makes the spider volunteer for the roll it shouldn't take.
    if (useSingle) {
      const vol = crew.find(sp => canAct(sp) && this.flawDue(sp, "overconfident"));
      if (vol && vol !== single.sp) {
        const ch = this.bestFor(vol, "single");
        if (ch) { ch.sp = vol; ch.overconfident = true; single = ch; this.fireFlaw(vol); }
      } else if (vol) this.fireFlaw(vol);
    }
    const rollers = useSingle ? [single] : (indiv ?? []).slice();
    if (!rollers.length) {
      if (!this.approaches("single").length && !indivApproaches.length) rec.issue("NO_TRAINED_SPIDER", `${this.h.id} ${obs.id}: no approach usable`);
      return false;
    }

    // No trained spider at all?
    const skills = obs.approaches.map(a => a.skill);
    if (this.round === 1 && !crew.some(sp => skills.some(k => (sp.skills[k] ?? 0) > 0))) rec.issue("NO_TRAINED_SPIDER", `${this.h.id} ${obs.id}: nobody has ${skills.join("/")}`);

    // Critical spiders must be carried on movement obstacles.
    if (!useSingle && obs.tags.includes("movement")) {
      for (const ch of rollers.slice()) {
        if (ch.sp.vit !== CRITICAL) continue;
        const carrier = crew.find(c => c !== ch.sp && c.vit < CRITICAL && !c.carrying);
        if (carrier) {
          carrier.carrying = true;
          rec.inc("carries");
          if (carrier.perks.has("passenger")) rec.use("perk:passenger");
        } else {
          rec.issue("CRITICAL_NO_CARRIER", this.where(ch.sp));
          rollers.splice(rollers.indexOf(ch), 1);
        }
      }
    }
    const rollerSet = new Set(rollers.map(c => c.sp));

    // Helpers: everyone not rolling this round (and, individually, those already through).
    this.helpers = crew.filter(sp => !rollerSet.has(sp) && !sp.frozen && !sp.acted
      && (useSingle || (sp.passed && P.assistFromPassed)));

    // ---------- utility Actions from idle spiders
    this.utility(obs, crew, rollers, useSingle);

    // ---------- rolls (weakest first, so the best helpers go where they matter)
    rollers.sort((a, b) => a.est.p - b.est.p);
    this.group = !useSingle && P.groupRolls === "worstAlert" ? { rolls: [] } : null;
    for (const ch of rollers) {
      if (this.loss) { this.group = null; return false; }
      const sp = ch.sp;
      if (sp.out || sp.acted || sp.frozen) continue;
      const r = this.attempt(sp, ch);
      if (r.passed && useSingle && obs.phase === "heist" && ++obs.progress < P.obstacleSteps) break;
      if (r.passed) {
        if (useSingle) {
          rec.obstacle(obs.id).clearedBy[`roll:${ch.skill}${ch.improvise ? "(improvised)" : ""}`] = (rec.obstacle(obs.id).clearedBy[`roll:${ch.skill}${ch.improvise ? "(improvised)" : ""}`] ?? 0) + 1;
          if (obs.objective) this.takeObjective(sp);
          if (P.guardRules && ch.skill === "persuasion" && obs.threats?.includes("guard-spider")) { this.cs["guard-spider"].paid = true; rec.inc("guardPaid"); }
          // P6: a guard beaten in a fight is gone; its backup, aware, holds the post.
          if (P.guardBeaten === "post" && ch.skill === "brawl" && obs.threats?.includes("guard-spider")) {
            const gs = this.cs["guard-spider"]; gs.beaten = true; rec.inc("guardBeaten");
            gs.forced = false; gs.backupPending = true;   // the backup arrives at the start of the next obstacle, aware
          }
          // P6: a Weakness that shuts the creature in holds it for the rest of the heist.
          if (P.weaknessRule === "backoff") {
            // P6: a Weakness clears a creature's obstacle like Brawl or Intimidation (it backs off for the rest of it, which
            // the obstacle ending already covers; the clearing round's +X still counts). A Weakness that shuts it in keeps it in.
            if (ch.appr.hold && this.cs[ch.appr.hold]) { this.cs[ch.appr.hold].shut = true; rec.inc(`shut:${ch.appr.hold}`); }
          }
          this.afterRound();
          return this.clear(obs, null, sp, true);
        }
        sp.passed = true;
        if (obs.tags.includes("climb") && sp.perks.has("silk-trail") && P.silkLineBypass) this.trailUp = true;
        if (this.idx === this.seq.length - 1 && obs.phase === "escape") {
          sp.escaped = true;
          this.escaped++;
          if (this.lootHolder === sp) this.lootEscaped = true;
        }
      }
    }
    this.resolveGroup();
    if (this.loss) return false;
    this.afterRound();
    const left = this.present().filter(sp => !sp.passed && !sp.escaped);
    if (!useSingle && !left.length) {
      rec.obstacle(obs.id).clearedBy.individual = (rec.obstacle(obs.id).clearedBy.individual ?? 0) + 1;
      if (obs.objective) this.takeObjective(this.present()[0]);
      return this.clear(obs, null, null, true);
    }
    // Everyone left escaped already?
    if (this.idx === this.seq.length - 1 && this.present().length === 0 && this.escaped > 0) return true;
    return false;
  }

  afterRound() {
    if (this.sceneBruiser) {
      this.addAlert(1, "scene", { crewAction: true });
      this.sceneBruiser = null;
    }
    if (this.decoyRounds > 0) this.decoyRounds--;
  }

  /** Per-spider automatic passes on individual obstacles. Returns the ability key or null. */
  autoPass(sp, obs) {
    const t = obs.tags;
    if (!t.includes("movement")) return null;
    if (sp.species === "cellar" && t.includes("squeeze")) return this.species(sp, "species:cellar");
    if (sp.species === "jumping" && t.includes("gap") && !this.usedScene(sp, "jump")) { this.markScene(sp, "jump"); return this.species(sp, "species:jumping"); }
    if (sp.perks.has("second-story-spider") && (t.includes("climb") || t.includes("slippery"))) return "perk:second-story-spider";
    if (sp.role === "ghost" && !this.usedScene(sp, "phase")) { this.markScene(sp, "phase"); return "sig:ghost"; }
    return null;
  }

  species(sp, key) {
    if (this.rng.chance(this.P.creativeSpecies)) this.earn(sp, "creativeSpecies", 1);
    return key;
  }

  /** Whole-crew bypasses: Silk Lines, double movement, jams, Bypass gadgets. */
  tryBypass(obs, crew) {
    const P = this.P, rec = this.rec, t = obs.tags;
    const idle = crew.filter(sp => !sp.frozen && !sp.acted);
    if ((t.includes("climb") || t.includes("gap")) && P.silkLineBypass) {
      if (this.preLines.has(obs.id) && P.preLineRule !== "minus1") return { method: "preparedSilkLine" };
      if (this.trailUp) return { method: "perk:silk-trail" };
      const orb = idle.find(sp => sp.species === "orbweaver" && !this.usedScene(sp, "orb"));
      if (orb) { this.markScene(orb, "orb"); this.species(orb, "species:orbweaver"); return { method: "species:orbweaver", actor: orb }; }
    }
    if (t.includes("slippery") && P.slipperyDoubleMove && !this.activeThreatsHere().length) {
      rec.issue("SLIPPERY_DOUBLE_MOVE", `${this.h.id} ${obs.id}`);
      this.rec.obstacle(obs.id).rounds++;   // double movement: an extra round
      return { method: "doubleMovement" };
    }
    if ((t.includes("climb") || t.includes("gap")) && P.silkLineBypass && P.silkLineRule === "minus1") {
      // P6: a line spun in the scene lowers the climb by 1, like a Planning line; it doesn't skip it.
      if (!this.preLines.has(obs.id) && !this.sceneLines.has(obs.id)) {
        const payer = idle.filter(sp => sp.silk >= 1).sort((a, b) => b.silk - a.silk)[0];
        if (payer && P.silkPolicy !== "hoard") { this.spend(payer, "silkLine", 1); payer.acted = true; payer.everActed = true; this.sceneLines.add(obs.id); rec.inc("sceneLines"); }
      }
    } else if ((t.includes("climb") || t.includes("gap")) && P.silkLineBypass) {
      // Silk Line: 1 SP, or GRACE + Acrobatics D2 as an Action.
      const payer = crew.filter(sp => sp.silk >= 1).sort((a, b) => b.silk - a.silk)[0];
      if (payer && P.silkPolicy !== "hoard") { this.spend(payer, "silkLine", 1); return { method: "silkLine(1 SP)", actor: payer }; }
      const spinner = idle.sort((a, b) => (b.attrs.grace + b.skills.acrobatics) - (a.attrs.grace + a.skills.acrobatics))[0];
      if (spinner) {
        const r = this.attempt(spinner, { appr: { skill: "acrobatics", diff: 2, mode: "single" }, skill: "acrobatics", mode: "single", noHeight: true });
        this.rec.inc("silkLineRolls");
        if (r.passed) return { method: "silkLine(roll)", actor: spinner };
      }
    }
    if (t.includes("sensor") || t.includes("smallMech")) {
      const spit = idle.find(sp => sp.species === "spitting" && (P.spittingLimit !== "scene" || !this.usedScene(sp, "spit")));
      if (spit && (t.includes("sensor") || P.spittingJamsLocks)) {
        spit.acted = true;
        this.markScene(spit, "spit");
        if (++this.spitUses === 2) rec.issue("SPITTING_UNLIMITED", this.where(spit));
        this.species(spit, "species:spitting");
        return { method: "species:spitting", actor: spit };
      }
      const tk = idle.find(sp => sp.role === "tinkerer" && !this.usedScene(sp, "thing"));
      if (tk && P.bypassRule !== "roll" && (!t.includes("complexLock") || P.bypassComplexLocks)) {
        this.markScene(tk, "thing");
        tk.acted = true;
        return { method: "sig:tinkerer", actor: tk };
      }
    }
    return null;
  }

  clear(obs, method, actor, rolled = false) {
    const rec = this.rec;
    this.log(`cleared${method ? " by " + method : ""}${actor ? " (" + actor.name + ")" : ""}`);
    if (method) {
      rec.obstacle(obs.id).clearedBy[method] = (rec.obstacle(obs.id).clearedBy[method] ?? 0) + 1;
      if (method.includes(":")) rec.use(method.replace(/\(.*/, ""), true);
      if (/silkLine|silk-trail|orbweaver|preparedSilkLine/i.test(method)) rec.issue("SILK_LINE_BYPASS", `${this.h.id} ${obs.id}: cleared by ${method}`);
      if (/spitting|sig:tinkerer/.test(method)) rec.issue("MECH_BYPASS", `${this.h.id} ${obs.id}: cleared by ${method}`);
      if (actor) { actor.acted = true; actor.everActed = true; }
      if (obs.objective && !this.objectiveTaken) this.takeObjective(actor ?? this.present()[0]);
    }
    for (const sp of this.present()) sp.passed = true;
    if (!rolled) this.afterRound();
    return true;
  }

  takeObjective(sp) {
    if (this.objectiveLost || this.objectiveTaken) return;
    this.log(`OBJECTIVE taken by ${(sp ?? this.present()[0])?.name}`);
    this.objectiveTaken = true;
    this.lootHolder = sp ?? this.present()[0];
    this.rec.inc("objectivesTaken");
  }

  /** Idle spiders' Actions: Decoy, Make a Scene, I Made a Thing (Boost/Distraction), Field Repair. */
  utility(obs, crew, rollers, useSingle) {
    const P = this.P, rec = this.rec, rng = this.rng;
    const rollerSet = new Set(rollers.map(c => c.sp));
    const idle = () => crew.filter(sp => !rollerSet.has(sp) && !sp.acted && !sp.frozen);
    const bigRound = rollers.length >= 3 || (useSingle && obs.objective);
    const npcs = this.hasNPCs();
    const threats = this.activeThreatsHere();

    // Grifter — Decoy: once per heist; NPCs investigate 2 rounds unless they pass Perception D3; +1 die to the job.
    const gr = crew.find(sp => sp.role === "grifter" && !this.usedHeist(sp, "decoy") && !sp.frozen && !sp.acted);
    if (gr && npcs && (bigRound || this.critical(1)) && (!rollerSet.has(gr) || rollers.length >= 3)) {
      this.markHeist(gr, "decoy");
      if (rollerSet.has(gr)) { rollerSet.delete(gr); const i = rollers.findIndex(c => c.sp === gr); rollers.splice(i, 1); }
      gr.acted = true; gr.everActed = true;
      this.decoyRounds = 2;
      const fooled = threats.filter(id => this.succ(rng.dice(CREATURES[id].perception)) < 3);
      this.suppress(fooled, 2, "sig:grifter");
      if (obs.tags.includes("human")) rec.issue("NPC_NO_POOL", `${this.h.id} ${obs.id}: Decoy vs humans (no Perception pool)`);
      rec.use("sig:grifter", true);
    }
    // Bruiser — Make a Scene: once per scene; +2 dice to everyone else this round; Alert +1 after.
    const br = crew.find(sp => sp.role === "bruiser" && !this.usedScene(sp, "scene") && !sp.frozen && !sp.acted);
    if (br && npcs && bigRound && !this.critical(1)) {
      const others = rollers.filter(c => c.sp !== br).length;
      if (others >= 2 || (useSingle && rollers[0]?.sp !== br)) {
        this.markScene(br, "scene");
        if (rollerSet.has(br)) { rollerSet.delete(br); const i = rollers.findIndex(c => c.sp === br); rollers.splice(i, 1); }
        br.acted = true; br.everActed = true;
        this.sceneBruiser = br;
        rec.use("sig:bruiser", true);
      }
    }
    // Tinkerer — I Made a Thing: Boost (+2 dice) or Distraction.
    const tk = idle().find(sp => sp.role === "tinkerer" && !this.usedScene(sp, "thing"));
    if (tk) {
      const target = rollers.slice().sort((a, b) => a.est.p - b.est.p)[0];
      if (target && (obs.objective || this.pressure >= 0.5 || target.est.p < 0.75)) {
        this.markScene(tk, "thing"); tk.acted = true; tk.everActed = true;
        target.sp.bonusNext += 2;
        rec.use("sig:tinkerer", true);
      } else if (threats.length) {
        this.markScene(tk, "thing"); tk.acted = true; tk.everActed = true;
        this.suppress(threats, 1, "sig:tinkerer");
      }
    }
    // Field Repair: Engineering D2, adjacent, once per scene.
    const fr = idle().find(sp => sp.perks.has("field-repair") && !this.usedScene(sp, "fr"));
    if (fr) {
      const patient = crew.filter(sp => sp.vit >= HURT && sp.vit < OUT).sort((a, b) => b.vit - a.vit)[0];
      if (patient) {
        this.markScene(fr, "fr"); fr.acted = true; fr.everActed = true;
        const pool = fr.attrs.wit + fr.skills.engineering - this.pen(fr);
        const s = pool > 0 ? this.succ(rng.dice(pool)) : 0;
        if (s >= 1) { patient.vit -= 1; rec.inc("recover:fieldRepair"); }
        rec.use("perk:field-repair", s >= 1);
      }
    }
    // Helpers can only be idle spiders.
    this.helpers = this.helpers.filter(h => !h.acted);
  }

  /* ------------------------------------------------------ threat phase -- */

  threatPhase(cleared = false) {
    // Threats act on their own (param threatTurn = everyRound): each engaged attacker hits a spider still exposed.
    if (this.P.threatTurn === "everyRound" && !cleared) {
      const exposed = this.present().filter(sp => !sp.passed);
      const pool = exposed.length ? exposed : [];
      const seen = new Set();
      for (const id of this.creatureIds) {
        if (!pool.length || this.loss) break;
        const c = CREATURES[id], st = this.cs[id];
        if (!c.attack || !this.activeHere(id)) continue;
        if (c.attackOnlyHunting && this.escAlert < c.hunt) continue;
        if (c.attackOnlyBad && !st.bad) continue;
      if (st.shut && this.P.weaknessRule === "backoff") continue;   // P6: shut in, it can't strike
        const engaged = this.obs.threats?.includes(id) || this.escAlert >= c.hunt || (this.obs.phase === "escape" && this.fullAlert);
        if (!engaged) continue;
        seen.add(id);
        const live = pool.filter(sp => !sp.out);
        if (!live.length) break;
        const t = this.sceneBruiser && !this.sceneBruiser.out ? this.sceneBruiser : this.rng.pick(live);
        this.rec.inc("threatTurnAttacks");
        this.resolveHit(t, { id, pool: c.attack.pool, label: `${c.name} ${c.attack.label}` });
      }
      if (!seen.size && this.obs.phase === "escape" && this.fullAlert && this.P.fullAlertPursuit > 0) {
        const live = pool.filter(sp => !sp.out);
        if (live.length) { this.rec.inc("threatTurnAttacks"); this.resolveHit(this.rng.pick(live), { id: "pursuit", pool: this.P.fullAlertPursuit, label: "Full Alert pursuit" }); }
      }
      if (this.loss) return;
    }
    // Package: a human obstacle adds its own +X each round the crew spends in its sight.
    if (this.P.humanAlert > 0 && this.obs.tags.includes("human") && !(this.decoyRounds > 0)) {
      this.addAlert(this.P.humanAlert, "human");
      this.rec.inc("humanRounds");
    }
    for (const id of this.creatureIds) {
      const st = this.cs[id], c = CREATURES[id];
      if (st.suppressed > 0) { st.suppressed--; continue; }
      if (c.perRound > 0 && this.active(id) && this.isHere(id)) {
        this.addAlert(c.perRound, "creature");
        this.rec.inc(`creatureRounds:${id}`);
      }
    }
  }

  /* --------------------------------------------------------------- gap -- */

  gap() {
    const P = this.P;
    const crew = this.present();
    if (this.lootDropped) {
      if (crew.length) { this.lootHolder = crew[0]; this.lootDropped = false; this.rec.inc("lootPickedUp"); }
    }
    // The quiet gap between obstacles: one level back, once per obstacle.
    for (const sp of crew) this.recover(sp, "gap");
    // Hand the loot to the safest carrier.
    if (this.lootHolder && !this.lootHolder.escaped && P.lootCarrier === "safest" && crew.length) {
      const best = crew.slice().sort((a, b) => this.carryScore(b) - this.carryScore(a))[0];
      if (best !== this.lootHolder) { this.lootHolder = best; this.rec.inc("lootHandoffs"); }
    }
  }

  carryScore(sp) {
    return (sp.flaw === "butterfingers" ? -10 : 0) - sp.vit * 3 + sp.attrs.body + sp.skills.endurance + sp.attrs.grace / 2;
  }

  /* ------------------------------------------------------------ finish -- */

  finish() {
    const rec = this.rec, h = this.h;
    let outcome;
    if (this.loss) {
      outcome = "loss";
      rec.issue("CREW_WIPE", `${h.id} ${this.obs.id}: every spider Out (Alert ${this.alert}/${this.limit})`);
    } else {
      const lootOut = this.objectiveTaken && !this.lootLost &&
        (this.lootEscaped || (this.lootHolder && this.lootHolder.escaped));
      outcome = lootOut ? "win" : "partial";
      if (this.objectiveTaken && !lootOut) rec.inc("lootLostInEscape");
    }
    const ap = outcome === "win" ? AP[h.difficulty] : outcome === "partial" ? Math.floor(AP[h.difficulty] / 2) : 0;
    // v4.8 (REVIEW G, N13): a player whose spider is caught in the last Escape obstacle earns half AP.
    if (this.lastOuts && outcome !== "loss") { rec.inc("runsHalfAP"); if (outcome === "win") rec.inc("winsHalfAP"); rec.inc("playersHalfAP", this.lastOuts); }

    // Creature-driven Full Alert
    if (this.fullAlert) {
      const gained = this.alertGained;
      const ca = this.creatureAlertAtFull ?? this.creatureAlert;
      if (ca * 2 >= gained && ca > 0) rec.issue("CREATURE_DROVE_FULL_ALERT", `${h.id}: ${ca} of ${gained} Alert from creatures by Full Alert (at ${this.fullAlertAt})`);
      if (ca >= this.limit) rec.issue("CREATURE_ALONE_FULL_ALERT", `${h.id}: creatures alone added ${ca} ≥ Limit ${this.limit}`);
    }
    // Silk accounting, hoarding, replacements, flaws that never fired
    for (const s of this.slots) {
      for (const sp of s.spiders) {
        if (!sp.arrived) continue;
        rec.inc("silkStart", sp.silkStart);
        rec.inc("silkEnd", Math.max(0, sp.silk));
        rec.inc("spidersPlayed");
        // Share of the starting Silk actually spent (gross spends; Silk earned mid-heist can push it past 1).
        if (sp.silkStart > 0) {
          const frac = (sp.silkSpent ?? 0) / sp.silkStart;
          rec.inc(`silkFrac:${Math.min(10, Math.floor(10 * frac + 1e-9))}`);
          if (frac >= 0.5) rec.inc("spidersSpentHalf");
          rec.inc("silkSpentGross", sp.silkSpent ?? 0);
          rec.inc("spidersWithSilk");
        }
        if (sp.silkStart > 0 && sp.silk >= 0.75 * sp.silkStart) { rec.inc("spidersHoarded"); rec.issue("SILK_HOARDED", `${h.id}: ${sp.name} (${sp.role}) ended with ${sp.silk}/${sp.silkStart} SP`); }
        if (sp.isReplacement && !sp.everActed) rec.issue("REPLACEMENT_NEVER_ACTS", `${h.id}: ${sp.name} arrived at ${this.seq[sp.arrivedAt]?.id}`);
      }
      const f = s.tpl.flaw;
      if (ONCE_PER_HEIST_FLAWS.has(f) && !s.flawFired) {
        rec.inc(`flawNeverFired:${f}`);
        rec.issue("FLAW_NEVER_FIRES", `${h.id}: ${f}`);
      }
      if (f === "fear-of-vacuums" && !this.vacuumSeen) { rec.inc("flawNeverFired:fear-of-vacuums"); rec.issue("FLAW_NEVER_FIRES", `${h.id}: fear-of-vacuums (no vacuum in the heist)`); }
      if ((f === "loud" || f === "arachnophobe-magnet") && !s.flawSilk) rec.inc(`flawNeverFired:${f}`);
    }
    rec.inc("fullAlert", this.fullAlert ? 1 : 0);
    rec.inc("alertEnd", this.alert);
    const crewKeys = new Set();
    for (const s of this.slots) {
      crewKeys.add(`species:${s.tpl.species}`);
      crewKeys.add(`role:${s.tpl.role}`);
      for (const p of s.tpl.perks) crewKeys.add(`perk:${p}`);
      crewKeys.add(`flaw:${s.tpl.flaw}`);
    }
    this.log(`DEBRIEF: ${outcome}, ${ap} AP each, ${this.outs} Out, final Alert ${this.alert}/${this.limit}`);
    const result = { outcome, ap, outs: this.outs, fullAlertAt: this.fullAlertAt, alert: this.alert, trace: this.trace };
    rec.endRun(result, crewKeys);
    return result;
  }
}

export function runHeist(heist, templates, P, rng, rec) {
  return new HeistRun(heist, templates, P, rng, rec).run();
}
