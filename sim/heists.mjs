/**
 * The five ready-to-run heists of Chapter 19, as data.
 *
 * Every obstacle lists the approaches (skill + Difficulty + how the crew rolls
 * it) and where each number came from. Anything the book does not give is
 * marked `assumed: true` with a reason. Sources:
 *   - Ch 15 Obstacle Toolkit (Difficulties "assume a calm location")
 *   - Ch 16 Creature Compendium (stat blocks, Escalation, Alert Contribution)
 *   - Ch 19 heist text (Alert Limit, loot, intel, suggested obstacles)
 *   - Ch 3 (Squeezing: Acrobatics D2; Height: +1 Difficulty to Acrobatics)
 *
 * Approach `mode`:
 *   individual — every spider must make it past (sneaking across, climbing,
 *                running): each rolls for themselves. The book implies this
 *                for movement ("Drafting: each crewmate gets +1 die on
 *                movement rolls") but never says it — see RULE GAPS.
 *   single     — one spider's roll resolves it for the crew (a lock, a
 *                negotiation, jamming a sensor).
 *
 * Tags drive abilities: movement, stealth, climb, slippery, height, gap,
 * squeeze, smallMech (small mechanical: Bypass / Jury-Rig / Spitting jam),
 * sensor, lock, complexLock, social, human, chase, escape.
 */

/* ------------------------------------------------------------ creatures -- */

/**
 * Creature runtime data (Ch 16; pools mirror packs/_source/creatures).
 *   wake       Alert at which its Escalation says it is awake/active (rule B22)
 *   hunt       Alert at which it is hunting/pursuing (attacks anywhere it is)
 *   perRound   Alert Contribution per round while active
 *   mobile     'always' | 'hunting' | 'aware' | 'never' — whether it follows
 *              the crew around the location once active
 *   attack     pool used when it lands a hit (Ch 10 Taking Hits)
 */
export const CREATURES = {
  "house-cat": {
    name: "House Cat", perception: 4, attack: { label: "Pounce (Brawl)", pool: 4 },
    wake: 3, hunt: 7, perRound: 1, mobile: "always",
    ref: "Ch 16 House Cat: +1 per round while active; Escalation 3 ears rotate / 5 moves / 7 hunting. Ch 14: 'the Alert reaching 3 wakes it'."
  },
  "corn-snake": {
    name: "Corn Snake", perception: 3, attack: { label: "Strike (Brawl)", pool: 4 }, attackOnlyHunting: true,
    wake: 3, hunt: 7, perRound: 1, mobile: "hunting",
    ref: "Ch 16 Corn Snake: +1 per round while active; Alert 3 tongue flicks, 5 noses the lid, 7 out of the tank and hunting."
  },
  "alert-parrot": {
    name: "Alert Parrot", perception: 4, attack: null,
    wake: 5, hunt: Infinity, perRound: 1, mobile: "never", shriekAt: 7, shriek: 2,
    ref: "Ch 16 Alert Parrot: +1 each round it's repeating something; Alert 5 repeats every noise; Alert 7 shrieks (+2 once). Caged."
  },
  "guard-spider": {
    name: "Guard Spider", perception: 4, attack: { label: "Brawl", pool: 3 },
    wake: Infinity, hunt: Infinity, perRound: 1, mobile: "aware", spotAlert: 1,
    ref: "Ch 16 Guard Spider: +1 per round aware; raises the Alert by 1 the moment it spots the crew; Brawl 3."
  },
  "protection-rat": {
    name: "The Rat", perception: 3, attack: { label: "Brawl", pool: 4 }, attackOnlyBad: true,
    wake: Infinity, hunt: Infinity, perRound: 0, mobile: "aware", badAlert: 2,
    ref: "Ch 16 The Rat: none while the deal holds; +2 if it goes bad; Brawl 4, Haggle 4."
  },
  "the-exterminator": {
    name: "The Exterminator", perception: 5, attack: { label: "Spray (Athletics)", pool: 5 },
    wake: 7, hunt: 7, perRound: 1, mobile: "always", optional: true,
    ref: "Ch 16 The Exterminator: only at Lockdown (7+) and only if the ST decides; +1 per round on the map; a Spray caught in the open is Out."
  }
};

