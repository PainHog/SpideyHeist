# Procedural playtest — Heist 1: The Cookie Situation (House · Easy)

- **Source of truth:** `book/src/chapters/*.html` (v4.5). Rulings already recorded in `book/REVIEW.md` are not re-reported unless they cause a new problem in play.
- **Map:** the Heist 1 sample map (`book/art/map-cookie.svg`) is a 16 × 7 grid. Coordinates below are (column, row), with (0,0) at the top-left.
  - Walls: row 0, row 6, column 0 and column 15.
  - **V** (the vent) is at (0,1), inside the left wall.
  - **~** (the counter) covers columns 6–11 in rows 1–2.
  - **C** (the cabinet with the tin) is at (14,1).
  - **K** (the cat's bed) is at (5,4).
  - A double door covers (10–13, 6).
  - K to C is 9 squares, which matches the intel.
- **Dice:** every roll is real. They came from a small `crypto.randomInt` script, and every roll is listed in the Appendix. Pools are counted as 4+ = Success.
- **Method:** I ran the heist twice from the same characters and Preparations:
  - **Main line:** the reading that follows the book's definitions most literally.
  - **Branch B:** the other defensible reading of the three biggest ambiguities. Branch B ran from Obstacle 1 with fresh dice.

  The two runs ended at a **peak Alert of 3/10** and at **Full Alert (10/10) in 6 rounds**. That gap is the headline finding (Issue 1).

---

## 1. Character creation (Chapter 7)

Two spiders use the Chapter 20 random tables: Crinkle and Filament. Chapter 20 has no tables for Attributes, Skills or Perks, so I chose those (Issue 20). The other three spiders were built by choice, to cover the Bruiser, Lookout and Wheelman roles.

The two random spiders rolled:
- **Crinkle:** name 2d6 = 2+3 = 5, Crinkle · species 1d6 = 6, Crab Spider · role 1d6 = 3, Tinkerer · flaw 1d10 = 10, Show-Off.
- **Filament:** name 2d6 = 3+5 = 8, Filament (the same name as the Ch 7 example spider) · species 1d6 = 5, Spitting Spider · role 1d6 = 6, so roll again: 6, which gives Grifter · flaw 1d10 = 8, Fear of Vacuums.

**How to read the sheets:**
- Attributes are written as base spend + species bonus = final.
- For skills, "own" means points from the 12-point budget and "role" means the +3 Role bonus.
- Silk Points (SP) = WIT + NERVE.

### Crinkle — Crab Spider Tinkerer (random)
- **Species ability:** *Wait, Was That There Before?* Hold still for one turn and spotting you is +2 Difficulty. Speed **4**.
- **Attributes:** BODY 2 · WIT 4 · NERVE 2+1 = **3** · GRACE 2+1 = **3**. Base spend is 10.
- **Skills:**
  - Engineering **3** (1 own + 2 role) and Perception **3** (2 own + 1 role).
  - Stealth 2, Acrobatics 2, Tactics 1, Athletics 1, Endurance 1, Deception 1, Disguise 1.
  - Own points total 12 ✓.
- **Signature:** *I Made a Thing*.
- **Perks:** Overclock; I See How This Works.
- **Flaw:** Show-Off.
- **Silk:** 4+3 = **7**. **Vitality:** Unharmed.

### Filament — Spitting Spider Grifter (random)
- **Species ability:** *Precision Application*, a 6-square strand with no roll. Speed **5**.
- **Attributes:** BODY 1 · WIT 2+2 = **4** · NERVE 3+1 = **4** · GRACE 4. Base spend is 10.
- **Skills:**
  - Deception **3** (1 own + 2 role) and Disguise **3** (2 own + 1 role).
  - Stealth 3, Perception 2, Persuasion 2, Acrobatics 2.
  - Own points total 12 ✓.
- **Signature:** *You're Looking at the Wrong Spider*.
- **Perks:** Method Actor (the cat); Planted Evidence.
- **Flaw:** Fear of Vacuums.
- **Silk:** 4+4 = **8**. **Vitality:** Unharmed.

### Pebbles — Wolf Spider Bruiser (chosen)
- **Species ability:** *Run It Again*. Speed **7**.
- **Attributes:** BODY 3+2 = **5** · WIT 1 · NERVE 3 · GRACE 3.
- **Skills:**
  - Brawl **3** (1 own + 2 role) and Endurance **3** (2 own + 1 role).
  - Athletics 3, Intimidation 2, Acrobatics 2, Stealth 1, Perception 1.
  - Own points total 12 ✓.
- **Signature:** *Make a Scene*.
- **Perks:** Take the Hit; That All You Got?.
- **Flaw:** Loud.
- **Silk:** 1+3 = **4**. **Vitality:** Unharmed.

### Nook — Orb Weaver Lookout (chosen)
- **Species ability:** *Everything Connects*. Speed **5**.
- **Attributes:** BODY 2 · WIT 3+2 = **5** · NERVE 3 · GRACE 2.
- **Skills:**
  - Perception **3** (1 own + 2 role) and Tactics **3** (2 own + 1 role).
  - Stealth 2, Acrobatics 2, Engineering 1, Persuasion 1, Endurance 1, Athletics 1, Deception 1.
  - Own points total 12 ✓.
- **Signature:** *I Called It*.
- **Perks:** Contingency; Tactical Feed.
- **Flaw:** Compulsive Planner.
- **Silk:** 5+3 = **8**. **Vitality:** Unharmed.

### Jar Lid — Jumping Spider Wheelman (chosen)
- **Species ability:** *Did You See That Jump?!* Speed **6**.
- **Attributes:** BODY 2+1 = **3** · WIT 2 · NERVE 2 · GRACE 4+1 = **5**.
- **Skills:**
  - Acrobatics **3** (2 own + 1 role) and Tactics **3** (1 own + 2 role).
  - Athletics 3, Stealth 2, Perception 2, Endurance 1, Brawl 1.
  - Own points total 12 ✓.
- **Signature:** *I Know a Way*.
- **Perks:** Drafting; Don't Look Down.
- **Flaw:** Allergic to Dust.
- **Silk:** 2+2 = **4**. **Vitality:** Unharmed.

### Creation notes
- **Time:** about 5 minutes per spider once the rules were read. The caps were easy to check against the sheet header ("10 pts · min 1 · max 5 including species bonus"; "12 pts + 3 Role bonus · max 3").
- **Skill budget check:** the only fiddly part. You verify that own points total 12 and role points total 3, and that the role points sit only on the core skills. The sheet has one box per skill, so it doesn't record which points came from the role. A mis-built sheet can't be audited afterwards (minor; see Issue 20).
- **Silk spread:** the crew's Silk ranged from 4 to 8 purely because of species and attribute choices (Issue 21).

---

## 2. Play log — main line

**Main-line ST rulings.** These are my choices where the book was silent or split. Each has an Issue number.

- **R-a.** Sneaking past a cat that isn't searching uses the Ch 15 fixed Difficulty, **House Cat Stealth (3)**, plus the band penalties. It is not an opposed roll (Issue 2).
- **R-b.** A creature is *active*, and so adds its per-round Alert, only when its **Escalation** line says so. For the cat that means Alert 5+ ("moves toward the sound"), even though Obstacle 1 calls the cat "awake" (Issue 1).
- **R-c.** One Stealth roll per spider per exposed leg of movement, not one per round (Issue 3).
- **R-d.** A Partial on Stealth near the cat is an ST-chosen complication. I usually picked "spotted briefly" (+1), and sometimes a non-Alert cost (Issue 3).
- **R-e.** "Scene" = obstacle. Silk Lines, including the one pre-placed during Planning, last for the whole heist unless broken (Issue 5).
- **R-f.** The grid has no height. I ruled that the tin shelf is 3 squares up the wall above C, and that the back row of the counter top is **in cover** from a cat on the floor (Issue 11).

### Phase 1 — The Score (Ch 11, Ch 17)
- The ST shows the map and describes a two-bedroom house: the tin is on the second shelf of the cabinet above the counter, a young cat is in plain sight on its bed, and a human gets up for water at night. No rolls, and the Alert stays at 0.
- Crew questions: Where is the sink? Where does the door go? How high is the shelf? The book doesn't answer any of them, so the ST invented answers:
  - The sink is on the counter at (8,1).
  - The door leads to the hallway and the bedroom.
  - The shelf is 3 squares up.

### Phase 2 — Planning
**Casing (Ch 11).** One roll per spider, Perception or Tactics. There is no Difficulty and each Success reveals one piece of intel.

| Spider | Pool | Dice | Successes |
|---|---|---|---|
| Nook | WIT 5 + Perception 3 = 8 | 5 6 2 6 6 4 3 4 | **6** |
| Crinkle | WIT 4 + Perception 3 = 7 | 3 1 3 4 2 1 6 | 2 |
| Filament | WIT 4 + Perception 2 = 6 | 3 2 6 5 4 2 | 3 |
| Jar Lid | WIT 2 + Tactics 3 = 5 | 4 4 1 2 4 | 3 |
| Pebbles | WIT 1 + Perception 1 = 2 | 1 4 | 1 |

- **15 Successes against 3 written intel items** (Issue 8). Nook's first three Successes exhausted the book's list.
- The ST then invented about 7 more items from the House Cat stat block and the room:
  - the cat's 6-square sight range;
  - its Escalation;
  - its weakness for shiny things;
  - Speed 8;
  - the sink's position;
  - that the tin lid is a tight press-fit;
  - a bottle cap under the counter at (8,3).
- After that the ST said "nothing more to find." The unknown obstacle (the twin tin) was withheld, as Ch 11/13 require.
- One of the three book items ("the cat's bed is 9 squares from the cabinet") could already be counted on the map shown at the Score.

**Preparations (Ch 11/17).** The book says "a few", so the ST allowed one per spider (Issue 27). Each got a complication:

| # | Preparation | ST complication |
|---|---|---|
| P1 | Everyone enters at the vent (0,1) | The duct is dusty. This sets up Jar Lid's *Allergic to Dust*. |
| P2 | A pre-placed **Silk Line** from the floor at (14,1) up the cabinet face to the shelf | The cabinet was wiped. The line sags and glints, and the young cat is "very interested in things". |
| P3 | Nook's **Contingency**: "If the cat heads for the cabinet, the bottle cap balanced at (11,2) drops toward the door, which is an automatic distraction success." | The drop is loud: +1 Alert when it fires. |
| P4 | Filament's **Planted Evidence**: a fluff-and-crumb "mouse" at (11,5) by the door | The crumbs are also something the human would notice. |
| P5 | Crinkle stashes a straightened paperclip at (13,1) | It sits on the damp floor. |

### Phase 3 — The Heist (Alert Limit 10)

**Obstacle 1 — Cross the living room while the cat is awake and watching the door.**
- The whole route from the vent to (11,1) is within 6 squares of the cat at (5,4). (12,1) is 7 squares away, so it is out of range.
- The ST ran turn order because the cat was watching.
- Per R-f, only the floor leg (1–5, 1) is exposed. Stealth pools are NERVE + Stealth against Difficulty 3.

| Round | Action | Rule / pool | Dice | Result | Alert |
|---|---|---|---|---|---|
| R1 | Filament moves to (5,1) and sneaks | 4+3, +1 Tactical Feed = 8 | 5 3 2 1 5 2 6 1 | 3/3, success | 0 |
| R1 | Jar Lid moves to (4,1) and sneaks | 2+2 = 4 | 1 3 5 3 | 1/3, **Partial**. He keeps his SP. The cat's head turns: spotted briefly | **1** |
| R2 | Filament runs a Silk Line (5,1)→(10,1) (Ch 12) | GRACE 4 + Acrobatics 2 = 6 vs 2 | 3 3 4 2 3 3 | 1/2, Partial. The line only reaches (9,1). No Alert. | 1 |
| R2 | Crinkle sneaks | 3+2, +1 Tactical Feed = 6 | 2 3 2 6 3 6 | 2/3, Partial. Spotted briefly. | **2** |
| R2 | Pebbles sneaks | 3+1 = 4 | 5 1 6 6 | 3/3, success | 2 |
| R3 | Nook sneaks. Crinkle Assists with Stealth 2. | Assist dice 2 4 = 1 success, so pool 5+1 = 6 | 1 3 3 6 2 + 6 | 2/3, Partial. Nook pays **2 SP to reroll** 3 dice (8→6 SP): 1 4 2 | 3/3, success | 2 |

- Movement onto and along the counter used the Silk Line as safe footing (Ch 12). The two uncovered wet counter squares (10–11, 1) cost double movement (Ch 3).
- Crinkle (Speed 4) was a round behind everyone else.

**Obstacle 2 — Climb the cabinet: slippery surface, freshly wiped.**
- The pre-placed P2 line is "safe footing … up a wall … with no Acrobatics roll" (Ch 12). The climb is 9+ squares from the cat, so it is out of sight.
- **No rolls. The obstacle is fully solved by a Planning preparation** (Issue 7). The line holds 2 spiders at once, so the crew went up two at a time. Alert 2.

**Obstacle 3 + the Unknown (Obstacle 4) — Open the tin quietly / there are two identical tins.**
- The crew reaches the shelf and sees **two identical blue-lidded tins**, so the unknown obstacle surfaces on arrival.
- The players asked, "Can we tell which one?" The heist text says the crew "finds out which the hard way", but Ch 13 says "say yes, then set a Difficulty". The ST allowed **Nook: Perception, Difficulty 4**:
  - pool 5+3 = 8;
  - dice 6 5 2 1 3 2 6 5;
  - **4/4, success**.
  - Result: the left tin smells of machine oil and thread, and the right of butter.
- **The unknown obstacle was defused by one roll** (Issue 9).
- Crinkle uses *I See How This Works*: "Is the lid a press-fit that snaps when levered?" "Yes."
- The ST invokes **Show-Off** (Ch 7 flaw 10): the Difficulty 4 version. The ST had set the base at 3, copying *Locked Drawer*, because the heist gives no numbers. Crinkle's pool:
  - WIT 4 + Engineering 3 = 7;
  - +2 from Overclock (1 SP, 7→6);
  - +1 from Tactical Feed;
  - +2 from Pebbles' Assist (Athletics 3, dice 5 2 4 = 2 successes);
  - total **12 dice** vs 4: 2 6 1 4 5 3 6 3 2 6 5 3 → **6 successes**. That is a success, not a Critical (8 needed).
  - A 12-die pool succeeds at Difficulty 4 about 93% of the time (Issue 18).
- The cookie is out. Alert 2.
- **ST complication.** No rule says when to use the Ch 20 *Mid-Heist Complication* table (Issue 26). I rolled it once here: 1d6 = **1**, "The cat woke up." The cat was already awake, so I ruled that it gets up and wanders toward the glinting P2 line.
  - That triggers **Nook's Contingency**: the cap drops and the distraction succeeds automatically.
  - The cat pads to the door and finds Filament's **Planted Evidence** mouse, which it "believes completely".
  - P3's complication, the loud cap, adds **+1: Alert 3 (Stirring, Stealth +1)**.

### Phase 4 — The Escape (built by the ST per Ch 11/17)
I built two escape obstacles:
- **E1:** get the cookie back to the counter past a distracted cat. It can be solved with Stealth, Tactics, Disguise or Acrobatics.
- **E2:** "Lights on." The human's water run, the one intel item that is on a timer. It can be solved with Acrobatics, Engineering, Deception or Disguise.

There is **no Athletics requirement** in either one ✓. The book gives no way to convert "ninety minutes" into rounds, so the ST simply chose now (Issue 12).

**E1 — Back across with the cookie.**
- The cat is 4 squares away and busy, so this is a distracted cat: Difficulty 2, +1 Stirring = **3**.
- Jar Lid leads, so **Drafting** gives each crewmate +1. I ruled that Stealth while moving counts as a "movement roll" (Issue 22).
- The cookie is carried by two spiders. The book has no carry rules (Issue 13).

| Spider | Pool | Dice | Result | Alert |
|---|---|---|---|---|
| Nook | 3+2 +1 Drafting = 6 | 5 4 5 4 4 4 | **6/3, Critical** (a 1.6% event): Alert −1 | 2 |
| Pebbles (carrying) | 3+1 +1 Drafting +1 Tactical Feed = 6 | 2 3 6 2 2 2 | 1/3, Partial. The cookie chips and a chunk falls to (13,2). No Alert. | 2 |
| Filament (carrying) | 4+3 +1 Drafting = 8 | 6 5 3 5 3 1 1 1 | 3/3, success. She snags the fallen chunk with her strand (species ability, no roll). | 2 |
| Crinkle | 3+2 +1 Drafting = 6 | 4 1 1 2 2 3 | 1/3, Partial. Spotted briefly. | **3** |
| Jar Lid | 2+2 = 4 | 1 5 5 3 | 2/3, Partial. He slips on the damp floor: a flat −1 die next round (Ch 10 "glancing bump"). | 3 |

Three of the five spiders missed a clean success on a single leg (Issue 3). With five pools of this size, at least one spider misses about 98% of the time.

**E2 — Lights on (the human's water run).**
- The human enters at the door (11,6). The book gives the human no stat block, so the ST treated them as a drowsy human (*Sleeping Human*, 2) +1 Stirring (Issue 12).
- Jar Lid spends **I Know a Way**: a crack in the counter backsplash at (7,0) into the wall void, which joins the vent duct. Every Escape roll is −1 Difficulty.

| Spider | Roll | Dice | Result | Alert |
|---|---|---|---|---|
| Crinkle | Engineering: rig a silk sling for the cookie (3 −1 = **2**), WIT 4 + Engineering 3 = 7 | 4 4 5 3 2 6 2 | **4/2, Critical**: Alert −1. The ST rules the bonus is that the chipped chunk goes in with the cookie, so the loot is whole. | **2** |
| Nook | Acrobatics squeeze (2 −1 = 1), 2+2 = 4 | 3 2 2 5 | 1/1, success | 2 |
| Jar Lid | **Allergic to Dust** fires, as the ST picks the dusty wall void. Stealth vs Difficulty 3 +1 Stirring −1 (I Know a Way) = 3. Pool 2+2 +1 Tactical Feed = 5. I **forgot** his −1 die from the slip; dropping his last die (a 2) doesn't change the result. | 5 5 2 4 2 | 3/3, success. No Alert. The flaw text also says "Either way, everyone in earshot knows something happened" (Issue 23). | 2 |
| Filament | Stealth vs the human, still on the counter (2 +1 −1 = 2), 4+3 +1 Drafting = 8 | 1 3 5 5 6 5 5 1 | **5/2, Critical**: Alert −1 | **1** |
| Pebbles | Stealth vs the human (2), 3+1 +1 Drafting = 5 | 5 3 3 4 5 | 3/2, success | 1 |
| Jar Lid, Crinkle | Squeeze into the crack at Difficulty 1 with pools of 8 and 5 | — | Not rolled: Ch 2 *When Not to Roll* | 1 |

The crew goes out through the wall void and the vent duct. **Escape complete. Final Alert 1. Peak Alert 3.**

### Phase 5 — Debrief (Ch 11)
- **Full Success** (escaped with the complete cookie) at Easy: **2 AP each**.
- SP left: Crinkle 6, Filament 8, Pebbles 4, Nook 6, Jar Lid 4. SP resets to WIT + NERVE next heist, so the unspent SP is lost.
- AP spent:
  - Crinkle: +1 Stealth, +1 Tactics.
  - Filament: +1 WIT (to 5).
  - Pebbles: +1 Stealth, +1 Perception.
  - Nook: WIT is already at 5, so +1 Stealth, +1 Endurance.
  - Jar Lid: +1 NERVE (next heist SP 5).
- The book doesn't say whether AP can be banked (Issue 28).

**Main-line summary:**
- 28 rolls, counting Casing, Assists and rerolls.
- The Alert went up +4 in total: 3 from Stealth Partials and 1 from a Prep complication.
- It came down −3, all from Criticals.
- The cat never became *active* and never rolled.
- The human never became a threat.
- Vitality was never touched.
- *Waiting Web*, *Full Alert*, Lockdown and the creature stat-block pools were **never exercised**. Branch B tests them.

---

## 3. Play log — Branch B (the "heist text is literal" reading)

This branch uses the same crew, the same Preparations and fresh dice. Its rulings are the other side of Issues 1, 2 and 9:

- **B-i.** Obstacle 1 says the cat is *awake*. Ch 9 says active means "awake, hunting or pursuing", so the cat is **active from round 1: +1 Alert at each ST turn** while turn order runs.
- **B-ii.** An awake cat "paying complete attention" is "an alert cat", so Stealth is an **opposed roll** (Ch 2), with the spider's Stealth pool against the cat's **Perception 4**. The world wins ties.
  - Band "Difficulty" steps become **+1 cat die** each. This conversion is invented; the book has none.
  - Losing is *spotted briefly* (+1). Losing by 3+ is a *confirmed alert* (+2). This mapping is also invented.
- **B-iii.** The heist script is followed: "(Unknown) It's the sewing tin" means the first tin opened is the sewing tin.

| Rd | Event | Dice | Result | Alert |
|---|---|---|---|---|
| R1 | Filament sneaks: 7 +1 Tactical Feed = 8 vs cat 4 | 6 6 2 3 2 5 5 6 vs 6 1 2 6 | 5 v 2, unseen | 0 |
| R1 | Jar Lid sneaks: 4 vs cat 4 | 4 2 2 4 vs 3 5 5 5 | 2 v 3, spotted briefly (+1) | 1 |
| R1 | ST turn: cat active (+1) | — | — | **2** |
| R2 | Filament: 1 SP Silk Line (5,1)→(10,1) (SP 8→7). Ch 8 says "Instantly" but Ch 12 says "As your Action" (Issue 24). | — | — | 2 |
| R2 | Crinkle sneaks: 5 +1 Tactical Feed = 6 vs 4 | 1 4 3 4 6 4 vs 2 3 6 2 | 4 v 1, unseen | 2 |
| R2 | Pebbles sneaks: 4 vs 4 | 3 5 3 1 vs 6 6 4 4 | 1 v 4: **confirmed alert (+2)**. A Silk Clutch was considered. Is losing an opposed roll a "failed roll"? (Issue 4.) He declined. | 4 |
| R2 | ST turn: cat +1. **Active band (5)**: the cat moves toward the sound and the human stirs. | — | — | **5** |
| R3 | Filament: **Decoy** (Grifter signature). The cat's Perception vs Difficulty 3. | 1 6 5 3 | 2/3, fails. The cat chases the decoy for 2 rounds. The crew is unobserved and gets +1 die on job rolls. | 5 |
| R3 | Nook leaves the vent with no roll (unobserved). ST turn: cat +1 (it is pursuing the decoy). | — | — | **6** |
| R4 | The crew moves to the cabinet. The P2 line means **no roll** (Issue 7). Crinkle (Speed 4, wet counter) only reaches (10,1). ST turn: cat +1. **Lockdown**: all rolls +1, and Stealth +2 in total. The cat hunts and the human gets up and turns on the lights. | — | — | **7** |
| R5 | Pebbles: **Make a Scene** (drops onto the floor with a spoon clatter). All NPCs focus on him for 1 round, and the others get +2 dice. | — | — | 7 |
| R5 | Filament and Jar Lid find the **two tins**. The ST had pre-committed "cookies in the right-hand tin". The crew picked with 1d6 and got 4, the **right-hand tin**, the correct one. Under B-iii the ST follows the script instead, so this tin is sewing (Issue 9). | 4 | — | 7 |
| R5 | Filament opens it: WIT 4 + Engineering 0 +2 Scene +1 Assist (Jar Lid, Engineering 0 → min 1 die: 6) = 7, vs 3 +1 Lockdown = 4 | 3 2 5 4 6 5 6 | 5/4, success: **sewing supplies**. Recalibrate. | 7 |
| R5 | ST: the cat **Pounces** on Pebbles with Brawl 4 +1 (Lockdown, B-ii) = 5. Pebbles shrugs off with BODY 5 + Endurance 3 = 8. | 1 1 3 5 5 vs 5 6 4 3 5 2 5 2 | 2 v 5, shrugged off | 7 |
| R5 | End of round: Make a Scene +1, cat +1 | — | — | **9** |
| R6 | Crinkle reaches the shelf. The ST invokes **Show-Off**, and Crinkle pays **1 SP to delay it** (7→6). He opens tin 2 with 7 +2 Overclock (1 SP, →5) +1 Tactical Feed +Filament's Assist (min 1 die: 3, so 0) = 10, vs 4. | 2 1 5 5 2 4 1 1 3 2 | 3/4, Partial. He pays **2 SP to reroll** 3 dice (→3): 5 3 3, now 4/4, **success. Cookies in hand at Alert 9.** | 9 |
| R6 | ST: the cat Pounces on Pebbles, 5 dice vs 8 | 6 1 4 6 5 vs 3 3 5 1 6 2 2 1 | 4 v 2, which would drop one level. **Wolf *Run It Again*** rerolls his 6 failed dice: 1 1 5 6 5 2 gives +3, so 5 v 4, **shrugged off** (Issue 17). | 9 |
| R6 | End of round: cat +1. **Full Alert.** The objective is already held, so they "just need to get out". | — | — | **10** |
| E-R1 | Jar Lid: **I Know a Way** (a gap behind the cabinet into the wall void). Acrobatics squeeze: 2 +1 Lockdown −1 = 2, pool 8. | 6 3 5 5 6 3 2 3 | 4/2, **Critical: −1** | **9** |
| E-R1 | Crinkle: the delayed Show-Off fires. Sling the cookie: Difficulty 4 version +1 −1 = 4. Pool 10 (Overclock 1 SP, →2). | 6 6 5 6 5 4 2 2 6 4 | **8/4, Critical: −1.** Show-Off: +1 SP on a Critical (→3). | **8** |
| E-R1 | Filament: Disguise ("dust bunny") against an Alert Human (Ch 15: 4 +1 −1 = 4), pool 7 | 1 4 5 6 5 1 4 | 5/4, success. The human is fooled. | 8 |
| E-R1 | Nook: climb and squeeze (2), pool 4 | 3 2 5 1 | 1/2, Partial. Stuck on the line in the open. | 8 |
| E-R1 | Pebbles: chase, Athletics 8 vs cat Pursuit 5 +1 = 6 | 1 2 1 5 5 2 4 6 vs 1 6 4 4 2 1 | 4 v 3, reaches the line | 8 |
| E-R1 | ST: the cat Pounces on Nook, 5 dice vs his shrug-off of BODY 2 + Endurance 1 = 3 | 4 2 1 4 2 vs 3 1 3 | 2 v 0, drops a level. Pebbles uses **Take the Hit** (adjacent on the same line) and is **Rattled** (Issue 17). Cat +1. | **9** |
| E-R2 | Filament squeezes (2), pool 6 | 3 1 3 3 1 3 | **0: Failure.** She pays 2 SP to reroll 3 dice (7→5): 6 2 3, so 1/2, a **Partial**. By the letter she can no longer use **Silk Clutch**, because the roll is no longer "failed" (Issue 4). ST complication: the human sees the "dust bunny" crawl into the wall, spotted briefly. | **10** |
| E-R2 | Nook squeezes, pool 4 | 4 4 3 5 | 3/2, success | 10 |
| E-R2 | Pebbles squeezes: Rattled −1, Tactical Feed +1, pool 5 | 4 3 2 2 5 | 2/2, success | 10 |
| E-R2 | ST turn: cat +1. That makes **11?** The book is silent on the Alert above the Limit (Issue 6), so I held it at 10. | — | — | 10 |

**Branch B debrief.**
- The crew escaped through the duct with the complete cookie: **Full Success, 2 AP each**. That is the same payout as the main line, even though the Alert hit Full Alert twice (Issue 29).
- **The cat's per-round contribution made 8 of the Alert rises in B.** Rolls and actions made only 5, and two Criticals took 2 back. The cat's final +1 had nowhere to go.

### Waiting Web: rules walkthrough (it never triggered in play)
Nothing went Out in either run. Suppose Nook had lost the E-R1 Pounce by 3+ twice and gone **Out**. Walking the rules through:
- Ch 9/10 say "+2 Alert". The location was already at Full Alert, so this does nothing (Issue 6).
- The replacement "enter[s] at the start of the next obstacle". E-R2 was the **last** obstacle of the Escape, so there is no next obstacle and the replacement never arrives.
- The book doesn't say where on the map a replacement enters, or whether an Out spider's player still "escaped" for the Debrief's crew-level "Escaped with the complete objective" (Issue 30).

---

## 4. ISSUES

Severity is one of **blocker** (tables will get very different results, or can't continue without a house rule), **confusing**, or **minor**. Each issue gives its category, where it came up in play, the book passage(s) involved, and a suggested fix.

### Blockers

**1. Whether a creature is "active", and what "per round" means, decides the whole heist.** *(blocker · contradiction + undefined)*
- **Where it came up:** Obstacle 1 onward. The main line (the cat is active only when its Escalation says so) peaked at **Alert 3/10**. Branch B (the cat is awake, so active) hit **Full Alert in 6 rounds**, with **8 points from the cat alone**.
- **Passages:**
  - Heist 1 (Ch 19): "Cross the living room while the cat is **awake** and watching the door."
  - Ch 9: "A creature is *active* when its **Escalation says** it's awake, hunting or pursuing."
  - House Cat (Ch 16): "Escalation: Alert 3, ears rotate. Alert 5, moves toward the sound. Alert 7, hunting." This line never says "awake". Its Passive reads "asleep ~70% of the time".
  - Ch 3: "Most of a heist doesn't need turns at all." Ch 9's "+X … **each round** it's active" only counts rounds.
- **Effect:**
  - The ST's choice to call turn order silently turns the cat's Alert tap on or off.
  - Every "per round" effect has no meaning outside turn order: Tactical Feed "once per round", Decoy "two full rounds", Make a Scene "one full round", Fast Talk, and the flaw delays.
- **Fix:**
  - Say that a creature's +X applies **once per ST turn in turn order, and once per obstacle outside it**.
  - Add an explicit Escalation stage for "awake/active" to the House Cat, for example "Awake (active): +1/round; starts awake only if the heist says so".
  - Rewrite Heist 1 Obstacle 1 to say whether the cat is active at Alert 0.
  - Add one line: "Outside turn order, 'a round' = one exchange of actions."

**2. Is Stealth against a creature a fixed Difficulty or an opposed roll? And what do Difficulty modifiers mean in an opposed roll?** *(blocker · contradiction)*
- **Where it came up:** every Stealth roll near the cat. The two readings give very different odds:
  - **Fixed Difficulty:** a Stealth pool of 4 vs 3 is 31% success, 63% Partial and 6% Failure.
  - **Opposed:** a pool of 4 vs the cat's 4 dice wins 36% of the time, and that falls to **17% at Lockdown**, after converting the +2 Stealth penalty to cat dice.
- **Passages:**
  - Ch 15: "House Cat | Stealth or Persuasion (3)".
  - Ch 2 Difficulty table: "Sneaking past a drowsy cat" = 3, "Sneaking past an alert cat" = 4.
  - Ch 2 *Opposed Rolls*: "When you act against something that's actively resisting — **an alert cat** … — both sides roll."
  - Ch 16: "When a creature acts against the crew, roll the listed pool."
- **Also:**
  - Cover ("Increase the Difficulty to spot or target you by 2", Ch 3), Crab camouflage (+2), *I Was Never Here* (+2), *Loud* (+1) and the Alert bands are all written as Difficulty. They have **no meaning in an opposed roll**, and none in a fixed-Difficulty Stealth roll where nobody "spots".
  - An opposed roll also has no Partial, no Critical and no Botch.
- **Fix:**
  - Choose one model. My recommendation: **the crew always rolls against a Difficulty. A creature's pool is its Difficulty when it actively searches** (for example "Difficulty = the cat's Perception pool − 1"), or use opposed rolls only for pursuit and attacks.
  - Then restate cover, camouflage and the bands in that one currency, for example "spotting you is +2 Difficulty; against a creature that rolls, it loses 2 dice".

**3. Group stealth multiplies rolls, and whether a Partial raises the Alert is unstated.** *(blocker · undefined / balance feel)*
- **Where it came up:** Obstacle 1 and E1. Five spiders each rolled Stealth for each exposed leg, and **6 of 13 Stealth rolls were Partials**.
  - On a single leg, the crew's pools (4, 5, 5, 7, 4 vs 3) give **~98%** odds that at least one spider misses a clean success, and about 2.6 expected non-clean results.
  - If each Partial is "spotted briefly (+1)", every exposed crossing costs about 2–3 Alert. That is survivable at Easy (10) but ends a Hard (6) heist in two crossings.
- **Passages:**
  - Ch 2: "Partial Success … a complication lands. The lock opens, **but you made noise**."
  - Ch 9: "+1 — A roll **fails** with a consequence — noise …" and "+1 — Spotted briefly".
  - Nothing says whether a Partial triggers these, or whether several triggers from one roll stack. A failed Stealth roll could be read as +1, +1+1 or +2 (confirmed).
- **Fix:**
  - Add a **group check**: one spider rolls for the group, and each other spider may Assist (the existing one-Assist cap breaks this, so raise it for group checks). Alternatively, "roll once per leg; use the worst result".
  - State: "A Partial's complication raises the Alert only if the ST picks an Alert complication, and by +1 at most. One roll triggers at most one Alert entry."

### Confusing

**4. "Failed roll" is ambiguous, so Silk Clutch gets worse after you improve your roll.** *(confusing · unclear wording)*
- **Where it came up:** B-E2. Filament rolled 0 successes (Failure), rerolled into a Partial, and by the letter lost access to Silk Clutch. The same question came up in B-R2: is losing an opposed roll a "failed roll"?
- **Passages:**
  - Ch 2: "Failure — it did not work. **Zero Successes**."
  - Ch 8: "3 SP — Silk Clutch: **After a failed roll**, spend 3 SP to succeed anyway."
  - The same wording appears in *Silver Tongue* ("When you fail a Persuasion roll"), *Smoke and Mirrors*, and the Ch 9 "+1 — A roll fails".
  - The Wolf ability shows the book *can* distinguish the two: "When you fail or partially succeed".
- **Fix:** "Silk Clutch: after any roll that falls short (Partial or Failure) …". Also define "fail" once in Ch 2 as "fewer Successes than needed".

**5. "Scene" is never defined.** *(confusing · undefined)*
- **Where it came up:** Obstacles 1–2, and every once-per-scene ability.
- **Passages:**
  - Ch 12: a Silk Line "stays until it's broken or **the scene ends**." Read literally, the P2 line placed during Planning vanishes before the heist starts.
  - Once-per-scene abilities include: Orb Weaver, Jumping, Wolf, *Phase Through*, *I Made a Thing*, *Make a Scene*, *Take the Hit*, *Thunderous Entrance*, *Fast Talk*, *Plausible Deniability*, *Jury-Rig* and *Field Repair*.
  - Ch 10 and the Waiting Web use "**obstacle**" instead.
- **Fix:** "A scene is one obstacle (or the Planning phase)." Add: "Silk placed during Planning lasts for the heist."

**6. The Full Alert state is undefined.** *(confusing · undefined)*
- **Where it came up:** Branch B, E-R1 and E-R2. Two Criticals pulled the Alert **from 10 back to 8**, then it went back to 10, and the cat's +1 had nowhere to go.
- **Passages:**
  - Ch 9: "When it reaches the Limit, the place goes to Full Alert".
  - Ch 2 on a Critical: "the Alert drops by 1".
  - Nothing says whether Full Alert ends when the number drops, whether the Alert can exceed the Limit, or what "+2 spider Out" does at the Limit.
- **Fix:** "Once reached, Full Alert is permanent for the heist; the Alert no longer moves. Lockdown penalties still apply."

**7. A pre-placed Silk Line solves Obstacle 2 outright.** *(confusing · contradiction)*
- **Where it came up:** Obstacle 2 took **zero rolls** in both runs.
- **Passages:**
  - Ch 11: "Nothing in Planning auto-beats an obstacle — except the Lookout's *Contingency* Perk".
  - Ch 11 Preparation: "Pre-place one Silk Line on a route you know."
  - Ch 12: "A Silk Line is safe footing … up a wall … with **no Acrobatics roll**."
  - Heist 1: "Climb the cabinet — slippery surface".
- **Fix:** do one of:
  - say a pre-placed line "removes the movement penalty but the ST may still call for Stealth while you are on it"; or
  - have Heist 1 note that "the cabinet was wiped after any earlier visit; lines placed on it before tonight don't hold".

**8. Casing has no Difficulty and no cap, and the heists hold far too little intel.** *(confusing · process friction)*
- **Where it came up:** Planning. **15 Successes against 3 intel items.** Nook alone rolled 6. The ST had to invent about 7 items, and those gave away the cat's weakness, which made later obstacles easier.
- **Passages:**
  - Ch 11: "each Success reveals one concrete piece of intel".
  - Heist 1 lists 3 items.
  - Ch 11/13 require an unknown obstacle, so Casing must be capped anyway.
  - Nothing covers SP spends, Assists, or a Failure on a Casing roll.
- **Fix:**
  - Give each heist 5–6 ranked intel items and state "extra Successes buy nothing" (or "+1 die on the first roll of the heist").
  - Or make Casing a **crew total vs thresholds** (3 / 6 / 9 Successes).
  - Also note that one Heist 1 item ("bed is 9 squares from the cabinet") can already be counted on the map shown at the Score.

**9. The unknown obstacle conflicts with "say yes" and "be a fair world".** *(confusing · contradiction)*
- **Where it came up:**
  - Main line: one Perception roll at Difficulty 4 (8 dice, about 64% to succeed) **defused the twin-tin problem**.
  - Branch B: the crew picked the right tin with a 50/50 d6. Only by overriding the ST's own pre-commitment did "It's the sewing tin" happen.
- **Passages:**
  - Heist 1: "The crew finds out which **the hard way**."
  - Heist 1 Obstacle 4: "It's the sewing tin."
  - Ch 13: "Say yes, then set a Difficulty" and "Be a fair world … You're not trying to catch the crew".
- **Fix:** make the twist fair and robust, for example:
  - "The tins are identical, and no roll tells them apart from outside. Whichever tin they open first, the lid sticks and the cookie tin is **behind** it".
  - Or "a Perception success reveals only that the tins differ, not which is which".

**10. Stealth costs your Action.** *(confusing · process friction)*
- **Where it came up:** Obstacle 1 R2, and Branch B E-R1.
  - A spider in the open can either sneak or run a line, pick a lock or Assist. It can't do both.
  - It is unclear whether a spider standing still and doing something visible must also make a Stealth roll.
- **Passage:** Ch 3: "An Action is the thing you roll for … make a Stealth check, … spit silk, Assist an ally". Only one Action is allowed per turn.
- **Fix:** "Moving unseen is part of movement: when the ST calls for Stealth, it doesn't use your Action. Visible Actions in a threat's sight need a Stealth roll first."

**11. The grid has no height.** *(confusing · undefined)*
- **Where it came up:** Obstacles 1–3.
  - How many squares up is "the second shelf of the cabinet"?
  - Is the top of the counter hidden from a cat on the floor?
  - How much does a fall hurt? Ch 10 lists "a fall" as a hit, and Ch 3 adds Height +1, but gives no damage rule.
- **Passages:** Ch 3: "Climbing: moving up a wall … costs normal movement." Heist 1: "a tin on the second shelf of the cabinet above the counter".
- **Fix:** add a short "Heights" rule, for example "note heights in squares on the map (a counter is 3, a shelf 6); something on a higher surface is in cover from anything below it; a fall of 3+ squares is a hit (the ST rolls 1 die per 3 squares against your shrug-off)". Mark heights on the Heist 1 map.

**12. The human has no rules.** *(confusing · undefined)*
- **Where it came up:** E2 (main line) and E-R1/E-R2 (Branch B).
  - There is no spotting pool, no Speed and no attack.
  - "Every ninety minutes" never converts into rounds.
  - "Up and turning on lights" has no mechanical effect.
- **Passages:**
  - Ch 16: "the librarian, restaurant staff and cleaning crew are Human Obstacles (Ch 15)". Ch 15 gives only Difficulties.
  - Heist 1: "The human's water runs roughly every ninety minutes."
  - *Arachnophobe Magnet* refers to "the Difficulty to be spotted by humans", a number that never exists.
- **Fix:**
  - Add a **Human** stat block, for example Perception 3 · Swat (Athletics) 4 · Speed 10 · "a hand or glass that closes on a spider is Out, no shrug-off".
  - State a clock, for example "10 rounds ≈ 1 hour", or say "human routines trigger at Alert thresholds or on the ST's Mid-Heist Complication roll".

**13. Loot handling is undefined.** *(confusing · undefined)*
- **Where it came up:** E1 and E2.
  - A cookie is many times a spider's size. How many spiders carry it, and at what Speed?
  - Can it pass a squeeze?
  - A Partial chipped the cookie. Is a chipped cookie "incomplete loot", which pays half AP (Ch 11)?
- **Passages:**
  - Ch 6 BODY: "carrying things that are technically too heavy".
  - Ch 11: "Partial Success — … or with incomplete loot."
- **Fix:** add loot sizes to Ch 12's tiers ("Crumb: one spider, no penalty; Trinket: two spiders, or one at half Speed"). Say that loot can't pass a gap smaller than itself without an Engineering roll. Define "incomplete" per heist.

**14. The Heist 1 map and text disagree.** *(confusing · contradiction)*
- **Where it came up:** Score and Obstacles 1–2.
- **Passages and the mismatches:**
  - The Score says "the cabinet **above the counter**", but on the map C is at (14,1), 3 squares past the end of the counter (columns 6–11).
  - The intel says "the **counter** was wiped … (Acrobatics to climb)", but Obstacle 2 says "Climb the **cabinet** — slippery surface". Which surface is wet?
  - Obstacle 1 says "Cross the **living room**", but the map is one room that holds both the cat's bed and the counter.
  - There is one entry (V). Ch 14 says "Entry points — **at least two** ways in".
  - The door's destination and the sink aren't shown.
  - The heist ("For: a first session") gives **no Difficulties** for Obstacles 1–3.
- **Fix:**
  - Move C to sit over the counter's right end, or move the counter.
  - Make both surfaces wet, or name one.
  - Add a second entry (a gap under the door) and the sink.
  - Label the room "kitchen / living room".
  - Give each obstacle a Difficulty: Obstacle 1 Stealth 3, Obstacle 2 Acrobatics 2, Obstacle 3 Engineering 3.

**15. The 5–6 band says "no roll penalty yet", but Stirring's +1 should still apply.** *(confusing · unclear wording)*
- **Where it came up:** Branch B, R3–R4.
- **Passages:**
  - Ch 9 table: "5–6 — Active … **No roll penalty yet**."
  - Quick Ref: "5–6 Active: threat wakes, no roll penalty".
  - But the ST note says "At Alert 7+, Stealth is +2 Difficulty total (the Stirring penalty and the Lockdown penalty both apply)", which implies Stirring persists above 4.
- **Fix:** "5–6 — Active: threats wake. **No new** penalty (Stealth stays +1)." Update the Quick Ref to match.

**16. Criticals lower the Alert too easily.** *(confusing · balance feel)*
- **Where it came up:** 5 Criticals across both runs, including **two at Full Alert** (B-E1).
- **The odds:** a 7- or 8-die pool against Difficulty 2 is a Critical **50% / 64%** of the time.
- **Difficulty reducers make it worse:** *I Know a Way* −1, *Soundless* −1 and *Escape Routes* −1 turn a Difficulty 3 roll (6 successes to Critical) into Difficulty 2 (4 successes). In the main line, Criticals cancelled 3 of the 4 Alert rises.
- **Passage:** Ch 2/9: "This is the **only** thing that lowers the Alert during a heist. Savor it." REVIEW B-28 fixed only the Trivial case.
- **Fix:** Criticals lower the Alert only on **base** Difficulty 3+ (before reducers), at most once per obstacle, and never at Full Alert.

**17. Perk and ability timing in hit rolls.** *(confusing · unclear wording)*
- **Where it came up:** B-R6 (Wolf) and B-E1 (*Take the Hit*).
- **Passages and the questions:**
  - Wolf: "When you fail or partially succeed on a … physical-confrontation roll". The Ch 10 shrug-off is a comparison with no Difficulty, so is losing it a "fail"?
  - *Take the Hit*: "redirect a physical consequence". Does the Bruiser redirect before the shrug-off roll (and roll his own) or after it (taking the level loss outright)?
  - "Keep the better result" (Ch 8 Reroll, Wolf): per die, or the better of the two whole rolls?
- **Fix:**
  - "Losing an opposed or shrug-off roll counts as failing it."
  - "*Take the Hit*: declare before the shrug-off; you roll it instead."
  - "Rerolled dice replace the originals; keep whichever total is higher."

### Minor

**18. Assist bonuses stack into 10–12-die pools.** *(minor · balance feel)*
- **Where it came up:** Crinkle's tin rolls were 12 dice and 10 dice. At 12 dice vs Difficulty 4, success is 93%.
- **Passages:** Assist is "maximum of 3 dice, **minimum 1**" (Ch 2). With that minimum, any untrained spider adds a die. It stacks with Overclock +2, Tactical Feed +1, *Make a Scene* +2, Decoy +1 and Boost +2.
- **Fix:** cap bonus dice from all sources at +3, or drop the Assist minimum to 0.

**19. Assist skill choice is unclear.** *(minor · unclear wording)*
- **Where it came up:** Obstacle 3. Can Pebbles Assist an Engineering roll with Athletics (holding the tin)?
- **Passage:** Ch 2: "They roll their **relevant** Skill only". Relevant to what: the task, or to the roller's Skill?
- **Fix:** "the Assister's own Skill that plausibly helps (ST's call)".

**20. Chapter 7 promises random tables that don't exist.** *(minor · contradiction)*
- **Where it came up:** creation of Crinkle and Filament.
- **Passages:**
  - Ch 7: "Random tables for **every step** are in Chapter 20."
  - Ch 20 has only Name, Species, Role, Flaw and the complication table. There are no Attribute, Skill or Perk tables.
  - The 2d6 Name table also gave "Filament", the Ch 7 example spider's name. A 5-player table collides on 2d6 names often.
- **Fix:** either change the text to "Random tables for name, species, role and flaw", or add quick-build arrays per Role, for example "Tinkerer: B2 W4 N2 G2; Engineering 3, Perception 3, …".

**21. Starting Silk is uneven by species.** *(minor · balance feel)*
- **Where it came up:** creation. Pebbles (Wolf) had 4 SP and Filament (Spitting) had 8.
- **Passages:**
  - Starting Silk = WIT + NERVE (Ch 7/8).
  - The species bonuses feed Silk unevenly: Spitting +3, Orb +2, Crab +1, and Wolf, Jumping and Cellar +0.
  - Ch 4 justifies Spitting's extra point with "The trade is range", but it is also +3 SP.
  - Low-Silk spiders can barely afford one Silk Clutch (3 SP).
- **Fix:** Starting Silk = 4 + NERVE, or a flat 6.

**22. Drafting's terms are undefined.** *(minor · undefined)*
- **Where it came up:** E1 and E2.
- **Passage:** "When you lead group movement, each crewmate gets +1 die on **movement rolls**." Neither "group movement" nor "movement roll" is defined. Is Stealth while moving one? The Ghost's *Soundless* uses "Stealth rolls made while moving".
- **Fix:** "movement rolls (Athletics, Acrobatics, and Stealth made while moving)".

**23. Flaw Silk and outcome wording.** *(minor · unclear wording)*
- *Butterfingers*: "You earn 1 SP for the trouble". The general rule already says "When your Flaw causes a genuine problem … you earn 1 SP". Is that one SP or two?
- *Show-Off*: "On a Critical, earn 1 SP". Is that in addition to the Flaw Moment?
- *Allergic to Dust*: "make a Stealth roll … or the Alert rises by 1. **Either way**, everyone in earshot knows something happened." On a success (main-line E2), does "knowing something happened" count as spotted briefly?
- **Fix:** say "this is the Flaw Moment SP, not an extra one". Change the sneeze's success to "they hear a noise they dismiss".

**24. Is the 1 SP Silk Line an Action?** *(minor · contradiction)*
- **Where it came up:** B-R2.
- **Passages:** Ch 8: "1 SP — Silk Line: **Instantly** run a silk line". Ch 12: "**As your Action** … (or spend 1 SP to skip the roll)".
- **Fix:** Ch 8: "run a Silk Line with no roll (still your Action)".

**25. *Show-Off* delay and Difficulty.** *(minor · unclear wording)*
- **Where it came up:** B-R6 and E-R1.
- **Passage:** "the Difficulty 4 version of a roll". Does that mean Difficulty 4 plus band penalties? And "delay one round" has no meaning outside turn order (Issue 1).
- **Fix:** "The roll's base Difficulty becomes 4; penalties apply on top."

**26. The Mid-Heist Complication table has no trigger.** *(minor · undefined)*
- **Where it came up:** the end of Obstacle 3. I rolled a 1, "The cat woke up", in a heist where the cat starts awake.
- **Passage:** Ch 20: "Mid-Heist Complication (Roll 1d6)". No chapter says when to roll it.
- **Fix:** Ch 13: "Roll once when the crew reaches the objective, or whenever the Alert crosses a band."

**27. Preparations: count and overlap.** *(minor · unclear wording)*
- **Where it came up:** Planning.
- **Passages:**
  - "The crew may also make **a few** concrete preparations." That gives no number.
  - "Stash one small item in a known square (see the Ghost's *Dead Drop*)". This makes the *Dead Drop* Perk nearly redundant.
  - *Contingency*: "activates automatically as a success". A success at what? Does its own noise count?
  - *Planted Evidence* "believes it completely" has no duration or effect on an animal.
- **Fix:**
  - "One Preparation per spider."
  - "*Dead Drop* stashes anywhere and needs no Preparation slot."
  - "A Contingency names the roll it replaces."

**28. AP banking isn't stated.** *(minor · undefined)* Ch 11 *Spending AP* never says whether unspent AP carries over. **Fix:** "Unspent AP carries over."

**29. Full Alert has no cost at the Debrief.** *(minor · balance feel)*
- **Where it came up:** Branch B. The crew hit the Limit twice and still got full AP, the same as the calm main line.
- **Passage:** Ch 11 Debrief: "Full Success — Escaped with the complete objective. Full AP".
- **Fix (optional):** "Full Success at Full Alert: −1 AP", or "the next heist's Alert starts at 1" (the house is jumpy).

**30. Waiting Web gaps in the Escape.** *(minor · undefined)*
- **Where it came up:** found by walking the rules through (see above). It didn't happen in play.
- **Passages:**
  - Ch 10: "They enter at the start of the **next obstacle**". The Escape may have no next obstacle.
  - No entry square is given.
  - It is unclear how the replacement counts toward "escaped" at the Debrief.
- **Fix:** "If no obstacle remains, the replacement meets the crew at the exit and counts as escaped. Replacements enter at any entry point."

**31. Early Warning depends on "active".** *(minor · unclear wording)* It came up during the read-through; no crew member took it. *Early Warning* says "which direction any **active** threat moves next". Under Ch 9's definition of *active*, this Perk does nothing until Alert 5. **Fix:** "any threat that will move".

**32. Improvise: does the Attribute change?** *(minor · unclear wording)* Ch 8: "Swap the called-for **Skill**". Does the Attribute change with it (Engineering → WIT)? **Fix:** "Use the new Skill with its own Attribute."

**33. NPC rolls against a Difficulty.** *(minor · undefined)* B-R3: the cat rolled 2 of 3 against the Decoy. Is that a Partial? The book never says NPCs get Partials. **Fix:** "NPC rolls are pass/fail."

**34. Crab Spiders fall behind on slick terrain.** *(minor · balance feel)* Crinkle, with Speed 4 and double-cost wet counter squares, finished every movement leg a round behind the crew (O1, B-R4). With per-round creature Alert (Issue 1), the slowest spider effectively sets the crew's Alert cost. This is noted, not necessarily a fix; a Silk Line (safe footing) was the answer in play.

---

## 5. What worked well
- **The core engine is fast.** Counting 4+ on 12 dice took seconds. The Difficulty table read naturally, and Partials almost always suggested a funny, costly complication (the chipped cookie, the short line, the slip).
- **Character creation took about 5 minutes per spider.** The sheet header states every cap and was easy to check. Species and Role combinations felt distinct at once.
- **Signature moves carried the session.** They were decisive, legible and funny: the Decoy (two free rounds), *Make a Scene* (+2 dice to everyone, with Pebbles soaking two Pounces), *I Know a Way* (it turned the escape) and *I Made a Thing*/Overclock.
- **The Preparation complications (Ch 17) paid off.** They were easy to invent and fed the story. The glinting pre-placed line drew the cat and triggered Nook's Contingency straight into Filament's Planted Evidence mouse: a clean, satisfying chain with no extra rules.
- **The Escape design rule (Ch 11/17) worked.** "At least one escape obstacle must be solvable without Athletics" produced an escape in which all five spiders did something different: sling, disguise, squeeze, chase and Take the Hit.
- **Taking hits (Ch 10) was quick and tense.** The Wolf reroll saving Pebbles was the table's best moment.
- **Ch 18's "finish the current action or round first, then bring down the lockdown"** was clear, and exactly what was needed at the B-R6 Full Alert.
- **The Ch 9 Storyteller Note (Active vs Lockdown)** was clear, apart from Issue 15.
- **Tactical Feed** (free, once per round) made the Lookout feel central without taking spotlight.

---

## Appendix — raw roll log (every die rolled in this playtest)
Format: `label [NdS]: faces => successes`. Lines prefixed `B-` belong to Branch B.

```
R1 name [2d6]: 2 3 => 0 succ
R1 species [1d6]: 6 => 1 succ
R1 role [1d6]: 3 => 0 succ
R1 flaw [1d10]: 10 sum=10
R2 name [2d6]: 3 5 => 1 succ
R2 species [1d6]: 5 => 1 succ
R2 role [1d6]: 6 => 1 succ
R2 flaw [1d10]: 8 sum=8
R2 role reroll [1d6]: 6 => 1 succ
Case Nook WIT5+Perc3 [8d6]: 5 6 2 6 6 4 3 4 => 6 succ
Case Crinkle WIT4+Perc3 [7d6]: 3 1 3 4 2 1 6 => 2 succ
Case Filament WIT4+Perc2 [6d6]: 3 2 6 5 4 2 => 3 succ
Case JarLid WIT2+Tac3 [5d6]: 4 4 1 2 4 => 3 succ
Case Pebbles WIT1+Perc1 [2d6]: 1 4 => 1 succ
O1R1 Filament Stealth N4+S3+TF1 vs3 [8d6]: 5 3 2 1 5 2 6 1 => 3 succ
O1R1 JarLid Stealth N2+S2 vs3 [4d6]: 1 3 5 3 => 1 succ
O1R2 Filament SilkLine G4+Acro2 vs2 [6d6]: 3 3 4 2 3 3 => 1 succ
O1R2 Crinkle Stealth N3+S2+TF1 vs3 [6d6]: 2 3 2 6 3 6 => 2 succ
O1R2 Pebbles Stealth N3+S1 vs3 [4d6]: 5 1 6 6 => 3 succ
O1R3 Crinkle assist Nook Stealth2 [2d6]: 2 4 => 1 succ
O1R3 Nook Stealth N3+S2 (+assist) vs3 [5d6]: 1 3 3 6 2 => 1 succ
O1R3 Nook Stealth assist bonus die [1d6]: 6 => 1 succ
O1R3 Nook 2SP reroll 3 failed dice [3d6]: 1 4 2 => 1 succ
O3 Nook Perception tell tins apart W5+P3 vs4 [8d6]: 6 5 2 1 3 2 6 5 => 4 succ
O3 Pebbles assist Athletics3 [3d6]: 5 2 4 => 2 succ
O3 Crinkle Eng W4+E3+OC2+TF1+As2 vs4 (ShowOff) [12d6]: 2 6 1 4 5 3 6 3 2 6 5 3 => 6 succ
Mid-heist complication table [1d6]: 1 => 0 succ
E1 Pebbles Stealth N3+S1+Draft1+TF1 vs3 [6d6]: 2 3 6 2 2 2 => 1 succ
E1 Filament Stealth N4+S3+Draft1 vs3 [8d6]: 6 5 3 5 3 1 1 1 => 3 succ
E1 Crinkle Stealth N3+S2+Draft1 vs3 [6d6]: 4 1 1 2 2 3 => 1 succ
E1 Nook Stealth N3+S2+Draft1 vs3 [6d6]: 5 4 5 4 4 4 => 6 succ
E1 JarLid Stealth N2+S2 vs3 [4d6]: 1 5 5 3 => 2 succ
E2R1 Crinkle Eng sling W4+E3 vs2 [7d6]: 4 4 5 3 2 6 2 => 4 succ
E2R1 Nook Acro squeeze G2+A2 vs1 [4d6]: 3 2 2 5 => 1 succ
E2R1 JarLid sneeze Stealth N2+S2+TF1 vs3 [5d6]: 5 5 2 4 2 => 3 succ
E2R1 Filament Stealth vs human N4+S3+Dr1 vs2 [8d6]: 1 3 5 5 6 5 5 1 => 5 succ
E2R1 Pebbles Stealth vs human N3+S1+Dr1 vs2 [5d6]: 5 3 3 4 5 => 3 succ
---- BRANCH B ----
B-O1R1 Filament Stealth 7+TF1 [8d6]: 6 6 2 3 2 5 5 6 => 5 succ
B-O1R1 cat Perc vs Filament [4d6]: 6 1 2 6 => 2 succ
B-O1R1 JarLid Stealth [4d6]: 4 2 2 4 => 2 succ
B-O1R1 cat Perc vs JarLid [4d6]: 3 5 5 5 => 3 succ
B-O1R2 Crinkle Stealth 5+TF1 [6d6]: 1 4 3 4 6 4 => 4 succ
B-O1R2 cat vs Crinkle [4d6]: 2 3 6 2 => 1 succ
B-O1R2 Pebbles Stealth [4d6]: 3 5 3 1 => 1 succ
B-O1R2 cat vs Pebbles [4d6]: 6 6 4 4 => 4 succ
B-O1R3 cat Perception vs Decoy Diff3 [4d6]: 1 6 5 3 => 2 succ
ST pre-commit: cookies are in RIGHT tin (4-6)
B-O4 which tin crew picks 1-3 L 4-6 R [1d6]: 4 => 1 succ
B-R5 JarLid assist Filament Eng0->min1 [1d6]: 6 => 1 succ
B-R5 Filament Eng W4+E0+Scene2+As1 vs4 [7d6]: 3 2 5 4 6 5 6 => 5 succ
B-R5 cat Pounce Brawl4+Lockdown1 on Pebbles [5d6]: 1 1 3 5 5 => 2 succ
B-R5 Pebbles shrug B5+End3 [8d6]: 5 6 4 3 5 2 5 2 => 5 succ
B-R6 Filament assist Crinkle Eng0 min1 [1d6]: 3 => 0 succ
B-R6 Crinkle Eng W4+E3+OC2+TF1(+assist) vs4 [10d6]: 2 1 5 5 2 4 1 1 3 2 => 3 succ
B-R6 Crinkle 2SP reroll 3 failed [3d6]: 5 3 3 => 1 succ
B-R6 cat Pounce on Pebbles [5d6]: 6 1 4 6 5 => 4 succ
B-R6 Pebbles shrug [8d6]: 3 3 5 1 6 2 2 1 => 2 succ
B-R6 Pebbles Wolf RunItAgain reroll 6 failed [6d6]: 1 1 5 6 5 2 => 3 succ
B-E1 JarLid Acro squeeze G5+A3 vs2 [8d6]: 6 3 5 5 6 3 2 3 => 4 succ
B-E1 Crinkle Eng sling ShowOff W4+E3+OC2+TF1 vs4 [10d6]: 6 6 5 6 5 4 2 2 6 4 => 8 succ
B-E1 Filament Disguise vs human G4+D3 vs4 [7d6]: 1 4 5 6 5 1 4 => 5 succ
B-E1 Nook Acro climb+squeeze G2+A2 vs2 [4d6]: 3 2 5 1 => 1 succ
B-E1 Pebbles Athletics chase B5+A3 [8d6]: 1 2 1 5 5 2 4 6 => 4 succ
B-E1 cat Pursuit 5+Lock1 [6d6]: 1 6 4 4 2 1 => 3 succ
B-E1 cat Pounce on Nook 4+Lock1 [5d6]: 4 2 1 4 2 => 2 succ
B-E1 Nook shrug B2+End1 [3d6]: 3 1 3 => 0 succ
B-E2 Filament Acro squeeze G4+A2 vs2 [6d6]: 3 1 3 3 1 3 => 0 succ
B-E2 Nook Acro G2+A2 vs2 [4d6]: 4 4 3 5 => 3 succ
B-E2 Pebbles Acro G3+A2-1Rat+TF1 vs2 [5d6]: 4 3 2 2 5 => 2 succ
B-E2 Filament 2SP reroll 3 [3d6]: 6 2 3 => 1 succ
```
