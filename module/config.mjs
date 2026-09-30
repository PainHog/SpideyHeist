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
    hint: "Agility and dexterity. Acrobatics, disguise, persuasion. Charm is physical."
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
 * roll; `halfSpeed` halves movement (round down); `assisted` means the spider
 * can't move on its own — an adjacent crewmate brings it along at half *their*
 * Speed (so its own Speed reads 0); `out` removes the spider.
 */
HEISTY.vitality = {
  unharmed: { label: "Unharmed", order: 0, penalty: 0, halfSpeed: false, assisted: false, out: false, hint: "Full capabilities. The cat hasn't found you." },
  rattled: { label: "Rattled", order: 1, penalty: -1, halfSpeed: false, assisted: false, out: false, hint: "Shaken, bruised, or briefly jarred. −1 die on all rolls." },
  hurt: { label: "Hurt", order: 2, penalty: -2, halfSpeed: true, assisted: false, out: false, hint: "You're limping. −2 dice on everything, and your Speed is halved (round down)." },
  critical: { label: "Critical", order: 3, penalty: -3, halfSpeed: false, assisted: true, out: false, hint: "You can't move on your own — an adjacent crewmate can bring you along at half their Speed. You can still act, barely. −3 dice." },
  out: { label: "Out", order: 4, penalty: 0, halfSpeed: true, assisted: false, out: true, hint: "Caught. Jarred, vacuumed, or adopted. Activate the Waiting Web." }
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
 * (5–6) turns threats ON but adds no NEW roll penalty — the Stirring Stealth +1
 * carries on through it; only Lockdown (7+) adds more. Penalties stack, so at
 * 7+ Stealth is +2 total. Full Alert (at the Limit) always brings the Lockdown
 * penalties, whatever the Limit — see getAlertState.
 */
HEISTY.alertBands = [
  { key: "calm", min: 0, max: 2, label: "Calm", stealth: 0, all: 0, description: "The plan is working. Enjoy it. It won't last." },
  { key: "stirring", min: 3, max: 4, label: "Stirring", stealth: 1, all: 0, description: "Something feels off. Stealth rolls are +1 Difficulty." },
  { key: "active", min: 5, max: 6, label: "Active", stealth: 1, all: 0, description: "A threat has woken up. It's moving now. The Stirring Stealth +1 still applies; no new penalty yet." },
  { key: "lockdown", min: 7, max: Infinity, label: "Lockdown", stealth: 2, all: 1, description: "Everything is wrong. All rolls +1 (Stealth +2, stacked)." }
];

/** What pushes the Alert up (and the one thing that pulls it down). `delta: null` varies by creature. */
HEISTY.alertTriggers = [
  { delta: 1, text: "A roll fails with a consequence — noise, attention, evidence." },
  { delta: 1, text: "A Partial Success's complication (unless the ST chose another cost)." },
  { delta: 1, text: "Spotted briefly — an NPC notices something's off but isn't sure." },
  { delta: 1, text: "A Silk Clutch is used. The universe keeps score." },
  { delta: 2, text: "A Botch. Everything that could go wrong did, plus one new thing." },
  { delta: 2, text: "A confirmed alert — an NPC knows something is happening." },
  { delta: 2, text: "A spider goes Out. The location notices something is very wrong." },
  { delta: 2, text: "A Loud Failure — something loud breaks, a crash that carries." },
  { delta: null, text: "+X — a creature's own contribution each round it's active (see its stat block). A creature is active from the first Escalation step the Alert has reached — or from the start, if the heist says it is awake or aware — and stays active for the rest of the heist. It adds its +X at the end of every round the crew spends at its obstacle, and at every obstacle once it roams." },
  { delta: -1, text: "A Critical Success on a roll of Difficulty 3 or higher (after every modifier), never at Full Alert and never below 0. The only thing that lowers the Alert during a heist." }
];

/**
 * One event, one trigger (rulebook v4.7): a single roll or moment raises the
 * Alert once, by its largest entry — a Failure that gets you spotted is +1,
 * not +2.
 */
HEISTY.alertOneTrigger = "One event, one trigger: a single roll or moment raises the Alert once, by its largest entry. A Failure that gets you spotted is +1, not +2.";

/* -------------------------------------------- */
/*  Silk Points                                 */
/* -------------------------------------------- */

/** Ways to spend Silk Points. */
HEISTY.silkSpends = [
  { cost: 1, label: "Extra Die", text: "Add 1 die to a roll before it's made. The most common spend, and a good one. Silk dice don't count toward the +2 bonus-dice limit." },
  { cost: 1, label: "Silk Line", text: "Run a silk line between two points up to 5 squares apart without the roll (GRACE + Acrobatics, Difficulty 2)." },
  { cost: 2, label: "Reroll", text: "After rolling, reroll up to 3 dice that didn't succeed. Your Successes stay, so it can only help." },
  { cost: 2, label: "Web Structure", text: "Build a small web structure with no roll — a net, a tripwire, a platform, a hammock." },
  { cost: 2, label: "Improvise", text: "Swap the called-for Skill for one of yours that could plausibly work — Engineering to rig a hoist instead of Athletics to climb, Deception instead of Stealth — at +1 Difficulty, rolled with the new Skill's own Attribute." },
  { cost: 3, label: "Silk Clutch", text: "After a Failure (a Partial isn't one), turn it into a Success. The Alert rises by 1." },
  { cost: 3, label: "Damage Control", text: "The crew spends 3 SP between them, split any way, to reduce one Alert spike of +2 or more by 1. Once per heist." },
  { cost: 4, label: "Not Part of the Plan", text: "Negate one complication the ST just introduced. Once per heist." }
];

/** Ways to earn Silk Points back. */
HEISTY.silkEarns = [
  { reward: 1, label: "Flaw Moment", text: "Your Flaw causes a genuine problem the crew has to deal with — once each time it fires; no Flaw pays twice." },
  { reward: 1, label: "Spectacular Failure", text: "You fail in a way that genuinely makes the table laugh. ST's call." },
  { reward: 1, label: "Creative Species Use", text: "You use your species ability in a way nobody saw coming, and it works." },
  { reward: 2, label: "Brilliant Plan", text: "You describe a plan that makes the whole table lean in and say 'oh, that's good.'" }
];

/* -------------------------------------------- */
/*  Roll result categories                      */
/* -------------------------------------------- */

/** Outcome categories produced by the dice engine. */
HEISTY.results = {
  critical: { label: "Critical Success", css: "critical", alert: -1, blurb: "You did it perfectly — and the Alert drops by 1 (only on a roll of Difficulty 3 or higher after every modifier, never at Full Alert, never below 0). Savor it." },
  success: { label: "Full Success", css: "success", alert: 0, blurb: "It worked. The thing happens. The Alert is still right there." },
  partial: { label: "Partial Success", css: "partial", alert: 1, blurb: "It worked, but. Progress, and a complication lands: +1 Alert, or a complication that costs as much — never both. A Partial is never a failed roll: it passes a pass-or-fail check, and it can't be Clutched." },
  failure: { label: "Failure", css: "failure", alert: 1, blurb: "It did not work — fewer than half the Successes you needed. No progress, and something gets worse. A Silk Clutch (3 SP, +1 Alert) can turn this Failure into a Success." },
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

/**
 * Mechanical summary of the seven Crew Roles. Full prose lives in compendium.
 * `quickPick` is the Role's Chapter 20 skill package (on top of both core
 * skills at 3); `perks` is its Perk table in book order (the 1d6 Perk roll
 * counts down this list).
 */
HEISTY.roles = {
  face: {
    label: "The Face", coreSkills: ["deception", "persuasion"], signature: "That's Not What Happened",
    quickPick: { stealth: 3, perception: 2, disguise: 2, intimidation: 2 },
    perks: ["Silver Tongue", "Read the Room", "Plausible Deniability", "Fast Talk", "Actually, I Planned This", "Familiar Face"]
  },
  ghost: {
    label: "The Ghost", coreSkills: ["stealth", "acrobatics"], signature: "Phase Through",
    quickPick: { perception: 3, athletics: 2, deception: 2, engineering: 2 },
    perks: ["Silk Trail", "Dead Drop", "Soundless", "Second-Story Spider", "Ghost Protocol", "I Was Never Here"]
  },
  tinkerer: {
    label: "The Tinkerer", coreSkills: ["engineering", "perception"], signature: "I Made a Thing",
    quickPick: { stealth: 3, acrobatics: 2, tactics: 2, athletics: 2 },
    perks: ["Jury-Rig", "Spider-Sense… Sort Of", "Overclock", "Field Repair", "Trap Architect", "I See How This Works"]
  },
  bruiser: {
    label: "The Bruiser", coreSkills: ["brawl", "endurance"], signature: "Make a Scene",
    quickPick: { athletics: 3, stealth: 2, intimidation: 2, perception: 2 },
    perks: ["Take the Hit", "Unfazed", "Thunderous Entrance", "Negotiating Position", "Silk Grapple", "That All You Got?"]
  },
  lookout: {
    label: "The Lookout", coreSkills: ["perception", "tactics"], signature: "I Called It",
    quickPick: { stealth: 3, acrobatics: 2, engineering: 2, deception: 2 },
    perks: ["Early Warning", "Tactical Feed", "Pattern Recognition", "Contingency", "Escape Routes", "Counter-Surveillance"]
  },
  wheelman: {
    label: "The Wheelman", coreSkills: ["acrobatics", "tactics"], signature: "I Know a Way",
    quickPick: { athletics: 3, stealth: 2, perception: 2, endurance: 2 },
    perks: ["Always a Way Out", "Shortcut", "Don't Look Down", "Passenger", "Drafting", "Abort, Abort"]
  },
  grifter: {
    label: "The Grifter", coreSkills: ["deception", "disguise"], signature: "You're Looking at the Wrong Spider",
    quickPick: { stealth: 3, persuasion: 2, perception: 2, acrobatics: 2 },
    perks: ["Method Actor", "Double Bluff", "Planted Evidence", "Quick Change", "The Long Con", "Smoke and Mirrors"]
  }
};

/**
 * Advancement Point costs and awards. After creation, Skills and Attributes can
 * reach 5 (Attributes include the species bonus) — the data models' max of 5.
 */
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
    absurd: 6,
    legendary: 8
  }
};

