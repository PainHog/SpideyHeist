/**
 * HEISTY SPIDEYS — The heist catalog (pure; design §4, §16 #15)
 * --------------------------------------------------------------
 * The five ready-to-run heists of Chapter 19 (rulebook v4.8) as data for the
 * Heist Tracker: obstacles and Escape obstacles with their approaches (skills,
 * Difficulty, opposition, how the crew rolls it), creatures and their posts,
 * humans, intel, loot and the heists' own procedures (d6 tables and timers).
 *
 * Ported from the simulator's `sim/heists.mjs` with the v4.8 package's heist
 * content (P6: the Office guard aware from the start, the Restaurant's Alert
 * Humans at 4, Heist 1's cabinet at Acrobatics 1 and its bottle cap). The
 * release excludes sim/, so nothing here imports it; test/catalog.test.mjs
 * checks parity (obstacle ids, Difficulties and skills).
 *
 * Approach `mode`: individual — every spider gets past on its own roll (a
 * group check); single — one spider's roll resolves it for the crew.
 * Obstacle tags drive the roll plan: movement, stealth, climb, slippery,
 * height, gap, squeeze, smallMech, sensor, lock, complexLock, social, human,
 * chase, escape.
 */

/** Ch 11 AP by difficulty. */
export const AP_BY_DIFFICULTY = Object.freeze({ easy: 2, standard: 3, hard: 5, absurd: 6, legendary: 8 });

/** Pools of the opposing rolls the catalog names (Ch 16). */
const OPPOSED = {
  "house-cat": { perception: { roll: "Perception", pool: 4 } },
  "guard-spider": { perception: { roll: "Perception", pool: 4 }, brawl: { roll: "Brawl", pool: 3 } },
  "corn-snake": { perception: { roll: "Perception", pool: 3 } },
  "alert-parrot": { perception: { roll: "Perception", pool: 4 } },
  "protection-rat": { haggle: { roll: "Haggle", pool: 4 }, brawl: { roll: "Brawl", pool: 4 } },
  "rival-crew": { rival: { roll: "Their Face (5 dice)", pool: 5 } }
};

/** Build one approach. `opp` = the sim's opposed key (perception | brawl | haggle | rival). */
function A(skill, difficulty, mode, extra = {}) {
  const { opp = null, against = null, loud = 0, fight = false, ...rest } = extra;
  let opposed = null;
  if (opp) {
    const creature = opp === "rival" ? "rival-crew" : against;
    const o = OPPOSED[creature]?.[opp] ?? null;
    opposed = { creature, roll: o?.roll ?? opp, pool: o?.pool ?? null };
  }
  return {
    skills: [skill], difficulty, mode, opposed,
    alertOnUse: Number(loud) || 0,
    fight: !!fight,
    excludeRoles: rest.excludeRoles ?? [],
    note: rest.note ?? "",
    weakness: rest.weakness ?? null,   // a creature key: its Weakness — clearing with it backs it off
    hold: rest.hold ?? null,           // a creature key: a Weakness that shuts it in for the heist
    pays: rest.pays ?? null,           // a creature key: a talk/bribe that ends its awareness
    seenBy: rest.seenBy ?? [],         // creatures that can see a spider using this route
    tags: rest.tags ?? [],
    ratPitch: !!rest.ratPitch
  };
}

/** Give every approach an id unique within its obstacle. */
function O(def) {
  const seen = {};
  const approaches = def.approaches.map(a => {
    const base = a.skills[0];
    seen[base] = (seen[base] ?? 0) + 1;
    return { id: seen[base] > 1 ? `${base}-${seen[base]}` : base, ...a };
  });
  return {
    kind: "environment", tags: [], threats: [], awake: [], unknown: false, objective: false,
    postObjective: false, keyLock: false, human: null, improvise: [], note: "", ...def, approaches
  };
}

const proc = p => ({ whisper: true, once: false, ...p });