/* --------------------------------------------------------------- helpers -- */

const A = (skill, diff, mode, extra = {}) => ({ skill, diff, mode, ...extra });

/**
 * Generated Escape obstacles. The ready-to-run heists give none (Ch 19), so
 * these follow Ch 11 / Ch 17: lean, about pace; at least one solvable without
 * Athletics; several answers per obstacle. All `assumed`.
 */
export function makeEscape(heist, count = 2, diffShift = 0) {
  const d = (heist.limit >= 10 ? 2 : 3) + diffShift;
  const run = {
    id: "E1", name: heist.escapeRun ?? "Run for the exit", kind: "environment", phase: "escape",
    tags: ["movement", "chase", "escape"],
    approaches: [
      A("athletics", d, "individual", { tags: ["chase"] }),
      A("acrobatics", d, "individual"),
      A("stealth", d, "individual", { tags: ["stealth"] })
    ],
    improvise: ["tactics", "deception", "disguise"],
    threats: heist.escapeThreats ?? [],
    assumed: true,
    reason: `Ch 19 heists give no Escape obstacles. Ch 17's own example (a staffer in the hallway: Athletics, Deception, Stealth or Acrobatics). Difficulty ${d}: Easy 2 / otherwise 3 (Ch 2 'Moderate — most of a normal heist').`
  };
  const exit = {
    id: "E2", name: heist.escapeExit ?? "The way out is blocked", kind: "environment", phase: "escape",
    tags: ["escape"],
    approaches: [
      A("deception", d, "single"),
      A("engineering", d, "single", { tags: ["smallMech"] }),
      A("tactics", d, "single"),
      A("persuasion", d, "single")
    ],
    improvise: ["stealth", "perception", "disguise"],
    threats: [],
    assumed: true,
    reason: "Ch 11: 'The Face can talk a staffer into looking the wrong way. The Tinkerer can jam a door…' — the non-Athletics escape obstacle Ch 11/17 require. One spider opens the way for the crew."
  };
  return count >= 2 ? [run, exit] : [run];
}

/* ---------------------------------------------------------------- heists -- */

