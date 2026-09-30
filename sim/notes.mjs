/**
 * Static knowledge for the report: what the rulebook leaves undefined (found
 * while implementing the engine), and which abilities are / aren't modelled.
 */

export const RULE_GAPS = [
  { title: "No group-check rule", ref: "Ch 2; Ch 5 Drafting ('each crewmate… movement rolls')", text: "When the whole crew must sneak past or climb something, the book never says whether each spider rolls, one leader rolls, or the NPC rolls once. Drafting / Escape Routes / I Know a Way imply everyone rolls.", param: "groupRolls" },
  { title: "Whether a Partial raises the Alert", ref: "Ch 2 Types of Results; Ch 9 table; Ch 21", text: "Partial = 'a complication lands… that actually costs you something', but the Alert table lists no Partial trigger. The Foundry system suggests +1.", param: "partialCost" },
  { title: "How many rolls / attempts an obstacle is", ref: "Ch 11 Phase 3; Ch 2 When Not to Roll", text: "An obstacle has 'a clear goal', but the book never says whether one success clears it, or what ends a run of Failures ('no progress') other than the Alert.", param: "obstacleSteps / maxRounds", detector: "STUCK_OBSTACLE" },
  { title: "Fixed Difficulty vs opposed roll for creatures", ref: "Ch 15 Toolkit vs Ch 16 pools; Ch 2 Opposed Rolls", text: "The same cat is 'Stealth (3)' in Ch 15 and 'Perception 4' in Ch 16. Opposed rolls have no Partial or Critical, and Alert-band / cover Difficulty modifiers have nothing to act on (the simulator ignores them in opposed mode).", param: "creatureRolls", detector: "OPPOSED_NO_PARTIAL" },
  { title: "When a creature is 'active' and where its +X applies", ref: "Ch 9 +X row; ruling B22; Ch 14; Ch 16", text: "'Awake, hunting or pursuing' — the cat's Escalation says 'ears rotate' at 3, Ch 14 says the Alert reaching 3 wakes it, and Heist 1 says it is awake from the start. Whether a mobile creature's per-round Alert counts in other rooms is not said, and nothing puts a creature back to sleep.", param: "creatureWake / creatureScope / creatureStaysActive", detector: "CREATURE_DROVE_FULL_ALERT" },
  { title: "Does the Stirring Stealth +1 continue at Active (5–6)?", ref: "Ch 9 table ('No roll penalty yet') vs its Storyteller Note ('the Stirring penalty and the Lockdown penalty both apply')", text: "config.mjs keeps +1; the table row says no penalty.", param: "activeBandStealth" },
  { title: "What 'a scene' is", ref: "~20 'once per scene' abilities", text: "Never defined. Per-obstacle scenes make Make a Scene, Phase Through, I Made a Thing, Fast Talk, Plausible Deniability… available at every obstacle.", param: "sceneIs" },
  { title: "Taking a hit when BODY + Endurance − penalty ≤ 0", ref: "Ch 10 Taking Hits; Ch 2 The Botch", text: "The Botch die gives no Successes to compare; treated as 0.", detector: "DEFENSE_POOL_ZERO" },
  { title: "Do Vitality penalties reduce Assist dice?", ref: "Ch 2 Assists ('Skill only… min 1'); Ch 10 ('−N dice on all rolls')", text: "Treated as yes, then the minimum of 1 applies.", detector: "ASSIST_PENALTY" },
  { title: "A Critical spider nobody can carry", ref: "Ch 3 Speed; Ch 10 Critical (ruling B2)", text: "'Must be assisted to move' — nothing says what happens if nobody is free (left behind? caught?). The simulator counts it as left behind (Out) when the obstacle hits the round cap.", detector: "CRITICAL_NO_CARRIER" },
  { title: "Loot when its carrier goes Out", ref: "Ch 10 Going Out; Ch 12 The Loot", text: "Not covered. Butterfingers' own rule (an Action to recover it) is used by default.", param: "lootOnOut", detector: "LOOT_CARRIER_OUT" },
  { title: "Going Out in the last obstacle", ref: "Ch 10 ('enter at the start of the next obstacle')", text: "There is no next obstacle, so the player sits out the rest of the session.", detector: "REPLACEMENT_NEVER_ARRIVES" },
  { title: "Once-per-heist abilities of a Waiting Web replacement", ref: "Ch 10", text: "'Same Role, Attributes, Skills, and Perks' — fresh uses or not?", param: "replacementResets" },
  { title: "The Alert past the Limit", ref: "Ch 9 At Limit; Ch 11 Phase 4", text: "The Alert 'carries over' into the Escape, but more Alert past the Limit has no effect; Criticals can lower it back below the Limit.", detector: "ALERT_PAST_LIMIT" },
  { title: "A Full Alert Escape has no pursuit rule", ref: "Ch 9; Ch 13 'play the lockdown'", text: "Only creatures with attack pools can hit. In human-only locations (Heist 5) or where creatures aren't engaged, a failed Escape roll at Full Alert costs nothing.", param: "fullAlertPursuit", detector: "ESCAPE_FAILURE_FREE" },
  { title: "Full Alert at Limit ≤ 6 runs at the Active band", ref: "Ch 9 (ruling B30)", text: "No Lockdown penalty ever applies in a Hard/Absurd/Legendary Escape, and creature escalations keyed to 7 never fire.", detector: "FULL_ALERT_NO_LOCKDOWN" },
  { title: "Humans have no stat block", ref: "Ch 15 Human Obstacles; Ch 16 closing line", text: "No Perception pool (for Decoy / Thunderous Entrance / Double Bluff), no attack, no Alert contribution. 'Human With Broom' swings but can't hit.", param: "humanAttackPool", detector: "NPC_NO_POOL" },
  { title: "Improvise's Attribute", ref: "Ch 8 Improvise", text: "'Swap the called-for Skill' — keep the Attribute, or use the new Skill's?", param: "improviseAttr" },
  { title: "Clean failure on the Botch die", ref: "Ch 2 The Botch", text: "'A clean failure, no bonus disaster' — does the ordinary Failure +1 still apply?", param: "cleanFailAlert" },
  { title: "Silk Clutch on a Botch or a Partial", ref: "Ch 8 Silk Clutch", text: "'After a failed roll' — a Botch is a failed roll, but does its +2 still land? Is a Partial 'failed'?", detector: "CLUTCH_ON_BOTCH" },
  { title: "Difficulty below 1", ref: "Ch 2 Difficulty; Ch 5 Soundless / Escape Routes / I Know a Way", text: "Reducers stack (Escape D2 − Escape Routes − I Know a Way = 0). No floor is stated; the simulator clamps to 1, which also makes Improvise's +1 free.", detector: "DIFFICULTY_ZERO" },
  { title: "Casing has no Difficulty, no cost and no cap", ref: "Ch 11 Casing; Ch 19 (3 intel items each)", text: "A crew of five averages ~12 Successes against 3 facts; failure costs nothing.", param: "intelValue", detector: "CASING_OVERFLOW" },
  { title: "What intel is worth", ref: "Ch 11 ('information, not a free win'); Ch 17", text: "No mechanical value is given.", param: "intelValue" },
  { title: "Preparations: how many, what cost", ref: "Ch 11 Preparation", text: "'A few'; each gets an ST complication 'that adds texture' with no mechanical cost. A pre-placed Silk Line removes a climb obstacle outright.", param: "silkLineBypass", detector: "SILK_LINE_BYPASS" },
  { title: "Spitting Spider jam: no usage limit, and does jamming a lock open it?", ref: "Ch 4 Precision Application", text: "Every other active species ability is once per scene.", param: "spittingJamsLocks / spittingLimit", detector: "SPITTING_UNLIMITED" },
  { title: "Bypass vs 'small mechanical obstacle'", ref: "Ch 5 I Made a Thing", text: "Does it beat a lock written as the heist's key obstacle (the antique case lock, Engineering D4)?", param: "bypassComplexLocks" },
  { title: "Rat deal: '+2 if it goes bad'", ref: "Ch 16 The Rat", text: "Once or per round? What makes it go bad? (The simulator: a Failure at the negotiation; +2 once; then it fights.)" },
  { title: "Guard spider awareness never ends; 'calls for backup' names no trigger or backup", ref: "Ch 16 Guard Spider", text: "Once aware, it adds +1 per round for the rest of the heist." },
  { title: "Sneeze roll result tiers", ref: "Ch 7 Allergic to Dust", text: "'Stealth (3) or the Alert rises by 1' — is a Partial enough? 'Either way, everyone in earshot knows' — is that also 'spotted briefly' (+1)? The simulator: only a full success avoids the +1." },
  { title: "Flaw Moments from always-on Flaws have no cap", ref: "Ch 7; Ch 8", text: "Loud and Arachnophobe Magnet can earn +1 SP every time they bite.", detector: "CONTINUOUS_FLAW_SILK" },
  { title: "Compulsive Planner is Silk-neutral", ref: "Ch 7 Flaw 6", text: "−1 SP when the crew acts anyway, +1 SP Flaw Moment for the problem it caused.", detector: "COMPULSIVE_NET_ZERO" },
  { title: "Show-Off's 'Difficulty 4 version'", ref: "Ch 7 Flaw 10", text: "Makes a Difficulty 5 roll easier.", detector: "SHOWOFF_EASIER" },
  { title: "Not Part of the Plan: once per heist per spider or per crew?", ref: "Ch 8", text: "Damage Control says 'the crew'; Not Part of the Plan doesn't.", param: "nptpScope" },
  { title: "Who leads (Escape Routes vs Drafting) and do the Escape reducers stack?", ref: "Ch 5 Lookout / Wheelman", text: "Only one spider can lead, but I Know a Way and Escape Routes both cut Escape Difficulty by 1.", detector: "ESCAPE_STACK_D1" },
  { title: "Abort, Abort: what the retreat means", ref: "Ch 5 Wheelman", text: "Does the crew abandon the objective, or just back off and retry? The simulator: cancels one Failure's/Botch's Alert, no retreat." },
  { title: "No Escape obstacles in the ready-to-run heists", ref: "Ch 19 vs Ch 11 Phase 4", text: "The ST must build 1–2 each time. Generated here (§11).", param: "escapeCount / escapeDiffShift" },
  { title: "AP per spider or per crew", ref: "Ch 11 Debrief", text: "Read as per spider." },
  { title: "Silk Line holds two spiders at once", ref: "Ch 12", text: "With no clock, it still lets all five across one after another." }
];

