# Changelog

All notable changes to the Heisty Spideys system are recorded here.

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
