/**
 * Every judgement the book leaves to the Storyteller (or leaves undefined) is a
 * named parameter here, with a default, the alternatives the report sweeps,
 * and the book passage that leaves it open. `run.mjs` re-runs every heist once
 * per alternative so the report can show what each judgement is worth.
 */

export const PARAMS = {
  partialCost: {
    default: "setback",
    alts: ["alert", "none"],
    title: "What a Partial Success's complication costs",
    doc: "alert = +1 Alert (variant a: what the Foundry system suggests, HEISTY.results.partial.alert = 1). setback = no Alert; the spider takes −1 die on its next roll (variant b: the Alert table lists no Partial trigger, but the complication must 'actually cost you something'; −1 die for a round is Ch 10's own 'glancing bump'). none = no mechanical cost.",
    ref: "Ch 2 Types of Results; Ch 9 What Raises the Alert; Ch 21"
  },
  groupRolls: {
    default: "individual",
    alts: ["leader"],
    title: "Who rolls when the whole crew must get past something",
    doc: "individual = every spider rolls for itself on movement/stealth obstacles (implied by Drafting 'each crewmate gets +1 die on movement rolls'). leader = one spider rolls for the crew. worstAlert (clarified baseline, not swept) = every spider rolls and passes on its own result, but the round's Alert comes only from the worst result, once.",
    ref: "Ch 2 (no group-roll rule); Ch 5 Drafting / Escape Routes / I Know a Way"
  },
  creatureRolls: {
    default: "static",
    alts: ["opposed"],
    title: "How creature obstacles are rolled",
    doc: "static = Ch 15 Toolkit Difficulty. opposed = spider vs the creature's Ch 16 pool (most Successes wins, ties to the world; no Partial or Critical exists for an opposed roll). rolled (clarified baseline, not swept) = the creature rolls its pool and its Successes + 1 become the Difficulty; every Difficulty modifier then applies and the roll reads Partial/Success/Critical as usual.",
    ref: "Ch 2 Opposed Rolls; Ch 15 vs Ch 16; Ch 19 Heist 2 'First real opposed roll'"
  },
  creatureWake: {
    default: "escalation",
    alts: ["hunt"],
    title: "When a creature counts as active (and adds its per-round Alert)",
    doc: "escalation = from the first Escalation step that wakes it (cat 3, snake 3, parrot 5) or when the heist text says it is awake/aware. hunt = only when hunting/pursuing (cat 7…) or when the text says so.",
    ref: "Ch 9 +X row / ruling B22; Ch 14 patrol example; Ch 16 Escalation lines"
  },
  creatureScope: {
    default: "presence",
    alts: ["obstacle", "location"],
    title: "Where an active creature's per-round Alert applies",
    doc: "presence = a mobile creature (the cat; a hunting snake; an aware guard spider) adds its Alert every round anywhere once active; caged/static ones only at their own obstacle. obstacle = only at its own obstacle. location = every active creature every round, everywhere (the most literal reading).",
    ref: "Ch 9 '+X A creature's own contribution each round it's active'"
  },
  creatureStaysActive: {
    default: true,
    alts: [false],
    title: "Does an awake creature stay awake?",
    doc: "true = once active, active for the rest of the heist (the Alert only goes up). false = active only while its Escalation threshold (or its own obstacle's text) says so.",
    ref: "Ch 16 Escalation (no 'goes back to sleep' rule)"
  },
  failureAttack: {
    default: true,
    alts: [false],
    title: "Does a Failure near an active threat get you hit?",
    doc: "true = on a Failure/Botch, an active threat present at the obstacle attacks the spider (Ch 10 Taking Hits). false = Failure only costs the +1 Alert.",
    ref: "Ch 2 'something gets worse'; Ch 10 Taking Hits"
  },
  threatTurn: {
    default: "onFailure",
    alts: ["everyRound"],
    title: "When threats attack",
    doc: "onFailure = a threat lands a hit only as the 'something worse' of a failed roll. everyRound = in the threat phase of every round, each engaged threat (active at its own obstacle, hunting, or pursuing at Full Alert) attacks a spider still exposed (Ch 3 'then the ST runs the threats').",
    ref: "Ch 3 Turn Order; Ch 10 Taking Hits; Ch 16 'When a creature acts against the crew'"
  },
  partialHit: {
    default: false,
    alts: [true],
    title: "Can a Partial's complication be a hit?",
    doc: "true = on a Partial next to an engaged threat, the threat also lands an attack (the ST's 'funniest complication that actually costs you something').",
    ref: "Ch 2 Partial Success"
  },
  humanAttackPool: {
    default: 0,
    alts: [3],
    title: "Do humans land hits?",
    doc: "Humans have no stat block or attack pool (Ch 16 points to Ch 15's Human Obstacles, which have only Difficulties). 0 = they never hit. 3 = a Failure at a human obstacle draws a 3-dice hit (the Human With Broom).",
    ref: "Ch 15 Human Obstacles; Ch 16 closing line"
  },
  fullAlertPursuit: {
    default: 0,
    alts: [4],
    title: "Does a Full Alert Escape have teeth?",
    doc: "0 = only creatures with attack pools can hurt the crew. 4 = at Full Alert every failed Escape roll draws a 4-dice hit from 'the location' (humans with brooms, a second vacuum…).",
    ref: "Ch 9 'Escape is the only play, and it will be memorable'; Ch 13 'play the lockdown'"
  },
  maxRounds: {
    default: 10,
    alts: [5, 20],
    title: "How many rounds an obstacle can take before the ST ends it",
    doc: "Failure is 'no progress' and nothing in the rules ends a run of failures except the Alert. After this many rounds: a heist obstacle is abandoned (objective lost if not yet taken); spiders stuck in the Escape are left behind (Out).",
    ref: "Ch 2 'Failure is a beat, not a wall'; Ch 13 'Make failure a door'"
  },
  obstacleSteps: {
    default: 1,
    alts: [2, 3],
    title: "How many successful rolls a heist obstacle needs",
    doc: "1 = one roll that meets it (a Partial counts: 'the lock opens, but you made noise'). 2 or 3 = the ST calls for a roll at each beat (approach, work, get clear) — each needs a Partial or better. Applies to single-roll obstacles; individual obstacles still need one pass per spider.",
    ref: "Ch 11 'each with a clear goal'; Ch 2 'When Not to Roll' — the book never says how many rolls an obstacle is"
  },
  crewSize: {
    default: 5,
    alts: [3],
    title: "Crew size",
    doc: "The brief is a crew of 5; the book supports 2–6 players.",
    ref: "Ch 1 What You Need"
  },
  intelValue: {
    default: "firstRoll",
    alts: ["none", "allRolls"],
    title: "What a piece of casing intel is worth",
    doc: "firstRoll = +1 die on each spider's first roll at an obstacle the crew has intel on. none = information only. allRolls = +1 die on every roll there. (A known climb also lets the crew pre-place a Silk Line — Ch 11 Preparation.)",
    ref: "Ch 11 Casing ('information, not a free win'); Ch 17"
  },
  silkLineBypass: {
    default: true,
    alts: [false],
    title: "Does a Silk Line skip climb/gap rolls?",
    doc: "true = as written: a Silk Line (1 SP, or GRACE+Acrobatics D2) is safe footing 'with no Acrobatics roll' for the crew. false = the ST still calls for rolls.",
    ref: "Ch 8 Silk Line; Ch 12 Silk Is the Universal Tool; Ch 11 Preparation"
  },
  slipperyDoubleMove: {
    default: true,
    alts: [false],
    title: "Slippery Surface: double movement instead of a roll",
    doc: "true = when no active threat is present, the crew takes double movement instead of rolling (Ch 3 / Ch 15 'costs double movement or a roll').",
    ref: "Ch 3 Slick surfaces; Ch 15 Slippery Surface"
  },
  cleanFailAlert: {
    default: 0,
    alts: [1],
    title: "Does a clean failure on the Botch die add the normal +1?",
    doc: "0 = 'a clean failure, no bonus disaster' adds nothing (rules.mjs). 1 = it is still a Failure and adds the Failure's +1.",
    ref: "Ch 2 The Botch"
  },
  improviseAttr: {
    default: "skill",
    alts: ["called"],
    title: "Which Attribute an Improvised Skill uses",
    doc: "skill = the swapped-in Skill's own Attribute. called = the Attribute the ST originally called for.",
    ref: "Ch 8 Improvise"
  },
  sceneIs: {
    default: "obstacle",
    alts: ["phase"],
    title: "What a 'scene' is (for once-per-scene abilities)",
    doc: "obstacle = every obstacle is a scene. phase = the Heist is one scene and the Escape another.",
    ref: "'Once per scene' appears ~20 times; 'scene' is never defined"
  },
  silkPolicy: {
    default: "greedy",
    alts: ["hoard", "spendy"],
    title: "Crew Silk Point spending policy",
    doc: "greedy = the book's advice: hoard early, prevent failures as the Alert nears the Limit, Clutch/Damage Control near the Limit. hoard = only Clutch/Damage Control to stop a Full Alert. spendy = spend whenever it helps.",
    ref: "Ch 8 Silk Point Management"
  },
  lootCarrier: {
    default: "safest",
    alts: ["taker"],
    title: "Who carries the loot out",
    doc: "safest = the crew hands the loot to its toughest spider without Butterfingers. taker = whoever grabbed it keeps it.",
    ref: "Not covered"
  },
  lootOnOut: {
    default: "pickup",
    alts: ["lost"],
    title: "What happens to the loot when its carrier goes Out",
    doc: "pickup = it drops; another spider spends an Action to grab it (Butterfingers' own rule). lost = it goes with the carrier (jarred, vacuumed…).",
    ref: "Not covered (Ch 10 Going Out; Ch 7 Butterfingers)"
  },
  escapeCount: {
    default: 2,
    alts: [1],
    title: "Escape obstacles per heist",
    doc: "Ch 11 says 1–2; the ready-to-run heists give none, so the simulator generates them.",
    ref: "Ch 11 Phase 4; Ch 19"
  },
  escapeDiffShift: {
    default: 0,
    alts: [1],
    title: "Escape Difficulty",
    doc: "0 = Easy location 2, otherwise 3. 1 = one harder.",
    ref: "Not given anywhere"
  },
  spectacularFailure: {
    default: 0.25,
    alts: [0, 0.75],
    title: "Chance a Botch earns +1 SP (Spectacular Failure, ST's call)",
    doc: "The table has to laugh. Applied to Botches only; ordinary Failures earn 1/5 of this.",
    ref: "Ch 8 Earning Silk Points"
  },
  creativeSpecies: {
    default: 0.2,
    alts: [0, 0.6],
    title: "Chance a species-ability use earns +1 SP (Creative Species Use)",
    doc: "'in a way nobody saw coming' — ST's call.",
    ref: "Ch 8 Earning Silk Points"
  },
  brilliantPlan: {
    default: 0.2,
    alts: [0, 0.8],
    title: "Chance the crew's plan earns +2 SP (Brilliant Plan)",
    doc: "Per heist, to the spider who pitches it.",
    ref: "Ch 8 Earning Silk Points"
  },
  flawTiming: {
    default: "random",
    alts: ["worst"],
    title: "When the ST fires once-per-heist Flaws",
    doc: "random = a random obstacle. worst = at the objective obstacle ('the worst available time', Ch 1).",
    ref: "Ch 7 Flaws ('the ST picks when')"
  },
  exterminator: {
    default: false,
    alts: [true],
    title: "Does the ST call the Exterminator at Lockdown?",
    doc: "Only possible where the Limit is above 7 (Heists 1–3).",
    ref: "Ch 16 The Exterminator"
  },
  midHeistComplications: {
    default: 0,
    alts: [0.5],
    title: "Chance per obstacle of a Ch 20 Mid-Heist Complication",
    doc: "d6 table: cat wakes; drawer; human up; vacuum (Fear of Vacuums); phone; +1 Alert.",
    ref: "Ch 20 Mid-Heist Complication"
  },
  bypassComplexLocks: {
    default: false,
    alts: [true],
    title: "Does 'I Made a Thing: Bypass' beat the antique lock?",
    doc: "Bypass defeats 'one small mechanical obstacle… pop a simple latch'. false = not the library's antique lock (Difficulty 4). true = any lock.",
    ref: "Ch 5 The Tinkerer"
  },
  spittingJamsLocks: {
    default: false,
    alts: [true],
    title: "Does the Spitting Spider's strand defeat locks and lids?",
    doc: "false = jamming defeats sensors only (a jammed lock stays locked). true = it also pops latches/lids/locks. The ability has no usage limit either way.",
    ref: "Ch 4 Precision Application"
  },
  assistFromPassed: {
    default: true,
    alts: [false],
    title: "Can a spider that already got past help one still crossing?",
    doc: "Assist needs adjacency; true = yes (they wait at the edge), false = no.",
    ref: "Ch 2 Assists; Ch 3 Adjacency"
  },
  replacementResets: {
    default: false,
    alts: [true],
    title: "Do Waiting Web replacements get fresh once-per-heist uses?",
    doc: "false = once per heist is per player. true = a new spider has its own.",
    ref: "Ch 10 Going Out"
  },
  nptpScope: {
    default: "spider",
    alts: ["crew"],
    title: "'Not Part of the Plan' once per heist — per spider or per crew?",
    doc: "Damage Control says 'the crew… once per heist'; Not Part of the Plan just says once per heist.",
    ref: "Ch 8 Spending Silk Points"
  },
  activeBandStealth: {
    default: 1,
    alts: [0],
    title: "Does the Stirring Stealth +1 continue through Active (5–6)?",
    doc: "1 = yes (config.mjs; the Storyteller Note says the Stirring and Lockdown penalties stack at 7+). 0 = the Active row read literally: 'No roll penalty yet'.",
    ref: "Ch 9 Alert Thresholds vs its Storyteller Note; Ch 21"
  },
  critAlertRule: {
    default: "book",
    alts: ["baseD3"],
    fix: true,
    title: "FIX EXPERIMENT — when a Critical lowers the Alert",
    doc: "book = final Difficulty 2+ (ruling B28). baseD3 = only on a base Difficulty of 3+ (before reducers), at most once per obstacle, never after Full Alert (the playtests' proposed fix).",
    ref: "Ch 2 Critical Success; playtest issues H1-16 / H2-I-13"
  },
  bonusDiceCap: {
    default: 99,
    alts: [3],
    fix: true,
    title: "FIX EXPERIMENT — cap on bonus dice from all non-Silk sources",
    doc: "99 = no cap (the book). 3 = Assist, intel, Make a Scene, Tactical Feed, I Called It, Boost, Decoy… add at most +3 dice to one roll (playtest proposal).",
    ref: "Ch 2 Assists; Ch 5; playtest issue H1-18"
  },
  spittingLimit: {
    default: "none",
    alts: ["scene"],
    fix: true,
    title: "FIX EXPERIMENT — Spitting Spider jam frequency",
    doc: "none = no usage limit (as written). scene = once per scene like every other active species ability.",
    ref: "Ch 4 Precision Application; playtest issue H2-I-10"
  },
  crewComposition: {
    default: "distinct",
    alts: ["ch20"],
    title: "Crew building",
    doc: "distinct = five different Roles (the book: 'the crew wants variety'). ch20 = every spider rolled on the Ch 20 tables.",
    ref: "Ch 7; Ch 20"
  },

  /* ---- Rule-change parameters used by the balance packages (sim/packages.mjs, BALANCE.md).
   * `pkg: true` keeps them out of run.mjs's sweeps; their defaults are the book as written,
   * so every existing run is unchanged. */
  successFace: {
    default: 4, alts: [5], pkg: true,
    title: "PACKAGE — lowest die face that counts as a Success",
    doc: "4 = 4–6 (the book). 5 = 5–6. Applies to every roll: the crew's, creatures' attacks and pools, shrug-offs, Casing.",
    ref: "Ch 2 The Core Mechanic; module/logic/rules.mjs SUCCESS_FACE"
  },
  critRule: {
    default: "double", alts: ["plus3", "plus2"], pkg: true,
    title: "PACKAGE — Successes a Critical needs",
    doc: "double = 2× Difficulty (the book). plus3 = Difficulty + 3. plus2 = Difficulty + 2.",
    ref: "Ch 2 Critical Success; module/logic/rules.mjs classifyResult"
  },
  partialRule: {
    default: "one", alts: ["half"], pkg: true,
    title: "PACKAGE — fewest Successes that still make a Partial",
    doc: "one = at least one Success (the book: Failure is zero Successes). half = at least half the Difficulty, rounded up (Failure is fewer).",
    ref: "Ch 2 Types of Results; module/logic/rules.mjs classifyResult"
  },
  critAlertMinDiff: {
    default: 2, alts: [3], pkg: true,
    title: "PACKAGE — lowest final Difficulty at which a Critical lowers the Alert",
    doc: "2 = ruling B28. 3 = Moderate or harder only.",
    ref: "Ch 2 Critical Success; module/logic/rules.mjs CRITICAL_ALERT_MIN_DIFFICULTY"
  },
  bonusCapScope: {
    default: "nonSilk", alts: ["all"], pkg: true,
    title: "PACKAGE — what bonusDiceCap counts",
    doc: "nonSilk = Assist, intel, Perks, Signature Moves (the fix experiment). all = Silk extra dice (and Overclock) count against the same cap.",
    ref: "Ch 2 Assists; Ch 8 Extra Die"
  },
  obstacleDiffShift: {
    default: 0, alts: [1], pkg: true,
    title: "PACKAGE — every obstacle's Difficulty shifted",
    doc: "+1 to every heist and Escape obstacle approach (and to a creature's rolled Difficulty): the Toolkit's 'calm location' numbers move up one step.",
    ref: "Ch 15 intro; Ch 19"
  },
  limitShift: {
    default: 0, alts: [-2], pkg: true,
    title: "PACKAGE — every location's Alert Limit shifted",
    doc: "−2 = Easy 8, Standard 6, Hard 4 (the Limit table moves down one row).",
    ref: "Ch 9 The Alert Limit"
  },
  humanAlert: {
    default: 0, alts: [1], pkg: true,
    title: "PACKAGE — a human obstacle's Alert Contribution",
    doc: "0 = humans never add Alert per round (the book gives them no stat block). 1 = +1 per round the crew spends at a human obstacle (playtest H5-H-2 'Alert Contribution +1 per round while searching'); a Grifter's Decoy pauses it.",
    ref: "Ch 15 Human Obstacles; Ch 16 closing line; playtests H2-I-9, H5-H-2"
  },
  pdLimit: {
    default: "scene", alts: ["heist"], pkg: true,
    title: "PACKAGE — Plausible Deniability frequency",
    doc: "scene = once per scene (the book). heist = once per heist.",
    ref: "Ch 5 The Face"
  },
  heistTweaks: {
    default: [], alts: [["office-cleaners-first"]], pkg: true,
    title: "PACKAGE — heist-level fixes (heists.mjs HEIST_TWEAKS)",
    doc: "A list of named tweaks to the Ch 19 heists.",
    ref: "Ch 19"
  },
  hitTies: {
    default: "defender", alts: ["attacker"], pkg: true,
    title: "PACKAGE — who wins a tie when you try to shrug off a hit",
    doc: "defender = you (the book: 'ties go to you'). attacker = the threat: a tie drops one level.",
    ref: "Ch 10 Taking Hits ('a solid hit from a real threat will get through more often than not')"
  },
  fullAlertFailure: {
    default: "none", alts: ["hit", "caught"], pkg: true,
    title: "PACKAGE — what a Failure in a Full Alert Escape costs",
    doc: "none = the usual (an engaged threat's hit). hit = the location lands a hit that can't be shrugged off (−1 level). caught = the spider is caught: Out.",
    ref: "Ch 9 At Limit ('it will be memorable'); Ch 13 'play the lockdown'"
  },
  fullAlertRule: {
    default: "book", alts: ["locked"], pkg: true,
    title: "CLARIFIED — what Full Alert is",
    doc: "book = the simulator's literal reading: the Alert keeps counting past the Limit, Criticals can lower it, and a Limit ≤ 6 location never reaches the Lockdown band. locked = once the Alert reaches the Limit it stops there for the rest of the heist, Criticals no longer lower it, and every roll takes the Lockdown penalties (all +1, Stealth +2); creature Escalations read it as Alert 7+.",
    ref: "Ch 9 At Limit; ruling B30; playtests H1-6, H2-I-37, H5-R-6/R-7"
  },
  casingRule: {
    default: "book", alts: ["capped"], pkg: true,
    title: "CLARIFIED — Casing cap",
    doc: "book = each Success reveals a fact; Familiar Face can reveal the unknown obstacle. capped = at most the heist's listed intel, and nothing (Familiar Face included) reveals the unknown obstacle.",
    ref: "Ch 11 Casing; Ch 13; playtests H1-8, H2-I-3, H5-P-1"
  },
  preLineRule: {
    default: "bypass", alts: ["minus1"], pkg: true,
    title: "CLARIFIED — a Silk Line pre-placed in Planning",
    doc: "bypass = the known climb/gap needs no roll (when silkLineBypass). minus1 = it lowers that obstacle's Difficulty by 1 instead ('Nothing in Planning auto-beats an obstacle'). A line run during the heist keeps its no-roll effect (silkLineBypass).",
    ref: "Ch 11 Preparation; Ch 12; playtest H1-7"
  },
  bypassRule: {
    default: "auto", alts: ["roll"], pkg: true,
    title: "CLARIFIED — I Made a Thing: Bypass",
    doc: "auto = no roll (the book). roll = the Tinkerer's Engineering roll against that small mechanical obstacle at −1 Difficulty (uses the once-per-scene gadget).",
    ref: "Ch 5 The Tinkerer; playtest H2-I-12"
  }
};