export const MODELLED = [
  "dice pools (Attribute + Skill + bonuses − Vitality), Successes on 4–6, Difficulty 1–5, Full/Partial/Failure/Critical, the Botch die",
  "Alert bands (Stirring/Active Stealth +1, Lockdown all +1 and Stealth +2), Full Alert at the Limit (objective lost if not taken; skip to the Escape after finishing the round)",
  "Critical −1 Alert at Difficulty 2+; Failure +1; Botch +2; spider Out +2; creature per-round contributions; guard 'spotted' +1; parrot shriek +2; rat deal +2",
  "one Assist per roll (Skill only, 1–3 dice); opposed rolls (variant)",
  "Silk spends: extra die, Silk Line, Reroll, Improvise, Silk Clutch, Damage Control, Not Part of the Plan, That's Not What Happened; earns: Flaw Moments, Spectacular Failure, Creative Species Use, Brilliant Plan, Show-Off Critical",
  "Vitality, Taking Hits (BODY+Endurance vs the attack; ties to the defender; −1/−2 levels), Recovery (quiet round or gap, once per obstacle), carrying Critical spiders",
  "Going Out, Waiting Web replacements (Rattled, half Silk, next obstacle), Loss = everyone Out at once",
  "Casing (one Perception/Tactics roll each, one fact per Success), Preparation (pre-placed Silk Lines, Contingency)",
  "Debrief AP (full / half rounded down / 0)",
  "species: Jumping (auto-leap on gaps), Orb Weaver (Line), Wolf (Run It Again), Cellar (squeeze), Spitting (jam), Crab (see not modelled)",
  "Signature Moves: all seven",
  "Perks: Silver Tongue, Read the Room, Plausible Deniability, Fast Talk, Actually I Planned This, Familiar Face, Silk Trail, Soundless, Second-Story Spider, Jury-Rig, Spider-Sense, Overclock, Field Repair, I See How This Works, Take the Hit, Unfazed, Thunderous Entrance, Negotiating Position, That All You Got?, Early Warning, Tactical Feed, Contingency, Escape Routes, Counter-Surveillance, Don't Look Down, Passenger (carrying only), Drafting, Abort Abort, Method Actor, The Long Con, Smoke and Mirrors",
  "Flaws: all ten (Fear of Vacuums only via the optional Ch 20 complication table)"
];

