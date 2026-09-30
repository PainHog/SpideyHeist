# Verification playtest — v4.7 (Heist 3 in full, Heist 4 through the Escape, two drills)

- **Source of truth:** `book/src/chapters/*.html` at v4.7 (rulings in `book/REVIEW.md` Parts C–F). Nothing in the book, module, packs or sim was edited.
- **Purpose:** confirm the v4.6/v4.7 fixes work at the table, and find anything still broken or newly introduced.
- **Dice:** every roll is real (`crypto.randomInt`, scratch script `r.mjs`), **Success = 5 or 6**. All 118 rolls are in the Appendix, in order. No result was invented or changed. The one d8 (Butterfingers) and the d10s (Flaws) are creation/Flaw rolls; see N19.
- **Seats:** one Storyteller (ST) and five players, all run by the tester, process-first.
- **Method:**
  - **Heist 3 — The Pet Store Problem** (Standard, Limit 8): all five phases, Ch 19 map and table. Never playtested before.
  - **Heist 4 — The Library Job** (Hard, Limit 6): Casing, Preparations, the heist and the Escape; Debrief in one line.
  - **Drill 1** (Heist 4, entering by A instead of B) and **Drill 2** (Heist 3, escaping by the book's E1 route instead of the crew's): clearly labelled forks with fresh real rolls, to reach rules the main lines never triggered — the guard fight, the Mid-Heist clock, Full Alert, capture, the Waiting Web, falls and the human swat.
- **Headline:**
  - **Heist 3:** Full Success, peak Alert **6/8**. The crew had to burn *Not Part of the Plan* and *That's Not What Happened* to stay out of Alert 7, because in this store Alert 7 = Full Alert: the parrot shrieks for +2 (N4).
  - **Heist 4:** Full Success, peak Alert **5/6**. The library cat woke at 3 and then added +1 every round everywhere (N11), so every round was a clock tick. Entry B skips the guard entirely (N8).
  - **Drill 1:** entering past the guard went from **0 to Full Alert in 3 rounds**. Fighting the guard gains nothing: the backup keeps adding +1 (N12). The crew still escaped Full Alert by stacking *Make a Scene* with Silk dice.
  - **Drill 2:** a Full Alert Escape at Standard caught **2 of 5** spiders on a watched squeeze. Being caught in the last obstacle cost the players nothing (N13).
  - **Fixes:** group checks, opposed rolls, the +2 bonus cap, the Casing cap, Clutch-on-Failure and rerolls all worked cleanly. The main new problems are in the Chapter 19 content and in how "active" creatures keep counting.

---

## 1. Characters (Ch 7; Ch 20 tables)

Three spiders were fully random (name 2d6, species 1d6, Role 1d6, Attributes 1d6, Skills Quick Pick, Perks 1d6×2, Flaw 1d10). A fourth was also fully random and hit the duplicate rule. The fifth was hand-built by Ch 7's steps, to check that path too.

| # | Rolls | Result |
|---|---|---|
| P1 | name 3+2=**5**, species **6**, Role **1**, Attr **1**, Perks **6, 5**, Flaw **4** | **Crinkle** — Crab · Face · 4·2·2·2 · Familiar Face, Actually I Planned This · Dramatic |
| P2 | name 5+5=**10**, species **1**, Role **2**, Attr **3**, Perks **3, 2**, Flaw **2** | **Cassette** — Jumping · Ghost · 4·3·2·1 · Soundless, Dead Drop · Overconfident |
| P3 | name 3+4=**7**, species **4**, Role **5**, Attr **5**, Perks **4, 3**, Flaw **8** | **The Architect** — Cellar · Lookout · 5·2·2·1 · Contingency, Pattern Recognition · Fear of Vacuums |
| P4 | name 3+4=**7** (dup) → reroll 3+5=**8**, species **1**, Role **3**, Attr **3**, Perks **3, 2**, Flaw **7** | **Filament** — Jumping · Tinkerer · 4·3·2·1 · Overclock, Spider-Sense… Sort Of · Butterfingers |
| P5 | chosen | **Pebbles** — Wolf · Bruiser · hand-built · Take the Hit, That All You Got? · Allergic to Dust |

The duplicate rule ("Roll again, or keep it") handled the second "The Architect" in one line. P4 also duplicated P2's species (Jumping). The rule doesn't cover species, which is fine: two Jumping Spiders is no problem.

**Sheets** (Attributes are final, including the species bonus; pool = Attribute + Skill; SP = WIT + NERVE + 1, placed points only).

