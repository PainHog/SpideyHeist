# Playtest — Heist 5: The Restaurant Rush (Restaurant · Hard, Alert Limit 6)

Procedural playtest of *Heisty Spideys* rulebook v4.5 (`book/src/chapters/*.html`). One Storyteller (ST) and five players, all
simulated, played strictly by the book to find where the rules are contradictory, silent, unclear or awkward at the table.
Rulings already recorded in `book/REVIEW.md` are not re-reported unless they caused a new problem in play.

Every die was rolled with a small script that uses `crypto.randomInt`. The full raw log is in the appendix. No results were
invented. When the book was silent, the ST made a ruling. Each ruling is marked **[RULING]** in the log and listed under ISSUES.

**Outcome:** Full Success. The crew escaped with the notebook, the Alert peaked at **2 of 6**, and each spider earned 5 AP.
The dice were kind, and the three Face spiders cancelled most of the Alert. The Alert rules for a Hard location never came
under real pressure, so a **clearly labelled drill** (§4) forks the escape at the point where the Faces spent their cancels.
It replays that point without them, using new real rolls, to exercise Active, Full Alert, Silk Clutch and Taking Hits.

---

## 1. Character creation (Ch 7, tables from Ch 20)

All four tables were rolled for all five spiders: name 2d6, species 1d6, role 1d6 (on a 6, roll again), flaw 1d10.
Points were then allocated by hand under Ch 7: Attributes 10 points (minimum 1, maximum 5 including the species bonus);
Skills 12 points plus the Role's +3 on its core skills (maximum 3 per skill at creation); Silk = WIT + NERVE.

| # | Name roll (2d6) | Species (1d6) | Role (1d6) | Flaw (1d10) |
|---|---|---|---|---|
| P1 | 3+3 = 6 → **Jar Lid** | 1 → Jumping Spider | 2 → Ghost | 2 → Overconfident |
| P2 | 5+2 = 7 → **The Architect** | 4 → Cellar Spider | 1 → Face | 5 → Allergic to Dust |
| P3 | 3+3 = 6 → **Jar Lid** (again) | 4 → Cellar Spider (again) | 1 → Face (again) | 2 → Overconfident (again) |
| P4 | 4+6 = 10 → **Cassette** | 2 → Orb Weaver | 2 → Ghost (again) | 2 → Overconfident (third time) |
| P5 | 1+2 = 3 → **Pebbles** | 2 → Orb Weaver (again) | 1 → Face (third time) | 3 → Loud |

The dice produced **three Faces and two Ghosts**. The crew has no Tinkerer, Bruiser, Lookout, Wheelman or Grifter, and three
spiders have Overconfident. There are two spiders named Jar Lid. P3 is the same species, role and flaw as P2 or P1 in every
column except name. The book has no reroll or duplicate rule, so everything was kept as rolled. At the table the two Jar Lids
are called **Jar Lid J** (Jumping) and **Jar Lid C** (Cellar).

### Sheets

**Jar Lid J** — Jumping Spider · Ghost · Speed 6 · Silk **5** · Vitality Unharmed
- Species ability: *Did You See That Jump?!* Signature Move: *Phase Through*.
- Attributes (base → final): BODY 2→**3**, WIT **2**, NERVE **3**, GRACE 3→**4** (+1 BODY, +1 GRACE).
- Skills: Athletics 2, Endurance 1, Engineering 1, Perception 2, Tactics 1, **Stealth 3** (1 + 2 Role), Deception 1, **Acrobatics 3** (2 + 1 Role), Disguise 1. Base points: 12.
- Perks: Soundless, Ghost Protocol. Flaw: Overconfident.

**The Architect** — Cellar Spider · Face · Speed 5 · Silk **6** · Vitality Unharmed
- Species ability: *Contortionist*. Signature Move: *That's Not What Happened*.
- Attributes: BODY **1**, WIT **3**, NERVE **3**, GRACE 3→**5** (+2 GRACE).
- Skills: Engineering 1, Perception 2, Tactics 2, Stealth 2, **Deception 3** (2 + 1), Acrobatics 2, **Persuasion 3** (1 + 2). Base: 12.
- Perks: Read the Room, Silver Tongue. Flaw: Allergic to Dust.

**Jar Lid C** — Cellar Spider · Face · Speed 5 · Silk **5** · Vitality Unharmed
- Species ability: *Contortionist*. Signature Move: *That's Not What Happened*.
- Attributes: BODY **2**, WIT **2**, NERVE **3**, GRACE 3→**5**.
- Skills: Athletics 1, Perception 1, Stealth 3, **Deception 3** (1 + 2), Acrobatics 2, **Persuasion 3** (2 + 1), Disguise 2. Base: 12.
- Perks: Plausible Deniability, Fast Talk. Flaw: Overconfident.

**Cassette** — Orb Weaver · Ghost · Speed 5 · Silk **7** · Vitality Unharmed
- Species ability: *Everything Connects*. Signature Move: *Phase Through*.
- Attributes: BODY **2**, WIT 2→**4** (+2 WIT), NERVE **3**, GRACE **3**.
- Skills: Athletics 1, Engineering 3, Perception 3, Tactics 2, **Stealth 3** (2 + 1), **Acrobatics 3** (1 + 2). Base: 12. Built to cover the missing Tinkerer and Lookout.
- Perks: Dead Drop, Silk Trail. Flaw: Overconfident.

**Pebbles** — Orb Weaver · Face · Speed 5 · Silk **7** · Vitality Unharmed
- Species ability: *Everything Connects*. Signature Move: *That's Not What Happened*.
- Attributes: BODY **3**, WIT 2→**4**, NERVE **3**, GRACE **2**.
- Skills: Athletics 2, Brawl 3, Endurance 2, Tactics 1, **Deception 3** (1 + 2), Intimidation 2, **Persuasion 2** (1 + 1). Base: 12. Built as a stand-in Bruiser. Stealth 0.
- Perks: Actually, I Planned This; Familiar Face. Flaw: Loud.

Crew totals: 30 SP. Two Endurance pools are tiny: The Architect has BODY 1 + Endurance 0, so 1 die to shrug off a hit.

### Creation friction noted

- **Duplicates.** With 5 players, the chance of at least one duplicate role on the table is about 87%; this crew got a
  triple. See ISSUE C-1.
- **"+3 points split between them."** Can all 3 go on one core skill? It was read as "split" meaning at least 1 each (2/1).
  The rule that a core skill can't be pushed above 3 also means that base points spent on a core skill can strand the Role
  bonus. See C-4.
- There is no "choose one of the two" step for flaws. Three Overconfidents means the ST gets three identical once-per-heist
  triggers.

---

## 2. The map the ST had to build

Heist 5 in Ch 19 has **no map**; only Heist 1 does. It has no distances, no entry points and no numbers for the staff. Ch 14
says to draw one, so this is the ST's map. One square equals one spider.

