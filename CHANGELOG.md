# Changelog

All notable changes to the Heisty Spideys system are recorded here.

## [1.8.0] — Full automation (rulebook v4.8)

The system now does the bookkeeping of a heist for you, following **Heisty Spideys v4.8**: the Alert, Silk, reactions, hits, Vitality, creatures, the clock, the Waiting Web and the Debrief. Where the rules need the Storyteller's judgement, you get **one click with a rules-correct default** instead of a number to track. Every part can be switched off (see *Settings* below).

### New — the Heist Tracker
- One window for the whole heist: **Start Heist** (the five ready-to-run heists, or a heist journal dropped on it; the crew is picked for you), a **phase stepper** (Score → Planning → Heist → Escape → Debrief), the obstacle list (the unknown one hidden from players until revealed), the current obstacle with its approaches (**Call for roll**, **Group check**), progress pips, the round, the clock and the five-round stall, creatures (awake, hunting, aware, paid off, driven off, their +X a round), the crew (Vitality, Silk, who has acted, **Fire** a Flaw, Silk awards), Planning (Casing, Preparations, Contingency), loot and carrying, the heist's own tables and timers, and a log.
- Opens from the **Heist Tracker** tool in the token controls, the Alert meter, or `game.heistySpideys.openTracker()`. Players get their own view (setting): the obstacle and its approaches with **Roll this approach**, progress, revealed intel, their spider with **I acted**, and the loot.
- Starting a heist resets each crew spider to full starting Silk and Unharmed, starts a fresh Alert at the heist's Limit, and imports the heist's creatures from the compendium.