- **Crinkle** — Crab Spider Face · Speed 4 · **SP 7** · Vitality Unharmed
  - Attributes: BODY 2 · WIT 2 · NERVE 4→**5** · GRACE 2→**3** (4 placed on NERVE, Deception's Attribute).
  - Skills (Quick Pick): Deception 3 (8) · Persuasion 3 (6) · Stealth 3 (8) · Perception 2 (4) · Disguise 2 (5) · Intimidation 2 (7).
  - Species: *Wait, Was That There Before?* · Signature: *That's Not What Happened*.
- **Cassette** — Jumping Spider Ghost · Speed 6 · **SP 7**
  - Attributes: BODY 1→**2** · WIT 2 · NERVE **4** · GRACE 3→**4**.
  - Skills: Stealth 3 (7) · Acrobatics 3 (7) · Perception 3 (5) · Athletics 2 (4) · Deception 2 (6) · Engineering 2 (4).
  - Species: *Did You See That Jump?!* · Signature: *Phase Through*.
- **The Architect** — Cellar Spider Lookout · Speed 5 · **SP 8**
  - Attributes: BODY 2 · WIT **5** · NERVE 2 · GRACE 1→**3**.
  - Skills: Perception 3 (8) · Tactics 3 (8) · Stealth 3 (5) · Acrobatics 2 (5) · Engineering 2 (7) · Deception 2 (4).
  - Species: *Contortionist* · Signature: *I Called It*.
- **Filament** — Jumping Spider Tinkerer · Speed 6 · **SP 8**
  - Attributes: BODY 1→**2** · WIT **4** · NERVE 3 · GRACE 2→**3**.
  - Skills: Engineering 3 (7) · Perception 3 (7) · Stealth 3 (6) · Acrobatics 2 (5) · Tactics 2 (6) · Athletics 2 (4).
  - Species: *Did You See That Jump?!* · Signature: *I Made a Thing*.
- **Pebbles** — Wolf Spider Bruiser · Speed 7 · **SP 6**
  - Attributes: BODY 3→**5** · WIT 2 · NERVE 3 · GRACE 2.
  - Skills (Role +3 as Brawl +1, Endurance +2; then 12 own): Brawl 3 (8) · Endurance 3 (8) · Athletics 3 (8) · Stealth 2 (5) · Intimidation 2 (5) · Perception 1 (3) · Tactics 1 (3).
  - Species: *Run It Again* · Signature: *Make a Scene*.

**Creation notes**
- The Attributes table + Quick Pick produced a legal spider in about two minutes each. Every total checked out: 10 Attribute points, 12 + 3 skill points, max 3.
- "First number on your Role's Attribute" plus SP = WIT + NERVE + 1 means a Face, Ghost or Grifter who puts the 4 on NERVE rather than GRACE gets +2 SP. Nobody would do otherwise. That's fine.
- The Quick Pick gives **Endurance 0 to six of the seven Roles** (not the Wheelman), so four of five spiders shrug hits with 2 dice (N23).
- **After Heist 3** (3 AP each):
  - Crinkle: Persuasion 4, Endurance 1, Perception 3.
  - Cassette: WIT 3, Endurance 1.
  - Architect: NERVE 3, Endurance 1.
  - Filament: new Perk *I See How This Works*.
  - Pebbles: Stealth 3, Acrobatics 1, **1 AP banked**.
- **Heist 4 starting SP:** Crinkle 7, Cassette 8, Architect 9, Filament 8, Pebbles 6.

---

## 2. Play log — Heist 3, The Pet Store Problem (Standard, Limit 8)

**Map read as the ST** (16×12; columns 0–15, rows 0–11):
- **Stockroom:** rows 1–2, rough ground, entry **A** (gap) at (4,0), doorway at (8–9,3).
- **Shop floor:**
  - Shelves (6 tall) at columns 3, 7 and 11, rows 5–7.
  - Snake tank at (12–13, 6–7).
  - Back shelf at (11–13, 8) and counter at (11, 9–10).
  - Feeder bin at (13,10); the only floor approach is (14,8).
  - Parrot at (3,9); entry **B** (gap) at (4,11).
  - The cage cover is on the shelf end at (3,7); the crackers are on the counter at (11,10).

Alert thresholds: 3–4 Stirring (Stealth +1) · 5–6 Active · 7 Lockdown · 8 Full Alert.

| Step | Rule (Ch) | Dice | Result | Alert |
|---|---|---|---|---|
| **Score** | Ch 11/17: map shown minus the dashed unknown | — | The caption and map already show the narrow bin approach, the cage cover and the crackers (N7) | 0 |
| Casing ×5 | Ch 11 Casing, **cap** | Crinkle 4d → 2 · Cassette 5d → 1 · Architect 8d → 3 · Filament 7d → 3 · Pebbles 3d → 0 | **9 Successes, 5 items held**: all 5 revealed, 4 wasted (the cap works; see N22) | 0 |
| Familiar Face | Ch 5 (never the unknown) | — | The ST gives a detail beyond the list: the cashier talks to the crickets, so they're used to voices | 0 |
| Preparations | Ch 11 (one each; Perk grants free) | — | **Cassette:** Planning Silk Line on the shelf tops for E1 (−1); complication: a price gun sits by the anchor. **Dead Drop** (free, no complication): a bread crumb behind the counter. **Filament:** stashes a paperclip lever by the tank; complication: the snake is coiled on that side. **Architect:** Contingency (free) — "if the snake noses the lid, the lid roll is a Success". Crinkle and Pebbles pass | 0 |
| O1 R1 — hush | Ch 19 H3 #1 · Persuasion (2) | Architect (Cellar, squeezes free) 3d: 5 1 1 → 1 | **Partial**: hushed, default noise +1 | |
| O1 R1 — squeeze | **Group check** Acrobatics (2), "watched" | Crinkle 1 · Cassette 1 · Filament 2 · Pebbles 0 | P · P · S · **F**. The round raises the Alert **once**, by the worst (+1) | **2** |
| | Ch 8 **Reroll** (2 SP) | Pebbles rerolls both misses: 3 2 | Still a Failure (Pebbles SP 4) | 2 |
| O1 R2 | Retry; **Assist** (Ch 2, the helper's own Skill) | Filament assist Acrobatics 2d: 2 2 → 0 · Pebbles 2d: 2 2 → 0 | Failure +1 → **Stirring**: tongue flicks, parrot mutters | 3 |
| | **Silk Clutch** (Failure only) | — | Pebbles Clutches (3 SP → 1): Success, "Alert +1". The Failure's +1 and the Clutch's +1 are one event, so Alert stays 3. Obstacle 1 done: 2 rolls | 3 |
| O2 R1 | H3 #2 **Opposed** (snake Perception 3); Stirring +1 | Snake 3d: 6 6 2 → 2 → D3 + 1 = **D4** · Filament 6 + 1 SP die: 6 6 6 5 1 6 2 → 5 | Success: in position by the tank unseen | |
| | Ch 9 +X (snake "active from the start") | — | End of round: +1 | 4 |
| O2 R2 | Weakness: shut the lid, Engineering (4); **+2 bonus cap** | *I Called It* (+2, genuinely plausible — he watched it with *Pattern Recognition*). Cassette's Assist would be wasted under the cap, so she doesn't. *Overclock* +2 (Silk, exempt). 11d → 4 | Success (not a Critical, which needs 8). Lid shut. **2 rolls = obstacle cleared** | |
| | +X after clearing by Weakness? | — | **[RULING]** The crew spent this round at the snake's obstacle, so +1 (N3) → **Active** | 5 |
| O3 (parrot) | — | — | **Not met**: from A the counter and back shelf block the parrot's sight of the bin route (N6). Strict Ch 9: it adds +X only at its own obstacle | 5 |
| O4 (unknown) — 47 crickets | H3 #4 Persuasion/Deception (3) | Architect assist Deception 2d: 1 1 → 0 · Crinkle Deception 8d → 4 | Success (roll 1 of 2) | |
| | Flaw **Dramatic** (Ch 7) | — | The ST fires it: Crinkle's speech becomes a production, +1. Flaw Moment +1 SP (Crinkle 8) | 6 |
| O4 R2 | Persuasion (3), crumb gift +1 die (counts toward the cap) | 7d: 6 1 2 1 2 4 5 → 2 | **Partial** → default +1 would make 7. At Limit 8, **7 means the parrot shrieks (+2) = Full Alert** (N4) | |
| | **Not Part of the Plan** (4 SP, crew once/heist) | — | Crinkle negates the Partial's complication (SP 4). **[RULING]** allowed — a Partial's complication is "a complication the ST just introduced". The cricket is pushed forward: **objective taken** (Prize) | 6 |
| **Escape** — route choice | Ch 11 "the route is negotiable" | — | The crew won't pass the tank again: the snake is still "active" at E1 (N3), and one more +1 → 7 → shriek → Full Alert. So they go **over the counter and out by B**. The ST reframes E1 as "past the parrot". The Prize is carried by two at full Speed (Pebbles + Filament, Speed 6) | 6 |
| E1′ R1 | Picking up takes an Action (Ch 12) | — | Cassette climbs the counter (3 up) and takes a cracker. The rest keep behind the counter (cover); no noise, so the parrot has nothing to repeat | 6 |
| E1′ R2 | Jump (species, once/scene) + cracker Persuasion (1) | Cassette 4d: 5 2 4 2 → 1 | Leaps 6 squares off the counter; Success: the parrot is busy with the cracker | 6 |
| E2 R1 | H3 E2 calm the cricket, Persuasion (2) | Crinkle 6d → 3 | Success. **[RULING]** The live cricket hops through the gap itself — otherwise a Prize can't leave by any exit (N5) | |
| | Flaw **Allergic to Dust**: Stealth (3) +1 Stirring (still on at Active) | Pebbles 5d: 4 4 1 4 1 → 0 | Failure → +1 → 7 → shriek → Full Alert… | (7) |
| | ***That's Not What Happened*** (2 SP) | — | Crinkle: "that was the parrot doing a sneeze". It cancels the roll's Alert rise (SP 2). Pebbles +1 SP (Flaw Moment) | 6 |
| Exit | Squeeze only under pressure (Ch 3) | — | Nothing watching or closing in: everyone squeezes out, no roll | 6 |
| **Debrief** | Ch 11 | — | **Full Success, 3 AP each** (per spider). **SP spent 13 of 36** (+2 earned). Cassette and the Architect spent **0** | — |

---

## 3. Play log — Heist 4, The Library Job (Hard, Limit 6)

**Map read as the ST:**
- **Ground floor:**
  - Entries: A, the return slot at (7,6); B, the staff-door gap at (15,5).
  - Guard G at (2,5), web in the SW corner.
  - Circulation desk at (5–8,4); dumbwaiter at (9,4); stairs at (1–2,1–2) and (13–14,1–2).
- **Second floor:**
  - Centre aisle on row 2; cat on the west landing at (3,1).
  - Reference-room door at (7,3); case at (3–5,5); dumbwaiter at (9,4) inside the reference room.

Thresholds at Limit 6: 3–4 Stirring · 5 Active · **6 Full Alert** (with the Lockdown penalties).

| Step | Rule (Ch) | Dice | Result | Alert |
|---|---|---|---|---|
| Casing ×5 | Cap | 5d → 1 · 5d → 3 · Architect Tactics 8d → 3 · 7d → 3 · 3d → 0 | **10 Successes, 4 items**: all revealed, 6 wasted (N22) | 0 |
| Preparations | Ch 11 | — | **Architect:** Planning Silk Line on the glass case (complication: the anchor is on a dusted smudge; it holds one climb) + Contingency (free): "if the librarian comes onto our floor while we're by the case, the roll to stay hidden is a Success". **Cassette:** Planning line in the dumbwaiter shaft (the pulley squeaks) + Dead Drop: a shiny bottle cap by the east stairs (the cat's Weakness). **Filament:** a paperclip pick stashed by the case (a moth sleeps on it). **Entry B** (free) | 0 |
| Entry | Squeeze, nobody watching (Ch 3) | — | Under the staff door, no roll. **Obstacle 1 (guard) never engages**: B is 13 squares from G, and its Senses reach 6 (N8) | 0 |
| O2 start | H4 librarian: 1d6 as each obstacle begins | **1** | Ground floor, walking row 3, right where the crew is. The obstacle happens here, not at the ② on the second floor (N10) | 0 |
| O2 R1 — job | Alert Human Deception (4) (Ch 15/16: *you* roll against its row) | Architect assist 2d: 3 5 → +1 · Crinkle 8+1d → 4 | Success: a "dropped book" to the west, and she turns | |
| O2 R1 — position | **Group check** Stealth vs the distracted human (**[RULING]**: she's looking away, so Distracted Human, 1). Cassette D0 with *Soundless* | Architect 3 · Filament 3 · Pebbles 3 | Three **Criticals at D1**: no Alert change (D3+ only). A better-than-planned result: they spot the gap in the guard's sightline by the slot | 0 |
| end R1 | Librarian 1d6 | **2** | Still ground floor | 0 |
| O2 R2 | Crinkle (Speed 4) crosses late: Stealth (4) | 8d → 2 | **Partial**: glimpsed = "spotted" +1 (one event, one trigger) | 1 |
| end R2 / O3 start | Librarian 1d6 ×2 | **6**, then **6** | Third floor, off the map. The two back-to-back rolls are procedural friction (N10) | 1 |
| O3 R1 — position | Glass case = Slippery Surface Acrobatics (2), −1 Planning line | Filament 5d → 2 | Success (a Critical, but D1). *I See How This Works*: "does it need two things turned at once?" "Yes." | 1 |
| end R1 | Librarian 1d6 | **5** | Third floor | 1 |
| O3 R2 — job | Engineering (4), **key lock** (no Bypass); cap +2 | Architect assist Eng 2d → 0 · pick +1 · *Overclock* +2 · 1 SP die: 11d → 3 | **Partial**: the case opens, the pick clinks (+1). Filament SP 6 | 2 |
| end R2 / O4 start | Librarian ×2 | **2**, then **1** | Ground floor | 2 |
| O4 R1 (unknown: rival crew steps out) | **Opposed**: their Face, 5 dice | Rival 5d → 2 → D3 · Crinkle Persuasion 7 + *I Called It* +1: 8d → 5 | Success (roll 1) | 2 |
| end R1 | Librarian 1d6 | **3** | **Second floor**, walking the aisle outside the reference room | 2 |
| O4 R2 | Opposed | Rival 5d → 2 → D3 · Crinkle 7d → 1 | Failure | |
| | **Reroll** (2 SP), Successes stay | 3 misses: 4 6 1 → +1 = 2 | **Partial** now, so it's no longer Clutchable (N24). Default +1 → **Stirring**. The **cat's ears rotate**: active and, "a cat once awake", roaming (N11). Rivals recruited: they back off for a favour owed | 3 |
| | Ch 9 +X (cat) | — | End of round: +1 | 4 |
| **E1** | Dumbwaiter Engineering (3), −1 Planning line | Filament 7d → 4 | **Critical at final D2**: no Alert drop ("after every modifier" — the Preparation cost the drop). Smooth ride. The Contingency fired on the way to the dumbwaiter (the librarian passed the doorway): that Stealth roll = a Success. Book loaded; Treasure = two at half Speed or a sled — the dumbwaiter carries it | |
| | Cat +1 | — | **Active**: the cat moves toward the sound | 5 |
| end E1 / E2 start | Librarian ×2 | **3**, then **5** | Third floor | 5 |
| E2 | Flaw **Butterfingers** | d8 (N19) → **1** (north) | The book lands on the circulation desk (height 3). Pebbles lowers it on a silk tie-off (his Action). **[RULING]** one Action for a two-carrier item (N20). Filament +1 SP | 5 |
| | Feed the book out the return slot, Engineering (3) | Filament 7 + *Overclock* 2: 9d → 3 | Success. The crew follows it out; the guard, 5 squares away, never engages | 5 |
| **Debrief** | | | **Full Success, 5 AP each**. **SP spent 5 of 38** (+1 earned). Heist 1 (the guard) was skipped entirely | — |

---

## 4. Drills (forks with fresh real rolls; not canon)

### Drill 1 — Heist 4 entered by A, past the guard (from Alert 0, H4 starting sheets)

| Step | Rule | Dice | Result | Alert |
|---|---|---|---|---|
| R1 | Group Stealth, **opposed** (guard Perception 4) | Guard 4d → 0 → D1. Crinkle 3 · Architect 3 · Filament 1 · **Pebbles 0** · Cassette D0 | Pebbles fails and is spotted: **+1, not +2** (one event); the guard is aware | 1 |
| R2 | Fight: Brawl, opposed (guard Brawl 3). Fights are loud (Ch 16) | Guard 3d → 0 → D1 · Pebbles 8d → 3 | Lands (Critical at D1, no drop): +1. End of round: guard +1 → **3**. The cat's ears rotate and it roams | 3 |
| R3 start | **Mid-Heist Complication** (third round at one obstacle, Ch 17/20) | 1d6 → **2** | "One detail they didn't case". Casing had already taken all 4 items, so the ST had to invent one (a spare key ring in the desk drawer) | 3 |
| R3 | Brawl, opposed | Guard 3d → 1 → D2 · Pebbles 8d → 1 | **Partial**: lands (+1 fight noise). **[RULING]** The Partial's cost is swapped to "a hit from an engaged threat": guard Brawl 3d → 1 vs Pebbles' shrug BODY + End 8d → 2, shrugged. **Two rolls: guard driven off** ("no +X there") — but "a beaten guard calls for backup: a fresh one, already aware, takes its post" | 4 |
| end R3 | Backup guard +1, cat +1 | — | **Full Alert** at round 3; the objective is out of reach (N12) | **6** |
| Escape start | Librarian 1d6 | **1** | Ground floor, lights on (Full Alert counts as every step) | 6 |
| E2 (Full Alert) | Stealth/Deception (4), all +1, Stealth +2; **a failed roll = caught**. *Make a Scene* (+2 to the others, counts toward the cap); each keeps 3 SP for a Clutch | Pebbles Athletics D5 10d → 4 · Crinkle Deception D5 12d → 4 · Cassette Stealth D5 (Soundless) 11d → 5 · Architect Deception D5 9d → 4 · Filament Stealth D6 10d → 5 | Partial, Partial, Success, Partial, Partial: nobody caught (a Partial never fails). Pebbles' **Run It Again** on the chase roll: 6 misses → +3 = 7, Success | 6 |
| | Partial costs at Full Alert (N14) | Filament: knocked off the desk top, **3 squares = 1 die?** (N17) → 1 vs shrug 2d → 1: tie → **Rattled** · Architect: librarian **Swat 3** → 1 vs shrug 3d → 2 | The +1 default is void at the Limit, so the ST swapped in hits | 6 |
| Debrief | | | Partial Success, 2 AP each | |

### Drill 2 — Heist 3 escape by the book's E1 route (from the moment the cricket is taken, Alert 6, main-line SP)

| Step | Rule | Dice | Result | Alert |
|---|---|---|---|---|
| E1 R1 | Along the shelf tops: Acrobatics (2) +1 height −1 Planning line = D2; **group check**; carriers two at full | Crinkle 0 · Cassette 2 · Architect 1 · Filament 1 · Pebbles 1 | Crinkle's failed climb is a **slip** (anchored, no fall). Worst result: +1 → **7 Lockdown** → the parrot shrieks +2 → **Full Alert**. Damage Control can't help (7 + 1 = 8). The snake's own +1 is now moot | **8** |
| E1 R2 | Retry at Full Alert: D2 +1 = 3 | Crinkle 3 + 1 SP: 4d → 1 | **Failure → caught**… Crinkle **Clutches** (3 SP → 0): "a Clutched roll didn't fail", so she isn't caught | 8 |
| E2 R1 | Silk muffle Engineering (2) +1; watched squeeze Acrobatics (2) +1 (the Cellar needs no roll) | Filament muffle 11d → 7 (a Critical at D3, but no drop at Full Alert) · Crinkle 3d → 1 · Cassette 11d → 5 · Pebbles 2 + 1 SP: 3d → 0 | **Crinkle and Pebbles caught (Out)**, both with 0 SP. +2 each is frozen at the Limit. Pebbles was carrying *with* Filament, not alone, so the cricket stays (now one carrier at half Speed) | 8 |
| E2 R2 | Squeeze | Filament 5d → 0 → Clutch (3 SP) | Out with the cricket | 8 |
| Waiting Web | Ch 10 | — | "Out in the last Escape obstacle? The replacement is waiting at the exit": Rattled, half SP (3 each). **Full Success, 3 AP to every player**, including the two caught (N13) | |

---

## 5. Checklist — earlier issues exercised

IDs: H1-n = Heist 1 report; I-n = Heist 2; H-/P-/C-/R-n = Heist 5. REVIEW rows in brackets.

| Earlier issue | Status | Evidence |
|---|---|---|
| H1-1, I-8 (part), R-27 — creature "active", per-round +X [C2, E43] | **Fixed**, with new edges | The snake ("active from the start"), the cat (from its first step), and Full Alert as every step all ran without argument. New: a Weakness clear doesn't stop +X (N3); the parrot's conditional +X (N4); the cat's first step = roaming (N11) |
| H1-2, I-1, I-2, R-2, R-3 — opposed rolls, "Difficulty to spot you" [C3, D4] | **Fixed** | Snake, guard and rival crew: Successes + 1, then Stirring/cover/Soundless applied; a human is always a row Difficulty. New: one creature roll per group check? (N2) |
| H1-3, I-5, R-1 — group checks [C4] | **Fixed** | Five group checks; "the worst result, once" was used every time without friction. New: how a group check fits the two-roll obstacle (N1) |
| H1-4, R-8 — Clutch on a Partial [E1] | **Fixed** | Four Clutches, all on Failures. The Partial at H4 O4 couldn't be Clutched; it read cleanly. Sequencing note (N24) |
| H1-5, I-6, R-10 — "scene" [C1] | **Fixed** | The Jump used once in the E1′ scene; the Planning lines lasted the heist |
| H1-6, I-37, R-6, R-7 — Full Alert [C7, R6] | **Fixed** | Drills 1–2: the Alert froze at the Limit, Lockdown penalties applied, a failed roll caught the spider, and a Clutch saved one. New: N13, N14 |
| H1-7 — a Planning Silk Line solves an obstacle [C9] | **Still broken (moved)** | A Planning line now gives −1, but a line spun in the scene still means "no Acrobatics roll" (Ch 12), so the in-heist line beats the prepared one (N15) |
| H1-8, I-3, P-1 — Casing surplus [C8] | **Fixed** (the cap) | 9 Successes vs 5 items, 10 vs 4; extras bought nothing, and the unknown stayed hidden. Casing is still a certainty (N22) |
| H1-9 — unfair unknown | **Fixed** | The crickets and the rival crew both felt fair and solvable |
| H1-10, R-12, I-40 — Stealth vs the one Action [E2] | **Fixed**; squeezes unclear | "One roll covers one thing" worked. Does a squeeze or climb roll cost the Action? (N16) |
| H1-11, I-16 — heights [E3] | **Fixed**, a rounding gap | Shelf 6 and counter 3 were used for cover-from-below, a slip and a fall; 3 squares ÷ 2 (N17) |
| H1-12, I-9, H-2, R-13, R-18 — humans [E4] | **Fixed** | The librarian as an Alert Human row (Deception 4, Stealth 4, a Distracted row when turned), spotted +1, Swat 3 with a shrug. "Reach" is undefined (N18) |
| H1-13, I-18, H-9, R-9 — loot [E5] | **Fixed**, new content clash | Prize by two carriers, Treasure by dumbwaiter/slot, a carrier caught (not alone) leaves the loot. Heist 3's Prize vs its squeeze-only exits (N5); two-carrier pick-up (N20) |
| H1-15, I-4 — Stirring +1 through Active [C12] | **Fixed** | The sneeze check at Alert 6 ran at D3 + 1 |
| H1-16, I-13, R-16 — Criticals lowering the Alert [R4, E39] | **Fixed** (the exclusions) | Six Criticals at final D1–2 gave no drop; one at D3 under Full Alert gave no drop; the Planning line took a D3 roll to D2 and cost the drop. **No qualifying D3+ Critical occurred**, so the drop itself went unexercised |
| H1-17, I-28, I-32, R-22 — rerolls, Wolf [E7] | **Fixed** | Two Silk Rerolls and one *Run It Again* (a chase roll, 6 misses rerolled, Successes kept). Take the Hit not exercised |
| H1-18 — Assist stacking [R5] | **Fixed** | *I Called It* +2 made an Assist pointless; *Make a Scene* +2 filled the cap; Silk and Overclock dice stayed outside it. Easy to apply |
| H1-19 — Assist Skill [E8] | **Fixed** | Filament assisted a squeeze with Acrobatics, the Architect a lock with Engineering |
| H1-20, I-24, C-4 — random tables, Role split [E9, E30] | **Fixed** | Attributes and Quick Pick worked first time |
| H1-21, I-23 — Silk by species [E10] | **Fixed** | 6–8 SP across species |
| H1-23, I-27, R-5 — Flaw SP, pass/fail [E12] | **Fixed** | Dramatic, Allergic to Dust (pass on a Partial) and Butterfingers each paid once. The d8 (N19) |
| H1-26, I-29, R-24, R-23, I-36 — the clock [E14, E25] | **Fixed** | It fired once (Drill 1, result 2). Neither main line reached a third round at one obstacle |
| H1-27, I-17, P-2 — Preparations [E15] | **Fixed** | Four Preparations, each with a texture complication; Dead Drop and Contingency free. The Contingency fired once |
| H1-28 — AP banking [E16] | **Fixed** | Pebbles banked 1 |
| H1-29 — Full Alert at the Debrief [E17] | **Fixed as ruled**, but see N13 | |
| H1-30, I-39 — Waiting Web [E18] | **Fixed wording**; balance gap | Drill 2 used every clause; capture in the last obstacle is free (N13) |
| H1-33, I-19 — NPC Partials [E21] | **Fixed** | Every creature roll was just a count |
| H1-34 — Crab speed [E22] | As ruled | Crinkle (Speed 4) set the pace of every move; the crew used silk and the dumbwaiter |
| I-7 — creature defeat [E23] | **Fixed**, but see N12 | Guard driven off by two Brawl rolls |
| I-8 — guard awareness [E24] | **Fixed** | "Spotted" +1 merged with the Failure; then +1 a round |
| I-11, H-3 — patrols, unpredictable NPCs [E25, F19] | **Fixed** | The librarian's d6 floors gave a live, fair threat; one friction (N10) |
| I-12 — Bypass [C11, F20] | **Fixed** | The key lock was named; Filament rolled Engineering 4 |
| I-14, I-15, H-1 — maps, entries [F] | **Fixed**, new map notes | Both maps were readable and countable. N6, N8, N9 |
| I-20 — squeeze vs "When Not to Roll" [E28] | **Fixed** | Unwatched squeezes cost no roll; watched ones did |
| I-21 — Silk barely used [R7] | **Partly**: Silk still pools on non-rollers (N21) | H3 spent 13/36, H4 5/38 |
| I-25, C-1–C-3 — duplicates [E31] | **Fixed** | Name rerolled in one step |
| I-30 — Make a Scene [E32] | **Fixed** | Used at Full Alert (its +1 moot) |
| I-35 — once per heist per spider [D4] | **Fixed** | *I Called It* used once in each heist; NPTP crew-wide |
| I-41 — glass [E34] | **Fixed** | The tank gives the snake sight and gives no cover |
| R-14 — one event, one trigger [E37] | **Fixed** | A Failure + spotted = +1; Failure + Clutch = +1 |
| R-15 — That's Not What Happened [E38] | **Fixed** | Cancelled the sneeze's +1 |
| R-26 — Damage Control split | **Fixed** (considered; useless when the spike lands on the Limit anyway) | |
| Not exercised | — | H1-14 (Heist 1), H1-22 Drafting, H1-24, H1-25/I-26 Show-Off, H1-31 Early Warning, H1-32/R-21 Improvise, I-10, I-22, I-34, I-38 Botch, R-11, R-17, R-19 |

---

## 6. NEW ISSUES

Severity: **blocker** (tables will diverge or need a house rule to continue) · **confusing** · **minor**.

### Chapter 19 content

**N4 · confusing (near-blocker) · design — In the Pet Store, Alert 7 is Full Alert: the parrot's shriek removes the Lockdown band.**
- **Where:** H3 O4 (the crew spent NPTP to avoid it), E2 (TNWH spent for the same reason), Drill 2 (it happened).
- **Book:**
  - Ch 16 Parrot: "Alert 7, shrieks — the Alert rises by 2 once."
  - Heist 3: "Alert Limit: 8".
  - Also: "Alert Contribution +1 each round it’s repeating something" — neither the Parrot nor Ch 9 defines its earshot, or whether it counts anywhere but its own obstacle.
- **Effect:** a Standard store behaves like Limit 7, and every +1 at Alert 6 is a +3. The parrot can end the heist from a room the crew never entered.
- **Fix:** change the shriek to "+1 once" or tie it to the parrot's sight ("…shrieks if it can see a spider"). Or add to Heist 3: "At Limit 8, the shriek at 7 is Full Alert: the parrot is the clock." Also define its reach: "It repeats noises made anywhere on the shop floor."

**N5 · confusing · contradiction — Heist 3's loot can't leave by either exit.**
- **Where:** H3 E2.
- **Book:**
  - Heist 3: "Loot: Prize"; both entries are gaps: "Squeeze the gap, watched" and "the gap under the front door".
  - Ch 12: "Anything bigger than a Trinket won’t fit a squeeze — find another way, or break off what fits and call it incomplete."
  - The map's escape route runs out through the dock gap.
- **Effect:** literally, a Full Success is impossible, and the only fallback is a part of a live cricket.
- **Fix:** add to Heist 3 "The cricket is alive: calmed (E2), it squeezes through a gap on its own", or make the dock gap a full square.

**N6 · minor · map/text — From entry A the crew never meets the parrot; from B it never meets the insects.**
- **Where:** H3 O3.
- **Book:**
  - "Numbered circles are the Suggested Obstacles, in the order the crew meets them."
  - The parrot "sees the whole front of the store".
  - On the map, the counter (11,9–10) and back shelf (11–13,8) block every line from (3,9) to the bin approach.
- **Fix:** "From A, the parrot only sees a spider up on the shelf tops or the counter", and say that obstacles 1 and 3 belong to routes A and B respectively.

**N7 · minor · process — Heist 3's Casing intel is already on the crew's map.**
- **Book:** the caption says "the only way round is the one-square gap by the east wall"; the map draws the cage cover and the cracker box. Intel: "The feeder bin sits behind the counter with one narrow approach. The parrot’s cover is folded on the shelf beside its cage, and there’s a box of crackers on the counter."
- **Fix:** drop the caption sentence and those two props from the crew's copy, or replace the intel items.

**N8 · minor · map — Heist 4's entry B skips obstacle 1 entirely.**
- **Book:** Guard Spider Senses "within 6 squares in line of sight". B at (15,5) is 11–13 squares from G, and so is the whole path to the east stairs.
- **Effect:** a crew that reads the map (G is drawn) always takes B. The heist becomes 3 obstacles, and the guard only matters in E2 ("the guard’s web on one side").
- **Fix:** say so in Heist 4, or put the web where both entries pass it.

**N9 · minor · wording — "Down two floors".**
- **Book:** Heist 4 E1: "Down two floors with a book that outweighs the crew." The reference section is "on the second" floor; the map shows GROUND and SECOND FLOOR; the librarian's floors are "ground / second / third".
- **Fix:** "Down a floor".

**N10 · minor · process — the librarian rolls twice at every obstacle boundary, and obstacle 2 can have no one in it.**
- **Where:** H4 O2–O4.
- **Book:** "Roll 1d6 as each obstacle begins, and at the end of each round in turn order". Obstacle ② is on the second floor, but she was on the ground floor (1) and then off the map (6, 6, 5).
- **Fix:** "Roll at the end of each round (and once as the crew enters)". Add: "Obstacle 2 is wherever she and the crew share a floor; if she's on the third floor, that stretch is free."

**N25 · minor · undefined — the rival crew's outcomes.**
- **Book:** "Negotiate, compete, or recruit — all three are valid."
- **Gap:** nothing says what "compete" means, what a Failure costs (do they take the book?), or what a recruited crew does.
- **Fix:** one line each — "win: they back off for a favour owed · recruit: they carry the book (it counts as a sled) · lose: they grab it and run; getting it back is the next obstacle".

### Creatures and the Alert

**N3 · confusing · undefined — Clearing a creature by its Weakness doesn't stop its +X.**
- **Where:** H3 O2 R2 (lid shut, still +1); Drill 2 E1 (the contained snake still counts at "its obstacle").
- **Book:** Ch 16: "Clear a creature’s obstacle with **Brawl or Intimidation** and it backs off for the rest of that obstacle: no attacks, no +X there." Corn Snake Weakness: "a lid that’s actually shut."
- **Effect:** under a strict reading, a shut-in snake is worse to walk past than one you punched.
- **Fix:** "Clear a creature's obstacle by its Weakness, Brawl or Intimidation…". Or: "a creature held by its Weakness adds no +X while it stays held."

**N11 · confusing · balance — The Library cat roams from "ears rotate", so at Limit 6 it's a 3-round fuse.**
- **Where:** H4 O4 → E2; Drill 1.
- **Book:**
  - Ch 9: "active from the first Escalation step… at every obstacle once it roams (a cat once awake…)".
  - House Cat: "Alert 3, ears rotate. Alert 5, moves toward the sound."
  - Heist 4: "it wakes on its Escalation."
- **Effect:** from Alert 3 the cat adds +1 at every obstacle while asleep-ish on a landing it never leaves. In H4 it supplied 2 of the last 3 Alert points; in Drill 1 it helped turn 3 into 6 in one round.
- **Fix:** "A cat roams from its 'moves toward the sound' step; before that it's active only at its own obstacle." Or state plainly that "ears rotate" is awake.

**N12 · confusing · balance — Beating a guard spider changes nothing.**
- **Where:** Drill 1 R3.
- **Book:** Guard Spider: "a beaten guard calls for backup: a fresh one, already aware, takes its post". Escalation: "aware… then +1 a round, and it follows the crew."
- **Effect:** driving it off stops its +X "there", but the already-aware backup adds +1 the same round and follows. Two loud Brawl rolls (+2 Alert) buy nothing. Only a bribe helps.
- **Fix:** "The backup takes its post: it holds the lobby and adds +1 only at that obstacle." Or: "it arrives at the start of the next obstacle."

**N13 · confusing · balance — Being caught in the last Escape obstacle costs nothing.**
- **Where:** Drill 2 (two spiders caught; every player still got full AP).
- **Book:**
  - Ch 10: "Out in the last Escape obstacle? The replacement is waiting at the exit… Next heist, the player may bring back either spider."
  - Ch 11: "AP are per spider… It isn’t split." Full Success requires only that the crew escaped with the objective.
- **Effect:** the Full Alert capture rule (the main v4.6 teeth, R6) bites only for a lone loot carrier, or in the first Escape obstacle.
- **Fix:** e.g. "A player whose spider was caught in the Escape earns half AP", or "…brings the replacement next heist, not the original."

**N14 · minor · undefined — Partials are free at Full Alert.**
- **Where:** Drill 1 E2 (four Partials).
- **Book:** "By default it’s noise: the Alert rises by 1." Full Alert: "nothing raises or lowers it."
- **Fix:** "At Full Alert, a Partial's cost is never Alert: the ST picks a hit, a dropped item or −1 die."

**N2 · confusing · undefined — Does a creature roll once for a group check, or once per spider?**
- **Where:** H4 Drill 1 R1 (the guard vs five sneaking spiders); H3 O2.
- **Book:** Ch 2: "it rolls its pool first, and its Successes + 1 become your Difficulty" — singular; nothing is said about group checks.
- **Effect:** per-spider rolls make a group sneak far swingier.
- **Fix:** "Against a group check the creature rolls once for the round; that Difficulty applies to every spider."

**N18 · minor · undefined — "engaged" and "within its reach".**
- **Book:** Ch 2: "an engaged threat that sees you fail lands a hit". Human: "Fail a roll within its reach and you’re swatted."
- **Where:** Drill 1 R1 (was a guard that had just spotted Pebbles "engaged"?); H4 O2 (the librarian's reach across a room).
- **Fix:** "Engaged = aware of you and able to reach you this round. A human's reach is its room" (or "adjacent").

### Rules text

**N1 · confusing · undefined — "Two successful rolls" on an obstacle the whole crew must cross.**
- **Where:** H3 O1 (squeeze + hush), O2 (sneak + lid), H4 O2 (a misdirect + a group sneak).
- **Book:** Ch 11: "A heist obstacle takes two successful rolls (Partial or better) — one to get into position, one to do the job… A group check (Chapter 2) is still one roll per spider".
- **Unclear:**
  - Is the group check one of the two rolls?
  - Must every spider pass it before the obstacle counts?
  - What is the "job" on a pure crossing (H3 #2 "Cross the floor past the snake tank")?
- **Played as:** group check = the position roll (each spider through on its own result), plus one spider's job roll from the obstacle's other approach.
- **Fix:** write that down: "On an obstacle the crew crosses together, the group check is the position roll and one spider makes the job roll; a spider who fails the group check retries next round."

**N15 · confusing · contradiction — A Planning Silk Line is worse than one spun in the scene** (H1-7, moved).
- **Where:** H3 E1 / Drill 2 (shelf tops); H4 O3 (the case).
- **Book:** Ch 11: "Pre-place one Silk Line… It lowers that obstacle’s Difficulty by 1; it doesn’t skip it." Ch 12: "A Silk Line is safe footing the crew can climb or cross with **no Acrobatics roll**."
- **Effect:** a spider can spin a line during the obstacle (free when nothing's watching, 1 SP or D2 otherwise) and skip E1's shelf-top roll entirely. Preparing the line in advance is worse.
- **Fix:** make Ch 12 match: "A Silk Line lowers the Difficulty of the climb or crossing it serves by 1; with nothing watching or closing in, crossing it takes no roll."

**N16 · minor · undefined — Movement rolls vs the one Action, and vs "Escape obstacles take one".**
- **Where:** H3 O1 (the hush and the squeeze couldn't be done by one spider in one turn); Drill 2 E2 (the muffle roll plus a squeeze roll per spider, each able to catch you at Full Alert).
- **Book:**
  - Ch 3: "An Action is the thing you roll for". Squeezing "takes an Acrobatics roll (Difficulty 2) to pass".
  - Ch 11: "Escape obstacles take one."
- **Fix:** "A squeeze or climb roll is part of your move, not your Action. In an Escape obstacle it is your roll for that obstacle."

**N17 · minor · undefined — Fall damage for odd heights.**
- **Book:** "a real fall… is a hit of 1 die per 2 squares". The book's own counter/desk is 3 squares tall.
- **Where:** Drill 1 (played as 1 die, rounded down).
- **Fix:** "(round up)" or "(round down)".

**N19 · minor · contradiction — Butterfingers needs a d8.**
- **Book:** Ch 7: "It lands in a random adjacent square." Ch 1: "Actual play uses only d6s."
- **Fix:** "the ST picks the square", or "roll 1d6: 1–2 ahead, 3–4 left, 5–6 right".

**N20 · minor · undefined — Picking up two-carrier loot.**
- **Book:** Prize "One at half Speed, or two at full"; Treasure "Two at half Speed, or a silk sled"; "picking it up takes an Action."
- **Where:** H4 E2 (the book on the desk).
- **Unclear:** one Action or two? Can one spider hold a Treasure while standing still?
- **Fix:** "One Action picks it up; it moves at the listed Speed once its carriers are adjacent."

**N21 · minor · balance — Silk pools on spiders who rarely roll.**
- **Where:** H3: Cassette and the Architect ended with 15 of 15 SP. H4: 33 of 38 unspent.
- **Book:** Ch 8: "The classic mistake is finishing a heist with Silk still in the pool". Every spend is on your own roll, except Damage Control and the Flaw delay.
- **Also unclear:** could the crew have paid Pebbles' Clutch in Drill 2?
- **Fix:** "You may spend Silk on an adjacent crewmate's roll (an extra die, a Reroll or a Clutch)." Or say plainly that you can't.

**N22 · minor · process — Casing always hits the cap.**
- **Where:** H3: 9 Successes vs 5 items. H4: 10 vs 4.
- **Effect:** with five spiders and no Difficulty, full intel is a certainty. The Mid-Heist complication "2" then has nothing left to give, so the ST invents a detail.
- **Fix (optional):** "Casing takes Difficulty 2 per detail", or "one Casing roll for the crew, with Assists".

**N23 · minor · balance — Quick Pick packages leave shrug-offs at 2 dice.**
- **Where:** the Quick Pick gives Endurance only to the Wheelman. Four of five spiders shrug with BODY 2 alone.
- **Also:** the Face's "Stealth 3" plus a NERVE-first spread gives the Face an 8-die sneak, beating the Ghost's 7.
- **Fix:** put Endurance 2 in two or three packages, or accept it as flavour.

**N24 · minor · process — A Reroll can lock you out of the Clutch.**
- **Where:** H4 O4.
- **Effect:** a Reroll that lifts a Failure to a Partial removes the Clutch option. The Partial then costs the same +1 Alert a Clutch would have cost, but it's only a Partial.
- **Fix:** one line of advice in Ch 8 Silk Point Management.

**N26 · minor · unclear — *Not Part of the Plan* on a Partial.**
- **Where:** H3 O4.
- **Book:** "Negate one complication the ST just introduced".
- **Played as:** it can erase a Partial's default +1 (4 SP turns a Partial into a clean Success). Plausible, but the text never says whether a Partial's complication counts.
- **Fix:** add "(including a Partial's complication)", or "(not a Partial's)".

---

## 7. What worked

- **Group checks** were the biggest improvement: five of them, each settled in seconds, with no double-counting of Alert.
- **Opposed rolls:** Successes + 1 was quick to run, and it reads naturally with Stirring, Soundless and cover stacked on top. The creature "just counting" removed a whole class of argument.
- **The +2 bonus cap** was easy to apply and created real choices: skip the Assist when *I Called It* already fills the cap, or pair *Make a Scene* with Silk dice rather than with other Perks.
- **Full Alert** was unambiguous at the table: the frozen number, the penalties, "a failed roll = caught", and the Clutch as the escape hatch. The Ch 8 advice to keep 3 SP back near the Limit turned out to be exactly right.
- **Clutch-on-Failure, and rerolls that keep Successes:** no disputes.
- **Humans as rows:** running the librarian as an Alert Human row (and a Distracted row when turned away), with the d6 floor roll, gave a fair, lively threat with no stat-block lookups mid-scene.
- **The unknowns:** the cricket negotiation and the rival crew both felt fair. Both were unguessable from casing, and both were solved by the Face.
- **Maps:** every distance could be counted. The Library's dumbwaiter, the return-slot E2 and the Treasure-won't-fit-a-squeeze rule interlock nicely.
- **Preparations with complications** and a Contingency that actually fired both felt good. The Casing cap stopped the old intel flood.
- **Character creation** from the Ch 20 tables took about two minutes per spider, and the duplicate rule took one line.

## 8. How the difficulty felt

- **Heist 3 (Standard): tense at the end, safe early.** Peak Alert 6/8 and a Full Success, but only because the crew spent both crew-level cancels (NPTP 4 SP, TNWH 2 SP) to stop Alert 7.
  - The parrot's shriek turns 7 into Full Alert (N4), so the last two points were a cliff, not a slope.
  - Drill 2 showed what the book's own escape route costs: Full Alert in one round, and two low-GRACE spiders caught on the exit squeeze.
- **Heist 4 (Hard): the objective was in danger; the spiders were not, in the main line.** Peak Alert 5/6 and a Full Success on good dice: a Critical-grade lock pick, and a Face rolling 4–5 Successes three times.
  - The cat's +1 every round after Alert 3 made every round count, which is the right feeling.
  - Drill 1 showed Hard's real teeth: a single failed sneak past the guard gave Full Alert by round 3 (N11, N12).
  - Even so, a Full Alert escape was survivable with *Make a Scene* and Silk dice. And capture in the last obstacle costs the players nothing (N13), so Hard threatens the loot far more than the crew.
- **Silk:**
  - The main lines spent **13 of 36** (H3) and **5 of 38** (H4) SP.
  - Almost all of it came from the three spiders who did the rolling (Face, Tinkerer, Bruiser). The Ghost and the Lookout finished both heists nearly full (N21).
  - In the drills Silk was spent hard: every spider emptied to its Clutch reserve, and three Clutches saved spiders from capture. Silk matters most exactly where the book says it does, at Full Alert.

---

## Appendix — raw roll log (every die, in order)

`label | NdS: faces | S = Successes (5–6)`. The S column on the d6 creation rolls (names, Role, Perks) is meaningless; those dice are read as table results.

```
P1 name 2d6 | 2d6: 3 2 | S=0
P1 species 1d6 | 1d6: 6 | S=1
P1 role 1d6 | 1d6: 1 | S=0
P1 attrs 1d6 | 1d6: 1 | S=0
P1 perks 1d6x2 | 2d6: 6 5 | S=2
P1 flaw 1d10 | 1d10: 4
P2 name 2d6 | 2d6: 5 5 | S=2
P2 species 1d6 | 1d6: 1 | S=0
P2 role 1d6 | 1d6: 2 | S=0
P2 attrs 1d6 | 1d6: 3 | S=0
P2 perks 1d6x2 | 2d6: 3 2 | S=0
P2 flaw 1d10 | 1d10: 2
P3 name 2d6 | 2d6: 3 4 | S=0
P3 species 1d6 | 1d6: 4 | S=0
P3 role 1d6 | 1d6: 5 | S=1
P3 attrs 1d6 | 1d6: 5 | S=1
P3 perks 1d6x2 | 2d6: 4 3 | S=0
P3 flaw 1d10 | 1d10: 8
P4 name 2d6 | 2d6: 3 4 | S=0
P4 species 1d6 | 1d6: 1 | S=0
P4 role 1d6 | 1d6: 3 | S=0
P4 attrs 1d6 | 1d6: 3 | S=0
P4 perks 1d6x2 | 2d6: 3 2 | S=0
P4 flaw 1d10 | 1d10: 7
P4 name reroll (dup The Architect) 2d6 | 2d6: 3 5 | S=1
=== HEIST 3 ===
H3 casing Crinkle Perception 4 | 4d6: 4 5 2 6 | S=2
H3 casing Cassette Perception 5 | 5d6: 1 1 1 5 3 | S=1
H3 casing Architect Perception 8 | 8d6: 3 5 2 4 3 6 6 4 | S=3
H3 casing Filament Perception 7 | 7d6: 3 5 4 5 6 1 1 | S=3
H3 casing Pebbles Perception 3 | 3d6: 4 1 1 | S=0
H3 O1 R1 Architect hush Persuasion D2 (3) | 3d6: 5 1 1 | S=1
H3 O1 R1 group squeeze Crinkle Acro D2 (3) | 3d6: 1 6 2 | S=1
H3 O1 R1 group squeeze Cassette Acro D2 (7) | 7d6: 3 4 4 6 4 4 3 | S=1
H3 O1 R1 group squeeze Filament Acro D2 (5) | 5d6: 4 1 5 1 5 | S=2
H3 O1 R1 group squeeze Pebbles Acro D2 (2) | 2d6: 4 2 | S=0
H3 O1 R1 Pebbles 2SP reroll both missed dice | 2d6: 3 2 | S=0
H3 O1 R2 Filament assist Acrobatics (2) | 2d6: 2 2 | S=0
H3 O1 R2 Pebbles squeeze Acro D2 (2 base) | 2d6: 2 2 | S=0
H3 O2 R1 snake Perception 3 (opposed) | 3d6: 6 6 2 | S=2
H3 O2 R1 Filament Stealth D4 (6+1SP=7) | 7d6: 6 6 6 5 1 6 2 | S=5
H3 O2 R2 Filament Engineering shut lid D4 (7 +2 ICalledIt +2 Overclock =11) | 11d6: 3 6 4 5 2 1 1 5 5 2 4 | S=4
H3 O4 R1 Architect assist Deception (2) | 2d6: 1 1 | S=0
H3 O4 R1 Crinkle Deception D3 (8 base) | 8d6: 4 6 1 5 6 4 5 3 | S=4
H3 O4 R2 Crinkle Persuasion D3 (6 +1 gift=7) | 7d6: 6 1 2 1 2 4 5 | S=2
H3 E1(route B) R2 Cassette cracker Persuasion D1 (GRACE4+0=4) | 4d6: 5 2 4 2 | S=1
H3 E2 R1 Crinkle calm cricket Persuasion D2 (6) | 6d6: 1 5 2 5 6 1 | S=3
H3 E2 R1 Pebbles sneeze (Allergic to Dust) Stealth D3+1=4 (5) | 5d6: 4 4 1 4 1 | S=0
=== HEIST 4 ===
H4 casing Crinkle Perception 5 | 5d6: 3 2 6 2 1 | S=1
H4 casing Cassette Perception 5 | 5d6: 1 6 6 5 3 | S=3
H4 casing Architect Tactics 8 | 8d6: 1 6 1 4 2 6 5 3 | S=3
H4 casing Filament Perception 7 | 7d6: 4 6 2 6 4 5 3 | S=3
H4 casing Pebbles Perception 3 | 3d6: 2 4 3 | S=0
H4 O2 start: librarian floor 1d6 | 1d6: 1 | S=0
H4 O2 R1 Architect assist Deception (2) | 2d6: 3 5 | S=1
H4 O2 R1 Crinkle Deception D4 misdirect librarian (8) | 8d6: 4 3 5 6 6 6 4 4 | S=4
H4 O2 R1 Crinkle assist bonus die | 1d6: 3 | S=0
H4 O2 R1 group Stealth D1 Architect (5) | 5d6: 1 4 6 5 6 | S=3
H4 O2 R1 group Stealth D1 Filament (6) | 6d6: 1 6 1 2 6 5 | S=3
H4 O2 R1 group Stealth D1 Pebbles (6) | 6d6: 6 6 2 1 3 6 | S=3
H4 O2 end R1: librarian floor 1d6 | 1d6: 2 | S=0
H4 O2 R2 Crinkle Stealth D4 vs Alert Human (8) | 8d6: 2 2 5 3 5 2 3 2 | S=2
H4 O2 end R2: librarian floor 1d6 | 1d6: 6 | S=1
H4 O3 start: librarian floor 1d6 | 1d6: 6 | S=1
H4 O3 R1 Filament climb glass case Acrobatics D2-1(line)=1 (5) | 5d6: 4 5 4 4 6 | S=2
H4 O3 end R1: librarian floor 1d6 | 1d6: 5 | S=1
H4 O3 R2 Architect assist Engineering (2) | 2d6: 3 3 | S=0
H4 O3 R2 Filament Engineering D4 antique lock (7+1pick+2OC+1SP=11) | 11d6: 4 2 5 3 6 5 1 3 2 4 2 | S=3
H4 O3 end R2: librarian floor 1d6 | 1d6: 2 | S=0
H4 O4 start: librarian floor 1d6 | 1d6: 1 | S=0
H4 O4 R1 rival Face 5 dice (opposed) | 5d6: 1 1 6 6 1 | S=2
H4 O4 R1 Crinkle Persuasion D3 (7+1 ICalledIt=8) | 8d6: 6 1 1 6 3 6 5 5 | S=5
H4 O4 end R1: librarian floor 1d6 | 1d6: 3 | S=0
H4 O4 R2 rival Face 5 dice (opposed) | 5d6: 2 1 6 4 5 | S=2
H4 O4 R2 Crinkle Persuasion D3 close deal (7) | 7d6: 4 2 4 3 3 4 5 | S=1
H4 O4 R2 Crinkle 2SP reroll 3 missed dice (keeps the 5) | 3d6: 4 6 1 | S=1
H4 E1 R1 Filament dumbwaiter Engineering D3-1(line)=2 (7) | 7d6: 2 5 6 5 2 6 1 | S=4
H4 E1 end R1: librarian floor 1d6 | 1d6: 3 | S=0
H4 E2 start: librarian floor 1d6 | 1d6: 5 | S=1
H4 E2 Butterfingers: random adjacent square 1d8 (1=N clockwise) | 1d8: 1
H4 E2 R1 Filament feed book out return slot Engineering D3 (7+2 Overclock=9) | 9d6: 4 2 6 3 5 5 4 4 3 | S=3
=== DRILL 1 (H4 via entry A, obstacle 1 guard) ===
D1 R1 guard Perception 4 (opposed) | 4d6: 3 3 2 4 | S=0
D1 R1 group Stealth D1 Crinkle (8) | 8d6: 6 1 2 2 4 6 2 5 | S=3
D1 R1 group Stealth D1 Architect (5) | 5d6: 6 1 6 5 2 | S=3
D1 R1 group Stealth D1 Filament (6) | 6d6: 5 2 3 1 1 4 | S=1
D1 R1 group Stealth D1 Pebbles (6) | 6d6: 1 4 1 3 3 4 | S=0
D1 R2 guard Brawl 3 (opposed) | 3d6: 4 3 4 | S=0
D1 R2 Pebbles Brawl (8) | 8d6: 4 6 3 2 4 3 5 5 | S=3
D1 R3 start: Mid-Heist Complication 1d6 | 1d6: 2 | S=0
D1 R3 guard Brawl 3 (opposed) | 3d6: 2 1 5 | S=1
D1 R3 Pebbles Brawl (8) | 8d6: 1 3 4 1 4 6 4 3 | S=1
D1 R3 guard attack Brawl 3 (hit from Partial complication) | 3d6: 3 3 6 | S=1
D1 R3 Pebbles shrug BODY+Endurance (8) | 8d6: 2 5 2 1 3 3 3 6 | S=2
D1 Escape start: librarian floor 1d6 | 1d6: 1 | S=0
D1 E2 FullAlert Pebbles Athletics run D4+1=5 (8+2SP=10) | 10d6: 1 2 5 5 6 1 1 3 6 2 | S=4
D1 E2 FullAlert Crinkle Deception D4+1=5 (8+2Scene+2SP=12) | 12d6: 6 6 1 1 3 5 2 4 1 3 1 6 | S=4
D1 E2 FullAlert Cassette Stealth D4+2-1Soundless=5 (7+2Scene+2SP=11) | 11d6: 4 2 6 5 3 6 3 5 6 2 2 | S=5
D1 E2 FullAlert Architect Deception D5 (5+2Scene+2SP=9) | 9d6: 3 5 1 6 4 4 5 6 3 | S=4
D1 E2 FullAlert Filament Stealth D6 (6+2Scene+2SP=10) | 10d6: 5 6 6 4 6 2 5 2 1 3 | S=5
D1 E2 Pebbles Run It Again: reroll 6 missed dice (keeps 4) | 6d6: 2 4 6 5 4 6 | S=3
D1 E2 Filament fall 3 squares = 1 die (1 per 2, rounded down) | 1d6: 5 | S=1
D1 E2 Filament shrug BODY2+End0 (2) | 2d6: 2 6 | S=1
D1 E2 librarian Swat 3 on Architect | 3d6: 1 6 1 | S=1
D1 E2 Architect shrug BODY2+End1 (3) | 3d6: 6 6 2 | S=2
=== DRILL 2 (H3 escape by the book's E1 route, from Alert 6) ===
D2 E1 group Acrobatics shelf tops D2+1height-1line=2 Crinkle (3) | 3d6: 4 4 2 | S=0
D2 E1 group Acrobatics shelf tops D2+1height-1line=2 Cassette (7) | 7d6: 5 2 4 2 5 1 2 | S=2
D2 E1 group Acrobatics shelf tops D2+1height-1line=2 Architect (5) | 5d6: 6 1 2 2 4 | S=1
D2 E1 group Acrobatics shelf tops D2+1height-1line=2 Filament (5) | 5d6: 2 6 3 4 2 | S=1
D2 E1 group Acrobatics shelf tops D2+1height-1line=2 Pebbles (2) | 2d6: 3 5 | S=1
D2 E1 R2 FullAlert Crinkle Acrobatics retry D2+1Lockdown=3 (3+1SP=4) | 4d6: 1 5 4 2 | S=1
D2 E2 R1 Filament silk muffle Engineering D2+1=3 (7+2OC+2SP=11) | 11d6: 6 2 1 5 5 6 5 2 5 2 6 | S=7
D2 E2 R1 Crinkle squeeze Acro D2+1=3 (3, 0 SP) | 3d6: 2 6 1 | S=1
D2 E2 R1 Cassette squeeze Acro D3 (7+4SP=11) | 11d6: 2 5 4 5 2 6 1 6 1 6 1 | S=5
D2 E2 R1 Pebbles squeeze Acro D3 (2+1SP=3) | 3d6: 2 1 2 | S=0
D2 E2 R2 Filament squeeze Acro D3 (5, 3 SP held for Clutch) | 5d6: 1 2 4 1 1 | S=0
```

Log notes:
- The Architect in Drill 1 uses his post-Heist 3 NERVE 3.
- Drill 2 uses the Heist 3 sheets and SP at the moment of the fork: Crinkle 4, Pebbles 1, Filament 6, Cassette 7.
- H4 O2 R1 Cassette (D0 with Soundless) and the Cellar's squeezes rolled nothing.