export const HEISTS = Object.freeze([
  {
    key: "cookie", n: 1, name: "The Cookie Situation", journalKey: "heist-cookie-situation",
    difficulty: "easy", limit: 10, lootTier: "crumb",
    loot: [{ id: "objective", name: "The good cookie (from the tin with the blue lid)", tier: "crumb", objective: true }],
    creatures: [{ id: "cat", key: "house-cat", atObstacles: ["O1", "E1"], earshot: [], post: [] }],
    humans: [{ id: "human", name: "The human (asleep down the hall)", row: "sleeping", obstacles: [] }],
    intel: [
      { id: "i1", text: "The counter and the cabinet were wiped down this evening and are slippery (Acrobatics to climb).", obstacle: "O2" },
      { id: "i2", text: "The cat's bed is 9 squares from the cabinet.", obstacle: "O1" },
      { id: "i3", text: "The human's water runs roughly every ninety minutes.", obstacle: null },
      { id: "i4", text: "The bottle cap on the floor is exactly the kind of shiny thing the cat can't ignore.", obstacle: "O1" }
    ],
    obstacles: [
      O({
        id: "O1", name: "Cross the kitchen floor (the cat awake, watching the door)", kind: "creature",
        tags: ["movement", "stealth"], threats: ["house-cat"], awake: ["house-cat"],
        note: "Awake means active and roaming from the start: +1 Alert each round, wherever the crew is. From the drain, the wet counter top costs double movement.",
        approaches: [
          A("stealth", 3, "individual", { opp: "perception", against: "house-cat" }),
          A("persuasion", 3, "single", { opp: "perception", against: "house-cat", note: "Charm it." }),
          A("athletics", 1, "single", { weakness: "house-cat", note: "Flick the bottle cap past it — its Weakness." })
        ],
        improvise: ["deception", "acrobatics", "disguise"]
      }),
      O({
        id: "O2", name: "Climb the cabinet (slippery, freshly wiped)", kind: "environment",
        tags: ["movement", "climb", "slippery", "height"],
        note: "Acrobatics (1), +1 for the height; a Silk Line takes 1 off.",
        approaches: [A("acrobatics", 1, "individual")],
        improvise: ["athletics", "engineering"]
      }),
      O({
        id: "O3", name: "Open the tin quietly (tight lid)", kind: "mechanism", tags: ["smallMech"],
        approaches: [
          A("engineering", 3, "single"),
          A("athletics", 3, "single", { loud: 1, note: "Force it: the lid pops, +1 Alert." })
        ],
        improvise: ["brawl", "perception"]
      }),
      O({
        id: "O4", name: "(Unknown) It's the sewing tin — sniff out or open its twin", kind: "mechanism",
        unknown: true, objective: true, tags: ["smallMech"],
        approaches: [
          A("perception", 4, "single", { note: "Sniff out the butter first." }),
          A("engineering", 3, "single", { note: "Open the twin: as obstacle 3." }),
          A("athletics", 3, "single", { loud: 1, note: "Force the twin: +1 Alert." })
        ],
        improvise: ["brawl", "tactics"]
      })
    ],
    escape: [
      O({
        id: "E1", name: "Back across with the cookie (the cat still watching)", kind: "creature",
        tags: ["movement", "stealth", "escape"], threats: ["house-cat"],
        approaches: [
          A("stealth", 3, "individual", { opp: "perception", against: "house-cat" }),
          A("tactics", 3, "single", { note: "One spider times its head-turns for everyone." })
        ],
        improvise: ["acrobatics", "deception"]
      }),
      O({
        id: "E2", name: "A crumbly cookie, and the way out is a squeeze", kind: "mechanism", tags: ["escape", "squeeze"],
        note: "Or shove it and leave the crumbs: incomplete loot, no roll.",
        approaches: [
          A("engineering", 2, "single", { note: "Wrap it in silk first." }),
          A("acrobatics", 2, "single", { note: "Ease it through." })
        ],
        improvise: ["tactics", "athletics"]
      })
    ],
    procedures: [
      proc({
        id: "twin-tin", name: "Which tin holds the cookies", when: ["heistStart"],
        roll: { dice: 1, table: [{ min: 1, max: 3, text: "The cookies are in the LEFT tin." }, { min: 4, max: 6, text: "The cookies are in the RIGHT tin." }] }
      }),
      proc({
        id: "water-run", name: "The human's water run", when: ["alertAtLeast", "complication"], alertAtLeast: 7, complication: 3, once: true,
        text: "The human gets up for water.",
        timer: {
          rounds: 3,
          stages: [{ rounds: 2, text: "The human is on the way to the sink (2 rounds)." }, { rounds: 1, text: "Lights on: the human fills a glass at the sink. Stealth against them is Difficulty 2." }],
          end: "The human goes back to bed."
        }
      })
    ]
  },
  {
    key: "office", n: 2, name: "The Office After Hours", journalKey: "heist-office-after-hours",
    difficulty: "standard", limit: 8, lootTier: "prize",
    loot: [{ id: "objective", name: "The memory stick", tier: "prize", objective: true }],
    creatures: [{ id: "guard", key: "guard-spider", atObstacles: ["O2", "E1"], earshot: [], post: ["O2", "O3", "O4", "E1"] }],
    humans: [{ id: "cleaners", name: "The cleaning crew", row: "distracted", obstacles: ["O3", "E2"] }],
    intel: [
      { id: "i1", text: "The two sensor beams each cover a known line of squares with a fixed timing gap.", obstacle: "O1" },
      { id: "i2", text: "The guard spider's patrol loops the perimeter every few rounds.", obstacle: "O2" },
      { id: "i3", text: "The drawer uses a standard lock.", obstacle: "O4" },
      { id: "i4", text: "The cable riser comes up behind the manager's desk.", obstacle: "O2" }
    ],
    obstacles: [
      O({
        id: "O1", name: "The motion sensors (two beams)", kind: "mechanism", tags: ["movement", "sensor", "smallMech"],
        approaches: [
          A("engineering", 3, "single", { note: "Jam an emitter: one beam per roll." }),
          A("stealth", 3, "individual", { tags: ["stealth"], note: "Cross in the gap." })
        ],
        improvise: ["acrobatics", "perception"]
      }),
      O({
        id: "O2", name: "The guard spider (aware from the start)", kind: "creature",
        tags: ["movement", "stealth"], threats: ["guard-spider"], awake: ["guard-spider"],
        note: "Bribe: its Weakness — use Paid off on the tracker.",
        approaches: [
          A("stealth", 3, "individual", { opp: "perception", against: "guard-spider" }),
          A("brawl", 3, "single", { opp: "brawl", against: "guard-spider", loud: 1, fight: true, note: "Fights are loud." }),
          A("persuasion", 4, "single", { excludeRoles: ["face"], pays: "guard-spider", note: "Talk: not the Face." })
        ],
        improvise: ["deception", "intimidation", "acrobatics"]
      }),
      O({
        id: "O3", name: "(Unknown) The cleaners, in the corner office", kind: "human", unknown: true,
        tags: ["movement", "stealth", "human"], human: "distracted",
        approaches: [
          A("stealth", 1, "individual", { tags: ["stealth"], note: "Past the cleaner." }),
          A("tactics", 2, "single", { note: "Past the vacuum." }),
          A("athletics", 2, "individual", { note: "Past the vacuum." }),
          A("acrobatics", 2, "individual", { note: "Over the cart." })
        ],
        improvise: ["deception", "engineering"]
      }),
      O({
        id: "O4", name: "The locked desk drawer", kind: "mechanism", objective: true, tags: ["lock", "smallMech"],
        approaches: [
          A("engineering", 3, "single"),
          A("athletics", 3, "single", { loud: 1, note: "Force it: +1 Alert." })
        ],
        improvise: ["perception", "brawl"]
      })
    ],
    escape: [
      O({
        id: "E1", name: "Down with the stick and back through the beams", kind: "mechanism",
        tags: ["movement", "stealth", "sensor", "escape"], threats: ["guard-spider"],
        approaches: [
          A("stealth", 3, "individual", { tags: ["stealth"] }),
          A("engineering", 3, "single", { note: "Jam a beam for everyone." })
        ],
        improvise: ["acrobatics", "tactics"]
      }),
      O({
        id: "E2", name: "The cart is across the vent: out the propped service door, past the cleaners", kind: "human",
        tags: ["movement", "stealth", "human", "escape"], human: "distracted",
        approaches: [
          A("stealth", 1, "individual", { tags: ["stealth"], note: "Past the cleaners." }),
          A("tactics", 2, "single", { note: "Time the vacuum." }),
          A("athletics", 3, "single", { loud: 1, note: "Shove the cart: +1 Alert." })
        ],
        improvise: ["deception", "acrobatics"]
      })
    ],
    procedures: [
      proc({
        id: "guard-lap", name: "The guard's lap", when: ["everyNRounds", "manual"], everyNRounds: 5,
        text: "At the end of each lap (about 5 rounds), roll for the guard (Ch 14).",
        roll: { dice: 1, table: [
          { min: 1, max: 2, text: "It walks the lap backwards." },
          { min: 3, max: 4, text: "It rests a round." },
          { min: 5, max: 6, text: "It takes the stairs down and walks the ground floor's east end." }
        ] }
      }),
      proc({
        id: "cleaners", name: "The cleaners finish", when: ["obstacleStart"], obstacleId: "O2", once: true,
        text: "The crew reached the upper floor: the cleaners finish in 6 rounds.",
        timer: { rounds: 6, stages: [], end: "The cleaners finish: they take the stairs down, park the cart across the vent and prop the service door open (Escape E2)." }
      })
    ]
  },
  {
    key: "petstore", n: 3, name: "The Pet Store Problem", journalKey: "heist-pet-store-problem",
    difficulty: "standard", limit: 8, lootTier: "prize",
    loot: [{ id: "objective", name: "The big cricket", tier: "prize", objective: true, note: "Alive: carried, it's a Prize and too big for a squeeze; calmed (E2), it hops through a gap by itself." }],
    creatures: [
      { id: "snake", key: "corn-snake", atObstacles: ["O2", "E1"], earshot: [], post: [] },
      { id: "parrot", key: "alert-parrot", atObstacles: ["O3"], earshot: ["O2", "O3", "O4", "E1"], post: [] }
    ],
    humans: [],
    intel: [
      { id: "i1", text: "The snake is slow to commit but fast once it does.", obstacle: "O2" },
      { id: "i2", text: "The only way to the bin passes within 3 squares of the tank.", obstacle: "O4" },
      { id: "i3", text: "The folded cloth by the cage is the parrot's night cover: over the cage, it goes quiet.", obstacle: "O3" },
      { id: "i4", text: "The box on the counter is the parrot's crackers.", obstacle: "O3" },
      { id: "i5", text: "The snake's heat lamp is off for the night.", obstacle: "O2" }
    ],
    obstacles: [
      O({
        id: "O1", name: "Enter through the loading dock (a gap; opinionated insects)", kind: "environment",
        tags: ["movement", "squeeze"], note: "Route A's obstacle: a crew entering under the front door (B) meets obstacle 3 instead.",
        approaches: [
          A("acrobatics", 2, "individual", { note: "Squeeze the gap, watched." }),
          A("persuasion", 2, "single", { note: "Hush the insects (or they chirp: +1 Alert)." }),
          A("intimidation", 2, "single", { note: "Hush the insects (or they chirp: +1 Alert)." })
        ],
        improvise: ["deception", "athletics"]
      }),
      O({
        id: "O2", name: "Cross the floor past the snake tank (aware: active from the start)", kind: "creature",
        tags: ["movement", "stealth"], threats: ["corn-snake"], awake: ["corn-snake"],
        approaches: [
          A("stealth", 3, "individual", { opp: "perception", against: "corn-snake", note: "Within 3 squares of the tank." }),
          A("engineering", 4, "single", { hold: "corn-snake", note: "Its Weakness: shut the heavy lid properly, or reach the heat lamp's switch. Shut in, it stays shut all heist." })
        ],
        improvise: ["acrobatics", "disguise"]
      }),
      O({
        id: "O3", name: "The parrot (it has seen you)", kind: "creature",
        tags: [], threats: ["alert-parrot"], awake: ["alert-parrot"],
        note: "Route B's obstacle (under the front door).",
        approaches: [
          A("persuasion", 1, "single", { weakness: "alert-parrot", note: "A cracker." }),
          A("acrobatics", 2, "single", { hold: "alert-parrot", note: "Drop the cover over the cage: quiet all night." }),
          A("stealth", 4, "individual", { tags: ["stealth"], opp: "perception", against: "alert-parrot", note: "Sneak by." })
        ],
        improvise: ["deception", "engineering"]
      }),
      O({
        id: "O4", name: "(Unknown) Forty-seven identical crickets", kind: "social", unknown: true, objective: true, tags: ["social"],
        approaches: [
          A("persuasion", 3, "single"),
          A("deception", 3, "single"),
          A("intimidation", 3, "single", { loud: 1, note: "They all chirp: +1 Alert." })
        ],
        improvise: ["perception", "tactics"]
      })
    ],
    escape: [
      O({
        id: "E1", name: "Back past the tank, carrying a live cricket", kind: "creature",
        tags: ["movement", "stealth", "height", "escape"], threats: ["corn-snake"],
        approaches: [
          A("stealth", 3, "individual", { opp: "perception", against: "corn-snake" }),
          A("acrobatics", 2, "individual", { seenBy: ["alert-parrot"], note: "Along the shelf tops, +1 for the height — the parrot can see you up there." })
        ],
        improvise: ["athletics", "disguise"]
      }),
      O({
        id: "E2", name: "The cricket won't stop chirping", kind: "social", tags: ["social", "escape"],
        note: "Calmed, the cricket hops through a gap by itself.",
        approaches: [
          A("persuasion", 2, "single", { note: "Calm it." }),
          A("engineering", 2, "single", { note: "A gentle silk muffle." }),
          A("athletics", 3, "single", { loud: 1, note: "Just run: it chirps, +1 Alert." })
        ],
        improvise: ["deception", "intimidation"]
      })
    ],
    procedures: []
  },
  {
    key: "library", n: 4, name: "The Library Job", journalKey: "heist-library-job",
    difficulty: "hard", limit: 6, lootTier: "treasure",
    loot: [{ id: "objective", name: "The rare book (the spider map)", tier: "treasure", objective: true }],
    creatures: [
      { id: "guard", key: "guard-spider", atObstacles: ["O1", "E2"], earshot: [], post: ["O1", "E2"] },
      { id: "cat", key: "house-cat", atObstacles: ["E1"], earshot: [], post: [] }
    ],
    humans: [{ id: "librarian", name: "The head librarian", row: "alert", obstacles: ["O2", "E2"] }],
    intel: [
      { id: "i1", text: "The librarian's route covers every floor on an irregular schedule.", obstacle: "O2" },
      { id: "i2", text: "The case uses an antique lock (Engineering, Difficulty 4).", obstacle: "O3" },
      { id: "i3", text: "There are two stairwells and a dumbwaiter between floors.", obstacle: "E1" },
      { id: "i4", text: "The dumbwaiter still runs, worked by a pulley inside the shaft.", obstacle: "E1" }
    ],
    obstacles: [
      O({
        id: "O1", name: "Entry — the resident guard spider", kind: "creature",
        tags: ["movement", "stealth"], threats: ["guard-spider"],
        note: "Its web overlooks the lobby, its post: a beaten guard's backup waits there for E2.",
        approaches: [
          A("stealth", 3, "individual", { opp: "perception", against: "guard-spider" }),
          A("brawl", 3, "single", { opp: "brawl", against: "guard-spider", loud: 1, fight: true, note: "Fights are loud." }),
          A("persuasion", 4, "single", { excludeRoles: ["face"], pays: "guard-spider", note: "Talk: not the Face." })
        ],
        improvise: ["deception", "intimidation", "acrobatics"]
      }),
      O({
        id: "O2", name: "The librarian's late-night route", kind: "human",
        tags: ["movement", "stealth", "human"], human: "alert",
        note: "Wherever the crew and the librarian first share a floor — or the reference room, as the crew reaches the case, if they never have.",
        approaches: [A("stealth", 4, "individual"), A("deception", 4, "single")],
        improvise: ["disguise", "acrobatics"]
      }),
      O({
        id: "O3", name: "The locked case (antique lock, the heist's key lock)", kind: "mechanism", objective: true, keyLock: true,
        tags: ["lock", "complexLock", "smallMech"], note: "The key lock: Bypass doesn't help.",
        approaches: [A("engineering", 4, "single")],
        improvise: ["perception", "brawl"]
      }),
      O({
        id: "O4", name: "(Unknown) The other crew, waiting for someone to open the case", kind: "social", unknown: true, postObjective: true,
        tags: ["social"],
        note: "A Success settles it: negotiated, recruited (a free silk sled) or outdone. On a Failure they snatch the book: the obstacle isn't done until the crew wins it back; if it ends first, the book is gone.",
        approaches: [
          A("persuasion", 3, "single", { opp: "rival", note: "Negotiate or recruit." }),
          A("deception", 3, "single", { opp: "rival", note: "Compete." }),
          A("tactics", 3, "single", { opp: "rival", note: "Compete." })
        ],
        improvise: ["intimidation", "brawl"]
      })
    ],
    escape: [
      O({
        id: "E1", name: "Down a floor with the book", kind: "environment", tags: ["escape"], threats: ["house-cat"],
        approaches: [
          A("engineering", 3, "single", { note: "The dumbwaiter." }),
          A("athletics", 3, "single", { tags: ["chase"], note: "The stairs." })
        ],
        improvise: ["tactics", "acrobatics"]
      }),
      O({
        id: "E2", name: "The lobby: the guard's web, maybe the librarian", kind: "human",
        tags: ["movement", "stealth", "human", "escape"], threats: ["guard-spider"], human: "alert",
        approaches: [
          A("stealth", 4, "individual"),
          A("deception", 4, "single"),
          A("engineering", 3, "single", { note: "Feed the book out through the return slot and follow it." })
        ],
        improvise: ["disguise", "acrobatics"]
      })
    ],
    procedures: [
      proc({
        id: "librarian", name: "The librarian's floor", when: ["firstObstacle", "roundEnd"],
        text: "Roll as the crew comes in and at the end of every round; on a floor, they walk its centre aisle.",
        roll: { dice: 1, table: [
          { min: 1, max: 2, text: "The ground floor." },
          { min: 3, max: 4, text: "The second floor (the reference section)." },
          { min: 5, max: 6, text: "The third floor (off the map)." }
        ] }
      }),
      proc({
        id: "rival-crew", name: "The other crew", when: ["manual"], obstacleId: "O4",
        outcomes: [
          { key: "negotiated", text: "Negotiated: they back off for a favour owed." },
          { key: "recruited", text: "Recruited: they help carry the book (a free silk sled).", sled: true },
          { key: "outdone", text: "Outdone: they're left with an empty case." },
          { key: "snatched", text: "They snatch the book: the obstacle isn't done until the crew wins it back.", lootStatus: "lost" }
        ]
      })
    ]
  },
  {
    key: "restaurant", n: 5, name: "The Restaurant Rush", journalKey: "heist-restaurant-rush",
    difficulty: "hard", limit: 6, lootTier: "treasure",
    loot: [{ id: "objective", name: "The chef's recipe notebook", tier: "treasure", objective: true }],
    creatures: [{ id: "rat", key: "protection-rat", atObstacles: ["O2", "O3", "E2"], earshot: [], post: [] }],
    humans: [
      { id: "staff", name: "Two closing staff", row: "alert", obstacles: ["O1", "E1"] },
      { id: "sleeper", name: "The staffer asleep in the break room", row: "sleeping", obstacles: ["O4"] }
    ],
    intel: [
      { id: "i1", text: "The staff move unpredictably with no set route.", obstacle: "O1" },
      { id: "i2", text: "A rat lives under the dishwasher and runs protection for the block — he'll want something.", obstacle: "O3" },
      { id: "i3", text: "The office door sticks.", obstacle: "O4" },
      { id: "i4", text: "The snap trap by the back door is new this week; it caught the rat's cousin.", obstacle: "O3" },
      { id: "i5", text: "The kitchen floor was mopped at closing.", obstacle: "O2" }
    ],
    obstacles: [
      O({
        id: "O1", name: "The dining room — two staff, no pattern (Alert Humans)", kind: "human",
        tags: ["movement", "stealth", "human"], human: "alert", note: "The tables are cover.",
        approaches: [A("stealth", 4, "individual"), A("deception", 4, "single")],
        improvise: ["disguise", "acrobatics"]
      }),
      O({
        id: "O2", name: "The kitchen — warm smells, a freshly mopped floor", kind: "environment",
        tags: ["movement", "stealth", "slippery"], threats: ["protection-rat"], flawTrigger: "easily-distracted",
        note: "Stealth (4) if a staffer's in here. The wet floor: double movement, or Acrobatics (2). Easily Distracted triggers.",
        approaches: [A("stealth", 2, "individual", { note: "The dishwasher's hum covers you." })],
        improvise: ["acrobatics", "disguise"]
      }),
      O({
        id: "O3", name: "The rat. Negotiations.", kind: "creature", tags: ["social"], threats: ["protection-rat"], ratDeal: true,
        note: "One pitch; offering the trap, food or a favour owed is −1 Difficulty. Success: passage. Partial: the trap first (Engineering 3). Failure: no deal — it's a fight.",
        approaches: [
          A("persuasion", 3, "single", { opp: "haggle", against: "protection-rat", ratPitch: true, note: "His deal." }),
          A("brawl", 4, "single", { opp: "brawl", against: "protection-rat", loud: 1, fight: true, note: "No deal: it's gone bad." })
        ],
        improvise: ["deception", "intimidation"]
      }),
      O({
        id: "O4", name: "(Unknown) The office: the sticking door, and the staffer asleep next door", kind: "human",
        unknown: true, objective: true, tags: ["human"], human: "sleeping",
        note: "The sleeper wakes at the first noise within 4 squares (a Partial or Failure there), or at Alert 5 — then Stealth or Deception (4).",
        approaches: [
          A("engineering", 3, "single", { note: "Ease the notebook under the door." }),
          A("athletics", 3, "single", { loud: 1, note: "Shove it: it scrapes, +1 Alert." })
        ],
        improvise: ["deception", "perception"]
      })
    ],
    escape: [
      O({
        id: "E1", name: "Back up the corridor with the notebook", kind: "human",
        tags: ["movement", "stealth", "human", "escape"], human: "alert",
        approaches: [A("stealth", 4, "individual"), A("deception", 4, "single")],
        improvise: ["disguise", "intimidation"]
      }),
      O({
        id: "E2", name: "The back door: the notebook won't fit under it (and the trap, if the rat's still owed)", kind: "environment",
        tags: ["escape"], threats: ["protection-rat"],
        note: "Or wait for a trash run (a 6 on the staff roll) to prop the door.",
        approaches: [
          A("engineering", 3, "single", { note: "Work the handle with a silk line." }),
          A("athletics", 3, "single", { note: "Hang on it together." })
        ],
        improvise: ["tactics", "acrobatics"]
      })
    ],
    procedures: [
      proc({
        id: "staff", name: "Where the staff are", when: ["roundEnd"], rolls: 2, labels: ["Staffer 1", "Staffer 2"],
        text: "At the end of each round, roll for each closing staffer.",
        roll: { dice: 1, table: [
          { min: 1, max: 2, text: "The dining room." },
          { min: 3, max: 4, text: "The kitchen (the kitchen's Stealth is 4 while they're in)." },
          { min: 5, max: 5, text: "The corridor." },
          { min: 6, max: 6, text: "A trash run: the back door is propped open until the next 6." }
        ] }
      }),
      proc({
        id: "rat-deal", name: "The rat's deal", when: ["manual"], obstacleId: "O3",
        outcomes: [
          { key: "success", text: "Safe passage: he stays out of it." },
          { key: "partial", text: "The deal holds, but the trap comes first (jamming it is Engineering 3)." },
          { key: "failure", text: "No deal: he blocks the way out of the kitchen, and getting past him is a fight.", dealBad: true },
          { key: "trapSet", text: "The crew left with the trap still set: the deal goes bad.", dealBad: true }
        ]
      }),
      proc({
        id: "sleeper", name: "The sleeper wakes", when: ["alertAtLeast", "manual"], alertAtLeast: 5, once: true,
        text: "The staffer in the break room wakes: an Alert Human (Stealth or Deception 4), heading straight for the phone on the office desk."
      })
    ]
  }
]);

