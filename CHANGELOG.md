# Changelog

All notable changes to the Heisty Spideys system are recorded here.

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
