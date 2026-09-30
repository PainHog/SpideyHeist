# Heisty Spideys — Automation Design (system 1.8.0)

> **Goal (the author):** "Make sure players and the storyteller don't need to 'handle things' in the VTT. The system should be able to do everything."
>
> **Principle:** the system does all bookkeeping; where the rules require a human judgement, the Storyteller (ST) gets **one click with a rules-correct default**, never a form to fill in or a number to track.

Rules source: `book/src/chapters/*.html` (v4.7) and rulings in `book/REVIEW.md` Parts C–F. Section 15 lists the places where this design had to pick an interpretation, for the author to confirm.

---

## 0. Where we start (1.7.0)

| Area | Today | Gap |
|---|---|---|
| Alert | World setting `alert` + `alertLimit`; Full Alert lock (`nextAlertValue`); HUD; GM-only ±buttons on cards marked "suggested" | Nothing is applied automatically; no one-event dedupe; no creature per-round Alert |
| Dice | `helpers/dice.mjs`: dialog (Difficulty, modifier, bonus capped at +2, Silk dice, penalty, opposed-by-threat, Alert band), Botch, classification | Silk dice don't deduct SP; no post-roll actions (Reroll, Clutch, …); no obstacle context |
| Vitality | Sheet ladder, derived penalty/speed | No hits, shrug-offs, recovery, Out or Waiting Web |
| Usage limits | None | Once per scene / heist / round for Perks, Signature Moves, species, Flaws |
| Heist structure | Journals (HTML only); structured data exists only in `sim/heists.mjs`, which is excluded from the release | Phases, obstacles, two successes, group checks, rounds, clock, stall, creatures, loot, Debrief |
| Socket | `helpers/socket.mjs`: player → GM spider creation | Generic GM-authoritative operations |

Constraints kept from the codebase:
- Pure logic lives in Foundry-free modules tested with `node:test` (like `module/logic/rules.mjs`).
- The validator knows only 13 Handlebars helpers, so **no new helpers**: precompute booleans in `_prepareContext` / card data.
- Compiled packs must match `_source`, so **no pack edits are needed**. Items and creatures are matched by slugified name, which equals the pack keys (for example `slug("Spider-Sense… Sort Of") = "spider-sense-sort-of"`).
- Release zip: add `-x "docs/*"`.

---

## 1. Architecture

```
┌──────────────────────── UI ─────────────────────────┐
│ Spider/Threat/Item sheets (A) · Roll dialog & cards (B) · Heist Tracker, heist cards, Alert HUD (C) │
└──────────────────────────────────────────────────────┘
┌──────────────────────── Runtime ─────────────────────┐
│ actor-ops (A)   dice / card-actions / hit-flow (B)   heist store · automation hooks · gm-ops · waiting-web (C) │
│   players write only their own actor + own messages; everything else = GM op (C/gm-ops)            │
└──────────────────────────────────────────────────────┘
┌──────────────── Pure logic (node:test) ──────────────┐
│ keys · abilities · advancement · speed · waiting-web (A)                                         │
│ rolls · hits (B)                                                                                 │
│ alert-ledger · heist-flow · creatures · complications · heist-catalog · grid (C)                 │
│ existing: rules.mjs, config.mjs                                                                  │
└──────────────────────────────────────────────────────┘
module/contracts.mjs (WP-0, constants only)  ·  module/heisty-spideys.mjs wiring (D)
```

**Three mechanisms carry the design:**

1. **The heist clock.** `{heistId, phase, sceneSerial, obstacleSerial, roundSerial, round}`.
   - Every "once per X" use is recorded as a stamp of that clock on the item.
   - An ability is available again when the stamp differs from the current clock, so **per-scene resets need no writes at all**.
   - "A scene is one obstacle — heist or Escape. Planning is its own scene": `sceneSerial` increases on Planning start and on every obstacle start.