/**
 * The clarified baseline (BALANCE.md §1): one resolution for every rule the
 * playtests and REPORT.md found ambiguous. Packages sit on top of the strict
 * reading plus these, so anything the clarified baseline does not decide is
 * read against the crew.
 */
export const CLARIFIED = {
  sceneIs: "obstacle",                 // C1 a scene is one obstacle
  creatureWake: "escalation",          // C2 active from its Escalation step, or when the text says so…
  creatureStaysActive: true,           //    …and it stays active
  creatureScope: "presence",           //    its +X counts each round it can perceive the crew
  creatureRolls: "rolled",             // C3 an actively resisting creature's Successes + 1 set the Difficulty
  groupRolls: "worstAlert",            // C4 everyone rolls; the worst result sets the Alert, once
  obstacleSteps: 1,                    // C5 one roll clears an obstacle (retries cost a round)…
  failureAttack: true,                 //    …a Failure also draws an engaged threat's hit
  partialCost: "alert",                // C6 a Partial costs +1 Alert (once per group check)…
  partialHit: false,                   //    …or another complication of equal cost, never both
  fullAlertRule: "locked",             // C7 Full Alert: stops at the Limit, permanent, Lockdown penalties
  casingRule: "capped",                // C8 Casing is capped at the listed intel
  preLineRule: "minus1",               // C9 a pre-placed Silk Line lowers the Difficulty by 1
  silkLineBypass: true,                //    a Silk Line run during the heist still needs no roll
  spittingLimit: "scene",              // C10 jam/pin once per scene
  bypassRule: "roll",                  // C11 Bypass is an Engineering roll at −1 Difficulty
  activeBandStealth: 1                 //    (Ch 9 Active band: the Stirring +1 carries on)
};

