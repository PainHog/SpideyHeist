# Procedural playtest — Heist 2: The Office After Hours (Office · Standard)

- **Source of truth:** `book/src/chapters/*.html` (v4.5). Rulings already in `book/REVIEW.md` are not re-reported unless they caused a *new* problem in play.
- **Dice:** every roll is real, from `node roll.js N` (`1+floor(random*6)`, 4+ = Success) in a private scratch folder. Every die is listed in the logs below. No result was invented or changed.
- **Seats:** one Storyteller (ST) and five players, all run by the tester.
- **Method:**
  - **Main line:** the whole session, Score to Debrief, using the ST rulings listed in §2.3.
  - **Branch B:** replays from round 6 with the *other* defensible reading of the first opposed roll (cover inside an opposed roll). It exercises Lockdown, Full Alert, a Vitality loss and most of the Silk menu.
  - **Probes (§5):** three one-line dice checks for rules that never came up.
- **Headline:**
  - **Main line:** the crew took the memory stick and escaped with a peak Alert of **2/8**. Two of the three known obstacles (the sensors and the drawer) needed **no roll at all**. The crew spent **0 Silk Points**.
  - **Branch B:** the Alert reached **Full Alert (8/8, then 9)** because one guard spider stayed "aware" with no way to switch it off. The crew still escaped with the objective, because Full Alert does nothing once you hold the loot.
  - **Both lines:** Critical Successes on Difficulty 2–3 rolls knocked the Alert down **4 times** in play, plus 4 of 5 in a probe.

---

## 1. Character creation (Chapter 7)

**Fixed roles:** Face, Ghost, Tinkerer, Bruiser. The random fifth spider was rolled on the Ch 20 tables:
- **Role:** 1d6 = **2 → Ghost**, a second Ghost.
- **Species:** 1d6 = **2 → Orb Weaver**.

