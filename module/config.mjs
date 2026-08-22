/**
 * HEISTY SPIDEYS — System Configuration
 * -------------------------------------
 * Static, version-agnostic game data: the four Attributes, twelve Skills, the
 * Vitality ladder, Difficulty rungs, the Alert track, and the Silk Point economy.
 * Everything here is pure data so it can be reused by data models, sheets, the
 * dice engine, and the Alert HUD without importing any Foundry APIs.
 */

export const HEISTY = {};

HEISTY.id = "heisty-spideys";

/* -------------------------------------------- */
/*  Attributes                                  */
/* -------------------------------------------- */

/**
 * The four Attributes. `abbr` is shown on the sheet; `hint` is the book's own
 * one-line description of what the Attribute covers.
 */
HEISTY.attributes = {
  body: {
    label: "Body",
    abbr: "BODY",
    hint: "Physical power and toughness. Brawling, sprinting, absorbing hits, carrying things that are technically too heavy."
  },
  wit: {
    label: "Wit",
    abbr: "WIT",
    hint: "Intelligence and observation. Engineering, spotting what others miss, tactics, planning."
  },
  nerve: {
    label: "Nerve",
    abbr: "NERVE",
    hint: "Composure and social confidence, including lying to a cat. Stealth, deception, intimidation."
  },
  grace: {
    label: "Grace",
    abbr: "GRACE",
    hint: "Agility and dexterity. Acrobatics, disguise, persuasion — and it sets your Speed. Charm is physical."
  }
};

/* -------------------------------------------- */
/*  Skills                                      */
/* -------------------------------------------- */

/** The twelve Skills, each keyed to its governing Attribute. Skills run 0–5. */
HEISTY.skills = {
  athletics: { label: "Athletics", attr: "body", hint: "Running, climbing, jumping, hauling." },
  brawl: { label: "Brawl", attr: "body", hint: "Fighting, grappling, applying spider to problem." },
  endurance: { label: "Endurance", attr: "body", hint: "Taking hits, staying up, working hurt." },
  engineering: { label: "Engineering", attr: "wit", hint: "Building, breaking, fixing, understanding mechanisms." },
  perception: { label: "Perception", attr: "wit", hint: "Noticing things, reading a room, spotting danger." },
  tactics: { label: "Tactics", attr: "wit", hint: "Planning, coordinating, thinking ahead." },
  stealth: { label: "Stealth", attr: "nerve", hint: "Moving silently, staying unseen." },
  deception: { label: "Deception", attr: "nerve", hint: "Lying, misdirecting, holding a story under pressure." },
  intimidation: { label: "Intimidation", attr: "nerve", hint: "Making things afraid of you. Yes, as a spider." },
  acrobatics: { label: "Acrobatics", attr: "grace", hint: "Precision movement, tumbling, tight spaces." },
  persuasion: { label: "Persuasion", attr: "grace", hint: "Winning people over with charm." },
  disguise: { label: "Disguise", attr: "grace", hint: "Altering appearance, performing false identities." }
};

/** Skills grouped under their Attribute, in book order, for sheet layout. */
HEISTY.skillsByAttribute = {
  body: ["athletics", "brawl", "endurance"],
  wit: ["engineering", "perception", "tactics"],
  nerve: ["stealth", "deception", "intimidation"],
  grace: ["acrobatics", "persuasion", "disguise"]
};

/** Skill rating flavor, 0–5. */
HEISTY.skillRatings = {
  0: "Untrained — never really done it.",
  1: "Dabbler — tried it a few times.",
  2: "Competent — reliable under normal circumstances.",
  3: "Skilled — this is your thing.",
  4: "Expert — one of the best in the building.",
  5: "Legendary — maximum spider."
};

/* -------------------------------------------- */
/*  Vitality                                    */
/* -------------------------------------------- */

/**
 * The Vitality ladder. `penalty` is the dice-pool modifier applied to every
 * roll; `halfSpeed` halves movement (round down); `out` removes the spider.
 */
