# Heisty Spideys — Foundry VTT System

> *A tabletop roleplaying game of eight-legged larceny. Roll a handful of d6s, count every 4, 5, or 6 as a Success, and try not to get vacuumed.*

The official companion game system for **Heisty Spideys, First Edition** — built for **Foundry VTT v13 & v14** on the modern ApplicationV2 + DataModel architecture.

![Foundry v13](https://img.shields.io/badge/Foundry-v13%E2%80%93v14-5f2470) ![System](https://img.shields.io/badge/type-game%20system-b8892a)

---

## What's in the box

- **Spider character sheet** — four Attributes, twelve Skills, Speed, Silk Points, and the Vitality ladder. Click any Skill or Attribute to roll its pool; shift-click to skip the dialog.
- **The dice engine** — the whole engine, faithfully: pools of d6s, 4/5/6 = Success, with automatic handling of **Critical** (double the required Successes, Alert −1), **Partial**, **Failure**, and the **Botch** (when your pool bottoms out). Vitality penalties and the current Alert are folded in for you.
- **The Alert meter** — a shared, always-visible HUD tracking how awake the location is. The Storyteller nudges it; everyone sees it climb through Calm → Stirring → Active → Lockdown → **Full Alert**. Roll cards offer one-click Alert adjustments.
- **The Character Builder** — a guided, step-by-step wizard (Species → Role → Attributes → Skills → Perks → Flaw → Name) with live point-buy counters, the book's random-roll tables, and full validation. Finishes by exporting a complete, ready-to-play spider.
- **Eight compendiums, ready to run** — all 6 Species, 7 Crew Roles, 42 Perks, 10 Flaws, Silk & Gadgets, the full Creature Compendium, the five ready-to-run Heists (as multi-page journals), and a Rules Reference.
- **Threat sheets** for the cat, the dog, the vacuum, the curious child, and the professionally-unfortunate guard spider.

## Installation

**From a manifest URL** (once released): in Foundry, *Game Systems → Install System*, and paste the `system.json` manifest URL.

**Manual:** copy this folder into your Foundry `Data/systems/` directory as `heisty-spideys/`, then create a world using the *Heisty Spideys* system.

## Playing

- **Build a spider:** open the **Actors** sidebar and click **🕷 Build a Spider**, or run the macro `game.heistySpideys.openBuilder()`. Walk the steps; the builder won't let you finish an illegal build. Hit **Create Spider** and the finished sheet opens.
  - *Players and permissions:* Foundry doesn't grant players the "Create New Actors" permission by default. This system handles that automatically — when a player finishes the builder, the request is passed to the **online Storyteller (GM)**, who creates the spider and hands ownership back to the player (no action needed on the GM's part). If you'd rather let players create actors directly, turn on **Game Settings → Configure Permissions → Create New Actors** for the Player role. Either way works; if no GM is online, the player is told to try again when one is.
- **Roll:** on the sheet, click a Skill name (Attribute + Skill) or an Attribute's die. Set the Difficulty (Successes needed) and any bonus/penalty dice; Vitality and the Alert are applied automatically. Results post a themed card to chat.
- **Run the Alert:** as Storyteller, use the floating **Alert** meter (drag it anywhere) or the ±1/±2 buttons on any roll card. Set the location's Alert **Limit** to pick its difficulty (Easy 10 · Standard 8 · Hard 6 · Absurd 4 · Legendary 2).
- **Threats:** drag any creature from the *Creature Compendium* onto a scene. Its sheet lists action pools — click to roll them against the crew.

## Developing / building

The compendiums ship pre-compiled. To edit content, change the source JSON in `src/packs/` and rebuild the LevelDB packs:

```bash
npm install          # installs classic-level (dev dependency)
npm run build:packs  # src/packs/*.json  ->  packs/*  (LevelDB)
```

Deterministic 16-character ids are derived from each entry's `key`, so rebuilds are stable. If a pack ever ships empty, the system auto-imports the bundled source on first load (GM only); you can also force it from the console with `game.heistySpideys.importContent(true)`.

### Project layout

```
system.json              Manifest (documentTypes + packs, v13/v14)
module/                  ES modules
  heisty-spideys.mjs     Entry point (init/ready hooks, registration)
  config.mjs             Game data tables (attributes, skills, alert, silk…)
  data/                  TypeDataModel schemas (actors, items)
  documents/             Actor & Item document classes
  sheets/                ApplicationV2 sheets (spider, threat, item)
  apps/                  The Character Builder
  helpers/               Dice engine, Alert HUD, content importer
templates/               Handlebars templates
styles/                  Theme
assets/icons/            Wax-seal SVG icon set
src/packs/               Human-readable compendium source
packs/                   Compiled LevelDB compendiums
tools/                   Pack build & verify scripts
```

## Compatibility

Built for **Foundry VTT v13 (minimum)** and **verified on v14**, using ApplicationV2 sheets, `TypeDataModel` schemas, and manifest `documentTypes` — no deprecated ApplicationV1 code. If your group runs a different generation, adjust `compatibility` in `system.json`.

## License

The **code** and this system's structure are covered by `LICENSE`. The **Heisty Spideys game content** (rules text, the five heists, creatures, and all writing reproduced in the compendiums) is © its author and is **not** open-licensed — review and set the license that fits your release (e.g. for sale on DriveThruRPG) before distributing.