/**
 * Candidate rule-change packages. Each one is applied on top of
 * PRESETS.strict + CLARIFIED (see packageParams).
 */
export const PACKAGES = {
  P0: { title: "Clarified baseline only", rules: {} },
  P1: { title: "P0 + Successes on 5–6 (Critical still 2× Difficulty)", rules: { successFace: 5 } },
  P2: { title: "P0 + at most +2 bonus dice per roll from every source (Assist, Perks, Signature Moves, intel, Silk) + a Critical lowers the Alert only at Difficulty 3+", rules: { bonusDiceCap: 2, bonusCapScope: "all", critAlertMinDiff: 3 } },
  P3: { title: "P0 + every obstacle Difficulty +1 + a Critical needs Difficulty + 3 Successes", rules: { obstacleDiffShift: 1, critRule: "plus3" } },
  P4: {
    title: "Recommended: P0 + Successes on 5–6 + a Partial needs half the Difficulty + a heist obstacle takes two successful rolls + a Critical lowers the Alert only at Difficulty 3+ + at most +2 non-Silk bonus dice + a Failure in a Full Alert Escape gets you caught + Ch 8 'spend your Silk' advice",
    rules: { successFace: 5, partialRule: "half", obstacleSteps: 2, critAlertMinDiff: 3, bonusDiceCap: 2, fullAlertFailure: "caught", silkPolicy: "spendy" }
  },
  P4B: {
    title: "P4's rules with the book's current Silk advice (Ch 8: 'early on, hoard')",
    rules: { successFace: 5, partialRule: "half", obstacleSteps: 2, critAlertMinDiff: 3, bonusDiceCap: 2, fullAlertFailure: "caught" }
  },
  P4H: {
    title: "P4 + heist fixes: Heist 2's guard spider starts aware; Heist 5's closing staff are Alert Humans (4)",
    rules: { successFace: 5, partialRule: "half", obstacleSteps: 2, critAlertMinDiff: 3, bonusDiceCap: 2, fullAlertFailure: "caught", silkPolicy: "spendy", heistTweaks: ["office-guard-aware", "restaurant-alert-staff"] }
  }
};