HEISTY.vitality = {
  unharmed: { label: "Unharmed", order: 0, penalty: 0, halfSpeed: false, out: false, hint: "Full capabilities. The cat hasn't found you." },
  rattled: { label: "Rattled", order: 1, penalty: -1, halfSpeed: false, out: false, hint: "Shaken, bruised, or briefly jarred. −1 die on all rolls." },
  hurt: { label: "Hurt", order: 2, penalty: -2, halfSpeed: true, out: false, hint: "You're limping. −2 dice on everything, and your Speed is halved." },
  critical: { label: "Critical", order: 3, penalty: -3, halfSpeed: true, out: false, hint: "A crewmate must help you move. You can still act, barely. −3 dice." },
  out: { label: "Out", order: 4, penalty: 0, halfSpeed: true, out: true, hint: "Caught. Jarred, vacuumed, or adopted. Activate the Waiting Web." }
};

/** Ordered Vitality keys, best → worst. */
HEISTY.vitalityOrder = ["unharmed", "rattled", "hurt", "critical", "out"];

/* -------------------------------------------- */
/*  Difficulty                                  */
/* -------------------------------------------- */

/** Difficulty rungs. `value` is the number of Successes the task needs. */
HEISTY.difficulties = {
  1: { label: "Trivial", hint: "Crossing an empty counter. Nothing is happening." },
  2: { label: "Easy", hint: "Moving quietly while the TV is on." },
  3: { label: "Moderate", hint: "Picking a lock. Sneaking past a drowsy cat. Most of a normal heist." },
  4: { label: "Hard", hint: "Sneaking past an alert cat. Cracking a password. Surviving the exterminator." },
  5: { label: "Absurd", hint: "Stealing a specific item from a locked case while the cat watches and the vacuum is running." }
};

/* -------------------------------------------- */
/*  The Alert                                   */
/* -------------------------------------------- */

/** Alert Limits by location difficulty — the number that defines the heist. */
HEISTY.alertLimits = {
  easy: { label: "Easy", value: 10, hint: "A mostly empty house. Light traffic. One cat, and it's elderly." },
  standard: { label: "Standard", value: 8, hint: "Occupied home with pets. A small office. A restaurant after hours." },
  hard: { label: "Hard", value: 6, hint: "An active office. A pet store with several animals. An attentive librarian." },
  absurd: { label: "Absurd", value: 4, hint: "Anywhere with a cat and a dog and a human who sleeps lightly." },
  legendary: { label: "Legendary", value: 2, hint: "So locked down it's barely worth it. The job pays 8 AP. That's why." }
};

/**
 * Alert threshold bands. Each band carries the mechanical effect at that range.
 * `stealth` / `all` are Difficulty increases. Note the classic trap: Active
 * (5–6) turns threats ON but adds no roll penalty; only Lockdown (7+) raises
 * Difficulty. Penalties stack, so at 7+ Stealth is +2 total.
 */
HEISTY.alertBands = [
  { key: "calm", min: 0, max: 2, label: "Calm", stealth: 0, all: 0, description: "The plan is working. Enjoy it. It won't last." },
  { key: "stirring", min: 3, max: 4, label: "Stirring", stealth: 1, all: 0, description: "Something feels off. Stealth rolls are +1 Difficulty." },
  { key: "active", min: 5, max: 6, label: "Active", stealth: 1, all: 0, description: "A threat has woken up. It's moving now — no new roll penalty yet." },
  { key: "lockdown", min: 7, max: 8, label: "Lockdown", stealth: 2, all: 1, description: "Everything is wrong. All rolls +1 (Stealth +2, stacked)." }
];

