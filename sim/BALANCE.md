# Heisty Spideys — Balance Packages

This file picks one reading for every rule the simulator and the playtests found ambiguous (the **clarified baseline**, §1). It then tests candidate fix packages on top of that baseline and recommends one (§2–§7). §8 lists the exact book text changes, and §9 the Foundry code that has to follow.

**How the numbers were made.** Every package runs the five Ch 19 heists, **5,000 runs per heist**, seed 1, with the same crews and dice as `sim/REPORT.md`:

```
node sim/packages.mjs --runs 5000 --seed 1                      # §3 main comparison (all packages)
node sim/packages.mjs --tables loo,tweaks,spend --runs 2000     # §4–§5 side tables
node sim/run.mjs --package P4                                   # full REPORT-style report for one package
```

A package is **the strict reading + the clarified baseline + the package's own rule changes** (`sim/params.mjs`: `PRESETS.strict`, `CLARIFIED`, `PACKAGES`). "Strict" fills in whatever the clarified baseline leaves open, so the tested game is never easier than the book allows. For example: humans and Full Alert pursuers can land hits, threats act every round, intel is information only, and the Storyteller ends a stalled obstacle after 5 rounds. The book as written (`node sim/run.mjs`, no `--package`) is unchanged. `npm test` passes (27 tests, including new package tests), and so does `npm run -s validate`.

## 0. The short version

| | Easy win | Standard win | Hard win | Hard Outs / heist | Hard Loss | Critical | Failure | spiders spending ≥ ½ their Silk |
|---|---|---|---|---|---|---|---|---|
| **target** | ~90% | ~75% | 55–60% | ≥ 0.3 | ≥ 3% | 15–25% | 10–20% | ≥ 50% |
| book, default reading | 100.0% | 100.0% | 99.9% | 0.00 | 0.00% | 51.6% | 0.3% | 3.8% |
| book, strict reading | 74.2% | 67.0% | 89.5% | 0.00 | 0.00% | 19.2% | 2.9% | 7.7% |
| P0 clarified baseline | 100.0% | 99.8% | 99.9% | 0.00 | 0.00% | 31.4% | 0.6% | 2.1% |
| P1 5–6 Successes | 100.0% | 97.6% | 98.1% | 0.00 | 0.00% | 13.6% | 2.6% | 5.7% |
| P2 +2 dice cap, Crit Alert D3+ | 100.0% | 99.4% | 99.8% | 0.00 | 0.00% | 26.3% | 0.7% | 2.2% |
| P3 Difficulty +1, Crit at D+3 | 100.0% | 99.5% | 99.7% | 0.00 | 0.00% | 13.5% | 0.5% | 2.3% |
| **P4 recommended** | **87.9%** | **81.3%** | **58.8%** | **0.59** | 0.24% | **18.6%** | 9.2% | **81.8%** |
| P4B = P4 rules, book's Silk advice | 83.6% | 72.3% | 45.6% | 0.22 | 0.02% | 11.7% | 7.7% | 26.7% |
| **P4H = P4 + two heist fixes** | **87.9%** | **76.7%** | **55.5%** | **0.61** | 0.23% | **17.9%** | 9.4% | **81.3%** |