### New — the Alert runs itself
- Every roll card carries what it does to the Alert, and the Storyteller's client applies it: Failure +1 (a clean failure too, as the v4.8 book says), Partial +1, Botch +2, a Critical −1 at Difficulty 3+, loud approaches, fights, a Silk Clutch, a spider Out (+2, capture +3), creatures' +X at the end of each round, escalation spikes (the dog's bark, the parrot's shriek, the Rat's deal going bad), Mid-Heist Complications, Make a Scene and Dramatic.
- **One event, one trigger:** the Storyteller's Spotted / Confirmed / Loud Failure buttons sit on the same card, so "a Failure that gets you spotted is +1, not +2". A group check raises the Alert once, by its largest single trigger.
- Reactions are exact and reversible: a Reroll or Clutch re-applies the card; That's Not What Happened, Plausible Deniability, Abort Abort, Smoke and Mirrors, Not Part of the Plan and Damage Control amend the event. Undoing Full Alert asks the Storyteller first.
- When the band changes you get a whispered **Describe it** prompt with the creatures' Escalation text; Full Alert marks the objective out of reach and offers the Escape.
- Rolls made while no Storyteller is connected are applied when the Storyteller logs in.

### New — rolling, Silk and reactions
- The roll dialog knows the obstacle: pick an approach and its Difficulty, opposing creature, loud cost and fight flag fill in; **Improvise** (2 SP) with another Skill. Cover, height, Loud, Arachnophobe Magnet, Soundless, crab camouflage, a pre-placed Silk Line, I Know a Way, Bypass, Show-Off and the human rows are applied (each shown, each can be unticked). Bonus dice stay capped at +2; Silk dice and Overclock don't count against it.
- **Silk is spent for you:** Silk dice, Improvise and Overclock come off when you roll. Buttons on your own card: **Reroll (2 SP)** (keeps your Successes), **Silk Clutch (3 SP)** on a Failure, **Run It Again** (Wolf), **Silver Tongue**, **Accept**. Crewmates get their reactions on your card; the Storyteller gets Spotted / Confirmed / Loud, Partial swaps, No consequence, the hit, Spectacular Failure and Contingency.
- Alert spikes post a card for **Damage Control** (3 SP split between the crew) and **Not Part of the Plan** (4 SP).
- **Assist** rolls from the sheet and queues the bonus on the crewmate's next roll.

### New — hits, Vitality and the Waiting Web
- A Failure with an engaged threat brings its hit (setting): an **attack card** with **Take the Hit** for an adjacent Bruiser and **Shrug it off** for the target's player. The shrug-off (BODY + Endurance) sets Vitality, rolls **That All You Got?** when it matters, and can be Rerolled (2 SP) or Run Again. Human glass, the Exterminator's spray and the curious child's capture send a spider Out. A threat sheet's pool clicked with spider tokens targeted is an attack on them. A roll to avoid a hazard (tick it in the roll dialog) brings the hazard's hit on a Failure; a fall (`game.heistySpideys.dice.fallAttack(actor)`) hits with one die per 2 squares.
- **Out** adds its Alert, loses the loot only that spider carried, hides its token, and checks for a Loss. The **Waiting Web** asks the player for a name (and an optional species swap) and brings in the replacement at the next obstacle — same Role, Attributes, Skills, Perks and Flaw, Rattled, half its starting Silk, the uses it has left. Next heist the player may bring back either spider.
- Recovery once per obstacle: in the gap between obstacles, and a **Quiet round: recover** prompt when nothing could reach the crew.

### New — abilities, Flaws and advancement
- The sheet's Kit tab has an **Abilities** panel (Species, Signature Move, Perks, Flaw) with Ready / Used this scene / Used this heist, a **Use** button and the cost; once-per-scene/heist/round uses are tracked on the items. A **Spend Silk** menu (Silk Line, Web Structure, silk sled, Delay a Flaw), queued bonuses, the heist status, and an **Advance** window (+1 Skill 1 AP, +1 Attribute 2 AP, a new Role Perk 3 AP).
- Flaws the Storyteller triggers get a **Fire** button that pays the Flaw Moment (+1 SP) and does what the Flaw does; a player can **Delay** it for 1 SP and it fires by itself next round. Show-Off pays only if the armed roll costs you or you Critical.
- **Creatures** wake, hunt and spike at their Escalation steps (Full Alert counts as every step), add their +X each round, and back off when beaten. Heist procedures (the twin tins, the guard's lap, the librarian's floor, the staff rolls, the Rat's deal, the water run, the sleeper) roll themselves and are whispered to the Storyteller. The **Mid-Heist Complication** rolls as the crew starts round 3 at an obstacle; **Nudge** rolls it any time.
- **Debrief** works out the outcome (full, partial, loss), awards AP to every spider of each player's slot (half for a player caught in the last Escape obstacle), and returns the heist to freeplay.

### Settings — every automation can be switched off
*Game Settings → Configure Settings → Heisty Spideys:* **Automatic Alert** (Automatic / Propose — the Storyteller confirms each change / Manual), **Deduct Silk automatically**, **Hits after a Failure** (Ask the Storyteller / Automatic / Off), **Apply shrug-off results**, **Creatures act on their own**, **Mid-Heist Complication at round 3**, **Five-round stall prompt**, **Recovery between obstacles**, **The Waiting Web** (Automatic / Ask the Storyteller first / Off), **Capture in a Full Alert Escape**, **Flaw Moments and Flaw checks**, **Heist procedures**, **End the round** (Prompt / Automatic / Off), **Who rolls forced rolls** (the player / automatically), **Players see the Heist Tracker**, **Movement warnings**. With every automation off the system plays like 1.7.0, with the tracker as a checklist.

### Changed
- A clean failure (the 4–6 Botch die) is an ordinary Failure: +1 Alert (rulebook v4.8).
- Player actions that touch something they don't own (the Alert, the heist, a crewmate, someone else's card) are carried out by the Storyteller's client; the Storyteller must be connected for those, and players are told so if not.

### Upgrading
- The Storyteller's first login after the update migrates the world automatically (stable keys on Perks and Flaws, a player slot on every spider, the creature key on threats). The current Alert carries over. **No compendium re-import is needed for 1.8.0** (worlds still on 1.6 or older content should re-import as the 1.7.0 notes say).

## [1.7.0] — Rulebook v4.7 rules update

The system now follows **Heisty Spideys v4.7**: every open playtest item resolved (`book/REVIEW.md` Part E, rulings E1–E44) and the five ready-to-run heists finished (Part F: maps, obstacle Difficulties, suggested Escapes).

### Changed — spiders and the Character Builder
- **Starting Silk = WIT + NERVE + 1, counting only the points you placed — not the species bonus** (E10: "Silk is practice, not anatomy"). The sheet's Silk maximum is derived this way from the current WIT and NERVE minus the worn Species' bonus, so Attribute advances still count. The builder's Attributes and Finish steps show the new number, and the sheet's hint says so. *Existing spiders keep their current Silk; their maximum updates on its own.*
- **Skills step:** the Role's 3 bonus points go on the two core skills first, in any split (3/0 is fine), then your own 12; max 3 per skill, Role points included (E30). The accounting already worked this way; the text now says it.
- **Chapter 20 random tables and quick picks** (E9): new **Roll 1d6** on the Attributes step (a 10-point spread, the first number on your Role's Attribute, species overflow moved to your lowest), **Quick Pick** on the Skills step (both core skills at 3, then the Role's 3·2·2·2 package), and **Roll 1d6 ×2** on the Perks step (down the Role's Perk list in book order; a repeat is rerolled). The Role roll now uses the book's table (1–5, and a 6 rolls again for Wheelman or Grifter). Perks are listed in book order.
- The Flaw step explains the Flaw Moment: +1 SP each time the Flaw fires; no Flaw pays twice (E12).

### Changed — dice, chat cards and the Alert meter
- The Failure card notes that a **Silk Clutch** (3 SP, +1 Alert) turns a Failure into a Success; the Partial card says a Partial is never a failed roll, passes a pass-or-fail check, and can't be Clutched (E1, E12). There is no Clutch or reroll button; these stay table actions.
- A threat's roll card says its roll is just a count: it never Partials, Criticals or Botches (E21). Critical texts say "after every modifier" and "never below 0" (E39). The Alert meter's tooltips mention one event, one trigger (E37).
- Config data (`HEISTY.silkSpends`, `silkEarns`, `alertTriggers`, `results`, `lootTiers`) carries the v4.7 wording. Loot tiers gain the **Carrying It** column (E5).

### Changed — compendium content (matches the book)
- **Creature Compendium:** new **Human** (Speed 10, Swat 3, Perception 3 for its own checks only, no Alert of its own; spotted/confirmed, swatted, under a glass; its Chapter 15 rows included; new icon) (E4). **Guard Spider:** senses 6 squares in line of sight; aware on spotting the crew (+1, then +1 a round) until paid off; a beaten guard's backup; "+2 if it calls for backup" removed; Fast Talk and Deception still work; anyone but the Face may talk (E24, E33). **Vacuum:** Pursuit is its attack. **Exterminator:** Lockdown (7+) or Full Alert (E43).
- **Heists:** all five rebuilt from Chapter 19 — each has a **Map** page (the book's gridded map, shipped in `assets/maps/`), the Casing intel, ST Prep pages (Heist 1's human and water run; Heist 2's guard loop; Heist 4's librarian; Heist 5's staff table and **the Rat's deal**), the unknown obstacle (Heist 1's secret d6 for the twin tin; Heist 2's cleaners upstairs; Heist 4's rival crew in the reference room; Heist 5's sleeper and wake trigger), and a **Suggested Obstacles** table with a **Roll (Difficulty)** column and the two suggested Escapes, **E1** and **E2**. Heist 5's loot is Treasure. New entry: **Reading the Maps and Tables**.
- **Rules Reference:** Core Rules (Failure vs Partial, Pass or fail, Critical after every modifier, Assist Skill choice, opposed rolls count only, humans never roll to spot you, and a new **Your Turn & the Grid** page: sneaking is an Action, one roll covers one thing, free actions on the ST's turn, glass, heights, squeezes under pressure); The Alert (never below 0, one event one trigger, the clock, penalties follow the current number, describe the change); Silk Points (start WIT + NERVE + 1, rerolls keep Successes, Improvise uses the new Skill's Attribute, Silk Clutch only after a Failure, Damage Control split any way, Flaw Moment); Vitality (threats with no attack pool, falls, Waiting Web entry next to a crewmate, lost loot, bring back either spider); Five Phases (one Preparation per spider, the clock, incomplete loot, AP carry over, Full Alert costs nothing extra, the Loot table's **Carrying It** column); and the Quick Reference.
- New Rules Reference entries: **Creatures, Humans & Patrols** (Escalation and Full Alert, driving a creature off, the Human, the Chapter 14 lap roll, the clock) and **Random Tables** (Chapter 20: name, species, Role, Attributes, Skills and Perks quick pick, Flaw, and the Mid-Heist Complication table with its new Effect column and triggers).
- **Species, Roles, Perks, Flaws, Gadgets:** Wolf Spider's Run It Again (a shrug-off counts; reroll the dice that didn't succeed, keep the Successes); That's Not What Happened (a Failure still made no progress); Phase Through (a Cellar Spider takes the loot through); Make a Scene (+1 Alert only); Take the Hit (declare before the shrug-off); Actually, I Planned This (every crewmate); Dead Drop; Early Warning; Contingency; Drafting; Planted Evidence; Allergic to Dust; Butterfingers; Show-Off; Silk Line (skip the roll free with nothing watching or closing in; a pre-placed line costs no SP).

*Worlds that already imported compendium items, creatures or journals keep their old copies. **Re-import them from the compendiums** to get the v4.7 text — especially the heists, the Rules Reference and the Guard Spider — and import the new Human.*

## [1.6.0] — Rulebook v4.6 rules update

The system now follows **Heisty Spideys v4.6**: the clarified rules and the balance package chosen after the simulator runs and playtests (see `sim/BALANCE.md`, §1 and package P4H).

### Changed — dice
- **Successes are 5s and 6s.** Every roll (spiders and threats) counts a die showing 5 or 6 as a Success. The Botch die is unchanged (1–3 Botch, 4–6 clean failure).
- **A Partial needs at least half the Difficulty (round up).** Fewer is a Failure — at Difficulty 1–2 that still means zero. A Critical is still double the Difficulty.
- **Criticals lower the Alert only at Difficulty 3+**, and never at Full Alert. The roll card stops suggesting −1 below Difficulty 3.
- **A Partial suggests +1 Alert**, or a complication that costs as much — never both (the result text says so).
- **At most +2 bonus dice per roll** from Assists, Perks, Signature Moves and intel together. The roll dialog now has a separate **Silk dice** field (uncapped) next to **Bonus dice**. It shows the limit, warns when you enter more than +2, and the chat card notes when the bonus was capped.
- **Opposed rolls:** the roll dialog has an **Opposed by** list of threats (on the viewed scene; the GM also sees every threat in the Actors directory). Pick one of a creature's pools and it rolls first; its Successes + 1 become your Difficulty. A new **Difficulty modifier** field (cover −2 on Stealth, Perks, Flaws) and the Alert then apply as usual. A threat's own roll card now shows the Difficulty it sets.

### Changed — the Alert
- **Full Alert is permanent.** The Alert stops at the Limit. Once it gets there, nothing raises or lowers it, whether from the HUD buttons, the chat-card buttons or the number field. The GM's **Reset** (a new heist) or a higher Limit releases it.
- **Full Alert brings the Lockdown penalties** (all +1, Stealth +2) whatever the Limit, so Hard, Absurd and Legendary locations (Limit 6 or less) now get them at Full Alert too.
- The HUD's −1 tooltip reads "Critical Success at Difficulty 3+". Its buttons are disabled at Full Alert.
- The Active band (5–6) text now says the Stirring Stealth +1 still applies (no new penalty), as the engine already did.
- New Alert trigger row: a Partial Success's complication, +1.

### Changed — compendium text (matches the book)
- **Rules Reference:** Core Rules, The Alert, Silk Points, Vitality, The Five Phases and the Quick Reference carry the v4.6 wording. That covers 5–6 Successes, half-Difficulty Partials, the Failure retry and five-round limit, Group Checks, the new opposed rolls and cover, the +2 bonus-dice limit, and the Critical floor at Difficulty 3. It also covers the permanent Full Alert (a failed Escape roll at Full Alert gets that spider caught), creatures staying active, and what a scene is. Two more rules land here: a heist obstacle takes two successful rolls, and Casing is capped. The Silk advice is now "spend it", and shrug-off ties go to the threat.
- **Spitting Spider:** Precision Application is once per scene; a jammed sensor stops sensing, a jammed lock stays shut.
- **The Tinkerer / "I Made a Thing":** Bypass is now an Engineering roll at −1 Difficulty, and it doesn't work on the heist's key lock.
- **Plausible Deniability** is once per heist. **Familiar Face** never reveals the unknown obstacle.
- **Silk Line:** a line placed during Planning lasts the heist, and it lowers that obstacle's Difficulty by 1 instead of skipping it.
- **Crab Spider, Arachnophobe Magnet, I Was Never Here** are written from the spider's side of the roll (your Stealth Difficulty).
- **Heists:** Casing reveals at most the listed intel. In Heist 2 the guard spider is aware from the start. In Heist 5 the two closing staff are Alert Humans (Difficulty 4).

*Worlds that already imported compendium items or journals keep their old copies. Re-import them from the compendiums to get the v4.6 text.*

## [1.5.1] — Author credit

### Changed
- Author credited as Richard Moore (manifest and license).

## [1.5.0] — Heist-noir look

### Changed
- **New colour scheme, matching the rulebook's heist-noir edition:** charcoal and near-black with signal red for danger and the Alert, and gold for loot and silk, on warm paper. Applies to the spider, threat and item sheets, the Character Builder, the roll dialog, chat cards, the Alert meter and all item/creature icons.

## [1.4.0] — Rulebook v4.3 rulings

The system now matches **Heisty Spideys v4.3**, where every open rules question from the editorial review was resolved (see `book/REVIEW.md` §B for each ruling and its reason).

### Changed
- **Criticals lower the Alert only at Difficulty 2+.** The roll card no longer suggests −1 Alert for a Critical on a Trivial (Difficulty 1) roll.
- **Critical Vitality:** a Critical spider can't move on its own — the sheet shows its Speed as *assisted* (a crewmate brings it along at half their Speed). Hurt still halves Speed.
- **Lockdown is 7+** all the way up to the Limit (Alert 9 at an Easy location is Lockdown, not unbanded).
- **Advancement:** Absurd heists now award 6 AP; Skills and Attributes can reach 5 after creation.
- **Perks and Signature Moves** updated: Unfazed, That All You Got? (BODY + Endurance), Thunderous Entrance and Make a Scene (once per scene), Tactical Feed (free action, not an Assist), I Called It (+1 die to that roll), That's Not What Happened (also cancels the Alert rise).
- **Silk Points:** Improvise now swaps in a plausible Skill at +1 Difficulty; Damage Control works on any spike of +2 or more; a Silk Line without SP is a GRACE + Acrobatics roll (Difficulty 2).
- **Rules journals, heists and the Quick Reference** carry the v4.3 wording (recovery once per obstacle, Tinkerer patching via Field Repair, Waiting Web species swaps, creature Alert contributions, loot tiers, Heist 5 now Hard/6, and more).

### Fixed
- **Creature stats now come from the book.** The Corn Snake, Alert Parrot, The Rat (formerly "Protection Rat"), The Exterminator and Goldfish previously carried numbers the book never gave; they now match the rulebook's new official stat blocks. *Worlds that already imported these creatures keep their old copies — re-import them from the Creature Compendium.*
- Remaining v4.2 wording fixes brought into the system (Stealth-0 Botch joke, GRACE no longer "sets your Speed", "don't make you untouchable", "Engineering, Difficulty 4", Botch/Assist Quick Reference rows).

## [1.3.0] — Foundry v14 audit (verified on 14.368)

A full audit against the newest Foundry release (v14.368, "Version 14 Stable 10"), run by independent agents across the manifest, packs, templates, CSS and all JavaScript.

### Fixed
- **Compendium journals opened empty.** The Heists and Rules Reference pages were stored in the packs but never attached to their journals, so Foundry showed blank entries. Packs are now compiled with Foundry's **official `@foundryvtt/foundryvtt-cli`** (the same tool first-party systems use), and every journal carries its pages. The validator now reads a copy of each pack back through the official extractor and fails if any page is detached.
- **Roll data could wipe a spider's stats.** `getRollData()` wrote into the actor's live data (core calls it for initiative and `/r` rolls), which replaced Skills and Silk with bare numbers. Skill rolls then lost their skill dice, and the next Silk ± click saved Silk as 0. It now works on a copy; a regression test proves the actor is untouched.
- **Dark UI mode broke the sheets.** v13+ dark mode flipped core form colours under the parchment art and turned window titles plum-on-plum. All our windows (and the Alert HUD) now pin the light theme, and heading styles no longer reach the window title bar.
- **Styles no longer leak onto Foundry's own UI.** In v14, system CSS outranks all core styles, so generic rules like `.panel`, `.field`, `.tab` and `.die` could restyle core windows. Every selector is now scoped to the system's own elements.
- **Long sheets scroll instead of clipping**, and short windows no longer squash the header and tabs.
- **Rich-text editors** (`<prose-mirror>`) use the correct v14 markup, so they open as a toggleable editor linked to their document (dropped images upload properly instead of bloating the sheet).
- **Build a Spider could open twice.** The scene-control tool now uses only the v14 `onChange` callback, and a second click brings the open builder forward instead of discarding a build in progress. Pressing Enter in the builder no longer submits the form.
- **Roll visibility uses v14's message modes** (`ChatMessage.applyMode`); the deprecated roll-mode API is used only on v13.
- **Portrait editing uses Foundry's built-in image picker**, which respects permissions and v14's FilePicker options.
- **Readability:** raised contrast on gold badges, the Rattled chip, Stirring/Active Alert flashes, missed dice, and the header's stat notes.
- Heist and rules journal titles, and the Vacuum's threat level, show real punctuation (e.g. "—", "&") instead of HTML entity codes.
- Compendium documents are stamped with the v13 schema version, so exported entries import cleanly on v13 and migrate forward on v14.

### Security
- The GM-side "create a spider for a player" relay now only creates **spider** actors, owned by the requesting player alone, and ignores any folder or id the request supplies. It only acts for connected users, and a player's client only reports success when the new spider actually exists and is theirs.

### Changed
- Manifest: declares `"type": "system"`; verified on **14.368**; compendium permissions spell out every role; the default grid is square with equidistant diagonals; the unused secondary token bar is removed.
- Pack build/validate: `tools/verify-packs.mjs` removed (it modified the committed packs by opening them). Validation now never touches the committed LevelDB files.

## [1.2.0] — Multiplayer & robustness lessons

Hardening from another VTT project's field notes on the GM↔player seam.

### Fixed
- **Never claim a multiplayer action succeeded optimistically.** The builder no longer pre-guesses `ACTOR_CREATE` and routes around it (which can misdetect permitted players). It now *attempts* the direct create and only relays to the Storyteller on genuine refusal. The relay says **"pending"**, not "done", carries a request id, and warns the player if no confirmation arrives (sockets aren't delivered to offline users).
- **Secret data no longer travels to players.** The **Creature Compendium** and the **Five Ready-to-Run Heists** (which hold the "unknown obstacle" twists) are now GM-only; players can't browse the Storyteller's surprises. Player-facing content (Species, Roles, Perks, Flaws, Gadgets, Rules) stays visible.
- **Migrations are gated to the single active GM**, not any GM, so two GMs loading at once can't double-run a document-creating migration.
- **Store vs derive:** `prepareDerivedData` no longer mutates the stored `silk.value` (the +/- control clamps it on write instead).
- **AppV2 scroll chain:** added the `min-height:0` chain so fixed-height sheets scroll instead of clipping, without setting overflow/flex on the part root.

### Added
- `TESTING.md` — a two-client GM↔player smoke-test checklist to run before shipping multiplayer changes.

## [1.1.1] — One-file-per-document pack sources

### Changed
- **Compendium source is now one JSON file per document** under `packs/_source/<name>/` (e.g. `packs/_source/species/jumping-spider.json`), replacing the per-pack array files. Cleaner diffs and merges, and the layout the build/validate tooling expects. The build, validator, and CI all read the new layout; the shipped ZIP excludes the source (compiled packs only).
- Removed the runtime content auto-importer: packs always ship compiled and committed (CI enforces it), so the fallback was dead weight.

## [1.1.0] — Hardening: tests, CI, and a safer launcher

### Added
- **Unit-tested pure logic.** The dice math (Successes, result classification, Botch, Alert suggestion) and the builder point-buy math now live in a Foundry-free `module/logic/rules.mjs`, verified by `node:test` (`npm test`) without a live Foundry.
- **Validator + CI.** `npm run validate` checks manifest sanity, pack id integrity, that the compiled packs match source semantically, and that every template compiles with only registered helpers. A GitHub Actions CI workflow runs it plus the tests on every push.
- **World-migration framework.** A version-keyed, GM-only, idempotent migration runner (`module/helpers/migration.mjs`) is now in place for any future schema changes.

### Changed
- **Character Builder launcher moved off the sidebar header** (which can break Foundry v13's flex layout). It's now at the bottom of the Actors directory, plus a spider tool in the canvas toolbar (`getSceneControlButtons`, supporting both the v12 array and v13 object shapes).
- Build tooling now shares a single pack-config module, so the builder and validator can't drift.

## [1.0.2] — Movable Alert meter

### Changed
- **The Alert meter is now a plain, reliably-draggable HUD.** The ApplicationV2 frameless window wasn't honoring placement or drag, so the meter got stuck in a spot that blocked the interface. It's now a fixed-position element that **anyone** (GM or player) can drag anywhere by its title bar, and each person's placement is remembered across reloads. GM controls (±, limit, reset) are unchanged; players see it read-only. You can still hide it entirely via *Configure Settings → Show the Alert Meter*.

## [1.0.1] — Field fixes

Fixes from first live play.

### Fixed
- **Character Builder wouldn't open.** As a non-document ApplicationV2 it called `super._prepareContext()`, which doesn't exist on the base class, so the render threw silently. Guarded the super call and now build the tab state directly instead of relying on a framework method. The launcher also surfaces any error instead of failing quietly.
- **Alert meter couldn't be minimized and blocked the UI.** The whole header captured the pointer, swallowing the collapse-button click (and could break dragging). Rewrote the drag to ignore control clicks and use document listeners, moved the default position clear of the left toolbar, and the meter now remembers where you drag it.

## [1.0.0] — First Edition

The first release of the Heisty Spideys Foundry VTT system.

### Added
- **Spider character sheet** (ApplicationV2): Attributes, Skills, Speed, Silk Points, and the Vitality ladder, with click-to-roll pools and a Kit tab for Species / Role / Perks / Flaws / Gadgets.
- **Dice engine**: d6 success pools (4/5/6 = Success) with Critical, Full, Partial, Failure, and Botch resolution; automatic Vitality and Alert modifiers; themed chat cards.
- **The Alert**: shared world-tracked meter with an always-visible, draggable HUD; band thresholds (Calm → Stirring → Active → Lockdown → Full Alert) and one-click Storyteller controls, including on roll cards.
- **Character Builder**: a guided wizard with live point-buy validation, the book's random-roll tables, and one-click export to a finished spider Actor.
- **Threat sheet** for Storyteller creatures, with rollable action pools.
- **Compendiums**: 6 Species, 7 Crew Roles, 42 Perks, 10 Flaws, Silk & Gadgets, 10 Creatures, 5 ready-to-run Heists, and a Rules Reference.
- **Data models** (`TypeDataModel`) for all Actor and Item subtypes, declared via manifest `documentTypes`.
- Pack build & verify tooling (`npm run build:packs`) plus a first-launch content-import safety net.

### Compatibility
- Foundry VTT v13 (minimum) — verified on v14.
