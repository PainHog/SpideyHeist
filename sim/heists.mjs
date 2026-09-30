/**
 * The five ready-to-run heists of Chapter 19, as data.
 *
 * Every obstacle lists the approaches (skill + Difficulty + how the crew rolls
 * it) and where each number came from. Anything the book does not give is
 * marked `assumed: true` with a reason. Sources:
 *   - Ch 15 Obstacle Toolkit (Difficulties "assume a calm location")
 *   - Ch 16 Creature Compendium (stat blocks, Escalation, Alert Contribution)
 *   - Ch 19 heist text (Alert Limit, loot, intel, suggested obstacles with their
 *     Difficulties, and the suggested Escape obstacles E1–E2 — v4.7, REVIEW.md Part F)
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
 * The Escape obstacles. Since v4.7 every Ch 19 heist suggests its own E1–E2
 * (`heist.escape`); those are used, the first `count` of them, with `diffShift`
 * added to every Difficulty. A heist without them (none now) falls back to the
 * generic pair below, which follows Ch 11 / Ch 17: lean, about pace; at least one
 * solvable without Athletics; several answers per obstacle. All `assumed`.
 */
export function makeEscape(heist, count = 2, diffShift = 0) {
  if (heist.escape?.length) {
    return heist.escape.slice(0, Math.max(1, count)).map(o => ({
      ...o, kind: o.kind ?? "environment", phase: "escape", threats: o.threats ?? [],
      approaches: o.approaches.map(a => ({ ...a, diff: a.diff + diffShift }))
    }));
  }
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
      { text: "The counter and the cabinet were wiped down this evening and are slippery (Acrobatics to climb).", obstacle: "O2" },
      { text: "The cat's bed is 9 squares from the cabinet.", obstacle: "O1" },
      { text: "The human's water runs roughly every ninety minutes.", obstacle: null },
      { text: "The bottle cap on the floor is exactly the kind of shiny thing the cat can't ignore.", obstacle: "O1" }
    ],
    obstacles: [
      {
        id: "O1", name: "Cross the kitchen floor (cat awake, watching the door)", kind: "creature",
        tags: ["movement", "stealth"], threats: ["house-cat"], awake: ["house-cat"],
        approaches: [
          A("stealth", 3, "individual", { opposed: "perception", ref: "Ch 19: 'Stealth, opposed (its Perception 4)'; Ch 15 House Cat (3) where the cat doesn't roll" }),
          A("persuasion", 3, "single", { opposed: "perception", ref: "Ch 19: 'charm it: Persuasion, opposed'; Ch 15 House Cat (3)" })
        ],
        improvise: ["deception", "acrobatics", "disguise"]
      },
      {
        id: "O2", name: "Climb the cabinet (slippery, freshly wiped)", kind: "environment",
        tags: ["movement", "climb", "slippery", "height"], threats: [],
        approaches: [A("acrobatics", 2, "individual", { ref: "Ch 19: 'Acrobatics (2), +1 for the height' — the height tag adds the +1 (Ch 3)" })],
        improvise: ["athletics", "engineering"]
      },
      {
        id: "O3", name: "Open the tin quietly (tight lid)", kind: "mechanism",
        tags: ["smallMech"], threats: [],
        approaches: [
          A("engineering", 3, "single", { ref: "Ch 19: 'Engineering (3)'" }),
          A("athletics", 3, "single", { loud: 1, ref: "Ch 19: 'force it: Athletics (3), and the lid pops: +1 Alert'" })
        ],
        improvise: ["brawl", "perception"]
      },
      {
        id: "O4", name: "(Unknown) It's the sewing tin — sniff out or open its twin", kind: "mechanism", unknown: true, objective: true,
        tags: ["smallMech"], threats: [],
        approaches: [
          A("perception", 4, "single", { ref: "Ch 19: 'Sniff out the butter first: Perception (4)'" }),
          A("engineering", 3, "single", { ref: "Ch 19: 'open the twin: as obstacle 3'" }),
          A("athletics", 3, "single", { loud: 1 })
        ],
        improvise: ["brawl", "tactics"]
      }
    ],
    escape: [
      {
        id: "E1", name: "Back across with the cookie (the cat still watching)", kind: "creature",
        tags: ["movement", "stealth", "escape"], threats: ["house-cat"],
        approaches: [
          A("stealth", 3, "individual", { opposed: "perception", ref: "Ch 19 E1: 'Stealth, opposed (the cat)'" }),
          A("tactics", 3, "single", { ref: "Ch 19 E1: 'one spider times its head-turns for everyone: Tactics (3)'" })
        ],
        improvise: ["acrobatics", "deception"]
      },
      {
        id: "E2", name: "A crumbly cookie, and the way out is a squeeze", kind: "mechanism",
        tags: ["escape"], threats: [],
        approaches: [
          A("engineering", 2, "single", { ref: "Ch 19 E2: 'Wrap it in silk first: Engineering (2)'" }),
          A("acrobatics", 2, "single", { ref: "Ch 19 E2: 'ease it through: Acrobatics (2)'" })
        ],
        improvise: ["tactics", "athletics"],
        note: "Ch 19 E2's third answer (shove it and leave the crumbs: incomplete loot, no roll) isn't modelled."
      }
    ]
  },
  {
    id: "office", n: 2, name: "The Office After Hours", difficulty: "standard", limit: 8, loot: "Prize",
    ref: "Ch 19 Heist 2",
    creatures: ["guard-spider"],
    intel: [
      { text: "The two sensor beams each cover a known line of squares with a fixed timing gap.", obstacle: "O1" },
      { text: "The guard spider's patrol loops the perimeter every few rounds.", obstacle: "O2" },
      { text: "The drawer uses a standard lock.", obstacle: "O4" },
      { text: "The cable riser comes up behind the manager's desk.", obstacle: "O2" }
    ],
    obstacles: [
      {
        id: "O1", name: "The motion sensors (two beams)", kind: "mechanism",
        tags: ["movement", "sensor", "smallMech"], threats: [],
        approaches: [
          A("engineering", 3, "single", { ref: "Ch 19: 'jam an emitter: Engineering (3), one beam per roll'; Ch 15 Motion Sensor (3)" }),
          A("stealth", 3, "individual", { tags: ["stealth"], ref: "Ch 19: 'Cross in the gap: Stealth (3)'" })
        ],
        improvise: ["acrobatics", "perception"]
      },
      {
        id: "O2", name: "The guard spider (aware from the start)", kind: "creature",
        tags: ["movement", "stealth"], threats: ["guard-spider"], awake: ["guard-spider"],
        approaches: [
          A("stealth", 3, "individual", { opposed: "perception", ref: "Ch 19: 'Stealth, opposed (its Perception 4)'; Ch 15 Guard Spider (3)" }),
          A("brawl", 3, "single", { opposed: "brawl", loud: 1, ref: "Ch 19: 'fight: Brawl, opposed (its Brawl 3) — works, but loudly: +1 Alert'" }),
          A("persuasion", 4, "single", { excludeRoles: ["face"], ref: "Ch 19: 'talk: Persuasion (4), not the Face'" })
        ],
        improvise: ["deception", "intimidation", "acrobatics"]
      },
      {
        id: "O3", name: "(Unknown) The cleaners, in the corner office", kind: "human", unknown: true,
        tags: ["movement", "stealth", "human"], threats: [],
        approaches: [
          A("stealth", 1, "individual", { tags: ["stealth"], ref: "Ch 19: 'Past the cleaner: Stealth (1)' (Ch 15 Distracted Human)" }),
          A("tactics", 2, "single", { ref: "Ch 19: 'past the vacuum: Athletics or Tactics (2)' (Ch 15 Vacuum)" }),
          A("athletics", 2, "individual", { ref: "Ch 19 / Ch 15 Vacuum (2)" }),
          A("acrobatics", 2, "individual", { ref: "Ch 19: 'over the cart: Acrobatics (2)'" })
        ],
        improvise: ["deception", "engineering"]
      },
      {
        id: "O4", name: "The locked desk drawer", kind: "mechanism", objective: true,
        tags: ["lock", "smallMech"], threats: [],
        approaches: [
          A("engineering", 3, "single", { ref: "Ch 19: 'Engineering (3)'; Ch 15 Locked Drawer" }),
          A("athletics", 3, "single", { loud: 1, ref: "Ch 19: 'force it: Athletics (3), +1 Alert'" })
        ],
        improvise: ["perception", "brawl"]
      }
    ],
    escape: [
      {
        id: "E1", name: "Down with the stick and back through the beams", kind: "mechanism",
        tags: ["movement", "stealth", "sensor", "escape"], threats: ["guard-spider"],
        approaches: [
          A("stealth", 3, "individual", { tags: ["stealth"], ref: "Ch 19 E1: 'Stealth (3)'" }),
          A("engineering", 3, "single", { ref: "Ch 19 E1: 'jam a beam for everyone: Engineering (3)'" })
        ],
        improvise: ["acrobatics", "tactics"]
      },
      {
        id: "E2", name: "The cart is across the vent: out the propped service door, past the cleaners", kind: "human",
        tags: ["movement", "stealth", "human", "escape"], threats: [],
        approaches: [
          A("stealth", 1, "individual", { tags: ["stealth"], ref: "Ch 19 E2: 'Past the cleaners: Stealth (1)'" }),
          A("tactics", 2, "single", { ref: "Ch 19 E2: 'time the vacuum: Tactics (2)'" }),
          A("athletics", 3, "single", { loud: 1, ref: "Ch 19 E2: 'shove the cart: Athletics (3), +1 Alert'" })
        ],
        improvise: ["deception", "acrobatics"]
      }
    ]
  },
  {
    id: "petstore", n: 3, name: "The Pet Store Problem", difficulty: "standard", limit: 8, loot: "Prize",
    ref: "Ch 19 Heist 3",
    creatures: ["corn-snake", "alert-parrot"],
    intel: [
      { text: "The snake is slow to commit but fast once it does.", obstacle: "O2" },
      { text: "The parrot's cage is 5 squares off the main aisle.", obstacle: "O3" },
      { text: "The feeder bin sits behind the counter with one narrow approach.", obstacle: "O4" },
      { text: "The parrot's cover is folded on the shelf beside its cage; there's a box of crackers on the counter.", obstacle: "O3" },
      { text: "The snake's heat lamp is off for the night.", obstacle: "O2" }
    ],
    obstacles: [
      {
        id: "O1", name: "Enter through the loading dock (a gap; opinionated insects)", kind: "environment",
        tags: ["movement", "squeeze"], threats: [],
        approaches: [
          A("acrobatics", 2, "individual", { ref: "Ch 19: 'Squeeze the gap: Acrobatics (2)'; Ch 3 Squeezing (Cellar Spiders ignore it)" }),
          A("persuasion", 2, "single", { ref: "Ch 19: 'hush the insects: Persuasion or Intimidation (2)'" }),
          A("intimidation", 2, "single", { ref: "Ch 19" })
        ],
        improvise: ["deception", "athletics"]
      },
      {
        id: "O2", name: "Cross the floor past the snake tank (aware: active from the start)", kind: "creature",
        tags: ["movement", "stealth"], threats: ["corn-snake"], awake: ["corn-snake"],
        approaches: [
          A("stealth", 3, "individual", { opposed: "perception", ref: "Ch 19: 'Stealth, opposed (its Perception 3)'" }),
          A("engineering", 4, "single", { ref: "Ch 19: 'its Weakness — shut the heavy lid properly, or reach the heat lamp's switch over the snake: Engineering (4)'" })
        ],
        improvise: ["acrobatics", "disguise"]
      },
      {
        id: "O3", name: "The parrot (it has seen you)", kind: "creature",
        tags: [], threats: ["alert-parrot"], awake: ["alert-parrot"],
        approaches: [
          A("persuasion", 1, "single", { ref: "Ch 19 / Ch 16 Alert Parrot weakness: a cracker (Persuasion, Difficulty 1)" }),
          A("acrobatics", 2, "single", { ref: "Ch 19: 'drop the cover over the cage: Acrobatics (2)'" }),
          A("stealth", 4, "individual", { tags: ["stealth"], opposed: "perception", ref: "Ch 19: 'sneak by: Stealth, opposed (its Perception 4)'" })
        ],
        improvise: ["deception", "engineering"]
      },
      {
        id: "O4", name: "(Unknown) Forty-seven identical crickets", kind: "social", unknown: true, objective: true,
        tags: ["social"], threats: [],
        approaches: [
          A("persuasion", 3, "single", { ref: "Ch 19: 'Persuasion or Deception (3)'" }),
          A("deception", 3, "single", { ref: "Ch 19" }),
          A("intimidation", 3, "single", { loud: 1, ref: "Ch 19: 'Intimidation (3), and they all chirp: +1 Alert'" })
        ],
        improvise: ["perception", "tactics"]
      }
    ],
    escape: [
      {
        id: "E1", name: "Back past the tank, carrying a live cricket", kind: "creature",
        tags: ["movement", "stealth", "height", "escape"], threats: ["corn-snake"],
        approaches: [
          A("stealth", 3, "individual", { opposed: "perception", ref: "Ch 19 E1: 'Stealth, opposed (the snake)'" }),
          A("acrobatics", 2, "individual", { ref: "Ch 19 E1: 'along the shelf tops: Acrobatics (2), +1 for the height' (height tag)" })
        ],
        improvise: ["athletics", "disguise"]
      },
      {
        id: "E2", name: "The cricket won't stop chirping", kind: "social",
        tags: ["social", "escape"], threats: [],
        approaches: [
          A("persuasion", 2, "single", { ref: "Ch 19 E2: 'Calm it: Persuasion (2)'" }),
          A("engineering", 2, "single", { ref: "Ch 19 E2: 'a gentle silk muffle: Engineering (2)'" }),
          A("athletics", 3, "single", { loud: 1, ref: "Ch 19 E2: 'just run: Athletics (3), and it chirps: +1 Alert'" })
        ],
        improvise: ["deception", "intimidation"]
      }
    ]
  },
  {
    id: "library", n: 4, name: "The Library Job", difficulty: "hard", limit: 6, loot: "Treasure",
    ref: "Ch 19 Heist 4",
    creatures: ["guard-spider", "house-cat"],
    roaming: ["house-cat"],
    intel: [
      { text: "The librarian's route covers every floor on an irregular schedule.", obstacle: "O2" },
      { text: "The case uses an antique lock (Engineering, Difficulty 4).", obstacle: "O3" },
      { text: "There are two stairwells and a dumbwaiter between floors.", obstacle: "E1" },
      { text: "The dumbwaiter still runs, worked by a pulley inside the shaft.", obstacle: "E1" }
    ],
    obstacles: [
      {
        id: "O1", name: "Entry — the resident guard spider", kind: "creature",
        tags: ["movement", "stealth"], threats: ["guard-spider"],
        approaches: [
          A("stealth", 3, "individual", { opposed: "perception", ref: "Ch 19: 'Stealth, opposed (its Perception 4)'; Ch 15 Guard Spider (3)" }),
          A("brawl", 3, "single", { opposed: "brawl", loud: 1, ref: "Ch 19: 'fight: Brawl, opposed (its Brawl 3), loudly: +1 Alert'" }),
          A("persuasion", 4, "single", { excludeRoles: ["face"], ref: "Ch 19: 'talk: Persuasion (4) (Chapter 16)'; Ch 16: not the Face" })
        ],
        improvise: ["deception", "intimidation", "acrobatics"]
      },
      {
        id: "O2", name: "The librarian's late-night route", kind: "human",
        tags: ["movement", "stealth", "human"], threats: [],
        approaches: [
          A("stealth", 4, "individual", { ref: "Ch 19: 'Stealth or Deception (4)' (Ch 15 Alert Human)" }),
          A("deception", 4, "single", { ref: "Ch 19 (Ch 15 Alert Human)" })
        ],
        improvise: ["disguise", "acrobatics"]
      },
      {
        id: "O3", name: "The locked case (antique lock, the heist's key lock)", kind: "mechanism", objective: true,
        tags: ["lock", "complexLock", "smallMech"], threats: [],
        approaches: [A("engineering", 4, "single", { ref: "Ch 19: 'Antique lock, Engineering Difficulty 4' — the key lock, so no Bypass (Ch 5)" })],
        improvise: ["perception", "brawl"]
      },
      {
        id: "O4", name: "(Unknown) The other crew, waiting for someone to open the case", kind: "social", unknown: true, postObjective: true,
        tags: ["social"], threats: [],
        approaches: [
          A("persuasion", 3, "single", { opposed: "rival", ref: "Ch 19: 'Persuasion, opposed (their Face, 5 dice)'" }),
          A("deception", 3, "single", { opposed: "rival", ref: "Ch 19: 'compete: Deception or Tactics, opposed (5 dice)'" }),
          A("tactics", 3, "single", { opposed: "rival", ref: "Ch 19" })
        ],
        improvise: ["intimidation", "brawl"],
        note: "Ch 19: they step out when the case opens, so this comes at the objective, before the Escape. Where the rival doesn't roll, Difficulty 3 = 5 dice' average Successes (1.7) + 1, rounded."
      }
    ],
    escape: [
      {
        id: "E1", name: "Down two floors with the book", kind: "environment",
        tags: ["escape"], threats: ["house-cat"],
        approaches: [
          A("engineering", 3, "single", { ref: "Ch 19 E1: 'The dumbwaiter: Engineering (3)'" }),
          A("athletics", 3, "single", { tags: ["chase"], ref: "Ch 19 E1: 'the stairs: Athletics (3)'" })
        ],
        improvise: ["tactics", "acrobatics"]
      },
      {
        id: "E2", name: "The lobby: the guard's web, maybe the librarian", kind: "human",
        tags: ["movement", "stealth", "human", "escape"], threats: ["guard-spider"],
        approaches: [
          A("stealth", 4, "individual", { ref: "Ch 19 E2: 'Stealth or Deception (4)'" }),
          A("deception", 4, "single", { ref: "Ch 19 E2" }),
          A("engineering", 3, "single", { ref: "Ch 19 E2: 'feed the book out through the return slot and follow it: Engineering (3)'" })
        ],
        improvise: ["disguise", "acrobatics"]
      }
    ]
  },
  {
    id: "restaurant", n: 5, name: "The Restaurant Rush", difficulty: "hard", limit: 6, loot: "Treasure",
    ref: "Ch 19 Heist 5",
    creatures: ["protection-rat"],
    intel: [
      { text: "The staff move unpredictably with no set route.", obstacle: "O1" },
      { text: "A rat lives under the dishwasher and runs protection — he'll want something.", obstacle: "O3" },
      { text: "The office door sticks.", obstacle: "O4" },
      { text: "The snap trap by the back door is new this week; it caught the rat's cousin.", obstacle: "O3" },
      { text: "The kitchen floor was mopped at closing.", obstacle: "O2" }
    ],
    obstacles: [
      {
        id: "O1", name: "The dining room — two staff, no pattern (Alert Humans)", kind: "human",
        tags: ["movement", "stealth", "human"], threats: [],
        approaches: [
          A("stealth", 4, "individual", { ref: "Ch 19: 'They are Alert Humans (Deception or Stealth 4)'" }),
          A("deception", 4, "single", { ref: "Ch 19 (Ch 15 Alert Human)" })
        ],
        improvise: ["disguise", "acrobatics"],
        note: "The staff d6 table (Ch 19 ST Prep) isn't modelled: the staff are treated as present at O1 and absent from O2."
      },
      {
        id: "O2", name: "The kitchen — warm smells, a freshly mopped floor", kind: "environment",
        tags: ["movement", "stealth", "slippery"], threats: ["protection-rat"], flawTrigger: "easily-distracted",
        approaches: [A("stealth", 2, "individual", { ref: "Ch 19: 'Cross unseen: Stealth (2), the dishwasher's hum covers you'" })],
        improvise: ["acrobatics", "disguise"],
        note: "The wet floor is a movement cost here (Ch 19: 'double movement, or Acrobatics (2)'); a staffer in the kitchen (Stealth 4) isn't modelled."
      },
      {
        id: "O3", name: "The rat. Negotiations.", kind: "creature",
        tags: ["social"], threats: ["protection-rat"], ratDeal: true,
        approaches: [
          A("persuasion", 3, "single", { opposed: "haggle", ref: "Ch 19 rat's deal: 'one pitch: Persuasion, opposed by his Haggle 4'" }),
          A("brawl", 4, "single", { opposed: "brawl", loud: 1, ref: "Ch 19: 'no deal: Brawl, opposed (his Brawl 4), and it's gone bad'" })
        ],
        improvise: ["deception", "intimidation"],
        note: "The engine sends the deal bad (+2, once) on a Failure here, as Ch 19 does (a failed pitch means a fight). Not modelled: the −1 Difficulty for offering the trap, food or a favour, and 'one pitch' (the engine lets the crew retry)."
      },
      {
        id: "O4", name: "(Unknown) The office: the sticking door, and the staffer asleep next door", kind: "human", unknown: true, objective: true,
        tags: ["human"], threats: [],
        approaches: [
          A("engineering", 3, "single", { ref: "Ch 19: 'The notebook won't fit under the door. Ease it: Engineering (3)'" }),
          A("athletics", 3, "single", { loud: 1, ref: "Ch 19: 'shove it: Athletics (3), and it scrapes: +1 Alert'" })
        ],
        note: "The sleeper (Ch 19: wakes on noise within 4 squares or at Alert 5; then Stealth or Deception 4) isn't modelled beyond the loud shove.",
        improvise: ["deception", "perception"]
      }
    ],
    escape: [
      {
        id: "E1", name: "Back up the corridor with the notebook", kind: "human",
        tags: ["movement", "stealth", "human", "escape"], threats: [],
        approaches: [
          A("stealth", 4, "individual", { ref: "Ch 19 E1: 'Stealth or Deception (4)'" }),
          A("deception", 4, "single", { ref: "Ch 19 E1" })
        ],
        improvise: ["disguise", "intimidation"]
      },
      {
        id: "E2", name: "The back door: the notebook won't fit under it (and the trap, if the rat's still owed)", kind: "environment",
        tags: ["escape"], threats: ["protection-rat"],
        approaches: [
          A("engineering", 3, "single", { ref: "Ch 19 E2: 'Work the handle with a silk line: Engineering (3)'" }),
          A("athletics", 3, "single", { ref: "Ch 19 E2: 'hang on it together: Athletics (3)'" })
        ],
        note: "Not modelled: waiting for a trash run (a 6 on the staff roll) to prop the door.",
        improvise: ["tactics", "acrobatics"]
      }
    ]
  }
];

