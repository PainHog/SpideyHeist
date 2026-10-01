# Heisty Spideys — Foundry VTT System

> *A tabletop roleplaying game of eight-legged larceny. Roll a handful of d6s, count every 5 or 6 as a Success, and try not to get vacuumed.*

The official companion game system for **Heisty Spideys, First Edition** (rulebook v4.8) — built for **Foundry VTT v13 & v14** on the modern ApplicationV2 + DataModel architecture.

![Foundry v13](https://img.shields.io/badge/Foundry-v13%E2%80%93v14-36343a) ![System](https://img.shields.io/badge/type-game%20system-b8892a)

---

## What's in the box

- **Spider character sheet** — four Attributes, twelve Skills, Speed, Silk Points (starting Silk = WIT + NERVE + 1, not counting the species bonus), and the Vitality ladder. Click any Skill or Attribute to roll its pool; shift-click to skip the dialog.
- **The dice engine** — the whole engine, faithfully: pools of d6s, 5/6 = Success, with automatic handling of **Critical** (double the required Successes, Alert −1 at Difficulty 3+), **Partial** (at least half the Difficulty), **Failure**, and the **Botch** (when your pool bottoms out). Vitality penalties and the current Alert are folded in for you.
- **The Alert meter** — a shared, always-visible HUD tracking how awake the location is. The Storyteller nudges it; everyone sees it climb through Calm → Stirring → Active → Lockdown → **Full Alert**, where it locks at the Limit and brings the Lockdown penalties. Roll cards offer one-click Alert adjustments.
- **The Character Builder** — a guided, step-by-step wizard (Species → Role → Attributes → Skills → Perks → Flaw → Name) with live point-buy counters, the book's Chapter 20 random tables and quick picks (species, Role, Attribute spread, skill package, Perks, Flaw, name), and full validation. Finishes by exporting a complete, ready-to-play spider.
- **Eight compendiums, ready to run** — all 6 Species, 7 Crew Roles, 42 Perks, 10 Flaws, Silk & Gadgets, the full Creature Compendium (Human included), the five ready-to-run Heists (multi-page journals with maps, obstacle Difficulties and suggested Escapes), and a Rules Reference (with the Random Tables and the Mid-Heist Complication clock).
- **Threat sheets** for the cat, the dog, the vacuum, the curious child, the humans, and the professionally-unfortunate guard spider.

## Automation

Since 1.8.0 the system keeps the books for you, so nobody at the table has to "handle things" in the VTT. Where the rules ask for the Storyteller's judgement, you get one click with the rules-correct answer already picked.

- **The Heist Tracker** (the route icon in the token controls, the Alert meter, or `game.heistySpideys.openTracker()`): start one of the five heists (or drop a heist journal on it), step through Score → Planning → Heist → Escape → Debrief, see the current obstacle, its approaches, progress, the round, creatures, crew, loot and the heist's own tables. **Call for roll**, **Group check**, **End round** and **Next obstacle** are one click each. Players can open their own view.
- **The Alert moves itself** from the roll cards: one event raises it once, by its biggest trigger; creatures add their +X at the end of each round; spikes, Full Alert and band changes come with a prompt. Reactions (That's Not What Happened, Damage Control, a Reroll…) undo exactly what they should.
- **Silk is spent for you** (Silk dice, Rerolls, Clutches, Improvise, reactions), and the buttons for each person appear on the cards they can act on.
- **Hits, shrug-offs, Vitality, Out and the Waiting Web** run from attack cards; the replacement arrives at the next obstacle.
- **Abilities** have Use buttons and track once-per-scene/heist uses; Flaws have Fire and Delay; the Debrief awards AP and the Advance window spends it.

**Everything can be switched off.** *Game Settings → Configure Settings → Heisty Spideys* has a setting for each automation (Alert: Automatic / Propose / Manual; Silk; hits; shrug-offs; creatures; the clock; the stall; recovery; the Waiting Web; capture; Flaws; heist procedures; ending the round; who rolls forced rolls; the players' tracker; movement warnings). With them all off the system behaves like 1.7.0 with the tracker as a checklist.

Players' actions that touch something they don't own (the Alert, the heist, a crewmate) are carried out by the Storyteller's client, so **keep the Storyteller connected** during play; a roll made while no Storyteller is online is caught up when they log in. The design is in [`docs/AUTOMATION-DESIGN.md`](docs/AUTOMATION-DESIGN.md).

## Installation

**From a manifest URL:** in Foundry, *Game Systems → Install System*, paste this manifest URL, and click *Install*:

```
https://github.com/PainHog/SpideyHeist/releases/latest/download/system.json
```

**Manual:** copy this folder into your Foundry `Data/systems/` directory as `heisty-spideys/`, then create a world using the *Heisty Spideys* system.

## Playing

- **Build a spider:** click **🕷 Build a Spider** at the bottom of the **Actors** sidebar, or the **spider tool** in the canvas toolbar, or run the macro `game.heistySpideys.openBuilder()`. Walk the steps; the builder won't let you finish an illegal build. Hit **Create Spider** and the finished sheet opens.
  - *Players and permissions:* Foundry doesn't grant players the "Create New Actors" permission by default. This system handles that automatically — when a player finishes the builder, the request is passed to the **online Storyteller (GM)**, who creates the spider and hands ownership back to the player (no action needed on the GM's part). If you'd rather let players create actors directly, turn on **Game Settings → Configure Permissions → Create New Actors** for the Player role. Either way works; if no GM is online, the player is told to try again when one is.
- **Roll:** on the sheet, click a Skill name (Attribute + Skill) or an Attribute's die. Set the Difficulty (Successes needed) — or pick the creature opposing you, which rolls first and sets it — plus bonus dice (capped at +2), Silk dice and penalty dice; Vitality and the Alert are applied automatically. Results post a themed card to chat.
- **Run the Alert:** it moves by itself from the roll cards (see *Automation*); as Storyteller you can still nudge it on the floating **Alert** meter (drag it anywhere). In the *Manual* Alert setting, roll cards show the ±1/±2 buttons instead. Set the location's Alert **Limit** to pick its difficulty (Easy 10 · Standard 8 · Hard 6 · Absurd 4 · Legendary 2).
- **Threats:** drag any creature from the *Creature Compendium* onto a scene. Its sheet lists action pools — click to roll them against the crew; a spider acting against it needs its Successes + 1. As Storyteller, target spider tokens first and the click is an attack on them (an attack card with its shrug-off). Humans are the exception: they never roll to spot you, so set the Difficulty from their Chapter 15 row (the Human's Swat 3 is for its hits).

## Developing / building

The compendiums ship pre-compiled. Source is **one JSON file per document** under `packs/_source/<name>/` (e.g. `packs/_source/species/jumping-spider.json`). Edit or add a file, then rebuild the LevelDB packs and validate:

```bash
npm install          # dev deps: @foundryvtt/foundryvtt-cli, handlebars
npm run build:packs  # packs/_source/<name>/*.json  ->  packs/<name>/  (LevelDB, via the official foundryvtt-cli) — commit the result
npm run validate     # manifest, pack integrity (incl. journal pages attached), compiled-matches-source, templates
npm test             # unit tests (node:test), the cross-package contracts test, and the integration smoke test
npm run check        # validate + test (run before every commit)
```

Deterministic 16-character ids are derived from each document's `key`, so rebuilds are stable, and the build fails loudly on any id collision. **Always rebuild and commit `packs/<name>/` after editing source** — the system ships as a ZIP with no build step on the user's server, and CI (`.github/workflows/ci.yml`) fails if the committed packs don't match source. The pure engine/build math lives in `module/logic/rules.mjs` (Foundry-free, unit-tested). Before shipping anything that touches the GM↔player seam, run the two-client smoke test in [`TESTING.md`](TESTING.md).

### Project layout

```
system.json              Manifest (documentTypes + packs, v13 minimum, verified 14.368)
module/                  ES modules
  heisty-spideys.mjs     Entry point (init/ready hooks, registration)
  config.mjs             Game data tables (attributes, skills, alert, silk…)
  data/                  TypeDataModel schemas (actors, items)
  documents/             Actor & Item document classes
  sheets/                ApplicationV2 sheets (spider, threat, item)
  apps/                  The Character Builder, Heist Tracker, Advance and Waiting Web windows
  helpers/               Dice engine, Alert HUD, GM socket relay, migrations
  logic/                 Pure rules (Foundry-free, unit-tested): rolls, hits, Alert ledger, heist flow, creatures…
  runtime/               Spider operations and ability buttons
  chat/                  Roll-card buttons, reactions and hits
  heist/                 Heist store, automation hooks, settings, Waiting Web, tokens
  net/                   GM operations (User#query, socket fallback)
  contracts.mjs          Names shared by every package (ops, cards, settings, hooks)
templates/               Handlebars templates
styles/                  Theme
assets/icons/            Wax-seal SVG icon set
assets/maps/             The five heist maps (from the rulebook art)
packs/_source/<name>/    Human-readable compendium source (one JSON per document)
packs/<name>/            Compiled LevelDB compendiums
tools/                   Pack build, validate & shared config; fake-foundry.mjs (test support)
test/                    node:test unit tests, the contracts test, and an end-to-end smoke test on a fake Foundry
```

## Compatibility

Built for **Foundry VTT v13 (minimum)** and **verified on v14 (14.368)**, using ApplicationV2 sheets, `TypeDataModel` schemas, and manifest `documentTypes` — no deprecated ApplicationV1 code. If your group runs a different generation, adjust `compatibility` in `system.json`.

## License

The **code** and this system's structure are covered by `LICENSE`. The **Heisty Spideys game content** (rules text, the five heists, creatures, and all writing reproduced in the compendiums) is © its author and is **not** open-licensed — review and set the license that fits your release (e.g. for sale on DriveThruRPG) before distributing.