/** Full parameter set for a package (or a bare rules object), with optional extra overrides. */
export function packageParams(pkg, extra = {}) {
  const rules = typeof pkg === "string" ? PACKAGES[pkg]?.rules : pkg;
  if (!rules) throw new Error(`Unknown package ${pkg} (known: ${Object.keys(PACKAGES).join(", ")})`);
  return defaultParams({ ...PRESETS.strict, ...CLARIFIED, ...rules, ...extra });
}

/**
 * Reading presets. `generous` reads every ambiguous rule in the crew's favour;
 * `strict` reads every one against the crew. Neither changes an unambiguous
 * rule, and neither turns on a FIX EXPERIMENT.
 */
export const PRESETS = {
  generous: {
    partialCost: "none", threatTurn: "onFailure", partialHit: false, creatureRolls: "static", creatureWake: "hunt", creatureScope: "obstacle",
    creatureStaysActive: false, failureAttack: false, humanAttackPool: 0, fullAlertPursuit: 0,
    maxRounds: 20, obstacleSteps: 1, intelValue: "allRolls", silkLineBypass: true, slipperyDoubleMove: true,
    cleanFailAlert: 0, improviseAttr: "skill", sceneIs: "obstacle", spittingJamsLocks: true,
    bypassComplexLocks: true, assistFromPassed: true, replacementResets: true, nptpScope: "spider",
    lootOnOut: "pickup", escapeDiffShift: 0, spectacularFailure: 0.75, creativeSpecies: 0.6,
    brilliantPlan: 0.8, flawTiming: "random", activeBandStealth: 0, groupRolls: "leader"
  },
  strict: {
    partialCost: "alert", threatTurn: "everyRound", partialHit: true, creatureRolls: "opposed", creatureWake: "escalation", creatureScope: "location",
    creatureStaysActive: true, failureAttack: true, humanAttackPool: 3, fullAlertPursuit: 4,
    maxRounds: 5, obstacleSteps: 2, intelValue: "none", silkLineBypass: false, slipperyDoubleMove: false,
    cleanFailAlert: 1, improviseAttr: "called", sceneIs: "phase", spittingJamsLocks: false,
    bypassComplexLocks: false, assistFromPassed: false, replacementResets: false, nptpScope: "crew",
    lootOnOut: "lost", escapeDiffShift: 1, spectacularFailure: 0, creativeSpecies: 0,
    brilliantPlan: 0, flawTiming: "worst", activeBandStealth: 1, groupRolls: "individual"
  }
};

export function defaultParams(overrides = {}) {
  const p = Object.fromEntries(Object.entries(PARAMS).map(([k, v]) => [k, v.default]));
  return { ...p, ...overrides };
}