/** What pushes the Alert up (and the one thing that pulls it down). */
HEISTY.alertTriggers = [
  { delta: 1, text: "A roll fails with a consequence — noise, attention, evidence." },
  { delta: 1, text: "Spotted briefly — an NPC notices something's off but isn't sure." },
  { delta: 1, text: "A Silk Clutch is used. The universe keeps score." },
  { delta: 2, text: "A Botch. Everything that could go wrong did, plus one new thing." },
  { delta: 2, text: "A confirmed alert — an NPC knows something is happening." },
  { delta: 2, text: "A spider goes Out. The location notices something is very wrong." },
  { delta: 2, text: "A Loud Failure — something loud breaks, a crash that carries." },
  { delta: -1, text: "A Critical Success. The only thing that lowers the Alert during a heist." }
];

/* -------------------------------------------- */
/*  Silk Points                                 */
/* -------------------------------------------- */

/** Ways to spend Silk Points. */
HEISTY.silkSpends = [
  { cost: 1, label: "Extra Die", text: "Add 1 die to a roll before it's made. The most common spend, and a good one." },
  { cost: 1, label: "Silk Line", text: "Instantly run a silk line between two points up to 5 squares apart. No roll." },
  { cost: 2, label: "Reroll", text: "After rolling, reroll up to 3 dice and keep the better result." },
  { cost: 2, label: "Web Structure", text: "Build a small web structure with no roll — a net, a tripwire, a platform, a hammock." },
  { cost: 2, label: "Improvise", text: "Attempt any check on your Attribute alone — no Skill — at +1 Difficulty." },
  { cost: 3, label: "Silk Clutch", text: "After a failed roll, succeed anyway. The Alert rises by 1." },
  { cost: 3, label: "Damage Control", text: "The crew reduces one +2 Alert spike to +1. Once per heist." },
  { cost: 4, label: "Not Part of the Plan", text: "Negate one complication the ST just introduced. Once per heist." }
];

/** Ways to earn Silk Points back. */
HEISTY.silkEarns = [
  { reward: 1, label: "Flaw Moment", text: "Your Flaw causes a genuine problem the crew has to deal with." },
  { reward: 1, label: "Spectacular Failure", text: "You fail in a way that genuinely makes the table laugh. ST's call." },
  { reward: 1, label: "Creative Species Use", text: "You use your species ability in a way nobody saw coming, and it works." },
  { reward: 2, label: "Brilliant Plan", text: "You describe a plan that makes the whole table lean in and say 'oh, that's good.'" }
];

/* -------------------------------------------- */
/*  Roll result categories                      */
/* -------------------------------------------- */

/** Outcome categories produced by the dice engine. */
HEISTY.results = {
  critical: { label: "Critical Success", css: "critical", alert: -1, blurb: "You did it perfectly — and the Alert drops by 1. Savor it." },
  success: { label: "Full Success", css: "success", alert: 0, blurb: "It worked. The thing happens. The Alert is still right there." },
  partial: { label: "Partial Success", css: "partial", alert: 1, blurb: "It worked, but. Progress, and a complication lands." },
  failure: { label: "Failure", css: "failure", alert: 1, blurb: "It did not work. No progress, and something gets worse." },
  botch: { label: "Botch", css: "botch", alert: 2, blurb: "Everything that could go wrong did, plus one new thing." },
  cleanfail: { label: "Clean Failure", css: "cleanfail", alert: 0, blurb: "You fail — but no bonus disaster. This time." }
};

/* -------------------------------------------- */
/*  Species (mechanical summary)                */
/* -------------------------------------------- */

/**
 * Mechanical summary of the six Species. Full prose lives in the Species
 * compendium; this table drives Attribute-bonus derivation and quick reference.
 */