const norm = s => String(s ?? "").replace(/[‘’]/g, "'").replace(/^the\s+/i, "").trim().toLowerCase();

/**
 * Find a heist by key ("cookie"), number (1), name ("The Cookie Situation") or
 * journal key ("heist-cookie-situation"). The runtime first reads a journal's
 * `flags[FLAG].heist` (a key, or a custom heist object) and passes it here.
 * @returns {object|null}
 */
export function findHeist(nameOrKey) {
  if (nameOrKey && typeof nameOrKey === "object") return nameOrKey.obstacles ? nameOrKey : null;
  const s = String(nameOrKey ?? "").trim();
  if (!s) return null;
  return HEISTS.find(h => h.key === s)
    ?? HEISTS.find(h => String(h.n) === s)
    ?? HEISTS.find(h => norm(h.name) === norm(s))
    ?? HEISTS.find(h => h.journalKey === s)
    ?? null;
}

/** Every obstacle in play order, the Escape after the heist, each stamped with its phase. */
export function heistObstacles(heist) {
  if (!heist) return [];
  return [
    ...(heist.obstacles ?? []).map(o => ({ ...o, phase: "heist" })),
    ...(heist.escape ?? []).map(o => ({ ...o, phase: "escape" }))
  ];
}

/** Procedures of a heist that fire on a given trigger. */
export function proceduresFor(heist, trigger, ctx = {}) {
  return (heist?.procedures ?? []).filter(p => {
    if (!(p.when ?? []).includes(trigger)) return false;
    if (p.obstacleId && ctx.obstacleId && p.obstacleId !== ctx.obstacleId) return false;
    return true;
  });
}

/** The table row a roll lands on. */
export function procedureOutcome(proc, roll) {
  const r = Math.round(Number(roll) || 0);
  return (proc?.roll?.table ?? []).find(row => r >= row.min && r <= row.max) ?? null;
}