export const AP_BY_DIFFICULTY = { easy: 2, standard: 3, hard: 5, absurd: 6, legendary: 8 };

export function getHeist(idOrN) {
  return HEISTS.find(h => h.id === idOrN || h.n === Number(idOrN));
}

/* ------------------------------------------------------- heist tweaks -- */

/**
 * Candidate heist-level fixes (BALANCE.md §5), switched on by name through the
 * package param `heistTweaks`. Each returns a modified copy of one heist.
 */
export const HEIST_TWEAKS = {
  // Heist 2: "the cleaning crew came at 7 tonight, not 8. They're already here" — so the
  // cleaners stand between the crew and the drawer (Ch 11: 3–4 obstacles before the objective).
  "office-cleaners-first": {
    heist: "office",
    text: "Heist 2: the unknown obstacle (the cleaners) sits before the drawer, not after it.",
    apply: h => {
      // Since v4.7 Ch 19 already puts the cleaners before the drawer: nothing to move.
      if (h.obstacles.findIndex(o => o.unknown) < h.obstacles.findIndex(o => o.objective)) return h;
      const [o1, o2, o3, o4] = h.obstacles;
      return { ...h, obstacles: [o1, o2, { ...o4, id: "O3", postObjective: false }, { ...o3, id: "O4" }],
        intel: h.intel.map(i => (i.obstacle === "O3" ? { ...i, obstacle: "O4" } : i)) };
    }
  },
  // Heist 2: "Professional, alert, doing the job" — the guard spider is aware from the start.
  "office-guard-aware": {
    heist: "office",
    text: "Heist 2: the guard spider starts aware (+1 Alert per round while it can see the crew).",
    apply: h => ({ ...h, obstacles: h.obstacles.map(o => (o.threats?.includes("guard-spider") ? { ...o, awake: ["guard-spider"] } : o)) })
  },
  // Heist 1: the intel says "Acrobatics to climb" — the freshly wiped counter won't hold silk.
  "cookie-wiped-counter": {
    heist: "cookie",
    text: "Heist 1: silk won't hold on the freshly wiped counter — the climb is an Acrobatics roll.",
    apply: h => ({ ...h, obstacles: h.obstacles.map(o => (o.tags.includes("climb") ? { ...o, tags: o.tags.filter(t => t !== "climb") } : o)) })
  },
  // Heist 5: "two staff moving unpredictably" are written as Ch 15 Alert Humans (Difficulty 4), not Moderate.
  "restaurant-alert-staff": {
    heist: "restaurant",
    text: "Heist 5: the two closing staff are Alert Humans (Ch 15: Deception or Stealth 4).",
    apply: h => ({ ...h, obstacles: h.obstacles.map(o => (o.id === "O1" ? { ...o, approaches: o.approaches.map(a => ({ ...a, diff: 4 })) } : o)) })
  },
  // Heist 3: the snake is watching, not yet active — it wakes on its own Escalation (Alert 3).
  "petstore-snake-escalation": {
    heist: "petstore",
    text: "Heist 3: 'the snake is aware of you' becomes 'the snake is watching' — it is active from its Escalation (Alert 3), not from the start.",
    apply: h => ({ ...h, obstacles: h.obstacles.map(o => (o.awake?.includes("corn-snake") ? { ...o, awake: o.awake.filter(x => x !== "corn-snake") } : o)) })
  },
  // Heist 3: the loose lid is a way through — one spider can wedge it while the crew crosses.
  "petstore-wedge-lid": {
    heist: "petstore",
    text: "Heist 3: 'The lid is loose' is also the answer — one spider can wedge it (Engineering 3) so the crew crosses unseen.",
    apply: h => ({ ...h, obstacles: h.obstacles.map(o => (o.awake?.includes("corn-snake") && !o.approaches.some(a => a.skill === "engineering") ? { ...o, approaches: [...o.approaches, { skill: "engineering", diff: 3, mode: "single", assumed: true }] } : o)) })
  }
};

export function applyHeistTweaks(heist, names = []) {
  let h = heist;
  for (const n of names) {
    const t = HEIST_TWEAKS[n];
    if (!t) throw new Error(`Unknown heist tweak ${n}`);
    if (t.heist === h.id) h = t.apply(h);
  }
  return h;
}