```
    0         1         2         3
    01234567890123456789012345678901
 0  ################################
 1  V~~~~~~~~~~~~~~~#hhhh..........#   V alley vent (entry)   ~ bar counter   h extractor hood
 2  #...............P..............#   P pass-through window (dining <-> kitchen)
 3  #..T...T...T....P..sssssss.....#   T table legs (cover)   s steel prep counter
 4  #...............#..............#
 5  #..T...T...T....S..............#   S swinging door (spider gap under it)
 6  #...............#.........WW...#   WW dishwasher - the Rat lives under it
 7  #..T...T...T....#.........WW...#   kitchen floor freshly mopped (slippery)
 8  #...............########g#######   g gap under kitchen->corridor door
 9  #...............#.............tX   t new snap trap   X back door (staff prop it for trash)
10  #######F#########...o#####b#####   F front door   o office door (sticks)   b break-room door
11                  #....#.........#
12                  #.N..#....z....#   N the notebook, on the desk   z sleeping staffer (unknown obstacle)
13                  #....#.........#
14                  ################
```

Key distances: V→S 16 · S→g 8 · g→o 4 · o→X 11 · b→o 6. The staff have no Speed in the book, so the ST used **6**, taken
from the Curious Child and the Exterminator [RULING].

Staff: **A** is mopping the dining room, **B** is stacking chairs, and **C** is asleep in the break room (the unknown obstacle).
The book says the staff "move unpredictably with no set route". To keep the map honest, the ST rolled 1d6 for each staffer
each round: 1–2 dining room, 3–4 kitchen, 5–6 corridor [RULING].

---

## 3. Play log (main session)

Alert band reference for Limit 6: **0–2 Calm**, **3–4 Stirring** (Stealth +1 Difficulty), **5 Active** (threats on, no penalty),
**6 = Limit, Full Alert**. The book says Lockdown (7+) is skipped at this Limit.

### Phase 1 — The Score (Ch 11, 17)
| Step | Rule | Dice | Result | Alert |
|---|---|---|---|---|
| Brief | Ch 19 Heist 5 Score text read out. The ST shows the map without the break room's contents. | — | Wasp client, notebook, midnight, dinner ran late. Two closing staff and a warm kitchen are in plain sight. Nobody has *Easily Distracted*, so the Score's flaw hook does nothing. | — |

### Phase 2 — Planning (Ch 11, 17)
| Step | Rule | Dice | Result | Alert |
|---|---|---|---|---|
| Casing, Jar Lid J | Ch 11: "one Casing roll — Perception or Tactics". WIT is assumed as the Attribute [RULING]. | WIT2+Perc2: 5 6 1 6 | 3 succ | — |
| Casing, Architect | same | WIT3+Perc2: 6 1 4 6 6 | 4 succ | — |
| Casing, Jar Lid C | same | WIT2+Perc1: 3 4 6 | 2 succ | — |
| Casing, Cassette | same | WIT4+Perc3: 5 1 1 6 2 2 6 | 3 succ | — |
| Casing, Pebbles | Tactics | WIT4+Tac1: 1 4 6 2 5 | 3 succ | — |
| Intel paid out | Ch 17: "one true detail per Success" | **15 successes** | Heist 5 lists **3** intel items. The ST had prepared 6 more, drawn from its own map: mopped floor, door gaps, corridor layout and propped back door, snap trap, notebook size, crack under the office door. That makes 9. **6 successes bought nothing.** The unknown staffer was held back, as the ST Prep instructs. | — |
| Familiar Face (Pebbles) | Ch 5 Perk | — | One free detail: "the chef leaves the notebook on the desk, not in the drawer." | — |
| Read the Room | Saved for the Rat encounter | — | — | — |
| Prep 1: entry at V | Ch 11 prep list. Complication per Ch 17. | — | Complication: the grille has a loose screw, and the last spider through must be quiet. | — |
| Prep 2: pre-placed Silk Line along the bar ceiling to P | Ch 11. The SP cost is undefined, so the ST made it free [RULING]. | — | Complication: the hood's draught makes it sway. This was texture only and never mattered. | — |
| Prep 3: Dead Drop (Cassette), a shiny bottle cap behind S | Ch 5 Perk plus Ch 11 "Stash one small item". Unclear whether this is also a Prep, so it was treated as one. | — | Complication: staffer B's mop nudged it 2 squares. Never used. | — |
| Brilliant Plan | Ch 8 | — | Not awarded. | — |