HEISTY.species = {
  jumping: { label: "Jumping Spider", speed: 6, bonuses: { body: 1, grace: 1 }, ability: "Did You See That Jump?!" },
  orbweaver: { label: "Orb Weaver", speed: 5, bonuses: { wit: 2 }, ability: "Everything Connects" },
  wolf: { label: "Wolf Spider", speed: 7, bonuses: { body: 2 }, ability: "Run It Again" },
  cellar: { label: "Cellar Spider", speed: 5, bonuses: { grace: 2 }, ability: "Contortionist" },
  spitting: { label: "Spitting Spider", speed: 5, bonuses: { wit: 2, nerve: 1 }, ability: "Precision Application" },
  crab: { label: "Crab Spider", speed: 4, bonuses: { nerve: 1, grace: 1 }, ability: "Wait, Was That There Before?" }
};

/* -------------------------------------------- */
/*  Roles (mechanical summary)                  */
/* -------------------------------------------- */

/** Mechanical summary of the seven Crew Roles. Full prose lives in compendium. */
HEISTY.roles = {
  face: { label: "The Face", coreSkills: ["deception", "persuasion"], signature: "That's Not What Happened" },
  ghost: { label: "The Ghost", coreSkills: ["stealth", "acrobatics"], signature: "Phase Through" },
  tinkerer: { label: "The Tinkerer", coreSkills: ["engineering", "perception"], signature: "I Made a Thing" },
  bruiser: { label: "The Bruiser", coreSkills: ["brawl", "endurance"], signature: "Make a Scene" },
  lookout: { label: "The Lookout", coreSkills: ["perception", "tactics"], signature: "I Called It" },
  wheelman: { label: "The Wheelman", coreSkills: ["acrobatics", "tactics"], signature: "I Know a Way" },
  grifter: { label: "The Grifter", coreSkills: ["deception", "disguise"], signature: "You're Looking at the Wrong Spider" }
};

/** Advancement Point costs and awards. */
HEISTY.advancement = {
  spend: [
    { cost: 1, text: "+1 to a Skill" },
    { cost: 2, text: "+1 to an Attribute" },
    { cost: 3, text: "A new Perk from your Role list (no maximum)" }
  ],
  awards: {
    easy: 2,
    standard: 3,
    hard: 5,
    legendary: 8
  }
};

/** Loot tiers. */
HEISTY.lootTiers = {
  crumb: { label: "Crumb", difficulty: "Trivial", hint: "A single bit of food, a small charm, a coin." },
  trinket: { label: "Trinket", difficulty: "Easy", hint: "A small shiny thing, a memory stick, a piece of jewelry." },
  prize: { label: "Prize", difficulty: "Standard", hint: "Something significant — the main event of a proper heist." },
  treasure: { label: "Treasure", difficulty: "Hard", hint: "High value, high security, genuinely dangerous to take." },
  score: { label: "The Score", difficulty: "Legendary", hint: "The kind of job spiders tell the spiderlings about." }
};

/** Item type labels for sheet headers and drop hints. */
HEISTY.itemTypes = {
  species: "Species",
  role: "Crew Role",
  perk: "Perk",
  flaw: "Flaw",
  gadget: "Silk & Gadget"
};

/**
 * Resolve the Alert band for a given Alert value and Limit.
 * At or above the Limit the location is at Full Alert regardless of band.
 * @param {number} value  Current Alert.
 * @param {number} limit  The location's Alert Limit.
 * @returns {{key:string,label:string,stealth:number,all:number,description:string,atLimit:boolean}}
 */
HEISTY.getAlertState = function (value, limit) {
  const v = Math.max(0, Number(value) || 0);
  const lim = Number(limit) || 8;
  const atLimit = v >= lim;
  let band = HEISTY.alertBands[HEISTY.alertBands.length - 1];
  for (const b of HEISTY.alertBands) {
    if (v >= b.min && v <= b.max) { band = b; break; }
  }
  if (v > 8) band = HEISTY.alertBands[HEISTY.alertBands.length - 1];
  return {
    key: atLimit ? "fullalert" : band.key,
    label: atLimit ? "Full Alert" : band.label,
    stealth: band.stealth,
    all: band.all,
    description: atLimit
      ? "The location is compromised. The objective is out of reach — escape is the only play."
      : band.description,
    atLimit
  };
};