/**
 * Loot tiers. `carry` is the rulebook v4.7 "Carrying It" column. Carriers
 * still act; handing loot over is free, picking it up takes an Action, and
 * anything bigger than a Trinket won't fit a squeeze (`fitsSqueeze`).
 */
HEISTY.lootTiers = {
  crumb: { label: "Crumb", difficulty: "Easy", hint: "A single bit of food, a small charm, a coin.", carry: "One spider, full Speed.", fitsSqueeze: true },
  trinket: { label: "Trinket", difficulty: "Easy", hint: "A small shiny thing, a memory stick, a piece of jewelry.", carry: "One spider, full Speed.", fitsSqueeze: true },
  prize: { label: "Prize", difficulty: "Standard", hint: "Something significant — the main event of a proper heist.", carry: "One at half Speed, or two at full.", fitsSqueeze: false },
  treasure: { label: "Treasure", difficulty: "Hard or Absurd", hint: "High value, high security, genuinely dangerous to take.", carry: "Two at half Speed, or a silk sled (1 SP) at full.", fitsSqueeze: false },
  score: { label: "The Big Score", difficulty: "Legendary", hint: "The kind of job spiders tell the spiderlings about.", carry: "Everyone, and a plan.", fitsSqueeze: false }
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
 * At or above the Limit the location is at Full Alert regardless of band, and
 * every roll takes the Lockdown penalties (all +1, Stealth +2) whatever the
 * Limit — a Limit of 6 or less reaches Full Alert before Lockdown, and Full
 * Alert brings the Lockdown penalties with it.
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
  const lockdown = HEISTY.alertBands.find(b => b.key === "lockdown");
  return {
    key: atLimit ? "fullalert" : band.key,
    label: atLimit ? "Full Alert" : band.label,
    stealth: atLimit ? Math.max(band.stealth, lockdown.stealth) : band.stealth,
    all: atLimit ? Math.max(band.all, lockdown.all) : band.all,
    description: atLimit
      ? "The location is compromised for the rest of the heist. The Alert is locked at the Limit, every roll takes the Lockdown penalties (all +1, Stealth +2), and a failed Escape roll gets that spider caught. Escape is the only play."
      : band.description,
    atLimit
  };
};