(The book rows are the same runs as REPORT.md, re-measured with this file's metrics. Failure counts Botches and clean fails too; Criticals and Failures are shares of all crew rolls.)

**Recommendation: adopt the clarified baseline (§1) and P4 (§2, §7). Also adopt the two heist fixes of P4H if the Standard label should mean ~75%.** On its own, none of P1–P3 moves any heist below 95%. The reason is structural (§4). A heist gives only about three rolls before the objective, and a Partial still clears an obstacle. Full Alert almost always arrives during the Escape, where it currently costs nothing. P4 changes the dice (5–6, half-Difficulty Partials), the structure (two rolls per heist obstacle) and the stakes (Full Alert escapes can catch spiders). It also tells players to spend their Silk. On its own, P4 leaves Standard at 81%. With the two heist fixes (P4H) it hits every target except Loss (0.2% at Hard, not 3%; see §7), and it sits just under the Failure floor (9.4%).

## 1. The clarified baseline

Each rule below is one resolution of an ambiguity the simulator or the playtests found. It is written as proposed book text, and it is what `sim/params.mjs` `CLARIFIED` sets. Where the playtests proposed a fix, the resolution follows it. Where they disagree, it picks the reading closest to what the book already implies (Drafting and Escape Routes imply a group leader and individual movement rolls; Ch 9 says Full Alert means "escape is the only play"; Ch 11 says "nothing in Planning auto-beats an obstacle").

| # | Question | Book | Proposed rule (one sentence; exact wording in §7a) | Sim |
|---|---|---|---|---|
| C1 | What is a scene? | ~20 "once per scene" abilities; Ch 10 and Ch 12 say "obstacle"/"scene" | **A scene is one obstacle, heist or Escape; Planning is its own scene, and silk placed during Planning lasts until the heist ends or it's broken.** (H1-5, H2-I-6, H5-R-10) | `sceneIs: "obstacle"` |
| C2 | When is a creature active, and how does per-round Alert work outside turn order? | Ch 9 +X row (ruling B22); Ch 3 Turn Order; Ch 16 Escalations | **A creature is active from the first Escalation step the Alert has reached (or from the start if the heist says it is awake or aware) and stays active for the heist; it adds its +X at the end of every round the crew spends at its obstacle, and at every obstacle once it roams (a cat once awake, anything hunting, a guard once aware); outside turn order each exchange of crew actions at an obstacle is one round.** (H1-1, H2-I-8, H2-I-33) | `creatureWake: "escalation"`, `creatureStaysActive: true`, `creatureScope: "presence"` |
| C3 | How do cover, Alert-band penalties and Difficulty-based Perks/Flaws work in opposed rolls? | Ch 2 Opposed Rolls; Ch 3 Cover; Ch 9 bands; Soundless, Loud, Crab, I Was Never Here, Arachnophobe Magnet | **Against a creature that actively resists, it rolls its pool first and its Successes + 1 become your Difficulty (so ties still go to the world); then every Difficulty modifier applies as usual (cover −2 to your Stealth Difficulty against that observer, Alert bands, Perks, Flaws) and the roll reads Partial, Success or Critical normally.** Humans and anything else without a pool use their Ch 15 Difficulty. (H1-2, H2-I-1, H2-I-2, H5-R-2, H5-R-3) | `creatureRolls: "rolled"` (new) |
| C4 | Group checks for crew-wide movement | Nothing (Drafting: "each crewmate gets +1 die on movement rolls") | **When the whole crew must get past the same thing, every spider rolls and gets through on its own result, but the round raises the Alert only once, by the worst result (and a Critical lowers it only if every roll was a Critical).** (H1-3, H2-I-5, H5-R-1) | `groupRolls: "worstAlert"` (new) |
| C5 | Attempts per obstacle; what a Failure costs besides +1 Alert | Ch 2 Failure ("no progress… something gets worse"); Ch 11 ("a clear goal, a success outcome, and a failure outcome") | **One successful roll (Partial or better) clears an obstacle; after a Failure you may try again next round, and an engaged threat that sees you fail lands a hit; if the crew is still stuck after five rounds the Storyteller ends it (in the heist the objective slips away, in the Escape anyone still inside is caught).** | `obstacleSteps: 1`, `failureAttack: true`, `maxRounds: 5` |
| C6 | What a Partial's complication costs; does a Partial raise the Alert? | Ch 2 Partial ("you made noise"); Ch 9 has no Partial row; Foundry `HEISTY.results.partial.alert = 1` | **A Partial raises the Alert by 1, unless the Storyteller picks a different complication that costs as much (a dropped item, −1 die on your next roll, a hit from an engaged threat), never both.** (H5-R-4, H1-3) | `partialCost: "alert"`, `partialHit: false` |
| C7 | Full Alert: past the Limit? Criticals? Lockdown below Limit 7? | Ch 9 At Limit; ruling B30 | **Once the Alert reaches the Limit it stays there for the rest of the heist: nothing raises or lowers it, every roll takes the Lockdown penalties (all +1, Stealth +2) whatever the Limit, and creatures act as at Alert 7+.** (H1-6, H2-I-37, H5-R-6, H5-R-7) | `fullAlertRule: "locked"` (new) |
| C8 | Casing intel cap | Ch 11 Casing; Ch 19 lists 3 items per heist | **Casing reveals at most the intel the Storyteller is holding (extra Successes buy nothing) and never the unknown obstacle, Familiar Face included.** (H1-8, H2-I-3, H5-P-1) | `casingRule: "capped"` (new), intel stays information only (strict) |
| C9 | Planning Silk Line | Ch 11 Preparation vs Ch 12 "no Acrobatics roll" | **A Silk Line pre-placed during Planning lowers that obstacle's Difficulty by 1 instead of skipping it; a line run during the heist (1 SP, or the D2 roll as your Action) still needs no Acrobatics roll.** (H1-7) | `preLineRule: "minus1"` (new), `silkLineBypass: true` |
| C10 | Spitting Spider jam/pin | Ch 4 Precision Application (no limit) | **Once per scene; a jammed sensor stops sensing, a jammed lock or latch stays shut.** (H2-I-10) | `spittingLimit: "scene"`, `spittingJamsLocks: false` |
| C11 | I Made a Thing: Bypass | Ch 5 ("no roll") | **Bypass gives the Tinkerer's Engineering roll against one small mechanical obstacle −1 Difficulty (not a lock the heist names as its key obstacle).** (H2-I-12) | `bypassRule: "roll"` (new), `bypassComplexLocks: false` |
| C12 | Stirring Stealth +1 during Active (5–6)? | Ch 9 table vs its Storyteller Note | **The Stirring Stealth +1 continues through Active; Active adds no new penalty.** (H2-I-4) | `activeBandStealth: 1` |

**What the baseline does to the numbers.** P0 wins 99.9% of heists, against REPORT.md's 77.4% under the strict reading. That is expected: C4 and C5 are fairer than the strict readings they replace. Strict rolled everyone's Alert separately (`groupRolls` −9.3 pts in REPORT.md §7a), took two rolls per obstacle (`obstacleSteps` −16 pts), and put every creature's +X everywhere (`creatureScope` −15.8 pts). The baseline removes arbitrary table-to-table swings. It does not remove the ease: that is the packages' job.

## 2. The packages

| id | rule changes on top of P0 | sim params |
|---|---|---|
| P0 | none | — |
| P1 | A die showing **5 or 6** is a Success; a Critical is still 2× Difficulty | `successFace: 5` (every roll: crew, creature pools and attacks, shrug-offs, Casing, the rolled Difficulty of C3) |
| P2 | At most **+2 bonus dice** on one roll from every source (Assist, Perks, Signature Moves, intel, Silk); a Critical lowers the Alert only at **Difficulty 3+** | `bonusDiceCap: 2`, `bonusCapScope: "all"`, `critAlertMinDiff: 3` |
| P3 | Every obstacle's Difficulty **+1** (the Toolkit shifts up one step, the rolled Difficulty of C3 too); a Critical needs **Difficulty + 3** Successes | `obstacleDiffShift: 1`, `critRule: "plus3"` |
| **P4** | 5–6 Successes; a **Partial needs half the Difficulty** (round up), fewer is a Failure; a heist obstacle takes **two successful rolls**; Critical Alert drop only at **D3+**; at most **+2 non-Silk bonus dice**; a **Failure during a Full Alert Escape gets that spider caught (Out)**; Ch 8 advice rewritten to **"spend your Silk"** | `successFace: 5`, `partialRule: "half"`, `obstacleSteps: 2`, `critAlertMinDiff: 3`, `bonusDiceCap: 2`, `fullAlertFailure: "caught"`, `silkPolicy: "spendy"` |
| P4B | P4's rules, but players follow the book's current Silk advice ("early on, hoard") | P4 without `silkPolicy` |
| P4H | P4 + **Heist 2's guard spider starts aware** + **Heist 5's two closing staff are Alert Humans (4)** | P4 + `heistTweaks` |

The simulated crew's Silk behaviour is not a rule. It is a player policy, and the default `greedy` policy follows Ch 8's printed advice. P4 includes a rewrite of that advice, so its rows use the `spendy` policy (spend whenever a die clearly helps; Silk doesn't carry over). P4B shows the same rules with today's advice. The truth for a real table probably lies between P4 and P4B.

## 3. Comparison (5,000 runs per heist)

### Win · Partial · Loss by heist

| Heist | P0 | P1 | P2 | P3 | P4 | P4B | P4H |
|---|---|---|---|---|---|---|---|
| 1. The Cookie Situation (easy, 10) | 100.0% · 0.0% · 0.00% | 100.0% · 0.0% · 0.00% | 100.0% · 0.0% · 0.00% | 100.0% · 0.0% · 0.00% | 87.9% · 12.1% · 0.00% | 83.6% · 16.4% · 0.00% | 87.9% · 12.1% · 0.00% |
| 2. The Office After Hours (standard, 8) | 100.0% · 0.0% · 0.00% | 99.9% · 0.1% · 0.00% | 100.0% · 0.0% · 0.00% | 100.0% · 0.0% · 0.00% | 90.2% · 9.7% · 0.06% | 88.9% · 11.1% · 0.00% | 81.1% · 18.8% · 0.12% |
| 3. The Pet Store Problem (standard, 8) | 99.5% · 0.5% · 0.00% | 95.2% · 4.8% · 0.00% | 98.8% · 1.2% · 0.00% | 99.0% · 1.0% · 0.00% | 72.4% · 27.3% · 0.34% | 55.7% · 44.2% · 0.06% | 72.4% · 27.3% · 0.34% |
| 4. The Library Job (hard, 6) | 99.8% · 0.2% · 0.00% | 97.2% · 2.8% · 0.00% | 99.7% · 0.3% · 0.00% | 99.7% · 0.3% · 0.00% | 46.9% · 52.8% · 0.30% | 29.3% · 70.7% · 0.04% | 46.9% · 52.8% · 0.30% |
| 5. The Restaurant Rush (hard, 6) | 100.0% · 0.0% · 0.00% | 99.0% · 1.0% · 0.00% | 99.9% · 0.1% · 0.00% | 99.7% · 0.3% · 0.00% | 70.7% · 29.1% · 0.18% | 62.0% · 38.0% · 0.00% | 64.2% · 35.6% · 0.16% |

### By difficulty label (win · partial · loss · Outs per heist)

| Label | P0 | P1 | P2 | P3 | P4 | P4B | P4H |
|---|---|---|---|---|---|---|---|
| easy | 100.0% · 0.0% · 0.00% · 0.00 | 100.0% · 0.0% · 0.00% · 0.00 | 100.0% · 0.0% · 0.00% · 0.00 | 100.0% · 0.0% · 0.00% · 0.00 | 87.9% · 12.1% · 0.00% · 0.19 | 83.6% · 16.4% · 0.00% · 0.06 | 87.9% · 12.1% · 0.00% · 0.19 |
| standard | 99.8% · 0.2% · 0.00% · 0.00 | 97.6% · 2.4% · 0.00% · 0.00 | 99.4% · 0.6% · 0.00% · 0.00 | 99.5% · 0.5% · 0.00% · 0.00 | 81.3% · 18.5% · 0.20% · 0.38 | 72.3% · 27.7% · 0.03% · 0.15 | 76.7% · 23.0% · 0.23% · 0.50 |
| hard | 99.9% · 0.1% · 0.00% · 0.00 | 98.1% · 1.9% · 0.00% · 0.00 | 99.8% · 0.2% · 0.00% · 0.00 | 99.7% · 0.3% · 0.00% · 0.00 | 58.8% · 41.0% · 0.24% · 0.59 | 45.6% · 54.4% · 0.02% · 0.22 | 55.5% · 44.2% · 0.23% · 0.61 |

### Dice, Alert, Vitality, Silk

| Metric | P0 | P1 | P2 | P3 | P4 | P4B | P4H |
|---|---|---|---|---|---|---|---|
| win (pooled) | 99.9% | 98.3% | 99.7% | 99.7% | 73.6% | 63.9% | 70.5% |
| Critical | 31.4% | 13.6% | 26.3% | 13.5% | 18.6% | 11.7% | 17.9% |
| Success | 52.3% | 46.0% | 54.4% | 53.7% | 47.7% | 46.7% | 46.8% |
| Partial | 15.7% | 37.9% | 18.6% | 32.3% | 24.5% | 33.9% | 25.9% |
| Failure | 0.6% | 2.6% | 0.7% | 0.5% | 9.2% | 7.7% | 9.4% |
| Botch (+ clean fail) | 0.00% (+0.00%) | 0.00% (+0.00%) | 0.00% (+0.00%) | 0.00% (+0.00%) | 0.00% (+0.00%) | 0.00% (+0.00%) | 0.00% (+0.00%) |
| rolls per heist | 10.3 | 10.5 | 10.3 | 10.3 | 13.8 | 13.3 | 13.7 |
| mean final pool | 8.2 | 8.1 | 7.7 | 8.3 | 9.4 | 7.9 | 9.4 |
| mean final Difficulty | 2.87 | 2.89 | 2.91 | 3.87 | 2.97 | 3.01 | 3.04 |
| non-Silk bonus dice / roll | 2.01 | 1.90 | 1.52 | 2.07 | 1.39 | 1.41 | 1.40 |
| Alert gained / heist | 4.42 | 5.67 | 4.60 | 5.28 | 6.79 | 7.02 | 7.06 |
| Alert removed by Criticals / heist | 1.15 | 0.38 | 0.36 | 0.68 | 0.24 | 0.10 | 0.22 |
| Alert lost to the Limit cap / heist | 0.31 | 1.32 | 0.57 | 0.80 | 3.82 | 3.78 | 4.47 |
| Full Alert (share of heists) | 16.5% | 44.2% | 26.5% | 33.0% | 69.2% | 77.6% | 77.2% |
| hits / heist | 0.13 | 0.25 | 0.16 | 0.17 | 1.04 | 1.07 | 1.14 |
| hits that land | 21.7% | 24.7% | 22.8% | 20.9% | 28.7% | 28.3% | 27.5% |
| Outs / heist | 0.000 | 0.000 | 0.000 | 0.000 | 0.427 | 0.160 | 0.484 |
| Silk at start / spider | 6.1 | 6.1 | 6.1 | 6.1 | 5.9 | 6.0 | 5.9 |
| Silk spent / spider | 0.20 | 0.44 | 0.21 | 0.22 | 4.82 | 1.64 | 4.78 |
| spiders spending ≥ half their Silk | 2.1% | 5.7% | 2.2% | 2.3% | 81.8% | 26.7% | 81.3% |
| median spider spends | 0–10% | 0–10% | 0–10% | 0–10% | 100–110% | 10–20% | 100–110% |

### Per heist: Failure rate · Critical rate · Outs · Full Alert

| Heist | P0 | P1 | P2 | P3 | P4 | P4B | P4H |
|---|---|---|---|---|---|---|---|
| 1. The Cookie Situation | 0% · 49% · 0.00 · 5% | 1% · 23% · 0.00 · 19% | 0% · 43% · 0.00 · 10% | 0% · 20% · 0.00 · 14% | 7% · 23% · 0.19 · 60% | 5% · 14% · 0.06 · 69% | 7% · 23% · 0.19 · 60% |
| 2. The Office After Hours | 0% · 30% · 0.00 · 1% | 1% · 11% · 0.00 · 17% | 0% · 25% · 0.00 · 2% | 0% · 14% · 0.00 · 6% | 9% · 17% · 0.29 · 55% | 5% · 11% · 0.11 · 62% | 9% · 15% · 0.53 · 91% |
| 3. The Pet Store Problem | 1% · 31% · 0.00 · 19% | 4% · 17% · 0.00 · 57% | 1% · 27% · 0.00 · 35% | 1% · 14% · 0.00 · 41% | 10% · 24% · 0.47 · 72% | 10% · 17% · 0.20 · 82% | 10% · 24% · 0.47 · 72% |
| 4. The Library Job | 0% · 21% · 0.00 · 39% | 1% · 9% · 0.00 · 72% | 0% · 17% · 0.00 · 53% | 0% · 11% · 0.00 · 61% | 9% · 12% · 0.66 · 92% | 6% · 8% · 0.18 · 97% | 9% · 12% · 0.66 · 92% |
| 5. The Restaurant Rush | 1% · 28% · 0.00 · 19% | 4% · 10% · 0.00 · 57% | 1% · 22% · 0.00 · 32% | 1% · 11% · 0.00 · 44% | 10% · 15% · 0.53 · 67% | 10% · 8% · 0.26 · 78% | 11% · 13% · 0.57 · 71% |

### Heist order (hardest first)

- **P0**: The Pet Store Problem (standard) 100% · The Library Job (hard) 100% · The Cookie Situation (easy) 100% · The Office After Hours (standard) 100% · The Restaurant Rush (hard) 100%
- **P1**: The Pet Store Problem (standard) 95% · The Library Job (hard) 97% · The Restaurant Rush (hard) 99% · The Office After Hours (standard) 100% · The Cookie Situation (easy) 100%
- **P2**: The Pet Store Problem (standard) 99% · The Library Job (hard) 100% · The Restaurant Rush (hard) 100% · The Cookie Situation (easy) 100% · The Office After Hours (standard) 100%
- **P3**: The Pet Store Problem (standard) 99% · The Library Job (hard) 100% · The Restaurant Rush (hard) 100% · The Cookie Situation (easy) 100% · The Office After Hours (standard) 100%
- **P4**: The Library Job (hard) 47% · The Restaurant Rush (hard) 71% · The Pet Store Problem (standard) 72% · The Cookie Situation (easy) 88% · The Office After Hours (standard) 90%
- **P4B**: The Library Job (hard) 29% · The Pet Store Problem (standard) 56% · The Restaurant Rush (hard) 62% · The Cookie Situation (easy) 84% · The Office After Hours (standard) 89%
- **P4H**: The Library Job (hard) 47% · The Restaurant Rush (hard) 64% · The Pet Store Problem (standard) 72% · The Office After Hours (standard) 81% · The Cookie Situation (easy) 88%

### Perk / Role / Flaw / Species outliers (pooled win Δ vs comparable crews, ±2.5 pts or more)

- **P0**: none
- **P1**: none
- **P2**: none
- **P3**: none
- **P4**: perk:plausible-deniability +12.5, perk:thunderous-entrance +3.4, role:face +3.2, perk:read-the-room −3.5, perk:silver-tongue −3.8, perk:familiar-face −4.0, role:bruiser −4.1, flaw:allergic-to-dust −4.5
- **P4B**: perk:plausible-deniability +16.7, role:face +4.5, perk:thunderous-entrance +4.1, perk:actually-i-planned-this −3.7, role:bruiser −4.1, perk:familiar-face −4.6, perk:read-the-room −5.3, perk:silver-tongue −5.3, flaw:allergic-to-dust −6.4
- **P4H**: perk:plausible-deniability +13.9, perk:thunderous-entrance +5.0, role:face +3.4, perk:actually-i-planned-this −3.0, perk:familiar-face −4.2, perk:read-the-room −4.5, role:bruiser −4.5, perk:silver-tongue −4.5, flaw:allergic-to-dust −4.9

## 4. Why P1–P3 don't work, and what P4 needs

1. **A heist is decided before the dice matter.** Under P0 the crew reaches the objective after about three single rolls, each made by the best specialist with a Partial counting as a pass. The Alert there is about 2–3 against Limits of 6–10. P1 cuts Criticals from 31% to 14% and raises Full Alert from 17% to 44% of heists, yet still wins 98.3%. Its Full Alert lands in the Escape, after the loot is in hand, and under the book a Full Alert Escape costs nothing. P2 and P3 do even less: capping bonus dice at +2 still leaves pools of 7.7, and a +1 Difficulty on 8-die pools turns Successes into Partials without producing Failures (0.5%).
2. **P3's Critical rule runs backwards.** Difficulty + 3 is the same as 2× Difficulty at D3, harder at D1–2, and *easier* at D4+ (7 instead of 8 at D4, 8 instead of 10 at D5). With the +1 shift, most rolls sit at D3–4.
3. **Counting Silk in the cap kills Silk.** Under P2 even a crew told to spend (§5, "P2 + spend advice") spends half its Silk only 13.6% of the time. Silk has nowhere to go once Assists and Perks fill the cap. P4 exempts Silk from the cap, so Silk becomes the crew's way past it.
4. **The risk lives in rolls per obstacle and in the Escape.** Removing one P4 rule at a time (§5 table) shows two load-bearing changes. Without 5–6 Successes, Hard goes 60% → 92%. Without two rolls per obstacle, Hard goes 60% → 91%. Half-Difficulty Partials are what turn the Failure rate from 2% into 9%, and Outs from 0.06 into 0.58 per Hard heist. The +2 cap and the D3 Critical floor are each worth about 4–6 Hard points. Full Alert capture makes Full Alert matter: without it, Hard Outs drop to 0.18 and Hard wins rise to 65%.

## 5. P4 sensitivity (2,000 runs per heist per row)

**Leave one rule out (or add an optional one).**

| variant | 1 | 2 | 3 | 4 | 5 | easy | standard | hard | Hard Outs | Hard Loss | Critical | Failure | Silk ≥ half |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P4 (all) | 88% | 90% | 74% | 48% | 72% | 87.6% | 82.2% | 59.8% | 0.58 | 0.22% | 18.7% | 9.1% | 81.9% |
| − Successes on 5–6 | 99% | 100% | 96% | 88% | 96% | 98.6% | 97.6% | 92.3% | 0.04 | 0.00% | 41.6% | 1.3% | 79.6% |
| − Partial needs half | 94% | 99% | 87% | 59% | 79% | 94.1% | 93.1% | 68.8% | 0.06 | 0.00% | 19.3% | 2.0% | 81.5% |
| − two rolls per obstacle | 99% | 98% | 87% | 92% | 90% | 99.3% | 92.6% | 91.1% | 0.29 | 0.07% | 20.8% | 7.3% | 80.1% |
| − Critical Alert at D3+ | 89% | 91% | 79% | 53% | 75% | 89.4% | 85.0% | 64.4% | 0.53 | 0.18% | 19.0% | 9.0% | 82.1% |
| − +2 bonus-dice cap | 89% | 93% | 78% | 54% | 78% | 89.1% | 85.5% | 66.1% | 0.46 | 0.07% | 20.4% | 7.9% | 81.9% |
| − Full Alert capture | 90% | 96% | 79% | 53% | 77% | 90.3% | 87.2% | 64.8% | 0.18 | 0.10% | 18.0% | 11.0% | 84.1% |
| + shrug ties to the threat (optional) | 87% | 90% | 74% | 48% | 72% | 87.2% | 82.0% | 59.9% | 0.59 | 0.13% | 18.7% | 9.1% | 81.9% |
| + Plausible Deniability once per heist (optional) | 86% | 89% | 72% | 42% | 69% | 86.3% | 80.7% | 55.3% | 0.65 | 0.25% | 18.5% | 9.2% | 81.6% |
| − 'spend your Silk' advice (= P4B) | 83% | 88% | 57% | 29% | 62% | 83.5% | 73.0% | 45.9% | 0.22 | 0.05% | 11.6% | 7.7% | 26.7% |

**P1–P3 with the "spend your Silk" advice.** Spending doesn't rescue them; it makes them easier.

| variant | 1 | 2 | 3 | 4 | 5 | easy | standard | hard | Hard Outs | Hard Loss | Critical | Failure | Silk ≥ half |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P0 + spend advice | 100% | 100% | 100% | 100% | 100% | 100.0% | 100.0% | 100.0% | 0.00 | 0.00% | 49.0% | 0.1% | 69.1% |
| P1 + spend advice | 100% | 100% | 98% | 100% | 100% | 100.0% | 99.2% | 99.7% | 0.00 | 0.00% | 23.0% | 1.4% | 76.5% |
| P2 + spend advice | 100% | 100% | 100% | 100% | 100% | 100.0% | 99.9% | 99.9% | 0.00 | 0.00% | 30.5% | 0.0% | 13.6% |
| P3 + spend advice | 100% | 100% | 100% | 100% | 100% | 100.0% | 99.9% | 99.9% | 0.00 | 0.00% | 29.9% | 0.2% | 79.9% |

## 6. Heist ordering and heist-level fixes

**Do the packages fix the ordering?** P1–P3 don't: the Pet Store stays the hardest heist and the Office the easiest, as in REPORT.md. P4 mostly does: Library (hard) 47% · Restaurant (hard) 71% · Pet Store (standard) 72% · Cookie (easy) 88% · Office (standard) 90%. Only the Office is out of place, and it plays easier than the Easy heist.

**Why.** How hard a heist plays depends on two things. The first is how many alert-bearing rolls stand before the objective. The second is whether any of them is a **whole-crew crossing against a creature**: five rolls against its rolled Difficulty, with retries every round while its +X ticks. The Pet Store has one (past the aware snake). That is why it was hardest under the book and stays the hardest Standard heist. The Office has neither: the sensors (one jam, or one Engineering roll), the guard (one Brawl or Persuasion roll), then the drawer, with its unknown obstacle placed *after* the objective. The Restaurant is Hard only by its Limit: its humans add no per-round Alert. The Library is right for Hard.

**Heist-level fixes tested on P4** (2,000 runs per heist per row; the tweaks are in `sim/heists.mjs` `HEIST_TWEAKS`):

| variant | 1 | 2 | 3 | 4 | 5 | easy | standard | hard | Hard Outs | Hard Loss | Critical | Failure | Silk ≥ half |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P4 | 88% | 90% | 74% | 48% | 72% | 87.6% | 82.2% | 59.8% | 0.58 | 0.22% | 18.7% | 9.1% | 81.9% |
| + office-cleaners-first | 88% | 88% | 74% | 48% | 72% | 87.6% | 80.7% | 59.8% | 0.58 | 0.22% | 18.6% | 9.2% | 82.0% |
| + office-guard-aware | 88% | 81% | 74% | 48% | 72% | 87.6% | 77.6% | 59.8% | 0.58 | 0.22% | 18.4% | 9.3% | 81.6% |
| + cookie-wiped-counter | 56% | 90% | 74% | 48% | 72% | 55.5% | 82.2% | 59.8% | 0.58 | 0.22% | 17.0% | 10.1% | 83.4% |
| + restaurant-alert-staff | 88% | 90% | 74% | 48% | 66% | 87.6% | 82.2% | 56.8% | 0.60 | 0.20% | 18.2% | 9.2% | 81.8% |
| + petstore-snake-escalation | 88% | 90% | 75% | 48% | 72% | 87.6% | 82.8% | 59.8% | 0.58 | 0.22% | 18.7% | 9.1% | 81.8% |
| + petstore-wedge-lid | 88% | 90% | 85% | 48% | 72% | 87.6% | 87.6% | 59.8% | 0.58 | 0.22% | 18.0% | 8.6% | 81.1% |
| + both office tweaks | 88% | 59% | 74% | 48% | 72% | 87.6% | 66.7% | 59.8% | 0.58 | 0.22% | 18.3% | 9.3% | 81.8% |
| P4H (guard aware + alert staff) | 88% | 81% | 74% | 48% | 66% | 87.6% | 77.6% | 56.8% | 0.60 | 0.20% | 17.9% | 9.4% | 81.5% |
| P4H + cleaners first + wedge lid | 88% | 59% | 85% | 48% | 66% | 87.6% | 72.1% | 56.8% | 0.60 | 0.20% | 17.1% | 9.0% | 80.8% |

- **Heist 2, guard starts aware** (Office 90% → 81%). The text already says "Professional, alert, doing the job". **Recommended.**
- **Heist 5, closing staff are Alert Humans (4)** (Restaurant 72% → 66%). Ch 15's own row for an observant human. **Recommended.**
- **Heist 2, cleaners before the drawer** ("They're already here"; Ch 11 wants 3–4 obstacles *before* the objective). On its own it does little (90% → 88%). Together with the aware guard it drops the Office to 59%, because the guard's +X follows the crew into the extra obstacle. Use it only if Standard should sit nearer 70%.
- **Heist 3, the loose lid as a way through** (one spider wedges it, Engineering 3). This lifts the Pet Store to 85%. It isn't needed under P4 (72% is on target), but it's the fix if the author wants the Pet Store easier than the Office.
- **Heist 1, silk won't hold on the wiped counter.** This drops the Cookie to 56%. Much too strong for the Easy heist; not recommended.
- **Heist 3, snake active only from its Escalation** changes little (74% → 75%). The crossing costs the crew through five rolls against the snake's rolled Difficulty, not through its +1 per round.

With the two recommended fixes (P4H) the order matches the labels: Library (hard) 47% · Restaurant (hard) 64% · Pet Store (standard) 72% · Office (standard) 81% · Cookie (easy) 88%.

## 7. Recommendation

Adopt **C1–C12** (they are needed whatever the balance) and **P4**. Add the two P4H heist fixes, and change Plausible Deniability to once per heist.

**Why P4 and not something smaller.** Every single-mechanic package (P1–P3) leaves the win rate above 95%, and so does any pair of dice changes I tried (for example 5–6 + Difficulty +1: Standard 95%, Hard 97% at 1,000 runs). Two things are needed at once. First, dice that fail (5–6 with half-Difficulty Partials: Failure 9%, Critical 19%, both in or at the edge of the target bands). Second, more rolls between the entry and the objective (two per heist obstacle). The remaining P4 rules are one sentence each. Each fixes a named problem: Critical farming at D2 (the D3 floor), 2.0 free bonus dice a roll (the +2 cap), Full Alert with no teeth (capture), and the Ch 8 advice that produces hoarding.

**Targets under P4H:** Easy 87.9% (target ~90 ✓), Standard 76.7% (~75 ✓), Hard 55.5% (55–60 ✓), Hard Outs 0.61 (≥ 0.3 ✓), Criticals 17.9% (✓), Failures 9.4% (just under 10), Silk: 81% of spiders spend at least half (✓).

**What P4 does not fix.**
- **Loss stays rare (≈ 0.2% at Hard, not ≥ 3%).** A Loss needs every spider Out *at the same time*. Replacements arrive at the next obstacle, and Outs are spread over five spiders and several obstacles. No one-sentence rule in this search raised it above about 0.3%. Getting to 3% would take a new rule, such as "if the spider carrying the loot is caught at Full Alert, the whole crew is caught". I'd leave Loss rare; the book itself says "Loss is rare".
- **Hits still land only ~29% of the time.** Ch 10 says a solid hit "will get through more often than not". Giving shrug-off ties to the threat makes that sentence true (hits land ~60%) and barely moves the win rate (§5). It's an optional text-consistency fix.
- **Plausible Deniability becomes dominant** (+12.5 pts under P4). With Partials at +1 Alert, a free once-per-scene cancel is worth a great deal. **Once per heist** brings it to +4.4 and Hard to 55% (§5). Recommended. Allergic to Dust (−4.5) and the Bruiser (−4.1) are the weakest options; neither is a trap.
- **The Library (47%) is the hardest Hard heist.** It sits a little below the Hard target, which is acceptable for "an experienced crew".
- **Rolls per heist rise from 10 to 14.** Two rolls per heist obstacle lengthens play by roughly one extra roll per obstacle.
- **Simulator caveats.** There is no grid, so cover, distances and line of sight aren't modelled. The crew's Silk and approach choices come from the simulator's policy, not from players. Humans still have no attack pool unless the strict reading's 3-dice swat applies.

## 8. Exact book text changes

Chapter files are `book/src/chapters/*.html`. The compendium journals in `packs/_source/rules/` (core-rules-rolling-the-dice, the-alert, quick-reference), `packs/_source/species/spitting-spider.json` and `packs/_source/roles/the-tinkerer.json` mirror the same passages and need the same edits (`npm run validate` checks that they match). Old text is quoted exactly, with the book's typographic apostrophes.

### 8a. Clarified baseline

- **C1 — Ch 11, Phase 3**, after "…each with a clear goal, a success outcome, and a failure outcome." add: "A **scene** is one obstacle — heist or Escape. Planning is its own scene, and silk placed during Planning lasts until the heist ends or it’s broken."
  **Ch 12 Silk Line**: "It stays until it’s broken or the scene ends." → "It stays until it’s broken or the scene ends (a line placed during Planning lasts the heist)."
- **C2 — Ch 9, What Raises the Alert, +X row**: "A creature’s own contribution each round it’s active (see its stat block). A creature is active when its Escalation says it’s awake, hunting or pursuing." → "A creature’s own contribution each round it’s active (see its stat block). A creature is active from the first Escalation step the Alert has reached — or from the start, if the heist says it is awake or aware — and it stays active for the rest of the heist. It adds its +X at the end of every round the crew spends at its obstacle, and at every obstacle once it roams (a cat once awake, anything hunting, a guard once aware). Outside turn order, each exchange of crew actions at an obstacle is one round."
- **C3 — Ch 2, Opposed Rolls**: "When you act against something that’s actively resisting — an alert cat, a suspicious human, a vacuum in pursuit — both sides roll. Most Successes wins. Ties go to the defender. When you and the world tie, the world wins; it’s bigger than you." → "When you act against a creature that’s actively resisting — an alert cat, a guard spider, a vacuum in pursuit — it rolls its pool first, and its Successes + 1 become your Difficulty. (A tie still goes to the world; it’s bigger than you.) Then every Difficulty modifier applies as usual — cover, the Alert band, Perks, Flaws — and your roll reads Partial, Success or Critical like any other. Humans and anything else without a stat block use their Chapter 15 Difficulty."
  **Ch 3, Cover**: "Increase the Difficulty to spot or target you by 2." → "Your Stealth Difficulty against anything you have cover from drops by 2, and anything trying to target you rolls at +2 Difficulty." Make the same side-of-the-roll rewrite for **Crab Spider** ("the Difficulty to spot you increases by 2" → "your Stealth Difficulty drops by 2"), **I Was Never Here** and **Arachnophobe Magnet** ("The Difficulty to be spotted by humans is reduced by 1" → "Your Stealth Difficulty against humans is increased by 1").
- **C4 — Ch 2**, new paragraph after Assists: "**Group Checks.** When the whole crew must get past the same thing — sneak across a room, climb a cabinet, run for the vent — every spider rolls, and each one gets through on its own result. The round raises the Alert only once, by the worst result among those rolls, and a Critical lowers it only if every roll was a Critical."
- **C5 — Ch 2, Failure**: after "Every failure should cost something and reveal something." add: "You may try again next round, and an engaged threat that sees you fail lands a hit (Chapter 10). If the crew is still stuck after five rounds at one obstacle, the ST ends it: in the heist the objective slips out of reach; in the Escape, anyone still inside is caught."
- **C6 — Ch 2, Partial Success**: "The ST picks the complication — ideally the funniest one that also actually costs you something." → "The ST picks the complication — ideally the funniest one that also actually costs you something. By default it’s noise: the Alert rises by 1. The ST may swap that for a complication that costs as much — a dropped item, −1 die on your next roll, a hit from a threat that’s engaged — but never both."
  **Ch 9 table**, new row under the first: "+1 — A Partial Success’s complication (unless the ST chose another cost)."
- **C7 — Ch 9, At Limit row**: "The location is compromised. If the crew doesn’t have the objective yet, it’s out of reach. Escape is the only play, and it will be memorable. If they do have it, they just need to get out." → "The location is compromised for the rest of the heist: the Alert stays at the Limit — nothing raises or lowers it — every roll takes the Lockdown penalties (all +1, Stealth +2) whatever the Limit, and creatures act as at Alert 7+. If the crew doesn’t have the objective yet, it’s out of reach. Escape is the only play, and it will be memorable."
  **Ch 9, after the table**: "At a Limit of 6 or less, the location hits Full Alert before Lockdown — lower Limits skip the later bands entirely. That’s what makes them hard." → "At a Limit of 6 or less, the location hits Full Alert before it ever reaches Lockdown — and Full Alert brings the Lockdown penalties with it. That’s what makes them hard."
  **Ch 9 intro**: "The Alert only goes up during a heist. The one exception is a Critical Success, which drops it by 1 (only on a roll of Difficulty 2 or higher)." → add "…— and never once the location is at Full Alert." (Under P4, "2" becomes "3" as well; see R4.)
- **C8 — Ch 11, Casing**: after "…the type of lock on the case." add: "Casing reveals at most what the ST is holding — extra Successes buy nothing — and it never reveals the unknown obstacle."
  **Ch 5, Familiar Face**: "You know one true detail about the target or location that wasn’t in the briefing." → "…that wasn’t in the briefing (never the unknown obstacle)."
- **C9 — Ch 11, Preparation**: "Pre-place one Silk Line on a route you know." → "Pre-place one Silk Line on a route you know. It lowers that obstacle’s Difficulty by 1; it doesn’t skip it."
- **C10 — Ch 4, Precision Application**: "Fire a precise silk-and-venom strand up to 6 squares, no roll to hit, as long as you have line of sight." → "Once per scene, fire a precise silk-and-venom strand up to 6 squares, no roll to hit, as long as you have line of sight." and after "…pin a small target in place for one round." add "A jammed sensor stops sensing; a jammed lock or latch stays shut."
- **C11 — Ch 5, I Made a Thing, Bypass**: "defeat one small mechanical obstacle within reach — jam a sensor, pop a simple latch, wedge a drawer — no roll." → "your Engineering roll against one small mechanical obstacle within reach — a sensor, a simple latch, a drawer — is at −1 Difficulty. It doesn’t work on a lock the heist names as its key obstacle."
- **C12 — Ch 9, Alert Thresholds, 5–6 Active**: "No roll penalty yet." → "The Stirring Stealth +1 still applies; no new penalty yet." **Ch 21, Thresholds**: "5–6 Active: threat wakes, no roll penalty" → "5–6 Active: threat wakes, Stealth +1 continues".
- **Ch 21, Quick Reference**: add rows for C3 ("Opposed: the creature’s Successes + 1 = your Difficulty"), C4 ("Group check: everyone rolls; the Alert takes the worst result, once") and C7 ("Full Alert: permanent; Lockdown penalties; the Alert stops at the Limit").

### 8b. Package P4

- **R1 — 5–6 Successes.**
  **Ch 2, The Core Mechanic**: "Every die showing 4, 5, or 6 is a Success." → "Every die showing 5 or 6 is a Success."
  **Ch 2, The One Rule**: "Count every 4, 5, or 6 as a Success." → "Count every 5 or 6 as a Success."
  **Ch 2, Example**: "She rolls five Successes and flings the door open" → "She rolls three Successes and flings the door open."
  **Ch 16, intro**: "roll the listed pool and count 4+" → "roll the listed pool and count 5+".
  **Ch 21, Success**: "Each die showing 4, 5, or 6" → "Each die showing 5 or 6".
  The Botch die keeps "1–3 Botch, 4–6 clean failure" (the simulator keeps it).
- **R2 — Partial needs half.**
  **Ch 2, Partial Success**: "At least one Success, fewer than needed." → "At least half the Successes you need (round up), but fewer than all of them."
  **Ch 2, Failure**: "Zero Successes." → "Fewer than half the Successes you need (at Difficulty 1–2, zero)."
  **Ch 21**: "Partial — 1+ Successes but short of the target" → "Partial — at least half the target (round up) but short of it"; "Failure — 0 Successes" → "Failure — fewer than half the target".
- **R3 — two rolls per heist obstacle.**
  **Ch 11, Phase 3**, after the C1 sentence add: "A heist obstacle takes two successful rolls (Partial or better) — one to get into position, one to do the job — by the same spider or by different ones. A group check (Chapter 2) is still one roll per spider, and Escape obstacles take one."
  **Ch 21, Phase 3**: "3–4 obstacles." → "3–4 obstacles, two successful rolls each."
- **R4 — Critical Alert drop at Difficulty 3+.**
  **Ch 2, Critical Success**: "(only on a roll of Difficulty 2 or higher)" → "(only on a roll of Difficulty 3 or higher)". **Ch 9 intro** likewise.
  **Ch 21**: "(Difficulty 2+ only)" → "(Difficulty 3+ only)"; "Critical Success only (Difficulty 2+)" → "Critical Success only (Difficulty 3+)".
- **R5 — at most +2 non-Silk bonus dice.**
  **Ch 2, Assists**, add at the end: "However many helpers and abilities pile in, a roll gains at most +2 bonus dice from Assists, Perks, Signature Moves and intel together. Silk Point dice don’t count toward that limit."
  **Ch 21, Pool**: "Attribute + Skill (+ any bonus dice)" → "Attribute + Skill (+ at most 2 bonus dice, plus any Silk dice)".
- **R6 — Full Alert capture.**
  **Ch 9, At Limit row** (after the C7 text): add "During a Full Alert Escape, a spider who fails a roll is caught — Out."
  **Ch 21, Limit**: "Limit: Full Alert" → "Limit: Full Alert (a failed Escape roll = caught)".
- **R7 — Silk advice.**
  **Ch 8, Silk Point Management**: "The classic mistake is spending Silk Points early on small problems and having none when the Alert is at 7 and the cat has found the bag. Start conservative; spend big when it matters. Your strategy should shift as the Alert climbs: early on, hoard — small failures aren’t worth big spends. As the Alert nears its limit, switch to preventing failures rather than recovering from them. A 1 SP die before a roll at Alert 6 is worth more than a 3 SP Silk Clutch after a roll at Alert 8." → "The classic mistake is finishing a heist with Silk still in the pool — you start the next job fresh, so unspent Silk is wasted. Spend it on any roll that matters, from the first obstacle on, and remember that a 1 SP die before a roll is worth more than a 3 SP Silk Clutch after one. Keep 3 back only when the Alert nears its Limit, for the Clutch that saves the objective."

### 8c. Heist fixes (P4H)

- **Heist 2 (Ch 19), Suggested Obstacles**: "The guard spider. Professional, alert, doing the job. First real opposed roll." → "The guard spider. Professional, alert, doing the job — it is aware of the crew from the moment they’re inside (+1 Alert each round it can see them). First real opposed roll."
- **Heist 5 (Ch 19), Suggested Obstacles**: "The dining room — two staff moving unpredictably, no patrol pattern." → "The dining room — two staff moving unpredictably, no patrol pattern. They are Alert Humans (Deception or Stealth 4)."
- Optional, for a harder Office: **Heist 2 ST Prep**: after "They’re already here." add "They are in the corner office when the crew arrives — the unknown obstacle stands between the crew and the drawer."

### 8d. Optional companions

- **Ch 5, Plausible Deniability**: "Once per scene, when the crew does something…" → "Once per heist, when the crew does something…" (recommended; §7).
- **Ch 10, Taking Hits**: "You meet or beat the attack’s Successes — you shrug it off." → "You beat the attack’s Successes — you shrug it off."; "The attack beats you by 1 or 2 — drop one level." → "The attack ties you or beats you by 1 or 2 — drop one level."; "You’re the defender here, so ties go to you." → "Ties go to the threat."; and delete "(The exception is taking a hit, where you are the defender — see Chapter 10.)" from Ch 2 Opposed Rolls. **Ch 21**: "…meet/beat = no drop; lose by 3+ = drop 2. Ties to you." → "…beat = no drop; tie or lose by 1–2 = drop 1; lose by 3+ = drop 2." Makes Ch 10's "more often than not" true. Win rates barely move.

## 9. Foundry code that would have to change

- **`module/logic/rules.mjs`**
  - `SUCCESS_FACE = 4` → `5` (R1). Update the doc comment "A d6 face of 4, 5, or 6".
  - `classifyResult`: `if (s <= 0) return "failure";` → `if (s < Math.ceil(d / 2)) return "failure";` (R2; still returns failure at 0 for D1–2).
  - `CRITICAL_ALERT_MIN_DIFFICULTY = 2` → `3` (R4).
  - `classifyBotch` is unchanged.
  - `alertForResult` needs a "no drop at Full Alert" check (C7). It can take the Alert state as a third argument.
- **`module/config.mjs`**
  - `HEISTY.results.critical.blurb` "Difficulty 2 or higher" → "Difficulty 3 or higher, never at Full Alert".
  - `HEISTY.results.partial` keeps `alert: 1`, which is C6's default. Its blurb could say "+1 Alert, or a complication that costs as much".
  - `HEISTY.results.failure.blurb` should describe R2.
  - `HEISTY.getAlertState`: when `atLimit`, return `stealth: 2, all: 1` whatever the band (C7), and state that in the description.
  - `HEISTY.alertTriggers`: add the Partial row (C6).
- **`module/helpers/alert.mjs`**: `set()` / `applyDelta()` must clamp the value at the Limit once it is reached, and ignore decreases while at Full Alert (C7).
- **`module/helpers/dice.mjs`**
  - The comments say "count every 4, 5, or 6" and "Alert −1 at Difficulty 2+" (lines 4–6, 220). The faces' `success` flag already reads `SUCCESS_FACE`.
  - The roll dialog lumps every bonus into `choice.bonus`. R5 needs a separate Silk-dice field, with the other bonus capped at +2.
  - C3 needs an "opposed: the creature rolls" option that rolls the threat's pool and sets Difficulty = Successes + 1.
- **Templates**
  - `templates/actor/threat-body.hbs`: "each die 4+ is a Success" → "5+".
  - `templates/hud/alert-meter.hbs`: the −1 button title "Critical Success at Difficulty 2+" → "3+".
- **Tests**: `test/rules.test.mjs` asserts the current constants: `countSuccesses([1..6]) === 3`, and the "Critical … Difficulty 2 or higher (ruling 28)" test. Both must be updated with the rules.

## 10. What changed in the simulator

- **`sim/params.mjs`**
  - New `pkg: true` parameters, kept out of `run.mjs`'s sweeps. Their defaults are the book as written, so `node sim/run.mjs` reproduces REPORT.md exactly. The parameters are: `successFace`, `critRule` (`double`/`plus3`/`plus2`), `partialRule`, `critAlertMinDiff`, `bonusCapScope`, `obstacleDiffShift`, `limitShift`, `humanAlert`, `pdLimit`, `hitTies`, `fullAlertFailure`, `fullAlertRule`, `casingRule`, `preLineRule`, `bypassRule` and `heistTweaks`.
  - New values `creatureRolls: "rolled"` and `groupRolls: "worstAlert"`.
  - New exports `CLARIFIED`, `PACKAGES` and `packageParams()`.
- **`sim/engine.mjs`**: every die count, result and probability goes through the package parameters (`succ`, `classify`, `outcomeDist(n, d, face, critRule, partialRule)`). It also implements rolled Difficulties, group checks (`resolveGroup`), the Full Alert lock, the pre-placed-line and Bypass rules, the Silk-inclusive cap, Full Alert capture, and per-spider Silk-spent tracking.
- **`sim/heists.mjs`**: `HEIST_TWEAKS` and `applyHeistTweaks`.
- **`sim/run.mjs`**: `--package X` lays the clarified baseline and a package over every reading. It writes `sim/REPORT-X.md` by default.
- **`sim/packages.mjs`** (new): the comparison CLI (`--packages`, `--rules '{…}'` for ad-hoc packages, `--tables loo,tweaks,spend`).
- **`test/sim.test.mjs`**: five new tests, covering package dice rules, the Full Alert lock, the Critical floor, group checks, and every package running reproducibly.

Other levers tried at 1,000 runs per heist and rejected:
- Alert Limits −2 (Easy 8 / Standard 6 / Hard 4): with 5–6 Successes, Standard 94% and Hard 90%.
- Difficulty +1 with 5–6 Successes: Standard 95%, Hard 97%.
- A +1/round Alert Contribution for humans: with two rolls per obstacle it sends Hard to ~20%.
- Crew-wide rolls where every spider's Alert counts (the strict reading): only 3–4 pts harder than C4, and it contradicts the group-check fix the playtests asked for.

## 11. Package P5 — the v4.7 rules rulings (REVIEW.md Part E)

P5 is P4H plus every Part E ruling that changes a roll the simulator makes. Each is a `pkg: true` parameter whose default is the v4.6 behaviour, so P0–P4H are unchanged (P4H still reproduces 87.9 / 76.7 / 55.5).

| Parameter (P5 value) | Ruling | Part E |
|---|---|---|
| `silkStart: "base+1"` | Silk = WIT + NERVE + 1, without the species bonus | E10 |
| `stallClock: 3` | A Mid-Heist Complication when the crew starts a third round at one obstacle, with the new Effect column | E14, E25 |
| `lootCarry: "sled"` | Treasure: 1 SP silk sled, or an extra threat round at the first Escape obstacle | E5 |
| `passChecks: "partial"` | A Partial passes a pass/fail check (Allergic to Dust, Fear of Vacuums, That All You Got?) | E12 |
| `guardRules: "paid"` | A bribed Guard Spider stops being aware | E24 |
| `improviseAttr: "skill"` | Improvise uses the new Skill's own Attribute | E20 |
| `wolfShrug: true`, `rerollFix: true` | Run It Again works on shrug-offs; rerolls reroll every non-Success die (the v4.6 sim left 4s) | E7 |
| `showOffRule: "plus1"` | Show-Off: Difficulty 4, or +1 if already 4+ | E13 |
| `earlyWarningAll: true` | Early Warning reads any threat at the obstacle | E19 |

`node sim/packages.mjs --packages P4H,P5 --runs 5000 --seed 1`:

| Heist data | P4H easy · std · hard | P5 easy · std · hard | P5 Hard Loss |
|---|---|---|---|
| v4.6 Chapter 19 (committed `heists.mjs`) | 87.9 · 76.7 · 55.5% | **88.6 · 78.8 · 57.0%** | 0.11% |
| v4.7 Chapter 19 (commit 86fd603, REVIEW Part F) | 90.1 · 75.7 · 57.9% | **90.1 · 77.7 · 59.3%** | 1.86% |

On the v4.6 heists: Critical 18.0%, Failure 9.6%, 82% of spiders spend at least half their Silk, mean starting Silk 5.9 (unchanged).

**Each ruling's weight** (P5 minus that one ruling, 2,000 runs per heist, v4.6 heists; Easy / Std / Hard points): pass/fail checks +1.1 / +0.7 / +1.8; starting Silk +0.6 / +0.5 / −0.1; the clock −0.5 / −0.7 / −1.0; Show-Off 0 / −0.6 / −0.5; rerolls 0 / +0.2 / +0.3; Improvise's Attribute 0 / +0.1 / +0.4; guard pay-off 0 / +0.1 / 0; Treasure carrying 0 / 0 / −0.2; Wolf on shrug-offs and Early Warning ±0.1.

**Tested and rejected** (the parameters stay in `params.mjs` for the record):
- `creatureDefeat: "critical"` — a Brawl or Intimidation Critical drives a creature off for the whole heist: Office +14 pts (the aware guard is its whole difficulty). v4.7 drives a creature off for its obstacle only, which the sim already did.
- `guardRules: "full"` — backup at Alert 7 or Full Alert, +2: at Limit 8 that is Full Alert almost every time. Office −7.
- `faceVsGuard: true` — Fast Talk can't distract the guard: Office −3.6. v4.7 reads "charm" as Persuasion only.
- `cellarPhase: true` — a Cellar Ghost's Phase Through brings a crewmate: Pet Store +1.4. v4.7 gives the rider to the loot instead.
- `stallEvery: 2` — the clock again on round 5: no measurable effect.

**Loss** stays rare by design (REVIEW E44): 0.1% at Hard on the v4.6 heists. The v4.7 Chapter 19 Escapes raise it to about 2% (Restaurant 3.5%).
