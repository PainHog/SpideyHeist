# Changelog

All notable changes to the Heisty Spideys system are recorded here.

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