2. **The Alert ledger.** Every change to the Alert is an entry keyed by an `eventId` (a roll's message id, a group check id, `creature:<id>:<roundSerial>`, `out:<actorId>:<sceneSerial>`, …).
   - Entries sharing an `eventId` apply **only their largest trigger**: "one event, one trigger".
   - The value is a pure fold that includes the Full Alert lock and the floor of 0.
   - Reactions that "cancel", "reduce" or "negate" (That's Not What Happened, Plausible Deniability, Abort Abort, Smoke and Mirrors, Damage Control, Not Part of the Plan, Reroll, Clutch) are **amendments** followed by a re-fold. Every one of them is exact and reversible.

3. **The GM client reacts to documents.**
   - A player's roll creates a chat message carrying structured flags.
   - The **active GM's** client handles `createChatMessage`, `updateChatMessage` and `updateActor`, and applies Alert, progress, creatures, capture and Out.
   - Players therefore never need permission to write world state for the main flow.
   - GM operations (via `User#query`) exist only for player actions that touch documents they don't own.
   - If no GM is online, nothing is lost: on `ready` the GM reconciles recent messages whose `eventId` is missing from the ledger.

**Reaction window.** Consequences a reaction can still avert (a threat's hit after a Failure, being caught in a Full Alert Escape) are **pending** on the card. They finalize at **End Round**, when the same spider makes its next roll, or when the player clicks **Accept**. The Alert moves immediately (Ch 17: "update the Alert visibly") and is amended if a reaction cancels it.

---

## 2. Heist state (world setting `heistState`, written only by the active GM)

```js
{
  v: 1, heistId, catalogKey, name, journalUuid, difficulty: "standard", limit: 8,
  phase: "idle"|"score"|"planning"|"heist"|"escape"|"debrief",
  sceneSerial, obstacleSerial, roundSerial, round,          // the heist clock
  obstacles: [{ id, name, phase: "heist"|"escape", kind, tags: [], threats: [], awake: [],
                unknown, revealed, objective, keyLock, silkLinePrepared,
                approaches: [{ id, skills: [], difficulty, opposed: {creature, roll}|null,
                               mode: "individual"|"single", alertOnUse: 0, fight: false,
                               excludeRoles: [], note }],
                status: "pending"|"active"|"cleared"|"stalled"|"skipped" }],
  current: obstacleId|null,
  progress: { [obstacleId]: { rolls: { [messageId]: { actorId, approachId, pass } },
                              manual: 0, passedActors: [], cleared: false } },
  groups: { [groupId]: { obstacleId, approachId, round, expected: [actorId], rolls: { [actorId]: messageId }, closed } },
  acted: { [roundSerial]: [actorId] },
  crew: [{ slot, actorId, userId, status: "present"|"waiting"|"out"|"escaped", arrivesAtSerial }],
  creatures: [{ id, actorUuid, key, name, atObstacles: [], engaged, state: {
                 active, hunting, aware, pursuit, bad, paid, onMap, drivenOffAt, suppressedUntilRound, spikesFired: [] } }],
  effects: [{ id, kind: "diff"|"dice"|"noCover"|"npcDistracted"|"escapeDiff", value, skills, actors,
              excludeActors, jobOnly, untilRoundSerial, untilSceneSerial, label, source }],
  crewUsage: { damageControl: null|{eventId, pledges}, notPartOfThePlan: null|{ref, actorId} },
  intel: { list: [{ id, text, obstacle, revealed }], casingRolled: [actorId] },
  preparations: { [actorId]: { kind, text, obstacleId, complication, free } },
  contingency: null|{ actorId, trigger, rollDesc, used },
  loot: [{ id, name, tier, carriers: [actorId], sled, status: "inPlace"|"carried"|"dropped"|"lost"|"escaped", incomplete }],
  objective: { taken, lost }, fullAlert: { atObstacle: null },
  assists: [{ carrier, passenger }],                         // Critical spiders being moved
  flawSchedule: [{ actorId, flawKey, dueRoundSerial }],
  procedures: { [procId]: { lastRoll, timerStartedRound } },
  alertLedger: [/* see §3.1 */], log: [{ t, text }],         // log capped at 200
  debrief: { outcome: null, awarded: false }
}
```

The store (`module/heist/store.mjs`, WP-C):
- Serializes every write through one promise queue on the active GM.
- Performs every mutation as a **pure** function from `heist-flow.mjs`, then `game.settings.set`.
- Fires `Hooks.callAll(HOOKS.heistChanged, state, diff)`.
- On change, every client re-prepares the crew actors (Speed from loot/assists) and re-renders the tracker.

When no heist is running (phase `idle`), the Alert ledger and usage stamps still work against a "freeplay" clock: `heistId: "freeplay"`, and `sceneSerial` bumps when the GM uses a **New Scene** button on the HUD.

---

## 3. Feature designs

### 3.1 Automatic Alert (ledger, one event → one trigger)

**Ledger entry:**

```js
{ id, eventId, seq, round, roundSerial, obstacleSerial, cause, source: {messageId, actorId},
  triggers:  [{ key: "failure"|"partial"|"botch"|"critical"|"spotted"|"confirmed"|"loud"|"fightLanded"
                     |"approach"|"clutch"|"creature"|"spike"|"out"|"capture"|"complication"|"manual", delta, label }],
  cancels:   [{ key: "thatsNotWhatHappened"|"plausibleDeniability"|"abortAbort"|"smokeAndMirrors"|"notPartOfThePlan"|"noConsequence", by }],
  reductions:[{ key: "damageControl", delta: -1, by: [{actorId, sp}] }],
  group: null|{ id, closed, allCritical },
  type: "event"|"set"|"checkpoint", value? }
```

**`eventDelta(entry)`:**
1. Any cancel present → 0.
2. Otherwise, if there are positive triggers → the largest positive trigger.
3. Otherwise, the smallest negative trigger, but only if it is not a group entry, or the group is closed with every roll Critical.
4. Add reductions, but only when the pre-reduction delta is at least 2.
5. Floor the result at 0 whenever any positive trigger existed.

**`foldLedger(entries, limit)`:**
- Start at 0, then add each entry's delta through `nextAlertValue` (the lock and 0…Limit clamp).
- `set` and `checkpoint` entries assign their value directly.
- Returns `{value, locked, lockedByEntryId, peak}`.

**Where triggers come from:**

| Trigger | Value | Source |
|---|---|---|
| Failure / Partial (default complication) / Botch | +1 / +1 / +2 | Roll flags (`rolls.rollAlertTriggers`) |
| Critical at final Difficulty 3+, not at Full Alert | −1 | Roll flags |
| Approach that is loud even on a pass (e.g. "force it: +1 Alert") | +1 | Catalog `alertOnUse` |
| Fight: a Brawl/Intimidation roll against a creature that lands / that is lost | +1 / +2 (Loud Failure) | Roll flags (`fight`) |
| Silk Clutch | +1 | Card action → message update |
| Spotted / Confirmed / Loud Failure | +1 / +2 / +2 | GM buttons on the same card, **same `eventId`**, so "a Failure that gets you spotted is +1, not +2" holds automatically |
| Spider Out; Curious Child capture | +2; +3 on the same `eventId` (max, so it replaces the +2) | Out automation |
| Creature per round; escalation spikes (dog barks +2, parrot shrieks +2, the Rat's deal goes bad +2) | its +X; +2 | End Round; after each fold |
| Mid-Heist Complication 1 (nothing asleep) / 6 | +1 | Clock |
| Make a Scene | +1 ("the only Alert it costs") | Ability use |

**Amendment windows** (GM can override):

| Reaction | Window |
|---|---|
| That's Not What Happened, Plausible Deniability, Abort Abort, Damage Control | Until the end of the current round |
| Reroll / Clutch | While the card is still pending |
| Not Part of the Plan | "Immediately": until the next Alert entry or the end of the round |

If an amendment re-folds the Alert below the Limit after Full Alert was reached, the GM gets a confirm dialog ("This undoes Full Alert"). Creatures that woke stay awake (Ch 9, E27).

**After every fold:**
- The GM client evaluates creature escalations (§3.7). Any spike is a new entry, and the evaluator has a loop guard.
- If the band changed, it posts the band announcement (the existing `_announce`) plus a GM-whispered **Describe it** prompt showing that band's creature and human effects (Ch 18: "describe the change yourself").
- The ledger is compacted into one `checkpoint` entry when an obstacle starts.

**Setting `autoAlert`:**
- `auto` (default): as described.
- `confirm`: entries are proposed and the GM clicks ✓ on a pending strip on the HUD.
- `manual`: today's behaviour. Cards show buttons, with suggested ones highlighted.

### 3.2 Rolling: the roll plan (dialog)

`dice.mjs` builds a pure **roll plan** (`rolls.buildRollPlan`). The dialog shows every part with its source and lets the player untick anything auto-detected.

- **Obstacle binding:**
  - When a heist obstacle is active, the dialog lists that obstacle's approaches using this skill, and picking one fills Difficulty, opposition, `alertOnUse` and `fight`.
  - "Other" allows a free roll.
  - If the called skill differs from the rolled one, an **Improvise (2 SP)** toggle adds +1 Difficulty and uses the new skill's own Attribute (E20).
  - From the tracker, **Roll this approach** opens the dialog pre-bound.
- **Automatic Difficulty modifiers:**

  | Modifier | Effect |
  |---|---|
  | Alert band | As today |
  | Cover (checkbox; disabled by Complication 5) | −2 on Stealth |
  | Height | +1 on Acrobatics (preset from obstacle tag `height`); Don't Look Down removes it |
  | Soundless, while moving | −1 on Stealth |
  | Loud flaw at Alert 5+ | +1 on Stealth |
  | Arachnophobe Magnet vs a human (preset from tag `human`) | +1 on Stealth |
  | Crab camouflage | −2 on Stealth |
  | I Was Never Here (checkbox "make them forget") | −2 |
  | Pre-placed Silk Line | −1 on this obstacle |
  | I Know a Way, Escape Routes (while that spider leads) | −1 on Escape rolls |
  | Bypass (pending, not on the heist's key lock) | −1 on Engineering |
  | Show-Off (armed by the ST) | Difficulty 4, or +1 if already 4+ |
  | Complication effects | Stealth +1 or −1 |
  | Human row | Difficulty from the row |
  | Final Difficulty | Minimum 1 |

- **Dice:**
  - Vitality penalty, with Unfazed ignoring Rattled.
  - Bonus dice, capped at +2 in total: Assist, Tactical Feed, Boost, I Called It, Actually I Planned This, Decoy (job rolls only), Make a Scene (other spiders only), Drafting, Negotiating Position, The Long Con, Method Actor, GM-entered intel.
  - Silk dice (1 SP each, uncapped) and Overclock (1 SP → +2 Engineering dice, counted as Silk), both limited by available SP.
  - Penalty dice.
  - Queued ("pending") bonuses on the actor are listed and pre-ticked, and consumed after the roll.
- **Opposed:** unchanged (creature rolls first; its Successes + 1). Humans are excluded from the list (E4).
- **Silk deduction:**
  - Extra dice, Improvise and Overclock are deducted on **Roll**, in the same `actor.update` as consuming pending bonuses.
  - Everything is re-checked against the current `silk.value` and usage. The dialog's max is bounded by SP.
  - Setting `autoSilk` off → nothing is deducted and SP is shown as advice only.
- **Phases:** in `score` a notice says there are no rolls. In `planning` the Alert is off; Perception or Tactics rolls are offered as **Casing**. In `heist` and `escape` everything applies.
- **Flags written:** see §7.

### 3.3 Roll-card buttons (spend Silk, reactions)

Buttons render per client, depending on ownership, SP, usage and result. Every click re-validates. Actions on the player's **own** card update that message directly, since authors may update their own messages. Actions that touch other documents go through a GM operation.

| Button | Who / when | Effect (automatic) |
|---|---|---|
| **Reroll (2 SP)** | Owner; any result except Critical; can repeat | Rolls `min(3, non-Successes)` d6, **keeps the Successes**, re-classifies and appends the Roll. Alert entry re-triggered; progress recomputed |
| **Silk Clutch (3 SP)** | Owner; result `failure` only (E1) | Result becomes Success (`clutched`); triggers become {clutch +1}; progress counts; a Full Alert Escape capture is voided |
| **Run It Again** (Wolf, once/scene, free) | Owner; Failure/Partial on a chase, pursuit or physical roll (preset for Athletics/Brawl, ticked in the dialog, or any shrug-off) | Rerolls every die that didn't succeed; keeps the Successes |
| **Silver Tongue** (free, once per roll) | Owner; failed Persuasion | Rerolls the whole roll once |
| **That's Not What Happened (2 SP, once/heist)** | Any Face owner; any roll, spider or threat, this round | Cancels that event's Alert; the card notes "no progress" on a Failure |
| **Plausible Deniability** (once/heist) | Face owner; event delta exactly +1 from a crew action | Cancels it |
| **Abort, Abort** (once/heist) | Wheelman owner; a Failure's Alert | Cancels it; the tracker offers "retreat" (the spider leaves the obstacle unpassed) |
| **Smoke and Mirrors** | Automatic on a failed Deception | Cancel `smokeAndMirrors` is written at roll time |
| **Contingency** (GM, once/heist) | The recorded trigger happened | Result becomes Success; all Alert and complication cancelled |
| **Show-Off Flaw Moment** | Automatic | +1 SP when the armed roll costs (Failure/Partial) or is a Critical |
| **Spectacular Failure +1 SP** | GM, on Failure/Botch | Awards SP |
| **Partial: swap complication** | GM, on Partial | Default +1 Alert stays applied. One click swaps to: *−1 die next roll* (pending penalty), *drop an item/loot* (loot → dropped), *hit from an engaged threat* (§3.8), or *custom (text)*. Each swap adds cancel `swapped` to the Alert entry |
| **No consequence** | GM, on Failure | Cancel `noConsequence` (for "a roll fails **with a consequence**") |
| **Spotted +1 / Confirmed +2 / Loud Failure +2** | GM | Triggers on the same `eventId` |
| **Engaged threat lands a hit** | GM, on Failure (or automatic, §3.8) | Opens an attack card |
| **Accept** | Owner | Finalizes pending consequences now |

**Pre-roll spends** that aren't tied to a card are on the sheet's **Spend Silk** menu:
- Silk Line (1 SP), which posts a card and counts as the Action.
- Web Structure (2 SP).
- Silk sled (1 SP), which marks the Treasure loot as sled-hauled.
- Delay a Flaw (1 SP), which pushes that Flaw's schedule back one round.

**Crew spends** appear on **Alert-spike cards** (any entry with delta ≥ 2) and complication cards:
- **Damage Control (3 SP between the crew, once/heist).**
  - Any crew owner can click **Chip in** and pick 1–3 SP.
  - Pledges collect on the GM-owned card through a GM op.
  - When pledges reach 3, the GM deducts from each pledger, adds the −1 reduction and marks crew usage.
  - The window closes at the end of the round.
- **Not Part of the Plan (4 SP, one payer, once/heist).** Shown on system complications:
  - Partial complications, Mid-Heist Complications and escalation spikes are negated automatically: cancel the entry or remove the effect.
  - ST-narrated complications use the tracker's **Not Part of the Plan** button, which records the spend and posts "the ST's last complication doesn't happen".

### 3.4 Group checks

1. The GM clicks **Group check** on an approach with mode `individual`, or on any approach.
2. The tracker creates `groups[id]` with `expected` = present crew not yet passed, and posts a **Group Check** card with a **Roll** button per spider (shown to that spider's owner and the GM).
3. Every roll carries `groupId`, and all of them share **`eventId = groupId`**, so the Alert rises once, by the largest trigger (§15-Q1).
4. A Critical's −1 counts only if the group closes with every roll Critical, each at a final Difficulty of 3+.
5. Each spider passes on its own result (Partial or better). A spider that failed retries next round.
6. The group closes when every expected spider has rolled, or when the GM clicks **Close**.
7. Drafting: if a Wheelman with Drafting leads (a tick on the card) and the approach is movement (Athletics, Acrobatics, or Stealth while moving), every other roller gets +1 bonus die.

### 3.5 Obstacles, rounds, the clock, stall, retries

- **Progress** is keyed by message id, so it is idempotent under rerolls and Clutches.
  - A `single` obstacle is cleared at **2 passing rolls in the Heist, 1 in the Escape**.
  - An `individual` obstacle is cleared when every present spider has passed.
  - Either rule clears it. The GM has +1 / −1, "mark spider passed" and "mark cleared".
  - A Critical counts as one pass (§15-Q7).
- **Rounds.**
  - The tracker shows the round and who has acted: a roll, an Assist, an ability or **I acted** counts.
  - `autoEndRound = prompt` (the default): once every present spider not yet through has acted, the GM gets a one-click toast **End round**. `auto` ends the round without asking.
  - If a Combat encounter exists, `updateCombat` round changes end the round, and initiative is set so the crew goes first (Ch 3).
- **End Round** (pure `heist-flow.endRound` → actions):
  1. Creature contributions (§3.7).
  2. Heist procedures that roll at round end, e.g. Heist 5's staff d6 or Heist 4's librarian, whispered to the GM.
  3. Round effects expire.
  4. Pending consequences finalize.
  5. Due flaw delays fire.
  6. Quiet-round recovery prompt (§3.9).
  7. Five-round stall check.
  8. `round++`, `roundSerial++`.
- **Clock** (E14): when the crew **starts round 3** at one obstacle, the system rolls the Mid-Heist Complication and applies it (setting `autoClock`). It is posted as a complication card with Not Part of the Plan available.

  | Result | Application |
  |---|---|
  | 1 | The first inactive creature in the heist's list wakes. The GM prompt allows another pick ("nearest"). Nothing asleep → +1 Alert |
  | 2 | The GM is shown the next unrevealed intel (never the unknown obstacle), with **Reveal** |
  | 3 | Effect: Stealth +1 this round and next. Also starts Heist 1's water-run procedure if loaded |
  | 4 | Effect: Stealth −1 this round. Every spider with Fear of Vacuums gets a forced NERVE D3 roll button; a Failure loses its Action and pays the Flaw Moment |
  | 5 | Effect: no cover this round |
  | 6 | +1 Alert |

  A manual **Nudge** button rolls the table at any time ("when the night needs a nudge").
- **Stall:** at the end of round 5 with the obstacle not cleared, the GM gets **Five rounds: end it**. It is pre-filled with the consequence:
  - In the Heist: the objective slips out of reach (`objective.lost`), and the tracker proposes the Escape.
  - In the Escape: every spider not through is caught (Out).
- **Advance:** **Next obstacle** runs End Round if the round wasn't ended, then does, in order:
  1. The gap: recovery and loot pickup.
  2. Waiting Web arrivals: tokens placed next to a crewmate.
  3. `sceneSerial++`, `obstacleSerial++`, `round = 1`.
  4. Creature `atObstacles` and "awake from start" flags.
  5. Early Warning, I See How This Works and Spider-Sense prompts to the GM.

### 3.6 Heist Tracker app (`module/apps/heist-tracker.mjs`)

ApplicationV2 + HandlebarsApplicationMixin, id `heisty-heist-tracker`, light theme. It opens from:
- a scene-control tool ("Heist Tracker"),
- `game.heistySpideys.openTracker()`,
- dropping a heist journal on it.

**GM view parts:**
1. **Header:** heist name, difficulty and Limit, a phase stepper (Score → Planning → Heist → Escape → Debrief), and an Alert mirror.
2. **Obstacle list:** from the catalog (§4), or a custom list edited inline and saved to `JournalEntry.flags[FLAG].heist` of the dropped journal. The unknown obstacle is hidden from players until revealed. Obstacles can be reordered, skipped or added.
3. **Current obstacle:**
   - Approaches, each with **Call for roll** (one spider) and **Group check** (§3.4).
   - Progress pips and per-spider passed chips.
   - Round, **End round**, the clock indicator ("complication at round 3") and the stall indicator.
   - Round effects.
4. **Creatures:** state (asleep, active, hunting, aware, pursuit, bad, paid, driven off here), per-round +X, *engaged* toggle, roll buttons (pool and attack), **Paid off / Deal holds**, **Deal went bad**, **Call the Exterminator** (shown at 7+ / Full Alert).
5. **Crew:**
   - Portrait, Vitality, SP, status, acted this round.
   - Once-per-heist Flaw **Fire** button with a Delay counter.
   - Award buttons: Spectacular Failure +1, Creative Species Use +1, Brilliant Plan +2.
   - Assist and carry links.
6. **Planning:**
   - Casing: each spider's one roll, capped reveal.
   - Preparations: one per spider; kinds are entry (free), pre-placed Silk Line on an obstacle (−1 Difficulty), stash, and perk-granted (free).
   - A complication text box for the GM per preparation.
   - Contingency: trigger and roll.
7. **Loot:** records, carriers (drop a portrait), sled, status, incomplete toggle. Squeeze warnings.
8. **Procedures:** the heist's d6 tables and timers with one-click rolls, auto-rolled when their trigger fires.
9. **Log.**

**Player view** (setting `trackerForPlayers`): phase, current obstacle name and visible approaches with **Roll this approach**, progress, round, revealed intel, their crew panel with **I acted**, loot, and the crew spends available.

**Start Heist:**
1. Choose the catalog heist or journal and the crew. Defaults: player-owned spiders with status active; one per player slot, with a choice of original or replacement.
2. Set the Limit (from the catalog).
3. Reset the Alert with a new ledger.
4. Each crew spider gets `silk.value = silk.max` ("you start every heist with WIT + NERVE + 1") and Vitality Unharmed (§15-Q5); pending bonuses and camouflage are cleared.
5. Import missing creature actors from the pack and map them.
6. Roll heist-start procedures, e.g. Heist 1's secret twin-tin d6, whispered to the GM.

### 3.7 Creatures (activation, escalation, per-round Alert, opposed, drive-off)

`creatures.mjs` holds `CREATURE_AUTOMATION`, keyed by pack key with name aliases; "The Rat" maps to `protection-rat`. A threat's `system.automation.*` fields, when not null, override the table.

| Key | per round (when) | Wakes / active | Hunts | Roams | Attack | Specials |
|---|---|---|---|---|---|---|
| house-cat | +1 (active) | Alert 3 | 7 | always once awake | Pounce 4 | — |
| house-dog | +2 (active) | 2 (smells) | — | always | Chase 4 | Barks at 4: **+2 once** |
| vacuum | +1 (pursuit) | GM or Complication 4 | — | route | Pursuit 3 | Activation triggers Fear of Vacuums checks |
| curious-child | 0 | present | — | always | Capture 3 | Capture → Out with **+3 replacing +2**; tracker adds the second objective; shouting at 7+ |
| guard-spider | +1 (aware) | on being spotted, or catalog `awake` | — | aware | Brawl 3 | Spotted +1 is its trigger; paid off → no +X for the heist; driven off by a fight → **backup** (fresh, aware, same post) |
| corn-snake | +1 (active) | 3 | 7 | hunting | Strike 4 (only when hunting) | — |
| alert-parrot | +1 (repeating, from 5) | 3 mutters, 5 repeats | — | never | — | Shrieks at 7: **+2 once** |
| protection-rat | 0 (deal) | — | — | aware | Brawl 4 (only when bad) | Deal goes bad (a fight, a failed pitch, or leaving with the trap set): **+2 once** |
| the-exterminator | +1 (on map) | only at 7+ / Full Alert, and only if the ST calls him | — | always | Spray 5 | A landed Spray in the open → Out |
| goldfish | 0 | — | — | never | — | — |
| human | 0 | stirs 5, up at 7 / Full | — | per procedure | Swat 3 | Failure within reach → swat; a hit on a Critical spider → under a glass: Out; glimpse +1, loot moving on its own +2 |

Rules applied by `creatures.mjs`:
- **Activation** comes from the first Escalation step reached or from catalog `awake`. It is permanent: "stays active for the rest of the heist".
- **Full Alert counts as every step at once** (E43).
- **Per-round +X** is added at End Round for each creature that is active, not suppressed, not paid, and not driven off at this obstacle, and is either at the current obstacle or roaming. Each creature is its own event (`creature:<id>:<roundSerial>`).
- **Suppression:**
  - Decoy: NPCs investigate for 2 rounds unless they pass Perception D3. The system rolls each creature's Perception automatically, and an NPC needs the full Difficulty.
  - Fast Talk, Make a Scene, Thunderous Entrance (Difficulty 3 check rolled per NPC automatically), I Made a Thing's Distraction and Spitting pins set `suppressedUntilRound` or effects.
- **Drive-off** (E23): when an obstacle is cleared by an approach flagged `fight` (Brawl/Intimidation against its creature), that creature gets `drivenOffAt = obstacleSerial`: no attacks and no +X there. If it roams, it is back at the next obstacle.
- **Opposed rolls** keep the existing dialog. The catalog's `opposed` preselects the creature and pool.
- **Engaged** means any of: the creature is at this obstacle and active, it is hunting, or it is a Full Alert Escape. The GM can toggle it.

### 3.8 Taking Hits (attack card → shrug-off card → Vitality)

1. **Attack card** (WP-B, GM-authored), from any of:
   - the GM's "Engaged threat lands a hit" on a Failure (`autoHits = auto` picks the strongest engaged attacker when the pending consequences finalize),
   - a human swat,
   - a hazard roll's Failure (attack pool = hazard Difficulty, E4),
   - a fall (the GM enters squares; pool `floor(squares / 2)`),
   - a Partial swap,
   - a threat sheet's attack with the GM's targets.

   The card rolls the attack pool and shows the target. **Take the Hit** is shown to an adjacent Bruiser's owner (once/scene, before the shrug-off). It retargets through a GM op, and adjacency is auto-checked from tokens with a GM override.
2. **Shrug it off** is shown to the target's owner and the GM; `forcedRolls = auto` rolls it immediately on the GM client.
   - It rolls BODY + Endurance + the Vitality penalty (Unfazed applies). It is free. With 0 dice it scores 0 Successes and cannot Botch.
   - `hits.resolveHit`: beat the attack → shrug; tie or lose by 1–2 → drop 1; lose by 3+ → drop 2.
3. Vitality is applied immediately on the owner's own actor from the stored `vitalityBefore`, so the result is idempotent.
   - **That All You Got?** rolls automatically when the result would be Critical (D3, pass or fail) and stops at Hurt on a pass.
   - Human glass: a landed hit on an already-Critical target → Out.
   - Exterminator in the open → Out.
   - Capture → Out with the capture trigger.
4. The shrug card offers **Silk Reroll (2 SP)** and **Run It Again** (Wolf, a shrug-off counts, E7). Both re-resolve and re-apply the Vitality change.

### 3.9 Vitality, recovery, Out, Waiting Web

- **Recovery (once per obstacle):**
  - In the gap after an obstacle, every spider not yet recovered during that obstacle recovers one level automatically (§15-Q8). This is stamped with `heist.recoveredSerial = obstacleSerial`.
  - At End Round, if no creature or human at the obstacle is engaged, the GM gets **Quiet round: recover** for the hurt spiders, pre-ticked.
  - **Field Repair** (once/scene, adjacent): Engineering D2 → +1 level to the target through a GM op, threats present or not.
- **Out** (`updateActor` to `out`, from any source, on the active GM):
  1. Alert +2 (or capture +3) on `out:<actorId>:<sceneSerial>`.
  2. Loot the spider carried **alone** becomes `lost`; co-carried loot stays with the others.
  3. The token is hidden.
  4. `crew.status = out`.
  5. Loss check (§3.13).
  6. **Waiting Web.**
- **Waiting Web** (`autoWaitingWeb`):
  1. The GM queries the owner's client (`ui.promptReplacement`): new name (a Ch 20 roll is offered) and an optional species swap. After 60 s, or if the owner is offline, defaults are used.
  2. The GM creates the replacement as a new actor duplicated from the original, owned by the same player, with:
     - same Role, Attributes, Skills, Perks and Flaw;
     - on a species swap, the old bonus removed and the new one added, capped at 5, and the new Speed;
     - **Rattled**;
     - **silk = floor(silk.max / 2)** (starting Silk ignores the species bonus, so a swap doesn't change it);
     - **items copied with their usage stamps** ("carries on with the uses its player has left");
     - `heist.slot` equal to the original's, `replacementOf` set;
     - status `waiting`, `arrivesAtSerial = next obstacle`.
  3. At the next obstacle start the replacement's token is placed on a free square next to any crewmate, and its status becomes present.
  4. Out in the last Escape obstacle → it is "waiting at the exit": status escaped.
  5. The original's `heist.status = "out"`. "Next heist, the player may bring back either spider": Start Heist lists both.

### 3.10 Humans

- Human rows are set on the obstacle or tracker creature: sleeping 2, distracted 1, alert 4, broom 3.
- A roll against a human uses the row's Difficulty. It is never opposed, and Arachnophobe Magnet is preset.
- **Swat:** a Failure with a human in reach (setting `autoHits`: `auto` treats every human at a `human`-tagged obstacle as in reach; `prompt` asks the GM "within reach?") → attack card with Swat 3. On a Critical target a landed swat means Out (§3.8).
- Stir at 5 and up at 7 / Full Alert are announced as GM prompts (the row doesn't change).
- Heist-specific wake triggers are procedures (§4):
  - Heist 1's water run at Alert 7 or Complication 3: timer of 2 rounds to the sink and 1 filling a glass, with a Stealth-D2-vs-them effect while there.
  - Heist 5's sleeper: wakes on a Partial or Failure within 4 squares (prompt), or at Alert 5 (automatic).

### 3.11 Abilities and usage tracking

**Usage lives on items.** `system.usage = {heistId, sceneSerial, roundSerial, count}` on perk, flaw, role (Signature Move) and species (ability) items. Crew-wide uses (Damage Control, Not Part of the Plan) live in `heistState.crewUsage`.

`abilities.usageStatus(def, usage, clock)` decides availability:
- `scene` uses compare `heistId` and `sceneSerial`.
- `heist` uses compare `heistId`.
- `round` uses compare `roundSerial`.

The sheet's Kit tab gets an **Abilities** panel listing Species, Signature, Perks and Flaw, each with a status chip (Ready / Used this scene / Used this heist), a **Use** button and cost.

`ABILITIES` registry (WP-A), keyed by slug. Automation levels: **auto** = applied without a click; **button** = one click by the owner; **reaction** = a card button at the right moment; **prompt** = a GM one-click with a default.

| Ability | Freq | Automation |
|---|---|---|
| Did You See That Jump?! (jumping) | scene | button: marks use, posts an auto-success card |
| Everything Connects (orbweaver) | scene | button: choose Snare or Line; creates an effect that lasts the scene (Line: listed Acrobatics approaches at this obstacle auto-pass for the crew; Snare: GM prompt when a creature enters) |
| Run It Again (wolf) | scene | reaction (roll and shrug cards) |
| Contortionist (cellar) | always | auto: squeeze approaches auto-pass for this spider; the loot squeeze check is skipped only via Phase Through |
| Precision Application (spitting) | scene | button: range checked from the token to a target (6); picks jam / snag / pin. A jammed sensor or latch at a `sensor`/`smallMech` obstacle is offered to the GM as "clears this approach"; a pin suppresses a creature for 1 round |
| Wait, Was That There Before? (crab) | always | button **Hold still**: flag `camouflaged` is set, giving −2 on Stealth; **auto-cleared when the token moves** |
| That's Not What Happened (face) | heist, 2 SP | reaction |
| Phase Through (ghost) | scene | button: marks the spider passed at a movement obstacle, no roll, no Alert; a Cellar Ghost takes the loot through regardless of size |
| I Made a Thing (tinkerer) | scene | button: **Bypass** (pending −1 on the next Engineering roll at a small mechanism, not the key lock), **Boost** (pending +2 dice to a chosen crewmate via GM op), **Distraction** (NPCs suppressed 1 round) |
| Make a Scene (bruiser) | scene | button: round effect of +2 dice for every other crewmate; +1 Alert entry |
| I Called It (lookout) | heist | button before a roll: posts a GM prompt **+1 / +2 / 0** (+1 preselected); the pending bonus goes on the roller |
| I Know a Way (wheelman) | heist, Escape only | button: `escapeDiff −1` for the whole Escape |
| You're Looking at the Wrong Spider (grifter) | heist | button: Decoy; each NPC's Perception D3 rolled automatically; failures are suppressed 2 rounds; +1 die on job rolls for 2 rounds |
| Silver Tongue | per roll | reaction |
| Plausible Deniability | heist | reaction |
| Fast Talk | scene | button: pick an NPC; suppressed 1 round |
| Actually, I Planned This | heist | button (the GM confirms "plan fell apart"): +1 pending die for every crewmate |
| Read the Room, Familiar Face, I See How This Works, Early Warning, Pattern Recognition, Spider-Sense… Sort Of, Always a Way Out | — | prompt: whispers the GM the question with the relevant stat-block text (Weakness, Escalation, obstacle tags) |
| Soundless, Don't Look Down, Unfazed, Loud, Arachnophobe Magnet, I Was Never Here, Negotiating Position, The Long Con, Method Actor | always | auto (roll plan; Unfazed in derived data). Method Actor's NPC and The Long Con's identity are stored on the actor |
| Smoke and Mirrors | always | auto |
| Silk Trail, Second-Story Spider, Passenger, Shortcut, Dead Drop, Trap Architect, Planted Evidence | — | auto where mechanical: Second-Story → slippery/climb approaches auto-pass; Passenger → full Speed while carrying a Critical crewmate; Shortcut → one-use effect. Planning ones are recorded as free preparations |
| Tactical Feed | round | button: +1 pending die to a crewmate (not an Assist; counts toward the cap) |
| Contingency | heist, Planning | planning record + GM reaction on a card |
| Escape Routes | always | tracker "leader" toggle: `escapeDiff −1` while leading |
| Drafting | always | group card "led by" |
| Overclock | per roll | dialog option |
| Field Repair, Jury-Rig, Silk Grapple, Counter-Surveillance | scene / always | button → pre-bound roll: D2 Engineering (Field Repair heals the target), D2 Engineering, D3 Brawl (range 3 checked), D2 Perception (the GM prompt reveals what's watched) |
| Take the Hit | scene | reaction on the attack card |
| Thunderous Entrance | scene | button: each NPC checks D3 automatically; failures are frozen 1 round |
| That All You Got? | — | auto (§3.8) |
| Double Bluff | 1 SP | reaction on a "seen through" GM prompt: NPC confused 1 round |
| Quick Change | — | text |
| Abort, Abort | heist | reaction |
| Assist (everyone) | Action | button **Assist** → pick a target and a Skill; rolls min(3, max(1, skill)); each Success → pending bonus on the target via GM op. Only one Assist per roll (the latest wins). Adjacency auto-checked |

### 3.12 Flaws and earning Silk

- Once-per-heist ST-triggered Flaws (Overconfident, Dramatic, Allergic to Dust, Compulsive Planner, Butterfingers, Easily Distracted, Show-Off) get a **Fire** button in the tracker's crew panel.
  - Firing stamps usage, posts a Flaw card and **pays +1 SP automatically** (the Flaw Moment, once per firing; `autoFlaws`).
  - The player's **Delay (1 SP)** reschedules it to `roundSerial + 1`, and it fires by itself then.
  - Each Flaw's mechanics apply:

    | Flaw | Effect when fired |
    |---|---|
    | Dramatic | +1 Alert |
    | Allergic to Dust | Forced Stealth D3; a Failure means +1 Alert |
    | Compulsive Planner | The spider is frozen for a round; if the crew acts anyway, −1 SP (GM prompt) |
    | Butterfingers | Held loot → dropped; pickup takes an Action |
    | Easily Distracted | Action lost this round |
    | Show-Off | Arms the next roll (§3.2) |

  - At Escape start, the tracker nudges the GM about unfired once-per-heist Flaws.
- **Fear of Vacuums** fires automatically (a forced NERVE D3) when a vacuum becomes active or Complication 4 rolls.
- **Loud** and **Arachnophobe Magnet** are always on (roll plan). Their Flaw Moment is a GM award button, since "a genuine problem" is a judgement.
- **Earning SP:**
  - Flaw Moments are automatic as above.
  - Spectacular Failure, Creative Species Use and Brilliant Plan are GM one-click awards on cards and in the crew panel.
  - Earning may exceed the starting maximum (§15-Q3). The sheet already renders `value > max`.

### 3.13 Planning, Escape, Full Alert, Debrief, advancement

- **Casing:** each spider's first Perception or Tactics roll in Planning is a Casing roll (a second is refused).
  - Successes reveal `min(successes, unrevealed intel)`, **never the unknown obstacle** (C8).
  - The GM gets a pre-ticked list in book order and one click **Reveal**, which posts the intel to the crew and the player tracker.
- **Preparations:** one per spider. Perk-granted and entry-square preparations are free. A pre-placed Silk Line sets `silkLinePrepared` on its obstacle (−1 Difficulty). Each has a GM complication field; the default text is "note one texture complication".
- **Escape:**
  - Phase change → `sceneSerial++`.
  - Offers I Know a Way and Escape Routes leader.
  - Checks for a Treasure sled.
  - The Rat check "leaving with the trap set" → deal-bad prompt.
- **Full Alert:**
  - When the fold locks, the tracker marks `fullAlert.atObstacle`.
  - If the objective isn't taken → `objective.lost`, with a GM prompt "the objective is out of reach; go to the Escape".
  - Every creature counts as at 7+.
  - **In a Full Alert Escape, a spider's Failure is "caught — Out" as a pending consequence**, voided by a Clutch or a reroll to Partial or better, and finalized at End Round or on Accept (`autoCapture`).
- **Loss:** detected when no crew spider is present or escaped (pending replacements don't count), which means everyone is Out at once.
- **Debrief:**
  - `heist-flow.debriefOutcome`:
    - **full:** some carrier escaped with the objective loot, and it is not incomplete and not lost.
    - **partial:** otherwise, if any spider escaped.
    - **loss:** nobody escaped.
  - The GM confirms with one click (override allowed).
  - AP per spider: `awards[difficulty]`, a Partial gets `floor(award / 2)`, a Loss gets 0. Both `advancement.value` and `.earned` go up, for **every spider of each participating player slot** (§15-Q6).
  - The award is posted as a Debrief card. The heist phase then returns to `idle`.
- **Advancement** (sheet **Advance** button → `advancement-app`):

  | Spend | Cost | Limits |
  |---|---|---|
  | +1 Skill | 1 AP | max 5 |
  | +1 Attribute | 2 AP | max 5, including species |
  | New Perk from the Role list | 3 AP | not already owned; pulled from the Perks pack |

  Unspent AP carries over. The derived Silk maximum updates itself.

### 3.14 Loot and carrying

- Loot records live in the heist state, seeded from the catalog (name, tier) at Start Heist, or added by the GM.
- **Take objective:** clicking it on the objective obstacle (or clearing that obstacle) sets `objective.taken` and makes the clearing spider the carrier.
- Picking up takes an Action (a GM op, which marks the spider as acted). Handing over is free. Dropping happens through Butterfingers or a Partial swap.
- **Speed** (`speed.effectiveSpeed`, pure; `SpiderData` gets the carry info through an injected lookup reading the heist state):

  | Tier | Carriers → Speed |
  |---|---|
  | Crumb / Trinket | One spider, full |
  | Prize | One → half; two → full |
  | Treasure | Two → half; one → 0 ("too heavy"); **sled (1 SP)** → full |
  | Big Score | Every present spider → half (GM override) |

  Hurt halves Speed. Critical means 0, and the carrier moves at half, or full with Passenger. Halvings don't stack (§15-Q4).
- **Squeezes:** at an obstacle tagged `squeeze`, loot bigger than a Trinket raises "won't fit — another way, or break it off (incomplete)" with a one-click **Break it off**, which sets `incomplete` and later means a Partial. A Cellar Ghost's Phase Through takes it through.
- Out while carrying alone → lost (§3.9).
- Optional `movementWarnings`: in turn order, moving a token further than its effective Speed shows a warning; it never blocks.

---

## 4. Heist catalog (`module/logic/heist-catalog.mjs`, WP-C)

A port of `sim/heists.mjs` (Ch 19 v4.7), minus the sim-only fields (`ref`, `assumed`, sim `note`s). Each heist has:
- `key`, `name` (matching the journal name), `difficulty`, `limit`, `lootTier`, `creatures`, `humans` (rows);
- `intel[]` (text plus related obstacle);
- `obstacles[]` and `escape[]`, each obstacle with `tags`, `threats`, `awake`, `unknown`, `objective`, `keyLock`;
- `approaches[]` of `{id, skills, difficulty, opposed, mode, alertOnUse, fight, excludeRoles, note}`;
- **`procedures[]`**, each with `when` (heistStart, obstacleStart, roundEnd, everyNRounds, alertAtLeast, complication, manual), a `roll` table and whisper, or a round timer.

The procedures encoded:
- Heist 1: the twin-tin d6 and the water run.
- Heist 2: the guard lap roll and the cleaners' 6-round timer.
- Heist 4: the librarian's floor d6 at each obstacle start and round end.
- Heist 5: the per-staffer d6 at round end, the Rat's deal (outcomes by result), and the sleeper's wake triggers.

A test asserts parity with `sim/heists.mjs`: same obstacle ids, Difficulties and skills.

`findHeist(nameOrKey)` looks up by the `flags[FLAG].heist` journal flag, then by name, then by key.

---

## 5. What cannot be automated → the one-click prompt used instead

| Judgement (why) | Prompt |
|---|---|
| Whether a roll is needed; which skill; the Difficulty of an unlisted task (Ch 2 "When Not to Roll", Ch 13 "say yes, then set a Difficulty") | Tracker **Call for roll** with catalog approaches; free roll with a Difficulty picker of the Ch 2 rungs |
| Which complication a Partial costs (ST's pick) | +1 Alert applied by default, plus **Swap** buttons (§3.3) |
| Whether a Failure has a consequence | +1 applied by default, plus **No consequence** |
| Spotted / confirmed / loud (fiction) | Three GM buttons on the card, deduped automatically |
| Engaged threat, "within reach", "caught in the open", cover, height, moving, "make them forget" | Defaults from obstacle tags and creature state; checkboxes and toggles; tokens used when present (adjacency, ranges) |
| Casing: which details are revealed | Pre-ticked intel list, **Reveal** |
| Preparation complications | Text field per preparation, with a suggestion |
| Mid-Heist Complication 1 ("nearest"), 2 (which detail) | Default pick with a dropdown |
| When an ST-triggered Flaw fires | **Fire** buttons; end-of-heist nudge |
| Loud/Arachnophobe "genuine problem", Spectacular Failure, Creative Species Use, Brilliant Plan | GM award buttons |
| I Called It plausibility | **+1 / +2 / 0** |
| Information Perks (Read the Room, Early Warning, Pattern Recognition, …) | Whisper to GM with the relevant stat-block text; a free-text answer is posted to the player |
| Calling the Exterminator; "a human stirs" narration; describing band changes | Prompt button, announcement template |
| Plan fell apart (Actually, I Planned This); Contingency trigger happened | GM confirm on the Perk's card |
| Deal outcomes (Rat, Guard bribe, rival crew), negotiation fiction | Buttons: Deal holds / Paid off / Went bad |
| Butterfingers landing square, Snare trigger, dog carrying a spider | Card text plus a one-click follow-up roll (e.g. Acrobatics D4 to escape the dog) |
| Fall height | Squares input → attack |
| Debrief outcome in edge cases | Computed outcome preselected; the GM confirms |
| Species or Role text effects not listed above (Quick Change, Silk Trail geometry) | Text only; usage stamp if limited |

---

## 6. Data-model changes and migration

**`SpiderData`** (WP-A). New fields have defaults, so no migration is needed for the shape:

```js
heist: new SchemaField({
  status: StringField({ choices: ["active","waiting","out","escaped","benched"], initial: "active" }),
  slot: StringField({ initial: "" }),            // player slot; original + replacements share it
  replacementOf: StringField({ initial: "" }),
  recoveredSerial: NumberField({ integer: true, initial: -1 }),
  camouflaged: BooleanField({ initial: false }),
  methodActorTarget: StringField({ initial: "" }),
  longConIdentity: StringField({ initial: "" }),
  pending: ArrayField(SchemaField({
    id: StringField(), dice: NumberField({integer:true, initial:0}), diff: NumberField({integer:true, initial:0}),
    capped: BooleanField({initial:true}), skills: ArrayField(StringField()), jobOnly: BooleanField(),
    expires: StringField({choices:["nextRoll","round","scene"], initial:"nextRoll"}),
    serial: NumberField({integer:true, initial:0}), label: StringField(), source: StringField() }))
}),
vitality: + outCause: StringField({ initial: "" })
```

`prepareDerivedData`:
- The Vitality penalty honours **Unfazed** (Rattled → 0).
- `speed.effective = effectiveSpeed({ base, vitality, carry: SpiderData.carryLookup?.(this.parent) })`. The static `carryLookup` is injected by WP-C at init, with default `() => null`, so the model stays testable.

**Perk, flaw, role and species data** gain:

```js
usage: SchemaField({ heistId: StringField(), sceneSerial: NumberField({initial:-1}),
                     roundSerial: NumberField({initial:-1}), count: NumberField({initial:0}) })
```

Perk and flaw also gain `key: StringField({initial:""})`; a blank key means `slugKey(name)`.

**`ThreatData`** gains:

```js
automation: SchemaField({ key: StringField({initial:""}), perRound: NumberField({nullable:true, initial:null}),
  wakeAt: NumberField({nullable:true, initial:null}), huntAt: NumberField({nullable:true, initial:null}),
  roams: StringField({initial:""}), attackIndex: NumberField({nullable:true, initial:null}),
  humanRow: StringField({initial:""}) })
```

`null` or blank means "use `CREATURE_AUTOMATION` by key".

**Migration `1.8.0`** (`helpers/migration.mjs`, WP-A; idempotent, active GM only):
1. Perk and flaw items, in the world and embedded: set `system.key = slugKey(name)` where it is blank.
2. Spiders: set `system.heist.slot = actor.id` where it is blank.
3. Threats: set `system.automation.key` from the name or alias where the name matches the table.

Not part of the migration: **Alert seeding.** The heist store (WP-C) seeds `heistState` on first `ready`, with a ledger `checkpoint` at the current `alert` value, so an Alert mid-heist survives the upgrade.

Compendium packs don't change. Imported compendium items work through the slug fallback.

---

## 7. Chat message flags (`flags["heisty-spideys"].card`)

```js
{ v: 1, kind: CARD.*, version: n,                     // version++ on every update (optimistic concurrency)
  actorUuid, userId, heistId, obstacleId, obstacleSerial, roundSerial, groupId, approachId, eventId,
  roll: { attr, skill, calledSkill, improvise, pool, difficulty, baseDifficulty, diffParts: [], poolParts: [],
          faces: [], rerolls: [{ by: "silk"|"wolf"|"silverTongue", indices: [], faces: [] }],
          successes, result, clutched, contingency, forced, fight, hazard, physical, casing },
  silk:  { spent: [{ type, cost }] },
  alert: { triggers: [], cancels: [] },               // mirrored into the ledger by the GM
  consequences: { status: "pending"|"final", hit: null|{ attacker, pool }, caught: false },
  attack: { threatUuid, rollIndex, pool, successes, targetUuid, redirectedFrom, critToOut, outIfLands, capture },
  shrug:  { attackMessageId, pool, faces, successes, margin, drop, vitalityBefore, vitalityAfter, tayg },
  pledges: [{ actorId, sp }]                          // Damage Control on alertEvent cards
}
```

---

## 8. GM authority, operations and permissions

**Transport:**
- `module/net/gm-ops.mjs` (WP-C) registers `CONFIG.queries["heisty-spideys.op"]`.
- `gm.run(op, args)` runs locally on the active GM, or otherwise calls `game.users.activeGM.query(QUERY, { op, args, userId, requestId }, { timeout: 10000 })`.
- **Fallback** if `User#query` is unavailable: a request/ack on `system.heisty-spideys`, following the pattern in `helpers/socket.mjs`.
- The GM keeps a 200-entry set of recent `requestId`s, so a retry never applies twice.
- Card patches carry `expectVersion`.
- **The implementer must verify in v13 whether the query handler receives the sender.** If it does, use that instead of `userId`. Until then, the GM checks that `userId` is an active user who owns the named actor: the same trust level as today's spider relay.
- If no GM is online: "The Storyteller isn't connected — nothing was changed."

**Operation registry** (other packages register their own operations through `gm.register(name, {check, apply})` at init):

| Op | Owner | Check → apply |
|---|---|---|
| `alert.cancel` {eventId, ability, actorId} | C | User owns actor; ability usable; window open → cancel, stamp usage, spend SP |
| `alert.pledge` {eventId, actorId, sp} | C | Damage Control unused; delta ≥ 2; actor SP ≥ sp → at 3, deduct and reduce |
| `crew.nptp` {ref, actorId} | C | Crew use free; 4 SP → negate |
| `heist.acted` {actorId} | C | Owner → mark acted |
| `heist.loot` {lootId, action, actorId, toActorId} | C | Owner of actorId → update record, mark Action |
| `heist.prep` / `heist.casingReveal` / `heist.addEffect` {effect, actorId, ability} | C | Owner / ability check → mutate state |
| `actor.addPending` {targetId, bonus, sourceActorId, ability} | A | Source owner; ability usable → push onto target |
| `actor.heal` {targetId, sourceActorId, messageId} | A | Field Repair card passed; adjacency → +1 level |
| `card.patch` {messageId, patch, expectVersion} | B | Whitelisted fields per card kind |
| `hit.retarget` {attackMessageId, bruiserId} | B | Take the Hit usable; adjacency → retarget |
| `ui.promptReplacement` (GM → owner) | A | Returns {name, speciesUuid} |
| `ui.forcedRoll` (GM → owner) | B | Owner rolls a forced roll; returns the message id |

**Permission matrix:**

| Action | Player (own spider) | Needs GM |
|---|---|---|
| Roll; spend own SP; stamp own item usage; consume own pending; set own Vitality from a shrug | direct | — |
| Update own roll/shrug card (reroll, Clutch, accept) | direct (author) | — |
| Alert, heist state, crew uses, loot, effects, group cards, attack cards, other actors, creating replacement actors, token placement, AP awards | — | GM op or GM hook |

---

## 9. Settings (registered by WP-C `module/heist/settings.mjs`; labels in `lang/en.json` by WP-D)

| Key | Scope | Type / default | Meaning |
|---|---|---|---|
| `heistState` | world, hidden | Object | §2 |
| `autoAlert` | world | `auto` / confirm / manual | §3.1 |
| `autoSilk` | world | true | Deduct SP automatically |
| `autoHits` | world | `prompt` / auto / off | Hits after Failures and swats |
| `autoVitality` | world | true | Apply shrug-off results, That All You Got?, glass |
| `autoCreatures` | world | true | Activation, escalation spikes, per-round +X |
| `autoClock` | world | true | Complication on round 3 |
| `autoStall` | world | true | Five-round prompt |
| `autoRecovery` | world | true | Gap recovery and quiet-round prompt |
| `autoWaitingWeb` | world | `auto` / prompt / off | §3.9 |
| `autoCapture` | world | true | Full Alert Escape capture |
| `autoFlaws` | world | true | Flaw Moment SP, flaw checks |
| `autoProcedures` | world | true | Heist d6 tables and timers |
| `autoEndRound` | world | `prompt` / auto / off | §3.5 |
| `forcedRolls` | world | `player` / auto | Who rolls shrug-offs and flaw checks |
| `trackerForPlayers` | world | true | Player tracker view |
| `movementWarnings` | world | false | §3.14 |
| `trackerPosition` | client | Object | Window position |

With every `auto*` setting off, the system behaves like 1.7.0 plus the tracker as a checklist.

---

## 10. Files

**New:**
- **WP-A:**
  - `module/logic/{keys,abilities,advancement,speed,waiting-web}.mjs`
  - `module/runtime/actor-ops.mjs`, `module/runtime/ability-actions.mjs`
  - `module/apps/{advancement-app,replacement-dialog}.mjs`
  - `templates/apps/{advancement,replacement}.hbs`, `templates/actor/spider-abilities.hbs`
  - `styles/automation-sheets.css`
  - `test/{keys,abilities,advancement,speed,waiting-web,spider-derived}.test.mjs`
- **WP-B:**
  - `module/logic/{rolls,hits}.mjs`
  - `module/chat/{card-actions,hit-flow,card-flags}.mjs`
  - `templates/chat/{attack-card,shrug-card,assist-card}.hbs`
  - `styles/cards.css`
  - `test/{rolls,hits}.test.mjs`
- **WP-C:**
  - `module/logic/{alert-ledger,heist-flow,creatures,complications,heist-catalog,grid}.mjs`
  - `module/net/gm-ops.mjs`
  - `module/heist/{store,automation,settings,waiting-web,tokens,procedures}.mjs`
  - `module/apps/heist-tracker.mjs`
  - `templates/apps/tracker/{header,obstacles,current,creatures,crew,planning,loot,log}.hbs`
  - `templates/chat/heist/{group-card,request-card,alert-event-card,complication-card,procedure-card,flaw-card,prompt-card,debrief-card}.hbs`
  - `styles/tracker.css`
  - `test/{alert-ledger,heist-flow,creatures,complications,catalog}.test.mjs`
- **WP-0:** `module/contracts.mjs`
- **WP-D:** `test/contracts.test.mjs`

**Changed (owner):**
- **A:**
  - `module/data/actor-data.mjs`, `module/data/item-data.mjs`
  - `module/documents/actor.mjs`, `module/documents/item.mjs`
  - `module/helpers/migration.mjs`
  - `module/sheets/{spider-sheet,threat-sheet,item-sheet}.mjs`
  - `templates/actor/*.hbs`, `templates/item/*.hbs`
  - `module/apps/character-builder.mjs` (only to `export` `NAME_TABLE`)
- **B:** `module/helpers/dice.mjs`, `templates/chat/{roll-card,threat-card}.hbs`, `templates/apps/roll-dialog.hbs`
- **C:** `module/helpers/alert.mjs`, `templates/hud/alert-meter.hbs`
- **D:** `module/heisty-spideys.mjs`, `system.json`, `lang/en.json`, `.github/workflows/release.yml`, `CHANGELOG.md`, `README.md`, `TESTING.md`, and `tools/validate.mjs` only if a package breaks the no-new-helpers rule
- **Unchanged:** `module/logic/rules.mjs`, `module/config.mjs`, `module/helpers/socket.mjs`, `packs/**`, `sim/**`, `styles/heisty-spideys.css`

---

## 11. Work packages

**WP-0 — pre-step (the orchestrator, before launch):** create `module/contracts.mjs` verbatim from Appendix A. No package edits it; changes go through WP-D.

Packages A, B and C are **fully parallel**, with disjoint files (§10). They depend on each other only through:
1. `contracts.mjs`;
2. the pure-module **signatures** in Appendix B, imported at runtime only; **each package's tests import only its own pure modules plus `rules.mjs`/`config.mjs`**;
3. runtime late binding through `game.heistySpideys.<ns>` with `?.` guards, so each package runs, degraded, without the others.

Each package exports one `register*()` for WP-D to call. Each writes its own CSS file, uses only the 13 existing helpers, and writes literal English UI strings (as today); only setting names use lang keys.

### WP-A — Spiders: data, abilities, sheets, advancement, Waiting Web UI
- **Pure:**
  - `keys.slugKey`, `itemAbilityKey`.
  - `abilities.ABILITIES`, `usageStatus`, `markUsage`.
  - `advancement.advanceOptions`, `applyAdvance`.
  - `speed.carryRule`, `effectiveSpeed`.
  - `waiting-web.replacementStats`.
- **Runtime:**
  - `actor-ops`: `spendSilk`, `earnSilk`, `usage`, `markUsed`, `addPending` (direct or GM op), `consumePending`, `setVitality`, `abilityItems`.
  - `ability-actions.use(actor, key, opts)`: implements the "button" rows of §3.11 through `actorOps`, `game.heistySpideys.heist.addEffect`, `gm.run`.
- **UI:**
  - Abilities panel, Spend Silk menu, Assist button.
  - Pending bonus chips, heist status chip, Advance button.
  - Threat sheet automation fields.
  - Item sheet usage display and reset.
  - Replacement dialog, advancement app.
- **Also:** migration 1.8.0; the two GM ops `actor.addPending`, `actor.heal` and the query `ui.promptReplacement`, registered via `registerSpiderOps(gm)`.
- **Exports:** `registerSpiderAutomation()` (init: `SpiderData.carryLookup` default, ops), `actorOps`, `abilityActions`, `promptReplacement`.
- **Acceptance:**
  - Tests pass.
  - Every perk, flaw, species and role in `packs/_source` resolves to an `ABILITIES` entry whose frequency matches its text.
  - A replacement carries usage stamps.
  - Migration is idempotent.

### WP-B — Dice, roll cards, reactions, Taking Hits
- **Pure:**
  - `rolls.buildRollPlan`, `resolveRoll`, `rerollIndices`, `applyReroll`, `applyClutch`, `rollAlertTriggers`.
  - `hits.shrugPool`, `resolveHit`, `applyVitalityDrop`, `stepVitality`, `hazardPool`, `fallPool`.
- **Runtime:**
  - `dice.mjs`: the plan-based dialog; obstacle binding via `game.heistySpideys.heist?.rollContext(actor, skillKey)`; SP deduction; card flags (§7); `rollCheck`, `rollForced`, `threatAttack`, `rollAssist`.
  - `card-actions.mjs`: every §3.3 button *except* the Damage Control and Not Part of the Plan buttons on heist cards.
  - `hit-flow.mjs`: §3.8.
- **Registers:** `card.patch`, `hit.retarget`, `ui.forcedRoll`.
- **Chat listeners:** WP-B's `renderChatMessageHTML` handles card kinds `check`, `threat`, `attack`, `shrug` and `assist`. It replaces the old GM Alert-button block; in `autoAlert=manual` mode it renders the old buttons.
- **Exports:** `registerDiceAutomation()`, `HeistyDice` (extended).
- **Acceptance:**
  - Tests pass.
  - Rerolls keep Successes and are capped at 3 (Silk) or unlimited (Wolf).
  - Clutch works only on a Failure.
  - A card's triggers match §3.1.
  - Shrug margins match Ch 10.

### WP-C — Heist runtime: Alert ledger, GM ops, store, automation, Tracker
- **Pure:** `alert-ledger`, `heist-flow`, `creatures`, `complications`, `heist-catalog`, `grid` (Chebyshev adjacency and range).
- **Runtime:**
  - `gm-ops` (the registry and transport, §8).
  - `store` (queue, pure mutations, seeding, `rollContext`, `addEffect`, `carryFor` → `SpiderData.carryLookup`).
  - `automation`: active GM only; hooks `createChatMessage`, `updateChatMessage`, `updateActor`, `updateCombat`, `updateToken`, and `ready` reconcile. Implements §3.1, §3.4, §3.5, §3.7, §3.9 (gap recovery, Out), §3.10, §3.12 and §3.13.
  - `waiting-web` orchestration.
  - `tokens`: placement, adjacency, movement warnings, crab camouflage clear.
  - `procedures`.
  - `alert.mjs`: `HeistyAlert.raise/amend/set` on top of the ledger; the old API is kept, with `set`/`applyDelta` becoming `manual` entries.
  - The HUD gets a pending strip (confirm mode) and a **New Scene** button in freeplay.
- **UI:** Tracker (§3.6), heist cards, and their `renderChatMessageHTML` for their own card kinds.
- **Exports:** `registerHeistAutomation()` (init: settings, queries), `readyHeistAutomation()` (ready: seed, reconcile, tracker control), `heistApi`, `HeistyAlert`.
- **Acceptance:**
  - Tests pass.
  - Catalog parity with `sim/heists.mjs`.
  - A replayed sequence of events produces the same Alert as the sim's rules on the scenarios in the tests.

### WP-D — Integration (after A, B and C merge)
1. `heisty-spideys.mjs`:
   - Import and call `registerHeistAutomation()` first; its `gm` API must exist before the others register ops.
   - Then `registerSpiderAutomation()`, `registerDiceAutomation()`.
   - Build `game.heistySpideys = { …existing, gm, heist, alert, actorOps, abilities, dice, openTracker, waitingWeb }`.
   - On ready: `readyHeistAutomation()`.
   - Keep `registerSocket()` and `migrateWorld()` unchanged; migration runs **before** the reconcile.
   - Remove the now-duplicate `HeistyDice.registerChatListeners()` call if WP-B moved it into `registerDiceAutomation`.
2. `system.json`: add `styles/automation-sheets.css`, `styles/cards.css`, `styles/tracker.css`; version 1.8.0. No new document types.
3. `lang/en.json`: `HEISTY.Settings.*` names and hints for §9.
4. `release.yml`: `-x "docs/*"`.
5. `test/contracts.test.mjs`:
   - Every `OPS` value is registered by exactly one package (a static grep of `register(` calls).
   - Every ability key referenced in `rolls.mjs` passive tables exists in `ABILITIES`.
   - Every `CARD` kind has exactly one renderer.
   - Every `SETTINGS` key is registered.
6. `npm run check` passes.
7. CHANGELOG 1.8.0; README "Automation" section; TESTING.md two-client script (§13).

---

## 12. Tests (`npm test`; all pure, no Foundry)

- **A:**
  - Slugs equal the pack keys for all 42 perks and 10 flaws.
  - Usage across clock changes (scene, heist, round); a replacement keeps its stamps.
  - Advancement caps and costs; carry table; Hurt, Critical, Passenger.
  - `replacementStats` (half SP rounded down, Rattled, species swap capped at 5).
  - Derived Unfazed and Speed with an injected carry lookup.
- **B:**
  - Bonus cap +2 with Silk and Overclock uncapped.
  - Improvise +1 using the new Attribute.
  - Loud at 5+, Arachnophobe vs human, Soundless moving, Don't Look Down, cover −2 on Stealth only, Show-Off, minimum Difficulty 1, Botch at pool ≤ 0.
  - Reroll keeps Successes, at most 3.
  - Clutch on a Failure only.
  - Triggers: Failure +1, Partial +1, Botch +2, Critical −1 only at D3+ and not at Full Alert, Smoke and Mirrors cancel, fight landed +1 / lost +2, `alertOnUse`.
  - Shrug: tie → 1, by 3 → 2, beat → 0; 0 dice → 0 Successes and no Botch; That All You Got? stops at Hurt; glass → Out.
- **C:**
  - Ledger: same `eventId` takes the max; group max; group Critical only if all Critical; lock and amend-unlock; floor at 0; Damage Control only on +2 and once per crew; Plausible Deniability only on +1; checkpoint compaction.
  - Flow: 2 passes in the Heist / 1 in the Escape; a group check is per spider; clock at the start of round 3; stall after 5; `sceneSerial` on Planning and each obstacle; Casing cap excludes the unknown; Debrief AP including half rounded down; Loss.
  - Creatures: every row of §3.7, including Full Alert counting as all steps.
  - Catalog: parity with the sim, an Escape answer without Athletics in each heist, creature keys exist in `packs/_source/creatures`.
- **D:** contracts test.

## 13. Two-client smoke test additions (TESTING.md)

GM plus a Player without create permission:
1. The player rolls with 2 Silk dice → SP drops by 2.
2. The player rerolls on the card → SP drops by 2 and the Alert amends.
3. The player Clutches a Failure → +1 total, progress counted.
4. The GM runs a group check → the Alert rises once.
5. End Round with an awake cat → +1.
6. Round 3 → a complication posts.
7. The cat pounces → the player shrugs → Vitality changes on both clients.
8. The player goes Out → replacement dialog on the player's client → the replacement appears Rattled with half SP at the next obstacle.
9. Damage Control split between two players.
10. The Debrief awards AP to both of a player's spiders.
11. With the GM offline, the player rolls → the GM logs in → reconcile applies the Alert.

## 14. Order of work and risk

- A, B and C proceed in parallel, then D.
- The largest risk is WP-C's size. It may split its work internally (pure modules first), but its file set is fixed.
- The riskiest Foundry assumptions:
  - the `User#query` handler signature (fallback socket provided);
  - `ChatMessage` update by its author (true in v13/v14);
  - canvas absent on some clients (all token logic is guarded, with GM overrides).

## 15. Interpretations to confirm with the author

1. **Group-check Alert:** "raises the Alert only once, by the worst result" is read as the largest single-roll Alert trigger, so a Partial (+1) beats a Clean Failure (0).
2. **Silk Clutch** applies to a **Failure** only, not a Botch or Clean Failure (Ch 8 "After a Failure"; E1 says "fail" includes Botch).
3. Earned SP may go above the starting Silk.
4. **Speed halvings don't stack** (Hurt and carrying a Prize alone = half once); a lone Treasure carrier can't move.
5. Vitality resets to Unharmed at the start of a heist (the book resets only Silk).
6. **AP go to every spider of a player's slot** (the original and its replacement), since "the player may bring back either spider".
7. A Critical counts as one of an obstacle's two successful rolls.
8. The gap recovery belongs to the obstacle just finished (at most one recovery per obstacle including the gap).
9. Creature +X is added in the round the obstacle is cleared.
10. Reaction windows (That's Not What Happened, Plausible Deniability, Abort Abort, Damage Control) last until the end of the current round.
11. The Big Score is carried by every present spider at half Speed.
12. A Full Alert Escape capture is held until End Round or Accept, so a Clutch or reroll can prevent it.
13. Dog: "at Alert 4 it barks" is read as +2 once, when 4 is first reached.
14. Guard spider driven off by a fight → an aware backup takes the post (+1 per round continues).
15. `autoHits = auto` treats the strongest engaged attacker as the one that "sees you fail".
16. A Casing roll is the spider's first Perception or Tactics roll in Planning.
17. The Show-Off Flaw Moment pays automatically on a Failure, Partial or Critical of the armed roll.
18. The Exterminator appears only on the GM's click at Lockdown or Full Alert.
19. Assist: "only one spider can Assist a given roll", so the latest pending Assist replaces an earlier one.

---

## Appendix A — `module/contracts.mjs` (verbatim, WP-0)

```js
/**
 * HEISTY SPIDEYS — Cross-package contracts (automation, 1.8.0).
 * Constants only: no imports, no Foundry globals. Copied verbatim from
 * docs/AUTOMATION-DESIGN.md Appendix A; change only through the integrator.
 */
export const SYSTEM_ID = "heisty-spideys";
export const FLAG = "heisty-spideys";
export const QUERY = "heisty-spideys.op";
export const SOCKET = "system.heisty-spideys";

export const SETTINGS = Object.freeze({
  heistState: "heistState", autoAlert: "autoAlert", autoSilk: "autoSilk", autoHits: "autoHits",
  autoVitality: "autoVitality", autoCreatures: "autoCreatures", autoClock: "autoClock",
  autoStall: "autoStall", autoRecovery: "autoRecovery", autoWaitingWeb: "autoWaitingWeb",
  autoCapture: "autoCapture", autoFlaws: "autoFlaws", autoProcedures: "autoProcedures",
  autoEndRound: "autoEndRound", forcedRolls: "forcedRolls", trackerForPlayers: "trackerForPlayers",
  movementWarnings: "movementWarnings", trackerPosition: "trackerPosition"
});

export const PHASES = Object.freeze(["idle", "score", "planning", "heist", "escape", "debrief"]);

export const CARD = Object.freeze({
  check: "check", threat: "threat", attack: "attack", shrug: "shrug", assist: "assist",   // WP-B renders
  group: "group", request: "request", alertEvent: "alertEvent", complication: "complication",
  procedure: "procedure", flaw: "flaw", prompt: "prompt", debrief: "debrief"             // WP-C renders
});

export const OPS = Object.freeze({
  alertCancel: "alert.cancel", alertPledge: "alert.pledge", crewNptp: "crew.nptp",       // WP-C
  heistActed: "heist.acted", heistLoot: "heist.loot", heistPrep: "heist.prep",
  heistCasingReveal: "heist.casingReveal", heistAddEffect: "heist.addEffect",
  actorAddPending: "actor.addPending", actorHeal: "actor.heal",                          // WP-A
  uiPromptReplacement: "ui.promptReplacement",
  cardPatch: "card.patch", hitRetarget: "hit.retarget", uiForcedRoll: "ui.forcedRoll"    // WP-B
});

export const HOOKS = Object.freeze({
  rollResolved: "heistySpideys.rollResolved",       // (message, card)
  heistChanged: "heistySpideys.heistChanged",       // (state, diff)
  alertChanged: "heistySpideys.alertChanged",       // (value, entry)
  vitalityChanged: "heistySpideys.vitalityChanged", // (actor, from, to, cause)
  obstacleStarted: "heistySpideys.obstacleStarted", // (state)
  roundEnded: "heistySpideys.roundEnded",           // (state)
  phaseChanged: "heistySpideys.phaseChanged"        // (state, from, to)
});

export const FREQ = Object.freeze({ always: "always", round: "round", scene: "scene", heist: "heist", planning: "planning" });

/** Alert trigger and cancel keys (ledger, §3.1). */
export const TRIGGERS = Object.freeze(["failure", "partial", "botch", "critical", "spotted", "confirmed", "loud",
  "fightLanded", "approach", "clutch", "creature", "spike", "out", "capture", "complication", "manual"]);
export const CANCELS = Object.freeze(["thatsNotWhatHappened", "plausibleDeniability", "abortAbort",
  "smokeAndMirrors", "notPartOfThePlan", "noConsequence", "swapped", "contingency"]);
```

## Appendix B — pure-module signatures (the contract between packages)

```js
// A — keys.mjs
slugKey(name: string): string
itemAbilityKey(item: {type, name, system}): string   // perk/flaw: system.key||slug; role: "sig:"+roleKey; species: "species:"+speciesKey
// A — abilities.mjs
ABILITIES: { [key]: { key, kind, name, freq, scope: "spider"|"crew", cost, timing, automation, effect } }
usageStatus(def, usage, clock): { available, reason, usedThis }   // clock = {heistId, sceneSerial, roundSerial}
markUsage(def, usage, clock): usage
// A — advancement.mjs
advanceOptions({ attributes, skills, speciesBonuses, ap, ownedPerkKeys, rolePerkKeys }): [{ type, key, cost, allowed, reason }]
applyAdvance(snapshot, choice): { updates, apSpent }
// A — speed.mjs
carryRule(tier, carriers, sled): { canMove, half, fitsSqueeze, note }
effectiveSpeed({ base, vitalityKey, carry, carryingPassenger, perks }): { speed, notes }
// A — waiting-web.mjs
replacementStats({ attributes, oldBonuses, newBonuses, silkMax, newSpeed }): { attributes, silk, vitality: "rattled", speed }

// B — rolls.mjs
buildRollPlan(input): { pool, difficulty, diffParts, poolParts, bonus: {requested, applied, capped}, silkCost, botch, consumePending, warnings }
resolveRoll(faces, difficulty): { successes, result }
rerollIndices(faces, max /*3 | Infinity*/): number[]
applyReroll(faces, indices, newFaces): number[]
applyClutch(card): card                   // throws unless result === "failure"
rollAlertTriggers(card, { alertState, phase, abilityKeys }): { triggers: [{key, delta, label}], cancels: [{key}] }
// B — hits.mjs
shrugPool({ body, endurance, vitalityPenalty }): number
resolveHit(attackSuccesses, defenseSuccesses): { margin, drop /*0|1|2*/, shrugged }
applyVitalityDrop(fromKey, drop, { tayg /*bool|null*/, critToOut, outIfLands }): { to, out, needsTayg }
stepVitality(fromKey, delta): string
hazardPool(difficulty): number;  fallPool(squares): number

// C — alert-ledger.mjs
eventDelta(entry): number
foldLedger(entries, limit): { value, locked, lockedByEntryId, peak }
upsertEvent(ledger, eventId, patch): ledger;  amendEvent(ledger, eventId, patch): ledger;  compact(ledger): ledger
canDamageControl(entry, crewUsage, clock): boolean;  canPlausibleDeniability(entry): boolean
// C — heist-flow.mjs
newHeistState(opts); setPhase(state, phase); startObstacle(state, id); endRound(state, ctx): { state, actions }
recordRoll(state, card): state;  isCleared(state, obstacleId): boolean;  requiredPasses(obstacle): 1|2
clockDue(round): boolean;  stallDue(round): boolean;  casingReveal(successes, intel): number
debriefOutcome(state): "full"|"partial"|"loss";  apAward(difficultyKey, outcome): number;  isLoss(crew): boolean
// C — creatures.mjs
CREATURE_AUTOMATION; resolveCreatureKey(nameOrKey): string|null
creatureStatus(def, st, alert, fullAlert): { active, hunting, roams }
escalationEvents(def, st, prevAlert, newAlert, fullAlert): { spikes: [{delta, label}], patch }
perRoundDelta(def, st, { here, obstacleSerial, roundSerial }): number
// C — complications.mjs
MID_HEIST: { 1..6: { text, effect } };  complicationEffect(roll, ctx): { actions }
// C — heist-catalog.mjs
HEISTS; findHeist(nameOrKey): heist|null
// C — grid.mjs
chebyshev(a, b): number;  adjacent(a, b): boolean;  withinRange(a, b, squares): boolean
```

Runtime namespaces (late-bound on `game.heistySpideys`):
- `gm.run(op, args)`, `gm.register(op, {check, apply})` — C
- `heist.state`, `heist.clock()`, `heist.rollContext(actor, skillKey)`, `heist.addEffect(effect)`, `heist.carryFor(actorId)`, `heist.openTracker()` — C
- `alert.raise({eventId, triggers, cause, source})`, `alert.amend(eventId, patch)` — C
- `actorOps.*`, `abilities.use(actor, key, opts)`, `waitingWeb.promptReplacement(actor)` — A
- `dice.rollCheck`, `dice.rollForced`, `dice.threatAttack`, `dice.rollAssist` — B