### Phase 3 — The Heist
| Step | Rule | Dice | Result | Alert |
|---|---|---|---|---|
| Entry, vent grille | Prep complication. Pebbles is last: NERVE3+Stealth0, D1. | 1 5 3 | 1 ≥ 1, success | 0 |
| **O1 Dining room** | Staff are "Human Obstacles (Ch 15)". Closing staff doing cleanup fit no row, so the ST set **Stealth D2** [RULING]. One roll per spider for the whole crossing [RULING], because the book has no group check. | | | |
| Assist Jar Lid C → Pebbles | Ch 2: Skill only, maximum 3 | Stealth3: 1 2 4 | +1 die | 0 |
| Jar Lid J | Soundless makes it D1 | 6 dice: 4 5 3 5 4 2 | 4, a Critical, but at D1 so there is no Alert drop. Crit bonus: spots the office's second way out (a crack under the door). | 0 |
| Architect | D2 | 5 dice: 5 3 2 4 4 | 3, success | 0 |
| Jar Lid C | D2 | 6 dice: 1 3 3 6 5 6 | 3, success | 0 |
| Cassette | D2 | 6 dice: 1 3 6 6 4 1 | 3, success | 0 |
| Pebbles | D2, 3 + 1 assist | 2 4 2 4 | 2, success | 0 |
| **O2 Kitchen** | Wall route avoids the mopped floor (Ch 3 climbing at normal cost). The Rat's domain. | | | |
| Mid-Heist Complication | Ch 20 d6. When to roll it is unstated, so the ST rolled on reaching the kitchen. | 5 | "A phone lit up on the counter." The table gives no mechanical effect. | 0 |
| Staff movement | ST d6 | A: 1, B: 5 | A stays in the dining room. B crosses the kitchen to the back door, holding the lit phone. | 0 |
| Stealth under phone light | Distracted Human is D1; the ST added +1 for the light, making **D2** [RULING]. Three spiders behind the hood have cover, D2 − 2 = no roll [RULING; see ISSUE R-2]. | | | |
| Architect | D2 | 1 1 6 2 5 | 2, success | 0 |
| Jar Lid C | D2 | 4 4 1 5 2 6 | 4, a Critical at D2 → Alert −1, **but it is already 0; wasted**. Bonus: sees B prop the back door with a brick. | 0 |
| **O3 The Rat** | Ch 16 stat block: Haggle (Persuasion) 4. Opposed roll (Ch 2) [RULING: the negotiation is one opposed roll]. | | | |
| Read the Room | Ch 5 | — | ST answers honestly: he wants the new **snap trap by the back door** gone. | 0 |
| **Overconfident fires (Cassette)** | Ch 7 Flaw 2. Cassette volunteers to do the talking. | — | Cassette has GRACE 3, Persuasion 0. A flaw moment gives +1 SP (7→8). | 0 |
| Improvise (Cassette, 2 SP → 6) | Ch 8: swap Persuasion for Tactics at "+1 Difficulty" | — | [RULING] Uses WIT + Tactics (6). In an opposed roll "+1 Difficulty" was read as "+1 success to the Rat". | 0 |
| Assist Architect → Cassette | Persuasion 3 | 5 4 4 | +3 dice | 0 |
| Offer bonus | Rat Weakness "a favour owed" | — | [RULING] +2 dice for offering exactly what he wants. The book gives no number. | 0 |
| Cassette | 6 + 3 + 2 = 11 dice | 3 1 2 2 2 2 2 6 4 1 3 | **2 succ** | 0 |
| Rat | 4 dice, +1 for Improvise | 5 3 4 3 | 2 + 1 = **3**. The Rat wins; he would win a tie anyway. | 0 |
| SP Reroll (Cassette, 2 SP → 4) | Ch 8: reroll up to 3 dice | 4 4 5 | 2 → **5 succ**, beats 3. Deal struck: safe passage in exchange for jamming the trap. The Rat adds no Alert while the deal holds. | 0 |
| **O4 The Office** | Door "sticks" (casing intel). Cellar spiders slip under the crack with no roll (Contortionist). | | | |
| Staff | ST d6 | A: 4, B: 2 | A goes to the kitchen, B to the dining room. | 0 |
| Assist Cassette → Pebbles | Athletics 1 | 3 | +0 | 0 |
| Pebbles shoves the door open a notebook's width | BODY3+Ath2, **D3** [RULING] | 4 2 3 1 1 | 1, **Partial**: the door opens, but it scrapes. [RULING] A partial's noise costs +1 (see R-4). | **1** |
| **Allergic to Dust (Architect)** | Ch 7 Flaw 5. The ST picks the dusty office. Stealth **D3**. | NERVE3+St2: 1 1 6 2 6 | 2 succ vs D3: a Partial on a pass/fail check [RULING: muffled, no +1]. "Everyone in earshot knows something happened." Flaw moment: +1 SP (6→7). | 1 |
| **Unknown obstacle** | Ch 19 ST Prep | — | Scrape and sneeze together: staffer **C wakes** and heads for the office, 6 squares away. Turn order starts (Ch 3). | 1 |
| R1 Jar Lid J | *Phase Through* (Signature Move), no roll | — | Inside | 1 |
| R1 Cassette squeeze | Ch 3 squeeze, Acrobatics D2 | GRACE3+Acro3: 6 4 1 1 5 5 | 4, a **Critical** at D2 → **Alert −1** | **0** |
| R1 Pebbles | Web Structure, 2 SP (7→5), no roll | — | A silk net under the desk edge to catch the notebook | 0 |
| R1 Assist Architect → Jar Lid J | Athletics 0 → "minimum 1" | 1 | +0 | 0 |
| R1 Jar Lid J pushes the notebook onto the net | BODY3+Ath2, D2 [RULING] | 3 1 2 3 4 | 1, **Partial**: the notebook lands, but a pen clatters to the floor, +1 (R-4) | **1** |
| R1 threat phase | C arrives in the doorway. **Jar Lid C: Fast Talk** (free action, used during the ST's phase [RULING; R-11]). | — | C is distracted for one round | 1 |
| Staff | d6 | A: 4, B: 1 | A in the kitchen, B in the dining room | 1 |
| R2 Assist Jar Lid J → Pebbles | Athletics 2 | 6 4 | +2 dice | 1 |
| R2 Pebbles drags the notebook to the door | BODY3+Ath2+2, D3. Hauling is undefined, so haulers move at half Speed [RULING]. | 6 5 1 1 1 · 2 5 | 3, success | 1 |
| R2 Assist Cassette → Architect | Deception 0 → 1 die | 6 | +1 die | 1 |
| R2 Architect fakes a squeak in the break room | Alert Human, Deception **D4** | 4 1 5 3 5 6 · 6 | 5, success (a crit needs 8) | 1 |
| Staff | d6 | A: 3, B: 4, C: 4 | All three staff converge on the kitchen. C walks up the corridor past the office. | 1 |

### Phase 4 — The Escape (built by the ST under Ch 11 and Ch 17)
The book supplies no escape. The ST built **E1 The Corridor**: haul the notebook 11 squares while C walks the corridor, and
honour the Rat deal by jamming the trap. This one can be solved without Athletics, with Stealth, Deception, Engineering or
Intimidation. The ST also built **E2 The Back Door**: lower the notebook down the step before B shuts the door. The crew
has no Wheelman, so nobody has *I Know a Way*. The Alert carries over at **1**.

| Step | Rule | Dice | Result | Alert |
|---|---|---|---|---|
| E1 R1: C glances into the office | Alert Human D4. Architect, Jar Lid C and Cassette hide behind the door; the ST calls no roll (Ch 2 "When Not to Roll"). | | | 1 |
| **Overconfident fires (Jar Lid J)** | Ch 7 | — | Insists on "guarding" the notebook in the open. +1 SP (5→6). | 1 |
| Jar Lid J | Stealth D4, no cover | 6 6 1 5 1 2 | 3, **Partial**: "spotted briefly" +1 → **Plausible Deniability** (Jar Lid C) talks it away | 1 |
| Pebbles | Stealth D4 − 2 for cover = D2 [RULING] | NERVE3+St0: 2 2 1 | **0, Failure.** +1 → **That's Not What Happened** (Architect, 2 SP, 7→5): "a raisin rolled out from the door." The Alert rise is cancelled. The failure still needs a consequence (R-15): C fetches a broom to sweep up the "raisin". | 1 |
| Staff | d6 | A: 1, B: 1 | Both in the dining room | 1 |
| E1 R2: haul | Empty corridor; no roll (Ch 2) | — | 5 squares | 1 |
| Assist Jar Lid C → Architect | Engineering 0 → 1 die | 2 | +0 | 1 |
| Architect jams the snap trap with silk | WIT3+Eng1, D3 (Locked Drawer scale) | 4 5 4 6 | 4, success. The Rat deal is honoured. | 1 |
| R2 threat: C returns with a broom and **sees the chef's notebook in the corridor** | Ch 9 "confirmed alert" +2. No Stealth roll is possible for an object [RULING]. | — | **Damage Control** (Ch 8): Pebbles, Cassette and Jar Lid J pay 1 SP each. Spike +2 → +1. | **2** |
| Staff | d6 | A: 2, B: 4 | B moves to the kitchen, next to the corridor door | 2 |
| E1 R3: *Actually, I Planned This* (Pebbles) | Ch 5, once per heist | — | +1 die on the next roll [RULING: one roll, not every spider's; R-19] | 2 |
| Assist Jar Lid J → Pebbles | Intimidation 0 → 1 die | 5 | +1 die | 2 |
| Pebbles rears up on the notebook, "NOPE" | Intimidation vs Alert Human, D4 [RULING: Intimidation allowed per Ch 13 "say yes"] | NERVE3+Int2+1+1: 3 1 4 5 5 3 6 | 4, success. C recoils. The haulers reach the door. | 2 |
| Staff | d6 | B: 6 | B steps into the corridor | 2 |
| R3 threat: C swings the broom at Pebbles | Ch 15 Human With Broom: "Athletics (3)" | BODY3+Ath2: 1 6 2 5 5 | 3, dodged. No Taking Hits roll. | 2 |
| **E2 R4** Assist Pebbles → Jar Lid J | Athletics 2 | 6 3 | +1 die | 2 |
| Jar Lid J lowers the notebook down the step on silk | BODY3+Ath2+1, D2 | 4 6 3 4 2 · 2 | 3, success | 2 |
| Jar Lid C sends B away: "it ran under the dishwasher!" | Deception D4 | 4 6 6 4 4 3 | 5, success. B goes to the dishwasher; the Rat stays hidden, as the deal requires. | 2 |
| Out | — | — | The crew and the notebook are out in the alley | **2 (final; peak 2)** |

### Phase 5 — The Debrief (Ch 11)
- **Full Success**: escaped with the complete objective. Hard pays **5 AP**, read as 5 AP per spider (R-20).
- Final SP: Jar Lid J 5 · Architect 5 · Jar Lid C 5 · Cassette 3 · Pebbles 4. Unspent SP does not carry over (Ch 11: "You start every heist with WIT + NERVE").
- Example AP spend. Pebbles: Stealth 0→1 (1), Stealth 1→2 (1), Athletics 2→3 (1), plus 2 AP left. Cassette: a 3rd Perk, *Soundless* (3), and Persuasion 0→1 (1), 1 AP left. This caused no friction.
- Nobody went Out. Vitality was never touched. The Waiting Web was never triggered.

---

## 4. DRILL — the escape without the Face cancels (real rolls, not canonical)

Fork point: E1 R1–R2. The Faces decline *Plausible Deniability*, *That's Not What Happened* and Damage Control; Ch 8
itself advises "early on, hoard". Replaying the same results gives Alert 1 +1 (Jar Lid J partial) +1 (Pebbles fail) +2
(notebook seen) = **5, Active**. Pebbles' **Loud** is now on, and Stirring's Stealth +1 still applies (Ch 9 note: "Penalties
stack").

| Step | Dice | Result | Alert |
|---|---|---|---|
| Active: the ST turns all three staff on. The book gives no escalation for "staff". | — | A turns on the kitchen lights, B heads for the corridor | 5 |
| R3 Assist Jar Lid J → Pebbles (Intimidation 0) | 4 | +1 die | 5 |
| Pebbles intimidates C, D4 (not Stealth, so no penalty) | 1 6 6 4 2 5 1 | 4, success | 5 |
| C's broom: Pebbles dodges, Athletics D3 | 5 2 4 5 2 | 3, dodged | 5 |
| B looks down the corridor. Cassette hauling: Stealth D4 +1 Stirring = **D5** | 2 6 5 2 2 2 | 2, **Partial**: spotted briefly +1 | **6, Full Alert** |
| Jar Lid J hauling, Stealth D5 | 6 3 1 5 1 6 | 3, **Partial**: +1 → "7"? The book does not say whether the Alert passes the Limit (R-7). Tracked as 6+. | 6 |
| Ch 18: "finish the current action or round first" | — | Full Alert lands at round end. The objective is **already in hand, so it is kept** (Ch 9). No Lockdown penalty applies ("lower Limits skip the later bands"). **Mechanically, nothing changes.** | 6 |
| R4 Jar Lid C deceives B, D4 | 2 6 2 1 6 4 | 3, Partial. Any +1 would be meaningless now, so the ST needs a non-Alert complication: B shouts "there's a NEST". | 6 |
| Cassette lowers the notebook, BODY2+Ath1, D2 | 2 2 5 | 1, Partial. Complication: the elastic snaps and the notebook flops open, costing an Action to close. | 6 |
| Jar Lid J dodges the broom, D3 | 3 3 3 4 6 | 2, Partial → **Silk Clutch** (3 SP, 6→3). It succeeds, and its "+1 Alert" costs **nothing** at Full Alert (R-8). | 6 |
| R4 threat: C swats Pebbles, dodge D3 | 5 3 1 1 5 | 2, Partial. At Full Alert the ST rules it "a direct swat" → **Taking Hits** (Ch 10) | 6 |
| Broom attack (no stat block, so 3 dice from its Ch 15 Difficulty [RULING]) vs Pebbles BODY3+End2 | atk 5 3 5 → 2 · def 6 5 5 2 5 → 4 | Shrugged off; no level lost | 6 |
| R5 Jar Lid J: *Did You See That Jump?!* to the alley drain, no roll | — | — | 6 |
| Pebbles hauls the notebook into the drain, D3 | 2 1 1 2 5 | 1, Partial. B sees it vanish. The ST could rule "soggy notebook = incomplete loot", which would make it a Partial Success at half AP (R-9). | 6 |

What the drill showed: at a Hard location, **Full Alert with the loot in hand is mechanically identical to Active**. After the
Limit, every Alert cost (Silk Clutch, Loud Failure, a spider going Out) stops mattering. The Exterminator, House-Cat hunting,
the Sleeping Human getting up and the Child shouting for a parent are all keyed to Alert 7+, so they can **never** fire here.

---

## 5. ISSUES

Severity: **blocker** means the ST cannot continue without inventing a rule. **confusing** means tables will rule it
differently. **minor** means polish.

### A. Heist 5 content (Ch 19)

**H-1 · blocker · undefined — Heist 5 has no map, distances or entry points**
- *Where:* Phase 1, before play could start.
- *Book:* Ch 11: "The ST lays out the map — the grid the crew will be working on". Ch 19 opener: "Each heist is ready to run with minimal prep". Ch 14: "A typical location is 4–6 connected areas… Entry points — at least two ways in". Only Heist 1 has a `Sample map`.
- *Fix:* Give each of Heists 2–5 a sample grid like Heist 1's, marking entry points, the objective square, threat start squares and the unknown obstacle's location.

**H-2 · blocker · undefined — restaurant staff have no numbers**
- *Where:* O1, O4 and E1, every time a staffer moved, looked or swung.
- *Book:* Ch 16: "the librarian, restaurant staff and cleaning crew are Human Obstacles (Ch 15)". Ch 15 gives only "Primary Roll" and a Difficulty, for example "Human With Broom Athletics (3)". There is no Speed, no Perception or attack pool, and no Alert Contribution. Ch 10 Taking Hits needs "the attack's Successes".
- *Fix:* Add a generic **Human** stat block: Speed 6, Perception 3, Swat/Grab 3, Alert Contribution +1 per round while searching. Say that the Ch 15 rows are the Difficulty the *spider* rolls against.

**H-3 · confusing · undefined — "moving unpredictably" has no procedure**
- *Where:* every round with staff on the map.
- *Book:* Heist 5: "two staff moving unpredictably, no patrol pattern". Ch 14: "A patrol pattern or routine, even an irregular one, mapped in squares". Ch 3: "Don't fudge distances".
- *Fix:* Add a one-line method, such as "roll 1d6 per unpredictable NPC each round on a destination table you prepare". Give Heist 5 its own table.

**H-4 · confusing · process friction — obstacles 2 and 3 are the same obstacle, and 2 depends on a flaw nobody may have**
- *Where:* O2 and O3.
- *Book:* "The kitchen — warm, incredible smells. Easily Distracted triggers. Also, the rat." / "The rat. Negotiations." Score: "(a spider with Easily Distracted may have it triggered on entry)". Easily Distracted is 1 in 10 per spider, so a crew of 5 has about a 41% chance of including it.
- *Fix:* Give obstacle 2 its own content, such as "freshly mopped floor (Slippery Surface) with the dishwasher's final cycle masking noise for 3 rounds". Keep the Rat as obstacle 3.

**H-5 · confusing · contradiction — scripted wake-up vs "fair world"**
- *Where:* O4, the unknown obstacle.
- *Book:* Heist 5: "will wake at the worst moment" / "wakes exactly when the crew is in the office". Ch 13: "The human wakes because there was actually a loud noise." Ch 15 Sleeping Human: "At Alert 5 they stir; at 7 they're up". **7 is unreachable at Limit 6.**
- *In play:* the sneeze and door scrape happened to justify it. A silent crew would have had the staffer wake for no reason.
- *Fix:* "wakes the first time the crew makes noise within 8 squares of the break room (any Partial, Failure or flaw sneeze), or when the Alert reaches 5".

**H-6 · minor · contradiction — loot tier**
- *Book:* Heist 5 "Hard · Loot: Prize". Ch 12: "Prize (Standard)", "Treasure (Hard or Absurd)". Heist 4, also Hard, is Treasure. This was introduced when REVIEW ruling 14 made Heist 5 Hard.
- *Fix:* Change Heist 5 to "Loot: Treasure".

**H-7 · confusing · undefined — the Rat's deal**
- *Where:* O3.
- *Book:* Ch 16 Rat: "Alert Contribution none while the deal holds; +2 if it goes bad". "Weakness food, a favour owed, being treated like a professional". "It's a negotiation, not a fight — until it is."
- *Unclear:* Is the negotiation one opposed Persuasion vs Haggle 4 roll? What does offering a Weakness do? Is "+2 if it goes bad" once, or per round like every other Contribution line? Does losing the roll make it "go bad", or just mean no deal? What happens if the crew breaks the deal on the way out?
- *Fix:* "Opposed Persuasion vs Haggle 4. Offering one of his Weaknesses gives +2 dice. On a loss there is no deal: he blocks the kitchen, and crossing without his say-so is Stealth vs his Perception 3. The deal goes bad if the crew is caught crossing or breaks its word: +2 Alert once, then he fights (Brawl 4)."

**H-8 · confusing · undefined — no escape is provided**
- *Book:* Ch 11 requires 1–2 escape obstacles, one of them solvable without Athletics. None of the five heists supplies any.
- *Fix:* Add one "Escape" line to each heist. For Heist 5: "the back door is propped for the trash run; the staff are converging".

**H-9 · minor · undefined — the physical scale of the loot**
- *Where:* O4 and E1–E2 (the notebook).
- *Book:* nothing on carrying capacity. Ch 6 Athletics: "carrying the loot bag". Butterfingers: "holding an item or the loot".
- *Fix:* Add a short hauling rule to Ch 12: "Loot larger than a square needs N haulers; they move at half the slowest hauler's Speed."

### B. Planning (Ch 11, 17)

**P-1 · confusing · undefined — surplus Casing successes, and whether the unknown can be cased**
- *Where:* Casing. 15 successes against 3 listed intel items.
- *Book:* Ch 11: "each Success reveals one concrete piece of intel the ST is holding". Ch 13: "Every heist should have at least one obstacle the crew didn't uncover in Planning". Heist 5 lists 3 items.
- *Fix:* Cap it: "Casing reveals at most one item per spider, and never the ST Prep's unknown obstacle." Or say what surplus buys, for example "+1 die on one roll in the relevant obstacle". List 5–6 intel items per heist. Also state the Attribute (WIT), whether Assists apply, and that Casing never raises the Alert.

**P-2 · minor · undefined — Preparations**
- *Book:* "a few concrete preparations"; "Pre-place one Silk Line" (cost unstated); "Stash one small item… (see the Ghost's Dead Drop)"; "Choose your entry square" also counts as a prep that gets a complication.
- *Fix:* "Each spider may make one Preparation. Pre-placed Silk Lines are free. Dead Drop is free and needs no complication (that is the Perk's edge). Choosing an entry is not a Preparation."

### C. Character creation (Ch 7, 20)

**C-1 · confusing · balance feel — random rolls produce duplicate crews**
- *Where:* creation. Three Faces, two Ghosts, three Overconfidents, two Jar Lids. No Tinkerer, Lookout, Bruiser, Wheelman or Grifter.
- *Book:* Ch 7: "The crew wants variety, not optimization". Ch 20 Role: "Roll 1d6; on a 6, roll again", which gives Wheelman and Grifter a 1-in-12 chance each against 1-in-6 for the others. Ch 11: "the Wheelman earns their keep".
- *Knock-on:* no Wheelman, so no *I Know a Way* and no Escape Routes. No Lookout for Casing.
- *Fix:* "If a Role (or name) is already on the crew, roll again." Or roll 1d8 with 7–8 as Wheelman/Grifter. Ch 7 could add "Random crews may reroll duplicate Roles and Flaws."

**C-2 · minor · process friction — duplicate names**
- *Book:* Ch 7 Step 9 and the 2d6 name table: 11 names for 5 spiders, with a bell curve. The chance of a duplicate is about 73%.
- *Fix:* "On a repeat, add a surname or roll again."

**C-3 · minor · balance feel — three identical flaws**
- *Book:* Overconfident: "Once per heist, the ST may make you volunteer…". Three copies give three triggers that feel identical. In play it was also toothless on Jar Lid C, because the "wrong" spider had the same pool as the right one.
- *Fix:* Covered by C-1's reroll rule.

**C-4 · minor · unclear wording — Role bonus split**
- *Book:* "+3 points split between them" (Ch 5). Ch 7: "must go on your two core skills, and can't push either above 3".
- *Unclear:* Is 3/0 allowed? If base points bring a core skill to 3, the bonus has nowhere to go.
- *Fix:* "Put the 3 Role points on your core skills in any split (3/0 is fine). Spend Role points before base points."

### D. Core resolution (Ch 2, 3, 9, 10)

**R-1 · confusing · process friction — no group check, so every spider rolls**
- *Where:* O1, the 5-spider dining crossing, and again in O2 and E1.
- *Book:* nothing on group movement. The Wheelman's *Drafting* ("When you lead group movement") implies it exists. Ch 2 "Only one spider can Assist a given roll".
- *Effect:* at a Hard location, a larger crew means more rolls and more chances to raise the Alert. A 5-spider crew is punished for its size. Pebbles (Stealth pool 3) is a 50/50 coin at D2.
- *Fix:* Add a **Group Roll**: "When the whole crew does the same thing, the leader rolls. Every other spider rolls their Skill (maximum 3) and adds Successes as an Assist. Any 0-Success helper adds a complication."

**R-2 · blocker · contradiction — "Difficulty to spot you" has no referent**
- *Where:* O2 (hood cover), E1 (door cover), and every Crab, Arachnophobe and I-Was-Never-Here case.
- *Book:* Ch 3 Cover: "Increase the Difficulty to spot or target you by 2". Crab Spider: "the Difficulty to spot you increases by 2". Arachnophobe Magnet: "The Difficulty to be spotted by humans is reduced by 1". I Was Never Here: "Increase the Difficulty for any NPC to remember seeing you by 2".
- *Problem:* in play, spotting is resolved either as the **spider's** Stealth vs a static Difficulty (Ch 15) or as an **opposed** roll against a creature's Perception (Ch 2, Ch 16). Neither has a "Difficulty to spot". The ST had to invert it (−2 to the spider's Stealth Difficulty).
- *Fix:* Rewrite all four as "your Stealth Difficulty is reduced by 2 (against an opposed Perception roll: +2 dice)", and the reverse for Arachnophobe.

**R-3 · confusing · undefined — opposed rolls have no Difficulty, Partial or Critical**
- *Where:* O3 (Rat), Branch-check (Rat Perception vs 5 Stealth rolls).
- *Book:* Ch 2 Opposed Rolls: "Most Successes wins". The Stirring band ("Stealth rolls have their Difficulty increased by 1"), *Soundless* (−1 Difficulty), *Loud* (+1), *Improvise* (+1 Difficulty) and *Silver Tongue* ("When you fail a Persuasion roll") all assume a Difficulty or a fail state.
- *Also:* When one NPC opposes five sneaking spiders, does it roll once or five times?
- *Fix:* "In an opposed roll, each +1 Difficulty is +1 die to the opponent, and each −1 is +1 die to you. Losing is a Failure, winning by 1 is a Partial, winning by double is a Critical. An NPC rolls once per round against every spider it could perceive."

**R-4 · confusing · unclear wording — does a Partial's complication raise the Alert?**
- *Where:* O4, the door scrape and the pen clatter. These were 2 of the 3 Alert points raised in the main session.
- *Book:* Ch 2 Partial: "The lock opens, but you made noise." Ch 9 +1: "A roll **fails** with a consequence — noise, attention, evidence."
- *Fix:* State it: "A Partial's complication may be +1 Alert (ST's choice) or something else — never both."

**R-5 · minor · unclear wording — pass/fail checks vs three-tier results**
- *Where:* the Allergic to Dust sneeze got 2 successes against D3.
- *Book:* "make a Stealth roll (Difficulty 3) or the Alert rises by 1". Fear of Vacuums, Thunderous Entrance and Grifter Decoy are similar.
- *Fix:* "Flaw and Perk checks written 'roll X or Y' treat a Partial as passing."

**R-6 · confusing · balance feel — Full Alert at Limit ≤6 has no mechanical teeth**
- *Where:* Drill.
- *Book:* Ch 9: "At a Limit of 6 or less, the location hits Full Alert before Lockdown — lower Limits skip the later bands entirely. That's what makes them hard." Also "At Limit — Full Alert… If they do have it, they just need to get out."
- *Effect:* once the crew has the loot, a Hard location at Full Alert is **easier** to escape (no roll penalty) than a Standard location at Alert 7 (+1 to all rolls, +2 Stealth). After the Limit, Silk Clutch, Loud Failures, Botches and spiders going Out cost nothing.
- *Fix:* "Full Alert always applies the Lockdown penalty (all rolls +1 Difficulty), whatever the Limit." Optionally add "each further Alert rise at Full Alert is a Complication the ST applies immediately."

**R-7 · confusing · undefined — past the Limit**
- *Book:* nothing on whether the Alert keeps climbing past the Limit. Nothing on whether a Critical at Full Alert (Alert −1) drops the location back below the Limit and makes the objective reachable again.
- *Fix:* "The Alert stops at its Limit. Full Alert can't be undone."

**R-8 · minor · balance feel — Silk Clutch on a Partial, and at Full Alert**
- *Book:* Ch 8: "After a failed roll, spend 3 SP to succeed anyway. The Alert rises by 1."
- *Unclear:* whether a Partial counts as "failed". At Full Alert the cost disappears (Drill R4).
- *Fix:* "After a Failure or Partial…". Pair this with R-6's fix.

**R-9 · minor · undefined — "incomplete loot"**
- *Book:* Ch 11 Partial Success: "or with incomplete loot". There is no guidance on when a damaged prize counts as incomplete.
- *Fix:* "Loot is incomplete only if part of the objective is left behind or destroyed. Complications that damage it should be announced as such."

**R-10 · confusing · undefined — "scene"**
- *Where:* every "once per scene" ability: Phase Through, Fast Talk, Plausible Deniability, Everything Connects, Did You See That Jump?!
- *Book:* "scene" is never defined. Ch 10 Recovery uses "once per obstacle". The heist structure uses "obstacle".
- *Fix:* "A scene is one obstacle (heist or escape). Planning is its own scene."

**R-11 · minor · undefined — free actions on the ST's turn**
- *Where:* O4 R1. Fast Talk was used when C appeared, which happened during the threat phase.
- *Book:* Ch 3: "The crew takes its turns first… then the ST runs the threats". Free actions are defined only as not costing your Action.
- *Fix:* "Free actions and 'when X happens' Perks may be used on the ST's turn."

**R-12 · minor · unclear wording — Action economy for rolled movement and for Assists in per-obstacle rolls**
- *Book:* Ch 3: "An Action is the thing you roll for". So a squeeze roll (Ch 3) eats the Action, but Ch 3 lists it under movement. If a crossing is resolved with one roll per spider (R-1), can a spider both Assist and make their own roll?
- *Fix:* "A squeeze or climb roll is part of movement, not your Action."

**R-13 · confusing · contradiction — two ways to resolve one broom**
- *Where:* E1 R3 and Drill R4.
- *Book:* Ch 15: "Human With Broom Athletics (3)", so the spider rolls to avoid. Ch 10: "roll BODY + Endurance against the threat's attack", so the attacker rolls. There is no "dodge" in Ch 10, and the broom has no attack pool (H-2).
- *Effect:* a Partial dodge followed by a Taking Hits roll means two rolls for one swing.
- *Fix:* "Against a Ch 15 hazard, a Failed avoidance roll is a hit. Roll Taking Hits against successes equal to the hazard's Difficulty." Or pick one model.

**R-14 · confusing · undefined — what a human seeing a spider (or loot) is worth**
- *Where:* E1. Pebbles was spotted, and the notebook was seen in the corridor.
- *Book:* Ch 9 lists "Spotted briefly +1" and "A confirmed alert +2 — an NPC knows something is happening". A human seeing *a spider* in a restaurant doesn't know a heist is happening. Can one failed roll trigger both "fail with consequence" and "spotted"?
- *Fix:* "One roll or event raises the Alert by its single largest applicable trigger. A human seeing a spider is 'spotted briefly'. Seeing moved loot or two spiders together is 'confirmed'."

**R-15 · minor · unclear wording — That's Not What Happened on a crew Failure**
- *Where:* E1 R1.
- *Book:* "You don't change the mechanical result… It also cancels any Alert increase that roll would have caused." It doesn't say what the failure's consequence becomes once the Alert rise is cancelled. The ST had to invent one (C fetches a broom).
- *Fix:* Add "The ST may still apply a non-Alert consequence."

**R-16 · minor · balance feel — Criticals wasted at 0; Soundless removes crit value**
- *Where:* O1 (Jar Lid J crit at D1 from Soundless), O2 (Jar Lid C crit at Alert 0).
- *Book:* "the Alert drops by 1 (only on a roll of Difficulty 2 or higher)". *Soundless*: "Reduce the Difficulty of Stealth rolls made while moving by 1."
- *Fix:* Check the Critical Difficulty *before* Perk reductions. Optionally, "a Critical at Alert 0 banks one 'free' −1 for later this heist."

**R-17 · confusing · balance feel — Alert suppression stacks on a Face-heavy crew**
- *Where:* E1. *Plausible Deniability*, *That's Not What Happened* and Damage Control removed 3 of the 4 Alert points the escape would have caused. The Hard location never reached Stirring.
- *Book:* Ch 5 Face perks. Ch 8 Damage Control. There is no crew-wide cap.
- *Fix:* Consider "*That's Not What Happened* and *Plausible Deniability* can't both be used in the same round", or make PD once per heist.

**R-18 · minor · undefined — human Alert contribution**
- *Book:* The House Cat adds "+1 per round while active". Humans (H-2) add nothing, so a staffer actively hunting with a broom creates no Alert pressure.
- *Fix:* Covered by the H-2 stat block (+1 per round while searching).

**R-19 · minor · unclear wording — *Actually, I Planned This***
- *Book:* "The crew gets +1 die on their next roll". Does every spider get +1 on their next roll, or does only the crew's next single roll get it?
- *Fix:* "+1 die on each crew member's next roll this round."

**R-20 · minor · unclear wording — AP per spider?**
- *Book:* Ch 11: "Full AP for the difficulty: … Hard 5". It isn't stated whether that is per spider or shared.
- *Fix:* "Each surviving spider (and each Waiting Web replacement) earns…"

**R-21 · minor · unclear wording — Improvise's Attribute**
- *Where:* O3. Cassette swapped Persuasion for Tactics: GRACE + Tactics (5) or WIT + Tactics (6)?
- *Book:* "Swap the called-for Skill for one of yours".
- *Fix:* "…use the new Skill's own Attribute."

**R-22 · minor · unclear wording — SP Reroll "keep the better result"**
- *Book:* "reroll up to 3 dice and keep the better result". Better per die, or the better of the two whole results?
- *Fix:* "Each rerolled die keeps its higher face."

**R-23 · minor · undefined — no clock**
- *Where:* E1. The crew could simply wait for the unpredictable staff to wander off. Heist 5's "dinner service ran late" suggests time pressure, but nothing enforces it.
- *Fix:* An optional **clock** line for each heist, for example "the staff lock up in 12 rounds; at 0, the back door locks."

**R-24 · minor · process friction — the Mid-Heist Complication table is house-only and has no mechanics**
- *Where:* O2, the roll of 5 "phone lit up". Entries 1, 3 and 4 (cat, human up for water, vacuum) don't exist in a restaurant. There is no guidance on when to roll or what "briefly, brightly visible" does.
- *Fix:* "Roll when the crew stalls or once per heist. On an entry that doesn't fit the location, use the nearest equivalent." Add effects, for example "5: Stealth +1 Difficulty this round."

**R-25 · minor · unclear wording — describe or announce the Alert?**
- *Book:* Ch 17: "the moment it hits 5 and the cat gets up, say so". Ch 18 *Keep It Visible*: "When it moves, say so, out loud". Ch 18 *Describe the Thresholds*: "Not 'the Alert hit 5' — 'the cat opens its eyes.'"
- *Fix:* "Move the tracker and describe the effect; don't announce the number."

**R-26 · minor · unclear wording — Damage Control payment**
- *Book:* "The crew spends 3 SP together". Any split, or 1 SP each from three spiders?
- *Fix:* "…3 SP in total, from any crew members."

**R-27 · confusing · design — creature escalations keyed to 7 never fire at Hard and below**
- *Book:* House Cat "Alert 7, hunting". Sleeping Human "at 7 they're up". Parrot "Alert 7, shrieks". Corn Snake "Alert 7, out of the tank". Child "Shouting for a parent: automatic at Alert 7+". Exterminator "only appears once the Alert has reached Lockdown (7+)".
- *Effect:* Heist 4 (Hard, library cat) and Heist 5 can never show these behaviours. This is a knock-on of REVIEW ruling 30.
- *Fix:* Express escalations in **bands** (Stirring, Active, Lockdown-or-Full-Alert) rather than numbers: "the band below the Limit" or "at Full Alert".

### E. Things that worked well
- **The core pool reads instantly.** Attribute + Skill, count 4+, compare to a single Difficulty. Every roll above took seconds.
- **Assists** are meaningful and cheap to adjudicate. The Skill-only, maximum-3 cap stops them dominating.
- **Read the Room → the Rat wants the trap gone → the escape pays it off.** This is one Face Perk, and it produced the whole session's through-line.
- **Allergic to Dust triggering the unknown obstacle.** A Flaw moment, SP earned, and a fair reason for the staffer to wake all came from one roll. Flaws surfacing at "the worst available time" works.
- **Critical bonuses** ("spot a second way out") gave useful fiction without any extra rules.
- **Crew-then-threats turn order** was simple and never needed tracking.
- **Damage Control's timing** ("Call it the moment the spike triggers, before it's added") is clear and was easy to run.
- **Improvise** (REVIEW ruling 26) made the Overconfident Ghost's forced negotiation playable instead of hopeless.
- **The Ch 9 Storyteller note** on Active vs Lockdown is clear. The problem is only what happens when the Limit sits *below* those bands (R-6, R-27).
- **Web Structure (2 SP)** as a "catch the notebook quietly" net is a great example of a Silk spend that solves a problem creatively.

### F. Not exercised (for the next playtest)
Nobody went Out, so the Waiting Web and its "enter at the start of the next obstacle" timing weren't tested. Neither were
Vitality penalties, the Botch, Not Part of the Plan, Ghost Protocol or Silk Trail. The Orb Weavers' *Everything Connects*
wasn't used either, because Cassette and Pebbles always had a better Action.

---

## Appendix — raw dice log (in roll order)
`NdS: faces => successes (4+)`. The name rolls were 2d6 **sums** (the "succ" count on those rows means nothing). DRILL
rows belong to §4. `B-O3` rows are a side check of the Rat in an opposed Stealth roll, made to confirm R-3: one Rat
Perception roll of 1 success against five spiders who scored 3, 3, 2, 4 and 2. The book doesn't say whether that single
NPC roll is legitimate.

```
P1 name 2d6 [3 3] · species 1d6 [1] · role 1d6 [2] · flaw 1d10 [2]
P2 name 2d6 [5 2] · species [4] · role [1] · flaw [5]
P3 name 2d6 [3 3] · species [4] · role [1] · flaw [2]
P4 name 2d6 [4 6] · species [2] · role [2] · flaw [2]
P5 name 2d6 [1 2] · species [2] · role [1] · flaw [3]
Casing JarLidJ WIT2+Perc2 [4d6]: 5 6 1 6 => 3 succ
Casing Architect WIT3+Perc2 [5d6]: 6 1 4 6 6 => 4 succ
Casing JarLidC WIT2+Perc1 [3d6]: 3 4 6 => 2 succ
Casing Cassette WIT4+Perc3 [7d6]: 5 1 1 6 2 2 6 => 3 succ
Casing Pebbles WIT4+Tac1 [5d6]: 1 4 6 2 5 => 3 succ
Entry vent-grille Pebbles NERVE3+Stealth0 D1 [3d6]: 1 5 3 => 1 succ
O1 Assist JarLidC Stealth3 -> Pebbles [3d6]: 1 2 4 => 1 succ
O1 Stealth JarLidJ 6 D1(Soundless) [6d6]: 4 5 3 5 4 2 => 4 succ
O1 Stealth Architect 5 D2 [5d6]: 5 3 2 4 4 => 3 succ
O1 Stealth JarLidC 6 D2 [6d6]: 1 3 3 6 5 6 => 3 succ
O1 Stealth Cassette 6 D2 [6d6]: 1 3 6 6 4 1 => 3 succ
O1 Stealth Pebbles 3+1assist D2 [4d6]: 2 4 2 4 => 2 succ
O2 Mid-Heist Complication table Ch20 [1d6]: 5
O2 StaffA where [1d6]: 1 · StaffB [1d6]: 5
O2 phone-lit Stealth Architect 5 D2 [5d6]: 1 1 6 2 5 => 2 succ
O2 phone-lit Stealth JarLidC 6 D2 [6d6]: 4 4 1 5 2 6 => 4 succ
O3 Assist Architect Persuasion3 -> Cassette [3d6]: 5 4 4 => 3 succ
O3 Negotiation Cassette WIT4+Tactics2(Improvise)+3assist+2offer [11d6]: 3 1 2 2 2 2 2 6 4 1 3 => 2 succ
O3 Rat Haggle(Persuasion)4 [4d6]: 5 3 4 3 => 2 succ (+1 Improvise ruling = 3)
O3 Cassette SP Reroll (2 SP) 3 failed dice [3d6]: 4 4 5 => 3 succ  (total 5)
O4 Squeeze Cassette GRACE3+Acro3 D2 [6d6]: 6 4 1 1 5 5 => 4 succ   (resolved in R1)
O4 Assist Cassette Athletics1 -> Pebbles [1d6]: 3 => 0 succ
O4 StaffA [1d6]: 4 · StaffB [1d6]: 2
O4 Shove sticky door Pebbles BODY3+Ath2 D3 [5d6]: 4 2 3 1 1 => 1 succ
O4 Sneeze (Allergic to Dust) Architect Stealth NERVE3+St2 D3 [5d6]: 1 1 6 2 6 => 2 succ
O4 R1 Assist Architect Athletics0(min1) -> JarLidJ [1d6]: 1 => 0 succ
O4 R1 Push notebook onto net JarLidJ BODY3+Ath2 D2 [5d6]: 3 1 2 3 4 => 1 succ
O4 R1 StaffA [1d6]: 4 · StaffB [1d6]: 1
O4 R2 Assist JarLidJ Athletics2 -> Pebbles [2d6]: 6 4 => 2 succ
O4 R2 Drag notebook Pebbles BODY3+Ath2 D3 [5d6]: 6 5 1 1 1 => 2 succ  + assist dice [2d6]: 2 5 => 1  (total 3)
O4 R2 Assist Cassette Deception0(min1) -> Architect [1d6]: 6 => 1 succ
O4 R2 Deception Architect NERVE3+Dec3 D4 [6d6]: 4 1 5 3 5 6 => 4 succ  + assist die [1d6]: 6 => 1  (total 5)
O4 R2 StaffA [1d6]: 3 · StaffB [1d6]: 4 · StaffC [1d6]: 4
E1 R1 Stealth JarLidJ (Overconfident, open) D4 [6d6]: 6 6 1 5 1 2 => 3 succ
E1 R1 Stealth Pebbles (cover) D2 [3d6]: 2 2 1 => 0 succ
E1 R1 StaffA [1d6]: 1 · StaffB [1d6]: 1
E1 R2 Assist JarLidC Eng0(min1) -> Architect [1d6]: 2 => 0 succ
E1 R2 Jam snap trap Architect WIT3+Eng1 D3 [4d6]: 4 5 4 6 => 4 succ
E1 R2 StaffA [1d6]: 2 · StaffB [1d6]: 4
E1 R3 Assist JarLidJ Intim0(min1) -> Pebbles [1d6]: 5 => 1 succ
E1 R3 Intimidate staffer C Pebbles NERVE3+Int2+1+1 D4 [7d6]: 3 1 4 5 5 3 6 => 4 succ
E1 R3 StaffB [1d6]: 6
E1 R3 Broom dodge Pebbles BODY3+Ath2 D3 [5d6]: 1 6 2 5 5 => 3 succ
E2 R4 Assist Pebbles Ath2 -> JarLidJ [2d6]: 6 3 => 1 succ
E2 R4 Lower notebook JarLidJ BODY3+Ath2 D2 [5d6]: 4 6 3 4 2 => 3 succ  + assist die [1d6]: 2 => 0
E2 R4 Deception JarLidC D4 [6d6]: 4 6 6 4 4 3 => 5 succ
B-O3 Rat Perception3 [3d6]: 6 1 2 => 1 succ
B-O3 Stealth JarLidJ [6d6]: 5 6 2 2 1 4 => 3 · Architect [5d6]: 5 6 1 2 4 => 3 · JarLidC [6d6]: 4 6 3 3 3 2 => 2 · Cassette [6d6]: 2 2 4 4 5 6 => 4 · Pebbles [3d6]: 1 6 4 => 2
DRILL R3 Assist JarLidJ Intim0(min1) [1d6]: 4 => 1 succ
DRILL R3 Intimidate C Pebbles D4 [7d6]: 1 6 6 4 2 5 1 => 4 succ
DRILL R3 Broom dodge Pebbles D3 [5d6]: 5 2 4 5 2 => 3 succ
DRILL R3 Stealth Cassette D5 [6d6]: 2 6 5 2 2 2 => 2 succ
DRILL R3 Stealth JarLidJ D5 [6d6]: 6 3 1 5 1 6 => 3 succ
DRILL R4 Deception JarLidC D4 [6d6]: 2 6 2 1 6 4 => 3 succ
DRILL R4 Lower notebook Cassette BODY2+Ath1 D2 [3d6]: 2 2 5 => 1 succ
DRILL R4 Broom dodge JarLidJ D3 [5d6]: 3 3 3 4 6 => 2 succ
DRILL R4 Broom swat Pebbles dodge D3 [5d6]: 5 3 1 1 5 => 2 succ
DRILL R4 Broom attack (ruled pool 3) [3d6]: 5 3 5 => 2 succ
DRILL R4 Pebbles shrug BODY3+End2 [5d6]: 6 5 5 2 5 => 4 succ
DRILL R5 Haul notebook into drain Pebbles D3 [5d6]: 2 1 1 2 5 => 1 succ
```