**Rolls for all five spiders:**
- **Flaws** (1d10 each, per Step 7's "roll 1d10"): 10, 10, 1, 1, 9. That gives **Show-Off ×2, Arachnophobe Magnet ×2, Easily Distracted**.
- **Names** (2d6 each):
  - 5+3 = 8 Filament
  - 4+3 = 7 The Architect
  - 3+6 = 9 Nook
  - 2+3 = 5 Crinkle
  - 5+5 = 10 Cassette

**How to read the sheets:**
- Attributes are written as base (10 points) + species bonus = final.
- Skills are written as own points (12) + Role bonus (3), with a maximum of 3 per skill.
- SP = WIT + NERVE.

### Cassette — Jumping Spider · The Face
- **Species:** *Did You See That Jump?!* Once per scene, an automatic straight-line leap of up to Speed. **Speed 6.**
- **Attributes:** BODY 1+1 = **2** · WIT **2** · NERVE **3** · GRACE 4+1 = **5**. Base 1+2+3+4 = 10 ✓.
- **Skills:**
  - Deception 1+2 = **3**, Persuasion 2+1 = **3**.
  - Stealth 2, Acrobatics 2, Perception 2, Tactics 1, Disguise 1, Athletics 1.
  - Own points = 12 ✓.
- **Signature move:** *That's Not What Happened* (once per heist, 2 SP).
- **Perks:** Plausible Deniability, Fast Talk.
- **Flaw:** Show-Off.
- **SP 5** · Vitality Unharmed.

### Nook — Cellar Spider · The Ghost
- **Species:** *Contortionist*. No squeeze rolls, and it can pass through occupied squares. **Speed 5.**
- **Attributes:** BODY **2** · WIT **2** · NERVE **3** · GRACE 3+2 = **5**. Base 10 ✓.
- **Skills:**
  - Stealth 1+2 = **3**, Acrobatics 2+1 = **3**.
  - Perception 2, Athletics 2, Deception 2, Engineering 1, Tactics 1, Disguise 1.
  - Own = 12 ✓.
- **Signature move:** *Phase Through* (once per scene).
- **Perks:** Soundless, Ghost Protocol.
- **Flaw:** Show-Off.
- **SP 5** · Unharmed.

### The Architect — Spitting Spider · The Tinkerer
- **Species:** *Precision Application*. A 6-square strand with no roll: it can jam a mechanism, snag an object, or pin a small target. **Speed 5.**
- **Attributes:** BODY **2** · WIT 3+2 = **5** · NERVE 2+1 = **3** · GRACE **3**. Base 2+3+2+3 = 10 ✓.
- **Skills:**
  - Engineering 1+2 = **3**, Perception 2+1 = **3**.
  - Tactics 3, Stealth 2, Acrobatics 2, Deception 1, Endurance 1.
  - Own = 12 ✓.
- **Signature move:** *I Made a Thing* (once per scene).
- **Perks:** Jury-Rig, Field Repair.
- **Flaw:** Arachnophobe Magnet.
- **SP 8** · Unharmed.

### Crinkle — Wolf Spider · The Bruiser
- **Species:** *Run It Again*. Once per scene, reroll the failed dice on a chase, pursuit or physical-confrontation roll. **Speed 7.**
- **Attributes:** BODY 3+2 = **5** · WIT **2** · NERVE **3** · GRACE **2**. Base 10 ✓.
- **Skills:**
  - Brawl 1+2 = **3**, Endurance 2+1 = **3**.
  - Athletics 3, Intimidation 3, Perception 1, Stealth 1, Acrobatics 1.
  - Own = 12 ✓.
- **Signature move:** *Make a Scene* (once per scene).
- **Perks:** Take the Hit, That All You Got?
- **Flaw:** Arachnophobe Magnet.
- **SP 5** · Unharmed.

### Filament — Orb Weaver · The Ghost (random)
- **Species:** *Everything Connects*. Once per scene, a 3-square Snare or Line. **Speed 5.**
- **Attributes:** BODY **2** · WIT 2+2 = **4** · NERVE **3** · GRACE **3**. Base 10 ✓.
- **Skills:**
  - Stealth 2+1 = **3**, Acrobatics 1+2 = **3**.
  - Perception 3, Engineering 2, Tactics 2, Athletics 1, Persuasion 1.
  - Own = 12 ✓.
- **Signature move:** *Phase Through*.
- **Perks:** Silk Trail, Dead Drop.
- **Flaw:** Easily Distracted.
- **SP 7** · Unharmed.

**Crew SP at the start: 30.** Creation took about 12 minutes for five spiders. Friction points (details in Issues):
- **Step 5 order:** it gives the 12 points first and the Role +3 second. But the "max 3, including Role bonus" cap means you have to plan the Role points first, or they won't fit (I-24).
- **Role bonus split:** "+3 split between them" doesn't say whether 3/0 is legal (I-24).
- **Duplicates:** the random role duplicated a fixed one, and the flaws came up with two duplicate pairs. The book never says whether that's allowed (I-25).
- **Spitting Spider:** the +3 attribute bonus lands on WIT and NERVE, which are the two SP stats. The Architect starts with 8 SP against 5 for most others (I-23).
- **Cellar Spider Ghost:** Nook's *Contortionist* already covers most of *Phase Through* (I-22).

---

## 2. Storyteller prep

### 2.1 Map (built by the ST — Heist 2 has no sample map; see I-15)

Coordinates are (x,y) with (0,0) at the top-left. Each floor is 16 × 10 inside its walls.

**Ground floor — main floor:**
```
   x 0123456789012345
y0   ................     V  entry vent (the planned exit)
y1   ................     E  sensor-beam emitter; beam = the "-" squares on row 5
y2   V..DDD....DDD.PS     D  desks (cover)      R reception desk (cover)
y3   .............C..     C  filing cabinet     P  PIR light head (radius 3)
y4   .............C..     S  stair door (gap)   Q  cable riser (runs to upper floor)
y5   E---------......     F  glass front door with a brush-seal gap
y6   ...............B     B  service door (UNKNOWN: propped open by cleaners)
y7   ......RRRRDDD...     Unknown: cleaning cart K parked across V at (0-1,2)
y8   ......RRRR......     Vacuum lane: rows 6-7
y9   .Q......F.......
```
The stairwell is an annex east of the east wall, running from S (ground) to L (upper). B opens onto the loading bay, which counts as outside.

**Upper floor — corner office NE:**
```
   x 0123456789012345
y0   ...........#....     # office walls (x=11, y=0-4; y=4, x=11-15)
y1   ...........#.TH.     T  manager's desk (4 squares tall) with the drawer
y2   ...DDDDDD..#....     H  cable hole under the desk -> ground floor (14,1)
y3   ...........d....     d  door with a gap under it (squeeze)
y4   ...........#####     p  printer (rough ground / cover)
y5   ...DDDDDD.......     Q  riser top            L  stair landing (guard's rest post)
y6   ................
y7   ................
y8   .pp.............
y9   .Q.............L
```

**Guard spider loop (upper floor)**, Speed 6, 48 squares, about 8 rounds per lap:
- L (15,9) → north to (15,5)
- west to (10,5)
- north along x=10, passing the door d at (11,3)
- west along y=0 to (0,0)
- south to (0,9)
- east along y=9 over the riser top, back to L.

It rests at L between laps. Heist 2 says only "loops the perimeter every few rounds", so rest time is a d6.

### 2.2 Intel held for Casing

Book intel (Ch 19):
1. Sensor beam: a known line with a fixed timing gap.
2. Guard's patrol loops the perimeter every few rounds.
3. The drawer uses a standard lock.

Extra intel the ST had to write, because the book's three would run out (I-3):

4. The cable riser connects the two floors behind the printer.
5. The office door has a gap under it.
6. The desk is 4 squares tall, and the drawer faces the chair.
7. The guard rests at the stair landing between laps.
8. The printer area is cluttered rough ground.
9. The coffee machine gurgles on a timer.

**Withheld (the unknown):** the cleaning crew arrived at 7, and their cart is parked across V.

### 2.3 Rulings the ST had to make before or at the table (each is an Issue)

| # | Ruling | Why needed |
|---|---|---|
| R1 | "Scene" = "obstacle". Once-per-scene powers refresh at each obstacle. | "Scene" is never defined (I-6) |
| R2 | In an opposed roll, **+N Difficulty against the spider** adds N to the opponent's Successes. **+N Difficulty for the NPC to spot/target** takes N off the NPC's Successes. | Opposed rolls have no Difficulty for band modifiers, cover or Soundless to apply to (I-1) |
| R3 | Against a no-pool NPC (a human), cover takes 2 off the spider's Stealth Difficulty. Arachnophobe Magnet adds 1 to it. | The "Difficulty to be spotted" wording is NPC-facing (I-2) |
| R4 | Guard spider Senses = 6 squares with line of sight (borrowed from the House Cat). | The Guard block has no Senses or Escalation (I-8) |
| R5 | A creature attack "lands" on 1+ Successes, and the Successes it rolled are what you shrug against. A human hit with no pool uses its toolkit Difficulty as its attack Successes. | "Lands a hit" is undefined, and humans have no attack pool (I-9) |
| R6 | Winning an opposed Brawl against a creature knocks it back, and it loses its next action. | Creatures have no Vitality or defeat state (I-7) |
| R7 | A Prize-sized loot item needs two carriers, who move at half Speed. | There are no carrying rules (I-18) |
| R8 | The guard's "+1 on spotting" *replaces* Ch 9's generic "spotted" +1. The per-round "aware" +1 starts the following round. | Stacking is unstated (I-8) |
| R9 | The Stirring Stealth +1 still applies at Active (5–6). | Ch 9's table and its Storyteller Note disagree (I-4) |
| R10 | Several spiders exposed to one watcher each roll against **one** NPC roll per round. | There is no group-roll rule (I-5) |

---

## 3. Play log — main line

Notation: `pool: dice → Successes`. **A** = Alert (Limit 8).

### Phase 1 — The Score (Ch 11, 17)

| Step | Rule | Dice | Result | A |
|---|---|---|---|---|
| ST lays out both floors. Visible: the vent entry, the open plan, the ceiling sensor heads, a guard spider on the upper floor, and the corner office. Hidden: the riser, the door gap, and the cleaners. | Ch 11 P1 "describes what a spider can actually see" | — | The crew takes the job. | 0 |

### Phase 2 — Planning

| Step | Rule | Dice | Result | A |
|---|---|---|---|---|
| Casing: Cassette, WIT+Perception | Ch 11 "each Success reveals one concrete piece of intel" | 4: 2 2 6 6 → 2 | intel 1, 2 | – |
| Casing: Nook, WIT+Perception | " | 4: 6 3 6 6 → 3 | intel 3, 4, 5 | – |
| Casing: The Architect, WIT+Perception | " | 8: 3 5 4 3 4 4 5 5 → **6** | intel 6–9, then **the ST runs out**. 2 Successes are wasted, or it would be the unknown, which Ch 13 forbids. | – |
| Casing: Crinkle | " | 3: 1 5 5 → 2 | nothing left to give | – |
| Casing: Filament | " | 7: 6 6 1 6 4 2 1 → 4 | nothing left to give | – |
| **Casing total: 17 Successes for 3 book intel items + 6 ST extras.** 8 Successes wasted. | I-3 | | | |
| Prep 1: Entry at V for all five | Ch 11 Preparation | — | Complication: the grille is only half-open, so one spider exits per round. | – |
| Prep 2: Filament pre-places a Silk Line up the riser (5 squares) | Ch 11 "Pre-place one Silk Line" (SP cost unstated, I-17). Ruled free. | — | Complication: the riser top comes out onto the cluttered printer area (rough ground). | – |
| Prep 3: Filament Dead-Drops a foil-wrapped chocolate crumb at the landing (L) as a guard bribe | Dead Drop Perk / Ch 11 "Stash one small item" | — | Complication: an ant has found it. | – |
| Is a 3rd Prep by one spider allowed? The book says "a few" and gives no limit. | I-17 | | Capped at 3 by ST fiat. | |
| Brilliant Plan +2 SP? The bribe plan relies on the crew *knowing* the guard's Weakness, which Casing never revealed. | Ch 8 | — | Not awarded. The criterion is subjective at a one-person table. | – |

### Phase 3 — The Heist (Alert Limit 8)

**O1 — The motion sensors** (ground floor):

| Rnd | Step | Rule | Dice | Result | A |
|---|---|---|---|---|---|
| 1 | The Architect, at the vent mouth (0,2), spits at the emitter E (0,5), 3 squares away with line of sight | Spitting "jam a small mechanism (a lock, a **sensor**…)… no roll", with no use limit (Ch 4) | — | The beam is dead. **Obstacle 1 is solved without a roll** (I-10). | 0 |
| 1–5 | The crew exits the grille one per round, crosses to Q, and climbs the pre-placed line two at a time | Ch 12 Silk Line (safe footing, holds 2); Ch 2 "When Not to Roll" | — | No threat is active, so there are no rolls. | 0 |

**O2 — The guard spider** (upper floor). The guard's rest roll is d6 = **1**, so it leaves L on round 1. The crew splits:
- **Office team:** Nook, the Architect and Cassette.
- **Riser team:** Crinkle and Filament hold the exit behind the printer.

| Rnd | Step | Rule | Dice | Result | A |
|---|---|---|---|---|---|
| 1–4 | The office team waits behind the desk rows. Casing gave them the loop, so they move only when the guard is more than 6 squares away (R4). | Ch 3 "Keep the Map Honest" | — | A known loop plus honest distances means **no roll is needed to pass the guard** (I-11). | 0 |
| 5–6 | The office team moves to the door d and squeezes under it | Ch 3 "Squeezing: a gap smaller than a square takes an Acrobatics roll (Difficulty 2)". Nook, a Cellar Spider, skips it. | Architect 5: 1 6 2 5 6 → 3 · Cassette 7: 5 3 6 6 6 3 6 → **5** | The Architect succeeds. **Cassette gets a Critical** (4+ on D2) on a roll no one needed. The Alert can't go below 0 (I-19). The ST awards the bonus "spot a second way out": the cable hole H under the desk. | 0 |
| 6 | **First real opposed roll.** The guard's loop runs over the riser top. Crinkle and Filament are hidden on the printer, which is cover. | Ch 2 Opposed; Ch 3 Cover; R2 (cover = −2 to the guard) | Guard Perception 4: 2 5 3 6 → 2 (−2 = **0**) · Filament Stealth 6: 3 3 3 3 4 3 → 1 · Crinkle Stealth 4: 3 5 6 1 → 2 | Both stay hidden. **Without R2, the guard's raw 2 beats Filament's 1 and ties Crinkle's 2, and the world wins ties: both would be spotted.** That other branch is §4. | 0 |

**O3 — The locked desk drawer:**

| Rnd | Step | Rule | Dice | Result | A |
|---|---|---|---|---|---|
| 7 | Climb the desk: 4 squares of climbing, plus 2 across | Ch 3 Climbing (the vertical distance is ST fiat, I-16) | — | — | 0 |
| 8 | The Architect: *I Made a Thing — Bypass* ("pop a simple latch, wedge a drawer — no roll"), using a paperclip on the desk | Ch 5 Tinkerer | — | The drawer is open. **Obstacle 3 is solved without a roll.** A 64% Critical chance on Jury-Rig at D2 was the only reason to roll instead (I-12). | 0 |
| 9–11 | Lower the stick on silk, drag it to H, and feed it through | Ch 12 "if it's the kind of thing silk obviously does… just do it"; R7 | — | Squeezes through H skipped per Ch 2 "When Not to Roll", which contradicts Ch 3's "takes a roll" (I-20). | 0 |
| 12 | Descend the cable run to ground (14,1). **Before dropping, the Architect jams the PIR head P** (a second sensor) | Spitting, no roll | — | A second sensor is gone with no roll. | 0 |

**O4 — Unknown: "the cleaning cart is parked across the vent the crew planned to leave through":**

| Rnd | Step | Rule | Dice | Result | A |
|---|---|---|---|---|---|
| 12 | Reveal (Ch 13 "Introduce it when it becomes unavoidable"). From the ceiling, the office team sees two cleaners: A at the cart blocking V, and B pushing a vacuum along rows 6–7. | Heist 2 ST Prep | — | Cleaner B is a *Distracted Human* (Ch 16 routes the cleaning crew to the Ch 15 Human Obstacles). The vacuum is the Ch 16 Vacuum. | 0 |
| 12 | The Architect reads the cleaners' routine and picks a new exit | Ch 15 Vacuum: "Athletics or Tactics (2)" | Tactics 8: 1 1 6 3 6 3 5 6 → **4** | **Critical** (4 on D2). The Alert is already 0. Bonus: the ST reveals B, the propped service door, and that cleaner B wears headphones. The unknown obstacle is **sidestepped by a Critical** (I-14). | 0 |

### Phase 4 — The Escape (ST-built per Ch 11/17)

**E1 — "The floor":**
- **Goal:** get the stick and all five spiders out through B.
- **Answers other than Athletics:** Stealth (use the gaps), Tactics (read the vacuum), Deception or a Fast Talk distraction, and Brawl (hold the guard). This meets "at least one escape obstacle must be solvable without Athletics".
- **One obstacle only:** Ch 11 allows 1–2, and there was no second obstacle the fiction needed.

Guard's second rest roll: d6 = **5**, so it leaves L on round 13. **ST choice:** this lap takes the stairs to the ground floor. "Loops the perimeter" doesn't say which floor.

| Rnd | Step | Rule | Dice | Result | A |
|---|---|---|---|---|---|
| 13 | Office team carries the stick (14,1)→(14,3). Riser team descends Q. | R7 | — | — | 0 |
| 14 | **Filament's Easily Distracted fires** (a shiny key ring). Crinkle waits for her. | Flaw 9 "the ST can delay your action by one round"; Step 7 "+1 SP" when it causes a genuine problem | — | Filament loses her action. **+1 SP → 8.** The flaw's own text doesn't mention SP, though Butterfingers' does (I-27). | 0 |
| 14 | ST phase: the guard comes out of the stair door S (15,2). The office team is at (14,5), 3 squares away with no cover. | Opposed; R10 (one guard roll vs each spider) | Guard 4: 2 6 5 2 → 2 · Nook 6: 2 2 4 6 2 6 → 3 · Cassette 5: 5 4 5 1 5 → 4 · Architect 5: 3 6 4 6 3 → 3 | All hidden (Soundless −1 was moot). **Show-Off could not be triggered: it only rewrites a Difficulty, and opposed rolls have none** (I-26). | 0 |
| 15 | Office team: (14,5) → B → out. **Stick and 3 spiders out.** Riser team walks the south wall (15,8 to 6,9). | — | — | — | 0 |
| 16 | Crinkle crosses the vacuum lane | Ch 15 Vacuum (2) | Athletics 8: 2 6 6 2 3 2 2 2 → 2 | Success | 0 |
| 16 | ST phase: guard (15,8) against Crinkle (12,6) and Filament (11,6), open floor | Opposed, R10 | Guard 4: 4 1 1 6 → 2 · Crinkle 4: 4 3 1 4 → 2 · Filament 6: 6 5 2 1 2 4 → 3 | **Tie: the world wins, and Crinkle is spotted.** Filament stays hidden. | 0→**1** (guard "Raises the Alert by 1 the moment it spots"; R8) |
| 16 | Crinkle **declines** a 2 SP reroll | Ch 8 "early on, hoard" | — | — | 1 |
| 16 | Guard moves adjacent and **attacks** Crinkle | R5; Ch 10 Taking Hits | Guard Brawl 3: 4 4 6 → **3** · Crinkle shrug BODY+End 8: 2 1 3 6 2 1 1 1 → 1 | The attack beats him by 2 → drop 1 level… | 1 |
| 16 | …Crinkle uses **Run It Again** on the shrug. Is a shrug a "physical-confrontation roll"? Ruled yes (I-28). | Ch 4 Wolf | Reroll 7 failed: 1 3 2 5 1 1 5 → 2 (+1 kept) = **3** | 3 meets 3, and ties go to the defender: **shrugged off.** The attack landed but did no damage. | 1 |
| 16 | The vacuum reaches Filament | Ch 15 Vacuum, Tactics (2) | Tactics 6: 4 1 1 6 2 3 → 2 | She steps aside. The book never says what the vacuum does if it *catches* a spider (I-9). | 1 |
| 17 | Mid-Heist Complication roll (ST's choice to use Ch 20) | Ch 20 d6 | 1: **5**, "a phone lit up… room briefly, brightly visible" | There are no mechanics. The ST rules that cover is gone for this round (I-29). | 1 |
| 17 | Crinkle uses **Make a Scene** (free) and Brawls the guard | Ch 5; R6 | Crinkle 8: 6 4 5 6 1 6 1 1 → 5 · Guard 3: 2 1 5 → 1 | Crinkle wins, and the guard loses its next action. Is 5 vs 1 a "Critical"? Undefined; ruled no (I-19). Make a Scene also pulls **cleaner B** onto Crinkle, since it says "every NPC in the scene" (I-30). | 1 |
| 17 | Filament (+2 dice from Make a Scene, not needed) walks 4 squares out of B | — | — | **Filament out.** | 1 |
| 17 | ST phase: cleaner B swings her mop at Crinkle. The toolkit's closest entry is *Human With Broom*. | Ch 15 "Athletics (3)"; Arachnophobe Magnet | Athletics 8: 6 6 1 1 5 5 4 4 → **6** | **Critical** (6 on D3): **Alert −1.** Bonus: he rides the mop head toward the door. | 1→0 |
| 17 | End of round: guard aware +1, then Make a Scene "Afterward… Alert goes up by 1" | Ch 16; Ch 5 | — | — | 0→1→**2** |
| 18 | Crinkle (Speed 7) is out through B | — | — | **Whole crew out, with the stick.** | 2 |

### Phase 5 — Debrief

| Step | Rule | Result |
|---|---|---|
| Outcome | Ch 11 "Full Success — Escaped with the complete objective. Standard 3" | **Full Success.** Is it 3 AP *per spider* or per crew? Not stated; ruled per spider (I-31). |
| SP | Ch 8 / Ch 11 "You start every heist with WIT + NERVE" | 30 at start, **0 spent**, +1 earned. All 31 leftover points **evaporate** (I-21). |
| AP spend | Ch 11 Spending AP | Cassette: 3 → *Read the Room*. Nook: 2 → WIT 3, and 1 → Perception 3. Architect: 3 → *I See How This Works*. Crinkle: 2 → NERVE 4, and 1 → Stealth 2. Filament: 2 → BODY 3, and 1 → Endurance 1. All within the post-creation maximum of 5 ✓. |
| Unused | — | Show-Off ×2 never fired, and neither did Fast Talk, Plausible Deniability, That's Not What Happened, Phase Through ×2, Everything Connects, Field Repair, Take the Hit, That All You Got?, or the Jumping leap. |

**Main-line totals:**
- 26 dice pools rolled, across 5 Casing rolls and 21 in play (plus 3 d6 table rolls).
- 3 Critical Successes, 0 Partials, 0 Failures.
- 1 attack landed, 0 Vitality lost.
- Peak Alert 2/8.

---

## 4. Branch B — cover is ignored in opposed rolls (replay from round 6)

The only change is R2, the ruling that cover gives the guard −2. Ch 3 only says cover "Increase[s] the Difficulty to spot or target you by 2", and an opposed roll has no Difficulty, so this branch drops cover from opposed rolls. The Architect keeps the main-line rolls up to round 6. Every roll after the fork is fresh.

**Transparency note:** my first pass at this branch put Filament's bribe on round 10, when she could not reach the dead drop until round 12. I discarded those rolls and re-rolled the branch from round 10 (B′ below). The discarded dice were:
- bribe 4: 3 4 5 1
- Tactics 8: 1 2 4 6 5 5 1 1
- cleaner d6: 6
- squeeze 6: 5 6 6 5 4 6
- assist 3: 6 4 5
- Nook 6: 5 5 3 5 3 4
- Architect 5: 6 3 4 5 2
- Cassette 9: 3 1 1 5 1 6 6 2 5
- Crinkle 8: 5 4 1 1 4 6 1 6 and 4: 2 5 5 6

Three of those discarded rolls were Criticals at Difficulty 2, which is itself telling (I-13).

| Rnd | Step | Rule | Dice | Result | A |
|---|---|---|---|---|---|
| 6 | Same roll as the main line: guard 2 vs Filament 1 and Crinkle 2 | Opposed, ties to the world | (as above) | **Both spotted.** | 0→1 |
| 6 | Guard attacks Filament | R5 | Guard 3: 3 3 6 → 1 · Filament shrug BODY 2 + End 0 = 2: 2 2 → 0 | She would drop to Rattled… | 1 |
| 6 | …Crinkle (adjacent) uses **Take the Hit**. Timing ruling: he takes the *hit* and rolls his own shrug (I-32). | Ch 5 | Shrug 8: 4 5 3 3 1 5 6 1 → 4 | 4 beats 1: shrugged off. | 1 |
| 7 | Crinkle: **Make a Scene** plus Brawl. Filament starts the 14-square trip to the dead drop at L. | Ch 5; R6 | Crinkle 8: 4 6 6 4 5 3 2 6 → 6 · Guard 3: 4 1 5 → 2 | Crinkle wins. Guard aware +1, then Make a Scene +1. | 1→**3** (Stirring) |
| 8 | Crinkle Brawls again (the guard loses its action) | R6 | 8: 6 6 1 5 3 5 5 1 → 5 · 3: 5 4 2 → 2 | Win. Aware +1. | 4 |
| 9 | Crinkle Brawls. Filament reaches L and takes the crumb. | R6 | 8: 6 4 6 2 6 6 1 3 → 5 · 3: 2 6 1 → 1 | Win. Aware +1. **Active:** the ST starts the cleaners moving downstairs. | **5** |
| 10 | B′: Crinkle Brawls | R6 | 8: 4 2 3 3 4 6 3 5 → 4 · 3: 2 6 5 → 2 | Win. Aware +1. **No rule lets the crew switch the guard's awareness off** (I-8). | 6 |
| 11 | Crinkle Brawls | R6 | 8: 5 3 5 5 4 4 1 6 → 6 · 3: 5 6 6 → 3 | Win. Aware +1. **LOCKDOWN.** Cleaners turn the lights on; cleaner B becomes an *Alert Human*. | **7** |
| 12 | Crinkle Brawls at Lockdown: +1 to the guard's Successes (R2) | R2 | 8: 3 2 5 1 5 1 2 2 → 2 · 3: 1 6 3 → 1 (+1 = 2) | **Tie: the world wins.** The guard will act next round. | 7 |
| 12 | Ground floor: the Architect's O4 Tactics roll, at D2 +1 Lockdown = D3 | Ch 9 | 8: 4 6 5 5 5 1 6 4 → **7** | **Critical** (6+ on D3): **Alert −1**, so Lockdown ends. Do NPC states step back down? Undefined; ruled no (I-33). | 7→**6** |
| 12 | Filament offers the bribe. The guard's Weakness has no Difficulty; ruled Persuasion D2, +1 Lockdown = D3. **Why can Filament charm it when the Face "cannot"?** (I-34) | Ch 16 Weakness | Persuasion 4: 2 2 5 2 → 1 | **Partial.** Complication: it pockets the crumb but stays aware this round (+1). | 6 |
| 12 | Filament spends **4 SP, Not Part of the Plan**, and negates the complication. Is that once per heist per *crew* or per *spider*? (I-35) | Ch 8 | — | The guard stands down. Filament's SP 7 → 3. | 6 |
| 13 | Cassette uses **Fast Talk** on cleaner B (free, no roll, 1 round). The office team carries the stick to the cabinet C (14,3). | Ch 5 | — | — | 6 |
| 14 | The team waits behind C. With no aware creature on the map, **waiting costs nothing** (I-36). | — | — | — | 6 |
| 15 | Cleaner B searches toward S and passes C. The team is hidden in cover. The Alert Human is D4, +1 for Stirring-at-Active (R9), −2 for cover (R3) = D3. Arachnophobe Magnet makes it D4 for the Architect. | R3, R9 | Nook 6: 5 6 2 4 6 2 → 4 · Cassette 6 (5 +1 SP): 3 3 5 4 4 1 → 3 · Architect 5: 1 6 1 1 2 → 1 | Nook succeeds and Cassette succeeds. **The Architect gets a Partial** and is seen ("spotted briefly" +1). | 6 |
| 15 | Cassette uses **Plausible Deniability** to talk the +1 away | Ch 5 | — | — | 6 |
| 15 | Partial complication: the cleaner swats at the Architect | Ch 15 Human With Broom (3) | Athletics 2: 1 2 → **0** | **Failure.** "A roll fails with a consequence" +1, and the hit lands. | **7** |
| 15 | Shrug against the mop. **A human has no attack pool**; R5 uses D3 as its Successes. | Ch 10 | Shrug BODY 2 + End 1 = 3: 3 4 1 → 1 | Beaten by 2: **the Architect is Rattled (−1 die).** | 7 |
| 16 | Cleaner reaction, d6 (1–2 keep searching, 3–4 fetch spray, 5–6 phone): **6**. She phones, and **the Exterminator is seeded**. Arrival in d6 rounds: **2**. | Ch 16 Exterminator "only… Lockdown (7+)… if the ST decides the humans called someone" | — | While on the phone she is a *Distracted Human* (D1): D3 with Stirring and Lockdown. | 7 |
| 16 | Office team moves 2 squares in the open. Nook at D2 (Soundless); Cassette at D3; the Architect at D4 (Magnet), 5 −1 Rattled +1 SP | Ch 9 | Nook 6: 3 1 2 1 5 5 → 2 · Cassette 5: 3 6 2 3 2 → 1 · Architect 5: 2 4 6 5 2 → 3 | Nook succeeds. **Cassette Partial:** the stick is left in the open. **Architect Partial:** seen, +1. | 7 |
| 16 | Cassette spends **That's Not What Happened** (2 SP): "It was a dust bunny." | Ch 5 | — | That +1 is cancelled. Cassette's SP 4 → 2. | 7 |
| 16 | Riser team, which came down Q on round 13 and walked the wall on rounds 14–15: Crinkle's Stealth at D1 +2 +1 Magnet = D4; Filament's at D3; Crinkle crosses the vacuum lane at D2 +1 = D3 | Ch 9, 15 | Crinkle Stealth 4: 5 2 4 1 → 2 · Filament 6: 4 2 1 4 4 2 → 3 · Crinkle Athletics 8: 1 2 3 1 1 3 1 1 → **0** | Filament succeeds. **Crinkle's Stealth is a Partial:** seen, +1. **His vacuum roll is a Failure:** what does the vacuum *do*? Undefined (I-9). | 7→**8 FULL ALERT** |
| 16 | Crinkle uses **Run It Again** on the vacuum roll | Ch 4 | Reroll 8: 6 3 5 2 3 4 4 4 → 5 | Success. Not sucked in. | 8 |
| 16 | **Full Alert** with the objective in hand: "If they do have it, they just need to get out." The ST "plays the lockdown" (Ch 18): all lights on, and cleaner B charges. **Nothing changes mechanically** (I-37). | Ch 9, 18 | — | Does Lockdown's +1 still apply? It is 7+, so yes. | 8 |
| 17 | Crinkle uses **Make a Scene** (a new scene under R1). The office team and Filament walk out under it. | Ch 5 | — | Stick and 4 spiders out. Make a Scene +1 takes the Alert **past the Limit**, which does nothing (I-37). | **9** |
| 17 | ST phase: the mop swing at Crinkle, D3 +1 Lockdown = D4 | — | Athletics 8: 3 5 6 5 1 4 3 4 → 5 | Success. | 9 |
| 18 | Crinkle is out. The Exterminator arrives to an empty office. | — | — | **Full Success.** 3 AP each, same as the main line. | 9 |

**Branch B totals:**
- **Same objective, same AP:** a Full Success, like the main line.
- **SP:** 8 spent (4 NPotP, 2 TNWH, 1 +1 die, 1 +1 die).
- **Harm:** 1 Vitality level lost.
- **Alert:** Full Alert reached, and it cost the crew nothing.
- **What decided the branch:** whether cover counts inside an opposed roll. The Alert difference came from the guard's "+1 per round aware", which ran unchecked for 5 rounds.

---

## 5. Procedure probes (not part of the session; real dice)

| Probe | Why | Dice | Finding |
|---|---|---|---|
| P1 — Cassette runs five Silk Lines in a quiet room (GRACE 5 + Acrobatics 2 = 7 dice vs D2, which Ch 12 *prescribes*) | Critical farming | 7: 5 4 4 1 5 1 6 → 5 · 7: 2 2 3 5 1 1 2 → 1 · 7: 6 4 4 2 2 5 3 → 4 · 7: 1 5 1 3 5 5 4 → 4 · 7: 4 6 3 6 3 4 6 → 5 | **4 Criticals in 5 rolls → Alert −4**, plus one Partial. The odds of a Critical at D2 are 50% on 7 dice and 64% on 8 (I-13). |
| P2 — Crinkle at Critical (−3) tries Engineering: WIT 2 + 0 − 3 = −1 | Botch | 1: **1** | Botch → Alert +2. Chapter 2 lists "Lockdown" as a pool-reducer, but Lockdown raises *Difficulty* (I-38). |
| P3 — Filament, while Hurt, shrugs a House Cat Pounce: 2 − 2 = 0 dice → 1 Botch die | Botch meets shrug | Cat 4: 4 1 2 3 → 1 · Filament 1: **1** | She drops a level. **Is the shrug also a Botch (+2 Alert)?** Undefined (I-38). |
| Waiting Web walkthrough (no one went Out) | Ch 10 | — | See I-39: where the replacement enters, what happens if you go Out in the last obstacle, what happens to carried loot, and whether the original is ever back. |

---

## 6. ISSUES

The format for each issue is: severity · category · where it came up · book passage · suggested fix.

### Blockers

**I-1 · Blocker · Undefined — Difficulty modifiers have nothing to act on in an opposed roll.**
- **Where:** round 6, the Heist 2 obstacle that the book bills as the "First real opposed roll". Cover decided whether two spiders were spotted, and the whole of Branch B follows from that one call. It also came up for Stirring and Lockdown (round 12 of Branch B, where the tie went to the guard), for Soundless, and for Show-Off.
- **Passages:**
  - Ch 2: "Both sides roll. Most Successes wins."
  - Ch 3: "Increase the Difficulty to spot or target you by 2."
  - Ch 9: "Stealth rolls have their Difficulty increased by 1."
  - Ch 14: "Stealth near it is at the Lockdown penalty".
  - Soundless: "Reduce the Difficulty of Stealth rolls…"
- **Fix:** add one line to Opposed Rolls: "Difficulty modifiers still apply: each +1 Difficulty on your side adds 1 to the opponent's Successes; each +1 Difficulty for the NPC to spot or target you subtracts 1 from theirs." Also define whether a Critical exists in an opposed roll (I-19).

**I-10 · Blocker · Balance feel — the Spitting Spider's jam and pin have no limit and no roll, and they erase sensor obstacles.**
- **Where:** in O1 and at the PIR head, **both sensors were jammed with zero rolls**. Heist 2's first suggested obstacle ("Pattern known, timing tight") never happened. The pin could also freeze a Guard Spider every round.
- **Passages:**
  - Ch 4: "no roll to hit… jam a small mechanism (a lock, a sensor, a latch)… pin a small target in place for one round."
  - Ch 4: "You don't spend Silk Points on your species ability. You don't roll for it. It works."
- **Fix:** make it "Once per scene" like every other active species ability, and give the jam a duration (for example, "until the end of the next round" or "until the obstacle ends"). Or keep it at-will but make a jammed sensor count as "evidence" (+1 Alert if a patrolling NPC passes it).

**I-13 · Blocker · Balance feel — Critical Successes at Difficulty 2–3 are common enough to cancel the Alert.**
- **Where:** there were 4 Alert-reducing Criticals in play:
  - Cassette's squeeze, which wasted its drop at Alert 0.
  - The Architect's O4 roll at D2, also at Alert 0.
  - Crinkle's mop dodge at D3.
  - The Architect's D3 roll in Branch B, which ended Lockdown.
  - Three more came up in the discarded rolls, and P1 produced 4 in 5 rolls.
- **Chance of a Critical at D2** (needs 4 Successes): 6 dice 34% · 7 dice 50% · 8 dice 64%.
- **Passages:**
  - Ch 2: "the Alert drops by 1 (only on a roll of Difficulty 2 or higher). This is the only thing that lowers the Alert during a heist. Savor it."
  - Ch 12 *prescribes* a D2 roll for every Silk Line: "roll GRACE + Acrobatics against Difficulty 2 (or spend 1 SP to skip the roll)".
- **Why REVIEW #28 didn't cover it:** the Difficulty 2+ floor stops farming on Difficulty 1 rolls. It doesn't stop farming on Difficulty 2 rolls.
- **Fix:** any one of these:
  - (a) Only a Critical on Difficulty 3+ lowers the Alert.
  - (b) Only a Critical that resolves an obstacle's key roll lowers the Alert, once per obstacle.
  - (c) Change the Critical to "needed + 3 extra Successes" instead of double.

  Also make the Silk Line automatic when there's no pressure.

**I-3 · Blocker (process) · Process friction — Casing produces far more Successes than any heist has intel.**
- **Where:** Phase 2. Five spiders rolled **17 Successes**. Heist 2 lists 3 intel items. The ST improvised 6 more and still wasted 8 Successes. Ch 13 forbids revealing the unknown obstacle, so the book offers the ST nothing to give.
- **Passages:**
  - Ch 11: "each Success reveals one concrete piece of intel the ST is holding".
  - Ch 19 Heist 2: three intel lines.
  - Ch 13: "at least one obstacle the crew didn't uncover in Planning".
- **Fix:** either make Casing roll against a Difficulty (for example D3, with each Success *beyond* it adding a detail), or have the crew make one pooled Casing roll with Assists. Give each ready-to-run heist 6–8 intel items, and add "extra Successes may be banked as +1 die on a later roll against that threat".

### Confusing

**I-2 · Confusing · Unclear wording — "Difficulty to spot/remember you" is written from the NPC's side, but most spotting is resolved as the spider's Stealth roll.**
- **Passages:**
  - Cover: "Increase the Difficulty to spot or target you by 2."
  - Crab: "the Difficulty to spot you increases by 2".
  - I Was Never Here: "Increase the Difficulty for any NPC to remember seeing you by 2."
  - Arachnophobe Magnet: "The Difficulty to be spotted by humans is **reduced** by 1."
- **Where:** every Stealth roll against the cleaners (R3). Against a human with no pool, a +2 to the NPC's Difficulty only works if you invert it into −2 on the spider's own Difficulty. Taken literally, cover on a D2 roll makes it an automatic success.
- **Fix:** write all of these from the spider's side: "Your Stealth Difficulty against that observer is reduced by 2" or "…increased by 1 (Arachnophobe Magnet)". In opposed rolls, apply I-1's conversion.

**I-4 · Confusing · Contradiction — Does the Stirring Stealth +1 still apply at Active (5–6)?**
- **Where:** Branch B, rounds 9–16.
- **Passages:** Ch 9's table says "3–4 — Stirring… Stealth… +1" and "5–6 — Active… **No roll penalty yet**." The Quick Reference agrees ("no roll penalty"). But the Storyteller Note says "At Alert 7+, Stealth is +2 total (the Stirring penalty and the Lockdown penalty both apply)". That only works if Stirring's +1 carries upward, and then Active *does* have a Stealth penalty.
- **Fix:** change the Active row to "Stealth +1 continues. No *new* penalty." Change the Quick Reference to "5–6 Active: threats wake; Stealth +1 still applies".

**I-5 · Confusing · Undefined — There is no group or multi-spider roll procedure.**
- **Where:** several spiders were exposed to one watcher (main line rounds 6, 14 and 16; Branch B rounds 15 and 16). Does the guard roll once, or once per spider? Does every crew member crossing a sensor line roll? Only one Assist is allowed per roll, so five separate rolls mean five chances to fail and five Alert risks.
- **Passages:**
  - Ch 2: "Only one spider can Assist a given roll."
  - Ch 11: "Obstacles… the crew solves however they like".
- **Fix:** add a "Group Checks" paragraph. The NPC rolls once per round against everyone in its senses. For a group move, the crew nominates a leader who rolls, each other spider may Assist (max 3 dice), and a failure raises the Alert once.

**I-6 · Confusing · Undefined — "Scene" is never defined, but at least 12 powers are "once per scene".**
- **Where:** R1. It also mattered when the crew was split across two floors (Branch B round 12): was Cassette, one floor down, "in the scene" for Plausible Deniability?
- **Passages:**
  - Once per scene: Jumping, Orb Weaver, Wolf, Phase Through, I Made a Thing, Make a Scene, Plausible Deniability, Fast Talk, Jury-Rig, Field Repair, Take the Hit, Thunderous Entrance…
  - Ch 10 uses "once per obstacle".
- **Fix:** Ch 11: "A **scene** is one obstacle (or one escape obstacle). A spider is in the scene if it is on the same map area as the obstacle."

**I-7 · Confusing · Undefined — Creatures have no Vitality or defeat state, so Brawl has no win condition.**
- **Where:** Crinkle won 6 of 7 opposed Brawls against the guard, and each win did nothing the book defines (R6). The only thing that worked was "holding" it round after round while its "aware" Alert ticked up.
- **Passages:**
  - Ch 16 gives pools only.
  - Guard Weakness: "the Bruiser (works, but loudly)".
  - Ch 15: "survived".
- **Fix:** add a short "Beating a creature" rule. Win an opposed Brawl → the creature is driven off or pinned for 1 round. Win by 3 or more → it is out of this obstacle, costing +1 Alert (loud). Each creature block gets a "Driven off by:" line.

**I-8 · Confusing · Undefined — Guard Spider awareness: no Senses, no Escalation, no way to end it, and unclear stacking.**
- **Where:** R4 and R8. In Branch B a single guard spider pushed the Alert from 1 to 7 in 5 rounds, and nothing in the rules makes it unaware again. Bribery ended it only because of an ST ruling. "Calls for backup" (+2) names no backup.
- **Passages:**
  - Guard block: "+1 per round aware, +2 if it calls for backup", and "Raises the Alert by 1 the moment it spots the crew".
  - Ch 9: "+1 Spotted briefly", "+2 A confirmed alert", and "A creature is *active* when its Escalation says it's awake, hunting or pursuing." The Guard has no Escalation line.
- **Fix:**
  - Give the Guard the missing lines: "Senses: 6 squares, line of sight" and "Escalation: Alert 3 checks the objective room; Alert 5 doubles its patrol speed; Alert 7 calls backup (a second Guard Spider arrives)".
  - Add "Aware ends if the crew breaks line of sight for a full round, or a Weakness is used."
  - State that "spots the crew +1" *is* the "spotted" increase, not an extra one.

**I-9 · Confusing · Undefined — Humans and the Vacuum have no attack or capture resolution.**
- **Where:**
  - The mop swat (Branch B round 15) had no attack Successes to shrug against (R5).
  - Crinkle failed a vacuum roll with 0 Successes on 8 dice, and the book doesn't say whether he gets hit, inhaled, or goes Out.
  - The Vacuum's "Pursuit 3" has no stated use.
- **Passages:**
  - Ch 10: "When a threat lands a hit… roll BODY + Endurance against the threat's attack."
  - Ch 10 intro: "inhaled by a vacuum".
  - Ch 15 Human With Broom: "Athletics (3)… The broom has already swung once."
- **Fix:**
  - Ch 10: "A threat lands a hit when its attack roll has 1+ Successes (or when you fail the Difficulty roll to avoid it). Against a threat with no pool, shrug against Successes equal to the obstacle's Difficulty."
  - Vacuum Note: "A spider it catches drops one level; a Critical spider it catches is Out."

**I-11 · Confusing · Balance feel — A known, fixed patrol loop plus honest distances means the guard can be walked around with no roll.**
- **Where:** the office team never rolled against the guard. They waited 4 rounds at a known distance. That runs against Heist 2's "First real opposed roll" and Ch 11's "Knowing the cat's route doesn't beat the cat."
- **Passages:**
  - Ch 3: "If the cat is 6 squares away, it is 6 squares away".
  - Ch 19 intel: "loops the perimeter every few rounds".
  - Ch 11: "it's information, not a free win."
- **Fix:** give patrols a variable element in their stat blocks (for example, "at the end of each lap roll 1d6: 1–2 it doubles back, 3–4 it rests, 5–6 it checks the objective room"). Or make waiting cost something (see I-36).

**I-12 · Confusing · Balance feel — A Spitting Spider Tinkerer solves 2 of Heist 2's 3 known obstacles with no rolls.**
- **Where:** O1 (the jam), and O3 (Bypass: "pop a simple latch, wedge a drawer — no roll"). The heist text promises "The locked desk drawer. Engineering moment."
- **Fix:** Bypass should work on "a simple latch", but *not* on a lock designed as an obstacle ("locks still need a roll, at −1 Difficulty"). Or give Heist 2's drawer a two-stage lock. Pairs with I-10.

**I-14 · Confusing · Unclear — Heist 2's unknown obstacle sits after the objective, and the Critical "second way out" can bypass it.**
- **Where:** O4.
- **Passages:**
  - Ch 11 P3: "Between the entry and the objective stand 3–4 obstacles."
  - Heist 2 (Unknown): "The cleaning cart is parked across the vent the crew planned to leave through".
  - Heist 2 ST Prep: "the cleaning crew came at 7 tonight, not 8. They're already here."

  Taken together, is the cart a Phase 3 or a Phase 4 obstacle? If the cleaners are "already here" when the crew enters, why aren't they visible at the Score? Meanwhile Ch 2's Critical bonus ("spot a second way out"), which fired twice here, handed the crew an exit around the cart.
- **Fix:**
  - Label it "(Unknown — Escape obstacle)", and let Ch 11 say one heist obstacle may land in the Escape.
  - Add a line saying where the cleaners are at entry (for example "in the basement break room until the Alert reaches 3 or the crew returns to the ground floor").
  - Tell the ST that a Critical's bonus can't cancel the unknown obstacle.

**I-15 · Confusing · Undefined — Heist 2 has no map, and its single entry breaks Ch 14's rule.**
- **Passages:**
  - Heist 2: "entry from the ground-floor ventilation" and "two floors". It doesn't say which floor the corner office is on. Only Heist 1 has a sample map.
  - Ch 14: "Entry points — at least two ways in".
  - Ch 11: "split the crew across two entry points".
- **Fix:** add a Heist 2 map (two 16 × 10 floors, with the riser and the stairwell as the "two routes"). Name a second entry (for example the mail slot, or a gap under the service door).

**I-17 · Confusing · Undefined — How many Preparations, and what do they cost?**
- **Passages:**
  - Ch 11: "a few concrete preparations" and "Pre-place one Silk Line", with no SP cost. Ch 8 prices a Silk Line at 1 SP.
  - "Stash one small item in a known square (see the Ghost's Dead Drop)". Can every spider do this, or is it the Perk only?
- **Fix:** "The crew makes up to one Preparation per spider. A pre-placed Silk Line is free; a stash without Dead Drop must be in a known square."

**I-18 · Confusing · Undefined — Loot carrying, size and movement.**
- **Where:** in O3 and the Escape, a memory stick had to go down a desk, through a cable hole and across a floor (R7).
- **Passages:** Ch 12 gives tiers but no handling. Ch 6's examples mention "carrying the loot bag".
- **Fix:** give each loot tier a carry profile. For example: "Crumb/Trinket: one spider, full Speed. Prize: two carriers at half Speed, or one at half Speed with an Athletics D2 per obstacle. Loot fits any gap its size allows (ST)."

**I-26 · Confusing · Unclear wording — Show-Off (×2 in this crew) almost never has a legal trigger.**
- **Where:** Show-Off couldn't fire on opposed rolls (round 14). On a D4 Alert-Human roll (Branch B), "the Difficulty 4 version" is no change at all. It also isn't clear whether band modifiers stack on top. Across both lines the flaw fired once, in a discarded roll.
- **Passage:** "the ST may require the Difficulty 4 version of a roll instead of the standard".
- **Fix:** "…increase the roll's Difficulty by 1 (or give the opponent +1 Success in an opposed roll) because you chose the flashier approach."

**I-33 · Confusing · Undefined — What happens when the Alert falls back below a threshold?**
- **Where:** Branch B round 12. A Critical took the Alert from 7 to 6. Does Lockdown end? Do the humans turn the lights back off? Does the cat stop hunting?
- **Passage:** Ch 9 thresholds are described only as the Alert "crosses" upward.
- **Fix:** "Roll penalties follow the current number. NPC behaviour triggered by a threshold does not reset."

**I-35 · Confusing · Unclear — "Once per heist": per spider, or per crew?**
- **Passages:**
  - Not Part of the Plan: "Once per heist."
  - Damage Control: "The crew spends 3 SP together… Once per heist."
  - Flaws: "Once per heist, the ST may…"
- **Fix:** state it per item: "once per heist (per crew)" for Damage Control and Not Part of the Plan, and "once per heist per spider" for the flaws and signature moves.

**I-37 · Confusing · Balance feel — Full Alert does nothing once the crew holds the objective, and the Alert past the Limit is meaningless.**
- **Where:** Branch B ran at 8 and then 9 of 8. The escape was no harder than at 7, and the crew had no reason to spend 4 SP to prevent it.
- **Passages:**
  - Ch 9: "If they do have it, they just need to get out."
  - Ch 18: "play the lockdown".
- **Fix:** give Full Alert teeth. For example: "At Full Alert all rolls are +2 Difficulty and each round the ST adds one threat; loot carried out at Full Alert pays –1 AP."

**I-38 · Confusing · Contradiction — Botch is described as caused by Lockdown, and its interaction with shrug rolls is unclear.**
- **Passages:**
  - Ch 2 Botch: "reduced to 0 or below — by Vitality penalties, **Lockdown**…" But Lockdown raises *Difficulty* and never reduces a pool (Ch 9).
  - Ch 7: "stacking with Lockdown penalties".
- **Where:** P3. A Hurt spider with BODY 2 and Endurance 0 shrugs with 0 dice. Is that a Botch, adding +2 Alert on top of the hit?
- **Fix:** remove "Lockdown" from the Botch sentence. Add: "Shrug-off rolls can't Botch; at 0 dice you simply take the hit."

**I-39 · Confusing · Undefined — Gaps in the Waiting Web.**
- **Where:** walkthrough only; no one went Out.
- **Questions the book doesn't answer:**
  - (a) Where does the replacement enter the map: the original entry, or next to the crew?
  - (b) Out in the *last* obstacle means there is no "next obstacle", so that player sits out. That contradicts Ch 1's "Nobody Sits Out".
  - (c) What happens to loot the Out spider was carrying?
  - (d) Is the original spider back next heist, or does the player keep the replacement? And who gets the AP?
- **Passage:** Ch 10: "They enter at the start of the next obstacle, starting Rattled… with half their starting Silk Points".
- **Fix:** add four sentences answering (a)–(d). For (b): "If there is no next obstacle, the replacement arrives at the start of the next round at the crew's entry point."

### Minor

**I-16 · Minor · Undefined — Vertical distance on a top-down grid.**
- **Where:** climbing the desk (how many squares?), the riser, and the drop from the ceiling. The ST made up every height.
- **Passage:** Ch 3: "moving up a wall or across a ceiling costs normal movement".
- **Fix:** add "Heights are given in squares on the map key (a desk is 3, a counter 4, a room 8)". Also add height to the Ch 14 map checklist.

**I-19 · Minor · Undefined — The Alert floor, and Criticals in opposed rolls.**
- **Where:** two Criticals landed at Alert 0 and their drops were wasted. It wasn't clear whether 5 vs 1 in an opposed Brawl counts as a Critical.
- **Fix:** "The Alert never goes below 0." And: "Opposed rolls have no Critical" (or: "Critical if you roll double the opponent's Successes, minimum 2").

**I-20 · Minor · Contradiction — Mandatory squeeze and Silk Line rolls versus "When Not to Roll".**
- **Passages:**
  - Ch 3: "a gap smaller than a square takes an Acrobatics roll".
  - Ch 12: "roll GRACE + Acrobatics against Difficulty 2".
  - Ch 2: "Roll when the outcome is uncertain and failure would be interesting."
- **Why it matters:** it feeds I-13.
- **Fix:** add "…when under pressure" to both rules.

**I-21 · Minor · Balance feel — The SP economy was barely used.**
- **Where:** the main line spent 0 of 30 SP. Branch B spent 8. Unspent SP evaporate, because the next heist resets to WIT + NERVE, and Ch 8's "start conservative" advice pushes players to hoard.
- **Fix:** let up to 2 unspent SP carry over, or convert 5 unspent crew SP into 1 AP.

**I-22 · Minor · Balance feel — Cellar Spider plus Ghost overlap.**
- **Passages:** *Contortionist* ("any gap… no roll… ever") already does most of *Phase Through* ("move through any space… no roll"). What's left is "no Alert increase" and "same turn".
- **Fix:** give a Cellar Ghost's Phase Through a rider (for example, "you may bring one adjacent ally or a Trinket-sized item").

**I-23 · Minor · Balance feel — The Spitting Spider's +3 all lands on SP stats.**
- **Passage:** "WIT +2, NERVE +1". The Architect started with 8 SP against a crew median of 5, and the species ability already beats the crowd (I-10).
- **Fix:** make it WIT +1 and NERVE +1, or note the SP effect in the species trade-off text.

**I-24 · Minor · Unclear wording — The Role bonus split and step order.**
- **Passages:**
  - Ch 5: "+3 points split between them".
  - Ch 7: "Your Role adds 3 more points that must go on your two core skills, and can't push either above 3."
- **Problems:** is 3/0 legal? If a player spends 3 own points in each core skill first, the bonus can't be placed.
- **Fix:** "First place the 3 Role points (any split, 0–3 each), then spend 12 points; no Skill above 3."

**I-25 · Minor · Undefined — Duplicate roles and flaws from random rolls.**
- **Where:** the random role roll gave a second Ghost, and the flaw rolls gave two pairs of duplicates.
- **Fix:** "Duplicates are allowed; reroll if the table prefers variety."

**I-27 · Minor · Inconsistent — Which flaws pay SP.**
- **Passages:**
  - Butterfingers says "You earn 1 SP for the trouble".
  - Show-Off pays SP only "On a Critical".
  - The others say nothing, even though Step 7 promises +1 SP whenever a flaw "causes a genuine problem".
- **Fix:** remove the per-flaw SP lines and rely on Step 7. Or add the line to every flaw.

**I-28 · Minor · Unclear — Wolf "Run It Again" on non-Difficulty rolls.**
- **Where:** the ST had to rule whether a shrug-off counts as a "physical-confrontation roll", and what "fail or partially succeed" means in a comparison roll.
- **Fix:** "…on any roll to chase, flee, fight or shrug off a hit that doesn't fully succeed".

**I-29 · Minor · Undefined — The Mid-Heist Complication table has no mechanics or timing.**
- **Where:** round 17 rolled "phone lit up", and the table gives no mechanical effect or timing guidance.
- **Fix:** give each entry a one-line effect (for example, "5: no cover this round"). Add "roll when the crew stalls, or once per obstacle at Alert 3+".

**I-30 · Minor · Unclear — Make a Scene and humans.**
- **Passage:** "pull every NPC in the scene onto themselves". That includes humans, who now watch a spider brawl.
- **Question:** is that covered by the flat +1, or is it also a "confirmed alert" (+2)?
- **Fix:** "The +1 is the only Alert this causes."

**I-31 · Minor · Unclear — Is AP per spider or per crew?**
- **Passage:** Ch 11: "Full AP for the difficulty: … Standard 3".
- **Fix:** "Each surviving spider (and each replacement) earns…"

**I-32 · Minor · Unclear — Take the Hit timing.**
- **Question:** is the hit redirected before or after the ally's shrug, and does the Bruiser roll his own shrug?
- **Passage:** "redirect a physical consequence meant for an adjacent crewmate to yourself".
- **Fix:** "Before the shrug roll: the hit targets you instead, and you roll the shrug."

**I-34 · Minor · Contradiction-ish — The Face versus the Guard Spider.**
- **Passage:** the Guard "cannot be charmed by the Face", yet "The crew could try talking to one. The Difficulty is 4." The Face is the one spider barred from talking to it, and a Ghost can bribe it with Persuasion.
- **Question:** does Fast Talk ("Distract any NPC") count as charm?
- **Fix:** "Persuasion against it is +2 Difficulty for everyone (professional courtesy); Deception and bribery work normally."

**I-36 · Minor · Balance feel — Waiting is free.**
- **Where:** the creature Alert contributions tick only "per round" while a creature is active. With nothing active, the crew could wait out any human with no cost (Branch B round 14). Heist 2's clock ("comes through at 8") has no conversion to rounds.
- **Fix:** add a Heist Clock: "every 3 rounds of waiting, +1 Alert" or "the ST advances an NPC routine one step". Give rounds a rough length (for example, 10 seconds).

**I-40 · Minor · Undefined — Reactive rolls versus "one Action per turn".**
- **Where:** dodging the vacuum or a broom, and shrug rolls, all happened in turns where the spider had already used its Action.
- **Fix:** "Rolls the ST calls for in response to a threat don't use your Action."

**I-41 · Minor · Undefined — Line of sight through glass.**
- **Where:** the glass front door and partition.
- **Question:** can you spot someone, or spit at them, through glass?
- **Fix:** "Glass allows sight, not strands or silk."

---

## 7. What worked well

- **The core engine is fast.** Count 4+ against the Difficulty table. Nobody needed the rules after the second roll. Partials produced the best moments (the stick left in the open, the mop swat).
- **Casing is quick and exciting**, one roll per spider. The ST prep just needs more intel (I-3).
- **Prep complications** ("the prep works; the world is complicated") created texture without taking anything away: the half-open grille, and the ant on the bribe.
- **Turn order** (the crew, then the world) and **honest distances** made the guard's loop a real puzzle, and made "we can make that" moments happen.
- **The shrug-off** (BODY + Endurance, ties to the defender) resolves in seconds. Combined with *Take the Hit* and *Run It Again*, the Bruiser feels like a Bruiser.
- **Make a Scene** is the best-designed spotlight tool in the book. It is simple and self-costed, and it created a clear exit window twice.
- **Plausible Deniability** and **That's Not What Happened** are bounded and satisfying Alert-savers, and the Face was busy in Branch B.
- **The Escape rule** "at least one obstacle solvable without Athletics" pushed the ST to build a better escape (Stealth, Tactics, Deception and Brawl all mattered).
- **The Critical Success bonus** "spot a second way out" gave a lovely emergent route (the cable hole). It is just too frequent (I-13) and can bypass the unknown (I-14).
- **Ch 18's advice** (describe thresholds, finish the round before the Limit bites) is exactly right for the table.

## 8. Top issues at a glance

| # | Sev | One line |
|---|---|---|
| I-1 | Blocker | Band modifiers, cover, Soundless and Show-Off can't be applied to opposed rolls. Heist 2's showcase roll depended on the ST's conversion. |
| I-10 | Blocker | The Spitting Spider jams sensors and locks, and pins small creatures, at will with no roll. |
| I-13 | Blocker | Criticals at D2–D3 happen 34–64% of the time on 6–8 dice and repeatedly push the Alert down. Silk Line rolls can farm this. |
| I-3 | Blocker | Casing gave 17 Successes against 3 intel items. |
| I-8 | Confusing | Guard Spider awareness has no Senses, no Escalation and no off-switch. It alone pushed the Alert from 1 to 7. |
| I-7/I-9 | Confusing | Creatures can't be defeated. Humans and the vacuum have no hit or capture resolution. |
| I-4 | Confusing | Ch 9 contradicts itself on whether the Stirring penalty still applies at Active (5–6). |
| I-6 | Confusing | "Scene" is undefined, and 12 powers depend on it. |
| I-37 | Confusing | Full Alert (and the Alert past the Limit) does nothing once the crew holds the loot. |
| I-14/I-15 | Confusing | Heist 2 has no map, only one entry, and an unknown obstacle placed after the objective. |