export const NOT_MODELLED = [
  ["Crab Spider — Wait, Was That There Before?", "needs a full turn holding still; every obstacle here needs the spider to move, so it never applies (movement is abstracted away)"],
  ["Orb Weaver — Snare", "needs a creature to walk into a webbed square; there is no grid"],
  ["Ghost Protocol", "the book resolves spotting as the spider's own Stealth roll, so 'when you're spotted' has no separate moment to trigger in"],
  ["I Was Never Here", "affects NPCs remembering you after the heist; no mechanical effect during a job"],
  ["Dead Drop, Planted Evidence, Shortcut, Trap Architect", "spatial Planning tricks with no defined mechanical payoff (Trap Architect: what a trapped NPC suffers is undefined)"],
  ["Pattern Recognition", "knowing a patrol's next three actions only matters on a grid; treated as redundant with casing intel"],
  ["Silk Grapple", "'held one round' has no defined effect on an obstacle"],
  ["Double Bluff, Quick Change", "disguise-specific timing that the obstacle abstraction doesn't create"],
  ["Always a Way Out", "'one option left' has no mechanical definition"],
  ["Web Structure (2 SP)", "no obstacle in the ready-to-run heists is framed around one; Silk Line covers the climb/gap case"],
  ["Flaw delay (1 SP to push a Flaw back a round)", "only shifts timing; not worth a decision model"],
  ["Speed, distances, line of sight, cover", "no grid: obstacles are abstract. Cover's +2 to spot you would otherwise be a further bypass"]
];