export const HEISTS = [
  {
    id: "cookie", n: 1, name: "The Cookie Situation", difficulty: "easy", limit: 10, loot: "Crumb/Trinket",
    ref: "Ch 19 Heist 1",
    creatures: ["house-cat"],
    intel: [
      { text: "The counter was wiped down this evening and is slippery (Acrobatics to climb).", obstacle: "O2" },
      { text: "The cat's bed is 9 squares from the cabinet.", obstacle: "O1" },
      { text: "The human's water runs roughly every ninety minutes.", obstacle: null }
    ],
    obstacles: [
      {
        id: "O1", name: "Cross the living room (cat awake, watching the door)", kind: "creature",
        tags: ["movement", "stealth"], threats: ["house-cat"], awake: ["house-cat"],
        approaches: [
          A("stealth", 3, "individual", { opposed: "perception", ref: "Ch 15 House Cat: Stealth or Persuasion (3)" }),
          A("persuasion", 3, "single", { opposed: "perception", ref: "Ch 15 House Cat (charming it is 'hard' but the table gives 3)" })
        ],
        improvise: ["deception", "acrobatics", "disguise"]
      },
      {
        id: "O2", name: "Climb the cabinet (slippery, freshly wiped)", kind: "environment",
        tags: ["movement", "climb", "slippery", "height"], threats: [],
        approaches: [A("acrobatics", 2, "individual", { ref: "Ch 15 Slippery Surface: Acrobatics (2); Ch 19 intel 'Acrobatics to climb'" })],
        improvise: ["athletics", "engineering"],
        assumed: true, reason: "Height +1 (Ch 3) assumed: a cabinet above the counter is 'a shelf edge over the kitchen floor'."
      },
      {
        id: "O3", name: "Open the tin quietly (tight lid)", kind: "mechanism",
        tags: ["smallMech"], threats: [],
        approaches: [
          A("engineering", 3, "single"),
          A("athletics", 3, "single", { loud: 1 })
        ],
        improvise: ["brawl", "perception"],
        assumed: true, reason: "No Difficulty given. Locked Drawer analogue (Ch 15: Engineering 3); forcing it with Athletics assumed noisy (+1 Alert), as the Bruiser on the drawer 'raises the Alert'."
      },
      {
        id: "O4", name: "(Unknown) It's the sewing tin — open its twin", kind: "mechanism", unknown: true, objective: true,
        tags: ["smallMech"], threats: [],
        approaches: [
          A("engineering", 3, "single"),
          A("athletics", 3, "single", { loud: 1 })
        ],
        improvise: ["brawl", "perception"],
        assumed: true, reason: "No Difficulty given; the twin has the same tight lid as O3."
      }
    ],
    escapeRun: "Back across the living room", escapeExit: "Out through the entry vent",
    escapeThreats: ["house-cat"]
  },
  {
    id: "office", n: 2, name: "The Office After Hours", difficulty: "standard", limit: 8, loot: "Prize",
    ref: "Ch 19 Heist 2",
    creatures: ["guard-spider"],
    intel: [
      { text: "The sensor beam covers a known line of squares with a fixed timing gap.", obstacle: "O1" },
      { text: "The guard spider's patrol loops the perimeter every few rounds.", obstacle: "O2" },
      { text: "The drawer uses a standard lock.", obstacle: "O3" }
    ],
    obstacles: [
      {
        id: "O1", name: "The motion sensors", kind: "mechanism",
        tags: ["movement", "sensor", "smallMech"], threats: [],
        approaches: [
          A("engineering", 3, "single", { ref: "Ch 15 Motion Sensor: Engineering or Stealth (3) — jam it" }),
          A("stealth", 3, "individual", { tags: ["stealth"], ref: "Ch 15 Motion Sensor — 'cross it very, very slowly'" })
        ],
        improvise: ["acrobatics", "perception"]
      },
      {
        id: "O2", name: "The guard spider", kind: "creature",
        tags: ["movement", "stealth"], threats: ["guard-spider"],
        approaches: [
          A("stealth", 3, "individual", { opposed: "perception", ref: "Ch 15 Guard Spider: Brawl or Stealth (3); Ch 19 'First real opposed roll'" }),
          A("brawl", 3, "single", { opposed: "brawl", loud: 1, ref: "Ch 15 Guard Spider (3); Ch 16 weakness 'the Bruiser (works, but loudly)' → +1 Alert assumed" }),
          A("persuasion", 4, "single", { excludeRoles: ["face"], ref: "Ch 16: 'could try talking to one. The Difficulty is 4'; 'cannot be charmed by the Face'" })
        ],
        improvise: ["deception", "intimidation", "acrobatics"]
      },
      {
        id: "O3", name: "The locked desk drawer", kind: "mechanism", objective: true,
        tags: ["lock", "smallMech"], threats: [],
        approaches: [
          A("engineering", 3, "single", { ref: "Ch 15 Locked Drawer: Engineering (3)" }),
          A("brawl", 3, "single", { loud: 1, ref: "Ch 15 Locked Drawer: 'Or the Bruiser's, which raises the Alert' (+1 assumed)" })
        ],
        improvise: ["perception", "athletics"]
      },
      {
        id: "O4", name: "(Unknown) Cleaning cart across the exit vent", kind: "human", unknown: true, postObjective: true,
        tags: ["human"], threats: [],
        approaches: [
          A("tactics", 3, "single"),
          A("athletics", 3, "single", { loud: 1 }),
          A("stealth", 2, "individual", { tags: ["stealth"] })
        ],
        improvise: ["engineering", "deception"],
        assumed: true, reason: "No Difficulty given. Find another route (Tactics 3), shift the cart (Athletics 3, noisy), or slip past the cleaners (Human obstacle; Sleeping/Distracted-level Stealth 2)."
      }
    ],
    escapeRun: "Back across the main floor", escapeExit: "The long way out",
    escapeThreats: ["guard-spider"]
  },
  {
    id: "petstore", n: 3, name: "The Pet Store Problem", difficulty: "standard", limit: 8, loot: "Prize",
    ref: "Ch 19 Heist 3",
    creatures: ["corn-snake", "alert-parrot"],
    intel: [
      { text: "The snake is slow to commit but fast once it does.", obstacle: "O2" },
      { text: "The parrot's cage is 5 squares off the main aisle.", obstacle: "O3" },
      { text: "The feeder bin sits behind the counter with one narrow approach.", obstacle: "O4" }
    ],
    obstacles: [
      {
        id: "O1", name: "Enter through the loading dock (a gap; opinionated insects)", kind: "environment",
        tags: ["movement", "squeeze"], threats: [],
        approaches: [
          A("acrobatics", 2, "individual", { ref: "Ch 3 Squeezing: Acrobatics (2); Cellar Spiders ignore it" }),
          A("persuasion", 2, "single"),
          A("intimidation", 2, "single")
        ],
        improvise: ["deception", "athletics"],
        assumed: true, reason: "The insects 'have opinions' — a Difficulty 2 social alternative is assumed."
      },
      {
        id: "O2", name: "Cross the floor past the snake tank", kind: "creature",
        tags: ["movement", "stealth"], threats: ["corn-snake"], awake: ["corn-snake"],
        approaches: [A("stealth", 3, "individual", { opposed: "perception" })],
        improvise: ["acrobatics", "disguise"],
        assumed: true, reason: "No Toolkit entry for the snake: Stealth at Moderate (3), matching its Perception 3. 'The snake is aware of you' → active here."
      },
      {
        id: "O3", name: "The parrot (it has seen you)", kind: "creature",
        tags: [], threats: ["alert-parrot"], awake: ["alert-parrot"],
        approaches: [
          A("persuasion", 1, "single", { ref: "Ch 16 Alert Parrot weakness: a cracker (Persuasion, Difficulty 1)" }),
          A("acrobatics", 2, "single", { assumed: true }),
          A("stealth", 4, "individual", { tags: ["stealth"], opposed: "perception", assumed: true })
        ],
        improvise: ["deception", "engineering"],
        assumed: true, reason: "Cloth over the cage (Acrobatics 2) and sneaking past its Perception 4 (Stealth 4) are assumed; the cracker is the book's."
      },
      {
        id: "O4", name: "(Unknown) Forty-seven identical crickets", kind: "social", unknown: true, objective: true,
        tags: ["social"], threats: [],
        approaches: [
          A("persuasion", 3, "single"),
          A("deception", 3, "single"),
          A("perception", 3, "single")
        ],
        improvise: ["intimidation", "tactics"],
        assumed: true, reason: "'A social encounter now' — no Difficulty given; Moderate (3)."
      }
    ],
    escapeRun: "Back past the snake tank", escapeExit: "Out through the loading dock",
    escapeThreats: ["corn-snake"]
  },
  {
    id: "library", n: 4, name: "The Library Job", difficulty: "hard", limit: 6, loot: "Treasure",
    ref: "Ch 19 Heist 4",
    creatures: ["guard-spider", "house-cat"],
    roaming: ["house-cat"],
    intel: [
      { text: "The librarian's route covers every floor on an irregular schedule.", obstacle: "O2" },
      { text: "The case uses an antique lock (Engineering, Difficulty 4).", obstacle: "O3" },
      { text: "There are two stairwells and a dumbwaiter between floors.", obstacle: "E1" }
    ],
    obstacles: [
      {
        id: "O1", name: "Entry — the resident guard spider", kind: "creature",
        tags: ["movement", "stealth"], threats: ["guard-spider"],
        approaches: [
          A("stealth", 3, "individual", { opposed: "perception", ref: "Ch 15 Guard Spider: Brawl or Stealth (3)" }),
          A("brawl", 3, "single", { opposed: "brawl", loud: 1 }),
          A("persuasion", 4, "single", { excludeRoles: ["face"], ref: "Ch 16 Guard Spider: talking Difficulty 4; not the Face" })
        ],
        improvise: ["deception", "intimidation", "acrobatics"]
      },
      {
        id: "O2", name: "The librarian's late-night route", kind: "human",
        tags: ["movement", "stealth", "human"], threats: [],
        approaches: [
          A("stealth", 4, "individual", { ref: "Ch 15 Alert Human: Deception or Stealth (4) — 'extraordinarily observant'" }),
          A("deception", 4, "single", { ref: "Ch 15 Alert Human" })
        ],
        improvise: ["disguise", "acrobatics"]
      },
      {
        id: "O3", name: "The locked case (antique lock)", kind: "mechanism", objective: true,
        tags: ["lock", "complexLock", "smallMech"], threats: [],
        approaches: [A("engineering", 4, "single", { ref: "Ch 19: 'Antique lock, Engineering Difficulty 4'" })],
        improvise: ["perception", "brawl"]
      },
      {
        id: "O4", name: "(Unknown) The other crew", kind: "social", unknown: true, postObjective: true,
        tags: ["social"], threats: [],
        approaches: [
          A("persuasion", 3, "single", { opposed: "rival" }),
          A("deception", 3, "single", { opposed: "rival" }),
          A("tactics", 3, "single", { opposed: "rival" })
        ],
        improvise: ["intimidation", "brawl"],
        assumed: true, reason: "'Negotiate, compete, or recruit' — no Difficulty; Moderate (3). Opposed variant: a rival pool of 5 ('built like the players' spiders': Attribute 3 + Skill 2)."
      }
    ],
    escapeRun: "Down the stairwell / dumbwaiter", escapeExit: "Out past the entry",
    escapeThreats: ["guard-spider", "house-cat"]
  },
  {
    id: "restaurant", n: 5, name: "The Restaurant Rush", difficulty: "hard", limit: 6, loot: "Prize",
    ref: "Ch 19 Heist 5",
    creatures: ["protection-rat"],
    intel: [
      { text: "The staff move unpredictably with no set route.", obstacle: "O1" },
      { text: "A rat lives under the dishwasher and runs protection — he'll want something.", obstacle: "O3" },
      { text: "The office door sticks.", obstacle: "O4" }
    ],
    obstacles: [
      {
        id: "O1", name: "The dining room — two staff, no pattern", kind: "human",
        tags: ["movement", "stealth", "human"], threats: [],
        approaches: [
          A("stealth", 3, "individual"),
          A("deception", 3, "single")
        ],
        improvise: ["disguise", "acrobatics"],
        assumed: true, reason: "Working closing staff sit between Ch 15's Distracted Human (1) and Alert Human (4): Moderate (3)."
      },
      {
        id: "O2", name: "The kitchen — warm, incredible smells (and the rat)", kind: "environment",
        tags: ["movement", "stealth"], threats: ["protection-rat"], flawTrigger: "easily-distracted",
        approaches: [A("stealth", 2, "individual")],
        improvise: ["acrobatics", "disguise"],
        assumed: true, reason: "No Difficulty given; an empty, noisy kitchen is Easy (2). Easily Distracted fires on entry (Ch 19 / ruling B11)."
      },
      {
        id: "O3", name: "The rat. Negotiations.", kind: "creature",
        tags: ["social"], threats: ["protection-rat"], ratDeal: true,
        approaches: [
          A("persuasion", 3, "single", { opposed: "haggle" }),
          A("deception", 3, "single", { opposed: "haggle" }),
          A("brawl", 4, "single", { opposed: "brawl", loud: 1 })
        ],
        improvise: ["intimidation", "tactics"],
        assumed: true, reason: "Rat has no Toolkit entry: negotiation at Moderate (3) (opposed variant vs Haggle 4); a fight at 4 (vs Brawl 4), loud. A Failure makes the deal 'go bad' (+2)."
      },
      {
        id: "O4", name: "(Unknown) The office — the sleeping staffer wakes", kind: "human", unknown: true, objective: true,
        tags: ["human"], threats: [],
        approaches: [
          A("stealth", 3, "single", { tags: ["stealth"] }),
          A("deception", 3, "single"),
          A("athletics", 3, "single", { loud: 1 })
        ],
        improvise: ["disguise", "engineering"],
        assumed: true, reason: "A just-woken staffer: Moderate (3). The sticking door (intel) is folded in; forcing it (Athletics) is noisy."
      }
    ],
    escapeRun: "Back through the kitchen", escapeExit: "Out the back",
    escapeThreats: ["protection-rat"]
  }
];

export const AP_BY_DIFFICULTY = { easy: 2, standard: 3, hard: 5, absurd: 6, legendary: 8 };

export function getHeist(idOrN) {
  return HEISTS.find(h => h.id === idOrN || h.n === Number(idOrN));
}
